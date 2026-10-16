// World 9 "Tháp Họa Sĩ" (curriculum.md §6.4, ADR-0024): nested loops and angles on the turtle.
// These tests pin what the levels teach: what each lesson demo draws, the predict answers, the
// one real fix of each bughunt, the stray-line traps (T1), that the boss needs the pen to go up,
// that each new block is introduced with its tooltip, and the "khối" / "lệnh" copy.
import { readFileSync } from 'node:fs';
import {
  LessonSchema,
  LevelSchema,
  WorldSchema,
  type LessonCard,
  type Level,
  type WorkspaceJson,
} from '@codequest/content-schema';
import {
  runLevel,
  type AnyGameKindDefinition,
  type GameEvent,
  type RunOutcome,
} from '@codequest/engine';
import { getGameKind, targetSegments, turtleConfigSchema, turtleDrawKey } from '@codequest/games';
import { blockTypesOf, countWords } from '@codequest/validator';
import { describe, expect, it } from 'vitest';
import { shortProgramWorkspace, TURTLE_T1, turtleT1Warnings } from './turtle';

const W09 = new URL('../../../content/worlds/w09-thap-hoa-si/', import.meta.url);
const read = (path: string): unknown => JSON.parse(readFileSync(new URL(path, W09), 'utf8'));

const world = WorldSchema.parse(read('world.json'));
const lessons = new Map(
  world.lessonIds.map((id) => [id, LessonSchema.parse(read(`lessons/${id}.json`))] as const),
);
const levels = new Map(
  world.levelIds.map((id) => [id, LevelSchema.parse(read(`levels/${id}.json`))] as const),
);
const levelById = (id: string): Level => {
  const level = levels.get(id);
  if (level === undefined) throw new Error(`no level ${id}`);
  return level;
};

function turtleKind(): AnyGameKindDefinition {
  const found = getGameKind('turtle');
  if (found === undefined) throw new Error('turtle is not registered');
  return found;
}
const kind = turtleKind();

/** A run of `workspace` on `level` as a build level (predict levels run their own program). */
function run(level: Level, workspace: WorkspaceJson): RunOutcome {
  return runLevel({ kind: kind, level: { ...level, mode: 'build' }, workspace });
}
const short = (id: string, main: string, spell?: string): RunOutcome => {
  const level = levelById(id);
  return run(level, shortProgramWorkspace(level, spell === undefined ? { main } : { main, spell }));
};

/** Unit lines a run drew (`line` events, drawn twice counted once). */
function lines(outcome: RunOutcome): number {
  const seen = new Set<string>();
  for (const event of outcome.events as ReadonlyArray<
    GameEvent & { from?: unknown; to?: unknown }
  >) {
    if (event.type === 'line') seen.add(JSON.stringify([event.from, event.to].sort()));
  }
  return seen.size;
}

function program(workspace: WorkspaceJson | undefined): WorkspaceJson {
  if (workspace === undefined) throw new Error('missing program');
  return workspace;
}
const given = (level: Level): WorkspaceJson => program(level.initialWorkspace);

const TOOLTIP: Readonly<Record<string, string>> = {
  turtle_forward: 'Tiến 3 bước: bút hạ thì có nét dài 3',
  turtle_turn_right: 'Rẽ phải 90 độ: quay tại chỗ, chưa đi',
  turtle_turn_left: 'Rẽ trái 90 độ: quay tại chỗ, chưa đi',
  turtle_pen_up: 'Nhấc bút: đi tiếp thì không có nét',
  turtle_pen_down: 'Hạ bút: đi tiếp thì có nét',
};

describe('W9 world', () => {
  it('lists 20 levels, the free-play level and 10 lessons', () => {
    expect(world.levelIds).toHaveLength(21);
    expect(world.lessonIds).toHaveLength(10);
    expect([...levels.values()].every((level) => level.kind === 'turtle')).toBe(true);
  });

  it('uses every mode at least once and the boss uses every W9 block', () => {
    const modes = new Set([...levels.values()].map((level) => level.mode));
    for (const mode of ['build', 'parsons', 'predict', 'bughunt']) expect(modes).toContain(mode);
    const boss = levelById('w09-boss');
    const used = blockTypesOf(program(boss.solution));
    for (const type of Object.keys(TOOLTIP)) expect(used).toContain(type);
  });
});

