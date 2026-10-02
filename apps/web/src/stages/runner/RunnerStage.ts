import {
  type AnimatedSprite,
  type Application,
  Container,
  Graphics,
  type Sprite,
  type Ticker,
} from 'pixi.js';
import type { RunnerCell, RunnerConfig, RunnerEvent } from '@codequest/games';
import { UI_COLORS } from '../../ui/tokens';
import type { PandaTextures, TileTextures } from '../assets';
import { shade } from '../colors';
import type { PandaAnimation } from '../panda';
import { createPanda, type Panda } from '../pandaSprite';
import { createFlag, tileSprite } from '../tiles';
import { reducedMotion } from '../motion';
import { isAborted, type PandaAnimationListener, type StageRenderer, tween } from '../types';
import { CELL_TILES, cameraX, cellCenterX, computeRunnerLayout, type RunnerLayout } from './layout';
import { drawClouds, drawFarBamboo, drawHills, drawSky, PARALLAX } from './scenery';

/** Durations at speed 1, in ms. */
const MS = {
  walk: 520,
  crouchWalk: 620,
  crouch: 90,
  jump: 640,
  land: 90,
  fall: 750,
  offTrackFall: 650,
  cheer: 1100,
  shake: 260,
  kickWindUp: 140,
  kick: 360,
  topple: 520,
  collect: 480,
  bumpApproach: 220,
  bumpRecoil: 340,
  stun: 520,
  missedPan: 420,
  missedBlink: 1300,
} as const;

/** Margin ground outside the track: darker, desaturated dirt (the lavender-grey ground token). */
const MARGIN_TINT = shade(UI_COLORS.ground, 0.66);
/** Every odd track cell is drawn a shade darker. */
const ODD_CELL_TINT = shade(UI_COLORS.white, 0.86);
/** Măng's flash when she bumps into something: the `oops` token, lightened to a pink. */
const BUMP_TINT = shade(UI_COLORS.oops, 1.3);
const NO_TINT = UI_COLORS.white;

/** Jump arc height and cheer hop height, in cells. */
const JUMP_HEIGHT = 0.85;
const CHEER_HOP = 0.22;
/** How far into the next cell Măng gets before she touches an obstacle, in cells. */
const CONTACT = 0.45;
/** Vertical squash of the crouch frame while ducking, so she clearly fits under a branch. */
const DUCK_SQUASH = 0.7;
/** Bottom of a low branch's leaves, as a share of Măng's standing height above her feet. */
const BRANCH_CLEARANCE = 0.74;
/** Visible height of the idle frames in the 280 px frame box (panda.json: 217 / 219 px). */
const PANDA_IDLE_PX = 217;

/** The stalk a low branch grows from: the near-grove greens, a little stronger. */
const STALK = {
  stalk: shade(UI_COLORS.go, 1.15),
  shade: shade(UI_COLORS.go, 0.95),
  node: shade(UI_COLORS.go, 0.88),
} as const;

const SPARKLE_COLORS = [UI_COLORS.coin, UI_COLORS.coinShine, UI_COLORS.white] as const;
const CONFETTI_COLORS = [UI_COLORS.coin, UI_COLORS.hint, UI_COLORS.go, UI_COLORS.white] as const;

interface PandaPose {
  /** Position along the track, in cells (fractional while moving). */
  cell: number;
  /** Height above the ground, in cells. */
  lift: number;
  /** Depth below the ground line, in cells (falling), so a resize mid-fall stays right. */
  sink: number;
  /** Vertical scale factor (1 = normal; < 1 while ducking). */
  squash: number;
  /** 0…1: how red Măng flashes after a bump. */
  flash: number;
}

/** A short-lived pixel particle (sparkle, confetti, dust), in world px. */
interface Particle {
  view: Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Gravity in px / s². */
  gravity: number;
  age: number;
  life: number;
}

/** Top of a bamboo shoot standing on its cell. */
const layoutShootY = (layout: RunnerLayout): number => layout.feetY - layout.tilePx;

const restingPose = (cell: number): PandaPose => ({ cell, lift: 0, sink: 0, squash: 1, flash: 0 });

/**
 * Runner stage (game-kind-sdk.md §1.1): a parallax bamboo valley, a ground strip with holes,
 * low branches, crates, bamboo shoots and the flag, and Măng acting out every runner event.
 * Positions are kept in cells and turned into pixels every frame, so a resize in the middle of
 * a move stays correct. Every motion is a `tween` on the stage clock, so it stops on abort.
 */
