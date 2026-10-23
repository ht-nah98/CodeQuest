import { serialization, Workspace } from 'blockly';
import { LB_COMBOS, LB_LEDS, LB_TOUCH_PADS } from './blocks';

// Arduino code → Leanbot blocks, for code in the standard form: what Pythaverse's editor (and
// `toArduino`) prints. Not a C++ parser: a line outside that form is reported and left out,
// never guessed (docs/product/the-gioi-leanbot.md §1). Where two blocks print the same code
// (`LbDelay` of "Chờ" and of "Di chuyển: Tiếp tục…"), the first one of the toolbox is chosen.

/** Why a line could not become a block. */
export type ParseProblemReason =
  /** Not something a Leanbot block prints, or a value that does not fit where it is. */
  | 'unknown'
  /** `LbMission.begin(…);` with no `LbMission.end();` after it. */
  | 'missing-end'
  /** `Leanbot.tone(f, d);` not followed by `LbDelay(d);`. */
  | 'tone-without-delay'
  /** Something in `setup()` or at the top that no block prints there. */
  | 'outside-loop';

export interface ParseProblem {
  /** 1-based line in the source. */
  line: number;
  reason: ParseProblemReason;
}

/** Blockly's JSON serialization of one block (the parts this reader writes). */
export interface BlockState {
  type: string;
  id: string;
  x?: number;
  y?: number;
  fields?: Record<string, string | number | boolean | { id: string }>;
  inputs?: Record<string, { block?: BlockState; shadow?: BlockState }>;
  next?: { block: BlockState };
  extraState?: unknown;
}

interface VariableState {
  name: string;
  id: string;
  type: string;
}

export interface ParseResult {
  /** `serialization.workspaces.load` input. */
  workspace: {
    blocks: { languageVersion: 0; blocks: BlockState[] };
    variables: VariableState[];
  };
  problems: ParseProblem[];
  /** 1-based source line of every block made from a statement, by block id. */
  lineOf: Record<string, number>;
}

// ── Tokens ──

type TokenKind = 'id' | 'num' | 'str' | 'chr' | 'punct' | 'comment' | 'pre' | 'other';
interface Token {
  kind: TokenKind;
  text: string;
  line: number;
}

const PUNCT2 = ['::', '==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-='];
const PUNCT1 = '(){}[];,.<>=!+-*/%&|?:';

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let line = 1;
  let i = 0;
  const push = (kind: TokenKind, text: string) => {
    tokens.push({ kind, text, line });
    line += text.split('\n').length - 1;
    i += text.length;
  };
  while (i < src.length) {
    const c = src.charAt(i);
    const rest = src.slice(i);
    if (c === '\n') {
      line++;
      i++;
    } else if (/\s/.test(c)) {
      i++;
    } else if (rest.startsWith('//')) {
      const end = rest.indexOf('\n');
      const text = end < 0 ? rest : rest.slice(0, end);
      tokens.push({ kind: 'comment', text: text.slice(2).replace(/^ /, ''), line });
      i += text.length;
    } else if (rest.startsWith('/*')) {
      const end = rest.indexOf('*/');
      push('other', end < 0 ? rest : rest.slice(0, end + 2));
    } else if (c === '#') {
      const end = rest.indexOf('\n');
      push('pre', end < 0 ? rest : rest.slice(0, end));
    } else if (c === '"' || c === "'") {
      const match = (c === '"' ? /^"(\\[\s\S]|[^"\\\n])*"/ : /^'(\\[\s\S]|[^'\\\n])*'/).exec(rest);
      push(match ? (c === '"' ? 'str' : 'chr') : 'other', match ? match[0] : c);
    } else {
      const match =
        /^0[xX][0-9a-fA-F]+/.exec(rest) ??
        /^(\d+\.?\d*|\.\d+)/.exec(rest) ??
        /^[A-Za-z_]\w*/.exec(rest);
      if (match) {
        push(/^[A-Za-z_]/.test(match[0]) ? 'id' : 'num', match[0]);
      } else {
        const two = PUNCT2.find((p) => rest.startsWith(p));
        push(two !== undefined || PUNCT1.includes(c) ? 'punct' : 'other', two ?? c);
      }
    }
  }
  return tokens;
}

// ── Syntax tree ──

type Expr =
  | { k: 'num'; text: string }
  | { k: 'str'; text: string }
  | { k: 'chr'; text: string }
  | { k: 'word'; path: string }
  | { k: 'call'; path: string; args: Expr[] }
  | { k: 'index'; path: string; index: Expr }
  | { k: 'unary'; op: string; x: Expr }
  | { k: 'bin'; op: string; a: Expr; b: Expr }
  | { k: 'cond'; c: Expr; a: Expr; b: Expr }
  | { k: 'paren'; x: Expr };

type Stmt = { line: number } & (
  | { k: 'comment'; text: string }
  | { k: 'expr'; e: Expr }
  | { k: 'assign'; target: Expr; e: Expr }
  | { k: 'decl'; type: string; name: string; e: Expr | null }
  | { k: 'if'; branches: { cond: Expr; body: Stmt[] }[]; otherwise: Stmt[] | null }
  | { k: 'for'; v: string; from: Expr; cmp: string; to: Expr; step: string }
  | { k: 'while'; cond: Expr; body: Stmt[] | null }
  | { k: 'section'; comment: string; body: Stmt[] }
  | { k: 'switch'; v: string; cases: { e: Expr; body: Stmt[] }[]; otherwise: Stmt[] | null }
  | { k: 'flow'; word: 'break' | 'continue' }
  | { k: 'return'; e: Expr | null }
  | { k: 'bad' }
) & { body?: Stmt[] | null };

class SyntaxProblem extends Error {}

/** C precedence, loosest first. */
const BINARY_LEVELS: readonly (readonly string[])[] = [
  ['||'],
  ['&&'],
  ['==', '!='],
  ['<', '<=', '>', '>='],
  ['+', '-'],
  ['*', '/', '%'],
];

class Cursor {
  constructor(
    readonly tokens: readonly Token[],
    public pos: number,
    readonly end: number,
  ) {}
  peek(offset = 0): Token | undefined {
    const at = this.pos + offset;
    return at < this.end ? this.tokens[at] : undefined;
  }
  is(text: string, offset = 0): boolean {
    const t = this.peek(offset);
    return t !== undefined && t.kind !== 'comment' && t.kind !== 'str' && t.text === text;
  }
  take(): Token {
    const t = this.peek();
    if (t === undefined) throw new SyntaxProblem('end');
    this.pos++;
    return t;
  }
  expect(text: string): Token {
    if (!this.is(text)) throw new SyntaxProblem(text);
    return this.take();
  }
  id(): string {
    const t = this.take();
    if (t.kind !== 'id') throw new SyntaxProblem(t.text);
    return t.text;
  }
  done(): boolean {
    return this.pos >= this.end;
  }
}

function parseExpr(cur: Cursor): Expr {
  const c = parseBinary(cur, 0);
  if (!cur.is('?')) return c;
  cur.take();
  const a = parseExpr(cur);
  cur.expect(':');
  return { k: 'cond', c, a, b: parseExpr(cur) };
}

function parseBinary(cur: Cursor, level: number): Expr {
  if (level >= BINARY_LEVELS.length) return parseUnary(cur);
  let left = parseBinary(cur, level + 1);
  const ops = BINARY_LEVELS[level] ?? [];
  for (let t = cur.peek(); t?.kind === 'punct' && ops.includes(t.text); t = cur.peek()) {
    cur.take();
    left = { k: 'bin', op: t.text, a: left, b: parseBinary(cur, level + 1) };
  }
  return left;
}

function parseUnary(cur: Cursor): Expr {
  if (cur.is('!') || cur.is('-')) {
    const op = cur.take().text;
    return { k: 'unary', op, x: parseUnary(cur) };
  }
  return parsePrimary(cur);
}

