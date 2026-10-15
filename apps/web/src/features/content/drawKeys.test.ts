import { describe, expect, it } from 'vitest';
import { loadPlayContent } from './content';
import { withDrawKeys } from './drawKeys';

describe('withDrawKeys', () => {
  it('writes the key of every drawProgram card of a turtle predict level', async () => {
    const content = await loadPlayContent('turtle-predict');
    const options = content?.level.predict?.options ?? [];
    expect(options).toHaveLength(3);
    for (const option of options) {
      expect(option.drawProgram).toBeUndefined();
      expect(option.key?.startsWith('draw:')).toBe(true);
    }
    expect(new Set(options.map((option) => option.key)).size).toBe(3);
  });

  it('leaves other levels as they are', async () => {
    const content = await loadPlayContent('maze-predict');
    expect(content).not.toBeNull();
    if (content === null) return;
    expect(withDrawKeys(content.level)).toBe(content.level);
  });
});
