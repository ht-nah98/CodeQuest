import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import type * as BlocklyModule from 'blockly';
import { signInTestProfile } from './helpers';

// P4-11 smoke (docs/roadmap/phase-4.md): World 8 "Xưởng Phép Thuật" plays end to end with the
// real spell blocks: the first spell level, the spell in a loop, the first spell with a box, a
// predict level where the flag is the wrong card, and the robot boss. 🟨 nháp, chờ HLV chơi thử.

const SHOTS = process.env.CQ_SHOTS_DIR ?? 'test-results/w08';

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(new URL(`../../../content/${path}`, import.meta.url), 'utf8'));
const w08Level = (id: string) =>
  readJson(`worlds/w08-xuong-phep-thuat/levels/${id}.json`) as { solution: unknown };

/** Test hook set by PlayScreen (dev build only). */
interface PlayHook {
  Blockly: typeof BlocklyModule;
  workspace: BlocklyModule.WorkspaceSvg;
  spells: string[];
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

const shot = (page: Page, name: string, project: string) =>
  page.screenshot({ path: `${SHOTS}/${project}-${name}.png` });

test.describe('/play w08', () => {
  test.describe.configure({ timeout: 120_000 });

  for (const id of ['w08-l01', 'w08-l03', 'w08-l08', 'w08-l13', 'w08-boss']) {
    test(`@smoke ${id}: the solution with spells wins`, async ({ page }, testInfo) => {
      const project = testInfo.project.name;
      await open(page, id);
      await shot(page, `${id}-start`, project);
      await setProgram(page, w08Level(id).solution);
      await page.getByTestId('play-run').click();
      await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 60_000 });
      await shot(page, `${id}-success`, project);
    });
  }

  test('w08-l14: the box takes a new number, the flag card is wrong', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'w08-l14');
    const cards = page.getByTestId('predict-card');
    await expect(cards).toHaveCount(3);
    await shot(page, 'w08-l14-cards', project);
    await cards.filter({ hasText: 'Dừng ở ô lõm' }).click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 30_000 });
  });
});
