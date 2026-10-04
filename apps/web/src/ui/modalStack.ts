/**
 * Open modal overlays, oldest first (Dialog and the play screen's useModalDialog boxes): only the
 * top-most one handles Esc and Tab, so closing a box on top never closes the one beneath it.
 */
const openStack: symbol[] = [];

/** Registers a modal that just opened; pass the token to `isTopModal` / `closeModal`. */
export function openModal(): symbol {
  const me = Symbol('modal');
  openStack.push(me);
  return me;
}

export function closeModal(me: symbol): void {
  const index = openStack.indexOf(me);
  if (index >= 0) openStack.splice(index, 1);
}

export function isTopModal(me: symbol): boolean {
  return openStack.at(-1) === me;
}
