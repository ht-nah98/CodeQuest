// Edge cases of rules 3–8 and 12–18 on top of fixtures/baseline (one fixture per rule lives in
// fixtures.test.ts).
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadContentFiles } from './load';
import { checkContent, publicAssetExists, type ContentFile, type Issue } from './rules';
import { countWords } from './words';

type Json = Record<string, unknown> & {
  hints?: Array<Record<string, unknown>>;
  levelIds?: string[];
};
type Tree = Map<string, Json>;

const baselineDir = fileURLToPath(new URL('../fixtures/baseline/', import.meta.url));
const baseline = loadContentFiles(baselineDir);
const W = 'worlds/w01-fixture';

function tree(): Tree {
  return new Map(baseline.map((file) => [file.path, JSON.parse(file.text) as Json]));
}

function get(t: Tree, path: string): Json {
  const value = t.get(path);
  if (value === undefined) throw new Error(`no ${path} in the tree`);
  return value;
}

const level = (t: Tree, id: string): Json => get(t, `${W}/levels/${id}.json`);
const world = (t: Tree): Json => get(t, `${W}/world.json`);

function run(t: Tree): { errors: Issue[]; warnings: Issue[] } {
  const files: ContentFile[] = [...t].map(([path, value]) => ({
    path,
    text: JSON.stringify(value),
  }));
  const report = checkContent(files);
  return { errors: report.issues, warnings: report.warnings };
}

function rules(issues: Issue[]): number[] {
  return issues.map((issue) => issue.rule);
}

/** Solution-style workspace: cq_start then a chain of blocks. */
function program(types: string[]): object {
  const chain = types.reduceRight<object | undefined>(
    (next, type, index) => ({
      type,
      id: `p${String(index)}`,
      ...(next !== undefined && { next: { block: next } }),
    }),
    undefined,
  );
  return {
    blocks: {
      languageVersion: 0,
      blocks: [
        { type: 'cq_start', id: 'start', ...(chain !== undefined && { next: { block: chain } }) },
      ],
    },
  };
}

/** Moves the baseline world into another folder (and id), keeping everything consistent. */
function renameWorld(t: Tree, id: string): Tree {
  const out: Tree = new Map();
  for (const [path, value] of t) {
    const moved = path.replace(W, `worlds/${id}`);
    out.set(moved, value.worldId === undefined ? value : { ...value, worldId: id });
  }
  get(out, `worlds/${id}/world.json`).id = id;
  return out;
}

describe('countWords', () => {
  it('counts Vietnamese syllables and ignores emoji and punctuation', () => {
    expect(countWords('Nhảy qua hố để tới lá cờ nhé!')).toBe(8);
    expect(countWords('🎋 Măng — đi 3 ô !')).toBe(4);
    expect(countWords('  ')).toBe(0);
  });
});

describe('rule 3', () => {
  it('reports a duplicate levelIds entry', () => {
    const t = tree();
    world(t).levelIds?.push('w01-l01');
    expect(run(t).errors).toEqual([
      { path: `${W}/world.json`, rule: 3, message: 'levelIds lists "w01-l01" twice' },
    ]);
  });

  it('reports a level listed by two worlds', () => {
    const t = tree();
    const other = { ...world(t), id: 'w02-other', order: 2, levelIds: ['w01-l01'], lessonIds: [] };
    t.set('worlds/w02-other/world.json', other);
    const messages = run(t).errors.map((issue) => `${String(issue.rule)} ${issue.message}`);
    expect(messages).toContain('3 levelIds lists "w01-l01", which lives in worlds/w01-fixture/');
    expect(messages).toContain('3 level "w01-l01" is in the levelIds of w01-fixture, w02-other');
  });

  it('reports a level that no world lists', () => {
    const t = tree();
    world(t).levelIds = ['w01-l01', 'w01-l02', 'w01-boss'];
    expect(rules(run(t).errors)).toEqual([3]);
  });

  it('requires worldId to match the world folder', () => {
    const t = tree();
    level(t, 'w01-l02').worldId = 'w01-other';
    expect(run(t).errors).toEqual([
      {
        path: `${W}/levels/w01-l02.json`,
        rule: 3,
        message: 'worldId "w01-other" must equal its world folder "w01-fixture"',
      },
    ]);
  });
});

