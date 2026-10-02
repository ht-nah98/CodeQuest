import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { RunnerConfig } from '@codequest/games';
import { initialStrip, stripStep } from './runner/trackStrip';
import { TrackStripView } from './TrackStrip';

afterEach(cleanup);

/** runner-long's shape: 30 cells, a hole every 6th, the flag last. */
const long: RunnerConfig = {
  cells: Array.from({ length: 30 }, (_, i) =>
    i === 29 ? 'flag' : i % 6 === 5 ? 'hole' : 'ground',
  ),
  start: 0,
  bamboo: [3],
};
const ev = <T extends object>(event: T) => ({ blockId: 'b', ...event });

describe('TrackStripView', () => {
  it('draws every cell, Măng on her cell and a Vietnamese label', () => {
    const { container, getByRole } = render(
      <TrackStripView state={initialStrip(long)} stageWidth={500} />,
    );
    expect(getByRole('img').getAttribute('aria-label')).toBe('Cả đường: 30 ô, Măng ở ô 1');
    expect(container.querySelectorAll('[data-cell]')).toHaveLength(30);
    expect(container.querySelectorAll('[data-cell="hole"]')).toHaveLength(4);
    expect(container.querySelector('[data-mark="mang"] [data-panda]')).not.toBeNull();
    expect(container.querySelector('[data-mark="view"]')).not.toBeNull();
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('follows the run: the marker moves and a picked shoot is gone', () => {
    let state = stripStep(initialStrip(long), ev({ type: 'walk', from: 2, to: 3 }));
    state = stripStep(state, ev({ type: 'collect', at: 3 }));
    const { container, getByRole } = render(<TrackStripView state={state} stageWidth={500} />);
    expect(getByRole('img').getAttribute('aria-label')).toBe('Cả đường: 30 ô, Măng ở ô 4');
    expect(container.querySelector('[data-bamboo]')).toBeNull();
    expect(container.querySelector<SVGGElement>('[data-mark="mang"]')?.style.transform).toBe(
      'translateX(72px)',
    );
  });

  it('shows nothing when the whole track fits the stage', () => {
    const short: RunnerConfig = { cells: ['ground', 'ground', 'flag'], start: 0 };
    const { container } = render(<TrackStripView state={initialStrip(short)} stageWidth={500} />);
    expect(container.innerHTML).toBe('');
  });
});
