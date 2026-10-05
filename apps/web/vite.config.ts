import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

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

export default defineConfig({
  plugins: [react(), tailwindcss(), pandaSheetPlugin()],
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
});
