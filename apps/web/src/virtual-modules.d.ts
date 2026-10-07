/// <reference types="vite-plugin-pwa/vanillajs" />

declare module 'virtual:panda-sheet' {
  /** Raw JSON text of public/sprites/panda.json (see vite.config.ts). */
  const sheetJson: string;
  export default sheetJson;
}
