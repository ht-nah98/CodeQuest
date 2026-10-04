import { describe, expect, it } from 'vitest';
import { planSourceFor } from './planSource';

describe('planSourceFor', () => {
  it('gives runner and maze maps a feed, nothing for other kinds or bad configs', () => {
    const runner = planSourceFor('runner', { cells: ['ground', 'ground', 'flag'], start: 0 });
    expect(runner?.kind).toBe('runner');
    expect(runner?.feed.getSnapshot().at).toBe(0);
    const maze = planSourceFor('maze', { map: ['S.G', '...', '...'], startDir: 'E' });
    expect(maze?.kind).toBe('maze');
    expect(planSourceFor('runner', { cells: [] })).toBeNull();
    expect(planSourceFor('maze', { cells: ['ground'], start: 0 })).toBeNull();
  });

  it('carries the level goal picture (P2-11c), none by default', () => {
    const config = { map: ['S.G', '...', '...'], startDir: 'E' };
    expect(planSourceFor('maze', config, 'exit')?.goalSprite).toBe('exit');
    expect(planSourceFor('maze', config)).not.toHaveProperty('goalSprite');
  });
});
