import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import type * as BlocklyModule from 'blockly';
import { signInTestProfile } from './helpers';

// Difficulty pass, batch D (docs/roadmap/difficulty-pass.md): World 6 on two-way boards. Plays
// two redesigned levels to a win: l09 (the yellow decoy station at the junction, the red one at
// the end of the street) and the boss on the 5×7 board (neutralize first, retrieve on the way
// home). Screenshots go to SHOTS_DIR when set.

const SHOTS = process.env['SHOTS_DIR'] ?? 'test-results/difficulty-d';

const levelJson = (id: string) =>
  JSON.parse(
    readFileSync(
      new URL(`../../../content/worlds/w06-thanh-pho-robot/levels/${id}.json`, import.meta.url),
      'utf8',
    ),
  ) as { solution: unknown };

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
  await expect(page.getByTestId('play-stage').locator('canvas')).toHaveCount(1);
  await page.waitForFunction(
    () => (window as unknown as Partial<HookWindow>).__cqPlay !== undefined,
  );
}

async function winWithSolution(page: Page, levelId: string): Promise<void> {
  await page.evaluate((workspaceJson) => {
    const { Blockly, workspace } = (window as unknown as HookWindow).__cqPlay;
    workspace.clear();
    Blockly.serialization.workspaces.load(workspaceJson as object, workspace);
  }, levelJson(levelId).solution);
  await page.getByTestId('play-run').click();
  await page.getByRole('radio', { name: 'Nhanh' }).click();
  await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 90_000 });
}

const canvas = (page: Page) => page.getByTestId('play-stage').locator('canvas');

test('w06-l09: Bíp passes the yellow decoy at the junction and neutralizes at the red station', async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  const project = testInfo.project.name;
  await open(page, 'w06-l09');
  await expect(canvas(page)).toHaveAttribute('data-robot-pos', '1,0');
  await expect(canvas(page)).toHaveAttribute('data-robot-dir', 'E');
  await page.screenshot({ path: `${SHOTS}/${project}-w06-l09-start.png` });
  await winWithSolution(page, 'w06-l09');
  await expect(canvas(page)).toHaveAttribute('data-robot-pos', '1,0');
  await page.screenshot({ path: `${SHOTS}/${project}-w06-l09-won.png` });
});

test('w06-boss: neutralize first, retrieve on the way home, 300 points in 50 s', async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  const project = testInfo.project.name;
  await open(page, 'w06-boss');
  await expect(page.getByTestId('play-bubble')).toHaveText('Đổi thứ tự việc thì số giây cũng đổi.');
  await expect(canvas(page)).toHaveAttribute('data-robot-clock', '50');
  await page.screenshot({ path: `${SHOTS}/${project}-w06-boss-start.png` });
  await winWithSolution(page, 'w06-boss');
  await expect(canvas(page)).toHaveAttribute('data-robot-pos', '2,3');
  await expect(canvas(page)).toHaveAttribute('data-robot-score', '300');
  await page.screenshot({ path: `${SHOTS}/${project}-w06-boss-won.png` });
});
