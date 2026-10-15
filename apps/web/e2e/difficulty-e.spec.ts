import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import type * as BlocklyModule from 'blockly';
import { signInTestProfile } from './helpers';

// Difficulty pass, batch E (docs/roadmap/difficulty-pass.md): World 7 "Chợ Đếm Số" on 2-D maps.
// Two redesigned levels played to a win: the l05 bughunt (counting on a road with turns, junctions
// and dead ends) and the boss (count, then the box walks down a column with dead ends to the
// house). Screenshots go to SHOTS_DIR when set.

const SHOTS = process.env['SHOTS_DIR'] ?? 'test-results/difficulty-e';

const levelJson = (path: string) =>
  JSON.parse(readFileSync(new URL(`../../../content/${path}`, import.meta.url), 'utf8')) as {
    solution: unknown;
    variants?: unknown[];
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

/** Runs the level's solution on every map and checks each map tab is won. */
async function winEveryMap(page: Page, path: string): Promise<void> {
  const level = levelJson(path);
  await setProgram(page, level.solution);
  await page.getByTestId('play-run').click();
  await page.getByRole('radio', { name: 'Nhanh' }).click();
  await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 150_000 });
  const maps = 1 + (level.variants?.length ?? 0);
  for (let n = 1; n <= maps; n++) {
    await expect(page.getByTestId(`map-tab-${String(n)}`)).toHaveAttribute('data-result', 'won');
  }
}

test('w07-l05: counting on a road with turns; đặt 0 before the loop wins all 3 maps', async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  const project = testInfo.project.name;
  await open(page, 'w07-l05');
  await page.screenshot({ path: `${SHOTS}/${project}-w07-l05-start.png` });
  await winEveryMap(page, 'worlds/w07-cho-dem-so/levels/w07-l05.json');
  await page.screenshot({ path: `${SHOTS}/${project}-w07-l05-won.png` });
});

test('w07-boss: the counted shoots walk Măng down to each of the 3 houses', async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  const project = testInfo.project.name;
  await open(page, 'w07-boss');
  await page.screenshot({ path: `${SHOTS}/${project}-w07-boss-start.png` });
  await winEveryMap(page, 'worlds/w07-cho-dem-so/levels/w07-boss.json');
  await page.screenshot({ path: `${SHOTS}/${project}-w07-boss-won.png` });
});
