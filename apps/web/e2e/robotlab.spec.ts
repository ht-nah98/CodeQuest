import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import type * as BlocklyModule from 'blockly';
import { signInTestProfile } from './helpers';

// P3-03 acceptance (docs/roadmap/phase-3.md): the robot lab stage on /play/:levelId with the
// dev-only _sandbox levels robotlab-stage (score 140 in 20 s) and robotlab-predict (missions).
// The canvas mirrors what it shows as data-robot-* attributes (stage-rendering.md §2).

const SHOTS = process.env.CQ_SHOTS_DIR ?? 'test-results/robotlab';

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(new URL(`../../../content/${path}`, import.meta.url), 'utf8'));
const sandbox = (id: string) =>
  readJson(`worlds/_sandbox/levels/${id}.json`) as {
    solution: unknown;
    predict?: { options: Array<{ key: string; label: string }> };
  };

interface PlayHook {
  Blockly: typeof BlocklyModule;
  workspace: BlocklyModule.WorkspaceSvg;
  highlights: string[];
  answerKey?: string;
}
type HookWindow = Window & { __cqPlay: PlayHook };

type Block = { type: string; id: string; fields?: Record<string, unknown> };
const F = (id: string, n: number): Block => ({ type: 'robot_forward', id, fields: { N: n } });
const R = (id: string): Block => ({ type: 'robot_turn_right', id });
const GRAB = (id: string): Block => ({ type: 'robot_grab', id });
const DROP = (id: string): Block => ({ type: 'robot_release', id });

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

const board = (page: Page) => page.getByTestId('play-stage').locator('canvas');

/** Waits (every frame) until the canvas shows `value` in data-robot-<name>. */
async function boardShows(page: Page, name: string, value: string): Promise<void> {
  await page.waitForFunction(
    ([key, wanted]) =>
      document.querySelector<HTMLCanvasElement>('[data-testid="play-stage"] canvas')?.dataset[
        key
      ] === wanted,
    [name, value] as const,
    { polling: 'raf', timeout: 20_000 },
  );
}

const RUN_MS = 30_000;

const stageShot = (page: Page, name: string, project: string) =>
  page.getByTestId('play-stage').screenshot({ path: `${SHOTS}/${project}-${name}.png` });

