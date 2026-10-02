import { vi } from '../i18n/vi';
import { PixelIcon, type PixelIconScale } from './PixelIcon';

export interface StarsProps {
  /** Stars earned on a level, clamped to 0…max. */
  earned: number;
  max?: number;
  scale?: PixelIconScale;
  className?: string;
}

/** A level's star rating (⭐⭐☆) as pixel stars, announced as "2 trên 3 sao". */
export function Stars({ earned, max = 3, scale = 2, className = '' }: StarsProps) {
  const total = Math.max(0, Math.floor(max));
  const lit = Math.min(total, Math.max(0, Math.floor(earned)));
  return (
    <span
      role="img"
      aria-label={vi.ui.starsOf(lit, total)}
      className={`inline-flex gap-1 ${className}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <PixelIcon key={i} name={i < lit ? 'star' : 'star-empty'} scale={scale} />
      ))}
    </span>
  );
}
