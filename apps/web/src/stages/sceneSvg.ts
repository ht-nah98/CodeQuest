// Theme tiles for the static SVG pictures (P2-23, stage-rendering.md §7): the same pixel art as
// the PixiJS stage (sceneTiles.ts), as `data:` SVG images made once per theme and piece, so the
// track strip, "Xem cả đường" and the answer cards show the world's ground and maze walls.
// Pixi-free. Làng Tre returns `null`: its pictures keep the Kenney tile and the bamboo rects.
import type { SceneTheme } from '@codequest/content-schema';
import { SCENE_ART } from './sceneThemes';
import { groundPiece } from './sceneTiles';

const urls = new Map<string, string>();

/** A pixel picture as a `data:image/svg+xml` URL: one rect per run of a colour, crisp edges. */
export function pixelDataUrl(
  rows: readonly string[],
  palette: Readonly<Record<string, string>>,
): string {
  const width = rows[0]?.length ?? 0;
  const rects: string[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row.charAt(x);
      let end = x + 1;
      while (end < row.length && row.charAt(end) === ch) end += 1;
      const color = palette[ch];
      if (ch !== '.' && color !== undefined) {
        rects.push(
          `<rect x="${String(x)}" y="${String(y)}" width="${String(end - x)}" height="1" fill="${color}"/>`,
        );
      }
      x = end;
    }
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(width)} ${String(rows.length)}" shape-rendering="crispEdges">${rects.join('')}</svg>`;
  // Only the characters a data: URI cannot carry are escaped (# < > % "), so the URI stays short.
  return `data:image/svg+xml,${svg.replace(/[#<>%"]/g, (ch) => encodeURIComponent(ch))}`;
}

function cached(key: string, make: () => string): string {
  let url = urls.get(key);
  if (url === undefined) {
    url = make();
    urls.set(key, url);
  }
  return url;
}

/** The runner's top ground tile of `theme` (18×18), or `null` for the Kenney tile (Làng Tre). */
export function groundTileUrl(theme: SceneTheme | undefined): string | null {
  const ground = theme === undefined ? null : SCENE_ART[theme].ground;
  if (ground === null) return null;
  return cached(`ground:${String(theme)}`, () =>
    pixelDataUrl(groundPiece(ground.patterns, 'ground'), ground.palette),
  );
}

/** A maze tile of `theme` (12×12), or `null` when the theme keeps the bamboo maze (Làng Tre). */
export function mazeTileUrl(theme: SceneTheme | undefined, piece: 'floor' | 'wall'): string | null {
  const maze = theme === undefined ? null : SCENE_ART[theme].maze;
  const rows = maze?.patterns?.[piece];
  if (!maze || !rows) return null;
  return cached(`maze-${piece}:${String(theme)}`, () => pixelDataUrl(rows, maze.palette));
}