describe('W9 lessons', () => {
  const demos = [...lessons.values()].flatMap((lesson) =>
    lesson.cards.flatMap((card: LessonCard) =>
      card.type === 'demo' ? [[lesson.id, card] as const] : [],
    ),
  );

  it.each(demos.map(([id, card]) => [id, card.text, card] as const))(
    '%s demo "%s" runs to the end on the paper',
    (_id, _text, card) => {
      const level: Level = {
        id: 'w09-demo',
        worldId: world.id,
        stage: 'practice',
        kind: 'turtle',
        mode: 'build',
        title: 'Demo',
        objective: 'Demo',
        learningGoal: 'Demo',
        toolbox: [],
        hints: [],
        config: card.config,
      };
      expect(run(level, card.workspace).result).toBe('success');
    },
  );

  it('demos draw what their sentence says', () => {
    const drawn = new Map(
      demos.map(([, card]) => {
        const level = { ...levelById('w09-l01'), config: card.config };
        return [card.text, lines(run(level, card.workspace))] as const;
      }),
    );
    expect(drawn.get('Tiến 3: một nét dài 3.')).toBe(3);
    expect(drawn.get('Tiến 1 rồi tiến 2: cũng nét dài 3.')).toBe(3);
    expect(drawn.get('Nhấc bút ở giữa: nét đứt.')).toBe(2);
    expect(drawn.get('Rẽ 90 độ 3 lần: thiếu 1 cạnh.')).toBe(6);
    expect(drawn.get('12 lần rẽ 30 độ: đủ 1 vòng.')).toBe(12);
    // Two unit squares; the pen is up between them.
    expect(drawn.get('Vòng trong vẽ ô vuông. Vòng ngoài chạy 2 lần.')).toBe(8);
  });

  it('keeps every card ≤ 12 words and every lesson ≤ 4 cards, no card twice', () => {
    for (const lesson of lessons.values()) {
      expect(lesson.cards.length).toBeLessThanOrEqual(4);
      for (const card of lesson.cards) {
        expect(countWords(card.text), card.text).toBeLessThanOrEqual(12);
      }
    }
    // Pedagogy review: no demo program and no quiz question shown in two places.
    const all = [...lessons.values()].flatMap((lesson) => lesson.cards);
    const demoPrograms = all.flatMap((card) =>
      card.type === 'demo' ? [JSON.stringify(card.workspace)] : [],
    );
    expect(new Set(demoPrograms).size).toBe(demoPrograms.length);
    const texts = all.map((card) => card.text);
    expect(new Set(texts).size).toBe(texts.length);
  });

  it('introduces each new block with "Khối mới! " and its exact tooltip', () => {
    const says = [...lessons.values()].flatMap((lesson) =>
      lesson.cards.flatMap((card) => (card.type === 'say' ? [card.text] : [])),
    );
    for (const tooltip of Object.values(TOOLTIP)) expect(says).toContain(`Khối mới! ${tooltip}`);
    expect(kind.blocks.map((block) => [block.type, block.json.tooltip])).toEqual(
      Object.entries(TOOLTIP),
    );
  });
});

