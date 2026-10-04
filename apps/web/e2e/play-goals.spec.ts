import { expect, type Page, test } from '@playwright/test';
import type * as BlocklyModule from 'blockly';
import { signInTestProfile } from './helpers';

// P2-21 acceptance (docs/roadmap/phase-2.md) and the drawing half of P2-11c: the dev-only
// _sandbox level runner-goals (star goal "nhặt hết măng", mission line, goal sprite "friend").
// The "Mục tiêu ⭐" card shows before playing; three jumps win without the bamboo (⭐, the
// results say which goal was missed); jump, jump, walk, walk gets ⭐⭐⭐. Then screenshots of the
// Thế giới 3 goal pictures (machine, exit, home) for the PR.

/** Screenshots for the PR go to SHOTS_DIR when set (the AI's scratchpad), else test-results. */
const SHOTS = process.env['SHOTS_DIR'] ?? 'test-results/play-goals';
const LEVEL_ID = 'runner-goals';

interface PlayHook {
  Blockly: typeof BlocklyModule;
  workspace: BlocklyModule.WorkspaceSvg;
}
type HookWindow = Window & { __cqPlay: PlayHook };

/** Workspace JSON: "khi bắt đầu" followed by runner moves in a chain. */
function program(...moves: Array<'walk' | 'jump'>): unknown {
  let next: unknown;
  [...moves].reverse().forEach((move, i) => {
    next = {
      block: { type: `runner_${move}`, id: `b${String(i)}`, ...(next !== undefined && { next }) },
    };
  });
  return {
    blocks: {
      languageVersion: 0,
      blocks: [
        { type: 'cq_start', id: 'start', x: 40, y: 40, ...(next !== undefined && { next }) },
      ],
    },
  };
}

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

async function openLevel(page: Page, levelId: string): Promise<void> {
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

/** Runs the program on the stage and waits for the results overlay. */
async function runToResults(page: Page): Promise<void> {
  await page.getByTestId('play-run').click();
  await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 30_000 });
}

