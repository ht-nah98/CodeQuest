import { Msg, setLocale } from 'blockly';
import * as vi from 'blockly/msg/vi';

/**
 * Shorter, child-friendly overrides on top of Blockly's Vietnamese locale
 * (blockly-integration.md §9). Uses the glossary's "khối" instead of the locale's "mảnh".
 * Labels of CodeQuest's own blocks live in each BlockSpec's `message0`.
 */
export const BLOCKLY_MESSAGE_OVERRIDES: Readonly<Record<string, string>> = {
  // Built-in blocks used by the curriculum.
  CONTROLS_IF_MSG_IF: 'nếu',
  CONTROLS_IF_MSG_THEN: 'thì',
  CONTROLS_IF_MSG_ELSE: 'nếu không',
  CONTROLS_IF_MSG_ELSEIF: 'nếu không, nếu',
  CONTROLS_WHILEUNTIL_OPERATOR_WHILE: 'lặp khi',
  CONTROLS_WHILEUNTIL_OPERATOR_UNTIL: 'lặp đến khi',
  CONTROLS_WHILEUNTIL_INPUT_DO: 'làm',
  CONTROLS_REPEAT_INPUT_DO: 'làm',
  LOGIC_NEGATE_TITLE: 'không phải %1',

  // Context menu.
  DELETE_BLOCK: 'Xóa khối',
  DELETE_X_BLOCKS: 'Xóa %1 khối',
  DELETE_ALL_BLOCKS: 'Xóa hết %1 khối?',
  DUPLICATE_BLOCK: 'Nhân đôi',
  CLEAN_UP: 'Xếp gọn',
  ADD_COMMENT: 'Thêm ghi chú',
  REMOVE_COMMENT: 'Xóa ghi chú',
  COLLAPSE_BLOCK: 'Thu gọn khối',
  COLLAPSE_ALL: 'Thu gọn hết',
  EXPAND_BLOCK: 'Mở khối',
  EXPAND_ALL: 'Mở hết',
  DISABLE_BLOCK: 'Tắt khối',
  ENABLE_BLOCK: 'Bật khối',
  INLINE_INPUTS: 'Cùng dòng',
  EXTERNAL_INPUTS: 'Xuống dòng',
  HELP: 'Trợ giúp',
  // Workspace menu: the locale's "Làm lại" for redo clashes with the app's "Làm lại" (reset).
  UNDO: 'Hoàn tác',
  REDO: 'Làm tiếp',

  // Keyboard navigation hints still in English in the locale.
  KEYBOARD_NAV_BLOCK_NAVIGATION_HINT: 'Dùng %1 để đi vào trong khối.',
  KEYBOARD_NAV_WORKSPACE_NAVIGATION_HINT: 'Dùng phím mũi tên để di chuyển.',
  // The locale's text also mentions the next-heading key, which the app unregisters (H = hint).
  KEYBOARD_NAV_FLYOUT_LABEL_HINT: 'Dùng phím mũi tên để chọn khối.',
};

/** Switches Blockly to Vietnamese and applies the overrides. Safe to call more than once. */
export function applyBlocklyMessages(): void {
  // The namespace's type also carries a synthetic `default`; keep only the message strings.
  setLocale(
    Object.fromEntries(
      Object.entries(vi).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
    ),
  );
  Object.assign(Msg, BLOCKLY_MESSAGE_OVERRIDES);
}
