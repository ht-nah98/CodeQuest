import { type ReactNode, useState } from 'react';
import {
  type Condition,
  ConditionSchema,
  GOAL_SPRITES,
  type GoalSprite,
  type HintRule,
  type Level,
  type LevelMode,
  type LevelStage,
  LEVEL_STAGES,
  STAR_GOAL_KINDS,
  type StarGoalKind,
} from '@codequest/content-schema';
import type { RuleIssue } from '@codequest/validator';
import {
  blockLabel,
  type EditorField,
  modeUses,
  setMaxInstances,
  toggleToolbox,
  toolboxChoices,
  toolboxTypes,
} from '../../../features/editor/draft';
import { vi } from '../../../i18n/vi';
import { Button, countWords } from '../../../ui';
import { Field, FieldIssues, INPUT_CLASS, NumberInput, Section } from './parts';

const t = vi.editor;

const MODES: readonly LevelMode[] = ['build', 'parsons', 'predict', 'bughunt', 'creative'];
/** content-model.md §5 rule 5. */
const MAX_TITLE_WORDS = 5;
const MAX_TEXT_WORDS = 12;

type Issues = ReadonlyMap<EditorField, readonly RuleIssue[]>;

export interface LevelFormProps {
  level: Level;
  issues: Issues;
  worldIds: readonly string[];
  idTaken: boolean;
  solutionBlocks: number | null;
  answerKey: string | null;
  onChange: (level: Level) => void;
  onMode: (mode: LevelMode) => void;
  /** Shown right after "Thông tin màn" (the map editor). */
  children?: ReactNode;
}

