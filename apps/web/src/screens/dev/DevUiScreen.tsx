import { useEffect, useState, type ReactNode } from 'react';
// Single frame from the cleaned sheet until P0-06 ships public/sprites/panda.{png,json}.
import mangTalk from '../../../../../assets/sprites/panda/talk.png';
import { vi } from '../../i18n/vi';
import { Bubble, Button, CapacityBricks, Hud, Panel, PixelIcon, Stars } from '../../ui';
import type { PixelIconName, PixelIconScale } from '../../ui';

const t = vi.devUi;

const SWATCHES = ['ink', 'paper', 'brand', 'go', 'coin', 'hint', 'sky', 'oops'] as const;
const BLOCK_PILLS = ['move', 'loop', 'if', 'sensor', 'robot', 'var', 'fn', 'pen'] as const;
const ICONS: readonly PixelIconName[] = [
  'coin',
  'star',
  'star-empty',
  'flame',
  'speaker',
  'play',
  'bulb',
  'lock',
];
const ICON_SCALES: readonly PixelIconScale[] = [1, 2, 3];
const CAPACITY_MAX = 5;

// Tokens are read back from the live stylesheet, so this page shows what Tailwind actually emitted.
// The global CSS is imported in main.tsx before the first render, so the value is ready on mount.
function useTokenValue(name: string): string {
  const [value] = useState(() =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
  );
  return value;
}

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r = 0, g = 0, b = 0] = channels.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast of white text on the given colour. */
function contrastOnWhiteText(hex: string): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return '…';
  return (1.05 / (relativeLuminance(hex) + 0.05)).toFixed(1);
}

function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`font-pixel text-pixel tracking-[0.04em] text-brand-deep ${className}`}>
      {children}
    </div>
  );
}

function Sheet({
  id,
  eyebrow,
  title,
  intro,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <Panel as="section" aria-labelledby={id} className="grid gap-5 p-8">
      <div className="grid gap-1.5">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 id={id} className="m-0 text-title">
          {title}
        </h2>
        {intro !== undefined && <p className="m-0 max-w-[66ch] text-ink-soft">{intro}</p>}
      </div>
      {children}
    </Panel>
  );
}

function Demo({
  label,
  wide = false,
  children,
}: {
  label: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`grid min-w-0 content-start gap-3 rounded-button border-2 border-dashed border-brand p-4 ${wide ? 'col-span-2' : ''}`}
    >
      <span className="font-pixel text-pixel-sm text-brand-deep">{label}</span>
      {children}
    </div>
  );
}

function Swatch({ token, name, use }: { token: string; name: string; use: string }) {
  const value = useTokenValue(`--color-${token}`);
  return (
    <div className="min-w-0 overflow-hidden rounded-chip border-3 border-ink bg-white">
      <i
        className="block h-16 border-b-3 border-ink"
        style={{ backgroundColor: `var(--color-${token})` }}
      />
      <div className="grid px-2.5 py-2">
        <b className="text-small">{name}</b>
        <code className="font-pixel text-pixel-sm text-ink-soft uppercase">{value}</code>
        <span className="text-[13px] text-ink-soft">{use}</span>
      </div>
    </div>
  );
}

function BlockPill({ token, label }: { token: string; label: string }) {
  const value = useTokenValue(`--color-block-${token}`);
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        className="min-w-0 flex-1 rounded-full border-2 border-ink/35 px-3.5 py-2 font-display text-[17px] font-bold text-white"
        style={{ backgroundColor: `var(--color-block-${token})` }}
      >
        {label}
      </span>
      <span className="w-16 text-right font-pixel text-pixel-sm">{contrastOnWhiteText(value)}</span>
    </div>
  );
}

