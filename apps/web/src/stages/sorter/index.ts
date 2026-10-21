import { sorterConfigSchema } from '@codequest/games';
import { vi } from '../../i18n/vi';
import type { StageKind } from '../registry';
import { sceneArt } from '../sceneThemes';
import { SorterStage } from './SorterStage';

/**
 * Loads the HUD and spine fonts (VT323 digits plus the Vietnamese of the two chips) before the
 * first text is measured; PixiJS draws text on a canvas and does not wait for web fonts itself.
 */
async function loadShelfFonts(): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  const t = vi.play.sorter;
  const sample = `0123456789 ${t.questionsLeft(0)} ${t.swaps(0)}`;
  try {
    await Promise.all([document.fonts.load('24px VT323', sample), document.fonts.load('34px VT323', '0123456789')]);
  } catch {
    // A font that cannot load falls back to the system font: the HUD still works.
  }
}

/**
 * The bookshelf stage for the stage registry (ADR-0025). All of its art is drawn in code, so it
 * needs no textures; only the fonts have to be ready before the first frame.
 */
export const sorterStage: StageKind = {
  background: (theme) => sceneArt(theme).sky.low,
  async prepare() {
    await loadShelfFonts();
    return (app, config, hooks) =>
      new SorterStage(app, sorterConfigSchema.parse(config), hooks.theme);
  },
};
