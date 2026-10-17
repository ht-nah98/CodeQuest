import { mkdirSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import { signInTestProfile } from './helpers';

// P5-08: the scene of W10 "Học Viện Thuật Toán". The world has no content yet, so it is
// previewed with the dev-only `?theme=` switch (as in scenes-p4.spec): a runner level, a boss
// track, a maze (the hedge garden) and a robot lab board in the theme, the stage and its canvas
// in that theme, then "Xem cả đường". Screenshots (1280×720) go to CQ_SHOTS_DIR.
// The W10 map island and the story props `bookshelf` / `diploma` get e2e coverage once W10's
// world.json exists (P5-09); until then storyArt.test.ts and sceneThemes.test.ts cover them.

const SHOTS = process.env['CQ_SHOTS_DIR'] ?? 'test-results/scenes-p5';
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
  const card = page.getByTestId('star-goals-card');
  if ((await card.count()) > 0) {
    await card.getByTestId('star-goals-go').click();
    await expect(card).toHaveCount(0);
  }
}

const THEME = 'hoc-vien';
const LEVELS = ['maze-bamboo', 'robotlab-stage', 'w02-boss', 'runner-long'] as const;

test(`${THEME}: maze, robot lab, boss track and runner are drawn in the theme`, async ({
  page,
}, testInfo) => {
  await signInTestProfile(page);
  for (const level of LEVELS) {
    await open(page, `/play/${level}?theme=${THEME}`);
    const stage = page.getByTestId('play-stage');
    await expect(stage).toHaveAttribute('data-theme', THEME);
    await expect(stage.locator('canvas')).toHaveAttribute('data-theme', THEME);
    await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-${THEME}-${level}.png` });
  }
  // The full-track picture wears the theme too.
  await page.getByTestId('plan-open').click();
  const view = page.getByTestId('plan-view');
  await expect(view).toBeVisible();
  await expect(view).toHaveAttribute('data-theme', THEME);
  await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-${THEME}-plan.png` });
});
