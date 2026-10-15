import { type Application, Container, Graphics, Text, type Ticker } from 'pixi.js';
import { DEFAULT_SCENE_THEME, type SceneTheme } from '@codequest/content-schema';
import type { RunOutcome } from '@codequest/engine';
import {
  gridPoint,
  HEADING_DEGREES,
  segmentKey,
  targetSegments,
  type TurtleConfig,
  type TurtleEvent,
  type TurtlePoint,
} from '@codequest/games';
import { vi } from '../../i18n/vi';
import { UI_COLORS } from '../../ui/tokens';
import type { PandaTextures } from '../assets';
import { reducedMotion } from '../motion';
import type { PandaAnimation } from '../panda';
import { createPanda, type Panda } from '../pandaSprite';
import { isAborted, type PandaAnimationListener, type StageRenderer, tween } from '../types';
import {
  computeTurtleLayout,
  dashes,
  facingOf,
  gridDots,
  headingAngle,
  linesLeft,
  segmentPixels,
  toPixel,
  type TurtleLayout,
} from './layout';

/** Durations at speed 1, in ms. */
const MS = {
  step: 360,
  turnBase: 180,
  turnPerStep: 70,
  pen: 260,
  lunge: 200,
  recoil: 260,
  daze: 600,
  dizzy: 1500,
} as const;

const C = UI_COLORS;
/** Ink of drawn lines, the faint dashed target, the stray line. */
const INK = C.ink;
const TARGET = C.brand;
const STRAY = C.oops;
/** How far Măng leans into a stray line or the paper edge before stopping, in unit steps. */
const LUNGE = 0.35;
/** Hard drop shadow under the paper (art-direction.md §4: hard shadows, no blur). */
const PAPER_SHADOW = 6;
const HUD_FONT = { fontFamily: 'VT323', fontSize: 26, fill: C.ink } as const;
const CHIP_HEIGHT = 32;
const CHIP_PAD = 10;
/** Width of one VT323 glyph at the HUD size, where text cannot be measured (Node tests). */
const GLYPH_PX = 11;

interface Pose {
  /** Where the brush tip is, in px (fractional while moving). */
  point: { x: number; y: number };
  /** Heading in 30° steps (fractional while turning). */
  heading: number;
  facing: number;
  /** Brush lifted (0 = on the paper … 1 = up). */
  lift: number;
}

function canDrawText(): boolean {
  return typeof document !== 'undefined';
}

/**
 * Turtle stage (ADR-0024 §9): dotted paper, the target as faint dashes, drawn lines in ink, and
 * Măng with her brush replaying move / line / turn / pen / extraLine / offPaper events. Her
 * frames are side views, so she flips left / right and an arrow from the brush tip shows the
 * exact heading (12 directions).
 */
export class TurtleStage implements StageRenderer<TurtleEvent> {
  private readonly world = new Container();
  private readonly paper = new Graphics();
  private readonly guide = new Graphics();
  private readonly ink = new Graphics();
  /** The line being drawn right now (grows with the step) and the stray line. */
  private readonly wet = new Graphics();
  private readonly stray = new Graphics();
  private readonly brush = new Graphics();
  private readonly panda: Panda;
  private readonly hud = new Container();
  private readonly chip = new Graphics();
  private readonly chipText: Text | null;
  private readonly theme: SceneTheme;
  private readonly target: ReadonlySet<string> | null;
  private readonly start: TurtlePoint;
  private layout: TurtleLayout;
  private pose: Pose;
  private at: TurtlePoint;
  private heading: number;
  private penDown: boolean;
  private drawn = new Set<string>();
  /** Partial line of the current step, from → px. */
  private wetLine: { from: TurtlePoint; to: { x: number; y: number } } | null = null;
  private strayKey: string | null = null;
  private offPaper = false;
  private shake = 0;
  private stunned = false;
  private spin = 0;
  private clock = 0;
  private destroyed = false;

