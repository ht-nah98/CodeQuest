import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import type * as BlocklyModule from 'blockly';
import { signInTestProfile } from './helpers';

// P3-09 web acceptance (ADR-0022 §6, docs/roadmap/phase-3.md): boxes ("hộp") on the dev-only
// _sandbox levels maze-boxes (count bamboo, countGoal 2 / 4, max 4), robotlab-boxes (lặp [số
// khối] lần, start 2 / 3), maze-box-predict (keys with #bamboo=n) and lesson lesson-boxes (a
// demo card with variables). The box panel mirrors itself as data-* on [data-testid=var-box].

const SHOTS = process.env['SHOTS_DIR'] ?? 'test-results/variables';

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(new URL(`../../../content/${path}`, import.meta.url), 'utf8'));
const sandbox = (id: string) =>
  readJson(`worlds/_sandbox/levels/${id}.json`) as {
    solution: unknown;
    predict?: { options: Array<{ key: string; label: string }> };
  };
const feedback = readJson('shared/feedback.json') as Record<string, string>;

interface PlayHook {
  Blockly: typeof BlocklyModule;
  workspace: BlocklyModule.WorkspaceSvg;
  vars: string[];
  highlights: string[];
  answerKey?: string;
  reasonCode?: string | null;
}
type HookWindow = Window & { __cqPlay: PlayHook };

type Block = {
  type: string;
  id: string;
  fields?: Record<string, unknown>;
  inputs?: Record<string, { block: Block }>;
};

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

/**
 * Drags block `type` from the toolbox with the real mouse so that its top (or a question's left
 * plug) lands on `input` of block `targetId` (`null` = under it), like play-conditions.spec.ts.
 */
