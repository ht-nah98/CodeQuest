import {
  type Block,
  type BlockSvg,
  Blocks,
  common,
  type Connection,
  Extensions,
  Field,
  type FieldConfig,
  fieldRegistry,
  inputs,
  registry,
  utils,
  type Workspace,
} from 'blockly';
import { LB_BLOCKS } from './blocks';

// Registers the Leanbot blocks (blocks.ts). Some of Pythaverse's blocks share a type name with
// a Blockly block they replace (`math_round`, `math_constant`, `math_number_property`…): those
// definitions are swapped for Pythaverse's. CodeQuest's own worlds never use them.

interface SwitchState {
  casebreak?: number;
  default?: number;
}
type SwitchBlock = Omit<Block, 'saveExtraState' | 'loadExtraState'> & {
  casebreakCount_: number;
  defaultCount_: number;
  updateShape_(): void;
  saveExtraState(): SwitchState | null;
  loadExtraState(state: SwitchState): void;
};
type Clause = Block & {
  valueConnection_?: Connection | null;
  statementConnection_?: Connection | null;
};

/** "xét hộp … nếu bằng … thì …": the case and default clauses of Pythaverse's switch. */
const SWITCH_MUTATOR = {
  casebreakCount_: 0,
  defaultCount_: 0,

  saveExtraState(this: SwitchBlock): SwitchState | null {
    if (!this.casebreakCount_ && !this.defaultCount_) return null;
    return {
      ...(this.casebreakCount_ ? { casebreak: this.casebreakCount_ } : {}),
      ...(this.defaultCount_ ? { default: 1 } : {}),
    };
  },
  loadExtraState(this: SwitchBlock, state: SwitchState): void {
    this.casebreakCount_ = state.casebreak ?? 0;
    this.defaultCount_ = state.default ? 1 : 0;
    this.updateShape_();
  },
  /** XML of programs saved by Pythaverse: `<mutation casebreak="2" default="1">`. */
  mutationToDom(this: SwitchBlock): Element | null {
    const state = this.saveExtraState();
    if (state === null) return null;
    const xml = utils.xml.createElement('mutation');
    if (state.casebreak) xml.setAttribute('casebreak', String(state.casebreak));
    if (state.default) xml.setAttribute('default', '1');
    return xml;
  },
  domToMutation(this: SwitchBlock, xml: Element): void {
    this.loadExtraState({
      casebreak: parseInt(xml.getAttribute('casebreak') ?? '0', 10) || 0,
      default: parseInt(xml.getAttribute('default') ?? '0', 10) || 0,
    });
  },
  updateShape_(this: SwitchBlock): void {
    if (this.getInput('DEFAULT')) this.removeInput('DEFAULT');
    for (let i = 1; this.getInput(`CASE${String(i)}`); i++) {
      this.removeInput(`CASE${String(i)}`);
      this.removeInput(`DO${String(i)}`);
    }
    for (let i = 1; i <= this.casebreakCount_; i++) {
      this.appendValueInput(`CASE${String(i)}`)
        .setAlign(inputs.Align.RIGHT)
        .appendField('nếu bằng');
      this.appendStatementInput(`DO${String(i)}`).appendField('thì');
    }
    if (this.defaultCount_)
      this.appendStatementInput('DEFAULT').setAlign(inputs.Align.RIGHT).appendField('còn lại');
  },
  decompose(this: SwitchBlock, workspace: Workspace): Block {
    const container = workspace.newBlock('controls_switch_var') as BlockSvg;
    container.initSvg();
    let connection = container.getInput('STACK')?.connection;
    for (let i = 1; i <= this.casebreakCount_; i++) {
      const clause = workspace.newBlock('controls_case_break') as BlockSvg;
      clause.initSvg();
      if (clause.previousConnection) connection?.connect(clause.previousConnection);
      connection = clause.nextConnection ?? undefined;
    }
    if (this.defaultCount_) {
      const clause = workspace.newBlock('controls_case_default') as BlockSvg;
      clause.initSvg();
      if (clause.previousConnection) connection?.connect(clause.previousConnection);
    }
    return container;
  },
  compose(this: SwitchBlock, container: Block): void {
    const clauses: Clause[] = [];
    for (let c = container.getInputTargetBlock('STACK'); c; c = c.getNextBlock()) {
      clauses.push(c);
    }
    this.casebreakCount_ = clauses.filter((c) => c.type === 'controls_case_break').length;
    this.defaultCount_ = clauses.some((c) => c.type === 'controls_case_default') ? 1 : 0;
    this.updateShape_();
    let i = 1;
    for (const clause of clauses) {
      if (clause.type === 'controls_case_break') {
        if (clause.valueConnection_) {
          this.getInput(`CASE${String(i)}`)?.connection?.connect(clause.valueConnection_);
        }
        if (clause.statementConnection_) {
          this.getInput(`DO${String(i)}`)?.connection?.connect(clause.statementConnection_);
        }
        i++;
      } else if (clause.statementConnection_) {
        this.getInput('DEFAULT')?.connection?.connect(clause.statementConnection_);
      }
    }
  },
  saveConnections(this: SwitchBlock, container: Block): void {
    let i = 1;
    for (let c = container.getInputTargetBlock('STACK'); c; c = c.getNextBlock()) {
      const clause = c as Clause;
      if (clause.type === 'controls_case_break') {
        clause.valueConnection_ =
          this.getInput(`CASE${String(i)}`)?.connection?.targetConnection ?? null;
        clause.statementConnection_ =
          this.getInput(`DO${String(i)}`)?.connection?.targetConnection ?? null;
        i++;
      } else {
        clause.statementConnection_ =
          this.getInput('DEFAULT')?.connection?.targetConnection ?? null;
      }
    }
  },
};

