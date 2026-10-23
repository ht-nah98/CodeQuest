import { LB_COLOURS as C } from './blocks';

// The toolbox of Pythaverse's Leanbot editor, category for category and block for block, with
// the same starting values (its `blockxml`, from fixtures/toolbox.json). Category names are in
// Vietnamese; where Pythaverse's `?lang=vi` already names one, that name is kept.

export interface LbCategory {
  name: string;
  colour: string;
  /** Blockly dynamic category: Blockly's `PROCEDURE`, or a typed-variable flyout (flyouts.ts). */
  custom?: string;
  /** Blocks as Blockly XML, the way Pythaverse lists them. */
  blocks?: readonly string[];
  children?: readonly LbCategory[];
}

export const LB_TOOLBOX: readonly LbCategory[] = [
  {
    name: 'Logic',
    colour: C.logic,
    blocks: [
      "<block type='controls_if'></block>",
      "<block type='logic_compare'></block>",
      "<block type='logic_operation'></block>",
      "<block type='logic_negate'></block>",
      "<block type='logic_boolean'></block>",
      "<block type='logic_null'></block>",
      "<block type='logic_ternary'></block>",
      "<block type='controls_switch'></block>",
    ],
  },
  {
    name: 'Vòng lặp',
    colour: C.loop,
    blocks: [
      "<block type='controls_repeat_ext'><value name='TIMES'><shadow type='math_number'><field name='NUM'>10</field></shadow></value></block>",
      "<block type='controls_repeat'></block>",
      "<block type='controls_whileUntil'></block>",
      "<block type='controls_for'><value name='FROM'><shadow type='math_number'><field name='NUM'>1</field></shadow></value><value name='TO'><shadow type='math_number'><field name='NUM'>10</field></shadow></value><value name='BY'><shadow type='math_number'><field name='NUM'>1</field></shadow></value></block>",
      "<block type='controls_forEach'></block>",
      "<block type='controls_flow_statements'></block>",
    ],
  },
  {
    name: 'Toán',
    colour: C.math,
    blocks: [
      "<block type='math_number' gap='12'><field name='NUM'>123</field></block>",
      "<block type='math_constant' gap='12'></block>",
      "<block type='math_arithmetic' gap='12'><value name='A'><shadow type='math_number'><field name='NUM'>1</field></shadow></value><value name='B'><shadow type='math_number'><field name='NUM'>2</field></shadow></value></block>",
      "<block type='math_modulo' gap='12'><value name='DIVIDEND'><shadow type='math_number'><field name='NUM'>64</field></shadow></value><value name='DIVISOR'><shadow type='math_number'><field name='NUM'>10</field></shadow></value></block>",
      "<block type='math_number_property' gap='12'><value name='NUMBER_TO_CHECK'><shadow type='math_number'><field name='NUM'>0</field></shadow></value></block>",
      "<block type='math_round' gap='28'><value name='NUM'><shadow type='math_number'><field name='NUM'>3.14</field></shadow></value></block>",
      "<block type='math_single' gap='12'><value name='NUM'><shadow type='math_number'><field name='NUM'>9</field></shadow></value></block>",
      "<block type='math_multiple2' gap='12'><value name='NUM1'><shadow type='math_number'><field name='NUM'>2</field></shadow></value><value name='NUM2'><shadow type='math_number'><field name='NUM'>3</field></shadow></value></block>",
      "<block type='math_trig' gap='28'><value name='NUM'><shadow type='math_number'><field name='NUM'>45</field></shadow></value></block>",
      "<block type='math_constrain' gap='12'><value name='VALUE'><shadow type='math_number'><field name='NUM'>50</field></shadow></value><value name='LOW'><shadow type='math_number'><field name='NUM'>1</field></shadow></value><value name='HIGH'><shadow type='math_number'><field name='NUM'>100</field></shadow></value></block>",
      "<block type='math_map' gap='36'><value name='Number'><block type='math_map_from'><value name='NUM'><shadow type='math_number'><field name='NUM'>712</field></shadow></value></block></value><value name='fromLow'><block type='math_map_to'><value name='FROM'><shadow type='math_number'><field name='NUM'>0</field></shadow></value><value name='TO'><shadow type='math_number'><field name='NUM'>0</field></shadow></value></block></value><value name='fromHigh'><block type='math_map_to'><value name='FROM'><shadow type='math_number'><field name='NUM'>1023</field></shadow></value><value name='TO'><shadow type='math_number'><field name='NUM'>100</field></shadow></value></block></value></block>",
      "<block type='math_random_int' gap='12'><value name='FROM'><shadow type='math_number'><field name='NUM'>0</field></shadow></value><value name='TO'><shadow type='math_number'><field name='NUM'>100</field></shadow></value></block>",
      "<block type='math_random_seed'><value name='SEED'><shadow type='board_base_inout_analog_read'><field name='PIN'>A0</field></shadow></value></block>",
    ],
  },
  {
    name: 'Biến',
    colour: C.variable,
    children: [
      {
        name: 'riêng / tham số',
        colour: C.variable,
        custom: 'VARIABLE_TYPED_LOCAL',
      },
      {
        name: 'chung',
        colour: C.variable,
        custom: 'VARIABLE_TYPED',
      },
      {
        name: 'số',
        colour: C.variable,
        custom: 'VARIABLE_TYPED_NUM',
      },
      {
        name: 'chữ',
        colour: C.variable,
        custom: 'VARIABLE_TYPED_TEXT',
      },
      {
        name: 'đúng/sai',
        colour: C.variable,
        custom: 'VARIABLE_TYPED_BOOLEAN',
      },
    ],
  },
  {
    name: 'Hàm',
    colour: C.procedure,
    custom: 'PROCEDURE',
  },
  {
    name: 'Arduino',
    colour: C.arduino,
    children: [
      {
        name: 'Vào/Ra',
        colour: C.arduino,
        blocks: [
          "<block type='board_base_inout_buildin_led'></block>",
          "<block type='board_base_inout_digital_write'></block>",
          "<block type='board_base_inout_digital_read'></block>",
          "<block type='board_base_inout_highlow'></block>",
          "<block type='board_base_inout_analog_write'><value name='PWM'><shadow type='math_number'><field name='NUM'>0</field></shadow></value></block>",
          "<block type='board_base_inout_analog_read'></block>",
          "<block type='board_base_delay'><value name='DELAY_TIME'><shadow type='math_number'><field name='NUM'>1234</field></shadow></value></block>",
          "<block type='board_base_angle'></block>",
          "<block type='board_base_map'><value name='Number'><shadow type='math_number'><field name='NUM'>250</field></shadow></value><value name='fromLow'><shadow type='math_number'><field name='NUM'>0</field></shadow></value><value name='fromHigh'><shadow type='math_number'><field name='NUM'>1023</field></shadow></value><value name='toLow'><shadow type='math_number'><field name='NUM'>0</field></shadow></value><value name='toHigh'><shadow type='math_number'><field name='NUM'>255</field></shadow></value></block>",
          "<block type='board_base_inout_tone'><value name='NUM'><shadow type='math_number'><field name='NUM'>440</field></shadow></value></block>",
          "<block type='board_base_inout_notone'></block>",
        ],
      },
      {
        name: 'Serial',
        colour: C.arduino,
        blocks: [
          "<block type='text'><field name='TEXT'>some text</field></block>",
          "<block type='board_serial_init'></block>",
          "<block type='board_serial_print'><value name='CONTENT'><shadow type='text'><field name='TEXT'>Hello World!</field></shadow></value></block>",
          "<block type='board_serial_available'></block>",
          "<block type='board_serial_read'></block>",
          "<block type='board_serial_readStringUntil'><value name='CONTENT'><shadow type='text'><field name='TEXT'>\\n</field></shadow></value></block>",
          "<block type='board_serial_flush'></block>",
        ],
      },
    ],
  },
  {
    name: 'Leanbot',
    colour: C.mission,
    blocks: [
      "<block type='Leanbot.commentLine'></block>",
      "<block type='Leanbot.section'></block>",
      "<block type='Leanbot.delay'><value name='Delay'><shadow type='math_number'><field name='NUM'>1.25</field></shadow></value></block>",
      "<block type='LbMission.elapsedMillis'></block>",
      "<block type='LbMission.beginByTeacher_end'></block>",
      "<block type='LbMission.beginImmediately_end'></block>",
      "<block type='LbMission.missionSelect'></block>",
      "<block type='LbMission.beginBySelect_end'><value name='missionId'><shadow type='text'><field name='TEXT'>mission name</field></shadow></value></block>",
      "<block type='LbMission.end'></block>",
      "<block type='Leanbot.whenStarted'></block>",
      "<block type='Leanbot.DCMotor.setPower'><value name='Power'><shadow type='math_number'><field name='NUM'>100</field></shadow></value></block>",
    ],
    children: [
      {
        name: 'Di chuyển',
        colour: C.motion,
        blocks: [
          "<block type='LbMotion.run'><value name='Left'><shadow type='math_number'><field name='NUM'>30</field></shadow></value><value name='Right'><shadow type='math_number'><field name='NUM'>30</field></shadow></value></block>",
          "<block type='LbMotion.waitDistanceMm'><value name='distanceMm'><shadow type='math_number'><field name='NUM'>4.2</field></shadow></value></block>",
          "<block type='LbMotion.waitRotationDeg'><value name='rotationDeg'><shadow type='math_number'><field name='NUM'>90</field></shadow></value></block>",
          "<block type='LbMotion.wait'><value name='Delay'><shadow type='math_number'><field name='NUM'>1.25</field></shadow></value></block>",
          "<block type='LbMotion.stop'></block>",
          "<block type='LbMotion.approxDistance'></block>",
          "<block type='LbMotion.approxHeading'></block>",
          "<block type='LbMotion.setZeroOrigin'></block>",
        ],
      },
      {
        name: 'Tay gắp',
        colour: C.gripper,
        blocks: [
          "<block type='LbGripper.open'></block>",
          "<block type='LbGripper.close'></block>",
          "<block type='LbGripper.moveTo'><value name='angleDeg'><shadow type='math_number'><field name='NUM'>45</field></shadow></value></block>",
          "<block type='LbGripper.moveToLR'><value name='angleDegL'><shadow type='math_number'><field name='NUM'>30</field></shadow></value><value name='angleDegR'><shadow type='math_number'><field name='NUM'>60</field></shadow></value><value name='timeMs'><shadow type='math_number'><field name='NUM'>1000</field></shadow></value></block>",
          "<block type='LbGripper.help'></block>",
        ],
      },
      {
        name: 'Đèn Led RGB',
        colour: C.rgb,
        blocks: [
          "<block type='LbRGB.help'></block>",
          "<block type='LbRGB.clear_show'></block>",
          "<block type='LbRGB.setColor'><value name='RGBColor'><shadow type='LbRGB.colour_picker'><field name='Color'>#00ffff</field></shadow></value></block>",
          "<block type='LbRGB.setColorText'></block>",
          "<block type='LbRGB.fillColor'><value name='bitmask'><shadow type='LbRGB.shape'></shadow></value><value name='RGBColor'><shadow type='LbRGB.colour_picker'><field name='Color'>#ffff00</field></shadow></value></block>",
          "<block type='LbRGB.colour_picker'></block>",
          "<block type='LbRGB.colour_random'></block>",
          "<block type='LbRGB.colour_rgb'><value name='Red'><shadow type='math_number'><field name='NUM'>255</field></shadow></value><value name='Green'><shadow type='math_number'><field name='NUM'>0</field></shadow></value><value name='Blue'><shadow type='math_number'><field name='NUM'>0</field></shadow></value></block>",
          "<block type='LbRGB.colour_blend'></block>",
          "<block type='LbRGB.clear'></block>",
          "<block type='LbRGB.show'></block>",
        ],
      },
      {
        name: 'Phát nhạc',
        colour: C.sound,
        blocks: [
          "<block type='Leanbot.toneDuration'><value name='Freq'><shadow type='math_number'><field name='NUM'>1500</field></shadow></value><value name='Duration'><shadow type='math_number'><field name='NUM'>100</field></shadow></value></block>",
        ],
      },
      {
        name: 'Cảm biến',
        colour: C.sensor,
        blocks: [
          "<block type='LbTouch.waitUntil'></block>",
          "<block type='LbTouch.read'></block>",
          "<block type='Leanbot.ping'></block>",
          "<block type='Leanbot.objectInFront'><value name='Distance'><shadow type='math_number'><field name='NUM'>25</field></shadow></value></block>",
        ],
      },
      {
        name: 'Cảm biến vạch',
        colour: C.irline,
        blocks: [
          "<block type='LbIRLine.doManualCalibration'></block>",
          "<block type='LbIRLine.setThreshold'><value name='th2L'><shadow type='math_number'><field name='NUM'>300</field></shadow></value><value name='th0L'><shadow type='math_number'><field name='NUM'>300</field></shadow></value><value name='th1R'><shadow type='math_number'><field name='NUM'>300</field></shadow></value><value name='th3R'><shadow type='math_number'><field name='NUM'>300</field></shadow></value></block>",
          "<block type='LbIRLine.read'></block>",
          "<block type='LbIRLine.displayOnRGB'><value name='RGBColor'><shadow type='LbRGB.colour_picker'><field name='Color'>#00ff00</field></shadow></value></block>",
          "<block type='LbIRLine.isBlackDetected'></block>",
          "<block type='LbIRLine.value'></block>",
          "<block type='LbIRLine.state'></block>",
          "<block type='LbIRLine.help'></block>",
        ],
      },
    ],
  },
];
