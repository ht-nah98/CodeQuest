import {
  AnimatedSprite,
  type Application,
  Container,
  Graphics,
  Sprite,
  type Texture,
  type Ticker,
} from 'pixi.js';
import type { RunOutcome } from '@codequest/engine';
import { DEFAULT_SCENE_THEME, type GoalSprite, type SceneTheme } from '@codequest/content-schema';
import type { GoalItemKind, MazeCell, MazeConfig, MazeDir, MazeEvent } from '@codequest/games';
import { UI_COLORS } from '../../ui/tokens';
import type { PandaTextures } from '../assets';
import { shade } from '../colors';
import { reducedMotion } from '../motion';
import type { PandaAnimation } from '../panda';
import { goalArtFor, goalScale, ITEM_ART } from '../goalArt';
import { createPanda, type Panda } from '../pandaSprite';
import { sceneArt } from '../sceneThemes';
import { goalTexture, pixelTexture } from '../tiles';
import { isAborted, type PandaAnimationListener, type StageRenderer, tween } from '../types';
import {
  arrowDistance,
  BORDER_CELLS,
  cellCenter,
  cellKey,
  cellsOf,
  computeMazeLayout,
  dirAngle,
  facingSign,
  HUD_GAP,
  HUD_MARGIN,
  HUD_PAD,
  hudLayout,
  type MazeLayout,
  remainingBamboo,
  stepCell,
  turnDelta,
} from './layout';
import { PATTERNS, type PatternName, patternPixels } from './pixelArt';

/** Durations at speed 1, in ms. */
const MS = {
  move: 460,
  turn: 420,
  lunge: 190,
  recoil: 280,
  daze: 720,
  collect: 480,
  cheer: 1100,
  dizzy: 1500,
} as const;

/** How far Măng leans into a wall before bouncing off, in cells. */
const LUNGE = 0.3;
const TURN_HOP = 0.14;
const CHEER_HOP = 0.25;
/** Every odd cell (checkerboard) and the outer wall ring are a shade darker (sprite tints). */
const ODD_CELL_TINT = shade(UI_COLORS.white, 0.94);
const RING_TINT = shade(UI_COLORS.white, 0.74);
/** A locked goal (collectAll with bamboo left) is tinted towards the brand lavender. */
const LOCKED_TINT = UI_COLORS.brand;
const NO_TINT = UI_COLORS.white;
/** Flag waving speed (frames per 60 fps tick): calm, and fast while Măng cheers. */
const FLAG_SPEED = 3 / 60;
const FLAG_SPEED_WIN = 8 / 60;
/** Run-end reasons that mean "a mission item is still on the map" (P2-11c, ADR-0019). */
const NEED_REASONS: ReadonlySet<string> = new Set(['NEED_KEY', 'NEED_FRIEND']);
/** How far behind Măng the friend walks once picked up, in cells. */
const FOLLOW_GAP = 0.5;
/** Hard drop shadow under the board, in px (art-direction.md §4: hard shadows, no blur). */
const BOARD_SHADOW = 6;

interface Pose {
  /** Position in cells (fractional while moving). */
  row: number;
  col: number;
  /** Height above the floor, in cells (hops). */
  lift: number;
  /** Side Măng looks to (her frames are side views): +1 right, −1 left; in between while flipping. */
  facing: number;
  /** Angle of the facing arrow (radians) and its distance from Măng's cell centre (cells). */
  arrowAngle: number;
  arrowDist: number;
  /** Lean towards the arrow (cells), used for the bump. */
  lean: number;
}

interface Particle {
  sprite: Sprite;
  /** Cells and cells per ms; `gravity` in cells per ms². */
  row: number;
  col: number;
  vRow: number;
  vCol: number;
  gravity: number;
  age: number;
  life: number;
}

type MazeTextures = Record<PatternName, Texture>;

/** Maze textures of each theme, made once per theme and kept for the session (like goal art). */
const textureCache = new Map<SceneTheme, MazeTextures>();

/**
 * The maze tiles of `theme` (stage-rendering.md §7): its own floor and wall (sceneTiles.ts) and
 * the shared pieces (shoot, goal pad, flag, arrow, sparkle) that look the same in every theme.
 */
function mazeTextures(theme: SceneTheme): MazeTextures {
  const cached = textureCache.get(theme);
  if (cached) return cached;
  const art = sceneArt(theme).maze;
  const textures = {} as MazeTextures;
  for (const name of Object.keys(PATTERNS) as PatternName[]) {
    const own = name === 'floor' || name === 'wall' ? art.patterns?.[name] : undefined;
    textures[name] = pixelTexture(
      own ? patternPixels(own, art.palette) : patternPixels(PATTERNS[name]),
    );
  }
  textureCache.set(theme, textures);
  return textures;
}

