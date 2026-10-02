import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import type * as BlocklyModule from 'blockly';
import { pandaBecomes, signInTestProfile } from './helpers';

// P1-04 acceptance (docs/roadmap/phase-1.md): every maze event acted out on /play/:levelId,
// using the dev-only _sandbox levels maze-try (bordered map) and maze-bamboo (no border, collectAll).

const SHOTS = process.env.CQ_SHOTS_DIR ?? 'test-results/play-maze';

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(new URL(`../../../content/${path}`, import.meta.url), 'utf8'));
const shared = readJson('shared/feedback.json') as Record<string, string>;
const sandbox = (id: string) =>
  readJson(`worlds/_sandbox/levels/${id}.json`) as {
    solution: unknown;
    feedback?: Record<string, string>;
  };
/** Măng's line for a reason: the level's override first, as the app does (ui-copy-guide.md §3). */
const line = (levelId: string, reason: string): string =>
  sandbox(levelId).feedback?.[reason] ?? shared[reason] ?? '';

/** Test hook set by PlayScreen (dev build only). */
interface PlayHook {
  Blockly: typeof BlocklyModule;
  workspace: BlocklyModule.WorkspaceSvg;
  highlights: string[];
}
type HookWindow = Window & { __cqPlay: PlayHook };

type Block = { type: string; id: string };
const F = (id: string): Block => ({ type: 'maze_forward', id });
const L = (id: string): Block => ({ type: 'maze_turn_left', id });
const R = (id: string): Block => ({ type: 'maze_turn_right', id });

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

/** The maze canvas, which mirrors what the stage shows as data-maze-* attributes. */
const board = (page: Page) => page.getByTestId('play-stage').locator('canvas');

/** Budget for a whole replay to finish, generous for a loaded machine (several workers). */
const RUN_MS = 30_000;

const stageShot = (page: Page, name: string) =>
  page.getByTestId('play-stage').screenshot({ path: `${SHOTS}/${name}.png` });

