import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import type * as BlocklyModule from 'blockly';

// P0-07 acceptance (docs/roadmap/phase-0.md): one runner level played end to end on /play/:levelId.

const SHOTS = 'test-results/play-runner';
const LEVEL_ID = 'w01-l03';

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(new URL(`../../../content/${path}`, import.meta.url), 'utf8'));
const level = readJson(`worlds/w01-lang-tre/levels/${LEVEL_ID}.json`) as {
  solution: unknown;
  feedback?: Record<string, string>;
};
const shared = readJson('shared/feedback.json') as Record<string, string>;
/** Măng's line for a reason: the level's override first, as the app does (ui-copy-guide.md §3). */
const line = (reason: string): string => level.feedback?.[reason] ?? shared[reason] ?? '';

/** Test hook set by PlayScreen (dev build only). */
interface PlayHook {
  Blockly: typeof BlocklyModule;
  workspace: BlocklyModule.WorkspaceSvg;
  highlights: string[];
}
// Tests only read the hook after open(), so it is typed as present.
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
const walk = (id: string): Block => ({ type: 'runner_walk', id });
const jump = (id: string): Block => ({ type: 'runner_jump', id });
const repeat20 = (id: string, inner?: Block): Block => ({
  type: 'cq_repeat',
  id,
  fields: { TIMES: 20 },
  ...(inner && { inputs: { DO: { block: inner } } }),
});

let errors: string[];
let foreign: string[];

