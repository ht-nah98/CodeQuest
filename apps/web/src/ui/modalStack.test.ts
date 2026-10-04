import { describe, expect, it } from 'vitest';
import { closeModal, isTopModal, openModal } from './modalStack';

describe('modalStack', () => {
  it('only the last opened modal is on top; closing it hands the top back', () => {
    const below = openModal();
    const above = openModal();
    expect(isTopModal(above)).toBe(true);
    expect(isTopModal(below)).toBe(false);
    closeModal(above);
    expect(isTopModal(below)).toBe(true);
    closeModal(below);
    closeModal(below);
    expect(isTopModal(below)).toBe(false);
  });
});
