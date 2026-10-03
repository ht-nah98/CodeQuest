import { type ReactNode, useState } from 'react';
import type { RuleIssue } from '@codequest/validator';
import { vi } from '../../../i18n/vi';
import { Panel } from '../../../ui';

const t = vi.editor;

export const INPUT_CLASS =
  'min-h-10 w-full rounded-key border-3 border-ink bg-white px-2.5 py-1 font-body text-body shadow-key outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-deep aria-[invalid=true]:border-oops';

/** Issues of one field, in oops red right under it. */
export function FieldIssues({
  issues,
  testId,
}: {
  issues: readonly RuleIssue[] | undefined;
  testId?: string;
}) {
  if (issues === undefined || issues.length === 0) return null;
  return (
    <ul className="m-0 grid list-none gap-0.5 p-0" data-testid={testId}>
      {issues.map((issue, index) => (
        <li key={index} className="text-small font-bold text-oops">
          ⚠ {t.rule(issue.rule)}: {issue.message}
        </li>
      ))}
    </ul>
  );
}

/** A titled panel section of the editor. */
export function Section({
  title,
  id,
  aside,
  children,
}: {
  title: string;
  id: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Panel as="section" aria-labelledby={id} className="grid gap-3 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={id} className="m-0 text-[22px]">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </Panel>
  );
}

/** A labelled input row with its issues. */
export function Field({
  label,
  note,
  issues,
  testId,
  children,
}: {
  label: string;
  note?: ReactNode;
  issues?: readonly RuleIssue[] | undefined;
  testId?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid content-start gap-1">
      <span className="flex flex-wrap items-baseline justify-between gap-x-2 font-display font-bold">
        {label}
        {note !== undefined && (
          <span className="font-pixel text-pixel-sm font-normal whitespace-nowrap text-ink-soft">
            {note}
          </span>
        )}
      </span>
      {children}
      <FieldIssues issues={issues} {...(testId !== undefined && { testId })} />
    </label>
  );
}

/** A whole number input; empty means "not set". */
export function NumberInput({
  value,
  onChange,
  min = 1,
  max,
  invalid,
  name,
}: {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  invalid?: boolean;
  name?: string;
}) {
  return (
    <input
      type="number"
      name={name}
      min={min}
      max={max}
      value={value ?? ''}
      aria-invalid={invalid}
      onChange={(event) => {
        const text = event.target.value;
        const number = Number(text);
        onChange(text === '' || !Number.isFinite(number) ? undefined : Math.round(number));
      }}
      className={INPUT_CLASS}
    />
  );
}

/**
 * A whole number applied on Enter or when the field loses focus, not on every keystroke
 * (typing "12" must not first resize the map to 1). Out-of-range values are clamped by the
 * caller; an empty or invalid text goes back to `value`.
 */
export function CommitNumberInput({
  value,
  onCommit,
  min,
  max,
  name,
}: {
  value: number;
  onCommit: (value: number) => void;
  min: number;
  max: number;
  name: string;
}) {
  const [text, setText] = useState(String(value));
  const [shown, setShown] = useState(value);
  // The value changed from outside (another draft, a clamp): show it.
  if (shown !== value) {
    setShown(value);
    setText(String(value));
  }
  const commit = () => {
    const number = Math.round(Number(text));
    if (text.trim() !== '' && Number.isFinite(number) && number !== value) onCommit(number);
    // Show the current value until the new one arrives (also when the caller clamps it back).
    setText(String(value));
  };
  return (
    <input
      type="number"
      name={name}
      min={min}
      max={max}
      value={text}
      onChange={(event) => {
        setText(event.target.value);
      }}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') commit();
      }}
      className={INPUT_CLASS}
    />
  );
}
