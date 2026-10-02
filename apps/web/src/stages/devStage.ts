import { type AnimatedSprite, Container, type Ticker } from 'pixi.js';
import { loadPandaSheet, loadTiles, type TileName, type TileTextures } from './assets';
import { createStageApp, destroyStageApp } from './createStageApp';
import type { PandaAnimation } from './panda';
import { createPanda } from './pandaSprite';
import { GRASS_OUTLINE_TEXELS, TILE_SIZE } from './tileGrid';
import { createFlag, tileSprite } from './tiles';

/** Logical stage size (16:10, stage-rendering.md §2). */
export const DEV_STAGE_WIDTH = 800;
export const DEV_STAGE_HEIGHT = 500;

const TILE_SCALE = 3; // integer scale for grid-aligned tiles
const TILE_PX = TILE_SIZE * TILE_SCALE;
const COLS = Math.ceil(DEV_STAGE_WIDTH / TILE_PX);
const GROUND_ROW_Y = DEV_STAGE_HEIGHT - 3 * TILE_PX;
const HOLE_COL = 9;
const FLAG_COL = 13;
const CRATE_COL = 11;
/** Kenney grass tiles have a 2 px dark outline on top; feet stand on the grass just below it. */
const FEET_Y = GROUND_ROW_Y + GRASS_OUTLINE_TEXELS * TILE_SCALE;
const WALK_START_X = TILE_PX * 1.5;
const WALK_END_X = TILE_PX * (HOLE_COL - 0.5);
const JUMP_HEIGHT = 90;
const JUMP_FRAMES = 40; // ticker frames per hop at 60 fps
/** Horizontal speed in px per 60 fps frame. */
const SPEED: Partial<Record<PandaAnimation, number>> = { walk: 1.2, run: 3 };

export interface DevStage {
  play(animation: PandaAnimation): void;
  destroy(): void;
}

/** Mounts the /dev/stage demo: Măng on a strip of temporary runner tiles. */
export async function mountDevStage(
  container: HTMLElement,
  signal: AbortSignal,
): Promise<DevStage | null> {
  const [pandaFrames, tiles] = await Promise.all([loadPandaSheet(), loadTiles()]);
  if (signal.aborted) return null;
  const app = await createStageApp(container, signal, {
    width: DEV_STAGE_WIDTH,
    height: DEV_STAGE_HEIGHT,
    background: '#BFE3F2', // --sky (art-direction.md §2)
  });
  if (!app) return null;

  try {
    const { strip, flag } = buildGround(tiles);
    app.stage.addChild(strip);
    const panda = createPanda(pandaFrames);
    panda.sprite.position.set(WALK_START_X, FEET_Y);
    app.stage.addChild(panda.sprite);

    let hopFrame = 0;
    // One clock (app.ticker) drives every animation and every movement.
    app.ticker.add((ticker: Ticker) => {
      panda.update(ticker);
      flag.update(ticker);
      const speed = SPEED[panda.animation];
      if (speed !== undefined) {
        panda.sprite.x += speed * ticker.deltaTime;
        if (panda.sprite.x > WALK_END_X) panda.sprite.x = WALK_START_X;
      }
      if (panda.animation === 'jump') {
        hopFrame = (hopFrame + ticker.deltaTime) % JUMP_FRAMES;
        const t = hopFrame / JUMP_FRAMES;
        panda.sprite.y = FEET_Y - JUMP_HEIGHT * 4 * t * (1 - t);
      }
    });

    return {
      play: (animation) => {
        hopFrame = 0;
        panda.sprite.y = FEET_Y;
        panda.play(animation);
      },
      destroy: () => {
        destroyStageApp(app);
      },
    };
  } catch (error) {
    destroyStageApp(app);
    throw error;
  }
}

/** Ground strip with one hole, a crate and the goal flag (runner cells, game-kinds.md §3.1). */
function buildGround(tiles: TileTextures): { strip: Container; flag: AnimatedSprite } {
  const strip = new Container();
  const place = (name: TileName, col: number, row: number): void => {
    strip.addChild(
      tileSprite(tiles, name, TILE_SCALE, col * TILE_PX, GROUND_ROW_Y + row * TILE_PX),
    );
  };
  for (let col = 0; col < COLS; col++) {
    if (col === HOLE_COL) continue;
    const edge = col === HOLE_COL - 1 ? 'right' : col === HOLE_COL + 1 ? 'left' : null;
    place(edge ? `ground_${edge}` : 'ground', col, 0);
    for (let row = 1; row < 3; row++) place(edge ? `dirt_${edge}` : 'dirt', col, row);
  }
  place('crate', CRATE_COL, -1);
  const { pole, flag } = createFlag(tiles, TILE_SCALE, FLAG_COL * TILE_PX, GROUND_ROW_Y);
  strip.addChild(pole, flag);
  return { strip, flag };
}
