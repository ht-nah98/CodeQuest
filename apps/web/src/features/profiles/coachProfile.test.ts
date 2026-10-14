import { describe, expect, it } from 'vitest';
import source from './coachProfile.ts?raw';

describe('coachProfile.ts source', () => {
  const code = source
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('//'))
    .join('\n');

  it('reads VITE_COACH_PIN only after the production branch returned (so bundles drop it)', () => {
    const prodBranch = code.indexOf('if (!import.meta.env.DEV) {');
    const prodEnd = code.indexOf('    return;\n  }', prodBranch);
    const read = code.indexOf('import.meta.env.VITE_COACH_PIN;');
    expect(prodBranch).toBeGreaterThan(-1);
    expect(prodEnd).toBeGreaterThan(prodBranch);
    expect(read).toBeGreaterThan(prodEnd);
    expect(code.match(/VITE_COACH_PIN\b/g)).toHaveLength(1);
  });

  it('production reads only the PIN hash, never a PIN', () => {
    const prodBranch = code.slice(
      code.indexOf('if (!import.meta.env.DEV) {'),
      code.indexOf('    return;\n  }'),
    );
    expect(prodBranch).toContain('import.meta.env.VITE_COACH_PIN_HASH');
    expect(prodBranch).toContain('isWellFormedPinHash');
  });
});