/** The small blocks inside the switch's mutator bubble. */
const SWITCH_MUTATOR_BLOCKS = [
  {
    type: 'controls_switch_var',
    message0: 'xét hộp %1 %2',
    args0: [{ type: 'input_dummy' }, { type: 'input_statement', name: 'STACK' }],
    colour: '#5b80a5',
  },
  {
    type: 'controls_case_break',
    message0: 'nếu bằng',
    previousStatement: null,
    nextStatement: null,
    colour: '#5b80a5',
  },
  {
    type: 'controls_case_default',
    message0: 'còn lại',
    previousStatement: null,
    colour: '#5b80a5',
  },
];

/**
 * `field_colour` for Node (tests, content checks): the @blockly/field-colour plugin builds its
 * swatches with `document`, so headless code gets a field that only holds `#rrggbb`.
 */
class HeadlessColourField extends Field<string> {
  override SERIALIZABLE = true;

  static override fromJson(options: FieldConfig & { colour?: string }): HeadlessColourField {
    return new HeadlessColourField(options.colour ?? '#ffffff');
  }
  protected override doClassValidation_(value?: unknown): string | null {
    return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : null;
  }
}

let registered = false;

/** Defines the Leanbot blocks in Blockly. Idempotent, safe on Node and in the browser. */
export function registerLeanbotBlocks(): void {
  if (registered) return;
  registered = true;
  // The web app registers @blockly/field-colour first; Node gets the plain value field.
  if (!registry.hasItem(registry.Type.FIELD, 'field_colour')) {
    fieldRegistry.register('field_colour', HeadlessColourField);
  }
  if (!Extensions.isRegistered('lb_switch_mutator')) {
    Extensions.registerMutator('lb_switch_mutator', SWITCH_MUTATOR, undefined, [
      'controls_case_break',
      'controls_case_default',
    ]);
  }
  const definitions = [
    ...SWITCH_MUTATOR_BLOCKS,
    ...LB_BLOCKS.map((def) => ({ ...def.json, type: def.type })),
  ];
  // Deleting first avoids Blockly's "overwrites previous definition" warning.
  for (const def of definitions) Reflect.deleteProperty(Blocks, def.type);
  common.defineBlocks(common.createBlockDefinitionsFromJsonArray(definitions));
}