function parsePrimary(cur: Cursor): Expr {
  const t = cur.take();
  if (t.kind === 'num') return { k: 'num', text: t.text };
  if (t.kind === 'str') return { k: 'str', text: t.text };
  if (t.kind === 'chr') return { k: 'chr', text: t.text };
  if (t.kind === 'punct' && t.text === '(') {
    const x = parseExpr(cur);
    cur.expect(')');
    return { k: 'paren', x };
  }
  if (t.kind !== 'id') throw new SyntaxProblem(t.text);
  let path = t.text;
  while (cur.is('.') || cur.is('::')) path += cur.take().text + cur.id();
  if (cur.is('[')) {
    cur.take();
    const index = parseExpr(cur);
    cur.expect(']');
    return { k: 'index', path, index };
  }
  if (!cur.is('(')) return { k: 'word', path };
  cur.take();
  const args: Expr[] = [];
  if (!cur.is(')')) {
    args.push(parseExpr(cur));
    while (cur.is(',')) {
      cur.take();
      args.push(parseExpr(cur));
    }
  }
  cur.expect(')');
  return { k: 'call', path, args };
}

/** Index of the `}` that closes the `{` at `open`, or `end` if it is missing. */
function matching(tokens: readonly Token[], open: number, end: number): number {
  let depth = 0;
  for (let i = open; i < end; i++) {
    const t = tokens[i];
    if (t?.kind !== 'punct') continue;
    if (t.text === '{') depth++;
    else if (t.text === '}' && --depth === 0) return i;
  }
  return end;
}

/** Skips a statement the reader does not know: up to `;`, or over a `{…}` and its `else`s. */
function skipStatement(cur: Cursor): void {
  let depth = 0;
  while (!cur.done()) {
    const t = cur.take();
    if (t.kind !== 'punct') continue;
    if (t.text === '(' || t.text === '[') depth++;
    else if (t.text === ')' || t.text === ']') depth--;
    else if (t.text === ';' && depth <= 0) return;
    else if (t.text === '{') {
      cur.pos = matching(cur.tokens, cur.pos - 1, cur.end) + 1;
      if (cur.is('else')) {
        cur.take();
        continue;
      }
      return;
    } else if (t.text === '}' && depth <= 0) {
      cur.pos--;
      return;
    }
  }
}

const TYPES = ['int', 'float', 'String', 'bool', 'auto'];

function parseBody(cur: Cursor): Stmt[] {
  cur.expect('{');
  const close = matching(cur.tokens, cur.pos - 1, cur.end);
  const body = parseStatements(new Cursor(cur.tokens, cur.pos, close));
  cur.pos = close + 1;
  return body;
}

function parseStatements(cur: Cursor): Stmt[] {
  const out: Stmt[] = [];
  while (!cur.done()) {
    const start = cur.pos;
    const line = cur.peek()?.line ?? 0;
    try {
      const stmt = parseStatement(cur);
      if (stmt) out.push(stmt);
    } catch (e) {
      if (!(e instanceof SyntaxProblem)) throw e;
      cur.pos = start;
      skipStatement(cur);
      if (cur.pos === start) cur.take();
      out.push({ k: 'bad', line });
    }
  }
  return out;
}

function parseStatement(cur: Cursor): Stmt | null {
  const t = cur.peek();
  if (t === undefined) return null;
  const line = t.line;
  if (t.kind === 'comment') {
    cur.take();
    return { k: 'comment', text: t.text, line };
  }
  if (cur.is(';')) {
    cur.take();
    return null;
  }
  if (cur.is('{')) {
    const next = cur.peek(1);
    const comment = next?.kind === 'comment' && next.line === line ? next.text : '';
    const close = matching(cur.tokens, cur.pos, cur.end);
    const inner = new Cursor(cur.tokens, cur.pos + 1 + (comment ? 1 : 0), close);
    const body = parseStatements(inner);
    cur.pos = close + 1;
    return { k: 'section', comment, body, line };
  }
  if (cur.is('if')) {
    const branches: { cond: Expr; body: Stmt[] }[] = [];
    let otherwise: Stmt[] | null = null;
    cur.take();
    for (;;) {
      cur.expect('(');
      const cond = parseExpr(cur);
      cur.expect(')');
      branches.push({ cond, body: parseBody(cur) });
      if (!cur.is('else')) break;
      cur.take();
      if (!cur.is('if')) {
        otherwise = parseBody(cur);
        break;
      }
      cur.take();
    }
    return { k: 'if', branches, otherwise, line };
  }
  if (cur.is('for')) {
    cur.take();
    cur.expect('(');
    cur.expect('int');
    const v = cur.id();
    cur.expect('=');
    const from = parseExpr(cur);
    cur.expect(';');
    cur.expect(v);
    const cmp = cur.take().text;
    const to = parseExpr(cur);
    cur.expect(';');
    cur.expect(v);
    let step = cur.take().text;
    if (step === '+=' || step === '-=') step += cur.take().text;
    cur.expect(')');
    return { k: 'for', v, from, cmp, to, step, body: parseBody(cur), line };
  }
  if (cur.is('while')) {
    cur.take();
    cur.expect('(');
    const cond = parseExpr(cur);
    cur.expect(')');
    if (cur.is(';')) {
      cur.take();
      return { k: 'while', cond, body: null, line };
    }
    return { k: 'while', cond, body: parseBody(cur), line };
  }
  if (cur.is('switch')) {
    cur.take();
    cur.expect('(');
    const v = cur.id();
    cur.expect(')');
    cur.expect('{');
    const close = matching(cur.tokens, cur.pos - 1, cur.end);
    const cases: { e: Expr; body: Stmt[] }[] = [];
    let otherwise: Stmt[] | null = null;
    while (cur.pos < close) {
      if (cur.is('case')) {
        cur.take();
        const e = parseExpr(cur);
        cur.expect(':');
        const body = caseBody(cur, close);
        cases.push({ e, body });
      } else if (cur.is('default')) {
        cur.take();
        cur.expect(':');
        otherwise = caseBody(cur, close);
      } else {
        throw new SyntaxProblem('switch');
      }
    }
    cur.pos = close + 1;
    return { k: 'switch', v, cases, otherwise, line };
  }
  if (cur.is('break') || cur.is('continue')) {
    const word = cur.take().text as 'break' | 'continue';
    cur.expect(';');
    return { k: 'flow', word, line };
  }
  if (cur.is('return')) {
    cur.take();
    const e = cur.is(';') ? null : parseExpr(cur);
    cur.expect(';');
    return { k: 'return', e, line };
  }
  if (t.kind === 'id' && TYPES.includes(t.text) && cur.peek(1)?.kind === 'id') {
    const type = cur.take().text;
    const name = cur.id();
    let e: Expr | null = null;
    if (cur.is('=')) {
      cur.take();
      e = parseExpr(cur);
    }
    cur.expect(';');
    return { k: 'decl', type, name, e, line };
  }
  const e = parseExpr(cur);
  if (cur.is('=')) {
    cur.take();
    const value = parseExpr(cur);
    cur.expect(';');
    return { k: 'assign', target: e, e: value, line };
  }
  cur.expect(';');
  return { k: 'expr', e, line };
}

/** Statements of one `case`, up to its `break;` (dropped) or the next label. */
function caseBody(cur: Cursor, close: number): Stmt[] {
  const body: Stmt[] = [];
  while (cur.pos < close && !cur.is('case') && !cur.is('default')) {
    if (cur.is('break') && cur.is(';', 1)) {
      cur.pos += 2;
      break;
    }
    const inner = new Cursor(cur.tokens, cur.pos, close);
    const stmt = parseStatement(inner);
    cur.pos = inner.pos;
    if (stmt) body.push(stmt);
  }
  return body;
}

// ── Blocks ──

