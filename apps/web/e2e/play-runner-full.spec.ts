import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import type * as BlocklyModule from 'blockly';
import { pandaBecomes, signInTestProfile } from './helpers';

// P1-03 / P1-05 acceptance (docs/roadmap/phase-1.md): every runner event is acted out on the
// sandbox levels (dev build only), and the stage controls (pause, step, speed, reset) work
// mid-replay. Screenshots go to SHOTS for a human look.

const SHOTS = process.env.CQ_SHOTS ?? 'test-results/play-runner-full';

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(new URL(`../../../content/${path}`, import.meta.url), 'utf8'));
const sandbox = (id: string) =>
  readJson(`worlds/_sandbox/levels/${id}.json`) as { solution: unknown };
const shared = readJson('shared/feedback.json') as Record<string, string>;

interface PlayHook {
  Blockly: typeof BlocklyModule;
  workspace: BlocklyModule.WorkspaceSvg;
  highlights: string[];
}
type HookWindow = Window & { __cqPlay: PlayHook };

type Block = { type: string; id: string };

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
const crouch = (id: string): Block => ({ type: 'runner_crouch', id });
const kick = (id: string): Block => ({ type: 'runner_kick', id });

// Cold dev-server loads (Blockly + Pixi compiled on demand) can take most of the default 30 s.
test.describe.configure({ timeout: 60_000 });

let errors: string[];

