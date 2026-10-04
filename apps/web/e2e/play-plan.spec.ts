import { mkdirSync, readFileSync } from 'node:fs';
import { expect, type Locator, type Page, test } from '@playwright/test';
import type * as BlocklyModule from 'blockly';
import { signInTestProfile } from './helpers';

// P2-22 acceptance (docs/roadmap/phase-2.md): "Xem cả đường". On a long World 2 track, a maze
// and the multi-map sandbox level: the button opens a big view, it pans to the end, the cell
// ruler shows, a click marks a cell, Esc / ✕ / a click outside close it and focus goes back.
// Dragging the strip while Măng is idle moves the stage's view. Screenshots for the coach.

const SHOTS = process.env['SHOTS_DIR'] ?? 'test-results/play-plan';

const readJson = (path: string): unknown =>
  JSON.parse(readFileSync(new URL(`../../../content/${path}`, import.meta.url), 'utf8'));
const boss = readJson('worlds/w02-rung-lap-lai/levels/w02-boss.json') as {
  config: { cells: string[]; start: number };
  solution: unknown;
};
const maze = readJson('worlds/w02-rung-lap-lai/levels/w02-l14.json') as {
  config: { map: string[] };
};
const maps = readJson('worlds/_sandbox/levels/runner-maps.json') as {
  variants: Array<{ cells: string[] }>;
};

interface PlayHook {
  Blockly: typeof BlocklyModule;
  workspace: BlocklyModule.WorkspaceSvg;
}
type HookWindow = Window & { __cqPlay: PlayHook };

test.describe.configure({ timeout: 60_000 });

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

const view = (page: Page) => page.getByTestId('plan-view');
const viewport = (page: Page) => page.getByTestId('plan-viewport');
const panX = async (port: Locator) => Number(await port.getAttribute('data-pan-x'));
const maxPanX = async (port: Locator) => Number(await port.getAttribute('data-max-pan-x'));

/** Drags inside `target` from one point to another (fractions of its box) with the mouse. */
async function drag(page: Page, target: Locator, from: number, to: number, y = 0.5) {
  const box = await target.boundingBox();
  if (!box) throw new Error('no box');
  await page.mouse.move(box.x + box.width * from, box.y + box.height * y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * ((from + to) / 2), box.y + box.height * y, {
    steps: 5,
  });
  await page.mouse.move(box.x + box.width * to, box.y + box.height * y, { steps: 5 });
  await page.mouse.up();
}

/** The whole view fits the window (1280×720 / 1366×768): nothing is cut off. */
async function expectInsideWindow(page: Page, target: Locator) {
  const box = await target.boundingBox();
  const size = page.viewportSize();
  expect(box).not.toBeNull();
  expect(size).not.toBeNull();
  if (!box || !size) return;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(size.width);
  expect(box.y + box.height).toBeLessThanOrEqual(size.height);
}