const COMPARE_IDS: Readonly<Record<string, string>> = {
  '==': 'EQ',
  '!=': 'NEQ',
  '<': 'LT',
  '<=': 'LTE',
  '>': 'GT',
  '>=': 'GTE',
};
const ARITH_IDS: Readonly<Record<string, string>> = {
  '+': 'ADD',
  '-': 'MINUS',
  '*': 'MULTIPLY',
  '/': 'DIVIDE',
};
const MISSIONS = ['msNumberGrid', 'SWRP3.M04', 'ms1.1', 'ms11.1', 'ms11.2', 'ms12.1'];
const VAR_TYPE_OF: Readonly<Record<string, string>> = {
  int: 'int',
  float: 'float',
  String: 'String',
  bool: 'bool',
};

class Unreadable extends Error {
  constructor(readonly reason: ParseProblemReason = 'unknown') {
    super(reason);
  }
}

interface Fn {
  returns: boolean;
  params: string[];
}

class Builder {
  private count = 0;
  readonly problems: ParseProblem[] = [];
  readonly lineOf: Record<string, number> = {};
  readonly variables = new Map<string, VariableState>();
  readonly functions = new Map<string, Fn>();
  /** Value blocks standing alone (a value on its own line); each is its own stack. */
  readonly loose = new Set<string>();

  id(): string {
    this.count++;
    return `lb${String(this.count)}`;
  }

  block(type: string, rest: Omit<BlockState, 'type' | 'id'> = {}): BlockState {
    return { type, id: this.id(), ...rest };
  }

  problem(line: number, reason: ParseProblemReason): void {
    if (!this.problems.some((p) => p.line === line)) this.problems.push({ line, reason });
  }

  /** The variable named `name`, made with `type` the first time it is seen. */
  variable(name: string, type: string): { id: string } {
    let v = this.variables.get(name);
    if (!v) {
      v = { name, id: `v_${name}`, type };
      this.variables.set(name, v);
    }
    return { id: v.id };
  }

  typeOf(name: string): string | undefined {
    return this.variables.get(name)?.type;
  }
}

const num = (b: Builder, text: string): BlockState =>
  b.block('math_number', { fields: { NUM: Number(text) } });

/** An input holding `e`: a plain number goes in as the input's own number, like the toolbox. */
function input(b: Builder, e: Expr): { block?: BlockState; shadow?: BlockState } {
  const n = numberText(e);
  if (n !== null) return { shadow: num(b, n) };
  return { block: value(b, e) };
}

function numberText(e: Expr | undefined): string | null {
  if (e?.k === 'num' && !/^0x/i.test(e.text)) return e.text;
  if (e?.k === 'unary' && e.op === '-' && e.x.k === 'num' && !/^0x/i.test(e.x.text)) {
    return `-${e.x.text}`;
  }
  return null;
}

const isCall = (e: Expr | undefined, path: string, arity = 0): e is Extract<Expr, { k: 'call' }> =>
  e?.k === 'call' && e.path === path && e.args.length === arity;
const isWord = (e: Expr | undefined, path: string) => e?.k === 'word' && e.path === path;
const wordOf = (e: Expr | undefined) => (e?.k === 'word' ? e.path : null);
const strip = (e: Expr): Expr => (e.k === 'paren' ? strip(e.x) : e);

/** `"…"` back to the text Pythaverse's text block holds. */
function unquote(text: string): string {
  return text.slice(1, -1).replace(/\\(.)/g, (_, c: string) => (c === 'n' ? '\\n' : c));
}

function colour(b: Builder, e: Expr): BlockState {
  const x = strip(e);
  if (x.k === 'num' && /^0x[0-9a-f]{6}$/i.test(x.text)) {
    return b.block('LbRGB.colour_picker', {
      fields: { Color: `#${x.text.slice(2).toLowerCase()}` },
    });
  }
  if (isCall(x, 'CRGB', 3) && x.args.every((a) => isCall(a, 'random8'))) {
    return b.block('LbRGB.colour_random');
  }
  throw new Unreadable();
}

function value(b: Builder, e: Expr): BlockState {
  // Bracketed forms first: the bracket is how the printing block tells itself apart.
  if (e.k === 'paren') {
    const x = e.x;
    if (x.k === 'bin' && x.op === '==' && isCall(x.a, 'LbTouch.read', 1) && isWord(x.b, 'HIGH')) {
      const pad = wordOf(x.a.args[0]);
      if (pad !== null && (LB_TOUCH_PADS as readonly string[]).includes(pad)) {
        return b.block('LbTouch.read', { fields: { touchX: pad } });
      }
    }
    if (x.k === 'bin' && COMPARE_IDS[x.op] !== undefined) {
      const state = numberText(x.b);
      if (
        isCall(x.a, 'LbIRLine.value') &&
        state !== null &&
        /^\d+$/.test(state) &&
        Number(state) <= 15
      ) {
        const n = Number(state);
        const eye = (bit: number) => ((n >> bit) & 1 ? '#000000' : '#ffffff');
        return b.block('logic_compare', {
          fields: { OP: COMPARE_IDS[x.op] ?? 'EQ' },
          inputs: {
            A: { block: b.block('LbIRLine.value') },
            B: {
              block: b.block('LbIRLine.state', {
                fields: { state0: eye(3), state1: eye(2), state2: eye(1), state3: eye(0) },
              }),
            },
          },
        });
      }
      return b.block('logic_compare', {
        fields: { OP: COMPARE_IDS[x.op] ?? 'EQ' },
        inputs: { A: input(b, x.a), B: input(b, x.b) },
      });
    }
    if (x.k === 'call' && ['max', 'min', 'pow'].includes(x.path) && x.args.length === 2) {
      return multiple2(b, x);
    }
    return value(b, x);
  }
  const n = numberText(e);
  if (n !== null) return num(b, n);
  if (e.k === 'num') return colour(b, e);
  switch (e.k) {
    case 'str':
      return b.block('text', { fields: { TEXT: unquote(e.text) } });
    case 'word': {
      if (e.path === 'true' || e.path === 'false') {
        return b.block('logic_boolean', { fields: { BOOL: e.path === 'true' ? 'TRUE' : 'FALSE' } });
      }
      if (e.path === 'null') return b.block('logic_null');
      if (e.path === 'HIGH' || e.path === 'LOW') {
        return b.block('board_base_inout_highlow', { fields: { BOOL: e.path } });
      }
      if (['PI', 'HALF_PI', 'TWO_PI'].includes(e.path)) {
        return b.block('math_constant', { fields: { CONSTANT: e.path } });
      }
      return variableGet(b, e.path);
    }
    case 'unary':
      if (e.op === '!')
        return b.block('logic_negate', { inputs: { BOOL: { block: value(b, e.x) } } });
      throw new Unreadable();
    case 'cond':
      return b.block('logic_ternary', {
        inputs: {
          IF: { block: value(b, e.c) },
          THEN: { block: value(b, e.a) },
          ELSE: { block: value(b, e.b) },
        },
      });
    case 'bin':
      return binary(b, e);
    case 'call':
      return call(b, e);
    default:
      throw new Unreadable();
  }
}