test.beforeEach(({ page }) => {
  errors = [];
  page.on('console', (msg) => {
    if (msg.text().startsWith('[.WebGL-')) return;
    // A production-like build (served by `vite preview`) preloads fonts a page may not use.
    if (msg.text().includes('was preloaded using link preload')) return;
    if (msg.type() === 'error' || msg.type() === 'warning') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
});

test.afterEach(() => {
  expect(errors).toEqual([]);
});

async function open(page: Page, levelId: string): Promise<void> {
  await signInTestProfile(page);
  // Sandbox levels unlock one after another like a world; the dev flag opens them all.
  await page.goto(`/play/${levelId}?unlock=all`);
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

const stage = (page: Page) => page.getByTestId('play-stage');
const pauseButton = (page: Page) => page.getByTestId('play-pause');

/**
 * Pauses the replay the moment Măng starts `pose` (a page-side observer clicks Tạm dừng in the
 * same task, so short poses are not missed), screenshots the stage, then resumes.
 */
async function catchPose(page: Page, pose: string, name: string, project: string): Promise<void> {
  await page.evaluate(
    (wanted) =>
      new Promise<void>((resolve, reject) => {
        const box = document.querySelector<HTMLElement>('[data-testid="play-stage"]');
        const pause = document.querySelector<HTMLButtonElement>('[data-testid="play-pause"]');
        if (!box || !pause) {
          reject(new Error('stage or pause button missing'));
          return;
        }
        const check = () => {
          if (box.dataset['panda'] !== wanted) return;
          observer.disconnect();
          clearTimeout(timer);
          pause.click();
          resolve();
        };
        const observer = new MutationObserver(check);
        const timer = setTimeout(() => {
          observer.disconnect();
          reject(new Error(`Măng never showed "${wanted}"`));
        }, 15_000);
        observer.observe(box, { attributes: true, attributeFilter: ['data-panda'] });
        check();
      }),
    pose,
  );
  await expect(stage(page)).toHaveAttribute('data-paused', 'true');
  await page.waitForTimeout(150);
  await stage(page).screenshot({ path: `${SHOTS}/${project}-${name}.png` });
  await pauseButton(page).click();
  await expect(stage(page)).toHaveAttribute('data-paused', 'false');
}

/**
 * Runs the program and waits until the replay ends. Resolves the replay's length in page time
 * (from data-phase "running" to the end), measured in the page so a busy test runner cannot skew it,
 * and the highest stage clock speed while running (data-stage-speed, dev build only).
 */
async function runToEnd(
  page: Page,
  phase: 'success' | 'fail',
): Promise<{ ms: number; maxSpeed: number }> {
  const ended = page.evaluate(
    (expected) =>
      new Promise<{ ms: number; maxSpeed: number }>((resolve, reject) => {
        const box = document.querySelector<HTMLElement>('[data-testid="play-stage"]');
        if (!box) {
          reject(new Error('stage missing'));
          return;
        }
        let started = 0;
        let maxSpeed = Number.NaN;
        const observer = new MutationObserver(() => {
          const now = box.dataset['phase'];
          if (now === 'running' && started === 0) started = performance.now();
          if (now === 'running') {
            const speed = Number(box.dataset['stageSpeed']);
            maxSpeed = Number.isNaN(maxSpeed) ? speed : Math.max(maxSpeed, speed);
          }
          if (now === expected && started !== 0) {
            observer.disconnect();
            resolve({ ms: performance.now() - started, maxSpeed });
          }
        });
        observer.observe(box, {
          attributes: true,
          attributeFilter: ['data-phase', 'data-stage-speed'],
        });
      }),
    phase,
  );
  await page.getByTestId('play-run').click();
  return ended;
}

test.describe('runner stage: every event is acted out', () => {
  test('crouch under the branch, kick the crate, collect shoots, jump the hole, win', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'runner-obstacles');
    await stage(page).screenshot({ path: `${SHOTS}/${project}-obstacles-start.png` });
    await page.screenshot({ path: `${SHOTS}/${project}-page.png` });
    await setProgram(page, sandbox('runner-obstacles').solution);
    await page.getByRole('radio', { name: 'Chậm' }).click();
    await page.getByTestId('play-run').click();
    await catchPose(page, 'crouch', 'crouch', project);
    await page.screenshot({ path: `${SHOTS}/${project}-page-running.png` });
    await catchPose(page, 'happy', 'collect', project);
    await catchPose(page, 'kick', 'kick-crate', project);
    await page.waitForTimeout(250); // the crate tips over
    await pauseButton(page).click();
    await stage(page).screenshot({ path: `${SHOTS}/${project}-crate-topples.png` });
    await pauseButton(page).click();
    await catchPose(page, 'jump', 'jump', project);
    await expect(stage(page)).toHaveAttribute('data-panda', 'cheer', { timeout: 20_000 });
    await page.waitForTimeout(300); // confetti in the air
    await pauseButton(page).click();
    await stage(page).screenshot({ path: `${SHOTS}/${project}-win.png` });
    await pauseButton(page).click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 20_000 });
  });

  test('bump into the branch and into the crate: Măng recoils, the right line shows', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'runner-obstacles');
    await setProgram(page, program(walk('w1'), walk('w2')));
    await runToEnd(page, 'fail');
    await expect(page.getByTestId('play-bubble')).toHaveText(shared['HIT_BRANCH'] ?? '');
    await stage(page).screenshot({ path: `${SHOTS}/${project}-bump-branch.png` });

    await setProgram(page, program(walk('w1'), crouch('c1'), walk('w2'), walk('w3')));
    await runToEnd(page, 'fail');
    await expect(page.getByTestId('play-bubble')).toHaveText(shared['HIT_CRATE'] ?? '');
    await stage(page).screenshot({ path: `${SHOTS}/${project}-bump-crate.png` });

    // Jumping into the branch: the bump happens mid-air.
    await setProgram(page, program(jump('j1')));
    await runToEnd(page, 'fail');
    await expect(page.getByTestId('play-bubble')).toHaveText(shared['HIT_BRANCH'] ?? '');
  });

  test('kicking thin air is harmless; walking into a hole falls', async ({ page }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'runner-obstacles');
    await setProgram(page, program(kick('k1')));
    await page.getByTestId('play-run').click();
    await catchPose(page, 'kick', 'kick-air', project);
    await expect(stage(page)).toHaveAttribute('data-phase', 'fail', { timeout: 10_000 });
    await expect(page.getByTestId('play-bubble')).toHaveText(shared['NOT_AT_GOAL'] ?? '');

    const toHole = [walk('w1'), crouch('c1'), walk('w2'), kick('k1'), walk('w3'), walk('w4')];
    await setProgram(page, program(...toHole, walk('w5')));
    await runToEnd(page, 'fail');
    await expect(page.getByTestId('play-bubble')).toHaveText(shared['FELL_IN_HOLE'] ?? '');
  });

  test('reaching the flag with a shoot left: Măng is sorry, the shoot blinks', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'runner-bamboo');
    await setProgram(page, program(walk('w1'), jump('j1'), walk('w2'), walk('w3'), walk('w4')));
    await page.getByTestId('play-run').click();
    await catchPose(page, 'talk', 'missed', project);
    await expect(stage(page)).toHaveAttribute('data-phase', 'fail', { timeout: 10_000 });
    await expect(page.getByTestId('play-bubble')).toHaveText(shared['MISSED_ITEMS'] ?? '');
    await stage(page).screenshot({ path: `${SHOTS}/${project}-missed-end.png` });
  });
});

