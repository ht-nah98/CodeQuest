import { type AnimatedSprite, type Application, Container, Graphics, type Ticker } from 'pixi.js';
import type { RunnerConfig, RunnerEvent } from '@codequest/games';
import { UI_COLORS } from '../../ui/tokens';
import type { PandaTextures, TileTextures } from '../assets';
import type { PandaAnimation } from '../panda';
import { createPanda, type Panda } from '../pandaSprite';
import { createFlag, tileSprite } from '../tiles';
import { isAborted, type PandaAnimationListener, type StageRenderer, tween } from '../types';
import { CELL_TILES, cameraX, cellCenterX, computeRunnerLayout, type RunnerLayout } from './layout';

/** Durations at speed 1, in ms. */
const MS = {
  walk: 520,
  crouch: 90,
  jump: 640,
  land: 90,
  fall: 750,
  offTrackFall: 650,
  cheer: 1100,
  shake: 260,
} as const;

/** Margin ground outside the track: darker, desaturated dirt. */
const MARGIN_TINT = 0x9c8f96;
/** Every odd track cell is drawn a shade darker. */
const ODD_CELL_TINT = 0xdcd2d2;

/** Jump arc height and cheer hop height, in cells. */
const JUMP_HEIGHT = 0.85;
const CHEER_HOP = 0.22;

interface PandaPose {
  /** Position along the track, in cells (fractional while moving). */
  cell: number;
  /** Height above the ground, in cells. */
  lift: number;
  /** Depth below the ground line, in px (falling). */
  sink: number;
}

/**
 * Runner stage (game-kind-sdk.md §1.1): a ground strip with holes and the flag, and Măng
 * replaying walk / jump / fall / offTrack / win events. Positions are kept in cells and turned
 * into pixels every frame, so a resize in the middle of a move stays correct.
 */
export class RunnerStage implements StageRenderer<RunnerEvent> {
  private readonly world = new Container();
  private readonly sky = new Container();
  private readonly terrain = new Container();
  private readonly panda: Panda;
  /** Pits are drawn behind Măng; while she falls she moves behind the ground tiles too. */
  private readonly pits = new Graphics();
  private readonly behindGround = new Container();
  private readonly inFront = new Container();
  private flag: AnimatedSprite | null = null;
  private layout: RunnerLayout;
  private pose: PandaPose;
  private shake = 0;

  constructor(
    private readonly app: Application,
    private readonly config: RunnerConfig,
    private readonly tiles: TileTextures,
    pandaTextures: PandaTextures,
    private readonly onAnimation?: PandaAnimationListener,
  ) {
    this.layout = computeRunnerLayout(config.cells.length, app.screen.width, app.screen.height);
    this.pose = { cell: config.start, lift: 0, sink: 0 };
    this.panda = createPanda(pandaTextures);
    this.inFront.addChild(this.panda.sprite);
    this.world.addChild(this.pits, this.behindGround, this.terrain, this.inFront);
    app.stage.addChild(this.sky, this.world);
    this.build();
    this.setAnimation('idle');
    app.ticker.add(this.onTick);
  }

  reset(): void {
    this.pose = { cell: this.config.start, lift: 0, sink: 0 };
    this.shake = 0;
    this.inFront.addChild(this.panda.sprite);
    this.panda.sprite.visible = true;
    this.setAnimation('idle');
  }

  rest(): void {
    if (this.panda.animation !== 'idle') this.setAnimation('idle');
  }

  estimate(event: RunnerEvent): number {
    switch (event.type) {
      case 'walk':
        return MS.walk;
      case 'jump':
        return MS.crouch + MS.jump + MS.land;
      case 'fall':
        return MS.fall + MS.shake;
      case 'offTrack':
        return MS.crouch + MS.jump + MS.offTrackFall;
      case 'win':
        return MS.cheer;
    }
  }

  hold(): void {
    this.panda.sprite.stop();
  }