describe('rule 4', () => {
  it('does not count a retired boss', () => {
    const t = tree();
    level(t, 'w01-boss').retired = true;
    expect(rules(run(t).errors)).toEqual([4]);
  });

  it('allows at most one creative level', () => {
    const t = tree();
    for (const id of ['w01-creative', 'w01-bonus01']) {
      t.set(`${W}/levels/${id}.json`, {
        ...level(t, 'w01-l01'),
        id,
        stage: 'creative',
        mode: 'creative',
      });
      world(t).levelIds?.push(id);
    }
    expect(run(t).errors.map((issue) => issue.message)).toEqual([
      'world has 2 creative levels; expected at most 1',
    ]);
  });

  it('only warns for a provisional world (w01-lang-tre until P1-12)', () => {
    const t = renameWorld(tree(), 'w01-lang-tre');
    get(t, 'worlds/w01-lang-tre/world.json').lessonIds = [];
    const { errors, warnings } = run(t);
    expect(errors).toEqual([]);
    expect(warnings).toEqual([
      {
        path: 'worlds/w01-lang-tre/world.json',
        rule: 4,
        message: 'world has no lesson (provisional world until P1-12)',
      },
    ]);
  });
});

describe('rule 7', () => {
  it('rejects a new block in a predict level', () => {
    const t = tree();
    level(t, 'w01-l03').initialWorkspace = program(['runner_walk', 'runner_crouch']);
    const messages = run(t).errors.map((issue) => `${String(issue.rule)} ${issue.message}`);
    expect(messages).toContain(
      '7 block "runner_crouch" first appears here (practice/predict); must be build or parsons',
    );
  });

  it('rejects a new block in a boss level', () => {
    const t = tree();
    level(t, 'w01-boss').toolbox = ['runner_walk', 'runner_jump', 'runner_kick'];
    expect(run(t).errors.map((issue) => issue.message)).toEqual([
      'block "runner_kick" first appears here (boss/bughunt); must be guided or practice',
    ]);
  });

  it('needs point "block:<type>" in a parsons level', () => {
    const t = tree();
    world(t).levelIds = ['w01-l02', 'w01-l01', 'w01-l03', 'w01-boss'];
    const l02 = level(t, 'w01-l02');
    l02.hints = [
      { id: 'a', when: { trigger: 'enter' }, say: 'Khối đi', point: 'block:runner_walk' },
    ];
    expect(run(t).errors.map((issue) => issue.message)).toEqual([
      'block "runner_jump" first appears here (practice/parsons); needs a hint with point "block:runner_jump"',
    ]);
  });

  it('follows world.order across worlds', () => {
    const t = tree();
    const second = renameWorld(tree(), 'w02-second');
    for (const [path, value] of second) {
      if (path.startsWith('worlds/')) {
        const renamed = path.replace(/\/w01-(l\d\d|boss|lesson)/, '/w02-$1');
        const id = typeof value.id === 'string' ? value.id.replace(/^w01-/, 'w02-') : value.id;
        t.set(renamed, { ...value, id });
      }
    }
    const w02 = get(t, 'worlds/w02-second/world.json');
    w02.order = 2;
    w02.id = 'w02-second';
    w02.levelIds = ['w02-l01', 'w02-l02', 'w02-l03', 'w02-boss'];
    w02.lessonIds = ['w02-lesson'];
    // runner_crouch first shows up in world 2's guided level, which points to it: fine.
    const w02l01 = get(t, 'worlds/w02-second/levels/w02-l01.json');
    w02l01.toolbox = ['runner_walk', 'runner_jump', 'runner_crouch'];
    w02l01.hints = [
      { id: 'c', when: { trigger: 'enter' }, say: 'Khối cúi', point: 'toolbox:runner_crouch' },
    ];
    expect(run(t).errors).toEqual([]);
    // Swapping the order makes world 2 the first place for runner_walk/jump: no hint there now.
    w02.order = 1;
    world(t).order = 2;
    expect(run(t).errors.map((issue) => issue.message)).toEqual([
      'block "runner_walk" first appears here (guided/build); needs a hint with point "toolbox:runner_walk"',
      'block "runner_jump" first appears here (guided/build); needs a hint with point "toolbox:runner_jump"',
    ]);
  });
});