test.describe('runner stage: jumping past the flag', () => {
  test('a jump from the cell before the flag flies off the track (OFF_TRACK)', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'runner-bamboo');
    // Cells 0–6, flag on 6: from cell 5 a jump would land on 7, past the end.
    const walks = ['w1', 'w2', 'w3', 'w4', 'w5'].map(walk);
    await setProgram(page, program(...walks, jump('j1')));
    await page.getByTestId('play-run').click();
    await catchPose(page, 'jump', 'off-track-jump', project);
    await expect(stage(page)).toHaveAttribute('data-phase', 'fail', { timeout: 10_000 });
    await expect(page.getByTestId('play-bubble')).toHaveText(shared['OFF_TRACK'] ?? '');
    expect((await highlights(page)).at(-1)).toBe('j1');
    await stage(page).screenshot({ path: `${SHOTS}/${project}-off-track-end.png` });
  });
});

test.describe('stage controls mid-replay', () => {
  test('Làm lại mid-replay stops at once: nothing keeps moving afterwards', async ({ page }) => {
    await open(page, 'runner-long');
    await setProgram(page, sandbox('runner-long').solution);
    await page.getByTestId('play-run').click();
    await pandaBecomes(page, 'jump');
    await page.getByRole('button', { name: /Làm lại/ }).click();
    await expect(stage(page)).toHaveAttribute('data-phase', 'idle');
    await expect(stage(page)).toHaveAttribute('data-panda', 'idle');
    await expect(page.locator('.blocklyHighlighted')).toHaveCount(0);
    const lit = (await highlights(page)).length;
    await page.waitForTimeout(1500);
    expect((await highlights(page)).length).toBe(lit);
    await expect(stage(page)).toHaveAttribute('data-panda', 'idle');
    await expect(page.locator('.blocklyHighlighted')).toHaveCount(0);
  });

  test('pause freezes the replay, resume carries on; R while paused resets', async ({ page }) => {
    await open(page, 'runner-long');
    await setProgram(page, sandbox('runner-long').solution);
    await expect(pauseButton(page)).toBeDisabled();
    await page.getByTestId('play-run').click();
    await expect(stage(page)).toHaveAttribute('data-panda', 'walk', { timeout: 15_000 });
    await pauseButton(page).click();
    await expect(pauseButton(page)).toHaveAccessibleName('Tiếp tục');
    await expect(page.getByTestId('play-bubble')).toHaveText('Măng đứng chờ. Bấm Tiếp tục nhé!');
    const lit = (await highlights(page)).length;
    const pose = await stage(page).getAttribute('data-panda');
    const frozen = await stage(page).screenshot();
    await page.waitForTimeout(1200);
    expect((await highlights(page)).length).toBe(lit);
    await expect(stage(page)).toHaveAttribute('data-panda', pose ?? '');
    // Nothing on the stage moved while paused (Măng, flag, clouds: all on the one clock).
    expect((await stage(page).screenshot()).equals(frozen)).toBe(true);

    await pauseButton(page).click();
    await expect(pauseButton(page)).toHaveAccessibleName('Tạm dừng');
    await expect.poll(async () => (await highlights(page)).length).toBeGreaterThan(lit);

    await pauseButton(page).click();
    await stage(page).focus();
    await page.keyboard.press('r');
    await expect(stage(page)).toHaveAttribute('data-phase', 'idle');
    await expect(stage(page)).toHaveAttribute('data-paused', 'false');
    await expect(pauseButton(page)).toBeDisabled();
  });

  test('S while running switches to step mode before the next block', async ({ page }) => {
    await open(page, 'runner-obstacles');
    await setProgram(page, sandbox('runner-obstacles').solution);
    await page.getByTestId('play-run').click();
    await expect.poll(async () => (await highlights(page)).length).toBeGreaterThanOrEqual(2);
    await stage(page).focus();
    await page.keyboard.press('s');
    await expect(stage(page)).toHaveAttribute('data-waiting-step', 'true');
    const lit = (await highlights(page)).length;
    await page.waitForTimeout(800);
    expect((await highlights(page)).length).toBe(lit);
    await page.keyboard.press('s');
    await expect.poll(async () => (await highlights(page)).length).toBeGreaterThan(lit);
    // Space while stepping = Dừng.
    await page.keyboard.press('Space');
    await expect(stage(page)).toHaveAttribute('data-phase', 'idle');
  });

  test('Nhanh plays a win faster; a lost replay never goes above 1×', async ({ page }) => {
    test.setTimeout(120_000);
    await open(page, 'runner-bamboo');
    const timed = async (speed: string, json: unknown, phase: 'success' | 'fail') => {
      await page.getByRole('radio', { name: speed }).click();
      await setProgram(page, json);
      const run = await runToEnd(page, phase);
      // A win opens the results dialog; closing it puts the stage back (Chơi lại).
      if (phase === 'success') {
        await page
          .getByTestId('play-success')
          .getByRole('button', { name: /^Chơi lại/ })
          .click();
      } else await page.getByRole('button', { name: /Làm lại/ }).click();
      await expect(stage(page)).toHaveAttribute('data-phase', 'idle');
      return run;
    };
    const win = sandbox('runner-bamboo').solution;
    const winNormal = await timed('Vừa', win, 'success');
    const winFast = await timed('Nhanh', win, 'success');
    expect(winFast.ms).toBeLessThan(winNormal.ms * 0.7);
    expect(winFast.maxSpeed).toBeCloseTo(2 * 1.25);

    // A lost replay: the clock itself never goes above LOSE_TEMPO (0.85), even at Nhanh.
    const lose = program(walk('w1'), jump('j1'), walk('w2'), walk('w3'), walk('w4'));
    const loseNormal = await timed('Vừa', lose, 'fail');
    const loseFast = await timed('Nhanh', lose, 'fail');
    expect(loseFast.maxSpeed).toBeGreaterThan(0);
    expect(loseFast.maxSpeed).toBeLessThanOrEqual(0.85);
    const loseSlow = await timed('Chậm', lose, 'fail');
    expect(loseSlow.ms).toBeGreaterThan(loseNormal.ms * 1.5);
  });
});

