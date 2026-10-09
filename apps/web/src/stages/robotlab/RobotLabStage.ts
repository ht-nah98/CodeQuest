import {
  type Application,
  Container,
  Graphics,
  Sprite,
  Text,
  type Texture,
  type Ticker,
} from 'pixi.js';
import type { RunOutcome } from '@codequest/engine';
import { DEFAULT_SCENE_THEME, type SceneTheme } from '@codequest/content-schema';
import {
  type RobotBlock,
  type RobotCell,
  type RobotColor,
  type RobotLabConfig,
  type RobotLabEvent,
  boardOfMap,
  STATION_OF,
} from '@codequest/games';
import { vi } from '../../i18n/vi';
import { UI_COLORS } from '../../ui/tokens';
import { mix, shade } from '../colors';
import { patternPixels, PATTERNS } from '../maze/pixelArt';
import { reducedMotion } from '../motion';
import { CITY_DETAIL, sceneArt } from '../sceneThemes';
import { pixelTexture } from '../tiles';
import { isAborted, type StageRenderer, tween } from '../types';
import { CITY_GROUND, type CellScenery, cityScenery, type SceneryArt, sceneryArt } from './cityArt';
import {
  applyEvent,
  type BoardScore,
  type BoardState,
  boardScore,
  cellCenter,
  cellKey,
  cellsOf,
  computeRobotLayout,
  headingRotation,
  heldIndex,
  HUD_CHIP_HEIGHT,
  initialBoard,
  type JobKind,
  jobKinds,
  type HudLayout,
  layoutHud,
  layoutHudColumn,
  lineSegments,
  MAT_CELLS,
  robotGeometry,
  type RobotLayout,
  secondsLeft,
  stepCell,
  turnDelta,
} from './layout';
import {
  blockArt,
  blockArtKey,
  CLAW_CLOSED,
  CLAW_OPEN,
  CLOCK,
  FLASK,
  ROBOT_BODY,
  ROBOT_COLOR_TONES,
  ROBOT_PALETTE,
  TROPHY,
} from './robotArt';

const C = UI_COLORS;
const t = vi.play.robotlab;

/** Durations at speed 1, in ms. */
const MS = {
  move: 400,
  /** The pause on each crossing reached, while its dot lights up ("đếm"). */
  count: 160,
  turn: 360,
  claw: 140,
  slide: 220,
  result: 380,
  lunge: 180,
  recoil: 260,
  daze: 600,
  gripFail: 520,
  timeUp: 900,
  dizzy: 1500,
} as const;

/** How far Bíp drives into a wall or block before bouncing off, in cells. */
const LUNGE = 0.3;
/** Hard drop shadow under the mat (art-direction.md §4: hard shadows, no blur). */
const MAT_SHADOW = 6;
/** Chip text (VT323 is the HUD's pixel font, only from 22 px: art-direction.md §3). */
const HUD_FONT = { fontFamily: 'VT323', fontSize: 24, fill: C.ink } as const;
const TAG_FONT = {
  fontFamily: 'Nunito',
  fontWeight: '800',
  fontSize: 15,
  fill: C.inkSoft,
} as const;
/** Padding inside a HUD chip, in px. */
const CHIP_PAD = 5;
/** Slab of the city pavement around the mat, in px. */
const SLAB_PX = 32;
/** Width estimate of one VT323 glyph per px of font size, where text cannot be measured (tests). */
const GLYPH_EM = 0.42;

/** Run-end reasons that leave jobs to point at (finish cue). */
const JOB_REASONS: ReadonlySet<string> = new Set(['MISSIONS_LEFT', 'LOW_SCORE']);

type ArtName = 'trophy' | 'body' | 'clawOpen' | 'clawClosed' | 'flask' | 'clock' | 'sparkle';

/** Textures of the robot lab, made once per session (like the maze tiles). */
let artCache: Record<ArtName, Texture> | null = null;
const blockTextures = new Map<string, Texture>();
const sceneryTextures = new Map<SceneryArt, Texture>();

/** A scenery picture of a `#` cell (cityArt.ts), made once per session. */
function sceneryTexture(name: SceneryArt): Texture {
  let texture = sceneryTextures.get(name);
  if (texture === undefined) {
    const { rows, palette } = sceneryArt(name);
    texture = pixelTexture(patternPixels(rows, palette));
    sceneryTextures.set(name, texture);
  }
  return texture;
}

/** One smoke puff from the factory chimney: its age (ms) in a slow, looping rise. */
const SMOKE_PUFFS = 3;
const SMOKE_LIFE = 2400;

function robotTextures(): Record<ArtName, Texture> {
  artCache ??= {
    body: pixelTexture(patternPixels(ROBOT_BODY, ROBOT_PALETTE)),
    clawOpen: pixelTexture(patternPixels(CLAW_OPEN, ROBOT_PALETTE)),
    clawClosed: pixelTexture(patternPixels(CLAW_CLOSED, ROBOT_PALETTE)),
    flask: pixelTexture(patternPixels(FLASK, ROBOT_PALETTE)),
    clock: pixelTexture(patternPixels(CLOCK, { ...ROBOT_PALETTE, X: C.oops })),
    trophy: pixelTexture(patternPixels(TROPHY, ROBOT_PALETTE)),
    sparkle: pixelTexture(patternPixels(PATTERNS.sparkle)),
  };
  return artCache;
}

/** The picture of a competition block, made once per kind and colour. */
function blockTexture(block: RobotBlock): Texture {
  const key = blockArtKey(block);
  let texture = blockTextures.get(key);
  if (texture === undefined) {
    const { rows, palette } = blockArt(block);
    texture = pixelTexture(patternPixels(rows, palette));
    blockTextures.set(key, texture);
  }
  return texture;
}

/** Whether text can be drawn (a browser with a canvas); unit tests run the stage on Node. */
function canDrawText(): boolean {
  return typeof document !== 'undefined';
}

interface Pose {
  /** Crossing in cells (fractional while driving). */
  row: number;
  col: number;
  /** Rotation of the art, radians clockwise from N. */
  rot: number;
  /** Lean along the heading in cells (bump), and a head shake in radians (crash, gripFail). */
  lean: number;
  wobble: number;
  /** 0 = gripper closed, 1 = open. */
  claw: number;
  /** A block moving between the crossing (0) and the gripper (1): grab / release. */
  slide: number;
  /** Size of Bíp (1 normal; the happy hop and the time-up gasp scale it a little). */
  scale: number;
}

