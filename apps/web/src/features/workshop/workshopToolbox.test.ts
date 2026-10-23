import { describe, expect, it, vi } from 'vitest';
import { LB_TOOLBOX } from '@codequest/games';
import {
  LEANBOT_IDE_URL,
  lessonToolbox,
  type WorkshopCategory,
  workshopToolbox,
} from './workshopToolbox';

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

  it('a lesson with a few blocks shows them in one open list, the new ones first', () => {
    const toolbox = lessonToolbox(
      ['LbMission.beginImmediately_end', 'Leanbot.delay'],
      ['Leanbot.delay'],
    );
    expect(toolbox.kind).toBe('flyoutToolbox');
    expect(toolbox.contents.map((item) => (item.kind === 'label' ? item.text : 'block'))).toEqual([
      '✨ Khối mới',
      'block',
      'Khối đã học',
      'block',
    ]);
  });

  it('a lesson with many blocks groups them like Pythaverse, "Khối mới" first', () => {
    const types = [
      'LbMission.beginByTeacher_end',
      'controls_whileUntil',
      'logic_boolean',
      'controls_if',
      'Leanbot.objectInFront',
      'LbMotion.run',
      'LbMotion.stop',
      'vars_set_int',
    ];
    const toolbox = lessonToolbox(types, ['Leanbot.objectInFront']);
    if (toolbox.kind !== 'categoryToolbox') throw new Error('expected groups');
    expect(toolbox.contents.map((c) => c.name)).toEqual([
      '✨ Khối mới',
      'Logic',
      'Vòng lặp',
      'Leanbot',
      'Khác',
    ]);
  });
});