/** rAF frame intervals (ms) over `ms` of page time. */
const frameIntervals = (page: Page, ms: number) =>
  page.evaluate(
    (span) =>
      new Promise<number[]>((resolve) => {
        const times: number[] = [];
        const frame = (time: number) => {
          times.push(time);
          if (time - (times[0] ?? time) < span) requestAnimationFrame(frame);
          else resolve(times.slice(1).map((t, i) => t - (times[i] ?? t)));
        };
        requestAnimationFrame(frame);
      }),
    ms,
  );

function frameStats(intervals: number[]): { fps: number; p95: number; frames: number } {
  const sorted = [...intervals].sort((a, b) => a - b);
  const mean = intervals.reduce((sum, ms) => sum + ms, 0) / intervals.length;
  return {
    fps: 1000 / mean,
    p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
    frames: intervals.length,
  };
}

test.describe('runner performance', () => {
  // Serial only keeps this describe's own tests in order; it does not stop other workers. The frame
  // budget below is strict only when the whole run uses one worker (--workers=1).
  test.describe.configure({ mode: 'serial' });

  test('30-cell level: the camera follows Măng at 60 fps', async ({ page }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'runner-long');
    await setProgram(page, sandbox('runner-long').solution);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Performance.enable');
    const taskSeconds = async (): Promise<number> => {
      const { metrics } = await cdp.send('Performance.getMetrics');
      return metrics.find((m) => m.name === 'TaskDuration')?.value ?? 0;
    };
    // Baseline: the same page with the stage idle (flag waving), to tell machine load apart.
    const idleBefore = await taskSeconds();
    const idle = frameStats(await frameIntervals(page, 1500));
    const idleBusy = ((await taskSeconds()) - idleBefore) / 1.5;
    await page.getByRole('radio', { name: 'Nhanh' }).click();
    await page.getByTestId('play-run').click();
    await expect(stage(page)).toHaveAttribute('data-panda', 'walk', { timeout: 15_000 });
    const busyBefore = await taskSeconds();
    const replay = frameStats(await frameIntervals(page, 3000));
    const busy = ((await taskSeconds()) - busyBefore) / 3;
    const report =
      `${project}: replay ${replay.fps.toFixed(1)} fps (p95 frame ${replay.p95.toFixed(1)} ms, ` +
      `${String(replay.frames)} frames), idle ${idle.fps.toFixed(1)} fps, ` +
      `main thread busy ${(busy * 100).toFixed(0)}% during replay, ${(idleBusy * 100).toFixed(0)}% idle`;
    testInfo.annotations.push({ type: 'fps', description: report });
    mkdirSync(SHOTS, { recursive: true });
    writeFileSync(`${SHOTS}/${project}-fps.txt`, `${report}\n`);
    await stage(page).screenshot({ path: `${SHOTS}/${project}-long-scrolled.png` });
    // Alone (--workers 1): 60 fps where the machine gives it, never fewer frames than the idle page
    // minus a margin. In a parallel run other workers steal frames; only a collapse fails then.
    const alone = testInfo.config.workers === 1;
    expect(replay.fps).toBeGreaterThan(alone ? Math.min(55, idle.fps - 4) : 30);
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 30_000 });
  });
});

