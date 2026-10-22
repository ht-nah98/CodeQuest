import type { LeanbotScreen } from '@codequest/content-schema';
import { LEANBOT_IMG } from '../../features/leanbot/leanbotCourse';
import { checkIdOf } from '../../features/leanbot/leanbotGate';
import { LeanbotCheck } from './LeanbotCheck';
import { LeanbotEyebrow } from './LeanbotEyebrow';
import { LeanbotLinkList } from './LeanbotLinkList';

// One screen of a Leanbot lesson. Every block the schema allows has exactly one shape here,
// so a lesson author cannot invent a layout and the pages stay consistent (ADR-0028).

/** Chip colours, matched to the tones the schema allows. */
const TONE: Record<string, string> = {
  go: 'border-go bg-go-soft',
  oops: 'border-oops bg-oops-soft',
  coin: 'border-coin bg-coin-soft',
  sky: 'border-sky bg-sky-soft',
};

const BOX = 'rounded-panel border-3 p-3 text-body';

export function LeanbotScreenView({
  screen,
  lessonId,
  index,
}: {
  screen: LeanbotScreen;
  lessonId: string;
  index: number;
}) {
  return (
    <>
      <LeanbotEyebrow text={screen.part} />
      <h2 className="m-0 font-display text-[28px] leading-tight">{screen.title}</h2>

      {screen.lines?.map((line) => (
        <p key={line} className="m-0 text-bubble">
          {line}
        </p>
      ))}

      {screen.images && (
        <div className="flex flex-wrap items-start justify-center gap-3">
          {screen.images.map((image) => {
            // Drawn pictures (tools/leanbot-art) are shot at 1.5x: show them at their real size,
            // so two only sit side by side when both still read at full size. They go in srcset
            // alone - with a src beside it, a 1x screen would pick the src as its 1x candidate.
            const drawn = image.src.includes('/');
            const url = LEANBOT_IMG + image.src;
            return (
              <figure key={image.src} className="m-0 flex max-w-full flex-col items-center gap-1">
                <img
                  src={drawn ? undefined : url}
                  srcSet={drawn ? `${url} 1.5x` : undefined}
                  alt={image.alt}
                  className={`h-auto max-w-full rounded-panel border-3 border-ink bg-paper ${drawn ? '' : 'w-full'}`}
                />
                {image.caption !== undefined && (
                  <figcaption className="text-center font-display text-lg">
                    {image.caption}
                  </figcaption>
                )}
              </figure>
            );
          })}
        </div>
      )}

      {screen.chips && (
        <div className="grid gap-3 sm:grid-cols-2">
          {screen.chips.map((chip) => (
            <div key={chip.label} className={`${BOX} ${TONE[chip.tone] ?? ''}`}>
              <span className="block font-display text-sm tracking-wide uppercase">
                {chip.label}
              </span>
              <span className="block text-bubble font-bold">{chip.body}</span>
            </div>
          ))}
        </div>
      )}

      {screen.table && (
        <div className="overflow-x-auto rounded-panel border-3 border-ink bg-paper">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                {screen.table.head.map((head) => (
                  <th
                    key={head}
                    className="border-b-3 border-ink bg-brand-soft px-3 py-2 font-display text-sm tracking-wide whitespace-nowrap uppercase"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {screen.table.rows.map((row) => (
                <tr key={row.join('|')}>
                  {row.map((cell, i) => (
                    <td
                      key={`${row.join('|')}-${String(i)}`}
                      className="border-b-2 border-ink/20 px-3 py-2 align-top first:font-bold"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {screen.steps && (
        <ol className="m-0 grid list-none gap-2 p-0">
          {screen.steps.map(([num, text]) => (
            <li
              key={num}
              className="flex items-start gap-3 rounded-panel border-3 border-ink bg-paper p-3"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-key bg-brand font-display text-paper">
                {num}
              </span>
              <span className="text-body">{text}</span>
            </li>
          ))}
        </ol>
      )}

      {screen.list && (
        <ul className="m-0 grid list-none gap-2 p-0">
          {screen.list.map((item) => (
            <li key={item} className="rounded-panel border-3 border-ink bg-paper p-3 text-body">
              {item}
            </li>
          ))}
        </ul>
      )}

      {screen.code !== undefined && (
        <pre className="m-0 overflow-x-auto rounded-panel border-3 border-ink bg-ink p-3 text-paper">
          <code>{screen.code}</code>
        </pre>
      )}

      {screen.links && <LeanbotLinkList links={screen.links} />}

      {screen.warn !== undefined && (
        <p className={`m-0 ${BOX} border-oops bg-oops-soft font-bold`}>⚠️ {screen.warn}</p>
      )}
      {screen.tip !== undefined && (
        <p className={`m-0 ${BOX} border-coin bg-coin-soft`}>💡 {screen.tip}</p>
      )}
      {screen.note !== undefined && (
        <p className={`m-0 ${BOX} border-ink bg-paper`}>{screen.note}</p>
      )}

      {screen.check !== undefined && (
        <LeanbotCheck id={`${lessonId}.${checkIdOf(screen, index)}`} label={screen.check} />
      )}
    </>
  );
}
