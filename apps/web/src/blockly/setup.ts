import { DisableTopBlocks } from '@blockly/disable-top-blocks';
import { ContextMenuRegistry } from 'blockly';
import { registerAllBlocks } from '@codequest/games';
import { applyBlocklyMessages } from './messages';
import { unregisterConflictingShortcuts } from './shortcuts';

/**
 * Context menu items children should not see: "Trợ giúp" opens an English page on a third-party
 * site (block.showHelp → window.open), "Cùng dòng"/"Xuống dòng" means nothing to them. Kept:
 * Nhân đôi, Xóa khối, Hoàn tác / Làm tiếp, Xếp gọn, Xóa hết. `blockDisable` stays registered
 * (hidden while the `disable` option is off) because the disable-top-blocks plugin patches it.
 */
const HIDDEN_CONTEXT_MENU_ITEMS = ['blockHelp', 'blockInline'];

function unregisterContextMenuItems(): void {
  const { registry } = ContextMenuRegistry;
  for (const id of HIDDEN_CONTEXT_MENU_ITEMS) if (registry.getItem(id)) registry.unregister(id);
}

let done = false;

/**
 * One-time global Blockly setup for the browser: Vietnamese messages, every game kind's blocks,
 * shortcut and context menu clean-up and the disable-top-blocks plugin (blockly-integration.md §1, §4, §9, §13).
 * Idempotent; BlocklyWorkspace calls it before the first inject.
 */
export function setupBlockly(): void {
  if (done) return;
  done = true;
  applyBlocklyMessages();
  registerAllBlocks();
  unregisterConflictingShortcuts();
  unregisterContextMenuItems();
  new DisableTopBlocks().init();
}

// Block labels (Baloo 2, theme fontStyle) and flyout group labels (VT323, blockly.css), with
// Vietnamese marks so the `vietnamese` unicode-range subset loads too.
const BLOCKLY_FONTS = ['700 19px "Baloo 2"', '22px VT323'];
const FONT_SAMPLE = 'Aa khi bắt đầu lặp lần ĐIỀU KIỆN';

/** Resolves once the fonts Blockly measures are loaded; never rejects. */
export async function loadBlocklyFonts(): Promise<void> {
  try {
    await Promise.all(BLOCKLY_FONTS.map((font) => document.fonts.load(font, FONT_SAMPLE)));
  } catch {
    // A missing font only costs some label widths; render anyway.
  }
}
