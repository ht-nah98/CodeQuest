import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, type Page, test } from '@playwright/test';
import type * as BlocklyModule from 'blockly';

// P2-07 acceptance (docs/roadmap/phase-2.md): the level editor at /coach/editor. A runner `build`
// level and a maze `bughunt` level are made from scratch: validation issues appear and clear,
// the par search runs in its Web Worker (and can be cancelled), the level is played on the real
// stage, and the exported file passes `content:check` inside content/worlds/_sandbox/.

const SHOTS = 'test-results/coach-editor';
const REPO = fileURLToPath(new URL('../../../', import.meta.url));

/** Test hook set by the editor's program workspace (dev build only). */
interface EditorHook {
  Blockly: typeof BlocklyModule;
  workspace: BlocklyModule.WorkspaceSvg;
  tab: string;
}
type HookWindow = Window & { __cqEditor?: EditorHook; __cqEditorPreview?: EditorHook };

let errors: string[];
let foreign: string[];

test.beforeEach(({ page }) => {
  errors = [];
  foreign = [];
  page.on('console', (msg) => {
    if (msg.text().startsWith('[.WebGL-')) return;
    if (msg.type() === 'error' || msg.type() === 'warning') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.protocol === 'data:' || url.protocol === 'blob:') return;
    if (url.hostname !== 'localhost') foreign.push(req.url());
  });
});

test.afterEach(() => {
  expect(errors).toEqual([]);
  expect(foreign).toEqual([]);
});

/** Opens the editor through the adult lock (a multiplication). */
async function openEditor(page: Page): Promise<void> {
  await page.goto('/coach/editor');
  const question = page.getByTestId('coach-gate-question');
  await expect(question).toBeVisible();
  // A wrong answer keeps it closed.
  await page.getByRole('textbox').fill('1');
  await page.getByRole('button', { name: 'Mở' }).click();
  await expect(page.getByRole('alert')).toHaveText('Chưa đúng. Thử lại nhé.');
  const a = Number(await question.getAttribute('data-a'));
  const b = Number(await question.getAttribute('data-b'));
  await page.getByRole('textbox').fill(String(a * b));
  await page.getByRole('button', { name: 'Mở' }).click();
  await expect(page.getByTestId('level-editor')).toBeVisible();
}

async function fillTexts(page: Page, id: string): Promise<void> {
  await page.locator('input[name="id"]').fill(id);
  await page.locator('input[name="title"]').fill('Nhảy qua hố');
  await page.locator('input[name="objective"]').fill('Tới lá cờ nhé!');
  await page.locator('input[name="learningGoal"]').fill('Thử màn soạn bằng editor.');
  await page.locator('input[name="misconception"]').fill('Măng tự nhảy qua hố.');
  await page.locator('input[name="thinkingHint"]').fill('Hố ở ô số mấy?');
}

/** Runs the par search and waits for its result. */
async function searchPar(page: Page): Promise<void> {
  await page.getByTestId('par-search-start').click();
  await expect(page.getByTestId('par-search-result')).toBeVisible({ timeout: 30_000 });
}

