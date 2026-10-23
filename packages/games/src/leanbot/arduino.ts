import { type Block, CodeGenerator, inputs, Names, type Workspace } from 'blockly';
import { LB_LEDS } from './blocks';

// Arduino code of the Leanbot blocks, character for character what Pythaverse's editor
// (ide.pythaverse.space/lbeditor, generator 2024-09-15) prints: the same spacing, parentheses,
// blank lines, loop counter names, declarations and setup() lines. Each generator follows the
// one of Pythaverse's editor for the same block type. Checked in leanbot.test.ts against code
// that editor printed (fixtures/*.ino, fixtures/toolbox.json).

/** Operator precedence of Pythaverse's Arduino generator (`Blockly.Arduino.ORDER_*`). */
export const Order = {
  ATOMIC: 0,
  UNARY_POSTFIX: 1,
  UNARY_PREFIX: 2,
  MULTIPLICATIVE: 3,
  ADDITIVE: 4,
  RELATIONAL: 6,
  EQUALITY: 7,
  LOGICAL_AND: 11,
  LOGICAL_OR: 12,
  CONDITIONAL: 13,
  ASSIGNMENT: 14,
  COMMA: 15,
  UNARY_NEGATION: 16,
  MEMBER: 17,
  NONE: 99,
} as const;

/** Pythaverse's reserved words, verbatim (typos included: they decide which names get a suffix). */
const RESERVED_WORDS =
  'setup,loop,if,else,for,switch,case,while,do,break,continue,return,goto,define,include,HIGH,LOW,INPUT,OUTPUT,INPUT_PULLUP,true,false,interger, constants,floating,point,void,bookean,char,unsigned,byte,int,word,long,float,double,string,String,array,static, volatile,const,sizeof,pinMode,digitalWrite,digitalRead,analogReference,analogRead,analogWrite,tone,noTone,shiftOut,shitIn,pulseIn,millis,micros,delay,delayMicroseconds,min,max,abs,constrain,map,pow,sqrt,sin,cos,tan,randomSeed,random,lowByte,highByte,bitRead,bitWrite,bitSet,bitClear,bit,attachInterrupt,detachInterrupt,interrupts,noInterrupts,';

/** Comment Pythaverse's function blocks carry from the start. */
const PROCEDURE_COMMENT = 'Describe this function...';

const MARK_START = '\u0001';
const MARK_END = '\u0002';

type Generated = string | [string, number] | null;
type BlockGenerator = (block: Block, gen: LeanbotArduino) => Generated;
type WithState = Block & {
  arguments_?: string[];
  hasReturnValue_?: boolean;
  casebreakCount_?: number;
  defaultCount_?: number;
};

/** `Blockly.isNumber` of Pythaverse's Blockly. */
const isNumber = (s: string) => /^\s*-?\d+(\.\d+)?\s*$/.test(s);
const field = (block: Block, name: string) => String(block.getFieldValue(name));

/** Pythaverse's mission and LED blocks print their body one indent less. */
function dedentedBody(block: Block, gen: LeanbotArduino): string {
  return gen.statementToCode(block, 'Body').substring(2).replaceAll('\n  ', '\n');
}

/** `#include <Leanbot.h>` and `Leanbot.begin();`, added by every Leanbot block. */
function addHeader(gen: LeanbotArduino): void {
  gen.includes_['leanbot'] = '#include <Leanbot.h>';
  gen.setups_['leanbot'] = 'Leanbot.begin();';
}

/** Pythaverse's `Arduino_DeclareVariable`: the first type a variable is used as wins. */
function declare(gen: LeanbotArduino, type: string, name: string): void {
  gen.definitions_[name] ??= `${type} ${name};`;
}

/** `Blockly.Arduino.quote_` of Pythaverse: `"` is not escaped. */
function quote(text: string): string {
  return `"${text
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\\n')
    .replace(/\$/g, '\\$')
    .replace(/'/g, "\\'")}"`;
}

/** A Leanbot value times 1000 (seconds → ms) or 10 (cm → mm) when the unit asks for it. */
function scaled(block: Block, gen: LeanbotArduino, input: string, factor: string | null): string {
  const order = factor === null ? Order.NONE : Order.MULTIPLICATIVE;
  return gen.valueToCode(block, input, order) + (factor === null ? '' : ` * ${factor}`);
}

function repeat(block: Block, gen: LeanbotArduino): string {
  const repeats = block.getField('TIMES')
    ? String(Number(block.getFieldValue('TIMES')))
    : gen.valueToCode(block, 'TIMES', Order.ASSIGNMENT) || '0';
  const branch = gen.statementToCode(block, 'DO');
  let code = '';
  const loopVar = gen.distinctName('count');
  let endVar = repeats;
  if (!/^\w+$/.test(repeats) && !isNumber(repeats)) {
    endVar = gen.distinctName('repeat_end');
    code += `int ${endVar} = ${repeats};\n`;
  }
  code += `for (int ${loopVar} = 0; ${loopVar} < ${endVar}; ${loopVar}++) {\n${branch}}\n`;
  return `${code}\n`;
}

