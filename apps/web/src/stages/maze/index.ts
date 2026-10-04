import { mazeConfigSchema } from '@codequest/games';
import { UI_COLORS } from '../../ui/tokens';
import { loadPandaSheet } from '../assets';
import type { StageKind } from '../registry';
import { MazeStage } from './MazeStage';

/** The maze stage for the stage registry; its tiles are drawn in code (pixelArt.ts), only Măng loads. */
export const mazeStage: StageKind = {
  background: UI_COLORS.ground,
  async prepare() {
    const panda = await loadPandaSheet();
    return (app, config, hooks) =>
      new MazeStage(
        app,
        mazeConfigSchema.parse(config),
        panda,
        hooks.onAnimation,
        hooks.goalSprite,
      );
  },
};
