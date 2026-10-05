import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import type * as BlocklyModule from 'blockly';
import { signInTestProfile } from './helpers';

// P2-11a / P2-11c web acceptance (docs/roadmap/phase-2.md): Thế giới 4 levels with the new
// blocks. A child builds "lặp { nếu phía trước có hố thì nhảy, nếu không thì đi }" with the mouse
// on w04-l02 and wins both maps while the question block lights ✔/✘; the dev-only _sandbox level
// runner-until shows the step pointer, a loop that never stops (TIMEOUT: Măng dizzy), an empty
// question slot (EMPTY_CONDITION) and the "no loop in a loop" drop guard (maxLoopDepth); the
// mission items of w04-l17 (keys), w04-boss (key + cage) and the "Khối mới" lessons of Thế giới 4.

/** Screenshots for the PR go to SHOTS_DIR when set (the AI's scratchpad), else test-results. */
const SHOTS = process.env['SHOTS_DIR'] ?? 'test-results/play-conditions';
const W4 = 'w04-nga-ba-quyet-dinh';

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(new URL(`../../../content/${path}`, import.meta.url), 'utf8'));
const shared = readJson('shared/feedback.json') as Record<string, string>;
const solutionOf = (path: string): unknown => (readJson(path) as { solution: unknown }).solution;

interface PlayHook {
  Blockly: typeof BlocklyModule;
  workspace: BlocklyModule.WorkspaceSvg;
  senses: string[];
}
type HookWindow = Window & { __cqPlay: PlayHook };

type Block = { type: string; id: string; [key: string]: unknown };

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

/** A regex for a feedback line, or the level's tier-0 tip that may replace it right after. */
const lineOr = (reason: string, tip?: string): RegExp => {
  const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const line = escape(shared[reason] ?? reason);
  return new RegExp(tip === undefined ? `^${line}$` : `${line}|${escape(tip)}`);
};

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

async function open(page: Page, levelId: string): Promise<void> {
  await signInTestProfile(page);
  await page.goto(`/play/${levelId}`);
  await expect(page.getByTestId('play-stage')).toHaveAttribute('data-ready', 'true', {
    timeout: 30_000,
  });
  await expect(page.getByTestId('play-stage').locator('canvas')).toHaveCount(1);
  await page.waitForFunction(
    () => (window as unknown as Partial<HookWindow>).__cqPlay !== undefined,
  );
  // A level with star goals opens its card first; none of these do.
  await expect(page.getByTestId('star-goals-open')).toHaveCount(0);
}

async function setProgram(page: Page, json: unknown): Promise<void> {
  await page.evaluate((workspaceJson) => {
    const { Blockly, workspace } = (window as unknown as HookWindow).__cqPlay;
    workspace.clear();
    Blockly.serialization.workspaces.load(workspaceJson as object, workspace);
  }, json);
}

/** The program under "khi bắt đầu" as nested `type(INPUT: …)` text, for structure checks. */
async function programShape(page: Page): Promise<string> {
  return page.evaluate(() => {
    const { workspace } = (window as unknown as HookWindow).__cqPlay;
    const shape = (block: BlocklyModule.Block | null): string => {
      const out: string[] = [];
      for (let b = block; b; b = b.getNextBlock()) {
        const inputs = b.inputList
          .filter((input) => input.connection?.targetBlock())
          .map((input) => `${input.name}:${shape(input.connection?.targetBlock() ?? null)}`);
        out.push(inputs.length > 0 ? `${b.type}(${inputs.join(' ')})` : b.type);
      }
      return out.join(',');
    };
    const start = workspace.getBlocksByType('cq_start', false)[0];
    return shape(start?.getNextBlock() ?? null);
  });
}

/**
 * Drags block `type` from the toolbox with the real mouse so that its top (or, for a question,
 * its left plug) lands on `input` of block `targetId` (`null` = under it). The drop point is
 * worked out from Blockly's own connection positions, like a child aiming at the slot.
 */