export class RunnerStage implements StageRenderer<RunnerEvent> {
  private readonly sky = new Container();
  private readonly clouds = new Container();
  private readonly far = new Container();
  private readonly hills = new Container();
  private readonly world = new Container();
  /** Bamboo stalks of the low branches, behind everything on the track. */
  private readonly stalks = new Container();
  private readonly terrain = new Container();
  /** Pits are drawn behind Măng; while she falls she moves behind the ground tiles too. */
  private readonly pits = new Graphics();
  private readonly behindGround = new Container();
  private readonly items = new Container();
  private readonly inFront = new Container();
  /** Branch leaves hang in front of Măng, so ducking under them reads at a glance. */
  private readonly front = new Container();
  private readonly fx = new Container();
  private readonly panda: Panda;
  private flag: AnimatedSprite | null = null;
  private layout: RunnerLayout;
  private pose: PandaPose;
  /** World shake left (1 → 0) after a fall or bump. */
  private shake = 0;
  /** The camera looks at this cell instead of Măng (missed shoots), when set. */
  private focus: { cell: number; mix: number } | null = null;
  /** Măng is seeing stars after a bump (until reset). */
  private stunned = 0;
  private readonly stars = new Graphics();
  private readonly particles: Particle[] = [];
  /** Per-cell sprites, rebuilt with the layout; their state survives a resize. */
  private crates = new Map<number, Container>();
  private bamboo = new Map<number, Sprite>();
  private branches = new Map<number, Container>();
  private rings = new Map<number, Graphics>();
  /**
   * Prop animation state by cell, applied to whatever sprites the current layout has every frame
   * (a resize mid-move rebuilds the sprites; tweens never hold on to one): how far a kicked crate
   * has toppled and a picked-up shoot has risen (0…1, 1 = gone), and the obstacle that wobbles.
   */
  private readonly tip = new Map<number, number>();
  private readonly rise = new Map<number, number>();
  private wobble: { cell: number; dx: number } | null = null;
  /** Shoots left behind at the flag (they keep a ring until reset). */
  private readonly missed = new Set<number>();
  /** Reduced motion (system or profile), re-read every frame. */
  private calm = reducedMotion();
  /** Set by destroy(): a replay still awaiting a tween must not touch the scene afterwards. */
  private destroyed = false;
  private readonly cells: readonly RunnerCell[];

  constructor(
    private readonly app: Application,
    private readonly config: RunnerConfig,
    private readonly tiles: TileTextures,
    pandaTextures: PandaTextures,
    private readonly onAnimation?: PandaAnimationListener,
  ) {
    this.cells = config.cells;
    this.layout = computeRunnerLayout(config.cells.length, app.screen.width, app.screen.height);
    this.pose = restingPose(config.start);
    this.panda = createPanda(pandaTextures);
    this.inFront.addChild(this.panda.sprite);
    this.world.addChild(
      this.stalks,
      this.pits,
      this.behindGround,
      this.terrain,
      this.items,
      this.inFront,
      this.front,
      this.fx,
      this.stars,
    );
    app.stage.addChild(this.sky, this.clouds, this.far, this.hills, this.world);
    this.build();
    this.setAnimation('idle');
    app.ticker.add(this.onTick);
  }

  reset(): void {
    this.pose = restingPose(this.config.start);
    this.shake = 0;
    this.focus = null;
    this.stunned = 0;
    this.tip.clear();
    this.rise.clear();
    this.wobble = null;
    this.missed.clear();
    this.clearParticles();
    this.inFront.addChild(this.panda.sprite);
    this.panda.sprite.visible = true;
    this.panda.sprite.tint = NO_TINT;
    this.build();
    this.setAnimation('idle');
  }

  rest(): void {
    if (this.destroyed) return;
    // Under a branch Măng stays ducked; elsewhere she stands.
    const pose = this.underBranch() ? 'crouch' : 'idle';
    this.pose.squash = pose === 'crouch' ? DUCK_SQUASH : 1;
    // Also restarts the loop frozen by hold().
    if (this.panda.animation !== pose || !this.panda.sprite.playing) this.setAnimation(pose);
  }

  estimate(event: RunnerEvent): number {
    switch (event.type) {
      case 'walk':
        return MS.walk;
      case 'crouch':
        return MS.crouchWalk;
      case 'jump':
        return MS.crouch + MS.jump + MS.land;
      case 'kick':
        return MS.kickWindUp + MS.kick + (event.hit ? MS.topple : 0);
      case 'collect':
        return MS.collect;
      case 'fall':
        return MS.fall + MS.shake;
      case 'bump':
        return (event.move === 'jump' ? MS.crouch : 0) + MS.bumpApproach + MS.bumpRecoil + MS.stun;
      case 'offTrack':
        return MS.crouch + MS.jump + MS.offTrackFall;
      case 'win':
        return MS.cheer;
      case 'missed':
        return MS.missedPan + MS.missedBlink;
    }
  }

