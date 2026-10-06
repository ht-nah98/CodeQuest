import { expect, type Page, test } from '@playwright/test';
import type * as BlocklyModule from 'blockly';
import { signInTestProfile } from './helpers';

// The Blockly toolbox of Thế giới 4 (move, loop, nếu + the CÂU HỎI sensor blocks) is taller than
// the 1280×720 / 1366×768 workspace: every block, the sensor blocks last, must be reachable with
// the mouse wheel, the wheel over the scrollbar and the scrollbar thumb (blockly-integration.md §6).

/** Screenshots go to SHOTS_DIR when set (the AI's scratchpad), else test-results. */
const SHOTS = process.env['SHOTS_DIR'] ?? 'test-results/flyout-scroll';

type HookWindow = Window & {
  __cqPlay: { Blockly: typeof BlocklyModule; workspace: BlocklyModule.WorkspaceSvg };
};

const LEVELS = [
  { id: 'w04-l02', ifBlock: 'cq_if_else', sensor: 'runner_is_ahead', last: 'runner_is_ahead' },
  { id: 'w04-l04', ifBlock: 'cq_if_else', sensor: 'maze_is_path', last: 'maze_is_path' },
] as const;

const FLYOUT = '.blocklyFlyout:not(.blocklyTrashcanFlyout)';

async function open(page: Page, levelId: string): Promise<void> {
  await signInTestProfile(page);
  await page.goto(`/play/${levelId}`);
  await expect(page.getByTestId('play-stage')).toHaveAttribute('data-ready', 'true', {
    timeout: 30_000,
  });
  await page.waitForFunction(
    () => (window as unknown as Partial<HookWindow>).__cqPlay !== undefined,
  );
  await expect(page.locator(FLYOUT)).toBeVisible();
  // A level with star goals opens its card first; it covers the flyout until the child starts.
  const go = page.getByTestId('star-goals-go');
  if (await go.isVisible()) await go.click();
  await expect(page.getByTestId('star-goals-card')).toHaveCount(0);
}

/** The flyout's scroll position, its range, and how far block `type` sits outside the view. */
async function flyoutState(page: Page, type?: string) {
  return page.evaluate(
    ([blockType]) => {
      const { workspace } = (window as unknown as HookWindow).__cqPlay;
      const flyout = workspace.getFlyout();
      if (!flyout) throw new Error('no flyout');
      const metrics = flyout.getWorkspace().getMetrics();
      const area = (document.querySelector('.blocklyFlyout:not(.blocklyTrashcanFlyout)') as Element)
        .getBoundingClientRect();
      const blocks = flyout.getWorkspace().getTopBlocks(true);
      const source = blockType ? blocks.find((b) => b.type === blockType) : blocks.at(-1);
      const box = source?.getSvgRoot().getBoundingClientRect();
      return {
        top: metrics.viewTop,
        max: metrics.scrollHeight - metrics.viewHeight,
        fits: metrics.scrollHeight <= metrics.viewHeight + 1,
        // Positive: pixels of the block below / above the flyout's visible area.
        below: box ? box.bottom - area.bottom : Number.NaN,
        above: box ? area.top - box.top : Number.NaN,
        x: area.x + area.width / 2,
        y: area.y + area.height / 2,
        left: area.left,
        right: area.right,
        areaTop: area.top,
        areaHeight: area.height,
      };
    },
    [type] as const,
  );
}

/** Turns the real mouse wheel over the flyout until block `type` (default: the last) is fully in view. */
async function wheelTo(page: Page, type?: string): Promise<void> {
  for (let tries = 0; tries < 20; tries++) {
    const s = await flyoutState(page, type);
    if (s.below <= 0 && s.above <= 0) return;
    await page.mouse.move(s.x, s.y);
    await page.mouse.wheel(0, s.below > 0 ? 100 : -100);
    await page.waitForTimeout(40);
  }
  throw new Error(`block ${type ?? 'last'} never came into view`);
}

