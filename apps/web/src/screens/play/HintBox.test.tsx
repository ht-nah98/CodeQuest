import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi as vitest } from 'vitest';
import type { TierView } from '../../features/hints';
import { HintBox } from './HintBox';

afterEach(cleanup);

const tiers: TierView[] = [
  { tier: 1, state: 'free', price: 0, missing: 0 },
  { tier: 2, state: 'buy', price: 15, missing: 0 },
  { tier: 3, state: 'locked', price: 40, missing: 10 },
];

function renderBox(props: Partial<Parameters<typeof HintBox>[0]> = {}) {
  const onBuy = vitest.fn();
  const onClose = vitest.fn();
  render(<HintBox tiers={tiers} balance={30} onBuy={onBuy} onClose={onClose} {...props} />);
  return { onBuy, onClose };
}

describe('HintBox', () => {
  it('is a modal dialog with the balance and the three tiers', () => {
    renderBox();
    const dialog = screen.getByRole('dialog', { name: 'Gợi ý' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByTestId('hint-balance').getAttribute('aria-label')).toBe('30 xu');
    expect(screen.getByText('Gợi ý tư duy')).toBeTruthy();
    expect(screen.getByText('Chỉ bước tiếp')).toBeTruthy();
    expect(screen.getByText('Xem lời giải')).toBeTruthy();
    expect(screen.getByText('Tối đa 2 sao')).toBeTruthy();
    expect(screen.getByText('Tối đa 1 sao')).toBeTruthy();
  });

  it('shows free, priced and locked tiers', () => {
    renderBox();
    expect(screen.getByRole('button', { name: 'Gợi ý tư duy: Miễn phí' })).toBeTruthy();
    const tier2 = screen.getByRole('button', { name: 'Chỉ bước tiếp: 15 xu' });
    expect(tier2.textContent).toContain('15 xu');
    expect(tier2.querySelector('[data-icon="coin"]')).toBeTruthy();
    const tier3 = screen.getByRole<HTMLButtonElement>('button', { name: 'Xem lời giải: 40 xu' });
    expect(tier3.getAttribute('aria-disabled')).toBe('true');
    expect(tier3.querySelector('[data-icon="lock"]')).toBeTruthy();
    expect(screen.getByTestId('hint-missing-3').textContent).toBe(
      'Cần thêm 10 xu. Qua màn mới là có thêm xu!',
    );
    expect(screen.getByText('Khó nhỉ? Gợi ý tư duy đang miễn phí đó.')).toBeTruthy();
  });

  it('labels an owned tier "Xem lại" and shows the thinking hint once opened', () => {
    renderBox({
      tiers: [{ tier: 1, state: 'owned', price: 0, missing: 0 }],
      thinkingHint: 'Ngay trước hố, Măng phải làm gì?',
    });
    expect(screen.getByRole('button', { name: 'Gợi ý tư duy: Xem lại' })).toBeTruthy();
    expect(screen.getByTestId('hint-thinking').textContent).toContain(
      'Ngay trước hố, Măng phải làm gì?',
    );
    expect(screen.queryByText('Khó nhỉ? Gợi ý tư duy đang miễn phí đó.')).toBeNull();
  });

  it('buys a tier on click; locked and busy buttons stay focusable but do nothing', () => {
    const { onBuy } = renderBox();
    fireEvent.click(screen.getByTestId('hint-buy-2'));
    expect(onBuy).toHaveBeenCalledWith(2);
    fireEvent.click(screen.getByTestId('hint-buy-3'));
    expect(onBuy).toHaveBeenCalledTimes(1);
    cleanup();
    const busy = renderBox({ busy: true });
    const tier1 = screen.getByTestId<HTMLButtonElement>('hint-buy-1');
    expect(tier1.disabled).toBe(false);
    expect(tier1.getAttribute('aria-disabled')).toBe('true');
    tier1.focus();
    fireEvent.click(tier1);
    expect(busy.onBuy).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(tier1);
  });

  it('gives every buy button the 44px minimum and a focus ring', () => {
    renderBox();
    for (const tier of [1, 2, 3]) {
      const button = screen.getByTestId(`hint-buy-${String(tier)}`);
      expect(button.className).toContain('min-h-11');
      expect(button.className).toContain('focus-visible:outline-3');
    }
  });

  it('focuses the first control, keeps Tab inside and closes on Escape', () => {
    const { onClose } = renderBox();
    const close = screen.getByRole('button', { name: 'Đóng' });
    expect(document.activeElement).toBe(close);
    const tier3 = screen.getByTestId('hint-buy-3');
    tier3.focus();
    fireEvent.keyDown(tier3, { key: 'Tab' });
    expect(document.activeElement).toBe(close);
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(tier3);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps focus across parent re-renders, calls the latest onClose and restores focus', () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const first = vitest.fn();
    const view = render(<HintBox tiers={tiers} balance={30} onBuy={vitest.fn()} onClose={first} />);
    const tier2 = screen.getByTestId('hint-buy-2');
    tier2.focus();
    const latest = vitest.fn();
    // A parent re-render with a new inline onClose must not move focus back to the first button.
    view.rerender(<HintBox tiers={tiers} balance={25} onBuy={vitest.fn()} onClose={latest} />);
    expect(document.activeElement).toBe(tier2);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  it('shows why tier 2 opened nothing, and a failed purchase', () => {
    renderBox({ notice: 'solved' });
    expect(screen.getByRole('status').textContent).toBe('Giống lời giải rồi. Bấm Chạy nhé!');
    cleanup();
    renderBox({ notice: 'reset' });
    expect(screen.getByRole('status').textContent).toBe(
      'Thiếu khối rồi. Bấm Làm lại để lấy lại nhé!',
    );
    cleanup();
    renderBox({ notice: 'error' });
    expect(screen.getByRole('alert').textContent).toBe('Ối, chưa mở được gợi ý. Thử lại nhé!');
  });
});
