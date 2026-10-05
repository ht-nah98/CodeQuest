import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AnswerPicture } from './AnswerPicture';

afterEach(cleanup);

const runner = {
  cells: ['ground', 'ground', 'hole', 'ground', 'branch', 'ground', 'flag'],
  start: 0,
  bamboo: [3],
};
const maze = { map: ['#####', '#S..#', '###.#', '###G.', '#####'], startDir: 'E' };

const draw = (kind: 'runner' | 'maze', config: unknown, answerKey: string) =>
  render(<AnswerPicture kind={kind} config={config} answerKey={answerKey} />).container;

/** x of Măng's frame (the inner svg) in picture units. */
const pandaX = (root: Element) => Number(root.querySelector('[data-panda] svg')?.getAttribute('x'));

describe('AnswerPicture runner', () => {
  it('frames the answer cell, draws no cell numbers', () => {
    const stop = draw('runner', runner, 'stop@3');
    expect(stop.querySelector('[data-answer-cell="3"] [data-panda="idle_1"]')).not.toBeNull();
    expect(stop.querySelectorAll('[data-mark="spot"]')).toHaveLength(1);
    expect(stop.querySelectorAll('text')).toHaveLength(0);
  });

  it('win on the flag, missed@ on the flag with the bamboo still there', () => {
    expect(
      draw('runner', runner, 'win').querySelector('[data-answer-cell="6"] [data-mark="win"]'),
    ).not.toBeNull();
    cleanup();
    const missed = draw('runner', runner, 'missed@6');
    expect(missed.querySelector('[data-answer-cell="6"] [data-panda="talk"]')).not.toBeNull();
    expect(missed.querySelector('image[href="/tiles/bamboo.png"]')).not.toBeNull();
  });

  it('a hole swallows Măng in place; a branch is bumped from the cell before', () => {
    const fell = draw('runner', runner, 'crash:FELL_IN_HOLE@2');
    const cellWidth = 24;
    expect(pandaX(fell)).toBeGreaterThan(2 * cellWidth - cellWidth / 2);
    cleanup();
    const branch = draw('runner', runner, 'crash:HIT_BRANCH@4');
    const panda = pandaX(branch);
    // Standing in cell 3 (the frame stays on cell 4, where the branch is).
    expect(panda).toBeLessThan(4 * cellWidth);
    expect(panda).toBeGreaterThan(2 * cellWidth);
    expect(branch.querySelector('[data-answer-cell="4"] [data-mark="crash"]')).not.toBeNull();
  });

  it('OFF_TRACK: Măng jumps from the keyed cell', () => {
    const off = draw('runner', runner, 'crash:OFF_TRACK@5');
    expect(off.querySelector('[data-answer-cell="5"] [data-panda="jump"]')).not.toBeNull();
  });

  it('a start after cell 0 changes nothing about where the key points', () => {
    const later = { cells: ['ground', 'ground', 'ground', 'flag'], start: 1 };
    expect(draw('runner', later, 'stop@2').querySelector('[data-answer-cell="2"]')).not.toBeNull();
  });
});

describe('AnswerPicture maze', () => {
  it('HIT_WALL: Măng on the keyed cell, the burst on the wall she faced', () => {
    const crash = draw('maze', maze, 'crash:HIT_WALL@1,3');
    // Arrived at 1,3 going east; the wall east of it is the one hit.
    expect(
      crash.querySelector('[data-answer-cell="1,3"] [data-wall="E"] [data-mark="crash"]'),
    ).not.toBeNull();
    expect(crash.querySelector('[data-mark="start"]')).not.toBeNull();
  });

  it('stop, missed and win', () => {
    expect(
      draw('maze', maze, 'stop@1,2').querySelector(
        '[data-answer-cell="1,2"] [data-panda="idle_1"]',
      ),
    ).not.toBeNull();
    cleanup();
    expect(
      draw('maze', maze, 'missed@3,3').querySelector(
        '[data-answer-cell="3,3"] [data-panda="talk"]',
      ),
    ).not.toBeNull();
    cleanup();
    expect(
      draw('maze', maze, 'win').querySelector('[data-answer-cell="3,3"] [data-mark="win"]'),
    ).not.toBeNull();
  });

  it('a key outside the map or on a wall gets no answer mark', () => {
    expect(draw('maze', maze, 'stop@0,0').querySelector('[data-answer-cell]')).toBeNull();
    cleanup();
    expect(draw('maze', maze, 'stop@9,9').querySelector('[data-answer-cell]')).toBeNull();
  });
});

describe('AnswerPicture fallbacks', () => {
  it('draws nothing for an unreadable key, a bad config or a kind without pictures', () => {
    expect(draw('runner', runner, 'timeout').innerHTML).toBe('');
    expect(draw('runner', { cells: [] }, 'win').innerHTML).toBe('');
    expect(
      render(<AnswerPicture kind="robotlab" config={{}} answerKey="win" />).container.innerHTML,
    ).toBe('');
  });
});

describe('AnswerPicture goal sprite (P2-11c)', () => {
  const withSprite = (kind: 'runner' | 'maze', config: unknown, sprite: 'machine' | 'exit') =>
    render(<AnswerPicture kind={kind} config={config} answerKey="win" goalSprite={sprite} />)
      .container;

  it('draws the goal picture instead of the flag tiles', () => {
    const track = withSprite('runner', runner, 'machine');
    expect(track.querySelector('[data-goal-sprite="machine"] rect')).not.toBeNull();
    expect(track.querySelector('image[href="/tiles/flag_1.png"]')).toBeNull();
    cleanup();
    const board = withSprite('maze', maze, 'exit');
    expect(board.querySelectorAll('[data-mark="goal"]')).toHaveLength(1);
    expect(board.querySelector('[data-goal-sprite="exit"]')).not.toBeNull();
    cleanup();
    // No sprite: the flag as before.
    expect(draw('maze', maze, 'win').querySelector('image[data-mark="goal"]')).not.toBeNull();
  });
});

describe('AnswerPicture themes (P2-23)', () => {
  it('a maze in a theme draws its wall and floor tiles; Làng Tre keeps the bamboo rects', () => {
    const plain = draw('maze', maze, 'win');
    expect(plain.querySelectorAll('image[href^="data:image/svg+xml"]')).toHaveLength(0);
    cleanup();
    const river = render(
      <AnswerPicture kind="maze" config={maze} answerKey="win" theme="song" />,
    ).container;
    const tiles = river.querySelectorAll('image[href^="data:image/svg+xml"]');
    expect(tiles).toHaveLength(maze.map.join('').length);
    expect(river.querySelector('[data-answer-cell] [data-panda]')).not.toBeNull();
  });
});