  hold(): void {
    this.panda.sprite.stop();
  }

  /**
   * Every step re-checks `stopped(signal)` after each await before it touches the scene:
   * Làm lại aborts and calls reset() at once, and the old continuation runs only afterwards.
   */
  async play(event: RunnerEvent, signal: AbortSignal, next?: RunnerEvent): Promise<void> {
    if (this.destroyed) return;
    const ticker = this.app.ticker;
    switch (event.type) {
      case 'walk': {
        // Leaving a branch cell, Măng gets out from under the leaves before standing up.
        const ducked = this.cells[event.from] === 'branch';
        this.setAnimation(ducked ? 'crouch' : 'walk');
        let standing = !ducked;
        await tween(ticker, MS.walk, signal, (t) => {
          this.pose.cell = event.from + t * (event.to - event.from);
          if (!standing && t >= 0.5) {
            standing = true;
            this.pose.squash = 1;
            this.setAnimation('walk');
          } else if (!standing) {
            this.pose.squash = DUCK_SQUASH;
          }
        });
        return;
      }
      case 'crouch': {
        this.setAnimation('crouch');
        await tween(ticker, MS.crouchWalk, signal, (t) => {
          this.pose.cell = event.from + t * (event.to - event.from);
          this.pose.squash = DUCK_SQUASH;
          // A little waddle, so ducking along does not look like sliding.
          this.pose.lift = 0.025 * Math.abs(Math.sin(t * Math.PI * 3));
        });
        if (this.stopped(signal)) return;
        this.pose.lift = 0;
        if (!this.underBranch()) this.pose.squash = 1;
        return;
      }
      case 'jump':
        await this.hop(event.from, event.to, signal);
        // Landing in a hole: no crouch on thin air, the fall follows at once.
        if (this.stopped(signal) || next?.type === 'fall') return;
        this.setAnimation('crouch');
        this.dust(this.pose.cell);
        await tween(ticker, MS.land, signal);
        if (!this.stopped(signal)) this.setAnimation('idle');
        return;
      case 'kick':
        await this.kick(event.at, event.hit, signal);
        return;
      case 'collect':
        await this.collect(event.at, signal);
        return;
      case 'fall': {
        this.pose.cell = event.at;
        this.setAnimation('jump'); // arms up: surprised
        this.behindGround.addChild(this.panda.sprite);
        const depth = (this.layout.height - this.layout.groundTop) / this.layout.cellPx + 2;
        await tween(ticker, MS.fall, signal, (t) => {
          this.pose.sink = depth * t * t;
        });
        if (this.stopped(signal)) return;
        this.panda.sprite.visible = false;
        await tween(ticker, MS.shake, signal, (t) => {
          this.shake = t < 1 ? 1 - t : 0;
        });
        return;
      }
      case 'bump':
        await this.bump(event, signal);
        return;
      case 'offTrack': {
        await this.hop(event.from, event.from + 2, signal);
        if (this.stopped(signal)) return;
        this.behindGround.addChild(this.panda.sprite);
        const depth = (this.layout.height - this.layout.feetY) / this.layout.cellPx + 2;
        await tween(ticker, MS.offTrackFall, signal, (t) => {
          this.pose.sink = depth * t * t;
        });
        if (!this.stopped(signal)) this.panda.sprite.visible = false;
        return;
      }
      case 'win': {
        this.pose.cell = event.at;
        this.setAnimation('cheer');
        this.confetti();
        await tween(ticker, MS.cheer, signal, (t) => {
          // Two little hops of joy.
          const hop = (t * 2) % 1;
          this.pose.lift = CHEER_HOP * 4 * hop * (1 - hop);
        });
        if (this.stopped(signal)) return;
        this.pose.lift = 0;
        return;
      }
      case 'missed':
        await this.missedShoots(event.at, event.left, signal);
        return;
    }
  }

  resize(width: number, height: number): void {
    if (this.destroyed) return;
    this.layout = computeRunnerLayout(this.config.cells.length, width, height);
    this.build();
  }

  destroy(): void {
    this.destroyed = true;
    this.app.ticker.remove(this.onTick);
  }

  /** Whether a replay step must stop touching the scene: aborted, or the stage destroyed. */
  private stopped(signal: AbortSignal): boolean {
    return isAborted(signal) || this.destroyed;
  }