/** /dev/ui: every design-system component on one page, laid out like design/style-board. */
export default function DevUiScreen() {
  const [used, setUsed] = useState(2);
  const [speaking, setSpeaking] = useState(false);

  // A showcase of the pressed state only; real lines pass `voiceId` and play through src/audio.
  useEffect(() => {
    if (!speaking) return;
    const timer = window.setTimeout(() => {
      setSpeaking(false);
    }, 1500);
    return () => {
      window.clearTimeout(timer);
    };
  }, [speaking]);

  return (
    <main className="mx-auto grid max-w-[1120px] gap-7 px-5 pt-7 pb-16">
      {/* ---------- Hero ---------- */}
      <Panel as="header" tone="brand" className="grid overflow-hidden">
        <div className="grid gap-3.5 px-10 pt-10">
          <Eyebrow className="text-paper">{t.eyebrow}</Eyebrow>
          <h1 className="m-0 text-[112px] leading-[0.9] tracking-[-0.01em] text-paper [text-shadow:3px_0_var(--color-ink),-3px_0_var(--color-ink),0_3px_var(--color-ink),0_-3px_var(--color-ink),3px_3px_var(--color-ink),-3px_3px_var(--color-ink),3px_-3px_var(--color-ink),-3px_-3px_var(--color-ink),0_9px_0_var(--color-ink)]">
            {t.wordmarkStart}
            <span className="text-coin">{t.wordmarkEnd}</span>
          </h1>
          <p className="m-0 max-w-[66ch] text-[19px] text-paper">{t.intro}</p>
        </div>
        <div className="relative mt-2 h-[210px]">
          <Bubble text={t.greeting} tail="bottom" className="absolute top-3 left-5" />
          <img
            src={mangTalk}
            alt={t.mangTalking}
            width={120}
            height={120}
            className="absolute bottom-[38px] left-6 size-[120px]"
          />
          {/* Grass strip + dirt, drawn with token colours until the tileset lands. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-11 border-t-3 border-ink bg-go"
          >
            <div className="absolute inset-x-0 top-2 bottom-0 bg-block-robot" />
          </div>
        </div>
      </Panel>

      {/* ---------- Components ---------- */}
      <Sheet id="comp-h" eyebrow={t.compEyebrow} title={t.compTitle} intro={t.compIntro}>
        <div className="grid grid-cols-3 gap-[18px]">
          <Demo label={t.labelButtons} wide>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="go" icon={<PixelIcon name="play" scale={1} />} shortcut="Space">
                {t.run}
              </Button>
              <Button variant="hint" icon={<PixelIcon name="bulb" scale={1} />}>
                {t.hint}
              </Button>
              <Button variant="coin" icon={<PixelIcon name="coin" scale={1} />}>
                {t.shop}
              </Button>
              <Button icon="↺" shortcut="R">
                {t.reset}
              </Button>
              <Button disabled icon={<PixelIcon name="lock" scale={1} />}>
                {t.locked}
              </Button>
            </div>
          </Demo>
          <Demo label={t.labelHud}>
            <Hud coins={120} stars={38} streakDays={5} />
            <CapacityBricks max={CAPACITY_MAX} used={used} />
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setUsed((u) => Math.min(CAPACITY_MAX, u + 1));
                }}
                disabled={used >= CAPACITY_MAX}
              >
                {t.addBlock}
              </Button>
              <Button
                onClick={() => {
                  setUsed((u) => Math.max(0, u - 1));
                }}
                disabled={used <= 0}
              >
                {t.removeBlock}
              </Button>
            </div>
          </Demo>
          <Demo label={t.labelBubble} wide>
            <div className="flex items-end gap-2.5">
              <img
                src={mangTalk}
                alt={t.mangTalking}
                width={84}
                height={84}
                className="size-[84px] shrink-0"
              />
              <Bubble
                text={t.bubbleHint}
                onSpeak={() => {
                  setSpeaking(true);
                }}
                speaking={speaking}
              />
            </div>
            <Bubble text={t.bubbleFell} tail="none" live />
          </Demo>
          <Demo label={t.labelPanel}>
            <Panel className="grid justify-items-center gap-2 px-5 py-4 text-center">
              <h3 className="m-0 text-[26px]">{t.panelTitle}</h3>
              <Stars earned={3} />
              <span className="inline-flex items-center gap-1.5 font-pixel text-hud">
                + 25 <PixelIcon name="coin" scale={2} pop />
              </span>
              <span className="text-body text-ink-soft">{t.panelBody}</span>
              <Button variant="go" iconAfter={<PixelIcon name="play" scale={1} />}>
                {t.nextLevel}
              </Button>
            </Panel>
          </Demo>
          <Demo label={t.labelTopBar} wide>
            <div
              data-testid="demo-top-bar"
              className="flex flex-wrap items-center justify-between gap-3 rounded-chip border-3 border-ink bg-brand-deep p-2.5 text-paper"
            >
              <Button icon="←" size="sm">
                {t.back}
              </Button>
              <span className="font-display text-[18px] font-bold">{t.topBarWhere}</span>
              <Stars earned={2} />
              <Hud coins={120} />
            </div>
          </Demo>
          <Demo label={t.labelIcons}>
            <div className="grid gap-3">
              {ICON_SCALES.map((scale) => (
                <div key={scale} className="flex flex-wrap items-end gap-4">
                  {ICONS.map((name) => (
                    <PixelIcon key={name} name={name} scale={scale} label={name} />
                  ))}
                  <span className="font-pixel text-pixel-sm text-ink-soft">×{scale}</span>
                </div>
              ))}
            </div>
          </Demo>
        </div>
      </Sheet>

      {/* ---------- Type ---------- */}
      <Sheet id="type-h" eyebrow={t.typeEyebrow} title={t.typeTitle}>
        <div className="grid gap-3.5">
          {(
            [
              [
                'display',
                t.typeDisplayMeta,
                t.typeDisplayUse,
                'font-display text-display font-extrabold',
                undefined,
              ],
              [
                'body',
                t.typeBodyMeta,
                t.typeBodyUse,
                'font-body text-bubble font-semibold',
                t.typeBodyExtra,
              ],
              [
                'pixel',
                t.typePixelMeta,
                t.typePixelUse,
                'font-pixel text-pixel-lg font-normal',
                t.typePixelExtra,
              ],
            ] as const
          ).map(([key, meta, use, fontClass, extra]) => (
            <div
              key={key}
              className="grid grid-cols-[170px_1fr] items-baseline gap-4 border-b-2 border-dashed border-paper-2 pb-3.5 last:border-b-0 last:pb-0"
            >
              <div className="grid gap-0.5 text-small text-ink-soft">
                <b className="text-[16px] text-ink">{meta}</b>
                {use}
              </div>
              <div className={`grid gap-1 ${fontClass}`}>
                <span data-font-sample={key}>{t.sample}</span>
                {extra !== undefined && <span>{extra}</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-3 rounded-chip border-2 border-oops bg-oops-soft px-3.5 py-3">
          <span
            aria-hidden="true"
            className="font-display text-[22px] leading-none font-extrabold text-oops"
          >
            !
          </span>
          <span>
            <b className="font-display">{t.typeWarnTitle}</b> {t.typeWarnBody}
          </span>
        </div>
      </Sheet>

      {/* ---------- Colour ---------- */}
      <Sheet id="color-h" eyebrow={t.colorEyebrow} title={t.colorTitle}>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
          {SWATCHES.map((token) => {
            const [name, use] = t.swatches[token];
            return <Swatch key={token} token={token} name={name} use={use} />;
          })}
        </div>
        <h3 className="m-0 text-[20px] font-bold">{t.blockColorTitle}</h3>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-2.5">
          {BLOCK_PILLS.map((token) => (
            <BlockPill key={token} token={token} label={t.blocks[token]} />
          ))}
        </div>
      </Sheet>
    </main>
  );
}
