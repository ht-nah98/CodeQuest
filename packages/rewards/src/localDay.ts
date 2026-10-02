import { TIME_ZONE } from './config';

// Built on first use and then reused: Intl formatters are costly to create.
let dayFormat: Intl.DateTimeFormat | undefined;

function getDayFormat(): Intl.DateTimeFormat {
  // `en-CA` formats dates as YYYY-MM-DD.
  dayFormat ??= new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return dayFormat;
}

const MS_PER_DAY = 86_400_000;

/** Calendar day of `date` in Asia/Ho_Chi_Minh as 'YYYY-MM-DD', whatever the host time zone. */
export function localDay(date: Date): string {
  // formatToParts, not format: the joined output of `format` is locale data, not a contract.
  const parts = getDayFormat().formatToParts(date);
  const part = (type: 'year' | 'month' | 'day'): string =>
    parts.find((p) => p.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

/** Days since 1970-01-01 for a 'YYYY-MM-DD' string; consecutive days differ by exactly 1. */
export function dayNumber(day: string): number {
  const [year = 0, month = 1, date = 1] = day.split('-').map(Number);
  return Math.round(Date.UTC(year, month - 1, date) / MS_PER_DAY);
}
