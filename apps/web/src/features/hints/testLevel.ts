import type { Level } from '@codequest/content-schema';
import type { LevelSession } from '@codequest/rewards';

/** A runner build level with a thinking hint and a solution, for hint tests. */
export function hintTestLevel(extra: Partial<Level> = {}): Level {
  return {
    id: 'w01-l03',
    worldId: 'w01-lang-tre',
    stage: 'guided',
    kind: 'runner',
    mode: 'build',
    title: 'Nhảy qua hố',
    objective: 'Nhảy qua hố để tới lá cờ nhé!',
    learningGoal: 'Dùng khối nhảy.',
    toolbox: ['runner_walk', 'runner_jump'],
    par: 3,
    config: { cells: ['ground', 'hole', 'flag'], start: 0 },
    solution: {
      blocks: {
        languageVersion: 0,
        blocks: [
          {
            type: 'cq_start',
            id: 'start',
            next: {
              block: {
                type: 'runner_jump',
                id: 'j',
                next: { block: { type: 'runner_walk', id: 'w' } },
              },
            },
          },
        ],
      },
    },
    hints: [],
    thinkingHint: 'Ngay trước hố, Măng phải làm gì?',
    ...extra,
  };
}

/** A session of `level` whose runs are `fails` failed runs (then nothing else). */
export function sessionWithFails(
  levelId: string,
  fails: number,
  extra: Partial<LevelSession> = {},
): LevelSession {
  return {
    levelId,
    runs: Array.from({ length: fails }, (_, i) => ({
      runId: `r${String(i)}`,
      result: 'crash' as const,
      reasonCode: 'FELL_IN_HOLE',
      blocksUsed: 2,
    })),
    hintTiersBought: [],
    ...extra,
  };
}
