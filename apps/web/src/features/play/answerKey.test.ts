import { describe, expect, it } from 'vitest';
import { mazeCell, parseAnswerKey, runnerCell } from './answerKey';

describe('parseAnswerKey', () => {
  it('reads every predictAnswer form', () => {
    expect(parseAnswerKey('win')).toEqual({ outcome: 'win', reason: null, cell: null });
    expect(parseAnswerKey('stop@4')).toEqual({ outcome: 'stop', reason: null, cell: '4' });
    expect(parseAnswerKey('missed@6')).toEqual({ outcome: 'missed', reason: null, cell: '6' });
    expect(parseAnswerKey('crash:FELL_IN_HOLE@2')).toEqual({
      outcome: 'crash',
      reason: 'FELL_IN_HOLE',
      cell: '2',
    });
    expect(parseAnswerKey('crash:HIT_WALL@1,3')).toEqual({
      outcome: 'crash',
      reason: 'HIT_WALL',
      cell: '1,3',
    });
  });

  it('rejects other strings', () => {
    expect(parseAnswerKey('timeout')).toBeNull();
    expect(parseAnswerKey('stop')).toBeNull();
    expect(parseAnswerKey('crash@2')).toBeNull();
  });

  it('reads runner and maze cells', () => {
    const runner = parseAnswerKey('stop@4');
    const maze = parseAnswerKey('crash:HIT_WALL@1,3');
    if (runner === null || maze === null) throw new Error('unreachable');
    expect(runnerCell(runner)).toBe(4);
    expect(mazeCell(runner)).toBeNull();
    expect(mazeCell(maze)).toEqual([1, 3]);
    expect(runnerCell(maze)).toBeNull();
  });
});
