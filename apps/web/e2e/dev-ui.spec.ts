import { expect, test, type Locator, type Page } from '@playwright/test';

// P0-04 acceptance (docs/roadmap/phase-0.md): the /dev/ui showcase renders the Vietnamese
// sample in all three self-hosted fonts, loads nothing from third parties, and every button
// reacts to hover, press and keyboard focus.

const SAMPLE = 'Măng nhảy qua hố, rẽ phải!';
const SHOTS = 'test-results/screenshots';

const FONTS = [
  { sample: 'display', family: 'Baloo 2' },
  { sample: 'body', family: 'Nunito' },
  { sample: 'pixel', family: 'VT323' },
] as const;

const LOCAL_ORIGIN = /^(https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/|data:|blob:)/;

// Tailwind 4 moves elements with the CSS `translate` property, not `transform`.
function translateY(button: Locator): Promise<number> {
  return button.evaluate((node) => {
    const [, y = '0px'] = getComputedStyle(node).translate.split(' ');
    return parseFloat(y);
  });
}

async function openDevUi(page: Page): Promise<string[]> {
  const foreign: string[] = [];
  page.on('request', (request) => {
    if (!LOCAL_ORIGIN.test(request.url())) foreign.push(request.url());
  });
  await page.goto('/dev/ui');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  return foreign;
}

test('renders the sample sentence in Baloo 2, Nunito and VT323 with Vietnamese faces loaded', async ({
  page,
}, testInfo) => {
  const foreign = await openDevUi(page);

  for (const { sample, family } of FONTS) {
    const el = page.locator(`[data-font-sample="${sample}"]`);
    await expect(el).toHaveText(SAMPLE);
    const fontFamily = await el.evaluate((node) => getComputedStyle(node).fontFamily);
    expect(fontFamily.replaceAll('"', '').split(',')[0]?.trim()).toBe(family);
  }

  // Browsers normalise unicode-range ("U+0000-00FF" reads back as "U+0-FF").
  // Each family must have loaded both its latin and its vietnamese file: the sample contains
  // "ă", "ả", "ố", "ẽ", so the U+1EA0-1EF9 face only loads if the browser really needed it.
  const loaded = await page.evaluate(() =>
    [...document.fonts]
      .filter((face) => face.status === 'loaded')
      .map((face) => ({ family: face.family.replaceAll('"', ''), range: face.unicodeRange })),
  );
  for (const { family } of FONTS) {
    const faces = loaded.filter((face) => face.family === family);
    expect(
      faces.some((face) => face.range.includes('U+1EA0-1EF9')),
      `${family} vietnamese`,
    ).toBe(true);
    expect(
      faces.some((face) => face.range.includes('U+0-FF')),
      `${family} latin`,
    ).toBe(true);
  }

  expect(foreign, 'requests to non-localhost origins').toEqual([]);

  const project = testInfo.project.name;
  await page.screenshot({ path: `${SHOTS}/dev-ui-${project}-viewport.png` });
  await page.screenshot({ path: `${SHOTS}/dev-ui-${project}-full.png`, fullPage: true });
  await page
    .locator('section[aria-labelledby="type-h"]')
    .screenshot({ path: `${SHOTS}/dev-ui-${project}-type.png` });
  await page
    .locator('section[aria-labelledby="comp-h"]')
    .screenshot({ path: `${SHOTS}/dev-ui-${project}-components.png` });
});

const PAPER_RING = 'rgb(255, 248, 238) 0px 0px 0px 3px';

async function focusByKeyboard(page: Page, button: Locator): Promise<void> {
  // A key press switches Chromium to keyboard modality, so the next focus() is :focus-visible.
  await page.keyboard.press('Shift');
  await button.focus();
}

async function focusStyle(button: Locator) {
  return button.evaluate((node) => {
    const style = getComputedStyle(node);
    return {
      focusVisible: node.matches(':focus-visible'),
      outline: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`,
      boxShadow: style.boxShadow,
    };
  });
}

test('every enabled button lifts on hover, sinks on press and shows a focus ring', async ({
  page,
}) => {
  await openDevUi(page);
  // Snapshot the list once; no click ever fires below, so the page state cannot change under it.
  const buttons = await page.locator('main button:enabled').all();
  expect(buttons.length).toBeGreaterThan(5);
  const capacityBefore = await page.getByRole('meter').getAttribute('aria-valuenow');

  for (const button of buttons) {
    const name = (await button.getAttribute('aria-label')) ?? (await button.innerText());
    const box = await button.boundingBox();
    expect(box, name).not.toBeNull();
    expect(Math.round(box?.height ?? 0), `${name} height`).toBeGreaterThanOrEqual(44);
    expect(Math.round(box?.width ?? 0), `${name} width`).toBeGreaterThanOrEqual(44);

    // Hover: lifted (negative Y translation).
    await button.hover();
    await expect.poll(() => translateY(button), { message: `${name} hover` }).toBeLessThan(0);

    // Active: pressed down while the mouse button is held. Release off the button so the
    // press never turns into a click.
    await page.mouse.down();
    await expect.poll(() => translateY(button), { message: `${name} active` }).toBeGreaterThan(0);
    await page.mouse.move(0, 0);
    await page.mouse.up();

    // Focus-visible: brand-deep outline outside a paper ring (two-tone, visible on any surface).
    await focusByKeyboard(page, button);
    const focus = await focusStyle(button);
    expect(focus.focusVisible, `${name} :focus-visible`).toBe(true);
    expect(focus.outline, `${name} outline`).toBe('solid 3px rgb(75, 70, 115)');
    // box-shadow is transitioned (150 ms), so wait for the ring to settle.
    await expect
      .poll(async () => (await focusStyle(button)).boxShadow, { message: `${name} paper ring` })
      .toContain(PAPER_RING);
    await button.blur();
  }

  expect(await page.getByRole('meter').getAttribute('aria-valuenow')).toBe(capacityBefore);
});

test('focus ring stays visible on the dark top bar', async ({ page }, testInfo) => {
  await openDevUi(page);
  const bar = page.getByTestId('demo-top-bar');
  const back = bar.getByRole('button');
  await focusByKeyboard(page, back);
  const focus = await focusStyle(back);
  // The bar is brand-deep, the same colour as the outline: the paper ring is what shows.
  const barColor = await bar.evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(barColor).toBe('rgb(75, 70, 115)');
  expect(focus.focusVisible).toBe(true);
  await expect.poll(async () => (await focusStyle(back)).boxShadow).toContain(PAPER_RING);
  await bar.screenshot({ path: `${SHOTS}/dev-ui-${testInfo.project.name}-topbar-focus.png` });
});

test('Vietnamese diacritics close-up in all three fonts', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-1280', 'one close-up is enough');
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 3,
  });
  const page = await context.newPage();
  await openDevUi(page);
  for (const { sample } of FONTS) {
    await page
      .locator(`[data-font-sample="${sample}"]`)
      .screenshot({ path: `${SHOTS}/dev-ui-diacritics-${sample}@3x.png` });
  }
  await context.close();
});