/** Downloads the level JSON and checks it with content:check inside a copy of content/. */
async function exportAndCheck(page: Page, id: string): Promise<Record<string, unknown>> {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('editor-download').click(),
  ]);
  expect(download.suggestedFilename()).toBe(`${id}.json`);
  const text = readFileSync(await download.path(), 'utf8');
  const level = JSON.parse(text) as Record<string, unknown>;

  const dir = mkdtempSync(join(tmpdir(), 'cq-editor-'));
  try {
    cpSync(join(REPO, 'content'), dir, { recursive: true });
    writeFileSync(join(dir, 'worlds/_sandbox/levels', `${id}.json`), text);
    const check = spawnSync(
      process.execPath,
      [
        join(REPO, 'node_modules/tsx/dist/cli.mjs'),
        'tools/content-check/src/main.ts',
        '--dir',
        dir,
      ],
      { cwd: REPO, encoding: 'utf8' },
    );
    expect(check.stdout).toContain(`✔ ${id}`);
    expect(check.status, check.stdout + check.stderr).toBe(0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  return level;
}

/** Plays the level in Thử chơi with its solution and waits for the win. */
async function previewWins(page: Page, shot: string): Promise<void> {
  await page.locator('[data-tab="preview"]').click();
  const stage = page.getByTestId('editor-preview-stage');
  await expect(stage).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
  await expect(stage.locator('canvas')).toHaveCount(1);
  await page.getByTestId('preview-use-solution').click();
  await page.getByTestId('preview-run').click();
  await expect(page.getByTestId('preview-result')).toHaveAttribute('data-result', 'success', {
    timeout: 30_000,
  });
  await page.screenshot({ path: shot, fullPage: true });
}

test('a runner build level: draw, validate, find par, play, export', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const project = testInfo.project.name;
  await openEditor(page);
  await page.getByTestId('editor-new-runner').click();

  // A fresh draft lists what is missing next to its field.
  const status = page.getByTestId('editor-status');
  await expect(status).toHaveAttribute('data-valid', 'false');
  await expect(page.getByTestId('issues-objective')).toContainText('Luật 1');
  await fillTexts(page, 'editor-runner');
  // The objective counts words live; the empty program does not win (rule 9).
  await expect(page.getByText('4/12 chữ')).toBeVisible();
  await expect(page.getByTestId('issues-solution')).toContainText('Luật 9');

  // Draw: 6 cells with a hole at 2, then offer "nhảy".
  // Sizes apply on Enter / blur, not per keystroke.
  await page.locator('input[name="runner-length"]').fill('6');
  await page.locator('input[name="runner-length"]').press('Enter');
  await expect(page.getByTestId('runner-cell-5')).toHaveAttribute('data-cell', 'flag');
  await page.getByTestId('runner-cell-2').click();
  await expect(page.getByTestId('runner-cell-2')).toHaveAttribute('data-cell', 'hole');
  await page.locator('input[name="toolbox-runner_jump"]').check();
  await page.screenshot({ path: `${SHOTS}/${project}-runner-issues.png`, fullPage: true });

  // Par search in the worker: 3 blocks (đi, nhảy, nhảy) is the fewest.
  await searchPar(page);
  await expect(page.getByTestId('par-search-min')).toHaveAttribute('data-min', '3');
  await expect(page.locator('[data-advice="parTooLow"]')).toBeVisible(); // par is still 1
  await page.getByTestId('par-search-use-example').first().click();
  await page.getByTestId('par-search-set-par').click();
  await expect(page.locator('input[name="par"]')).toHaveValue('3');

  // Every issue cleared.
  await expect(page.getByTestId('issues-solution')).toHaveCount(0);
  await expect(page.getByTestId('editor-no-issues')).toBeVisible();
  await expect(status).toHaveAttribute('data-valid', 'true');
  await expect(page.locator('[data-advice="parOk"]')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/${project}-runner-valid.png`, fullPage: true });

  await previewWins(page, `${SHOTS}/${project}-runner-preview.png`);

  const level = await exportAndCheck(page, 'editor-runner');
  expect(level).toMatchObject({
    id: 'editor-runner',
    worldId: '_sandbox',
    kind: 'runner',
    mode: 'build',
    par: 3,
    toolbox: ['runner_walk', 'runner_jump'],
    config: { cells: ['ground', 'ground', 'hole', 'ground', 'ground', 'flag'], start: 0 },
  });
});

test('a maze bughunt level: paint, break the start program, check fixes, export', async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  const project = testInfo.project.name;
  await openEditor(page);
  await page.getByTestId('editor-new-maze').click();
  await fillTexts(page, 'editor-maze');
  await page.locator('select[name="mode"]').selectOption('bughunt');

  // Move the goal next to the start: S . G on row 1.
  await page.locator('[data-maze-brush="G"]').click();
  await page.getByTestId('maze-cell-1-3').click();
  await expect(page.getByTestId('maze-cell-1-3')).toHaveAttribute('data-tile', 'G');
  await expect(page.getByTestId('maze-cell-3-3')).toHaveAttribute('data-tile', '.');

  // Solution from the search (tiến, tiến), then a start program that stops one cell short.
  await searchPar(page);
  await expect(page.getByTestId('par-search-min')).toHaveAttribute('data-min', '2');
  await page.getByTestId('par-search-use-example').first().click();
  await page.getByTestId('par-search-set-par').click();
  await page.locator('[data-tab="initial"]').click();
  await page.getByRole('button', { name: 'Chép từ lời giải' }).click();
  // An unchanged copy wins, which bughunt forbids (rule 14).
  await expect(page.getByTestId('issues-initialWorkspace')).toContainText('Luật 14');
  await page.waitForFunction(() => (window as HookWindow).__cqEditor?.tab === 'initial');
  await page.evaluate(() => {
    const hook = (window as HookWindow).__cqEditor;
    if (hook === undefined) throw new Error('no editor hook');
    hook.Blockly.serialization.workspaces.load(
      {
        blocks: {
          languageVersion: 0,
          blocks: [
            {
              type: 'cq_start',
              id: 'start',
              x: 40,
              y: 40,
              next: { block: { type: 'maze_forward', id: 'f1' } },
            },
          ],
        },
      },
      hook.workspace,
    );
  });
  await expect(page.getByTestId('issues-initialWorkspace')).toHaveCount(0);
  await expect(page.getByTestId('editor-no-issues')).toBeVisible();

  // The search now also counts the fixes: 1 edit, as parEdits says.
  await searchPar(page);
  await expect(page.getByTestId('par-search-fixes')).toHaveAttribute('data-min', '1');
  await expect(page.locator('[data-advice="fixOk"]')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/${project}-maze-bughunt.png`, fullPage: true });

  await previewWins(page, `${SHOTS}/${project}-maze-preview.png`);

  const level = await exportAndCheck(page, 'editor-maze');
  expect(level).toMatchObject({
    id: 'editor-maze',
    kind: 'maze',
    mode: 'bughunt',
    par: 2,
    parEdits: 1,
    config: { map: ['#####', '#S.G#', '###.#', '###.#', '#####'], startDir: 'E' },
  });
});

