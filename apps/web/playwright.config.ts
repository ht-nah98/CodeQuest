import { defineConfig, devices } from '@playwright/test';

// A dedicated port, never the coach's own dev server (5173, which has the real coach PIN):
// `npm run e2e` always starts (or reuses) its own server here. PW_PORT overrides it.
const PORT = process.env['PW_PORT'] ?? '5199';
const BASE_URL = `http://localhost:${PORT}`;
// Coach review profile (coach-profile.spec.ts) needs a dev server built with a *fake* PIN, while
// every other spec needs none (they expect a first run). So there are two servers: kids on PORT,
// coach on COACH_PORT. The spec picks the second one through these env vars (workers inherit them).
const COACH_PORT = process.env['PW_COACH_PORT'] ?? String(Number(PORT) + 1);
const COACH_PIN = process.env['E2E_COACH_PIN'] ?? '2468';
process.env['E2E_COACH_PIN'] = COACH_PIN;
process.env['E2E_COACH_URL'] = `http://localhost:${COACH_PORT}`;

export default defineConfig({
  testDir: './e2e',
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // Vite dev servers + WebGL on a laptop-size machine: 8 parallel workers starve the stage into
  // 30 s timeouts. 4 is stable on 8 GB.
  workers: 4,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    // WSL2 / CI have no audio device: without this Chromium may log "The AudioContext encountered
    // an error from the audio device" (a console error the specs rightly treat as failure).
    launchOptions: { args: ['--mute-audio'] },
    locale: 'vi-VN',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  // Target laptops: minimum 1280×720, common 1366×768 (ADR-0011).
  projects: [
    {
      name: 'chromium-1280',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'chromium-1366',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } },
    },
  ],
  // Each server has its own port and its own VITE_COACH_PIN (overrides apps/web/.env.local).
  webServer: [
    {
      command: `npm run dev -- --port ${PORT} --strictPort`,
      env: { VITE_COACH_PIN: '' },
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npm run dev -- --port ${COACH_PORT} --strictPort`,
      env: { VITE_COACH_PIN: COACH_PIN },
      url: `http://localhost:${COACH_PORT}`,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
