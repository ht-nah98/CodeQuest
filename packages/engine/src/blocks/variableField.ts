import {
  Field,
  FieldDropdown,
  fieldRegistry,
  registry,
  type FieldDropdownFromJsonConfig,
  type MenuOption,
  type Workspace,
} from 'blockly';
import { VARIABLE_ID, type LevelVariable } from '@codequest/content-schema';

/** Blockly JSON field type of the box dropdown (ADR-0022 §2). */
export const FIELD_CQ_VAR = 'field_cq_var';
/** Value of a box field that names no box yet (no level, no workspace). */
export const NO_VARIABLE = '__none';
/** Label of the placeholder option when the field has no value either. */
const PLACEHOLDER_LABEL = 'hộp';

const workspaceVariables = new WeakMap<Workspace, readonly LevelVariable[]>();

/**
 * Declares the boxes of the level (or lesson demo) a workspace shows, so every `field_cq_var`
 * on it lists them by name. Blocks of a flyout read their target workspace's boxes. Without a
 * call (or with `undefined`) the fields show a placeholder and keep whatever id they hold.
 */
export function setWorkspaceVariables(
  ws: Workspace,
  variables: readonly LevelVariable[] | undefined,
): void {
  if (variables === undefined) workspaceVariables.delete(ws);
  else workspaceVariables.set(ws, variables);
}

/** The boxes declared for a workspace (a flyout's: its target's), or undefined. */
export function workspaceVariablesOf(ws: Workspace): readonly LevelVariable[] | undefined {
  const target = ws.isFlyout
    ? ((ws as Workspace & { targetWorkspace?: Workspace | null }).targetWorkspace ?? ws)
    : ws;
  return workspaceVariables.get(target);
}

/**
 * Box dropdown of the variable blocks. Unlike a plain `FieldDropdown` it never throws for want of
 * options and never drops a value: the menu is the level's boxes when the workspace declares
 * them, else one placeholder; any id matching `^[a-z][a-z0-9_]*$` is accepted (a program can be
 * loaded before, or without, its level, e.g. `analyzeWorkspace`); the label is looked up for the
 * current value in the latest list, or is the id itself.
 */
export class FieldCqVar extends FieldDropdown {
  constructor(value?: string) {
    super(Field.SKIP_SETUP);
    this.menuGenerator_ = (): MenuOption[] => this.variableOptions();
    this.setValue(value ?? NO_VARIABLE);
  }

  static override fromJson(options: FieldDropdownFromJsonConfig): FieldCqVar {
    const value = (options as { value?: unknown }).value;
    return new this(typeof value === 'string' ? value : undefined);
  }

  /** `[[name, id], …]` of the declared boxes, or a single placeholder option. */
  private variableOptions(): MenuOption[] {
    const block = this.getSourceBlock();
    const variables = block === null ? undefined : workspaceVariablesOf(block.workspace);
    if (variables !== undefined && variables.length > 0) {
      return variables.map((variable): MenuOption => [variable.name, variable.id]);
    }
    const value = this.getValue();
    const id = value === null || value === '' ? NO_VARIABLE : value;
    return [[id === NO_VARIABLE ? PLACEHOLDER_LABEL : id, id]];
  }

  protected override doClassValidation_(newValue?: string): string | null {
    if (typeof newValue !== 'string') return null;
    return newValue === NO_VARIABLE || VARIABLE_ID.test(newValue) ? newValue : null;
  }

  protected override doValueUpdate_(newValue: string): void {
    super.doValueUpdate_(newValue);
    // FieldDropdown only updates its selected option when the value is in the menu of that
    // moment; keep it in step with the latest boxes so the label (and ARIA text) stays right.
    this.syncSelectedOption();
  }

  protected override getText_(): string | null {
    return this.syncSelectedOption()?.[0] ?? null;
  }

  /** The option of the current value in the latest box list (or `[id, id]`), now selected. */
  private syncSelectedOption(): [string, string] | null {
    const value = this.getValue();
    if (value === null) return null;
    const found = this.getOptions(false).find((candidate) => candidate[1] === value);
    const option: [string, string] =
      found !== undefined && typeof found[0] === 'string' ? [found[0], value] : [value, value];
    // `selectedOption` is private in FieldDropdown; it backs the base class's label and ARIA text.
    (this as unknown as { selectedOption: MenuOption }).selectedOption = option;
    return option;
  }

  override getText(): string {
    return this.getText_() ?? '';
  }
}

/** Registers `field_cq_var` with Blockly once (again after a hot reload replaced the class). */
export function registerVariableField(): void {
  // `hasItem` first: `getClass` warns on the console when the field is missing.
  const known = registry.hasItem(registry.Type.FIELD, FIELD_CQ_VAR)
    ? registry.getClass(registry.Type.FIELD, FIELD_CQ_VAR, false)
    : null;
  if (known === (FieldCqVar as unknown)) return;
  if (known !== null) fieldRegistry.unregister(FIELD_CQ_VAR);
  fieldRegistry.register(FIELD_CQ_VAR, FieldCqVar);
}
