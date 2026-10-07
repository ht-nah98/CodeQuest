import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type Page, test } from '@playwright/test';
import { signInTestProfile } from './helpers';

// P2-24 (docs/roadmap/phase-2.md): the world page tells Măng's story in chapters that open as
// the child wins levels, with a "Chương mới!" highlight the first time. Also the clipped
// Vietnamese marks of the coach's screenshot ("Xưởng Sửa Lỗi" in the top bar). Screenshots go
// to CQ_SHOTS_DIR.

const SHOTS = process.env['CQ_SHOTS_DIR'] ?? 'test-results/world-story';
mkdirSync(SHOTS, { recursive: true });

test.describe.configure({ timeout: 90_000 });

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

/** Signs in a new profile and writes won levels straight into IndexedDB (no unlock-all). */
async function childWith(page: Page, nickname: string, won: readonly string[]): Promise<void> {
  await page.goto('/profile/new');
  await page.waitForFunction(() => '__cqDev' in window);
  await page.evaluate(
    async ({ name, levels }) => {
      type Dev = { signInTestProfile: (nickname?: string) => Promise<string> };
      const dev = (window as unknown as { __cqDev: Dev }).__cqDev;
      const profileId = await dev.signInTestProfile(name);
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
      for (const levelId of levels) {
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
    },
    { name: nickname, levels: won },
  );
}

/** The page never scrolls and the story book sits inside its panel. */
async function expectFits(page: Page): Promise<void> {
  const fit = await page.evaluate(() => {
    const doc = document.scrollingElement ?? document.documentElement;
    const panel = document.querySelector('[data-testid="world-story-panel"]');
    const book = document.querySelector('[data-testid="story-book"]');
    const p = panel?.getBoundingClientRect();
    const b = book?.getBoundingClientRect();
    const lines = book?.querySelector('ol');
    return {
      scrolls: doc.scrollHeight > window.innerHeight || doc.scrollWidth > window.innerWidth,
      inside: p !== undefined && b !== undefined && b.bottom <= p.bottom && b.top >= p.top,
      // Every story line shows without scrolling inside the book.
      linesCut:
        lines !== null && lines !== undefined && lines.scrollHeight > lines.clientHeight + 1,
    };
  });
  expect(fit).toEqual({ scrolls: false, inside: true, linesCut: false });
}

/** The worlds with a tale, read from content/: chapter count and every unlock level. */
const CONTENT = fileURLToPath(new URL('../../../content/worlds/', import.meta.url));
const WORLDS = readdirSync(CONTENT)
  .filter((dir) => /^w\d{2}-/.test(dir))
  .map((dir) => {
    const world = JSON.parse(readFileSync(`${CONTENT}${dir}/world.json`, 'utf8')) as {
      id: string;
      chapters?: Array<{ unlockAfter?: string }>;
    };
    const chapters = world.chapters ?? [];
    return {
      id: world.id,
      chapters: chapters.length,
      unlock: chapters.flatMap((c) => (c.unlockAfter === undefined ? [] : [c.unlockAfter])),
    };
  })
  .filter((w) => w.chapters > 0);

const book = (page: Page) => page.getByTestId('story-book');
const dots = (page: Page) => page.getByTestId('story-dot');

test('a new child reads chapter 1; later chapters are locked behind a level', async ({
  page,
}, testInfo) => {
  await childWith(page, 'Bé Truyện', []);
  await page.goto('/w/w01-lang-tre');

  await expect(book(page)).toHaveAttribute('data-chapter', 'gio-to');
  await expect(book(page).getByRole('heading', { name: 'Gió to thổi qua làng' })).toBeVisible();
  await expect(book(page).getByText('Gió cuốn bay hết măng của cả làng!')).toBeVisible();
  await expect(page.getByTestId('story-new')).toHaveCount(0);
  await expect(dots(page)).toHaveCount(5);
  await expect(dots(page).nth(0)).toHaveAttribute('data-state', 'read');
  for (const n of [1, 2, 3, 4])
    await expect(dots(page).nth(n)).toHaveAttribute('data-state', 'locked');
  // Nothing new to read: Măng points to the next level, not to the story.
  await expect(page.getByText('Nối các khối "đi" vào dưới "khi bắt đầu" nhé!')).toBeVisible();
  await expectFits(page);
  await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-w01-fresh.png` });

  // The next page is a "?" page naming the level that opens it.
  await page.getByRole('button', { name: 'Chương sau' }).click();
  await expect(book(page)).toHaveAttribute('data-locked', 'true');
  await expect(page.getByTestId('story-locked-hint')).toHaveText(
    'Qua màn “Nhảy qua hố” để mở chương này.',
  );
  await expect(page.getByRole('button', { name: 'Chương sau' })).toBeEnabled();
  await page.getByRole('button', { name: 'Chương 1: Gió to thổi qua làng' }).click();
  await expect(book(page)).toHaveAttribute('data-chapter', 'gio-to');
  await expect(page.getByRole('button', { name: 'Chương trước' })).toBeDisabled();
});

test('winning the unlock levels opens new chapters with a highlight, once', async ({
  page,
}, testInfo) => {
  const project = testInfo.project.name;
  // l03 opens chapter 2, l07 chapter 3; l12 (chapter 4) is not won yet.
  await childWith(page, 'Bé Chương', [
    'w01-l01',
    'w01-l02',
    'w01-l03',
    'w01-l04',
    'w01-l05',
    'w01-l06',
    'w01-l07',
  ]);
  await page.goto('/w/w01-lang-tre');

  // Opens on the first new chapter, highlighted; Măng points to it.
  await expect(book(page)).toHaveAttribute('data-chapter', 'buoc-dau-tien');
  await expect(book(page)).toHaveAttribute('data-fresh', 'true');
  await expect(page.getByTestId('story-new')).toHaveText('Chương mới!');
  await expect(page.getByText('Có chương truyện mới! Con đọc nhé.')).toBeVisible();
  await expect(dots(page).nth(0)).toHaveAttribute('data-state', 'read');
  await expect(dots(page).nth(1)).toHaveAttribute('data-state', 'new');
  await expect(dots(page).nth(2)).toHaveAttribute('data-state', 'new');
  await expect(dots(page).nth(3)).toHaveAttribute('data-state', 'locked');
  await expect(page.getByTestId('story-picture')).toBeVisible();
  await expectFits(page);
  await page.screenshot({ path: `${SHOTS}/${project}-w01-new-chapter.png` });

  // Paging: the second new chapter, then the "?" page of chapter 4.
  await page.getByRole('button', { name: 'Chương sau' }).click();
  await expect(book(page)).toHaveAttribute('data-chapter', 'canh-tre-thap');
  await expect(book(page).getByText('Măng cúi người, chui qua thật khéo.')).toBeVisible();
  // Turning a page ends Măng's nudge; she is back to the next level.
  await expect(page.getByText('Có chương truyện mới! Con đọc nhé.')).toHaveCount(0);
  await page.getByRole('button', { name: 'Chương sau' }).click();
  await expect(page.getByTestId('story-locked-hint')).toHaveText(
    'Qua màn “Mê cung đầu tiên” để mở chương này.',
  );
  await expectFits(page);
  await page.screenshot({ path: `${SHOTS}/${project}-w01-locked-page.png` });

  // Next visit: nothing is new; the book opens on the latest open chapter.
  await page.reload();
  await expect(book(page)).toHaveAttribute('data-chapter', 'canh-tre-thap');
  await expect(book(page)).toHaveAttribute('data-fresh', 'false');
  await expect(page.getByTestId('story-new')).toHaveCount(0);
  await expect(dots(page).nth(1)).toHaveAttribute('data-state', 'read');
});

test('the highlight stays still with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await childWith(page, 'Bé Yên', ['w01-l01', 'w01-l02', 'w01-l03']);
  await page.goto('/w/w01-lang-tre');
  await expect(page.getByTestId('story-new')).toBeVisible();
  const durations = await page.evaluate(() =>
    ['[data-testid="story-new"]', '[data-testid="story-book"]', '[data-state="new"] > span'].map(
      (selector) => {
        const el = document.querySelector(selector);
        return el === null ? null : parseFloat(getComputedStyle(el).animationDuration);
      },
    ),
  );
  for (const d of durations) expect(d === null || d < 0.001).toBe(true);
});

test('every world 1–5 tells its tale; W5 ends on the way home', async ({ page }, testInfo) => {
  await signInTestProfile(page, 'Bé Đọc');
  for (const [world, first] of [
    ['w01-lang-tre', 'Gió to thổi qua làng'],
    ['w02-rung-lap-lai', 'Khu rừng bí ẩn'],
    ['w03-xuong-sua-loi', 'Xưởng của bác Cú'],
    ['w04-nga-ba-quyet-dinh', 'Dấu chân ở ngã ba'],
    ['w05-song-cho-doi', 'Cầu bị cuốn mất'],
  ] as const) {
    await page.goto(`/w/${world}`);
    await expect(book(page).getByRole('heading', { name: first })).toBeVisible();
    await expectFits(page);
    await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-${world}.png` });
  }
});