/** Whole zoom of an item picture inside a cell: a little smaller than the cell. */
function itemScale(texels: number, cellPx: number): number {
  return Math.max(1, Math.floor((cellPx * 0.8) / texels));
}

/**
 * Maze stage (game-kind-sdk.md §1.2): a top-down grid of path and bamboo walls inside a wall ring,
 * bamboo shoots, the goal flag, and Măng replaying move / turn / bump / collect / win events.
 * Măng only has side-view frames (P0-08 has not drawn front/back walks yet), so she flips for E/W
 * and a big blue arrow on the floor always shows where she faces.
 */
export class MazeStage implements StageRenderer<MazeEvent> {
  private readonly textures: MazeTextures;
  /** The world's scenery (P2-23): floor, wall and the canvas around the board. */
  private readonly theme: SceneTheme;
  private readonly world = new Container();
  private readonly board = new Container();
  private readonly items = new Container();
  private readonly shadow = new Graphics();
  private readonly panda: Panda;
  private readonly arrow: Sprite;
  private readonly fx = new Container();
  private readonly flash = new Graphics();
  /** Static outlines around missed bamboo (also the whole cue under reduced motion). */
  private readonly marks = new Graphics();
  private readonly hud = new Container();
  /** The goal: the waving flag, or the level's goal picture (`goalSprite`) as one frame. */
  private readonly flag: AnimatedSprite;
  private readonly goalSprite: GoalSprite | undefined;
  private readonly goalPad: Sprite;
  private readonly bamboo = new Map<string, Sprite>();
  /** Mission items (P2-11c) by cell key, in config order; picked-up ones are in `takenItems`. */
  private readonly itemSprites = new Map<string, Sprite>();
  private readonly itemKinds: ReadonlyMap<string, GoalItemKind>;
  private takenItems = new Set<string>();
  /** The friend walking behind Măng once picked up (escort levels). */
  private readonly follower: Sprite;
  private following = false;
  /** NEED_KEY / NEED_FRIEND at the end of a run: the missing items and the locked goal pulse. */
  private needPulse = false;
  /** Spin while dizzy (radians), on top of Măng's facing side. */
  private spin = 0;
  private readonly dizzyStars: Sprite[] = [];
  private particles: Particle[] = [];
  private readonly start: MazeCell;
  private readonly goal: MazeCell;
  private readonly bambooCells: MazeCell[];
  private layout: MazeLayout;
  private pose: Pose;
  private collected = new Set<string>();
  /** Last direction acted out (the arrow's resting direction). */
  private dir: MazeDir;
  private moving = false;
  private stunned = false;
  /** Won: the arrow is put away while Măng cheers. */
  private cheering = false;
  /** Pulses the bamboo left on the field (Măng waits on the goal with bamboo missing). */
  private missedPulse = false;
  private flashAt: MazeCell | null = null;
  private flashAlpha = 0;
  private shake = 0;
  /** Stage clock in ms (scaled by ticker speed), for idle bobbing and orbits. */
  private clock = 0;
  private flagSpeed = FLAG_SPEED;
  /** Set by destroy(): a replay still awaiting a tween must not touch the scene afterwards. */
  private destroyed = false;

