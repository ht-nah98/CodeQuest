import { Container, Sprite, Texture } from 'pixi.js';
import { FOREST_DETAIL, RIVER_DETAIL, sceneArt, type SceneTheme } from '../sceneThemes';
import type { RunnerLayout } from './layout';
import { PARALLAX, riverShoreY, sequence, spanOf } from './scenery';

/**
 * Animated decoration of a theme (stage-rendering.md §7): fireflies in the forest, glints on the
 * river. A fixed pool of plain sprites made when the scene is (re)built; every frame only moves
 * them and sets their alpha (no allocation), on the stage clock, snapped to the texel grid.
 * Under reduced motion everything stands still and stays lit.
 */
export interface SceneDecor {
  /** The decoration's sprites (a fixed pool). */
  readonly view: Container;
  /** The layer `view` goes into, so it keeps that layer's parallax: fireflies near, glints far. */
  readonly layer: 'far' | 'hills';
  /**
   * Places the sprites for `clockMs` on the stage clock (scaled by speed, still while paused);
   * `calm` (reduced motion) keeps them still and lit.
   */
  update(clockMs: number, calm: boolean): void;
}

interface Mote {
  core: Sprite;
  glow: Sprite | null;
  x: number;
  y: number;
  phase: number;
}

function block(color: string, width: number, height: number): Sprite {
  const sprite = new Sprite(Texture.WHITE);
  sprite.tint = color;
  sprite.width = width;
  sprite.height = height;
  return sprite;
}

/** The decoration of `theme` for this layout, or `null` when the theme has none. */
export function createDecor(layout: RunnerLayout, theme?: SceneTheme): SceneDecor | null {
  const decor = sceneArt(theme).decor;
  if (decor === 'fireflies') return fireflies(layout);
  if (decor === 'water') return glints(layout);
  return null;
}

/** Fireflies drifting over the forest floor, each blinking in its own rhythm. */
function fireflies(layout: RunnerLayout): SceneDecor {
  const { groundTop, tileScale: u } = layout;
  const span = spanOf(layout, PARALLAX.hills);
  const view = new Container();
  const next = sequence(59);
  const count = Math.min(40, Math.max(8, Math.round(span / (30 * u))));
  const motes: Mote[] = [];
  for (let i = 0; i < count; i++) {
    const glow = block(FOREST_DETAIL.fireflyGlow, 3 * u, 3 * u);
    const core = block(FOREST_DETAIL.firefly, u, u);
    view.addChild(glow, core);
    motes.push({
      core,
      glow,
      x: Math.floor((next() * span) / u) * u,
      y: Math.floor((groundTop * (0.3 + next() * 0.6)) / u) * u,
      phase: next() * Math.PI * 2,
    });
  }
  return {
    view,
    layer: 'hills',
    update(clockMs, calm) {
      const t = clockMs / 1000;
      for (const mote of motes) {
        const dx = calm ? 0 : Math.round(Math.sin(t * 0.7 + mote.phase) * 4) * u;
        const dy = calm ? 0 : Math.round(Math.cos(t * 0.9 + mote.phase * 1.7) * 3) * u;
        const light = calm ? 0.85 : 0.2 + 0.8 * Math.max(0, Math.sin(t * 2.2 + mote.phase * 3));
        mote.core.position.set(mote.x + dx, mote.y + dy);
        mote.core.alpha = light;
        if (mote.glow) {
          mote.glow.position.set(mote.x + dx - u, mote.y + dy - u);
          mote.glow.alpha = light * 0.35;
        }
      }
    },
  };
}

/** Short white glints sliding a little on the river, fading in and out. */
function glints(layout: RunnerLayout): SceneDecor {
  const { groundTop, tileScale: u } = layout;
  const span = spanOf(layout, PARALLAX.far);
  const view = new Container();
  const next = sequence(61);
  const top = riverShoreY(layout) + 4 * u;
  const rows = Math.max(1, Math.floor((groundTop - top) / u) - 1);
  const count = Math.min(48, Math.max(8, Math.round(span / (16 * u))));
  const motes: Mote[] = [];
  for (let i = 0; i < count; i++) {
    const core = block(RIVER_DETAIL.glint, (2 + Math.floor(next() * 3)) * u, u);
    view.addChild(core);
    motes.push({
      core,
      glow: null,
      x: Math.floor((next() * span) / u) * u,
      y: top + Math.floor(next() * rows) * u,
      phase: next() * Math.PI * 2,
    });
  }
  return {
    view,
    layer: 'far',
    update(clockMs, calm) {
      const t = clockMs / 1000;
      for (const mote of motes) {
        const dx = calm ? 0 : Math.round(Math.sin(t * 0.8 + mote.phase) * 2) * u;
        mote.core.position.set(mote.x + dx, mote.y);
        mote.core.alpha = calm ? 0.7 : 0.2 + 0.6 * (0.5 + 0.5 * Math.sin(t * 1.6 + mote.phase * 2));
      }
    },
  };
}
