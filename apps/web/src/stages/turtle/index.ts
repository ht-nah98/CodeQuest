import { turtleConfigSchema } from '@codequest/games';
import { vi } from '../../i18n/vi';
import { loadPandaSheet } from '../assets';
import type { StageKind } from '../registry';
import { sceneArt } from '../sceneThemes';
import { TurtleStage } from './TurtleStage';

/** Loads VT323 with the HUD's Vietnamese glyphs before PixiJS measures the "Còn 5 nét" chip. */
async function loadHudFont(): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  try {
    await document.fonts.load('26px VT323', vi.play.turtle.linesLeft(0));
  } catch {
    // A font that cannot load falls back to the system font: the HUD still works.
  }
}

/** The turtle stage for the stage registry; paper and brush are drawn in code, only Măng loads. */
export const turtleStage: StageKind = {
  background: (theme) => sceneArt(theme).maze.background,
  async prepare() {
    const [panda] = await Promise.all([loadPandaSheet(), loadHudFont()]);
    return (app, config, hooks) =>
      new TurtleStage(app, turtleConfigSchema.parse(config), panda, hooks.onAnimation, hooks.theme);
  },
};
