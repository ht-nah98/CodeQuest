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
  // Signing in lands on the hub, which is where the two courses are chosen (ADR-0028).
  await expect(page).toHaveURL(/\/hub$/);
  await page.getByRole('link', { name: /CodeQuest/ }).click();
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

test('HLV reads every Leanbot lesson without the lesson 0 ticks', async ({ page }) => {
  // Coach request 22/10/2026: the coach reviews the whole course, and has no robot ticks to give.
  await page.goto('/');
  await page.getByTestId('coach-tile').click();
  for (const digit of PIN ?? '') await page.keyboard.press(digit);
  await expect(page).toHaveURL(/\/hub$/);
  // The pointer is still where the coach tile was. At 1280 px that is the bottom edge of the
  // Leanbot card, whose hover lift moves it off the pointer and back: it never holds still.
  await page.mouse.move(0, 0);
  await page.getByRole('link', { name: /^Leanbot/ }).click();
  await expect(page).toHaveURL(/\/leanbot$/);
  await expect(page.getByText('HLV xem được mọi bài, không cần tích Bài 0.')).toBeVisible();
  const last = page.getByRole('link', { name: /Đi theo đường thông minh/ });
  await expect(last).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/leanbot-coach.png` });

  await last.click();
  await expect(page).toHaveURL(/\/leanbot\/bai-04\/0$/);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.screenshot({ path: `${SHOTS}/leanbot-coach-bai-04.png` });
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

// Màn 0 of the Leanbot world (the-gioi-leanbot.md §4): hidden from children until the world is
// done, so it is reached from the coach's hub.
const PASTED = [
  '#include <Leanbot.h>',
  '',
  'void setup() {',
  '  Leanbot.begin();',
  '}',
  '',
  'void loop() {',
  '  LbMission.begin(TB1A + TB1B);',
  '  LbMotion.runLRrpm(30, 30);',
  '  LbMotion.waitDistanceMm(20 * 10);',
  '  Wire.begin();',
  '  LbMotion.stopAndWait();',
  '  LbMission.end();',
  '}',
].join('\n');

test('HLV turns pasted Leanbot code into Vietnamese blocks and back', async ({ page }) => {
  mkdirSync(SHOTS, { recursive: true });
  await page.goto('/');
  await page.getByTestId('coach-tile').click();
  for (const digit of PIN ?? '') await page.keyboard.press(digit);
  await expect(page).toHaveURL(/\/hub$/);
  await page.mouse.move(0, 0);
  await page.getByTestId('hub-leanbot-world').click();
  await expect(page).toHaveURL(/\/xuong-phien-dich$/);
  const code = page.getByTestId('workshop-code');
  // An empty workspace is Pythaverse's empty sketch.
  await expect(code).toContainText('void loop() {');
  await expect(page.locator('.blocklyToolbox')).toContainText('Di chuyển');

  await page.getByRole('button', { name: 'Dán code vào' }).click();
  await page.getByTestId('workshop-paste').fill(PASTED);
  await page.getByRole('button', { name: 'Dựng khối' }).click();
  // 4 blocks: the mission and the three motion lines; Wire.begin() is no block's code.
  await expect(page.getByTestId('workshop-report')).toContainText('Măng dựng được 4 khối.');
  await expect(page.getByTestId('workshop-report')).toContainText(
    'Dòng 11: Măng chưa đọc được dòng này.',
  );
  await expect(code.locator('[data-problem]')).toHaveAttribute('data-line', '11');
  const blocks = page.getByTestId('workshop-blocks');
  await expect(blocks.getByText('với vận tốc Trái')).toBeVisible();
  await expect(blocks.getByText('Nhiệm vụ: Bắt đầu khi chạm cùng lúc')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/workshop-pasted.png` });

  // Code → block: a line selects its block, and the block lights its line back.
  await code.locator('[data-line="10"]').click();
  await expect(page.locator('.blocklySelected')).toHaveCount(1);
  await expect(code.locator('[data-highlight]')).toHaveAttribute('data-line', '10');

  // Blocks → code: deleting the selected "đi tiếp" block regenerates the code without it.
  await page.locator('.blocklySelected').first().press('Delete');
  await expect(code).not.toContainText('waitDistanceMm');
  await expect(code).not.toContainText('Wire');
  await expect(code).toContainText('LbMotion.runLRrpm(30, 30);');
  await expect(page.getByTestId('workshop-report')).toHaveCount(0);
  await page.screenshot({ path: `${SHOTS}/workshop-blocks.png` });

  // The toolbox is Pythaverse's: Leanbot opens on its six groups, the leds come with a palette.
  await page.getByRole('treeitem', { name: 'Leanbot', exact: true }).click();
  await page.getByRole('treeitem', { name: 'Đèn Led RGB', exact: true }).click();
  await expect(page.locator('.blocklyFlyout').getByText('Đèn: Tô đèn').first()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/workshop-toolbox.png` });

  // Closing the flyout takes its scrollbar along (it once stayed on the workspace, coach 23/10).
  const flyoutBar = page.locator('.blocklyToolboxFlyout + .blocklyFlyoutScrollbar');
  await expect(flyoutBar).toBeVisible();
  // Clicking the open category again closes it.
  await page.getByRole('treeitem', { name: 'Đèn Led RGB', exact: true }).click();
  await expect(page.locator('.blocklyToolboxFlyout')).toBeHidden();
  await expect(flyoutBar).toBeHidden();

  // The bar between the columns drags; the blocks column follows.
  const blocksBox = async () => (await blocks.boundingBox())?.width ?? 0;
  const before = await blocksBox();
  const bar = page.getByTestId('workshop-split');
  const barBox = await bar.boundingBox();
  if (!barBox) throw new Error('no split bar');
  await page.mouse.move(barBox.x + barBox.width / 2, barBox.y + barBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(barBox.x - 200, barBox.y + barBox.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect.poll(blocksBox).toBeLessThan(before - 150);
  await bar.focus();
  await page.keyboard.press('ArrowRight');
  await expect(bar).toHaveAttribute('aria-valuenow', /\d+/);
  await page.screenshot({ path: `${SHOTS}/workshop-split.png` });
});
