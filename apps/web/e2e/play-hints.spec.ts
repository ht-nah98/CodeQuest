import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import type * as BlocklyModule from 'blockly';
import { signInTestProfile } from './helpers';

// P1-07 acceptance (docs/roadmap/phase-1.md): hints on the real play screen with World 1 levels.
// After 3 losses tier 1 is free and stays owned; tier 2 shows the next block; buying tier 3 caps
// the stars at 1; tier-0 tips point at a block on enter; H opens the hint box; coins drop by the
// price of each tier (5 / 15 / 40).

const SHOTS = process.env.CQ_SHOTS_DIR ?? 'test-results/play-hints';

interface LevelJson {
  solution: unknown;
  thinkingHint: string;
  hints: Array<{ id: string; say: string }>;
}
const world1 = (id: string) =>
  JSON.parse(
    readFileSync(
      new URL(`../../../content/worlds/w01-lang-tre/levels/${id}.json`, import.meta.url),
      'utf8',
    ),
  ) as LevelJson;

interface PlayHook {
  Blockly: typeof BlocklyModule;
  workspace: BlocklyModule.WorkspaceSvg;
}
type HookWindow = Window & { __cqPlay: PlayHook };

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

async function open(page: Page, levelId: string, signIn = true): Promise<void> {
  if (signIn) await signInTestProfile(page);
  await page.goto(`/play/${levelId}`);
  await expect(page.getByTestId('play-stage')).toHaveAttribute('data-ready', 'true', {
    timeout: 30_000,
  });
  await page.waitForFunction(
    () => (window as unknown as Partial<HookWindow>).__cqPlay !== undefined,
  );
}

/** "khi bắt đầu" + the given runner blocks, ids as given. */
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

async function setProgram(page: Page, json: unknown): Promise<void> {
  await page.evaluate((workspaceJson) => {
    const { Blockly, workspace } = (window as unknown as HookWindow).__cqPlay;
    workspace.clear();
    Blockly.serialization.workspaces.load(workspaceJson as object, workspace);
  }, json);
}

async function runTo(page: Page, phase: 'fail' | 'success'): Promise<void> {
  await page.getByTestId('play-run').click();
  await expect(page.getByTestId('play-stage')).toHaveAttribute('data-phase', phase, {
    timeout: 30_000,
  });
}

const coins = (page: Page) => page.locator('[data-hud-coins]');
/** The top bar's coin count, exactly ("30 xu", its screen-reader label). */
const expectCoins = (page: Page, n: number) =>
  expect(coins(page).locator('li').first().locator('.sr-only')).toHaveText(`${String(n)} xu`);
const bubble = (page: Page) => page.getByTestId('play-bubble');
const box = (page: Page) => page.getByTestId('hint-box');
const shot = (page: Page, name: string, project: string) =>
  page.screenshot({ path: `${SHOTS}/${project}-${name}.png` });

const hasClass = (page: Page, blockId: string, className: string) =>
  page.evaluate(
    ([id, name]) =>
      (window as unknown as HookWindow).__cqPlay.workspace
        .getBlockById(id ?? '')
        ?.getSvgRoot()
        .classList.contains(name ?? '') ?? false,
    [blockId, className],
  );

