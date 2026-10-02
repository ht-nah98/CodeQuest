/**
 * Two-tone keyboard focus ring: a 3px paper ring hugging the border plus a 3px brand-deep outline
 * outside it. One colour alone vanishes on its own surface (brand-deep top bar, paper panel);
 * together one of the two always contrasts. The ring is a Tailwind `ring`, which composes with
 * the hard `shadow-*` instead of replacing it.
 */
export const FOCUS_RING =
  'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-brand-deep focus-visible:ring-3 focus-visible:ring-paper';
