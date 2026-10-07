import { expect, type BrowserContext, type Page, test } from '@playwright/test';

// P2-09 acceptance (docs/roadmap/phase-2.md): on the production build (`vite preview`, port 4180,
// sent with the production CSP by vite.config.ts) the app installs its service worker, then opens
// and plays a level with the network off, keeping progress; a new deploy found while a level is
// open never reloads it and is offered on the map instead. Production builds have no dev hooks,
// so everything goes through the real UI (programs are built by dragging blocks).

const PREVIEW_URL = process.env['E2E_PREVIEW_URL'] ?? 'http://localhost:4180';
const SHOTS = 'test-results/pwa';

test.use({ baseURL: PREVIEW_URL });
// Service worker + a cold Pixi/Blockly boot + the lesson: well over the default 30 s under load.
test.describe.configure({ timeout: 120_000 });

let problems: string[];

test.beforeEach(async ({ page }) => {
  problems = [];
  page.on('console', (msg) => {
    if (msg.text().startsWith('[.WebGL-')) return;
    // Chromium performance notices seen now and then right after the service worker takes over
    // a navigation: a <link rel="modulepreload"> of index.html is fetched outside the worker, so
    // the module is fetched again through it and the preload goes unused. A wasted request,
    // not an app error (never seen on the dev server, which has no modulepreload).
    if (/^A preload for .* cross-world service worker resource mismatch/.test(msg.text())) return;
    if (/was preloaded using link preload but not used within a few seconds/.test(msg.text()))
      return;
    if (msg.type() === 'error' || msg.type() === 'warning') problems.push(msg.text());
  });
  page.on('pageerror', (err) => problems.push(err.message));
  // Any CSP violation on the main thread fails the test (security-privacy.md §3). The binding
  // outlives reloads, unlike a window variable.
  await page.exposeBinding('__cqCspViolation', (_source, text: string) => {
    problems.push(`CSP: ${text}`);
  });
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) => {
      const report = (window as unknown as { __cqCspViolation: (text: string) => void })
        .__cqCspViolation;
      report(`${event.violatedDirective} ${event.blockedURI}`);
    });
  });
});

test.afterEach(() => {
  expect(problems).toEqual([]);
});

/** First visit installs the service worker; the reload puts the page under its control. */
async function installServiceWorker(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
}

/** /profile/new with the mouse; ends on /map. */
async function createProfile(page: Page, nickname: string): Promise<void> {
  await page.goto('/');
  await expect(page).toHaveURL(/\/profile\/new$/);
  await page.locator('[data-avatar-option="fox"]').click();
  await page.getByRole('button', { name: 'Tiếp' }).click();
  await page.getByRole('textbox', { name: 'Biệt danh' }).fill(nickname);
  await page.getByRole('button', { name: 'Tiếp' }).click();
  // The PIN twice (enter, confirm).
  for (let round = 0; round < 2; round++) {
    await expect(page.getByTestId('pin-dots')).toHaveAttribute('data-filled', '0');
    for (const digit of '1234') await page.locator(`button[data-key="${digit}"]`).click();
  }
  await expect(page).toHaveURL(/\/map$/);
}

/** Map → World 1 → its lesson (level 1 waits for it) → /play/w01-l01, stage ready. */
async function openFirstLevel(page: Page): Promise<void> {
  await page.locator('[data-world="w01-lang-tre"]').click();
  await page.getByTestId('lesson-stone').click();
  for (let i = 0; i < 3; i++) await page.getByTestId('lesson-next').click();
  await expect(page.getByTestId('lesson-demo')).toBeVisible({ timeout: 30_000 });
  await page.getByTestId('lesson-demo-run').click();
  await expect(page.locator('[data-testid="lesson-demo"] [data-phase="done"]')).toBeVisible({
    timeout: 20_000,
  });
  await page.getByTestId('lesson-next').click();
  await page.getByTestId('lesson-next').click();
  await page.getByTestId('quiz-option').nth(1).click();
  await page.getByTestId('lesson-finish').click();
  await page.getByRole('button', { name: 'Vào chơi' }).click();
  await expect(page).toHaveURL(/\/play\/w01-l01$/);
  await expect(page.getByTestId('play-stage')).toHaveAttribute('data-ready', 'true', {
    timeout: 30_000,
  });
}

