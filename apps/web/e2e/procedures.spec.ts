import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import type * as BlocklyModule from 'blockly';
import { signInTestProfile } from './helpers';

// P4-06 web acceptance (ADR-0023 §6, docs/roadmap/phase-4.md): spells ("phép thuật") on the
// dev-only _sandbox level maze-spells (phép "bậc thang" = tiến, rẽ trái, tiến, rẽ phải; làm phép
// 2 lần, tiến → cờ) and lesson lesson-spells (a demo card with a spell). The spell's box
// ("hộp của phép") waits for P4-04.

const SHOTS = process.env['SHOTS_DIR'] ?? 'test-results/procedures';

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(new URL(`../../../content/${path}`, import.meta.url), 'utf8'));
const level = readJson('worlds/_sandbox/levels/maze-spells.json') as { solution: unknown };
const feedback = readJson('shared/feedback.json') as Record<string, string>;

interface PlayHook {
  Blockly: typeof BlocklyModule;
  workspace: BlocklyModule.WorkspaceSvg;
  highlights: string[];
  vars: string[];
  spells: string[];
  reasonCode?: string | null;
}
type HookWindow = Window & { __cqPlay: PlayHook };

type Block = { type: string; id: string; fields?: Record<string, unknown>; next?: unknown };
const block = (type: string, id: string, fields?: Record<string, unknown>): Block => ({
  type,
  id,
  ...(fields && { fields }),
});
const chain = (blocks: Block[]): Block | undefined =>
  [...blocks]
    .reverse()
    .reduce<Block | undefined>(
      (next, current) => ({ ...current, ...(next && { next: { block: next } }) }),
      undefined,
    );
/** Workspace JSON: "khi bắt đầu" with `main`, and a `dạy phép bậc thang` with `body` (if given). */
function program(main: Block[], body?: Block[]): unknown {
  const first = chain(main);
  const inner = body === undefined ? undefined : chain(body);
  return {
    blocks: {
      languageVersion: 0,
      blocks: [
        { type: 'cq_start', id: 'start', x: 40, y: 40, ...(first && { next: { block: first } }) },
        ...(body === undefined
          ? []
          : [
              {
                type: 'cq_proc_def',
                id: 'def',
                x: 320,
                y: 40,
                fields: { PROC: 'stair' },
                ...(inner && { inputs: { BODY: { block: inner } } }),
              },
            ]),
      ],
    },
  };
}
const call = (id: string) => block('cq_proc_call', id, { PROC: 'stair' });
const STAIR = [
  block('maze_forward', 's1'),
  block('maze_turn_left', 's2'),
  block('maze_forward', 's3'),
  block('maze_turn_right', 's4'),
];

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
  await page.goto('/play/maze-spells');
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

/** `type:PROC` of every block in the flyout, e.g. `cq_proc_def:stair`. */
async function flyoutBlocks(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const { workspace } = (window as unknown as HookWindow).__cqPlay;
    return (workspace.getFlyout()?.getWorkspace().getTopBlocks(false) ?? []).map(
      (b) => `${b.type}:${b.getField('PROC')?.getText() ?? ''}`,
    );
  });
}

const stage = (page: Page) => page.getByTestId('play-stage');
const bubble = (page: Page) => page.getByTestId('play-bubble');
const shot = (page: Page, name: string, project: string) =>
  page.screenshot({ path: `${SHOTS}/${project}-${name}.png` });
const RUN_MS = 40_000;