  constructor(
    private readonly app: Application,
    private readonly config: MazeConfig,
    pandaTextures: PandaTextures,
    private readonly onAnimation?: PandaAnimationListener,
    goalSprite?: GoalSprite,
    theme?: SceneTheme,
  ) {
    this.goalSprite = goalSprite;
    this.theme = theme ?? DEFAULT_SCENE_THEME;
    this.textures = mazeTextures(this.theme);
    app.canvas.dataset.theme = this.theme;
    this.itemKinds = new Map(
      (config.goal?.items ?? []).map((item) => [cellKey(item.at), item.kind] as const),
    );
    this.start = cellsOf(config.map, 'S')[0] ?? [0, 0];
    this.goal = cellsOf(config.map, 'G')[0] ?? [0, 0];
    this.bambooCells = cellsOf(config.map, 'b');
    this.dir = config.startDir;
    this.pose = this.startPose();
    this.layout = this.computeLayout(app.screen.width, app.screen.height);

    this.goalPad = new Sprite(this.textures.goalPad);
    const art = goalArtFor(goalSprite, false);
    this.flag = new AnimatedSprite({
      textures: art ? [goalTexture(art)] : [this.textures.flag1, this.textures.flag2],
      animationSpeed: 3 / 60,
      autoUpdate: false,
    });
    this.flag.play();
    this.items.addChild(this.goalPad, this.flag);
    for (const cell of this.bambooCells) {
      const sprite = new Sprite(this.textures.bamboo);
      sprite.anchor.set(0.5);
      this.bamboo.set(cellKey(cell), sprite);
      this.items.addChild(sprite);
    }
    for (const [key, kind] of this.itemKinds) {
      const sprite = new Sprite(goalTexture(ITEM_ART[kind]));
      sprite.anchor.set(0.5);
      this.itemSprites.set(key, sprite);
      this.items.addChild(sprite);
    }
    this.follower = new Sprite(goalTexture(ITEM_ART.friend));
    this.follower.anchor.set(0.5, 1);
    this.follower.visible = false;
    for (let i = 0; i < 3; i++) {
      const star = new Sprite(this.textures.sparkle);
      star.anchor.set(0.5);
      star.visible = false;
      this.dizzyStars.push(star);
    }

    this.panda = createPanda(pandaTextures);
    this.arrow = new Sprite(this.textures.arrow);
    this.arrow.anchor.set(0.5);
    this.fx.addChild(this.arrow, ...this.dizzyStars);
    this.world.addChild(
      this.board,
      this.flash,
      this.marks,
      this.items,
      this.shadow,
      this.follower,
      this.panda.sprite,
      this.fx,
    );
    app.stage.addChild(this.world, this.hud);
    this.build();
    this.reset();
    app.ticker.add(this.onTick);
  }

  reset(): void {
    this.pose = this.startPose();
    this.dir = this.config.startDir;
    this.collected = new Set();
    this.takenItems = new Set();
    this.following = false;
    this.needPulse = false;
    this.spin = 0;
    this.moving = false;
    this.stunned = false;
    this.cheering = false;
    this.missedPulse = false;
    this.app.canvas.dataset.dizzy = 'false';
    this.flashAt = null;
    this.flashAlpha = 0;
    this.shake = 0;
    this.flagSpeed = FLAG_SPEED;
    for (const particle of this.particles) particle.sprite.destroy();
    this.particles = [];
    for (const sprite of [...this.bamboo.values(), ...this.itemSprites.values()]) {
      sprite.visible = true;
      sprite.alpha = 1;
    }
    this.placeItems();
    this.updateHud();
    this.setAnimation('idle');
    this.syncState();
  }

  rest(): void {
    if (this.stunned || this.destroyed) return;
    // Also restarts the idle loop frozen by hold().
    if (this.panda.animation !== 'idle' || !this.panda.sprite.playing) this.setAnimation('idle');
  }

  /**
   * End of a run: MISSED_ITEMS marks the bamboo left on the field, NEED_KEY / NEED_FRIEND the
   * mission items left and the locked goal (Măng waits on the goal).
   */
  finish(outcome: RunOutcome<MazeEvent>): void {
    if (this.destroyed) return;
    this.missedPulse = outcome.reasonCode === 'MISSED_ITEMS';
    this.needPulse = NEED_REASONS.has(outcome.reasonCode ?? '');
    this.syncState();
  }

  /**
   * TIMEOUT (P2-11 T8): the loop never stops, so Măng spins round twice with stars over her
   * head, then stays dazed until reset. Reduced motion: no spin, the stars stand still.
   */
  async dizzy(signal: AbortSignal): Promise<void> {
    if (this.destroyed) return;
    this.app.canvas.dataset.dizzy = 'true';
    this.stunned = true;
    this.moving = false;
    this.setAnimation('jump');
    this.syncState();
    const spins = reducedMotion() ? 0 : 2;
    await tween(this.app.ticker, MS.dizzy, signal, (t) => {
      const ease = 1 - (1 - t) * (1 - t);
      this.spin = ease * spins * 2 * Math.PI;
      this.pose.lift = spins === 0 ? 0 : 0.08 * Math.abs(Math.sin(t * Math.PI * 4));
    });
    if (this.stopped(signal)) return;
    this.spin = 0;
    this.pose.lift = 0;
    this.setAnimation('crouch');
  }

  hold(): void {
    this.panda.sprite.stop();
  }

  estimate(event: MazeEvent): number {
    switch (event.type) {
      case 'move':
        return MS.move;
      case 'turn':
        return MS.turn;
      case 'bump':
        return MS.lunge + MS.recoil + MS.daze;
      case 'collect':
        return MS.collect;
      case 'win':
        return MS.cheer;
    }
  }

