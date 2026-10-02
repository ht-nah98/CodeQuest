import { expect, type Page, test } from '@playwright/test';
import type * as BlocklyModule from 'blockly';

// P0-05 acceptance (docs/roadmap/phase-0.md): every bullet has a test below.

const SHOTS = 'test-results/dev-blockly';

/** Test hook set by DevBlocklyScreen (dev build only). */
interface DevHook {
  Blockly: typeof BlocklyModule;
  workspace: BlocklyModule.WorkspaceSvg;
  levelId: string;
}
// Tests only read the hook after waitForLevel(), so it is typed as present.
type HookWindow = Window & { __cqDevBlockly: DevHook };

const LEVEL_IDS = { build3: 'dev-build-3', parsons: 'dev-parsons', free: 'dev-free' } as const;
type Sample = keyof typeof LEVEL_IDS;

let errors: string[];
let foreign: string[];
let media: string[];

test.beforeEach(({ page }) => {
  errors = [];
  foreign = [];
  media = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.protocol === 'data:' || url.protocol === 'blob:') return;
    if (url.hostname !== 'localhost') foreign.push(req.url());
    if (url.pathname.startsWith('/blockly-media/')) media.push(url.pathname);
  });
});

test.afterEach(() => {
  // No console errors/warnings and no request leaving localhost (security-privacy.md).
  expect(errors).toEqual([]);
  expect(foreign).toEqual([]);
});

async function waitForLevel(page: Page, sample: Sample): Promise<void> {
  await page.waitForFunction(
    (id) => (window as unknown as Partial<HookWindow>).__cqDevBlockly?.levelId === id,
    LEVEL_IDS[sample],
  );
}

async function open(page: Page, sample: Sample = 'build3'): Promise<void> {
  await page.goto('/dev/blockly');
  await waitForLevel(page, 'build3');
  if (sample !== 'build3') await choose(page, sample);
}

async function choose(page: Page, sample: Sample): Promise<void> {
  await page.locator(`button[data-sample="${sample}"]`).click();
  await waitForLevel(page, sample);
}

/** Appends a block to the end of the program (under "khi bắt đầu"), or inside `parentType`. */
async function addToProgram(page: Page, type: string, into?: string): Promise<void> {
  await page.evaluate(
    ([blockType, parentType]) => {
      const { Blockly, workspace } = (window as unknown as HookWindow).__cqDevBlockly;
      const block = Blockly.serialization.blocks.append({ type: blockType }, workspace);
      const previous = block.previousConnection;
      if (!previous) throw new Error(`${blockType} has no previous connection`);
      if (parentType) {
        const parent = workspace.getBlocksByType(parentType, false)[0];
        parent?.getInput('DO')?.connection?.connect(previous);
        return;
      }
      let last = workspace.getBlocksByType('cq_start', false)[0];
      for (let next = last?.getNextBlock(); next; next = next.getNextBlock()) last = next;
      last?.nextConnection?.connect(previous);
    },
    [type, into ?? ''] as const,
  );
}

/** Drags a toolbox block with the real mouse and drops it just under the last program block. */
async function dragFromFlyout(
  page: Page,
  type: string,
  afterDrop?: () => Promise<void>,
): Promise<void> {
  const boxes = await page.evaluate((blockType) => {
    const { workspace } = (window as unknown as HookWindow).__cqDevBlockly;
    const flyoutBlock = (workspace.getFlyout()?.getWorkspace().getTopBlocks(false) ?? []).find(
      (b) => b.type === blockType,
    ) as BlocklyModule.BlockSvg;
    let last = workspace.getBlocksByType('cq_start', false)[0] as BlocklyModule.BlockSvg;
    for (let next = last.getNextBlock(); next; next = next.getNextBlock()) last = next;
    const from = flyoutBlock.getSvgRoot().getBoundingClientRect();
    // The block's own path, not its group (which would include blocks hanging below it).
    const to = last.pathObject.svgPath.getBoundingClientRect();
    return { from: { x: from.x, y: from.y }, to: { x: to.x, y: to.bottom } };
  }, type);
  const grab = { x: boxes.from.x + 12, y: boxes.from.y + 14 };
  await page.mouse.move(grab.x, grab.y);
  await page.mouse.down();
  await page.mouse.move(grab.x + 40, grab.y + 10, { steps: 5 });
  await page.mouse.move(boxes.to.x + 12, boxes.to.y + 10, { steps: 15 });
  await page.mouse.up();
  await afterDrop?.();
}