test('long W2 track: open, drag to the end, ruler, mark a cell, Esc closes', async ({
  page,
}, testInfo) => {
  const project = testInfo.project.name;
  const cells = boss.config.cells.length;
  await open(page, 'w02-boss');
  const strip = page.getByTestId('track-strip');
  await expect(strip).toBeVisible();
  // The button sits at the strip's right end, not on the stage.
  const button = page.getByTestId('plan-open');
  await expect(button).toHaveCount(1);
  await expect(button).toHaveAccessibleName('Xem cả đường');
  const stripBox = await strip.boundingBox();
  const buttonBox = await button.boundingBox();
  expect(Math.abs((buttonBox?.y ?? 0) - (stripBox?.y ?? 0))).toBeLessThan(40);

  // Keyboard: Enter on the focused button opens it.
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(view(page)).toBeVisible();
  await expect(view(page).getByRole('heading')).toHaveText('Cả đường');
  await expectInsideWindow(page, view(page));
  const ruler = page.getByTestId('plan-ruler-cols');
  await expect(ruler).toBeVisible();
  await expect(ruler).toHaveAttribute('data-count', String(cells));
  await expect(ruler.locator('[data-tick]')).toHaveCount(cells);
  await expect(ruler.locator('[data-pill="start"]')).toHaveAttribute(
    'data-tick',
    String(boss.config.start + 1),
  );
  await expect(ruler.locator('[data-pill="goal"]')).toHaveAttribute('data-tick', String(cells));
  // Readable: a cell is 54 px, so a 28-cell track is wider than the view and pans.
  const port = viewport(page);
  await expect(port.locator('[data-mark="mang"]')).toHaveAttribute(
    'data-at',
    String(boss.config.start),
  );
  const max = await maxPanX(port);
  expect(max).toBeGreaterThan(0);
  expect(await panX(port)).toBe(0);
  await page.screenshot({ path: `${SHOTS}/${project}-runner-open.png` });

  // Drag left until the flag shows: twice the window is more than enough.
  await drag(page, port, 0.9, 0.05);
  await drag(page, port, 0.9, 0.05);
  expect(await panX(port)).toBe(max);
  // The last tick (the flag's cell) is inside the window.
  const last = await ruler.locator(`[data-tick="${String(cells)}"]`).boundingBox();
  const portBox = await port.boundingBox();
  expect(last && portBox && last.x + last.width <= portBox.x + portBox.width + 1).toBe(true);

  // Mark the cell under the middle of the window, then unmark it, then mark it again.
  await port.click({ position: { x: (portBox?.width ?? 0) / 2, y: 40 } });
  await expect(port.locator('[data-marked]')).toHaveCount(1);
  await expect(page.getByTestId('plan-marks')).toHaveText('Đã đánh dấu 1 ô');
  await port.click({ position: { x: (portBox?.width ?? 0) / 2, y: 40 } });
  await expect(port.locator('[data-marked]')).toHaveCount(0);
  await port.click({ position: { x: (portBox?.width ?? 0) / 2 + 60, y: 40 } });
  await expect(port.locator('[data-marked]')).toHaveCount(1);
  await page.screenshot({ path: `${SHOTS}/${project}-runner-end-marked.png` });

  // Arrow keys and the wheel pan too.
  // Opening put focus on the picture window; Enter marks the cell in its middle.
  await port.focus();
  await page.keyboard.press('Home');
  await page.keyboard.press('Enter');
  await expect(port.locator('[data-marked]')).toHaveCount(2);
  await expect(page.getByTestId('plan-centre')).toBeVisible();
  await page.keyboard.press(' ');
  await expect(port.locator('[data-marked]')).toHaveCount(1);
  expect(await panX(port)).toBe(0);
  await page.keyboard.press('ArrowRight');
  expect(await panX(port)).toBe(54);
  await page.mouse.move((portBox?.x ?? 0) + 100, (portBox?.y ?? 0) + 40);
  await page.mouse.wheel(0, 300);
  await expect.poll(() => panX(port)).toBeGreaterThan(54);

  // Esc closes; focus is back on the button; the mark is still there when it opens again.
  await page.keyboard.press('Escape');
  await expect(view(page)).toHaveCount(0);
  await expect(button).toBeFocused();
  await button.click();
  await expect(viewport(page).locator('[data-marked]')).toHaveCount(1);
  await page.getByTestId('plan-close').click();
  await expect(view(page)).toHaveCount(0);
  await expect(button).toBeFocused();
});