function binary(b: Builder, e: Extract<Expr, { k: 'bin' }>): BlockState {
  const property = (p: string, x: Expr) =>
    b.block('math_number_property', {
      fields: { PROPERTY: p },
      inputs: { NUMBER_TO_CHECK: input(b, x) },
      ...(p === 'DIVISIBLE_BY' ? { extraState: '<mutation divisor_input="true"></mutation>' } : {}),
    });
  // Bare comparisons are the number questions; "so sánh" always prints brackets.
  if (
    e.op === '==' &&
    e.a.k === 'paren' &&
    e.a.x.k === 'bin' &&
    e.a.x.op === '%' &&
    numberText(e.a.x.b) === '2'
  ) {
    const r = numberText(e.b);
    if (r === '0' || r === '1') return property(r === '0' ? 'EVEN' : 'ODD', e.a.x.a);
  }
  if (e.op === '==' && e.a.k === 'bin' && e.a.op === '%' && numberText(e.b) === '0') {
    const block = property('DIVISIBLE_BY', e.a.a);
    block.inputs = { ...block.inputs, DIVISOR: input(b, e.a.b) };
    return block;
  }
  if ((e.op === '>' || e.op === '<') && numberText(e.b) === '0') {
    return property(e.op === '>' ? 'POSITIVE' : 'NEGATIVE', e.a);
  }
  if (e.op === '<=' && isCall(e.a, 'Leanbot.pingCm')) {
    return b.block('Leanbot.objectInFront', { inputs: { Distance: input(b, e.b) } });
  }
  if (e.op === '&&' || e.op === '||') {
    return b.block('logic_operation', {
      fields: { OP: e.op === '&&' ? 'AND' : 'OR' },
      inputs: { A: { block: value(b, e.a) }, B: { block: value(b, e.b) } },
    });
  }
  if (e.op === '%') {
    return b.block('math_modulo', { inputs: { DIVIDEND: input(b, e.a), DIVISOR: input(b, e.b) } });
  }
  if (e.op === '/' && numberText(e.b) === '1000' && isCall(e.a, 'LbMission.elapsedMillis')) {
    return b.block('LbMission.elapsedMillis', { fields: { Unit: 'seconds' } });
  }
  if (e.op === '/' && numberText(e.b) === '10' && isCall(e.a, 'LbMotion.getDistanceMm')) {
    return b.block('LbMotion.approxDistance', { fields: { UnitDistance: 'cm' } });
  }
  const op = ARITH_IDS[e.op];
  if (op !== undefined) {
    return b.block('math_arithmetic', {
      fields: { OP: op },
      inputs: { A: input(b, e.a), B: input(b, e.b) },
    });
  }
  if (COMPARE_IDS[e.op] !== undefined) {
    return b.block('logic_compare', {
      fields: { OP: COMPARE_IDS[e.op] ?? 'EQ' },
      inputs: { A: input(b, e.a), B: input(b, e.b) },
    });
  }
  throw new Unreadable();
}

function multiple2(b: Builder, e: Extract<Expr, { k: 'call' }>): BlockState {
  const ops: Readonly<Record<string, string>> = { max: 'MAX', min: 'MIN', pow: 'POW' };
  const [a, c] = e.args;
  if (!a || !c) throw new Unreadable();
  return b.block('math_multiple2', {
    fields: { OP: ops[e.path] ?? 'MAX' },
    inputs: { NUM1: input(b, a), NUM2: input(b, c) },
  });
}

function call(b: Builder, e: Extract<Expr, { k: 'call' }>): BlockState {
  const a = e.args;
  const one = () => {
    const x = a[0];
    if (a.length !== 1 || !x) throw new Unreadable();
    return x;
  };
  const leanbot = (type: string, fields?: BlockState['fields']) =>
    a.length === 0
      ? b.block(type, fields ? { fields } : {})
      : (() => {
          throw new Unreadable();
        })();
  switch (e.path) {
    case 'Leanbot.pingCm':
      return leanbot('Leanbot.ping', { UnitPing: 'cm' });
    case 'Leanbot.pingMm':
      return leanbot('Leanbot.ping', { UnitPing: 'mm' });
    case 'LbIRLine.isBlackDetected':
      return leanbot('LbIRLine.isBlackDetected');
    case 'LbIRLine.value':
      return leanbot('LbIRLine.value');
    case 'LbMission.elapsedMillis':
      return leanbot('LbMission.elapsedMillis', { Unit: 'milliseconds' });
    case 'LbMotion.getDistanceMm':
      return leanbot('LbMotion.approxDistance', { UnitDistance: 'mm' });
    case 'LbMotion.getRotationDeg':
      return leanbot('LbMotion.approxHeading');
    case 'Serial.available':
      return leanbot('board_serial_available');
    case 'Serial.read':
      return leanbot('board_serial_read');
    case 'Serial.readStringUntil': {
      const x = one();
      if (x.k !== 'chr') throw new Unreadable();
      return b.block('board_serial_readStringUntil', {
        inputs: { CONTENT: { shadow: b.block('text', { fields: { TEXT: unquote(x.text) } }) } },
      });
    }
    case 'digitalRead': {
      const pin = numberText(one());
      if (pin === null) throw new Unreadable();
      return b.block('board_base_inout_digital_read', { fields: { PIN: pin } });
    }
    case 'analogRead': {
      const pin = wordOf(one());
      if (pin === null || !/^A[0-7]$/.test(pin)) throw new Unreadable();
      return b.block('board_base_inout_analog_read', { fields: { PIN: pin } });
    }
    case 'round':
      return b.block('math_round', { fields: { OP: 'round' }, inputs: { NUM: input(b, one()) } });
    case 'abs':
    case 'sq':
    case 'sqrt': {
      const ops: Readonly<Record<string, string>> = { abs: 'ABS', sq: 'SQUARE', sqrt: 'ROOT' };
      return b.block('math_single', {
        fields: { OP: ops[e.path] ?? 'ABS' },
        inputs: { NUM: input(b, one()) },
      });
    }
    case 'sin':
    case 'cos':
    case 'tan': {
      const x = one();
      const degrees = isCall(x, 'radians', 1);
      const arg = degrees ? x.args[0] : x;
      if (!arg) throw new Unreadable();
      return b.block('math_trig', {
        fields: { OP: e.path.toUpperCase(), UNIT: degrees ? 'degrees' : 'radians' },
        inputs: { NUM: input(b, arg) },
      });
    }
    case 'constrain': {
      const [v, lo, hi] = a;
      if (a.length !== 3 || !v || !lo || !hi) throw new Unreadable();
      return b.block('math_constrain', {
        inputs: { VALUE: input(b, v), LOW: input(b, lo), HIGH: input(b, hi) },
      });
    }
    case 'map': {
      const [n, fromLow, fromHigh, toLow, toHigh] = a;
      if (a.length !== 5 || !n || !fromLow || !fromHigh || !toLow || !toHigh)
        throw new Unreadable();
      const to = (x: Expr, y: Expr) => ({
        block: b.block('math_map_to', { inputs: { FROM: input(b, x), TO: input(b, y) } }),
      });
      return b.block('math_map', {
        inputs: {
          Number: { block: b.block('math_map_from', { inputs: { NUM: input(b, n) } }) },
          fromLow: to(fromLow, toLow),
          fromHigh: to(fromHigh, toHigh),
        },
      });
    }
    case 'random': {
      const [from, to] = a;
      if (a.length !== 2 || !from || !to) throw new Unreadable();
      return b.block('math_random_int', { inputs: { FROM: input(b, from), TO: input(b, to) } });
    }
    case 'CRGB':
      return colour(b, e);
    case 'max':
    case 'min':
    case 'pow':
      if (e.path === 'pow' && a.length === 2 && a[0] && a[1]) {
        return b.block('math_arithmetic', {
          fields: { OP: 'POWER' },
          inputs: { A: input(b, a[0]), B: input(b, a[1]) },
        });
      }
      return multiple2(b, e);
    default: {
      const fn = b.functions.get(e.path);
      if (fn?.returns && fn.params.length === a.length)
        return procedureCall(b, e.path, fn, a, 'procedures_callreturn');
      throw new Unreadable();
    }
  }
}

function procedureCall(b: Builder, name: string, fn: Fn, args: Expr[], type: string): BlockState {
  const inputs: NonNullable<BlockState['inputs']> = {};
  args.forEach((arg, i) => {
    inputs[`ARG${String(i)}`] = { block: value(b, arg) };
  });
  return b.block(type, { extraState: { name, params: fn.params }, inputs });
}

/** Reading a variable: the block depends on the type the variable was declared with. */
function variableGet(b: Builder, name: string): BlockState {
  const type = b.typeOf(name);
  const typed: Readonly<Record<string, [string, string]>> = {
    int: ['vars_get_int', 'VAR_GET_INT'],
    float: ['vars_get_float', 'VAR_GET_FLOAT'],
    String: ['vars_get_string', 'VAR_GET_STRING'],
    bool: ['vars_get_boolean', 'VAR_GET_BOOLEAN'],
    global: ['vars_get_global', 'VAR_GET_GLOBAL'],
  };
  if (type === undefined) throw new Unreadable();
  const [blockType, field] = typed[type] ?? ['variables_get', 'VAR'];
  return b.block(blockType, { fields: { [field]: b.variable(name, type) } });
}