function procedureDef(block: Block, gen: LeanbotArduino): null {
  const name = gen.procedureName(field(block, 'NAME'));
  const branch = gen.statementToCode(block, 'STACK');
  let returnValue = block.getInput('RETURN') ? gen.valueToCode(block, 'RETURN', Order.NONE) : '';
  if (returnValue) returnValue = `${gen.INDENT}return ${returnValue};\n`;
  const returnType = returnValue ? 'int' : 'void';
  const params = ((block as WithState).arguments_ ?? []).map(
    (arg) => `int ${gen.variableName(arg)}`,
  );
  const code = `${returnType} ${name}(${params.join(', ')}) {\n${branch}${returnValue}}\n`;
  const comment = block.getCommentText() ?? PROCEDURE_COMMENT;
  gen.definitions_[`%${name}`] = `${gen.prefixLines(comment, '// ')}\n${code}`;
  return null;
}

function procedureCall(block: Block, gen: LeanbotArduino): string {
  const name = gen.procedureName(field(block, 'NAME'));
  const args = ((block as WithState).arguments_ ?? []).map(
    (_, i) => gen.valueToCode(block, `ARG${String(i)}`, Order.COMMA) || '0',
  );
  return `${name}(${args.join(', ')})`;
}

function variableSet(type: string, fieldName: string): BlockGenerator {
  return (block, gen) => {
    const value = gen.valueToCode(block, 'VALUE', Order.ASSIGNMENT) || '0';
    const name = gen.variableId(field(block, fieldName));
    declare(gen, type, name);
    return `${name} = ${value};\n`;
  };
}

function variableGet(type: string, fieldName: string): BlockGenerator {
  return (block, gen) => {
    const name = gen.variableId(field(block, fieldName));
    declare(gen, type, name);
    return [name, Order.ATOMIC];
  };
}

function initialize(fieldName: string, global: boolean, fixedType?: string): BlockGenerator {
  return (block, gen) => {
    const type = fixedType ?? field(block, 'VAR_TYPE');
    const name = gen.variableId(field(block, fieldName));
    const value = gen.valueToCode(block, 'VALUE', Order.ASSIGNMENT) || '0';
    if (!global) return `${type} ${name} = ${value};\n`;
    gen.definitions_[name] = `${type} ${name} = ${value};`;
    return '';
  };
}

const COMPARE: Readonly<Record<string, string>> = {
  EQ: '==',
  NEQ: '!=',
  LT: '<',
  LTE: '<=',
  GT: '>',
  GTE: '>=',
};
const ARITHMETIC: Readonly<Record<string, [string | null, number]>> = {
  ADD: [' + ', Order.ADDITIVE],
  MINUS: [' - ', Order.ADDITIVE],
  MULTIPLY: [' * ', Order.MULTIPLICATIVE],
  DIVIDE: [' / ', Order.MULTIPLICATIVE],
  POWER: [null, Order.NONE],
};

/** A colour as Pythaverse prints it: `0x` and 6 hex digits. */
const hex = (n: number) => `0x${`000000${n.toString(16)}`.slice(-6)}`;

/** Generators that only add the Leanbot header and print a fixed statement. */
const fixed =
  (code: string): BlockGenerator =>
  (_block, gen) => {
    addHeader(gen);
    return code;
  };