test.beforeEach(({ page }) => {
  errors = [];
  foreign = [];
  page.on('console', (msg) => {
    // Chrome's own GL driver notes (screenshots read the WebGL canvas back) are not app output.
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
  // No console errors/warnings and no request leaving localhost (security-privacy.md).
  expect(errors).toEqual([]);
  expect(foreign).toEqual([]);
});

async function open(page: Page): Promise<void> {
  await page.goto(`/play/${LEVEL_ID}`);
  // The first visit on a cold dev server compiles Blockly, Pixi and the engine on demand,
  // which can take well over the default 5 s while other workers do the same.
  await expect(page.getByTestId('play-stage')).toHaveAttribute('data-ready', 'true', {
    timeout: 30_000,
  });
  // StrictMode mounts twice in dev; exactly one canvas must survive.
  await expect(page.getByTestId('play-stage').locator('canvas')).toHaveCount(1);
  await page.waitForFunction(
    () => (window as unknown as Partial<HookWindow>).__cqPlay !== undefined,
  );
}

/** Replaces the program, as if the child had built it. */
async function setProgram(page: Page, json: unknown): Promise<void> {
  await page.evaluate((workspaceJson) => {
    const { Blockly, workspace } = (window as unknown as HookWindow).__cqPlay;
    workspace.clear();
    Blockly.serialization.workspaces.load(workspaceJson as object, workspace);
  }, json);
}

const highlights = (page: Page) =>
  page.evaluate(() => [...(window as unknown as HookWindow).__cqPlay.highlights]);

const hasClass = (page: Page, blockId: string, name: string) =>
  page.evaluate(
    ([id, cls]) =>
      (window as unknown as HookWindow).__cqPlay.workspace
        .getBlockById(id)
        ?.getSvgRoot()
        .classList.contains(cls) ?? false,
    [blockId, name] as const,
  );

test.describe('/play/w01-l03 runner', () => {
  test('@smoke correct program: Măng walks, jumps, cheers, blocks light up', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page);
    await page.screenshot({ path: `${SHOTS}/${project}-start.png` });
    await expect(page.getByTestId('play-bubble')).toBeVisible();

    await setProgram(page, level.solution);
    await page.getByTestId('play-run').click();
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-phase', 'running');
    // The block that runs now is outlined.
    await expect(page.locator('.blocklyHighlighted')).toHaveCount(1);
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-panda', 'jump');
    await page.screenshot({ path: `${SHOTS}/${project}-jump.png` });

    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-panda', 'cheer');
    await expect(page.getByTestId('play-bubble')).toHaveText('Chỉ 3 khối, đúng bằng số chuẩn!');
    // Every block lit up in program order; the highlight is cleared at the end.
    expect(await highlights(page)).toEqual(['start', 'walk1', 'jump1', 'walk2']);
    await expect(page.locator('.blocklyHighlighted')).toHaveCount(0);
    await page.waitForTimeout(400); // let the success panel pop in
    await page.screenshot({ path: `${SHOTS}/${project}-success.png` });

    // Làm lại: stage back to the start, program kept.
    await page.getByRole('button', { name: 'Chơi lại' }).click();
    await expect(page.getByTestId('play-success')).toHaveCount(0);
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-panda', 'idle');
    expect(
      await page.evaluate(
        () => (window as unknown as HookWindow).__cqPlay.workspace.getAllBlocks(false).length,
      ),
    ).toBe(4);
  });

  test('@smoke wrong program: Măng falls in the hole, the block shakes', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page);
    await setProgram(page, program(walk('w1'), walk('w2')));
    // Space runs when focus is outside Blockly (blockly-integration.md §13).
    await page.getByTestId('play-stage').focus();
    await page.keyboard.press('Space');

    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-phase', 'fail', {
      timeout: 15_000,
    });
    await expect(page.getByTestId('play-bubble')).toHaveText(line('FELL_IN_HOLE'));
    expect(await hasClass(page, 'w2', 'cq-shake')).toBe(true);
    expect(await hasClass(page, 'w1', 'cq-shake')).toBe(false);
    expect(await highlights(page)).toEqual(['start', 'w1', 'w2']);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SHOTS}/${project}-fell.png` });

    // R puts the stage back and stops the shake.
    await page.keyboard.press('r');
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-phase', 'idle');
    expect(await hasClass(page, 'w2', 'cq-shake')).toBe(false);
  });

  test('@smoke a loop that never ends in time: TIMEOUT line, page stays responsive', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page);
    // 20⁴ = 160 000 turns: more than DEFAULT_MAX_STEPS, so the engine cuts it with TIMEOUT.
    // (A truly endless loop needs a block the runner toolbox does not have yet.)
    const loops = repeat20('r1', repeat20('r2', repeat20('r3', repeat20('r4'))));
    await setProgram(page, program(loops));
    const started = Date.now();
    await page.getByTestId('play-run').click();

    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-phase', 'fail', {
      timeout: 15_000,
    });
    expect(Date.now() - started).toBeLessThan(10_000);
    await expect(page.getByTestId('play-bubble')).toHaveText(line('TIMEOUT'));

    // The main thread answers at once and the UI still reacts.
    const ping = Date.now();
    await page.evaluate(() => 1);
    expect(Date.now() - ping).toBeLessThan(500);
    await page.screenshot({ path: `${SHOTS}/${project}-timeout.png` });
    await page.getByRole('button', { name: /Làm lại/ }).click();
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-phase', 'idle');
  });

  test('step mode: S acts out one block at a time', async ({ page }) => {
    await open(page);
    const stage = page.getByTestId('play-stage');
    await setProgram(page, level.solution);
    await stage.focus();
    await page.keyboard.press('s');
    await expect(page.getByTestId('play-bubble')).toHaveText('Bấm Từng bước để Măng làm tiếp.');

    // Waits before the first action with "đi" lit up, and really stays there.
    await expect(stage).toHaveAttribute('data-waiting-step', 'true');
    expect(await highlights(page)).toEqual(['start', 'walk1']);
    await page.waitForTimeout(900); // longer than any walk/jump tween
    await expect(stage).toHaveAttribute('data-waiting-step', 'true');
    await expect(stage).toHaveAttribute('data-panda', 'idle');
    expect(await highlights(page)).toEqual(['start', 'walk1']);

    const steps = [
      ['start', 'walk1', 'jump1'], // after "đi": Măng walked, now waits before "nhảy"
      ['start', 'walk1', 'jump1', 'walk2'], // after "nhảy": waits before the last "đi"
    ];
    for (const expected of steps) {
      await page.keyboard.press('s');
      await expect(stage).toHaveAttribute('data-waiting-step', 'false');
      await expect(stage).toHaveAttribute('data-waiting-step', 'true');
      expect(await highlights(page)).toEqual(expected);
      await expect(stage).toHaveAttribute('data-panda', 'idle');
    }
    // The last "đi" reaches the flag; the win follows without another step.
    await page.keyboard.press('s');
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 10_000 });
    await expect(stage).toHaveAttribute('data-panda', 'cheer');
  });

  test('a program built with the mouse runs at once with Space', async ({ page }, testInfo) => {
    await open(page);
    const stage = page.getByTestId('play-stage');
    // Drag "nhảy" (second flyout block) under "khi bắt đầu" with a real mouse drag.
    const source = page.locator('.blocklyFlyout .blocklyDraggable').nth(1);
    const start = page.locator('.blocklyWorkspace > .blocklyBlockCanvas .cq_start').first();
    const from = await source.boundingBox();
    const to = await start.boundingBox();
    if (!from || !to) throw new Error('flyout or start block not rendered');
    await page.mouse.move(from.x + 15, from.y + 15);
    await page.mouse.down();
    await page.mouse.move(to.x + 20, to.y + to.height + 18, { steps: 12 });
    await page.mouse.up();
    // No wait for the 150 ms debounce: Space right after the drop runs the fresh program.
    await page.keyboard.press('Space');
    await expect(stage).toHaveAttribute('data-phase', 'fail', { timeout: 15_000 });
    // "nhảy" from cell 0 lands in the hole at cell 2.
    await expect(page.getByTestId('play-bubble')).toHaveText(line('FELL_IN_HOLE'));
    expect(await highlights(page)).toHaveLength(2);
    await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-drag-jump-fell.png` });
  });

  test('@smoke jumping past the flag and stopping short show their own lines', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page);
    const stage = page.getByTestId('play-stage');

    await setProgram(page, program(walk('w1'), jump('j1'), jump('j2')));
    await page.getByTestId('play-run').click();
    await expect(stage).toHaveAttribute('data-phase', 'fail', { timeout: 15_000 });
    await expect(page.getByTestId('play-bubble')).toHaveText(line('OFF_TRACK'));
    expect(await hasClass(page, 'j2', 'cq-shake')).toBe(true);
    await page.screenshot({ path: `${SHOTS}/${project}-off-track.png` });

    // Editing the program puts the stage back.
    await setProgram(page, program(walk('w1')));
    await expect(stage).toHaveAttribute('data-phase', 'idle');
    await page.getByTestId('play-run').click();
    await expect(stage).toHaveAttribute('data-phase', 'fail', { timeout: 15_000 });
    await expect(page.getByTestId('play-bubble')).toHaveText(line('NOT_AT_GOAL'));
    await expect(stage).toHaveAttribute('data-panda', 'idle');
    expect(await hasClass(page, 'w1', 'cq-shake')).toBe(true);
  });

  test('unknown level shows a friendly message', async ({ page }) => {
    await page.goto('/play/w99-nope');
    await expect(page.getByRole('alert')).toHaveText('Không tìm thấy màn này.');
  });
});