function variableSet(b: Builder, name: string, e: Expr): BlockState {
  const type = b.typeOf(name);
  const typed: Readonly<Record<string, [string, string]>> = {
    int: ['vars_set_int', 'VAR_SET_INT'],
    float: ['vars_set_float', 'VAR_SET_FLOAT'],
    String: ['vars_set_string', 'VAR_SET_STRING'],
    bool: ['vars_set_boolean', 'VAR_SET_BOOLEAN'],
    global: ['vars_set_global', 'VAR_SET_GLOBAL'],
  };
  if (type === undefined) throw new Unreadable();
  const [blockType, field] = typed[type] ?? ['variables_set', 'VAR'];
  return b.block(blockType, {
    fields: { [field]: b.variable(name, type) },
    inputs: { VALUE: input(b, e) },
  });
}

/** A chain of statement blocks for `stmts`; problems are recorded, unreadable lines left out. */
function statements(b: Builder, stmts: readonly Stmt[], inFunction: boolean): BlockState[] {
  const out: BlockState[] = [];
  for (let i = 0; i < stmts.length; i++) {
    const s = stmts[i];
    if (!s) continue;
    try {
      const made = statement(b, stmts, i, inFunction);
      i += made.consumed;
      for (const block of made.blocks) {
        b.lineOf[block.id] ??= s.line;
        out.push(block);
      }
    } catch (e) {
      if (!(e instanceof Unreadable) && !(e instanceof SyntaxProblem)) throw e;
      b.problem(s.line, e instanceof Unreadable ? e.reason : 'unknown');
    }
  }
  return out;
}

interface Made {
  blocks: BlockState[];
  /** Statements after this one folded into it. */
  consumed: number;
}

function statement(b: Builder, stmts: readonly Stmt[], i: number, inFunction: boolean): Made {
  const s = stmts[i];
  if (!s) throw new Unreadable();
  const one = (block: BlockState): Made => ({ blocks: [block], consumed: 0 });
  const body = (list: Stmt[] | null | undefined) =>
    chainOf(b, statements(b, list ?? [], inFunction));
  switch (s.k) {
    case 'bad':
      throw new Unreadable();
    case 'comment':
      return one(b.block('Leanbot.commentLine', { fields: { commentString: s.text } }));
    case 'section':
      return one(
        b.block('Leanbot.section', {
          fields: { commentString: s.comment },
          inputs: statementInput('Body', body(s.body)),
        }),
      );
    case 'flow':
      return one(b.block('controls_flow_statements', { fields: { FLOW: s.word.toUpperCase() } }));
    case 'if': {
      const only = s.branches[0];
      // "nếu … thì return" inside a function.
      if (
        inFunction &&
        s.branches.length === 1 &&
        s.otherwise === null &&
        only?.body.length === 1 &&
        only.body[0]?.k === 'return'
      ) {
        const ret = only.body[0];
        return one(
          b.block('procedures_ifreturn', {
            extraState: `<mutation value="${ret.e ? '1' : '0'}"></mutation>`,
            inputs: {
              CONDITION: { block: value(b, only.cond) },
              ...(ret.e ? { VALUE: input(b, ret.e) } : {}),
            },
          }),
        );
      }
      const inputs: NonNullable<BlockState['inputs']> = {};
      s.branches.forEach((branch, n) => {
        inputs[`IF${String(n)}`] = { block: value(b, branch.cond) };
        Object.assign(inputs, statementInput(`DO${String(n)}`, body(branch.body)));
      });
      if (s.otherwise) Object.assign(inputs, statementInput('ELSE', body(s.otherwise)));
      const elseif = s.branches.length - 1;
      return one(
        b.block('controls_if', {
          ...(elseif > 0 || s.otherwise
            ? {
                extraState: {
                  ...(elseif > 0 ? { elseIfCount: elseif } : {}),
                  ...(s.otherwise ? { hasElse: true } : {}),
                },
              }
            : {}),
          inputs,
        }),
      );
    }
    case 'for': {
      // "lặp N lần": `for (int count = 0; count < N; count++)`.
      if (
        /^count\d*$/.test(s.v) &&
        numberText(s.from) === '0' &&
        s.cmp === '<' &&
        s.step === '++'
      ) {
        return one(
          b.block('controls_repeat_ext', {
            inputs: { TIMES: input(b, s.to), ...statementInput('DO', body(s.body)) },
          }),
        );
      }
      const up = s.cmp === '<=';
      const step = s.step === '++' || s.step === '--' ? '1' : s.step.slice(2);
      if (
        !['<=', '>='].includes(s.cmp) ||
        (up
          ? !['++', '+='].some((p) => s.step.startsWith(p))
          : !['--', '-='].some((p) => s.step.startsWith(p)))
      ) {
        throw new Unreadable();
      }
      const v = b.variable(s.v, b.typeOf(s.v) ?? '');
      return one(
        b.block('controls_for', {
          fields: { VAR: v },
          inputs: {
            FROM: input(b, s.from),
            TO: input(b, s.to),
            BY: { shadow: num(b, step) },
            ...statementInput('DO', body(s.body)),
          },
        }),
      );
    }
    case 'while': {
      if (s.body === null) {
        const c = s.cond;
        if (
          c.k === 'bin' &&
          c.op === '==' &&
          isCall(c.a, 'LbTouch.read', 1) &&
          isWord(c.b, 'LOW')
        ) {
          const pad = wordOf(c.a.args[0]);
          if (pad !== null && (LB_TOUCH_PADS as readonly string[]).includes(pad)) {
            return one(b.block('LbTouch.waitUntil', { fields: { touchX: pad } }));
          }
        }
        throw new Unreadable();
      }
      // `while (!(c))` and `while (!word)` are how "lặp đến khi" prints.
      const c = s.cond;
      const until = c.k === 'unary' && c.op === '!' && (c.x.k === 'paren' || c.x.k === 'word');
      const test = until ? (c.x.k === 'paren' ? c.x.x : c.x) : c;
      return one(
        b.block('controls_whileUntil', {
          fields: { MODE: until ? 'UNTIL' : 'WHILE' },
          inputs: { BOOL: { block: value(b, test) }, ...statementInput('DO', body(s.body)) },
        }),
      );
    }
    case 'switch': {
      const inputs: NonNullable<BlockState['inputs']> = {};
      s.cases.forEach((c, n) => {
        inputs[`CASE${String(n)}`] = input(b, c.e);
        Object.assign(inputs, statementInput(`DO${String(n)}`, body(c.body)));
      });
      if (s.otherwise) Object.assign(inputs, statementInput('DEFAULT', body(s.otherwise)));
      return one(
        b.block('controls_switch', {
          fields: { SWVAR: b.variable(s.v, b.typeOf(s.v) ?? '') },
          extraState: {
            ...(s.cases.length > 1 ? { casebreak: s.cases.length - 1 } : {}),
            ...(s.otherwise ? { default: 1 } : {}),
          },
          inputs,
        }),
      );
    }
    case 'return':
      throw new Unreadable();
    case 'decl': {
      // `int repeat_end = N;` belongs to the "lặp N lần" that follows.
      const next = stmts[i + 1];
      if (
        s.type === 'int' &&
        /^repeat_end\d*$/.test(s.name) &&
        s.e &&
        next?.k === 'for' &&
        wordOf(next.to) === s.name
      ) {
        return {
          blocks: [
            b.block('controls_repeat_ext', {
              inputs: { TIMES: input(b, s.e), ...statementInput('DO', body(next.body)) },
            }),
          ],
          consumed: 1,
        };
      }
      if (s.e === null) throw new Unreadable();
      const v = b.variable(s.name, '');
      const fields = s.type === 'auto' ? { VAR_SET_INT: v } : { VAR_SET_INT: v, VAR_TYPE: s.type };
      return one(
        b.block(s.type === 'auto' ? 'vars_initialize_local_auto' : 'vars_initialize_local', {
          fields,
          inputs: { VALUE: input(b, s.e) },
        }),
      );
    }
    case 'assign': {
      if (s.target.k === 'index' && s.target.path === 'LbRGB') {
        const led = wordOf(s.target.index);
        if (led === null || !(LB_LEDS as readonly string[]).includes(led)) throw new Unreadable();
        const c = s.e;
        if (c.k === 'word' && c.path.startsWith('CRGB::')) {
          return one(
            b.block('LbRGB.setColorText', { fields: { ledX: led, RGBColor: c.path.slice(6) } }),
          );
        }
        return one(
          b.block('LbRGB.setColor', {
            fields: { ledX: led },
            inputs: { RGBColor: { shadow: colour(b, c) } },
          }),
        );
      }
      const name = wordOf(s.target);
      if (name === null) throw new Unreadable();
      return one(variableSet(b, name, s.e));
    }
    case 'expr':
      return callStatement(b, stmts, i, s.e);
  }
}

