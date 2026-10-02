import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi as vitest } from 'vitest';
import { Gesture, type WorkspaceSvg } from 'blockly';
import type { HintTrigger } from '@codequest/content-schema';
import type { HintSelection } from '@codequest/engine';
import type { WorkspaceHandle } from '../../blockly/BlocklyWorkspace';
import type { BuyResult, Hints, UseHintsOptions } from '../../features/hints';
import { hintTestLevel, sessionWithFails } from '../../features/hints/testLevel';
import {
  CHANGE_DEBOUNCE_MS,
  IDLE_MS,
  type PlayHintsOptions,
  RUN_END_DELAY_MS,
  usePlayHints,
} from './usePlayHints';

// The purchase and selection logic is useHints' (own tests); here only the play-screen wiring:
// timers, what may show a tip, and what clears it.
const mocks = vitest.hoisted(() => ({
  hints: null as Hints | null,
  options: null as UseHintsOptions | null,
  popoverClose: vitest.fn(),
}));

vitest.mock('../../features/hints', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../features/hints')>();
  return {
    ...actual,
    useHints: (options: UseHintsOptions) => {
      mocks.options = options;
      if (mocks.hints === null) throw new Error('set mocks.hints first');
      return mocks.hints;
    },
  };
});

vitest.mock('../../blockly/nextStepPopover', () => ({
  showNextStepPopover: (
    _workspace: WorkspaceSvg,
    _step: unknown,
    { onClose }: { onClose?: () => void } = {},
  ) => ({
    element: document.createElement('div'),
    close: () => {
      mocks.popoverClose();
      onClose?.();
    },
  }),
}));

const level = hintTestLevel();
/** A global rule pointing at the run button: its ring shows where the tip points. */
const selection = {
  source: 'global',
  rule: { id: 'g-idle', when: { runCount: { eq: 0 } } },
  target: 'run',
} as unknown as HintSelection;

let evaluate: ReturnType<typeof vitest.fn<(trigger: HintTrigger) => HintSelection | null>>;
let buyResult: BuyResult;
let root: HTMLElement;
let runButton: HTMLElement;

beforeEach(() => {
  vitest.useFakeTimers();
  evaluate = vitest.fn<(trigger: HintTrigger) => HintSelection | null>(() => selection);
  buyResult = { status: 'opened', tier: 3 };
  mocks.hints = {
    ready: true,
    balance: 30,
    tiers: [],
    tiersBought: [],
    busy: false,
    buy: vitest.fn(() => Promise.resolve(buyResult)),
    tip: null,
    evaluate,
    dismissTip: vitest.fn(),
  };
  mocks.popoverClose.mockClear();
  root = document.createElement('main');
  runButton = document.createElement('button');
  runButton.dataset.hintAnchor = 'run';
  root.append(runButton);
  document.body.append(root);
});

afterEach(() => {
  vitest.useRealTimers();
  vitest.restoreAllMocks();
  root.remove();
});

function setup(extra: Partial<PlayHintsOptions> = {}) {
  const showTip = vitest.fn();
  const handle = {
    getState: () => ({
      levelId: level.id,
      json: { blocks: { languageVersion: 0, blocks: [] } },
      analysis: {},
      remainingCapacity: null,
    }),
  } as unknown as WorkspaceHandle;
  const options: PlayHintsOptions = {
    profileId: 'p1',
    level,
    feedback: {},
    session: sessionWithFails(level.id, 0),
    sessionOpen: () => true,
    recordHintBought: vitest.fn(),
    workspaceRef: { current: {} as WorkspaceSvg },
    handleRef: { current: handle },
    rootRef: { current: root },
    isFirstOfModeInWorld: false,
    seenModes: new Set(),
    showTip,
    currentText: () => '',
    canTip: () => true,
    ...extra,
  };
  const hook = renderHook(() => usePlayHints(options));
  return { hook, showTip };
}

const triggers = () => evaluate.mock.calls.map(([trigger]) => trigger);
const advance = (ms: number) => {
  act(() => {
    vitest.advanceTimersByTime(ms);
  });
};
const pointed = () => runButton.dataset.hintTarget === 'true';