/** w01-l01 (parsons): drag both loose "đi" blocks under "khi bắt đầu", run, win. */
async function winFirstLevel(page: Page): Promise<void> {
  const canvas = page.locator('.blocklyWorkspace > .blocklyBlockCanvas');
  const start = canvas.locator('.cq_start').first();
  for (const id of ['walk1', 'walk2']) {
    const from = await canvas.locator(`[data-id="${id}"]`).boundingBox();
    const to = await start.boundingBox();
    if (!from || !to) throw new Error(`block ${id} or the start block is not rendered`);
    await page.mouse.move(from.x + 15, from.y + 15);
    await page.mouse.down();
    await page.mouse.move(to.x + 20, to.y + to.height + 18, { steps: 12 });
    await page.mouse.up();
  }
  await page.getByTestId('play-run').click();
  await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 20_000 });
}

async function expectLevelDone(page: Page): Promise<void> {
  await expect(page.locator('[data-level="w01-l01"]')).toHaveAttribute('data-status', 'done');
}

async function goOffline(context: BrowserContext, page: Page): Promise<void> {
  await context.setOffline(true);
  expect(await page.evaluate(() => navigator.onLine)).toBe(false);
}

test.describe('PWA on the production build', () => {
  test('@smoke manifest: Vietnamese name, panda icons 192/512, start_url, standalone', async ({
    page,
  }) => {
    await page.goto('/');
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(href).toBeTruthy();
    const response = await page.request.get(href ?? '');
    expect(response.ok()).toBe(true);
    const manifest = (await response.json()) as {
      name: string;
      short_name: string;
      lang: string;
      start_url: string;
      display: string;
      icons: { src: string; sizes: string; type: string }[];
    };
    expect(manifest.name).toContain('Măng');
    expect(manifest.short_name).toBe('CodeQuest');
    expect(manifest.lang).toBe('vi');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    for (const size of ['192x192', '512x512']) {
      const icon = manifest.icons.find((i) => i.sizes === size && i.type === 'image/png');
      expect(icon, size).toBeDefined();
      const image = await page.request.get(icon?.src ?? '');
      expect(image.ok()).toBe(true);
      expect(image.headers()['content-type']).toBe('image/png');
    }
    // sw.js must never be HTTP-cached, or a deploy could stay invisible (vercel.json too).
    const sw = await page.request.get('/sw.js');
    expect(sw.headers()['cache-control']).toBe('no-cache');
  });

  test('@smoke offline after the first visit: reload, lesson, play a level, progress kept', async ({
    page,
    context,
  }, testInfo) => {
    await installServiceWorker(page);
    await goOffline(context, page);
    await page.reload();
    expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);

    await createProfile(page, 'Na');
    await openFirstLevel(page);
    await winFirstLevel(page);
    await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-offline-win.png` });

    // Still offline: a full reload of a deep link comes from the cache, progress from IndexedDB.
    await page.goto('/w/w01-lang-tre');
    await page.reload();
    await expectLevelDone(page);
    await expect(page.getByTestId('lesson-stone')).toHaveAttribute('data-done', 'true');
  });

  test('a new deploy never reloads an open level; the map offers it', async ({
    page,
    context,
  }, testInfo) => {
    await installServiceWorker(page);
    await createProfile(page, 'Bin');
    await openFirstLevel(page);
    await page.evaluate(() => {
      (window as unknown as { __cqSameTab: boolean }).__cqSameTab = true;
    });

    // "Deploy": from now on this context gets a byte-different sw.js (vite.config.ts).
    await context.addCookies([{ name: 'cq-e2e-build', value: '2', url: PREVIEW_URL }]);
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.getRegistration())?.update();
    });
    await expect
      .poll(() =>
        page.evaluate(
          async () => (await navigator.serviceWorker.getRegistration())?.waiting !== null,
        ),
      )
      .toBe(true);

    // The level keeps going in the same page, with no prompt on the play screen.
    await expect(page.getByTestId('update-banner')).toHaveCount(0);
    await winFirstLevel(page);
    expect(await page.evaluate(() => '__cqSameTab' in window)).toBe(true);

    // Back on the map (in-app navigation): the gentle prompt.
    await page.getByRole('button', { name: 'Về thế giới' }).click();
    await page.getByRole('button', { name: 'Bản đồ' }).click();
    await expect(page).toHaveURL(/\/map$/);
    const banner = page.getByTestId('update-banner');
    await expect(banner).toContainText('Có bản mới!');
    expect(await page.evaluate(() => '__cqSameTab' in window)).toBe(true);
    await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-update-banner.png` });

    // "Tải lại": the new worker takes over and the page reloads onto it, progress intact.
    await Promise.all([
      page.waitForEvent('load'),
      banner.getByRole('button', { name: 'Tải lại' }).click(),
    ]);
    await expect(page).toHaveURL(/\/map$/);
    expect(await page.evaluate(() => '__cqSameTab' in window)).toBe(false);
    await expect(page.getByTestId('update-banner')).toHaveCount(0);
    expect(
      await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        return registration?.waiting === null && navigator.serviceWorker.controller !== null;
      }),
    ).toBe(true);
    await page.locator('[data-world="w01-lang-tre"]').click();
    await expectLevelDone(page);
  });
  test('another tab pressing "Tải lại" does not reload a level open in this one', async ({
    page,
    context,
  }) => {
    await installServiceWorker(page);
    await createProfile(page, 'Mi');
    await openFirstLevel(page);
    await page.evaluate(() => {
      (window as unknown as { __cqSameTab: boolean }).__cqSameTab = true;
    });
    await context.addCookies([{ name: 'cq-e2e-build', value: '3', url: PREVIEW_URL }]);
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.getRegistration())?.update();
    });
    await expect
      .poll(() =>
        page.evaluate(
          async () => (await navigator.serviceWorker.getRegistration())?.waiting !== null,
        ),
      )
      .toBe(true);

    // Tab B (a new tab signs in again: the session is per tab), on the map, takes the update.
    const other = await context.newPage();
    other.on('pageerror', (err) => problems.push(err.message));
    await other.goto('/');
    await other.getByTestId('profile-tile').first().click();
    for (const digit of '1234') await other.locator(`button[data-key="${digit}"]`).click();
    await expect(other).toHaveURL(/\/map$/);
    const otherBanner = other.getByTestId('update-banner');
    await expect(otherBanner).toContainText('Có bản mới!');
    await Promise.all([
      other.waitForEvent('load'),
      otherBanner.getByRole('button', { name: 'Tải lại' }).click(),
    ]);
    await expect(other.getByTestId('update-banner')).toHaveCount(0);

    // Tab A: same page, level still playable, no prompt on the play screen.
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => '__cqSameTab' in window)).toBe(true);
    await expect(page).toHaveURL(/\/play\/w01-l01$/);
    await expect(page.getByTestId('update-banner')).toHaveCount(0);
    await winFirstLevel(page);
    expect(await page.evaluate(() => '__cqSameTab' in window)).toBe(true);

    // On A's map the prompt is there; pressing it just reloads (nothing waits any more).
    await page.getByRole('button', { name: 'Về thế giới' }).click();
    await page.getByRole('button', { name: 'Bản đồ' }).click();
    const banner = page.getByTestId('update-banner');
    await expect(banner).toContainText('Có bản mới!');
    await Promise.all([
      page.waitForEvent('load'),
      banner.getByRole('button', { name: 'Tải lại' }).click(),
    ]);
    expect(await page.evaluate(() => '__cqSameTab' in window)).toBe(false);
    await expect(page.getByTestId('update-banner')).toHaveCount(0);
  });
});
