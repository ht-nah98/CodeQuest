// Programs for the Leanbot lesson pictures, written as data and turned into the XML the real
// block editor (ide.pythaverse.space/lbeditor/?lang=vi) loads. render.mjs drops the XML into
// that editor and photographs it, so a picture shows the blocks exactly as a child will see
// them: same colours, same half-English labels.
//
// Block types and field values were read off the live editor on 22/10/2026 (Blockly 3.2020).

/** "Leanbot bắt đầu hoạt động" + "Mission: Begin when TB1A + TB1B combo touched … End". */
export const program = (body, opts = {}) => ({
  type: 'Leanbot.whenStarted_vi',
  ...opts,
  next: {
    type: 'LbMission.beginByTeacher_end_vi',
    id: opts.missionId ?? 'mission',
    fields: { comboTouch: 'TB1A + TB1B' },
    statements: { Body: body },
  },
});

/** Di chuyển: Chạy / Rẽ với vận tốc Trái … Phải … vòng/phút */
export const run = (left, right, { turn = false, id } = {}) => ({
  type: 'LbMotion.run_vi',
  id,
  fields: { MotionType: turn ? 'Turn' : 'Run', UnitSpeed: 'rpm' },
  values: { Left: left, Right: right },
});

/** Di chuyển: Chạy đoạn đường … cm */
export const distance = (cm, { id } = {}) => ({
  type: 'LbMotion.waitDistanceMm_vi',
  id,
  fields: { UnitDistance: 'cm' },
  values: { distanceMm: cm },
});

/** Di chuyển: Rẽ góc … độ */
export const turnBy = (deg, { id } = {}) => ({
  type: 'LbMotion.waitRotationDeg_vi',
  id,
  fields: { UnitDegree: 'degrees' },
  values: { rotationDeg: deg },
});

/** Gripper: Open */
export const gripperOpen = ({ id } = {}) => ({ type: 'LbGripper.open_vi', id });

/** Gripper: Close */
export const gripperClose = ({ id } = {}) => ({ type: 'LbGripper.close_vi', id });

/** Gripper: Rotate to … độ */
export const gripperTo = (deg, { id } = {}) => ({
  type: 'LbGripper.moveTo_vi',
  id,
  fields: { UnitDegree: 'degrees' },
  values: { angleDeg: deg },
});

/** Gripper: Rotate Left to … and Right to … độ in … mili giây */
export const gripperLR = (left, right, ms, { id } = {}) => ({
  type: 'LbGripper.moveToLR_vi',
  id,
  fields: { UnitDegree: 'degrees', UnitDuration: 'milliseconds' },
  values: { angleDegL: left, angleDegR: right, timeMs: ms },
});

/** Chờ … giây / mili giây */
export const wait = (n, { ms = false, id } = {}) => ({
  type: 'Leanbot.delay_vi',
  id,
  fields: { Unit: ms ? 'milliseconds' : 'seconds' },
  values: { Delay: n },
});

/** if … do … (still English in the editor on 22/10/2026) */
export const ifDo = (cond, body, { id } = {}) => ({
  type: 'controls_if',
  id,
  values: { IF0: cond },
  statements: { DO0: body },
});

/** repeat while … do … ; `cond` true gives "repeat while true", the course's "lặp mãi". */
export const repeatWhile = (cond, body, { id } = {}) => ({
  type: 'controls_whileUntil',
  id,
  fields: { MODE: 'WHILE' },
  values: { BOOL: cond === true ? { type: 'logic_boolean', fields: { BOOL: 'TRUE' } } : cond },
  statements: { DO: body },
});

/** Ping: Object in front is within … cm distance ? */
export const objectInFront = (cm, { id } = {}) => ({
  type: 'Leanbot.objectInFront_vi',
  id,
  fields: { UnitPing: 'cm' },
  values: { Distance: cm },
});

/** Ping: Front distance in cm ≤ n */
export const pingAtMost = (n, { id } = {}) => ({
  type: 'logic_compare',
  id,
  fields: { OP: 'LTE' },
  values: { A: { type: 'Leanbot.ping_vi', fields: { UnitPing: 'cm' } }, B: n },
});

/** Di chuyển: Dừng */
export const stop = ({ id } = {}) => ({ type: 'LbMotion.stop_vi', id });

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

let counter = 0;

/** One block and everything under it, as Blockly XML. `list` is a stack: each one `next` of the last. */
function stackXml(list) {
  if (list.length === 0) return '';
  const [first, ...rest] = list;
  return blockXml(rest.length > 0 ? { ...first, next: rest } : first);
}

function blockXml(block, pos = '') {
  counter += 1;
  const id = block.id ?? `auto${String(counter)}`;
  let inner = '';
  for (const [name, value] of Object.entries(block.fields ?? {})) {
    inner += `<field name="${name}">${esc(value)}</field>`;
  }
  for (const [name, value] of Object.entries(block.values ?? {})) {
    // a number is a typed-in shadow; an object is a block plugged into the socket
    inner +=
      typeof value === 'object'
        ? `<value name="${name}">${blockXml(value)}</value>`
        : `<value name="${name}"><shadow type="math_number"><field name="NUM">${esc(value)}</field></shadow></value>`;
  }
  for (const [name, body] of Object.entries(block.statements ?? {})) {
    inner += `<statement name="${name}">${stackXml(body)}</statement>`;
  }
  if (block.next) {
    const next = Array.isArray(block.next) ? block.next : [block.next];
    inner += `<next>${stackXml(next)}</next>`;
  }
  return `<block type="${block.type}" id="${id}"${pos}>${inner}</block>`;
}

/**
 * A workspace: stacks placed at (x, y). A stack is a block (with its own `next`) or a list of
 * blocks snapped one under the other.
 */
export function workspaceXml(stacks) {
  const body = stacks
    .map(({ x = 0, y = 0, blocks }) => {
      const list = Array.isArray(blocks) ? blocks : [blocks];
      const [first, ...rest] = list;
      return blockXml(
        rest.length > 0 ? { ...first, next: rest } : first,
        ` x="${String(x)}" y="${String(y)}"`,
      );
    })
    .join('');
  return `<xml xmlns="https://developers.google.com/blockly/xml">${body}</xml>`;
}