const FOR_BLOCK: Readonly<Record<string, BlockGenerator>> = {
  // ── Logic ──
  controls_if: (block, gen) => {
    let n = 0;
    let code = '';
    do {
      const cond = gen.valueToCode(block, `IF${String(n)}`, Order.NONE) || 'false';
      const branch = gen.statementToCode(block, `DO${String(n)}`);
      code += `${n > 0 ? ' else ' : ''}if (${cond}) {\n${branch}}`;
      n++;
    } while (block.getInput(`IF${String(n)}`));
    if (block.getInput('ELSE')) code += ` else {\n${gen.statementToCode(block, 'ELSE')}}`;
    return `${code}\n`;
  },
  logic_compare: (block, gen) => {
    const op = COMPARE[field(block, 'OP')] ?? '==';
    const order = op === '==' || op === '!=' ? Order.EQUALITY : Order.RELATIONAL;
    const a = gen.valueToCode(block, 'A', order) || '0';
    const b = gen.valueToCode(block, 'B', order) || '0';
    return [`(${a} ${op} ${b})`, order];
  },
  logic_operation: (block, gen) => {
    const and = field(block, 'OP') === 'AND';
    const order = and ? Order.LOGICAL_AND : Order.LOGICAL_OR;
    let a = gen.valueToCode(block, 'A', order);
    let b = gen.valueToCode(block, 'B', order);
    if (!a && !b) {
      a = 'false';
      b = 'false';
    } else {
      a ||= and ? 'true' : 'false';
      b ||= and ? 'true' : 'false';
    }
    return [`${a} ${and ? '&&' : '||'} ${b}`, order];
  },
  logic_negate: (block, gen) => [
    `!${gen.valueToCode(block, 'BOOL', Order.UNARY_PREFIX) || 'false'}`,
    Order.UNARY_PREFIX,
  ],
  logic_boolean: (block) => [field(block, 'BOOL') === 'TRUE' ? 'true' : 'false', Order.ATOMIC],
  logic_null: () => ['null', Order.ATOMIC],
  logic_ternary: (block, gen) => {
    const cond = gen.valueToCode(block, 'IF', Order.CONDITIONAL) || 'false';
    const then = gen.valueToCode(block, 'THEN', Order.CONDITIONAL) || 'null';
    const otherwise = gen.valueToCode(block, 'ELSE', Order.CONDITIONAL) || 'null';
    return [`${cond} ? ${then} : ${otherwise}`, Order.CONDITIONAL];
  },
  controls_switch: (block, gen) => {
    const state = block as WithState;
    let code = `switch (${gen.variableId(field(block, 'SWVAR'))}) {\n`;
    for (let n = 0; n <= (state.casebreakCount_ ?? 0); n++) {
      const arg = gen.valueToCode(block, `CASE${String(n)}`, Order.NONE) || 'false';
      const branch = gen.statementToCode(block, `DO${String(n)}`);
      code += `  case ${arg}:`;
      if (branch) code += `\n  ${branch}    break;\n`;
      code += '\n';
    }
    if (state.defaultCount_) code += `  default:\n  ${gen.statementToCode(block, 'DEFAULT')} `;
    return `${code}}\n\n`;
  },

  // ── Loops ──
  controls_repeat_ext: repeat,
  controls_repeat: repeat,
  controls_whileUntil: (block, gen) => {
    let cond = gen.valueToCode(block, 'BOOL', Order.NONE) || 'false';
    const branch = gen.statementToCode(block, 'DO');
    if (field(block, 'MODE') === 'UNTIL') {
      if (!/^\w+$/.test(cond)) cond = `(${cond})`;
      cond = `!${cond}`;
    }
    return `while (${cond}) {\n${branch}}\n\n`;
  },
  controls_for: (block, gen) => {
    const v = gen.variableId(field(block, 'VAR'));
    const from = gen.valueToCode(block, 'FROM', Order.ASSIGNMENT) || '0';
    const to = gen.valueToCode(block, 'TO', Order.ASSIGNMENT) || '0';
    const by = gen.valueToCode(block, 'BY', Order.ASSIGNMENT) || '1';
    const branch = gen.statementToCode(block, 'DO');
    let code: string;
    if (isNumber(from) && isNumber(to) && isNumber(by)) {
      const up = parseFloat(from) <= parseFloat(to);
      code = `for (int ${v} = ${from}; ${v}${up ? ' <= ' : ' >= '}${to}; ${v}`;
      const step = Math.abs(parseFloat(by));
      code += step === 1 ? (up ? '++' : '--') : `${up ? ' += ' : ' -= '}${String(step)}`;
      code += `) {\n${branch}}\n`;
    } else {
      // Pythaverse prints this JavaScript as is for computed bounds; it does not compile.
      code = '';
      let startVar = from;
      if (!/^\w+$/.test(from) && !isNumber(from)) {
        startVar = gen.distinctName(`${v}_start`);
        code += `var ${startVar} = ${from};\n`;
      }
      let endVar = to;
      if (!/^\w+$/.test(to) && !isNumber(to)) {
        endVar = gen.distinctName(`${v}_end`);
        code += `var ${endVar} = ${to};\n`;
      }
      const incVar = gen.distinctName(`${v}_inc`);
      code += `var ${incVar} = `;
      code += isNumber(by) ? `${String(Math.abs(Number(by)))};\n` : `Math.abs(${by});\n`;
      code += `if (${startVar} > ${endVar}) {\n${gen.INDENT}${incVar} = -${incVar};\n}\n`;
      code += `for (${v} = ${startVar}; ${incVar} >= 0 ? ${v} <= ${endVar} : ${v} >= ${endVar}; ${v} += ${incVar}) {\n${branch}}\n`;
    }
    return `${code}\n`;
  },
  controls_forEach: (block, gen) => {
    const v = gen.variableId(field(block, 'VAR'));
    const list = gen.valueToCode(block, 'LIST', Order.ASSIGNMENT) || '[]';
    let branch = gen.statementToCode(block, 'DO');
    let code = '';
    let listVar = list;
    if (!/^\w+$/.test(list)) {
      listVar = gen.distinctName(`${v}_list`);
      code += `var ${listVar} = ${list};\n`;
    }
    const indexVar = gen.distinctName(`${v}_index`);
    branch = `${gen.INDENT}${v} = ${listVar}[${indexVar}];\n${branch}`;
    code += `for (var ${indexVar} in ${listVar}) {\n${branch}}\n`;
    return `${code}\n`;
  },
  controls_flow_statements: (block) =>
    field(block, 'FLOW') === 'CONTINUE' ? 'continue;\n' : 'break;\n',

  // ── Math ──
  math_number: (block) => {
    const n = parseFloat(field(block, 'NUM'));
    return [String(n), n >= 0 ? Order.ATOMIC : Order.UNARY_NEGATION];
  },
  math_constant: (block) => [field(block, 'CONSTANT'), Order.ATOMIC],
  math_arithmetic: (block, gen) => {
    const [op, order] = ARITHMETIC[field(block, 'OP')] ?? [' + ', Order.ADDITIVE];
    const a = gen.valueToCode(block, 'A', order) || '0';
    const b = gen.valueToCode(block, 'B', order) || '0';
    return op === null ? [`pow(${a}, ${b})`, Order.UNARY_POSTFIX] : [a + op + b, order];
  },
  math_modulo: (block, gen) => [
    `${gen.valueToCode(block, 'DIVIDEND', Order.MEMBER) || '0'} % ${gen.valueToCode(block, 'DIVISOR', Order.MEMBER) || '0'}`,
    Order.MEMBER,
  ],
  math_number_property: (block, gen) => {
    const n = gen.valueToCode(block, 'NUMBER_TO_CHECK', Order.MEMBER) || '0';
    const property = field(block, 'PROPERTY');
    if (property === 'DIVISIBLE_BY') {
      const divisor = gen.valueToCode(block, 'DIVISOR', Order.MEMBER) || '0';
      return [`${n} % ${divisor} == 0`, Order.EQUALITY];
    }
    const code: Readonly<Record<string, string>> = {
      EVEN: `(${n} % 2) == 0`,
      ODD: `(${n} % 2) == 1`,
      WHOLE: `(${n} % 1) == 0`,
      POSITIVE: `${n} > 0`,
      NEGATIVE: `${n} < 0`,
    };
    return [code[property] ?? '', Order.EQUALITY];
  },
  math_round: (block, gen) => [
    `round(${gen.valueToCode(block, 'NUM', Order.MEMBER) || '0'})`,
    Order.MEMBER,
  ],
  math_single: (block, gen) => {
    const arg = gen.valueToCode(block, 'NUM', Order.NONE) || '0';
    const fn: Readonly<Record<string, string>> = { ABS: 'abs', SQUARE: 'sq', ROOT: 'sqrt' };
    return [`${fn[field(block, 'OP')] ?? 'abs'}(${arg})`, Order.ATOMIC];
  },
  math_multiple2: (block, gen) => {
    const a = gen.valueToCode(block, 'NUM1', Order.MEMBER) || '0';
    const b = gen.valueToCode(block, 'NUM2', Order.MEMBER) || '0';
    const fn: Readonly<Record<string, string>> = { MAX: 'max', MIN: 'min', POW: 'pow' };
    return [`${fn[field(block, 'OP')] ?? ''}(${a}, ${b})`, Order.MEMBER];
  },
  math_trig: (block, gen) => {
    let arg = gen.valueToCode(block, 'NUM', Order.NONE) || '0';
    if (field(block, 'UNIT') === 'degrees') arg = `radians(${arg})`;
    return [`${field(block, 'OP').toLowerCase()}(${arg})`, Order.ATOMIC];
  },
  math_constrain: (block, gen) => {
    const v = (name: string) => gen.valueToCode(block, name, Order.COMMA) || '0';
    return [`constrain(${v('VALUE')}, ${v('LOW')}, ${v('HIGH')})`, Order.ATOMIC];
  },
  math_map: (block, gen) => {
    const n = gen.valueToCode(block, 'Number', Order.NONE);
    const low = gen.valueToCode(block, 'fromLow', Order.NONE).split(',');
    const high = gen.valueToCode(block, 'fromHigh', Order.NONE).split(',');
    const part = (list: string[], i: number) => String(list[i]);
    return [
      `map(${n}, ${part(low, 0)}, ${part(high, 0)}, ${part(low, 1)}, ${part(high, 1)})`,
      Order.ATOMIC,
    ];
  },
  math_map_from: (block, gen) => [gen.valueToCode(block, 'NUM', Order.NONE) || '0', Order.ATOMIC],
  math_map_to: (block, gen) => [
    `${gen.valueToCode(block, 'FROM', Order.NONE) || '0'},${gen.valueToCode(block, 'TO', Order.NONE) || '0'}`,
    Order.ATOMIC,
  ],
  math_random_int: (block, gen) => [
    `random(${gen.valueToCode(block, 'FROM', Order.COMMA) || '0'}, ${gen.valueToCode(block, 'TO', Order.COMMA) || '0'})`,
    Order.MEMBER,
  ],
  math_random_seed: (block, gen) =>
    `randomSeed(${gen.valueToCode(block, 'SEED', Order.NONE) || '0'});\n`,

  // ── Text ──
  text: (block) => [quote(field(block, 'TEXT')).replace('\\\\', '\\'), Order.ATOMIC],

  // ── Variables ──
  variables_get: (block, gen) => [gen.variableId(field(block, 'VAR')), Order.ATOMIC],
  variables_set: (block, gen) =>
    `${gen.variableId(field(block, 'VAR'))} = ${gen.valueToCode(block, 'VALUE', Order.ASSIGNMENT) || '0'};\n`,
  vars_initialize_global_auto: initialize('VAR_SET_GLOBAL', true, 'auto'),
  vars_initialize_global: initialize('VAR_SET_GLOBAL', true),
  vars_set_global: (block, gen) => {
    const name = gen.variableId(field(block, 'VAR_SET_GLOBAL'));
    const value = gen.valueToCode(block, 'VALUE', Order.ASSIGNMENT) || '0';
    // The type follows what is plugged in, as in Pythaverse.
    const check = block.getInput('VALUE')?.connection?.targetBlock()?.outputConnection?.getCheck();
    let type = 'int';
    if (check?.includes('float')) type = 'float';
    else if (check?.includes('String')) type = 'String';
    else if (check?.includes('Boolean')) type = 'bool';
    declare(gen, type, name);
    return `${name} = ${value};\n`;
  },
  vars_get_global: variableGet('int', 'VAR_GET_GLOBAL'),
  vars_initialize_local_auto: initialize('VAR_SET_INT', false, 'auto'),
  vars_initialize_local: initialize('VAR_SET_INT', false),
  vars_set_int: variableSet('int', 'VAR_SET_INT'),
  vars_get_int: variableGet('int', 'VAR_GET_INT'),
  vars_set_float: variableSet('float', 'VAR_SET_FLOAT'),
  vars_get_float: variableGet('float', 'VAR_GET_FLOAT'),
  vars_set_string: variableSet('String', 'VAR_SET_STRING'),
  vars_get_string: variableGet('String', 'VAR_GET_STRING'),
  vars_set_boolean: variableSet('bool', 'VAR_SET_BOOLEAN'),
  vars_get_boolean: variableGet('bool', 'VAR_GET_BOOLEAN'),

  // ── Functions ──
  procedures_defnoreturn: procedureDef,
  procedures_defreturn: procedureDef,
  procedures_callnoreturn: (block, gen) => `${procedureCall(block, gen)};\n`,
  procedures_callreturn: (block, gen) => [procedureCall(block, gen), Order.UNARY_POSTFIX],
  procedures_ifreturn: (block, gen) => {
    const cond = gen.valueToCode(block, 'CONDITION', Order.NONE) || 'false';
    const value = (block as WithState).hasReturnValue_
      ? ` ${gen.valueToCode(block, 'VALUE', Order.NONE) || '0'}`
      : '';
    return `if (${cond}) {\n${gen.INDENT}return${value};\n}\n\n`;
  },

  // ── Arduino: In/Out ──
  board_base_inout_buildin_led: (block, gen) => {
    gen.setups_['setup_output_13'] = 'pinMode(LED_BUILTIN, OUTPUT);';
    return `digitalWrite(LED_BUILTIN, ${field(block, 'STAT')});\n`;
  },
  board_base_inout_digital_write: (block, gen) => {
    const pin = field(block, 'PIN');
    gen.setups_[`setup_output_${pin}`] = `pinMode(${pin}, OUTPUT);`;
    return `digitalWrite(${pin}, ${field(block, 'STAT')});\n`;
  },
  board_base_inout_digital_read: (block, gen) => {
    const pin = field(block, 'PIN');
    gen.setups_[`setup_input_${pin}`] = `pinMode(${pin}, INPUT);`;
    return [`digitalRead(${pin})`, Order.ATOMIC];
  },
  board_base_inout_highlow: (block) => [
    field(block, 'BOOL') === 'HIGH' ? 'HIGH' : 'LOW',
    Order.ATOMIC,
  ],
  board_base_inout_analog_write: (block, gen) =>
    `analogWrite(${field(block, 'PIN')}, ${gen.valueToCode(block, 'PWM', Order.ATOMIC)});\n`,
  board_base_inout_analog_read: (block) => [`analogRead(${field(block, 'PIN')})`, Order.ATOMIC],
  board_base_delay: (block, gen) =>
    `delay(${gen.valueToCode(block, 'DELAY_TIME', Order.ATOMIC) || '1000'});\n`,
  board_base_angle: (block) => [field(block, 'ANGLE'), Order.ATOMIC],
  board_base_map: (block, gen) => {
    const v = (name: string) => gen.valueToCode(block, name, Order.NONE);
    return [
      `map(${v('Number')}, ${v('fromLow')}, ${v('fromHigh')}, ${v('toLow')}, ${v('toHigh')})`,
      Order.NONE,
    ];
  },
  board_base_inout_tone: (block, gen) => {
    const pin = field(block, 'PIN');
    gen.setups_[`setup_output${pin}`] = `pinMode(${pin}, OUTPUT);`;
    return `tone(${pin}, ${gen.valueToCode(block, 'NUM', Order.ATOMIC)});\n`;
  },
  board_base_inout_notone: (block, gen) => {
    const pin = field(block, 'PIN');
    gen.setups_[`setup_output${pin}`] = `pinMode(${pin}, OUTPUT);`;
    return `noTone(${pin});\n`;
  },

  // ── Arduino: Serial ──
  board_serial_init: (block, gen) => {
    gen.setups_['serial_begin'] = `Serial.begin(${field(block, 'SPEED')});`;
    return '';
  },
  board_serial_print: (block, gen) =>
    `Serial.${field(block, 'PRINT')}(${gen.valueToCode(block, 'CONTENT', Order.NONE) || '""'});\n`,
  board_serial_available: () => ['Serial.available()', Order.ATOMIC],
  board_serial_read: () => ['Serial.read()', Order.ATOMIC],
  board_serial_readStringUntil: (block, gen) => [
    `Serial.readStringUntil(${gen.valueToCode(block, 'CONTENT', Order.NONE).replace('"', "'").replace('"', "'")})`,
    Order.ATOMIC,
  ],
  board_serial_flush: () => 'Serial.flush();\n',

  // ── Leanbot ──
  'Leanbot.commentLine': (block, gen) => {
    addHeader(gen);
    return `\n// ${field(block, 'commentString')}\n`;
  },
  'Leanbot.section': (block, gen) => {
    addHeader(gen);
    const body = gen.statementToCode(block, 'Body');
    const comment = field(block, 'commentString');
    return `\n{${comment.length > 0 ? ` // ${comment}` : ''}\n${body}}\n\n`;
  },
  'Leanbot.delay': (block, gen) => {
    addHeader(gen);
    const seconds = field(block, 'Unit') === 'seconds';
    return `LbDelay(${scaled(block, gen, 'Delay', seconds ? '1000' : null)});\n`;
  },
  'LbMission.elapsedMillis': (block, gen) => {
    addHeader(gen);
    return field(block, 'Unit') === 'seconds'
      ? ['LbMission.elapsedMillis() / 1000', Order.MULTIPLICATIVE]
      : ['LbMission.elapsedMillis()', Order.ATOMIC];
  },
  'LbMission.beginByTeacher_end': (block, gen) => {
    addHeader(gen);
    const body = dedentedBody(block, gen);
    return `LbMission.begin(${field(block, 'comboTouch')});\n${body}LbMission.end();\n`;
  },
  'LbMission.beginImmediately_end': (block, gen) => {
    addHeader(gen);
    return `LbMission.begin(0);\n${dedentedBody(block, gen)}LbMission.end();\n`;
  },
  'LbMission.missionSelect': (block) => [quote(field(block, 'missionSelect')), Order.ATOMIC],
  'LbMission.beginBySelect_end': (block, gen) => {
    addHeader(gen);
    const body = dedentedBody(block, gen);
    const id = gen.valueToCode(block, 'missionId', Order.NONE) || '""';
    return `LbMission.beginDigitalTwin(F(${id}));\n${body}LbMission.end();\n`;
  },
  'LbMission.end': fixed('LbMission.end();\n'),
  'Leanbot.whenStarted': () => '',
  'Leanbot.DCMotor.setPower': (block, gen) => {
    addHeader(gen);
    let power = gen.valueToCode(block, 'Power', Order.MULTIPLICATIVE);
    if (Number(power) !== 0) {
      if (field(block, 'Direction') === 'Backward') power = `-${power}`;
      power = `${power} * 255 / 100`;
    }
    return `Leanbot.DCMotor.setPower(${power});\n`;
  },

  // ── Leanbot: Motion ──
  'LbMotion.run': (block, gen) => {
    addHeader(gen);
    const fn = field(block, 'UnitSpeed') === 'rpm' ? 'LbMotion.runLRrpm' : 'LbMotion.runLR';
    const left = gen.valueToCode(block, 'Left', Order.NONE);
    const right = gen.valueToCode(block, 'Right', Order.NONE);
    return `${fn}(${left}, ${right});\n`;
  },
  'LbMotion.waitDistanceMm': (block, gen) => {
    addHeader(gen);
    const cm = field(block, 'UnitDistance') === 'cm';
    return `LbMotion.waitDistanceMm(${scaled(block, gen, 'distanceMm', cm ? '10' : null)});\n`;
  },
  'LbMotion.waitRotationDeg': (block, gen) => {
    addHeader(gen);
    return `LbMotion.waitRotationDeg(${gen.valueToCode(block, 'rotationDeg', Order.NONE)});\n`;
  },
  'LbMotion.wait': (block, gen) => {
    addHeader(gen);
    const seconds = field(block, 'Unit') === 'seconds';
    return `LbDelay(${scaled(block, gen, 'Delay', seconds ? '1000' : null)});\n`;
  },
  'LbMotion.stop': fixed('LbMotion.stopAndWait();\n'),
  'LbMotion.approxDistance': (block, gen) => {
    addHeader(gen);
    return field(block, 'UnitDistance') === 'cm'
      ? ['LbMotion.getDistanceMm() / 10', Order.MULTIPLICATIVE]
      : ['LbMotion.getDistanceMm()', Order.ATOMIC];
  },
  'LbMotion.approxHeading': (_block, gen) => {
    addHeader(gen);
    return ['LbMotion.getRotationDeg()', Order.ATOMIC];
  },
  'LbMotion.setZeroOrigin': fixed('LbMotion.setZeroOrigin();\n'),

  // ── Leanbot: Gripper ──
  'LbGripper.open': fixed('LbGripper.open();\n'),
  'LbGripper.close': fixed('LbGripper.close();\n'),
  'LbGripper.moveTo': (block, gen) => {
    addHeader(gen);
    return `LbGripper.moveTo(${gen.valueToCode(block, 'angleDeg', Order.NONE)});\n`;
  },
  'LbGripper.moveToLR': (block, gen) => {
    addHeader(gen);
    const v = (name: string) => gen.valueToCode(block, name, Order.NONE);
    return `LbGripper.moveToLR(${v('angleDegL')}, ${v('angleDegR')}, ${v('timeMs')});\n`;
  },
  'LbGripper.help': () => '',

  // ── Leanbot: RGB Leds ──
  'LbRGB.help': () => '',
  'LbRGB.clear_show': (block, gen) => {
    addHeader(gen);
    return `LbRGB.clear();\n${dedentedBody(block, gen)}LbRGB.show();\n`;
  },
  'LbRGB.setColor': (block, gen) => {
    addHeader(gen);
    const colour = gen.valueToCode(block, 'RGBColor', Order.NONE).replace('#', '0x');
    return `LbRGB[${field(block, 'ledX')}] = ${colour};\n`;
  },
  'LbRGB.setColorText': (block, gen) => {
    addHeader(gen);
    return `LbRGB[${field(block, 'ledX')}] = CRGB::${field(block, 'RGBColor')};\n`;
  },
  'LbRGB.fillColor': (block, gen) => {
    addHeader(gen);
    const colour = gen.valueToCode(block, 'RGBColor', Order.NONE).replace('#', '0x');
    return `LbRGB.fillColor(${colour}, ${gen.valueToCode(block, 'bitmask', Order.NONE)});\n`;
  },
  'LbRGB.shape': (block, gen) => {
    addHeader(gen);
    // Pythaverse cuts the last ", " even when no led is ticked ("BITMA)"); kept as is.
    const on = LB_LEDS.filter((led) => block.getFieldValue(led) === 'TRUE');
    const code = `BITMAP(${on.map((led) => `${led}, `).join('')}`;
    return [`${code.substring(0, code.length - 2)})`, Order.ATOMIC];
  },
  'LbRGB.colour_picker': (block) => [field(block, 'Color').replace('#', '0x'), Order.NONE],
  'LbRGB.colour_random': (_block, gen) => {
    addHeader(gen);
    return ['CRGB(random8(), random8(), random8())', Order.NONE];
  },
  'LbRGB.colour_rgb': (block, gen) => {
    addHeader(gen);
    const part = (name: string) => Number(gen.valueToCode(block, name, Order.COMMA));
    return [hex((part('Red') << 16) | (part('Green') << 8) | part('Blue')), Order.NONE];
  },
  'LbRGB.colour_blend': (block) => {
    const c1 = Number(field(block, 'Color1').replace('#', '0x'));
    const c2 = Number(field(block, 'Color2').replace('#', '0x'));
    const ratio = Number(block.getFieldValue('Ratio'));
    const mix = (shift: number) =>
      Math.round(((c1 >>> shift) & 0xff) * (1 - ratio) + ((c2 >>> shift) & 0xff) * ratio);
    return [hex((mix(16) << 16) | (mix(8) << 8) | mix(0)), Order.NONE];
  },
  'LbRGB.clear': fixed('LbRGB.clear();\n'),
  'LbRGB.show': fixed('LbRGB.show();\n'),

  // ── Leanbot: Sound ──
  'Leanbot.toneDuration': (block, gen) => {
    addHeader(gen);
    const khz = field(block, 'UnitFreq') === 'kHz';
    const duration = gen.valueToCode(block, 'Duration', Order.NONE);
    return `Leanbot.tone(${scaled(block, gen, 'Freq', khz ? '1000' : null)}, ${duration});\nLbDelay(${duration});\n`;
  },

  // ── Leanbot: Sensors ──
  'LbTouch.waitUntil': (block, gen) => {
    addHeader(gen);
    return `while (LbTouch.read(${field(block, 'touchX')}) == LOW);\n`;
  },
  'LbTouch.read': (block, gen) => {
    addHeader(gen);
    return [`(LbTouch.read(${field(block, 'touchX')}) == HIGH)`, Order.ATOMIC];
  },
  'Leanbot.ping': (block, gen) => {
    addHeader(gen);
    const mm = field(block, 'UnitPing') === 'mm';
    return [mm ? 'Leanbot.pingMm()' : 'Leanbot.pingCm()', Order.ATOMIC];
  },
  'Leanbot.objectInFront': (block, gen) => {
    addHeader(gen);
    let distance = gen.valueToCode(block, 'Distance', Order.NONE);
    // Pythaverse rounds a plain number (its `isNaN("")` is false too).
    if (!Number.isNaN(Number(distance))) distance = String(Math.round(Number(distance)));
    return [`Leanbot.pingCm() <= ${distance}`, Order.RELATIONAL];
  },

  // ── Leanbot: IRLine ──
  'LbIRLine.doManualCalibration': (block, gen) => {
    addHeader(gen);
    gen.setups_['setup_leanbot_lineCalibration'] =
      `LbIRLine.doManualCalibration(${field(block, 'touchX')});`;
    return '';
  },
  'LbIRLine.setThreshold': (block, gen) => {
    addHeader(gen);
    const v = (name: string) => gen.valueToCode(block, name, Order.NONE);
    gen.setups_['setup_leanbot_setThreshold'] =
      `LbIRLine.setThreshold(${v('th2L')}, ${v('th0L')}, ${v('th1R')}, ${v('th3R')});`;
    return '';
  },
  'LbIRLine.read': fixed('LbIRLine.read();\n'),
  'LbIRLine.displayOnRGB': (block, gen) => {
    addHeader(gen);
    const colour = gen.valueToCode(block, 'RGBColor', Order.NONE).replace('#', '0x');
    return `LbIRLine.displayOnRGB(${colour});\n`;
  },
  'LbIRLine.isBlackDetected': (_block, gen) => {
    addHeader(gen);
    return ['LbIRLine.isBlackDetected()', Order.ATOMIC];
  },
  'LbIRLine.value': (_block, gen) => {
    addHeader(gen);
    return ['LbIRLine.value()', Order.ATOMIC];
  },
  // Each black eye is one bit, the outer left eye (2L) the highest: ⬜⬛⬛⬜ = 6.
  'LbIRLine.state': (block, gen) => {
    addHeader(gen);
    let state = 0;
    for (let i = 0; i <= 3; i++) {
      if (field(block, `state${String(i)}`) === '#000000') state |= 1 << (3 - i);
    }
    return [String(state), Order.ATOMIC];
  },
  'LbIRLine.help': () => '',
};