async function dragInto(
  page: Page,
  type: string,
  targetId: string,
  input: string | null,
): Promise<void> {
  // Scroll the toolbox until the block is in view (the "nếu" blocks sit below the fold).
  for (let tries = 0; tries < 12; tries++) {
    const view = await page.evaluate((blockType) => {
      const { workspace } = (window as unknown as HookWindow).__cqPlay;
      const flyout = workspace.getFlyout();
      const source = flyout
        ?.getWorkspace()
        .getTopBlocks(false)
        .find((block) => block.type === blockType);
      const area = document.querySelector('.blocklyFlyout')?.getBoundingClientRect();
      const box = source?.getSvgRoot().getBoundingClientRect();
      if (!area || !box) throw new Error(`no ${blockType} in the toolbox`);
      return {
        below: box.y + 30 > area.bottom,
        above: box.y < area.top,
        x: area.x + area.width / 2,
        y: area.y + area.height / 2,
      };
    }, type);
    if (!view.below && !view.above) break;
    await page.mouse.move(view.x, view.y);
    await page.mouse.wheel(0, view.below ? 120 : -120);
    await page.waitForTimeout(50);
  }
  const points = await page.evaluate(
    async ([blockType, parentId, inputName]) => {
      const { Blockly, workspace } = (window as unknown as HookWindow).__cqPlay;
      // Connection positions are only right once the last drop has been rendered.
      await Blockly.renderManagement.finishQueuedRenders();
      const flyout = workspace.getFlyout()?.getWorkspace();
      const source = flyout
        ?.getTopBlocks(false)
        .find((block) => block.type === blockType);
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
  // Blockly picks the snap target on a later frame: settle before letting go.
  await page.waitForTimeout(120);
  await page.mouse.move(points.drop.x + 1, points.drop.y + 1);
  await page.waitForTimeout(120);
  await page.mouse.up();
  // The drop (and its snap) is done when no block is being dragged any more.
  await page.waitForFunction(
    () => !(window as unknown as HookWindow).__cqPlay.Blockly.Gesture.inProgress(),
  );
}

/** Id of the newest block of `type` in the workspace (one just dropped). */
async function lastBlockId(page: Page, type: string): Promise<string> {
  return page.evaluate((blockType) => {
    const { workspace } = (window as unknown as HookWindow).__cqPlay;
    const blocks = workspace.getBlocksByType(blockType, false);
    const block = blocks.at(-1);
    if (!block) throw new Error(`no ${blockType}`);
    return block.id;
  }, type);
}

/** Whether every program block is inside the visible workspace (right of the toolbox). */
async function programInView(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const { workspace } = (window as unknown as HookWindow).__cqPlay;
    const area = workspace.getParentSvg().getBoundingClientRect();
    const flyout = document.querySelector('.blocklyFlyout')?.getBoundingClientRect();
    const left = flyout ? flyout.right : area.left;
    return workspace.getTopBlocks(false).every((block) => {
      const box = (block).getSvgRoot().getBoundingClientRect();
      return box.left >= left - 1 && box.right <= area.right + 1;
    });
  });
}

const senses = (page: Page): Promise<string[]> =>
  page.evaluate(() => [...(window as unknown as HookWindow).__cqPlay.senses]);

const canvasData = (page: Page, name: string) =>
  page.getByTestId('play-stage').locator('canvas').getAttribute(`data-${name}`);

