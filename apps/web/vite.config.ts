import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// The panda sheet JSON lives in public/ (PixiJS loads it by URL) but React code also needs its frame
// rects synchronously. Importing a public/ file from JS makes Vite warn, so serve it as a virtual module.
const PANDA_SHEET_FILE = fileURLToPath(new URL('./public/sprites/panda.json', import.meta.url));
function pandaSheetPlugin(): Plugin {
  const id = 'virtual:panda-sheet';
  return {
    name: 'codequest-panda-sheet',
    resolveId: (source) => (source === id ? `\0${id}` : undefined),
    load(loaded) {
      if (loaded !== `\0${id}`) return undefined;
      this.addWatchFile(PANDA_SHEET_FILE);
      return `export default ${JSON.stringify(readFileSync(PANDA_SHEET_FILE, 'utf8'))};`;
    },
  };
}

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

// Production CSP (security-privacy.md §3) without Supabase yet: P2-18 puts the same policy, plus
// the project's https/wss origins in connect-src, into vercel.json. `vite preview` sends it so the
// PWA e2e (e2e/pwa-offline.spec.ts) fails on any violation before production does.
const PREVIEW_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

const noCache = (res: ServerResponse) => {
  res.setHeader('Cache-Control', 'no-cache');
};

/**
 * `vite preview` only: sw.js is never HTTP-cached (as vercel.json does). Under CQ_E2E, a
 * `cq-e2e-build=<n>` cookie appends a comment to sw.js, so one browser context sees a "new deploy"
 * (a byte-different service worker) without rebuilding or touching dist/ for other workers.
 */
function previewServiceWorkerPlugin(): Plugin {
  return {
    name: 'codequest-preview-sw',
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== '/sw.js') {
          next();
          return;
        }
        noCache(res);
        const build = /(?:^|;\s*)cq-e2e-build=(\w+)/.exec(req.headers.cookie ?? '')?.[1];
        if (process.env['CQ_E2E'] !== '1' || build === undefined) {
          next();
          return;
        }
        res.setHeader('Content-Type', 'text/javascript');
        const sw = resolve(server.config.root, server.config.build.outDir, 'sw.js');
        res.end(`${readFileSync(sw, 'utf8')}\n// e2e build ${build}\n`);
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    pandaSheetPlugin(),
    // Offline play (P2-09, ADR-0020, deployment-ops.md "PWA"). No service worker in `npm run dev`.
    VitePWA({
      // Ask first: a waiting update is offered on the map and in settings, never forced
      // mid-level (features/pwa). Registration is done by features/pwa, not an injected script.
      registerType: 'prompt',
      injectRegister: false,
      devOptions: { enabled: false },
      // The browser fetches install icons online; precaching them would only cost space.
      includeManifestIcons: false,
      manifest: {
        name: 'CodeQuest · Phiêu lưu cùng Măng',
        short_name: 'CodeQuest',
        description: 'Học tư duy lập trình cùng gấu trúc Măng.',
        lang: 'vi',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#e9e4f3',
        theme_color: '#4b4673',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App shell, every JS chunk (content JSON is bundled into chunks), CSS, fonts, sprites,
        // tiles, Blockly media, music and sound effects. Budget: deployment-ops.md "PWA".
        globPatterns: ['**/*.{html,js,css,woff2,png,svg,gif,cur,mp3,json}'],
        // Voice lines grow with the curriculum: cached on first play instead (below).
        globIgnores: ['audio/voice/**', 'icons/icon-*.png', 'icons/apple-touch-icon.png'],
        // StageController (Pixi + Blockly) is ~1.3 MB; the default 2 MiB cap would be tight.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Same URL after a re-recording, so serve the cached copy and refresh it behind.
            urlPattern: /\/audio\/voice\/.+\.mp3$/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'cq-voice', expiration: { maxEntries: 1000 } },
          },
        ],
      },
    }),
    previewServiceWorkerPlugin(),
  ],
  resolve: {
    // Blockly keeps global registries; a second copy would not see registered blocks.
    dedupe: ['blockly'],
    alias: {
      // content/ lives outside apps/web; a '/content/**' glob would silently match nothing.
      '@content': fileURLToPath(new URL('../../content', import.meta.url)),
      vm: fileURLToPath(new URL('./src/lib/vmStub.ts', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    fs: { allow: [repoRoot] },
    // The e2e servers (playwright.config.ts sets CQ_E2E) must not watch files: any save in the repo
    // (another editor, an agent, `git checkout`) makes Vite push a full "page reload" to every open
    // test page, which destroys the page context mid-test ("Execution context was destroyed",
    // stage never ready, AudioContext errors). A run tests the code as it was when the server started.
    ...(process.env['CQ_E2E'] === '1' && { hmr: false, watch: null }),
  },
  preview: {
    headers: { 'Content-Security-Policy': PREVIEW_CSP },
  },
});
