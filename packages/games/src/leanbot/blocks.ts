import type { BlocklyBlockJson } from '@codequest/engine';

// Vietnamese blocks for the Leanbot world (docs/product/the-gioi-leanbot.md §3). Each block maps
// to one block of Pythaverse's Leanbot editor and generates the same Arduino code (arduino.ts).
// Logic and loop blocks keep the words of Làng Măng (docs/glossary.md) but are separate types:
// their code is C++, not the sandbox JavaScript of `cq_if`/`cq_repeat`.

/** Combo of touch pads that starts a mission (Pythaverse `comboTouch`). */
export const LB_COMBOS = ['TB1A + TB1B', 'TB1A + TB2B', 'TB2A + TB1B'] as const;
/** Touch pads printed on the board edge (not buttons, §9.20 of AGENTS.md). */
export const LB_TOUCH_PADS = ['TB1A', 'TB1B', 'TB2A', 'TB2B'] as const;
/** The 7 RGB leds, `ledO` in the middle. */
export const LB_LEDS = ['ledO', 'ledA', 'ledB', 'ledC', 'ledD', 'ledE', 'ledF'] as const;

/**
 * Colours a child can pick. `crgb` is the FastLED name used by "tô đèn" (`CRGB::Red`), `hex` the
 * value used where Pythaverse plugs a colour picker (`fillColor`, `displayOnRGB`).
 */
export const LB_COLORS = [
  { id: 'RED', vi: 'đỏ', crgb: 'Red', hex: '0xff0000' },
  { id: 'ORANGE', vi: 'cam', crgb: 'Orange', hex: '0xffa500' },
  { id: 'YELLOW', vi: 'vàng', crgb: 'Yellow', hex: '0xffff00' },
  { id: 'GREEN', vi: 'xanh lá', crgb: 'Green', hex: '0x00ff00' },
  { id: 'CYAN', vi: 'xanh ngọc', crgb: 'Cyan', hex: '0x00ffff' },
  { id: 'BLUE', vi: 'xanh dương', crgb: 'Blue', hex: '0x0000ff' },
  { id: 'MAGENTA', vi: 'tím', crgb: 'Magenta', hex: '0xff00ff' },
  { id: 'PINK', vi: 'hồng', crgb: 'Pink', hex: '0xffc0cb' },
  { id: 'WHITE', vi: 'trắng', crgb: 'White', hex: '0xffffff' },
] as const;
export type LbColorId = (typeof LB_COLORS)[number]['id'];

/** Comparison operators of "so sánh", in Pythaverse's order. */
export const LB_COMPARE_OPS = {
  EQ: '==',
  NEQ: '!=',
  LT: '<',
  LTE: '<=',
  GT: '>',
  GTE: '>=',
} as const;
/** Arithmetic operators of "phép tính" (no power: Arduino has no operator for it). */
export const LB_ARITH_OPS = { ADD: '+', MINUS: '-', MULTIPLY: '*', DIVIDE: '/' } as const;

/** Upper bound of "lặp N lần"; robot programs repeat more than the 20 of Làng Măng. */
export const LB_REPEAT_MAX = 1000;

/** Upper bound of "chờ", in its unit (seconds or milliseconds). */
export const LB_WAIT_MAX = 100000;

/** Toolbox group of a block in the workshop (Pythaverse category it comes from). */
export type LbGroup =
  'mission' | 'motion' | 'gripper' | 'led' | 'sensor' | 'irline' | 'logic' | 'loop' | 'math';

export interface LbBlockDef {
  type: string;
  group: LbGroup;
  json: BlocklyBlockJson;
}

