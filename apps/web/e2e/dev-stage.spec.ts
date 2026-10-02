import { expect, type Locator, test } from '@playwright/test';

const SHOTS = 'test-results/dev-stage';

async function waitForStage(stage: Locator): Promise<void> {
  // A cold dev server compiles Pixi on demand; allow more than the default 5 s.
  await expect(stage).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
  // StrictMode mounts twice in dev; exactly one canvas must survive.
  await expect(stage.locator('canvas')).toHaveCount(1);
}

test.describe('/dev/stage', () => {
  test('Măng walks, runs and jumps on the temporary tiles', async ({ page }, testInfo) => {
    const errors: string[] = [];
    const foreign: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('request', (req) => {
      const { hostname, protocol } = new URL(req.url());
      if (protocol !== 'data:' && protocol !== 'blob:' && hostname !== 'localhost') {
        foreign.push(req.url());
      }
    });

    const sprites = page.waitForResponse((res) => res.url().endsWith('/sprites/panda.png'));
    await page.goto('/dev/stage');
    expect((await sprites).ok()).toBe(true);

    const stage = page.getByTestId('dev-stage');
    await waitForStage(stage);
    const project = testInfo.project.name;

    // Idle and walk must render differently, and walk must move over time.
    await page.waitForTimeout(300);
    const idle = await stage.screenshot();
    await page.locator('button[data-animation="walk"]').click();
    await page.waitForTimeout(300);
    const walkA = await stage.screenshot();
    await page.waitForTimeout(300);
    const walkB = await stage.screenshot();
    expect(walkA.equals(idle)).toBe(false);
    expect(walkB.equals(walkA)).toBe(false);

    for (const animation of ['walk', 'run', 'jump', 'crouch', 'kick', 'cheer'] as const) {
      const button = page.locator(`button[data-animation="${animation}"]`);
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await page.waitForTimeout(animation === 'jump' ? 330 : 400); // jump: near the top of the hop
      await stage.screenshot({ path: `${SHOTS}/${project}-${animation}.png` });
    }
    await page.screenshot({ path: `${SHOTS}/${project}-page.png` });

    // Client-side remount: a new renderer must reuse the cached textures without leaks.
    await page.getByRole('link', { name: 'Về trang đầu' }).click();
    // "/" is the profile picker; with no profile yet it opens /profile/new (P1-10).
    await expect(page).toHaveURL(/\/(profile\/new)?$/);
    await expect(stage).toHaveCount(0);
    await page.getByRole('link', { name: '/dev/stage' }).click();
    await waitForStage(stage);
    await page.locator('button[data-animation="run"]').click();
    await page.waitForTimeout(300);
    const runA = await stage.screenshot();
    await page.waitForTimeout(300);
    expect((await stage.screenshot()).equals(runA)).toBe(false);
    await stage.screenshot({ path: `${SHOTS}/${project}-remount-run.png` });

    expect(errors).toEqual([]);
    expect(foreign).toEqual([]);
  });
});
