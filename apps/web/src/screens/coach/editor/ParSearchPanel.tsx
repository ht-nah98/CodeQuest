import type { Level, WorkspaceJson } from '@codequest/content-schema';
import { formatProgram, type Program, programToWorkspace } from '@codequest/validator';
import {
  canSearchPar,
  type ParAdvice,
  parAdvice,
  searchKey,
} from '../../../features/editor/parSearch';
import type { ParSearchState } from '../../../features/editor/useParSearch';
import { vi } from '../../../i18n/vi';
import { Button } from '../../../ui';
import { Section } from './parts';

const t = vi.editor.par;

const TONE_CLASS: Record<ParAdvice['tone'], string> = {
  ok: 'text-go-deep',
  warn: 'text-coin-deep',
  error: 'text-oops',
};
const TONE_MARK: Record<ParAdvice['tone'], string> = { ok: '✔', warn: '⚠', error: '✖' };

function adviceText(advice: ParAdvice): string {
  const value = advice.value ?? 0;
  const texts = t.advice;
  switch (advice.kind) {
    case 'stopped':
    case 'unsupported':
    case 'mismatch':
    case 'fixStopped':
      return texts[advice.kind];
    default:
      return texts[advice.kind](value);
  }
}

/** "Tìm par nhỏ nhất": the exhaustive search of content-model.md §8 in a Web Worker. */
export function ParSearchPanel({
  draft,
  level,
  state,
  onStart,
  onCancel,
  onUseExample,
  onSet,
}: {
  draft: Level;
  /** The draft as a runnable level (validation `runnable`), or null. */
  level: Level | null;
  state: ParSearchState;
  onStart: (level: Level) => void;
  onCancel: () => void;
  onUseExample: (solution: WorkspaceJson) => void;
  onSet: (key: 'par' | 'parEdits', value: number) => void;
}) {
  const searchable = canSearchPar(draft);
  const running = state.status === 'running';
  const done = state.status === 'done' ? state : null;
  const stale = done !== null && level !== null && done.levelKey !== searchKey(level);
  const reply = done?.reply;

  return (
    <Section title={t.title} id="editor-par">
      <p className="m-0 text-small text-ink-soft">{t.help}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          variant="coin"
          disabled={!searchable || level === null || running}
          data-testid="par-search-start"
          onClick={() => {
            if (level !== null) onStart(level);
          }}
        >
          {t.start}
        </Button>
        {running && (
          <>
            <span role="status" className="font-pixel text-pixel" data-testid="par-search-running">
              {t.running}
            </span>
            <Button size="sm" data-testid="par-search-cancel" onClick={onCancel}>
              {t.cancel}
            </Button>
          </>
        )}
      </div>
      {!searchable && <p className="m-0 text-ink-soft">{t.onlyModes}</p>}
      {searchable && level === null && <p className="m-0 text-ink-soft">{t.needValid}</p>}
      {state.status === 'failed' && <p className="m-0 font-bold text-oops">{t.failed}</p>}
      {reply !== undefined && !reply.ok && (
        <p className="m-0 font-bold text-oops" data-testid="par-search-error">
          {t.error(reply.message)}
        </p>
      )}
      {reply?.ok === true && (
        <div className="grid gap-2" data-testid="par-search-result">
          {stale && <p className="m-0 font-bold text-coin-deep">{t.stale}</p>}
          <p
            className="m-0 font-bold"
            data-testid="par-search-min"
            data-min={reply.shortest.minBlocks ?? ''}
          >
            {reply.shortest.minBlocks === null
              ? t.noWinFound
              : t.min(
                  reply.shortest.minBlocks,
                  `${reply.shortest.complete ? '' : '≥'}${String(reply.shortest.count)}`,
                )}
          </p>
          {reply.fixes !== null && (
            <p
              className="m-0 font-bold"
              data-testid="par-search-fixes"
              data-min={reply.fixes.minEdits ?? ''}
            >
              {reply.fixes.minEdits === null
                ? t.noFixFound
                : t.fixes(
                    reply.fixes.minEdits,
                    `${reply.fixes.complete ? '' : '≥'}${String(reply.fixes.count)}`,
                  )}
            </p>
          )}
          <ul className="m-0 grid list-none gap-1 p-0">
            {parAdvice(draft, reply).map((advice, index) => (
              <li
                key={index}
                className={`font-bold ${TONE_CLASS[advice.tone]}`}
                data-advice={advice.kind}
              >
                {TONE_MARK[advice.tone]} {adviceText(advice)}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            {reply.shortest.minBlocks !== null && draft.par !== reply.shortest.minBlocks && (
              <Button
                size="sm"
                data-testid="par-search-set-par"
                onClick={() => {
                  if (reply.shortest.minBlocks !== null) onSet('par', reply.shortest.minBlocks);
                }}
              >
                {t.setPar(reply.shortest.minBlocks)}
              </Button>
            )}
            {reply.fixes?.minEdits != null && draft.parEdits !== reply.fixes.minEdits && (
              <Button
                size="sm"
                onClick={() => {
                  if (reply.fixes?.minEdits != null) onSet('parEdits', reply.fixes.minEdits);
                }}
              >
                {t.setParEdits(reply.fixes.minEdits)}
              </Button>
            )}
          </div>
          <Examples
            programs={[...reply.shortest.examples, ...(reply.fixes?.examples ?? [])]}
            onUse={onUseExample}
          />
          <p className="m-0 font-pixel text-pixel-sm text-ink-soft">
            {t.work(reply.shortest.work)}
          </p>
        </div>
      )}
    </Section>
  );
}

function Examples({
  programs,
  onUse,
}: {
  programs: readonly Program[];
  onUse: (solution: WorkspaceJson) => void;
}) {
  // The shortest program and a fix are often the same program: list each once.
  const unique = [
    ...new Map(programs.map((program) => [formatProgram(program), program])).values(),
  ];
  return (
    <ol className="m-0 grid list-none gap-1 p-0">
      {unique.slice(0, 4).map((program, index) => (
        <li key={index} className="flex flex-wrap items-center gap-2">
          <code className="rounded-key bg-paper-2 px-2 py-0.5 text-small">
            {t.example}: {formatProgram(program)}
          </code>
          <Button
            size="sm"
            data-testid="par-search-use-example"
            onClick={() => {
              onUse(programToWorkspace(program));
            }}
          >
            {t.useExample}
          </Button>
        </li>
      ))}
    </ol>
  );
}
