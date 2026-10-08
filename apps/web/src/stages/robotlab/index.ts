import { robotlabResolvedSchema } from '@codequest/games';
import type { StageKind } from '../registry';
import { CITY_DETAIL, sceneArt } from '../sceneThemes';
import { RobotLabStage } from './RobotLabStage';
import { vi } from '../../i18n/vi';

/**
 * Loads the HUD fonts (VT323 digits, Nunito tag) with their Vietnamese glyphs before the first
 * text is measured; PixiJS draws text on a canvas and does not wait for web fonts itself.
 */
async function loadHudFonts(): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  const sample = `0123456789/ ${vi.play.robotlab.seconds} ${vi.play.robotlab.points} ${vi.play.robotlab.practiceBoard}`;
  try {
    await Promise.all([
      document.fonts.load('28px VT323', sample),
      document.fonts.load('800 15px Nunito', sample),
    ]);
  } catch {
    // A font that cannot load falls back to the system font: the HUD still works.
  }
}

/**
 * The robot lab stage for the stage registry. Its art is drawn in code (robotArt.ts). The factory
 * only accepts a config with the shared rules merged in (`resolveRobotlabRules`, done by the
 * content loader): an unresolved one throws, so a stage never shows a clock or points that differ
 * from the run's.
 */
export const robotlabStage: StageKind = {
  background: (theme) =>
    theme === 'thanh-pho-robot' ? CITY_DETAIL.pavement : sceneArt(theme).maze.background,
  async prepare() {
    await loadHudFonts();
    return (app, config, hooks) =>
      new RobotLabStage(app, robotlabResolvedSchema.parse(config), hooks.theme);
  },
};
