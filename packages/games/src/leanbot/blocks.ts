import type { BlocklyBlockJson } from '@codequest/engine';

// The blocks of Pythaverse's Leanbot editor (ide.pythaverse.space/lbeditor), one for one: the
// same type names, inputs, fields, dropdown values and connection checks, so a program saved
// there loads here and prints the same code (arduino.ts). Only the words change: Vietnamese
// for children of grade 4–5 (docs/product/the-gioi-leanbot.md). Where Pythaverse already has a
// Vietnamese label (`?lang=vi`) it is used as is, so both editors read the same.
//
// Blocks Pythaverse takes from Blockly unchanged (`controls_if`, `logic_compare`, `math_number`,
// `procedures_*`, `variables_*`…) are not redefined: Blockly's own definitions and its
// Vietnamese locale are used. CodeQuest's own worlds never use those types (they use `cq_*`).

/** Combo of touch pads that starts a mission (`comboTouch`). */
export const LB_COMBOS = ['TB1A + TB1B', 'TB1A + TB2B', 'TB2A + TB1B'] as const;
/** Touch pads printed on the board edge (not buttons, AGENTS.md §9.20). */
export const LB_TOUCH_PADS = ['TB1A', 'TB1B', 'TB2A', 'TB2B'] as const;
/** The 7 RGB leds, `ledO` in the middle. */
export const LB_LEDS = ['ledO', 'ledA', 'ledB', 'ledC', 'ledD', 'ledE', 'ledF'] as const;
/** Digital pins of the Arduino Nano in Leanbot. */
const DIGITAL_PINS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];

/** Pythaverse's block colours, so a block looks the same in both editors. */
export const LB_COLOURS = {
  logic: '#5b80a5',
  loop: '#5ba55b',
  math: '#5b67a5',
  text: '#5ba58c',
  arduino: '#007481',
  variable: '#a55b80',
  procedure: '#995ba5',
  comment: '#c6c6c6',
  mission: '#ff4d6a',
  missionValue: '#ff889c',
  motion: '#3373cc',
  motionValue: '#77a2dd',
  gripper: '#9966ff',
  rgb: '#59c059',
  colour: '#90d590',
  sound: '#5cb1d6',
  touchWait: '#ff8c1a',
  sensor: '#ffb266',
  irline: '#ffbf00',
  irlineValue: '#ffd455',
} as const;
const C = LB_COLOURS;

/** Value checks of Pythaverse (`intCompatibility` and friends). */
const INT = ['int', 'Number'];

export interface LbBlockDef {
  type: string;
  json: BlocklyBlockJson;
}

type Arg = Readonly<Record<string, unknown>>;
type Part = string | Arg;

const S = { previousStatement: null, nextStatement: null } as const;
const value = (name: string, check?: string | string[]): Arg => ({
  type: 'input_value',
  name,
  ...(check !== undefined && { check }),
});
const statement = (name: string): Arg => ({ type: 'input_statement', name });
const dummy: Arg = { type: 'input_dummy' };
const dropdown = (name: string, options: [string, string][]): Arg => ({
  type: 'field_dropdown',
  name,
  options,
});
const same = (values: readonly string[]): [string, string][] => values.map((v) => [v, v]);
const text = (name: string, value: string): Arg => ({ type: 'field_input', name, text: value });
const SECONDS: [string, string][] = [
  ['giây', 'seconds'],
  ['mili giây', 'milliseconds'],
];