  async play(event: MazeEvent, signal: AbortSignal): Promise<void> {
    if (this.destroyed) return;
    const ticker = this.app.ticker;
    this.missedPulse = false;
    this.needPulse = false;
    switch (event.type) {
      case 'move': {
        const [r0, c0] = event.from;
        const [r1, c1] = event.to;
        this.faceTowards(event.dir);
        this.setAnimation('walk');
        this.moving = true;
        await tween(ticker, MS.move, signal, (t) => {
          this.pose.row = r0 + t * (r1 - r0);
          this.pose.col = c0 + t * (c1 - c0);
        });
        if (this.stopped(signal)) return;
        this.moving = false;
        return;
      }
      case 'turn': {
        const fromAngle = dirAngle(event.from);
        const delta = turnDelta(event.from, event.to);
        const fromDist = arrowDistance(event.from);
        const toDist = arrowDistance(event.to);
        const fromFacing = this.pose.facing;
        const toFacing = facingSign(event.to, fromFacing < 0 ? -1 : 1);
        this.setAnimation('idle');
        await tween(ticker, MS.turn, signal, (t) => {
          const ease = t * t * (3 - 2 * t);
          this.pose.arrowAngle = fromAngle + delta * ease;
          this.pose.arrowDist = fromDist + (toDist - fromDist) * ease;
          this.pose.lift = TURN_HOP * Math.sin(Math.PI * t);
          // Flipping sides: squash through zero width, like spinning round.
          this.pose.facing =
            toFacing === fromFacing ? fromFacing : fromFacing * Math.cos(Math.PI * ease);
        });
        if (this.stopped(signal)) return;
        this.pose.lift = 0;
        this.dir = event.to;
        this.pose.facing = toFacing;
        this.pose.arrowAngle = dirAngle(event.to);
        this.pose.arrowDist = toDist;
        return;
      }
      case 'bump': {
        this.faceTowards(event.dir);
        const wall = stepCell(event.at, event.dir);
        this.setAnimation('walk');
        await tween(ticker, MS.lunge, signal, (t) => {
          this.pose.lean = LUNGE * t * t;
        });
        if (this.stopped(signal)) return;
        // Bonk: the wall flashes, the board shakes, sparks fly off the contact point.
        this.flashAt = wall;
        this.flashAlpha = 0.85;
        if (!reducedMotion()) this.shake = 1;
        this.burst(
          event.at[0] + (wall[0] - event.at[0]) * 0.5,
          event.at[1] + (wall[1] - event.at[1]) * 0.5,
          6,
          0.0035,
          420,
        );
        this.setAnimation('jump'); // arms up: surprised
        await tween(ticker, MS.recoil, signal, (t) => {
          this.pose.lean = LUNGE * (1 - t) - 0.12 * Math.sin(Math.PI * t);
          this.pose.lift = 0.18 * Math.sin(Math.PI * t);
        });
        if (this.stopped(signal)) return;
        this.pose.lean = 0;
        this.pose.lift = 0;
        // Dazed until the stage is reset: crouched, stars circling her head.
        this.stunned = true;
        this.setAnimation('crouch');
        this.syncState();
        await tween(ticker, MS.daze, signal);
        return;
      }
      case 'collect': {
        const key = cellKey(event.at);
        const isItem = event.item !== undefined;
        const sprite = isItem ? this.itemSprites.get(key) : this.bamboo.get(key);
        // Mission items have their own set: they never count as bamboo (ADR-0019).
        if (isItem) this.takenItems.add(key);
        else this.collected.add(key);
        this.setAnimation('happy');
        this.burst(event.at[0] - 0.3, event.at[1], 5, 0.0022, 520);
        this.updateHud();
        if (sprite) {
          const { cellPx } = this.layout;
          const base = cellCenter(this.layout, event.at[0], event.at[1]);
          const scale = this.layout.tileScale;
          await tween(ticker, MS.collect, signal, (t) => {
            sprite.position.set(base.x, base.y - t * cellPx * 0.9);
            sprite.scale.set(scale * (1 + 0.5 * t));
            sprite.alpha = 1 - t * t;
          });
          // Làm lại / Dừng aborts first and reset() shows every shoot again: leave them be.
          if (this.stopped(signal)) return;
          sprite.visible = false;
        }
        if (event.item === 'friend') this.following = true;
        this.updateGoalLock(true);
        this.syncState();
        return;
      }
      case 'win': {
        const [r, c] = event.at;
        this.pose.row = r;
        this.pose.col = c;
        this.cheering = true;
        this.setAnimation('cheer');
        this.flagSpeed = FLAG_SPEED_WIN;
        this.flag.animationSpeed = FLAG_SPEED_WIN;
        this.burst(r - 0.4, c, 10, 0.004, 900);
        await tween(ticker, MS.cheer, signal, (t) => {
          const hop = (t * 2) % 1;
          this.pose.lift = CHEER_HOP * 4 * hop * (1 - hop);
        });
        if (this.stopped(signal)) return;
        this.pose.lift = 0;
        return;
      }
    }
  }

