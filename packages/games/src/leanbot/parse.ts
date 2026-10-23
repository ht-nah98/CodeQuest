import {
  LB_ARITH_OPS,
  LB_BLOCKS,
  LB_COLORS,
  LB_COMBOS,
  LB_COMPARE_OPS,
  LB_LEDS,
  LB_REPEAT_MAX,
  LB_WAIT_MAX,
  LB_TOUCH_PADS,
} from './blocks';

// Arduino code → Leanbot blocks, for code in the standard form: what `toArduino` (and
// Pythaverse's editor) prints for those blocks. Not a C++ parser: anything outside that form is
// reported line by line and left out, never guessed (docs/product/the-gioi-leanbot.md §1).

/** Why a line could not become a block. */
export type ParseProblemReason =
  /** Not one of the statements a Leanbot block prints. */
  | 'unknown'
  /** `LbMission.begin(…);` with no `LbMission.end();` after it. */
  | 'missing-end'
  /** `LbMission.end();` with no `LbMission.begin(…);` before it. */
  | 'stray-end'
  /** A number the block cannot hold (e.g. `lặp 5000 lần`). */
  | 'out-of-range'
  /** `Leanbot.tone(f, d);` not followed by `LbDelay(d);`. */
  | 'tone-without-delay'
  /** Something other than `Leanbot.begin();` in `setup()`, or code outside `setup`/`loop`. */
  | 'outside-loop';

export interface ParseProblem {
  /** 1-based line in the source. */
  line: number;
  reason: ParseProblemReason;
}

/** Blockly's JSON serialization of one block (the part this parser writes). */
export interface BlockState {
  type: string;
  id: string;
  x?: number;
  y?: number;
  fields?: Record<string, string | number | boolean>;
  inputs?: Record<string, { block: BlockState }>;
  next?: { block: BlockState };
}

export interface ParseResult {
  /** `serialization.workspaces.load` input: one stack, or none when nothing was read. */
  workspace: { blocks: { languageVersion: 0; blocks: BlockState[] } };
  problems: ParseProblem[];
  /** 1-based source line of every block made from a statement, by block id. */
  lineOf: Record<string, number>;
}

// ── Tokens ──

type TokenKind = 'id' | 'num' | 'punct' | 'comment' | 'pre' | 'other';
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
  while (i < src.length) {
    const c = src.charAt(i);
    if (c === '\n') {
      line++;
      i++;
    } else if (/\s/.test(c)) {
      i++;
    } else if (src.startsWith('//', i)) {
      const end = src.indexOf('\n', i);
      const stop = end < 0 ? src.length : end;
      tokens.push({ kind: 'comment', text: src.slice(i + 2, stop).trim(), line });
      i = stop;
    } else if (src.startsWith('/*', i)) {
      const end = src.indexOf('*/', i + 2);
      const stop = end < 0 ? src.length : end + 2;
      tokens.push({ kind: 'other', text: src.slice(i, stop), line });
      line += src.slice(i, stop).split('\n').length - 1;
      i = stop;
    } else if (c === '#') {
      const end = src.indexOf('\n', i);
      const stop = end < 0 ? src.length : end;
      tokens.push({ kind: 'pre', text: src.slice(i, stop).trim(), line });
      i = stop;
    } else {
      const rest = src.slice(i);
      const match =
        /^0[xX][0-9a-fA-F]+/.exec(rest) ??
        /^(\d+\.?\d*|\.\d+)/.exec(rest) ??
        /^[A-Za-z_]\w*/.exec(rest);
      if (match) {
        const text = match[0];
        tokens.push({ kind: /^[A-Za-z_]/.test(text) ? 'id' : 'num', text, line });
        i += text.length;
      } else {
        const two = PUNCT2.find((p) => src.startsWith(p, i));
        const text = two ?? c;
        tokens.push({
          kind: two !== undefined || PUNCT1.includes(c) ? 'punct' : 'other',
          text,
          line,
        });
        i += text.length;
      }
    }
  }
  return tokens;
}

// ── Expressions ──