  constructor(
    private readonly app: Application,
    private readonly config: TurtleConfig,
    pandaTextures: PandaTextures,
    private readonly onAnimation?: PandaAnimationListener,
    theme?: SceneTheme,
  ) {
    this.theme = theme ?? DEFAULT_SCENE_THEME;
    app.canvas.dataset.theme = this.theme;
    this.target = targetSegments(config);
    this.start = gridPoint(config.start.x, config.start.y);
    this.at = this.start;
    this.heading = config.start.heading / HEADING_DEGREES;
    this.penDown = config.penDown ?? true;
    this.layout = computeTurtleLayout(
      config.size,
      app.screen.width,
      app.screen.height,
      this.target !== null,
    );
    this.pose = this.startPose();
    this.panda = createPanda(pandaTextures);
    this.chipText =
      this.target !== null && canDrawText() ? new Text({ text: '', style: HUD_FONT }) : null;
    this.hud.addChild(this.chip);
    if (this.chipText) this.hud.addChild(this.chipText);
    this.world.addChild(
      this.paper,
      this.guide,
      this.ink,
      this.wet,
      this.stray,
      this.panda.sprite,
      this.brush,
    );
    app.stage.addChild(this.world, this.hud);
    this.drawPaper();
    this.reset();
    app.ticker.add(this.onTick);
  }

  reset(): void {
    this.at = this.start;
    this.heading = this.config.start.heading / HEADING_DEGREES;
    this.penDown = this.config.penDown ?? true;
    this.drawn = new Set();
    this.wetLine = null;
    this.strayKey = null;
    this.offPaper = false;
    this.shake = 0;
    this.stunned = false;
    this.spin = 0;
    this.pose = this.startPose();
    this.app.canvas.dataset.dizzy = 'false';
    this.world.position.set(0, 0);
    this.stray.alpha = 1;
    this.drawPaper();
    this.drawInk();
    // Làm lại after a crash or mid-step: no red line, no half-drawn line may stay.
    this.drawWet();
    this.drawStray(1);
    this.updateHud();
    this.setAnimation('idle');
    this.syncState();
  }

  rest(): void {
    if (this.stunned || this.destroyed) return;
    if (this.panda.animation !== 'idle' || !this.panda.sprite.playing) this.setAnimation('idle');
  }

  hold(): void {
    this.panda.sprite.stop();
  }

  finish(outcome: RunOutcome<TurtleEvent>): void {
    if (this.destroyed) return;
    if (outcome.result === 'success') this.setAnimation('cheer');
    this.syncState();
  }

  /** TIMEOUT: Măng spins round twice, then stays dazed until reset (like the maze). */
  async dizzy(signal: AbortSignal): Promise<void> {
    if (this.destroyed) return;
    this.app.canvas.dataset.dizzy = 'true';
    this.stunned = true;
    this.setAnimation('jump');
    const spins = reducedMotion() ? 0 : 2;
    await tween(this.app.ticker, MS.dizzy, signal, (t) => {
      this.spin = (1 - (1 - t) * (1 - t)) * spins * 2 * Math.PI;
    });
    if (this.stopped(signal)) return;
    this.spin = 0;
    this.setAnimation('crouch');
  }

  estimate(event: TurtleEvent): number {
    switch (event.type) {
      case 'move':
      case 'line':
        return MS.step;
      case 'turn':
        return MS.turnBase + MS.turnPerStep * (event.deg / HEADING_DEGREES);
      case 'pen':
        return MS.pen;
      case 'extraLine':
      case 'offPaper':
        return MS.lunge + MS.recoil + MS.daze;
    }
  }

