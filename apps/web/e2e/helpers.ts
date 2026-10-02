import type { Page } from '@playwright/test';

// Shared e2e helpers. Screens after "/" need a signed-in profile (screens-and-flows.md §1).

type DevWindow = Window & {
  __cqDev?: { signInTestProfile: (nickname?: string) => Promise<string> };
};

/**
 * Signs in a test profile (panda, PIN 0000, 30 starter coins) for this tab through the dev-only
 * hook, for specs that are not about profiles. Call before the first `page.goto` of a play URL.
 * Also turns on author mode's "unlock all" for the tab, so any level opens by URL (the play
 * screen refuses levels the child has not reached).
 */
export async function signInTestProfile(page: Page, nickname = 'Bé Thử'): Promise<void> {
  await page.goto('/profile/new');
  await page.waitForFunction(() => (window as DevWindow).__cqDev !== undefined);
  await page.evaluate(async (name) => {
    await (window as DevWindow).__cqDev?.signInTestProfile(name);
    sessionStorage.setItem('cq.unlockAll', '1');
  }, nickname);
}

/**
 * Waits for a short-lived panda animation. It may last only ~0.3 s, so this polls every frame:
 * `expect(...).toHaveAttribute` backs off to 1 s between checks and can miss it under load.
 */
export async function pandaBecomes(page: Page, animation: string): Promise<void> {
  await page.waitForFunction(
    (name) =>
      document.querySelector('[data-testid="play-stage"]')?.getAttribute('data-panda') === name,
    animation,
    { polling: 'raf', timeout: 15_000 },
  );
}