  resize(width: number, height: number): void {
    if (this.destroyed) return;
    this.layout = this.computeLayout(width, height);
    this.build();
    this.placeItems();
    this.updateHud();
  }

  destroy(): void {
    this.destroyed = true;
    this.app.ticker.remove(this.onTick);
  }

  /** Whether a replay step must stop touching the scene: aborted, or the stage destroyed. */
  private stopped(signal: AbortSignal): boolean {
    return isAborted(signal) || this.destroyed;
  }

  private computeLayout(width: number, height: number): MazeLayout {
    const { map } = this.config;
    // Mission items alone (1–2 icons) sit over the margin left of the centred board: reserving a
    // band for them would cost a whole tile scale on short stages (multi-map tabs + mission line).
    const band =
      this.bambooCells.length === 0
        ? 0
        : hudLayout(this.bambooCells.length + this.itemKinds.size, width).band;
    return computeMazeLayout(map.length, map[0]?.length ?? 0, width, height, band);
  }

  /**
   * Mirrors what the stage shows as data attributes on the canvas, for e2e tests:
   * shoots still on the board, collected/total, goal lock, the missed cue and the daze.
   */
  private syncState(): void {
    const data = this.app.canvas.dataset;
    let onBoard = 0;
    for (const sprite of this.bamboo.values()) if (sprite.visible) onBoard++;
    data.mazeShoots = String(onBoard);
    data.mazeCollected = `${String(this.collected.size)}/${String(this.bambooCells.length)}`;
    data.mazeGoal = this.goalLocked() ? 'locked' : 'open';
    data.mazeMissed = String(this.missedPulse);
    data.mazeStunned = String(this.stunned);
    if (this.itemKinds.size > 0) {
      data.mazeItems = `${String(this.takenItems.size)}/${String(this.itemKinds.size)}`;
      data.mazeNeed = String(this.needPulse);
      data.mazeFollower = String(this.following);
    } else {
      // Another map of the level may have set them on the shared canvas.
      delete data.mazeItems;
      delete data.mazeNeed;
      delete data.mazeFollower;
    }
  }

  /** A cage opens only with its key: the level has mission items and every one is taken. */
  private itemsAllTaken(): boolean {
    return this.itemKinds.size > 0 && this.takenItems.size === this.itemKinds.size;
  }

  /** Whether the goal does not count yet: bamboo left (collectAll) or mission items left. */
  private goalLocked(): boolean {
    if (this.takenItems.size < this.itemKinds.size) return true;
    return (
      this.config.goal?.collectAll === true &&
      remainingBamboo(this.config.map, this.collected).length > 0
    );
  }

  private startPose(): Pose {
    const [row, col] = this.start;
    const dir = this.config.startDir;
    return {
      row,
      col,
      lift: 0,
      facing: dir === 'W' ? -1 : 1,
      arrowAngle: dirAngle(dir),
      arrowDist: arrowDistance(dir),
      lean: 0,
    };
  }

  /** Snaps the arrow (and Măng's side) to `dir`, for events that act in a direction. */
  private faceTowards(dir: MazeDir): void {
    this.dir = dir;
    this.pose.facing = facingSign(dir, this.pose.facing < 0 ? -1 : 1);
    this.pose.arrowAngle = dirAngle(dir);
    this.pose.arrowDist = arrowDistance(dir);
  }

  private setAnimation(animation: PandaAnimation): void {
    this.panda.play(animation);
    this.onAnimation?.(animation);
  }