// Review fix (World 2 pedagogy): the stage shows ~6 cells of a long track, so a strip under it
// shows every cell, Măng's live cell and the part the stage shows (stage-rendering.md §2).
test.describe('full-track strip', () => {
  const strip = (page: Page) => page.getByTestId('track-strip');

  test('runner-long: all 30 cells, the marker follows Măng, Làm lại puts it back', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'runner-long');
    await setProgram(page, sandbox('runner-long').solution);
    await expect(strip(page)).toHaveAttribute('data-cells', '30');
    await expect(strip(page)).toHaveAccessibleName('Cả đường: 30 ô, Măng ở ô 1');
    await expect(strip(page).locator('[data-cell]')).toHaveCount(30);
    await expect(strip(page).locator('[data-bamboo]')).toHaveCount(4);
    // Readable for an 8-year-old: a cell is at least 14 px wide.
    const box = await strip(page).locator('svg').first().boundingBox();
    expect((box?.width ?? 0) / 30).toBeGreaterThanOrEqual(14);
    const startView = await strip(page).getAttribute('data-view');
    mkdirSync(SHOTS, { recursive: true });
    await page.screenshot({ path: `${SHOTS}/${project}-strip-start.png` });

    await page.getByTestId('play-run').click();
    await expect
      .poll(async () => Number(await strip(page).getAttribute('data-at')), { timeout: 20_000 })
      .toBeGreaterThanOrEqual(8);
    await pauseButton(page).click();
    const at = Number(await strip(page).getAttribute('data-at'));
    await expect(strip(page)).toHaveAccessibleName(`Cả đường: 30 ô, Măng ở ô ${String(at + 1)}`);
    // The frame of what the stage shows moved along with the camera; a shoot was picked up.
    expect(await strip(page).getAttribute('data-view')).not.toBe(startView);
    expect(await strip(page).locator('[data-bamboo]').count()).toBeLessThan(4);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SHOTS}/${project}-strip-running.png` });

    await page.getByRole('button', { name: /Làm lại/ }).click();
    await expect(strip(page)).toHaveAttribute('data-at', '0');
    await expect(strip(page)).toHaveAttribute('data-view', startView ?? '');
    await expect(strip(page).locator('[data-bamboo]')).toHaveCount(4);

    await page.getByRole('radio', { name: 'Nhanh' }).click();
    await page.getByTestId('play-run').click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: 30_000 });
    await expect(strip(page)).toHaveAttribute('data-at', '29');
    await expect(strip(page).locator('[data-bamboo]')).toHaveCount(0);
  });

  test.describe('at 1280×600', () => {
    test.use({
      viewport: { width: 1280, height: 600 },
      contextOptions: { screen: { width: 1280, height: 720 } },
    });

    test('the strip fits and the play screen still does not scroll', async ({ page }, testInfo) => {
      await open(page, 'runner-long');
      await expect(strip(page)).toBeVisible();
      for (const testId of ['track-strip', 'play-run', 'play-bubble']) {
        const box = await page.getByTestId(testId).boundingBox();
        expect((box?.y ?? Infinity) + (box?.height ?? 0)).toBeLessThanOrEqual(600);
      }
      expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(
        600,
      );
      mkdirSync(SHOTS, { recursive: true });
      await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-strip-1280x600.png` });
    });
  });
});
