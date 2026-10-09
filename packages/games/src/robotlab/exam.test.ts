// P3-08: the Thành Phố Măng board and the seeded "Đề mới" generator (game-kinds.md §3.3).
import type { Level } from '@codequest/content-schema';
import { runLevel } from '@codequest/engine';
import { describe, expect, it, vi } from 'vitest';
import {
  boardOfMap,
  EXAM_FAIRNESS,
  examConfig,
  examIssues,
  generateExam,
  planExam,
  planWorkspace,
  resolveRobotlabRules,
  robotlab,
  robotlabLevelConfigSchema,
  robotlabRulesSchema,
  ROBOT_SCENERY,
  THANH_PHO_MANG,
  type PlacedBlock,
  type RobotLabConfig,
} from './index';

const sharedModule = await vi.importActual<{ default: unknown }>(
  '../../../../content/shared/robotlab.json',
);
const rules = robotlabRulesSchema.parse(sharedModule.default);
const TARGET = 300;
const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1);
/** 200 đề take ~1 s alone, more while the whole suite runs in parallel. */
const SLOW = 60_000;

function configOf(blocks: readonly PlacedBlock[]): RobotLabConfig {
  return resolveRobotlabRules(
    robotlabLevelConfigSchema.parse({
      map: [...THANH_PHO_MANG.map],
      startDir: THANH_PHO_MANG.startDir,
      blocks,
      goal: { type: 'score', target: TARGET },
    }),
    rules,
  );
}

function examLevel(
  config: RobotLabConfig,
  mode: Level['mode'],
  program?: Level['solution'],
): Level {
  return {
    id: 'w06-exam',
    worldId: 'w06-thanh-pho-robot',
    stage: 'challenge',
    kind: 'robotlab',
    mode,
    title: 'Thi thử',
    objective: 'Thi thử',
    learningGoal: 'Thi thử',
    toolbox: [],
    hints: [],
    config,
    ...(mode === 'predict' && program !== undefined && { initialWorkspace: program }),
  };
}

describe('Thành Phố Măng board', () => {
  it('is a valid robotlab map with scenery of the same size', () => {
    const parsed = robotlabLevelConfigSchema.safeParse({
      map: [...THANH_PHO_MANG.map],
      startDir: THANH_PHO_MANG.startDir,
      blocks: [
        { kind: 'fence', at: [6, 0] },
        { kind: 'fence', at: [6, 8] },
      ],
      goal: { type: 'missions', mustReturn: true },
    });
    expect(parsed.success).toBe(true);
    expect(THANH_PHO_MANG.map).toHaveLength(7);
    expect(THANH_PHO_MANG.scenery).toHaveLength(THANH_PHO_MANG.map.length);
    THANH_PHO_MANG.map.forEach((row, r) => {
      expect(row).toHaveLength(9);
      const scenery = THANH_PHO_MANG.scenery[r] ?? '';
      expect(scenery).toHaveLength(row.length);
      Array.from(scenery).forEach((letter, c) => {
        expect(ROBOT_SCENERY).toContain(letter);
        const tile = row[c];
        // Bridges are crossings; every other scenery picture sits on a house cell.
        if (letter === 'b') expect(tile).toBe('.');
        else if (letter !== '.') expect(tile).toBe('#');
      });
    });
  });

  it('keeps the bridges clear and finds itself by map', () => {
    for (const [r, c] of THANH_PHO_MANG.keepClear) {
      expect(THANH_PHO_MANG.scenery[r]?.[c]).toBe('b');
    }
    expect(boardOfMap([...THANH_PHO_MANG.map])).toBe(THANH_PHO_MANG);
    expect(boardOfMap(['L..', '...', '...'])).toBeUndefined();
  });
});