interface Particle {
  sprite: Sprite;
  row: number;
  col: number;
  vRow: number;
  vCol: number;
  age: number;
  life: number;
}

/** One HUD chip: its panel, icon and value text (null without a canvas: tests). */
interface Chip {
  kind: 'clock' | JobKind | 'total';
  box: Container;
  panel: Graphics;
  value: Text | null;
  width: number;
}

/**
 * Robot lab stage (game-kinds.md §3.3, stage-rendering.md §2): the line-grid test mat seen from
 * above with its buildings, lab, polluted zones, stations and blocks; the robot Bíp replaying
 * move / turn / bump / grab / release / gripFail / timeUp; a HUD with the virtual clock and the
 * jobs and points so far. Placeholder art drawn in code (robotArt.ts) until P3-02.
 */
export class RobotLabStage implements StageRenderer<RobotLabEvent> {
  private readonly textures = robotTextures();
  private readonly theme: SceneTheme;
  private readonly world = new Container();
  private readonly board = new Container();
  /** Dots that light up as Bíp counts crossings, frames of the finish cue, crash flash. */
  private readonly glow = new Graphics();
  private readonly marks = new Graphics();
  /** Smoke over the factory chimney (scenery; still when motion is reduced). */
  private readonly smoke = new Graphics();
  private readonly scenery: CellScenery[][];
  private readonly flash = new Graphics();
  private readonly robotBody = new Container();
  private readonly bodySprite: Sprite;
  private readonly bodyShadow = new Graphics();
  private readonly blocksLayer = new Container();
  /** Gripper and held block: above the blocks on the board, so a block is never hidden. */
  private readonly robotHand = new Container();
  private readonly claw: Sprite;
  private readonly held: Sprite;
  private readonly fx = new Container();
  private readonly stars: Sprite[] = [];
  private readonly hud = new Container();
  private readonly count: Text | null;
  private chips: Chip[] = [];
  /** "Sa bàn tập, gần giống đề thi" (airoc-2026.md §4), bottom right. */
  private tag: Text | null = null;
  private readonly blockSprites: Sprite[] = [];
  private layout: RobotLayout;
  private state: BoardState;
  private pose: Pose;
  private particles: Particle[] = [];
  /** Shown clock time (seconds used), moving towards the event's `t` during its animation. */
  private clockT = 0;
  private score: BoardScore;
  private readonly jobs: JobKind[];
  /** Light per crossing key (0…1), fading. */
  private readonly dots = new Map<string, number>();
  /** Moves of the current `tiến` so far, and its block, for the count badge. */
  private counted = 0;
  private countBlock: string | null = null;
  private countAlpha = 0;
  private countAt: RobotCell = [0, 0];
  private flashAt: [number, number] | null = null;
  private flashAlpha = 0;
  private shake = 0;
  private stunned = false;
  private finishCue: string | null = null;
  private happy = false;
  private spin = 0;
  private clock = 0;
  private destroyed = false;

  constructor(
    private readonly app: Application,
    private readonly config: RobotLabConfig,
    theme?: SceneTheme,
  ) {
    this.theme = theme ?? DEFAULT_SCENE_THEME;
    app.canvas.dataset.theme = this.theme;
    this.jobs = jobKinds(config);
    this.scenery = cityScenery(config.map);
    this.state = initialBoard(config);
    this.score = boardScore(this.state, config);
    this.pose = this.startPose();
    this.layout = computeRobotLayout(
      config.map.length,
      config.map[0]?.length ?? 0,
      app.screen.width,
      app.screen.height,
    );

    this.bodySprite = new Sprite(this.textures.body);
    this.bodySprite.anchor.set(0.5);
    this.robotBody.addChild(this.bodyShadow, this.bodySprite);
    this.held = new Sprite(this.textures.body);
    this.held.anchor.set(0.5);
    this.held.visible = false;
    this.claw = new Sprite(this.textures.clawClosed);
    this.claw.anchor.set(0.5, 1);
    this.robotHand.addChild(this.held, this.claw);
    for (const block of this.state.blocks) {
      const sprite = new Sprite(blockTexture(block));
      sprite.anchor.set(0.5);
      this.blockSprites.push(sprite);
      this.blocksLayer.addChild(sprite);
    }
    for (let i = 0; i < 3; i++) {
      const star = new Sprite(this.textures.sparkle);
      star.anchor.set(0.5);
      star.visible = false;
      this.stars.push(star);
    }
    this.count = canDrawText()
      ? new Text({
          text: '',
          style: { ...HUD_FONT, fontSize: 30, stroke: { color: C.white, width: 5 } },
        })
      : null;
    if (this.count) this.count.anchor.set(0.5, 1);
    this.fx.addChild(...this.stars, ...(this.count ? [this.count] : []));
    this.world.addChild(
      this.board,
      this.smoke,
      this.glow,
      this.marks,
      this.robotBody,
      this.blocksLayer,
      this.robotHand,
      this.flash,
      this.fx,
    );
    app.stage.addChild(this.world, this.hud);
    this.rebuild(app.screen.width, app.screen.height);
    this.reset();
    app.ticker.add(this.onTick);
  }

  reset(): void {
    this.state = initialBoard(this.config);
    this.score = boardScore(this.state, this.config);
    this.pose = this.startPose();
    this.clockT = 0;
    this.dots.clear();
    this.counted = 0;
    this.countBlock = null;
    this.countAlpha = 0;
    this.app.canvas.dataset.robotCount = '0';
    this.flashAt = null;
    this.flashAlpha = 0;
    this.shake = 0;
    this.stunned = false;
    this.finishCue = null;
    this.happy = false;
    this.spin = 0;
    for (const particle of this.particles) particle.sprite.destroy();
    this.particles = [];
    this.app.canvas.dataset.dizzy = 'false';
    this.syncBlocks();
    this.updateHud();
    this.syncState();
  }

  rest(): void {
    // Bíp has no idle loop to restart: nothing to do.
  }

