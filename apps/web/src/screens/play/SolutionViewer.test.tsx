import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi as vitest } from 'vitest';
import { getMainWorkspace, inject } from 'blockly';
import { hintTestLevel } from '../../features/hints/testLevel';
import { SolutionViewer } from './SolutionViewer';

afterEach(cleanup);

describe('SolutionViewer', () => {
  it('gives the main workspace role back when it closes', async () => {
    const solution = hintTestLevel().solution;
    if (!solution) throw new Error('fixture has a solution');
    // The play screen's own workspace is the main one.
    const mainBox = document.createElement('div');
    document.body.append(mainBox);
    const main = inject(mainBox, { renderer: 'zelos' });
    const view = render(<SolutionViewer solution={solution} onClose={vitest.fn()} />);
    await waitFor(() => {
      expect(screen.getByTestId('solution-workspace').querySelector('.blocklyPath')).toBeTruthy();
    });
    expect(getMainWorkspace()).toBe(main);
    view.unmount();
    expect(getMainWorkspace()).toBe(main);
    main.dispose();
    mainBox.remove();
  });

  it('shows the solution in a read-only workspace and closes', async () => {
    const solution = hintTestLevel().solution;
    if (!solution) throw new Error('fixture has a solution');
    const onClose = vitest.fn();
    render(<SolutionViewer solution={solution} onClose={onClose} />);
    expect(screen.getByRole('dialog', { name: 'Lời giải' }).getAttribute('aria-modal')).toBe(
      'true',
    );
    const box = screen.getByTestId('solution-workspace');
    await waitFor(() => {
      expect(
        box.querySelectorAll('.blocklyDraggable, .blocklyBlock, [data-id]').length,
      ).toBeGreaterThan(0);
    });
    expect(screen.getByRole('region', { name: 'Lời giải, chỉ để xem' })).toBe(box);
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