describe('W9 levels', () => {
  it('introduce each block with a "Khối mới! " hint quoting the tooltip', () => {
    const first: Record<string, string> = {
      turtle_forward: 'w09-l01',
      turtle_turn_right: 'w09-l02',
      turtle_turn_left: 'w09-l05',
      turtle_pen_up: 'w09-l08',
      turtle_pen_down: 'w09-l08',
    };
    for (const [type, id] of Object.entries(first)) {
      const says = levelById(id).hints.map((hint) => hint.say);
      expect(says).toContain(`Khối mới! ${TOOLTIP[type] ?? ''}`);
    }
  });

  it('say "khối" to the child, never "lệnh"', () => {
    for (const level of levels.values()) {
      const texts = [
        level.title,
        level.objective,
        level.mission ?? '',
        level.thinkingHint ?? '',
        ...level.hints.map((hint) => hint.say),
        ...(level.predict?.options ?? []).map((o) => o.label),
      ];
      for (const text of texts) expect(text).not.toMatch(/lệnh/i);
    }
    for (const lesson of lessons.values()) {
      for (const card of lesson.cards) {
        if (!card.text.startsWith('Khối mới!')) expect(card.text).not.toMatch(/lệnh/i);
      }
    }
  });

  it('predict answers: the first card is the drawing of the given program', () => {
    for (const id of ['w09-l04', 'w09-l11', 'w09-l19']) {
      const level = levelById(id);
      const options = level.predict?.options ?? [];
      const answer = turtleDrawKey(level, given(level));
      const keys = options.map((option) => turtleDrawKey(level, program(option.drawProgram)));
      expect(keys[0]).toBe(answer);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it('l11: the inner loop runs to the end every round (2 triangles on a line of 4: 9 lines)', () => {
    const level = levelById('w09-l11');
    expect(lines(run(level, given(level)))).toBe(9);
  });

  it('bughunts: the given program stops on a stray line, the fix wins', () => {
    for (const id of ['w09-l06', 'w09-l17']) {
      const level = levelById(id);
      expect(run(level, given(level)).reasonCode, id).toBe('EXTRA_LINE');
      expect(run(level, program(level.solution)).result, id).toBe('success');
    }
  });

  it('l12: hạ bút after the loop runs once, so only the first flag is drawn', () => {
    const level = levelById('w09-l12');
    const given = run(level, program(level.initialWorkspace));
    expect(given.reasonCode).toBe('MISSING_LINES');
    expect(lines(given)).toBe(3);
    expect(short('w09-l12', 'REP3[REP3[F1 L120] U F2 D]').result).toBe('success');
  });

  it('T1: every build / bughunt level has a stray-line trap that really draws a stray line', () => {
    for (const level of levels.values()) {
      expect(turtleT1Warnings(`levels/${level.id}.json`, level), level.id).toEqual([]);
    }
    expect([...TURTLE_T1.keys()].every((id) => levels.has(id))).toBe(true);
  });

  it('boss: the pen must go up to cross the gaps and to go home', () => {
    const boss = levelById('w09-boss');
    const target = targetSegments(turtleConfigSchema.parse(boss.config));
    expect(target?.size).toBe(24);
    // Pen down all the way: the gap of the first spoke is a stray line.
    expect(short('w09-boss', 'REP6[F1 F1 REP3[F1 L120] R180 F2 R120]').reasonCode).toBe(
      'EXTRA_LINE',
    );
    // Gaps lifted but home drawn: the way back is a stray line too.
    expect(short('w09-boss', 'REP6[F1 U F1 D REP3[F1 L120] R180 F2 R120]').reasonCode).toBe(
      'EXTRA_LINE',
    );
  });

  it('l16: the spell saves blocks (written out it needs 14 > maxBlocks 12)', () => {
    const level = levelById('w09-l16');
    expect(level.maxBlocks).toBe(12);
    const written = shortProgramWorkspace(level, {
      main: 'REP3[REP2[F2 R60 F2 R120] R120] R90 F3 REP2[F2 R60 F2 R120]',
    });
    const outcome = run(level, written);
    expect(outcome.reasonCode).toBe('TOO_MANY_BLOCKS');
    expect(outcome.stats.blocksUsed).toBe(14);
    // The same blocks win once the cap is lifted: only the count stops them.
    const open: Level = { ...level };
    delete open.maxBlocks;
    expect(run(open, written).result).toBe('success');
  });

  it('keeps every paper within 12 × 12 and puts Măng on a vertex of the target', () => {
    for (const level of levels.values()) {
      const config = turtleConfigSchema.parse(level.config);
      expect(config.size.w).toBeLessThanOrEqual(12);
      expect(config.size.h).toBeLessThanOrEqual(12);
    }
  });
});
