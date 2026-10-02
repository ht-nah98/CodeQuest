import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import type * as BlocklyModule from 'blockly';
import { signInTestProfile } from './helpers';

// P1-06 acceptance (docs/roadmap/phase-1.md): one playable sample level per mode — parsons,
// predict, bughunt, creative — on /play/:levelId, with the dev-only _sandbox samples and the
// World 1 levels of the same modes.

const SHOTS = process.env.CQ_SHOTS_DIR ?? 'test-results/play-modes';

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(new URL(`../../../content/${path}`, import.meta.url), 'utf8'));
const shared = readJson('shared/feedback.json') as Record<string, string>;
interface LevelJson {
  solution?: unknown;
  initialWorkspace?: { blocks: { blocks: Array<{ type: string; id: string }> } };
  predict?: { options: Array<{ key: string; label: string }> };
  feedback?: Record<string, string>;
}
const sandbox = (id: string) => readJson(`worlds/_sandbox/levels/${id}.json`) as LevelJson;
const world1 = (id: string) => readJson(`worlds/w01-lang-tre/levels/${id}.json`) as LevelJson;

/** Test hook set by PlayScreen (dev build only). */
interface PlayHook {
  Blockly: typeof BlocklyModule;
  workspace: BlocklyModule.WorkspaceSvg;
  highlights: string[];
  answerKey?: string;
}
type HookWindow = Window & { __cqPlay: PlayHook };

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

/** Budget for a whole replay to finish, generous for a loaded machine. */
const RUN_MS = 30_000;

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

const shot = (page: Page, name: string, project: string) =>
  page.screenshot({ path: `${SHOTS}/${project}-${name}.png` });

const bubble = (page: Page) => page.getByTestId('play-bubble');

