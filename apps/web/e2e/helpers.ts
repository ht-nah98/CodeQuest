import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, type Page } from '@playwright/test';

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

/**
 * Answers "Có" to the "Làm lại" confirm (button or `R`, screens-and-flows.md §4): the whole level
 * goes back to its start, the child's program included.
 */
export async function confirmRestart(page: Page): Promise<void> {
  await page.getByTestId('restart-yes').click();
  await expect(page.getByTestId('restart-confirm')).toHaveCount(0);
}

/**
 * Ticks every box of Leanbot lesson 0, which is what opens the rest of that course. Specs about
 * a later lesson call this first; the one spec about the gate itself does not. Seeds every screen
 * index of the lesson, so inserting a screen cannot quietly leave a spec on the locked side.
 */
export async function unlockLeanbotCourse(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (let i = 0; i < 40; i++) localStorage.setItem(`cq.leanbot.check.bai-00.${String(i)}`, '1');
  });
}

/**
 * Signing in lands on the hub, where the two courses are chosen (ADR-0028). Specs that are about
 * CodeQuest step through it with one click and carry on from the map.
 */
export async function hubIntoCodeQuest(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/hub$/);
  await page.getByRole('link', { name: /CodeQuest/ }).click();
  await expect(page).toHaveURL(/\/map$/);
}

const WORLDS_DIR = fileURLToPath(new URL('../../../content/worlds/', import.meta.url));

/**
 * The world folders a child sees on the map: the app leaves out a world with no boss level yet
 * (catalog.ts), so specs that walk "every world" must leave it out too, or they visit a world
 * the app does not have.
 */
export function worldDirsOnMap(): string[] {
  return readdirSync(WORLDS_DIR)
    .filter((dir) => !dir.startsWith('_'))
    .filter((dir) =>
      readdirSync(`${WORLDS_DIR}${dir}/levels`).some(
        (file) =>
          (JSON.parse(readFileSync(`${WORLDS_DIR}${dir}/levels/${file}`, 'utf8')) as {
            stage?: string;
            retired?: boolean;
          }).stage === 'boss',
      ),
    );
}
