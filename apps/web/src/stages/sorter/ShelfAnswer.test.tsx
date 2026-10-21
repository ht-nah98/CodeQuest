import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { SorterConfig } from '@codequest/games';
import { AnswerPicture } from '../AnswerPicture';
import { parseShelfKey, ShelfAnswerPicture } from './ShelfAnswer';

const CONFIG: SorterConfig = { books: [3, 1, 2], goal: { sorted: true }, maxQuestions: 5 };

describe('parseShelfKey', () => {
  it('reads a shelf key: the books in order and where the hand stopped', () => {
    expect(parseShelfKey('shelf:2,4,1,3,5@5')).toEqual({
      kind: 'shelf',
      books: [2, 4, 1, 3, 5],
      at: 5,
    });
  });

  it('reads a hand parked on the flag', () => {
    expect(parseShelfKey('shelf:3,1,2@4')).toMatchObject({ at: 4 });
  });

  it('reads a crash key and a timeout', () => {
    expect(parseShelfKey('crash:OFF_SHELF@4')).toEqual({
      kind: 'crash',
      reason: 'OFF_SHELF',
      at: 4,
    });
    expect(parseShelfKey('timeout')).toEqual({ kind: 'timeout' });
  });

  it('refuses a key of another kind instead of drawing nonsense', () => {
    expect(parseShelfKey('cell:2,3@E')).toBeNull();
    expect(parseShelfKey('shelf:@2')).toBeNull();
    expect(parseShelfKey('shelf:1,2')).toBeNull();
  });
});

describe('ShelfAnswerPicture', () => {
  it('draws the books of the key, not the ones the level starts with', () => {
    render(<ShelfAnswerPicture config={CONFIG} answerKey="shelf:1,2,3@4" />);
    expect(screen.getByText('1')).toBeTruthy();
    expect(document.querySelector('[data-shelf-answer="shelf"]')).toBeTruthy();
  });

  it('falls back to the level books for a crash key, which carries none', () => {
    const { container } = render(
      <ShelfAnswerPicture config={CONFIG} answerKey="crash:NO_BOOK_RIGHT@3" />,
    );
    expect(container.querySelector('[data-shelf-answer="crash"]')).toBeTruthy();
    expect(screen.getAllByText(/^[123]$/).length).toBe(3);
  });

  it('marks a timeout and draws no hand', () => {
    const { container } = render(<ShelfAnswerPicture config={CONFIG} answerKey="timeout" />);
    expect(container.querySelector('[data-shelf-answer="timeout"]')).toBeTruthy();
  });

  it('draws nothing for a config that is not a shelf', () => {
    const { container } = render(
      <ShelfAnswerPicture config={{ map: ['S.G'] }} answerKey="shelf:1,2@2" />,
    );
    expect(container.firstChild).toBeNull();
  });
});

describe('AnswerPicture with a shelf level', () => {
  it('picks the shelf picture for the sorter kind', () => {
    const { container } = render(
      <AnswerPicture kind="sorter" config={CONFIG} answerKey="shelf:1,2,3@4" />,
    );
    expect(container.querySelector('[data-shelf-answer="shelf"]')).toBeTruthy();
  });

  it('shows the boxes of a key with a variable suffix next to the shelf', () => {
    const { container } = render(
      <AnswerPicture
        kind="sorter"
        config={CONFIG}
        answerKey="shelf:1,2,3@4#dem=2"
        variables={[{ id: 'dem', name: 'đếm', start: [0] }]}
      />,
    );
    expect(container.querySelector('[data-answer-boxes="1"]')).toBeTruthy();
    expect(screen.getByTestId('var-badge').dataset.value).toBe('2');
  });
});