async function dragInto(
  page: Page,
  type: string,
  targetId: string,
  input: string | null,
): Promise<void> {
  for (let tries = 0; tries < 12; tries++) {
    const view = await page.evaluate((blockType) => {
      const { workspace } = (window as unknown as HookWindow).__cqPlay;
      const source = workspace
        .getFlyout()
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

/** Id of the newest block of `type` in the workspace (one just dropped). */
async function lastBlockId(page: Page, type: string): Promise<string> {
  return page.evaluate((blockType) => {
    const { workspace } = (window as unknown as HookWindow).__cqPlay;
    const block = workspace.getBlocksByType(blockType, false).at(-1);
    if (!block) throw new Error(`no ${blockType}`);
    return block.id;
  }, type);
}

/** Clicks a number field with the mouse and types a new value with the keyboard. */
async function typeField(page: Page, blockId: string, field: string, value: string) {
  const box = await page.evaluate(
    ([id, name]) => {
      const { workspace } = (window as unknown as HookWindow).__cqPlay;
      const target = workspace.getBlockById(id)?.getField(name)?.getSvgRoot();
      const rect = target?.getBoundingClientRect();
      if (!rect) throw new Error(`no field ${name} on ${id}`);
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    },
    [blockId, field] as const,
  );
  await page.mouse.click(box.x, box.y);
  const editor = page.locator('.blocklyHtmlInput');
  await expect(editor).toBeVisible();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type(value);
  await page.keyboard.press('Enter');
  await expect(editor).toHaveCount(0);
}

const box = (page: Page, id: string) => page.locator(`[data-testid="var-box"][data-var="${id}"]`);
const stage = (page: Page) => page.getByTestId('play-stage');
const shot = (page: Page, name: string, project: string) =>
  page.screenshot({ path: `${SHOTS}/${project}-${name}.png` });

const RUN_MS = 40_000;

test.describe('boxes (hộp, ADR-0022)', () => {
  test.describe.configure({ timeout: 120_000 });

  test('@smoke maze-boxes: build a counting program by mouse, the box counts each map', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'maze-boxes');
    // The panel: one crate "số măng" holding 0 of 4; the objective says how many map 1 needs.
    await expect(page.getByTestId('var-boxes')).toBeVisible();
    await expect(box(page, 'bamboo')).toHaveAttribute('data-value', '0');
    await expect(box(page, 'bamboo')).toHaveAttribute('data-max', '4');
    await expect(box(page, 'bamboo')).toContainText('số măng');
    await expect(box(page, 'bamboo')).toContainText('0/4');
    await expect(page.getByTestId('play-count-goal')).toHaveText('Đếm đúng: 2');
    // The flyout: a "HỘP" group, and the box blocks name the level's box, not its id.
    await expect(page.locator('.cq-flyout-label', { hasText: 'HỘP' })).toHaveCount(1);
    const flyoutNames = await page.evaluate(() => {
      const { workspace } = (window as unknown as HookWindow).__cqPlay;
      return (workspace.getFlyout()?.getWorkspace().getTopBlocks(false) ?? [])
        .filter((block) => block.type.startsWith('cq_var_'))
        .map((block) => block.getField('VAR')?.getText());
    });
    expect(flyoutNames).toEqual(['số măng', 'số măng']);

    // Build: lặp 6 { nếu phía trước có măng? { tăng số măng thêm 1 } ; đi tới }.
    await dragInto(page, 'cq_repeat', 'start', null);
    const loop = await lastBlockId(page, 'cq_repeat');
    await dragInto(page, 'cq_if', loop, 'DO');
    const branch = await lastBlockId(page, 'cq_if');
    await dragInto(page, 'maze_bamboo_ahead', branch, 'COND');
    await dragInto(page, 'cq_var_add', branch, 'DO');
    await dragInto(page, 'maze_forward', branch, null);
    await typeField(page, loop, 'TIMES', '6');
    const added = await lastBlockId(page, 'cq_var_add');
    expect(
      await page.evaluate((id) => {
        const { workspace } = (window as unknown as HookWindow).__cqPlay;
        return workspace.getBlockById(id)?.getField('VAR')?.getText();
      }, added),
    ).toBe('số măng');
    await page.mouse.move(5, 5);
    await shot(page, 'built', project);

    // Slow, so the panel is caught mid-run; Space runs (the app's own key).
    await page.getByRole('radio', { name: 'Chậm' }).click();
    await stage(page).focus();
    await page.keyboard.press('Space');
    await expect(stage(page)).toHaveAttribute('data-phase', 'running');
    await expect(box(page, 'bamboo')).toHaveAttribute('data-value', '1', { timeout: RUN_MS });
    await expect(box(page, 'bamboo')).toHaveAttribute('data-state', 'add');
    await shot(page, 'counting', project);
    // Map 2 starts its box at 0 again and counts to 4.
    await expect(stage(page)).toHaveAttribute('data-map', '2', { timeout: RUN_MS });
    await page.getByRole('radio', { name: 'Nhanh' }).click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: RUN_MS });
    const vars = await page.evaluate(() => (window as unknown as HookWindow).__cqPlay.vars);
    expect(vars).toEqual(['bamboo=1', 'bamboo=2', 'bamboo=1', 'bamboo=2', 'bamboo=3', 'bamboo=4']);
    await expect(box(page, 'bamboo')).toHaveAttribute('data-value', '4');
    await expect(box(page, 'bamboo')).toHaveAttribute('data-verdict', 'ok');
    await expect(page.getByTestId('play-count-goal')).toHaveText('Đếm đúng: 4');
    await shot(page, 'won', project);

    // Chơi lại → Làm lại: the box is back at map 2's start; tab 1 shows map 1's start.
    await page.getByTestId('play-success').getByRole('button', { name: 'Chơi lại' }).click();
    await expect(box(page, 'bamboo')).toHaveAttribute('data-value', '0');
    await page.getByTestId('map-tab-1').click();
    await expect(box(page, 'bamboo')).toHaveAttribute('data-value', '0');
    await expect(page.getByTestId('play-count-goal')).toHaveText('Đếm đúng: 2');
  });

  test('maze-boxes: counting every cell fills the box (BOX_FULL), a wrong count is WRONG_COUNT', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'maze-boxes');
    // The misconception: tăng on every step, bamboo or not. Map 1 has 6 steps, the box holds 4.
    const loop = (body: Block): Block => ({
      type: 'cq_repeat',
      id: 'loop',
      fields: { TIMES: 6 },
      inputs: { DO: { block: body } },
    });
    await setProgram(
      page,
      program(
        loop({
          type: 'cq_var_add',
          id: 'add',
          fields: { VAR: 'bamboo', NUM: 1 },
          next: { block: { type: 'maze_forward', id: 'fwd' } },
        } as Block),
      ),
    );
    await page.getByTestId('play-run').click();
    await expect(stage(page)).toHaveAttribute('data-phase', 'fail', { timeout: RUN_MS });
    await expect(box(page, 'bamboo')).toHaveAttribute('data-state', 'full');
    await expect(box(page, 'bamboo')).toHaveAttribute('data-value', '4');
    await expect(box(page, 'bamboo')).toContainText('Đầy!');
    await expect(page.getByTestId('play-bubble')).toContainText(feedback['BOX_FULL'] ?? '');
    const vars = await page.evaluate(() => (window as unknown as HookWindow).__cqPlay.vars);
    expect(vars.at(-1)).toBe('bamboo=4!');
    // The tăng block that overflowed shakes.
    await expect(page.locator('.cq-shake')).toHaveCount(1);
    await shot(page, 'box-full', project);

    // Làm lại (R) empties the box and clears the red.
    await stage(page).focus();
    await page.keyboard.press('KeyR');
    await expect(box(page, 'bamboo')).toHaveAttribute('data-value', '0');
    await expect(box(page, 'bamboo')).toHaveAttribute('data-state', 'idle');

    // Walking to the goal without counting: the box still holds 0, not 2.
    await setProgram(page, program(loop({ type: 'maze_forward', id: 'fwd' })));
    await page.getByTestId('play-run').click();
    await expect(stage(page)).toHaveAttribute('data-phase', 'fail', { timeout: RUN_MS });
    expect(await page.evaluate(() => (window as unknown as HookWindow).__cqPlay.reasonCode)).toBe(
      'WRONG_COUNT',
    );
    // Lost on map 1, which stays on the stage: its box held 0 and says what it needed.
    await expect(stage(page)).toHaveAttribute('data-map', '1');
    await expect(box(page, 'bamboo')).toHaveAttribute('data-value', '0');
    await expect(box(page, 'bamboo')).toHaveAttribute('data-verdict', 'need');
    await expect(page.getByTestId('var-box-verdict')).toHaveAttribute('data-need', '2');
    await expect(page.getByTestId('var-box-verdict')).toContainText('cần 2');
    await expect(page.getByTestId('play-bubble')).toContainText(
      new RegExp(`${feedback['WRONG_COUNT'] ?? ''}|tăng hộp`),
    );
    await shot(page, 'wrong-count', project);
  });

  test('maze-boxes step mode: the box changes one tăng at a time and waits with the step', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'maze-boxes');
    await setProgram(page, sandbox('maze-boxes').solution);
    await stage(page).focus();
    const waiting = () =>
      expect(stage(page)).toHaveAttribute('data-waiting-step', 'true', { timeout: RUN_MS });
    const value = async () => Number(await box(page, 'bamboo').getAttribute('data-value'));
    // S starts the run in step mode; every S then acts out one more block (or question, or box).
    let seen = 0;
    for (let presses = 0; presses < 80 && seen < 2; presses++) {
      await page.keyboard.press('KeyS');
      await waiting();
      const now = await value();
      // Never more than one box change per step.
      expect(now - seen).toBeGreaterThanOrEqual(0);
      expect(now - seen).toBeLessThanOrEqual(1);
      if (now === seen) continue;
      seen = now;
      // The change came from the tăng block, the one lit just before this wait's block.
      const lit = await page.evaluate(() => (window as unknown as HookWindow).__cqPlay.highlights);
      expect(lit.slice(-2)).toContain('b2');
      expect(
        await page.evaluate(() => (window as unknown as HookWindow).__cqPlay.vars.at(-1)),
      ).toBe(`bamboo=${String(now)}`);
      // Waiting for the next step: nothing moves on its own.
      await page.waitForTimeout(1200);
      await expect(stage(page)).toHaveAttribute('data-waiting-step', 'true');
      expect(await value()).toBe(now);
      if (now === 1) await shot(page, 'step-1', project);
    }
    expect(seen).toBe(2);
    // The live region read the step's change out.
    await expect(page.getByTestId('var-boxes-live')).toHaveText('số măng: 2, tối đa 4');
  });

  test('robotlab-boxes: each map starts the box at its own number; lặp [hộp] lần wins', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'robotlab-boxes');
    await expect(box(page, 'order')).toHaveAttribute('data-value', '2');
    await expect(box(page, 'order')).toContainText('2/9');
    await expect(page.getByTestId('play-count-goal')).toHaveCount(0);
    await page.getByTestId('map-tab-2').click();
    await expect(box(page, 'order')).toHaveAttribute('data-value', '3');
    await shot(page, 'robot-map2', project);
    await page.getByTestId('map-tab-1').click();
    await expect(box(page, 'order')).toHaveAttribute('data-value', '2');

    await setProgram(page, sandbox('robotlab-boxes').solution);
    const label = await page.evaluate(() => {
      const { workspace } = (window as unknown as HookWindow).__cqPlay;
      return workspace.getBlocksByType('cq_repeat_var', false)[0]?.getField('VAR')?.getText();
    });
    expect(label).toBe('số khối');
    await page.getByRole('radio', { name: 'Nhanh' }).click();
    await page.getByTestId('play-run').click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 60_000 });
    // lặp [hộp] lần only reads the box: no change, the map shown keeps its start.
    await expect(box(page, 'order')).toHaveAttribute('data-value', '3');
  });

  test('maze-box-predict: cards show a box badge; the right card replays the count', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'maze-box-predict');
    const cards = page.getByTestId('predict-card');
    await expect(cards).toHaveCount(3);
    await expect(cards.locator('[data-testid="var-badge"]')).toHaveCount(3);
    await expect(
      page.locator('[data-key="win#bamboo=3"] [data-testid="var-badge"]'),
    ).toHaveAttribute('data-value', '3');
    await expect(
      page.locator('[data-key="win#bamboo=3"] [data-testid="var-badge"]'),
    ).toHaveAttribute('title', 'hộp số măng: 3');
    // The program's box blocks name the box too (read-only workspace).
    expect(
      await page.evaluate(() => {
        const { workspace, answerKey } = (window as unknown as HookWindow).__cqPlay;
        return [workspace.getBlockById('add1')?.getField('VAR')?.getText(), answerKey];
      }),
    ).toEqual(['số măng', 'win#bamboo=3']);
    await expect(box(page, 'bamboo')).toHaveAttribute('data-value', '0');
    await page.getByTestId('predict-cards').screenshot({
      path: `${SHOTS}/${project}-predict-cards.png`,
    });

    await page.locator('[data-key="win#bamboo=3"]').click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: RUN_MS });
    await expect(box(page, 'bamboo')).toHaveAttribute('data-value', '3');
  });

  test('lesson-boxes: a demo card with boxes runs with the box panel', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await signInTestProfile(page);
    await page.goto('/w/_sandbox/lesson/lesson-boxes');
    await expect(page.getByTestId('lesson-card')).toHaveAttribute('data-card', '0');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('lesson-card')).toHaveAttribute('data-card', '1');
    const demo = page.getByTestId('lesson-demo');
    await expect(demo.locator('[data-ready="true"]')).toBeVisible({ timeout: 30_000 });
    await expect(demo.getByTestId('var-box')).toHaveAttribute('data-value', '0');
    await expect(demo.getByTestId('var-box')).toContainText('số măng');
    // The demo's blocks say the box's name.
    await expect(demo.locator('.blocklyText', { hasText: 'số măng' })).toHaveCount(1);
    await page.getByTestId('lesson-demo-run').click();
    await expect(demo.getByTestId('var-box')).toHaveAttribute('data-value', '1', {
      timeout: RUN_MS,
    });
    await expect(demo.locator('[data-phase="done"]')).toBeVisible({ timeout: RUN_MS });
    await expect(demo.getByTestId('var-box')).toHaveAttribute('data-value', '2');
    await shot(page, 'lesson-demo', project);
    // Again: the box starts from 0. Every value it shows is recorded, so a fast replay that is
    // already past 0 when Playwright looks cannot hide the reset.
    await demo.getByTestId('var-box').evaluate((element) => {
      const log: string[] = [];
      (window as unknown as { __boxLog: string[] }).__boxLog = log;
      new MutationObserver(() => {
        const value = element.getAttribute('data-value') ?? '';
        if (log.at(-1) !== value) log.push(value);
      }).observe(element, { attributes: true, attributeFilter: ['data-value'] });
    });
    await page.getByTestId('lesson-demo-run').click();
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { __boxLog: string[] }).__boxLog), {
        timeout: RUN_MS,
      })
      .toEqual(['0', '1', '2']);
    await expect(demo.locator('[data-phase="done"]')).toBeVisible({ timeout: RUN_MS });
  });
});