  /** Sparkles flying out of cell (row, col): `count` evenly spread, `speed` in cells per ms. */
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
        gravity: 0.000006,
        age: 0,
        life,
      });
    }
  }

  private readonly onTick = (ticker: Ticker): void => {
    const dt = ticker.deltaMS;
    this.clock += dt;
    this.panda.update(ticker);
    this.flag.update(ticker);
    const { layout, pose } = this;
    const { cellPx, tileScale } = layout;

    // Măng: lean is along the facing arrow (towards the wall when bumping).
    const leanRow = Math.sin(pose.arrowAngle) * pose.lean;
    const leanCol = Math.cos(pose.arrowAngle) * pose.lean;
    const centre = cellCenter(layout, pose.row + leanRow, pose.col + leanCol);
    const feetY = centre.y + layout.feetOffset;
    const sprite = this.panda.sprite;
    sprite.position.set(centre.x, feetY - pose.lift * cellPx);
    // Spinning (dizzy): the side view narrows through zero width and flips, like turning round.
    const turn = Math.cos(this.spin);
    const spinX = Math.abs(turn) < 0.08 ? Math.sign(turn || 1) * 0.08 : turn;
    sprite.scale.set(layout.pandaScale * pose.facing * spinX, layout.pandaScale);

    // The friend walks behind Măng, on the side away from her facing arrow.
    this.follower.visible = this.following;
    if (this.following) {
      const art = ITEM_ART.friend;
      const behind = cellCenter(
        layout,
        pose.row - Math.sin(pose.arrowAngle) * FOLLOW_GAP,
        pose.col - Math.cos(pose.arrowAngle) * FOLLOW_GAP,
      );
      const hop = this.moving && !reducedMotion() ? Math.abs(Math.sin(this.clock / 90)) : 0;
      this.follower.scale.set(Math.max(1, Math.floor((cellPx * 0.75) / art.rows.length)));
      this.follower.position.set(
        Math.round(behind.x),
        Math.round(behind.y + layout.feetOffset - hop * cellPx * 0.08),
      );
    }

    const shadowScale = 1 - pose.lift * 0.8;
    this.shadow
      .clear()
      .ellipse(centre.x, feetY - tileScale, cellPx * 0.32 * shadowScale, cellPx * 0.1 * shadowScale)
      .fill({ color: UI_COLORS.ink, alpha: 0.22 });

    // The facing arrow, bobbing gently when Măng stands still.
    const still = reducedMotion();
    const bob = this.moving || this.stunned || still ? 0 : 0.06 * Math.sin(this.clock / 170);
    const dist = pose.arrowDist + bob;
    const base = cellCenter(layout, pose.row, pose.col);
    this.arrow.position.set(
      base.x + Math.cos(pose.arrowAngle) * dist * cellPx,
      base.y + Math.sin(pose.arrowAngle) * dist * cellPx,
    );
    this.arrow.rotation = pose.arrowAngle;
    this.arrow.scale.set(tileScale);
    this.arrow.alpha = this.cheering ? 0 : this.stunned ? 0.45 : 1;

    // Dizzy stars orbit her head while stunned.
    const head = { x: centre.x, y: feetY - cellPx * 1.38 };
    this.dizzyStars.forEach((star, i) => {
      star.visible = this.stunned;
      if (!this.stunned) return;
      const spin = still ? -Math.PI / 2 : this.clock / 220;
      const a = spin + (i * 2 * Math.PI) / this.dizzyStars.length;
      star.position.set(head.x + Math.cos(a) * cellPx * 0.42, head.y + Math.sin(a) * cellPx * 0.13);
      star.scale.set(tileScale);
    });

    // Missed bamboo: a pink frame round each one, and a hop to say "you forgot me".
    this.marks.clear();
    for (const [key, shoot] of this.bamboo) {
      if (!shoot.visible || this.collected.has(key)) continue;
      const [r, c] = key.split(',').map(Number) as [number, number];
      const at = cellCenter(layout, r, c);
      const pulse = this.missedPulse && !still ? Math.abs(Math.sin(this.clock / 160)) : 0;
      shoot.position.set(at.x, at.y - pulse * cellPx * 0.22);
      shoot.scale.set(tileScale * (1 + 0.25 * pulse));
      shoot.tint = pulse > 0.5 ? UI_COLORS.hint : NO_TINT;
      if (this.missedPulse) {
        const inset = tileScale;
        this.marks
          .rect(
            at.x - cellPx / 2 + inset,
            at.y - cellPx / 2 + inset,
            cellPx - 2 * inset,
            cellPx - 2 * inset,
          )
          .stroke({ color: UI_COLORS.hint, width: 2 * tileScale, alignment: 1 })
          .rect(at.x - cellPx / 2, at.y - cellPx / 2, cellPx, cellPx)
          .stroke({ color: UI_COLORS.ink, width: tileScale, alignment: 1 });
      }
    }

    // NEED_KEY / NEED_FRIEND: the items left hop with a pink frame, like missed bamboo.
    for (const [key, item] of this.itemSprites) {
      if (!item.visible || this.takenItems.has(key)) continue;
      const [r, c] = key.split(',').map(Number) as [number, number];
      const at = cellCenter(layout, r, c);
      const pulse = this.needPulse && !still ? Math.abs(Math.sin(this.clock / 160)) : 0;
      item.position.set(at.x, at.y - pulse * cellPx * 0.22);
      const art = ITEM_ART[this.itemKinds.get(key) ?? 'key'];
      item.scale.set(itemScale(art.rows.length, cellPx) * (1 + 0.25 * pulse));
      if (this.needPulse) {
        this.marks
          .rect(
            at.x - cellPx / 2 + tileScale,
            at.y - cellPx / 2 + tileScale,
            cellPx - 2 * tileScale,
            cellPx - 2 * tileScale,
          )
          .stroke({ color: UI_COLORS.hint, width: 2 * tileScale, alignment: 1 })
          .rect(at.x - cellPx / 2, at.y - cellPx / 2, cellPx, cellPx)
          .stroke({ color: UI_COLORS.ink, width: tileScale, alignment: 1 });
      }
    }
    if (this.needPulse) {
      const blink = still || Math.floor(this.clock / 300) % 2 === 0;
      this.flag.alpha = blink ? 0.6 : 0.25;
    }

    for (const particle of this.particles) {
      particle.age += dt;
      particle.vRow += particle.gravity * dt;
      particle.row += particle.vRow * dt;
      particle.col += particle.vCol * dt;
      const at = cellCenter(layout, particle.row, particle.col);
      particle.sprite.position.set(at.x, at.y);
      particle.sprite.scale.set(Math.max(1, tileScale - 1));
      particle.sprite.alpha = Math.max(0, 1 - particle.age / particle.life);
    }
    const done = this.particles.filter((particle) => particle.age >= particle.life);
    if (done.length > 0) {
      for (const particle of done) particle.sprite.destroy();
      this.particles = this.particles.filter((particle) => particle.age < particle.life);
    }

    this.flash.clear();
    if (this.flashAt && this.flashAlpha > 0) {
      const [r, c] = this.flashAt;
      const at = cellCenter(layout, r, c);
      this.flash
        .rect(at.x - cellPx / 2, at.y - cellPx / 2, cellPx, cellPx)
        .fill({ color: UI_COLORS.white, alpha: this.flashAlpha })
        .rect(at.x - cellPx / 2, at.y - cellPx / 2, cellPx, cellPx)
        .stroke({ color: UI_COLORS.oops, width: 2 * tileScale, alignment: 1 });
      this.flashAlpha = Math.max(0, this.flashAlpha - dt / 600);
    }

    if (this.shake > 0) this.shake = still ? 0 : Math.max(0, this.shake - dt / 320);
    const wobble = this.shake > 0 ? Math.round(Math.sin(this.clock / 18) * 5 * this.shake) : 0;
    this.world.position.set(wobble, 0);
  };

  /** (Re)draws the board for the current layout: background, path, walls and the wall ring. */
  private build(): void {
    const { layout, textures } = this;
    const { map } = this.config;
    const { cellPx, tileScale, rows, cols } = layout;
    for (const child of this.board.removeChildren()) child.destroy();

    const background = new Graphics()
      .rect(0, 0, layout.width, layout.height)
      .fill({ color: sceneArt(this.theme).maze.background });
    const left = layout.originX - BORDER_CELLS * cellPx;
    const top = layout.originY - BORDER_CELLS * cellPx;
    const gridW = (cols + 2 * BORDER_CELLS) * cellPx;
    const gridH = (rows + 2 * BORDER_CELLS) * cellPx;
    background
      .rect(left + BOARD_SHADOW, top + BOARD_SHADOW, gridW, gridH)
      .fill({ color: UI_COLORS.ink })
      .rect(left - 2, top - 2, gridW + 4, gridH + 4)
      .fill({ color: UI_COLORS.ink });
    this.board.addChild(background);

    for (let r = -BORDER_CELLS; r < rows + BORDER_CELLS; r++) {
      for (let c = -BORDER_CELLS; c < cols + BORDER_CELLS; c++) {
        const tile = map[r]?.[c];
        const isWall = tile === undefined || tile === '#';
        const sprite = new Sprite(isWall ? textures.wall : textures.floor);
        sprite.scale.set(tileScale);
        sprite.position.set(layout.originX + c * cellPx, layout.originY + r * cellPx);
        if (tile === undefined) sprite.tint = RING_TINT;
        else if (!isWall && (r + c) % 2 === 1) sprite.tint = ODD_CELL_TINT;
        this.board.addChild(sprite);
      }
    }
  }

  /** Positions the goal and the bamboo still on the field. */
  private placeItems(): void {
    const { layout } = this;
    const { cellPx, tileScale } = layout;
    const [gr, gc] = this.goal;
    this.goalPad.scale.set(tileScale);
    this.goalPad.position.set(layout.originX + gc * cellPx, layout.originY + gr * cellPx);
    const art = goalArtFor(this.goalSprite, this.itemsAllTaken());
    if (art) {
      // A goal picture fills the cell (12 texels) or sits centred in it (the 16-texel friend).
      const scale = goalScale(art, cellPx);
      const inset = (cellPx - art.rows.length * scale) / 2;
      this.flag.scale.set(scale);
      this.flag.position.set(
        Math.round(layout.originX + gc * cellPx + inset),
        Math.round(layout.originY + gr * cellPx + inset),
      );
    } else {
      this.flag.scale.set(tileScale);
      // Pole (texels 2–3 of the flag) a little left of the centre; base near the cell's bottom.
      this.flag.position.set(
        layout.originX + gc * cellPx + 2 * tileScale,
        layout.originY + gr * cellPx - 1 * tileScale,
      );
    }
    this.flag.animationSpeed = this.flagSpeed;
    // Visibility is left alone: a shoot rising out of its cell finishes its own animation.
    for (const [key, sprite] of this.bamboo) {
      const [r, c] = key.split(',').map(Number) as [number, number];
      const at = cellCenter(layout, r, c);
      sprite.position.set(at.x, at.y);
      sprite.scale.set(tileScale);
    }
    for (const [key, sprite] of this.itemSprites) {
      const [r, c] = key.split(',').map(Number) as [number, number];
      const at = cellCenter(layout, r, c);
      sprite.position.set(at.x, at.y);
      const art = ITEM_ART[this.itemKinds.get(key) ?? 'key'];
      sprite.scale.set(itemScale(art.rows.length, cellPx));
    }
    this.updateGoalLock(false);
  }

  /**
   * With `collectAll` or mission items, the goal is greyed out until everything is picked up;
   * a cage shows open once its key is taken (P2-11c).
   */
  private updateGoalLock(celebrate: boolean): void {
    const locked = this.goalLocked();
    const wasLocked = this.flag.alpha < 1;
    const art = goalArtFor(this.goalSprite, this.itemsAllTaken());
    if (art && this.goalSprite === 'cage') this.flag.textures = [goalTexture(art)];
    this.flag.tint = locked ? LOCKED_TINT : NO_TINT;
    this.goalPad.tint = locked ? LOCKED_TINT : NO_TINT;
    this.flag.alpha = locked ? 0.6 : 1;
    if (locked) this.flag.gotoAndStop(0);
    else if (!this.flag.playing) this.flag.play();
    if (celebrate && wasLocked && !locked)
      this.burst(this.goal[0] - 0.2, this.goal[1], 6, 0.003, 600);
  }

  /**
   * Counter (top-left, in its own band): one shoot per `b` on the map, lit once collected, then
   * one icon per mission item (key, friend), lit once picked up.
   */
  private updateHud(): void {
    for (const child of this.hud.removeChildren()) child.destroy();
    const shoots = this.bambooCells.length;
    const itemKeys = [...this.itemKinds.keys()];
    const total = shoots + itemKeys.length;
    const hud = hudLayout(total, this.layout.width);
    if (hud.scale === 0) return;
    const panel = new Graphics()
      .roundRect(HUD_MARGIN + 3, HUD_MARGIN + 3, hud.panelWidth, hud.panelHeight, 10)
      .fill({ color: UI_COLORS.ink })
      .roundRect(HUD_MARGIN, HUD_MARGIN, hud.panelWidth, hud.panelHeight, 10)
      .fill({ color: UI_COLORS.paper })
      .stroke({ color: UI_COLORS.ink, width: 3 });
    this.hud.addChild(panel);
    const step = hud.iconPx + HUD_GAP;
    for (let i = 0; i < total; i++) {
      const itemKey = i < shoots ? undefined : itemKeys[i - shoots];
      const kind = itemKey === undefined ? undefined : this.itemKinds.get(itemKey);
      const art = kind === undefined ? null : ITEM_ART[kind];
      const sprite = new Sprite(art ? goalTexture(art) : this.textures.bamboo);
      const got = itemKey === undefined ? i < this.collected.size : this.takenItems.has(itemKey);
      // The 16-texel friend fits the 12-texel icon box at a smaller whole zoom.
      const scale = art ? Math.max(1, Math.floor(hud.iconPx / art.rows.length)) : hud.scale;
      const inset = art ? (hud.iconPx - art.rows.length * scale) / 2 : 0;
      sprite.scale.set(scale);
      sprite.position.set(
        HUD_MARGIN + HUD_PAD + (i % hud.perRow) * step + inset,
        HUD_MARGIN + HUD_PAD + Math.floor(i / hud.perRow) * step + inset,
      );
      sprite.alpha = got ? 1 : 0.3;
      sprite.tint = got ? NO_TINT : UI_COLORS.inkSoft;
      this.hud.addChild(sprite);
    }
  }
}