test.describe('spells (phép thuật, ADR-0023)', () => {
  test.describe.configure({ timeout: process.env.CI ? 300_000 : 120_000 });

  test('@smoke maze-spells: teach a spell, cast it twice, win; the spell lights while it runs', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page);
    // The toolbox: a "PHÉP THUẬT" group, one "dạy phép" and one "làm phép" named "bậc thang".
    await expect(page.locator('.cq-flyout-label', { hasText: 'PHÉP THUẬT' })).toHaveCount(1);
    expect(await flyoutBlocks(page)).toEqual([
      'maze_forward:',
      'maze_turn_left:',
      'maze_turn_right:',
      'cq_proc_def:bậc thang',
      'cq_proc_call:bậc thang',
    ]);
    await setProgram(page, level.solution);
    // Taught: its "dạy phép" leaves the flyout; the hat block is not greyed out.
    await expect.poll(() => flyoutBlocks(page)).not.toContain('cq_proc_def:bậc thang');
    expect(
      await page.evaluate(() => {
        const { workspace } = (window as unknown as HookWindow).__cqPlay;
        return workspace.getBlocksByType('cq_proc_def', false).map((b) => b.isEnabled());
      }),
    ).toEqual([true]);
    await page.mouse.move(5, 5);
    await shot(page, 'built', project);

    await page.getByRole('radio', { name: 'Chậm' }).click();
    await page.getByTestId('play-run').click();
    await expect(page.locator('[data-spell-active="true"]')).toHaveCount(1, { timeout: RUN_MS });
    await expect(bubble(page)).toContainText('Đang làm phép «bậc thang»');
    await shot(page, 'casting', project);
    await page.getByRole('radio', { name: 'Nhanh' }).click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: RUN_MS });
    const hook = await page.evaluate(() => {
      const { spells, highlights } = (window as unknown as HookWindow).__cqPlay;
      return { spells, highlights };
    });
    expect(hook.spells).toEqual(['call:stair', 'ret:stair', 'call:stair', 'ret:stair']);
    // The highlight went into the spell's body.
    expect(hook.highlights).toEqual(expect.arrayContaining(['s1', 's2', 's3', 's4']));
    await expect(page.locator('[data-spell-active="true"]')).toHaveCount(0);
    await shot(page, 'won', project);
  });

  test('dragging "dạy phép" out of the flyout by mouse hides its entry; deleting it brings it back', async ({
    page,
  }) => {
    await open(page);
    const flyoutDef = async () =>
      page.evaluate(() => {
        const { workspace } = (window as unknown as HookWindow).__cqPlay;
        const source = workspace
          .getFlyout()
          ?.getWorkspace()
          .getTopBlocks(false)
          .find((b) => b.type === 'cq_proc_def');
        const box = source?.getSvgRoot().getBoundingClientRect();
        const area = document.querySelector('.blocklyMainBackground')?.getBoundingClientRect();
        if (!box || !area) return null;
        return {
          grab: { x: box.x + 20, y: box.y + 12 },
          drop: { x: area.x + area.width * 0.65, y: area.y + area.height * 0.55 },
        };
      });
    const points = await flyoutDef();
    if (points === null) throw new Error('no "dạy phép" in the flyout');
    await page.mouse.move(points.grab.x, points.grab.y);
    await page.mouse.down();
    await page.mouse.move(points.grab.x + 30, points.grab.y + 8, { steps: 5 });
    await page.mouse.move(points.drop.x, points.drop.y, { steps: 15 });
    await page.waitForTimeout(120);
    await page.mouse.up();
    await page.waitForFunction(
      () => !(window as unknown as HookWindow).__cqPlay.Blockly.Gesture.inProgress(),
    );
    // On the workspace, named, enabled; its flyout entry is gone (the "làm phép" stays).
    const placed = await page.evaluate(() => {
      const { workspace } = (window as unknown as HookWindow).__cqPlay;
      return workspace
        .getBlocksByType('cq_proc_def', false)
        .map((b) => `${b.getField('PROC')?.getText() ?? ''}:${String(b.isEnabled())}`);
    });
    expect(placed).toEqual(['bậc thang:true']);
    await expect
      .poll(() => flyoutBlocks(page))
      .toEqual(['maze_forward:', 'maze_turn_left:', 'maze_turn_right:', 'cq_proc_call:bậc thang']);
    // Select it with the mouse and press Delete: the entry comes back.
    const hat = await page.evaluate(() => {
      const { workspace } = (window as unknown as HookWindow).__cqPlay;
      const box = workspace
        .getTopBlocks(false)
        .find((b) => b.type === 'cq_proc_def')
        ?.getSvgRoot();
      const rect = box?.getBoundingClientRect();
      if (!rect) throw new Error('no dạy phép');
      return { x: rect.x + 20, y: rect.y + 14 };
    });
    await page.mouse.click(hat.x, hat.y);
    await page.keyboard.press('Delete');
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as HookWindow).__cqPlay.workspace.getBlocksByType(
              'cq_proc_def',
              false,
            ).length,
        ),
      )
      .toBe(0);
    await expect.poll(() => flyoutBlocks(page)).toContain('cq_proc_def:bậc thang');
  });

  test('a spell taught but never cast: Măng does not climb', async ({ page }, testInfo) => {
    await open(page);
    await setProgram(page, program([block('maze_forward', 'f1')], STAIR));
    await page.getByTestId('play-run').click();
    await expect(stage(page)).toHaveAttribute('data-phase', 'fail', { timeout: RUN_MS });
    expect(await page.evaluate(() => (window as unknown as HookWindow).__cqPlay.spells)).toEqual(
      [],
    );
    expect(await page.evaluate(() => (window as unknown as HookWindow).__cqPlay.reasonCode)).toBe(
      'NOT_AT_GOAL',
    );
    await shot(page, 'taught-not-cast', testInfo.project.name);
  });

  test('casting a spell never taught: NO_SPELL, Măng stays put', async ({ page }, testInfo) => {
    await open(page);
    await setProgram(page, program([call('c1'), block('maze_forward', 'f1')]));
    await page.getByTestId('play-run').click();
    await expect(stage(page)).toHaveAttribute('data-phase', 'fail', { timeout: RUN_MS });
    expect(await page.evaluate(() => (window as unknown as HookWindow).__cqPlay.reasonCode)).toBe(
      'NO_SPELL',
    );
    // The level's own hint for NO_SPELL, else the shared line.
    await expect(bubble(page)).toContainText(
      /Dạy phép trước, rồi mới làm phép nhé!|Phép này chưa được dạy\./,
    );
    expect(feedback['NO_SPELL']).toBe('Phép này chưa được dạy.');
    await shot(page, 'no-spell', testInfo.project.name);
  });

  test('step mode stops at the spell call and inside its body', async ({ page }) => {
    await open(page);
    await setProgram(page, level.solution);
    await page.getByTestId('play-step').click();
    await expect(stage(page)).toHaveAttribute('data-waiting-step', 'true', { timeout: RUN_MS });
    await page.getByTestId('play-step').click();
    await expect(page.locator('[data-spell-active="true"]')).toHaveCount(1, { timeout: RUN_MS });
    await expect(bubble(page)).toContainText('Đang làm phép «bậc thang»');
  });

  test("w08-l15: the spell's box shows on the panel and takes each call's number, then 0", async ({
    page,
  }, testInfo) => {
    const w08 = readJson('worlds/w08-xuong-phep-thuat/levels/w08-l15.json') as {
      solution: unknown;
    };
    await signInTestProfile(page);
    await page.goto('/play/w08-l15');
    await expect(stage(page)).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
    await page.waitForFunction(
      () => (window as unknown as Partial<HookWindow>).__cqPlay !== undefined,
    );
    const box = page.locator('[data-testid="var-box"][data-var="cells"]');
    await expect(box).toContainText('số ô');
    await expect(box).toHaveAttribute('data-value', '0');
    await setProgram(page, w08.solution);
    await page.getByRole('radio', { name: 'Chậm' }).click();
    await page.getByTestId('play-run').click();
    // While the first spell runs, its box holds that call's number (not 0).
    await expect(box).not.toHaveAttribute('data-value', '0', { timeout: RUN_MS });
    await expect(box).toHaveAttribute('data-state', 'set');
    await shot(page, 'spell-box', testInfo.project.name);
    await page.getByRole('radio', { name: 'Nhanh' }).click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: RUN_MS });
    const vars = await page.evaluate(() => (window as unknown as HookWindow).__cqPlay.vars);
    // Each call sets the box, its end puts it back to 0: n, 0, m, 0, …
    expect(vars.length).toBeGreaterThanOrEqual(4);
    vars.forEach((entry, i) => {
      if (i % 2 === 1) expect(entry).toBe('cells=0');
      else expect(entry).toMatch(/^cells=[1-9]$/);
    });
    expect(new Set(vars.filter((_, i) => i % 2 === 0)).size).toBeGreaterThan(1);
    // Măng wins on the flag inside the last spell (A1), before its end: the panel keeps the
    // last number, as the engine does.
    await expect(box).toHaveAttribute('data-value', String(vars.at(-1)).replace('cells=', ''));
  });

  test('lesson-spells: a demo card with a spell runs and lights the spell', async ({
    page,
  }, testInfo) => {
    await signInTestProfile(page);
    await page.goto('/w/_sandbox/lesson/lesson-spells');
    await expect(page.getByTestId('lesson-card')).toHaveAttribute('data-card', '0');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('lesson-card')).toHaveAttribute('data-card', '1');
    const demo = page.getByTestId('lesson-demo');
    await expect(demo.locator('[data-ready="true"]')).toBeVisible({ timeout: 30_000 });
    await expect(demo.locator('.blocklyText', { hasText: 'bậc thang' }).first()).toBeVisible();
    await demo.getByTestId('lesson-demo-run').click();
    await expect(demo.locator('[data-spell-active="true"]')).toHaveCount(1, { timeout: RUN_MS });
    await expect(demo.locator('[data-phase="done"]')).toBeVisible({ timeout: RUN_MS });
    // Two climbs and no step after: Măng stops just below the flag (the card says so).
    await expect(demo.locator('[data-result="incomplete"]')).toBeVisible();
    await shot(page, 'lesson-demo', testInfo.project.name);
  });
});