  /**
   * Called on every highlight and question (Replay): a new block run starts, so the count badge
   * of `tiến` starts again at 1 even when a loop repeats the same block id.
   */
  hold(): void {
    this.counted = 0;
    this.countBlock = null;
  }

  /** End of a run: a happy hop on a win, the jobs left (or the lab) pointed at otherwise. */
  finish(outcome: RunOutcome<RobotLabEvent>): void {
    if (this.destroyed) return;
    this.finishCue =
      outcome.result === 'success' ? 'success' : (outcome.reasonCode ?? outcome.result);
    if (outcome.result === 'success') {
      this.happy = true;
      const { row, col } = this.pose;
      this.burst(row - 0.3, col, 10, 0.004, 900);
    }
    this.updateHud();
    this.syncState();
  }

  /** TIMEOUT (the loop only asks questions): Bíp spins round twice and stays dazed. */
  async dizzy(signal: AbortSignal): Promise<void> {
    if (this.destroyed) return;
    this.app.canvas.dataset.dizzy = 'true';
    this.stunned = true;
    const spins = reducedMotion() ? 0 : 2;
    const from = this.pose.rot;
    await tween(this.app.ticker, MS.dizzy, signal, (k) => {
      const ease = 1 - (1 - k) * (1 - k);
      this.spin = ease * spins * 2 * Math.PI;
    });
    if (this.stopped(signal)) return;
    this.spin = 0;
    this.pose.rot = from;
    this.syncState();
  }

  estimate(event: RobotLabEvent): number {
    switch (event.type) {
      case 'move':
        return MS.move + MS.count;
      case 'turn':
        return MS.turn;
      case 'grab':
        return 2 * MS.claw + MS.slide;
      case 'release':
        // Open, slide out, then the result (a retrieved block fades; else close + rest of it).
        return MS.claw + MS.slide + MS.result;
      case 'bump':
        return MS.lunge + MS.recoil + MS.daze;
      case 'gripFail':
        return MS.gripFail + MS.daze;
      case 'timeUp':
        return MS.timeUp;
    }
  }

  async play(event: RobotLabEvent, signal: AbortSignal): Promise<void> {
    if (this.destroyed) return;
    const ticker = this.app.ticker;
    const before = this.state;
    const after = applyEvent(before, event);
    if (event.type !== 'move' || event.blockId !== this.countBlock) {
      this.counted = 0;
      this.countBlock = event.type === 'move' ? event.blockId : null;
    }
    switch (event.type) {
      case 'move': {
        const [r0, c0] = event.from;
        const [r1, c1] = event.to;
        this.pose.rot = headingRotation(event.dir);
        const t0 = this.clockT;
        await tween(ticker, MS.move, signal, (k) => {
          const ease = k * k * (3 - 2 * k);
          this.pose.row = r0 + ease * (r1 - r0);
          this.pose.col = c0 + ease * (c1 - c0);
          this.clockT = t0 + k * (event.t - t0);
        });
        if (this.stopped(signal)) return;
        // Counting: the crossing reached lights up, with the count of this `tiến` above it.
        this.commit(after, event.t);
        this.counted += 1;
        this.app.canvas.dataset.robotCount = String(this.counted);
        this.dots.set(cellKey(event.to), 1);
        this.countAt = event.to;
        this.countAlpha = 1;
        if (this.count) this.count.text = String(this.counted);
        await tween(ticker, MS.count, signal);
        return;
      }
      case 'turn': {
        const from = headingRotation(event.from);
        const delta = turnDelta(event.from, event.to);
        const t0 = this.clockT;
        await tween(ticker, MS.turn, signal, (k) => {
          const ease = k * k * (3 - 2 * k);
          this.pose.rot = from + delta * ease;
          this.clockT = t0 + k * (event.t - t0);
        });
        if (this.stopped(signal)) return;
        this.pose.rot = headingRotation(event.to);
        this.commit(after, event.t);
        return;
      }
      case 'grab': {
        // The gripper opens, pulls the block from the crossing between its prongs, closes.
        const t0 = this.clockT;
        await tween(ticker, MS.claw, signal, (k) => {
          this.pose.claw = k;
        });
        if (this.stopped(signal)) return;
        this.state = { ...this.state, blocks: after.blocks };
        this.pose.slide = 0;
        this.syncBlocks();
        await tween(ticker, MS.slide, signal, (k) => {
          this.pose.slide = k;
          this.clockT = t0 + k * (event.t - t0);
        });
        if (this.stopped(signal)) return;
        await tween(ticker, MS.claw, signal, (k) => {
          this.pose.claw = 1 - k;
        });
        if (this.stopped(signal)) return;
        this.commit(after, event.t);
        return;
      }
      case 'release': {
        const t0 = this.clockT;
        await tween(ticker, MS.claw, signal, (k) => {
          this.pose.claw = k;
        });
        if (this.stopped(signal)) return;
        await tween(ticker, MS.slide, signal, (k) => {
          this.pose.slide = 1 - k;
          this.clockT = t0 + k * (event.t - t0);
        });
        if (this.stopped(signal)) return;
        this.pose.slide = 1;
        this.commit(after, event.t);
        const [r, c] = event.at;
        if (event.result !== 'placed') this.burst(r - 0.2, c, 7, 0.003, 640);
        const sprite = this.blockSprites[event.index];
        if (event.result === 'retrieved' && sprite) {
          // Into the lab: the block shrinks and fades away.
          sprite.visible = true;
          const at = cellCenter(this.layout, r, c);
          const base = this.layout.blockScale;
          await tween(ticker, MS.result, signal, (k) => {
            sprite.position.set(at.x, at.y - k * this.layout.cellPx * 0.3);
            sprite.scale.set(base * (1 - 0.7 * k));
            sprite.alpha = 1 - k;
          });
          if (this.stopped(signal)) return;
          this.syncBlocks();
        } else {
          await tween(ticker, MS.claw, signal, (k) => {
            this.pose.claw = 1 - k;
          });
          if (this.stopped(signal)) return;
          await tween(ticker, MS.result - MS.claw, signal);
        }
        if (this.stopped(signal)) return;
        this.pose.claw = 0;
        return;
      }
      case 'bump': {
        this.pose.rot = headingRotation(event.dir);
        await tween(ticker, MS.lunge, signal, (k) => {
          this.pose.lean = LUNGE * k * k;
        });
        if (this.stopped(signal)) return;
        const target = stepCell(event.at, event.dir);
        this.flashAt = target;
        this.flashAlpha = 0.85;
        if (!reducedMotion()) this.shake = 1;
        this.burst(
          event.at[0] + (target[0] - event.at[0]) * 0.5,
          event.at[1] + (target[1] - event.at[1]) * 0.5,
          6,
          0.0035,
          420,
        );
        this.commit(after, null);
        await tween(ticker, MS.recoil, signal, (k) => {
          this.pose.lean = LUNGE * (1 - k) - 0.1 * Math.sin(Math.PI * k);
        });
        if (this.stopped(signal)) return;
        this.pose.lean = 0;
        await this.daze(signal);
        return;
      }
      case 'gripFail': {
        // The gripper snaps at nothing (or cannot let go), the crossing flashes red.
        this.flashAt = [event.at[0], event.at[1]];
        this.flashAlpha = 0.85;
        await tween(ticker, MS.gripFail, signal, (k) => {
          this.pose.claw = Math.abs(Math.sin(k * Math.PI * 2));
        });
        if (this.stopped(signal)) return;
        this.pose.claw = 0;
        this.commit(after, null);
        await this.daze(signal);
        return;
      }
      case 'timeUp': {
        // Out of time: the clock goes red and rings, Bíp gasps and stops.
        this.commit(after, event.t);
        await tween(ticker, MS.timeUp, signal, (k) => {
          this.pose.scale = 1 + 0.08 * Math.sin(k * Math.PI * 3) * (1 - k);
        });
        if (this.stopped(signal)) return;
        this.pose.scale = 1;
        return;
      }
    }
  }

