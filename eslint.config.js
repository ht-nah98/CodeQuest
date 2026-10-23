import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Package boundaries: docs/architecture/overview.md §2. Headless rules: ADR-0006.

const DEEP_IMPORT = {
  group: ['@codequest/*/*', '**/packages/*/src/**', '../../*/src', '../../*/src/**'],
  message: 'Import other packages through their public index only (coding-standards.md §3).',
};

const SRC = '{ts,tsx,mts,cts,js,mjs,cjs}';

const NODE_IO_MODULES = ['node:*', 'fs', 'fs/*', 'path', 'http', 'https', 'net', 'child_process'];

const BROWSER_ONLY_LIBS = [
  'react',
  'react/*',
  'react-dom',
  'react-dom/*',
  'react-router',
  'pixi.js',
  'motion',
  'motion/*',
  'howler',
  'zustand',
  'zustand/*',
  'dexie',
  'dexie-react-hooks',
  '@supabase/*',
  '@blockly/*',
];

/** Builds `no-restricted-imports` for one package; each package needs its own full list. */
function restrictImports(forbidden, reason) {
  return [
    'error',
    {
      patterns: [DEEP_IMPORT, { group: forbidden, message: reason }],
    },
  ];
}

const HEADLESS_REASON =
  'Headless packages must run on plain Node and respect the dependency graph (overview.md §2).';

const BROWSER_GLOBALS = [
  'window',
  'document',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'navigator',
  'self',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'requestAnimationFrame',
];
const HEADLESS_MESSAGE = 'Headless packages must not touch the DOM or browser APIs (ADR-0006).';
const HEADLESS_GLOBALS = BROWSER_GLOBALS.map((name) => ({ name, message: HEADLESS_MESSAGE }));
// no-restricted-globals does not see `globalThis.window`.
const HEADLESS_GLOBAL_THIS = BROWSER_GLOBALS.map((property) => ({
  object: 'globalThis',
  property,
  message: HEADLESS_MESSAGE,
}));

const NONDETERMINISTIC_PROPERTIES = [
  {
    object: 'Math',
    property: 'random',
    message: 'Simulation must be deterministic: use ctx.rng (runtime-engine.md).',
  },
  {
    object: 'Date',
    property: 'now',
    message: 'Simulation must be deterministic: use the step counter or a `now` argument.',
  },
  ...['now'].map((property) => ({
    object: 'performance',
    property,
    message: 'Simulation must be deterministic: use the step counter.',
  })),
  ...['getRandomValues', 'randomUUID'].map((property) => ({
    object: 'crypto',
    property,
    message: 'Simulation must be deterministic: use ctx.rng (runtime-engine.md).',
  })),
];

const WALL_CLOCK = {
  name: 'Date',
  message: 'Engine and simulation must not depend on wall-clock time.',
};

export default defineConfig(
  globalIgnores([
    '**/node_modules/',
    '**/dist/',
    '**/dist-e2e/',
    '**/coverage/',
    '**/.tsbuild/',
    '**/playwright-report/',
    '**/test-results/',
    'apps/web/public/',
    '**/.omc/',
    // Vendored copy of Pythaverse's own message file, kept only to diff against.
    'tools/lbeditor-vi/upstream-leanbot_vi.js',
  ]),

  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-console': 'error',
      'no-restricted-imports': ['error', { patterns: [DEEP_IMPORT] }],
    },
  },
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },

  // Headless packages.
  {
    files: [`packages/**/*.${SRC}`],
    rules: {
      'no-restricted-globals': ['error', ...HEADLESS_GLOBALS],
      'no-restricted-properties': [
        'error',
        ...NONDETERMINISTIC_PROPERTIES,
        ...HEADLESS_GLOBAL_THIS,
      ],
    },
  },
  {
    files: [`packages/content-schema/**/*.${SRC}`],
    rules: {
      'no-restricted-imports': restrictImports(
        [
          '@codequest/*',
          'blockly',
          'blockly/*',
          'js-interpreter',
          ...NODE_IO_MODULES,
          ...BROWSER_ONLY_LIBS,
        ],
        HEADLESS_REASON,
      ),
    },
  },
  {
    files: [`packages/engine/**/*.${SRC}`],
    rules: {
      'no-restricted-imports': restrictImports(
        [
          '@codequest/games',
          '@codequest/rewards',
          '@codequest/validator',
          '@codequest/web',
          '@codequest/content-check',
          ...BROWSER_ONLY_LIBS,
        ],
        HEADLESS_REASON,
      ),
      'no-restricted-globals': ['error', ...HEADLESS_GLOBALS, WALL_CLOCK],
    },
  },
  {
    files: [`packages/games/**/*.${SRC}`],
    rules: {
      'no-restricted-imports': restrictImports(
        [
          '@codequest/rewards',
          '@codequest/validator',
          '@codequest/web',
          '@codequest/content-check',
          ...BROWSER_ONLY_LIBS,
        ],
        HEADLESS_REASON,
      ),
      'no-restricted-globals': ['error', ...HEADLESS_GLOBALS, WALL_CLOCK],
    },
  },
  {
    files: [`packages/rewards/**/*.${SRC}`],
    rules: {
      'no-restricted-imports': restrictImports(
        [
          '@codequest/engine',
          '@codequest/games',
          '@codequest/validator',
          '@codequest/web',
          '@codequest/content-check',
          ...NODE_IO_MODULES,
          'blockly',
          'blockly/*',
          'js-interpreter',
          ...BROWSER_ONLY_LIBS,
        ],
        'Rewards are pure functions over content-schema types (rewards-engine.md).',
      ),
    },
  },

  {
    // Runs in content:check, npm run par and the browser level editor (P2-07).
    files: [`packages/validator/**/*.${SRC}`],
    rules: {
      'no-restricted-imports': restrictImports(
        [
          '@codequest/rewards',
          '@codequest/web',
          '@codequest/content-check',
          '@codequest/par',
          ...NODE_IO_MODULES,
          ...BROWSER_ONLY_LIBS,
        ],
        HEADLESS_REASON,
      ),
      'no-restricted-globals': ['error', ...HEADLESS_GLOBALS, WALL_CLOCK],
    },
  },

  // Node tools and scripts print to the terminal.
  {
    files: [`tools/**/*.${SRC}`],
    rules: {
      'no-console': 'off',
      'no-restricted-imports': restrictImports(
        ['@codequest/web', '**/apps/web/**'],
        'Tools must not depend on the web app (overview.md §2).',
      ),
    },
  },
  {
    files: ['apps/web/scripts/**/*.js'],
    rules: { 'no-console': 'off' },
  },

  // tools/lbeditor-vi ships code that runs inside Pythaverse's own page, not in this repo's
  // build: the userscript and the drop-in message file see `window`, `Blockly` and Closure's
  // `goog`, and the checker is a standalone .mjs that no tsconfig covers. Both are therefore
  // outside the type-aware program (docs/leanbot/nen-tang/pythaverse.md §4).
  {
    files: ['tools/lbeditor-vi/**/*.{js,mjs}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, Blockly: 'readonly', goog: 'readonly' },
    },
  },

  // tools/leanbot-art and tools/pythaverse-blocks are standalone Node scripts that drive a browser: the code passed to
  // `evaluate` runs inside Pythaverse's block editor, where `Blockly` is a global.
  {
    files: ['tools/leanbot-art/**/*.mjs', 'tools/pythaverse-blocks/**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: { 'no-console': 'off' },
  },

  // Web app.
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat['recommended-latest']],
    languageOptions: { globals: globals.browser },
  },
);