/** Every block type with Arduino code: Pythaverse's toolbox, its shadows and helpers. */
export const LB_GENERATED_TYPES: readonly string[] = Object.keys(FOR_BLOCK);

/** Pythaverse's `Blockly.Arduino`, minus its "Generated … at <time>" header. */
export class LeanbotArduino extends CodeGenerator {
  includes_: Record<string, string> = {};
  override definitions_: Record<string, string> = {};
  setups_: Record<string, string> = {};

  constructor() {
    super('LeanbotArduino');
    this.INDENT = '  ';
    // Pythaverse's overrides, minus its entries for orders Arduino does not define.
    this.ORDER_OVERRIDES = [
      [Order.MEMBER, Order.MEMBER],
      [Order.LOGICAL_AND, Order.LOGICAL_AND],
      [Order.LOGICAL_OR, Order.LOGICAL_OR],
    ];
    this.addReservedWords(RESERVED_WORDS);
    for (const [type, fn] of Object.entries(FOR_BLOCK)) {
      this.forBlock[type] = (block) => fn(block, this);
    }
  }

  override init(workspace: Workspace): void {
    super.init(workspace);
    this.includes_ = {};
    this.definitions_ = {};
    this.setups_ = {};
    this.nameDB_ = new Names(this.RESERVED_WORDS_);
    this.nameDB_.setVariableMap(workspace.getVariableMap());
  }

