import { type ReactNode, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import type { World } from '@codequest/content-schema';
import { isUnlocked, localDay, type UnlockContext } from '@codequest/rewards';
import {
  averageBalance,
  type ChildData,
  childOverview,
  coinIssues,
  type CoinIssue,
  type Curriculum,
  levelDetails,
  levelStats,
  summaryCsv,
  weakConcepts,
  weeklyMinutes,
  worldCells,
} from '../../features/coach/metrics';
import { useCoachData, useManualUnlocks } from '../../features/coach/useCoachData';
import { type Catalog, useCatalog } from '../../features/content/catalog';
import { SANDBOX_WORLD_ID } from '../../features/content/sandbox';
import { vi } from '../../i18n/vi';
import { Avatar, Button, Panel } from '../../ui';
import { AdultGate } from './AdultGate';

const t = vi.coach;

const TH = 'border-b-3 border-ink px-2 py-1 text-left font-display text-small font-extrabold';
const TD = 'border-b border-ink/20 px-2 py-1 align-top text-small whitespace-nowrap';

/**
 * /coach: the coach corner (phase-2.md P2-05) on this laptop's data and on backup files opened
 * in memory. Dev builds only (App.tsx), behind the adult lock, until the coach sign-in of P2-16.
 */
export default function CoachScreen() {
  return (
    <AdultGate>
      <CoachCorner />
    </AdultGate>
  );
}

const minutesOf = (ms: number) => Math.round(ms / 60_000);
/** 'dd/mm' of an ISO time in Vietnam days. */
const shortDay = (iso: string | null) => {
  if (iso === null) return t.never;
  const day = localDay(new Date(iso));
  return `${day.slice(8, 10)}/${day.slice(5, 7)}`;
};
const percent = (x: number) => `${String(Math.round(x * 100))}%`;

function curriculumOf(catalog: Catalog): Curriculum {
  return {
    worlds: catalog.worlds.filter((w) => w.id !== SANDBOX_WORLD_ID),
    levels: catalog.levels,
  };
}

function download(text: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

function CoachCorner() {
  const state = useCatalog();
  const data = useCoachData();
  const [selected, setSelected] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Fixed for the page: "days away" and weeks do not need to tick while the coach reads.
  const [now] = useState(() => new Date());

  const curriculum = useMemo(
    () => (state.status === 'ready' ? curriculumOf(state.catalog) : null),
    [state],
  );

  const header = (
    <header className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-panel border-3 border-ink bg-brand-deep px-4 py-2 text-paper shadow-hard">
      <Link to="/" className="font-display font-bold text-paper">
        ← {t.back}
      </Link>
      <div className="grid">
        <span className="font-pixel text-pixel-sm">{t.eyebrow}</span>
        <h1 className="m-0 text-[28px]">{t.title}</h1>
      </div>
      <Link to="/coach/editor" className="ml-auto font-display font-bold text-paper underline">
        {t.editor}
      </Link>
    </header>
  );

  if (state.status === 'error') {
    return (
      <main className="grid gap-4 bg-ground p-4">
        {header}
        <p role="alert">{t.loadError}</p>
      </main>
    );
  }
  if (state.status !== 'ready' || curriculum === null || data.children === null) {
    return (
      <main className="grid gap-4 bg-ground p-4">
        {header}
        <p role="status">{t.loading}</p>
      </main>
    );
  }

  const { children } = data;
  const selectedChild = children.find((c) => c.profileId === selected) ?? null;

  return (
    <main
      className="grid min-h-screen content-start gap-4 bg-ground p-4"
      data-testid="coach-corner"
    >
      {header}

      <Panel as="section" aria-labelledby="coach-sources" className="grid gap-2 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="coach-sources" className="m-0 text-button">
            {t.sourcesTitle}
          </h2>
          <span className="rounded-key border-2 border-ink bg-white px-2 text-small font-bold">
            {t.local(data.local?.length ?? 0)}
          </span>
          {data.files.map((file) => (
            <span
              key={file.name}
              data-testid="coach-file"
              className="inline-flex items-center gap-1 rounded-key border-2 border-ink bg-coin px-2 text-small font-bold"
            >
              {file.name} ({file.children.length})
              <button
                type="button"
                aria-label={t.removeFile(file.name)}
                className="cursor-pointer px-1 font-extrabold"
                onClick={() => {
                  data.removeFile(file.name);
                }}
              >
                ×
              </button>
            </span>
          ))}
          <div className="ml-auto flex gap-2">
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".json,application/json"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              data-testid="coach-file-input"
              onChange={(event) => {
                const picked = [...(event.target.files ?? [])];
                event.target.value = '';
                void data.openFiles(picked);
              }}
            />
            <Button size="sm" onClick={() => inputRef.current?.click()}>
              {t.openFiles}
            </Button>
            <Button
              size="sm"
              variant="coin"
              disabled={children.length === 0}
              data-testid="coach-export-csv"
              onClick={() => {
                download(
                  summaryCsv(children, curriculum, now),
                  `codequest-hlv-${localDay(now)}.csv`,
                  'text/csv;charset=utf-8',
                );
              }}
            >
              {t.exportCsv}
            </Button>
          </div>
        </div>
        <p className="m-0 text-small text-ink-soft">{t.sourcesHelp}</p>
        <div role="alert" className="grid">
          {data.fileErrors.map((e) => (
            <p key={e.name} className="m-0 font-bold text-oops">
              {t.fileError(e.name, t.fileErrors[e.error])}
            </p>
          ))}
        </div>
      </Panel>

      <Panel as="section" aria-labelledby="coach-table" className="grid gap-2 p-4">
        <h2 id="coach-table" className="m-0 text-button">
          {t.tableTitle}
        </h2>
        {children.length === 0 ? (
          <p className="m-0">{t.noChildren}</p>
        ) : (
          <div className="overflow-x-auto">
            <ChildrenTable
              rows={children}
              curriculum={curriculum}
              now={now}
              selected={selected}
              onSelect={setSelected}
            />
          </div>
        )}
        <p className="m-0 text-small text-ink-soft">{t.detailPick}</p>
      </Panel>

      {selectedChild && (
        <ChildDetail
          key={selectedChild.profileId}
          child={selectedChild}
          catalog={state.catalog}
          curriculum={curriculum}
          localChild={data.local?.find((c) => c.profileId === selectedChild.profileId) ?? null}
          onClose={() => {
            setSelected(null);
          }}
        />
      )}

      {children.length > 0 && <GroupPanels rows={children} curriculum={curriculum} now={now} />}
    </main>
  );
}

function sourceText(child: ChildData): string {
  return child.sources.map((s) => (s.kind === 'local' ? t.sourceLocal : s.name)).join(' + ');
}

function ChildrenTable({
  rows,
  curriculum,
  now,
  selected,
  onSelect,
}: {
  rows: readonly ChildData[];
  curriculum: Curriculum;
  now: Date;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <table className="w-full border-collapse" data-testid="coach-table">
      <thead>
        <tr>
          <th className={TH}>{t.colChild}</th>
          {curriculum.worlds.map((w) => (
            <th key={w.id} className={TH} title={w.title}>
              {t.worldShort(w.order, w.title)}
            </th>
          ))}
          <th className={TH}>{t.colStars}</th>
          <th className={TH}>{t.colCoins}</th>
          <th className={TH}>{t.colTime}</th>
          <th className={TH}>{t.colLast}</th>
          <th className={TH}>{t.colStreak}</th>
          <th className={TH}>{t.colSource}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((child) => {
          const overview = childOverview(child, curriculum, now);
          const cells = worldCells(child, curriculum);
          return (
            <tr
              key={child.profileId}
              data-testid="coach-row"
              data-child={child.nickname}
              className={selected === child.profileId ? 'bg-coin/40' : ''}
            >
              <td className={TD}>
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-2 font-display font-extrabold underline"
                  aria-pressed={selected === child.profileId}
                  onClick={() => {
                    onSelect(child.profileId);
                  }}
                >
                  <Avatar id={child.avatarId} scale={2} />
                  {child.nickname}
                </button>
                {overview.away && (
                  <span className="ml-1 font-bold text-oops" title={t.awayTitle}>
                    ⚠
                  </span>
                )}
              </td>
              {cells.map((cell) => (
                <td key={cell.worldId} className={TD} data-testid={`cell-${cell.worldId}`}>
                  <span className="font-bold">{t.cell(cell.levelsDone, cell.levelsTotal)}</span>
                  <span className="block text-ink-soft">★ {cell.stars}</span>
                </td>
              ))}
              <td className={`${TD} font-bold`} data-testid="cell-stars">
                {overview.stars}
              </td>
              <td className={TD} data-testid="cell-coins">
                {overview.coins}
              </td>
              <td className={TD} data-testid="cell-time">
                {t.minutes(minutesOf(overview.timeMs))}
              </td>
              <td className={TD}>{shortDay(overview.lastActive)}</td>
              <td className={TD} data-testid="cell-streak">
                {t.days(overview.streak)}
              </td>
              <td className={TD}>{sourceText(child)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function ChildDetail({
  child,
  catalog,
  curriculum,
  localChild,
  onClose,
}: {
  child: ChildData;
  catalog: Catalog;
  curriculum: Curriculum;
  /** The same child's rows on this laptop only: unlocks are judged on what this laptop sees. */
  localChild: ChildData | null;
  onClose: () => void;
}) {
  const local = child.sources.some((s) => s.kind === 'local');
  const unlocks = useManualUnlocks(local ? child.profileId : null);
  const [worldId, setWorldId] = useState<string | null>(null);
  const world = curriculum.worlds.find((w) => w.id === worldId) ?? null;

  const natural: UnlockContext = useMemo(
    () => ({
      worlds: catalog.worldById,
      levels: catalog.levels,
      progress: new Map((localChild?.progress ?? []).map((p) => [p.levelId, p])),
      lessonsDone: new Set((localChild?.lessons ?? []).map((l) => l.lessonId)),
      bonusOwned: new Set(),
      overrides: new Set(),
    }),
    [catalog, localChild],
  );
  const cells = worldCells(child, curriculum);

  // `worldId`: the world of a level row. Opening a level inside a locked world opens the world
  // too, or the child could not reach the level from the map.
  const unlockCell = (
    target: { worldId: string } | { levelId: string },
    id: string,
    worldId?: string,
  ) => {
    if (unlocks.ids.has(id)) {
      return (
        <span className="inline-flex items-center gap-2">
          <span className="font-bold text-go-deep">{t.unlockedByCoach}</span>
          <Button
            size="sm"
            onClick={() => void unlocks.set(id, false)}
            data-testid={`relock-${id}`}
          >
            {t.relock}
          </Button>
        </span>
      );
    }
    if (isUnlocked(target, natural)) return <span className="text-ink-soft">✔</span>;
    if (!local) return <span className="text-ink-soft">{t.locked}</span>;
    return (
      <Button
        size="sm"
        variant="coin"
        onClick={() => {
          void (async () => {
            if (
              worldId !== undefined &&
              !unlocks.ids.has(worldId) &&
              !isUnlocked({ worldId }, natural)
            ) {
              await unlocks.set(worldId, true);
            }
            await unlocks.set(id, true);
          })();
        }}
        data-testid={`unlock-${id}`}
      >
        {t.unlock}
      </Button>
    );
  };

  return (
    <Panel
      as="section"
      aria-labelledby="coach-detail"
      className="grid gap-3 p-4"
      data-testid="coach-detail"
    >
      <div className="flex items-center gap-3">
        <Avatar id={child.avatarId} scale={3} />
        <h2 id="coach-detail" className="m-0 text-button">
          {t.detailTitle(child.nickname)}
        </h2>
        <span className="text-small text-ink-soft">{local ? t.unlockHelp : t.readOnly}</span>
        <Button size="sm" className="ml-auto" onClick={onClose}>
          {t.detailClose}
        </Button>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={TH}>{t.worldCol}</th>
            <th className={TH}>{t.levelCol}</th>
            <th className={TH}>{t.colStars}</th>
            <th className={TH}>{t.colLast}</th>
            <th className={TH}>{t.unlockCol}</th>
            <th className={TH} />
          </tr>
        </thead>
        <tbody>
          {curriculum.worlds.map((w, i) => {
            const cell = cells[i];
            return (
              <tr key={w.id} data-testid={`detail-world-${w.id}`}>
                <td className={TD}>{t.worldShort(w.order, w.title)}</td>
                <td className={TD}>{cell && t.cell(cell.levelsDone, cell.levelsTotal)}</td>
                <td className={TD}>{cell && `${String(cell.stars)}/${String(cell.maxStars)}`}</td>
                <td className={TD}>{shortDay(cell?.lastActive ?? null)}</td>
                <td className={TD}>{unlockCell({ worldId: w.id }, w.id)}</td>
                <td className={TD}>
                  <Button
                    size="sm"
                    aria-pressed={worldId === w.id}
                    onClick={() => {
                      setWorldId(worldId === w.id ? null : w.id);
                    }}
                  >
                    {t.showLevels}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {world && (
        <LevelTable
          child={child}
          world={world}
          catalog={catalog}
          curriculum={curriculum}
          unlockCell={unlockCell}
        />
      )}
    </Panel>
  );
}

function LevelTable({
  child,
  world,
  catalog,
  curriculum,
  unlockCell,
}: {
  child: ChildData;
  world: World;
  catalog: Catalog;
  curriculum: Curriculum;
  unlockCell: (target: { levelId: string }, id: string, worldId: string) => ReactNode;
}) {
  return (
    <table className="w-full border-collapse" data-testid="coach-levels">
      <thead>
        <tr>
          <th className={TH}>{t.levelCol}</th>
          <th className={TH}>{t.colStars}</th>
          <th className={TH}>{t.attemptsCol}</th>
          <th className={TH}>{t.runsCol}</th>
          <th className={TH}>{t.firstTryCol}</th>
          <th className={TH}>{t.hintsCol}</th>
          <th className={TH}>{t.colTime}</th>
          <th className={TH}>{t.reasonsCol}</th>
          <th className={TH}>{t.unlockCol}</th>
        </tr>
      </thead>
      <tbody>
        {levelDetails(child, world, curriculum).map((d) => (
          <tr key={d.levelId} data-testid={`detail-level-${d.levelId}`}>
            <td className={`${TD} whitespace-normal`}>
              <span className="font-bold">{d.levelId}</span>{' '}
              <span className="text-ink-soft">{catalog.levels.get(d.levelId)?.title}</span>
            </td>
            <td className={TD}>{d.done ? `★ ${String(d.stars)}` : t.no}</td>
            <td className={TD}>{d.sessions}</td>
            <td className={TD}>{d.runs}</td>
            <td className={TD}>{d.firstTryWin ? t.yes : t.no}</td>
            <td
              className={TD}
            >{`${String(d.hints[1])}/${String(d.hints[2])}/${String(d.hints[3])}`}</td>
            <td className={TD}>{t.minutes(minutesOf(d.timeMs))}</td>
            <td className={`${TD} whitespace-normal`}>
              {d.reasons
                .slice(0, 3)
                .map((r) => t.reasonCount(r.reason, r.count))
                .join(', ')}
            </td>
            <td className={TD}>{unlockCell({ levelId: d.levelId }, d.levelId, world.id)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function coinIssueText(issue: CoinIssue): string {
  switch (issue.kind) {
    case 'negative':
      return t.coinNegative(issue.balance);
    case 'high':
      return t.coinHigh(issue.balance);
    case 'over-cap':
      return t.coinOverCap(issue.reason, issue.delta);
    case 'replay-cap':
      return t.coinReplay(issue.day, issue.count);
  }
}

function GroupPanels({
  rows: children,
  curriculum,
  now,
}: {
  rows: readonly ChildData[];
  curriculum: Curriculum;
  now: Date;
}) {
  const concepts = weakConcepts(children, curriculum);
  const levels = levelStats(children, curriculum).slice(0, 8);
  const overviews = children.map((c) => childOverview(c, curriculum, now));
  const away = overviews.filter((o) => o.away);
  const average = averageBalance(children);
  const issues = children
    .map((c) => ({ child: c, issues: coinIssues(c.ledger) }))
    .filter((x) => x.issues.length > 0);
  const weeks = children.map((c) => ({ child: c, weeks: weeklyMinutes(c.attempts, now) }));

  return (
    <div className="grid grid-cols-2 gap-4">
      <Panel as="section" aria-labelledby="coach-concepts" className="grid content-start gap-2 p-4">
        <h2 id="coach-concepts" className="m-0 text-button">
          {t.conceptsTitle}
        </h2>
        <p className="m-0 text-small text-ink-soft">{t.conceptsHelp}</p>
        <ul className="m-0 grid list-none gap-1 p-0" data-testid="coach-concepts">
          {[...concepts]
            .sort((a, b) => b.failRate - a.failRate)
            .map((c) => (
              <li key={c.worldId} className="text-small">
                <span className="font-bold">
                  {c.worldId} · {c.concept}
                </span>
                {': '}
                {c.runs === 0 ? t.noRuns : t.failRate(c.failRate, c.runs)}
                {c.reasons.length > 0 && (
                  <span className="text-ink-soft">
                    {' — '}
                    {c.reasons
                      .slice(0, 2)
                      .map((r) => t.reasonCount(r.reason, r.count))
                      .join(', ')}
                  </span>
                )}
              </li>
            ))}
        </ul>
      </Panel>

      <Panel
        as="section"
        aria-labelledby="coach-levels-stuck"
        className="grid content-start gap-2 p-4"
      >
        <h2 id="coach-levels-stuck" className="m-0 text-button">
          {t.levelsTitle}
        </h2>
        <p className="m-0 text-small text-ink-soft">{t.levelsHelp}</p>
        {levels.length === 0 ? (
          <p className="m-0 text-small">{t.noLevels}</p>
        ) : (
          <ul className="m-0 grid list-none gap-1 p-0" data-testid="coach-stuck">
            {levels.map((l) => (
              <li key={l.levelId} className="text-small">
                <span className="font-bold">{l.levelId}</span>
                {l.flags.map((f) => (
                  <span
                    key={f}
                    className={`ml-1 rounded-key border-2 border-ink px-1 font-bold ${f === 'hard' ? 'bg-oops-soft' : 'bg-go'}`}
                  >
                    {f === 'hard' ? t.flagHard : t.flagEasy}
                  </span>
                ))}
                {' · '}
                {t.levelLine(l.sessions, l.children, l.tier3Share)}
                {' · '}
                {percent(l.failRate)}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel as="section" aria-labelledby="coach-weeks" className="grid content-start gap-2 p-4">
        <h2 id="coach-weeks" className="m-0 text-button">
          {t.weeksTitle}
        </h2>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={TH}>{t.colChild}</th>
              {weeks[0]?.weeks.map((w) => (
                <th key={w.week} className={TH}>
                  {t.weekOf(w.week)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map(({ child, weeks: list }) => (
              <tr key={child.profileId}>
                <td className={TD}>{child.nickname}</td>
                {list.map((w) => (
                  <td key={w.week} className={TD}>
                    {w.minutes}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel as="section" aria-labelledby="coach-away" className="grid content-start gap-2 p-4">
        <h2 id="coach-away" className="m-0 text-button">
          {t.awayTitle}
        </h2>
        {away.length === 0 ? (
          <p className="m-0 text-small">{t.noneAway}</p>
        ) : (
          <ul className="m-0 grid list-none gap-1 p-0" data-testid="coach-away-list">
            {away.map((o) => (
              <li key={o.profileId} className="text-small">
                <span className="font-bold">{o.nickname}</span>: {t.away(o.daysAway)}
              </li>
            ))}
          </ul>
        )}
        <h2 className="m-0 mt-2 text-button">{t.coinsTitle}</h2>
        {average && (
          <p className="m-0 text-small" data-testid="coach-average">
            {t.average(average.average)}
            {average.signal === 'high' && ` · ${t.averageHigh}`}
            {average.signal === 'low' && ` · ${t.averageLow}`}
          </p>
        )}
        {issues.length === 0 ? (
          <p className="m-0 text-small">{t.noCoinIssues}</p>
        ) : (
          <ul className="m-0 grid list-none gap-1 p-0" data-testid="coach-coin-issues">
            {issues.map(({ child, issues: list }) => (
              <li key={child.profileId} className="text-small">
                <span className="font-bold">{child.nickname}</span>:{' '}
                {list.slice(0, 3).map(coinIssueText).join('; ')}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