test.describe('/play robotlab', () => {
  test.describe.configure({ timeout: 90_000 });

  test('@smoke robotlab-stage: tiến 3, gắp, rẽ phải ×2, tiến 3, thả in the lab', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'robotlab-stage');
    const canvas = board(page);
    // Start: Bíp in the lab facing E, a full clock (level time limit 20 s over the shared 120),
    // and the 40 home points already counted on a score level.
    await expect(canvas).toHaveAttribute('data-theme', 'lang-tre');
    await expect(canvas).toHaveAttribute('data-robot-pos', '1,0');
    await expect(canvas).toHaveAttribute('data-robot-dir', 'E');
    await expect(canvas).toHaveAttribute('data-robot-clock', '20');
    await expect(canvas).toHaveAttribute('data-robot-clock-shown', '20');
    await expect(canvas).toHaveAttribute('data-robot-score', '40');
    await expect(canvas).toHaveAttribute('data-robot-tag', 'Sa bàn tập, gần giống đề thi');
    // Each job shows what it is worth before the run (score level).
    await expect(canvas).toHaveAttribute(
      'data-robot-chips',
      'clock:20 giây | contain:0/45 | neutralize:0/160 | retrieve:0/100 | home:40/40 | total:40/140',
    );
    await expect(canvas).toHaveAttribute(
      'data-robot-jobs',
      'contain:0/1 neutralize:0/1 retrieve:0/1 home:1/1',
    );
    await stageShot(page, 'start', project);

    await setProgram(page, sandbox('robotlab-stage').solution);
    await page.getByTestId('play-run').click();
    // Counting crossings: one stop per crossing, the clock down 2 s each.
    // The clock the child sees runs down while Bíp drives (19 on the way, 18 on the crossing).
    await boardShows(page, 'robotClockShown', '19');
    await boardShows(page, 'robotPos', '1,1');
    await boardShows(page, 'robotClock', '18');
    await boardShows(page, 'robotClockShown', '18');
    await boardShows(page, 'robotPos', '1,2');
    await boardShows(page, 'robotPos', '1,3');
    await boardShows(page, 'robotClock', '14');
    await boardShows(page, 'robotHeld', 'pollution');
    await stageShot(page, 'grabbed', project);
    await boardShows(page, 'robotDir', 'W');
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: RUN_MS });
    await expect(canvas).toHaveAttribute('data-robot-pos', '1,0');
    await expect(canvas).toHaveAttribute('data-robot-held', 'none');
    await expect(canvas).toHaveAttribute('data-robot-clock', '2');
    await expect(canvas).toHaveAttribute('data-robot-clock-shown', '2');
    await expect(canvas).toHaveAttribute('data-robot-score', '140');
    await expect(canvas).toHaveAttribute(
      'data-robot-jobs',
      'contain:0/1 neutralize:0/1 retrieve:1/1 home:1/1',
    );
    await expect(canvas).toHaveAttribute('data-robot-finish', 'success');
    const highlights = await page.evaluate(() => [
      ...(window as unknown as HookWindow).__cqPlay.highlights,
    ]);
    expect(highlights).toEqual(['start', 'fwd1', 'grab1', 'right1', 'right2', 'fwd2', 'drop1']);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SHOTS}/${project}-success.png` });
  });

  test('tiến 4 runs into the block: HIT_BLOCK, Bíp shakes and stays dazed', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'robotlab-stage');
    await setProgram(page, program(F('fwd1', 4)));
    await page.getByTestId('play-run').click();
    const stage = page.getByTestId('play-stage');
    await expect(stage).toHaveAttribute('data-phase', 'fail', { timeout: RUN_MS });
    const canvas = board(page);
    await expect(canvas).toHaveAttribute('data-robot-crash', 'block');
    await expect(canvas).toHaveAttribute('data-robot-stunned', 'true');
    // Two crossings driven before the bump (4 s); a crash costs no time.
    await expect(canvas).toHaveAttribute('data-robot-pos', '1,2');
    await expect(canvas).toHaveAttribute('data-robot-clock', '16');
    await expect(canvas).toHaveAttribute('data-robot-clock-shown', '16');
    await page.waitForTimeout(300);
    await stageShot(page, 'crash', project);
    // Làm lại puts Bíp back in the lab, clock full again.
    await page.keyboard.press('r');
    await expect(canvas).toHaveAttribute('data-robot-crash', 'none');
    await expect(canvas).toHaveAttribute('data-robot-clock', '20');
  });

  test('out of time in the lab: the clock is at 0, only the 40 home points', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'robotlab-stage');
    const turns = Array.from({ length: 6 }, (_, i) => R(`r${String(i)}`));
    await setProgram(
      page,
      program(F('fwd1', 3), GRAB('grab1'), ...turns, F('fwd2', 3), DROP('d1')),
    );
    await page.getByTestId('play-run').click();
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-phase', 'fail', {
      timeout: RUN_MS,
    });
    const canvas = board(page);
    await expect(canvas).toHaveAttribute('data-robot-time-up', 'true');
    await expect(canvas).toHaveAttribute('data-robot-clock', '0');
    await expect(canvas).toHaveAttribute('data-robot-clock-shown', '0');
    await expect(canvas).toHaveAttribute('data-robot-score', '40');
    await expect(canvas).toHaveAttribute('data-robot-held', 'pollution');
    await expect(canvas).toHaveAttribute('data-robot-finish', 'LOW_SCORE');
    await stageShot(page, 'time-up', project);
  });

  test('predict robotlab-predict: four answer pictures, the right card wins', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'robotlab-predict');
    const answer = await page.evaluate(() => (window as unknown as HookWindow).__cqPlay.answerKey);
    expect(answer).toBe('stop@1,0');
    const options = sandbox('robotlab-predict').predict?.options ?? [];
    await expect(page.getByTestId('predict-card')).toHaveCount(options.length);
    const card = (key: string) => page.locator(`[data-testid="predict-card"][data-key="${key}"]`);
    for (const option of options) {
      await expect(card(option.key)).toContainText(option.label);
      await expect(card(option.key).locator('svg[data-robot-answer]')).toHaveCount(1);
    }
    await expect(card('stop@1,0').locator('[data-answer-cell="1,0"] [data-bip="1,0"]')).toHaveCount(
      1,
    );
    await expect(
      card('crash:HIT_BLOCK@1,2').locator('[data-bump="E"] [data-mark="crash"]'),
    ).toHaveCount(1);
    await expect(card('outOfTime@1,3').locator('[data-mark="out-of-time"]')).toHaveCount(1);
    await expect(card('win').locator('[data-mark="win"]')).toHaveCount(1);
    await page
      .getByTestId('predict-cards')
      .screenshot({ path: `${SHOTS}/${project}-predict-cards.png` });
    await card('stop@1,0').click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: RUN_MS });
    await expect(board(page)).toHaveAttribute('data-robot-pos', '1,0');
    await expect(board(page)).toHaveAttribute('data-robot-held', 'pollution');
    await page.screenshot({ path: `${SHOTS}/${project}-predict-success.png` });
  });

  test('the robot city scene (?theme=thanh-pho-robot) paints the pavement', async ({
    page,
  }, testInfo) => {
    await signInTestProfile(page);
    await page.goto('/play/robotlab-stage?theme=thanh-pho-robot');
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-ready', 'true', {
      timeout: 30_000,
    });
    await expect(board(page)).toHaveAttribute('data-theme', 'thanh-pho-robot');
    // Set by the renderer right after it painted the pavement around the mat.
    await expect(board(page)).toHaveAttribute('data-robot-ground', 'pavement');
    await stageShot(page, 'city', testInfo.project.name);
  });

  test('a quick Làm lại mid-run puts Bíp back and nothing late moves it', async ({ page }) => {
    await open(page, 'robotlab-stage');
    await setProgram(page, sandbox('robotlab-stage').solution);
    await page.getByTestId('play-run').click();
    await boardShows(page, 'robotPos', '1,1');
    await page.keyboard.press('r');
    const canvas = board(page);
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-phase', 'idle');
    await expect(canvas).toHaveAttribute('data-robot-pos', '1,0');
    await expect(canvas).toHaveAttribute('data-robot-clock-shown', '20');
    await page.waitForTimeout(1200);
    await expect(canvas).toHaveAttribute('data-robot-pos', '1,0');
    await expect(canvas).toHaveAttribute('data-robot-held', 'none');
    await expect(canvas).toHaveAttribute('data-robot-count', '0');
  });
});

test.describe('World 6 · Thành Phố Robot', () => {
  test.describe.configure({ timeout: 120_000 });

  test('the world page tells the story and shows the level stones; w06-l01 wins', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await signInTestProfile(page);
    await page.goto('/w/w06-thanh-pho-robot');
    // Structure, not copy (the W6 text is still being edited): the book, one dot per chapter,
    // one stone per level of world.json.
    const world = readJson('worlds/w06-thanh-pho-robot/world.json') as {
      levelIds: string[];
      chapters?: unknown[];
    };
    await expect(page.getByTestId('story-book')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('story-book').getByRole('heading').first()).toBeVisible();
    await expect(page.getByTestId('story-dot')).toHaveCount(world.chapters?.length ?? 0);
    for (const id of world.levelIds) {
      await expect(page.locator(`[data-level="${id}"]`)).toHaveCount(1);
    }
    await page.screenshot({ path: `${SHOTS}/${project}-w06-world.png` });

    await page.goto('/play/w06-l01');
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-ready', 'true', {
      timeout: 30_000,
    });
    await page.waitForFunction(
      () => (window as unknown as Partial<HookWindow>).__cqPlay !== undefined,
    );
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-theme', 'thanh-pho-robot');
    await expect(board(page)).toHaveAttribute('data-robot-pos', '1,4');
    await page.screenshot({ path: `${SHOTS}/${project}-w06-l01-start.png` });
    await setProgram(page, program(F('b1', 4)));
    await page.getByTestId('play-run').click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: RUN_MS });
    await expect(board(page)).toHaveAttribute('data-robot-pos', '1,0');
    await expect(board(page)).toHaveAttribute('data-robot-finish', 'success');
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SHOTS}/${project}-w06-l01-win.png` });
  });

  test('a robotlab lesson demo runs on the resolved rules (w06-lesson-tien)', async ({
    page,
  }, testInfo) => {
    await signInTestProfile(page);
    await page.goto('/w/w06-thanh-pho-robot/lesson/w06-lesson-tien');
    await page.getByTestId('lesson-next').click();
    const demo = page.getByTestId('lesson-demo');
    await expect(demo).toHaveAttribute('data-rules', 'ready', { timeout: 30_000 });
    await expect(demo.locator('[data-ready="true"]')).toBeVisible({ timeout: 30_000 });
    await page.getByTestId('lesson-demo-run').click();
    await expect(demo.locator('[data-phase="done"]')).toBeVisible({ timeout: 30_000 });
    const canvas = demo.locator('canvas');
    await expect(canvas).toHaveAttribute('data-robot-finish', /.+/);
    expect(Number(await canvas.getAttribute('data-robot-clock'))).toBeLessThan(120);
    await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-w06-lesson-demo.png` });
  });

  test('w06-l14 has two maps: the tab shows map 2 on the stage', async ({ page }, testInfo) => {
    await open(page, 'w06-l14');
    await expect(page.getByRole('tab')).toHaveCount(2);
    await expect(board(page)).toHaveAttribute('data-robot-pos', '1,6');
    await page.getByTestId('map-tab-2').click();
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-map', '2');
    await expect(board(page)).toHaveAttribute('data-robot-pos', '1,3');
    await stageShot(page, 'w06-l14-map2', testInfo.project.name);
  });
});
