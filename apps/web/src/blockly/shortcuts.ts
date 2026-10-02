import {
  DropDownDiv,
  Gesture,
  KeyboardMover,
  ShortcutItems,
  ShortcutRegistry,
  WidgetDiv,
  keyboardNavigationController,
} from 'blockly';

/**
 * Removes Blockly shortcuts that clash with the app's (blockly-integration.md §13):
 * `H` (next heading in the flyout) is the app's hint key. Idempotent.
 */
export function unregisterConflictingShortcuts(): void {
  const name = ShortcutItems.names.NEXT_HEADING;
  if (name in ShortcutRegistry.registry.getRegistry()) ShortcutRegistry.registry.unregister(name);
}

// Where Blockly draws itself: the injected workspace and its floating editors / menus.
const BLOCKLY_SURFACES = '.injectionDiv, .blocklyWidgetDiv, .blocklyDropDownDiv';

function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.matches('input, textarea, select');
}

/**
 * Whether Blockly, not the app, should get this key press (blockly-integration.md §13).
 * Blockly owns the keyboard while a keyboard move or a mouse gesture (drag) is in progress,
 * while a field editor or dropdown is open, and while keyboard navigation is active with focus
 * inside Blockly. After a mouse drag keyboard navigation is off, so the app's `Space` keeps
 * working.
 */
export function blocklyOwnsKey(event: KeyboardEvent): boolean {
  // Running mid-drag would run the program as it was before the drop.
  if (KeyboardMover.mover.isMoving() || Gesture.inProgress()) return true;
  if (WidgetDiv.isVisible() || DropDownDiv.isVisible()) return true;
  if (isTextEntry(event.target)) return true;
  const focusInBlockly =
    event.target instanceof Element && event.target.closest(BLOCKLY_SURFACES) !== null;
  return focusInBlockly && keyboardNavigationController.getIsActive();
}

// Elements the browser (or their own handler) activates with Space.
const ACTIVATABLE = [
  'button',
  'a[href]',
  'summary',
  ...['button', 'checkbox', 'switch', 'tab', 'menuitem', 'option'].map((r) => `[role="${r}"]`),
].join(', ');

/**
 * Whether an app shortcut (`Space`, `S`, `R`, `H`) should handle this key press. Besides
 * yielding to Blockly, `Space` on a focused button or link is left to the browser, which
 * clicks it. Listen in the capture phase and `stopPropagation()` when handling the key, so a
 * block focused by a mouse click does not also get Blockly's `perform_action`.
 */
export function shouldHandleAppShortcut(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey) {
    return false;
  }
  // Shift+S/R/H are not the app's letter shortcuts.
  if (event.shiftKey && /^Key[A-Z]$/.test(event.code)) return false;
  // A modal overlay (dialog, result card) owns the keyboard.
  if (document.querySelector('[aria-modal="true"]')) return false;
  if (blocklyOwnsKey(event)) return false;
  const onActivatable =
    event.target instanceof Element && event.target.closest(ACTIVATABLE) !== null;
  return !(event.code === 'Space' && onActivatable);
}
