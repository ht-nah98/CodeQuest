import type { Level, WorkspaceJson } from '@codequest/content-schema';
import { runLevel } from '@codequest/engine';
import { turtle } from './index';

/**
 * What of a level a draw key depends on: the paper, the spells and boxes a program uses, and the
 * run limits (a program over `maxActions` gives another key).
 */
export type DrawKeyLevel = Pick<Level, 'config' | 'procedures' | 'variables' | 'limits'>;

/**
 * The predict answer key of `workspace` drawn on a turtle level (ADR-0024 §5): what `runLevel`
 * gives that level in mode predict running that program, so spells (`procedures`) and the box
 * suffix (`variables`) match the child's run. Pure; the web's content loader and content:check
 * rule 26 derive the key of each `predict.options[].drawProgram` with it. Throws when the run
 * cannot produce a key (an invalid config, an engine error).
 */
export function turtleDrawKey(level: DrawKeyLevel, workspace: WorkspaceJson): string {
  const run: Level = {
    id: 'turtle-draw-key',
    worldId: '_sandbox',
    stage: 'practice',
    kind: 'turtle',
    mode: 'predict',
    title: 'Hình vẽ',
    objective: 'Vẽ hình',
    learningGoal: 'Vẽ hình',
    toolbox: [],
    hints: [],
    config: level.config,
    ...(level.procedures !== undefined && { procedures: level.procedures }),
    ...(level.variables !== undefined && { variables: level.variables }),
    ...(level.limits !== undefined && { limits: level.limits }),
    initialWorkspace: workspace,
  };
  const outcome = runLevel({ kind: turtle, level: run, workspace });
  if (outcome.answerKey === undefined || outcome.result === 'error') {
    throw new Error(`turtleDrawKey: ${outcome.debug?.message ?? `no key (${outcome.result})`}`);
  }
  return outcome.answerKey;
}
