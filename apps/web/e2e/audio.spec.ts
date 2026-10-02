import { expect, test } from '@playwright/test';
import { signInTestProfile } from './helpers';

// P1-14: sounds load from the app itself after the first gesture, the settings sliders play a
// preview, and nothing errors. (Whether it sounds nice is the coach's call: audio is not heard.)

const LOCAL_ORIGIN = /^(https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/|data:|blob:)/;
const SHOTS = 'test-results/screenshots';

test('settings volume sliders play sounds without errors or third-party requests', async ({
  page,
}, testInfo) => {
  const foreign: string[] = [];
  const errors: string[] = [];
  const audioResponses = new Map<string, number>();
  page.on('request', (request) => {
    if (!LOCAL_ORIGIN.test(request.url())) foreign.push(request.url());
  });
  page.on('response', (response) => {
    const path = new URL(response.url()).pathname;
    if (path.startsWith('/audio/')) audioResponses.set(path, response.status());
  });
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await signInTestProfile(page);
  await page.goto('/settings');
  const sfx = page.getByRole('slider', { name: 'Hiệu ứng' });
  await expect(sfx).toBeVisible();

  // Nothing is fetched before the first gesture (autoplay policy).
  expect([...audioResponses.keys()]).toEqual([]);

  // Keyboard on the slider: the first keydown unlocks audio, each step previews a coin.
  await sfx.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('label', { has: sfx })).toContainText('70');
  await page.keyboard.press('ArrowRight');
  const music = page.getByRole('slider', { name: 'Nhạc nền' });
  await music.focus();
  await page.keyboard.press('ArrowLeft');

  await expect.poll(() => audioResponses.get('/audio/sfx/coin.mp3')).toBe(200);
  await expect.poll(() => audioResponses.get('/audio/music/village.mp3')).toBe(200);
  for (const [path, status] of audioResponses) expect(status, path).toBe(200);

  // The browser can decode the generated MP3s.
  const duration = await page.evaluate(async () => {
    const bytes = await (await fetch('/audio/sfx/star.mp3')).arrayBuffer();
    const buffer = await new OfflineAudioContext(1, 1, 22050).decodeAudioData(bytes);
    return buffer.duration;
  });
  expect(duration).toBeGreaterThan(0.2);
  expect(duration).toBeLessThan(1);

  // A ui/Button click (delegated click sound) does not break anything either.
  await page.getByRole('button', { name: 'Mở bằng PIN' }).click();
  await page.keyboard.press('Escape');

  expect(foreign).toEqual([]);
  expect(errors).toEqual([]);
  await page.screenshot({ path: `${SHOTS}/audio-settings-${testInfo.project.name}.png` });
});