describe('retired levels', () => {
  it('do not count as the first appearance of a block (rule 7)', () => {
    const t = tree();
    const intro = { ...level(t, 'w01-l01'), id: 'w01-l00', retired: true };
    intro.hints = [];
    t.set(`${W}/levels/w01-l00.json`, intro);
    world(t).levelIds = ['w01-l00', 'w01-l01', 'w01-l02', 'w01-l03', 'w01-boss'];
    expect(run(t).errors).toEqual([]);
    level(t, 'w01-l01').hints = [];
    expect(run(t).errors.map((issue) => issue.path)).toEqual([
      `${W}/levels/w01-l01.json`,
      `${W}/levels/w01-l01.json`,
    ]);
  });
});

describe('predict levels', () => {
  it('skip rules 9–11 for an optional solution', () => {
    const t = tree();
    level(t, 'w01-l03').solution = level(t, 'w01-l01').solution;
    expect(run(t).errors).toEqual([]);
  });
});

describe('rule 8', () => {
  it('warns about more than 3 build levels in a row', () => {
    const t = tree();
    const ids = ['w01-l04', 'w01-l05', 'w01-l06'];
    for (const id of ids) t.set(`${W}/levels/${id}.json`, { ...level(t, 'w01-l01'), id });
    world(t).levelIds = ['w01-l01', ...ids, 'w01-l02', 'w01-l03', 'w01-boss'];
    const { errors, warnings } = run(t);
    expect(errors).toEqual([]);
    expect(warnings.map((issue) => issue.message)).toEqual([
      '4 build levels in a row (w01-l01, w01-l04, w01-l05, w01-l06); max 3',
    ]);
  });
});

describe('draft folders', () => {
  it('skip rules 3–8 but keep the run rules', () => {
    const t = tree();
    // No misconception and a 6-word title: rules 5–6 do not apply to drafts.
    const draft = {
      ...level(t, 'w01-l01'),
      id: 'try',
      worldId: '_draft',
      title: 'Một hai ba bốn năm sáu',
      misconception: undefined, // dropped by JSON.stringify
    };
    t.set('worlds/_draft/levels/try.json', draft);
    expect(run(t).errors).toEqual([]);
    t.set('worlds/_draft/levels/try.json', { ...draft, par: 2 });
    expect(rules(run(t).errors)).toEqual([10]);
  });
});

describe('rule 5', () => {
  it('limits title and hint words', () => {
    const t = tree();
    const l01 = level(t, 'w01-l01');
    l01.title = 'Măng nhảy qua cái hố';
    expect(run(t).errors).toEqual([]);
    l01.title = 'Măng nhảy qua cái hố to';
    const hint = l01.hints?.[0];
    if (hint !== undefined) hint.say = 'Một hai ba bốn năm sáu bảy tám chín mười mười một mười hai';
    expect(run(t).errors.map((issue) => issue.message)).toEqual([
      'title has 6 words > 5: "Măng nhảy qua cái hố to"',
      'hint "walk-new" say has 14 words > 12: "Một hai ba bốn năm sáu bảy tám chín mười mười một mười hai"',
    ]);
  });
});

describe('rule 6', () => {
  it('needs a thinkingHint except in creative levels', () => {
    const t = tree();
    delete level(t, 'w01-boss').thinkingHint;
    expect(run(t).errors.map((issue) => issue.message)).toEqual([
      'every non-creative level needs a thinkingHint',
    ]);
  });
});

describe('rule 12', () => {
  it('rejects shadow blocks in a level with maxBlocks', () => {
    const t = tree();
    const l01 = level(t, 'w01-l01');
    l01.maxBlocks = 4;
    l01.solution = {
      blocks: {
        languageVersion: 0,
        blocks: [
          {
            type: 'cq_start',
            id: 'start',
            next: {
              block: {
                type: 'runner_walk',
                id: 'w1',
                next: {
                  block: {
                    type: 'runner_jump',
                    id: 'j1',
                    next: { block: { type: 'runner_walk', id: 'w2' } },
                  },
                },
              },
              shadow: { type: 'runner_walk', id: 's1' },
            },
          },
        ],
      },
    };
    expect(run(t).errors.map((issue) => `${String(issue.rule)} ${issue.message}`)).toEqual([
      '12 solution has 1 shadow block(s) but the level sets maxBlocks',
    ]);
  });
});

