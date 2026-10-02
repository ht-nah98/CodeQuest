import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import type { WorkspaceJson } from '@codequest/content-schema';
import { authorWorkspaceJson } from '../../features/author/authorExport';
import { useAuthorFlags } from '../../features/author/authorMode';
import { useCoinBalance, useLevelProgress } from '../../features/progress';
import { vi } from '../../i18n/vi';
import { Button, Hud, PixelIcon, Stars } from '../../ui';
import { FOCUS_RING } from '../../ui/focusRing';

export interface PlayTopBarProps {
  profileId: string;
  levelId: string;
  levelTitle: string;
  /** "Làng Tre · Màn 3": the back button, to the world page. */
  where: string;
  worldId: string;
  /** False on creative levels, which have no stars (rewards-economy.md §1). */
  showStars?: boolean;
  /** Author mode: the program as it is now (blockly-integration.md §2 `getState`). */
  readProgram: () => WorkspaceJson | null;
}

/**
 * Top bar of the play screen (screens-and-flows.md §3, style board): back to the world, the
 * level, its best stars, the live coin wallet (where results coins fly to) and settings.
 */
export function PlayTopBar({
  profileId,
  levelId,
  levelTitle,
  where,
  worldId,
  showStars = true,
  readProgram,
}: PlayTopBarProps) {
  const navigate = useNavigate();
  const coins = useCoinBalance(profileId) ?? 0;
  const best = useLevelProgress(profileId, levelId)?.bestStars ?? 0;
  const { author } = useAuthorFlags();
  const [copied, setCopied] = useState<string | null>(null);

  const copy = () => {
    const json = readProgram();
    if (json === null) return;
    navigator.clipboard.writeText(JSON.stringify(authorWorkspaceJson(json), null, 2)).then(
      () => {
        setCopied(vi.author.copied);
      },
      () => {
        setCopied(vi.author.copyFailed);
      },
    );
  };

  return (
    <header className="flex min-w-0 items-center gap-4 rounded-panel border-3 border-ink bg-brand-deep px-2 text-paper shadow-hard">
      <Button
        size="sm"
        icon="←"
        onClick={() => void navigate(`/w/${worldId}`)}
        data-testid="play-back"
      >
        {where}
      </Button>
      <h1 className="m-0 min-w-0 flex-1 truncate font-display text-[26px] leading-tight text-paper">
        {levelTitle}
      </h1>
      {showStars && <Stars earned={best} scale={2} />}
      {author && (
        <span className="flex items-center gap-2" data-testid="author-tools">
          <span className="rounded-kbd bg-coin px-1.5 pt-0.5 font-pixel text-pixel-sm text-ink">
            {vi.author.label}
          </span>
          <Button size="sm" variant="coin" onClick={copy} data-testid="author-copy">
            {copied ?? vi.author.copyJson}
          </Button>
        </span>
      )}
      <div data-hud-coins="">
        <Hud coins={coins} />
      </div>
      <Link
        to="/settings"
        aria-label={vi.topBar.settings}
        title={vi.topBar.settings}
        className={`grid size-11 shrink-0 place-items-center rounded-key border-3 border-ink bg-paper shadow-key transition-transform duration-150 hover:-translate-y-px ${FOCUS_RING}`}
      >
        <PixelIcon name="gear" scale={2} />
      </Link>
    </header>
  );
}
