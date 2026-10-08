import { describe, expect, it } from 'vitest';
import { robotlabResolvedSchema } from '@codequest/games';
import { loadPlayContent } from './content';
import { loadSharedRules, withSharedRules } from './sharedRules';

const SHARED = {
  timeLimit: 120,
  costs: { forward: 2, turn: 1, grab: 2, release: 2 },
  points: { contain: 45, neutralize: 160, retrieve: 100, return: 40 },
};

describe('shared rules (content/shared/robotlab.json)', () => {
  it('loads and validates the shared robotlab rules', async () => {
    expect((await loadSharedRules()).robotlab).toEqual(SHARED);
  });

  it('merges them into a lesson demo card, keeping the card’s own overrides', async () => {
    const card = {
      type: 'demo' as const,
      text: 'Tiến 2 ô',
      kind: 'robotlab' as const,
      config: {
        map: ['#####', 'L....', '#####'],
        startDir: 'W',
        start: [1, 4],
        goal: { type: 'missions', mustReturn: true },
        rules: { timeLimit: 14 },
      },
      workspace: { blocks: { languageVersion: 0, blocks: [] } },
    };
    const resolved = await withSharedRules(card);
    expect(robotlabResolvedSchema.parse(resolved.config).rules).toEqual({
      ...SHARED,
      timeLimit: 14,
    });
    expect(card.config.rules).toEqual({ timeLimit: 14 });
  });

  it('leaves other kinds alone (same object, no load)', async () => {
    const card = { kind: 'maze', config: { map: ['S.G'] } };
    expect(await withSharedRules(card)).toBe(card);
  });

  it('the play loader resolves robotlab levels: config and predict answers see the rules', async () => {
    const content = await loadPlayContent('robotlab-predict');
    expect(robotlabResolvedSchema.parse(content?.level.config).rules).toEqual(SHARED);
  });
});
