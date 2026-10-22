import { FOCUS_RING } from '../../ui/focusRing';

const ROW = [
  'flex w-full items-center gap-3 rounded-panel border-3 border-ink bg-paper p-3 no-underline',
  'shadow-hard transition-[transform,box-shadow] duration-150 ease-bounce',
  'hover:-translate-y-px active:translate-y-0.5 active:shadow-button-pressed',
  FOCUS_RING,
].join(' ');

/** The host of a link, so the coach can tell at a glance which site a row opens. */
function hostOf(href: string): string {
  try {
    return new URL(href).host;
  } catch {
    return href;
  }
}

/**
 * Pages a screen (or the links page) sends people to, one tappable row each. They open in a new
 * tab so the lesson stays where it was.
 */
export function LeanbotLinkList({
  links,
}: {
  links: readonly { label: string; href: string; note?: string | undefined }[];
}) {
  return (
    <ul className="m-0 grid list-none gap-2 p-0">
      {links.map((link) => (
        <li key={link.href + link.label}>
          <a href={link.href} target="_blank" rel="noopener" className={ROW}>
            <span aria-hidden className="text-[22px]">
              🔗
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-body">{link.label}</span>
              {link.note !== undefined && <span className="block text-sm">{link.note}</span>}
              <span className="block truncate text-sm opacity-60">{hostOf(link.href)}</span>
            </span>
            <span aria-hidden className="font-display text-[22px]">
              ↗
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
