import { Theme, Themes } from 'blockly';
import type { BlockCategory } from '@codequest/engine';
import { BLOCK_COLORS, UI_COLORS } from '../ui/tokens';

/** Mixes `amount` (0…1) of `other` into `base`; both `#rrggbb`. */
function mix(base: string, other: string, amount: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const parts = [0, 1, 2].map((i) =>
    Math.round(channel(base, i) * (1 - amount) + channel(other, i) * amount)
      .toString(16)
      .padStart(2, '0'),
  );
  return `#${parts.join('')}`;
}

/**
 * Fill = token colour; secondary (shadow blocks, flyout of a disabled block) a little lighter;
 * tertiary (zelos draws it as the outline) = 35% ink, like the style board's block border.
 */
function blockStyle(colour: string, hat = ''): Theme.BlockStyle {
  return {
    colourPrimary: colour,
    colourSecondary: mix(colour, UI_COLORS.white, 0.25),
    colourTertiary: mix(colour, UI_COLORS.ink, 0.35),
    hat,
  };
}

/** blockStyle name per BlockSpec category (blockly-integration.md §3). */
export const BLOCK_STYLE_BY_CATEGORY: Readonly<Record<BlockCategory, string>> = {
  move: 'move_blocks',
  loop: 'loop_blocks',
  logic: 'logic_blocks',
  sensor: 'sensor_blocks',
  robot: 'robot_blocks',
  variable: 'variable_blocks',
  function: 'procedure_blocks',
  pen: 'pen_blocks',
  event: 'event_blocks',
};

/** Token colour per BlockSpec category. */
export const BLOCK_COLOR_BY_CATEGORY: Readonly<Record<BlockCategory, string>> = {
  move: BLOCK_COLORS.move,
  loop: BLOCK_COLORS.loop,
  logic: BLOCK_COLORS.if,
  sensor: BLOCK_COLORS.sensor,
  robot: BLOCK_COLORS.robot,
  variable: BLOCK_COLORS.var,
  function: BLOCK_COLORS.fn,
  pen: BLOCK_COLORS.pen,
  event: BLOCK_COLORS.event,
};

const blockStyles: Record<string, Theme.BlockStyle> = {};
const categoryStyles: Record<string, Theme.CategoryStyle> = {};
for (const [category, styleName] of Object.entries(BLOCK_STYLE_BY_CATEGORY)) {
  const colour = BLOCK_COLOR_BY_CATEGORY[category as BlockCategory];
  // `cq_start` is a cap-shaped hat block (zelos draws it rounded on top).
  blockStyles[styleName] = blockStyle(colour, category === 'event' ? 'cap' : '');
  categoryStyles[`${category}_category`] = { colour };
}
// Blockly's built-in math blocks ask for `math_blocks`; they share the variable colour (§3).
blockStyles.math_blocks = blockStyle(BLOCK_COLORS.var);

/** The CodeQuest Blockly theme: zelos renderer, token colours, Baloo 2 at 14pt (§3). */
export const codequestTheme = Theme.defineTheme('codequest', {
  name: 'codequest',
  base: Themes.Zelos,
  blockStyles,
  categoryStyles,
  componentStyles: {
    workspaceBackgroundColour: UI_COLORS.paper,
    toolboxBackgroundColour: UI_COLORS.paper2,
    toolboxForegroundColour: UI_COLORS.ink,
    flyoutBackgroundColour: UI_COLORS.paper2,
    flyoutForegroundColour: UI_COLORS.inkSoft,
    flyoutOpacity: 1,
    scrollbarColour: UI_COLORS.brand,
    scrollbarOpacity: 0.6,
    insertionMarkerColour: UI_COLORS.ink,
    insertionMarkerOpacity: 0.25,
    markerColour: UI_COLORS.brandDeep,
    cursorColour: UI_COLORS.coin,
    selectedGlowColour: UI_COLORS.coin,
    selectedGlowOpacity: 1,
  },
  fontStyle: { family: '"Baloo 2", Nunito, sans-serif', weight: '700', size: 14 },
  startHats: false,
});
