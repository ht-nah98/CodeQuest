import { expect, test, type Page } from '@playwright/test';
import { signInTestProfile } from './helpers';

// Coach feedback 03/10/2026: block lessons ("Khối mới", lesson.beforeLevel) sit on the stone of the
// level where each action block first appears, and their demos show where Măng ends up
// (content-model.md §3, curriculum.md §3). Screenshots go to E2E_SHOTS when set.

const SHOTS = process.env['E2E_SHOTS'] ?? 'test-results/block-lessons';
const shot = (page: Page, name: string, project: string) =>
  page.screenshot({ path: `${SHOTS}/${project}-${name}.png` });

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

/** Writes progress straight into IndexedDB (no unlock-all): the opening lesson, l01 and l02 done. */
async function reachLevel3(page: Page): Promise<void> {
  await page.goto('/profile/new');
  await page.waitForFunction(() => '__cqDev' in window);
  await page.evaluate(async () => {
    type Dev = { signInTestProfile: (nickname?: string) => Promise<string> };
    const dev = (window as unknown as { __cqDev: Dev }).__cqDev;
    const profileId = await dev.signInTestProfile('Bé Khối');
    const now = new Date().toISOString();
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open('codequest');
      open.onsuccess = () => {
        resolve(open.result);
      };
      open.onerror = () => {
        reject(open.error ?? new Error('indexedDB'));
      };
    });
    const tx = db.transaction(['lessons', 'progress'], 'readwrite');
    tx.objectStore('lessons').put({ profileId, lessonId: 'w01-lesson', completedAt: now });
    for (const levelId of ['w01-l01', 'w01-l02']) {
      tx.objectStore('progress').put({
        profileId,
        levelId,
        bestStars: 3,
        bestBlocks: 2,
        completedAt: now,
        firstTryWin: true,
        attempts: 1,
        updatedAt: now,
      });
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = () => {
        reject(tx.error ?? new Error('tx'));
      };
    });
    db.close();
  });
}

async function runDemo(page: Page): Promise<void> {
  const demo = page.getByTestId('lesson-demo');
  await expect(demo.locator('[data-ready="true"]')).toBeVisible({ timeout: 30_000 });
  await page.getByTestId('lesson-demo-run').click();
  await expect(demo.locator('[data-phase="done"]')).toBeVisible({ timeout: 30_000 });
}

test('block lessons sit on their level; Măng points to the jump lesson', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const project = testInfo.project.name;
  await reachLevel3(page);
  await page.goto('/w/w01-lang-tre');

  // Four "Khối mới" books, each on the stone of the level where its block first appears.
  await expect(page.getByTestId('block-lesson-stone')).toHaveCount(4);
  for (const [lesson, level] of [
    ['w01-lesson-nhay', 'w01-l03'],
    ['w01-lesson-cui', 'w01-l07'],
    ['w01-lesson-da', 'w01-l10'],
    ['w01-lesson-re', 'w01-l12'],
  ] as const) {
    const item = page.locator('li', { has: page.locator(`[data-lesson="${lesson}"]`) });
    await expect(item.locator('[data-level]')).toHaveAttribute('data-level', level);
  }
  // l03 is open but the jump lesson comes first: Măng says so and its stone is the next one.
  await expect(page.locator('[data-level="w01-l03"]')).toHaveAttribute('data-status', 'open');
  await expect(page.locator('[data-lesson="w01-lesson-nhay"]')).toHaveAttribute(
    'data-next',
    'true',
  );
  await expect(page.getByText('Có khối mới! Xem bài khối mới trước nhé.')).toBeVisible();
  await shot(page, 'world-block-lesson', project);

  // The jump lesson: walking moves 1 cell; a jump flies over 1 cell and lands on the 2nd.
  await page.locator('[data-lesson="w01-lesson-nhay"]').click();
  await expect(page).toHaveURL(/\/lesson\/w01-lesson-nhay$/);
  await expect(page.getByText('Khối mới: nhảy! Xem Măng đi xa bao nhiêu nhé.')).toBeVisible();
  await page.getByTestId('lesson-next').click();
  await runDemo(page);
  await shot(page, 'nhay-demo-walk', project);
  await page.getByTestId('lesson-next').click();
  await expect(page.getByText('Nhảy: bay qua 1 ô, đáp xuống ô thứ 2.')).toBeVisible();
  await runDemo(page);
  await shot(page, 'nhay-demo-jump', project);
  await page.getByTestId('lesson-next').click();
  await expect(page.getByText('Đất bằng cũng vậy: nhảy là xa 2 ô!')).toBeVisible();
  await runDemo(page);
  await shot(page, 'nhay-demo-flat', project);
  await page.getByTestId('lesson-next').click();
  await page.getByTestId('quiz-option').nth(1).click();
  await expect(page.getByText(/Nhảy: bay qua 1 ô, đáp xuống ô thứ 2\.$/)).toBeVisible();
  await shot(page, 'nhay-quiz', project);
  await page.getByTestId('lesson-finish').click();
  await expect(page.getByTestId('lesson-done')).toBeVisible();

  // "Vào chơi" leads to the lesson's own level, which introduces the block in the same words.
  await page.getByRole('button', { name: 'Vào chơi' }).click();
  await expect(page).toHaveURL(/\/play\/w01-l03$/);
  await expect(page.getByText('Khối mới: nhảy! Bay qua 1 ô, đáp xuống ô thứ 2.')).toBeVisible({
    timeout: 15_000,
  });
  await shot(page, 'l03-new-block-hint', project);

  // Back on the world page the nudge is gone: level 3 is next again.
  await page.goto('/w/w01-lang-tre');
  await expect(page.locator('[data-lesson="w01-lesson-nhay"]')).toHaveAttribute(
    'data-done',
    'true',
  );
  await expect(page.locator('[data-level="w01-l03"]')).toHaveAttribute('data-next', 'true');
});