test.describe('/play maze', () => {
  test('@smoke maze-try: forward, turn right, forward to the goal, cheer', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'maze-try');
    await stageShot(page, `${project}-try-start`);
    await setProgram(page, sandbox('maze-try').solution);
    await page.getByTestId('play-run').click();
    const stage = page.getByTestId('play-stage');
    await expect(stage).toHaveAttribute('data-phase', 'running');
    await expect(stage).toHaveAttribute('data-panda', 'walk');
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: RUN_MS });
    await expect(stage).toHaveAttribute('data-panda', 'cheer');
    expect(await highlights(page)).toEqual(['start', 'fwd1', 'fwd2', 'right1', 'fwd3', 'fwd4']);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${SHOTS}/${project}-try-success.png` });
  });

  test('turns in every direction, one block at a time; stopping short is NOT_AT_GOAL', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'maze-try');
    const stage = page.getByTestId('play-stage');
    // Starts facing E: right → S → W → N → E, then left → N → W → S → E.
    const turns = [R('r1'), R('r2'), R('r3'), R('r4'), L('l1'), L('l2'), L('l3'), L('l4')];
    const facing = ['S', 'W', 'N', 'E', 'N', 'W', 'S'];
    await setProgram(page, program(...turns));
    await stage.focus();
    await page.keyboard.press('s');
    await expect(stage).toHaveAttribute('data-waiting-step', 'true');
    await stageShot(page, `${project}-face-E`);
    for (const [index, dir] of facing.entries()) {
      await page.keyboard.press('s');
      // The turn is done once the next block lights up and the replay waits again.
      await expect.poll(() => highlights(page)).toHaveLength(index + 3);
      await expect(stage).toHaveAttribute('data-waiting-step', 'true');
      await page.waitForTimeout(250); // let the idle arrow settle for the picture
      await stageShot(page, `${project}-face-${dir}`);
    }
    await page.keyboard.press('s');
    await expect(stage).toHaveAttribute('data-phase', 'fail', { timeout: RUN_MS });
    await expect(page.getByTestId('play-bubble')).toHaveText(line('maze-try', 'NOT_AT_GOAL'));
    expect(await highlights(page)).toEqual(['start', ...turns.map((block) => block.id)]);
    await expect(stage).toHaveAttribute('data-panda', 'idle');
  });

  test('@smoke bumping into a wall: HIT_WALL, Măng is dazed, the block shakes', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'maze-try');
    const stage = page.getByTestId('play-stage');
    await setProgram(page, program(F('f1'), F('f2'), F('f3')));
    await page.getByTestId('play-run').click();
    // Surprised on impact, then crouched and dizzy.
    await pandaBecomes(page, 'jump');
    await stageShot(page, `${project}-bump-impact`);
    await expect(stage).toHaveAttribute('data-phase', 'fail', { timeout: RUN_MS });
    await expect(stage).toHaveAttribute('data-panda', 'crouch');
    await expect(board(page)).toHaveAttribute('data-maze-stunned', 'true');
    await expect(page.getByTestId('play-bubble')).toHaveText(line('maze-try', 'HIT_WALL'));
    expect(await hasClass(page, 'f3', 'cq-shake')).toBe(true);
    expect(await hasClass(page, 'f2', 'cq-shake')).toBe(false);
    await page.waitForTimeout(300);
    await stageShot(page, `${project}-bump-dazed`);

    // R puts Măng back at the start, no longer dazed.
    await page.keyboard.press('r');
    await expect(stage).toHaveAttribute('data-phase', 'idle');
    await expect(stage).toHaveAttribute('data-panda', 'idle');
    await expect(board(page)).toHaveAttribute('data-maze-stunned', 'false');
  });

  test('walking west off a map without a border bumps the edge', async ({ page }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'maze-bamboo');
    const stage = page.getByTestId('play-stage');
    await stageShot(page, `${project}-bamboo-start`);
    // From S (2,0) facing N: right → E, step to (2,1), turn round to W, step back, step off the map.
    await setProgram(page, program(R('r1'), F('f1'), L('l1'), L('l2'), F('f2'), F('f3')));
    await page.getByTestId('play-run').click();
    await pandaBecomes(page, 'jump');
    await stageShot(page, `${project}-edge-impact`);
    await expect(stage).toHaveAttribute('data-phase', 'fail', { timeout: RUN_MS });
    await expect(page.getByTestId('play-bubble')).toHaveText(line('maze-bamboo', 'HIT_WALL'));
    expect(await hasClass(page, 'f3', 'cq-shake')).toBe(true);
    await page.waitForTimeout(300);
    await stageShot(page, `${project}-edge-dazed`);
  });

  test('collect, then stand on the locked goal with bamboo left: MISSED_ITEMS', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'maze-bamboo');
    const stage = page.getByTestId('play-stage');
    // E along the bottom (collects 2,2), N up to the goal at (0,2); bamboo (0,0) is left.
    await setProgram(page, program(R('r1'), F('f1'), F('f2'), L('l1'), F('f3'), F('f4')));
    await page.getByTestId('play-run').click();
    await pandaBecomes(page, 'happy');
    await stageShot(page, `${project}-collect`);
    await expect(stage).toHaveAttribute('data-phase', 'fail', { timeout: RUN_MS });
    await expect(page.getByTestId('play-bubble')).toHaveText(line('maze-bamboo', 'MISSED_ITEMS'));
    expect(await hasClass(page, 'f4', 'cq-shake')).toBe(true);
    await expect(stage).toHaveAttribute('data-panda', 'idle');
    // The missed shoot is marked, one of two is counted, the goal stays locked.
    await expect(board(page)).toHaveAttribute('data-maze-missed', 'true');
    await expect(board(page)).toHaveAttribute('data-maze-collected', '1/2');
    await expect(board(page)).toHaveAttribute('data-maze-shoots', '1');
    await expect(board(page)).toHaveAttribute('data-maze-goal', 'locked');
    await page.waitForTimeout(450);
    await stageShot(page, `${project}-missed`);
    await stage.focus();
    await page.keyboard.press('r');
    await expect(board(page)).toHaveAttribute('data-maze-missed', 'false');
    await expect(board(page)).toHaveAttribute('data-maze-shoots', '2');
  });

  test('Làm lại in the middle of a collect puts the shoot back for good', async ({ page }) => {
    await open(page, 'maze-bamboo');
    const stage = page.getByTestId('play-stage');
    await expect(board(page)).toHaveAttribute('data-maze-shoots', '2');
    await setProgram(page, program(R('r1'), F('f1'), F('f2'), L('l1'), F('f3')));
    await page.getByTestId('play-run').click();
    await pandaBecomes(page, 'happy'); // the shoot at (2,2) is rising out of its cell
    await stage.focus();
    await page.keyboard.press('r');
    await expect(stage).toHaveAttribute('data-phase', 'idle');
    await expect(board(page)).toHaveAttribute('data-maze-shoots', '2');
    await expect(board(page)).toHaveAttribute('data-maze-collected', '0/2');
    // Longer than the collect animation: the stale continuation must not hide it again.
    await page.waitForTimeout(1200);
    await expect(board(page)).toHaveAttribute('data-maze-shoots', '2');
  });

  test('@smoke maze-bamboo solution: both shoots, past the locked goal and back, win', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'maze-bamboo');
    const stage = page.getByTestId('play-stage');
    await setProgram(page, sandbox('maze-bamboo').solution);
    await page.getByTestId('play-run').click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: RUN_MS });
    await expect(stage).toHaveAttribute('data-panda', 'cheer');
    expect(await highlights(page)).toHaveLength(13);
    await expect(board(page)).toHaveAttribute('data-maze-collected', '2/2');
    await expect(board(page)).toHaveAttribute('data-maze-goal', 'open');
    await page.waitForTimeout(300);
    await stageShot(page, `${project}-bamboo-win`);
  });
});
