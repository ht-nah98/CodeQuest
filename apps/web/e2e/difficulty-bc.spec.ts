import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import type * as BlocklyModule from 'blockly';
import { signInTestProfile } from './helpers';

// Difficulty pass, batches B and C (docs/roadmap/difficulty-pass.md): the U-turn lesson
// (w02-lesson-quay-dau) and the two new mazes that change the most on screen, W2 l13 (U-turn)
// and W1 l13 (two roads). Screenshots go to SHOTS_DIR when set.

const SHOTS = process.env['SHOTS_DIR'] ?? 'test-results/difficulty-bc';

const levelJson = (path: string) =>
  JSON.parse(readFileSync(new URL(`../../../content/${path}`, import.meta.url), 'utf8')) as {
    solution: unknown;
  };

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

async function runDemo(page: Page): Promise<void> {
  const demo = page.getByTestId('lesson-demo');
  await expect(demo.locator('[data-ready="true"]')).toBeVisible({ timeout: 30_000 });
  await page.getByTestId('lesson-demo-run').click();
  await expect(demo.locator('[data-phase="done"]')).toBeVisible({ timeout: 30_000 });
}

async function winWithSolution(page: Page, path: string): Promise<void> {
  await setProgram(page, levelJson(path).solution);
  await page.getByTestId('play-run').click();
  await page.getByRole('radio', { name: 'Nhanh' }).click();
  await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 60_000 });
}

test('the U-turn lesson: two rights or two lefts turn Măng round, then tiến walks', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const project = testInfo.project.name;
  await signInTestProfile(page);
  await page.goto('/w/w02-rung-lap-lai/lesson/w02-lesson-quay-dau');
  await expect(page.getByText('Rẽ 2 lần là quay đầu: Măng nhìn ngược lại, chưa đi.')).toBeVisible();
  await page.getByTestId('lesson-next').click();
  await expect(page.getByText('Rẽ phải 2 lần là quay đầu. Rồi tiến tới đích.')).toBeVisible();
  await runDemo(page);
  await page.screenshot({ path: `${SHOTS}/${project}-quay-dau-right.png` });
  await page.getByTestId('lesson-next').click();
  await expect(page.getByText('Rẽ trái 2 lần cũng quay đầu.')).toBeVisible();
  await runDemo(page);
  await page.screenshot({ path: `${SHOTS}/${project}-quay-dau-left.png` });
  await page.getByTestId('lesson-next').click();
  await page.getByTestId('quiz-option').nth(1).click();
  await expect(page.getByText(/Rẽ chỉ quay tại chỗ, chưa đi\.$/)).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/${project}-quay-dau-quiz.png` });
});

test('w02-l13: Măng picks the shoot, turns round and loops back to the goal', async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  const project = testInfo.project.name;
  await open(page, 'w02-l13');
  await expect(page.getByTestId('play-bubble')).toHaveText(
    'Rẽ 2 lần là quay đầu: Măng nhìn ngược lại, chưa đi.',
  );
  await page.screenshot({ path: `${SHOTS}/${project}-w02-l13-start.png` });
  await winWithSolution(page, 'worlds/w02-rung-lap-lai/levels/w02-l13.json');
  await page.screenshot({ path: `${SHOTS}/${project}-w02-l13-won.png` });
});

test('w01-l13: the short road of "Hai lối về làng" wins', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const project = testInfo.project.name;
  await open(page, 'w01-l13');
  await page.screenshot({ path: `${SHOTS}/${project}-w01-l13-start.png` });
  await winWithSolution(page, 'worlds/w01-lang-tre/levels/w01-l13.json');
  await expect(page.getByTestId('results-stars')).toHaveAttribute('data-stars', '3');
  await page.screenshot({ path: `${SHOTS}/${project}-w01-l13-won.png` });
});
