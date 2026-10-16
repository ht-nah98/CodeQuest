// Writes content/worlds/w08-xuong-phep-thuat/ (world.json, lessons, 20 levels + creative) from
// designs.ts, and refuses to write when a solution loses, a trap wins or predict keys clash.
// Run from the repo root: `npx tsx tools/content-gen/w08/gen.ts` (README.md). 🟨 nháp.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Level, Lesson, LessonCard, World } from '@codequest/content-schema';
import { DEMOS, LEVELS, type DemoSpec, type LevelSpec } from './designs';
import {
  Builder,
  defBlock,
  keyOn,
  play,
  size,
  startBlock,
  workspace,
  type Item,
  type Prog,
} from './dsl';

const WORLD_ID = 'w08-xuong-phep-thuat';
const OUT = resolve(process.cwd(), 'content/worlds', WORLD_ID);
const problems: string[] = [];

/** Parsons pieces: `cq_start`, one empty `dạy phép` per spell and every other block loose. */
function parsonsWorkspace(spec: LevelSpec): Level['initialWorkspace'] {
  const b = new Builder(spec.kind);
  const p = spec.solution;
  const flat = (items: Prog['main']): Prog['main'] =>
    items.flatMap((item) =>
      typeof item === 'object' && ('rep' in item || 'rv' in item || 'until' in item)
        ? [{ ...item, b: [] }, ...flat(item.b)]
        : [item],
    );
  const loose = [...flat(p.main), ...Object.values(p.defs ?? {}).flatMap(flat)];
  const blocks = [
    startBlock(b, []),
    ...Object.keys(p.defs ?? {}).map((id, i) => defBlock(p, id, [], b, i)),
    ...loose.map((item, i) => ({
      ...b.block(item),
      x: 40 + (i % 2) * 300,
      y: 300 + Math.floor(i / 2) * 75,
    })),
  ];
  return { blocks: { languageVersion: 0, blocks } } as Level['initialWorkspace'];
}

function initialOf(spec: LevelSpec): Level['initialWorkspace'] | undefined {
  if (spec.mode === 'predict') return workspace(spec.kind, spec.solution);
  if (spec.initial === 'parsons') return parsonsWorkspace(spec);
  if (spec.initial !== undefined) return workspace(spec.kind, spec.initial);
  return undefined;
}

function predictOf(spec: LevelSpec): Level['predict'] {
  if (spec.predict === undefined) throw new Error(`${spec.id}: predict copy missing`);
  const right = keyOn(spec, spec.solution);
  const wrong = (spec.wrong ?? []).map((w) => keyOn(spec, w.prog));
  const keys = [right, ...wrong];
  if (keys.some((k) => k === undefined) || new Set(keys).size !== keys.length) {
    problems.push(`${spec.id}: predict keys ${keys.join(', ')}`);
  }
  const labels = [spec.predict.right, ...spec.predict.wrong];
  const options = keys.map((key, i) => ({ key: key ?? '?', label: labels[i] ?? '?' }));
  // The right card is not always first: rotate by the level number.
  const shift = Number(spec.id.slice(-2)) % options.length;
  return { options: [...options.slice(shift), ...options.slice(0, shift)] };
}

/**
 * Critic check (review 2): when spell B always follows spell A, one merged spell "A then B"
 * must not win in fewer blocks than `par`.
 */
function mergeProblems(spec: LevelSpec): string[] {
  const p = spec.solution;
  const defs = p.defs ?? {};
  const ids = Object.keys(defs).filter((id) => p.params?.[id] === undefined);
  const out: string[] = [];
  for (const a of ids) {
    for (const b of ids) {
      if (a === b) continue;
      const main: Item[] = [];
      for (let i = 0; i < p.main.length; i++) {
        const x = p.main[i];
        const y = p.main[i + 1];
        const isCall = (item: Item | undefined, id: string): boolean =>
          typeof item === 'object' && 'call' in item && item.call === id;
        if (isCall(x, a) && isCall(y, b)) {
          main.push({ call: 'merged' });
          i++;
        } else if (x !== undefined) main.push(x);
      }
      const left = JSON.stringify(main);
      if (left.includes(`"call":"${a}"`) || left.includes(`"call":"${b}"`)) continue;
      const rest = Object.fromEntries(Object.entries(defs).filter(([id]) => id !== a && id !== b));
      const merged: Prog = {
        ...p,
        main,
        defs: { ...rest, merged: [...(defs[a] ?? []), ...(defs[b] ?? [])] },
      };
      const proc = { id: 'merged', name: 'gộp' };
      const design = { ...spec, procedures: [...(spec.procedures ?? []), proc] };
      if (size(merged) < size(p) && play(design, merged).result === 'success') {
        out.push(
          `${spec.id}: merging ${a}+${b} wins in ${String(size(merged))} < par ${String(size(p))}`,
        );
      }
    }
  }
  return out;
}

