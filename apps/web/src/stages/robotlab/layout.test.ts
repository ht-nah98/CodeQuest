import { describe, expect, it } from 'vitest';
import type { Level, WorkspaceJson } from '@codequest/content-schema';
import { CQ_START, type RunOutcome } from '@codequest/engine';
import { type RobotLabConfig, type RobotLabEvent, robotlabResolvedSchema } from '@codequest/games';
import { loadPlayContent } from '../../features/content/content';
import { loadSharedRules, withSharedRules } from '../../features/content/sharedRules';
import { runProgram } from '../../features/play/run';
import { PATTERNS, patternPixels } from '../maze/pixelArt';
import {
  applyEvent,
  type BoardState,
  boardScore,
  cellCenter,
  computeRobotLayout,
  headingRotation,
  heldIndex,
  HUD_CHIP_HEIGHT,
  HUD_GAP,
  HUD_MARGIN,
  initialBoard,
  jobKinds,
  LABEL_STRIP,
  layoutHud,
  lineSegments,
  MAT_CELLS,
  robotGeometry,
  secondsLeft,
  stepCell,
  turnDelta,
} from './layout';
import {
  BUILDING,
  BUILDING_PALETTES,
  CLAW_CLOSED,
  CLAW_OPEN,
  CLOCK,
  colorPalette,
  FENCE,
  FLASK,
  NEUTRALIZER,
  POLLUTION,
  ROBOT_BODY,
  ROBOT_PALETTE,
} from './robotArt';

type Block = { type: string; id: string; fields?: Record<string, unknown> };
const F = (id: string, n: number): Block => ({ type: 'robot_forward', id, fields: { N: n } });
const R = (id: string): Block => ({ type: 'robot_turn_right', id });
const L = (id: string): Block => ({ type: 'robot_turn_left', id });
const GRAB = (id: string): Block => ({ type: 'robot_grab', id });
const DROP = (id: string): Block => ({ type: 'robot_release', id });

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

async function sandbox(id: string): Promise<{ level: Level; config: RobotLabConfig }> {
  const content = await loadPlayContent(id);
  if (!content) throw new Error(`${id} missing`);
  return { level: content.level, config: robotlabResolvedSchema.parse(content.level.config) };
}

/** The board after replaying every robotlab event of a run. */
function replay(config: RobotLabConfig, outcome: RunOutcome): BoardState {
  let state = initialBoard(config);
  for (const event of outcome.events) {
    if (event.type === 'highlight' || event.type === 'sense') continue;
    state = applyEvent(state, event as RobotLabEvent);
  }
  return state;
}

describe('computeRobotLayout', () => {
  it('fits a 3×5 board under a one-row HUD in the play column at 1280×720', () => {
    const layout = computeRobotLayout(3, 5, 516, 360, 56);
    expect(layout.cellPx % 16).toBe(0);
    expect(layout.cellPx).toBe(64);
    expect(layout.texel).toBe(4);
    // The mat (half a cell around) stays inside the stage, below the HUD, above the tag strip.
    const mat = MAT_CELLS * layout.cellPx;
    expect(layout.originX - mat).toBeGreaterThanOrEqual(0);
    expect(layout.originY - mat).toBeGreaterThanOrEqual(56);
    expect(layout.originY + 3 * layout.cellPx + mat).toBeLessThanOrEqual(360 - LABEL_STRIP);
    expect(layout.originX + 5 * layout.cellPx + mat).toBeLessThanOrEqual(516);
  });

  it('keeps a 9×9 contest board readable: whole px, at least 20 px a crossing', () => {
    const layout = computeRobotLayout(9, 9, 516, 360, 104);
    expect(Number.isInteger(layout.cellPx)).toBe(true);
    expect(layout.cellPx).toBeGreaterThanOrEqual(20);
    expect(layout.robotScale).toBeGreaterThanOrEqual(1);
    expect(layout.blockScale).toBeGreaterThanOrEqual(1);
  });

  it('centres crossings and grows with a bigger stage (1366×768)', () => {
    const small = computeRobotLayout(3, 5, 516, 360, 56);
    const big = computeRobotLayout(3, 5, 553, 408, 56);
    expect(big.cellPx).toBeGreaterThanOrEqual(small.cellPx);
    const centre = cellCenter(small, 1, 2);
    expect(centre.x).toBeCloseTo(258, -1);
  });

  it('places Bíp’s gripper ahead of its body and a held block between the prongs', () => {
    const g = robotGeometry(64, 3);
    expect(g.bodyY).toBeGreaterThan(0);
    expect(g.clawBaseY).toBeLessThan(g.bodyY);
    expect(g.heldY).toBeLessThan(g.clawBaseY);
  });
});