test('the turn lesson: a turn spins Măng on the spot, tiến moves after it', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const project = testInfo.project.name;
  await signInTestProfile(page);
  await page.goto('/w/w01-lang-tre/lesson/w01-lesson-re');
  await page.getByTestId('lesson-next').click();
  await runDemo(page);
  await page.getByTestId('lesson-next').click();
  await expect(page.getByText('Rẽ phải: quay sang phải tại chỗ, chưa đi.')).toBeVisible();
  await runDemo(page);
  await shot(page, 're-demo-turn', project);
  await page.getByTestId('lesson-next').click();
  await runDemo(page);
  await shot(page, 're-demo-turn-then-forward', project);
});

test('the crouch lesson: a bump demo, then the next card explains it', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const project = testInfo.project.name;
  await signInTestProfile(page);
  await page.goto('/w/w01-lang-tre/lesson/w01-lesson-cui');
  await page.getByTestId('lesson-next').click();
  await expect(page.getByText('Cúi xuống và đi 1 ô. Thế là chui qua cành!')).toBeVisible();
  await runDemo(page);
  await shot(page, 'cui-demo-crouch', project);
  await page.getByTestId('lesson-next').click();
  // The jump bumps into the branch: the replay still finishes, and the next card says why.
  await runDemo(page);
  await shot(page, 'cui-demo-jump-bump', project);
  await page.getByTestId('lesson-next').click();
  await expect(page.getByText('Nhảy thì cụng đầu vào cành. Phải cúi cơ!')).toBeVisible();
  await page.getByTestId('lesson-next').click();
  await page.getByTestId('quiz-option').nth(1).click();
  await expect(page.getByText(/Cúi xuống và đi 1 ô, giống khối đi\.$/)).toBeVisible();
  await shot(page, 'cui-quiz', project);
});

test('the kick lesson: Măng kicks the crate over and stays put', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const project = testInfo.project.name;
  await signInTestProfile(page);
  await page.goto('/w/w01-lang-tre/lesson/w01-lesson-da');
  await page.getByTestId('lesson-next').click();
  await expect(page.getByText('Đá ô phía trước, Măng đứng yên.')).toBeVisible();
  await runDemo(page);
  await shot(page, 'da-demo-kick', project);
  await page.getByTestId('lesson-next').click();
  await expect(page.getByText('Muốn đi tiếp thì thêm khối đi.')).toBeVisible();
  await runDemo(page);
  await shot(page, 'da-demo-kick-then-walk', project);
  await page.getByTestId('lesson-next').click();
  await page.getByTestId('quiz-option').nth(0).click();
  await expect(page.getByText(/Đá ô phía trước, Măng đứng yên\.$/)).toBeVisible();
  await shot(page, 'da-quiz', project);
});