  /** Crouch, then an arc from cell `from` to cell `to`. */
  private async hop(from: number, to: number, signal: AbortSignal): Promise<void> {
    const ticker = this.app.ticker;
    this.setAnimation('crouch');
    await tween(ticker, MS.crouch, signal);
    if (this.stopped(signal)) return;
    this.pose.squash = 1;
    this.setAnimation('jump');
    await tween(ticker, MS.jump, signal, (t) => {
      this.pose.cell = from + t * (to - from);
      this.pose.lift = JUMP_HEIGHT * 4 * t * (1 - t);
    });
    if (this.stopped(signal)) return;
    this.pose.lift = 0;
  }

  private async kick(at: number, hit: boolean, signal: AbortSignal): Promise<void> {
    const ticker = this.app.ticker;
    const from = this.pose.cell;
    // Wind up: a small step back, then the kick with a lean forward.
    this.setAnimation('crouch');
    await tween(ticker, MS.kickWindUp, signal, (t) => {
      this.pose.cell = from - 0.06 * t;
    });
    if (this.stopped(signal)) return;
    this.setAnimation('kick');
    if (!hit) this.whoosh(at);
    await tween(ticker, MS.kick, signal, (t) => {
      this.pose.cell = from - 0.06 + 0.16 * Math.sin(t * Math.PI);
    });
    if (this.stopped(signal)) return;
    this.pose.cell = from;
    this.setAnimation('idle');
    if (!hit) return;
    this.dust(at);
    await tween(ticker, MS.topple, signal, (t) => {
      this.tip.set(at, t);
    });
  }

  private async collect(at: number, signal: AbortSignal): Promise<void> {
    this.setAnimation('happy');
    this.sparkles(at);
    this.rise.set(at, 0);
    await tween(this.app.ticker, MS.collect, signal, (t) => {
      this.rise.set(at, t);
    });
  }

  private async bump(
    event: Extract<RunnerEvent, { type: 'bump' }>,
    signal: AbortSignal,
  ): Promise<void> {
    const ticker = this.app.ticker;
    const { from, at, move } = event;
    const contact = at - CONTACT - 0.05;
    let contactLift = 0;
    if (move === 'jump') {
      this.setAnimation('crouch');
      await tween(ticker, MS.crouch, signal);
      if (this.stopped(signal)) return;
      this.setAnimation('jump');
      // The same arc as a full jump to from + 2, cut short where she meets the obstacle.
      const arc = (cell: number): number => {
        const u = (cell - from) / 2;
        return JUMP_HEIGHT * 4 * u * (1 - u);
      };
      await tween(ticker, MS.bumpApproach, signal, (t) => {
        this.pose.cell = from + t * (contact - from);
        this.pose.lift = arc(this.pose.cell);
      });
      contactLift = arc(contact);
    } else {
      const ducked = move === 'crouch';
      this.setAnimation(ducked ? 'crouch' : 'walk');
      this.pose.squash = ducked ? DUCK_SQUASH : 1;
      await tween(ticker, MS.bumpApproach, signal, (t) => {
        this.pose.cell = from + t * (contact - from);
      });
    }
    if (this.stopped(signal)) return;
    // Bonk: Măng flashes pink, the obstacle wobbles, the world shakes a little.
    this.setAnimation('jump');
    this.pose.squash = 1;
    this.stunned = 1;
    this.impact(at);
    await tween(ticker, MS.bumpRecoil, signal, (t) => {
      this.pose.cell = contact + t * (from - contact);
      this.pose.lift =
        contactLift * (1 - t) + 0.35 * 4 * t * (1 - t) * (move === 'jump' ? 0.4 : 1) * 0.5;
      this.pose.flash = 1 - t * 0.6;
      this.shake = 0.6 * (1 - t);
      this.wobble = { cell: at, dx: Math.sin(t * 28) * (1 - t) * 2 };
    });
    if (this.stopped(signal)) return;
    this.wobble = null;
    this.pose.lift = 0;
    this.pose.cell = from;
    this.setAnimation(this.cells[from] === 'branch' ? 'crouch' : 'idle');
    await tween(ticker, MS.stun, signal, (t) => {
      this.pose.flash = 0.4 * (1 - t);
    });
    if (this.stopped(signal)) return;
    this.pose.flash = 0;
  }