test('a long par search can be cancelled', async ({ page }) => {
  await openEditor(page);
  await page.getByTestId('editor-new-runner').click();
  await page.locator('input[name="runner-length"]').fill('40');
  await page.locator('input[name="runner-length"]').press('Enter');
  await expect(page.getByTestId('runner-cell-39')).toHaveAttribute('data-cell', 'flag');
  for (const block of ['runner_jump', 'runner_crouch', 'runner_kick', 'cq_repeat']) {
    await page.locator(`input[name="toolbox-${block}"]`).check();
  }
  await page.locator('input[name="par"]').fill('14');
  await page.getByTestId('par-search-start').click();
  await expect(page.getByTestId('par-search-running')).toBeVisible();
  await page.getByTestId('par-search-cancel').click();
  await expect(page.getByTestId('par-search-running')).toHaveCount(0);
  await expect(page.getByTestId('par-search-result')).toHaveCount(0);
  // The editor stays usable and a new search still answers.
  await page.locator('input[name="runner-length"]').fill('4');
  await page.locator('input[name="runner-length"]').press('Enter');
  await page.locator('input[name="par"]').fill('3');
  await searchPar(page);
  // đi ×3, or lặp 3 [đi] with the loop ticked.
  await expect(page.getByTestId('par-search-min')).toHaveAttribute('data-min', '2');
});

