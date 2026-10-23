import { useMemo, useRef, useState } from 'react';
import type { LbwBuildScreen } from '@codequest/content-schema';
import {
  type ArduinoProgram,
  checkProgram,
  type ProgramCheck,
  programCode,
} from '@codequest/games';
import { LEANBOT_IMG } from '../../features/leanbot/leanbotCourse';
import { CodeLines, selectLine, useLeanbotWorkspace } from '../../features/workshop/LeanbotEditor';
import { lessonToolbox, setupWorkshopBlocks } from '../../features/workshop/workshopToolbox';
import { vi } from '../../i18n/vi';
import { Button, Panel } from '../../ui';

const t = vi.leanbotWorld;

/** A Thế giới Leanbot screen where the child builds a program: task, blocks, live code, check. */
export function BuildStep({
  screen,
  done,
  onDone,
}: {
  screen: LbwBuildScreen;
  done: boolean;
  onDone: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [program, setProgram] = useState<ArduinoProgram>({ code: '', lineOf: new Map() });
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<ProgramCheck | null>(null);
  const solutions = useMemo(() => {
    setupWorkshopBlocks();
    return [screen.solution, ...(screen.accept ?? [])].map(programCode);
  }, [screen]);
  const workspaceRef = useLeanbotWorkspace(host, {
    toolbox: lessonToolbox(screen.toolbox, screen.newBlocks),
    start: screen.start,
    onProgram: (next) => {
      setProgram(next);
      setResult(null);
    },
    onSelect: setSelected,
  });

  const empty = program.lineOf.size === 0;
  const check = () => {
    const outcome = checkProgram(program.code, solutions, screen.hints);
    setResult(outcome);
    if (outcome.ok) onDone();
  };
  const message = (() => {
    if (result === null) return null;
    if (result.ok) return screen.done ?? t.right;
    if (empty) return t.empty;
    if (result.say !== null) return result.say;
    const line = result.line === null ? null : result.line + 1;
    if (line === null) return t.missing;
    if (result.problem === 'missing') return t.missingBefore(line);
    if (result.problem === 'extra') return t.extraLine(line);
    return t.wrongLine(line);
  })();
  const problems = new Set(result && !result.ok && result.line !== null ? [result.line] : []);

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)_minmax(0,340px)] gap-3">
      <Panel className="flex min-h-0 flex-col gap-3 overflow-auto p-4" raised={false}>
        <span className="self-start rounded-key border-3 border-ink bg-coin px-2 font-display text-sm">
          {t.modes[screen.mode]}
        </span>
        <h2 className="m-0 font-display text-[24px] leading-tight" data-testid="lbw-task">
          {screen.task}
        </h2>
        {screen.help?.map((line) => (
          <p key={line} className="m-0 text-body">
            {line}
          </p>
        ))}
        {screen.image && (
          <img
            src={LEANBOT_IMG + screen.image.src}
            alt={screen.image.alt}
            className="h-auto w-full rounded-panel border-3 border-ink bg-paper"
          />
        )}
        {screen.mode === 'code' && (
          <div className="flex min-h-40 flex-col gap-1">
            <h3 className="m-0 font-display text-lg">{t.targetCode}</h3>
            <CodeLines code={solutions[0] ?? ''} testId="lbw-target" />
          </div>
        )}
        <span className="flex-1" />
        {message !== null && (
          <p
            role="status"
            data-testid="lbw-result"
            data-ok={result?.ok ? '' : undefined}
            className={`m-0 rounded-key border-3 p-2 font-bold ${result?.ok ? 'border-go bg-go-soft' : 'border-oops bg-oops-soft'}`}
          >
            {result?.ok ? '🎉 ' : '⚠️ '}
            {message}
          </p>
        )}
        {done && result === null && <p className="m-0 font-bold text-go-deep">✓ {t.right}</p>}
        <Button variant="go" onClick={check} data-testid="lbw-check">
          {t.check}
        </Button>
      </Panel>

      <Panel className="relative min-h-0 overflow-hidden" raised={false}>
        <div ref={host} className="absolute inset-0" data-testid="lbw-blocks" />
      </Panel>

      <Panel className="flex min-h-0 flex-col gap-2 p-3" raised={false}>
        <h3 className="m-0 font-display text-[20px]">{t.yourCode}</h3>
        <CodeLines
          code={program.code}
          highlighted={selected !== null ? program.lineOf.get(selected) : undefined}
          problems={problems}
          onLineClick={(line) => {
            selectLine(workspaceRef.current, program.lineOf, line);
          }}
          testId="lbw-code"
        />
      </Panel>
    </div>
  );
}