  resize(width: number, height: number): void {
    if (this.destroyed) return;
    this.rebuild(width, height);
    this.syncBlocks();
    this.updateHud();
  }

  destroy(): void {
    this.destroyed = true;
    this.app.ticker.remove(this.onTick);
  }

  private stopped(signal: AbortSignal): boolean {
    return isAborted(signal) || this.destroyed;
  }

  /** Crash ending: Bíp shakes its head, then stays dazed with stars until reset. */
  private async daze(signal: AbortSignal): Promise<void> {
    this.stunned = true;
    this.syncState();
    const still = reducedMotion();
    await tween(this.app.ticker, MS.daze, signal, (k) => {
      this.pose.wobble = still ? 0 : 0.35 * Math.sin(k * Math.PI * 4) * (1 - k);
    });
    if (this.stopped(signal)) return;
    this.pose.wobble = 0;
  }

  /** The board after an event: blocks, HUD and the e2e mirror; the clock jumps to `t`. */
  private commit(next: BoardState, t: number | null): void {
    this.state = next;
    if (t !== null) this.clockT = t;
    this.score = boardScore(next, this.config);
    this.syncBlocks();
    this.updateHud();
    this.syncState();
  }

  private startPose(): Pose {
    const [row, col] = this.state.pos;
    return {
      row,
      col,
      rot: headingRotation(this.state.dir),
      lean: 0,
      wobble: 0,
      claw: 0,
      slide: 1,
      scale: 1,
    };
  }

  /**
   * Mirrors what the stage shows as data attributes on the canvas, for e2e tests: Bíp's crossing
   * and heading, the held block, the clock, the jobs and points, crash, time-up and finish cue.
   */
  private syncState(): void {
    const data = this.app.canvas.dataset;
    const { state, score } = this;
    data.robotPos = cellKey(state.pos);
    data.robotDir = state.dir;
    const held = heldIndex(state);
    const block = state.blocks[held];
    data.robotHeld = block === undefined ? 'none' : block.kind;
    data.robotClock = String(secondsLeft(this.config, state.t));
    data.robotScore = String(score.total);
    data.robotJobs = this.jobs
      .map((job) => `${job}:${String(score[job].done)}/${String(score[job].total)}`)
      .join(' ');
    data.robotCrash = state.crash === null ? 'none' : state.crash.why;
    data.robotTimeUp = String(state.timeUp);
    data.robotStunned = String(this.stunned);
    data.robotFinish = this.finishCue ?? 'none';
    // The đề on the board: where each block started (changes with "Đề mới", P3-08).
    data.robotLayout = (this.config.blocks ?? [])
      .map((block) => `${block.kind}@${cellKey(block.at)}`)
      .join(' ');
  }

  /** Places every block on the board (hidden when held or retrieved) and the held one. */
  private syncBlocks(): void {
    const { layout } = this;
    this.state.blocks.forEach((block, index) => {
      const sprite = this.blockSprites[index];
      if (!sprite) return;
      sprite.alpha = 1;
      sprite.scale.set(layout.blockScale);
      if (typeof block.where === 'object') {
        const at = cellCenter(layout, block.where.at[0], block.where.at[1]);
        sprite.position.set(at.x, at.y);
        sprite.visible = true;
      } else {
        sprite.visible = false;
      }
    });
    const held = this.state.blocks[heldIndex(this.state)];
    this.held.visible = held !== undefined;
    if (held) {
      this.held.texture = blockTexture(held);
      this.held.scale.set(layout.blockScale);
    }
  }