describe('layoutHud', () => {
  it('puts chips in one row when they fit, else wraps to more rows', () => {
    const one = layoutHud([120, 80, 80], 516);
    expect(one.chips.map((c) => c.y)).toEqual([HUD_MARGIN, HUD_MARGIN, HUD_MARGIN]);
    expect(one.band).toBe(HUD_MARGIN + HUD_CHIP_HEIGHT + HUD_GAP);
    const two = layoutHud([140, 120, 120, 120, 160], 516);
    expect(two.chips[3]?.x).toBe(HUD_MARGIN);
    expect(two.band).toBe(HUD_MARGIN + 2 * (HUD_CHIP_HEIGHT + HUD_GAP));
    expect(layoutHud([], 516).band).toBe(0);
  });
});

describe('board geometry', () => {
  it('draws one line segment between each pair of neighbouring crossings, none into houses', () => {
    const segments = lineSegments(['#.#', 'L..', '#.#']);
    expect(segments).toHaveLength(4);
    for (const [a, b] of segments) {
      expect(Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1])).toBe(1);
    }
  });

  it('turns: right is +90°, left −90°, headings rotate the N-facing art', () => {
    expect(turnDelta('N', 'E')).toBeCloseTo(Math.PI / 2);
    expect(turnDelta('N', 'W')).toBeCloseTo(-Math.PI / 2);
    expect(turnDelta('W', 'N')).toBeCloseTo(Math.PI / 2);
    expect(headingRotation('S')).toBeCloseTo(Math.PI);
    expect(stepCell([1, 1], 'N')).toEqual([0, 1]);
  });

  it('every art pattern has even rows and known colours', () => {
    for (const rows of [ROBOT_BODY, CLAW_OPEN, CLAW_CLOSED, FENCE, FLASK]) {
      expect(() => patternPixels(rows, ROBOT_PALETTE)).not.toThrow();
    }
    for (const rows of [NEUTRALIZER, POLLUTION]) {
      expect(() => patternPixels(rows, colorPalette('GREEN'))).not.toThrow();
    }
    for (const palette of BUILDING_PALETTES)
      expect(() => patternPixels(BUILDING, palette)).not.toThrow();
    expect(() => patternPixels(CLOCK, { ...ROBOT_PALETTE, X: '#e8615e' })).not.toThrow();
    expect(() => patternPixels(PATTERNS.sparkle)).not.toThrow();
  });
});

