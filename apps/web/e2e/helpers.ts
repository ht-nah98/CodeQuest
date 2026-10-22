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

type AttributeLogWindow = Window & {
  __cqAttributeLog?: { observer: MutationObserver; log: Array<[string, string | null]> };
};

/**
 * Starts writing down every value the listed attributes of `selector` take, in order, until the
 * page navigates. Call it before the action whose steps you want to check, then read them with
 * `attributeHistory`.
 *
 * Use this, not a wait for each step, when a value lasts only a few frames (the robot lab's
 * clock showing 19 for one crossing). Polling - even every frame - misses such a value on a
 * loaded machine, and then waits for it until the test times out although the run has long
 * finished well: that was the robot lab smoke test going red on CI. A MutationObserver gets a
 * record for every write, so nothing is missed.
 */
export async function recordAttributes(
  page: Page,
  selector: string,
  attributes: string[],
): Promise<void> {
  await page.evaluate(
    ([sel, names]) => {
      const target = document.querySelector(sel);
      if (!target) throw new Error(`recordAttributes: nothing matches ${sel}`);
      const win = window as AttributeLogWindow;
      win.__cqAttributeLog?.observer.disconnect();
      // Each record carries the value *before* the write; the value written is read from the
      // next record of the same attribute, or from the element after the last one.
      const log: Array<[string, string | null]> = [];
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          if (record.attributeName) log.push([record.attributeName, record.oldValue]);
        }
      });
      observer.observe(target, { attributeFilter: names, attributeOldValue: true });
      win.__cqAttributeLog = { observer, log };
    },
    [selector, attributes] as const,
  );
}

/**
 * Every value the recorded attributes took, oldest first, as `name=value`, from the first value
 * recorded to the current one. A write that did not change the value is left out.
 */
export async function attributeHistory(page: Page, selector: string): Promise<string[]> {
  return page.evaluate((sel) => {
    const win = window as AttributeLogWindow;
    const target = document.querySelector(sel);
    if (!win.__cqAttributeLog || !target) throw new Error('attributeHistory: nothing recorded');
    win.__cqAttributeLog.observer.takeRecords().forEach((record) => {
      if (record.attributeName)
        win.__cqAttributeLog?.log.push([record.attributeName, record.oldValue]);
    });
    const { log } = win.__cqAttributeLog;
    const history: string[] = [];
    const last = new Map<string, string | null>();
    const push = (name: string, value: string | null) => {
      if (last.has(name) && last.get(name) === value) return;
      last.set(name, value);
      history.push(`${name}=${value ?? ''}`);
    };
    log.forEach(([name], i) => {
      const next = log.slice(i + 1).find(([other]) => other === name);
      // The value before the first write is where the attribute started.
      if (!last.has(name)) push(name, log[i]?.[1] ?? null);
      push(name, next ? next[1] : target.getAttribute(name));
    });
    return history;
  }, selector);
}

/** True when every entry of `wanted` appears in `history`, in that order (others may sit between). */
export function inOrder(history: string[], wanted: string[]): boolean {
  let at = 0;
  for (const entry of history) if (entry === wanted[at]) at += 1;
  return at === wanted.length;
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
          (
            JSON.parse(readFileSync(`${WORLDS_DIR}${dir}/levels/${file}`, 'utf8')) as {
              stage?: string;
              retired?: boolean;
            }
          ).stage === 'boss',
      ),
    );
}
