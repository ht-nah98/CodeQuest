import { expect, type Page, test } from '@playwright/test';
import type * as BlocklyModule from 'blockly';
import { signInTestProfile } from './helpers';

// P3-08 acceptance (docs/roadmap/phase-3.md): the W6 mock exam "Thi thử" (w06-exam) on the
// Thành Phố Măng board. Run a short program, "Đề mới" changes the đề (number and layout), the
// coach types a đề number to replay it, two runs fill the scoreboard and the best one counts.

const SHOTS = process.env.CQ_SHOTS_DIR ?? 'test-results/exam';

type HookWindow = Window & {
  __cqPlay: { Blockly: typeof BlocklyModule; workspace: BlocklyModule.WorkspaceSvg };
};
type Block = { type: string; id: string; fields?: Record<string, unknown> };
const F = (id: string, n: number): Block => ({ type: 'robot_forward', id, fields: { N: n } });
const L = (id: string): Block => ({ type: 'robot_turn_left', id });
const R = (id: string): Block => ({ type: 'robot_turn_right', id });

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

// Đề 2026 (the level file's đề): a pollution block on [1,2]. From the lab facing N: up 2, left,
// 1 to the block, grab, turn back, 1, right, down 2 into the lab, release → 100 + 40 = 140.
const FETCH = program(
  F('a', 2),
  L('b'),
  F('c', 1),
  { type: 'robot_grab', id: 'd' },
  L('e'),
  L('f'),
  F('g', 1),
  R('h'),
  F('i', 2),
  { type: 'robot_release', id: 'j' },
);
/** Turns on the spot and stays in the lab: 40 points. */
const STAY = program(R('a'));

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

const stage = (page: Page) => page.getByTestId('play-stage');
const canvas = (page: Page) => stage(page).locator('canvas');

async function open(page: Page, url: string): Promise<void> {
  await signInTestProfile(page);
  await page.goto(url);
  await expect(stage(page)).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
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

async function runAndWait(page: Page, slot: number, points: string): Promise<void> {
  await page.getByTestId('play-run').click();
  await expect(stage(page)).toHaveAttribute('data-phase', /success|fail/, { timeout: 40_000 });
  await expect(page.getByTestId(`exam-run-${String(slot)}`)).toContainText(points);
}

test.describe('/play w06-exam (thi thử)', () => {
  test.describe.configure({ timeout: 120_000 });

  test('@smoke a run, Đề mới, replay a đề by number, two runs and the best one', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, '/play/w06-exam');
    const bar = page.getByTestId('exam-bar');
    await expect(bar).toHaveAttribute('data-seed', '2026');
    await expect(canvas(page)).toHaveAttribute('data-robot-board', 'thanh-pho-mang');
    const first = await canvas(page).getAttribute('data-robot-layout');
    expect(first).toContain('pollution@1,2');
    await page.getByRole('radio', { name: 'Nhanh' }).click();

    // Run 1 on đề 2026: 140 points in slot 1.
    await setProgram(page, FETCH);
    await runAndWait(page, 1, '140');
    await expect(bar).toHaveAttribute('data-runs', '140');
    await stage(page).screenshot({ path: `${SHOTS}/${project}-run1.png` });

    // Đề mới: another number, another layout, an empty scoreboard, the number in the URL.
    await page.getByTestId('exam-new').click();
    await expect(bar).not.toHaveAttribute('data-seed', '2026');
    const seed = await bar.getAttribute('data-seed');
    await expect(page.getByTestId('exam-seed')).toHaveValue(seed ?? '');
    await expect(stage(page)).toHaveAttribute('data-ready', 'true');
    await expect(canvas(page)).not.toHaveAttribute('data-robot-layout', first ?? '');
    await expect(bar).toHaveAttribute('data-runs', '');
    await expect(page).toHaveURL(new RegExp(`de=${seed ?? 'x'}`));
    await expect(page.getByTestId('play-bubble')).toContainText(`Đề số ${seed ?? ''}`);
    await page.screenshot({ path: `${SHOTS}/${project}-new-exam.png` });

    // The coach replays đề 2026 by its number: the same layout as before.
    await page.getByTestId('exam-seed').fill('2026');
    await page.getByTestId('exam-seed').press('Enter');
    await expect(bar).toHaveAttribute('data-seed', '2026');
    await expect(canvas(page)).toHaveAttribute('data-robot-layout', first ?? '');

    // Two runs: 140 then 40. The best (140) counts; a third run does not.
    await setProgram(page, FETCH);
    await runAndWait(page, 1, '140');
    await setProgram(page, STAY);
    await runAndWait(page, 2, '40');
    await expect(bar).toHaveAttribute('data-runs', '140,40');
    await expect(bar).toHaveAttribute('data-best', '140');
    await expect(page.getByTestId('exam-best')).toContainText('140');
    await expect(page.getByTestId('play-bubble')).toContainText('Điểm tốt nhất: 140');
    await page.screenshot({ path: `${SHOTS}/${project}-scoreboard.png` });

    await page.getByTestId('exam-restart').click();
    await expect(bar).toHaveAttribute('data-runs', '');
    await expect(bar).toHaveAttribute('data-best', '');
  });

  test('the creative level uses the Thành Phố Măng board too', async ({ page }, testInfo) => {
    await open(page, '/play/w06-creative');
    await expect(canvas(page)).toHaveAttribute('data-robot-board', 'thanh-pho-mang');
    await expect(page.getByTestId('exam-bar')).toHaveCount(0);
    await stage(page).screenshot({ path: `${SHOTS}/${testInfo.project.name}-creative.png` });
  });
});
