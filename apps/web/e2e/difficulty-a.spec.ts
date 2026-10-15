import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import type * as BlocklyModule from 'blockly';
import { signInTestProfile } from './helpers';

// Difficulty pass, batch A (docs/roadmap/difficulty-pass.md): the two levels that change the most
// on screen. W4 l12 is a parsons maze with an "if" inside "else"; W5 l13 is an 11×11 spiral that
// must fit the stage at 1280×720 and 1366×768. Screenshots go to SHOTS_DIR when set.

const SHOTS = process.env['SHOTS_DIR'] ?? 'test-results/difficulty-a';

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(new URL(`../../../content/${path}`, import.meta.url), 'utf8'));
const levelJson = (path: string) =>
  readJson(path) as { solution: unknown; initialWorkspace: { blocks: { blocks: unknown[] } } };

interface PlayHook {
  Blockly: typeof BlocklyModule;
  workspace: BlocklyModule.WorkspaceSvg;
}
type HookWindow = Window & { __cqPlay: PlayHook };

let errors: string[];

test.beforeEach(({ page }) => {
  errors = [];
  page.on('console', (msg) => {
    if (msg.text().startsWith('[.WebGL-')) return;
    if (msg.type() === 'error' || msg.type() === 'warning') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
});

test.afterEach(() => {
  expect(errors).toEqual([]);
});

async function open(page: Page, levelId: string): Promise<void> {
  await signInTestProfile(page);
  await page.goto(`/play/${levelId}`);
  await expect(page.getByTestId('play-stage')).toHaveAttribute('data-ready', 'true', {
    timeout: 30_000,
  });
  await page.waitForFunction(
    () => (window as unknown as Partial<HookWindow>).__cqPlay !== undefined,
  );
}

async function setProgram(page: Page, json: unknown): Promise<void> {
  await page.evaluate((workspaceJson) => {
    const { Blockly, workspace } = (window as unknown as HookWindow).__cqPlay;
    workspace.clear();
    Blockly.serialization.workspaces.load(workspaceJson as object, workspace);
  }, json);
}

/** Top-level stacks in the workspace: "khi bắt đầu" plus every loose block. */
const topBlocks = (page: Page) =>
  page.evaluate(() => (window as unknown as HookWindow).__cqPlay.workspace.getTopBlocks().length);

test('w04-l12: the nested-if parsons starts loose and wins once assembled', async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  const project = testInfo.project.name;
  const level = levelJson('worlds/w04-nga-ba-quyet-dinh/levels/w04-l12.json');
  await open(page, 'w04-l12');
  // 8 given blocks, all loose next to "khi bắt đầu".
  expect(await topBlocks(page)).toBe(level.initialWorkspace.blocks.blocks.length);
  await expect(page.getByTestId('play-bubble')).toHaveText(
    'Nếu trong nếu không: hết đường phía trước mới hỏi tiếp.',
  );
  await page.screenshot({ path: `${SHOTS}/${project}-w04-l12-loose.png` });

  await setProgram(page, level.solution);
  expect(await topBlocks(page)).toBe(1);
  await page.getByTestId('play-run').click();
  await page.getByRole('radio', { name: 'Nhanh' }).click();
  await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 60_000 });
  await page.screenshot({ path: `${SHOTS}/${project}-w04-l12-won.png` });
});

test('w05-l13: the 11×11 spiral fits the stage; until the goal wins both maps', async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  const project = testInfo.project.name;
  const level = levelJson('worlds/w05-song-cho-doi/levels/w05-l13.json');
  await open(page, 'w05-l13');
  const stage = page.getByTestId('play-stage');
  // The whole stage is on screen at the target laptop sizes (ADR-0011).
  const box = await stage.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  if (box !== null && viewport !== null) {
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  }
  await page.screenshot({ path: `${SHOTS}/${project}-w05-l13-spiral.png` });

  await setProgram(page, level.solution);
  await page.getByTestId('play-run').click();
  await page.getByRole('radio', { name: 'Nhanh' }).click();
  await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 150_000 });
  for (const n of [1, 2]) {
    await expect(page.getByTestId(`map-tab-${String(n)}`)).toHaveAttribute('data-result', 'won');
  }
  await page.screenshot({ path: `${SHOTS}/${project}-w05-l13-won.png` });
});