/** A statement that is a call: the Leanbot and Arduino commands, missions, tone + delay. */
function callStatement(b: Builder, stmts: readonly Stmt[], i: number, e: Expr): Made {
  const one = (block: BlockState): Made => ({ blocks: [block], consumed: 0 });
  // A value on its own line: Pythaverse prints a loose value block that way.
  const loose = (): Made => {
    const block = value(b, e);
    b.loose.add(block.id);
    return one(block);
  };
  if (e.k !== 'call') return loose();
  const a = e.args;
  const arity = (n: number) => {
    if (a.length !== n) throw new Unreadable();
  };
  const fixed = (type: string): Made => {
    arity(0);
    return one(b.block(type));
  };
  const scaledInput = (
    x: Expr | undefined,
    factor: string,
  ): { input: ReturnType<typeof input>; scaled: boolean } => {
    if (!x) throw new Unreadable();
    if (x.k === 'bin' && x.op === '*' && numberText(x.b) === factor)
      return { input: input(b, x.a), scaled: true };
    return { input: input(b, x), scaled: false };
  };
  switch (e.path) {
    case 'LbMission.begin':
    case 'LbMission.beginDigitalTwin':
      return mission(b, stmts, i, e);
    case 'LbMission.end':
      return fixed('LbMission.end');
    case 'LbDelay': {
      arity(1);
      const { input: delay, scaled } = scaledInput(a[0], '1000');
      return one(
        b.block('Leanbot.delay', {
          fields: { Unit: scaled ? 'seconds' : 'milliseconds' },
          inputs: { Delay: delay },
        }),
      );
    }
    case 'Leanbot.tone': {
      arity(2);
      const next = stmts[i + 1];
      const duration = a[1];
      if (!duration) throw new Unreadable();
      const sameDelay =
        next?.k === 'expr' &&
        next.e.k === 'call' &&
        next.e.path === 'LbDelay' &&
        next.e.args.length === 1 &&
        JSON.stringify(next.e.args[0]) === JSON.stringify(duration);
      if (!sameDelay) throw new Unreadable('tone-without-delay');
      const { input: freq, scaled } = scaledInput(a[0], '1000');
      return {
        blocks: [
          b.block('Leanbot.toneDuration', {
            fields: { UnitFreq: scaled ? 'kHz' : 'Hz' },
            inputs: { Freq: freq, Duration: input(b, duration) },
          }),
        ],
        consumed: 1,
      };
    }
    case 'LbMotion.runLRrpm':
    case 'LbMotion.runLR': {
      arity(2);
      const [left, right] = a;
      if (!left || !right) throw new Unreadable();
      return one(
        b.block('LbMotion.run', {
          fields: { UnitSpeed: e.path === 'LbMotion.runLRrpm' ? 'rpm' : 'sps' },
          inputs: { Left: input(b, left), Right: input(b, right) },
        }),
      );
    }
    case 'LbMotion.waitDistanceMm': {
      arity(1);
      const { input: distance, scaled } = scaledInput(a[0], '10');
      return one(
        b.block('LbMotion.waitDistanceMm', {
          fields: { UnitDistance: scaled ? 'cm' : 'mm' },
          inputs: { distanceMm: distance },
        }),
      );
    }
    case 'LbMotion.waitRotationDeg':
      arity(1);
      return one(
        b.block('LbMotion.waitRotationDeg', {
          inputs: { rotationDeg: input(b, a[0] ?? { k: 'num', text: '0' }) },
        }),
      );
    case 'LbMotion.stopAndWait':
      return fixed('LbMotion.stop');
    case 'LbMotion.setZeroOrigin':
      return fixed('LbMotion.setZeroOrigin');
    case 'Leanbot.DCMotor.setPower': {
      arity(1);
      const x = a[0];
      if (numberText(x) === '0')
        return one(
          b.block('Leanbot.DCMotor.setPower', {
            fields: { Direction: 'Forward' },
            inputs: { Power: { shadow: num(b, '0') } },
          }),
        );
      // `P * 255 / 100`, with `-P` for backward.
      if (
        x?.k !== 'bin' ||
        x.op !== '/' ||
        numberText(x.b) !== '100' ||
        x.a.k !== 'bin' ||
        x.a.op !== '*' ||
        numberText(x.a.b) !== '255'
      )
        throw new Unreadable();
      let power = x.a.a;
      let direction = 'Forward';
      const negative = numberText(power);
      if (negative?.startsWith('-')) {
        power = { k: 'num', text: negative.slice(1) };
        direction = 'Backward';
      } else if (power.k === 'unary' && power.op === '-') {
        power = power.x;
        direction = 'Backward';
      }
      return one(
        b.block('Leanbot.DCMotor.setPower', {
          fields: { Direction: direction },
          inputs: { Power: input(b, power) },
        }),
      );
    }
    case 'LbGripper.open':
      return fixed('LbGripper.open');
    case 'LbGripper.close':
      return fixed('LbGripper.close');
    case 'LbGripper.moveTo':
      arity(1);
      return one(
        b.block('LbGripper.moveTo', {
          inputs: { angleDeg: input(b, a[0] ?? { k: 'num', text: '0' }) },
        }),
      );
    case 'LbGripper.moveToLR': {
      arity(3);
      const [l, r, ms] = a;
      if (!l || !r || !ms) throw new Unreadable();
      return one(
        b.block('LbGripper.moveToLR', {
          inputs: { angleDegL: input(b, l), angleDegR: input(b, r), timeMs: input(b, ms) },
        }),
      );
    }
    case 'LbRGB.clear':
      return fixed('LbRGB.clear');
    case 'LbRGB.show':
      return fixed('LbRGB.show');
    case 'LbRGB.fillColor': {
      arity(2);
      const [c, mask] = a;
      if (!c || !mask) throw new Unreadable();
      return one(
        b.block('LbRGB.fillColor', {
          inputs: { RGBColor: { shadow: colour(b, c) }, bitmask: bitmap(b, mask) },
        }),
      );
    }
    case 'LbIRLine.read':
      return fixed('LbIRLine.read');
    case 'LbIRLine.displayOnRGB':
      arity(1);
      return one(
        b.block('LbIRLine.displayOnRGB', {
          inputs: { RGBColor: { shadow: colour(b, a[0] ?? { k: 'num', text: '' }) } },
        }),
      );
    case 'digitalWrite': {
      arity(2);
      const [pin, stat] = a;
      const level = wordOf(stat);
      if (level !== 'HIGH' && level !== 'LOW') throw new Unreadable();
      if (isWord(pin, 'LED_BUILTIN'))
        return one(b.block('board_base_inout_buildin_led', { fields: { STAT: level } }));
      const n = numberText(pin);
      if (n === null) throw new Unreadable();
      return one(b.block('board_base_inout_digital_write', { fields: { PIN: n, STAT: level } }));
    }
    case 'analogWrite': {
      arity(2);
      const pin = numberText(a[0]);
      if (pin === null || !a[1]) throw new Unreadable();
      return one(
        b.block('board_base_inout_analog_write', {
          fields: { PIN: pin },
          inputs: { PWM: input(b, a[1]) },
        }),
      );
    }
    case 'delay':
      arity(1);
      return one(
        b.block('board_base_delay', {
          inputs: { DELAY_TIME: input(b, a[0] ?? { k: 'num', text: '0' }) },
        }),
      );
    case 'tone': {
      arity(2);
      const pin = numberText(a[0]);
      if (pin === null || !a[1]) throw new Unreadable();
      return one(
        b.block('board_base_inout_tone', { fields: { PIN: pin }, inputs: { NUM: input(b, a[1]) } }),
      );
    }
    case 'noTone': {
      arity(1);
      const pin = numberText(a[0]);
      if (pin === null) throw new Unreadable();
      return one(b.block('board_base_inout_notone', { fields: { PIN: pin } }));
    }
    case 'Serial.println':
    case 'Serial.print': {
      arity(1);
      const content = a[0];
      if (!content) throw new Unreadable();
      return one(
        b.block('board_serial_print', {
          fields: { PRINT: e.path.slice(7) },
          inputs: {
            CONTENT:
              content.k === 'str' ? { shadow: value(b, content) } : { block: value(b, content) },
          },
        }),
      );
    }
    case 'Serial.flush':
      return fixed('board_serial_flush');
    case 'randomSeed':
      arity(1);
      return one(
        b.block('math_random_seed', {
          inputs: { SEED: { block: value(b, a[0] ?? { k: 'num', text: '0' }) } },
        }),
      );
    default: {
      const fn = b.functions.get(e.path);
      if (fn && !fn.returns && fn.params.length === a.length) {
        return one(procedureCall(b, e.path, fn, a, 'procedures_callnoreturn'));
      }
      return loose();
    }
  }
}

