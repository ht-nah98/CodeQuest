import { describe, expect, it } from 'vitest';
import type { Level } from '@codequest/content-schema';
import { newDraft, withMode } from './draft';
import {
  canSearchPar,
  EDITOR_MAX_SIZE,
  parAdvice,
  searchKey,
  searchLimits,
  searchPar,
  type ParSearchReply,
} from './parSearch';

type Ok = Extract<ParSearchReply, { ok: true }>;

const level = (patch: Partial<Level>): Level => ({
  ...newDraft('runner'),
  title: 'Hố',
  objective: 'Tới cờ!',
  learningGoal: 'Nhảy.',
  toolbox: ['runner_walk', 'runner_jump'],
  config: { cells: ['ground', 'ground', 'hole', 'ground', 'flag'], start: 0 },
  ...patch,
});

describe('par search of the level editor', () => {
  it('finds the fewest blocks and judges par like npm run par', () => {
    const reply = searchPar(level({ par: 3 }));
    if (!reply.ok) throw new Error(reply.message);
    expect(reply.shortest.minBlocks).toBe(3);
    expect(reply.shortest.complete).toBe(true);
    expect(reply.fixes).toBeNull();
    expect(parAdvice({ mode: 'build', par: 3 }, reply)).toEqual([
      { tone: 'ok', kind: 'parOk', value: 3 },
    ]);
    expect(parAdvice({ mode: 'build', par: 4 }, reply)).toEqual([
      { tone: 'error', kind: 'parTooHigh', value: 3 },
    ]);
    expect(parAdvice({ mode: 'build', par: 2 }, reply)).toEqual([
      { tone: 'error', kind: 'parTooLow', value: 3 },
    ]);
    const partial: Ok = { ...reply, shortest: { ...reply.shortest, unsupported: ['x'] } };
    expect(parAdvice({ mode: 'build', par: 2 }, partial)).toEqual([
      { tone: 'warn', kind: 'unsupported' },
      { tone: 'warn', kind: 'parTooLow', value: 3 },
    ]);
  });

  it('star goals (P2-21): par counts goal-meeting wins, the plain win is shown beside it', () => {
    // 7 cells, bamboo on cell 5: three jumps win without it, collecting needs a fourth block.
    const draft = level({
      par: 4,
      config: {
        cells: ['ground', 'ground', 'ground', 'ground', 'ground', 'ground', 'flag'],
        start: 0,
        bamboo: [5],
      },
      starGoals: [{ kind: 'collectAll' }],
    });
    const reply = searchPar(draft);
    if (!reply.ok) throw new Error(reply.message);
    expect(reply.shortest.minBlocks).toBe(4);
    expect(reply.plain?.minBlocks).toBe(3);
    const noGoals = searchPar({ ...draft, starGoals: undefined });
    if (!noGoals.ok) throw new Error(noGoals.message);
    expect(noGoals.plain).toBeNull();
    expect(searchKey(draft)).not.toBe(searchKey({ ...draft, starGoals: undefined }));
  });

  it('is an error only when a complete search finds no win', () => {
    // Without "nhảy" the hole cannot be crossed.
    const reply = searchPar(level({ par: 3, toolbox: ['runner_walk'] }));
    if (!reply.ok) throw new Error(reply.message);
    expect(parAdvice({ mode: 'build', par: 3 }, reply)).toEqual([
      { tone: 'error', kind: 'noWin', value: EDITOR_MAX_SIZE },
    ]);
    const stopped: Ok = { ...reply, shortest: { ...reply.shortest, complete: false } };
    expect(parAdvice({ mode: 'build', par: 3 }, stopped)).toEqual([
      { tone: 'warn', kind: 'stopped' },
      { tone: 'warn', kind: 'noWinMaybe', value: reply.shortest.searchedSize },
    ]);
  });

  it('counts the fewest fixes of a bughunt level', () => {
    const draft = withMode(
      level({
        par: 3,
        solution: {
          blocks: {
            languageVersion: 0,
            blocks: [
              {
                type: 'cq_start',
                id: 'start',
                next: {
                  block: {
                    type: 'runner_walk',
                    id: 'a',
                    next: {
                      block: {
                        type: 'runner_jump',
                        id: 'b',
                        next: { block: { type: 'runner_walk', id: 'c' } },
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      }),
      'bughunt',
    );
    const broken: Level = {
      ...draft,
      initialWorkspace: {
        blocks: {
          languageVersion: 0,
          blocks: [
            {
              type: 'cq_start',
              id: 'start',
              next: {
                block: {
                  type: 'runner_walk',
                  id: 'a',
                  next: {
                    block: {
                      type: 'runner_walk',
                      id: 'b',
                      next: { block: { type: 'runner_walk', id: 'c' } },
                    },
                  },
                },
              },
            },
          ],
        },
      },
    };
    const reply = searchPar(broken);
    if (!reply.ok) throw new Error(reply.message);
    expect(reply.fixes?.minEdits).toBe(1);
    expect(parAdvice(broken, reply)).toContainEqual({ tone: 'ok', kind: 'fixOk', value: 1 });
  });

  it('only searches build and bughunt, and reports a search it cannot run', () => {
    expect(canSearchPar({ mode: 'build' })).toBe(true);
    expect(canSearchPar({ mode: 'bughunt' })).toBe(true);
    expect(canSearchPar({ mode: 'predict' })).toBe(false);
    const reply = searchPar({ ...level({}), mode: 'creative' });
    expect(reply).toMatchObject({ ok: false, unsearchable: false });
  });

  it('stops when asked (the worker passes a wall-clock limit)', () => {
    const long = level({
      par: 12,
      toolbox: ['runner_walk', 'runner_jump', 'runner_crouch', 'runner_kick', 'cq_repeat'],
      config: {
        cells: [...Array<'ground'>(30).fill('ground'), 'hole', 'ground', 'flag'],
        start: 0,
      },
    });
    const reply = searchPar(long, () => true);
    if (!reply.ok) throw new Error(reply.message);
    expect(reply.shortest.complete).toBe(false);
    expect(parAdvice(long, reply)).toContainEqual({ tone: 'warn', kind: 'stopped' });
  });

  it('a result goes stale only when what the search reads changes', () => {
    const base = level({ par: 3 });
    expect(searchKey({ ...base, title: 'Khác', par: 5, hints: [] })).toBe(searchKey(base));
    expect(searchKey({ ...base, toolbox: ['runner_walk'] })).not.toBe(searchKey(base));
    expect(
      searchKey({ ...base, config: { cells: ['ground', 'ground', 'flag'], start: 0 } }),
    ).not.toBe(searchKey(base));
  });

  it('judges parEdits that is too low, and searches past it', () => {
    const reply: Ok = {
      ok: true,
      shortest: { ...(searchPar(level({ par: 3 })) as Ok).shortest },
      fixes: {
        minEdits: 2,
        count: 1,
        examples: [],
        complete: true,
        searchedEdits: 2,
        maxEdits: 2,
        work: 1,
        mismatches: [],
        unsupported: [],
      },
      plain: null,
    };
    expect(parAdvice({ mode: 'bughunt', parEdits: 1 }, reply)).toContainEqual({
      tone: 'error',
      kind: 'fixTooMany',
      value: 2,
    });
    expect(searchLimits({ parEdits: 1 })).toEqual({ maxSize: EDITOR_MAX_SIZE, maxEdits: 2 });
    expect(searchLimits({ par: 14, parEdits: 3 })).toEqual({ maxSize: 14, maxEdits: 3 });
    expect(searchLimits({ par: 3, maxBlocks: 5 }).maxSize).toBe(5);
  });
});
