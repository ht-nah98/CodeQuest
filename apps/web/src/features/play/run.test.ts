import { describe, expect, it } from 'vitest';
import type { Level, WorkspaceJson } from '@codequest/content-schema';
import { CQ_REPEAT, CQ_START } from '@codequest/engine';
import { loadPlayContent } from '../content/content';
import { mapReplays, mapsOf, offendingBlockId, resultLine, runProgram } from './run';

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

  it('praises by mode: edits in bughunt, nothing to grade in creative', () => {
    const win = { result: 'success' as const, reasonCode: null, events: [], stats };
    expect(resultLine({ ...win, edits: 1 }, { mode: 'bughunt', parEdits: 1 }, feedback)).toBe(
      'Chỉ sửa 1 khối, giỏi quá!',
    );
    expect(resultLine({ ...win, edits: 2 }, { mode: 'bughunt' }, feedback)).toBe(
      'Hết lỗi rồi! Thử sửa ít khối hơn nhé?',
    );
    expect(resultLine(win, { mode: 'creative', par: 1 }, feedback)).toBe(
      'Măng diễn xong rồi! Bấm Lưu để giữ nhé.',
    );
  });

  it('uses the feedback line of the reason', () => {
    const fell = { result: 'crash', reasonCode: 'FELL_IN_HOLE', events: [], stats } as const;
    expect(resultLine(fell, {}, feedback)).toBe('Ối, hố! Thử khối nhảy nhé.');
  });
});

describe('multi-map levels (P2-12)', () => {
  async function maps(): Promise<Level> {
    const content = await loadPlayContent('runner-maps');
    if (!content) throw new Error('runner-maps missing');
    return content.level;
  }

  it('lists the maps in order: config, then each variant', async () => {
    const lvl = await maps();
    expect(mapsOf(lvl)).toEqual([lvl.config, ...(lvl.variants ?? [])]);
    expect(mapsOf({ config: 1 })).toEqual([1]);
  });

  it('replays every map up to the first one not won, which decides the result', async () => {
    const lvl = await maps();
    // Right for map 1 only: walk, jump, then walk to the flag; map 2 has a hole at cell 5.
    const outcome = runProgram(lvl, program(walk('a'), jump('b'), repeat('r', walk('c'))));
    expect(outcome).toMatchObject({ result: 'crash', reasonCode: 'FELL_IN_HOLE', mapIndex: 1 });
    const replays = mapReplays(outcome);
    expect(replays.map((replay) => [replay.map, replay.outcome.result])).toEqual([
      [0, 'success'],
      [1, 'crash'],
    ]);
    expect(offendingBlockId(outcome)).toBe('c');
  });

  it('replays all maps on a win, and the run itself when it could not start', async () => {
    const lvl = await maps();
    const solution = lvl.solution;
    if (!solution) throw new Error('no solution');
    expect(mapReplays(runProgram(lvl, solution)).map((replay) => replay.map)).toEqual([0, 1, 2]);
    const empty = runProgram(lvl, program());
    expect(mapReplays(empty)).toEqual([{ map: null, outcome: empty }]);
  });
});