describe('rules 13–15', () => {
  it('13: a parsons start that already wins', () => {
    const t = tree();
    level(t, 'w01-l02').initialWorkspace = program(['runner_walk', 'runner_jump', 'runner_walk']);
    expect(run(t).errors.map((issue) => issue.message)).toEqual(['initialWorkspace already wins']);
  });

  it('14: a bughunt fix needs at most parEdits edits', () => {
    const t = tree();
    level(t, 'w01-boss').initialWorkspace = program(['runner_jump', 'runner_jump', 'runner_jump']);
    expect(run(t).errors.map((issue) => issue.message)).toEqual([
      'editDistance(initialWorkspace, solution) is 2 > parEdits 1',
    ]);
    level(t, 'w01-boss').parEdits = 2;
    expect(run(t).errors).toEqual([]);
  });

  it('15: predict answer key must match one option', () => {
    const t = tree();
    level(t, 'w01-l03').initialWorkspace = program(['runner_walk', 'runner_jump', 'runner_walk']);
    expect(run(t).errors).toEqual([]);
    level(t, 'w01-l03').initialWorkspace = program(['runner_walk', 'runner_jump']);
    expect(run(t).errors.map((issue) => issue.message)).toEqual([
      'answerKey "stop@3" matches 0 options (win, stop@1, crash:FELL_IN_HOLE@2); expected exactly 1',
    ]);
  });
});

describe('rule 16', () => {
  it('reads lastReason inside nested conditions and checks block: targets', () => {
    const t = tree();
    level(t, 'w01-l02').hints = [
      {
        id: 'nested',
        when: { any: [{ lastReason: 'HIT_WALL' }, { not: { lastReason: 'TIMEOUT' } }] },
        say: 'Thử lại nhé',
        point: 'block:runner_kick',
      },
    ];
    expect(run(t).errors.map((issue) => issue.message)).toEqual([
      'hint "nested" points to block:runner_kick, which is in neither initialWorkspace nor solution',
      'hint "nested" waits for lastReason "HIT_WALL", which neither the engine nor "runner" produces',
    ]);
  });

  it('checks toolbox: targets', () => {
    const t = tree();
    level(t, 'w01-l01').toolbox = ['runner_jump', 'runner_walk'];
    const hint = level(t, 'w01-boss');
    hint.hints = [{ id: 'k', when: { trigger: 'enter' }, say: 'Đá', point: 'toolbox:runner_kick' }];
    expect(run(t).errors.map((issue) => issue.message)).toEqual([
      'hint "k" points to toolbox:runner_kick, which is not in the toolbox',
    ]);
  });
});

describe('rules 17–18', () => {
  it('17: a missing feedback.json fails once there are levels', () => {
    const t = tree();
    t.delete('shared/feedback.json');
    expect(run(t).errors).toEqual([
      { path: 'shared/feedback.json', rule: 17, message: 'file is missing' },
    ]);
    expect(checkContent([]).issues).toEqual([]);
  });

  it('18: assets must be absolute paths inside apps/web/public', () => {
    expect(publicAssetExists('/tiles/ground.png')).toBe(true);
    expect(publicAssetExists('/tiles/nope.png')).toBe(false);
    expect(publicAssetExists('/tiles')).toBe(false);
    expect(publicAssetExists('/../package.json')).toBe(false);
    expect(publicAssetExists('/../../../package.json')).toBe(false);
    const t = tree();
    world(t).theme = { tileset: 'tiles/ground.png' };
    get(t, `${W}/lessons/w01-lesson.json`).cards = [
      { type: 'say', pose: 'talk', text: 'Chào con', image: '/sprites/nope.png' },
    ];
    expect(run(t).errors.map((issue) => issue.message)).toEqual([
      'cards.0.image "/sprites/nope.png" is not a file in apps/web/public/',
      'theme.tileset "tiles/ground.png" is not a file in apps/web/public/',
    ]);
  });
});