test('long W2 track: dragging the strip moves the stage while Măng is idle', async ({
  page,
}, testInfo) => {
  await open(page, 'w02-boss');
  const strip = page.getByTestId('track-strip');
  const before = await strip.getAttribute('data-view');
  // A plain click on the strip does not move anything; only a drag does.
  await strip
    .locator('svg')
    .first()
    .click({ position: { x: 300, y: 10 } });
  await expect(strip).toHaveAttribute('data-peek', 'false');
  const shot = async () => page.getByTestId('play-stage').screenshot();
  const stageBefore = await shot();
  await drag(page, strip.locator('svg').first(), 0.1, 0.95);
  await expect(strip).toHaveAttribute('data-peek', 'true');
  const after = await strip.getAttribute('data-view');
  expect(after).not.toBe(before);
  expect(Number(after?.split('-')[1])).toBe(boss.config.cells.length);
  // The stage's camera went there too (the picture changed).
  await expect.poll(async () => (await shot()).equals(stageBefore)).toBe(false);
  await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-strip-peek.png` });
  // Làm lại gives the view back to Măng.
  await page.getByTestId('play-stage').focus();
  await page.keyboard.press('r');
  await expect(strip).toHaveAttribute('data-peek', 'false');
  await expect(strip).toHaveAttribute('data-view', before ?? '');
});

test('long W2 track: a paused run shows where Măng stands', async ({ page }) => {
  await open(page, 'w02-boss');
  await page.evaluate((workspaceJson) => {
    const { Blockly, workspace } = (window as unknown as HookWindow).__cqPlay;
    workspace.clear();
    Blockly.serialization.workspaces.load(workspaceJson as object, workspace);
  }, boss.solution);
  const strip = page.getByTestId('track-strip');
  await page.getByTestId('play-run').click();
  await expect
    .poll(async () => Number(await strip.getAttribute('data-at')), { timeout: 20_000 })
    .toBeGreaterThanOrEqual(4);
  await page.getByTestId('play-pause').click();
  await expect(page.getByTestId('play-stage')).toHaveAttribute('data-paused', 'true');
  const at = await strip.getAttribute('data-at');
  await page.getByTestId('plan-open').click();
  await expect(viewport(page)).toBeFocused();
  await expect(viewport(page).locator('[data-mark="mang"]')).toHaveAttribute('data-at', at ?? '');
  await page.keyboard.press('Escape');
  await expect(view(page)).toHaveCount(0);
  // Open while Măng runs: the view closes by itself when the run ends (the results show).
  await page.getByTestId('play-pause').click();
  await expect(page.getByTestId('play-stage')).toHaveAttribute('data-paused', 'false');
  await page.getByTestId('plan-open').click();
  await expect(view(page)).toBeVisible();
  await expect(view(page)).toHaveCount(0, { timeout: 40_000 });
  await expect(page.getByTestId('play-stage')).toHaveAttribute('data-phase', 'success');
});

test('maze: the button sits on the stage, both rulers, mark a cell, Esc closes', async ({
  page,
}, testInfo) => {
  const project = testInfo.project.name;
  await open(page, 'w02-l14');
  await expect(page.getByTestId('track-strip')).toHaveCount(0);
  const button = page.getByTestId('plan-open');
  await expect(button).toHaveAccessibleName('Xem cả mê cung');
  await button.click();
  await expect(view(page)).toBeVisible();
  await expect(view(page)).toHaveAttribute('data-kind', 'maze');
  await expect(view(page).getByRole('heading')).toHaveText('Cả mê cung');
  await expectInsideWindow(page, view(page));
  const rows = maze.config.map.length;
  const cols = maze.config.map[0]?.length ?? 0;
  await expect(page.getByTestId('plan-ruler-rows')).toHaveAttribute('data-count', String(rows));
  await expect(page.getByTestId('plan-ruler-cols')).toHaveAttribute('data-count', String(cols));
  await expect(page.getByTestId('plan-ruler-cols')).toBeVisible();
  await expect(page.getByTestId('plan-ruler-rows')).toBeVisible();
  const port = viewport(page);
  await expect(port.locator('[data-mark="mang"]')).toHaveAttribute('data-at', '1,1');
  await expect(port.locator('[data-mark="goal"]')).toHaveCount(1);
  // Pans down when the maze is taller than the window, else everything shows.
  const maxY = Number(await port.getAttribute('data-max-pan-y'));
  if (maxY > 0) {
    await port.focus();
    await page.keyboard.press('ArrowDown');
    expect(Number(await port.getAttribute('data-pan-y'))).toBeGreaterThan(0);
  }
  // Mark the goal cell: find its box on the screen.
  const goal = await port.locator('[data-mark="goal"]').boundingBox();
  if (!goal) throw new Error('no goal');
  await page.mouse.click(goal.x + goal.width / 2, goal.y + goal.height / 2);
  const g = maze.config.map.findIndex((row) => row.includes('G'));
  const gc = maze.config.map[g]?.indexOf('G') ?? -1;
  await expect(port.locator('[data-marked]')).toHaveAttribute(
    'data-marked',
    `${String(g)},${String(gc)}`,
  );
  await page.screenshot({ path: `${SHOTS}/${project}-maze.png` });
  await page.keyboard.press('Escape');
  await expect(view(page)).toHaveCount(0);
  await expect(button).toBeFocused();
});

test('multi-map sandbox level: the view shows the selected map; a click outside closes', async ({
  page,
}, testInfo) => {
  await open(page, 'runner-maps');
  await page.getByTestId('map-tab-2').click();
  await expect(page.getByTestId('play-stage')).toHaveAttribute('data-map', '2');
  const button = page.getByTestId('plan-open');
  await button.click();
  await expect(view(page)).toBeVisible();
  await expect(page.getByTestId('plan-map')).toHaveText('· Bản đồ 2');
  const cells = maps.variants[0]?.cells ?? [];
  await expect(page.getByTestId('plan-ruler-cols')).toHaveAttribute(
    'data-count',
    String(cells.length),
  );
  await expect(viewport(page).locator('[data-cell="hole"]')).toHaveCount(
    cells.filter((cell) => cell === 'hole').length,
  );
  await page.screenshot({ path: `${SHOTS}/${testInfo.project.name}-maps.png` });
  await page.mouse.click(5, 5);
  await expect(view(page)).toHaveCount(0);
  await expect(button).toBeFocused();
});

test.beforeAll(() => {
  mkdirSync(SHOTS, { recursive: true });
});
