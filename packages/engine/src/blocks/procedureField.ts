import {
  Field,
  FieldDropdown,
  fieldRegistry,
  registry,
  type FieldDropdownFromJsonConfig,
  type MenuOption,
  type Workspace,
} from 'blockly';
import { PROCEDURE_ID, type LevelProcedure } from '@codequest/content-schema';

/** Blockly JSON field type of the spell dropdown (ADR-0023 §1). */
export const FIELD_CQ_PROC = 'field_cq_proc';
/** Value of a spell field that names no spell yet (no level, no workspace). */
export const NO_PROCEDURE = '__none';
/** Label of the placeholder option when the field has no value either. */
const PLACEHOLDER_LABEL = 'phép';

const workspaceProcedures = new WeakMap<Workspace, readonly LevelProcedure[]>();

/**
 * Declares the spells of the level (or lesson demo) a workspace shows, so every `field_cq_proc`
 * on it lists them by name. Blocks of a flyout read their target workspace's spells. Without a
 * call (or with `undefined`) the fields show a placeholder and keep whatever id they hold.
 */
export function setWorkspaceProcedures(
  ws: Workspace,
  procedures: readonly LevelProcedure[] | undefined,
): void {
  if (procedures === undefined) workspaceProcedures.delete(ws);
  else workspaceProcedures.set(ws, procedures);
}

/** The spells declared for a workspace (a flyout's: its target's), or undefined. */
export function workspaceProceduresOf(ws: Workspace): readonly LevelProcedure[] | undefined {
  const target = ws.isFlyout
    ? ((ws as Workspace & { targetWorkspace?: Workspace | null }).targetWorkspace ?? ws)
    : ws;
  return workspaceProcedures.get(target);
}

/**
 * Spell dropdown of the `cq_proc_*` blocks, built like `field_cq_var`: it never throws for want
 * of options and never drops a value. The menu is the level's spells when the workspace declares
 * them, else one placeholder; any id matching `^[a-z][a-z0-9_]*$` is accepted (a program can be
 * loaded without its level: `analyzeWorkspace`, a flyout, a lesson demo); the label is the
 * spell's name in the latest list, or the id itself.
 */
export class FieldCqProc extends FieldDropdown {
  constructor(value?: string) {
    super(Field.SKIP_SETUP);
    this.menuGenerator_ = (): MenuOption[] => this.procedureOptions();
    this.setValue(value ?? NO_PROCEDURE);
  }

  static override fromJson(options: FieldDropdownFromJsonConfig): FieldCqProc {
    const value = (options as { value?: unknown }).value;
    return new this(typeof value === 'string' ? value : undefined);
  }

  /** `[[name, id], …]` of the declared spells, or a single placeholder option. */
  private procedureOptions(): MenuOption[] {
    const block = this.getSourceBlock();
    const procedures = block === null ? undefined : workspaceProceduresOf(block.workspace);
    if (procedures !== undefined && procedures.length > 0) {
      return procedures.map((procedure): MenuOption => [procedure.name, procedure.id]);
    }
    const value = this.getValue();
    const id = value === null || value === '' ? NO_PROCEDURE : value;
    return [[id === NO_PROCEDURE ? PLACEHOLDER_LABEL : id, id]];
  }

  protected override doClassValidation_(newValue?: string): string | null {
    if (typeof newValue !== 'string') return null;
    return newValue === NO_PROCEDURE || PROCEDURE_ID.test(newValue) ? newValue : null;
  }

  protected override doValueUpdate_(newValue: string): void {
    super.doValueUpdate_(newValue);
    this.syncSelectedOption();
  }

  protected override getText_(): string | null {
    return this.syncSelectedOption()?.[0] ?? null;
  }

  /** The option of the current value in the latest spell list (or `[id, id]`), now selected. */
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

/** Registers `field_cq_proc` with Blockly once (again after a hot reload replaced the class). */
export function registerProcedureField(): void {
  const known = registry.hasItem(registry.Type.FIELD, FIELD_CQ_PROC)
    ? registry.getClass(registry.Type.FIELD, FIELD_CQ_PROC, false)
    : null;
  if (known === (FieldCqProc as unknown)) return;
  if (known !== null) fieldRegistry.unregister(FIELD_CQ_PROC);
  fieldRegistry.register(FIELD_CQ_PROC, FieldCqProc);
}