function verify(spec: LevelSpec): void {
  problems.push(...mergeProblems(spec));
  if (spec.mode === 'predict') return;
  const won = play(spec, spec.solution);
  if (won.result !== 'success')
    problems.push(`${spec.id}: solution ${won.result} ${String(won.reasonCode)}`);
  for (const w of spec.wrong ?? []) {
    const o = play(spec, w.prog);
    if (o.result === 'success') problems.push(`${spec.id}: trap "${w.name}" wins`);
  }
}

function levelJson(spec: LevelSpec): Level {
  verify(spec);
  const [config, ...variants] = spec.maps;
  const initialWorkspace = initialOf(spec);
  const level: Level = {
    id: spec.id,
    worldId: WORLD_ID,
    stage: spec.stage,
    kind: spec.kind,
    mode: spec.mode,
    title: spec.title,
    objective: spec.objective,
    learningGoal: spec.learningGoal,
    ...(spec.misconception === undefined ? {} : { misconception: spec.misconception }),
    mission: spec.mission,
    toolbox: spec.toolbox,
    ...(spec.maxBlocks === undefined ? {} : { maxBlocks: spec.maxBlocks }),
    ...(spec.maxInstances === undefined ? {} : { maxInstances: spec.maxInstances }),
    maxLoopDepth: 1,
    ...(spec.mode === 'predict' ? {} : { par: size(spec.solution) }),
    ...(spec.parUnproven === undefined ? {} : { parUnproven: spec.parUnproven }),
    ...(spec.parEdits === undefined ? {} : { parEdits: spec.parEdits }),
    ...(spec.procedures === undefined ? {} : { procedures: spec.procedures }),
    config,
    ...(variants.length > 0 ? { variants } : {}),
    ...(initialWorkspace === undefined ? {} : { initialWorkspace }),
    ...(spec.mode === 'predict'
      ? { predict: predictOf(spec) }
      : { solution: workspace(spec.kind, spec.solution) }),
    hints: spec.hints,
    thinkingHint: spec.thinkingHint,
    ...(spec.feedback === undefined ? {} : { feedback: spec.feedback }),
  };
  return level;
}

// ---------------------------------------------------------------- lessons
const say = (text: string, pose: 'talk' | 'point' | 'think' | 'happy' = 'talk'): LessonCard => ({
  type: 'say',
  pose,
  text,
});
const quiz = (text: string, options: string[], explain: string): LessonCard => ({
  type: 'quiz',
  text,
  options,
  correct: 0,
  explain,
});
function demo(text: string, d: DemoSpec): LessonCard {
  return {
    type: 'demo',
    text,
    kind: 'maze',
    config: d.map,
    procedures: d.procedures,
    workspace: workspace('maze', d.prog),
  };
}