/** "Thông tin màn": ids, texts, numbers of the mode, toolbox, predict cards and hints. */
export function LevelForm(props: LevelFormProps) {
  const { level, issues, worldIds, idTaken, solutionBlocks, onChange, onMode } = props;
  const set = <K extends keyof Level>(key: K, value: Level[K]) => {
    // An emptied number or text drops the key, so the level never holds `undefined`.
    const next = Object.fromEntries(
      Object.entries({ ...level, [key]: value }).filter(([, v]) => v !== undefined),
    );
    onChange(next as unknown as Level);
  };
  const text = (
    key:
      'id' | 'title' | 'objective' | 'learningGoal' | 'misconception' | 'thinkingHint' | 'mission',
  ) => (
    <input
      name={key}
      value={level[key] ?? ''}
      aria-invalid={issues.has(key)}
      autoComplete="off"
      spellCheck={false}
      onChange={(event) => {
        set(key, event.target.value);
      }}
      className={INPUT_CLASS}
    />
  );
  const words = (value: string | undefined, max: number) => t.words(countWords(value ?? ''), max);
  const goalKinds = new Set<StarGoalKind>(level.starGoals?.map((goal) => goal.kind));

  return (
    <>
      <Section title={t.info} id="editor-info">
        <div className="grid grid-cols-2 gap-3">
          <Field
            label={t.fields.id}
            issues={issues.get('id')}
            {...(idTaken && { note: t.idTaken })}
          >
            {text('id')}
          </Field>
          <Field label={t.fields.worldId} issues={issues.get('worldId')}>
            <select
              name="worldId"
              value={level.worldId}
              onChange={(event) => {
                set('worldId', event.target.value);
              }}
              className={INPUT_CLASS}
            >
              {[...new Set([...worldIds, level.worldId])].map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.fields.kind}>
            <input
              value={t.kinds[level.kind === 'maze' ? 'maze' : 'runner']}
              readOnly
              className={`${INPUT_CLASS} bg-paper-2`}
            />
          </Field>
          <Field label={t.fields.stage} issues={issues.get('stage')}>
            <select
              name="stage"
              value={level.stage}
              onChange={(event) => {
                set('stage', event.target.value as LevelStage);
              }}
              className={INPUT_CLASS}
            >
              {LEVEL_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {t.stages[stage]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.fields.mode} issues={issues.get('mode')}>
            <select
              name="mode"
              value={level.mode}
              onChange={(event) => {
                onMode(event.target.value as LevelMode);
              }}
              className={INPUT_CLASS}
            >
              {MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {t.modes[mode]}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={t.fields.title}
            note={words(level.title, MAX_TITLE_WORDS)}
            issues={issues.get('title')}
          >
            {text('title')}
          </Field>
        </div>
        <Field
          label={t.fields.objective}
          note={words(level.objective, MAX_TEXT_WORDS)}
          issues={issues.get('objective')}
          testId="issues-objective"
        >
          {text('objective')}
        </Field>
        <Field label={t.fields.learningGoal} issues={issues.get('learningGoal')}>
          {text('learningGoal')}
        </Field>
        {/* Story line and goal picture (P2-11c): decoration only, never the rules. */}
        <div className="grid grid-cols-[2fr_1fr] gap-3">
          <Field
            label={t.fields.mission}
            note={words(level.mission, MAX_TEXT_WORDS)}
            issues={issues.get('mission')}
          >
            {text('mission')}
          </Field>
          <Field label={t.fields.goalSprite} issues={issues.get('goalSprite')}>
            <select
              name="goalSprite"
              value={level.goalSprite ?? ''}
              onChange={(event) => {
                const value = event.target.value;
                set('goalSprite', value === '' ? undefined : (value as GoalSprite));
              }}
              className={INPUT_CLASS}
            >
              <option value="">{t.goalSprites.none}</option>
              {GOAL_SPRITES.map((sprite) => (
                <option key={sprite} value={sprite}>
                  {t.goalSprites[sprite]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t.fields.misconception} issues={issues.get('misconception')}>
            {text('misconception')}
          </Field>
          <Field label={t.fields.thinkingHint} issues={issues.get('thinkingHint')}>
            {text('thinkingHint')}
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {modeUses(level.mode, 'par') && (
            <Field
              label={t.fields.par}
              issues={issues.get('par')}
              testId="issues-par"
              {...(solutionBlocks !== null && { note: t.solutionBlocks(solutionBlocks) })}
            >
              <NumberInput
                name="par"
                value={level.par}
                invalid={issues.has('par')}
                onChange={(value) => {
                  set('par', value);
                }}
              />
            </Field>
          )}
          <Field label={t.fields.maxBlocks} issues={issues.get('maxBlocks')}>
            <NumberInput
              name="maxBlocks"
              value={level.maxBlocks}
              invalid={issues.has('maxBlocks')}
              onChange={(value) => {
                set('maxBlocks', value);
              }}
            />
          </Field>
          <Field
            label={t.fields.maxLoopDepth}
            issues={issues.get('maxLoopDepth')}
            testId="issues-maxLoopDepth"
          >
            <NumberInput
              name="maxLoopDepth"
              value={level.maxLoopDepth}
              invalid={issues.has('maxLoopDepth')}
              onChange={(value) => {
                set('maxLoopDepth', value);
              }}
            />
          </Field>
          {modeUses(level.mode, 'parEdits') && (
            <Field label={t.fields.parEdits} issues={issues.get('parEdits')}>
              <NumberInput
                name="parEdits"
                value={level.parEdits}
                invalid={issues.has('parEdits')}
                onChange={(value) => {
                  set('parEdits', value);
                }}
              />
            </Field>
          )}
        </div>
        {modeUses(level.mode, 'starGoals') && (
          <fieldset className="m-0 grid gap-1 border-0 p-0">
            <legend className="flex w-full flex-wrap items-baseline justify-between gap-x-2 p-0 font-display font-bold">
              {t.fields.starGoals}
              <span className="font-pixel text-pixel-sm font-normal text-ink-soft">
                {t.starGoalsHelp}
              </span>
            </legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {STAR_GOAL_KINDS.map((kind) => (
                <label key={kind} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name={`starGoal-${kind}`}
                    checked={goalKinds.has(kind)}
                    onChange={(event) => {
                      set('starGoals', toggleStarGoal(level.starGoals, kind, event.target.checked));
                    }}
                    className="size-5 accent-brand-deep"
                  />
                  <span className="font-display font-bold">{t.starGoalKinds[kind]}</span>
                  <span className="font-mono text-small text-ink-soft">{kind}</span>
                </label>
              ))}
            </div>
            <FieldIssues issues={issues.get('starGoals')} testId="issues-starGoals" />
          </fieldset>
        )}
        <FieldIssues issues={issues.get('other')} testId="issues-other" />
      </Section>

      {props.children}
      <ToolboxPicker
        level={level}
        issues={[...(issues.get('toolbox') ?? []), ...(issues.get('maxInstances') ?? [])]}
        onChange={onChange}
      />
      {level.mode === 'predict' && (
        <PredictCards
          level={level}
          issues={issues.get('predict')}
          answerKey={props.answerKey}
          onChange={onChange}
        />
      )}
      <HintList level={level} issues={issues.get('hints')} onChange={onChange} />
    </>
  );
}

/** The goals with `kind` ticked or not, in STAR_GOAL_KINDS order; none ticked = no field. */
function toggleStarGoal(
  goals: Level['starGoals'],
  kind: StarGoalKind,
  on: boolean,
): Level['starGoals'] {
  const kinds = new Set((goals ?? []).map((goal) => goal.kind));
  if (on) kinds.add(kind);
  else kinds.delete(kind);
  const next = STAR_GOAL_KINDS.filter((k) => kinds.has(k)).map((k) => ({ kind: k }));
  return next.length > 0 ? next : undefined;
}

function ToolboxPicker({
  level,
  issues,
  onChange,
}: {
  level: Level;
  issues: readonly RuleIssue[] | undefined;
  onChange: (level: Level) => void;
}) {
  const ticked = new Set(toolboxTypes(level));
  const fixed = new Map(
    level.toolbox.flatMap((entry) =>
      typeof entry === 'string' || entry.fields === undefined
        ? []
        : [
            [
              entry.type,
              Object.entries(entry.fields)
                .map(([k, v]) => `${k}=${String(v)}`)
                .join(' '),
            ],
          ],
    ),
  );
  return (
    <Section title={t.toolbox} id="editor-toolbox">
      <p className="m-0 text-small text-ink-soft">{t.toolboxHelp}</p>
      <div className="flex flex-wrap gap-x-5 gap-y-2" data-testid="editor-toolbox">
        {toolboxChoices(level.kind).map((type) => (
          <div key={type} className="flex items-center gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name={`toolbox-${type}`}
                checked={ticked.has(type)}
                onChange={(event) => {
                  onChange(toggleToolbox(level, type, event.target.checked));
                }}
                className="size-5 accent-brand-deep"
              />
              <span className="font-display font-bold">{blockLabel(type, level.kind)}</span>
              <span className="font-mono text-small text-ink-soft">{type}</span>
              {fixed.has(type) && (
                <span className="text-ink-soft">({t.fixedFields(fixed.get(type) ?? '')})</span>
              )}
            </label>
            {/* maxInstances (P2-11): how many of this block the child may use; empty = any. */}
            {ticked.has(type) && (
              <label className="flex items-center gap-1 text-small text-ink-soft">
                {t.maxInstances}
                <span className="sr-only">{t.maxInstancesLabel(type)}</span>
                <span className="w-16">
                  <NumberInput
                    name={`maxInstances-${type}`}
                    value={level.maxInstances?.[type]}
                    onChange={(value) => {
                      onChange(setMaxInstances(level, type, value));
                    }}
                  />
                </span>
              </label>
            )}
          </div>
        ))}
      </div>
      <FieldIssues issues={issues} testId="issues-toolbox" />
    </Section>
  );
}

function PredictCards({
  level,
  issues,
  answerKey,
  onChange,
}: {
  level: Level;
  issues: readonly RuleIssue[] | undefined;
  answerKey: string | null;
  onChange: (level: Level) => void;
}) {
  const options = level.predict?.options ?? [];
  const setOptions = (next: typeof options) => {
    onChange({ ...level, predict: { options: next } });
  };
  return (
    <Section title={t.predict} id="editor-predict">
      <p className="m-0 font-mono text-small" data-testid="editor-answer-key">
        {answerKey === null ? t.noAnswerKey : t.answerKey(answerKey)}
      </p>
      {options.map((option, index) => (
        <div key={index} className="grid grid-cols-[1fr_1.4fr_auto] items-end gap-2">
          <Field label={t.predictKey(index + 1)}>
            <input
              name={`predict-key-${String(index)}`}
              value={option.key}
              spellCheck={false}
              onChange={(event) => {
                setOptions(
                  options.map((o, i) => (i === index ? { ...o, key: event.target.value } : o)),
                );
              }}
              className={`${INPUT_CLASS} font-mono`}
            />
          </Field>
          <Field label={t.predictLabel(index + 1)}>
            <input
              name={`predict-label-${String(index)}`}
              value={option.label}
              onChange={(event) => {
                setOptions(
                  options.map((o, i) => (i === index ? { ...o, label: event.target.value } : o)),
                );
              }}
              className={INPUT_CLASS}
            />
          </Field>
          <Button
            size="sm"
            disabled={answerKey === null}
            onClick={() => {
              if (answerKey !== null) {
                setOptions(options.map((o, i) => (i === index ? { ...o, key: answerKey } : o)));
              }
            }}
          >
            {t.useKey}
          </Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={options.length >= 4}
          onClick={() => {
            setOptions([...options, { key: '', label: '' }]);
          }}
        >
          {t.addCard}
        </Button>
        <Button
          size="sm"
          disabled={options.length <= 3}
          onClick={() => {
            setOptions(options.slice(0, -1));
          }}
        >
          {t.removeCard}
        </Button>
      </div>
      <FieldIssues issues={issues} testId="issues-predict" />
    </Section>
  );
}

const NEW_HINT_WHEN: Condition = { trigger: 'enter' };

function HintList({
  level,
  issues,
  onChange,
}: {
  level: Level;
  issues: readonly RuleIssue[] | undefined;
  onChange: (level: Level) => void;
}) {
  const setHint = (index: number, hint: HintRule | null) => {
    const hints =
      hint === null
        ? level.hints.filter((_, i) => i !== index)
        : level.hints.map((old, i) => (i === index ? hint : old));
    onChange({ ...level, hints });
  };
  return (
    <Section
      title={t.hints}
      id="editor-hints"
      aside={
        <Button
          size="sm"
          onClick={() => {
            const id = `goi-y-${String(level.hints.length + 1)}`;
            onChange({ ...level, hints: [...level.hints, { id, when: NEW_HINT_WHEN, say: '' }] });
          }}
        >
          {t.addHint}
        </Button>
      }
    >
      {level.hints.map((hint, index) => (
        <HintRow
          key={index}
          hint={hint}
          onChange={(next) => {
            setHint(index, next);
          }}
        />
      ))}
      <FieldIssues issues={issues} testId="issues-hints" />
    </Section>
  );
}

function HintRow({
  hint,
  onChange,
}: {
  hint: HintRule;
  onChange: (hint: HintRule | null) => void;
}) {
  // The condition is edited as JSON text; it is applied only when it parses.
  const source = JSON.stringify(hint.when);
  const [when, setWhen] = useState(source);
  const [whenBad, setWhenBad] = useState(false);
  /** The condition the text stands for; another one arriving (a hint above was removed,
   * another level opened) replaces the text. Our own valid edits update it first. */
  const [shown, setShown] = useState(source);
  if (shown !== source) {
    setShown(source);
    setWhen(source);
    setWhenBad(false);
  }
  const set = (patch: Partial<HintRule>) => {
    const next: HintRule = { ...hint, ...patch };
    if (next.point === undefined) delete next.point;
    onChange(next);
  };
  return (
    <div className="grid gap-2 rounded-key border-2 border-ink/30 p-2">
      <div className="grid grid-cols-[1fr_2fr_auto] items-end gap-2">
        <Field label={t.hintId}>
          <input
            value={hint.id}
            spellCheck={false}
            onChange={(event) => {
              set({ id: event.target.value });
            }}
            className={`${INPUT_CLASS} font-mono`}
          />
        </Field>
        <Field label={t.hintWhen} {...(whenBad && { note: t.hintWhenBad })}>
          <input
            value={when}
            spellCheck={false}
            aria-invalid={whenBad}
            onChange={(event) => {
              setWhen(event.target.value);
              let parsed: unknown;
              try {
                parsed = JSON.parse(event.target.value);
              } catch {
                parsed = undefined;
              }
              const condition = ConditionSchema.safeParse(parsed);
              setWhenBad(!condition.success);
              if (condition.success) {
                setShown(JSON.stringify(condition.data));
                set({ when: condition.data });
              }
            }}
            className={`${INPUT_CLASS} font-mono`}
          />
        </Field>
        <Button
          size="sm"
          onClick={() => {
            onChange(null);
          }}
        >
          {t.removeHint}
        </Button>
      </div>
      <div className="grid grid-cols-[2fr_1fr] gap-2">
        <Field label={t.hintSay} note={t.words(countWords(hint.say), MAX_TEXT_WORDS)}>
          <input
            value={hint.say}
            onChange={(event) => {
              set({ say: event.target.value });
            }}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label={t.hintPoint}>
          <input
            value={hint.point ?? ''}
            spellCheck={false}
            onChange={(event) => {
              const value = event.target.value.trim();
              set({ point: value === '' ? undefined : (value as HintRule['point']) });
            }}
            className={`${INPUT_CLASS} font-mono`}
          />
        </Field>
      </div>
    </div>
  );
}