test.describe('Thế giới 4: nếu, nếu … nếu không, câu hỏi sáng ✔/✘', () => {
  test('w04-l02: build if/else with the mouse, the question lights ✔/✘, both maps won', async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    const project = testInfo.project.name;
    await open(page, 'w04-l02');
    const stage = page.getByTestId('play-stage');
    // The toolbox has its groups, the question group named for children ("câu hỏi").
    await expect(page.locator('.cq-flyout-label')).toContainText(['ĐIỀU KIỆN', 'CÂU HỎI']);

    // lặp 10 lần { nếu phía trước có hố thì nhảy, nếu không thì đi }, block by block.
    await dragInto(page, 'cq_repeat', 'start', null);
    const loop = await lastBlockId(page, 'cq_repeat');
    await dragInto(page, 'cq_if_else', loop, 'DO');
    const ifElse = await lastBlockId(page, 'cq_if_else');
    // An empty question slot reads as a hole to plug into (dashed outline).
    await expect(page.locator('.cq-blockly .blocklyOutlinePath').first()).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/${project}-l02-empty-slot.png` });
    await dragInto(page, 'runner_is_ahead', ifElse, 'COND');
    await dragInto(page, 'runner_jump', ifElse, 'DO');
    await dragInto(page, 'runner_walk', ifElse, 'ELSE');
    await expect
      .poll(() => programShape(page))
      .toBe('cq_repeat(DO:cq_if_else(COND:runner_is_ahead DO:runner_jump ELSE:runner_walk))');

    // Watch a question being asked, step by step: the answer stays lit while the replay waits.
    await page.getByTestId('play-step').click();
    await expect(stage).toHaveAttribute('data-waiting-step', 'true', { timeout: 15_000 });
    await page.keyboard.press('s');
    await expect(page.locator('.cq-blockly [data-sense]')).toHaveCount(1);
    await expect(stage).toHaveAttribute('data-waiting-step', 'true');
    const answer = await page.locator('.cq-blockly [data-sense]').getAttribute('data-sense');
    expect(['yes', 'no']).toContain(answer);
    await expect(page.locator('.cq-blockly .cq-sense-badge')).toHaveCount(1);
    await page.screenshot({ path: `${SHOTS}/${project}-l02-question-lit.png` });
    await page.keyboard.press('r');
    await expect(page.locator('.cq-blockly [data-sense]')).toHaveCount(0);

    await page.getByTestId('play-run').click();
    await page.getByRole('radio', { name: 'Nhanh' }).click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 60_000 });
    for (const n of [1, 2]) {
      await expect(page.getByTestId(`map-tab-${String(n)}`)).toHaveAttribute('data-result', 'won');
    }
    // Asked every pass: ✔ before each hole, ✘ elsewhere; the mark is gone after the run.
    const asked = await senses(page);
    expect(asked.some((s) => s.endsWith(':yes'))).toBe(true);
    expect(asked.some((s) => s.endsWith(':no'))).toBe(true);
    await expect(page.locator('.cq-blockly [data-sense]')).toHaveCount(0);
    await expect(stage).toHaveAttribute('data-map', '2');
    await page.screenshot({ path: `${SHOTS}/${project}-l02-won.png` });
  });
});

test.describe('_sandbox runner-until: lặp đến khi, Từng bước, giới hạn', () => {
  const LEVEL = 'runner-until';

  test('the step hint points at Từng bước; step mode stops before every question', async ({
    page,
  }, testInfo) => {
    await open(page, LEVEL);
    const stage = page.getByTestId('play-stage');
    // Tier-0 "enter" hint with point "step": the Từng bước button pulses (P2-11 T10).
    await expect(page.getByTestId('play-bubble')).toHaveText('Bấm Từng bước, xem câu hỏi sáng xanh hay đỏ.');
    await expect(page.getByTestId('play-step')).toHaveAttribute('data-hint-target', 'true');
    await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-step-pointer.png` });

    await setProgram(page, solutionOf(`worlds/_sandbox/levels/${LEVEL}.json`));
    await page.getByTestId('play-step').click();
    // "lặp đến khi" lights up, then the replay waits before asking "đã tới nơi?".
    await expect(stage).toHaveAttribute('data-waiting-step', 'true', { timeout: 10_000 });
    await expect(page.locator('.cq-blockly [data-sense]')).toHaveCount(0);
    await page.keyboard.press('s');
    // Asked: not there yet (✘); it stays lit while the replay waits for the next step.
    await expect(page.locator('.cq-blockly [data-sense="no"]')).toHaveCount(1);
    await expect(stage).toHaveAttribute('data-waiting-step', 'true');
    expect(await senses(page)).toEqual(['goal1:no']);
    await page.keyboard.press('s');
    // Then "phía trước có hố?" is asked (✘ on the first cell).
    await expect.poll(() => senses(page)).toEqual(['goal1:no', 'ask1:no']);
    await expect(page.locator('.cq-blockly [data-sense="no"]')).toHaveCount(1);
    await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-step-question.png` });
  });

  test('a loop that never stops: a short replay, then Măng is dizzy (TIMEOUT)', async ({
    page,
  }, testInfo) => {
    await open(page, LEVEL);
    const stage = page.getByTestId('play-stage');
    // lặp đến khi đã tới nơi { } : never asks anything that moves Măng.
    await setProgram(
      page,
      program({
        type: 'cq_repeat_until',
        id: 'until',
        inputs: { COND: { block: { type: 'runner_at_goal', id: 'goal' } } },
      }),
    );
    await page.getByTestId('play-run').click();
    await expect(stage).toHaveAttribute('data-phase', 'fail', { timeout: 20_000 });
    await expect(page.getByTestId('play-bubble')).toHaveText(lineOr('TIMEOUT'));
    expect(await canvasData(page, 'dizzy')).toBe('true');
    // About 3 s of replay, never the 1 000 questions of the log.
    const asked = await senses(page);
    expect(asked.length).toBeGreaterThan(3);
    expect(asked.length).toBeLessThan(20);
    expect(asked.every((s) => s === 'goal:no')).toBe(true);
    await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-timeout-dizzy.png` });
    // Làm lại: no longer dizzy.
    await page.keyboard.press('r');
    await expect.poll(() => canvasData(page, 'dizzy')).toBe('false');
  });

  test('an empty question slot does not run: Măng says so and the block shakes', async ({
    page,
  }, testInfo) => {
    await open(page, LEVEL);
    await setProgram(
      page,
      program(
        { type: 'cq_if', id: 'if1', inputs: { DO: { block: { type: 'runner_jump', id: 'j' } } } },
        { type: 'runner_walk', id: 'w' },
      ),
    );
    await page.getByTestId('play-run').click();
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-phase', 'fail', {
      timeout: 15_000,
    });
    await expect(page.getByTestId('play-bubble')).toHaveText(lineOr('EMPTY_CONDITION'));
    const shaken = await page.evaluate(() => {
      const { workspace } = (window as unknown as HookWindow).__cqPlay;
      const block = workspace.getBlockById('if1');
      return block?.getSvgRoot().classList.contains('cq-shake') ?? false;
    });
    expect(shaken).toBe(true);
    await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-empty-condition.png` });
  });

  test('maxLoopDepth 1: a loop dropped into a loop is refused', async ({
    page,
  }, testInfo) => {
    await open(page, LEVEL);
    await setProgram(
      page,
      program({
        type: 'cq_repeat',
        id: 'outer',
        fields: { TIMES: 3 },
        inputs: { DO: { block: { type: 'runner_walk', id: 'w' } } },
      }),
    );
    await dragInto(page, 'cq_repeat', 'outer', 'DO');
    await expect(page.getByTestId('play-bubble')).toHaveText(
      'Màn này đừng đặt khối lặp trong khối lặp nhé!',
    );
    // The drop is undone: the new loop went back to the toolbox, the program is unchanged.
    expect(await programShape(page)).toBe('cq_repeat(DO:runner_walk)');
    const loops = await page.evaluate(() => {
      const { workspace } = (window as unknown as HookWindow).__cqPlay;
      return workspace.getBlocksByType('cq_repeat', false).length;
    });
    expect(loops).toBe(1);
    await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-loop-depth-refused.png` });

    // A loop after the loop (not inside) is fine.
    await dragInto(page, 'cq_repeat', 'outer', null);
    expect(await programShape(page)).toBe('cq_repeat(DO:runner_walk),cq_repeat');
  });
});