test.describe('/play hints (P1-07)', () => {
  test.describe.configure({ timeout: 180_000 });

  test('tier-0 tip on enter points at the đi block of w01-l01, with the spotlight', async ({
    page,
  }, testInfo) => {
    await open(page, 'w01-l01');
    const say = world1('w01-l01').hints.find((hint) => hint.id === 'connect')?.say ?? '';
    await expect(bubble(page)).toContainText(say);
    const arrow = page.getByTestId('hint-arrow');
    await expect(arrow).toHaveCount(1);
    await expect(arrow).toHaveAttribute('data-block-type', 'runner_walk');
    const blockId = (await arrow.getAttribute('data-block-id')) ?? '';
    expect(await hasClass(page, blockId, 'cq-tip-target')).toBe(true);
    // spotlight: true on a guided level → workspace-content-highlight.
    await expect(page.locator('.cq-blockly .contentAreaHighlight')).toHaveCount(1);
    await shot(page, 'l01-enter-tip', testInfo.project.name);
  });

  test('after 3 losses tier 1 is free and stays owned; tier 2 shows the next block; H opens the box', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    const level = world1('w01-l03');
    await open(page, 'w01-l03');
    // Enter tip of w01-l03: the new jump block in the toolbox.
    await expect(page.getByTestId('hint-arrow')).toHaveAttribute('data-block-type', 'runner_jump');
    await expectCoins(page, 30);

    // H opens the box (focus on the stage, as after any toolbar click); Esc closes it.
    await page.getByTestId('play-stage').focus();
    await page.keyboard.press('h');
    await expect(box(page)).toBeVisible();
    await expect(page.getByTestId('hint-buy-1')).toHaveAttribute('data-state', 'buy');
    await expect(page.getByTestId('hint-buy-2')).toContainText('15 xu');
    await expect(page.getByTestId('hint-buy-3')).toHaveAttribute('data-state', 'locked');
    await expect(page.getByTestId('hint-missing-3')).toContainText('Cần thêm 10 xu');
    await shot(page, 'l03-box-before', project);
    await page.keyboard.press('Escape');
    await expect(box(page)).toHaveCount(0);

    // "đi, đi" falls in the hole three times.
    await setProgram(page, program(['runner_walk', 'w1'], ['runner_walk', 'w2']));
    // Each loss: the feedback line first, then (1.5 s later) the level's run-end hint once, and
    // after the third loss in a row the global "free hint" line.
    await runTo(page, 'fail');
    await expect(bubble(page)).toContainText('Măng phải đứng sát hố', { timeout: 5_000 });
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-hint-target', 'true');
    await runTo(page, 'fail');
    await runTo(page, 'fail');
    await expect(bubble(page)).toContainText('Gợi ý đang miễn phí', { timeout: 5_000 });

    await page.getByTestId('play-hint').click();
    await expect(page.getByTestId('hint-buy-1')).toHaveAttribute('data-state', 'free');
    await page.getByTestId('hint-buy-1').click();
    await expect(page.getByTestId('hint-thinking')).toContainText(level.thinkingHint);
    await expect(page.getByTestId('hint-buy-1')).toHaveAttribute('data-state', 'owned');
    await expect(page.getByTestId('hint-balance')).toHaveAttribute('aria-label', '30 xu');
    await shot(page, 'l03-tier1-free', project);

    // Tier 2: the next block (jump after the first đi), 15 coins.
    await page.getByTestId('hint-buy-2').click();
    await expect(box(page)).toHaveCount(0);
    const popover = page.getByTestId('next-step-popover');
    await expect(popover).toBeVisible();
    await expect(popover).toHaveAttribute('data-kind', 'add');
    await expect(popover).toContainText('Ghép khối này vào chỗ sáng nhé!');
    expect(await hasClass(page, 'w1', 'cq-step-anchor')).toBe(true);
    expect(await hasClass(page, 'w2', 'cq-step-anchor')).toBe(false);
    await expect(popover.locator('.cq-step-preview .blocklyPath')).toHaveCount(1);
    await expectCoins(page, 15);
    await shot(page, 'l03-tier2-popover', project);
    await page.keyboard.press('Escape');
    await expect(popover).toHaveCount(0);

    // Tier 2 with the program already matching the solution: nothing to show, nothing taken.
    await setProgram(page, level.solution);
    await page.getByTestId('play-hint').click();
    await page.getByTestId('hint-buy-2').click();
    await expect(page.getByTestId('hint-notice')).toHaveText('Giống lời giải rồi. Bấm Chạy nhé!');
    await expect(page.getByTestId('next-step-popover')).toHaveCount(0);
    await expect(page.getByTestId('hint-balance')).toHaveAttribute('aria-label', '15 xu');
    await expectCoins(page, 15);
    await page.keyboard.press('Escape');

    // Tier 2 again on an unfinished program: a new step, charged again.
    await setProgram(page, program(['runner_walk', 'w1'], ['runner_walk', 'w2']));
    await page.getByTestId('play-hint').click();
    await page.getByTestId('hint-buy-2').click();
    await expect(popover).toBeVisible();
    await expectCoins(page, 0);
    // Running closes the popover (Space as well as the button).
    await page.getByTestId('play-stage').focus();
    await page.keyboard.press('Space');
    await expect(popover).toHaveCount(0);

    // A new session (reload): no losses, yet tier 1 stays owned and free to reopen.
    await open(page, 'w01-l03', false);
    await page.getByTestId('play-hint').click();
    await expect(page.getByTestId('hint-buy-1')).toHaveAttribute('data-state', 'owned');
    await page.getByTestId('hint-buy-1').click();
    await expect(page.getByTestId('hint-thinking')).toBeVisible();
    await expect(page.getByTestId('hint-balance')).toHaveAttribute('aria-label', '0 xu');
  });

  test('buying tier 3 shows the solution and caps the stars at 1, without star coins', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    // Earn enough coins first: w01-l02 with its solution.
    await open(page, 'w01-l02');
    await setProgram(page, world1('w01-l02').solution);
    await runTo(page, 'success');
    await expect(page.getByTestId('results-stars')).toHaveAttribute('data-stars', '3', {
      timeout: 10_000,
    });
    const before = Number(/\d+/.exec(await coins(page).innerText())?.[0]);
    expect(before).toBeGreaterThanOrEqual(55);
    await expectCoins(page, before);

    await open(page, 'w01-l03', false);
    // A double click buys tier 2 once (the second click lands while the first is written).
    await page.getByTestId('play-hint').click();
    await page.getByTestId('hint-buy-2').dblclick();
    await expect(page.getByTestId('next-step-popover')).toBeVisible();
    await expectCoins(page, before - 15);
    await page.keyboard.press('Escape');

    await page.getByTestId('play-hint').click();
    await page.getByTestId('hint-buy-3').dblclick();
    await expect(box(page)).toHaveCount(0);
    const viewer = page.getByTestId('solution-viewer');
    await expect(viewer).toBeVisible();
    await expect(viewer.locator('.blocklyPath').first()).toBeVisible();
    await expectCoins(page, before - 15 - 40);
    await shot(page, 'l03-tier3-solution', project);
    await page.keyboard.press('Escape');
    await expect(viewer).toHaveCount(0);

    // Reopening the solution in the same session is free.
    await page.getByTestId('play-hint').click();
    await expect(page.getByTestId('hint-buy-3')).toHaveAttribute('data-state', 'owned');
    await page.keyboard.press('Escape');

    await setProgram(page, world1('w01-l03').solution);
    await runTo(page, 'success');
    await expect(page.getByTestId('results-stars')).toHaveAttribute('data-stars', '1', {
      timeout: 10_000,
    });
    const lines = page.getByTestId('results-coins');
    await expect(lines).toContainText('Qua màn lần đầu');
    await expect(lines).not.toContainText('Lần đầu 2 sao');
    await expect(lines).not.toContainText('Lần đầu 3 sao');
    await shot(page, 'l03-tier3-results', project);
  });

  test('predict offers tier 1 only; creative has no hints', async ({ page }) => {
    await open(page, 'w01-l04');
    await page.getByTestId('play-hint').click();
    await expect(page.getByTestId('hint-tier-1')).toBeVisible();
    await expect(page.getByTestId('hint-tier-2')).toHaveCount(0);
    await expect(page.getByTestId('hint-tier-3')).toHaveCount(0);
    await page.keyboard.press('Escape');

    await open(page, 'w01-creative', false);
    await expect(page.getByTestId('play-hint')).toHaveCount(0);
    await page.getByTestId('play-stage').focus();
    await page.keyboard.press('h');
    await expect(box(page)).toHaveCount(0);
  });

  test('audio in play: adventure music, one run sound per start, stage event sounds', async ({
    page,
  }) => {
    const fetched = new Map<string, number>();
    page.on('response', (response) => {
      const path = new URL(response.url()).pathname;
      if (path.startsWith('/audio/')) fetched.set(path, response.status());
    });
    await open(page, 'w01-l03');
    // Record what the app asks the audio manager to play. This needs the Vite DEV server (the
    // webServer of playwright.config.ts): importing '/src/audio/audio.ts' there returns the very
    // module instance the app uses. Against a production build (`vite preview`) that path does
    // not exist, so this test would fail there.
    await page.evaluate(async () => {
      const url = '/src/audio/audio.ts';
      const mod = (await import(/* @vite-ignore */ url)) as {
        audio: { playSfx: (name: string | null, options?: unknown) => boolean };
      };
      const played: Array<string | null> = [];
      (window as unknown as { __sfx: typeof played }).__sfx = played;
      const original = mod.audio.playSfx.bind(mod.audio);
      mod.audio.playSfx = (name, options) => {
        played.push(name);
        return original(name, options);
      };
    });
    const played = () =>
      page.evaluate(() =>
        (window as unknown as { __sfx: Array<string | null> }).__sfx.filter((n) => n !== null),
      );
    await expect(page.getByTestId('play-run')).toHaveAttribute('data-sfx', 'none');
    await setProgram(page, world1('w01-l03').solution);
    // Blockly fires the load's events a tick later (the clear deletes: a `drop`); start clean.
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      (window as unknown as { __sfx: unknown[] }).__sfx.length = 0;
    });
    await runTo(page, 'success');
    const sounds = await played();
    // One `run` for one click (no click sound on top), then the replay's events in order; the
    // win itself has no event sound (the results overlay plays its fanfare).
    expect(sounds.slice(0, 4)).toEqual(['run', 'step', 'jump', 'step']);
    expect(sounds).not.toContain('win');
    expect(sounds).not.toContain('click');
    await expect.poll(played).toContain('fanfare');
    await expect.poll(() => fetched.get('/audio/music/adventure.mp3')).toBe(200);

    // Space starts a run with the same `run` sound; a failed run ends with `wrong`.
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('play-success')).toHaveCount(0);
    await setProgram(page, program(['runner_walk', 'a'], ['runner_walk', 'b']));
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      (window as unknown as { __sfx: unknown[] }).__sfx.length = 0;
    });
    await page.getByTestId('play-stage').focus();
    await page.keyboard.press('Space');
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-phase', 'fail', {
      timeout: 30_000,
    });
    const failSounds = await played();
    expect(failSounds[0]).toBe('run');
    expect(failSounds.filter((n) => n === 'run')).toHaveLength(1);
    expect(failSounds.at(-1)).toBe('wrong');
    expect(failSounds).toContain('fall');

    // Blockly's own sounds are off; snapping a block plays our `snap` (volume sliders apply).
    expect(
      await page.evaluate(
        () => (window as unknown as HookWindow).__cqPlay.workspace.options.hasSounds,
      ),
    ).toBe(false);
    await page.evaluate(() => {
      const { workspace } = (window as unknown as HookWindow).__cqPlay;
      (window as unknown as { __sfx: unknown[] }).__sfx.length = 0;
      const block = workspace.newBlock('runner_jump');
      block.initSvg();
      block.render();
      const start = workspace.getBlockById('start');
      const previous = block.previousConnection;
      if (start?.nextConnection && previous) start.nextConnection.connect(previous);
    });
    await expect.poll(played).toContain('snap');
  });
});