/** Drags toolbox block `type` onto `input` of block `targetId` (`null` = under it) with the mouse. */
async function dragInto(
  page: Page,
  type: string,
  targetId: string,
  input: string | null,
): Promise<void> {
  await wheelTo(page, type);
  const points = await page.evaluate(
    async ([blockType, parentId, inputName]) => {
      const { Blockly, workspace } = (window as unknown as HookWindow).__cqPlay;
      await Blockly.renderManagement.finishQueuedRenders();
      const flyout = workspace.getFlyout()?.getWorkspace();
      const source = flyout?.getTopBlocks(false).find((block) => block.type === blockType);
      const parent =
        parentId === 'start'
          ? workspace.getBlocksByType('cq_start', false)[0]
          : workspace.getBlockById(parentId);
      if (!flyout || !source || !parent) throw new Error(`no ${blockType} or ${parentId}`);
      const plug = source.previousConnection ?? source.outputConnection;
      const slot =
        inputName === '' ? parent.nextConnection : parent.getInput(inputName)?.connection;
      if (!plug || !slot) throw new Error('no connection');
      const screen = (ws: BlocklyModule.WorkspaceSvg, x: number, y: number) =>
        Blockly.utils.svgMath.wsToScreenCoordinates(ws, new Blockly.utils.Coordinate(x, y));
      const from = screen(flyout, plug.x, plug.y);
      const to = screen(workspace, slot.x, slot.y);
      const box = source.getSvgRoot().getBoundingClientRect();
      const grab = { x: box.x + 14, y: box.y + Math.min(14, box.height / 2) };
      return { grab, drop: { x: grab.x + to.x - from.x, y: grab.y + to.y - from.y } };
    },
    [type, targetId, input ?? ''] as const,
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

for (const level of LEVELS) {
  test.describe(`toolbox of ${level.id}`, () => {
    test('the wheel scrolls to the last block, and a question block drops into the nếu slot', async ({
      page,
    }, testInfo) => {
      test.setTimeout(90_000);
      const project = testInfo.project.name;
      await open(page, level.id);
      await page.screenshot({ path: `${SHOTS}/${project}-${level.id}-top.png` });

      await wheelTo(page);
      const end = await flyoutState(page);
      expect(end.below).toBeLessThanOrEqual(0);
      await page.screenshot({ path: `${SHOTS}/${project}-${level.id}-bottom.png` });

      await dragInto(page, level.ifBlock, 'start', null);
      const ifId = await page.evaluate((type) => {
        const { workspace } = (window as unknown as HookWindow).__cqPlay;
        const block = workspace.getBlocksByType(type, false).at(-1);
        if (!block) throw new Error(`no ${type}`);
        return block.id;
      }, level.ifBlock);
      await dragInto(page, level.sensor, ifId, 'COND');
      const plugged = await page.evaluate((id) => {
        const { workspace } = (window as unknown as HookWindow).__cqPlay;
        return workspace.getBlockById(id)?.getInput('COND')?.connection?.targetBlock()?.type;
      }, ifId);
      expect(plugged).toBe(level.sensor);
      await page.screenshot({ path: `${SHOTS}/${project}-${level.id}-dropped.png` });
    });

    test('the last toolbox block is reachable by the wheel over the scrollbar and by dragging the thumb', async ({
      page,
    }) => {
      await open(page, level.id);
      const start = await flyoutState(page);
      if (start.fits) return; // nothing to scroll on a tall window: all blocks are in view.

      // The wheel over the flyout's own scrollbar (it used to be swallowed).
      await page.mouse.move(start.right - 6, start.areaTop + start.areaHeight / 2);
      await page.mouse.wheel(0, 100);
      await expect.poll(async () => (await flyoutState(page)).top).toBeGreaterThan(0);
      // …and over the zero-height trashcan scrollbar on the flyout's left edge.
      await page.mouse.wheel(0, -5000);
      await expect.poll(async () => (await flyoutState(page)).top).toBe(0);
      await page.mouse.move(start.left + 4, start.areaTop + 40);
      await page.mouse.wheel(0, 10);
      await expect.poll(async () => (await flyoutState(page)).top).toBeGreaterThan(0);

      // Back to the top, then drag the thumb to the bottom of its track.
      await page.mouse.wheel(0, -5000);
      await expect.poll(async () => (await flyoutState(page)).top).toBe(0);
      const thumb = await page.evaluate(() => {
        const handle = [...document.querySelectorAll('.blocklyFlyoutScrollbar .blocklyScrollbarHandle')]
          .map((el) => el.getBoundingClientRect())
          .find((r) => r.height > 0);
        return handle ? { x: handle.x + handle.width / 2, y: handle.y + handle.height / 2 } : null;
      });
      expect(thumb).not.toBeNull();
      if (!thumb) return;
      await page.mouse.move(thumb.x, thumb.y);
      await page.mouse.down();
      await page.mouse.move(thumb.x, thumb.y + start.areaHeight, { steps: 10 });
      await page.mouse.up();
      const end = await flyoutState(page, level.last);
      expect(end.top).toBeGreaterThan(0);
      expect(end.below).toBeLessThanOrEqual(1);
    });
  });
}

// Real window sizes (browser chrome and Windows scaling take part of the screen): the flyout must
// either fit the whole toolbox or scroll to its last block, never hide it (the coach's 1913×875).
const WINDOWS = [
  [1913, 875],
  [1913, 860],
  [1913, 900],
  [1536, 730],
  [1440, 800],
] as const;
const W4_LEVELS = ['w04-l02', 'w04-l04', 'w04-l08', 'w04-l16', 'w04-boss'] as const;

test.describe('toolbox of Thế giới 4 on real window sizes', () => {
  for (const [width, height] of WINDOWS) {
    test(`${String(width)}×${String(height)}: every toolbox shows its last block`, async ({
      page,
    }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width, height });
      for (const id of W4_LEVELS) {
        await open(page, id);
        const state = await flyoutState(page);
        // Tall windows need no scrolling at all.
        if (width === 1913) expect(state.fits, `${id} fits`).toBe(true);
        // Wheel over a block, then over the background, reaches the last block.
        await wheelTo(page).catch((e: unknown) => {
          throw new Error(`${id}: ${String(e)} ${JSON.stringify(state)}`);
        });
        expect((await flyoutState(page)).below, `${id} last block`).toBeLessThanOrEqual(0);
        await page.mouse.wheel(0, -5000);
        await expect.poll(async () => (await flyoutState(page)).top).toBe(0);
      }
    });
  }

  test('resizing the window refits the flyout', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await open(page, 'w04-l08');
    await page.setViewportSize({ width: 1913, height: 875 });
    await expect.poll(async () => (await flyoutState(page)).fits).toBe(true);
    await page.setViewportSize({ width: 1280, height: 720 });
    await wheelTo(page);
    expect((await flyoutState(page)).below).toBeLessThanOrEqual(0);
  });
});