const TOOLBOX_FLYOUT = '.blocklyFlyout:not(.blocklyTrashcanFlyout)';
const meter = (page: Page) => page.getByRole('meter');
const runCount = (page: Page) => page.getByTestId('run-count');

test.describe('/dev/blockly', () => {
  test('zelos workspace with the CodeQuest theme and self-hosted media', async ({ page }) => {
    await open(page, 'free');
    const look = await page.evaluate(() => {
      const { workspace } = (window as unknown as HookWindow).__cqDevBlockly;
      const css = getComputedStyle(document.documentElement);
      const token = (name: string) => css.getPropertyValue(`--color-${name}`).trim().toLowerCase();
      const flyoutBlocks = workspace.getFlyout()?.getWorkspace().getTopBlocks(false) ?? [];
      const flyoutBlock = (type: string) =>
        flyoutBlocks.find((b) => b.type === type) as BlocklyModule.BlockSvg;
      const fill = (block: BlocklyModule.BlockSvg) =>
        block.pathObject.svgPath.getAttribute('fill')?.toLowerCase();
      const start = workspace.getBlocksByType('cq_start', false)[0] as BlocklyModule.BlockSvg;
      const startLabel = start.getSvgRoot().querySelector(':scope > g > .blocklyText') as Element;
      return {
        renderer: workspace.getRenderer().getClassName(),
        theme: workspace.getTheme().name,
        media: workspace.options.pathToMedia,
        fonts: workspace.getTheme().fontStyle,
        move: [fill(flyoutBlock('dev_walk')), token('block-move')],
        loop: [fill(flyoutBlock('cq_repeat')), token('block-loop')],
        logic: [fill(flyoutBlock('controls_if')), token('block-if')],
        sensor: [fill(flyoutBlock('dev_is_hole')), token('block-sensor')],
        event: [fill(start), token('block-event')],
        startLabelFill: getComputedStyle(startLabel).fill,
        ink: token('ink'),
      };
    });
    expect(look.renderer).toBe('zelos-renderer');
    expect(look.theme).toBe('codequest');
    expect(look.media).toBe('/blockly-media/');
    expect(look.fonts).toEqual({
      family: '"Baloo 2", Nunito, sans-serif',
      weight: '700',
      size: 14,
    });
    for (const [actual, expected] of [look.move, look.loop, look.logic, look.sensor, look.event]) {
      expect(expected).toMatch(/^#[0-9a-f]{6}$/);
      expect(actual).toBe(expected);
    }
    // Ink label on the yellow "khi bắt đầu" (#1e1b2e = rgb(30, 27, 46)).
    expect(look.ink).toBe('#1e1b2e');
    expect(look.startLabelFill).toBe('rgb(30, 27, 46)');
    // Sounds and sprites come from our own /blockly-media/.
    await expect.poll(() => media.length).toBeGreaterThan(0);
    await page.screenshot({ path: `${SHOTS}/theme-${test.info().project.name}.png` });
  });

  test('"khi bắt đầu" cannot be deleted', async ({ page }) => {
    await open(page);
    const start = page.locator('.cq_start').first();
    await start.click();
    await page.keyboard.press('Delete');
    await page.keyboard.press('Backspace');
    const state = await page.evaluate(() => {
      const { workspace } = (window as unknown as HookWindow).__cqDevBlockly;
      const blocks = workspace.getBlocksByType('cq_start', false);
      return { count: blocks.length, deletable: blocks[0]?.isDeletable() };
    });
    expect(state).toEqual({ count: 1, deletable: false });
    const enabledDelete = page.locator(
      '.blocklyContextMenu .blocklyMenuItem:not(.blocklyMenuItemDisabled)',
      { hasText: 'Xóa' },
    );
    // Positive control: an ordinary block's menu offers "Xóa khối" (messages.ts)…
    await addToProgram(page, 'dev_walk');
    await page.locator('svg.blocklySvg .dev_walk').click({ button: 'right' });
    await expect(enabledDelete).toHaveCount(1);
    await expect(enabledDelete).toContainText('Xóa khối');
    await page.keyboard.press('Escape');
    await expect(page.locator('.blocklyContextMenu')).toHaveCount(0);
    // …while "khi bắt đầu" offers none (every item is hidden, so no menu opens at all).
    await start.click({ button: 'right' });
    await page.waitForTimeout(300);
    await expect(enabledDelete).toHaveCount(0);
    await page.keyboard.press('Escape');
  });

  test('block menus hide help and inline items children cannot use', async ({ page }) => {
    await open(page, 'free');
    await page.evaluate(() => {
      const { Blockly, workspace } = (window as unknown as HookWindow).__cqDevBlockly;
      Blockly.serialization.blocks.append({ type: 'controls_if', x: 260, y: 220 }, workspace);
    });
    // Top-left corner: the centre of a C-shaped block is its empty statement slot.
    await page
      .locator('svg.blocklySvg .controls_if')
      .click({ button: 'right', position: { x: 12, y: 12 } });
    const items = page.locator('.blocklyContextMenu .blocklyMenuItem');
    await expect(items.filter({ hasText: 'Nhân đôi' })).toHaveCount(1);
    await expect(items.filter({ hasText: 'Xóa khối' })).toHaveCount(1);
    for (const hidden of ['Trợ giúp', 'Cùng dòng', 'Xuống dòng']) {
      await expect(items.filter({ hasText: hidden })).toHaveCount(0);
    }
    await page.keyboard.press('Escape');
    // The workspace menu says "Làm tiếp" for redo, never the reset button's "Làm lại".
    const ws = await page.locator('svg.blocklySvg').boundingBox();
    if (!ws) throw new Error('workspace not rendered');
    await page.mouse.click(ws.x + ws.width * 0.6, ws.y + ws.height * 0.85, { button: 'right' });
    await expect(items.filter({ hasText: 'Hoàn tác' })).toHaveCount(1);
    await expect(items.filter({ hasText: 'Làm tiếp' })).toHaveCount(1);
    await expect(items.filter({ hasText: 'Làm lại' })).toHaveCount(0);
    await page.keyboard.press('Escape');
  });

  test('an orphan block is greyed out until it joins the program', async ({ page }) => {
    await open(page, 'free');
    const read = () =>
      page.evaluate(() => {
        const { workspace } = (window as unknown as HookWindow).__cqDevBlockly;
        const block = workspace.getBlocksByType('dev_walk', false)[0] as BlocklyModule.BlockSvg;
        return {
          enabled: block.isEnabled(),
          patterned: block.getSvgRoot().classList.contains('blocklyDisabledPattern'),
          fill: getComputedStyle(block.pathObject.svgPath).fill,
        };
      });
    await page.evaluate(() => {
      const { Blockly, workspace } = (window as unknown as HookWindow).__cqDevBlockly;
      Blockly.serialization.blocks.append({ type: 'dev_walk', x: 320, y: 220 }, workspace);
    });
    await expect.poll(async () => (await read()).enabled).toBe(false);
    // Zelos paints disabled blocks with the hatched "disabled" pattern.
    expect(await read()).toMatchObject({ patterned: true, fill: expect.stringMatching(/^url\(/) });
    await expect(page.getByTestId('analysis')).toContainText('khối rời: 1');
    await page.screenshot({ path: `${SHOTS}/orphan-${test.info().project.name}.png` });

    await page.evaluate(() => {
      const { workspace } = (window as unknown as HookWindow).__cqDevBlockly;
      const [start] = workspace.getBlocksByType('cq_start', false);
      const [walk] = workspace.getBlocksByType('dev_walk', false);
      if (!start?.nextConnection || !walk?.previousConnection) throw new Error('missing blocks');
      start.nextConnection.connect(walk.previousConnection);
    });
    await expect.poll(read).toMatchObject({ enabled: true, patterned: false });
    await expect(page.getByTestId('analysis')).toContainText('khối rời: 0');
  });

  test('maxBlocks 3: exactly 3 blocks fit, cq_repeat counts as 1, bar shows "còn 0 khối"', async ({
    page,
  }) => {
    await open(page);
    await expect(meter(page)).toHaveAttribute('aria-valuenow', '3');
    await expect(meter(page)).toContainText('còn 3 khối');

    // A real mouse drag from the flyout snaps under "khi bắt đầu".
    await dragFromFlyout(page, 'dev_walk');
    await expect(page.getByTestId('analysis')).toContainText('đang dùng: 1 khối');
    await expect(meter(page)).toContainText('còn 2 khối');
    // Focus went back to the stage after the drag, so Space runs right away (§13).
    await page.keyboard.press('Space');
    await expect(runCount(page)).toHaveText('đã chạy: 1');

    // cq_repeat (count inside the block, no shadow) takes exactly one slot.
    await addToProgram(page, 'cq_repeat');
    await expect(meter(page)).toContainText('còn 1 khối');
    await addToProgram(page, 'dev_jump', 'cq_repeat');
    await expect(meter(page)).toContainText('còn 0 khối');
    await expect(meter(page)).toHaveAttribute('aria-valuenow', '0');
    await expect(page.getByTestId('analysis')).toContainText('đang dùng: 3 khối');

    // The flyout is locked and a fourth drag places nothing.
    const flyoutEnabled = () =>
      page.evaluate(() => {
        const { workspace } = (window as unknown as HookWindow).__cqDevBlockly;
        const flyoutBlocks = workspace.getFlyout()?.getWorkspace().getTopBlocks(false) ?? [];
        return flyoutBlocks.map((b) => b.isEnabled());
      });
    await expect.poll(flyoutEnabled).toEqual([false, false, false]);
    await dragFromFlyout(page, 'dev_walk');
    await page.waitForTimeout(400);
    const count = await page.evaluate(
      () => (window as unknown as HookWindow).__cqDevBlockly.workspace.getAllBlocks(false).length,
    );
    expect(count).toBe(4); // 3 blocks + "khi bắt đầu"
    await expect(meter(page)).toContainText('còn 0 khối');
    await page.screenshot({ path: `${SHOTS}/capacity-${test.info().project.name}.png` });
  });

  test('switching from a parsons level to a build level throws no errors', async ({ page }) => {
    await open(page, 'parsons');
    // Parsons: flyout hidden, scattered blocks greyed as orphans.
    await expect(page.locator(TOOLBOX_FLYOUT)).toBeHidden();
    await expect(page.getByTestId('analysis')).toContainText('khối rời: 3');
    await page.screenshot({ path: `${SHOTS}/parsons-${test.info().project.name}.png` });

    await choose(page, 'build3');
    await expect(page.locator(TOOLBOX_FLYOUT)).toBeVisible();
    await expect(meter(page)).toContainText('còn 3 khối');
    await choose(page, 'free');
    await choose(page, 'parsons');
    await choose(page, 'build3');
    // StrictMode mounts twice in dev; exactly one workspace must survive each switch.
    await expect(page.locator('.injectionDiv')).toHaveCount(1);
    // afterEach checks console errors and pageerrors.
  });

  test('Space runs when focus is outside Blockly, not while keyboard-moving a block', async ({
    page,
  }) => {
    await open(page);
    await page.getByTestId('dev-stage').click();
    await page.keyboard.press('Space');
    await expect(runCount(page)).toHaveText('đã chạy: 1');

    // Focus on the page body works too.
    await page.evaluate(() => {
      (document.activeElement as HTMLElement | null)?.blur();
    });
    await page.keyboard.press('Space');
    await expect(runCount(page)).toHaveText('đã chạy: 2');

    // Keyboard move: focus a block, M starts the move, Space drops it (Blockly's finish_move).
    await page.evaluate(() => {
      const { Blockly, workspace } = (window as unknown as HookWindow).__cqDevBlockly;
      const block = Blockly.serialization.blocks.append(
        { type: 'dev_walk', x: 300, y: 250 },
        workspace,
      );
      Blockly.getFocusManager().focusNode(block as BlocklyModule.BlockSvg);
    });
    await page.keyboard.press('m');
    const moving = () =>
      page.evaluate(() =>
        (window as unknown as HookWindow).__cqDevBlockly.Blockly.KeyboardMover.mover.isMoving(),
      );
    expect(await moving()).toBe(true);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    expect(await moving()).toBe(false);
    await expect(runCount(page)).toHaveText('đã chạy: 2');

    // Space while a mouse drag is in progress does not run the pre-drop program.
    const box = await page.locator('svg.blocklySvg .dev_walk').boundingBox();
    if (!box) throw new Error('dev_walk not rendered');
    await page.mouse.move(box.x + 12, box.y + 14);
    await page.mouse.down();
    await page.mouse.move(box.x + 60, box.y + 60, { steps: 8 });
    await page.keyboard.press('Space');
    await page.mouse.up();
    await expect(runCount(page)).toHaveText('đã chạy: 2');

    // Back outside Blockly, Space runs again.
    await page.getByTestId('dev-stage').click();
    await page.keyboard.press('Space');
    await expect(runCount(page)).toHaveText('đã chạy: 3');
  });

  test('a run reads the workspace synchronously, right after a drop', async ({ page }) => {
    await open(page);
    let gap = Number.POSITIVE_INFINITY;
    await dragFromFlyout(page, 'dev_walk', async () => {
      const dropped = Date.now();
      await page.keyboard.press('Space');
      gap = Date.now() - dropped;
    });
    expect(gap).toBeLessThan(50);
    // The debounced onChange (150 ms) has not reported yet, but the run saw the dropped block.
    await expect(page.getByTestId('last-run')).toHaveText('lần chạy cuối: 1 khối');
    await expect(runCount(page)).toHaveText('đã chạy: 1');
  });
});
