// Renders the Leanbot lesson pictures to apps/web/public/leanbot/img/<lesson>/<name>.png.
//
//   npm run leanbot:art -- bai-01            every picture of a lesson
//   npm run leanbot:art -- bai-01 di-thang   one picture
//
// Two kinds of scene (scenes/<lesson>.mjs):
//   { name, svg }     a drawing (draw.mjs), photographed with the app's fonts
//   { name, blocks }  a program (blocks.mjs), loaded into the real block editor and photographed
// The block editor is online, so "blocks" scenes need the network.

import { readFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { workspaceXml } from './blocks.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const publicDir = join(root, 'apps', 'web', 'public');
const EDITOR = 'https://ide.pythaverse.space/lbeditor/?lang=vi';

const [lesson, only] = process.argv.slice(2);
if (!lesson) {
  console.error('usage: npm run leanbot:art -- <lesson> [name]');
  process.exit(1);
}
const { scenes } = await import(join(here, 'scenes', `${lesson}.mjs`));
const chosen = scenes.filter((s) => !only || s.name === only);
if (chosen.length === 0) {
  console.error(`no scene "${only}" in scenes/${lesson}.mjs`);
  process.exit(1);
}
const outDir = join(publicDir, 'leanbot', 'img', lesson);
mkdirSync(outDir, { recursive: true });

// The app's own @font-face rules, with the font files inlined so a blank page can use them.
const fontsCss = readFileSync(join(root, 'apps', 'web', 'src', 'ui', 'fonts.css'), 'utf8').replace(
  /url\('\/fonts\/([^']+)'\)/g,
  (_, file) =>
    `url(data:font/woff2;base64,${readFileSync(join(publicDir, 'fonts', file)).toString('base64')})`,
);

const browser = await chromium.launch();
const viewport = { viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1.5 };
// Two tabs: drawings replace their page's content, which would wipe the editor out.
const page = await browser.newPage(viewport);
const editor = await browser.newPage(viewport);
let editorReady = false;

for (const scene of chosen) {
  const file = join(outDir, `${scene.name}.png`);
  if (scene.svg) {
    await page.setContent(
      `<style>${fontsCss} html,body{margin:0;background:#fff8ee} svg{display:block}</style>${scene.svg}`,
    );
    await page.evaluate(() => document.fonts.ready);
    await page.locator('svg').first().screenshot({ path: file });
  } else {
    if (!editorReady) {
      await editor.goto(EDITOR, { waitUntil: 'networkidle' });
      await editor.waitForFunction(() => window.Blockly?.getMainWorkspace());
      editorReady = true;
    }
    await shootBlocks(scene.blocks, file);
  }
  console.log(`  ${lesson}/${scene.name}.png`);
}
await browser.close();

const written = chosen.map((s) => join(outDir, `${s.name}.png`));
const shrink = spawnSync('python3', [join(here, 'shrink.py'), ...written], { stdio: 'inherit' });
if (shrink.status !== 0) {
  console.error(
    'shrink.py failed: pictures left unshrunk (pip install -r tools/sprites/requirements.txt)',
  );
  process.exit(1);
}

/**
 * Loads a program into the editor, adds numbered badges and rings on top, and photographs just
 * the blocks. `badges`: [{ id, n, at: 'top'|'middle'|'bottom' }]; `rings`: [{ id, field }] or
 * [{ id, input, n }] to circle the number plugged into an input, with an optional badge above.
 */
async function shootBlocks({ stacks, badges = [], rings = [], pad = 14 }, file) {
  const xml = workspaceXml(stacks);
  const box = await editor.evaluate(
    ({ xml, badges, rings, pad }) => {
      const B = window.Blockly;
      const ws = B.getMainWorkspace();
      ws.clear();
      ws.setScale(1);
      B.Xml.domToWorkspace(B.Xml.textToDom(xml), ws);
      ws.scroll(0, 0);
      document.getElementById('cq-overlay')?.remove();
      const overlay = document.createElement('div');
      overlay.id = 'cq-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99999';
      document.body.append(overlay);

      const rects = ws.getTopBlocks(false).map((b) => b.getSvgRoot().getBoundingClientRect());
      const ownShape = (id) => {
        const block = ws.getBlockById(id);
        if (!block) throw new Error(`no block "${id}"`);
        return block.getSvgRoot().querySelector(':scope > path').getBoundingClientRect();
      };
      for (const { id, n, at = 'middle' } of badges) {
        const own = ownShape(id);
        // at the top of an if / loop the condition sits in the row, so go past the whole block
        const r =
          at === 'top'
            ? {
                ...own.toJSON(),
                right: ws.getBlockById(id).getSvgRoot().getBoundingClientRect().right,
              }
            : own;
        const y =
          at === 'top' ? r.top + 12 : at === 'bottom' ? r.bottom - 14 : (r.top + r.bottom) / 2;
        const el = document.createElement('div');
        el.textContent = n;
        // the End arm of a C-shaped block is short: sit beside it, not beside the whole block
        const x = at === 'bottom' ? r.left + 110 : r.right + 10;
        el.style.cssText = `position:fixed;left:${x}px;top:${y - 16}px;width:32px;height:32px;border-radius:50%;background:#4b4673;color:#fff;border:3px solid #1e1b2e;box-sizing:border-box;font:800 18px/26px sans-serif;text-align:center`;
        overlay.append(el);
        rects.push(el.getBoundingClientRect());
      }
      for (const { id, field, input, n } of rings) {
        const block = ws.getBlockById(id);
        const target = input
          ? block.getInput(input).connection.targetBlock().getSvgRoot()
          : block.getField(field).getSvgRoot();
        const r = target.getBoundingClientRect();
        if (n) {
          const tag = document.createElement('div');
          tag.textContent = n;
          tag.style.cssText = `position:fixed;left:${(r.left + r.right) / 2 - 16}px;top:${r.top - 46}px;width:32px;height:32px;border-radius:50%;background:#4b4673;color:#fff;border:3px solid #1e1b2e;box-sizing:border-box;font:800 18px/26px sans-serif;text-align:center`;
          overlay.append(tag);
          rects.push(tag.getBoundingClientRect());
        }
        const el = document.createElement('div');
        el.style.cssText = `position:fixed;left:${r.left - 6}px;top:${r.top - 6}px;width:${r.width + 12}px;height:${r.height + 12}px;border:4px solid #fbc73f;border-radius:10px;box-shadow:0 0 0 2px #1e1b2e`;
        overlay.append(el);
        rects.push(el.getBoundingClientRect());
      }
      const left = Math.min(...rects.map((r) => r.left)) - pad;
      const top = Math.min(...rects.map((r) => r.top)) - pad;
      const right = Math.max(...rects.map((r) => r.right)) + pad;
      const bottom = Math.max(...rects.map((r) => r.bottom)) + pad;
      return { x: left, y: top, width: right - left, height: bottom - top };
    },
    { xml, badges, rings, pad },
  );
  await editor.waitForTimeout(150);
  await editor.screenshot({ path: file, clip: box });
}
