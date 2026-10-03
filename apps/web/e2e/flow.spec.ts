import { readFileSync } from 'node:fs';
import { expect, type Locator, type Page, test } from '@playwright/test';
import type * as BlocklyModule from 'blockly';

// P1-10 acceptance (docs/roadmap/phase-1.md): profile → map → world → lesson → play → results →
// next level, by mouse and by keyboard; progress survives a reload; the results overlay shows
// the real stars and coins; backup → restore round trip; small screen; break reminder; author mode.
// Runs on the real World 1 (testing-strategy.md §3): lesson w01-lesson, then w01-l01 (parsons),
// w01-l02, w01-l03 in the order the child unlocks them. Programs are set from each level's
// `solution` through the dev play hook; dragging blocks is covered by play-runner.spec.
// Coins (rewards-economy.md §2, rewards-engine.md §3): 30 starter; lesson +5; the first learning
// activity of the day +10 (daily); a first clear at par on the first run 10 + 5 (⭐⭐) + 5 (⭐⭐⭐)
// + 5 (first try) = 25; replaying a ⭐⭐⭐ level +1.

const SHOTS = process.env.CQ_SHOTS_DIR ?? 'test-results/flow';

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(new URL(`../../../content/${path}`, import.meta.url), 'utf8'));
const solutionOf = (levelId: string): unknown =>
  (readJson(`worlds/w01-lang-tre/levels/${levelId}.json`) as { solution: unknown }).solution;