  async play(event: TurtleEvent, signal: AbortSignal): Promise<void> {
    if (this.destroyed) return;
    const ticker = this.app.ticker;
    switch (event.type) {
      case 'move':
      case 'line': {
        const from = toPixel(this.layout, event.from);
        const to = toPixel(this.layout, event.to);
        this.setAnimation('walk');
        await tween(ticker, MS.step, signal, (t) => {
          const point = { x: from.x + t * (to.x - from.x), y: from.y + t * (to.y - from.y) };
          this.pose.point = point;
          if (event.type === 'line') {
            this.wetLine = { from: event.from, to: point };
            this.drawWet();
          }
        });
        if (this.stopped(signal)) return;
        this.wetLine = null;
        this.at = event.to;
        this.pose.point = to;
        if (event.type === 'line') this.drawn.add(segmentKey(event.from, event.to));
        this.drawInk();
        this.updateHud();
        this.syncState();
        return;
      }
      case 'turn': {
        const steps = event.deg / HEADING_DEGREES;
        const from = this.pose.heading;
        const delta = event.side === 'LEFT' ? steps : -steps;
        this.setAnimation('idle');
        await tween(ticker, MS.turnBase + MS.turnPerStep * steps, signal, (t) => {
          const ease = t * t * (3 - 2 * t);
          this.pose.heading = from + delta * ease;
        });
        if (this.stopped(signal)) return;
        this.heading = event.to;
        this.pose.heading = event.to;
        this.pose.facing = facingOf(event.to, this.pose.facing);
        this.syncState();
        return;
      }
      case 'pen': {
        const from = this.pose.lift;
        const to = event.down ? 0 : 1;
        this.setAnimation(event.down ? 'crouch' : 'jump');
        await tween(ticker, MS.pen, signal, (t) => {
          this.pose.lift = from + (to - from) * t;
        });
        if (this.stopped(signal)) return;
        this.penDown = event.down;
        this.pose.lift = to;
        this.setAnimation('idle');
        this.syncState();
        return;
      }
      case 'extraLine':
      case 'offPaper': {
        const from = toPixel(this.layout, event.from);
        const to = toPixel(this.layout, event.to);
        const lean = (t: number) => ({
          x: from.x + (to.x - from.x) * LUNGE * t,
          y: from.y + (to.y - from.y) * LUNGE * t,
        });
        this.setAnimation('walk');
        if (event.type === 'extraLine') this.strayKey = segmentKey(event.from, event.to);
        await tween(ticker, MS.lunge, signal, (t) => {
          this.pose.point = lean(t * t);
          if (event.type === 'extraLine') this.drawStray(t);
        });
        if (this.stopped(signal)) return;
        if (event.type === 'offPaper') this.offPaper = true;
        if (!reducedMotion()) this.shake = 1;
        this.drawPaper();
        this.drawStray(1);
        this.setAnimation('jump');
        await tween(ticker, MS.recoil, signal, (t) => {
          this.pose.point = lean(1 - t);
        });
        if (this.stopped(signal)) return;
        this.pose.point = from;
        this.stunned = true;
        this.setAnimation('crouch');
        this.syncState();
        await tween(ticker, MS.daze, signal);
        return;
      }
    }
  }

  resize(width: number, height: number): void {
    if (this.destroyed) return;
    this.layout = computeTurtleLayout(this.config.size, width, height, this.target !== null);
    this.pose.point = toPixel(this.layout, this.at);
    this.drawPaper();
    this.drawInk();
    this.drawStray(1);
    this.updateHud();
  }

  destroy(): void {
    this.destroyed = true;
    this.app.ticker.remove(this.onTick);
  }

  private stopped(signal: AbortSignal): boolean {
    return isAborted(signal) || this.destroyed;
  }

  private startPose(): Pose {
    return {
      point: toPixel(this.layout, this.start),
      heading: this.heading,
      facing: facingOf(this.heading, 1),
      lift: this.penDown ? 0 : 1,
    };
  }

  private setAnimation(animation: PandaAnimation): void {
    this.panda.play(animation);
    this.onAnimation?.(animation);
  }

