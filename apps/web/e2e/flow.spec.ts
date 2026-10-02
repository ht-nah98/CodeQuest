import { readFileSync } from 'node:fs';
import { expect, type Locator, type Page, test } from '@playwright/test';
import type * as BlocklyModule from 'blockly';

// P1-10 acceptance (docs/roadmap/phase-1.md): profile → map → world → lesson → play → results →
// next level, by mouse and by keyboard; progress survives a reload; the results overlay shows
// the real stars and coins; backup → restore round trip; small screen; break reminder; author mode.
// The lesson and the "next level" run in the dev sandbox world (content/worlds/_sandbox:
// lesson-sample, flow-01, flow-02) because world 1 has no lesson and one level until P1-12.

const SHOTS = 'test-results/flow';

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(new URL(`../../../content/${path}`, import.meta.url), 'utf8'));
const w01l03 = readJson('worlds/w01-lang-tre/levels/w01-l03.json') as { solution: unknown };

type HookWindow = Window & {
  __cqPlay: { Blockly: typeof BlocklyModule; workspace: BlocklyModule.WorkspaceSvg };
};

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

const shot = (page: Page, name: string, project: string) =>
  page.screenshot({ path: `${SHOTS}/${project}-${name}.png` });

/** Presses Tab until `target` has focus (a keyboard user reaching it), at most `max` times. */
async function tabTo(page: Page, target: Locator, max = 40): Promise<void> {
  for (let i = 0; i < max; i++) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error('Tab never reached the target');
}

async function typePin(page: Page, pin: string): Promise<void> {
  for (const digit of pin) await page.keyboard.press(digit);
}

/** Creates a profile through /profile/new with the mouse; ends on /map. */
async function createProfileByMouse(page: Page, nickname: string, pin: string): Promise<void> {
  await page.goto('/');
  await expect(page).toHaveURL(/\/profile\/new$/);
  await page.locator('[data-avatar-option="fox"]').click();
  await page.getByRole('button', { name: 'Tiếp' }).click();
  await page.getByRole('textbox', { name: 'Biệt danh' }).fill(nickname);
  await page.getByRole('button', { name: 'Tiếp' }).click();
  for (const round of [1, 2]) {
    await expect(page.getByTestId('pin-dots')).toHaveAttribute('data-filled', '0');
    for (const digit of pin) await page.locator(`button[data-key="${digit}"]`).click();
    if (round === 1) await expect(page.getByText('Nhập lại đúng 4 số vừa rồi.')).toBeVisible();
  }
  await expect(page).toHaveURL(/\/map$/);
}

async function waitForPlay(page: Page): Promise<void> {
  await expect(page.getByTestId('play-stage')).toHaveAttribute('data-ready', 'true', {
    timeout: 30_000,
  });
  await page.waitForFunction(() => (window as Partial<HookWindow>).__cqPlay !== undefined);
}

async function setProgram(page: Page, json: unknown): Promise<void> {
  await page.evaluate((workspaceJson) => {
    const { Blockly, workspace } = (window as unknown as HookWindow).__cqPlay;
    workspace.clear();
    Blockly.serialization.workspaces.load(workspaceJson as object, workspace);
  }, json);
}

/** Drags the first flyout block under the last block of the program, with a real mouse. */
async function dragWalkToEnd(page: Page): Promise<void> {
  const source = page.locator('.blocklyFlyout .blocklyDraggable').first();
  // The main workspace only (the flyout is a workspace of its own, in its own <svg>).
  const canvas = page.locator('svg.blocklySvg > .blocklyWorkspace > .blocklyBlockCanvas');
  const walks = canvas.locator('.runner_walk');
  const target = (await walks.count()) > 0 ? walks.last() : canvas.locator('.cq_start').first();
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error('flyout or target block not rendered');
  await page.mouse.move(from.x + 15, from.y + 15);
  await page.mouse.down();
  await page.mouse.move(to.x + 20, to.y + to.height + 18, { steps: 12 });
  await page.mouse.up();
}

/** "khi bắt đầu" followed by blocks of these types. */
function program(types: string[]): unknown {
  // Built back to front, so the first type runs first.
  let chain: unknown;
  for (const [i, type] of [...types].reverse().entries()) {
    chain = { block: { type, id: `p${String(i)}`, ...(chain !== undefined && { next: chain }) } };
  }
  return {
    blocks: {
      languageVersion: 0,
      blocks: [
        {
          type: 'cq_start',
          id: 'start',
          x: 40,
          y: 40,
          ...(chain !== undefined && { next: chain }),
        },
      ],
    },
  };
}

