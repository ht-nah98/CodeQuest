import type { ReactNode } from 'react';
import { vi } from '../i18n/vi';
import { PixelIcon } from './PixelIcon';

export interface HudProps {
  coins: number;
  /** Total stars. Hidden when undefined (the level top bar shows that level's stars instead). */
  stars?: number;
  /** Consecutive days played. Hidden when undefined (e.g. inside a level's top bar). */
  streakDays?: number;
  className?: string;
}

interface HudItemProps {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}

// Read-only counters, so no hover/focus states: they are not interactive.
function HudItem({ label, icon, children }: HudItemProps) {
  return (
    <li className="inline-flex h-11 items-center gap-2 rounded-chip border-3 border-ink bg-brand-deep pr-3 pl-1.5 font-pixel text-hud text-paper">
      {icon}
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className="pt-0.5 tabular-nums">
        {children}
      </span>
    </li>
  );
}

/** Coin / star / streak counters in VT323 on dark lavender pills (style board "HUD"). */
export function Hud({ coins, stars, streakDays, className = '' }: HudProps) {
  return (
    <ul aria-label={vi.ui.hud} className={`m-0 flex list-none flex-wrap gap-2.5 p-0 ${className}`}>
      <HudItem label={vi.ui.coins(coins)} icon={<PixelIcon name="coin" scale={2} />}>
        {coins}
      </HudItem>
      {stars !== undefined && (
        <HudItem label={vi.ui.stars(stars)} icon={<PixelIcon name="star" scale={2} />}>
          {stars}
        </HudItem>
      )}
      {streakDays !== undefined && (
        <HudItem label={vi.ui.streak(streakDays)} icon={<PixelIcon name="flame" scale={2} />}>
          {streakDays} <span className="uppercase">{vi.ui.streakUnit}</span>
        </HudItem>
      )}
    </ul>
  );
}