  private async missedShoots(at: number, left: number[], signal: AbortSignal): Promise<void> {
    const ticker = this.app.ticker;
    this.pose.cell = at;
    this.setAnimation('talk');
    for (const cell of left) this.missed.add(cell);
    this.drawRings();
    const first = left[0];
    if (first !== undefined && this.layout.scrolls) {
      // Look half-way when both Măng and the shoot fit on screen, else at the shoot.
      const gap = Math.abs(cellCenterX(this.layout, at) - cellCenterX(this.layout, first));
      const goal = gap < this.layout.width * 0.7 ? 0.5 : 1;
      const focus = { cell: first, mix: 0 };
      this.focus = focus;
      await tween(ticker, MS.missedPan, signal, (t) => {
        focus.mix = goal * t * t * (3 - 2 * t);
      });
      if (this.stopped(signal)) return;
    }
    // The shoots and their rings blink; with reduced motion the rings stay as a static highlight.
    await tween(ticker, MS.missedBlink, signal, (t) => {
      const on = this.calm || Math.floor(t * 8) % 2 === 0;
      for (const cell of left) {
        const shoot = this.bamboo.get(cell);
        if (shoot) shoot.alpha = on ? 1 : 0.3;
        const ring = this.rings.get(cell);
        if (ring) ring.alpha = on ? 1 : 0.5;
      }
    });
    if (this.stopped(signal)) return;
    for (const cell of left) {
      const shoot = this.bamboo.get(cell);
      if (shoot) shoot.alpha = 1;
    }
  }

  private underBranch(): boolean {
    return this.cells[Math.round(this.pose.cell)] === 'branch' && this.pose.lift === 0;
  }

  private setAnimation(animation: PandaAnimation): void {
    this.panda.play(animation);
    this.onAnimation?.(animation);
  }

  private standingHeight(): number {
    return PANDA_IDLE_PX * this.layout.pandaScale;
  }

  private crateY(): number {
    return this.layout.feetY;
  }

  private readonly onTick = (ticker: Ticker): void => {
    this.calm = reducedMotion();
    this.panda.update(ticker);
    this.flag?.update(ticker);
    const { layout, pose } = this;
    const x = cellCenterX(layout, pose.cell);
    const sprite = this.panda.sprite;
    sprite.position.set(x, layout.feetY - (pose.lift - pose.sink) * layout.cellPx);
    sprite.scale.set(layout.pandaScale, layout.pandaScale * pose.squash);
    sprite.tint = pose.flash > 0.05 ? BUMP_TINT : NO_TINT;

    this.applyProps();
    if (this.stunned > 0) this.drawStars(x, sprite.y - this.standingHeight() * pose.squash, ticker);
    this.updateParticles(ticker);

    const target = this.focus ? x + (cellCenterX(layout, this.focus.cell) - x) * this.focus.mix : x;
    const camera = cameraX(layout, target);
    const amplitude = this.calm ? 0 : 4;
    const wobble =
      this.shake > 0 ? Math.round(Math.sin(this.shake * 40) * amplitude * this.shake) : 0;
    this.world.position.set(-camera + wobble, 0);
    this.clouds.position.set(-Math.round(camera * PARALLAX.clouds), 0);
    this.far.position.set(-Math.round(camera * PARALLAX.far), 0);
    this.hills.position.set(-Math.round(camera * PARALLAX.hills), 0);
  };

  /** Puts the prop sprites of the current layout in their animated state. */
  private applyProps(): void {
    const { tileScale, cellPx } = this.layout;
    for (const [cell, crate] of this.crates) {
      // Tips over its bottom-right corner, then drops away behind the next cell.
      const t = this.tip.get(cell) ?? 0;
      const tip = Math.min(1, t / 0.55);
      const drop = Math.max(0, (t - 0.55) / 0.45);
      crate.rotation = (Math.PI / 2) * tip * tip;
      crate.alpha = 1 - drop;
      crate.visible = t < 1;
      crate.y = this.crateY() + drop * cellPx * 0.4;
    }
    for (const [cell, shoot] of this.bamboo) {
      const t = this.rise.get(cell) ?? 0;
      shoot.y = layoutShootY(this.layout) - cellPx * 0.9 * (1 - (1 - t) * (1 - t));
      if (this.rise.has(cell)) shoot.alpha = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
      shoot.visible = t < 1;
    }
    for (const [cell, view] of [...this.crates, ...this.branches]) {
      const shaking = this.wobble?.cell === cell && !this.calm;
      const dx = shaking && this.wobble ? Math.round(this.wobble.dx * tileScale) : 0;
      view.pivot.x = -dx;
    }
  }