const statement = { previousStatement: null, nextStatement: null } as const;
const options = (values: readonly string[]) => values.map((v) => [v, v]);
const num = (name: string, value: number, min: number, max: number, precision = 0) => ({
  type: 'field_number',
  name,
  value,
  min,
  max,
  ...(precision > 0 ? { precision } : { precision: 1 }),
});
const colorField = (value: LbColorId) => ({
  type: 'field_dropdown',
  name: 'COLOR',
  options: LB_COLORS.map((c) => [c.vi, c.id]),
  value,
});
const irEye = (name: string) => ({
  type: 'field_dropdown',
  name,
  options: [
    ['⬜', 'W'],
    ['⬛', 'B'],
  ],
});

export const LB_BLOCKS: readonly LbBlockDef[] = [
  // ── Nhiệm vụ và thời gian ──
  {
    type: 'lb_mission_touch',
    group: 'mission',
    json: {
      message0: '🚩 bắt đầu khi chạm %1',
      args0: [{ type: 'field_dropdown', name: 'COMBO', options: options(LB_COMBOS) }],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'BODY' }],
      message2: 'kết thúc nhiệm vụ',
      ...statement,
      style: 'event_blocks',
      tooltip: 'Robot đứng chờ tới khi bé chạm hai vùng này, rồi mới chạy',
    },
  },
  {
    type: 'lb_mission_now',
    group: 'mission',
    json: {
      message0: '🚩 bắt đầu ngay',
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'BODY' }],
      message2: 'kết thúc nhiệm vụ',
      ...statement,
      style: 'event_blocks',
      tooltip: 'Robot chạy ngay khi bật, không chờ chạm',
    },
  },
  {
    type: 'lb_wait',
    group: 'mission',
    json: {
      message0: 'chờ %1 %2',
      args0: [
        num('N', 1, 0, LB_WAIT_MAX, 0.01),
        {
          type: 'field_dropdown',
          name: 'UNIT',
          options: [
            ['giây', 'SEC'],
            ['mili giây', 'MS'],
          ],
        },
      ],
      ...statement,
      style: 'event_blocks',
      tooltip: 'Đứng chờ. Bánh đang quay thì robot vẫn chạy trong lúc chờ',
    },
  },
  {
    type: 'lb_comment',
    group: 'mission',
    json: {
      message0: '💬 ghi chú %1',
      args0: [{ type: 'field_input', name: 'TEXT', text: 'Mô tả' }],
      ...statement,
      style: 'event_blocks',
      tooltip: 'Chữ để người đọc hiểu. Robot bỏ qua',
    },
  },
  // ── Di chuyển ──
  {
    type: 'lb_run',
    group: 'motion',
    json: {
      message0: 'quay bánh: trái %1 phải %2 vòng/phút',
      args0: [num('LEFT', 30, -200, 200), num('RIGHT', 30, -200, 200)],
      ...statement,
      style: 'move_blocks',
      tooltip: 'Bật hai bánh rồi đi tiếp khối dưới ngay. Bánh âm thì quay lùi',
    },
  },
  {
    type: 'lb_go',
    group: 'motion',
    json: {
      message0: 'đi tiếp %1 %2',
      args0: [
        num('N', 20, 0, 10000, 0.1),
        {
          type: 'field_dropdown',
          name: 'UNIT',
          options: [
            ['cm', 'CM'],
            ['mm', 'MM'],
          ],
        },
      ],
      ...statement,
      style: 'move_blocks',
      tooltip: 'Chờ tới khi robot đi đủ quãng này',
    },
  },
  {
    type: 'lb_turn',
    group: 'motion',
    json: {
      message0: 'xoay tiếp %1 độ',
      args0: [num('N', 90, 0, 3600)],
      ...statement,
      style: 'move_blocks',
      tooltip: 'Chờ tới khi robot xoay đủ góc này',
    },
  },
  {
    type: 'lb_stop',
    group: 'motion',
    json: { message0: 'dừng lại', ...statement, style: 'move_blocks', tooltip: 'Tắt hai bánh' },
  },
  // ── Tay gắp ──
  {
    type: 'lb_gripper_open',
    group: 'gripper',
    json: { message0: '✋ mở tay gắp', ...statement, style: 'robot_blocks', tooltip: 'Mở tay' },
  },
  {
    type: 'lb_gripper_close',
    group: 'gripper',
    json: {
      message0: '✊ khép tay gắp',
      ...statement,
      style: 'robot_blocks',
      tooltip: 'Khép tay lại để giữ đồ',
    },
  },
  {
    type: 'lb_gripper_to',
    group: 'gripper',
    json: {
      message0: 'xoay tay gắp tới %1 độ',
      args0: [num('N', 45, 0, 180)],
      ...statement,
      style: 'robot_blocks',
      tooltip: 'Xoay cả hai tay tới góc này',
    },
  },
  {
    type: 'lb_gripper_to_lr',
    group: 'gripper',
    json: {
      message0: 'xoay tay trái tới %1 độ, tay phải tới %2 độ trong %3 mili giây',
      args0: [num('LEFT', 30, 0, 180), num('RIGHT', 60, 0, 180), num('MS', 1000, 0, 60000)],
      ...statement,
      style: 'robot_blocks',
      tooltip: 'Xoay từng tay, chậm hay nhanh tùy số mili giây',
    },
  },
  // ── Đèn và còi ──
  {
    type: 'lb_led_set',
    group: 'led',
    json: {
      message0: 'tô đèn %1 màu %2',
      args0: [
        {
          type: 'field_dropdown',
          name: 'LED',
          options: LB_LEDS.map((led) => [led.slice(3), led]),
        },
        colorField('RED'),
      ],
      ...statement,
      style: 'pen_blocks',
      tooltip: 'Ghi màu cho một đèn. Phải có "bật đèn lên" thì đèn mới sáng',
    },
  },
  {
    type: 'lb_led_fill',
    group: 'led',
    json: {
      message0: 'tô các đèn O %1 A %2 B %3 C %4 D %5 E %6 F %7 màu %8',
      args0: [
        ...LB_LEDS.map((led) => ({ type: 'field_checkbox', name: led, checked: true })),
        colorField('YELLOW'),
      ],
      ...statement,
      style: 'pen_blocks',
      tooltip: 'Ghi một màu cho các đèn được đánh dấu. Phải có "bật đèn lên"',
    },
  },
  {
    type: 'lb_led_clear',
    group: 'led',
    json: {
      message0: 'xóa hết màu',
      ...statement,
      style: 'pen_blocks',
      tooltip: 'Xóa màu của mọi đèn. Phải có "bật đèn lên" thì đèn mới tắt',
    },
  },
  {
    type: 'lb_led_show',
    group: 'led',
    json: {
      message0: '💡 bật đèn lên',
      ...statement,
      style: 'pen_blocks',
      tooltip: 'Đèn sáng đúng màu vừa tô',
    },
  },
  {
    type: 'lb_tone',
    group: 'led',
    json: {
      message0: '🔔 kêu %1 Hz trong %2 mili giây',
      args0: [num('HZ', 1500, 20, 20000), num('MS', 100, 0, 60000)],
      ...statement,
      style: 'pen_blocks',
      tooltip: 'Còi kêu. Số Hz càng lớn tiếng càng cao',
    },
  },
  // ── Vùng chạm, mắt siêu âm ──
  {
    type: 'lb_touch_wait',
    group: 'sensor',
    json: {
      message0: 'chờ tới khi chạm %1',
      args0: [{ type: 'field_dropdown', name: 'PAD', options: options(LB_TOUCH_PADS) }],
      ...statement,
      style: 'sensor_blocks',
      tooltip: 'Đứng chờ tới khi bé chạm vùng này',
    },
  },
  {
    type: 'lb_touch_is',
    group: 'sensor',
    json: {
      message0: '%1 đang được chạm?',
      args0: [{ type: 'field_dropdown', name: 'PAD', options: options(LB_TOUCH_PADS) }],
      output: 'Boolean',
      style: 'sensor_blocks',
      tooltip: '✔ khi có ngón tay đang chạm vùng này',
    },
  },
  {
    type: 'lb_ping',
    group: 'sensor',
    json: {
      message0: 'khoảng cách phía trước (cm)',
      output: 'Number',
      style: 'sensor_blocks',
      tooltip: 'Mắt siêu âm đo tới vật phía trước. Không có vật thì ra 1000',
    },
  },
  {
    type: 'lb_object_near',
    group: 'sensor',
    json: {
      message0: 'có vật trong vòng %1 cm?',
      args0: [num('CM', 25, 0, 1000)],
      output: 'Boolean',
      style: 'sensor_blocks',
      tooltip: '✔ khi vật phía trước cách robot bằng hoặc gần hơn số này',
    },
  },
  // ── Mắt dò vạch ──
  {
    type: 'lb_irline_read',
    group: 'irline',
    json: {
      message0: '👀 mắt dò vạch: nhìn xuống',
      ...statement,
      style: 'sensor_blocks',
      tooltip: 'Đọc 4 mắt dò vạch. Phải nhìn xuống trước khi hỏi',
    },
  },
  {
    type: 'lb_irline_black',
    group: 'irline',
    json: {
      message0: 'thấy vạch đen?',
      output: 'Boolean',
      style: 'sensor_blocks',
      tooltip: '✔ khi ít nhất một mắt thấy vạch đen',
    },
  },
  {
    type: 'lb_irline_is',
    group: 'irline',
    json: {
      message0: '4 mắt dò vạch thấy %1 %2 %3 %4 ?',
      args0: [irEye('E2L'), irEye('E0L'), irEye('E1R'), irEye('E3R')],
      output: 'Boolean',
      style: 'sensor_blocks',
      tooltip: 'Mắt ngoài trái, trong trái, trong phải, ngoài phải. ⬛ là thấy vạch đen',
    },
  },
  {
    type: 'lb_irline_show',
    group: 'irline',
    json: {
      message0: 'hiện 4 mắt dò vạch lên đèn, màu %1',
      args0: [colorField('GREEN')],
      ...statement,
      style: 'sensor_blocks',
      tooltip: 'Mắt nào thấy vạch đen thì đèn đó sáng',
    },
  },
  // ── Logic và lặp (chữ của Làng Măng) ──
  {
    type: 'lb_if',
    group: 'logic',
    json: {
      message0: 'nếu %1 thì',
      args0: [{ type: 'input_value', name: 'COND', check: 'Boolean' }],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      ...statement,
      style: 'logic_blocks',
      tooltip: '✔ thì làm các khối bên trong, ✘ thì bỏ qua',
    },
  },
  {
    type: 'lb_if_else',
    group: 'logic',
    json: {
      message0: 'nếu %1 thì',
      args0: [{ type: 'input_value', name: 'COND', check: 'Boolean' }],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      message2: 'nếu không thì',
      message3: '%1',
      args3: [{ type: 'input_statement', name: 'ELSE' }],
      ...statement,
      style: 'logic_blocks',
      tooltip: '✔ thì làm nhánh trên, ✘ thì làm nhánh dưới',
    },
  },
  {
    type: 'lb_compare',
    group: 'logic',
    json: {
      message0: '%1 %2 %3',
      args0: [
        { type: 'input_value', name: 'A', check: 'Number' },
        {
          type: 'field_dropdown',
          name: 'OP',
          options: [
            ['=', 'EQ'],
            ['≠', 'NEQ'],
            ['<', 'LT'],
            ['≤', 'LTE'],
            ['>', 'GT'],
            ['≥', 'GTE'],
          ],
        },
        { type: 'input_value', name: 'B', check: 'Number' },
      ],
      inputsInline: true,
      output: 'Boolean',
      style: 'logic_blocks',
      tooltip: 'So hai số: ✔ khi đúng như dấu ở giữa',
    },
  },
  {
    type: 'lb_and_or',
    group: 'logic',
    json: {
      message0: '%1 %2 %3',
      args0: [
        { type: 'input_value', name: 'A', check: 'Boolean' },
        {
          type: 'field_dropdown',
          name: 'OP',
          options: [
            ['và', 'AND'],
            ['hoặc', 'OR'],
          ],
        },
        { type: 'input_value', name: 'B', check: 'Boolean' },
      ],
      inputsInline: true,
      output: 'Boolean',
      style: 'logic_blocks',
      tooltip: '"và": cả hai cùng ✔. "hoặc": chỉ cần một cái ✔',
    },
  },
  {
    type: 'lb_not',
    group: 'logic',
    json: {
      message0: 'không phải %1',
      args0: [{ type: 'input_value', name: 'A', check: 'Boolean' }],
      output: 'Boolean',
      style: 'logic_blocks',
      tooltip: 'Đổi ✔ thành ✘ và ✘ thành ✔',
    },
  },
  {
    type: 'lb_bool',
    group: 'logic',
    json: {
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'BOOL',
          options: [
            ['đúng', 'TRUE'],
            ['sai', 'FALSE'],
          ],
        },
      ],
      output: 'Boolean',
      style: 'logic_blocks',
      tooltip: 'Luôn ✔ (đúng) hoặc luôn ✘ (sai)',
    },
  },
  {
    type: 'lb_repeat',
    group: 'loop',
    json: {
      message0: 'lặp %1 lần',
      args0: [num('TIMES', 4, 0, LB_REPEAT_MAX)],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      ...statement,
      style: 'loop_blocks',
      tooltip: 'Làm các khối bên trong nhiều lần',
    },
  },
  {
    type: 'lb_repeat_while',
    group: 'loop',
    json: {
      message0: 'lặp khi %1',
      args0: [{ type: 'input_value', name: 'COND', check: 'Boolean' }],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      ...statement,
      style: 'loop_blocks',
      tooltip: 'Hỏi trước mỗi vòng: ✔ thì làm thêm một vòng, ✘ thì dừng',
    },
  },
  {
    type: 'lb_repeat_until',
    group: 'loop',
    json: {
      message0: 'lặp đến khi %1',
      args0: [{ type: 'input_value', name: 'COND', check: 'Boolean' }],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      ...statement,
      style: 'loop_blocks',
      tooltip: 'Hỏi trước mỗi vòng: ✘ thì làm thêm một vòng, ✔ thì dừng',
    },
  },
  {
    type: 'lb_forever',
    group: 'loop',
    json: {
      message0: 'lặp mãi',
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      ...statement,
      style: 'loop_blocks',
      tooltip: 'Làm các khối bên trong mãi mãi, không bao giờ dừng',
    },
  },
  // ── Số ──
  {
    type: 'lb_number',
    group: 'math',
    json: {
      message0: '%1',
      args0: [{ type: 'field_number', name: 'N', value: 0, min: -100000, max: 100000 }],
      output: 'Number',
      style: 'math_blocks',
      tooltip: 'Một con số',
    },
  },
  {
    type: 'lb_arith',
    group: 'math',
    json: {
      message0: '%1 %2 %3',
      args0: [
        { type: 'input_value', name: 'A', check: 'Number' },
        {
          type: 'field_dropdown',
          name: 'OP',
          options: [
            ['+', 'ADD'],
            ['-', 'MINUS'],
            ['×', 'MULTIPLY'],
            ['÷', 'DIVIDE'],
          ],
        },
        { type: 'input_value', name: 'B', check: 'Number' },
      ],
      inputsInline: true,
      output: 'Number',
      style: 'math_blocks',
      tooltip: 'Cộng, trừ, nhân, chia hai số',
    },
  },
];

/** Every Leanbot block type. */
export const LB_BLOCK_TYPES: readonly string[] = LB_BLOCKS.map((b) => b.type);
