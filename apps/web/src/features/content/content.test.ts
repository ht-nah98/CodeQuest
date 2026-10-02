import { describe, expect, it } from 'vitest';
import {
  assertPlayable,
  feedbackLine,
  levelNumberOf,
  loadPlayContent,
  UnplayableLevelError,
} from './content';

describe('loadPlayContent', () => {
  it('loads and validates w01-l03 with its world and the shared feedback', async () => {
    const content = await loadPlayContent('w01-l03');
    expect(content).not.toBeNull();
    expect(content?.level.kind).toBe('runner');
    expect(content?.world.id).toBe('w01-lang-tre');
    expect(content?.levelNumber).toBe(3);
    expect(content?.feedback.FELL_IN_HOLE).toBeTruthy();
  });

  it('resolves null for an unknown level', async () => {
    expect(await loadPlayContent('w99-nope')).toBeNull();
  });
});

describe('assertPlayable', () => {
  const runner = {
    id: 'w01-l99',
    kind: 'runner',
    mode: 'build',
    config: { cells: ['ground', 'flag', 'ground'], start: 0 },
  } as const;

  it('rejects a kind that is not implemented yet', () => {
    expect(() => {
      assertPlayable({ id: 'w02-l01', kind: 'maze', mode: 'build', config: {} });
    }).toThrow(UnplayableLevelError);
  });

  it('rejects a config the kind does not accept', () => {
    expect(() => {
      assertPlayable(runner);
    }).toThrow(UnplayableLevelError);
  });

  it('rejects a mode the play screen cannot run yet (P1-06)', () => {
    expect(() => {
      assertPlayable({
        ...runner,
        mode: 'predict',
        config: { cells: ['ground', 'flag'], start: 0 },
      });
    }).toThrow(UnplayableLevelError);
  });

  it('accepts a valid runner level', () => {
    expect(() => {
      assertPlayable({ ...runner, config: { cells: ['ground', 'hole', 'flag'], start: 0 } });
    }).not.toThrow();
  });
});

describe('levelNumberOf', () => {
  it('reads the curriculum number from the id', () => {
    expect(levelNumberOf('w01-l03')).toBe(3);
    expect(levelNumberOf('w06-l12')).toBe(12);
  });

  it('has no number for boss or creative levels', () => {
    expect(levelNumberOf('w01-boss')).toBeNull();
    expect(levelNumberOf('w01-creative')).toBeNull();
  });
});

describe('feedbackLine', () => {
  const shared = { FELL_IN_HOLE: 'Ối, hố!', INTERNAL_ERROR: 'Ối, game bị vấp.' };

  it('prefers the level line over the shared one', () => {
    expect(feedbackLine('FELL_IN_HOLE', { feedback: { FELL_IN_HOLE: 'Hố kìa!' } }, shared)).toBe(
      'Hố kìa!',
    );
  });

  it('uses the shared line when the level has none', () => {
    expect(feedbackLine('FELL_IN_HOLE', {}, shared)).toBe('Ối, hố!');
  });

  it('falls back to INTERNAL_ERROR for an unknown reason', () => {
    expect(feedbackLine('HIT_WALL', {}, shared)).toBe('Ối, game bị vấp.');
  });
});