const hudCoins = (page: Page) => page.locator('[data-hud-coins]');

test.describe('screen flow', () => {
  test('@smoke by mouse: new profile → map → world → lesson → play → results → next level', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await createProfileByMouse(page, 'Bin', '1234');
    await expect(hudCoins(page)).toContainText('30');
    await shot(page, 'map', project);

    // The sandbox world (dev only) has the sample lesson and two levels in a row.
    await page.locator('[data-world="_sandbox"]').click();
    await expect(page).toHaveURL(/\/w\/_sandbox$/);
    await expect(page.locator('[data-level="flow-01"]')).toHaveAttribute('data-status', 'locked');
    await shot(page, 'world-lesson-first', project);

    await page.getByTestId('lesson-stone').click();
    await expect(page.getByTestId('lesson-card')).toBeVisible();
    await page.getByTestId('lesson-next').click();
    await page.getByTestId('lesson-next').click();
    // The demo (Blockly + stage) is a lazy chunk: a cold dev server compiles it on demand.
    await expect(page.getByTestId('lesson-demo')).toBeVisible({ timeout: 30_000 });
    await page.getByTestId('lesson-demo-run').click();
    await expect(page.locator('[data-testid="lesson-demo"] [data-phase="done"]')).toBeVisible({
      timeout: 20_000,
    });
    await page.getByTestId('lesson-next').click();
    // A quiz card holds "Tiếp" until it is answered (right or wrong both count).
    await expect(page.getByTestId('lesson-next')).toBeDisabled();
    await page.getByTestId('quiz-option').nth(1).click();
    await expect(page.getByText(/Đúng rồi!/)).toBeVisible();
    await page.getByTestId('lesson-next').click();
    await page.getByTestId('lesson-finish').click();
    // +5 lesson, +10 first learning activity today.
    await expect(page.getByTestId('lesson-done')).toContainText('+15 xu');
    await expect(hudCoins(page)).toContainText('45');
    await shot(page, 'lesson-done', project);

    await page.getByRole('button', { name: 'Vào chơi' }).click();
    await expect(page).toHaveURL(/\/play\/flow-01$/);
    await waitForPlay(page);
    await dragWalkToEnd(page);
    await dragWalkToEnd(page);
    await page.getByTestId('play-run').click();

    const results = page.getByTestId('play-success');
    await expect(results).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('results-stars')).toHaveAttribute('data-stars', '3');
    await expect(page.getByTestId('results-lines')).toHaveText('Con vừa viết 2 dòng code!');
    // First clear at par on the first run: 10 + 5 + 5 + 5 (the daily bonus came with the lesson).
    await expect(page.getByTestId('results-total')).toHaveText('+25 xu');
    await expect(hudCoins(page)).toContainText('70');
    await page.waitForTimeout(2200); // stars land, coins fly
    await shot(page, 'results', project);

    await page.getByTestId('results-next').click();
    await expect(page).toHaveURL(/\/play\/flow-02$/);
    await waitForPlay(page);
    await expect(page.getByTestId('play-success')).toHaveCount(0);
  });

  test('@smoke by keyboard: Tab, Enter and Space only', async ({ page }, testInfo) => {
    const project = testInfo.project.name;
    await page.goto('/');
    await expect(page).toHaveURL(/\/profile\/new$/);
    // Step 1: the avatar radio group (arrow keys pick), then "Tiếp".
    await tabTo(page, page.locator('[data-avatar-option][aria-checked="true"]'));
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[data-avatar-option="bear"]')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await tabTo(page, page.getByRole('button', { name: 'Tiếp' }));
    await page.keyboard.press('Enter');
    // Step 2: the nickname field has focus; Enter submits.
    await page.keyboard.type('Na');
    await page.keyboard.press('Enter');
    // Step 3: PIN twice on the number keys.
    await typePin(page, '2468');
    await expect(page.getByText('Nhập lại đúng 4 số vừa rồi.')).toBeVisible();
    await typePin(page, '2468');
    await expect(page).toHaveURL(/\/map$/);

    // Sign out and back in with the PIN: a wrong PIN shakes and clears, no lock-out.
    await tabTo(page, page.getByTestId('switch-profile'));
    await page.keyboard.press('Enter');
    await tabTo(page, page.getByTestId('profile-tile'));
    await page.keyboard.press('Enter');
    await typePin(page, '1111');
    await expect(page.getByText('Chưa đúng mã. Con thử lại nhé!')).toBeVisible();
    await expect(page.getByTestId('pin-dots')).toHaveAttribute('data-filled', '0');
    await shot(page, 'pin-wrong', project);
    await typePin(page, '2468');
    await expect(page).toHaveURL(/\/map$/);

    await tabTo(page, page.locator('[data-world="_sandbox"]'));
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/w\/_sandbox$/);
    await tabTo(page, page.getByTestId('lesson-stone'));
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('lesson-card')).toHaveAttribute('data-card', '0');
    // ← → flip cards.
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('lesson-card')).toHaveAttribute('data-card', '2');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('lesson-card')).toHaveAttribute('data-card', '3');
    await tabTo(page, page.getByTestId('quiz-option').first());
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Chưa đúng, không sao!/)).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await tabTo(page, page.getByTestId('lesson-finish'));
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('lesson-done')).toBeVisible();
    // "Vào chơi" has focus.
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/play\/flow-01$/);
    await waitForPlay(page);

    // Building blocks with Blockly's own keyboard navigation is Blockly's feature, tested by
    // Blockly; here the program is loaded and the app's keys take over: Space runs.
    await setProgram(
      page,
      (readJson('worlds/_sandbox/levels/flow-01.json') as { solution: unknown }).solution,
    );
    await page.getByTestId('play-stage').focus();
    await page.keyboard.press('Space');
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 20_000 });
    // "Màn tiếp" has focus in the results overlay.
    await expect(page.getByTestId('results-next')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/play\/flow-02$/);
    await waitForPlay(page);
  });

  test('@smoke first clear of w01-l03 at par: real stars and coins; reload keeps them', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await createProfileByMouse(page, 'Tôm', '0000');
    await page.locator('[data-world="w01-lang-tre"]').click();
    await shot(page, 'world-w01', project);
    await page.locator('[data-level="w01-l03"]').click();
    await waitForPlay(page);
    await expect(hudCoins(page)).toContainText('30');
    await setProgram(page, w01l03.solution);
    await page.getByTestId('play-run').click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 20_000 });

    // rewards-economy.md §2: 10 first clear + 5 ⭐⭐ + 5 ⭐⭐⭐ + 5 first try + 10 daily = 35.
    await expect(page.getByTestId('results-stars')).toHaveAttribute('data-stars', '3');
    await expect(page.getByTestId('results-coins').locator('li')).toHaveText([
      /Qua màn lần đầu\s*\+10/,
      /Lần đầu 2 sao\s*\+5/,
      /Lần đầu 3 sao\s*\+5/,
      /Đúng ngay lần đầu\s*\+5/,
      /Thưởng hôm nay\s*\+10/,
    ]);
    await expect(page.getByTestId('results-total')).toHaveText('+35 xu');
    // Regression: nothing puts the stage back after a win (no late workspace report, draft
    // save or overlay effect): past the 150 ms change debounce and the 1 s draft autosave,
    // Măng is still cheering at the flag.
    await page.waitForTimeout(1500);
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-phase', 'success');
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-panda', 'cheer');
    await expect(page.getByTestId('results-lines')).toHaveText('Con vừa viết 3 dòng code!');
    await expect(hudCoins(page)).toContainText('65');
    // The only level of world 1 so far: no "Màn tiếp".
    await expect(page.getByTestId('results-next')).toHaveCount(0);

    // Esc closes the overlay (= Chơi lại).
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('play-success')).toHaveCount(0);

    // Winning again: no new coins (first-time lines are in the ledger already).
    await page.getByTestId('play-run').click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 20_000 });
    // Replaying a ⭐⭐⭐ level: +1 (at most 5 a day), nothing else.
    await expect(page.getByTestId('results-coins').locator('li')).toHaveText([
      /Chơi lại 3 sao\s*\+1/,
    ]);
    await expect(hudCoins(page)).toContainText('66');
    await page.getByRole('button', { name: 'Về thế giới' }).click();
    await expect(page).toHaveURL(/\/w\/w01-lang-tre$/);

    await page.reload();
    await expect(page.locator('[data-level="w01-l03"]')).toHaveAttribute('data-status', 'done');
    await expect(page.locator('[data-level="w01-l03"]').getByRole('img')).toHaveAccessibleName(
      '3 trên 3 sao',
    );
    await expect(hudCoins(page)).toContainText('66');
    await page.goto('/map');
    await expect(page.getByRole('list', { name: 'Thành tích' })).toContainText('66');
    await expect(page.getByRole('list', { name: 'Thành tích' })).toContainText('3');
    await shot(page, 'map-after-win', project);
  });

  test('backup → delete → restore round trip keeps the coins', async ({ page }, testInfo) => {
    const project = testInfo.project.name;
    await createProfileByMouse(page, 'Su', '1357');
    await page.goto('/play/w01-l03');
    await waitForPlay(page);
    await setProgram(page, w01l03.solution);
    await page.getByTestId('play-run').click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 20_000 });
    await expect(hudCoins(page)).toContainText('65');

    await page.goto('/settings');
    // The adults' tools open with the profile's PIN.
    await expect(page.getByTestId('adults-locked')).toBeVisible();
    await page.getByRole('button', { name: 'Mở bằng PIN' }).click();
    await typePin(page, '1357');
    const downloading = page.waitForEvent('download');
    await page.getByTestId('backup-download').click();
    const download = await downloading;
    expect(download.suggestedFilename()).toMatch(/^codequest-sao-luu-\d{4}-\d{2}-\d{2}\.json$/);
    const file = testInfo.outputPath('backup.json');
    await download.saveAs(file);
    const backup = JSON.parse(readFileSync(file, 'utf8')) as {
      profiles: Array<{ profile: Record<string, unknown> }>;
    };
    expect(backup.profiles).toHaveLength(1);
    expect(JSON.stringify(backup)).not.toContain('1357');
    await shot(page, 'settings', project);

    // Delete: PIN, then a second confirmation.
    await page.getByRole('button', { name: 'Xóa hồ sơ' }).click();
    await typePin(page, '1357');
    await page.getByRole('button', { name: 'Xóa hẳn' }).click();
    await expect(page).toHaveURL(/\/profile\/new$/);

    await page.getByRole('link', { name: 'Khôi phục từ file' }).click();
    await page.getByTestId('restore-input').setInputFiles(file);
    await expect(page.getByTestId('restore-message')).toHaveText('Đã khôi phục 1 hồ sơ.');
    await shot(page, 'restored', project);
    // Restoring twice adds nothing (the merge is idempotent).
    await page.getByTestId('restore-input').setInputFiles(file);
    await expect(page.getByTestId('restore-message')).toHaveText('Đã khôi phục 1 hồ sơ.');

    await page.getByRole('button', { name: 'Quay lại' }).click();
    await page.getByTestId('profile-tile').click();
    await typePin(page, '1357');
    await expect(page).toHaveURL(/\/map$/);
    await expect(hudCoins(page)).toContainText('65');
  });

  test('restoring a file that is not a backup says so', async ({ page }) => {
    await page.goto('/restore');
    await page.getByTestId('restore-input').setInputFiles({
      name: 'bad.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"hello": 1}'),
    });
    await expect(page.getByTestId('restore-message')).toHaveText(
      'Đây không phải file sao lưu CodeQuest.',
    );
  });

  test('dev sandbox: modes the play screen cannot run yet are hidden and not playable', async ({
    page,
  }) => {
    await createProfileByMouse(page, 'Dế', '1212');
    await page.goto('/w/_sandbox?unlock=all');
    await expect(page.locator('[data-level="flow-01"]')).toBeVisible();
    await expect(page.locator('[data-level="maze-predict"]')).toHaveCount(0);
    await expect(page.locator('[data-level="maze-bughunt"]')).toHaveCount(0);
    await page.goto('/play/maze-predict');
    await expect(page.getByRole('alert')).toHaveText(
      'Màn này chưa chơi được. Con chọn màn khác nhé!',
    );
  });

  test('a run counts even when its replay is stopped: no "first try" after it', async ({
    page,
  }) => {
    await createProfileByMouse(page, 'Gió', '2020');
    await page.goto('/play/w01-l03');
    await waitForPlay(page);
    // Slowest speed, so the replay is surely still going when Dừng is pressed.
    await page.getByRole('radio', { name: 'Chậm' }).click();
    await setProgram(page, program(['runner_walk', 'runner_walk']));
    await page.getByTestId('play-run').click();
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-phase', 'running');
    await page.getByTestId('play-run').click(); // Dừng
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-phase', 'idle');

    await page.getByRole('radio', { name: 'Nhanh' }).click();
    await setProgram(page, w01l03.solution);
    await page.getByTestId('play-run').click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('results-coins').locator('li')).toHaveText([
      /Qua màn lần đầu\s*\+10/,
      /Lần đầu 2 sao\s*\+5/,
      /Lần đầu 3 sao\s*\+5/,
      /Thưởng hôm nay\s*\+10/,
    ]);
    await expect(page.getByText('Đúng ngay lần đầu')).toHaveCount(0);
  });

  test('"Đổi người chơi" signs out: Back does not return to the map', async ({ page }) => {
    await createProfileByMouse(page, 'Lá', '3030');
    await page.getByTestId('switch-profile').click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('profile-tile')).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('profile-tile')).toBeVisible();
    await expect(page.locator('[data-hud-coins]')).toHaveCount(0);
  });

  test('a level not reached yet does not open by URL', async ({ page }) => {
    await createProfileByMouse(page, 'Mưa', '4040');
    // flow-01 waits for the sandbox lesson.
    await page.goto('/play/flow-01');
    await expect(page.getByRole('alert')).toHaveText('Màn này chưa mở. Con qua màn trước nhé!');
    await expect(page.getByTestId('play-stage')).toHaveCount(0);
    await page.getByTestId('play-back-out').click();
    await expect(page).toHaveURL(/\/w\/_sandbox$/);
    // The dev unlock override is honoured.
    await page.goto('/play/flow-01?unlock=all');
    await waitForPlay(page);
    await page.goto('/w/_sandbox/lesson/nope?unlock=0');
    await expect(page.getByRole('alert')).toHaveText('Không tìm thấy bài giảng này.');
    await page.getByRole('button', { name: 'Về thế giới' }).click();
    await expect(page).toHaveURL(/\/w\/_sandbox$/);
  });

  test('break reminder after 25 minutes of play', async ({ page }, testInfo) => {
    await page.clock.install();
    await createProfileByMouse(page, 'Mít', '4321');
    await expect(page.getByTestId('break-reminder')).toHaveCount(0);
    await page.clock.runFor('24:00');
    await expect(page.getByTestId('break-reminder')).toHaveCount(0);
    await page.clock.runFor('01:30');
    await expect(page.getByTestId('break-reminder')).toBeVisible();
    await expect(page.getByTestId('break-reminder')).toContainText(
      'Mình chơi lâu rồi. Đứng dậy vươn vai nhé!',
    );
    await shot(page, 'break', testInfo.project.name);
    await page.getByRole('button', { name: 'Mình nghỉ xong rồi' }).click();
    await expect(page.getByTestId('break-reminder')).toHaveCount(0);
  });

  test('author mode (dev): copy workspace JSON, unlock all', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await createProfileByMouse(page, 'Cô', '9999');
    await page.goto('/w/_sandbox?unlock=all');
    await expect(page.locator('[data-level="flow-02"]')).toHaveAttribute('data-status', 'open');
    await page.goto('/play/flow-01?author=1');
    await waitForPlay(page);
    await page.getByTestId('author-copy').click();
    await expect(page.getByTestId('author-copy')).toHaveText('Đã chép!');
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(JSON.parse(copied)).toHaveProperty('blocks.languageVersion', 0);
    // Without the flags, the sandbox chain is locked again.
    await page.goto('/play/flow-01?author=0');
    await waitForPlay(page);
    await expect(page.getByTestId('author-tools')).toHaveCount(0);
    await page.goto('/w/_sandbox?unlock=0');
    await expect(page.locator('[data-level="flow-02"]')).toHaveAttribute('data-status', 'locked');
  });
});

