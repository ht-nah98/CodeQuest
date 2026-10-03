import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import type * as BlocklyModule from 'blockly';
import { signInTestProfile } from './helpers';

// P2-12 acceptance (docs/roadmap/phase-2.md): a multi-map level (the dev-only _sandbox level
// runner-maps, 3 maps). A program right for map 1 only wins map 1, loses on map 2, and tab
// "Bản đồ 2" stays selected; one program that fits every map wins the level.

/** Screenshots for the PR go to SHOTS_DIR when set (the AI's scratchpad), else test-results. */
const SHOTS = process.env['SHOTS_DIR'] ?? 'test-results/play-maps';
const LEVEL_ID = 'runner-maps';

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(new URL(`../../../content/${path}`, import.meta.url), 'utf8'));
const level = readJson(`worlds/_sandbox/levels/${LEVEL_ID}.json`) as {
  solution: unknown;
  variants: unknown[];
};
const shared = readJson('shared/feedback.json') as Record<string, string>;

interface PlayHook {
  Blockly: typeof BlocklyModule;
  workspace: BlocklyModule.WorkspaceSvg;
}
type HookWindow = Window & { __cqPlay: PlayHook };

type Block = { type: string; id: string; fields?: Record<string, number>; inputs?: unknown };

/** Workspace JSON: "khi bắt đầu" followed by `blocks` in a chain. */
function program(...blocks: Block[]): unknown {
  let next: unknown;
  for (const block of [...blocks].reverse()) {
    next = { block: { ...block, ...(next !== undefined && { next }) } };
  }
  return {
    blocks: {
      languageVersion: 0,
      blocks: [
        { type: 'cq_start', id: 'start', x: 40, y: 40, ...(next !== undefined && { next }) },
      ],
    },
  };
}

let errors: string[];
let foreign: string[];

test.beforeEach(({ page }) => {
  errors = [];
  foreign = [];
  page.on('console', (msg) => {
    if (msg.text().startsWith('[.WebGL-')) return;
    if (msg.type() === 'error' || msg.type() === 'warning') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.protocol === 'data:' || url.protocol === 'blob:') return;
    if (url.hostname !== 'localhost') foreign.push(req.url());
  });
});

test.afterEach(() => {
  expect(errors).toEqual([]);
  expect(foreign).toEqual([]);
});

async function open(page: Page): Promise<void> {
  await signInTestProfile(page);
  await page.goto(`/play/${LEVEL_ID}`);
  await expect(page.getByTestId('play-stage')).toHaveAttribute('data-ready', 'true', {
    timeout: 30_000,
  });
  await expect(page.getByTestId('play-stage').locator('canvas')).toHaveCount(1);
  await page.waitForFunction(
    () => (window as unknown as Partial<HookWindow>).__cqPlay !== undefined,
  );
}

async function setProgram(page: Page, json: unknown): Promise<void> {
  await page.evaluate((workspaceJson) => {
    const { Blockly, workspace } = (window as unknown as HookWindow).__cqPlay;
    workspace.clear();
    Blockly.serialization.workspaces.load(workspaceJson as object, workspace);
  }, json);
}

const tab = (page: Page, n: number) => page.getByTestId(`map-tab-${String(n)}`);

test.describe('/play/runner-maps: one program, 3 maps', () => {
  test('right for map 1 only: map 1 won, map 2 lost and kept on the stage', async ({
    page,
  }, testInfo) => {
    test.setTimeout(90_000);
    const project = testInfo.project.name;
    await open(page);
    const stage = page.getByTestId('play-stage');

    // Tabs before any run: map 1 shown, every map can be looked at.
    await expect(page.getByRole('tab')).toHaveCount(3);
    await expect(tab(page, 1)).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('map-status')).toHaveText('Một chương trình cho cả 3 bản đồ');
    await page.screenshot({ path: `${SHOTS}/${project}-map1.png` });
    await tab(page, 2).click();
    await expect(stage).toHaveAttribute('data-map', '2');
    await expect(tab(page, 2)).toHaveAttribute('aria-selected', 'true');
    await expect(stage.locator('canvas')).toHaveCount(1);
    await page.screenshot({ path: `${SHOTS}/${project}-map2.png` });
    await tab(page, 3).click();
    await expect(stage).toHaveAttribute('data-map', '3');

    // walk, jump, then walk on: wins map 1 (one hole), falls into the second hole of map 2.
    await page.getByRole('radio', { name: 'Nhanh' }).click();
    await setProgram(
      page,
      program(
        { type: 'runner_walk', id: 'w1' },
        { type: 'runner_jump', id: 'j1' },
        {
          type: 'cq_repeat',
          id: 'rep',
          fields: { TIMES: 6 },
          inputs: { DO: { block: { type: 'runner_walk', id: 'w2' } } },
        },
      ),
    );
    await page.getByTestId('play-run').click();
    // The replay starts on map 1 whatever tab was open, and tabs are locked meanwhile.
    await expect(stage).toHaveAttribute('data-map', '1');
    await expect(tab(page, 3)).toBeDisabled();
    await expect(stage).toHaveAttribute('data-phase', 'fail', { timeout: 30_000 });

    await expect(stage).toHaveAttribute('data-map', '2');
    await expect(tab(page, 2)).toHaveAttribute('aria-selected', 'true');
    await expect(tab(page, 1)).toHaveAttribute('data-result', 'won');
    await expect(tab(page, 2)).toHaveAttribute('data-result', 'lost');
    await expect(tab(page, 3)).toHaveAttribute('data-result', '');
    await expect(page.getByTestId('map-status')).toHaveText(
      'Chưa qua bản đồ 2. Sửa rồi chạy lại nhé!',
    );
    // Măng says what happened, or the level's tier-0 tip for it right after.
    const fell = shared['FELL_IN_HOLE'] ?? 'FELL_IN_HOLE';
    await expect(page.getByTestId('play-bubble')).toHaveText(
      new RegExp(`${fell.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|Xem bản đồ khác`),
    );
    await page.screenshot({ path: `${SHOTS}/${project}-lost-map2.png` });

    // Looking at another map keeps the marks of the run.
    await tab(page, 1).click();
    await expect(stage).toHaveAttribute('data-map', '1');
    await expect(tab(page, 2)).toHaveAttribute('data-result', 'lost');

    // One program for every map: repeat 3 [walk, jump].
    await setProgram(page, level.solution);
    await expect(tab(page, 2)).toHaveAttribute('data-result', '');
    await page.getByTestId('play-run').click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 30_000 });
    await expect(stage).toHaveAttribute('data-map', '3');
    for (const n of [1, 2, 3]) await expect(tab(page, n)).toHaveAttribute('data-result', 'won');
    await expect(page.getByTestId('map-status')).toHaveText('Qua cả 3 bản đồ!');
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SHOTS}/${project}-won.png` });
  });
});