function bitmap(b: Builder, mask: Expr): { block?: BlockState; shadow?: BlockState } {
  if (mask.k === 'call' && mask.path === 'BITMAP') {
    const on = new Set(mask.args.map(wordOf));
    if ([...on].some((led) => led === null || !(LB_LEDS as readonly string[]).includes(led))) {
      throw new Unreadable();
    }
    const fields: Record<string, string> = {};
    for (const led of LB_LEDS) fields[led] = on.has(led) ? 'TRUE' : 'FALSE';
    return { shadow: b.block('LbRGB.shape', { fields }) };
  }
  return input(b, mask);
}

/** A mission takes every statement up to its `LbMission.end();` as its body. */
function mission(
  b: Builder,
  stmts: readonly Stmt[],
  i: number,
  begin: Extract<Expr, { k: 'call' }>,
): Made {
  const s = stmts[i];
  if (!s || begin.args.length !== 1) throw new Unreadable();
  const arg = begin.args[0];
  let block: BlockState;
  if (begin.path === 'LbMission.beginDigitalTwin') {
    if (!isCall(arg, 'F', 1)) throw new Unreadable();
    const id = arg.args[0];
    if (id?.k !== 'str') throw new Unreadable();
    const text = unquote(id.text);
    const missionId = MISSIONS.includes(text)
      ? { block: b.block('LbMission.missionSelect', { fields: { missionSelect: text } }) }
      : { block: b.block('text', { fields: { TEXT: text } }) };
    block = b.block('LbMission.beginBySelect_end', { inputs: { missionId } });
  } else if (numberText(arg) === '0') {
    block = b.block('LbMission.beginImmediately_end');
  } else {
    const combo =
      arg?.k === 'bin' && arg.op === '+' ? `${wordOf(arg.a) ?? ''} + ${wordOf(arg.b) ?? ''}` : '';
    if (!(LB_COMBOS as readonly string[]).includes(combo)) throw new Unreadable();
    block = b.block('LbMission.beginByTeacher_end', { fields: { comboTouch: combo } });
  }
  let end = i + 1;
  let depth = 0;
  for (; end < stmts.length; end++) {
    const t = stmts[end];
    if (t?.k !== 'expr' || t.e.k !== 'call') continue;
    if (t.e.path === 'LbMission.begin' || t.e.path === 'LbMission.beginDigitalTwin') depth++;
    if (t.e.path === 'LbMission.end') {
      if (depth === 0) break;
      depth--;
    }
  }
  if (end >= stmts.length) b.problem(s.line, 'missing-end');
  b.lineOf[block.id] = s.line;
  const first = chainOf(b, statements(b, stmts.slice(i + 1, end), false));
  if (first) block.inputs = { ...block.inputs, Body: { block: first } };
  return { blocks: [block], consumed: end - i };
}

function statementInput(
  name: string,
  first: BlockState | undefined,
): Record<string, { block: BlockState }> {
  return first ? { [name]: { block: first } } : {};
}

/** Statement blocks with nothing allowed below them (Pythaverse's shapes). */
const NO_NEXT = new Set([
  'LbMission.beginByTeacher_end',
  'LbMission.beginImmediately_end',
  'LbMission.beginBySelect_end',
  'LbMission.end',
  'controls_flow_statements',
]);

/** Links blocks with `next` into stacks: a value, or a block with no bottom, ends a stack. */
function stacksOf(b: Builder, blocks: readonly BlockState[]): BlockState[] {
  const isValueBlock = (block: BlockState) => b.loose.has(block.id);
  const stacks: BlockState[] = [];
  let last: BlockState | undefined;
  for (const block of blocks) {
    if (isValueBlock(block)) {
      stacks.push(block);
      last = undefined;
      continue;
    }
    if (last && !NO_NEXT.has(last.type)) last.next = { block };
    else stacks.push(block);
    last = block;
  }
  return stacks;
}

/** The blocks of a body (an input holds one stack); what cannot hang below is reported. */
function chainOf(b: Builder, blocks: readonly BlockState[]): BlockState | undefined {
  const [first, ...extra] = stacksOf(b, blocks);
  for (const stack of extra) {
    const line = b.lineOf[stack.id];
    if (line !== undefined) b.problem(line, 'unknown');
  }
  return first;
}

// ── Program ──

/** The `{ … }` body of `<type> <name>(…)` at the top level, as token indexes. */
interface TopFunction {
  returns: string;
  name: string;
  params: string[];
  from: number;
  open: number;
  close: number;
  line: number;
}

function topLevel(tokens: readonly Token[]): { functions: TopFunction[]; rest: number[] } {
  const functions: TopFunction[] = [];
  const rest: number[] = [];
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    const name = tokens[i + 1];
    if (
      t?.kind === 'id' &&
      (t.text === 'void' || t.text === 'int') &&
      name?.kind === 'id' &&
      tokens[i + 2]?.text === '('
    ) {
      let j = i + 3;
      const params: string[] = [];
      while (j < tokens.length && tokens[j]?.text !== ')') {
        if (tokens[j]?.kind === 'id' && tokens[j - 1]?.text === 'int')
          params.push(tokens[j]?.text ?? '');
        j++;
      }
      if (tokens[j + 1]?.text === '{') {
        const close = matching(tokens, j + 1, tokens.length);
        functions.push({
          returns: t.text,
          name: name.text,
          params,
          from: i,
          open: j + 1,
          close,
          line: t.line,
        });
        i = close + 1;
        continue;
      }
    }
    rest.push(i);
    i++;
  }
  return { functions, rest };
}

/**
 * Reads a Leanbot sketch (or just the statements of a `loop()`) into blocks. Lines that are not
 * in the standard form become problems and are left out; the rest still becomes blocks.
 */