test.describe('/play/runner-goals: star goals, mission, goal sprite', () => {
  test('card before playing, ⭐ without the bamboo, ⭐⭐⭐ with it', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const project = testInfo.project.name;
    await signInTestProfile(page);
    await openLevel(page, LEVEL_ID);

    // The "Mục tiêu ⭐" card is up on entry: one line per star count.
    const card = page.getByTestId('star-goals-card');
    await expect(card).toBeVisible();
    await expect(card.getByRole('heading')).toHaveText('Mục tiêu sao');
    const rows = card.getByTestId('star-goals-rows').locator('li');
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0)).toHaveAttribute('data-stars', '1');
    await expect(rows.nth(0)).toContainText('Tới nơi');
    await expect(rows.nth(1)).toHaveAttribute('data-goal', 'collectAll');
    await expect(rows.nth(1)).toContainText('Nhặt hết măng');
    await expect(rows.nth(2)).toContainText('Không quá 4 khối');
    await expect(card).toContainText('Mang măng về cho Thỏ Bông nhé!');
    await page.screenshot({ path: `${SHOTS}/${project}-card.png` });
    // The tier-0 "enter" hint waits for the card: Măng still says the ready line.
    await expect(page.getByTestId('play-bubble')).toContainText('Ghép khối rồi bấm Chạy nhé!');
    await card.getByTestId('star-goals-go').click();
    await expect(card).toHaveCount(0);

    // Mission (story) above the objective (task); the goal picture on the stage.
    await expect(page.getByTestId('play-mission')).toContainText('Mang măng về cho Thỏ Bông nhé!');
    await expect(page.getByTestId('play-objective')).toContainText('Tới chỗ Thỏ Bông nhé!');
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-goal-sprite', 'friend');
    // "Xem cả đường" draws the same goal picture.
    await page.getByTestId('plan-open').click();
    await expect(page.getByTestId('plan-view').locator('[data-goal-sprite="friend"]')).toHaveCount(
      1,
    );
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('plan-view')).toHaveCount(0);

    await page.getByRole('radio', { name: 'Nhanh' }).click();
    // Three jumps: the shortest win, over the bamboo.
    await setProgram(page, program('jump', 'jump', 'jump'));

    // The star button opens the card again; after Esc focus is on the stage, so Space runs the
    // program (it does not reopen the card).
    await page.getByTestId('star-goals-open').click();
    await expect(card).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(card).toHaveCount(0);
    await page.keyboard.press('Space');
    await expect(card).toHaveCount(0);
    await expect(page.getByTestId('play-stage')).not.toHaveAttribute('data-phase', 'idle');

    // ⭐ only, and the results say why.
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('results-stars')).toHaveAttribute('data-stars', '1');
    const goals = page.getByTestId('results-goals');
    await expect(goals).toHaveAttribute('data-goals-met', 'false');
    await expect(goals.locator('[data-goal="win"]')).toHaveAttribute('data-met', 'true');
    await expect(goals.locator('[data-goal="collectAll"]')).toHaveAttribute('data-met', 'false');
    // The ⭐⭐⭐ line is not graded after a missed ⭐⭐ goal: no ✔ on a ⭐ result.
    await expect(goals.locator('[data-goal="par"]')).toHaveAttribute('data-met', 'none');
    await expect(goals.locator('[data-goal="hint"]')).toHaveCount(0);
    await expect(page.getByTestId('play-success')).toContainText(
      'Qua màn rồi! Nhặt hết măng là thêm sao.',
    );
    await page.screenshot({ path: `${SHOTS}/${project}-one-star.png` });

    // Chơi lại; the bubble behind said the goal was missed, not the par praise.
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('play-success')).toHaveCount(0);

    // Jump, jump, walk, walk: lands on the bamboo, 4 blocks = par. ⭐⭐⭐.
    await setProgram(page, program('jump', 'jump', 'walk', 'walk'));
    await runToResults(page);
    await expect(page.getByTestId('results-stars')).toHaveAttribute('data-stars', '3');
    await expect(goals).toHaveAttribute('data-goals-met', 'true');
    await expect(goals.locator('[data-met="false"]')).toHaveCount(0);
    await expect(goals.locator('li')).toHaveCount(3);
    await page.screenshot({ path: `${SHOTS}/${project}-three-stars.png` });
  });

  test('a level without star goals has no card and no star button', async ({ page }) => {
    await signInTestProfile(page);
    await openLevel(page, 'runner-bamboo');
    await expect(page.getByTestId('star-goals-card')).toHaveCount(0);
    await expect(page.getByTestId('star-goals-open')).toHaveCount(0);
    await expect(page.getByTestId('play-mission')).toHaveCount(0);
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-goal-sprite', 'flag');
  });

  test('predict cards and the plan view draw the goal picture (maze-predict: exit)', async ({
    page,
  }) => {
    await signInTestProfile(page);
    await openLevel(page, 'maze-predict');
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-goal-sprite', 'exit');
    const cards = page.getByTestId('predict-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(2);
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i).locator('[data-goal-sprite="exit"]')).toHaveCount(1);
    }
    await page.getByTestId('plan-open').click();
    await expect(page.getByTestId('plan-view').locator('[data-goal-sprite="exit"]')).toHaveCount(1);
  });
});

test.describe('Thế giới 3 goal pictures (screenshots)', () => {
  // W3 content belongs to another stream: these only take pictures for the PR, never assert
  // the levels (the goal pictures are checked on the sandbox levels above).
  for (const levelId of ['w03-l02', 'w03-l06', 'w03-l10', 'w03-l01'] as const) {
    test(`${levelId} screenshot`, async ({ page }, testInfo) => {
      await signInTestProfile(page);
      await openLevel(page, levelId);
      await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-${levelId}.png` });
      await page.getByTestId('plan-open').click();
      await expect(page.getByTestId('plan-view')).toBeVisible();
      await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-${levelId}-plan.png` });
    });
  }

  test('w03-l11 screenshot (its star card)', async ({ page }, testInfo) => {
    await signInTestProfile(page);
    await openLevel(page, 'w03-l11');
    await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-w03-l11-card.png` });
  });

  test('/dev/ui shows every goal picture', async ({ page }, testInfo) => {
    await page.goto('/dev/ui');
    const gallery = page.getByTestId('demo-goal-sprites');
    await expect(gallery.locator('figure')).toHaveCount(8);
    await gallery.scrollIntoViewIfNeeded();
    await gallery.screenshot({ path: `${SHOTS}/${testInfo.project.name}-goal-sprites.png` });
  });
});
