// @blockly/disable-top-blocks 13.3.0 ships plain JS without type declarations.
declare module '@blockly/disable-top-blocks' {
  /** Hides "disable" in the context menu of orphan blocks (pairs with Events.disableOrphans). */
  export class DisableTopBlocks {
    init(): void;
    dispose(): void;
  }
}