const LESSONS: Lesson[] = [
  {
    id: 'w08-lesson',
    worldId: WORLD_ID,
    title: 'Xưởng Phép Thuật',
    cards: [
      say('Bác Cú mở Xưởng Phép Thuật. Vào xem nào!', 'happy'),
      say('Phép thuật là một nhóm khối có tên.'),
      say('Khối mới! Dạy phép: nhớ các lệnh bên trong, chưa làm ngay', 'point'),
      demo('Chỉ dạy phép thì Măng chưa làm.', DEMOS.teach),
      say('Khối mới! Làm phép: làm hết lệnh trong phép, rồi làm tiếp', 'point'),
      demo('Làm phép xong, Măng làm tiếp khối sau.', DEMOS.cast),
      quiz(
        'Dạy phép xong, Măng có làm ngay không?',
        ['Chưa, phải làm phép', 'Có, làm ngay'],
        'Dạy phép chỉ nhớ các khối. Làm phép thì Măng mới làm.',
      ),
      quiz(
        'Làm phép xong thì sao?',
        ['Làm khối tiếp theo', 'Dừng lại'],
        'Làm hết phép, Măng quay lại làm khối ngay sau.',
      ),
    ],
  },
  {
    id: 'w08-lesson-sua-phep',
    worldId: WORLD_ID,
    title: 'Sửa phép',
    beforeLevel: 'w08-l05',
    cards: [
      say('Sửa trong phép 1 lần, đúng ở mọi chỗ.', 'point'),
      demo('Phép sai 1 khối. Lần làm phép nào cũng sai.', DEMOS.bug),
      demo('Sửa 1 khối trong phép. Cả 3 chỗ đều đúng!', DEMOS.cast),
      quiz(
        'Phép sai 1 khối, làm phép 3 lần. Sửa mấy chỗ?',
        ['1 chỗ, trong phép', '3 chỗ'],
        '3 lần làm phép dùng chung 1 phép. Sửa phép là đủ.',
      ),
    ],
  },
  {
    id: 'w08-lesson-phep-trong-lap',
    worldId: WORLD_ID,
    title: 'Phép trong vòng lặp',
    beforeLevel: 'w08-l08',
    cards: [
      say('Làm phép trong vòng lặp: mỗi vòng làm phép 1 lần.', 'point'),
      demo('Làm phép, tiến 2 ô, rồi lặp 3 lần làm phép.', DEMOS.loop),
      quiz(
        'Lặp 3 lần, làm phép. Phép chạy mấy lần?',
        ['3 lần', '1 lần'],
        'Mỗi vòng làm phép 1 lần. 3 vòng là 3 lần.',
      ),
    ],
  },
  {
    id: 'w08-lesson-hai-phep',
    worldId: WORLD_ID,
    title: '2 phép',
    beforeLevel: 'w08-l09',
    cards: [
      say('Mỗi phép một tên. Gọi tên nào, làm phép đó.', 'point'),
      demo('Lên bậc 2 lần, xuống bậc 2 lần: Măng tới cờ.', DEMOS.two),
      demo('Đổi tên 1 khối làm phép: Măng đâm tường.', DEMOS.twoSwap),
      quiz(
        'Đổi tên trên khối làm phép. Măng đi có khác không?',
        ['Khác', 'Vẫn vậy'],
        'Tên khác thì phép khác, Măng đi khác.',
      ),
    ],
  },
  {
    id: 'w08-lesson-phep-hoi',
    worldId: WORLD_ID,
    title: 'Phép biết hỏi',
    beforeLevel: 'w08-l11',
    cards: [
      say('Phép có câu hỏi thì dùng được cho đường dài, ngắn.', 'point'),
      demo('Ngã rẽ đầu gần, ngã rẽ sau xa. Cùng 1 phép!', DEMOS.fork),
      quiz(
        'Phép có câu hỏi. Đường dài hơn thì sao?',
        ['Vẫn đúng', 'Phải dạy phép mới'],
        'Câu hỏi giúp Măng biết khi nào tới ngã rẽ.',
      ),
    ],
  },
  {
    id: 'w08-lesson-hop-cua-phep',
    worldId: WORLD_ID,
    title: 'Hộp của phép',
    beforeLevel: 'w08-l13',
    cards: [
      say('Khối mới! Dạy phép với hộp: làm phép thì hộp nhận số', 'point'),
      say('Khối mới! Làm phép với số: hộp của phép nhận số này', 'point'),
      demo('Làm phép với 2, rồi với 1.', DEMOS.box),
      say('Mỗi lần làm phép, hộp nhận số mới.', 'think'),
      quiz('Làm phép với 4, rồi với 1. Đi mấy ô?', ['5 ô', '8 ô'], 'Hộp có 4, rồi có 1: đi 5 ô.'),
    ],
  },
];

// ---------------------------------------------------------------- creative + world
const creative: Level = {
  id: 'w08-creative',
  worldId: WORLD_ID,
  stage: 'creative',
  kind: 'robotlab',
  mode: 'creative',
  title: 'Xưởng phép tự do',
  objective: 'Tự dạy phép cho Bíp trên sa bàn lớn!',
  learningGoal: 'Sa bàn Thành Phố Măng: tự đặt việc cho 3 phép (1 phép có hộp số ô).',
  mission: 'Dạy Bíp 3 phép của riêng con!',
  toolbox: [
    'robot_forward',
    'robot_turn_left',
    'robot_turn_right',
    'robot_grab',
    'robot_release',
    'cq_repeat',
    'cq_repeat_until',
    'robot_block_color',
    'robot_at_lab',
    'cq_proc_def',
    'cq_proc_call',
    'cq_proc_def_n',
    'cq_proc_call_n',
    { type: 'cq_repeat_var', fields: { VAR: 'cells' } },
  ],
  procedures: [
    { id: 'spell1', name: 'phép 1' },
    { id: 'spell2', name: 'phép 2' },
    { id: 'spell3', name: 'phép 3', param: { id: 'cells', name: 'số ô', max: 9 } },
  ],
  config: {
    map: [
      'y##.#...g',
      '......##.',
      '.##.#....',
      '.##L#.##.',
      '....#..ZZ',
      '#.#...##r',
      '....#....',
    ],
    startDir: 'N',
    blocks: [
      { kind: 'fence', at: [0, 5] },
      { kind: 'fence', at: [3, 5] },
      { kind: 'neutralizer', color: 'RED', at: [2, 7] },
      { kind: 'neutralizer', color: 'YELLOW', at: [6, 7] },
      { kind: 'neutralizer', color: 'GREEN', at: [2, 0] },
      { kind: 'pollution', color: 'GREEN', at: [4, 2] },
      { kind: 'pollution', color: 'RED', at: [0, 7] },
      { kind: 'pollution', color: 'RED', at: [6, 3] },
    ],
    goal: { type: 'score', target: 300 },
  },
  hints: [
    {
      id: 'free',
      when: { trigger: 'enter' },
      say: 'Xưởng tự do! Dạy phép nào, làm phép nào cũng được.',
      point: 'stage',
    },
  ],
};