/** Builds `message0`/`args0` from labels and args in reading order. */
function block(
  type: string,
  colour: string,
  parts: readonly Part[],
  shape: Readonly<Record<string, unknown>>,
  extra: Readonly<Record<string, unknown>> = {},
): LbBlockDef {
  const args: Arg[] = [];
  const words: string[] = [];
  // Labels and fields before a statement input sit on their own row, as in Pythaverse.
  let pending = false;
  for (const part of parts) {
    if (typeof part === 'string') {
      words.push(part.replace(/%/g, '%%'));
      pending = true;
      continue;
    }
    if (part['type'] === 'input_statement' && pending) {
      args.push(dummy);
      words.push(`%${String(args.length)}`);
    }
    args.push(part);
    words.push(`%${String(args.length)}`);
    pending = !String(part['type']).startsWith('input_');
  }
  const message = words.join(' ');
  return {
    type,
    json: { message0: message, args0: args, colour, inputsInline: true, ...shape, ...extra },
  };
}

const output = (check: string | string[] | null) => ({ output: check });

/** A picture-only block of the toolbox, like Pythaverse's "help" blocks. Generates nothing. */
function helpBlock(type: string, src: string, width: number, height: number): LbBlockDef {
  return {
    type,
    json: {
      message0: '%1',
      args0: [{ type: 'field_image', src, width, height, alt: '*' }],
      colour: C.comment,
    },
  };
}

/** Types a variable can be declared as (`VAR_TYPE`, Pythaverse's `Vars_DropdownConfig`). */
export const LB_VAR_TYPES: [string, string][] = [
  ['tự đoán', 'auto'],
  ['số nguyên', 'int'],
  ['số thập phân', 'float'],
  ['chữ', 'String'],
  ['đúng/sai', 'bool'],
];
/** Variable types a global variable field lists (Pythaverse's `Vars_ListConfig`). */
export const LB_GLOBAL_VAR_TYPES = ['global', 'int', 'float', 'String', 'bool'];

const variable = (name: string, types: string[], defaultType: string): Arg => ({
  type: 'field_variable',
  name,
  variable: null,
  variableTypes: types,
  defaultType,
});

function typedVariableBlocks(
  kind: string,
  icon: string,
  field: string,
  type: string,
  check: string | string[],
  getCheck: string | string[],
): LbBlockDef[] {
  return [
    block(
      `vars_set_${kind}`,
      C.variable,
      [`${icon} gán`, variable(`VAR_SET_${field}`, [type], type), 'bằng', value('VALUE', check)],
      S,
      { inputsInline: false },
    ),
    block(
      `vars_get_${kind}`,
      C.variable,
      [variable(`VAR_GET_${field}`, [type], type)],
      output(getCheck),
    ),
  ];
}

