import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import type * as BlocklyModule from 'blockly';
import { confirmRestart, signInTestProfile } from './helpers';

// Coach playtest fixes (10/2026): tier 2 "chỉ bước tiếp" shows the block after the child's
// correct start (not step 1 again), "Làm lại" puts the whole level back after a confirm (and one
// Ctrl+Z brings the program back), and the play screen starts at Nhanh.

const SHOTS = process.env['SHOTS_DIR'] ?? 'test-results/play-step-reset-speed';

interface PlayHook {
  Blockly: typeof BlocklyModule;
  workspace: BlocklyModule.WorkspaceSvg;
}
type HookWindow = Window & { __cqPlay: PlayHook };

const readLevel = (path: string) =>
  JSON.parse(
    readFileSync(new URL(`../../../content/worlds/${path}.json`, import.meta.url), 'utf8'),
  ) as { initialWorkspace?: { blocks: { blocks: Array<{ id: string }> } } };

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

async function open(page: Page, levelId: string): Promise<void> {
  await signInTestProfile(page);
  await page.goto(`/play/${levelId}`);
  await expect(page.getByTestId('play-stage')).toHaveAttribute('data-ready', 'true', {
    timeout: 30_000,
  });
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

/** "khi bắt đầu" + the given blocks in a chain, ids as given. */
function program(...blocks: Array<[string, string]>): unknown {
  let next: unknown;
  for (const [type, id] of [...blocks].reverse()) {
    next = { block: { type, id, ...(next !== undefined && { next }) } };
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

/** The program under "khi bắt đầu" as block types, plus every block id on the workspace. */
const workspaceNow = (page: Page) =>
  page.evaluate(() => {
    const { workspace } = (window as unknown as HookWindow).__cqPlay;
    const chain: string[] = [];
    let block = workspace.getBlocksByType('cq_start', false)[0]?.getNextBlock() ?? null;
    while (block) {
      chain.push(block.type);
      block = block.getNextBlock();
    }
    const ids = workspace
      .getAllBlocks(false)
      .map((b) => b.id)
      .sort();
    return { chain, ids };
  });

/** Every block's id, type and workspace position, sorted by id. */
const layout = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as HookWindow).__cqPlay.workspace
      .getAllBlocks(false)
      .map((b) => {
        const xy = b.getRelativeToSurfaceXY();
        return `${b.id}:${b.type}@${String(Math.round(xy.x))},${String(Math.round(xy.y))}`;
      })
      .sort(),
  );

/** The last block of the chain under "khi bắt đầu" ('start' when empty). */
const lastBlockId = (page: Page) =>
  page.evaluate(() => {
    const { workspace } = (window as unknown as HookWindow).__cqPlay;
    let id = 'start';
    let next = workspace.getBlocksByType('cq_start', false)[0]?.getNextBlock() ?? null;
    while (next) {
      id = next.id;
      next = next.getNextBlock();
    }
    return id;
  });

/** Drags toolbox block `type` under block `targetId` with the real mouse, like a child. */
async function dragUnder(page: Page, type: string, targetId: string): Promise<void> {
  const points = await page.evaluate(
    async ([blockType, parentId]) => {
      const { Blockly, workspace } = (window as unknown as HookWindow).__cqPlay;
      await Blockly.renderManagement.finishQueuedRenders();
      const flyout = workspace.getFlyout()?.getWorkspace();
      const source = flyout?.getTopBlocks(false).find((block) => block.type === blockType);
      const parent =
        parentId === 'start'
          ? workspace.getBlocksByType('cq_start', false)[0]
          : workspace.getBlockById(parentId);
      const plug = source?.previousConnection;
      const slot = parent?.nextConnection;
      if (!flyout || !source || !plug || !slot) throw new Error(`no ${blockType} / ${parentId}`);
      const screen = (ws: BlocklyModule.WorkspaceSvg, x: number, y: number) =>
        Blockly.utils.svgMath.wsToScreenCoordinates(ws, new Blockly.utils.Coordinate(x, y));
      const from = screen(flyout, plug.x, plug.y);
      const to = screen(workspace, slot.x, slot.y);
      const box = source.getSvgRoot().getBoundingClientRect();
      const grab = { x: box.x + 14, y: box.y + Math.min(14, box.height / 2) };
      return { grab, drop: { x: grab.x + to.x - from.x, y: grab.y + to.y - from.y } };
    },
    [type, targetId] as const,
  );
  await page.mouse.move(points.grab.x, points.grab.y);
  await page.mouse.down();
  await page.mouse.move(points.grab.x + 30, points.grab.y + 8, { steps: 5 });
  await page.mouse.move(points.drop.x, points.drop.y, { steps: 15 });
  await page.waitForTimeout(120);
  await page.mouse.move(points.drop.x + 1, points.drop.y + 1);
  await page.waitForTimeout(120);
  await page.mouse.up();
  await page.waitForFunction(
    () => !(window as unknown as HookWindow).__cqPlay.Blockly.Gesture.inProgress(),
  );
}

const hasClass = (page: Page, blockId: string, className: string) =>
  page.evaluate(
    ([id, name]) =>
      (window as unknown as HookWindow).__cqPlay.workspace
        .getBlockById(id ?? '')
        ?.getSvgRoot()
        .classList.contains(name ?? '') ?? false,
    [blockId, className],
  );

const coins = (page: Page) =>
  page.locator('[data-hud-coins]').locator('li').first().locator('.sr-only');

async function buyNextStep(page: Page): Promise<void> {
  await page.getByTestId('play-hint').click();
  await page.getByTestId('hint-buy-2').click();
  await expect(page.getByTestId('next-step-popover')).toBeVisible();
}

test.describe('coach playtest fixes', () => {
  test.describe.configure({ timeout: process.env.CI ? 300_000 : 120_000 });

  test('tier 2 moves on after the child places the suggested block', async ({ page }, testInfo) => {
    const project = testInfo.project.name;
    // w01-l05: đi, nhảy, đi, nhảy, đi.
    await open(page, 'w01-l05');
    const popover = page.getByTestId('next-step-popover');

    // Empty program: the first block, under "khi bắt đầu".
    await buyNextStep(page);
    await expect(popover).toHaveAttribute('data-kind', 'add');
    await expect(popover).toContainText('đi');
    const startId = await page.evaluate(
      () =>
        (window as unknown as HookWindow).__cqPlay.workspace.getBlocksByType('cq_start', false)[0]
          ?.id ?? '',
    );
    expect(await hasClass(page, startId, 'cq-step-anchor')).toBe(true);
    await expect(coins(page)).toHaveText('15 xu');
    await page.keyboard.press('Escape');
    await expect(popover).toHaveCount(0);

    // The child drags "đi" under "khi bắt đầu", as shown.
    await dragUnder(page, 'runner_walk', 'start');
    await expect.poll(async () => (await workspaceNow(page)).chain).toEqual(['runner_walk']);
    const walk = await lastBlockId(page);

    // Next purchase: the block after "đi" (nhảy), anchored on that "đi", not step 1 again.
    await buyNextStep(page);
    await expect(popover).toHaveAttribute('data-kind', 'add');
    await expect(popover).toContainText('nhảy');
    expect(await hasClass(page, walk, 'cq-step-anchor')).toBe(true);
    expect(await hasClass(page, startId, 'cq-step-anchor')).toBe(false);
    await expect(coins(page)).toHaveText('0 xu');
    await page.screenshot({ path: `${SHOTS}/${project}-tier2-second-step.png` });
  });

  test('Làm lại asks first, then puts the whole level back; Ctrl+Z brings the program back', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'w01-l05');
    const stage = page.getByTestId('play-stage');
    await setProgram(page, program(['runner_walk', 'w1'], ['runner_walk', 'w2']));
    await page.getByTestId('play-run').click();
    await expect(stage).toHaveAttribute('data-phase', 'fail', { timeout: 30_000 });

    // Không: nothing changes.
    await page.getByTestId('play-reset').click();
    const confirm = page.getByTestId('restart-confirm');
    await expect(confirm).toBeVisible();
    await expect(confirm).toContainText('Xóa hết và làm lại từ đầu?');
    await expect(page.getByTestId('restart-no')).toBeFocused();
    await page.screenshot({ path: `${SHOTS}/${project}-restart-confirm.png` });
    await page.getByTestId('restart-no').click();
    await expect(confirm).toHaveCount(0);
    await expect(stage).toHaveAttribute('data-phase', 'fail');
    expect((await workspaceNow(page)).chain).toEqual(['runner_walk', 'runner_walk']);
    // Esc answers Không too.
    await stage.focus();
    await page.keyboard.press('r');
    await expect(confirm).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(confirm).toHaveCount(0);
    expect((await workspaceNow(page)).chain).toEqual(['runner_walk', 'runner_walk']);

    // R, then Có: stage at the start, only "khi bắt đầu" left; coins untouched.
    const before = await layout(page);
    await stage.focus();
    await page.keyboard.press('r');
    await confirmRestart(page);
    await expect(stage).toHaveAttribute('data-phase', 'idle');
    await expect.poll(async () => (await workspaceNow(page)).chain).toEqual([]);
    expect((await workspaceNow(page)).ids).toHaveLength(1);
    await expect(coins(page)).toHaveText('30 xu');
    // Focus is back on the stage: Space runs (the empty program), it does not reopen the box.
    await expect(stage).toBeFocused();
    await page.screenshot({ path: `${SHOTS}/${project}-restarted.png` });

    // One Ctrl+Z on the workspace brings the whole program back.
    const area = await page.locator('.cq-blockly .blocklyMainBackground').boundingBox();
    if (!area) throw new Error('no workspace');
    await page.mouse.click(area.x + area.width * 0.8, area.y + area.height * 0.8);
    await page.keyboard.press('Control+z');
    // The same blocks (ids), types and places as before Làm lại.
    await expect.poll(() => layout(page)).toEqual(before);
    expect((await workspaceNow(page)).chain).toEqual(['runner_walk', 'runner_walk']);
  });

  test('R mid-run: the replay waits under the confirm; Không lets it go on, Có restarts', async ({
    page,
  }) => {
    const solution = (readLevel('w01-lang-tre/levels/w01-l05') as { solution: unknown }).solution;
    await open(page, 'w01-l05');
    const stage = page.getByTestId('play-stage');
    await page.getByRole('radio', { name: 'Vừa' }).click();
    await setProgram(page, solution);
    await page.getByTestId('play-run').click();
    await expect(stage).toHaveAttribute('data-phase', 'running');
    await stage.focus();
    await page.keyboard.press('r');
    const confirm = page.getByTestId('restart-confirm');
    await expect(confirm).toBeVisible();
    await expect(stage).toHaveAttribute('data-paused', 'true');
    // Long enough for the whole replay: it waits, so no results card pops over the confirm.
    await page.waitForTimeout(4000);
    await expect(page.getByTestId('play-success')).toHaveCount(0);
    await expect(stage).toHaveAttribute('data-phase', 'running');
    await page.getByTestId('restart-no').click();
    await expect(confirm).toHaveCount(0);
    await expect(stage).toHaveAttribute('data-paused', 'false');
    // The replay carries on to the win, the program kept.
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 30_000 });
    expect((await workspaceNow(page)).chain).toHaveLength(5);

    // Chơi lại, run again, then Có mid-run: a clean restart.
    await page
      .getByTestId('play-success')
      .getByRole('button', { name: /^Chơi lại/ })
      .click();
    await page.getByTestId('play-run').click();
    await expect(stage).toHaveAttribute('data-phase', 'running');
    await page.getByTestId('play-reset').click();
    await confirmRestart(page);
    await expect(stage).toHaveAttribute('data-phase', 'idle');
    await expect(stage).toHaveAttribute('data-paused', 'false');
    await expect(stage).toHaveAttribute('data-panda', 'idle');
    await expect.poll(async () => (await workspaceNow(page)).chain).toEqual([]);
    await page.waitForTimeout(1500);
    await expect(page.getByTestId('play-success')).toHaveCount(0);
    await expect(stage).toHaveAttribute('data-phase', 'idle');
  });

  test('Làm lại in parsons puts the shuffled pieces back', async ({ page }) => {
    const level = readLevel('w01-lang-tre/levels/w01-l06');
    const startIds = (level.initialWorkspace?.blocks.blocks ?? []).map((b) => b.id);
    await open(page, 'w01-l06');
    // The child hangs a piece under "khi bắt đầu" (a move, no block is deleted in parsons).
    await page.evaluate(() => {
      const { workspace } = (window as unknown as HookWindow).__cqPlay;
      const start = workspace.getBlocksByType('cq_start', false)[0];
      const piece = workspace.getBlockById('walk1');
      if (start?.nextConnection && piece?.previousConnection) {
        start.nextConnection.connect(piece.previousConnection);
      }
    });
    await expect.poll(async () => (await workspaceNow(page)).chain).toEqual(['runner_walk']);
    await page.getByTestId('play-reset').click();
    await confirmRestart(page);
    await expect.poll(async () => (await workspaceNow(page)).chain).toEqual([]);
    // Every piece is back as a loose block, with its own id.
    const top = await page.evaluate(() =>
      (window as unknown as HookWindow).__cqPlay.workspace
        .getTopBlocks(false)
        .map((b) => b.id)
        .sort(),
    );
    expect(top).toEqual([...startIds].sort());
  });

  test('Làm lại on a multi-map level goes back to map 1', async ({ page }) => {
    await open(page, 'runner-maps');
    await page.getByTestId('map-tab-2').click();
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-map', '2');
    await page.getByTestId('play-reset').click();
    await confirmRestart(page);
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-map', '1');
    await expect(page.getByTestId('map-tab-1')).toHaveAttribute('aria-selected', 'true');
  });

  test('the play screen starts at Nhanh', async ({ page }) => {
    await open(page, 'w01-l01');
    await expect(page.getByRole('radio', { name: 'Nhanh' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(page.getByRole('radio', { name: 'Vừa' })).toHaveAttribute('aria-checked', 'false');
  });
});