  /** Paper, dots and the dashed target; the edge turns red after OFF_PAPER. */
  private drawPaper(): void {
    const { paper, unitPx } = this.layout;
    const g = this.paper.clear();
    g.roundRect(paper.x + PAPER_SHADOW, paper.y + PAPER_SHADOW, paper.width, paper.height, 10).fill(
      { color: C.ink },
    );
    g.roundRect(paper.x, paper.y, paper.width, paper.height, 10)
      .fill({ color: C.paper })
      .stroke({ color: this.offPaper ? STRAY : C.ink, width: this.offPaper ? 5 : 3 });
    const dot = Math.max(1.5, unitPx * 0.05);
    for (const point of gridDots(this.config)) {
      const { x, y } = toPixel(this.layout, point);
      g.circle(x, y, dot).fill({ color: C.inkSoft, alpha: 0.45 });
    }
    const guide = this.guide.clear();
    const width = Math.max(2, unitPx * 0.09);
    for (const key of this.target ?? []) {
      const [p, q] = segmentPixels(this.layout, key);
      for (const [a, b] of dashes(p, q, unitPx * 0.16, unitPx * 0.12)) {
        guide.moveTo(a.x, a.y).lineTo(b.x, b.y);
      }
    }
    guide.stroke({ color: TARGET, width, alpha: 0.55, cap: 'round' });
  }

  private lineWidth(): number {
    return Math.max(3, this.layout.unitPx * 0.12);
  }

  private drawInk(): void {
    const g = this.ink.clear();
    if (this.drawn.size === 0) return;
    for (const key of this.drawn) {
      const [p, q] = segmentPixels(this.layout, key);
      g.moveTo(p.x, p.y).lineTo(q.x, q.y);
    }
    g.stroke({ color: INK, width: this.lineWidth(), cap: 'round', join: 'round' });
  }

  private drawWet(): void {
    const g = this.wet.clear();
    // e2e / tests: whether a growing line is on the paper.
    this.app.canvas.dataset.turtleWet = String(this.wetLine !== null);
    if (this.wetLine === null) return;
    const from = toPixel(this.layout, this.wetLine.from);
    g.moveTo(from.x, from.y)
      .lineTo(this.wetLine.to.x, this.wetLine.to.y)
      .stroke({ color: INK, width: this.lineWidth(), cap: 'round' });
  }

  /** The stray line in red, `t` (0…1) of it while Măng leans into it. */
  private drawStray(t: number): void {
    const g = this.stray.clear();
    // e2e / tests: whether the red stray line is on the paper.
    this.app.canvas.dataset.turtleRed = String(this.strayKey !== null);
    if (this.strayKey === null) return;
    const [p, q] = segmentPixels(this.layout, this.strayKey);
    const start = toPixel(this.layout, this.at);
    // Draw from where Măng stands, whichever end of the key that is.
    const [a, b] =
      Math.hypot(p.x - start.x, p.y - start.y) < Math.hypot(q.x - start.x, q.y - start.y)
        ? [p, q]
        : [q, p];
    g.moveTo(a.x, a.y)
      .lineTo(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)
      .stroke({ color: STRAY, width: this.lineWidth() * 1.6, cap: 'round' });
  }

  private updateHud(): void {
    const g = this.chip.clear();
    if (this.target === null) return;
    const left = linesLeft(this.target, this.drawn);
    const text = vi.play.turtle.linesLeft(left);
    // e2e: what the chip says.
    this.app.canvas.dataset.turtleHud = text;
    if (this.chipText) {
      this.chipText.text = text;
      this.chipText.anchor.set(0, 0.5);
      this.chipText.position.set(12 + CHIP_PAD, 8 + CHIP_HEIGHT / 2);
    }
    // Node tests draw no text: estimate the chip from the glyph count there.
    const width = (this.chipText?.width ?? text.length * GLYPH_PX) + 2 * CHIP_PAD;
    g.roundRect(15, 11, width, CHIP_HEIGHT, 10)
      .fill({ color: C.ink })
      .roundRect(12, 8, width, CHIP_HEIGHT, 10)
      .fill({ color: left === 0 ? C.coinShine : C.paper })
      .stroke({ color: C.ink, width: 3 });
  }