test.describe('small screen', () => {
  test.use({ viewport: { width: 1000, height: 600 } });

  test('below 1280×720 the app asks for a laptop', async ({ page }, testInfo) => {
    await page.goto('/');
    await expect(page.getByTestId('small-screen')).toContainText(
      'Màn hình nhỏ quá, con mở trên laptop nhé.',
    );
    await shot(page, 'small-screen', testInfo.project.name);
  });
});

test.describe('a 1280×720 laptop shows ~1280×600 of page', () => {
  test.use({
    viewport: { width: 1280, height: 600 },
    contextOptions: { screen: { width: 1280, height: 720 } },
  });

  test('play, map, world and lesson fit without scrolling', async ({ page }, testInfo) => {
    await createProfileByMouse(page, 'Nắng', '5050');
    const inView = async (locator: Locator) => {
      const box = await locator.boundingBox();
      if (!box) throw new Error('not rendered');
      expect(box.y + box.height).toBeLessThanOrEqual(600);
      expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(
        600,
      );
    };
    await inView(page.locator('[data-world="w01-lang-tre"]'));
    await page.goto('/w/w01-lang-tre');
    await inView(page.locator('[data-level="w01-l03"]'));
    await page.goto('/play/w01-l03');
    await waitForPlay(page);
    await inView(page.getByTestId('play-bubble'));
    await inView(page.getByTestId('play-run'));
    await shot(page, 'play-1280x600', testInfo.project.name);
    await page.goto('/w/_sandbox/lesson/lesson-sample');
    await inView(page.getByTestId('lesson-next'));
    await shot(page, 'lesson-1280x600', testInfo.project.name);
  });
});
