import { mkdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { signInTestProfile } from './helpers';

// Coach review profile (dev builds): "HLV" is seeded from VITE_COACH_PIN, opens every world and
// level without playing in order, and a child's profile stays locked. playwright.config.ts starts
// a second dev server (PW_PORT + 1) with a *fake* PIN (E2E_COACH_PIN, default 2468) just for this
// spec, so a plain `npm run e2e` runs it. Never the coach's own server on 5173.

const PIN = process.env['E2E_COACH_PIN'];
const COACH_URL = process.env['E2E_COACH_URL'];
const SHOTS = process.env['SHOTS_DIR'] ?? 'test-results/coach-profile';
const LATE_LEVEL = 'w02-l15';

test.skip(PIN === undefined || COACH_URL === undefined, 'run through playwright.config.ts');
test.use({ baseURL: COACH_URL });

test('HLV picks the coach tile, enters the PIN and opens a late W2 level from the map', async ({
  page,
}) => {
  mkdirSync(SHOTS, { recursive: true });
  await page.goto('/');
  const tile = page.getByTestId('coach-tile');
  await expect(tile).toBeVisible();
  await expect(tile.getByTestId('coach-badge')).toHaveText('HLV');
  await page.screenshot({ path: `${SHOTS}/picker.png` });

  await tile.click();
  await expect(page.getByTestId('pin-dialog')).toBeVisible();
  for (const digit of PIN ?? '') await page.keyboard.press(digit);
  await expect(page).toHaveURL(/\/map$/);
  await expect(page.getByTestId('switch-profile').getByTestId('coach-badge')).toBeVisible();

  const world2 = page.locator('[data-world="w02-rung-lap-lai"]');
  await expect(world2).toBeVisible();
  await world2.click();
  await expect(page).toHaveURL(/\/w\/w02-rung-lap-lai$/);
  const level = page.locator(`[data-level="${LATE_LEVEL}"]`);
  await expect(level).toHaveAttribute('data-status', 'open');
  await page.screenshot({ path: `${SHOTS}/world2.png` });

  await level.click();
  await expect(page).toHaveURL(new RegExp(`/play/${LATE_LEVEL}$`));
  await expect(page.getByTestId('play-stage')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/play-w02-l15.png` });
});

test('a child profile stays locked on the same laptop', async ({ page }) => {
  await signInTestProfile(page, 'Bé Khóa');
  await page.addInitScript(() => {
    sessionStorage.removeItem('cq.unlockAll');
  });
  await page.goto('/w/w02-rung-lap-lai');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.locator(`[data-level="${LATE_LEVEL}"]`)).toHaveCount(0);
});