export const LB_BLOCKS: readonly LbBlockDef[] = [
  // ── Logic: Pythaverse's own "switch" ──
  {
    type: 'controls_switch',
    json: {
      message0: 'xét hộp %1',
      args0: [{ type: 'field_variable', name: 'SWVAR', variable: 'i' }],
      message1: 'nếu bằng %1',
      args1: [{ type: 'input_value', name: 'CASE0', align: 'RIGHT' }],
      message2: 'thì %1',
      args2: [{ type: 'input_statement', name: 'DO0', align: 'RIGHT' }],
      ...S,
      colour: C.logic,
      mutator: 'lb_switch_mutator',
      tooltip: 'So hộp với từng trường hợp, làm nhánh khớp',
    },
  },

  // ── Toán: Pythaverse's own versions ──
  block(
    'math_constant',
    C.math,
    [
      dropdown('CONSTANT', [
        ['π', 'PI'],
        ['π/2', 'HALF_PI'],
        ['2π', 'TWO_PI'],
      ]),
    ],
    output(['float', 'Number']),
  ),
  {
    type: 'math_number_property',
    json: {
      message0: '%1 là %2',
      args0: [
        { type: 'input_value', name: 'NUMBER_TO_CHECK', check: ['float', 'Number'] },
        {
          type: 'field_dropdown',
          name: 'PROPERTY',
          options: [
            ['số chẵn', 'EVEN'],
            ['số lẻ', 'ODD'],
            ['số dương', 'POSITIVE'],
            ['số âm', 'NEGATIVE'],
            ['chia hết cho', 'DIVISIBLE_BY'],
          ],
        },
      ],
      inputsInline: true,
      output: 'Boolean',
      colour: C.math,
      mutator: 'math_is_divisibleby_mutator',
    },
  },
  block(
    'math_round',
    C.math,
    [dropdown('OP', [['làm tròn', 'round']]), value('NUM', ['Number', 'float'])],
    output('Number'),
    { inputsInline: false },
  ),
  block(
    'math_single',
    C.math,
    [
      dropdown('OP', [
        ['trị tuyệt đối', 'ABS'],
        ['bình phương', 'SQUARE'],
        ['căn bậc hai', 'ROOT'],
      ]),
      value('NUM', ['int', 'float', 'Number']),
    ],
    output(['int', 'float', 'Number']),
    { inputsInline: false },
  ),
  block(
    'math_multiple2',
    C.math,
    [
      dropdown('OP', [
        ['số lớn hơn trong', 'MAX'],
        ['số nhỏ hơn trong', 'MIN'],
        ['lũy thừa', 'POW'],
      ]),
      value('NUM1', INT),
      value('NUM2', INT),
    ],
    output(INT),
  ),
  block(
    'math_trig',
    C.math,
    [
      dropdown('OP', [
        ['cos', 'COS'],
        ['sin', 'SIN'],
        ['tan', 'TAN'],
      ]),
      value('NUM', ['Number', 'float']),
      dropdown('UNIT', [
        ['độ', 'degrees'],
        ['radian', 'radians'],
      ]),
    ],
    output('float'),
  ),
  block(
    'math_map',
    C.math,
    [
      'đổi thang đo:',
      value('Number', 'math_map_from'),
      value('fromLow', 'math_map_to'),
      value('fromHigh', 'math_map_to'),
    ],
    output(INT),
    { inputsInline: false },
  ),
  block('math_map_from', C.math, [value('NUM', INT), ', biết rằng'], output('math_map_from')),
  block(
    'math_map_to',
    C.math,
    [value('FROM', INT), 'đổi thành', value('TO', INT)],
    output('math_map_to'),
  ),
  block('math_random_seed', C.math, ['khởi động số ngẫu nhiên bằng', value('SEED', INT)], S),

  // ── Arduino: In/Out ──
  block(
    'board_base_inout_buildin_led',
    C.arduino,
    ['bật đèn trên mạch ở mức', dropdown('STAT', same(['HIGH', 'LOW']))],
    S,
  ),
  block(
    'board_base_inout_digital_write',
    C.arduino,
    [
      'đặt chân số',
      dropdown('PIN', same(DIGITAL_PINS)),
      'ở mức',
      dropdown('STAT', same(['HIGH', 'LOW'])),
    ],
    S,
  ),
  block(
    'board_base_inout_digital_read',
    C.arduino,
    ['mức của chân số', dropdown('PIN', same(DIGITAL_PINS))],
    output('Boolean'),
  ),
  block(
    'board_base_inout_highlow',
    C.arduino,
    [dropdown('BOOL', same(['HIGH', 'LOW']))],
    output('Boolean'),
  ),
  block(
    'board_base_inout_analog_write',
    C.arduino,
    [
      'ghi ra chân analog',
      dropdown('PIN', same(['3', '5', '6', '9', '10', '11'])),
      'giá trị',
      value('PWM', INT),
    ],
    S,
  ),
  block(
    'board_base_inout_analog_read',
    C.arduino,
    ['đọc chân analog', dropdown('PIN', same(['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7']))],
    output('int'),
  ),
  block('board_base_delay', C.arduino, ['chờ (mili giây)', value('DELAY_TIME', INT)], S),
  block('board_base_angle', C.arduino, ['góc:', text('ANGLE', '90')], output(INT)),
  block(
    'board_base_map',
    C.arduino,
    [
      'đổi giá trị',
      value('Number', INT),
      'từ khoảng',
      value('fromLow', INT),
      '-',
      value('fromHigh', INT),
      'sang khoảng',
      value('toLow', INT),
      '-',
      value('toHigh', INT),
    ],
    output(null),
  ),
  block(
    'board_base_inout_tone',
    C.arduino,
    ['phát tiếng ở chân', dropdown('PIN', same(DIGITAL_PINS)), 'tần số (Hz)', value('NUM', INT)],
    S,
  ),
  block(
    'board_base_inout_notone',
    C.arduino,
    ['tắt tiếng ở chân', dropdown('PIN', same(DIGITAL_PINS))],
    S,
  ),

  // ── Arduino: Serial ──
  block(
    'board_serial_init',
    C.arduino,
    [
      'Serial: mở với tốc độ',
      dropdown('SPEED', same(['115200', '9600', '500000', '1000000', '2000000'])),
      'baud',
    ],
    S,
  ),
  block(
    'board_serial_print',
    C.arduino,
    [
      'Serial:',
      dropdown('PRINT', [
        ['in rồi xuống dòng', 'println'],
        ['in', 'print'],
      ]),
      value('CONTENT'),
    ],
    S,
  ),
  block('board_serial_available', C.arduino, ['Serial: có dữ liệu gửi tới?'], output('Boolean')),
  block('board_serial_read', C.arduino, ['Serial: đọc'], output('Number')),
  block(
    'board_serial_readStringUntil',
    C.arduino,
    ['Serial: đọc tới khi gặp', value('CONTENT', 'String')],
    output('String'),
  ),
  block('board_serial_flush', C.arduino, ['Serial: chờ gửi xong'], S),

  // ── Leanbot ──
  block('Leanbot.commentLine', C.comment, ['💬', text('commentString', 'Mô tả')], S),
  block('Leanbot.section', C.comment, ['💬', text('commentString', 'Mô tả'), statement('Body')], S),
  block('Leanbot.delay', C.mission, ['Chờ', value('Delay', INT), dropdown('Unit', SECONDS)], S),
  block(
    'LbMission.elapsedMillis',
    C.missionValue,
    ['Nhiệm vụ: thời gian đã chạy, tính bằng', dropdown('Unit', SECONDS)],
    output(INT),
  ),
  block(
    'LbMission.beginByTeacher_end',
    C.mission,
    [
      'Nhiệm vụ: Bắt đầu khi chạm cùng lúc',
      dropdown('comboTouch', same(LB_COMBOS)),
      statement('Body'),
      'Nhiệm vụ: Kết thúc',
    ],
    { previousStatement: null },
  ),
  block(
    'LbMission.beginImmediately_end',
    C.mission,
    ['Nhiệm vụ: Bắt đầu ngay lập tức', statement('Body'), 'Nhiệm vụ: Kết thúc'],
    { previousStatement: null },
  ),
  block(
    'LbMission.missionSelect',
    C.missionValue,
    [
      '“',
      dropdown(
        'missionSelect',
        same(['msNumberGrid', 'SWRP3.M04', 'ms1.1', 'ms11.1', 'ms11.2', 'ms12.1']),
      ),
      '”',
    ],
    output('String'),
  ),
  block(
    'LbMission.beginBySelect_end',
    C.mission,
    [
      'Nhiệm vụ: Bắt đầu trên Bản Sao Số',
      value('missionId', 'String'),
      dummy,
      statement('Body'),
      'Nhiệm vụ: Kết thúc',
    ],
    { previousStatement: null },
  ),
  block('LbMission.end', C.mission, ['Nhiệm vụ: Kết thúc'], { previousStatement: null }),
  block('Leanbot.whenStarted', C.mission, ['Leanbot bắt đầu hoạt động'], {
    nextStatement: null,
  }),
  block(
    'Leanbot.DCMotor.setPower',
    C.mission,
    [
      'Động cơ DC: quay',
      dropdown('Direction', [
        ['tới', 'Forward'],
        ['lùi', 'Backward'],
      ]),
      'với mức',
      value('Power', INT),
      '%',
    ],
    S,
  ),

  // ── Leanbot: Di chuyển ──
  block(
    'LbMotion.run',
    C.motion,
    [
      'Di chuyển:',
      dropdown('MotionType', [
        ['Chạy', 'Run'],
        ['Rẽ', 'Turn'],
      ]),
      'với vận tốc Trái',
      value('Left', INT),
      'Phải',
      value('Right', INT),
      dropdown('UnitSpeed', [
        ['vòng/phút', 'rpm'],
        ['bước/giây', 'sps'],
      ]),
    ],
    S,
  ),
  block(
    'LbMotion.waitDistanceMm',
    C.motion,
    [
      'Di chuyển: Chạy đoạn đường',
      value('distanceMm', INT),
      dropdown('UnitDistance', same(['cm', 'mm'])),
    ],
    S,
  ),
  block(
    'LbMotion.waitRotationDeg',
    C.motion,
    ['Di chuyển: Rẽ góc', value('rotationDeg', INT), dropdown('UnitDegree', [['độ', 'degrees']])],
    S,
  ),
  block(
    'LbMotion.wait',
    C.motion,
    [
      'Di chuyển: Tiếp tục',
      dropdown('MotionType', [
        ['chạy', 'Running'],
        ['rẽ', 'Turning'],
      ]),
      'trong',
      value('Delay', INT),
      dropdown('Unit', SECONDS),
    ],
    S,
  ),
  block('LbMotion.stop', C.motion, ['Di chuyển: Dừng'], S),
  block(
    'LbMotion.approxDistance',
    C.motionValue,
    ['Di chuyển: quãng đường đã đi, tính bằng', dropdown('UnitDistance', same(['mm', 'cm']))],
    output('Number'),
  ),
  block(
    'LbMotion.approxHeading',
    C.motionValue,
    ['Di chuyển: góc đã rẽ, tính bằng', dropdown('UnitDegree', [['độ', 'degrees']])],
    output('Number'),
  ),
  block('LbMotion.setZeroOrigin', C.motion, ['Di chuyển: Đặt quãng đường và góc về 0'], S),

  // ── Leanbot: Tay gắp ──
  block('LbGripper.open', C.gripper, ['Tay gắp: Mở'], S),
  block('LbGripper.close', C.gripper, ['Tay gắp: Khép'], S),
  block(
    'LbGripper.moveTo',
    C.gripper,
    ['Tay gắp: Xoay tới', value('angleDeg', INT), dropdown('UnitDegree', [['độ', 'degrees']])],
    S,
  ),
  block(
    'LbGripper.moveToLR',
    C.gripper,
    [
      'Tay gắp: Xoay tay Trái tới',
      value('angleDegL', INT),
      'và tay Phải tới',
      value('angleDegR', INT),
      dropdown('UnitDegree', [['độ', 'degrees']]),
      'trong',
      value('timeMs', INT),
      dropdown('UnitDuration', [['mili giây', 'milliseconds']]),
    ],
    S,
  ),
  helpBlock('LbGripper.help', '/leanbot/img/bai-00/tay-gap-that.png', 280, 100),

  // ── Leanbot: Đèn Led RGB ──
  helpBlock('LbRGB.help', '/leanbot/img/bai-00/den-coi.png', 300, 100),
  block('LbRGB.clear_show', C.rgb, ['Đèn: Xóa hết màu', statement('Body'), 'Đèn: Bật lên'], S),
  block(
    'LbRGB.setColor',
    C.rgb,
    ['Đèn: Tô đèn', dropdown('ledX', same(LB_LEDS)), 'màu', value('RGBColor', 'Colour')],
    S,
  ),
  block(
    'LbRGB.setColorText',
    C.rgb,
    [
      'Đèn: Tô đèn',
      dropdown('ledX', same(LB_LEDS)),
      'màu',
      text('RGBColor', 'Yellow'),
      dropdown('Helper', [
        ['?', 'Help'],
        [
          'https://github.com/FastLED/FastLED/wiki/Pixel-reference#predefined-colors-list',
          'HelpUrl',
        ],
      ]),
    ],
    S,
  ),
  block(
    'LbRGB.fillColor',
    C.rgb,
    ['Đèn: Tô', value('bitmask', INT), 'màu', value('RGBColor', 'Colour')],
    S,
  ),
  block(
    'LbRGB.shape',
    C.colour,
    LB_LEDS.flatMap((led) => [
      led === 'ledO' ? 'các đèn: O' : led.slice(3),
      { type: 'field_checkbox', name: led, checked: true },
    ]),
    output(null),
  ),
  block(
    'LbRGB.colour_picker',
    C.colour,
    ['Màu sắc:', { type: 'field_colour', name: 'Color', colour: '#ff0000' }],
    output(null),
  ),
  block('LbRGB.colour_random', C.colour, ['Màu sắc: ngẫu nhiên'], output(null)),
  block(
    'LbRGB.colour_rgb',
    C.colour,
    [
      'Màu sắc: Đỏ',
      value('Red', INT),
      'Xanh lá',
      value('Green', INT),
      'Xanh dương',
      value('Blue', INT),
    ],
    output(null),
  ),
  block(
    'LbRGB.colour_blend',
    C.colour,
    [
      'Màu sắc: Pha',
      { type: 'field_colour', name: 'Color1', colour: '#00ff00' },
      'với',
      { type: 'field_colour', name: 'Color2', colour: '#0000ff' },
      'tỉ lệ',
      { type: 'field_number', name: 'Ratio', value: 0.5, min: 0, max: 1 },
    ],
    output(null),
  ),
  block('LbRGB.clear', C.rgb, ['Đèn: Xóa hết màu'], S),
  block('LbRGB.show', C.rgb, ['Đèn: Bật lên'], S),

  // ── Leanbot: Âm thanh ──
  block(
    'Leanbot.toneDuration',
    C.sound,
    [
      'Âm thanh: Kêu',
      value('Freq', INT),
      dropdown('UnitFreq', same(['Hz', 'kHz'])),
      'trong',
      value('Duration', INT),
      dropdown('UnitDuration', [['mili giây', 'milliseconds']]),
    ],
    S,
  ),

  // ── Leanbot: Cảm biến ──
  block(
    'LbTouch.waitUntil',
    C.touchWait,
    ['Chạm: chờ tới khi chạm', dropdown('touchX', same(LB_TOUCH_PADS))],
    S,
  ),
  block(
    'LbTouch.read',
    C.sensor,
    ['Chạm:', dropdown('touchX', same(LB_TOUCH_PADS)), 'đang được chạm?'],
    output(['Boolean', 'Number']),
  ),
  block(
    'Leanbot.ping',
    C.sensor,
    ['Siêu âm: khoảng cách phía trước, tính bằng', dropdown('UnitPing', same(['cm', 'mm']))],
    output('Number'),
  ),
  block(
    'Leanbot.objectInFront',
    C.sensor,
    [
      'Siêu âm: có vật phía trước trong vòng',
      value('Distance', INT),
      dropdown('UnitPing', same(['cm'])),
      '?',
    ],
    output(['Boolean', 'Number']),
  ),

  // ── Leanbot: Dò vạch ──
  block(
    'LbIRLine.doManualCalibration',
    C.irline,
    ['Dò vạch: tự hiệu chỉnh, bấm bằng vùng chạm', dropdown('touchX', same(LB_TOUCH_PADS))],
    S,
  ),
  block(
    'LbIRLine.setThreshold',
    C.irline,
    [
      'Dò vạch: đặt ngưỡng 2L',
      value('th2L', INT),
      '0L',
      value('th0L', INT),
      '1R',
      value('th1R', INT),
      '3R',
      value('th3R', INT),
    ],
    S,
  ),
  block('LbIRLine.read', C.irline, ['Dò vạch: Đọc 4 mắt'], S),
  block(
    'LbIRLine.displayOnRGB',
    C.irline,
    ['Dò vạch: Hiện lên đèn với', value('RGBColor', 'Colour')],
    S,
  ),
  block('LbIRLine.isBlackDetected', C.irlineValue, ['Dò vạch: Thấy vạch đen?'], output('Boolean')),
  block(
    'LbIRLine.value',
    C.irlineValue,
    ['Dò vạch: 4 mắt đang thấy (2L, 0L, 1R, 3R)'],
    output('Number'),
  ),
  block(
    'LbIRLine.state',
    C.irlineValue,
    [
      'Dò vạch:',
      ...[0, 1, 2, 3].map((i) => ({
        type: 'field_colour',
        name: `state${String(i)}`,
        colour: '#ffffff',
        colourOptions: ['#ffffff', '#000000'],
        colourTitles: ['Nền trắng', 'Vạch đen'],
        columns: 2,
      })),
    ],
    output('Number'),
  ),
  helpBlock('LbIRLine.help', '/leanbot/img/bai-00/ir-duoi-bung.png', 160, 123),

  // ── Biến: Pythaverse's typed variables ──
  block(
    'vars_initialize_global_auto',
    C.variable,
    [
      '🔢 tạo hộp chung',
      variable('VAR_SET_GLOBAL', LB_GLOBAL_VAR_TYPES, 'global'),
      'bằng',
      value('VALUE'),
    ],
    S,
    { inputsInline: false },
  ),
  block(
    'vars_initialize_global',
    C.variable,
    [
      '🔢 tạo hộp chung',
      variable('VAR_SET_GLOBAL', LB_GLOBAL_VAR_TYPES, 'global'),
      'kiểu',
      dropdown('VAR_TYPE', LB_VAR_TYPES),
      'bằng',
      value('VALUE'),
    ],
    S,
    { inputsInline: false },
  ),
  block(
    'vars_set_global',
    C.variable,
    ['🔢 gán', variable('VAR_SET_GLOBAL', LB_GLOBAL_VAR_TYPES, 'global'), 'bằng', value('VALUE')],
    S,
    { inputsInline: false },
  ),
  block(
    'vars_get_global',
    C.variable,
    [variable('VAR_GET_GLOBAL', LB_GLOBAL_VAR_TYPES, 'global')],
    output(null),
  ),
  block(
    'vars_initialize_local_auto',
    C.variable,
    ['🔢 tạo hộp riêng', variable('VAR_SET_INT', [''], ''), 'bằng', value('VALUE')],
    S,
    { inputsInline: false },
  ),
  block(
    'vars_initialize_local',
    C.variable,
    [
      '🔢 tạo hộp riêng',
      variable('VAR_SET_INT', [''], ''),
      'kiểu',
      dropdown('VAR_TYPE', LB_VAR_TYPES),
      'bằng',
      value('VALUE'),
    ],
    S,
    { inputsInline: false },
  ),
  ...typedVariableBlocks('int', '🔢', 'INT', 'int', INT, INT),
  ...typedVariableBlocks('float', '🔢', 'FLOAT', 'float', ['int', 'float', 'Number'], 'float'),
  ...typedVariableBlocks('string', '🔤', 'STRING', 'String', 'String', 'String'),
  ...typedVariableBlocks('boolean', '🇧', 'BOOLEAN', 'bool', 'Boolean', 'Boolean'),
];

/** Every block type this module defines (Blockly's own types come on top, see toolbox.ts). */
export const LB_BLOCK_TYPES: readonly string[] = LB_BLOCKS.map((b) => b.type);
