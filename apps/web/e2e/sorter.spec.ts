import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import { signInTestProfile } from './helpers';

// P5-05 acceptance: the bookshelf stage (ADR-0025) draws a level, replays its events and ends a
// run the child can read. The shelf publishes what it shows on the canvas (`data-shelf*`), so
// these tests assert the books and the hand rather than pixels. Programs are set from each
// level's own `solution` through the dev play hook, like flow.spec.

interface HookWindow {
  __cqPlay: {
    Blockly: { serialization: { workspaces: { load: (json: object, ws: object) => void } } };
    workspace: { clear: () => void };
  };
}

const solutionOf = (levelId: string): unknown =>
  (
    JSON.parse(readFileSync(`../../content/worlds/_sandbox/levels/${levelId}.json`, 'utf8')) as {
      solution: unknown;
    }
  ).solution;

async function openLevel(page: Page, levelId: string): Promise<void> {
  await page.goto(`/play/${levelId}`);
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

const shelf = (page: Page) => page.locator('canvas').first();

test.beforeEach(async ({ page }) => {
  await signInTestProfile(page);
});

test('@smoke the shelf draws the level and sorts it when the solution runs', async ({ page }) => {
  await openLevel(page, 'sorter-bubble');

  // The level starts with its own books, the hand on the first one and no swaps.
  await expect(shelf(page)).toHaveAttribute('data-shelf', '3,1,2');
  await expect(shelf(page)).toHaveAttribute('data-shelf-hand', '1');
  await expect(shelf(page)).toHaveAttribute('data-shelf-swaps', '0');

  await setProgram(page, solutionOf('sorter-bubble'));
  await page.getByTestId('play-run').click();

  await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 60_000 });
  // Three maps, each sorted; the last one is what the shelf is left showing.
  await expect(shelf(page)).toHaveAttribute('data-shelf', '1,2,3');
  await expect(page.getByTestId('results-stars')).toHaveAttribute('data-stars', '3');
});

test('a level without a question budget shows no budget, and its goal still ends the run', async ({
  page,
}) => {
  await openLevel(page, 'sorter-find');

  // `maxQuestions` is optional (ADR-0025 §2); without it the chip stays empty.
  await expect(shelf(page)).toHaveAttribute('data-shelf-questions', '');
  await expect(shelf(page)).toHaveAttribute('data-shelf', '4,9,1,6,7,3');

  await setProgram(page, solutionOf('sorter-find'));
  await page.getByTestId('play-run').click();

  await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 60_000 });
  // The goal is `find: 7` on every map of the level, so wherever the last map put that book,
  // the hand is standing on it (the second map is a shorter shelf: 7, 2, 5).
  const books = (await shelf(page).getAttribute('data-shelf'))?.split(',') ?? [];
  const hand = Number(await shelf(page).getAttribute('data-shelf-hand'));
  expect(books[hand - 1]).toBe('7');
});

test('Làm lại puts the shelf back the way the level starts', async ({ page }) => {
  await openLevel(page, 'sorter-bubble');
  await setProgram(page, solutionOf('sorter-bubble'));
  await page.getByTestId('play-run').click();
  await expect
    .poll(async () => await shelf(page).getAttribute('data-shelf-swaps'), { timeout: 60_000 })
    .not.toBe('0');

  await page.getByTestId('play-reset').click();
  const confirm = page.getByTestId('restart-yes');
  if (await confirm.isVisible().catch(() => false)) await confirm.click();

  await expect(shelf(page)).toHaveAttribute('data-shelf', '3,1,2');
  await expect(shelf(page)).toHaveAttribute('data-shelf-hand', '1');
  await expect(shelf(page)).toHaveAttribute('data-shelf-swaps', '0');
});
