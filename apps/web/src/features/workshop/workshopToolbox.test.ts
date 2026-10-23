import { describe, expect, it, vi } from 'vitest';
import { LB_TOOLBOX } from '@codequest/games';
import { LEANBOT_IDE_URL, type WorkshopCategory, workshopToolbox } from './workshopToolbox';

const links = await vi.importActual<{ default: unknown }>(
  '../../../../../content/leanbot/duong-dan.json',
);

describe('workshop toolbox', () => {
  it('has Pythaverse’s categories in its order, Leanbot last with its six groups', () => {
    const names = workshopToolbox().contents.map((c) => c.name);
    expect(names).toEqual(['Logic', 'Vòng lặp', 'Toán', 'Biến', 'Hàm', 'Arduino', 'Leanbot']);
    const leanbot = workshopToolbox().contents.at(-1);
    expect(
      leanbot?.contents
        .filter((c): c is WorkshopCategory => c.kind === 'category')
        .map((c) => c.name),
    ).toEqual(['Di chuyển', 'Tay gắp', 'Đèn Led RGB', 'Phát nhạc', 'Cảm biến', 'Cảm biến vạch']);
  });

  it('lists the 93 blocks of Pythaverse’s toolbox', () => {
    const count = (c: (typeof LB_TOOLBOX)[number]): number =>
      (c.blocks?.length ?? 0) + (c.children ?? []).reduce((n, child) => n + count(child), 0);
    expect(LB_TOOLBOX.reduce((n, c) => n + count(c), 0)).toBe(93);
  });

  it('links the Leanbot IDE listed on the course links page', () => {
    expect(JSON.stringify(links.default)).toContain(LEANBOT_IDE_URL);
  });
});