  async play(event: RunnerEvent, signal: AbortSignal, next?: RunnerEvent): Promise<void> {
    const ticker = this.app.ticker;
    switch (event.type) {
      case 'walk': {
        this.setAnimation('walk');
        await tween(ticker, MS.walk, signal, (t) => {
          this.pose.cell = event.from + t * (event.to - event.from);
        });
        return;
      }
      case 'jump':
        await this.hop(event.from, event.to, signal);
        // Landing in a hole: no crouch on thin air, the fall follows at once.
        if (isAborted(signal) || next?.type === 'fall') return;
        this.setAnimation('crouch');
        await tween(ticker, MS.land, signal);
        if (!isAborted(signal)) this.setAnimation('idle');
        return;
      case 'fall': {
        this.pose.cell = event.at;
        this.setAnimation('jump'); // arms up: surprised
        this.behindGround.addChild(this.panda.sprite);
        const depth = this.layout.height - this.layout.groundTop + this.layout.cellPx * 2;
        await tween(ticker, MS.fall, signal, (t) => {
          this.pose.sink = depth * t * t;
        });
        if (isAborted(signal)) return;
        this.panda.sprite.visible = false;
        await tween(ticker, MS.shake, signal, (t) => {
          this.shake = t < 1 ? 1 - t : 0;
        });
        return;
      }
      case 'offTrack': {
        await this.hop(event.from, event.from + 2, signal);
        if (isAborted(signal)) return;
        this.behindGround.addChild(this.panda.sprite);
        const depth = this.layout.height - this.layout.feetY + this.layout.cellPx * 2;
        await tween(ticker, MS.offTrackFall, signal, (t) => {
          this.pose.sink = depth * t * t;
        });
        if (!isAborted(signal)) this.panda.sprite.visible = false;
        return;
      }
      case 'win': {
        this.pose.cell = event.at;
        this.setAnimation('cheer');
        await tween(ticker, MS.cheer, signal, (t) => {
          // Two little hops of joy.
          const hop = (t * 2) % 1;
          this.pose.lift = CHEER_HOP * 4 * hop * (1 - hop);
        });
        this.pose.lift = 0;
        return;
      }
    }
  }

  resize(width: number, height: number): void {
    this.layout = computeRunnerLayout(this.config.cells.length, width, height);
    this.build();
  }

  destroy(): void {
    this.app.ticker.remove(this.onTick);
  }

  /** Crouch, then an arc from cell `from` to cell `to`. */
  private async hop(from: number, to: number, signal: AbortSignal): Promise<void> {
    const ticker = this.app.ticker;
    this.setAnimation('crouch');
    await tween(ticker, MS.crouch, signal);
    if (isAborted(signal)) return;
    this.setAnimation('jump');
    await tween(ticker, MS.jump, signal, (t) => {
      this.pose.cell = from + t * (to - from);
      this.pose.lift = JUMP_HEIGHT * 4 * t * (1 - t);
    });
    this.pose.lift = 0;
  }

  private setAnimation(animation: PandaAnimation): void {
    this.panda.play(animation);
    this.onAnimation?.(animation);
  }

  private readonly onTick = (ticker: Ticker): void => {
    this.panda.update(ticker);
    this.flag?.update(ticker);
    const { layout, pose } = this;
    const x = cellCenterX(layout, pose.cell);
    this.panda.sprite.position.set(x, layout.feetY - pose.lift * layout.cellPx + pose.sink);
    const wobble = this.shake > 0 ? Math.round(Math.sin(this.shake * 40) * 4 * this.shake) : 0;
    this.world.position.set(-cameraX(layout, x) + wobble, 0);
  };

  /** (Re)draws sky and terrain for the current layout. */
  private build(): void {
    const { layout, tiles } = this;
    const { cells } = this.config;
    const { tilePx, tileScale, cellPx, originX, groundTop, height } = layout;
    for (const layer of [this.sky, this.terrain]) {
      for (const child of layer.removeChildren()) child.destroy();
    }
    this.flag = null;
    this.panda.sprite.scale.set(layout.pandaScale);

    this.drawClouds();

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
      const tint = Math.floor(col / CELL_TILES) % 2 === 1 ? ODD_CELL_TINT : 0xffffff;
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
  }

  /** A few chunky pixel clouds in the sky layer (it does not scroll). */
  private drawClouds(): void {
    const { width, groundTop, tileScale } = this.layout;
    const px = tileScale * 3;
    const clouds = new Graphics();
    const cloud = (cx: number, cy: number, size: number): void => {
      const u = px * size;
      clouds
        .rect(cx - 3 * u, cy, 6 * u, u)
        .rect(cx - 2 * u, cy - u, 3 * u, u)
        .rect(cx, cy - 2 * u, 2 * u, 2 * u)
        .fill({ color: UI_COLORS.white, alpha: 0.85 });
    };
    cloud(Math.round(width * 0.2), Math.round(groundTop * 0.3), 2);
    cloud(Math.round(width * 0.72), Math.round(groundTop * 0.18), 1.5);
    cloud(Math.round(width * 0.55), Math.round(groundTop * 0.52), 1);
    this.sky.addChild(clouds);
  }
}
