import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkContent, type ContentFile } from './rules';

const contentDir = fileURLToPath(new URL('../../../content', import.meta.url));

function listJsonFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return listJsonFiles(full);
    return entry.name.endsWith('.json') ? [full] : [];
  });
}

const files: ContentFile[] = listJsonFiles(contentDir)
  .sort()
  .map((full) => ({
    path: relative(contentDir, full).split(sep).join('/'),
    text: readFileSync(full, 'utf8'),
  }));

const { entries, issues } = checkContent(files);
const failedPaths = new Set(issues.map((issue) => issue.path));

for (const entry of entries) {
  if (!failedPaths.has(entry.path)) {
    const name = entry.id ?? entry.path;
    console.log(
      entry.detail === undefined ? `✔ ${name}  ${entry.kind}  ok` : `✔ ${name} ${entry.detail}  ok`,
    );
  }
}
for (const issue of issues) {
  console.log(`✖ ${issue.path}  rule ${String(issue.rule)}: ${issue.message}`);
}

console.log(
  `\ncontent:check (rules 1–2, 9–11): ${String(files.length)} files, ${String(issues.length)} issues`,
);
process.exitCode = issues.length > 0 ? 1 : 0;