const w01l01 = solutionOf('w01-l01');
const w01l02 = solutionOf('w01-l02');
const w01l03 = solutionOf('w01-l03');
const shared = readJson('shared/feedback.json') as Record<string, string>;
const world1 = readJson('worlds/w01-lang-tre/world.json') as { levelIds: string[] };

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
    // The whole journey (profile, lesson demo, three animated runs) takes ~20 s alone and ~30 s
    // under parallel workers, so the default 30 s per-test budget runs out mid-flow.
    test.setTimeout(90_000);
    const project = testInfo.project.name;
    await createProfileByMouse(page, 'Bin', '1234');
    await expect(hudCoins(page)).toContainText('30');
    await shot(page, 'map', project);

    await page.locator('[data-world="w01-lang-tre"]').click();
    await expect(page).toHaveURL(/\/w\/w01-lang-tre$/);
    // The lesson comes first: even level 1 waits for it.
    await expect(page.locator('[data-level="w01-l01"]')).toHaveAttribute('data-status', 'locked');
    await shot(page, 'world-lesson-first', project);

    // w01-lesson: 3 talk cards, 2 demos, then the quiz as the last card.
    await page.getByTestId('lesson-stone').click();
    await expect(page.getByTestId('lesson-card')).toHaveAttribute('data-card', '0');
    for (let i = 0; i < 3; i++) await page.getByTestId('lesson-next').click();
    // The demo (Blockly + stage) is a lazy chunk: a cold dev server compiles it on demand.
    await expect(page.getByTestId('lesson-demo')).toBeVisible({ timeout: 30_000 });
    await page.getByTestId('lesson-demo-run').click();
    await expect(page.locator('[data-testid="lesson-demo"] [data-phase="done"]')).toBeVisible({
      timeout: 20_000,
    });
    await page.getByTestId('lesson-next').click();
    await page.getByTestId('lesson-next').click();
    await expect(page.getByTestId('lesson-card')).toHaveAttribute('data-card', '5');
    // The quiz holds "Xong bài giảng" until it is answered (right or wrong both count).
    await expect(page.getByTestId('lesson-finish')).toBeDisabled();
    await page.getByTestId('quiz-option').nth(1).click();
    await expect(page.getByText(/Đúng rồi!/)).toBeVisible();
    await page.getByTestId('lesson-finish').click();
    // +5 lesson, +10 daily (the first learning activity today): 30 → 45.
    await expect(page.getByTestId('lesson-done')).toContainText('+15 xu');
    await expect(hudCoins(page)).toContainText('45');
    await shot(page, 'lesson-done', project);

    await page.getByRole('button', { name: 'Vào chơi' }).click();
    await expect(page).toHaveURL(/\/play\/w01-l01$/);
    await waitForPlay(page);
    // Parsons: the blocks are on the workspace already; the helper links them as `solution` does.
    await setProgram(page, w01l01);
    await page.getByTestId('play-run').click();

    const results = page.getByTestId('play-success');
    await expect(results).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('results-stars')).toHaveAttribute('data-stars', '3');
    await expect(page.getByTestId('results-lines')).toHaveText('Con vừa viết 2 dòng code!');
    // First clear at par on the first run: 10 + 5 + 5 + 5 (the daily bonus came with the
    // lesson): 45 → 70 (testing-strategy.md §3).
    await expect(page.getByTestId('results-coins').locator('li')).toHaveText([
      /Qua màn lần đầu\s*\+10/,
      /Lần đầu 2 sao\s*\+5/,
      /Lần đầu 3 sao\s*\+5/,
      /Đúng ngay lần đầu\s*\+5/,
    ]);
    await expect(page.getByTestId('results-total')).toHaveText('+25 xu');
    await expect(hudCoins(page)).toContainText('70');
    await page.waitForTimeout(2200); // stars land, coins fly
    await shot(page, 'results', project);

    // "Màn tiếp" → w01-l02 (opened by clearing l01): another first clear at par, 70 → 95.
    await page.getByTestId('results-next').click();
    await expect(page).toHaveURL(/\/play\/w01-l02$/);
    await waitForPlay(page);
    await expect(page.getByTestId('play-success')).toHaveCount(0);
    await setProgram(page, w01l02);
    await page.getByTestId('play-run').click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('results-total')).toHaveText('+25 xu');
    await expect(hudCoins(page)).toContainText('95');

    // w01-l03 is open now. "đi, đi" walks into the hole: the FELL_IN_HOLE line, no coins.
    await page.getByTestId('results-next').click();
    await expect(page).toHaveURL(/\/play\/w01-l03$/);
    await waitForPlay(page);
    await setProgram(page, program(['runner_walk', 'runner_walk']));
    await page.getByTestId('play-run').click();
    await expect(page.getByTestId('play-bubble')).toHaveText(shared['FELL_IN_HOLE'] ?? '', {
      timeout: 20_000,
    });
    await expect(hudCoins(page)).toContainText('95');
    // TODO(P1-07): buy a tier-1 hint here and expect 95 → 90 (testing-strategy.md §3 step 4);
    // hints are not wired into PlayScreen yet.

    // Progress survives a reload.
    await page.goto('/w/w01-lang-tre');
    await page.reload();
    await expect(page.getByTestId('lesson-stone')).toHaveAttribute('data-done', 'true');
    for (const id of ['w01-l01', 'w01-l02']) {
      await expect(page.locator(`[data-level="${id}"]`)).toHaveAttribute('data-status', 'done');
      await expect(page.locator(`[data-level="${id}"]`).getByRole('img')).toHaveAccessibleName(
        '3 trên 3 sao',
      );
    }
    // Level 3 brings the jump block: its "Khối mới" lesson is next (it does not lock the level).
    await expect(page.locator('[data-level="w01-l03"]')).toHaveAttribute('data-status', 'open');
    await expect(page.locator('[data-lesson="w01-lesson-nhay"]')).toHaveAttribute(
      'data-next',
      'true',
    );
    await expect(page.locator('[data-level="w01-l04"]')).toHaveAttribute('data-status', 'locked');
    await expect(hudCoins(page)).toContainText('95');
    await shot(page, 'world-after-reload', project);
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

    await tabTo(page, page.locator('[data-world="w01-lang-tre"]'));
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/w\/w01-lang-tre$/);
    await tabTo(page, page.getByTestId('lesson-stone'));
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('lesson-card')).toHaveAttribute('data-card', '0');
    // ← → flip cards, past the demos (running them is optional) to the quiz, the last card.
    for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('lesson-card')).toHaveAttribute('data-card', '3');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('lesson-card')).toHaveAttribute('data-card', '5');
    await tabTo(page, page.getByTestId('quiz-option').first());
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Chưa đúng, không sao!/)).toBeVisible();
    await tabTo(page, page.getByTestId('lesson-finish'));
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('lesson-done')).toBeVisible();
    // "Vào chơi" has focus.
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/play\/w01-l01$/);
    await waitForPlay(page);

    // Building blocks with Blockly's own keyboard navigation is Blockly's feature, tested by
    // Blockly; here the program is loaded and the app's keys take over: Space runs.
    await setProgram(page, w01l01);
    await page.getByTestId('play-stage').focus();
    await page.keyboard.press('Space');
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 20_000 });
    // "Màn tiếp" has focus in the results overlay.
    await expect(page.getByTestId('results-next')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/play\/w01-l02$/);
    await waitForPlay(page);
  });

  test('@smoke first clear of w01-l03 at par: real stars and coins; reload keeps them', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await createProfileByMouse(page, 'Tôm', '0000');
    await page.locator('[data-world="w01-lang-tre"]').click();
    await shot(page, 'world-w01', project);
    // Straight to w01-l03 with the dev unlock (no lesson, no l01–l02): this win is the first
    // learning activity of the day, so the daily bonus comes with it.
    await page.goto('/w/w01-lang-tre?unlock=all');
    await page.locator('[data-level="w01-l03"]').click();
    await waitForPlay(page);
    await expect(hudCoins(page)).toContainText('30');
    await setProgram(page, w01l03);
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
    // 30 + 35 = 65.
    await expect(hudCoins(page)).toContainText('65');
    // "Màn tiếp" shows because w01-l04 is open (dev unlock).
    await expect(page.getByTestId('results-next')).toBeVisible();

    // Esc closes the overlay (= Chơi lại).
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('play-success')).toHaveCount(0);

    // Winning again: no new coins (first-time lines are in the ledger already).
    await page.getByTestId('play-run').click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 20_000 });
    // Replaying a ⭐⭐⭐ level: +1 (at most 5 a day), nothing else: 65 → 66.
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
    // Dev unlock: no lesson first, so the win also earns the daily bonus (35 → 65 coins).
    await page.goto('/play/w01-l03?unlock=all');
    await waitForPlay(page);
    await setProgram(page, w01l03);
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

  test('dev sandbox: every mode is listed and playable (P1-06)', async ({ page }) => {
    await createProfileByMouse(page, 'Dế', '1212');
    await page.goto('/w/_sandbox?unlock=all');
    await expect(page.locator('[data-level="flow-01"]')).toBeVisible();
    for (const id of ['maze-predict', 'maze-bughunt', 'runner-parsons', 'maze-creative']) {
      await expect(page.locator(`[data-level="${id}"]`)).toBeVisible();
    }
    await page.goto('/play/maze-predict');
    await waitForPlay(page);
    await expect(page.getByTestId('predict-card')).toHaveCount(3);
  });

  test('a run counts even when its replay is stopped: no "first try" after it', async ({
    page,
  }) => {
    await createProfileByMouse(page, 'Gió', '2020');
    await page.goto('/play/w01-l03?unlock=all');
    await waitForPlay(page);
    // Slowest speed, so the replay is surely still going when Dừng is pressed.
    await page.getByRole('radio', { name: 'Chậm' }).click();
    await setProgram(page, program(['runner_walk', 'runner_walk']));
    await page.getByTestId('play-run').click();
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-phase', 'running');
    await page.getByTestId('play-run').click(); // Dừng
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-phase', 'idle');

    await page.getByRole('radio', { name: 'Nhanh' }).click();
    await setProgram(page, w01l03);
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
    // w01-l03 waits for the lesson, w01-l01 and w01-l02.
    await page.goto('/play/w01-l03');
    await expect(page.getByRole('alert')).toHaveText('Màn này chưa mở. Con qua màn trước nhé!');
    await expect(page.getByTestId('play-stage')).toHaveCount(0);
    await page.getByTestId('play-back-out').click();
    await expect(page).toHaveURL(/\/w\/w01-lang-tre$/);
    // The dev unlock override is honoured.
    await page.goto('/play/w01-l03?unlock=all');
    await waitForPlay(page);
    await page.goto('/w/w01-lang-tre/lesson/nope?unlock=0');
    await expect(page.getByRole('alert')).toHaveText('Không tìm thấy bài giảng này.');
    await page.getByRole('button', { name: 'Về thế giới' }).click();
    await expect(page).toHaveURL(/\/w\/w01-lang-tre$/);
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
    await page.goto('/w/w01-lang-tre?unlock=all');
    await expect(page.locator('[data-level="w01-l02"]')).toHaveAttribute('data-status', 'open');
    await page.goto('/play/w01-l01?author=1');
    await waitForPlay(page);
    await page.getByTestId('author-copy').click();
    await expect(page.getByTestId('author-copy')).toHaveText('Đã chép!');
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(JSON.parse(copied)).toHaveProperty('blocks.languageVersion', 0);
    // Without the flags, World 1 is locked behind its lesson again.
    await page.goto('/play/w01-l01?author=0');
    await waitForPlay(page);
    await expect(page.getByTestId('author-tools')).toHaveCount(0);
    await page.goto('/w/w01-lang-tre?unlock=0');
    await expect(page.locator('[data-level="w01-l02"]')).toHaveAttribute('data-status', 'locked');
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
    // Every stone of World 1 (lesson, levels, boss, free play) is on screen at once.
    await page.goto('/w/w01-lang-tre');
    await inView(page.getByTestId('lesson-stone'));
    const stones = page.locator('[data-level]');
    await expect(stones).toHaveCount(world1.levelIds.length);
    for (const stone of await stones.all()) await inView(stone);
    await shot(page, 'world-1280x600', testInfo.project.name);
    await page.goto('/play/w01-l03?unlock=all');
    await waitForPlay(page);
    await inView(page.getByTestId('play-bubble'));
    await inView(page.getByTestId('play-run'));
    await shot(page, 'play-1280x600', testInfo.project.name);
    await page.goto('/w/w01-lang-tre/lesson/w01-lesson');
    await inView(page.getByTestId('lesson-next'));
    await shot(page, 'lesson-1280x600', testInfo.project.name);
  });
});
