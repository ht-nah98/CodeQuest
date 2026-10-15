import { LevelSchema, type WorkspaceJson } from '@codequest/content-schema';
import { runLevel } from '@codequest/engine';
import { getGameKind } from '@codequest/games';
import { describe, expect, it } from 'vitest';
import { predictOptionKey } from './index';

const forward: WorkspaceJson = {
  blocks: {
    languageVersion: 0,
    blocks: [
      { type: 'cq_start', id: 'start', next: { block: { type: 'maze_forward', id: 'f1' } } },
    ],
  },
};
const level = LevelSchema.parse({
  id: 'predict-key',
  worldId: '_sandbox',
  stage: 'practice',
  kind: 'maze',
  mode: 'predict',
  title: 't',
  objective: 'o',
  learningGoal: 'g',
  toolbox: [],
  config: { map: ['#####', '#S.G#', '#####'], startDir: 'E' },
  initialWorkspace: forward,
  predict: {
    options: [
      { key: 'a', label: 'a' },
      { key: 'b', label: 'b' },
      { key: 'c', label: 'c' },
    ],
  },
  hints: [],
});
const kind = getGameKind(level.kind);

describe('predictOptionKey (ADR-0024 §5)', () => {
  it('is the hand-written key when there is one', () => {
    if (kind === undefined) throw new Error('no maze kind');
    expect(predictOptionKey(kind, level, { key: 'win', label: 'a' })).toBe('win');
  });

  it('is the answer key of running drawProgram otherwise', () => {
    if (kind === undefined || level.initialWorkspace === undefined) throw new Error('bad level');
    // A drawProgram card (turtle only in content; the derivation itself is kind-agnostic).
    const card = { drawProgram: level.initialWorkspace, label: 'a' };
    const expected = runLevel({ kind, level, workspace: level.initialWorkspace }).answerKey;
    expect(expected).toBeDefined();
    expect(predictOptionKey(kind, level, card)).toBe(expected);
    // Another program gives its own key, not the level's initialWorkspace one.
    const turn: WorkspaceJson = {
      blocks: {
        languageVersion: 0,
        blocks: [
          {
            type: 'cq_start',
            id: 'start',
            next: { block: { type: 'maze_turn_left', id: 't1' } },
          },
        ],
      },
    };
    const other = predictOptionKey(kind, level, { drawProgram: turn, label: 'b' });
    expect(other).toBeDefined();
    expect(other).not.toBe(expected);
    expect(predictOptionKey(kind, level, { label: 'a' })).toBeUndefined();
    // maxBlocks caps the child's program, not an answer card's.
    const capped = { ...level, maxBlocks: 1 };
    const twoBlocks: WorkspaceJson = {
      blocks: {
        languageVersion: 0,
        blocks: [
          {
            type: 'cq_start',
            id: 'start',
            next: {
              block: {
                type: 'maze_turn_left',
                id: 't1',
                next: { block: { type: 'maze_turn_right', id: 't2' } },
              },
            },
          },
        ],
      },
    };
    expect(predictOptionKey(kind, capped, { drawProgram: twoBlocks, label: 'c' })).toBeDefined();
  });
});
