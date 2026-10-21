import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import type * as BlocklyModule from 'blockly';
import { confirmRestart, signInTestProfile } from './helpers';

// P4-09 acceptance (docs/roadmap/phase-4.md): the turtle stage on the dev-only _sandbox levels
// turtle-square (build), turtle-predict (cards authored as drawProgram). Screenshots for the PR.

const SHOTS = process.env.CQ_SHOTS_DIR ?? 'test-results/turtle';

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(new URL(`../../../content/${path}`, import.meta.url), 'utf8'));
const shared = readJson('shared/feedback.json') as Record<string, string>;
const sandbox = (id: string) =>
  readJson(`worlds/_sandbox/levels/${id}.json`) as {
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

/** "khi bắt đầu" then `tiến 3 bước` at (1, 3) facing right: the third step leaves the square. */
const TOO_LONG = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: 'cq_start',
        id: 'start',
        x: 40,
        y: 40,
        next: { block: { type: 'turtle_forward', id: 'fwd1', fields: { N: 3 } } },
      },
    ],
  },
};

test.describe('/play turtle', () => {
  test.describe.configure({ timeout: process.env.CI ? 300_000 : 120_000 });

  test('@smoke turtle-square: the solution draws the square and wins', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'turtle-square');
    await expect(paper(page)).toHaveAttribute('data-turtle-hud', 'Còn 8 nét');
    await expect(paper(page)).toHaveAttribute('data-turtle-drawn', '0');
    await shot(page, 'square-start', project);
    await setProgram(page, sandbox('turtle-square').solution);
    await page.getByTestId('play-run').click();
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-phase', 'running');
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: RUN_MS });
    await expect(paper(page)).toHaveAttribute('data-turtle-drawn', '8');
    await expect(paper(page)).toHaveAttribute('data-turtle-left', '0');
    await expect(paper(page)).toHaveAttribute('data-turtle-hud', 'Còn 0 nét');
    await shot(page, 'square-success', project);
  });

  test('a stray line stops Măng with EXTRA_LINE and paints it red', async ({ page }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'turtle-square');
    await setProgram(page, TOO_LONG);
    await page.getByTestId('play-run').click();
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-phase', 'fail', {
      timeout: RUN_MS,
    });
    await expect(page.getByTestId('play-bubble')).toHaveText(shared.EXTRA_LINE ?? '');
    await expect(paper(page)).toHaveAttribute('data-turtle-drawn', '2');
    await expect(paper(page)).not.toHaveAttribute('data-turtle-stray', '');
    await expect(paper(page)).toHaveAttribute('data-turtle-stunned', 'true');
    await page.getByTestId('play-stage').screenshot({ path: `${SHOTS}/${project}-extra-line.png` });
    await shot(page, 'extra-line-page', project);
    await expect(paper(page)).toHaveAttribute('data-turtle-red', 'true');

    // Làm lại: the red line, the ink and the daze all go; Măng is back at the start.
    await page.keyboard.press('r');
    await confirmRestart(page);
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-phase', 'idle');
    await expect(paper(page)).toHaveAttribute('data-turtle-red', 'false');
    await expect(paper(page)).toHaveAttribute('data-turtle-drawn', '0');
    await expect(paper(page)).toHaveAttribute('data-turtle-stunned', 'false');
    await expect(paper(page)).toHaveAttribute('data-turtle-hud', 'Còn 8 nét');
  });

  test('step by step draws one block at a time; Làm lại mid-run clears it', async ({ page }) => {
    await open(page, 'turtle-square');
    await setProgram(page, sandbox('turtle-square').solution);
    const stage = page.getByTestId('play-stage');
    await stage.focus();
    await page.keyboard.press('s');
    await expect(stage).toHaveAttribute('data-waiting-step', 'true');
    // Each press runs one block: the loop, then tiến 2 (2 lines), then rẽ phải.
    await page.keyboard.press('s');
    await expect(stage).toHaveAttribute('data-waiting-step', 'true');
    await page.keyboard.press('s');
    await expect(paper(page)).toHaveAttribute('data-turtle-drawn', '2', { timeout: RUN_MS });
    await expect(stage).toHaveAttribute('data-waiting-step', 'true');
    await page.keyboard.press('s');
    await expect(paper(page)).toHaveAttribute('data-turtle-heading', '9', { timeout: RUN_MS });
    await page.keyboard.press('r');
    await confirmRestart(page);
    await expect(stage).toHaveAttribute('data-phase', 'idle');
    await expect(paper(page)).toHaveAttribute('data-turtle-drawn', '0');
    await expect(paper(page)).toHaveAttribute('data-turtle-wet', 'false');
    await expect(paper(page)).toHaveAttribute('data-turtle-heading', '0');
  });

  test('@smoke turtle-predict: every card shows its drawing; the right card wins', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    const level = sandbox('turtle-predict');
    await open(page, 'turtle-predict');
    const options = level.predict?.options ?? [];
    const cards = page.getByTestId('predict-card');
    await expect(cards).toHaveCount(options.length);
    for (const [index, option] of options.entries()) {
      const card = cards.nth(index);
      await expect(card).toContainText(option.label);
      await expect(card.locator('svg[data-turtle-answer="draw"]')).toHaveCount(1);
      // Every card draws lines in ink (9 for each side-3 shape of this level).
      expect(await card.locator('svg line').count()).toBeGreaterThanOrEqual(9);
    }
    await shot(page, 'predict-cards', project);
    const answer = await page.evaluate(() => (window as unknown as HookWindow).__cqPlay.answerKey);
    expect(answer?.startsWith('draw:')).toBe(true);
    await page.locator(`[data-testid="predict-card"][data-key="${answer ?? ''}"]`).click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: RUN_MS });
    await expect(page.getByTestId('results-stars')).toHaveAttribute('data-stars', '3');
    await expect(paper(page)).toHaveAttribute('data-turtle-drawn', '9');
    await shot(page, 'predict-success', project);
  });
});
