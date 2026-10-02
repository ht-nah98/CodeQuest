import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { vi } from '../../i18n/vi';
import { PANDA_ANIMATIONS, type PandaAnimation } from '../../stages/panda';
import {
  type DevStage,
  DEV_STAGE_HEIGHT,
  DEV_STAGE_WIDTH,
  mountDevStage,
} from '../../stages/devStage';

/** /dev/stage: Măng's spritesheet and the temporary runner tiles (P0-06). */
export default function DevStageScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<DevStage | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [animation, setAnimation] = useState<PandaAnimation>('idle');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const controller = new AbortController();
    mountDevStage(container, controller.signal).then(
      (stage) => {
        if (controller.signal.aborted) {
          stage?.destroy();
          return;
        }
        if (!stage) return;
        stageRef.current = stage;
        setAnimation('idle');
        setReady(true);
      },
      () => {
        if (!controller.signal.aborted) setFailed(true);
      },
    );
    return () => {
      controller.abort();
      stageRef.current?.destroy();
      stageRef.current = null;
      setReady(false);
    };
  }, []);

  const choose = (next: PandaAnimation) => {
    setAnimation(next);
    stageRef.current?.play(next);
  };

  return (
    <main style={{ padding: 24, display: 'grid', gap: 16, justifyContent: 'start' }}>
      <Link to="/">{vi.dev.backHome}</Link>
      <h1>{vi.dev.stageTitle}</h1>
      <p role={failed ? 'alert' : undefined}>
        {failed ? vi.dev.stageError : ready ? vi.dev.stageHint : vi.dev.stageLoading}
      </p>
      <div
        role="group"
        aria-label={vi.dev.stageAnimationsLabel}
        style={{ display: 'flex', gap: 8 }}
      >
        {PANDA_ANIMATIONS.map((name) => (
          <button
            key={name}
            type="button"
            data-animation={name}
            aria-pressed={animation === name}
            disabled={!ready}
            onClick={() => {
              choose(name);
            }}
            style={{ fontWeight: animation === name ? 700 : 400 }}
          >
            {vi.dev.animations[name]}
          </button>
        ))}
      </div>
      <div
        ref={containerRef}
        data-testid="dev-stage"
        data-ready={ready}
        style={{ width: DEV_STAGE_WIDTH, height: DEV_STAGE_HEIGHT }}
      />
    </main>
  );
}