  private burst(row: number, col: number, count: number, speed: number, life: number): void {
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + ((i - (count - 1) / 2) / count) * Math.PI * 1.6;
      const sprite = new Sprite(this.textures.sparkle);
      sprite.anchor.set(0.5);
      this.fx.addChild(sprite);
      this.particles.push({
        sprite,
        row,
        col,
        vRow: Math.sin(angle) * speed,
        vCol: Math.cos(angle) * speed,
        age: 0,
        life,
      });
    }
  }

  private readonly onTick = (ticker: Ticker): void => {
    const dt = ticker.deltaMS;
    this.clock += dt;
    const { layout, pose } = this;
    const { cellPx } = layout;
    const still = reducedMotion();

    // Bíp: the body behind the crossing, the gripper and held block over the board's blocks.
    const rot = pose.rot + pose.wobble + this.spin;
    const ahead = { x: Math.sin(pose.rot), y: -Math.cos(pose.rot) };
    const centre = cellCenter(
      layout,
      pose.row + ahead.y * pose.lean,
      pose.col + ahead.x * pose.lean,
    );
    const hop = this.happy && !still ? Math.abs(Math.sin(this.clock / 160)) * 0.08 : 0;
    const scale = pose.scale + hop;
    const geometry = robotGeometry(cellPx, layout.robotScale);
    for (const part of [this.robotBody, this.robotHand]) {
      part.position.set(centre.x, centre.y);
      part.rotation = rot;
      part.scale.set(scale);
    }
    this.bodySprite.position.set(0, geometry.bodyY);
    this.bodySprite.scale.set(layout.robotScale);
    this.bodySprite.tint = this.stunned ? mix(C.white, C.hint, 0.35) : C.white;
    this.bodyShadow
      .clear()
      .ellipse(2, geometry.bodyY + 3, 8.5 * layout.robotScale, 8.5 * layout.robotScale)
      .fill({ color: C.ink, alpha: 0.18 });
    this.claw.texture = pose.claw > 0.5 ? this.textures.clawOpen : this.textures.clawClosed;
    this.claw.scale.set(layout.robotScale);
    this.claw.position.set(0, geometry.clawBaseY);
    // A held block sits between the prongs; while sliding it travels to / from the crossing.
    this.held.position.set(0, geometry.heldY * pose.slide);

    // Counted crossings glow, then fade.
    this.glow.clear();
    for (const [key, light] of this.dots) {
      const [r, c] = key.split(',').map(Number) as [number, number];
      const at = cellCenter(layout, r, c);
      this.glow
        .circle(at.x, at.y, cellPx * (0.12 + 0.08 * light))
        .fill({ color: C.coin, alpha: light });
      const next = light - dt / 900;
      if (next <= 0) this.dots.delete(key);
      else this.dots.set(key, next);
    }
    if (this.count) {
      const at = cellCenter(layout, this.countAt[0], this.countAt[1]);
      this.count.position.set(at.x + cellPx * 0.32, at.y - cellPx * 0.12);
      this.count.alpha = this.countAlpha;
      this.count.visible = this.countAlpha > 0;
      this.countAlpha = Math.max(0, this.countAlpha - dt / 1100);
    }

    // Dazed stars circle Bíp after a crash.
    this.stars.forEach((star, i) => {
      star.visible = this.stunned;
      if (!this.stunned) return;
      const spin = still ? -Math.PI / 2 : this.clock / 220;
      const a = spin + (i * 2 * Math.PI) / this.stars.length;
      star.position.set(
        centre.x + Math.cos(a) * cellPx * 0.42,
        centre.y - cellPx * 0.45 + Math.sin(a) * cellPx * 0.13,
      );
      star.scale.set(Math.max(1, layout.texel));
    });

    this.drawFinishMarks(still);
    this.drawSmoke(still);

    for (const particle of this.particles) {
      particle.age += dt;
      particle.vRow += 0.000006 * dt;
      particle.row += particle.vRow * dt;
      particle.col += particle.vCol * dt;
      const at = cellCenter(layout, particle.row, particle.col);
      particle.sprite.position.set(at.x, at.y);
      particle.sprite.scale.set(Math.max(1, layout.texel - 1));
      particle.sprite.alpha = Math.max(0, 1 - particle.age / particle.life);
    }
    const done = this.particles.filter((particle) => particle.age >= particle.life);
    if (done.length > 0) {
      for (const particle of done) particle.sprite.destroy();
      this.particles = this.particles.filter((particle) => particle.age < particle.life);
    }

    this.flash.clear();
    if (this.flashAt && this.flashAlpha > 0) {
      const at = cellCenter(layout, this.flashAt[0], this.flashAt[1]);
      const half = cellPx / 2;
      this.flash
        .rect(at.x - half, at.y - half, cellPx, cellPx)
        .fill({ color: C.white, alpha: this.flashAlpha * 0.7 })
        .rect(at.x - half, at.y - half, cellPx, cellPx)
        .stroke({
          color: C.oops,
          width: Math.max(2, 2 * layout.texel),
          alignment: 1,
          alpha: Math.max(0.5, this.flashAlpha),
        });
      // The red frame stays (faintly) on the crash spot until Làm lại.
      this.flashAlpha = Math.max(this.stunned ? 0.35 : 0, this.flashAlpha - dt / 600);
    }

    this.tickHud(still);

    if (this.shake > 0) this.shake = still ? 0 : Math.max(0, this.shake - dt / 320);
    const wobble = this.shake > 0 ? Math.round(Math.sin(this.clock / 18) * 5 * this.shake) : 0;
    this.world.position.set(wobble, 0);
  };

  /** Grey puffs rising from every chimney cell, drifting a little east; one still puff if reduced. */
  private drawSmoke(still: boolean): void {
    this.smoke.clear();
    const { layout } = this;
    const { cellPx } = layout;
    this.scenery.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell.kind !== 'art' || cell.art !== 'chimney') return;
        const base = cellCenter(layout, r, c);
        for (let i = 0; i < (still ? 1 : SMOKE_PUFFS); i++) {
          const k = still
            ? 0.35
            : ((this.clock + (i * SMOKE_LIFE) / SMOKE_PUFFS) % SMOKE_LIFE) / SMOKE_LIFE;
          const radius = cellPx * (0.1 + 0.12 * k);
          this.smoke
            .circle(base.x + cellPx * 0.25 * k, base.y - cellPx * (0.05 + 0.55 * k), radius)
            .fill({ color: CITY_GROUND.smoke, alpha: 0.85 * (1 - k) });
        }
      });
    });
  }

  /** Pink frames on the jobs left (MISSIONS_LEFT, LOW_SCORE) or on the lab (NOT_HOME). */
  private drawFinishMarks(still: boolean): void {
    this.marks.clear();
    const cue = this.finishCue;
    if (cue === null || cue === 'success') return;
    const cells: RobotCell[] = [];
    const { map } = this.config;
    if (cue === 'NOT_HOME') cells.push(...cellsOf(map, 'L'));
    if (JOB_REASONS.has(cue)) {
      const fenced = new Set(
        this.state.blocks.flatMap((block) =>
          block.kind === 'fence' && typeof block.where === 'object'
            ? [cellKey(block.where.at)]
            : [],
        ),
      );
      for (const zone of cellsOf(map, 'Z')) if (!fenced.has(cellKey(zone))) cells.push(zone);
      for (const block of this.state.blocks) {
        if (block.kind === 'fence' || block.where === 'done') continue;
        const at = typeof block.where === 'object' ? block.where.at : this.state.pos;
        const station = map[at[0]]?.[at[1]];
        const ok = block.kind === 'neutralizer' && station === STATION_OF[block.color];
        if (!ok) cells.push(at);
      }
    }
    const { layout } = this;
    const { cellPx, texel } = layout;
    const pulse = still ? 0 : Math.abs(Math.sin(this.clock / 200));
    for (const [r, c] of cells) {
      const at = cellCenter(layout, r, c);
      const half = cellPx / 2 - texel + pulse * texel;
      this.marks
        .rect(at.x - half, at.y - half, 2 * half, 2 * half)
        .stroke({ color: C.hint, width: 3 * texel, alignment: 0.5 })
        .rect(at.x - half - texel, at.y - half - texel, 2 * half + 2 * texel, 2 * half + 2 * texel)
        .stroke({ color: C.ink, width: texel, alignment: 0.5 });
    }
  }

  // ---- Board ------------------------------------------------------------------------------------

  /** Lays out HUD and board for a stage size, then redraws the board. */
  private rebuild(width: number, height: number): void {
    this.buildHud();
    // HUD on top (rows), or in a column on the left when that gives bigger crossings.
    const widths = this.chips.map((chip) => chip.width);
    const rows = this.config.map.length;
    const cols = this.config.map[0]?.length ?? 0;
    const top = layoutHud(widths, width);
    let hud: HudLayout = top;
    this.layout = computeRobotLayout(rows, cols, width, height, top.band);
    const column = layoutHudColumn(widths, height);
    if (column !== null) {
      const side = computeRobotLayout(rows, cols, width, height, 0, undefined, column.side);
      if (side.cellPx > this.layout.cellPx) {
        this.layout = side;
        hud = column;
      }
    }
    this.placeHud(width, hud);
    // e2e: where the HUD went.
    this.app.canvas.dataset.robotHud = hud.side === undefined ? 'top' : 'side';
    this.buildBoard();
  }

  /** The test mat: pavement, mat, buildings, zones, stations, lab, black lines, crossing dots. */
  private buildBoard(): void {
    const { layout, textures } = this;
    const { map } = this.config;
    const { cellPx, texel, rows, cols } = layout;
    for (const child of this.board.removeChildren()) child.destroy();
    const city = this.theme === 'thanh-pho-robot';

    const ground = new Graphics()
      .rect(0, 0, layout.width, layout.height)
      .fill({ color: city ? CITY_DETAIL.pavement : sceneArt(this.theme).maze.background });
    if (city) {
      // Pavement slabs around the mat (decoration only, never a crossing or a block).
      const slab = SLAB_PX;
      for (let x = slab; x < layout.width; x += slab) ground.rect(x, 0, 1, layout.height);
      for (let y = slab; y < layout.height; y += slab) ground.rect(0, y, layout.width, 1);
      ground.fill({ color: CITY_DETAIL.pavementSeam });
    }
    // e2e: what the ground around the mat was painted with.
    this.app.canvas.dataset.robotGround = city ? 'pavement' : 'plain';
    const mat = MAT_CELLS * cellPx;
    const left = layout.originX - mat;
    const top = layout.originY - mat;
    const matW = cols * cellPx + 2 * mat;
    const matH = rows * cellPx + 2 * mat;
    ground
      .rect(left + MAT_SHADOW, top + MAT_SHADOW, matW, matH)
      .fill({ color: C.ink })
      .rect(left - 3, top - 3, matW + 6, matH + 6)
      .fill({ color: C.ink })
      .rect(left, top, matW, matH)
      .fill({ color: C.white });
    this.board.addChild(ground);

    const tiles = new Graphics();
    const half = cellPx / 2;
    map.forEach((row, r) => {
      Array.from(row).forEach((tile, c) => {
        const { x, y } = cellCenter(layout, r, c);
        if (tile === 'Z') {
          // Polluted zone: pink ground, red hatching and a red dashed border ("viền đỏ").
          const inset = texel;
          tiles
            .rect(x - half + inset, y - half + inset, cellPx - 2 * inset, cellPx - 2 * inset)
            .fill(C.oopsSoft);
          for (let k = -cellPx; k < cellPx; k += 4 * texel) {
            const x0 = Math.max(x - half + inset, x - half + k);
            const x1 = Math.min(x + half - inset, x - half + k + cellPx);
            const y0 = y + half - inset - (x0 - (x - half + k));
            const y1 = y + half - inset - (x1 - (x - half + k));
            if (x1 > x0) tiles.moveTo(x0, y0).lineTo(x1, y1);
          }
          tiles.stroke({ color: mix(C.oops, C.oopsSoft, 0.55), width: texel });
          const dash = 3 * texel;
          for (let d = 0; d < cellPx - 2 * inset; d += 2 * dash) {
            const len = Math.min(dash, cellPx - 2 * inset - d);
            tiles
              .rect(x - half + inset + d, y - half + inset, len, 2 * texel)
              .rect(x - half + inset + d, y + half - inset - 2 * texel, len, 2 * texel)
              .rect(x - half + inset, y - half + inset + d, 2 * texel, len)
              .rect(x + half - inset - 2 * texel, y - half + inset + d, 2 * texel, len);
          }
          tiles.fill(C.oops);
        } else if (tile === 'r' || tile === 'y' || tile === 'g') {
          // Station: a pad of its colour with a thick ring, where a neutraliser of that colour goes.
          const color = ({ r: 'RED', y: 'YELLOW', g: 'GREEN' } as const)[tile];
          const tones = ROBOT_COLOR_TONES[color];
          const inset = 2 * texel;
          const size = cellPx - 2 * inset;
          tiles
            .roundRect(x - half + inset, y - half + inset, size, size, 3 * texel)
            .fill(tones.light)
            .stroke({ color: C.ink, width: texel, alignment: 1 })
            .roundRect(
              x - half + inset + texel,
              y - half + inset + texel,
              size - 2 * texel,
              size - 2 * texel,
              2 * texel,
            )
            .stroke({ color: tones.main, width: 3 * texel, alignment: 1 });
        } else if (tile === 'L') {
          // The lab: a lavender pad with a deep border; its sign (a flask) sits in a corner.
          const inset = texel;
          tiles
            .rect(x - half + inset, y - half + inset, cellPx - 2 * inset, cellPx - 2 * inset)
            .fill(C.brandSoft)
            .stroke({ color: C.brandDeep, width: 2 * texel, alignment: 1 });
        }
      });
    });
    this.board.addChild(tiles);

    // Scenery (cityArt.ts): district ground, river and bridges, then pictures on `#` cells.
    // Ground and water fill whole cells so a small board has no gaps; pictures snap to texels.
    const scene = new Graphics();
    const art: Sprite[] = [];
    this.scenery.forEach((row, r) => {
      row.forEach((cell, c) => {
        const { x, y } = cellCenter(layout, r, c);
        const x0 = x - half;
        const y0 = y - half;
        if (cell.kind === 'water' || cell.kind === 'bridge') {
          scene.rect(x0, y0, cellPx, cellPx).fill(CITY_GROUND.water);
          // Waves: short strokes on a texel grid, offset by row so the river seems to flow.
          for (let k = 0; k < 3; k++) {
            const wx = x0 + ((k * 5 + r * 3) % 12) * (cellPx / 16);
            const wy = y0 + (2 + k * 5) * (cellPx / 16);
            scene.rect(wx, wy, 3 * (cellPx / 16), Math.max(1, cellPx / 16));
          }
          scene.fill(CITY_GROUND.wave);
          const bank = Math.max(1, Math.round(cellPx / 16));
          if (cell.kind === 'water') {
            // Sandy banks on the sides that are not river.
            if (
              this.scenery[r]?.[c - 1]?.kind !== 'water' &&
              this.scenery[r]?.[c - 1]?.kind !== 'bridge'
            ) {
              scene.rect(x0, y0, bank, cellPx);
            }
            if (
              this.scenery[r]?.[c + 1]?.kind !== 'water' &&
              this.scenery[r]?.[c + 1]?.kind !== 'bridge'
            ) {
              scene.rect(x0 + cellPx - bank, y0, bank, cellPx);
            }
            scene.fill(CITY_GROUND.bank);
          }
        }
        if (cell.kind === 'bridge') {
          // A wooden deck under the line, with rails on both sides.
          const across = cell.across === 'EW';
          const deck = Math.round(cellPx * 0.56);
          const dx = across ? x0 : x - deck / 2;
          const dy = across ? y - deck / 2 : y0;
          const dw = across ? cellPx : deck;
          const dh = across ? deck : cellPx;
          scene.rect(dx, dy, dw, dh).fill(CITY_GROUND.plank);
          const seam = Math.max(1, Math.round(cellPx / 16));
          for (let k = 1; k < 4; k++) {
            if (across) scene.rect(x0 + (k * cellPx) / 4, dy, seam, dh);
            else scene.rect(dx, y0 + (k * cellPx) / 4, dw, seam);
          }
          scene.fill(CITY_GROUND.plankSeam);
          const rail = 2 * seam;
          if (across) scene.rect(dx, dy, dw, rail).rect(dx, dy + dh - rail, dw, rail);
          else scene.rect(dx, dy, rail, dh).rect(dx + dw - rail, dy, rail, dh);
          scene.fill(CITY_GROUND.rail);
        }
        if (cell.kind === 'art') {
          if (cell.ground === 'grass') scene.rect(x0, y0, cellPx, cellPx).fill(CITY_GROUND.grass);
          const sprite = new Sprite(sceneryTexture(cell.art));
          const zoom = Math.max(1, Math.floor(cellPx / 16));
          sprite.scale.set(zoom);
          const size = 16 * zoom;
          sprite.position.set(Math.round(x - size / 2), Math.round(y - size / 2));
          art.push(sprite);
        }
      });
    });
    this.board.addChild(scene, ...art);
    // e2e: which board's scenery is drawn ('none' for a map that is not a known board).
    this.app.canvas.dataset.robotBoard = boardOfMap(map)?.id ?? 'none';

    // The black line between neighbouring crossings, then a dot on every crossing.
    const line = new Graphics();
    const lineW = Math.max(3, Math.round(cellPx * 0.1));
    for (const [a, b] of lineSegments(map)) {
      const p = cellCenter(layout, a[0], a[1]);
      const q = cellCenter(layout, b[0], b[1]);
      line.rect(
        Math.min(p.x, q.x) - lineW / 2,
        Math.min(p.y, q.y) - lineW / 2,
        Math.abs(q.x - p.x) + lineW,
        Math.abs(q.y - p.y) + lineW,
      );
    }
    line.fill(C.ink);
    map.forEach((row, r) => {
      Array.from(row).forEach((tile, c) => {
        if (tile === '#') return;
        const { x, y } = cellCenter(layout, r, c);
        line.circle(x, y, Math.max(4, cellPx * 0.11)).fill(C.ink);
        line.circle(x, y, Math.max(2, cellPx * 0.05)).fill(C.paper2);
      });
    });
    this.board.addChild(line);

    // The lab's sign over its top-left corner.
    for (const [r, c] of cellsOf(map, 'L')) {
      const sign = new Sprite(textures.flask);
      const s = Math.max(1, Math.floor((cellPx * 0.45) / 12));
      sign.scale.set(s);
      const { x, y } = cellCenter(layout, r, c);
      sign.position.set(Math.round(x - half + 2 * texel), Math.round(y - half + 2 * texel));
      this.board.addChild(sign);
    }
  }

  // ---- HUD --------------------------------------------------------------------------------------

  /** Makes the chips: clock, one per job type of the board, and the total on score levels. */
  private buildHud(): void {
    for (const child of this.hud.removeChildren()) child.destroy({ children: true });
    this.chips = [];
    const { rules, goal } = this.config;
    const icon = (texture: Texture, scale: number): Sprite => {
      const sprite = new Sprite(texture);
      sprite.scale.set(scale);
      return sprite;
    };
    const maxPoints = (job: JobKind): number => this.score[job].max;
    const kinds: Chip['kind'][] = [
      'clock',
      ...this.jobs,
      ...(goal.type === 'score' ? (['total'] as const) : []),
    ];
    for (const kind of kinds) {
      const box = new Container();
      const panel = new Graphics();
      box.addChild(panel);
      // A 24 px icon (12-texel art ×2), then the value.
      const texture =
        kind === 'clock'
          ? this.textures.clock
          : kind === 'total'
            ? this.textures.trophy
            : kind === 'home'
              ? this.textures.flask
              : jobTexture(kind, this.config);
      const sprite = icon(texture, 2);
      sprite.position.set(CHIP_PAD, (HUD_CHIP_HEIGHT - 24) / 2);
      box.addChild(sprite);
      const x = CHIP_PAD + 24 + 3;
      // Width for the longest value this chip will show, so it never jumps while the clock runs.
      const template =
        kind === 'clock'
          ? `${'8'.repeat(String(rules.timeLimit).length)} ${t.seconds}`
          : kind === 'total'
            ? `${'8'.repeat(String(goal.type === 'score' ? goal.target : 0).length + 1)}/${String(goal.type === 'score' ? goal.target : 0)}`
            : goal.type === 'score'
              ? `${'8'.repeat(String(maxPoints(kind)).length)}/${String(maxPoints(kind))}`
              : kind === 'home'
                ? '8'
                : '8/8';
      let value: Text | null = null;
      let textWidth = template.length * HUD_FONT.fontSize * GLYPH_EM;
      if (canDrawText()) {
        value = new Text({ text: template, style: HUD_FONT });
        textWidth = value.width;
        value.position.set(x, (HUD_CHIP_HEIGHT - value.height) / 2);
        box.addChild(value);
      }
      const chipWidth = Math.ceil(x + textWidth + CHIP_PAD);
      this.chips.push({ kind, box, panel, value, width: chipWidth });
      this.hud.addChild(box);
    }
    this.tag = canDrawText() ? new Text({ text: t.practiceBoard, style: TAG_FONT }) : null;
    if (this.tag) this.hud.addChild(this.tag);
    // e2e: the tag drawn on the stage (empty where no text can be drawn: Node tests).
    this.app.canvas.dataset.robotTag = this.tag?.text ?? '';
  }

  /** Puts the chips in rows along the top and the tag in the bottom-right corner. */
  private placeHud(width: number, hud: HudLayout): void {
    const places = hud.chips;
    this.chips.forEach((chip, i) => {
      const place = places[i];
      if (place) chip.box.position.set(place.x, place.y);
    });
    if (this.tag) {
      this.tag.anchor.set(1, 1);
      this.tag.position.set(width - 10, this.layout.height - 5);
    }
  }

  /** Values and colours of the chips (clock, jobs, total) from the board and the clock. */
  private updateHud(): void {
    const { goal } = this.config;
    const left = secondsLeft(this.config, Math.round(this.clockT));
    const shown: string[] = [];
    for (const chip of this.chips) {
      let text: string;
      let fill: string;
      if (chip.kind === 'clock') {
        text = `${String(left)} ${t.seconds}`;
        // e2e: the seconds the child sees now (runs down during an action, unlike robotClock).
        this.app.canvas.dataset.robotClockShown = String(left);
        fill = this.state.timeUp ? C.oops : left <= 5 ? C.coinShine : C.paper;
      } else if (chip.kind === 'total') {
        const target = goal.type === 'score' ? goal.target : 0;
        text = `${String(this.score.total)}/${String(target)}`;
        const reached = this.score.total >= target;
        fill = reached ? shade(C.go, 1.55) : this.finishCue === 'LOW_SCORE' ? C.hint : C.paper;
      } else {
        const tally = this.score[chip.kind];
        // Score levels: earned / worth, so a child can weigh the jobs before choosing.
        if (goal.type === 'score') text = `${String(tally.points)}/${String(tally.max)}`;
        else if (chip.kind === 'home') text = tally.done > 0 ? '✓' : '·';
        else text = `${String(tally.done)}/${String(tally.total)}`;
        fill = tally.total > 0 && tally.done >= tally.total ? shade(C.go, 1.55) : C.paper;
      }
      shown.push(`${chip.kind}:${text}`);
      if (chip.value && chip.value.text !== text) chip.value.text = text;
      if (chip.value)
        chip.value.style.fill = chip.kind === 'clock' && this.state.timeUp ? C.white : C.ink;
      chip.panel
        .clear()
        .roundRect(3, 3, chip.width, HUD_CHIP_HEIGHT, 10)
        .fill({ color: C.ink })
        .roundRect(0, 0, chip.width, HUD_CHIP_HEIGHT, 10)
        .fill({ color: fill })
        .stroke({ color: C.ink, width: 3 });
    }
    // e2e / tests: every chip as the child reads it, e.g. `neutralize:0/160`.
    this.app.canvas.dataset.robotChips = shown.join(' | ');
  }

  /** Per frame: the clock counts down while an action plays; a run out of time blinks it. */
  private tickHud(still: boolean): void {
    const clockChip = this.chips.find((chip) => chip.kind === 'clock');
    if (!clockChip) return;
    const shown = String(secondsLeft(this.config, Math.round(this.clockT)));
    if (this.app.canvas.dataset.robotClockShown !== shown) this.updateHud();
    clockChip.box.alpha =
      this.state.timeUp && !still && Math.floor(this.clock / 260) % 2 === 1 ? 0.55 : 1;
  }
}

/** The icon of a job chip: a fence, a neutraliser or a pollution block of the board's colour. */
function jobTexture(kind: Exclude<JobKind, 'home'>, config: RobotLabConfig): Texture {
  if (kind === 'contain') return blockTexture({ kind: 'fence' });
  const blocks = [...(config.startHolding ? [config.startHolding] : []), ...(config.blocks ?? [])];
  const wanted = kind === 'neutralize' ? 'neutralizer' : 'pollution';
  const first = blocks.find((block) => block.kind === wanted);
  const color: RobotColor = first && first.kind !== 'fence' ? first.color : 'RED';
  return blockTexture({ kind: wanted, color });
}
