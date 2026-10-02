import type { Application } from 'pixi.js';
import type { GameKindId } from '@codequest/content-schema';
import type { GameEvent } from '@codequest/engine';
import { runnerConfigSchema } from '@codequest/games';
import { UI_COLORS } from '../ui/tokens';
import { loadPandaSheet, loadTiles } from './assets';
import { mazeStage } from './maze';
import { RunnerStage } from './runner/RunnerStage';
import type { PandaAnimationListener, StageRenderer } from './types';

/** Callbacks a renderer may report through (e2e / debug). */
export interface StageHooks {
  onAnimation?: PandaAnimationListener;
}

/**
 * Builds the renderer of one level inside a ready PIXI application. `config` is the raw
 * `level.config`; the factory validates it with its kind's schema (and throws when it does not fit).
 *
 * Typing note: a factory returns e.g. `RunnerStage` (a `StageRenderer<RunnerEvent>`) where a
 * `StageRenderer<GameEvent>` is expected. TypeScript accepts it because `StageRenderer` declares
 * `play` / `estimate` with method syntax, whose parameters are checked bivariantly. That is sound
 * only because the controller feeds a renderer the events of its own level's kind (one run of one
 * game kind); never hand a renderer events of another kind.
 */
export type StageFactory = (
  app: Application,
  config: unknown,
  hooks: StageHooks,
) => StageRenderer<GameEvent>;

/** The drawing half of a game kind, as the StageController sees it (game-kind-sdk.md §2). */
export interface StageKind {
  /** Canvas clear colour behind the scene (CSS hex, from `ui/tokens.ts`). */
  background: string;
  /**
   * Loads the kind's textures (PIXI.Assets caches them for the session) and resolves the factory.
   * Runs before the PIXI application exists, so no texture work may need a renderer.
   */
  prepare(): Promise<StageFactory>;
}

const runnerStage: StageKind = {
  background: UI_COLORS.sky,
  async prepare() {
    const [panda, tiles] = await Promise.all([loadPandaSheet(), loadTiles()]);
    return (app, config, hooks) =>
      new RunnerStage(app, runnerConfigSchema.parse(config), tiles, panda, hooks.onAnimation);
  },
};

/** One entry per game kind that can be drawn; kinds are added as the roadmap reaches them. */
export const stageKinds: Partial<Record<GameKindId, StageKind>> = {
  runner: runnerStage,
  maze: mazeStage,
};

/** The stage of a game kind, or `undefined` when it has no renderer yet. */
export function getStageKind(kind: GameKindId): StageKind | undefined {
  return stageKinds[kind];
}