test.describe('/play modes (P1-06)', () => {
  // Two levels or two picks with their replays per test, on a cold dev server.
  test.describe.configure({ timeout: 120_000 });

  test('@smoke predict maze-predict: a wrong card, its replay, then the right card', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    const level = sandbox('maze-predict');
    await open(page, 'maze-predict');
    const answer = await page.evaluate(() => (window as unknown as HookWindow).__cqPlay.answerKey);
    const options = level.predict?.options ?? [];
    expect(options.map((o) => o.key)).toContain(answer);

    // Read-only program, no run controls: the cards replace them, each with a picture.
    expect(
      await page.evaluate(() => (window as unknown as HookWindow).__cqPlay.workspace.isReadOnly()),
    ).toBe(true);
    await expect(page.getByTestId('play-run')).toHaveCount(0);
    const cards = page.getByTestId('predict-card');
    await expect(cards).toHaveCount(options.length);
    for (const option of options) {
      const card = page.locator(`[data-testid="predict-card"][data-key="${option.key}"]`);
      await expect(card).toContainText(option.label);
      await expect(card.locator('svg [data-mark="spot"]')).toHaveCount(1);
    }
    await expect(bubble(page)).toContainText('chọn một thẻ');
    await shot(page, 'predict-maze-cards', project);

    // Space does nothing here: there is no program to run.
    await page.keyboard.press('Space');
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-phase', 'idle');

    const wrong = options.find((o) => o.key !== answer);
    if (!wrong || answer === undefined) throw new Error('level needs a wrong option');
    await page.locator(`[data-testid="predict-card"][data-key="${wrong.key}"]`).click();
    await expect(bubble(page)).toContainText(shared.WRONG_ANSWER ?? '');
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-phase', 'running');
    // The replay shows what really happens; the wrong card stays marked and locked.
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-phase', 'fail', {
      timeout: RUN_MS,
    });
    const wrongCard = page.locator(`[data-testid="predict-card"][data-key="${wrong.key}"]`);
    await expect(wrongCard).toHaveAttribute('data-mark', 'wrong');
    // aria-disabled, not disabled: the card keeps keyboard focus.
    await expect(wrongCard).toHaveAttribute('aria-disabled', 'true');
    await expect(wrongCard).toBeFocused();
    await expect(bubble(page)).toContainText('chọn lại');
    await shot(page, 'predict-maze-wrong', project);

    // A reload keeps the wrong card marked and locked (the open session's picks).
    await page.reload();
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-ready', 'true', {
      timeout: 30_000,
    });
    await expect(wrongCard).toHaveAttribute('data-mark', 'wrong');
    await expect(wrongCard).toHaveAttribute('aria-disabled', 'true');

    await page.locator(`[data-testid="predict-card"][data-key="${answer}"]`).click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: RUN_MS });
    // Second pick: ⭐⭐ (rewards-economy.md §1).
    await expect(page.getByTestId('results-stars')).toHaveAttribute('data-stars', '2');
    await expect(page.getByTestId('play-success')).toContainText('đoán trúng ngay');
    await shot(page, 'predict-maze-success', project);

    // Chơi lại: the right card can be picked again, the wrong one stays locked.
    await page.getByRole('button', { name: 'Chơi lại' }).click();
    await expect(page.getByTestId('play-success')).toHaveCount(0);
    await expect(wrongCard).toHaveAttribute('data-mark', 'wrong');
    const rightCard = page.locator(`[data-testid="predict-card"][data-key="${answer}"]`);
    await expect(rightCard).toHaveAttribute('data-mark', 'none');
    await expect(rightCard).toHaveAttribute('aria-disabled', 'false');
  });

  test('predict w01-l04 (runner, 4 cards): the right card first is ⭐⭐⭐', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'w01-l04');
    const answer = await page.evaluate(() => (window as unknown as HookWindow).__cqPlay.answerKey);
    const options = world1('w01-l04').predict?.options ?? [];
    await expect(page.getByTestId('predict-card')).toHaveCount(options.length);
    // The picture frames the key's cell (no cell numbers: content-authoring.md §3).
    const stop = options.find((o) => o.key.startsWith('stop@'));
    if (stop) {
      const cell = stop.key.slice('stop@'.length);
      await expect(
        page.locator(
          `[data-testid="predict-card"][data-key="${stop.key}"] [data-answer-cell="${cell}"]`,
        ),
      ).toHaveCount(1);
    }
    await shot(page, 'predict-runner-cards', project);
    await page.locator(`[data-testid="predict-card"][data-key="${answer ?? ''}"]`).click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: RUN_MS });
    await expect(page.getByTestId('results-stars')).toHaveAttribute('data-stars', '3');
    await shot(page, 'predict-runner-success', project);
  });

  test('@smoke parsons runner-parsons: no toolbox, readable loose blocks, put in order', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'runner-parsons');
    await expect(page.locator('.blocklyFlyout')).toBeHidden();
    await expect(bubble(page)).toContainText('khi bắt đầu');
    const state = await page.evaluate(() => {
      const { workspace } = (window as unknown as HookWindow).__cqPlay;
      return workspace.getAllBlocks(false).map((block) => ({
        id: block.id,
        loose: block.getSvgRoot().classList.contains('cq-loose'),
        // Not greyed out by disableOrphans, and nothing can be thrown away.
        enabled: block.isEnabled(),
        deletable: block.isDeletable(),
      }));
    });
    expect(state.filter((b) => b.loose).map((b) => b.id)).toEqual(
      expect.arrayContaining(['walk1', 'jump1', 'walk2', 'walk3']),
    );
    expect(state.every((b) => b.enabled && !b.deletable)).toBe(true);
    await shot(page, 'parsons-start', project);

    // Join the blocks under "khi bắt đầu" in the right order.
    await page.evaluate(() => {
      const { workspace } = (window as unknown as HookWindow).__cqPlay;
      let tail = workspace.getBlockById('start');
      for (const id of ['walk1', 'jump1', 'walk2', 'walk3']) {
        const block = workspace.getBlockById(id);
        if (!tail?.nextConnection || !block?.previousConnection) throw new Error(id);
        tail.nextConnection.connect(block.previousConnection);
        tail = block;
      }
    });
    await expect
      .poll(() =>
        page.evaluate(() =>
          (window as unknown as HookWindow).__cqPlay.workspace
            .getAllBlocks(false)
            .some((block) => block.getSvgRoot().classList.contains('cq-loose')),
        ),
      )
      .toBe(false);
    await page.getByTestId('play-run').click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: RUN_MS });
    await expect(page.getByTestId('results-stars')).toHaveAttribute('data-stars', '3');
    await shot(page, 'parsons-success', project);
  });

  test('parsons w01-l01: drag the loose block under "khi bắt đầu" with the mouse', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'w01-l01');
    const loose = (world1('w01-l01').initialWorkspace?.blocks.blocks ?? []).filter(
      (block) => block.type !== 'cq_start',
    );
    await shot(page, 'parsons-w01-l01-start', project);
    for (const block of loose) {
      const boxes = await page.evaluate((id) => {
        const { workspace } = (window as unknown as HookWindow).__cqPlay;
        // The last block of the chain under "khi bắt đầu", by id (a WorkspaceSvg block is svg).
        let tailId = workspace.getBlocksByType('cq_start', false)[0]?.id;
        for (let next = workspace.getBlockById(tailId ?? '')?.getNextBlock(); next;) {
          tailId = next.id;
          next = next.getNextBlock();
        }
        const tail = workspace.getBlockById(tailId ?? '') ?? undefined;
        const box = (el: Element | undefined) => {
          const r = el?.getBoundingClientRect();
          return r ? { x: r.left, y: r.top, w: r.width, h: r.height } : null;
        };
        const tailPath = tail?.getSvgRoot().querySelector(':scope > .blocklyPath') ?? undefined;
        const blockPath =
          workspace.getBlockById(id)?.getSvgRoot().querySelector(':scope > .blocklyPath') ??
          undefined;
        return { tail: box(tailPath), block: box(blockPath) };
      }, block.id);
      if (!boxes.tail || !boxes.block) throw new Error(`no box for ${block.id}`);
      await page.mouse.move(boxes.block.x + 12, boxes.block.y + 14);
      await page.mouse.down();
      await page.mouse.move(boxes.block.x + 20, boxes.block.y + 20, { steps: 3 });
      await page.mouse.move(boxes.tail.x + 14, boxes.tail.y + boxes.tail.h + 12, { steps: 12 });
      await page.mouse.up();
      await expect
        .poll(() =>
          page.evaluate(
            (id) =>
              (window as unknown as HookWindow).__cqPlay.workspace.getBlockById(id)?.getParent()
                ?.id ?? null,
            block.id,
          ),
        )
        .not.toBeNull();
    }
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as HookWindow).__cqPlay.workspace.getTopBlocks(false).length,
        ),
      )
      .toBe(1);
    await page.getByTestId('play-run').click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: RUN_MS });
    await shot(page, 'parsons-w01-l01-success', project);
  });

  test('bughunt maze-bughunt and w01-l09: live "đã sửa N khối", fix, win', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'maze-bughunt');
    const counter = page.getByTestId('bughunt-edits');
    await expect(counter).toHaveAttribute('data-edits', '0');
    await expect(page.getByText('Săn lỗi: sửa ít nhất có thể')).toBeVisible();
    await shot(page, 'bughunt-start', project);
    await setProgram(page, sandbox('maze-bughunt').solution);
    await expect(counter).toHaveAttribute('data-edits', '1');
    await expect(counter).toHaveText('Đã sửa 1 khối');
    await expect(counter).toHaveAttribute('data-over', 'false');
    await page.getByTestId('play-run').click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: RUN_MS });
    await expect(page.getByTestId('results-stars')).toHaveAttribute('data-stars', '3');
    await expect(page.getByTestId('results-lines')).toHaveText('Con sửa 1 khối là hết lỗi!');
    await shot(page, 'bughunt-success', project);

    // World 1: the level's own solution is within parEdits too.
    await page.goto('/play/w01-l09');
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-ready', 'true', {
      timeout: 30_000,
    });
    await page.waitForFunction(
      () => (window as unknown as Partial<HookWindow>).__cqPlay !== undefined,
    );
    await expect(page.getByTestId('bughunt-edits')).toHaveAttribute('data-edits', '0');
    await setProgram(page, world1('w01-l09').solution);
    await expect(page.getByTestId('bughunt-edits')).not.toHaveAttribute('data-edits', '0');
    await expect(page.getByTestId('bughunt-edits')).toHaveAttribute('data-over', 'false');
    await page.getByTestId('play-run').click();
    await expect(page.getByTestId('play-success')).toBeVisible({ timeout: RUN_MS });
  });

  test('creative maze-creative and w01-creative: run without grading, Lưu pays once', async ({
    page,
  }, testInfo) => {
    const project = testInfo.project.name;
    await open(page, 'maze-creative');
    const coins = page.locator('[data-hud-coins]');
    await expect(coins).toContainText('30');
    await setProgram(page, {
      blocks: {
        languageVersion: 0,
        blocks: [
          {
            type: 'cq_start',
            id: 'start',
            x: 40,
            y: 40,
            next: {
              block: {
                type: 'maze_forward',
                id: 'f1',
                next: { block: { type: 'maze_forward', id: 'f2' } },
              },
            },
          },
        ],
      },
    });
    await page.getByTestId('play-run').click();
    await expect(bubble(page)).toContainText('Bấm Lưu', { timeout: RUN_MS });
    // No grading: no results overlay.
    await expect(page.getByTestId('play-success')).toHaveCount(0);
    await page.getByTestId('play-save').click();
    await expect(bubble(page)).toContainText('Con được 10 xu');
    await expect(coins).toContainText('40');
    await shot(page, 'creative-saved', project);
    await page.getByTestId('play-save').click();
    await expect(bubble(page)).toContainText('Đã lưu bài của con rồi!');
    await expect(coins).toContainText('40');

    await page.goto('/play/w01-creative');
    await expect(page.getByTestId('play-stage')).toHaveAttribute('data-ready', 'true', {
      timeout: 30_000,
    });
    await page.getByTestId('play-save').click();
    await expect(bubble(page)).toContainText('Con được 10 xu');
    await expect(coins).toContainText('50');
    await shot(page, 'creative-w01', project);
  });
});

test.describe('predict on a 1280×720 laptop (~1280×600 of page)', () => {
  test.use({
    viewport: { width: 1280, height: 600 },
    contextOptions: { screen: { width: 1280, height: 720 } },
  });

  test('w01-l08: the whole program and the 4 cards fit without scrolling', async ({
    page,
  }, testInfo) => {
    await open(page, 'w01-l08');
    await expect(page.getByTestId('predict-card')).toHaveCount(4);
    // Every block of the program is inside the visible workspace.
    const fits = await page.evaluate(() => {
      const { workspace } = (window as unknown as HookWindow).__cqPlay;
      const view = workspace.getParentSvg().getBoundingClientRect();
      return workspace.getAllBlocks(false).every((block) => {
        const box = block.getSvgRoot().getBoundingClientRect();
        return box.top >= view.top && box.bottom <= view.bottom;
      });
    });
    expect(fits).toBe(true);
    const cards = await page.getByTestId('predict-cards').boundingBox();
    expect((cards?.y ?? 999) + (cards?.height ?? 0)).toBeLessThanOrEqual(600);
    await shot(page, 'predict-w01-l08-1280x600', testInfo.project.name);
  });
});
