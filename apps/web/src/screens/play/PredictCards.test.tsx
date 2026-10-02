import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi as vitest } from 'vitest';
import { PredictCards } from './PredictCards';

afterEach(cleanup);

const options = [
  { key: 'win', label: 'Tới cờ' },
  { key: 'stop@1', label: 'Dừng giữa đường' },
  { key: 'crash:FELL_IN_HOLE@2', label: 'Rơi xuống hố' },
];
const config = { cells: ['ground', 'ground', 'hole', 'ground', 'flag'], start: 0 };

function setup(props: { disabled?: boolean; marks?: Record<string, 'right' | 'wrong'> } = {}) {
  const onPick = vitest.fn();
  render(
    <PredictCards
      kind="runner"
      config={config}
      options={options}
      marks={props.marks ?? {}}
      disabled={props.disabled ?? false}
      onPick={onPick}
    />,
  );
  return onPick;
}

describe('PredictCards', () => {
  it('one card per option, with its picture and label; a click picks it', () => {
    const onPick = setup();
    const cards = screen.getAllByTestId('predict-card');
    expect(cards).toHaveLength(3);
    expect(cards[0]?.querySelector('svg [data-mark="spot"]')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Dừng giữa đường' }));
    expect(onPick).toHaveBeenCalledWith('stop@1');
  });

  it('disabled (session loading, replay running): focusable but no pick', () => {
    const onPick = setup({ disabled: true });
    const card = screen.getByRole('button', { name: 'Tới cờ' });
    expect(card.getAttribute('aria-disabled')).toBe('true');
    expect((card as HTMLButtonElement).disabled).toBe(false);
    card.focus();
    expect(document.activeElement).toBe(card);
    fireEvent.click(card);
    expect(onPick).not.toHaveBeenCalled();
  });

  it('a marked card says how it went and cannot be picked again', () => {
    const onPick = setup({ marks: { win: 'wrong', 'crash:FELL_IN_HOLE@2': 'right' } });
    const wrong = screen.getByRole('button', { name: 'Tới cờ: Chưa đúng' });
    expect(wrong.getAttribute('data-mark')).toBe('wrong');
    expect(wrong.getAttribute('aria-disabled')).toBe('true');
    expect(
      screen.getByRole('button', { name: 'Rơi xuống hố: Đúng rồi' }).getAttribute('data-mark'),
    ).toBe('right');
    fireEvent.click(wrong);
    expect(onPick).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Dừng giữa đường' }).getAttribute('aria-disabled'),
    ).toBe('false');
  });
});
