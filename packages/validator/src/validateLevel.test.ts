// The per-level rules, called directly as the level editor will (no files, no paths).
// content:check keeps its fixture per rule (tools/content-check/fixtures/).
import { describe, expect, it } from 'vitest';
import { programToWorkspace } from './search/program';
import { validateLevel } from './validateLevel';
import { countWords } from './words';

const walk = { block: 'runner_walk' };
const jump = { block: 'runner_jump' };

/** A valid build level: walk, jump over the hole, walk to the flag (par 3). */
function level(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'w01-l01',
    worldId: 'w01-fixture',
    stage: 'guided',
    kind: 'runner',
    mode: 'build',
    title: 'Nhảy qua hố',
    objective: 'Nhảy qua hố để tới lá cờ nhé!',
    learningGoal: 'Dùng khối đi và khối nhảy.',
    misconception: 'Măng tự biết né hố.',
    thinkingHint: 'Ngay trước hố, Măng phải làm gì?',
    toolbox: ['runner_walk', 'runner_jump'],
    par: 3,
    config: { cells: ['ground', 'ground', 'hole', 'ground', 'flag'], start: 0 },
    solution: programToWorkspace([walk, jump, walk]),
    hints: [
      { id: 'walk-new', when: { trigger: 'enter' }, say: 'Khối đi.', point: 'toolbox:runner_walk' },
    ],
    ...extra,
  };
}

function messages(json: unknown, options?: Parameters<typeof validateLevel>[1]): string[] {
  return validateLevel(json, options).issues.map(
    (issue) => `${String(issue.rule)} ${issue.message}`,
  );
}

describe('validateLevel', () => {
  it('passes a good level and counts its solution', () => {
    const result = validateLevel(level());
    expect(result.issues).toEqual([]);
    expect(result.solutionBlocks).toBe(3);
    expect(result.level?.id).toBe('w01-l01');
  });

  it('rule 1: schema and config', () => {
    const noTitle = level();
    delete noTitle['title'];
    expect(messages(noTitle)[0]).toMatch(/^1 title: /);
    expect(validateLevel(noTitle).level).toBeNull();
    expect(messages(level({ config: { cells: [] } }))[0]).toMatch(/^1 config\.cells: /);
    expect(messages(level(), { getKind: () => undefined })).toEqual([
      '1 game kind "runner" is not implemented yet',
    ]);
  });

  it('rule 2: the ID pattern, except in drafts', () => {
    expect(messages(level({ id: 'level-1' }))).toEqual([
      '2 level id "level-1" does not match ^w\\d{2}-(?:l\\d{2}|boss|creative|bonus\\d{2})$',
    ]);
    expect(messages(level({ id: 'level-1' }), { isDraft: true })).toEqual([]);
  });

  it('rules 5–6: words, misconception and thinkingHint, except in drafts', () => {
    const bad = level({
      title: 'Một hai ba bốn năm sáu',
      misconception: undefined,
      thinkingHint: undefined,
    });
    expect(messages(bad)).toEqual([
      '5 title has 6 words > 5: "Một hai ba bốn năm sáu"',
      '6 stage guided needs a misconception',
      '6 every non-creative level needs a thinkingHint',
    ]);
    expect(messages(bad, { isDraft: true })).toEqual([]);
    expect(countWords('🎋 Măng — đi! lá cờ')).toBe(4);
  });

  it('rules 9–11: the solution wins within par, maxBlocks and the toolbox', () => {
    expect(messages(level({ solution: programToWorkspace([walk, walk]) }))).toEqual([
      '9 solution ends crash FELL_IN_HOLE (crash:FELL_IN_HOLE@2)',
    ]);
    expect(messages(level({ par: 2, maxBlocks: 2 }))).toEqual([
      '9 solution ends error TOO_MANY_BLOCKS',
      '10 solution uses 3 blocks > par 2',
      '10 solution uses 3 blocks > maxBlocks 2',
    ]);
    expect(messages(level({ toolbox: ['runner_walk'], hints: [] }))).toEqual([
      '11 solution uses "runner_jump", which is not in toolbox',
    ]);
  });

  it('rule 12: no controls_repeat_ext with maxBlocks', () => {
    expect(
      messages(
        level({
          maxBlocks: 5,
          toolbox: [...['runner_walk', 'runner_jump'], 'controls_repeat_ext'],
        }),
      ),
    ).toEqual([
      '12 toolbox has "controls_repeat_ext" but the level sets maxBlocks; use "cq_repeat"',
    ]);
  });

  it('rules 13–15: parsons, bughunt and predict starts', () => {
    expect(
      messages(
        level({ mode: 'parsons', initialWorkspace: programToWorkspace([walk, jump, walk]) }),
      ),
    ).toEqual(['13 initialWorkspace already wins']);
    expect(
      messages(
        level({
          mode: 'bughunt',
          stage: 'boss',
          parEdits: 1,
          initialWorkspace: programToWorkspace([jump, jump, jump]),
        }),
      ),
    ).toEqual(['14 editDistance(initialWorkspace, solution) is 2 > parEdits 1']);
    const options = [
      { key: 'win', label: 'Tới cờ' },
      { key: 'stop@1', label: 'Ô 1' },
      { key: 'stop@3', label: 'Ô 3' },
    ];
    expect(
      messages(
        level({
          mode: 'predict',
          stage: 'practice',
          par: undefined,
          solution: undefined,
          toolbox: [],
          hints: [],
          initialWorkspace: programToWorkspace([walk, jump]),
          predict: { options },
        }),
      ),
    ).toEqual([]);
  });

  it('variants (P2-12): every map is checked and must be won', () => {
    const second = { cells: ['ground', 'ground', 'ground', 'hole', 'ground', 'flag'], start: 0 };
    const straight = {
      cells: ['ground', 'ground', 'ground', 'ground', 'ground', 'flag'],
      start: 0,
    };
    // walk, jump, walk: wins map 1, stops at cell 4 of map 2 (one cell short of the flag).
    expect(messages(level({ variants: [straight] }))).toEqual([
      '9 solution ends incomplete NOT_AT_GOAL (stop@4) on map 2',
    ]);
    const solution = programToWorkspace([walk, jump, walk, walk]);
    const twoMaps = level({
      config: { cells: ['ground', 'ground', 'hole', 'ground', 'ground', 'flag'], start: 0 },
      variants: [second],
      par: 4,
      solution,
    });
    expect(messages(twoMaps)).toEqual([
      '9 solution ends crash FELL_IN_HOLE (crash:FELL_IN_HOLE@3) on map 2',
    ]);
    expect(messages(level({ variants: [{ cells: [] }] }))[0]).toMatch(/^1 variants\.0\.cells: /);
    expect(
      messages(
        level({
          mode: 'parsons',
          initialWorkspace: programToWorkspace([walk]),
          variants: [second],
        }),
      ),
    ).toEqual(['1 variants: "variants" only fits modes build and bughunt']);
  });

  it('rule 16: hint targets and reason codes', () => {
    expect(
      messages(
        level({
          hints: [
            {
              id: 'x',
              when: { not: { lastReason: 'HIT_WALL' } },
              say: 'Thử lại',
              point: 'block:runner_kick',
            },
          ],
        }),
      ),
    ).toEqual([
      '16 hint "x" points to block:runner_kick, which is in neither initialWorkspace nor solution',
      '16 hint "x" waits for lastReason "HIT_WALL", which neither the engine nor "runner" produces',
    ]);
  });
});
