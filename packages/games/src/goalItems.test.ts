import { describe, expect, it } from 'vitest';
import { GOAL_ITEM_KINDS, MISSED_REASONS, NEED_REASONS } from './goalItems';
import { maze } from './maze';
import { runner } from './runner';

describe('goal items (P2-11c)', () => {
  it('every NEED_* reason is a reason code of runner and maze, and a missed@ reason', () => {
    for (const kind of GOAL_ITEM_KINDS) {
      const reason = NEED_REASONS[kind];
      expect(runner.reasonCodes).toContain(reason);
      expect(maze.reasonCodes).toContain(reason);
      expect(MISSED_REASONS.has(reason)).toBe(true);
    }
  });
});