  /** Three little stars circling over Măng's head after a bump (standing still with reduced motion). */
  private drawStars(x: number, headY: number, ticker: Ticker): void {
    this.stunned += ticker.deltaMS / 1000;
    const u = this.layout.tileScale + 1;
    const g = this.stars.clear();
    const spin = this.calm ? -Math.PI / 2 : this.stunned * 4;
    for (let i = 0; i < 3; i++) {
      const angle = spin + (i * Math.PI * 2) / 3;
      const sx = Math.round(x + Math.cos(angle) * 9 * u);
      const sy = Math.round(headY - 3 * u + Math.sin(angle) * 2.5 * u);
      // A chunky 5-texel star with an ink outline, so it reads on the pale sky.
      g.rect(sx - 3 * u, sy - u, 7 * u, 3 * u)
        .rect(sx - u, sy - 3 * u, 3 * u, 7 * u)
        .fill(UI_COLORS.ink);
      g.rect(sx - 2 * u, sy, 5 * u, u)
        .rect(sx, sy - 2 * u, u, 5 * u)
        .fill(UI_COLORS.coin);
      g.rect(sx, sy, u, u).fill(UI_COLORS.coinShine);
    }
  }

  private spawn(
    x: number,
    y: number,
    vx: number,
    vy: number,
    color: number | string,
    size: number,
    life: number,
    gravity: number,
    plus = false,
  ): void {
    const view = new Graphics().rect(-size / 2, -size / 2, size, size).fill(color);
    if (plus) {
      view.rect(-size * 1.5, -size / 2, size, size).rect(size / 2, -size / 2, size, size);
      view.rect(-size / 2, -size * 1.5, size, size).rect(-size / 2, size / 2, size, size);
      view.fill(color);
    }
    view.position.set(x, y);
    this.fx.addChild(view);
    this.particles.push({ view, x, y, vx, vy, gravity, age: 0, life });
  }

  private updateParticles(ticker: Ticker): void {
    const dt = ticker.deltaMS / 1000;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (!p) continue;
      p.age += dt;
      if (p.age >= p.life) {
        p.view.destroy();
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const u = this.layout.tileScale;
      p.view.position.set(Math.round(p.x / u) * u, Math.round(p.y / u) * u);
      p.view.alpha = Math.min(1, 2 * (1 - p.age / p.life));
    }
  }

  private clearParticles(): void {
    for (const p of this.particles) p.view.destroy();
    this.particles.length = 0;
    this.stars.clear();
  }