test('a runner parsons level: loose blocks are not disabled and can be assembled to win', async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  const project = testInfo.project.name;
  await openEditor(page);
  await page.getByTestId('editor-new-runner').click();
  await fillTexts(page, 'editor-parsons');
  await page.locator('input[name="runner-length"]').fill('6');
  await page.locator('input[name="runner-length"]').press('Enter');
  await page.getByTestId('runner-cell-2').click();
  await page.locator('input[name="toolbox-runner_jump"]').check();
  await searchPar(page);
  await page.getByTestId('par-search-use-example').first().click();
  await page.getByTestId('par-search-set-par').click();

  // Parsons: the start program is the solution split into loose blocks.
  await page.locator('select[name="mode"]').selectOption('parsons');
  await page.locator('[data-tab="initial"]').click();
  await page.waitForFunction(() => (window as HookWindow).__cqEditor?.tab === 'initial');
  // Nudge a loose block: the editor workspace disables orphans, which must not be saved.
  await page.evaluate(() => {
    const hook = (window as HookWindow).__cqEditor;
    if (hook === undefined) throw new Error('no editor hook');
    const loose = hook.workspace.getTopBlocks(true).find((block) => block.type !== 'cq_start');
    loose?.moveBy(16, 0);
  });
  await expect(page.getByTestId('editor-no-issues')).toBeVisible();

  // Thử chơi: assemble the loose blocks under "khi bắt đầu" top to bottom, as a child would.
  await page.locator('[data-tab="preview"]').click();
  const stage = page.getByTestId('editor-preview-stage');
  await expect(stage).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
  await page.waitForFunction(() => (window as HookWindow).__cqEditorPreview !== undefined);
  const disabled = await page.evaluate(() => {
    const hook = (window as HookWindow).__cqEditorPreview;
    if (hook === undefined) throw new Error('no preview hook');
    const blocks = hook.workspace.getTopBlocks(true);
    const start = blocks.find((block) => block.type === 'cq_start');
    let previous = start;
    for (const block of blocks) {
      if (block === start || previous?.nextConnection == null || block.previousConnection == null) {
        continue;
      }
      previous.nextConnection.connect(block.previousConnection);
      previous = block;
    }
    return hook.workspace.getAllBlocks(false).filter((block) => !block.isEnabled()).length;
  });
  expect(disabled).toBe(0);
  await page.getByTestId('preview-run').click();
  await expect(page.getByTestId('preview-result')).toHaveAttribute('data-result', 'success', {
    timeout: 30_000,
  });
  await page.screenshot({ path: `${SHOTS}/${project}-parsons-preview.png`, fullPage: true });

  const level = await exportAndCheck(page, 'editor-parsons');
  expect(level).toMatchObject({ mode: 'parsons', par: 3 });
  expect(JSON.stringify(level)).not.toMatch(/disabledReasons|"enabled"/);
});

test('a multi-map level: opened, edited per map, played on every map, exported without loss (P2-12)', async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  const project = testInfo.project.name;
  const shots = process.env['SHOTS_DIR'] ?? SHOTS;
  const source = JSON.parse(
    readFileSync(join(REPO, 'content/worlds/_sandbox/levels/runner-maps.json'), 'utf8'),
  ) as { config: unknown; variants: unknown[] };
  await openEditor(page);
  await page.getByTestId('editor-open-content').selectOption('runner-maps');
  await expect(page.getByTestId('editor-map-tab-3')).toBeVisible();
  // Three maps already: no fourth.
  await expect(page.getByTestId('editor-add-map')).toHaveCount(0);

  // Map 2 is shown and edited on its own: its hole at cell 5 becomes a branch, then back.
  await page.getByTestId('editor-map-tab-2').click();
  await expect(page.getByTestId('runner-cell-5')).toHaveAttribute('data-cell', 'hole');
  await page.getByTestId('runner-cell-5').click();
  await expect(page.getByTestId('runner-cell-5')).toHaveAttribute('data-cell', 'branch');
  await page.getByTestId('editor-map-tab-1').click();
  await expect(page.getByTestId('runner-cell-5')).toHaveAttribute('data-cell', 'ground');
  await page.getByTestId('editor-map-tab-2').click();
  for (let i = 0; i < 3; i++) await page.getByTestId('runner-cell-5').click(); // → crate → ground → hole
  await expect(page.getByTestId('runner-cell-5')).toHaveAttribute('data-cell', 'hole');

  await page.screenshot({ path: `${shots}/${project}-editor-maps.png`, fullPage: true });

  // Thử chơi: the solution wins every map, tab after tab.
  await page.locator('[data-tab="preview"]').click();
  const stage = page.getByTestId('editor-preview-stage');
  await expect(stage).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
  await page.getByTestId('preview-use-solution').click();
  await page.getByTestId('preview-run').click();
  await expect(page.getByTestId('preview-result')).toHaveAttribute('data-result', 'success', {
    timeout: 30_000,
  });
  await expect(stage).toHaveAttribute('data-map', '3');
  for (const n of [1, 2, 3]) {
    await expect(page.getByTestId(`map-tab-${String(n)}`)).toHaveAttribute('data-result', 'won');
  }
  await page.screenshot({ path: `${shots}/${project}-editor-preview.png`, fullPage: true });

  const level = await exportAndCheck(page, 'runner-maps');
  expect(level['config']).toEqual(source.config);
  expect(level['variants']).toEqual(source.variants);
});