  override finish(code: string): string {
    const includes = Object.values(this.includes_);
    if (includes.length) includes.push('\n');
    const definitions = Object.values(this.definitions_);
    if (definitions.length) definitions.push('\n');
    const setups = ['', ...Object.values(this.setups_)];
    const setup = `void setup() {${setups.join('\n  ')}\n}\n\n`;
    const loop = `void loop() {\n  ${code.replace(/\n/g, '\n  ')}`.slice(0, -2);
    return `${includes.join('\n')}${definitions.join('\n')}${setup}${loop}}`;
  }

  override scrubNakedValue(line: string): string {
    return `${line};\n`;
  }

  override scrub_(block: Block, code: string, thisOnly?: boolean): string {
    // A block that prints nothing in loop() (it writes to setup() or the top) keeps no mark:
    // Pythaverse leaves no line for it.
    if (this.STATEMENT_PREFIX && code === this.injectId(this.STATEMENT_PREFIX, block)) code = '';
    let comments = '';
    if (!block.outputConnection?.targetConnection) {
      const comment = block.getCommentText();
      if (comment) comments += `${this.prefixLines(comment, '// ')}\n`;
      for (const input of block.inputList) {
        if (!(input instanceof inputs.ValueInput)) continue;
        const child = input.connection?.targetBlock();
        const nested = child ? this.allNestedComments(child) : '';
        if (nested) comments += this.prefixLines(nested, '// ');
      }
    }
    const next = thisOnly === true ? null : block.nextConnection?.targetBlock();
    const nextCode = next ? this.blockToCode(next) : '';
    return comments + code + (typeof nextCode === 'string' ? nextCode : '');
  }

