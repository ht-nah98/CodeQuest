import { mkdirSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import { signInTestProfile } from './helpers';

// P4-14: the scenes of W8 "Xưởng Phép Thuật" and W9 "Tháp Họa Sĩ". Their worlds have no content
// yet, so they are previewed with the dev-only `?theme=` switch (as W5 was in scene-themes.spec):
// a runner level, a boss track and a maze in each theme, the stage and its canvas in that theme,
// then "Xem cả đường". Screenshots (1280×720) go to CQ_SHOTS_DIR.

const SHOTS = process.env['CQ_SHOTS_DIR'] ?? 'test-results/scenes-p4';
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

const THEMES = ['xuong-phep-thuat', 'thap-hoa-si'] as const;
const LEVELS = ['runner-long', 'w02-boss', 'maze-bamboo'] as const;

for (const theme of THEMES) {
  test(`${theme}: runner, boss track and maze are drawn in the theme`, async ({
    page,
  }, testInfo) => {
    await signInTestProfile(page);
    for (const level of LEVELS) {
      await open(page, `/play/${level}?theme=${theme}`);
      const stage = page.getByTestId('play-stage');
      await expect(stage).toHaveAttribute('data-theme', theme);
      await expect(stage.locator('canvas')).toHaveAttribute('data-theme', theme);
      await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-${theme}-${level}.png` });
    }
    // The full-track picture wears the theme too.
    await page.getByTestId('plan-open').click();
    const view = page.getByTestId('plan-view');
    await expect(view).toBeVisible();
    await expect(view).toHaveAttribute('data-theme', theme);
    await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-${theme}-plan.png` });
  });
}
