// Usage: npm run content:check [-- --dir <content dir>]   (default: <repo>/content)
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { loadContentFiles } from './load';
import { checkContent, type Issue } from './rules';

const { values } = parseArgs({ options: { dir: { type: 'string' } } });
const contentDir =
  values.dir === undefined
    ? fileURLToPath(new URL('../../../content', import.meta.url))
    : resolve(values.dir);

const files = loadContentFiles(contentDir);
const { entries, issues, warnings } = checkContent(files);

const byPath = (list: Issue[]): Map<string, Issue[]> => {
  const map = new Map<string, Issue[]>();
  for (const issue of list) map.set(issue.path, [...(map.get(issue.path) ?? []), issue]);
  return map;
};
const errorsByPath = byPath(issues);
const warningsByPath = byPath(warnings);
const line = (mark: string, name: string, issue: Issue): string =>
  `${mark} ${name}  rule ${String(issue.rule)}: ${issue.message}`;

const printed = new Set<string>();
for (const entry of entries) {
  printed.add(entry.path);
  const name = entry.id ?? entry.path;
  const errors = errorsByPath.get(entry.path) ?? [];
  if (errors.length === 0) {
    console.log(
      entry.detail === undefined ? `✔ ${name}  ${entry.kind}  ok` : `✔ ${name} ${entry.detail}  ok`,
    );
  }
  for (const issue of errors) console.log(line('✖', name, issue));
  for (const issue of warningsByPath.get(entry.path) ?? []) console.log(line('⚠', name, issue));
}
// Files that never became an entry (bad location, invalid JSON) or are missing (feedback.json).
for (const issue of [...issues, ...warnings]) {
  if (!printed.has(issue.path))
    console.log(line(issues.includes(issue) ? '✖' : '⚠', issue.path, issue));
}

console.log(
  `\ncontent:check (rules 1–21) ${relative(process.cwd(), contentDir) || '.'}: ${String(files.length)} files, ` +
    `${String(issues.length)} errors, ${String(warnings.length)} warnings`,
);
process.exitCode = issues.length > 0 ? 1 : 0;