export function parseArduino(src: string): ParseResult {
  const tokens = tokenize(src);
  const b = new Builder();
  const { functions, rest } = topLevel(tokens);
  const loop = functions.find((f) => f.name === 'loop' && f.returns === 'void');
  const top: BlockState[] = [];
  const stacks: BlockState[] = [];

  if (!loop) {
    const stmts = parseStatements(new Cursor(tokens, 0, tokens.length));
    declareLocals(b, stmts);
    stacks.push(...stacksOf(b, statements(b, stmts, false)));
  } else {
    // Declarations and globals at the top.
    const restTokens = rest.map((i) => tokens[i]).filter((t): t is Token => t !== undefined);
    // `#include` lines are checked on their own: as statements they would swallow the next line.
    const declTokens = restTokens.filter((t) => t.kind !== 'pre');
    for (const s of parseStatements(new Cursor(declTokens, 0, declTokens.length))) {
      if (s.k === 'comment') continue;
      if (s.k === 'decl' && TYPES.includes(s.type)) {
        if (s.e === null) {
          b.variable(s.name, VAR_TYPE_OF[s.type] ?? '');
          continue;
        }
        const v = b.variable(s.name, 'global');
        const fields =
          s.type === 'auto' ? { VAR_SET_GLOBAL: v } : { VAR_SET_GLOBAL: v, VAR_TYPE: s.type };
        try {
          const block = b.block(
            s.type === 'auto' ? 'vars_initialize_global_auto' : 'vars_initialize_global',
            {
              fields,
              inputs: { VALUE: input(b, s.e) },
            },
          );
          b.lineOf[block.id] = s.line;
          top.push(block);
        } catch (e) {
          if (!(e instanceof Unreadable)) throw e;
          b.problem(s.line, 'outside-loop');
        }
        continue;
      }
      b.problem(s.line, 'outside-loop');
    }
    for (const t of restTokens) {
      if (t.kind === 'pre' && t.text.replace(/\s+/g, '') !== '#include<Leanbot.h>')
        b.problem(t.line, 'outside-loop');
    }

    // Function signatures first: calls may come before the definition.
    for (const f of functions) {
      if (f.name !== 'loop' && f.name !== 'setup') {
        b.functions.set(f.name, { returns: f.returns === 'int', params: f.params });
        for (const p of f.params) b.variable(p, '');
      }
    }

    const setup = functions.find((f) => f.name === 'setup');
    if (setup) top.push(...setupBlocks(b, tokens, setup));

    for (const f of functions) {
      if (f.name === 'loop' || f.name === 'setup') continue;
      const stmts = parseStatements(new Cursor(tokens, f.open + 1, f.close));
      declareLocals(b, stmts);
      let ret: Stmt | undefined;
      if (f.returns === 'int' && stmts.at(-1)?.k === 'return') ret = stmts.pop();
      const def = b.block(f.returns === 'int' ? 'procedures_defreturn' : 'procedures_defnoreturn', {
        fields: { NAME: f.name },
        extraState: { params: f.params.map((p) => ({ name: p, id: b.variable(p, '').id })) },
      });
      b.lineOf[def.id] = f.line;
      const first = chainOf(b, statements(b, stmts, true));
      const inputs: NonNullable<BlockState['inputs']> = { ...statementInput('STACK', first) };
      if (ret?.k === 'return' && ret.e) inputs['RETURN'] = { block: value(b, ret.e) };
      def.inputs = inputs;
      stacks.push(def);
    }

    const stmts = parseStatements(new Cursor(tokens, loop.open + 1, loop.close));
    declareLocals(b, stmts);
    stacks.unshift(...stacksOf(b, [...top, ...statements(b, stmts, false)]));
  }

  const blocks = stacks;
  blocks.forEach((block, n) => Object.assign(block, { x: 20 + n * 40, y: 20 + n * 40 }));
  const result: ParseResult = {
    workspace: { blocks: { languageVersion: 0, blocks }, variables: [...b.variables.values()] },
    problems: b.problems,
    lineOf: b.lineOf,
  };
  dropUnloadable(b, result);
  result.problems.sort((p, q) => p.line - q.line);
  return result;
}

/** Locals declared in a body (`auto x = …;`) are read with "variables_get". */
function declareLocals(b: Builder, stmts: readonly Stmt[]): void {
  for (const s of stmts) {
    if (s.k === 'decl' && !/^repeat_end\d*$/.test(s.name))
      b.variable(s.name, b.typeOf(s.name) ?? '');
    if (s.k === 'for' && !/^count\d*$/.test(s.v)) b.variable(s.v, b.typeOf(s.v) ?? '');
    for (const list of [
      s.body,
      s.k === 'if' ? s.branches.flatMap((x) => x.body) : undefined,
      s.k === 'if' ? s.otherwise : undefined,
    ]) {
      if (list) declareLocals(b, list);
    }
  }
}

/** Blocks Pythaverse prints into `setup()`. */
function setupBlocks(b: Builder, tokens: readonly Token[], setup: TopFunction): BlockState[] {
  const out: BlockState[] = [];
  for (const s of parseStatements(new Cursor(tokens, setup.open + 1, setup.close))) {
    if (s.k === 'comment') continue;
    const e = s.k === 'expr' ? s.e : null;
    const block = ((): BlockState | 'skip' | null => {
      if (e?.k !== 'call') return null;
      if (e.path === 'Leanbot.begin' && e.args.length === 0) return 'skip';
      // pinMode lines come from the In/Out blocks themselves.
      if (e.path === 'pinMode') return 'skip';
      if (e.path === 'Serial.begin' && e.args.length === 1) {
        const speed = numberText(e.args[0]);
        return speed === null ? null : b.block('board_serial_init', { fields: { SPEED: speed } });
      }
      if (e.path === 'LbIRLine.doManualCalibration' && e.args.length === 1) {
        const pad = wordOf(e.args[0]);
        return pad === null
          ? null
          : b.block('LbIRLine.doManualCalibration', { fields: { touchX: pad } });
      }
      if (e.path === 'LbIRLine.setThreshold' && e.args.length === 4) {
        const [a, c, d, f] = e.args;
        if (!a || !c || !d || !f) return null;
        return b.block('LbIRLine.setThreshold', {
          inputs: { th2L: input(b, a), th0L: input(b, c), th1R: input(b, d), th3R: input(b, f) },
        });
      }
      return null;
    })();
    if (block === 'skip') continue;
    if (block === null) {
      b.problem(s.line, 'outside-loop');
      continue;
    }
    b.lineOf[block.id] = s.line;
    out.push(block);
  }
  return out;
}

/**
 * Loads every stack into a scratch workspace; a stack Blockly refuses (a value that does not
 * fit its input, e.g. a distance where a question goes) is reported and removed.
 */
function dropUnloadable(b: Builder, result: ParseResult): void {
  const ws = new Workspace();
  for (const v of result.workspace.variables)
    ws.getVariableMap().createVariable(v.name, v.type, v.id);
  const kept: BlockState[] = [];
  for (const stack of result.workspace.blocks.blocks) {
    const failed = loadFails(ws, stack);
    if (!failed) {
      kept.push(stack);
      continue;
    }
    // Retry statement by statement, keeping the ones that load.
    kept.push(...salvage(b, ws, stack, result));
  }
  result.workspace.blocks.blocks = kept;
  ws.dispose();
}

function loadFails(ws: Workspace, state: BlockState): boolean {
  try {
    const block = serialization.blocks.append(structuredClone(state), ws, { recordUndo: false });
    block.dispose();
    return false;
  } catch {
    return true;
  }
}

function salvage(b: Builder, ws: Workspace, first: BlockState, result: ParseResult): BlockState[] {
  const blocks: BlockState[] = [];
  for (let block: BlockState | undefined = first; block;) {
    const next: BlockState | undefined = block.next?.block;
    delete block.next;
    if (loadFails(ws, block)) {
      const line = result.lineOf[block.id];
      if (line !== undefined && !result.problems.some((p) => p.line === line)) {
        result.problems.push({ line, reason: 'unknown' });
      }
    } else {
      blocks.push(block);
    }
    block = next;
  }
  return stacksOf(b, blocks);
}
