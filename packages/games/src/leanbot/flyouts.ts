import { type utils, Variables, type WorkspaceSvg } from 'blockly';

// Pythaverse's typed variables ("Biến" in its toolbox): five dynamic categories. "số", "chữ" and
// "đúng/sai" each start with a button that makes a variable of that type, then list "gán" and
// the value block for every variable of the type.

type Item = utils.toolbox.FlyoutItemInfo;

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const shadowNumber = (n: string) =>
  `<value name="VALUE"><shadow type="math_number"><field name="NUM">${n}</field></shadow></value>`;
const block = (xml: string): Item => ({ kind: 'block', blockxml: xml });

interface TypedKind {
  /** Variable type, as Pythaverse stores it. */
  type: string;
  button: string;
  callbackKey: string;
  set: string;
  get: string;
  field: string;
  /** The starting value plugged into "gán". */
  shadow: string;
}

const NUMBERS: readonly TypedKind[] = [
  {
    type: 'int',
    button: 'Tạo hộp số nguyên',
    callbackKey: 'createVarBtnInt',
    set: 'vars_set_int',
    get: 'vars_get_int',
    field: 'INT',
    shadow: shadowNumber('0'),
  },
  {
    type: 'float',
    button: 'Tạo hộp số thập phân',
    callbackKey: 'createVarBtnFloat',
    set: 'vars_set_float',
    get: 'vars_get_float',
    field: 'FLOAT',
    shadow: shadowNumber('1.23'),
  },
];
const TEXT: TypedKind = {
  type: 'String',
  button: 'Tạo hộp chữ',
  callbackKey: 'createVarBtnString',
  set: 'vars_set_string',
  get: 'vars_get_string',
  field: 'STRING',
  shadow:
    '<value name="VALUE"><shadow type="text"><field name="TEXT">xin chào</field></shadow></value>',
};
const BOOLEAN: TypedKind = {
  type: 'bool',
  button: 'Tạo hộp đúng/sai',
  callbackKey: 'createVarBtnBoolean',
  set: 'vars_set_boolean',
  get: 'vars_get_boolean',
  field: 'BOOLEAN',
  shadow:
    '<value name="VALUE"><shadow type="logic_boolean"><field name="BOOL">FALSE</field></shadow></value>',
};

function typedItems(ws: WorkspaceSvg, kind: TypedKind): Item[] {
  const items: Item[] = [{ kind: 'button', text: kind.button, callbackkey: kind.callbackKey }];
  for (const v of ws.getVariableMap().getVariablesOfType(kind.type)) {
    const ref = `id="${escape(v.getId())}" variabletype="${kind.type}">${escape(v.getName())}`;
    items.push(
      block(
        `<block type="${kind.set}"><field name="VAR_SET_${kind.field}" ${ref}</field>${kind.shadow}</block>`,
      ),
      block(`<block type="${kind.get}"><field name="VAR_GET_${kind.field}" ${ref}</field></block>`),
    );
  }
  return items;
}

/** Flyout of each dynamic "Biến" category, by its `custom` key in toolbox.ts. */
export const LB_VARIABLE_FLYOUTS: Readonly<Record<string, (ws: WorkspaceSvg) => Item[]>> = {
  VARIABLE_TYPED_LOCAL: () => [
    block(`<block type="vars_initialize_local_auto">${shadowNumber('0')}</block>`),
    block(`<block type="vars_initialize_local">${shadowNumber('0')}</block>`),
  ],
  VARIABLE_TYPED: (ws) => {
    const items = [
      block(`<block type="vars_initialize_global_auto">${shadowNumber('0')}</block>`),
      block('<block type="vars_initialize_global"></block>'),
    ];
    const first = ws.getVariableMap().getVariablesOfType('global')[0];
    if (first) {
      items.push(
        block(
          `<block type="vars_set_global"><field name="VAR_SET_GLOBAL" id="${escape(first.getId())}" variabletype="global">${escape(first.getName())}</field>${shadowNumber('0')}</block>`,
        ),
      );
    }
    return items;
  },
  VARIABLE_TYPED_NUM: (ws) => NUMBERS.flatMap((kind) => typedItems(ws, kind)),
  VARIABLE_TYPED_TEXT: (ws) => typedItems(ws, TEXT),
  VARIABLE_TYPED_BOOLEAN: (ws) => typedItems(ws, BOOLEAN),
};

/** Registers the "Biến" flyouts and their "Tạo hộp…" buttons on a workspace with a toolbox. */
export function registerLeanbotFlyouts(ws: WorkspaceSvg): void {
  for (const [key, flyout] of Object.entries(LB_VARIABLE_FLYOUTS)) {
    ws.registerToolboxCategoryCallback(key, (target) => flyout(target));
  }
  for (const kind of [...NUMBERS, TEXT, BOOLEAN]) {
    ws.registerButtonCallback(kind.callbackKey, (button) => {
      Variables.createVariableButtonHandler(button.getTargetWorkspace(), undefined, kind.type);
    });
  }
}
