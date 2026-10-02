import type { ReasonCode } from '@codequest/content-schema';

/**
 * Thrown by `ctx.stop()` to end a run early (collision or mid-run win). `runLevel` catches it
 * outside the interpreter loop; game code must not catch it.
 */
export class StopSignal extends Error {
  readonly result: 'success' | 'crash' | 'incomplete';
  readonly reasonCode: ReasonCode | null;

  constructor(result: 'success' | 'crash' | 'incomplete', reasonCode: ReasonCode | null) {
    super(`stopped: ${result}${reasonCode === null ? '' : ` ${reasonCode}`}`);
    this.name = 'StopSignal';
    this.result = result;
    this.reasonCode = reasonCode;
  }
}
