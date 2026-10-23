import { describe, expect, it, vi } from 'vitest';
import { LB_BLOCK_TYPES } from '@codequest/games';
import { LEANBOT_IDE_URL, workshopToolbox } from './workshopToolbox';

const links = await vi.importActual<{ default: unknown }>(
  '../../../../../content/leanbot/duong-dan.json',
);

describe('workshop toolbox', () => {
  it('holds every Leanbot block exactly once', () => {
    const types = workshopToolbox().contents.flatMap((category) =>
      category.contents.map((block) => block.type ?? ''),
    );
    expect([...types].sort()).toEqual([...LB_BLOCK_TYPES].sort());
  });

  it('links the Leanbot IDE listed on the course links page', () => {
    expect(JSON.stringify(links.default)).toContain(LEANBOT_IDE_URL);
  });
});
