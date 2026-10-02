import { Link } from 'react-router';

// Dev builds only: links to the /dev/* showcase pages (read by the coach, not by children).
const PAGES = ['/dev/ui', '/dev/blockly', '/dev/stage'] as const;

export function DevLinks() {
  if (!import.meta.env.DEV) return null;
  return (
    <nav className="fixed right-3 bottom-2 flex gap-3 font-pixel text-pixel-sm text-ink-soft">
      {PAGES.map((path) => (
        <Link key={path} to={path} className="underline">
          {path}
        </Link>
      ))}
    </nav>
  );
}
