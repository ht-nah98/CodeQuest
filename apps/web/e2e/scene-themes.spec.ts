import { mkdirSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import { signInTestProfile } from './helpers';

// P2-23 acceptance (docs/roadmap/phase-2.md): every world has its own scenery. One level per
// world (W1–W4) and a sandbox maze (no world.json: Làng Tre by default): the stage, its canvas,
// the full-track strip, "Xem cả đường" and the predict cards carry the world's `data-theme`; the
// map's islands too. Song (W5, no content yet) is previewed with the dev-only `?theme=` switch.
// Screenshots for the internal review go to CQ_SHOTS_DIR.

const SHOTS = process.env['CQ_SHOTS_DIR'] ?? 'test-results/scene-themes';
mkdirSync(SHOTS, { recursive: true });

test.describe.configure({ timeout: 90_000 });

let errors: string[];

test.beforeEach(({ page }) => {
  errors = [];
  page.on('console', (msg) => {
    // Chrome's own GL driver notes (screenshots read the WebGL canvas back) are not app output.
    if (msg.text().startsWith('[.WebGL-')) return;
    if (msg.type() === 'error' || msg.type() === 'warning') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
});

test.afterEach(() => {
  expect(errors).toEqual([]);
});

async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page.getByTestId('play-stage')).toHaveAttribute('data-ready', 'true', {
    timeout: 30_000,
  });
  // Levels with star goals open with the "Mục tiêu sao" card first.
  const card = page.getByTestId('star-goals-card');
  if ((await card.count()) > 0) {
    await card.getByTestId('star-goals-go').click();
    await expect(card).toHaveCount(0);
  }
}

/** The stage and the canvas its renderer drew are both in `theme`. */
async function expectStageTheme(page: Page, theme: string): Promise<void> {
  const stage = page.getByTestId('play-stage');
  await expect(stage).toHaveAttribute('data-theme', theme);
  await expect(stage.locator('canvas')).toHaveAttribute('data-theme', theme);
}

/** Opens "Xem cả đường", checks its theme, screenshots it and closes it again. */
async function expectPlanTheme(page: Page, theme: string, shot: string): Promise<void> {
  await page.getByTestId('plan-open').click();
  const view = page.getByTestId('plan-view');
  await expect(view).toBeVisible();
  await expect(view).toHaveAttribute('data-theme', theme);
  await page.screenshot({ path: `${SHOTS}/${shot}-plan.png` });
  await page.keyboard.press('Escape');
  await expect(view).toBeHidden();
}

const CASES = [
  { world: 'W1', level: 'w01-boss', theme: 'lang-tre', strip: false },
  { world: 'W2', level: 'w02-boss', theme: 'rung-lap-lai', strip: true },
  { world: 'W3', level: 'w03-l11', theme: 'xuong', strip: true },
  { world: 'W3 maze', level: 'w03-l13', theme: 'xuong', strip: false },
  { world: 'W4', level: 'w04-l17', theme: 'nga-ba', strip: true },
  { world: 'W4 maze', level: 'w04-l16', theme: 'nga-ba', strip: false },
  { world: 'sandbox maze', level: 'maze-try', theme: 'lang-tre', strip: false },
] as const;

for (const { world, level, theme, strip } of CASES) {
  test(`${world}: ${level} is drawn in the ${theme} theme`, async ({ page }, testInfo) => {
    const shot = `${testInfo.project.name}-${level}`;
    await signInTestProfile(page);
    await open(page, `/play/${level}`);
    await expectStageTheme(page, theme);
    if (strip) {
      // At 1280 px the long tracks never fit the stage; at 1366 px they may (no strip then).
      const shown = page.getByTestId('track-strip');
      if ((await shown.count()) > 0) await expect(shown).toHaveAttribute('data-theme', theme);
    }
    await page.screenshot({ path: `${SHOTS}/${shot}.png` });
    await expectPlanTheme(page, theme, shot);
  });
}

test('predict cards draw the world: W4 runner and W3 maze', async ({ page }, testInfo) => {
  await signInTestProfile(page);
  for (const [level, theme] of [
    ['w04-l10', 'nga-ba'],
    ['w03-l09', 'xuong'],
  ] as const) {
    await open(page, `/play/${level}`);
    await expectStageTheme(page, theme);
    const cards = page.getByTestId('predict-cards');
    await expect(cards).toHaveAttribute('data-theme', theme);
    await expect(cards.getByTestId('predict-card').first()).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-${level}-predict.png` });
  }
});

test('dev preview: the river theme (W5) on a runner, a boss track with its bridge and a maze', async ({
  page,
}, testInfo) => {
  await signInTestProfile(page);
  for (const level of ['runner-long', 'w02-boss', 'maze-bamboo']) {
    await open(page, `/play/${level}?theme=song`);
    await expectStageTheme(page, 'song');
    await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-song-${level}.png` });
  }
  // An unknown theme falls back to the world's own.
  await open(page, '/play/w02-l01?theme=moon');
  await expectStageTheme(page, 'rung-lap-lai');
});

test('the map shows every world island in its theme', async ({ page }, testInfo) => {
  await signInTestProfile(page);
  await page.goto('/map');
  await expect(page.getByTestId('map-strip')).toBeVisible({ timeout: 30_000 });
  for (const [id, theme] of [
    ['w01-lang-tre', 'lang-tre'],
    ['w02-rung-lap-lai', 'rung-lap-lai'],
    ['w03-xuong-sua-loi', 'xuong'],
    ['w04-nga-ba-quyet-dinh', 'nga-ba'],
  ] as const) {
    const island = page.locator(`[data-world="${id}"]`);
    await expect(island).toHaveAttribute('data-theme', theme);
    await expect(island.locator(`svg[data-theme="${theme}"]`)).toHaveCount(1);
  }
  await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-map.png` });
});