  /** What the stage shows, as data attributes on the canvas (e2e). */
  private syncState(): void {
    const data = this.app.canvas.dataset;
    data.turtleDrawn = String(this.drawn.size);
    data.turtleLeft = this.target === null ? '' : String(linesLeft(this.target, this.drawn));
    data.turtleStray = this.strayKey ?? '';
    data.turtleOffPaper = String(this.offPaper);
    data.turtlePen = this.penDown ? 'down' : 'up';
    data.turtleHeading = String(this.heading);
    data.turtleStunned = String(this.stunned);
  }

  /** Brush tip and heading arrow. */
  private drawBrush(x: number, y: number): void {
    const g = this.brush.clear();
    // After a crash the arrow would cover the red line Măng stopped at: only the tip stays.
    if (this.strayKey === null && !this.offPaper) this.drawArrow(g, x, y);
    this.drawTip(g, x, y);
  }

  /** The heading arrow from the brush tip (12 directions). */
  private drawArrow(g: Graphics, x: number, y: number): void {
    const { unitPx } = this.layout;
    const angle = headingAngle(this.pose.heading);
    const reach = Math.max(18, unitPx * 0.55);
    const tipX = x + Math.cos(angle) * reach;
    const tipY = y + Math.sin(angle) * reach;
    const head = Math.max(7, unitPx * 0.16);
    const back = angle + Math.PI;
    g.moveTo(x, y)
      .lineTo(tipX, tipY)
      .stroke({ color: C.brandDeep, width: Math.max(3, unitPx * 0.06), cap: 'round' });
    g.poly([
      tipX + Math.cos(angle) * head,
      tipY + Math.sin(angle) * head,
      tipX + Math.cos(back + 0.6) * head,
      tipY + Math.sin(back + 0.6) * head,
      tipX + Math.cos(back - 0.6) * head,
      tipY + Math.sin(back - 0.6) * head,
    ])
      .fill({ color: C.brandDeep })
      .stroke({ color: C.ink, width: 2 });
  }

  /** Pen down: an ink dot on the paper; pen up: a white ring raised over its shadow. */
  private drawTip(g: Graphics, x: number, y: number): void {
    const { unitPx } = this.layout;
    const r = Math.max(5, unitPx * 0.12);
    const lift = this.pose.lift * r * 1.4;
    if (this.pose.lift > 0.01) {
      // Shadow on the paper below a raised brush.
      g.circle(x, y, r * 0.7).fill({ color: C.ink, alpha: 0.18 });
    }
    g.circle(x, y - lift, r);
    if (this.pose.lift < 0.5) g.fill({ color: INK }).stroke({ color: C.white, width: 2 });
    else g.fill({ color: C.white }).stroke({ color: INK, width: 3 });
  }

  private readonly onTick = (ticker: Ticker): void => {
    const dt = ticker.deltaMS;
    this.clock += dt;
    this.panda.update(ticker);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt / 300);
    const jolt = this.shake > 0 ? Math.sin(this.clock / 22) * 5 * this.shake : 0;
    this.world.position.set(jolt, 0);
    if (this.strayKey !== null && !reducedMotion()) {
      this.stray.alpha = 0.8 + 0.2 * Math.sin(this.clock / 120);
    } else this.stray.alpha = 1;

    const { x, y } = this.pose.point;
    const sprite = this.panda.sprite;
    // Măng stands just behind her brush (away from the heading), feet a little below the tip.
    const behind = headingAngle(this.pose.heading) + Math.PI;
    const offset = Math.max(10, this.layout.unitPx * 0.28);
    sprite.position.set(x + Math.cos(behind) * offset, y + Math.sin(behind) * offset * 0.4 + 6);
    const turn = Math.cos(this.spin);
    const spinX = Math.abs(turn) < 0.08 ? Math.sign(turn || 1) * 0.08 : turn;
    const facing = facingOf(Math.round(this.pose.heading), this.pose.facing);
    this.pose.facing = facing;
    sprite.scale.set(this.layout.pandaScale * facing * spinX, this.layout.pandaScale);
    // Dazed after a crash: see-through, so the red line or paper edge under her stays visible.
    sprite.alpha = this.stunned ? 0.55 : 1;
    this.drawBrush(x, y);
  };
}
