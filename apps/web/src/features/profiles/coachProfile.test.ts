import { describe, expect, it } from 'vitest';
import source from './coachProfile.ts?raw';

describe('coachProfile.ts source', () => {
  const code = source
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('//'))
    .join('\n');

  it('reads VITE_COACH_PIN only after the DEV guard (so production bundles drop it)', () => {
    const guard = code.indexOf('if (!import.meta.env.DEV) return;');
    const read = code.indexOf('import.meta.env.VITE_COACH_PIN');
    expect(guard).toBeGreaterThan(-1);
    expect(read).toBeGreaterThan(guard);
    expect(code.match(/VITE_COACH_PIN/g)).toHaveLength(1);
  });
});
