import ts from 'typescript';
import { VOICE_ID, type LineIssue, type VoiceLine } from './lines';

/**
 * vi.ts keys that Măng says aloud (bubbles, feedback, break reminder): voice id `ui.<key>`.
 * An entry is a string leaf ("play.ready") or a group whose string leaves are all voiced
 * ("hints.global"). Labels, buttons and lines with numbers (functions) are not voiced.
 * Edit this list to change which UI lines get a voice (coach decision, ui-copy-guide.md §5).
 */
export const VOICED_UI_KEYS: readonly string[] = [
  'crash.message',
  'play.ready',
  'play.running',
  'play.stepping',
  'play.paused',
  'play.win',
  'play.unplayable',
  'play.locked',
  'play.loadError',
  'play.stageError',
  'play.readyByMode',
  'play.predict.right',
  'play.predict.rightDone',
  'play.predict.tryAgain',
  'play.bughunt.win',
  'play.creative.done',
  'play.creative.saved',
  'play.creative.saveError',
  'hints.freeNote',
  'hints.missingTip',
  'hints.error',
  'hints.solved',
  'hints.reset',
  'hints.global',
  'hints.nextStep.add',
  'hints.nextStep.move',
  'hints.nextStep.moveWithTail',
  'hints.nextStep.edit',
  'hints.nextStep.replace',
  'hints.nextStep.replaceMid',
  'hints.nextStep.remove',
  'hints.nextStep.removeMid',
  'hints.nextStep.removeLoose',
  'hints.nextStep.reset',
  'hints.nextStep.done',
  'hints.solution.note',
  'profiles.title',
  'profiles.pinPrompt',
  'profiles.pinWrong',
  'newProfile.avatarMang',
  'newProfile.nicknameTitle',
  'newProfile.pinTitle',
  'newProfile.pinAgainTitle',
  'newProfile.pinMismatch',
  'world.lessonFirst',
  'world.newBlockFirst',
  'world.allDone',
  'world.lockedWorld',
  'lesson.quizRight',
  'lesson.quizWrong',
  'lesson.doneTitle',
  'lesson.doneBody',
  'results.stars1',
  'results.stars1Hint',
  'results.stars2',
  'results.stars3',
  'results.predict',
  'results.bughunt',
  'results.newWorld',
  'results.noCoins',
  'breakReminder.title',
  'breakReminder.body',
  'smallScreen.body',
];

function unwrap(node: ts.Expression): ts.Expression {
  let current = node;
  while (
    ts.isSatisfiesExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isParenthesizedExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function propertyName(name: ts.PropertyName): string | null {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }
  return null;
}

/**
 * Every fixed string in vi.ts as `key path → text`, read from the source text with the
 * TypeScript parser (tools never import apps/web code, overview.md §2). Functions are skipped.
 */
export function readViStrings(source: string): Map<string, string> {
  const file = ts.createSourceFile('vi.ts', source, ts.ScriptTarget.Latest, false);
  const out = new Map<string, string>();
  const walk = (object: ts.ObjectLiteralExpression, prefix: string) => {
    for (const property of object.properties) {
      if (!ts.isPropertyAssignment(property)) continue;
      const name = propertyName(property.name);
      if (name === null) continue;
      const key = prefix === '' ? name : `${prefix}.${name}`;
      const value = unwrap(property.initializer);
      if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) {
        out.set(key, value.text);
      } else if (ts.isObjectLiteralExpression(value)) {
        walk(value, key);
      }
    }
  };
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== 'vi') continue;
      const init = declaration.initializer && unwrap(declaration.initializer);
      if (init && ts.isObjectLiteralExpression(init)) walk(init, '');
    }
  }
  return out;
}

/** The voiced UI lines (`ui.<key>`) of vi.ts; an allowlist entry that matches nothing is an issue. */
export function extractUiLines(
  source: string,
  keys: readonly string[] = VOICED_UI_KEYS,
): { lines: VoiceLine[]; issues: LineIssue[] } {
  const strings = readViStrings(source);
  const lines: VoiceLine[] = [];
  const issues: LineIssue[] = [];
  const taken = new Set<string>();
  for (const key of keys) {
    const matches = [...strings].filter(([path]) => path === key || path.startsWith(`${key}.`));
    if (matches.length === 0) {
      issues.push({ path: 'vi.ts', message: `voiced key "${key}" is not a fixed string in vi.ts` });
    }
    for (const [path, text] of matches) {
      if (taken.has(path) || text.trim() === '') continue;
      taken.add(path);
      const id = `ui.${path}`;
      if (VOICE_ID.test(id)) lines.push({ id, text, source: 'vi.ts' });
      else issues.push({ path: 'vi.ts', message: `voice id "${id}" is not a safe file name` });
    }
  }
  return { lines, issues };
}
