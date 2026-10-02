import { useRef } from 'react';
import type { HintTier } from '@codequest/rewards';
import type { TierView } from '../../features/hints';
import { vi } from '../../i18n/vi';
import { Bubble, Button, Panel, PixelIcon } from '../../ui';
import { useModalDialog } from './useModalDialog';

const t = vi.hints;

export interface HintBoxProps {
  /** From `useHints().tiers`: only the tiers this level offers, in order. */
  tiers: readonly TierView[];
  /** Coins, never below 0. */
  balance: number;
  /** A purchase is being written: every buy button waits. */
  busy?: boolean;
  /** The thinking hint, once tier 1 is opened; shown at the top of the box. */
  thinkingHint?: string | null;
  /** Voice line of the thinking hint: `levelVoiceId(level.id, 'thinking')`. */
  thinkingVoiceId?: string;
  /**
   * A line under the tiers: `error` = the purchase failed (storage), `solved` / `reset` = tier 2
   * had nothing to show, `missing` = not enough coins after all (`useHints().buy` returned that
   * status; no coins were taken).
   */
  notice?: 'error' | 'solved' | 'reset' | 'missing' | null;
  onBuy: (tier: HintTier) => void;
  onClose: () => void;
}

function TierButton({
  view,
  busy,
  onBuy,
}: {
  view: TierView;
  busy: boolean;
  onBuy: (tier: HintTier) => void;
}) {
  const name = t.tiers[view.tier].name;
  // aria-disabled, not disabled: the button keeps focus while a purchase is written.
  const inactive = busy || view.state === 'locked';
  const common = {
    size: 'sm' as const,
    'aria-disabled': inactive,
    'data-testid': `hint-buy-${String(view.tier)}`,
    'data-state': view.state,
    className:
      'min-w-[124px] justify-self-end aria-disabled:cursor-not-allowed aria-disabled:opacity-55',
    onClick: () => {
      if (!inactive) onBuy(view.tier);
    },
  };
  switch (view.state) {
    case 'owned':
      return (
        <Button {...common} aria-label={`${name}: ${t.owned}`}>
          {t.owned}
        </Button>
      );
    case 'free':
      return (
        <Button {...common} variant="go" aria-label={`${name}: ${t.free}`}>
          {t.free}
        </Button>
      );
    case 'buy':
      return (
        <Button
          {...common}
          variant="coin"
          icon={<PixelIcon name="coin" scale={1} />}
          aria-label={t.buyLabel(name, view.price)}
        >
          {t.price(view.price)}
        </Button>
      );
    case 'locked':
      return (
        <Button
          {...common}
          icon={<PixelIcon name="lock" scale={1} />}
          aria-label={t.buyLabel(name, view.price)}
        >
          {t.price(view.price)}
        </Button>
      );
  }
}

/**
 * The hint box overlay (screens-and-flows.md §2): the tiers with their price, the balance, the
 * safety-net note and "Cần thêm N xu" for a tier the child cannot afford. Controlled: buying,
 * opening the hint and closing are the caller's (see `useHints`).
 */
export function HintBox({
  tiers,
  balance,
  busy = false,
  thinkingHint = null,
  thinkingVoiceId,
  notice = null,
  onBuy,
  onClose,
}: HintBoxProps) {
  const ref = useRef<HTMLDivElement>(null);
  useModalDialog(ref, onClose);
  const tier1Free = tiers.some((view) => view.tier === 1 && view.state === 'free');

  return (
    <div ref={ref} className="fixed inset-0 z-40 grid place-items-center bg-ink/40 p-4">
      <Panel
        as="section"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hint-box-title"
        data-testid="hint-box"
        className="grid w-[min(560px,100%)] animate-pop gap-4 p-5"
      >
        <header className="flex items-center gap-3">
          <PixelIcon name="bulb" scale={2} />
          <h2 id="hint-box-title" className="m-0 text-title leading-tight">
            {t.title}
          </h2>
          <span
            data-testid="hint-balance"
            aria-label={vi.ui.coins(balance)}
            className="ml-auto flex items-center gap-2 font-pixel text-hud"
          >
            <PixelIcon name="coin" scale={2} />
            <span aria-hidden="true">{balance}</span>
          </span>
          <Button size="sm" onClick={onClose} aria-label={t.close}>
            ×
          </Button>
        </header>

        {thinkingHint !== null && (
          <div className="grid gap-1" data-testid="hint-thinking">
            <span className="font-pixel text-pixel-sm text-ink-soft uppercase">
              {t.thinkingLabel}
            </span>
            <Bubble
              text={thinkingHint}
              tail="none"
              live
              {...(thinkingVoiceId !== undefined && { voiceId: thinkingVoiceId })}
            />
          </div>
        )}

        {tier1Free && thinkingHint === null && (
          <p className="m-0 rounded-key bg-coin-shine px-3 py-2 font-bold">{t.freeNote}</p>
        )}

        <ol className="m-0 grid list-none gap-3 p-0">
          {tiers.map((view) => (
            <li
              key={view.tier}
              data-testid={`hint-tier-${String(view.tier)}`}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-key border-2 border-ink bg-white px-3 py-2"
            >
              <span
                aria-hidden="true"
                className="grid size-11 place-items-center rounded-kbd bg-hint font-pixel text-pixel"
              >
                {view.tier}
              </span>
              <div className="grid min-w-0">
                <span className="font-display text-button font-extrabold">
                  {t.tiers[view.tier].name}
                </span>
                <span className="text-small text-ink-soft">{t.tiers[view.tier].about}</span>
                {view.tier !== 1 && (
                  <span className="text-small font-bold text-brand-deep">
                    {t.starCap[view.tier]}
                  </span>
                )}
              </div>
              <TierButton view={view} busy={busy} onBuy={onBuy} />
              {view.state === 'locked' && (
                <p
                  data-testid={`hint-missing-${String(view.tier)}`}
                  className="col-span-3 m-0 text-small font-bold text-ink"
                >
                  {t.missing(view.missing)}. {t.missingTip}
                </p>
              )}
            </li>
          ))}
        </ol>

        {notice === 'error' && (
          <p role="alert" className="m-0 font-bold text-oops">
            {t.error}
          </p>
        )}
        {(notice === 'solved' || notice === 'reset' || notice === 'missing') && (
          <p role="status" data-testid="hint-notice" className="m-0 font-bold">
            {notice === 'solved' ? t.solved : notice === 'reset' ? t.reset : t.notEnough}
          </p>
        )}
      </Panel>
    </div>
  );
}
