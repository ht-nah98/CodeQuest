import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { turtleDrawKey } from '@codequest/games';
import { AnswerPicture } from '../AnswerPicture';
import { parseTurtleKey } from './TurtleAnswer';

afterEach(cleanup);

const config = { size: { w: 6, h: 7 }, start: { x: 1, y: 1, heading: 0 }, grid: 'tri' };
const triangle = {
  blocks: {
    languageVersion: 0 as const,
    blocks: [
      {
        type: 'cq_start',
        id: 'start',
        next: {
          block: {
            type: 'cq_repeat',
            id: 'loop',
            fields: { TIMES: 3 },
            inputs: {
              DO: {
                block: {
                  type: 'turtle_forward',
                  id: 'f',
                  fields: { N: 3 },
                  next: { block: { type: 'turtle_turn_left', id: 't', fields: { DEG: '120' } } },
                },
              },
            },
          },
        },
      },
    ],
  },
};

const draw = (answerKey: string, paper: unknown = config) =>
  render(<AnswerPicture kind="turtle" config={paper} answerKey={answerKey} />).container;

describe('turtle answer picture', () => {
  it('reads draw and crash keys', () => {
    expect(parseTurtleKey('draw:')).toEqual({ kind: 'draw', segments: [] });
    expect(parseTurtleKey('draw:0,0,0,0|2,0,0,0')).toEqual({
      kind: 'draw',
      segments: ['0,0,0,0|2,0,0,0'],
    });
    expect(parseTurtleKey('crash:OFF_PAPER@24,0,-2,1')).toEqual({
      kind: 'crash',
      reason: 'OFF_PAPER',
      at: [24, 0, -2, 1],
    });
    expect(parseTurtleKey('win')).toBeNull();
  });

  it('draws every line of a drawn key in ink on the dotted paper', () => {
    const root = draw(turtleDrawKey({ config }, triangle));
    expect(root.querySelector('[data-turtle-answer="draw"]')).not.toBeNull();
    // 9 unit lines of a side-3 triangle (no target: no dashed lines).
    expect(root.querySelectorAll('line')).toHaveLength(9);
    expect(root.querySelectorAll('circle').length).toBeGreaterThan(20);
  });

  it('marks a crash point and shows the target dashed', () => {
    const square = {
      size: { w: 4, h: 4 },
      start: { x: 1, y: 1, heading: 0 },
      target: [{ from: [1, 1], heading: 0, path: 'F2 L90 F2 L90 F2 L90 F2' }],
      grid: 'square',
    };
    const root = draw('crash:EXTRA_LINE@6,0,2,0', square);
    expect(root.querySelector('[data-mark="crash"]')).not.toBeNull();
    expect(root.querySelectorAll('line[stroke-dasharray]')).toHaveLength(8);
  });

  it('draws every card on the whole paper at one scale', () => {
    const small = draw('draw:2,0,2,0|4,0,2,0').querySelector('svg');
    cleanup();
    const big = draw('draw:2,0,2,0|4,0,2,0;4,0,2,0|6,0,2,0').querySelector('svg');
    expect(small?.getAttribute('viewBox')).toBe('0 0 70 80');
    expect(big?.getAttribute('viewBox')).toBe(small?.getAttribute('viewBox'));
    // One unit line is as long on both cards.
    const length = (svg: Element | null | undefined) => {
      const line = svg?.querySelector('line');
      return Number(line?.getAttribute('x2')) - Number(line?.getAttribute('x1'));
    };
    expect(length(big)).toBe(length(small));
  });

  it('draws nothing for an unreadable key or config', () => {
    expect(draw('stop@1').firstChild).toBeNull();
    cleanup();
    expect(draw('draw:', { size: 3 }).firstChild).toBeNull();
  });
});