const world: World = {
  id: WORLD_ID,
  order: 8,
  title: 'Xưởng Phép Thuật',
  emoji: '🪄',
  concept: 'Hàm: đặt tên cho một nhóm khối, làm phép nhiều lần; phép có hộp số',
  story: 'Gió thổi bay chữ trong sách phép của bác Cú. Măng viết lại từng phép.',
  chapters: [
    {
      id: 'sach-phep',
      title: 'Sách phép trống trơn',
      lines: [
        'Bác Cú có cuốn sách phép thuật.',
        'Gió của phù thủy thổi bay hết chữ.',
        'Bác Cú dạy Măng: phép là nhóm khối có tên.',
      ],
      art: { cast: ['owl'], prop: 'spellbook' },
    },
    {
      id: 'phep-dau-tien',
      title: 'Phép đầu tiên',
      unlockAfter: 'w08-l04',
      lines: ['Măng dạy phép, rồi làm phép ở nhiều chỗ.', 'Gấu nâu khen: đỡ mỏi tay quá!'],
      art: { cast: ['bear'], prop: 'wand' },
    },
    {
      id: 'bip-hoc-phep',
      title: 'Bíp cũng học phép',
      unlockAfter: 'w08-l05',
      lines: ['Bíp cũng muốn học phép.', 'Măng dạy Bíp phép giao khối trung hòa.'],
      art: { cast: ['owl'], prop: 'robot' },
    },
    {
      id: 'phep-co-hop',
      title: 'Phép có hộp',
      unlockAfter: 'w08-l12',
      lines: ['Bác Cú mở trang cuối sách phép.', 'Phép này có 1 chiếc hộp nhỏ.'],
      art: { cast: ['owl'], prop: 'box' },
    },
    {
      id: 'ngay-hoi',
      title: 'Ngày hội phép thuật',
      unlockAfter: 'w08-boss',
      lines: ['Bíp dọn sạch thành phố bằng 2 phép.', 'Cô Thỏ gọi: lên Tháp Họa Sĩ vẽ nhé!'],
      art: { cast: ['bunny', 'owl'], prop: 'wand' },
    },
  ],
  theme: { tileset: '/tiles/ground.png', palette: 'day', scene: 'xuong-phep-thuat' },
  lessonIds: LESSONS.map((l) => l.id),
  levelIds: [...LEVELS.map((l) => l.id), creative.id],
  unlock: { minStarRatio: 0.6 },
  unplugged: {
    title: 'Thẻ phép thuật',
    steps: [
      'Mỗi nhóm có thẻ trống ghi tên phép, ví dụ "phép lò cò".',
      'Một bé viết lên thẻ 3 động tác: nhảy, nhảy, xoay.',
      'Bạn đọc: "bước, làm phép lò cò, bước, làm phép lò cò".',
      'Vòng 2: chỉ đọc thẻ phép mà không làm phép. Bạn kia có làm không?',
      'Vòng 3: thẻ "phép bước với hộp số bước". Đọc "làm phép bước với 3".',
    ],
  },
};

const levels = LEVELS.map(levelJson);
if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}
mkdirSync(resolve(OUT, 'levels'), { recursive: true });
mkdirSync(resolve(OUT, 'lessons'), { recursive: true });
const write = (path: string, data: unknown): void => {
  writeFileSync(resolve(OUT, path), `${JSON.stringify(data, null, 2)}\n`);
};
write('world.json', world);
for (const level of [...levels, creative]) write(`levels/${level.id}.json`, level);
for (const lesson of LESSONS) write(`lessons/${lesson.id}.json`, lesson);
console.log(`w08: ${String(levels.length + 1)} levels, ${String(LESSONS.length)} lessons → ${OUT}`);
