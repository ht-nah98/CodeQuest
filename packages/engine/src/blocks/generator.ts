import type { Block, Workspace } from 'blockly';
import { JavascriptGenerator, javascriptGenerator } from 'blockly/javascript';
import { VAR_API_NAMES } from '../run/variables';

/** Sandbox function that records a highlight event; injected before every statement. */
export const HIGHLIGHT_FN = '__hl';

/**
 * Names child variables must never take: JavaScript keywords (Blockly's list) and the globals
 * js-interpreter defines. Fixed on purpose: Blockly's default adds every host global, which
 * differs between Node and browsers and would make generated code differ too.
 */
export const BASE_RESERVED_WORDS = [
  // JavaScript keywords and literals, as reserved by Blockly's JavascriptGenerator.
  'break,case,catch,class,const,continue,debugger,default,delete,do,else,export,extends,finally',
  'for,function,if,import,in,instanceof,new,return,super,switch,this,throw,try,typeof,var,void',
  'while,with,yield,enum,implements,interface,let,package,private,protected,public,static,await',
  'null,true,false,arguments',
  // Globals of the js-interpreter sandbox (initGlobal and friends).
  'Array,Boolean,Date,Error,EvalError,RangeError,ReferenceError,SyntaxError,TypeError,URIError',
  'Function,Infinity,JSON,Math,NaN,Number,Object,RegExp,String,undefined,eval,isFinite,isNaN',
  'parseFloat,parseInt,escape,unescape,decodeURI,decodeURIComponent,encodeURI',
  'encodeURIComponent,setTimeout,setInterval,clearTimeout,clearInterval,constructor,self,window',
  HIGHLIGHT_FN,
  // The engine's variable functions (ADR-0022), installed by runLevel for every kind.
  ...VAR_API_NAMES,
].join(',');

class EngineGenerator extends JavascriptGenerator {
  constructor() {
    super('JavaScript');
    this.RESERVED_WORDS_ = '';
    this.addReservedWords(BASE_RESERVED_WORDS);
  }

  /**
   * Blockly's `injectId` wraps the id in quotes without escaping, so an id containing `'` or
   * `\` would produce invalid code. Quote it like every other string literal instead.
   */
  override injectId(msg: string, block: Block): string {
    return msg.replace(/%1/g, () => this.quote_(block.id));
  }

  /**
   * Blockly builds `nameDB_` from the reserved words only once and `reset()` keeps the old
   * list, so API names registered later would not be reserved. Rebuild it on every compile.
   */
  override init(workspace: Workspace): void {
    delete this.nameDB_;
    super.init(workspace);
  }
}

/**
 * The engine's private JavaScript generator. A separate instance (instead of the shared
 * `javascriptGenerator`) keeps STATEMENT_PREFIX and reserved words from leaking into the web app.
 */
export const engineGenerator: JavascriptGenerator = new EngineGenerator();
Object.assign(engineGenerator.forBlock, javascriptGenerator.forBlock);
engineGenerator.STATEMENT_PREFIX = `${HIGHLIGHT_FN}(%1);\n`;