test.describe('on a 1280×720 laptop with the browser bar (page 1280×600)', () => {
  test.use({
    viewport: { width: 1280, height: 600 },
    // The screen stays 1280×720, so the "screen too small" overlay does not show.
    contextOptions: { screen: { width: 1280, height: 720 } },
  });

  test('every chapter of W1–W5 shows all its lines', async ({ page }, testInfo) => {
    // Every unlock level won, so every chapter page is open.
    await childWith(
      page,
      'Bé Nhỏ',
      WORLDS.flatMap((w) => w.unlock),
    );
    // Worlds 2–5 open by author mode; chapters still follow the won levels only.
    await page.evaluate(() => {
      sessionStorage.setItem('cq.unlockAll', '1');
    });
    for (const { id, chapters } of WORLDS) {
      await page.goto(`/w/${id}`);
      await expect(book(page)).toBeVisible();
      for (let n = 0; n < chapters; n++) {
        await dots(page).nth(n).click();
        await expect(book(page)).toHaveAttribute('data-locked', 'false');
        await expectFits(page);
      }
      await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-600-${id}.png` });
    }
  });
});

/**
 * Text of every title-like element (headings, truncated one-liners) whose ink is cut off by a
 * clipping box (overflow other than visible): the stacked marks of "ỗ", "ẫ", "ữ" sit above
 * Baloo 2's ascender. Ink extents come from canvas `measureText` with the element's own font.
 */
async function clippedTitles(page: Page): Promise<string[]> {
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate(() => {
    const canvas = document.createElement('canvas').getContext('2d');
    if (canvas === null) return ['no canvas'];
    const out: string[] = [];
    const candidates = document.querySelectorAll<HTMLElement>('h1, h2, h3, .truncate');
    for (const el of candidates) {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
        const text = node.textContent?.trim() ?? '';
        if (text === '' || node.parentElement === null) continue;
        const parentStyle = getComputedStyle(node.parentElement);
        canvas.font = `${parentStyle.fontWeight} ${parentStyle.fontSize} ${parentStyle.fontFamily}`;
        const metrics = canvas.measureText(text);
        const range = document.createRange();
        range.selectNodeContents(node);
        const rect = range.getBoundingClientRect();
        if (rect.width === 0) continue;
        // The text's content area starts fontBoundingBoxAscent above the baseline.
        const baseline = rect.top + metrics.fontBoundingBoxAscent;
        const inkTop = baseline - metrics.actualBoundingBoxAscent;
        const inkBottom = baseline + metrics.actualBoundingBoxDescent;
        for (
          let box: HTMLElement | null = node.parentElement;
          box !== null;
          box = box.parentElement
        ) {
          const b = getComputedStyle(box);
          if (b.overflowY === 'visible' && b.overflowX === 'visible') continue;
          const r = box.getBoundingClientRect();
          const top = r.top + parseFloat(b.borderTopWidth);
          const bottom = r.bottom - parseFloat(b.borderBottomWidth);
          if (inkTop < top - 0.5 || inkBottom > bottom + 0.5) {
            out.push(
              `${text} (ink ${inkTop.toFixed(1)}–${inkBottom.toFixed(1)}, box ${top.toFixed(1)}–${bottom.toFixed(1)})`,
            );
          }
          break;
        }
      }
    }
    return out;
  });
}

test('titles keep their Vietnamese marks (Xưởng Sửa Lỗi, Lắp lại…)', async ({ page }, testInfo) => {
  const project = testInfo.project.name;
  await signInTestProfile(page, 'Ngỗng Lỗi');
  await page.goto('/w/w03-xuong-sua-loi');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Xưởng Sửa Lỗi');
  expect(await clippedTitles(page)).toEqual([]);
  await page
    .getByRole('heading', { level: 1 })
    .screenshot({ path: `${SHOTS}/${project}-title-w03.png` });

  // Profile tiles and the top-bar chip truncate nicknames too.
  expect(await clippedTitles(page)).toEqual([]);
  await page.goto('/map');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await clippedTitles(page)).toEqual([]);

  await page.goto('/w/w04-nga-ba-quyet-dinh/lesson/w04-lesson-neu-khong');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('nếu không');
  expect(await clippedTitles(page)).toEqual([]);

  await page.goto('/play/w03-l07');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lắp lại máy đá thùng');
  expect(await clippedTitles(page)).toEqual([]);
  await page
    .getByRole('heading', { level: 1 })
    .screenshot({ path: `${SHOTS}/${project}-title-play.png` });

  // The profile picker shows the nickname big, truncated.
  await page.goto('/');
  await expect(page.getByText('Ngỗng Lỗi')).toBeVisible();
  expect(await clippedTitles(page)).toEqual([]);
});