type Expr =
  | { k: 'num'; value: number; text: string }
  | { k: 'word'; path: string }
  | { k: 'call'; path: string; args: Expr[] }
  | { k: 'unary'; op: string; x: Expr }
  | { k: 'bin'; op: string; a: Expr; b: Expr }
  | { k: 'paren'; x: Expr };

/** C precedence, loosest first. */
const BINARY_LEVELS: readonly (readonly string[])[] = [
  ['||'],
  ['&&'],
  ['==', '!='],
  ['<', '<=', '>', '>='],
  ['+', '-'],
  ['*', '/', '%'],
];

class SyntaxProblem extends Error {}

class Cursor {
  pos: number;
  constructor(
    readonly tokens: readonly Token[],
    start: number,
    readonly end: number,
  ) {
    this.pos = start;
  }
  peek(offset = 0): Token | undefined {
    const at = this.pos + offset;
    return at < this.end ? this.tokens[at] : undefined;
  }
  is(text: string, offset = 0): boolean {
    const t = this.peek(offset);
    return t !== undefined && t.kind !== 'comment' && t.text === text;
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
  done(): boolean {
    return this.pos >= this.end;
  }
}

function parseExpr(cur: Cursor, level = 0): Expr {
  if (level >= BINARY_LEVELS.length) return parseUnary(cur);
  let left = parseExpr(cur, level + 1);
  const ops = BINARY_LEVELS[level] ?? [];
  for (;;) {
    const t = cur.peek();
    if (t?.kind !== 'punct' || !ops.includes(t.text)) return left;
    cur.take();
    left = { k: 'bin', op: t.text, a: left, b: parseExpr(cur, level + 1) };
  }
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
  if (t.kind === 'num') return { k: 'num', value: Number(t.text), text: t.text };
  if (t.kind === 'punct' && t.text === '(') {
    const x = parseExpr(cur);
    cur.expect(')');
    return { k: 'paren', x };
  }
  if (t.kind !== 'id') throw new SyntaxProblem(t.text);
  let path = t.text;
  while (cur.is('.') || cur.is('::')) {
    const sep = cur.take().text;
    const part = cur.take();
    if (part.kind !== 'id') throw new SyntaxProblem(part.text);
    path += sep + part.text;
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

/** A plain number, with or without a leading minus. */
function numberOf(e: Expr | undefined): number | null {
  if (e?.k === 'num') return e.value;
  if (e?.k === 'unary' && e.op === '-' && e.x.k === 'num') return -e.x.value;
  return null;
}

const isWord = (e: Expr | undefined, path: string) => e?.k === 'word' && e.path === path;
const isCall = (e: Expr | undefined, path: string, arity = 0) =>
  e?.k === 'call' && e.path === path && e.args.length === arity;

// ── Building blocks ──

class Builder {
  private count = 0;
  readonly problems: ParseProblem[] = [];
  readonly lineOf: Record<string, number> = {};

  block(type: string, line: number | null, rest: Omit<BlockState, 'type' | 'id'> = {}): BlockState {
    this.count++;
    const id = `lb${String(this.count)}`;
    if (line !== null) this.lineOf[id] = line;
    return { type, id, ...rest };
  }

  /** Drops the line of a block that was folded into another one. */
  forget(id: string): void {
    Reflect.deleteProperty(this.lineOf, id);
  }

  problem(line: number, reason: ParseProblemReason): void {
    if (!this.problems.some((p) => p.line === line)) this.problems.push({ line, reason });
  }
}

/** A field number in `[min, max]`, else an out-of-range problem (thrown). */
class RangeProblem extends Error {}
function inRange(n: number | null, min: number, max: number): number {
  if (n === null) throw new SyntaxProblem('number');
  if (n < min || n > max) throw new RangeProblem(String(n));
  return n;
}

function colorByHex(e: Expr | undefined): string {
  const hex = e?.k === 'num' ? e.text.toLowerCase() : '';
  const color = LB_COLORS.find((c) => c.hex === hex);
  if (!color) throw new SyntaxProblem('color');
  return color.id;
}

/** Output type of each value block (its `output` in blocks.ts). */
const OUTPUT_OF: ReadonlyMap<string, unknown> = new Map(
  LB_BLOCKS.filter((d) => d.json.output !== undefined).map((d) => [d.type, d.json.output]),
);

/** `e` as a value block that fits an input checking for `want`, else a problem. */
function valueBlock(b: Builder, e: Expr, want: 'Boolean' | 'Number'): BlockState {
  const block = anyValue(b, e);
  if (OUTPUT_OF.get(block.type) !== want) throw new SyntaxProblem(block.type);
  return block;
}

function anyValue(b: Builder, e: Expr): BlockState {
  const bool = (type: string, fields: Record<string, string | number>) =>
    b.block(type, null, { fields });
  if (e.k === 'paren') {
    const x = e.x;
    if (x.k === 'bin' && x.op === '==' && isCall(x.a, 'LbTouch.read', 1) && isWord(x.b, 'HIGH')) {
      const pad = x.a.k === 'call' && x.a.args[0]?.k === 'word' ? x.a.args[0].path : '';
      if (!(LB_TOUCH_PADS as readonly string[]).includes(pad)) throw new SyntaxProblem(pad);
      return bool('lb_touch_is', { PAD: pad });
    }
    if (x.k === 'bin' && x.op === '==' && isCall(x.a, 'LbIRLine.value')) {
      const state = inRange(numberOf(x.b), 0, 15);
      if (!Number.isInteger(state)) throw new SyntaxProblem('state');
      const eye = (bit: number) => ((state >> bit) & 1 ? 'B' : 'W');
      return bool('lb_irline_is', { E2L: eye(3), E0L: eye(2), E1R: eye(1), E3R: eye(0) });
    }
    // `(a <= b)` is "so sánh"; only the bare `Leanbot.pingCm() <= n` is "có vật trong vòng".
    const compare = x.k === 'bin' ? COMPARE_BY_OP[x.op] : undefined;
    if (x.k === 'bin' && compare !== undefined) {
      return b.block('lb_compare', null, {
        fields: { OP: compare },
        inputs: {
          A: { block: valueBlock(b, x.a, 'Number') },
          B: { block: valueBlock(b, x.b, 'Number') },
        },
      });
    }
    return anyValue(b, x);
  }
  if (e.k === 'bin' && e.op === '<=' && isCall(e.a, 'Leanbot.pingCm') && numberOf(e.b) !== null) {
    return bool('lb_object_near', { CM: inRange(numberOf(e.b), 0, 1000) });
  }
  if (e.k === 'bin') {
    const compare = COMPARE_BY_OP[e.op];
    const arith = ARITH_BY_OP[e.op];
    const logic = e.op === '&&' ? 'AND' : e.op === '||' ? 'OR' : undefined;
    const type = compare ? 'lb_compare' : arith ? 'lb_arith' : logic ? 'lb_and_or' : undefined;
    const op = compare ?? arith ?? logic;
    if (type === undefined || op === undefined) throw new SyntaxProblem(e.op);
    const want = logic ? 'Boolean' : 'Number';
    return b.block(type, null, {
      fields: { OP: op },
      inputs: { A: { block: valueBlock(b, e.a, want) }, B: { block: valueBlock(b, e.b, want) } },
    });
  }
  const n = numberOf(e);
  if (n !== null) {
    if (e.k === 'num' && /^0x/i.test(e.text)) throw new SyntaxProblem(e.text);
    return b.block('lb_number', null, { fields: { N: n } });
  }
  if (e.k === 'unary' && e.op === '!') {
    return b.block('lb_not', null, { inputs: { A: { block: valueBlock(b, e.x, 'Boolean') } } });
  }
  if (isWord(e, 'true') || isWord(e, 'false')) {
    return bool('lb_bool', { BOOL: isWord(e, 'true') ? 'TRUE' : 'FALSE' });
  }
  if (isCall(e, 'Leanbot.pingCm')) return b.block('lb_ping', null);
  if (isCall(e, 'LbIRLine.isBlackDetected')) return b.block('lb_irline_black', null);
  throw new SyntaxProblem('value');
}

const COMPARE_BY_OP: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(LB_COMPARE_OPS).map(([id, op]) => [op, id]),
);
const ARITH_BY_OP: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(LB_ARITH_OPS).map(([id, op]) => [op, id]),
);

/** One statement read from the code: a block, or a mission boundary. */
type Stmt =
  | { k: 'block'; block: BlockState; line: number }
  | { k: 'begin'; line: number; type: string; fields: Record<string, string> }
  | { k: 'end'; line: number }
  | { k: 'tone'; line: number; hz: number; ms: number }
  | { k: 'delay'; line: number; block: BlockState; ms: number | null };

/** Skips a statement the parser does not know: up to `;`, or over a `{…}` and its `else`s. */
function skipStatement(cur: Cursor): void {
  let depth = 0;
  while (!cur.done()) {
    const t = cur.take();
    if (t.kind !== 'punct') continue;
    if (t.text === '(' || t.text === '[') depth++;
    else if (t.text === ')' || t.text === ']') depth--;
    else if (t.text === ';' && depth <= 0) return;
    else if (t.text === '{') {
      let braces = 1;
      while (!cur.done() && braces > 0) {
        const u = cur.take();
        if (u.text === '{') braces++;
        else if (u.text === '}') braces--;
      }
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

function parseStatement(b: Builder, cur: Cursor): Stmt | null {
  const t = cur.peek();
  if (t === undefined) return null;
  const line = t.line;
  const blockStmt = (type: string, rest: Omit<BlockState, 'type' | 'id'> = {}): Stmt => ({
    k: 'block',
    block: b.block(type, line, rest),
    line,
  });

  if (t.kind === 'comment') {
    cur.take();
    return blockStmt('lb_comment', { fields: { TEXT: t.text } });
  }
  if (cur.is(';')) {
    cur.take();
    return null;
  }
  if (cur.is('if')) {
    cur.take();
    cur.expect('(');
    const cond = parseExpr(cur);
    cur.expect(')');
    const doBlocks = parseBraces(b, cur);
    if (!cur.is('else')) return blockStmt('lb_if', ifInputs(b, cond, doBlocks));
    cur.take();
    const elseBlocks = cur.is('if') ? parseList(b, cur, cur.end, true) : parseBraces(b, cur);
    return blockStmt('lb_if_else', {
      inputs: { ...ifInputs(b, cond, doBlocks).inputs, ...statementInput('ELSE', elseBlocks) },
    });
  }
  if (cur.is('for')) {
    cur.take();
    cur.expect('(');
    cur.expect('int');
    const v = cur.take().text;
    cur.expect('=');
    cur.expect('0');
    cur.expect(';');
    cur.expect(v);
    cur.expect('<');
    const times = numberOf(parseUnary(cur));
    cur.expect(';');
    cur.expect(v);
    cur.expect('++');
    cur.expect(')');
    const body = parseBraces(b, cur);
    return blockStmt('lb_repeat', {
      fields: { TIMES: inRange(times, 0, LB_REPEAT_MAX) },
      inputs: statementInput('DO', body),
    });
  }
  if (cur.is('while')) {
    cur.take();
    cur.expect('(');
    const cond = parseExpr(cur);
    cur.expect(')');
    if (cur.is(';')) {
      cur.take();
      if (cond.k === 'bin' && cond.op === '==' && isCall(cond.a, 'LbTouch.read', 1)) {
        const pad = cond.a.k === 'call' && cond.a.args[0]?.k === 'word' ? cond.a.args[0].path : '';
        if (isWord(cond.b, 'LOW') && (LB_TOUCH_PADS as readonly string[]).includes(pad)) {
          return blockStmt('lb_touch_wait', { fields: { PAD: pad } });
        }
      }
      throw new SyntaxProblem('while');
    }
    const body = parseBraces(b, cur);
    if (isWord(cond, 'true'))
      return blockStmt('lb_forever', { inputs: statementInput('DO', body) });
    // `while (!(c))` and `while (!word)` are how "lặp đến khi c" prints.
    const inner = cond.k === 'unary' && cond.op === '!' ? cond.x : null;
    const until = inner !== null && ['paren', 'word', 'num'].includes(inner.k);
    const type = until ? 'lb_repeat_until' : 'lb_repeat_while';
    // Strip the parentheses "lặp đến khi" added around its condition.
    const test = until ? (inner.k === 'paren' ? inner.x : inner) : cond;
    return blockStmt(type, {
      inputs: { COND: { block: valueBlock(b, test, 'Boolean') }, ...statementInput('DO', body) },
    });
  }
  if (cur.is('LbRGB') && cur.is('[', 1)) {
    cur.take();
    cur.take();
    const led = cur.take().text;
    cur.expect(']');
    cur.expect('=');
    const value = parseExpr(cur);
    cur.expect(';');
    if (!(LB_LEDS as readonly string[]).includes(led)) throw new SyntaxProblem(led);
    const name = value.k === 'word' ? value.path.replace(/^CRGB::/, '') : null;
    const color =
      name !== null && value.k === 'word' && value.path.startsWith('CRGB::')
        ? LB_COLORS.find((c) => c.crgb === name)?.id
        : colorByHex(value);
    if (color === undefined) throw new SyntaxProblem('color');
    return blockStmt('lb_led_set', { fields: { LED: led, COLOR: color } });
  }

  const call = parseExpr(cur);
  cur.expect(';');
  if (call.k !== 'call') throw new SyntaxProblem('call');
  const a = call.args;
  const n = (i: number) => numberOf(a[i]);
  const arity = (k: number) => {
    if (a.length !== k) throw new SyntaxProblem('arity');
  };
  switch (call.path) {
    case 'LbMission.begin': {
      arity(1);
      if (numberOf(a[0]) === 0) return { k: 'begin', line, type: 'lb_mission_now', fields: {} };
      const combo = comboText(a[0]);
      if (!(LB_COMBOS as readonly string[]).includes(combo)) throw new SyntaxProblem(combo);
      return { k: 'begin', line, type: 'lb_mission_touch', fields: { COMBO: combo } };
    }
    case 'LbMission.end':
      arity(0);
      return { k: 'end', line };
    case 'LbDelay': {
      arity(1);
      const arg = a[0];
      if (arg?.k === 'bin' && arg.op === '*' && numberOf(arg.b) === 1000) {
        const sec = inRange(numberOf(arg.a), 0, LB_WAIT_MAX);
        return {
          k: 'delay',
          line,
          ms: null,
          block: b.block('lb_wait', line, { fields: { N: sec, UNIT: 'SEC' } }),
        };
      }
      const ms = inRange(n(0), 0, LB_WAIT_MAX);
      return {
        k: 'delay',
        line,
        ms,
        block: b.block('lb_wait', line, { fields: { N: ms, UNIT: 'MS' } }),
      };
    }
    case 'LbMotion.runLRrpm':
      arity(2);
      return blockStmt('lb_run', {
        fields: { LEFT: inRange(n(0), -200, 200), RIGHT: inRange(n(1), -200, 200) },
      });
    case 'LbMotion.waitDistanceMm': {
      arity(1);
      const arg = a[0];
      if (arg?.k === 'bin' && arg.op === '*' && numberOf(arg.b) === 10) {
        return blockStmt('lb_go', {
          fields: { N: inRange(numberOf(arg.a), 0, 10000), UNIT: 'CM' },
        });
      }
      return blockStmt('lb_go', { fields: { N: inRange(n(0), 0, 10000), UNIT: 'MM' } });
    }
    case 'LbMotion.waitRotationDeg':
      arity(1);
      return blockStmt('lb_turn', { fields: { N: inRange(n(0), 0, 3600) } });
    case 'LbMotion.stopAndWait':
      arity(0);
      return blockStmt('lb_stop');
    case 'LbGripper.open':
      arity(0);
      return blockStmt('lb_gripper_open');
    case 'LbGripper.close':
      arity(0);
      return blockStmt('lb_gripper_close');
    case 'LbGripper.moveTo':
      arity(1);
      return blockStmt('lb_gripper_to', { fields: { N: inRange(n(0), 0, 180) } });
    case 'LbGripper.moveToLR':
      arity(3);
      return blockStmt('lb_gripper_to_lr', {
        fields: {
          LEFT: inRange(n(0), 0, 180),
          RIGHT: inRange(n(1), 0, 180),
          MS: inRange(n(2), 0, 60000),
        },
      });
    case 'LbRGB.fillColor': {
      arity(2);
      const bitmap = a[1];
      if (bitmap?.k !== 'call' || bitmap.path !== 'BITMAP') throw new SyntaxProblem('bitmap');
      const on = new Set(bitmap.args.map((x) => (x.k === 'word' ? x.path : '')));
      if ([...on].some((led) => !(LB_LEDS as readonly string[]).includes(led)))
        throw new SyntaxProblem('led');
      const fields: Record<string, string> = { COLOR: colorByHex(a[0]) };
      for (const led of LB_LEDS) fields[led] = on.has(led) ? 'TRUE' : 'FALSE';
      return blockStmt('lb_led_fill', { fields });
    }
    case 'LbRGB.clear':
      arity(0);
      return blockStmt('lb_led_clear');
    case 'LbRGB.show':
      arity(0);
      return blockStmt('lb_led_show');
    case 'Leanbot.tone':
      arity(2);
      return { k: 'tone', line, hz: inRange(n(0), 20, 20000), ms: inRange(n(1), 0, 60000) };
    case 'LbIRLine.read':
      arity(0);
      return blockStmt('lb_irline_read');
    case 'LbIRLine.displayOnRGB':
      arity(1);
      return blockStmt('lb_irline_show', { fields: { COLOR: colorByHex(a[0]) } });
    default:
      throw new SyntaxProblem(call.path);
  }
}

/** `TB1A + TB1B` as written in a combo. */
function comboText(e: Expr | undefined): string {
  if (e?.k === 'bin' && e.op === '+' && e.a.k === 'word' && e.b.k === 'word') {
    return `${e.a.path} + ${e.b.path}`;
  }
  return '';
}

function ifInputs(b: Builder, cond: Expr, body: BlockState[]): Omit<BlockState, 'type' | 'id'> {
  return {
    inputs: { COND: { block: valueBlock(b, cond, 'Boolean') }, ...statementInput('DO', body) },
  };
}

function statementInput(name: string, blocks: BlockState[]): Record<string, { block: BlockState }> {
  const first = chain(blocks);
  return first ? { [name]: { block: first } } : {};
}

/** Links blocks with `next` and returns the first one. */
function chain(blocks: BlockState[]): BlockState | undefined {
  for (let i = blocks.length - 2; i >= 0; i--) {
    const block = blocks[i];
    const next = blocks[i + 1];
    if (block && next) block.next = { block: next };
  }
  return blocks[0];
}

/** `{ … }` → its blocks. */
function parseBraces(b: Builder, cur: Cursor): BlockState[] {
  cur.expect('{');
  const close = matching(cur.tokens, cur.pos - 1, cur.end);
  const blocks = parseList(b, cur, close, false);
  cur.pos = close + 1;
  return blocks;
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

/**
 * Statements from `cur.pos` up to token `end` → blocks. A mission takes every statement up to
 * its `LbMission.end();` as its body; a tone takes the `LbDelay` that follows it. With `single`
 * only one statement is read (the `if` of an `else if`).
 */
function parseList(b: Builder, cur: Cursor, end: number, single: boolean): BlockState[] {
  const inner = new Cursor(cur.tokens, cur.pos, end);
  const stmts: Stmt[] = [];
  while (!inner.done()) {
    const start = inner.pos;
    const line = inner.peek()?.line ?? 0;
    try {
      const stmt = parseStatement(b, inner);
      if (stmt) stmts.push(stmt);
    } catch (e) {
      if (!(e instanceof SyntaxProblem) && !(e instanceof RangeProblem)) throw e;
      b.problem(line, e instanceof RangeProblem ? 'out-of-range' : 'unknown');
      inner.pos = start;
      skipStatement(inner);
      if (inner.pos === start) inner.take();
    }
    if (single) break;
  }
  cur.pos = inner.pos;
  return assemble(b, stmts);
}

/** Folds mission boundaries and tone + delay pairs into blocks. */
function assemble(b: Builder, stmts: readonly Stmt[]): BlockState[] {
  let i = 0;
  // Reads blocks up to a mission end (`closed`) or the end of the list.
  const take = (): { blocks: BlockState[]; closed: boolean } => {
    const blocks: BlockState[] = [];
    for (let s = stmts[i]; s !== undefined; s = stmts[i]) {
      i++;
      if (s.k === 'end') return { blocks, closed: true };
      if (s.k === 'begin') {
        const body = take();
        if (!body.closed) b.problem(s.line, 'missing-end');
        const mission = b.block(s.type, s.line, { fields: s.fields });
        Object.assign(mission, { inputs: statementInput('BODY', body.blocks) });
        blocks.push(mission);
      } else if (s.k === 'tone') {
        const next = stmts[i];
        if (next?.k === 'delay' && next.ms === s.ms) {
          i++;
          b.forget(next.block.id);
          blocks.push(b.block('lb_tone', s.line, { fields: { HZ: s.hz, MS: s.ms } }));
        } else {
          b.problem(s.line, 'tone-without-delay');
        }
      } else {
        blocks.push(s.block);
      }
    }
    return { blocks, closed: false };
  };
  const out: BlockState[] = [];
  for (;;) {
    const part = take();
    out.push(...part.blocks);
    if (!part.closed) return out;
    b.problem(stmts[i - 1]?.line ?? 0, 'stray-end');
  }
}

/** The `{ … }` body of `void <name>()` at the top level, as token indexes. */
function findFunction(
  tokens: readonly Token[],
  name: string,
): { from: number; open: number; close: number } | null {
  for (let i = 0; i + 4 < tokens.length; i++) {
    if (
      tokens[i]?.text === 'void' &&
      tokens[i + 1]?.text === name &&
      tokens[i + 2]?.text === '(' &&
      tokens[i + 3]?.text === ')' &&
      tokens[i + 4]?.text === '{'
    ) {
      return { from: i, open: i + 4, close: matching(tokens, i + 4, tokens.length) };
    }
  }
  return null;
}

/**
 * Reads a Leanbot sketch (or just the statements of a `loop()`) into blocks. Lines that are not
 * in the standard form become problems and are left out; the rest still becomes blocks.
 */
export function parseArduino(src: string): ParseResult {
  const tokens = tokenize(src);
  const b = new Builder();
  const loop = findFunction(tokens, 'loop');
  let blocks: BlockState[];
  if (loop === null) {
    blocks = parseList(b, new Cursor(tokens, 0, tokens.length), tokens.length, false);
  } else {
    const setup = findFunction(tokens, 'setup');
    const used = new Set<number>();
    for (const fn of [setup, loop]) {
      if (fn) for (let i = fn.from; i <= fn.close; i++) used.add(i);
    }
    if (setup) {
      const inside = tokens.slice(setup.open + 1, setup.close).filter((t) => t.kind !== 'comment');
      // Every statement but `Leanbot.begin();` is out of place.
      let from = 0;
      inside.forEach((t, i) => {
        if (t.text !== ';' && i < inside.length - 1) return;
        const stmt = inside.slice(from, i + 1);
        const text = stmt.map((u) => u.text).join('');
        if (text !== 'Leanbot.begin();' && stmt[0]) b.problem(stmt[0].line, 'outside-loop');
        from = i + 1;
      });
    }
    tokens.forEach((t, i) => {
      if (used.has(i) || t.kind === 'comment') return;
      if (t.kind === 'pre' && t.text.replace(/\s+/g, '') === '#include<Leanbot.h>') return;
      b.problem(t.line, 'outside-loop');
    });
    blocks = parseList(b, new Cursor(tokens, loop.open + 1, loop.close), loop.close, false);
  }
  const first = chain(blocks);
  if (first) Object.assign(first, { x: 20, y: 20 });
  b.problems.sort((p, q) => p.line - q.line);
  return {
    workspace: { blocks: { languageVersion: 0, blocks: first ? [first] : [] } },
    problems: b.problems,
    lineOf: b.lineOf,
  };
}
