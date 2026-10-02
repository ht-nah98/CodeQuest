// Minimal typings for js-interpreter 6.0.2 (NeilFraser/JS-Interpreter), covering only what the
// engine uses. Source of truth: node_modules/js-interpreter/lib/js-interpreter.js.
declare module 'js-interpreter' {
  namespace Interpreter {
    /** An object living inside the sandbox; never a native JS object. */
    interface PseudoObject {
      readonly properties: Record<string, Value>;
    }
    type Value = PseudoObject | string | number | boolean | null | undefined;
    interface PropertyDescriptor {
      readonly configurable?: boolean;
      readonly enumerable?: boolean;
      readonly writable?: boolean;
    }
  }

  class Interpreter {
    /** Parses `code` (ES5) and runs polyfills; `initFunc` installs the API on the global object. */
    constructor(
      code: string,
      initFunc?: (interpreter: Interpreter, globalObject: Interpreter.PseudoObject) => void,
    );

    static readonly Status: {
      readonly DONE: 0;
      readonly STEP: 1;
      readonly TASK: 2;
      readonly ASYNC: 3;
    };
    static readonly NONENUMERABLE_DESCRIPTOR: Interpreter.PropertyDescriptor;
    /** Node's `vm` module when loaded, used by REGEXP_MODE 2; null in browsers. */
    static vm: unknown;

    /** 0 = no RegExp, 1 = native RegExp, 2 (default) = sandboxed in a Worker or Node's vm. */
    REGEXP_MODE: 0 | 1 | 2;

    readonly globalObject: Interpreter.PseudoObject;
    /** Executes one step; false when nothing is left to run. Rethrows errors from native functions. */
    step(): boolean;
    /** Runs to completion. Vulnerable to infinite loops: the engine never calls it. */
    run(): boolean;
    getStatus(): 0 | 1 | 2 | 3;
    createNativeFunction(
      nativeFunc: (...args: Interpreter.Value[]) => Interpreter.Value,
      isConstructor?: boolean,
    ): Interpreter.PseudoObject;
    getProperty(obj: Interpreter.Value, name: string): Interpreter.Value;
    setProperty(
      obj: Interpreter.PseudoObject,
      name: string,
      value: Interpreter.Value,
      descriptor?: Interpreter.PropertyDescriptor,
    ): void;
    nativeToPseudo(nativeObj: unknown): Interpreter.Value;
    pseudoToNative(pseudoObj: Interpreter.Value): unknown;
  }

  export default Interpreter;
}