describe('replay model vs engine (same jobs, points and answer keys)', () => {
  it('robotlab-stage: drive, grab, turn, drive home, release in the lab = 140 points', async () => {
    const { level, config } = await sandbox('robotlab-stage');
    // The content loader merged the shared rules under the level's own time limit.
    expect(config.rules).toEqual({
      timeLimit: 20,
      costs: { forward: 2, turn: 1, grab: 2, release: 2 },
      points: { contain: 45, neutralize: 160, retrieve: 100, return: 40 },
    });
    expect(jobKinds(config)).toEqual(['contain', 'neutralize', 'retrieve', 'home']);
    const outcome = runProgram(level, level.solution ?? program());
    expect(outcome.result).toBe('success');
    const end = replay(config, outcome);
    expect(end.pos).toEqual([1, 0]);
    expect(heldIndex(end)).toBe(-1);
    expect(end.t).toBe(18);
    expect(secondsLeft(config, end.t)).toBe(2);
    const score = boardScore(end, config);
    expect(score.retrieve).toEqual({ done: 1, total: 1, points: 100, max: 100 });
    expect(score.home).toEqual({ done: 1, total: 1, points: 40, max: 40 });
    // What each job is worth: the rules' points × the blocks (zones) of that kind.
    expect(score.contain.max).toBe(45);
    expect(score.neutralize.max).toBe(160);
    expect(score.total).toBe(140);
  });

  it('out of time in the lab: the clock is at 0, only the 40 home points count', async () => {
    const { level, config } = await sandbox('robotlab-stage');
    const turns = Array.from({ length: 6 }, (_, i) => R(`r${String(i)}`));
    const outcome = runProgram(
      level,
      program(F('f1', 3), GRAB('g1'), ...turns, F('f2', 3), DROP('d1')),
    );
    expect(outcome.reasonCode).toBe('LOW_SCORE');
    const end = replay(config, outcome);
    expect(end.timeUp).toBe(true);
    expect(secondsLeft(config, end.t)).toBe(0);
    expect(boardScore(end, config).total).toBe(40);
    // Held when time ran out: the pollution block is still in the gripper.
    expect(end.blocks[heldIndex(end)]?.kind).toBe('pollution');
  });

  it('a crash keeps the clock and marks where Bíp bumped', async () => {
    const { level, config } = await sandbox('robotlab-stage');
    const outcome = runProgram(level, program(F('f1', 4)));
    expect(outcome.result).toBe('crash');
    expect(outcome.reasonCode).toBe('HIT_BLOCK');
    const end = replay(config, outcome);
    expect(end.crash).toEqual({ at: [1, 2], why: 'block' });
    expect(end.pos).toEqual([1, 2]);
    expect(end.t).toBe(4);
  });

  /** A score level on `board` (shared rules merged), run headlessly as a predict level. */
  async function scoreRun(board: Record<string, unknown>, workspace: WorkspaceJson) {
    const { level } = await sandbox('robotlab-stage');
    const shared = await loadSharedRules();
    const written = { ...level, config: { ...board, goal: { type: 'score', target: 999 } } };
    const resolved = await withSharedRules(written);
    const config = robotlabResolvedSchema.parse(resolved.config);
    expect(config.rules.costs).toEqual(shared.robotlab?.costs);
    const outcome = runProgram(
      { ...resolved, mode: 'predict', initialWorkspace: workspace },
      workspace,
    );
    return { outcome, config, end: replay(config, outcome) };
  }

  const fenceBoard = {
    map: ['###Z#', 'L....', '#####'],
    startDir: 'E',
    blocks: [{ kind: 'fence', at: [1, 2] }],
  };
  const stationBoard = {
    map: ['#####', 'L.r.y', '#####'],
    startDir: 'E',
    blocks: [{ kind: 'neutralizer', color: 'RED', at: [1, 3] }],
  };
  const toRed = [F('f1', 3), GRAB('g1'), R('r1'), R('r2'), F('f2', 1), DROP('d1')];

  it('replay vs engine (answerKey = robotlabScore): every workspace of the stage level', async () => {
    const { level } = await sandbox('robotlab-stage');
    const config = robotlabResolvedSchema.parse(level.config);
    // A score level's predict key is `score:<points>`: replaying must give the same number.
    for (const workspace of [
      level.solution ?? program(),
      program(F('f1', 3), GRAB('g1'), R('r1'), R('r2'), F('f2', 1), DROP('d1')),
      program(F('f1', 1)),
    ]) {
      const outcome = runProgram(
        { ...level, mode: 'predict', initialWorkspace: workspace },
        workspace,
      );
      const end = replay(config, outcome);
      expect(outcome.answerKey).toBe(`score:${String(boardScore(end, config).total)}`);
    }
  });

  it('replay vs engine: a fence dropped on Z contains it (45)', async () => {
    const { outcome, config, end } = await scoreRun(
      fenceBoard,
      program(F('f1', 2), GRAB('g1'), F('f2', 1), L('l1'), F('f3', 1), DROP('d1')),
    );
    expect(outcome.answerKey).toBe('score:45');
    expect(boardScore(end, config).contain).toEqual({ done: 1, total: 1, points: 45, max: 45 });
  });

  it('replay vs engine: a neutraliser on its station (160); a wrong one is WRONG_COLOR', async () => {
    const right = await scoreRun(stationBoard, program(...toRed));
    expect(right.outcome.answerKey).toBe('score:160');
    expect(boardScore(right.end, right.config).neutralize.points).toBe(160);

    const wrong = await scoreRun(
      stationBoard,
      program(F('f1', 3), GRAB('g1'), F('f2', 1), DROP('d1')),
    );
    expect(wrong.outcome.answerKey).toBe('crash:WRONG_COLOR@1,4');
    expect(wrong.end.crash).toEqual({ at: [1, 4], why: 'WRONG_COLOR' });
    expect(boardScore(wrong.end, wrong.config).total).toBe(0);
  });

  it('replay vs engine: grabbing the block back off its station loses the 160', async () => {
    const { outcome, config, end } = await scoreRun(stationBoard, program(...toRed, GRAB('g2')));
    expect(outcome.answerKey).toBe('score:0');
    expect(boardScore(end, config).total).toBe(0);
    expect(end.blocks[heldIndex(end)]?.kind).toBe('neutralizer');
  });

  it('replay vs engine: time up while holding the block scores what is done', async () => {
    const { outcome, config, end } = await scoreRun(
      { ...stationBoard, rules: { timeLimit: 11 } },
      program(...toRed),
    );
    expect(outcome.answerKey).toBe('score:0');
    expect(end.timeUp).toBe(true);
    expect(heldIndex(end)).toBe(0);
    expect(boardScore(end, config).total).toBe(0);
    expect(secondsLeft(config, end.t)).toBe(1);
  });
});