  /** Gold pixel sparkles bursting from a picked-up shoot. */
  private sparkles(cell: number): void {
    const { tileScale: u, cellPx, feetY } = this.layout;
    const x = cellCenterX(this.layout, cell);
    const y = feetY - cellPx * 0.35;
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const speed = cellPx * (1.6 + (i % 3) * 0.5);
      const color = SPARKLE_COLORS[i % SPARKLE_COLORS.length] ?? UI_COLORS.coin;
      this.spawn(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - cellPx,
        color,
        u,
        0.75,
        cellPx * 2.5,
        true,
      );
    }
  }

  /** Confetti over Măng on a win. */
  private confetti(): void {
    const { tileScale: u, cellPx } = this.layout;
    const x = cellCenterX(this.layout, this.pose.cell);
    const y = this.layout.feetY - this.standingHeight();
    for (let i = 0; i < 18; i++) {
      const spread = (i / 17 - 0.5) * 2;
      const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length] ?? UI_COLORS.coin;
      this.spawn(
        x,
        y,
        spread * cellPx * 2.2,
        -cellPx * (3 + (i % 4) * 0.6),
        color,
        2 * u,
        1.1,
        cellPx * 7,
      );
    }
  }

  /** Dust puffs at Măng's feet (landing) or under a toppling crate. */
  private dust(cell: number): void {
    const { tileScale: u, cellPx, feetY } = this.layout;
    const x = cellCenterX(this.layout, cell);
    for (let i = 0; i < 6; i++) {
      const dir = i % 2 === 0 ? -1 : 1;
      this.spawn(
        x + dir * cellPx * 0.2,
        feetY - u,
        dir * cellPx * (0.8 + i * 0.15),
        -cellPx * 0.6,
        UI_COLORS.paper2,
        2 * u,
        0.35,
        cellPx * 2,
      );
    }
  }

  /** Air lines in front of Măng's foot: a kick that hits nothing. */
  private whoosh(cell: number): void {
    const { tileScale: u, cellPx, feetY } = this.layout;
    const x = cellCenterX(this.layout, cell) - cellPx * 0.35;
    for (let i = 0; i < 3; i++) {
      this.spawn(
        x,
        feetY - cellPx * (0.25 + i * 0.12),
        cellPx * 1.8,
        0,
        UI_COLORS.white,
        3 * u,
        0.3,
        0,
      );
    }
  }

  /** Bits flying off the obstacle Măng ran into. */
  private impact(cell: number): void {
    const { tileScale: u, cellPx, feetY } = this.layout;
    const x = cellCenterX(this.layout, cell) - cellPx * 0.4;
    const branch = this.cells[cell] === 'branch';
    const y = branch ? feetY - this.standingHeight() * 0.9 : feetY - cellPx * 0.5;
    for (let i = 0; i < 7; i++) {
      const angle = Math.PI * (0.6 + (i / 6) * 0.8);
      const speed = cellPx * (1.3 + (i % 3) * 0.4);
      const color = branch ? UI_COLORS.go : UI_COLORS.coinDeep;
      this.spawn(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed * -1 - cellPx * 0.5,
        color,
        2 * u,
        0.5,
        cellPx * 4,
      );
    }
  }

  /** Coin-coloured rings under the shoots Măng left behind. */
  private drawRings(): void {
    for (const ring of this.rings.values()) ring.destroy();
    this.rings.clear();
    const { tileScale: u, tilePx, feetY } = this.layout;
    for (const cell of this.missed) {
      const x = Math.round(cellCenterX(this.layout, cell));
      const w = tilePx + 4 * u;
      const ring = new Graphics()
        .rect(x - w / 2, feetY - u, w, 2 * u)
        .rect(x - w / 2 - u, feetY - 2 * u, u, 2 * u)
        .rect(x + w / 2, feetY - 2 * u, u, 2 * u)
        .fill(UI_COLORS.coin);
      // A bold "!" over the shoot: "this one is still here".
      const top = feetY - tilePx - 11 * u;
      ring
        .rect(x - 2 * u, top - u, 4 * u, 6 * u)
        .rect(x - 2 * u, top + 6 * u, 4 * u, 4 * u)
        .fill(UI_COLORS.ink);
      ring
        .rect(x - u, top, 2 * u, 4 * u)
        .rect(x - u, top + 7 * u, 2 * u, 2 * u)
        .fill(UI_COLORS.coin);
      this.items.addChildAt(ring, 0);
      this.rings.set(cell, ring);
    }
  }

  /** (Re)draws scenery, terrain and the props on the track for the current layout. */
  private build(): void {
    const { layout, tiles, cells } = this;
    const { tilePx, tileScale, cellPx, originX, groundTop, height } = layout;
    for (const layer of [
      this.sky,
      this.clouds,
      this.far,
      this.hills,
      this.stalks,
      this.terrain,
      this.items,
      this.front,
    ]) {
      for (const child of layer.removeChildren()) child.destroy({ children: true });
    }
    this.crates = new Map();
    this.bamboo = new Map();
    this.branches = new Map();
    this.rings = new Map();
    this.flag = null;
    this.panda.sprite.scale.set(layout.pandaScale);

    this.sky.addChild(drawSky(layout));
    this.clouds.addChild(drawClouds(layout));
    this.far.addChild(drawFarBamboo(layout));
    this.hills.addChild(drawHills(layout));

    // Tile columns: margin before cell 0, the cells, and the cliff after the flag. The margin is
    // plain, darker dirt (no grass), so only real track cells look like something to count.
    const rows = Math.ceil((height - groundTop) / tilePx);
    const firstCol = -Math.ceil(originX / tilePx);
    const lastCol = cells.length * CELL_TILES - 1;
    const cellOf = (col: number) => cells[Math.floor(col / CELL_TILES)];
    const solid = (col: number): boolean => {
      const cell = col < 0 ? undefined : cellOf(col);
      return cell !== undefined && cell !== 'hole';
    };
    const pits = this.pits.clear();
    for (let col = firstCol; col <= lastCol; col++) {
      const x = originX + col * tilePx;
      if (col < 0) {
        for (let row = 0; row < rows; row++) {
          const tile = tileSprite(tiles, 'dirt', tileScale, x, groundTop + row * tilePx);
          tile.tint = MARGIN_TINT;
          this.terrain.addChild(tile);
        }
        continue;
      }
      if (!solid(col)) {
        // A dark pit, so a hole reads as a hole and not as a gap in the sky.
        pits
          .rect(x, groundTop + 4 * tileScale, tilePx, height)
          .fill({ color: UI_COLORS.ink, alpha: 0.82 });
        continue;
      }
      const left = !solid(col - 1);
      const right = !solid(col + 1);
      const edge = left ? '_left' : right ? '_right' : '';
      // Every other cell is a shade darker: a soft checkerboard that makes cells easy to count.
      const tint = Math.floor(col / CELL_TILES) % 2 === 1 ? ODD_CELL_TINT : NO_TINT;
      const ground = tileSprite(tiles, `ground${edge}`, tileScale, x, groundTop);
      ground.tint = tint;
      this.terrain.addChild(ground);
      for (let row = 1; row < rows; row++) {
        const dirt = tileSprite(tiles, `dirt${edge}`, tileScale, x, groundTop + row * tilePx);
        dirt.tint = tint;
        this.terrain.addChild(dirt);
      }
    }

    // A clear seam between two neighbouring ground cells, down through the grass row.
    const seams = new Graphics();
    for (let cell = 1; cell < cells.length; cell++) {
      const prev = cells[cell - 1];
      const next = cells[cell];
      if (prev === 'hole' || next === 'hole') continue;
      const x = originX + cell * cellPx;
      seams.rect(x - tileScale, groundTop + 2 * tileScale, 2 * tileScale, tilePx).fill({
        color: UI_COLORS.ink,
        alpha: 0.55,
      });
    }
    this.terrain.addChild(seams);

    const flagCell = cells.indexOf('flag');
    const flagScale = tileScale + 1;
    const poleX = cellCenterX(layout, flagCell) + cellPx * 0.18;
    const { pole, flag } = createFlag(tiles, flagScale, Math.round(poleX), groundTop);
    this.terrain.addChild(pole, flag);
    this.flag = flag;

    for (const [cell, kind] of cells.entries()) {
      if (kind === 'crate') this.buildCrate(cell);
      if (kind === 'branch') this.buildBranch(cell);
    }
    for (const cell of this.config.bamboo ?? []) this.buildShoot(cell);
    this.drawRings();
  }

  /** Two crates stacked as tall as Măng's chest: too high to jump over, so she must kick. */
  private buildCrate(cell: number): void {
    const { tiles, layout } = this;
    const { tileScale, tilePx } = layout;
    const stack = new Container();
    // Pivot at the bottom-right corner, where the stack tips over when kicked.
    const left = -tilePx;
    stack.addChild(
      tileSprite(tiles, 'crate', tileScale, left, -tilePx),
      tileSprite(tiles, 'crate', tileScale, left, -2 * tilePx),
    );
    stack.position.set(Math.round(cellCenterX(layout, cell) + tilePx / 2), this.crateY());
    this.items.addChild(stack);
    this.crates.set(cell, stack);
  }

  /** A low leafy branch hanging from a bamboo stalk at the right edge of the cell. */
  private buildBranch(cell: number): void {
    const { tiles, layout } = this;
    const { tileScale: u, tilePx, cellPx, originX, groundTop } = layout;
    const cellLeft = originX + cell * cellPx;
    const bottom = Math.round(layout.feetY - this.standingHeight() * BRANCH_CLEARANCE);
    // One size up from the ground tiles, so the leaves read at a glance; they end 2 texels above
    // the tile bottom.
    const scale = u + 1;
    const branchPx = (tilePx / u) * scale;
    const top = bottom - branchPx + 3 * scale;
    const stalkX = cellLeft + cellPx - 4 * u;
    const stalk = new Graphics();
    stalk.rect(stalkX, 0, 4 * u, groundTop + 2 * u).fill(STALK.stalk);
    stalk.rect(stalkX + 3 * u, 0, u, groundTop + 2 * u).fill(STALK.shade);
    for (let y = groundTop - 7 * u; y > 0; y -= 9 * u) {
      stalk.rect(stalkX - u, y, 6 * u, u).fill(STALK.node);
    }
    this.stalks.addChild(stalk);
    const branch = new Container();
    branch.addChild(
      tileSprite(tiles, 'branch_left', scale, 0, 0),
      tileSprite(tiles, 'branch_right', scale, branchPx, 0),
    );
    // Right end tucked against the stalk it grows from.
    branch.position.set(stalkX + 3 * u - 2 * branchPx, top);
    this.front.addChild(branch);
    this.branches.set(cell, branch);
  }

  /** A bamboo shoot standing on its cell, waiting to be picked up. */
  private buildShoot(cell: number): void {
    const { tiles, layout } = this;
    const { tileScale, tilePx } = layout;
    const x = Math.round(cellCenterX(layout, cell) - tilePx / 2);
    const shoot = tileSprite(tiles, 'bamboo', tileScale, x, layoutShootY(layout));
    this.items.addChild(shoot);
    this.bamboo.set(cell, shoot);
  }
}