  /** Pythaverse sets no loop trap and no statement prefix: loops print their body as is. */
  override addLoopTrap(branch: string): string {
    return branch;
  }

  /** Marks the start of each statement with its block id (stripped again by `toArduino`). */
  override injectId(msg: string, block: Block): string {
    return msg.replace(/%1/g, () => block.id);
  }

  distinctName(name: string): string {
    return this.names().getDistinctName(name, Names.NameType.VARIABLE);
  }

  /** The C name of a variable field (its value is the variable id). */
  variableId(id: string): string {
    return this.names().getName(id, Names.NameType.VARIABLE);
  }

  /** The C name of a procedure argument, given by name. */
  variableName(name: string): string {
    return this.names().getName(name, Names.NameType.VARIABLE);
  }

  procedureName(name: string): string {
    return this.names().getName(name, Names.NameType.PROCEDURE);
  }

  private names(): Names {
    if (this.nameDB_ === undefined) throw new Error('generator.init(workspace) was not called');
    return this.nameDB_;
  }
}

const generator = new LeanbotArduino();

/** Code of one block as Pythaverse's editor prints it (`Blockly.Arduino.blockToCode`). */
export function blockToArduino(block: Block): string {
  generator.STATEMENT_PREFIX = null;
  generator.init(block.workspace);
  const code = generator.blockToCode(block);
  return Array.isArray(code) ? code[0] : code;
}