test.describe('nhiệm vụ: chìa khóa, lồng (P2-11c)', () => {
  test('w04-l17: keys on every map, picked up into the HUD, the goal opens', async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    const project = testInfo.project.name;
    await open(page, 'w04-l17');
    const stage = page.getByTestId('play-stage');
    expect(await canvasData(page, 'runner-items')).toBe('0/2');
    expect(await canvasData(page, 'runner-goal')).toBe('locked');
    // The full-track strip and "Xem cả đường" draw the keys too.
    await expect(page.getByTestId('track-strip').locator('[data-item="key"]')).toHaveCount(2);
    await page.getByTestId('plan-open').click();
    await expect(page.getByTestId('plan-view').locator('[data-item="key"]')).toHaveCount(2);
    await page.screenshot({ path: `${SHOTS}/${project}-l17-plan-keys.png` });
    await page.keyboard.press('Escape');

    await setProgram(page, solutionOf(`worlds/${W4}/levels/w04-l17.json`));
    await page.getByTestId('play-run').click();
    // The first key is on cell 3: picked up on map 1.
    await expect.poll(() => canvasData(page, 'runner-items'), { timeout: 20_000 }).toBe('1/2');
    await expect(page.getByTestId('track-strip').locator('[data-item="key"]')).toHaveCount(1);
    await page.getByTestId('play-pause').click();
    await page.screenshot({ path: `${SHOTS}/${project}-l17-first-key.png` });
    await page.getByTestId('play-pause').click();
    await page.getByRole('radio', { name: 'Nhanh' }).click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 90_000 });
    await expect(stage).toHaveAttribute('data-map', '3');
    expect(await canvasData(page, 'runner-items')).toBe('1/1');
    expect(await canvasData(page, 'runner-goal')).toBe('open');
  });

  test('w04-boss: no key → NEED_KEY at the closed cage; the key opens it', async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    const project = testInfo.project.name;
    await open(page, 'w04-boss');
    const stage = page.getByTestId('play-stage');
    await expect(stage).toHaveAttribute('data-goal-sprite', 'cage');
    expect(await canvasData(page, 'maze-items')).toBe('0/1');
    expect(await canvasData(page, 'maze-goal')).toBe('locked');
    await page.screenshot({ path: `${SHOTS}/${project}-boss-start.png` });

    // lặp 12 { nếu có đường phía trước thì tiến, nếu không thì rẽ phải }: passes the key's lane.
    await setProgram(
      page,
      program({
        type: 'cq_repeat',
        id: 'r',
        fields: { TIMES: 12 },
        inputs: {
          DO: {
            block: {
              type: 'cq_if_else',
              id: 'ie',
              inputs: {
                COND: { block: { type: 'maze_is_path', id: 'ask', fields: { DIR: 'AHEAD' } } },
                DO: { block: { type: 'maze_forward', id: 'f' } },
                ELSE: { block: { type: 'maze_turn_right', id: 'rt' } },
              },
            },
          },
        },
      }),
    );
    await page.getByRole('radio', { name: 'Nhanh' }).click();
    await page.getByTestId('play-run').click();
    await expect(stage).toHaveAttribute('data-phase', 'fail', { timeout: 60_000 });
    await expect(page.getByTestId('play-bubble')).toHaveText(
      lineOr('NEED_KEY', 'Chìa khóa ở ngõ bên trái của Măng. Hỏi bên nào trước?'),
    );
    expect(await canvasData(page, 'maze-need')).toBe('true');
    expect(await canvasData(page, 'maze-goal')).toBe('locked');
    expect(await canvasData(page, 'maze-collected')).toBe('0/0');
    await page.screenshot({ path: `${SHOTS}/${project}-boss-need-key.png` });

    await setProgram(page, solutionOf(`worlds/${W4}/levels/w04-boss.json`));
    // The 8-block program is wider than the workspace at the start zoom: it is zoomed to fit,
    // so the whole program shows between the toolbox and the right edge.
    await expect.poll(() => programInView(page)).toBe(true);
    await page.screenshot({ path: `${SHOTS}/${project}-boss-program-fits.png` });
    await page.getByTestId('play-run').click();
    await expect.poll(() => canvasData(page, 'maze-items'), { timeout: 30_000 }).toBe('1/1');
    expect(await canvasData(page, 'maze-goal')).toBe('open');
    await page.getByTestId('play-pause').click();
    await page.screenshot({ path: `${SHOTS}/${project}-boss-key-cage-open.png` });
    await page.getByTestId('play-pause').click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 90_000 });
  });
});

