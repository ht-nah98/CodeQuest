import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
  },
});
