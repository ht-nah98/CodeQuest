/**
 * Whether the child asks for less motion (coding-standards.md §5): the system setting, or the
 * profile switch "Giảm chuyển động" (mirrored on `<html data-reduced-motion>` by CurrentProfile).
 * Stages keep every event's animation but drop decorative motion such as screen shake.
 * Safe outside a browser. Cheap enough to read every frame, so a changed setting applies at once.
 */
export function reducedMotion(): boolean {
  if (
    typeof document !== 'undefined' &&
    document.documentElement.dataset.reducedMotion === 'true'
  ) {
    return true;
  }
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
