import { describe, expect, it } from 'vitest';
import type { Level, WorkspaceJson } from '@codequest/content-schema';
import { CQ_REPEAT, CQ_START } from '@codequest/engine';
import { loadPlayContent } from '../content/content';
import { offendingBlockId, resultLine, runProgram } from './run';

type Block = { type: string; id: string; fields?: Record<string, unknown>; inputs?: unknown };

/** "khi bắt đầu" followed by `blocks` in a chain. */
function program(...blocks: Block[]): WorkspaceJson {
  let next: unknown;
  for (const block of [...blocks].reverse()) {
    next = { block: { ...block, ...(next !== undefined && { next }) } };
  }
  return {
    blocks: {
      languageVersion: 0,
      blocks: [{ type: CQ_START, id: 'start', ...(next !== undefined && { next }) }],
    },
  };
}
const walk = (id: string): Block => ({ type: 'runner_walk', id });
const jump = (id: string): Block => ({ type: 'runner_jump', id });
/** cq_repeat 20 × (`inner` or nothing). */
const repeat = (id: string, inner?: Block): Block => ({
  type: CQ_REPEAT,
  id,
  fields: { TIMES: 20 },
  ...(inner && { inputs: { DO: { block: inner } } }),
});

async function level(): Promise<Level> {
  const content = await loadPlayContent('w01-l03');
  if (!content) throw new Error('w01-l03 missing');
  return content.level;
}

describe('runProgram on w01-l03', () => {
  it('wins with the solution and highlights every block in order', async () => {
    const lvl = await level();
    const outcome = runProgram(lvl, program(walk('a'), jump('b'), walk('c')));
    expect(outcome.result).toBe('success');
    expect(outcome.events.map((e) => e.type)).toEqual([
      'highlight', // khi bắt đầu
      'highlight',
      'walk',
      'highlight',
      'jump',
      'highlight',
      'walk',
      'win',
    ]);
    expect(offendingBlockId(outcome)).toBeNull();
  });

  it('falls in the hole with "đi, đi" and blames the second walk', async () => {
    const lvl = await level();
    const outcome = runProgram(lvl, program(walk('a'), walk('b')));
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'FELL_IN_HOLE' });
    expect(offendingBlockId(outcome)).toBe('b');
  });

  it('ends a 160 000-turn loop with TIMEOUT instead of hanging', async () => {
    const lvl = await level();
    const loops = repeat('r1', repeat('r2', repeat('r3', repeat('r4'))));
    const outcome = runProgram(lvl, program(loops));
    expect(outcome).toMatchObject({ result: 'timeout', reasonCode: 'TIMEOUT' });
    expect(offendingBlockId(outcome)).not.toBeNull();
  });

  it('throws for a game kind that is not implemented', async () => {
    const lvl = { ...(await level()), kind: 'music' as const };
    expect(() => runProgram(lvl, program(walk('a')))).toThrow(/not implemented/);
  });
});

describe('resultLine', () => {
  const feedback = { FELL_IN_HOLE: 'Ối, hố! Thử khối nhảy nhé.', INTERNAL_ERROR: 'Ối.' };
  const stats = { steps: 1, actions: 1, blocksUsed: 3 };

  it('praises par, praises more under par and nudges above it', () => {
    const win = { result: 'success', reasonCode: null, events: [], stats } as const;
    expect(resultLine(win, { par: 3 }, feedback)).toBe('Chỉ 3 khối, đúng bằng số chuẩn!');
    expect(resultLine(win, { par: 2 }, feedback)).toBe('Qua màn rồi! Thử ít khối hơn nhé?');
    expect(resultLine(win, { par: 4 }, feedback)).toBe('Chỉ 3 khối, ít hơn cả số chuẩn!');
  });

  it('uses the feedback line of the reason', () => {
    const fell = { result: 'crash', reasonCode: 'FELL_IN_HOLE', events: [], stats } as const;
    expect(resultLine(fell, {}, feedback)).toBe('Ối, hố! Thử khối nhảy nhé.');
  });
});