/** The generated program and the line (0-based) each statement block starts on. */
export interface ArduinoProgram {
  code: string;
  lineOf: ReadonlyMap<string, number>;
}

/**
 * The whole sketch for `workspace`, as Pythaverse writes it minus its 3-line "Generated … at
 * <time>" header (a clock would make the code differ on every call).
 */
export function toArduino(workspace: Workspace): ArduinoProgram {
  generator.STATEMENT_PREFIX = `${MARK_START}%1${MARK_END}`;
  const marked = generator.workspaceToCode(workspace);
  generator.STATEMENT_PREFIX = null;
  return stripMarks(marked);
}

/** Removes the block id marks; a mark on an empty line belongs to the next line with code. */
function stripMarks(marked: string): ArduinoProgram {
  const lineOf = new Map<string, number>();
  const pending: string[] = [];
  const marks = new RegExp(`${MARK_START}([^${MARK_END}]*)${MARK_END}`, 'g');
  const lines = marked.split('\n').map((line, index) => {
    for (const match of line.matchAll(marks)) pending.push(match[1] ?? '');
    const text = line.replace(marks, '');
    if (text.trim().length > 0) {
      for (const id of pending) if (!lineOf.has(id)) lineOf.set(id, index);
      pending.length = 0;
    }
    return text.trimEnd();
  });
  return { code: lines.join('\n'), lineOf };
}
