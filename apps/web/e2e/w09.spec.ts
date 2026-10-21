import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import type * as BlocklyModule from 'blockly';
import { signInTestProfile } from './helpers';

// P4-13 smoke (docs/roadmap/phase-4.md): World 9 "Tháp Họa Sĩ" plays end to end: the first level,
// a predict level authored with drawProgram cards and the boss win with their solutions.

const SHOTS = process.env.CQ_SHOTS_DIR ?? 'test-results/w09';

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(new URL(`../../../content/${path}`, import.meta.url), 'utf8'));
const w09Level = (id: string) =>
  readJson(`worlds/w09-thap-hoa-si/levels/${id}.json`) as {
    solution: unknown;
    predict?: { options: Array<{ label: string }> };
  };

/** Test hook set by PlayScreen (dev build only). */
interface PlayHook {
  Blockly: typeof BlocklyModule;
  workspace: BlocklyModule.WorkspaceSvg;
  highlights: string[];
  answerKey?: string;
}
type HookWindow = Window & { __cqPlay: PlayHook };

/** Budget for a whole replay to finish, generous for a loaded machine. */
const RUN_MS = 30_000;

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

async function setProgram(page: Page, json: unknown): Promise<void> {
  await page.evaluate((workspaceJson) => {
    const { Blockly, workspace } = (window as unknown as HookWindow).__cqPlay;
    workspace.clear();
    Blockly.serialization.workspaces.load(workspaceJson as object, workspace);
  }, json);
}

/** The turtle canvas mirrors what the stage shows as data-turtle-* attributes. */
const paper = (page: Page) => page.getByTestId('play-stage').locator('canvas');
const shot = (page: Page, name: string, project: string) =>
  page.screenshot({ path: `${SHOTS}/${project}-${name}.png` });

test.describe('/play w09', () => {
  test.describe.configure({ timeout: process.env.CI ? 300_000 : 120_000 });

  for (const id of ['w09-l01', 'w09-l10', 'w09-boss']) {
    test(`@smoke ${id}: the solution draws the target and wins`, async ({ page }, testInfo) => {
      const project = testInfo.project.name;
      await open(page, id);
      await shot(page, `${id}-start`, project);
      await setProgram(page, w09Level(id).solution);
      await page.getByTestId('play-run').click();
      await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 60_000 });
      await expect(paper(page)).toHaveAttribute('data-turtle-left', '0');
      await shot(page, `${id}-success`, project);
    });
  }

  test('w09-l04: three drawn cards, the triangle wins', async ({ page }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'w09-l04');
    const cards = page.getByTestId('predict-card');
    await expect(cards).toHaveCount(3);
    await expect(
      page.locator('[data-testid="predict-card"] svg[data-turtle-answer="draw"]'),
    ).toHaveCount(3);
    await shot(page, 'w09-l04-cards', project);
    await cards.filter({ hasText: 'Tam giác' }).click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: RUN_MS });
  });
});