describe('generateExam', () => {
  it('gives the same layout and plan for the same seed', () => {
    const a = generateExam(THANH_PHO_MANG, 1234, rules, TARGET);
    const b = generateExam(THANH_PHO_MANG, 1234, rules, TARGET);
    expect(b).toEqual(a);
    expect(examConfig(configOf(a.blocks), 1234)).toEqual(configOf(a.blocks));
  });

  it('gives different layouts for different seeds', () => {
    const layouts = new Set(
      SEEDS.slice(0, 50).map((seed) =>
        JSON.stringify(generateExam(THANH_PHO_MANG, seed, rules, TARGET).blocks),
      ),
    );
    expect(layouts.size).toBe(50);
  });

  it('refuses seeds outside 1–9999', () => {
    for (const seed of [0, -3, 10000, 1.5, Number.NaN]) {
      expect(() => generateExam(THANH_PHO_MANG, seed, rules, TARGET)).toThrow(/exam seed/);
    }
  });

  it(
    'places the kit legally and fairly on 200 seeds',
    () => {
      const lab: [number, number] = [3, 3];
      for (const seed of SEEDS) {
        const { blocks } = generateExam(THANH_PHO_MANG, seed, rules, TARGET);
        expect(examIssues(THANH_PHO_MANG, blocks, rules)).toEqual([]);
        // The engine's own schema accepts the đề (blocks on ".", unique, kit fits the stations).
        expect(robotlabLevelConfigSchema.safeParse(configOf(blocks)).success).toBe(true);
        expect(blocks.filter((block) => block.kind === 'fence')).toHaveLength(2);
        expect(blocks.filter((block) => block.kind === 'neutralizer')).toHaveLength(3);
        expect(blocks.filter((block) => block.kind === 'pollution')).toHaveLength(3);
        // Not everything next to the lab (Manhattan distance is a lower bound of line steps).
        const near = blocks.filter(
          ({ at }) => Math.abs(at[0] - lab[0]) + Math.abs(at[1] - lab[1]) <= 1,
        );
        expect(near.length).toBeLessThanOrEqual(EXAM_FAIRNESS.nearLabMax);
        for (const [r, c] of THANH_PHO_MANG.keepClear) {
          expect(blocks.some(({ at }) => at[0] === r && at[1] === c)).toBe(false);
        }
      }
    },
    SLOW,
  );

  it(
    'is solvable on 200 seeds: the plan wins with the real engine',
    () => {
      for (const seed of SEEDS) {
        const { blocks, plan } = generateExam(THANH_PHO_MANG, seed, rules, TARGET);
        expect(plan.score).toBeGreaterThanOrEqual(TARGET);
        expect(plan.seconds).toBeLessThanOrEqual(rules.timeLimit);
        const config = configOf(blocks);
        const program = planWorkspace(plan.steps);
        const won = runLevel({
          kind: robotlab,
          level: examLevel(config, 'creative'),
          workspace: program,
        });
        expect(won.result, `seed ${String(seed)}`).toBe('success');
        const key = runLevel({
          kind: robotlab,
          level: examLevel(config, 'predict', program),
          workspace: program,
        }).answerKey;
        expect(key, `seed ${String(seed)}`).toBe(`score:${String(plan.score)}`);
      }
    },
    SLOW,
  );
});

describe('examIssues', () => {
  const fair = generateExam(THANH_PHO_MANG, 7, rules, TARGET).blocks;

  it('reports blocks side by side, on a bridge, crowding the lab or off the kit', () => {
    const moved = (index: number, at: [number, number]): PlacedBlock[] =>
      fair.map((block, i) => (i === index ? { ...block, at } : block));
    expect(examIssues(THANH_PHO_MANG, moved(0, [1, 4]), rules).join()).toMatch(/stay clear/);
    expect(examIssues(THANH_PHO_MANG, moved(0, [0, 4]), rules).join()).toMatch(/not "\."/);
    const crowd: PlacedBlock[] = fair.map((block, i) =>
      i === 0 ? { ...block, at: [2, 3] } : i === 1 ? { ...block, at: [4, 2] } : block,
    );
    expect(examIssues(THANH_PHO_MANG, crowd, rules).join()).toMatch(/steps of the lab|touches/);
    expect(examIssues(THANH_PHO_MANG, fair.slice(1), rules).join()).toMatch(/kit/);
  });

  it('reports a job that cannot be done: the yellow station walled off', () => {
    // A block on [1,0] closes the dead end of the yellow station [0,0].
    const blocks: PlacedBlock[] = [
      { kind: 'fence', at: [1, 0] },
      { kind: 'fence', at: [6, 6] },
      { kind: 'neutralizer', color: 'RED', at: [2, 6] },
      { kind: 'neutralizer', color: 'YELLOW', at: [6, 1] },
      { kind: 'neutralizer', color: 'GREEN', at: [0, 6] },
      { kind: 'pollution', color: 'RED', at: [4, 0] },
      { kind: 'pollution', color: 'GREEN', at: [2, 8] },
      { kind: 'pollution', color: 'YELLOW', at: [6, 3] },
    ];
    expect(examIssues(THANH_PHO_MANG, blocks, rules).join()).toMatch(
      /neutralizer at 6,1 cannot be done/,
    );
  });
});

describe('planExam', () => {
  it('ends in the lab after retrieving, and stops when nothing fits the clock', () => {
    // planExam does not need a schema-valid kit: one pollution block, no fences for the zones.
    const config: RobotLabConfig = {
      map: [...THANH_PHO_MANG.map],
      startDir: 'N',
      blocks: [{ kind: 'pollution', color: 'RED', at: [1, 3] }],
      goal: { type: 'score', target: TARGET },
      rules,
    };
    const plan = planExam(config);
    expect(plan.steps).toEqual([
      { do: 'forward', n: 2 },
      { do: 'grab' },
      { do: 'left' },
      { do: 'left' },
      { do: 'forward', n: 2 },
      { do: 'release' },
    ]);
    expect(plan).toMatchObject({ score: 140, jobs: 1, home: true, seconds: 14 });
    const tight = planExam({ ...config, rules: { ...config.rules, timeLimit: 5 } });
    expect(tight).toMatchObject({ steps: [], score: 40, jobs: 0, home: true });
  });
});