describe('usePlayHints: tier-0 timers (hint-engine.md §5)', () => {
  it('shows a change tip 600 ms after the last change, later while a block is dragged', () => {
    const { hook, showTip } = setup();
    act(() => {
      hook.result.current.changed();
    });
    advance(CHANGE_DEBOUNCE_MS - 1);
    act(() => {
      hook.result.current.changed(); // a new change restarts the wait
    });
    advance(CHANGE_DEBOUNCE_MS - 1);
    expect(triggers()).toEqual([]);

    const dragging = vitest.spyOn(Gesture, 'inProgress').mockReturnValue(true);
    advance(1);
    expect(triggers()).toEqual([]);
    dragging.mockReturnValue(false);
    advance(CHANGE_DEBOUNCE_MS);
    expect(triggers()).toEqual(['change']);
    expect(showTip).toHaveBeenCalledWith({
      text: 'Thử bấm Chạy xem chuyện gì xảy ra!',
      voiceId: 'ui.hints.global.g-idle',
    });
    expect(pointed()).toBe(true);
    // One tip state: the tip stays in useHints until the bubble moves on.
    expect(mocks.hints?.dismissTip).not.toHaveBeenCalled();
    act(() => {
      hook.result.current.clearTip();
    });
    expect(pointed()).toBe(false);
    expect(mocks.hints?.dismissTip).toHaveBeenCalledTimes(1);
  });

  it('shows a run-end tip 1.5 s after a lost replay, unless the child edits or resets', () => {
    const { hook } = setup();
    act(() => {
      hook.result.current.runEnded();
    });
    advance(RUN_END_DELAY_MS - 1);
    expect(triggers()).toEqual([]);
    advance(1);
    expect(triggers()).toEqual(['run-end']);

    // An edit after the run: only the change tip, never the stale run-end one.
    evaluate.mockClear();
    act(() => {
      hook.result.current.runEnded();
      hook.result.current.changed();
    });
    advance(RUN_END_DELAY_MS);
    expect(triggers()).toEqual(['change']);

    // Reset / a new run cancels both.
    evaluate.mockClear();
    act(() => {
      hook.result.current.runEnded();
      hook.result.current.changed();
      hook.result.current.cancelPending();
    });
    advance(RUN_END_DELAY_MS);
    expect(triggers()).toEqual([]);
  });

  it('shows the idle tip once after 60 s, again only after the child acts', () => {
    setup();
    advance(IDLE_MS + 5_000);
    expect(triggers()).toEqual(['idle']);
    advance(IDLE_MS * 2);
    expect(triggers()).toEqual(['idle']);
    window.dispatchEvent(new Event('pointerdown'));
    advance(IDLE_MS + 5_000);
    expect(triggers()).toEqual(['idle', 'idle']);
  });

  it('cancels its timers and removes the pointer on unmount', () => {
    const { hook } = setup();
    act(() => {
      hook.result.current.entered();
    });
    expect(pointed()).toBe(true);
    act(() => {
      hook.result.current.changed();
      hook.result.current.runEnded();
    });
    hook.unmount();
    expect(pointed()).toBe(false);
    advance(IDLE_MS * 2);
    expect(triggers()).toEqual(['enter']);
  });
});

describe('usePlayHints: tips and the hint box / solution / popover', () => {
  it('opening the box clears the tip, and no tip shows while it is open', () => {
    const { hook } = setup();
    act(() => {
      hook.result.current.entered();
    });
    expect(pointed()).toBe(true);
    act(() => {
      hook.result.current.openBox();
    });
    expect(pointed()).toBe(false);
    act(() => {
      hook.result.current.changed();
    });
    advance(CHANGE_DEBOUNCE_MS);
    expect(triggers()).toEqual(['enter']);
    act(() => {
      hook.result.current.closeBox();
      hook.result.current.changed();
    });
    advance(CHANGE_DEBOUNCE_MS);
    expect(triggers()).toEqual(['enter', 'change']);
  });

  it('the solution (tier 3) clears the tip and holds tips until it closes', async () => {
    const { hook } = setup();
    act(() => {
      hook.result.current.entered();
    });
    await act(async () => {
      hook.result.current.buy(3);
      await Promise.resolve();
    });
    expect(hook.result.current.solutionOpen).toBe(true);
    expect(pointed()).toBe(false);
    act(() => {
      hook.result.current.changed();
    });
    advance(CHANGE_DEBOUNCE_MS);
    expect(triggers()).toEqual(['enter']);
    act(() => {
      hook.result.current.closeSolution();
      hook.result.current.changed();
    });
    advance(CHANGE_DEBOUNCE_MS);
    expect(triggers()).toEqual(['enter', 'change']);
  });

  it('the tier-2 popover clears the tip and holds tips until it closes', async () => {
    buyResult = {
      status: 'opened',
      tier: 2,
      step: { kind: 'remove', blockId: 'b', loose: true, midStack: false },
    };
    const { hook } = setup();
    act(() => {
      hook.result.current.entered();
    });
    await act(async () => {
      hook.result.current.buy(2);
      await Promise.resolve();
    });
    expect(pointed()).toBe(false);
    act(() => {
      hook.result.current.changed();
    });
    advance(CHANGE_DEBOUNCE_MS);
    expect(triggers()).toEqual(['enter']);
    act(() => {
      hook.result.current.closePopover();
    });
    expect(mocks.popoverClose).toHaveBeenCalledTimes(1);
    act(() => {
      hook.result.current.changed();
    });
    advance(CHANGE_DEBOUNCE_MS);
    expect(triggers()).toEqual(['enter', 'change']);
  });

  it('says why a purchase was refused for coins, and passes sessionOpen to useHints', async () => {
    buyResult = { status: 'missing', tier: 3, missing: 10 };
    const sessionOpen = () => false;
    const { hook } = setup({ sessionOpen });
    expect(mocks.options?.sessionOpen).toBe(sessionOpen);
    await act(async () => {
      hook.result.current.buy(3);
      await Promise.resolve();
    });
    expect(hook.result.current.notice).toBe('missing');
  });
});
