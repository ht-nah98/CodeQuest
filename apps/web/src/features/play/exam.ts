// Mock exam ("thi thử", P3-08, game-kinds.md §3.3): the scoreboard of a đề and the points of a
// run. Pure: the play screen keeps the board in state and the stage never computes it.
import type { RunOutcome } from '@codequest/engine';
import {
  EXAM_SEED_MAX,
  EXAM_SEED_MIN,
  isExamSeed,
  type RobotLabConfig,
  type RobotLabEvent,
} from '@codequest/games';
import { applyEvent, boardScore, initialBoard } from '../../stages/robotlab/layout';

/** The runs of one đề so far, in order (points of each), out of `runs`. */
export interface ExamScoreboard {
  readonly seed: number;
  readonly runs: number;
  readonly points: readonly number[];
}

export function newScoreboard(seed: number, runs: number): ExamScoreboard {
  return { seed, runs, points: [] };
}

/** Whether every run of the đề has been used. */
export function examFinished(board: ExamScoreboard): boolean {
  return board.points.length >= board.runs;
}

/** Records a run's points; once every run is used, later runs do not count (board unchanged). */
export function addExamRun(board: ExamScoreboard, points: number): ExamScoreboard {
  if (examFinished(board)) return board;
  return { ...board, points: [...board.points, points] };
}

/** The best run so far (the one that counts, AIROC 2025 rule), or null before any run. */
export function examBest(board: ExamScoreboard): number | null {
  return board.points.length === 0 ? null : Math.max(...board.points);
}

const ROBOT_EVENTS: ReadonlySet<string> = new Set([
  'move',
  'turn',
  'bump',
  'grab',
  'release',
  'gripFail',
  'timeUp',
]);

/**
 * Points of a run as the board shows them when it ends: every finished job plus the lab bonus,
 * replayed from the events like the stage's HUD. A run that crashed keeps the points it had made
 * (coach question H: real referees stop the robot and count what is done).
 */
export function runPoints(config: RobotLabConfig, outcome: Pick<RunOutcome, 'events'>): number {
  let state = initialBoard(config);
  for (const event of outcome.events) {
    if (ROBOT_EVENTS.has(event.type)) state = applyEvent(state, event as RobotLabEvent);
  }
  return boardScore(state, config).total;
}

/** A đề number from text (`?de=` or the input), or null when it is not one. */
export function parseSeed(text: string | null | undefined): number | null {
  if (text === null || text === undefined || !/^\d{1,4}$/.test(text.trim())) return null;
  const seed = Number(text.trim());
  return isExamSeed(seed) ? seed : null;
}

/** A new đề number, never the current one. `random` returns [0, 1) (Math.random in the app). */
export function nextSeed(current: number, random: () => number): number {
  const span = EXAM_SEED_MAX - EXAM_SEED_MIN;
  const pick = EXAM_SEED_MIN + Math.min(span - 1, Math.floor(random() * span));
  // `pick` skips nothing but `current`: values from `current` up shift by one.
  return pick >= current ? pick + 1 : pick;
}