test.describe('bài "Khối mới" của Thế giới 4', () => {
  async function runDemo(page: Page): Promise<void> {
    const demo = page.getByTestId('lesson-demo');
    await expect(demo.locator('[data-ready="true"]')).toBeVisible({ timeout: 30_000 });
    await page.getByTestId('lesson-demo-run').click();
    await expect(demo.locator('[data-phase="done"]')).toBeVisible({ timeout: 30_000 });
  }

  async function openLesson(page: Page, lessonId: string): Promise<void> {
    await page.goto(`/w/${W4}/lesson/${lessonId}`);
    await expect(page.getByTestId('lesson-next')).toBeVisible({ timeout: 30_000 });
  }

  test('nếu, nếu … nếu không, có đường: every demo runs and its question lights up', async ({
    page,
  }, testInfo) => {
    test.setTimeout(150_000);
    await signInTestProfile(page);
    for (const lesson of ['w04-lesson-neu', 'w04-lesson-neu-khong', 'w04-lesson-co-duong']) {
      await openLesson(page, lesson);
      const { cards } = readJson(`worlds/${W4}/lessons/${lesson}.json`) as {
        cards: Array<{ type: string }>;
      };
      let demoNumber = 0;
      for (const [index, card] of cards.entries()) {
        if (index > 0) await page.getByTestId('lesson-next').click();
        if (card.type !== 'demo') continue;
        demoNumber += 1;
        const lit = page.waitForSelector('[data-testid="lesson-demo"] [data-sense]', {
          timeout: 30_000,
        });
        await runDemo(page);
        await lit;
        await page.screenshot({
          path: `${SHOTS}/${testInfo.project.name}-${lesson}-demo${String(demoNumber)}.png`,
        });
      }
      expect(demoNumber).toBeGreaterThan(0);
    }
  });

  test('chìa khóa: standing on the key picks it up; jumping over it leaves the goal locked', async ({
    page,
  }, testInfo) => {
    await signInTestProfile(page);
    await openLesson(page, 'w04-lesson-chia-khoa');
    const demoCanvas = page.getByTestId('lesson-demo').locator('canvas');
    await page.getByTestId('lesson-next').click();
    await runDemo(page);
    await expect(demoCanvas).toHaveAttribute('data-runner-items', '1/1');
    await expect(demoCanvas).toHaveAttribute('data-runner-goal', 'open');
    await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-chia-khoa-picked.png` });
    await page.getByTestId('lesson-next').click();
    await runDemo(page);
    await expect(page.getByTestId('lesson-demo').locator('[data-result]')).toHaveAttribute(
      'data-result',
      'incomplete',
    );
    await expect(demoCanvas).toHaveAttribute('data-runner-items', '0/1');
    await expect(demoCanvas).toHaveAttribute('data-runner-goal', 'locked');
    await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-chia-khoa-need-key.png` });
  });
});
