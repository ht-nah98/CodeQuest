import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { ContentFile } from './rules';

function listJsonFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return listJsonFiles(full);
    return entry.name.endsWith('.json') ? [full] : [];
  });
}

/** Every JSON file under a content directory, sorted, with `/`-separated relative paths. */
export function loadContentFiles(contentDir: string): ContentFile[] {
  return listJsonFiles(contentDir)
    .sort()
    .map((full) => ({
      path: relative(contentDir, full).split(sep).join('/'),
      text: readFileSync(full, 'utf8'),
    }));
}
