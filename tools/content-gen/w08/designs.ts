// World 8 "Xưởng Phép Thuật" (curriculum.md §6.3, §6.3.1): every level, lesson demo and the
// copy the child sees. Maze maps are the ones pinned in §6.3.1 (carved from each solution path,
// P4-10). Copy rules: ≤ 12 words, digits for counts, "khối" (never "lệnh" outside a quoted
// tooltip), hints as questions, robot cubes named by kind and colour. 🟨 nháp, chờ HLV chơi thử.
import type { Condition, HintRule, LevelProcedure, ToolboxEntry } from '@codequest/content-schema';
import type { Design, Item, Prog } from './dsl';

const MOVES = ['maze_forward', 'maze_turn_left', 'maze_turn_right'];
const DEF = 'cq_proc_def';
const CALL = 'cq_proc_call';
const DEFN = 'cq_proc_def_n';
const CALLN = 'cq_proc_call_n';
const ROBOT = [
  'robot_forward',
  'robot_turn_left',
  'robot_turn_right',
  'robot_grab',
  'robot_release',
];
const F1: ToolboxEntry = { type: 'robot_forward', fields: { N: 1 } };
const boxLoop = (id: string): ToolboxEntry => ({ type: 'cq_repeat_var', fields: { VAR: id } });

const s = (id: string): Item => ({ call: id });
const sn = (id: string, n: number): Item => ({ calln: id, n });
const maze = (rows: string, startDir: string) => ({ map: rows.split('/'), startDir });
const ran = (reason: string): Condition => ({ trigger: 'run-end', lastReason: reason });

// ---------------------------------------------------------------- spell bodies (§6.3.1 họ hình)
const STAIR: Item[] = ['F', 'L', 'F', 'R'];
const STAIR_DOWN: Item[] = ['F', 'R', 'F', 'L'];
const CORNER_R: Item[] = ['F', 'F', 'R', 'F'];
const CORNER_L: Item[] = ['F', 'F', 'L', 'F'];
const HOP: Item[] = ['F', 'F', 'L', 'F', 'R'];
const SHELF: Item[] = ['L', 'F', 'R', 'F', 'F', 'R', 'F', 'L'];
const HOOK: Item[] = ['L', 'F', 'R', 'F', 'F', 'R'];
const UR: Item[] = ['F', 'R', 'F', 'F', 'R'];
const UL: Item[] = ['F', 'L', 'F', 'F', 'L'];
const FORK: Item[] = [{ until: 'LEFT', b: ['F'] }, 'L', 'F'];
const FORK_R: Item[] = [{ until: 'RIGHT', b: ['F'] }, 'R', 'F'];
const SPIRAL: Item[] = [{ rv: 'cells', b: ['F'] }, 'R'];
const TURN_FIRST: Item[] = ['R', { rv: 'cells', b: ['F'] }];
const CLIMB: Item[] = ['F', 'F', 'L', { rv: 'cells', b: ['F'] }, 'R'];
const LANE: Item[] = [{ rv: 'cells', b: ['F'] }, 'R', 'F', 'F', 'R'];
const BACKLANE: Item[] = ['F', 'F', 'L', 'F', 'F', 'L'];

const CELLS = { id: 'cells', name: 'số ô', max: 9 };
const P = {
  stair: { id: 'stair', name: 'bậc thang' },
  up: { id: 'up', name: 'lên bậc' },
  down: { id: 'down', name: 'xuống bậc' },
  corner: { id: 'corner', name: 'rẽ góc' },
  wall: { id: 'corner', name: 'góc tường' },
  shelf: { id: 'shelf', name: 'vòng kệ sách' },
  hook: { id: 'hook', name: 'móc câu' },
  hop: { id: 'hop', name: 'lên dốc' },
  right: { id: 'right', name: 'quay phải' },
  left: { id: 'left', name: 'quay trái' },
  fork: { id: 'fork', name: 'tới ngã ba' },
  forkR: { id: 'fork', name: 'tới ngã rẽ phải' },
  turn: { id: 'turn', name: 'đi rồi rẽ', param: CELLS },
  turnFirst: { id: 'turn', name: 'rẽ rồi đi', param: CELLS },
  climb: { id: 'climb', name: 'leo bậc', param: CELLS },
  lane: { id: 'lane', name: 'đi rồi quay', param: CELLS },
  back: { id: 'back', name: 'về trái' },
} satisfies Record<string, LevelProcedure>;

// ---------------------------------------------------------------- shared hints
const H = {
  cap: {
    id: 'cap',
    when: { capacityFull: true },
    say: 'Đoạn nào lặp lại? Dạy thành phép được không?',
    point: 'toolbox:cq_proc_def',
  },
  capN: {
    id: 'cap',
    when: { capacityFull: true },
    say: 'Đoạn nào lặp lại? Dạy thành phép được không?',
    point: 'toolbox:cq_proc_def_n',
  },
  many: {
    id: 'many',
    when: ran('TOO_MANY_BLOCKS'),
    say: 'Đoạn nào lặp lại? Dạy thành phép được không?',
    point: 'capacity',
  },
  loose: {
    id: 'loose',
    when: { trigger: 'run-end', orphans: true },
    say: 'Còn khối rời. Nối hết vào khi bắt đầu nhé!',
  },
  step: {
    id: 'step',
    when: { trigger: 'run-end', lastResult: 'crash' },
    say: 'Bấm Từng bước. Măng đâm tường ở lần làm phép nào?',
    point: 'step',
  },
} satisfies Record<string, HintRule>;

/** The grab cap is really used up (hint-engine `instancesFull`) and jobs are left. */
const grabCap = (say: string, point: HintRule['point']): HintRule => ({
  id: 'grab',
  when: { all: [ran('MISSIONS_LEFT'), { instancesFull: 'robot_grab' }] },
  say,
  ...(point === undefined ? {} : { point }),
});

const FEEDBACK_SPELL = {
  TOO_MANY_BLOCKS: 'Nhiều khối quá. Đoạn nào lặp lại? Dạy thành phép được không?',
};

/** Copy and extras of one level, on top of its engine design. */
export interface LevelSpec extends Design {
  title: string;
  objective: string;
  learningGoal: string;
  misconception?: string;
  mission: string;
  hints: HintRule[];
  thinkingHint: string;
  feedback?: Record<string, string>;
  /** parsons: pieces are the solution's blocks; otherwise what is already on the canvas. */
  initial?: 'parsons' | Prog;
  /** predict: the program shown, then the answer cards (solution first, then wrong ones). */
  predict?: { right: string; wrong: string[] };
  parEdits?: number;
  parUnproven?: true;
}

// ================================================================ maze levels
const l01p: Prog = {
  main: [s('corner'), 'L', s('corner'), 'F', s('corner')],
  defs: { corner: CORNER_R },
};
const l01: LevelSpec = {
  id: 'w08-l01',
  stage: 'guided',
  kind: 'maze',
  mode: 'parsons',
  maps: [maze('#######/#S..###/###...#/#####.#/#####.#/#####.#/####G.#/#######', 'E')],
  toolbox: [],
  procedures: [P.corner],
  solution: l01p,
  initial: 'parsons',
  wrong: [
    {
      name: 'làm phép 3 lần liền',
      prog: { ...l01p, main: [s('corner'), s('corner'), s('corner')] },
    },
    {
      name: 'quên tiến giữa',
      prog: { ...l01p, main: [s('corner'), 'L', s('corner'), s('corner')] },
    },
    {
      name: 'đổi chỗ rẽ trái và tiến',
      prog: { ...l01p, main: [s('corner'), 'F', s('corner'), 'L', s('corner')] },
    },
  ],
  title: 'Phép đầu tiên',
  objective: 'Ghép phép rẽ góc, rồi làm phép 3 lần.',
  learningGoal:
    'Dạy phép rẽ góc 1 lần (tiến, tiến, rẽ phải, tiến), rồi làm phép ở 3 góc. Giữa các góc là rẽ trái, rồi tiến.',
  misconception: 'Phải chép lại các khối ở mỗi góc.',
  mission: 'Gấu nâu nhờ Măng qua 3 góc hành lang xưởng.',
  hints: [
    {
      id: 'def',
      when: { trigger: 'enter' },
      say: 'Khối mới! Dạy phép: nhớ các lệnh bên trong, chưa làm ngay',
      point: 'block:cq_proc_def',
    },
    {
      id: 'call',
      when: { trigger: 'enter' },
      say: 'Khối mới! Làm phép: làm hết lệnh trong phép, rồi làm tiếp',
      point: 'block:cq_proc_call',
    },
    {
      id: 'between',
      when: ran('HIT_WALL'),
      say: 'Giữa 2 lần làm phép, Măng cần làm gì?',
      point: 'stage',
    },
    H.loose,
  ],
  thinkingHint: 'Ở mỗi góc, Măng đi giống nhau không?',
};

const l02climb: Prog = { main: ['F', 'F', ...STAIR, ...STAIR, 'F'] };
const l02: LevelSpec = {
  id: 'w08-l02',
  stage: 'guided',
  kind: 'maze',
  mode: 'predict',
  maps: [maze('########/#####.G#/####..##/#S...###/########', 'E')],
  toolbox: [],
  procedures: [P.stair],
  solution: { main: ['F', 'F'], defs: { stair: STAIR } },
  wrong: [
    { name: 'phép chạy ngay khi dạy', prog: l02climb },
    { name: 'leo 1 bậc', prog: { main: ['F', 'F', ...STAIR] } },
  ],
  predict: {
    right: 'Đi 2 ô, đứng dưới chân dốc',
    wrong: ['Leo hết dốc, tới lá cờ', 'Leo 1 bậc rồi dừng'],
  },
  title: 'Dạy mà chưa làm',
  objective: 'Đọc chương trình. Măng dừng ở đâu?',
  learningGoal:
    'Khối dạy phép chỉ nhớ các khối bên trong. Chương trình chính không có làm phép, nên Măng chỉ tiến 2 ô.',
  misconception: 'Phép chạy ngay khi dạy.',
  mission: 'Bác Cú dạy phép bậc thang. Măng làm chưa?',
  hints: [
    {
      id: 'look',
      when: { trigger: 'enter' },
      say: 'Dưới khi bắt đầu có khối làm phép không?',
      point: 'stage',
    },
    {
      id: 'teach',
      when: { trigger: 'idle' },
      say: 'Dạy phép xong, Măng có làm ngay không?',
      point: 'stage',
    },
  ],
  thinkingHint: 'Măng làm những khối nào dưới khi bắt đầu?',
};

const l03p: Prog = {
  main: [s('shelf'), 'R', s('shelf'), 'F', 'F', s('shelf')],
  defs: { shelf: SHELF },
};
const l03: LevelSpec = {
  id: 'w08-l03',
  stage: 'guided',
  kind: 'maze',
  mode: 'build',
  maps: [maze('######/#...##/#S#..#/####.#/###..#/###.##/###..#/####.#/###G.#/######', 'E')],
  // The `dạy phép` block is given; the cap of 1 keeps a second one out (rule 11 needs it listed).
  toolbox: [...MOVES, DEF, CALL],
  procedures: [P.shelf],
  maxInstances: { cq_proc_def: 1 },
  solution: l03p,
  initial: { main: [], defs: { shelf: SHELF } },
  wrong: [
    { name: 'làm phép 2 lần liền', prog: { ...l03p, main: [s('shelf'), s('shelf')] } },
    {
      name: 'quên rẽ phải',
      prog: { ...l03p, main: [s('shelf'), s('shelf'), 'F', 'F', s('shelf')] },
    },
    { name: 'bỏ 2 tiến giữa', prog: { ...l03p, main: [s('shelf'), 'R', s('shelf'), s('shelf')] } },
  ],
  title: 'Vòng kệ sách',
  objective: 'Phép có sẵn rồi. Làm phép ở 3 kệ sách nhé!',
  learningGoal:
    'Phép vòng kệ sách đã dạy sẵn. Bé chỉ ghép chương trình chính: làm phép, rẽ phải, làm phép, tiến 2 ô, làm phép.',
  misconception: 'Làm phép liền nhau là đủ, không cần khối giữa.',
  mission: '3 kệ sách chắn lối đi. Măng vòng qua nhé!',
  hints: [
    {
      id: 'given',
      when: { trigger: 'enter' },
      say: 'Phép vòng kệ sách dạy sẵn rồi. Làm phép ở đâu?',
      point: 'block:cq_proc_def',
    },
    {
      id: 'gap',
      when: ran('HIT_WALL'),
      say: 'Sau mỗi kệ sách, Măng cần rẽ hay tiến?',
      point: 'stage',
    },
    H.loose,
  ],
  thinkingHint: 'Măng phải vòng qua mấy chỗ?',
};

const l04p: Prog = { main: [s('hook'), s('hook'), 'F', s('hook')], defs: { hook: HOOK } };
const l04: LevelSpec = {
  id: 'w08-l04',
  stage: 'guided',
  kind: 'maze',
  mode: 'build',
  maps: [maze('######/#....#/#S##.#/###..#/#G..##/######', 'E')],
  toolbox: [...MOVES, DEF, CALL],
  procedures: [P.hook],
  maxInstances: { cq_proc_def: 1 },
  solution: l04p,
  initial: { main: l04p.main, defs: { hook: [] } },
  wrong: [
    { name: 'thân soi gương', prog: { ...l04p, defs: { hook: ['R', 'F', 'L', 'F', 'F', 'L'] } } },
    { name: 'thân thiếu một tiến', prog: { ...l04p, defs: { hook: ['L', 'F', 'R', 'F', 'R'] } } },
  ],
  title: 'Tự dạy phép',
  objective: 'Chương trình có sẵn. Dạy phép móc câu nhé!',
  learningGoal:
    'Chương trình chính làm phép móc câu 3 lần. Bé tự ghép thân phép: rẽ trái, tiến, rẽ phải, tiến, tiến, rẽ phải.',
  misconception: 'Phép tự biết đi, không cần khối bên trong.',
  mission: 'Măng tự dạy phép móc câu cho hành lang này.',
  hints: [
    {
      id: 'empty',
      when: { trigger: 'enter' },
      say: 'Phép móc câu còn trống. Lần đầu Măng đi thế nào?',
      point: 'block:cq_proc_def',
    },
    {
      id: 'first',
      when: ran('HIT_WALL'),
      say: 'Bấm Từng bước. Măng sai ở khối nào trong phép?',
      point: 'step',
    },
    H.loose,
  ],
  thinkingHint: 'Lần làm phép đầu, Măng đi tới đâu?',
};

const l05p: Prog = {
  main: [s('corner'), 'R', 'F', s('corner'), 'R', s('corner')],
  defs: { corner: CORNER_L },
};
const l05bug: Prog = { ...l05p, defs: { corner: ['F', 'F', 'R', 'F'] } };
const l05: LevelSpec = {
  id: 'w08-l05',
  stage: 'practice',
  kind: 'maze',
  mode: 'bughunt',
  maps: [
    maze(
      '############/############/############/############/########G###/######...###/###....#.###/#S..##.#####/###.########/############',
      'E',
    ),
  ],
  toolbox: [...MOVES, DEF, CALL],
  procedures: [P.wall],
  maxBlocks: 12,
  maxInstances: { cq_proc_def: 1 },
  solution: l05p,
  initial: l05bug,
  parEdits: 1,
  wrong: [
    { name: 'bug', prog: l05bug },
    {
      name: 'vá ở chỗ gọi đầu',
      prog: { ...l05bug, main: [s('corner'), 'L', 'L', 'R', 'F', s('corner'), 'R', s('corner')] },
    },
  ],
  title: 'Phép bị sai',
  objective: 'Phép góc tường sai 1 khối. Sửa 1 chỗ thôi!',
  learningGoal:
    'Phép sai 1 khối thì sai ở mọi chỗ làm phép. Đổi rẽ phải thành rẽ trái trong phép là đúng cả 3 góc.',
  misconception: 'Sửa phép thì phải sửa từng chỗ làm phép.',
  mission: 'Phép góc tường của Cáo con bị sai. Sửa giúp nhé!',
  hints: [
    {
      id: 'rule',
      when: { trigger: 'enter' },
      say: 'Sửa trong phép 1 lần, đúng ở mọi chỗ.',
      point: 'block:cq_proc_def',
    },
    H.step,
    {
      id: 'where',
      when: { all: [ran('HIT_WALL'), { runCount: { gte: 2 } }] },
      say: 'Lỗi nằm ở chương trình chính hay trong phép?',
      point: 'block:cq_proc_def',
    },
  ],
  thinkingHint: 'Măng sai ở lần làm phép đầu. Lỗi ở đâu?',
  feedback: FEEDBACK_SPELL,
};

const l07p: Prog = {
  main: [s('shelf'), 'F', 'F', 'L', 'F', 'F', 'R', s('shelf'), 'F'],
  defs: { shelf: SHELF },
};
const l07: LevelSpec = {
  id: 'w08-l07',
  stage: 'practice',
  kind: 'maze',
  mode: 'predict',
  maps: [maze('##########/#####...##/#####.#.G#/#...#.####/#S#...####/##########', 'E')],
  toolbox: [],
  procedures: [P.shelf],
  solution: l07p,
  wrong: [
    { name: 'dừng sau phép đầu', prog: { ...l07p, main: [s('shelf')] } },
    { name: 'dừng sau phép thứ hai', prog: { ...l07p, main: l07p.main.slice(0, -1) } },
  ],
  predict: {
    right: 'Tới lá cờ',
    wrong: ['Dừng sau lần làm phép đầu', 'Dừng sau lần làm phép thứ hai, cạnh cờ'],
  },
  title: 'Làm xong phép thì sao?',
  objective: 'Đọc chương trình. Măng dừng ở đâu?',
  learningGoal:
    'Làm phép xong, Măng quay lại làm khối ngay sau khối làm phép, tới hết chương trình. Màn ôn: ý này có ở bài mở đầu.',
  misconception: 'Làm phép xong thì chương trình dừng.',
  mission: 'Măng vòng 2 kệ sách. Rồi Măng đi đâu?',
  hints: [
    {
      id: 'after',
      when: { trigger: 'enter' },
      say: 'Làm phép xong, Măng làm khối nào tiếp?',
      point: 'stage',
    },
    {
      id: 'count',
      when: { trigger: 'idle' },
      say: 'Sau lần làm phép thứ hai còn khối nào không?',
      point: 'stage',
    },
  ],
  thinkingHint: 'Làm phép xong, Măng quay lại khối nào?',
};

const l08p: Prog = { main: [{ rep: 3, b: [s('hop')] }, 'L', s('hop'), 'F'], defs: { hop: HOP } };
const l08: LevelSpec = {
  id: 'w08-l08',
  stage: 'practice',
  kind: 'maze',
  mode: 'build',
  maps: [
    maze(
      '##########/######G###/######..##/#######.##/#####.#..#/#####...##/###...####/#S..######/###.######/##########',
      'E',
    ),
  ],
  toolbox: [...MOVES, 'cq_repeat', DEF, CALL],
  procedures: [P.hop],
  maxBlocks: 11,
  maxInstances: { cq_proc_def: 1 },
  solution: l08p,
  wrong: [
    { name: 'lặp 4', prog: { ...l08p, main: [{ rep: 4, b: [s('hop')] }] } },
    {
      name: 'lặp 2 rồi rẽ',
      prog: { ...l08p, main: [{ rep: 2, b: [s('hop')] }, 'L', s('hop'), 'F'] },
    },
    { name: 'quên tiến cuối', prog: { ...l08p, main: [{ rep: 3, b: [s('hop')] }, 'L', s('hop')] } },
  ],
  title: 'Phép trong vòng lặp',
  objective: 'Leo dốc tới cờ. Không quá 11 khối nhé!',
  learningGoal:
    'Phép lên dốc (tiến, tiến, rẽ trái, tiến, rẽ phải) làm 3 lần liền: đặt làm phép trong lặp 3 lần. Rồi rẽ trái, làm phép, tiến.',
  misconception: 'Làm phép trong vòng lặp thì phép chỉ chạy 1 lần.',
  mission: 'Gấu nâu leo dốc dài về nhà. Giúp Gấu nhé!',
  hints: [
    {
      id: 'loop',
      when: ran('TOO_MANY_BLOCKS'),
      say: 'Phép chạy 3 lần liền. Vòng lặp giúp được không?',
      point: 'toolbox:cq_repeat',
    },
    H.cap,
    { id: 'dead', when: ran('HIT_WALL'), say: 'Leo mấy bậc thì phải rẽ?', point: 'stage' },
    H.loose,
  ],
  thinkingHint: 'Phép nào chạy mấy lần liền?',
  feedback: { TOO_MANY_BLOCKS: 'Phép chạy 3 lần liền. Vòng lặp giúp được không?' },
};

// l09: the U-turn gaps are irregular so that no loop program beats the spells (verify.ts loop).
export const L09_MAIN: Item[] = [s('right'), 'F', 'F', s('left'), s('right'), 'F', s('left')];
const l09p: Prog = { main: L09_MAIN, defs: { right: UR, left: UL } };
export const L09_MAP =
  '#######/####S.#/#####.#/##....#/##.####/##..###/###.###/#...###/#.#####/#G#####/#######';
const l09: LevelSpec = {
  id: 'w08-l09',
  stage: 'practice',
  kind: 'maze',
  mode: 'parsons',
  maps: [maze(L09_MAP, 'E')],
  toolbox: [],
  procedures: [P.right, P.left],
  solution: l09p,
  initial: 'parsons',
  wrong: [{ name: 'đổi tên hai phép', prog: { ...l09p, defs: { right: UL, left: UR } } }],
  title: '2 phép, 2 tên',
  objective: 'Ghép 2 phép quay phải, quay trái cho đúng.',
  learningGoal:
    'Hai phép soi gương: quay phải rẽ phải 2 lần, quay trái rẽ trái 2 lần. Gọi tên nào, Măng làm phép đó.',
  misconception: 'Hai phép khác tên mà làm giống nhau.',
  mission: 'Hành lang răng lược của Cáo con. Đi tới cờ!',
  hints: [
    {
      id: 'names',
      when: { trigger: 'enter' },
      say: 'Mỗi phép một tên. Gọi tên nào, làm phép đó.',
      point: 'stage',
    },
    {
      id: 'which',
      when: ran('HIT_WALL'),
      say: 'Ở góc này, Măng quay bên phải hay bên trái?',
      point: 'stage',
    },
    H.loose,
  ],
  thinkingHint: 'Ở mỗi đầu làn, Măng quay về phía nào?',
};

const l11p: Prog = { main: [s('fork'), 'R', s('fork'), s('fork')], defs: { fork: FORK } };
const l11: LevelSpec = {
  id: 'w08-l11',
  stage: 'practice',
  kind: 'maze',
  mode: 'build',
  maps: [
    maze('#########/######.##/#####G.##/######.##/###.....#/#S...####/##.######/#########', 'E'),
    maze(
      '#########/######.##/#####G.##/######.##/######..#/######.##/#####...#/#S....###/###.#.###/###..####/#########',
      'E',
    ),
    maze('##########/###.#.####/#.....####/##G##.####/#####....#/######S###/##########', 'N'),
  ],
  toolbox: [
    ...MOVES,
    'cq_repeat_until',
    { type: 'maze_is_path', fields: { DIR: 'LEFT' } },
    DEF,
    CALL,
  ],
  procedures: [P.fork],
  maxBlocks: 11,
  maxInstances: { cq_proc_def: 1 },
  solution: l11p,
  wrong: [
    { name: 'thân không hỏi', prog: { ...l11p, defs: { fork: ['F', 'F', 'L', 'F'] } } },
    {
      name: 'thân thiếu tiến sau rẽ',
      prog: { ...l11p, defs: { fork: [{ until: 'LEFT', b: ['F'] }, 'L'] } },
    },
    { name: 'quên rẽ phải', prog: { ...l11p, main: [s('fork'), s('fork'), s('fork')] } },
  ],
  title: 'Phép biết hỏi',
  objective: '1 phép cho cả 3 bản đồ. Đường dài, ngắn khác nhau!',
  learningGoal:
    'Phép tới ngã ba hỏi đường bên trái: lặp đến khi có đường bên trái thì tiến, rồi rẽ trái, tiến. 1 phép đúng cho đoạn dài, ngắn.',
  misconception: 'Phép chỉ đúng cho một độ dài.',
  mission: '3 con đường tới vườn tre. 1 phép đi hết!',
  hints: [
    {
      id: 'ask',
      when: ran('HIT_WALL'),
      say: 'Đường dài, ngắn khác nhau. Phép nên hỏi gì?',
      point: 'toolbox:maze_is_path',
    },
    {
      id: 'stuck',
      when: ran('NOT_AT_GOAL'),
      say: 'Rẽ xong, bên trái vẫn có đường. Măng cần tiến không?',
      point: 'stage',
    },
    H.cap,
    H.loose,
  ],
  thinkingHint: 'Khi nào Măng biết đã tới ngã ba?',
  feedback: FEEDBACK_SPELL,
};

const l13p: Prog = {
  main: [sn('turn', 5), sn('turn', 4), sn('turn', 4), sn('turn', 2), sn('turn', 2)],
  defs: { turn: SPIRAL },
  params: { turn: 'cells' },
};
const l13: LevelSpec = {
  id: 'w08-l13',
  stage: 'practice',
  kind: 'maze',
  mode: 'parsons',
  maps: [maze('########/#S.....#/######.#/##..G#.#/##.###.#/##.....#/########', 'E')],
  toolbox: [],
  procedures: [P.turn],
  solution: l13p,
  initial: 'parsons',
  wrong: [
    {
      name: 'đổi chỗ 5 và 4',
      prog: {
        ...l13p,
        main: [sn('turn', 4), sn('turn', 5), sn('turn', 4), sn('turn', 2), sn('turn', 2)],
      },
    },
  ],
  title: 'Phép có hộp',
  objective: 'Ghép phép đi rồi rẽ. Mỗi lần 1 số ô.',
  learningGoal:
    'Phép đi rồi rẽ có hộp số ô: lặp số ô lần tiến, rồi rẽ phải. Làm phép với 5, 4, 4, 2, 2 thì Măng đi xoắn ốc.',
  misconception: 'Phép có hộp lần nào cũng đi cùng số ô.',
  mission: 'Vỏ ốc khổng lồ trong xưởng. Đi vào giữa nhé!',
  hints: [
    {
      id: 'defn',
      when: { trigger: 'enter' },
      say: 'Khối mới! Dạy phép với hộp: làm phép thì hộp nhận số',
      point: 'block:cq_proc_def_n',
    },
    {
      id: 'calln',
      when: { trigger: 'enter' },
      say: 'Khối mới! Làm phép với số: hộp của phép nhận số này',
      point: 'block:cq_proc_call_n',
    },
    {
      id: 'order',
      when: ran('HIT_WALL'),
      say: 'Cạnh đầu dài mấy ô? Cạnh sau mấy ô?',
      point: 'stage',
    },
    H.loose,
  ],
  thinkingHint: 'Mỗi cạnh của vỏ ốc dài mấy ô?',
};

const l14p: Prog = {
  main: [sn('turn', 3), sn('turn', 2), sn('turn', 1)],
  defs: { turn: SPIRAL },
  params: { turn: 'cells' },
};
const l14: LevelSpec = {
  id: 'w08-l14',
  stage: 'practice',
  kind: 'maze',
  mode: 'predict',
  maps: [maze('######/#S...#/####.#/###..#/#G...#/######', 'E')],
  toolbox: [],
  procedures: [P.turn],
  solution: l14p,
  wrong: [
    { name: 'hộp giữ 3', prog: { ...l14p, main: [sn('turn', 3), sn('turn', 3), sn('turn', 3)] } },
    { name: 'chỉ lần đầu', prog: { ...l14p, main: [sn('turn', 3)] } },
  ],
  predict: {
    right: 'Dừng ở ô lõm bên trái, chưa tới cờ',
    wrong: ['Tới lá cờ ở góc dưới', 'Dừng ở góc trên, sau 3 ô đầu'],
  },
  title: 'Hộp nhận số mới',
  objective: 'Đọc chương trình. Măng dừng ở ô nào?',
  learningGoal:
    'Mỗi lần làm phép, hộp nhận số mới: 3, rồi 2, rồi 1. Măng đi 3 ô, 2 ô, 1 ô, dừng ở ô lõm, không tới cờ.',
  misconception: 'Hộp của phép giữ số của lần làm đầu tiên.',
  mission: 'Măng làm phép 3 lần. Hộp có số mấy?',
  hints: [
    {
      id: 'box',
      when: { trigger: 'enter' },
      say: 'Lần làm phép thứ hai, hộp có số mấy?',
      point: 'stage',
    },
    {
      id: 'each',
      when: { trigger: 'idle' },
      say: 'Lần làm phép thứ ba, hộp còn giữ số 3 không?',
      point: 'stage',
    },
  ],
  thinkingHint: 'Mỗi lần làm phép, Măng đi mấy ô?',
};

const l15p: Prog = {
  main: [sn('climb', 3), sn('climb', 1), sn('climb', 2)],
  defs: { climb: CLIMB },
  params: { climb: 'cells' },
};
const l15: LevelSpec = {
  id: 'w08-l15',
  stage: 'practice',
  kind: 'maze',
  mode: 'build',
  maps: [
    maze(
      '#########/#######G#/#####.#.#/###.#...#/###...###/###.#####/###.#####/#S...####/#########',
      'E',
    ),
  ],
  toolbox: [...MOVES, DEFN, CALLN, boxLoop('cells')],
  procedures: [P.climb],
  maxBlocks: 11,
  maxInstances: { cq_proc_def_n: 1 },
  solution: l15p,
  wrong: [
    {
      name: 'leo 4 ở lần đầu',
      prog: { ...l15p, main: [sn('climb', 4), sn('climb', 1), sn('climb', 2)] },
    },
    {
      name: 'hộp giữ 3',
      prog: { ...l15p, main: [sn('climb', 3), sn('climb', 3), sn('climb', 3)] },
    },
    {
      name: 'lặp 3 cố định',
      prog: { ...l15p, defs: { climb: ['F', 'F', 'L', { rep: 3, b: ['F'] }, 'R'] } },
    },
  ],
  title: 'Bậc cao, bậc thấp',
  objective: 'Tự dạy phép leo bậc có hộp. Tới cờ nhé!',
  learningGoal:
    'Phép leo bậc: tiến, tiến, rẽ trái, lặp số ô lần tiến, rẽ phải. Làm phép với 3, 1, 2: mỗi bậc cao khác nhau.',
  misconception: 'Phép có hộp mà dùng số cố định vẫn đúng.',
  mission: '3 bậc cao thấp lên kho phép. Leo nhé!',
  hints: [
    { id: 'high', when: ran('HIT_WALL'), say: 'Lần đầu leo mấy ô? Lần sau mấy ô?', point: 'stage' },
    {
      id: 'use',
      when: { trigger: 'idle' },
      say: 'Trong phép, lặp theo hộp thay cho số cố định được không?',
      point: 'toolbox:cq_repeat_var',
    },
    H.capN,
    H.loose,
  ],
  thinkingHint: '3 bậc giống nhau ở đâu, khác nhau ở đâu?',
  feedback: FEEDBACK_SPELL,
};

const l17p: Prog = {
  main: [sn('lane', 3), s('back'), sn('lane', 4), s('back'), sn('lane', 1)],
  defs: { lane: LANE, back: BACKLANE },
  params: { lane: 'cells' },
};
const l17: LevelSpec = {
  id: 'w08-l17',
  stage: 'challenge',
  kind: 'maze',
  mode: 'build',
  maps: [
    maze(
      '#S....###/####.####/#....####/##.######/##......#/######.##/###....##/####.####/####...##/#####.###/#####G###',
      'E',
    ),
  ],
  toolbox: [...MOVES, DEF, CALL, DEFN, CALLN, boxLoop('cells')],
  procedures: [P.lane, P.back],
  maxBlocks: 20,
  maxInstances: { cq_proc_def: 1, cq_proc_def_n: 1 },
  solution: l17p,
  wrong: [
    {
      name: 'đi 4 ở lần đầu',
      prog: { ...l17p, main: [sn('lane', 4), s('back'), sn('lane', 4), s('back'), sn('lane', 1)] },
    },
    {
      name: 'về trái rẽ phải',
      prog: { ...l17p, defs: { lane: LANE, back: ['F', 'F', 'R', 'F', 'F', 'R'] } },
    },
  ],
  title: 'Răng lược dài ngắn',
  objective: '2 phép, 1 phép có hộp. Không quá 20 khối!',
  learningGoal:
    'Phép đi rồi quay có hộp (đi số ô, rồi quay đầu xuống làn dưới), phép về trái cố định. Làm phép đi rồi quay với 3, 4, 1.',
  misconception: 'Làn dài, ngắn khác nhau thì phải dạy phép khác nhau.',
  mission: 'Kho phép có làn dài, làn ngắn. Đi tới cờ!',
  hints: [
    { id: 'lanes', when: ran('HIT_WALL'), say: 'Làn này dài mấy ô?', point: 'stage' },
    H.capN,
    H.many,
    H.loose,
  ],
  thinkingHint: 'Làn đi sang phải và làn về trái khác nhau ở đâu?',
  feedback: FEEDBACK_SPELL,
};

const l19p: Prog = {
  main: [sn('climb', 3), s('hook'), sn('climb', 1), s('hook')],
  defs: { climb: CLIMB, hook: HOOK },
  params: { climb: 'cells' },
};
const l19: LevelSpec = {
  id: 'w08-l19',
  stage: 'challenge',
  kind: 'maze',
  mode: 'predict',
  maps: [
    maze(
      '###########/###...#####/###.#.#####/###.#.....#/###.###.#.#/#S..###.#G#/###########',
      'E',
    ),
  ],
  toolbox: [],
  procedures: [P.climb, P.hook],
  solution: l19p,
  wrong: [
    {
      name: 'hộp vẫn giữ 3',
      prog: { ...l19p, main: [sn('climb', 3), s('hook'), sn('climb', 3), s('hook')] },
    },
    {
      name: 'bỏ qua móc câu',
      prog: { ...l19p, main: [sn('climb', 3), sn('climb', 1), s('hook')] },
    },
  ],
  predict: {
    right: 'Dừng ở cuối dốc xuống, cách cờ 2 cột',
    wrong: ['Tới lá cờ', 'Đâm tường ngay sau bậc đầu'],
  },
  title: 'Đọc 2 phép',
  objective: 'Đọc chương trình. Măng dừng ở ô nào?',
  learningGoal:
    'Hai phép, mỗi phép làm 2 lần. Lần leo bậc thứ hai hộp nhận số 1, nên Măng dừng ở cuối dốc, chưa tới cờ.',
  misconception: 'Hộp vẫn giữ số của lần làm phép trước.',
  mission: 'Măng đọc sách phép. Măng dừng ở đâu?',
  hints: [
    {
      id: 'second',
      when: { trigger: 'enter' },
      say: 'Lần leo bậc thứ hai, hộp có số mấy?',
      point: 'stage',
    },
    {
      id: 'trace',
      when: { trigger: 'idle' },
      say: 'Đi theo từng khối. Sau móc câu đầu, Măng ở đâu?',
      point: 'stage',
    },
  ],
  thinkingHint: 'Lần leo bậc thứ hai, hộp nhận số mấy?',
};

// ================================================================ robot levels
type Color = 'RED' | 'YELLOW' | 'GREEN';
const nz = (color: Color, at: [number, number]) => ({ kind: 'neutralizer' as const, color, at });
const pz = (at: [number, number], color: Color = 'RED') => ({
  kind: 'pollution' as const,
  color,
  at,
});

// Robot spell shapes (critic review 2): carry-back (l06, l16), route only with grab / release in
// the main program (l10), question spells (l12), carry forward (l18), route + carry (boss).
const DELIVER: Item[] = ['G', 'R', 'R', 'f1', 'T'];
const l06p: Prog = {
  main: ['f2', s('deliver'), 'L', 'f2', s('deliver'), 'R', 'f3', s('deliver')],
  defs: { deliver: DELIVER },
};
const l06: LevelSpec = {
  id: 'w08-l06',
  stage: 'practice',
  kind: 'robotlab',
  mode: 'build',
  maps: [
    {
      map: ['.......', '.#.#g#.', '.......', '...ry..', '###L###'],
      startDir: 'N',
      blocks: [nz('RED', [2, 3]), nz('YELLOW', [3, 5]), nz('GREEN', [0, 4])],
      goal: { type: 'missions' },
    },
  ],
  toolbox: [...ROBOT, DEF, CALL],
  procedures: [{ id: 'deliver', name: 'giao khối' }],
  maxBlocks: 15,
  maxInstances: { cq_proc_def: 1 },
  solution: l06p,
  wrong: [
    {
      name: 'giao trước khi tới khối',
      prog: {
        ...l06p,
        main: ['f1', s('deliver'), 'L', 'f2', s('deliver'), 'R', 'f3', s('deliver')],
      },
    },
    { name: 'thân thiếu một rẽ', prog: { ...l06p, defs: { deliver: ['G', 'R', 'f1', 'T'] } } },
  ],
  title: 'Phép giao khối',
  objective: 'Dạy Bíp phép giao khối. Giao đủ 3 khối trung hòa!',
  learningGoal:
    'Phép giao khối: gắp, quay đầu, tiến 1 ô, thả. Khối trung hòa nằm ngay sau trạm cùng màu, nên 1 phép giao được cả 3 khối.',
  misconception: 'Phép chỉ dùng được cho Măng, không cho Bíp.',
  mission: 'Giao khối trung hòa đỏ, vàng, xanh lá về trạm!',
  hints: [
    {
      id: 'same',
      when: { trigger: 'enter' },
      say: '3 lần giao khối, Bíp làm giống nhau không?',
      point: 'stage',
    },
    {
      id: 'empty',
      when: ran('NOTHING_TO_GRAB'),
      say: 'Bíp đã đứng trên khối trung hòa chưa?',
      point: 'stage',
    },
    {
      id: 'off',
      when: ran('OFF_LINE'),
      say: 'Sau khi gắp, Bíp quay đầu chưa?',
      point: 'block:cq_proc_def',
    },
    H.cap,
    H.loose,
  ],
  thinkingHint: 'Sau khi gắp, Bíp quay về phía trạm thế nào?',
  feedback: FEEDBACK_SPELL,
};

// l10: route spells only (bước lên / bước xuống), grab and release stay in the main program.
const UPSTEP: Item[] = ['L', 'f1', 'R', 'f1'];
const DOWNSTEP: Item[] = ['R', 'f1', 'L', 'f1'];
const l10p: Prog = {
  main: ['f1', 'G', s('up'), 'T', s('down'), 'G', s('down'), 'T', s('up'), 'G', s('up'), 'T'],
  defs: { up: UPSTEP, down: DOWNSTEP },
};
const l10bug: Prog = {
  ...l10p,
  main: ['f1', 'G', s('up'), 'T', s('up'), 'G', s('down'), 'T', s('up'), 'G', s('up'), 'T'],
};
const l10: LevelSpec = {
  id: 'w08-l10',
  stage: 'practice',
  kind: 'robotlab',
  mode: 'bughunt',
  maps: [
    {
      map: ['#.r##.g', 'L.....#', '###.y##'],
      startDir: 'E',
      blocks: [nz('RED', [1, 1]), nz('YELLOW', [1, 3]), nz('GREEN', [1, 5])],
      goal: { type: 'missions' },
    },
  ],
  toolbox: [...ROBOT, DEF, CALL],
  procedures: [
    { id: 'up', name: 'bước lên' },
    { id: 'down', name: 'bước xuống' },
  ],
  maxBlocks: 23,
  maxInstances: { cq_proc_def: 2 },
  solution: l10p,
  initial: l10bug,
  parEdits: 1,
  wrong: [{ name: 'bug', prog: l10bug }],
  title: 'Nhầm phép',
  objective: 'Bíp làm nhầm 1 phép. Sửa 1 chỗ thôi nhé!',
  learningGoal:
    'Phép bước lên đi lên 1 ô, phép bước xuống đi xuống 1 ô. Lần làm phép thứ hai phải là bước xuống: đổi tên trên khối là xong.',
  misconception: 'Hai phép khác tên mà làm giống nhau.',
  mission: 'Lối bậc lên xuống: đặt khối trung hòa đỏ, vàng, xanh lá!',
  hints: [
    {
      id: 'step',
      when: { trigger: 'enter' },
      say: 'Bấm Từng bước. Phép nào làm sai?',
      point: 'step',
    },
    {
      id: 'off',
      when: ran('OFF_LINE'),
      say: 'Khối trung hòa vàng ở trên hay dưới Bíp?',
      point: 'stage',
    },
  ],
  thinkingHint: 'Gọi tên nào thì Bíp làm phép nào?',
  feedback: FEEDBACK_SPELL,
};

// l12: Bíp starts holding a red pollution cube, so "về thả" runs 3 times and "đi gắp" 2 times:
// one merged spell cannot fit the 1-grab / 1-release cap.
const GOUNTIL: Item[] = [{ until: 'RED', b: ['f1'] }, 'G'];
const HOME: Item[] = ['R', 'R', { until: 'LAB', b: ['f1'] }, 'T'];
const l12p: Prog = {
  main: [s('home'), s('go'), s('home'), 'L', s('go'), s('home')],
  defs: { go: GOUNTIL, home: HOME },
};
const l12board = ['.......', '#.#.#.#', '...L...', '#.#.#.#', '.......'];
const holding = { kind: 'pollution' as const, color: 'RED' as const };
const l12: LevelSpec = {
  id: 'w08-l12',
  stage: 'practice',
  kind: 'robotlab',
  mode: 'build',
  maps: [
    {
      map: l12board,
      start: [0, 3],
      startDir: 'N',
      startHolding: holding,
      blocks: [pz([4, 3]), pz([2, 2])],
      goal: { type: 'missions', mustReturn: true },
    },
    {
      map: l12board,
      start: [2, 5],
      startDir: 'E',
      startHolding: holding,
      blocks: [pz([2, 0]), pz([0, 3])],
      goal: { type: 'missions', mustReturn: true },
    },
  ],
  toolbox: [
    F1,
    'robot_turn_left',
    'robot_turn_right',
    'robot_grab',
    'robot_release',
    'cq_repeat_until',
    { type: 'robot_block_color', fields: { COLOR: 'RED' } },
    'robot_at_lab',
    DEF,
    CALL,
  ],
  procedures: [
    { id: 'go', name: 'đi gắp' },
    { id: 'home', name: 'về thả' },
  ],
  maxBlocks: 18,
  maxInstances: { cq_proc_def: 2, robot_grab: 1, robot_release: 1 },
  solution: l12p,
  wrong: [{ name: 'tiến cố định', prog: { ...l12p, defs: { go: ['f1', 'f1', 'G'], home: HOME } } }],
  title: 'Phép robot biết hỏi',
  objective: '2 phép có câu hỏi, đúng cho cả 2 bản đồ.',
  learningGoal:
    'Về thả: quay đầu, lặp đến khi về phòng thì tiến, rồi thả. Đi gắp: lặp đến khi có khối ô nhiễm đỏ thì tiến, rồi gắp. Về thả làm 3 lần, đi gắp 2 lần.',
  misconception: 'Phép robot chỉ đúng cho 1 quãng đường.',
  mission: 'Bíp đang cầm khối ô nhiễm đỏ. Thu hồi đủ 3 khối!',
  hints: [
    grabCap('Chỉ 1 khối gắp. Gắp 2 lần bằng cách nào?', 'toolbox:cq_proc_def'),
    {
      id: 'far',
      when: ran('NOTHING_TO_GRAB'),
      say: 'Khối ô nhiễm đỏ xa gần khác nhau. Phép nên hỏi gì?',
      point: 'toolbox:robot_block_color',
    },
    H.loose,
  ],
  thinkingHint: '2 bản đồ khác nhau ở đâu?',
  feedback: FEEDBACK_SPELL,
};

const FETCH: Item[] = [{ rv: 'cells', b: ['f1'] }, 'G', 'R', 'R', { rv: 'cells', b: ['f1'] }, 'T'];
const l16p: Prog = {
  main: [sn('fetch', 2), sn('fetch', 1), 'R', sn('fetch', 3)],
  defs: { fetch: FETCH },
  params: { fetch: 'cells' },
};
const l16bug: Prog = {
  ...l16p,
  defs: { fetch: [{ rep: 2, b: ['f1'] }, 'G', 'R', 'R', { rv: 'cells', b: ['f1'] }, 'T'] },
};
const l16: LevelSpec = {
  id: 'w08-l16',
  stage: 'practice',
  kind: 'robotlab',
  mode: 'bughunt',
  maps: [
    {
      map: ['........', '#.#.#.#.', '...L....', '#.#.#.#.', '........'],
      startDir: 'N',
      blocks: [pz([0, 3]), pz([2, 6]), pz([3, 3])],
      goal: { type: 'missions', mustReturn: true },
    },
  ],
  toolbox: [
    F1,
    'robot_turn_left',
    'robot_turn_right',
    'robot_grab',
    'robot_release',
    DEFN,
    CALLN,
    boxLoop('cells'),
  ],
  procedures: [{ id: 'fetch', name: 'thu hồi', param: CELLS }],
  maxBlocks: 15,
  maxInstances: { cq_proc_def_n: 1 },
  solution: l16p,
  initial: l16bug,
  parEdits: 1,
  wrong: [{ name: 'bug', prog: l16bug }],
  title: 'Hộp bị quên',
  objective: 'Phép thu hồi sai ở lần thứ hai. Sửa 1 chỗ!',
  learningGoal:
    'Trong phép, đường đi ra dùng lặp 2 lần cố định. Lần đầu đúng (với 2), lần sau sai. Đổi thành lặp theo hộp số ô là đúng hết.',
  misconception: 'Phép có hộp mà vẫn dùng số cố định thì vẫn đúng.',
  mission: 'Thu hồi 3 khối ô nhiễm đỏ về phòng!',
  hints: [
    {
      id: 'first',
      when: { trigger: 'enter' },
      say: 'Lần đầu đúng, lần sau sai. Vì sao nhỉ?',
      point: 'block:cq_proc_def_n',
    },
    {
      id: 'box',
      when: ran('NOTHING_TO_GRAB'),
      say: 'Đường đi ra có dùng hộp số ô không?',
      point: 'block:cq_proc_def_n',
    },
  ],
  thinkingHint: 'Lần làm phép thứ hai, hộp có số mấy?',
  feedback: FEEDBACK_SPELL,
};

// l18: carry forward ("chở [số ô]" = tiến 1, gắp, lặp [số ô] {tiến 1}, thả) around a ring
// board: 4 jobs (carries 2, 1, 3, 1), the last one brings a pollution cube into the lab.
const CARRY_FWD: Item[] = ['f1', 'G', { rv: 'cells', b: ['f1'] }, 'T'];
const l18p: Prog = {
  main: [sn('carry', 2), 'R', sn('carry', 1), 'R', sn('carry', 3), 'R', sn('carry', 1)],
  defs: { carry: CARRY_FWD },
  params: { carry: 'cells' },
};
const bodyBug: Item[] = ['G', { rv: 'cells', b: ['f1'] }, 'T'];
const numberBugMain: Item[] = [
  sn('carry', 2),
  'R',
  sn('carry', 2),
  'R',
  sn('carry', 3),
  'R',
  sn('carry', 1),
];
const l18bug: Prog = { ...l18p, main: numberBugMain, defs: { carry: bodyBug } };
const l18: LevelSpec = {
  id: 'w08-l18',
  stage: 'challenge',
  kind: 'robotlab',
  mode: 'bughunt',
  maps: [
    {
      map: ['L...r', '.###.', 'g...y'],
      start: [0, 1],
      startDir: 'E',
      blocks: [nz('RED', [0, 2]), nz('YELLOW', [1, 4]), nz('GREEN', [2, 3]), pz([1, 0], 'YELLOW')],
      goal: { type: 'missions' },
    },
  ],
  toolbox: [
    'robot_forward',
    'robot_turn_left',
    'robot_turn_right',
    'robot_grab',
    'robot_release',
    DEFN,
    CALLN,
    boxLoop('cells'),
  ],
  procedures: [{ id: 'carry', name: 'chở', param: CELLS }],
  maxBlocks: 14,
  maxInstances: { cq_proc_def_n: 1 },
  solution: l18p,
  initial: l18bug,
  parEdits: 2,
  wrong: [
    { name: 'bug', prog: l18bug },
    { name: 'chỉ sửa thân', prog: { ...l18p, main: numberBugMain } },
    { name: 'chỉ sửa số', prog: { ...l18p, defs: { carry: bodyBug } } },
  ],
  title: 'Phép chở có 2 lỗi',
  objective: 'Có 2 lỗi: 1 trong phép, 1 ở số. Sửa nhé!',
  learningGoal:
    'Phép chở phải tiến 1 ô lên khối rồi mới gắp. Vòng quanh xưởng có 4 việc, chở 2, 1, 3, 1 ô. Khối trung hòa vàng cách trạm vàng 1 ô, nên lần làm phép thứ hai mang số 1.',
  misconception: 'Bíp gắp được khối ở ô phía trước.',
  mission: 'Vòng quanh xưởng: chở khối trung hòa đỏ, vàng, xanh lá!',
  hints: [
    {
      id: 'grab',
      when: ran('NOTHING_TO_GRAB'),
      say: 'Bíp đã tới ô có khối chưa? Trong phép thiếu khối nào?',
      point: 'block:cq_proc_def_n',
    },
    {
      id: 'off',
      when: ran('OFF_LINE'),
      say: 'Khối trung hòa vàng cách trạm vàng mấy ô?',
      point: 'stage',
    },
  ],
  thinkingHint: 'Sửa 1 lỗi, chạy thử. Lỗi còn lại ở đâu?',
  feedback: FEEDBACK_SPELL,
};

// boss: asymmetric halves (carry 1 east, 2 west) so the box is needed; order trap by the clock
// (curriculum.md §6.3.1, plan.ts: best 65 s, nearest pollution first ≥ 75 s, limit 70 s).
const NEUTRAL: Item[] = ['f1', 'L', 'f2', 'R', 'f2', 'G', 'R', { rv: 'cells', b: ['f1'] }, 'T'];
const RETRIEVE: Item[] = ['R', 'f1', 'G', 'f2', 'T'];
const bossp: Prog = {
  main: ['R', sn('neutral', 1), 'f1', s('fetch'), sn('neutral', 2), s('fetch')],
  defs: { neutral: NEUTRAL, fetch: RETRIEVE },
  params: { neutral: 'cells' },
};
export const BOSS_BOARD = {
  map: ['.......', '.#.#.#r', 'y..L...', '.#.#.#.', '.......'],
  startDir: 'N' as const,
  blocks: [nz('RED', [0, 6]), pz([2, 5]), nz('YELLOW', [4, 0]), pz([2, 1], 'YELLOW')],
};
/** Nearest job first: fetch the red pollution cube (2 crossings away), then the rest. */
const greedy: Item[] = [
  'R',
  'f2',
  'G',
  'R',
  'R',
  'f2',
  'T',
  'R',
  'R',
  sn('neutral', 1),
  'f1',
  'R',
  'f3',
  sn('neutral', 2),
  s('fetch'),
];
const boss: LevelSpec = {
  id: 'w08-boss',
  stage: 'boss',
  kind: 'robotlab',
  mode: 'build',
  maps: [{ ...BOSS_BOARD, goal: { type: 'missions', mustReturn: true }, rules: { timeLimit: 70 } }],
  toolbox: [...ROBOT, DEF, CALL, DEFN, CALLN, boxLoop('cells')],
  procedures: [
    { id: 'neutral', name: 'trung hòa', param: CELLS },
    { id: 'fetch', name: 'thu hồi' },
  ],
  maxBlocks: 25,
  maxInstances: { cq_proc_def: 1, cq_proc_def_n: 1, robot_grab: 2, robot_release: 2 },
  solution: bossp,
  parUnproven: true,
  wrong: [{ name: 'gần trước: thu hồi khối ô nhiễm đỏ trước', prog: { ...bossp, main: greedy } }],
  title: 'Ngày hội phép thuật',
  objective: 'Làm đủ 4 việc, về phòng trong 70 giây!',
  learningGoal:
    'Phép trung hòa (có hộp số ô) đi tới khối trung hòa rồi chở về trạm; phép thu hồi mang khối ô nhiễm gần đó về phòng. Trung hòa trước, thu hồi trên đường về: 65 giây. Thu hồi khối gần trước thì hết giờ.',
  misconception: 'Việc nào gần thì làm trước.',
  mission: 'Khối trung hòa đỏ, vàng về trạm; khối ô nhiễm về phòng!',
  hints: [
    {
      id: 'order',
      when: { trigger: 'enter' },
      say: 'Việc gần nhất có phải làm trước không?',
      point: 'stage',
    },
    {
      id: 'time',
      when: ran('OUT_OF_TIME'),
      say: 'Trung hòa xong, khối ô nhiễm nào ở gần?',
      point: 'stage',
    },
    grabCap('Chỉ 2 khối gắp. Gắp 4 lần bằng cách nào?', 'toolbox:cq_proc_def_n'),
    H.loose,
  ],
  thinkingHint: 'Làm việc nào trước thì đường về ngắn hơn?',
  feedback: FEEDBACK_SPELL,
};

export const LEVELS: LevelSpec[] = [
  l01,
  l02,
  l03,
  l04,
  l05,
  l06,
  l07,
  l08,
  l09,
  l10,
  l11,
  l12,
  l13,
  l14,
  l15,
  l16,
  l17,
  l18,
  l19,
  boss,
];

// ================================================================ lesson demos (one map, one program)
export interface DemoSpec {
  id: string;
  map: { map: string[]; startDir: string };
  procedures: LevelProcedure[];
  prog: Prog;
}
const LESSON_MAP = maze('########/######G#/#####..#/##....##/#S.#####/########', 'E');
const lessonCast: Prog = {
  main: [s('stair'), 'F', 'F', s('stair'), s('stair')],
  defs: { stair: STAIR },
};
const MOUNTAIN = maze('########/###...##/##..#..#/#S.###G#/########', 'E');
export const LOOP_DEMO: { prog: Prog; map: string } = {
  prog: { main: [s('stair'), 'F', 'F', { rep: 3, b: [s('stair')] }], defs: { stair: STAIR } },
  map: '#########/#######G#/######..#/#####..##/##....###/#S.######/#########',
};
export const DEMOS = {
  teach: {
    id: 'teach',
    map: LESSON_MAP,
    procedures: [P.stair],
    prog: { main: ['F'], defs: { stair: STAIR } },
  },
  cast: { id: 'cast', map: LESSON_MAP, procedures: [P.stair], prog: lessonCast },
  bug: {
    id: 'bug',
    map: LESSON_MAP,
    procedures: [P.stair],
    prog: { ...lessonCast, defs: { stair: ['F', 'R', 'F', 'R'] } },
  },
  loop: { id: 'loop', map: maze(LOOP_DEMO.map, 'E'), procedures: [P.stair], prog: LOOP_DEMO.prog },
  two: {
    id: 'two',
    map: MOUNTAIN,
    procedures: [P.up, P.down],
    prog: {
      main: [s('up'), s('up'), 'F', s('down'), s('down')],
      defs: { up: STAIR, down: STAIR_DOWN },
    },
  },
  twoSwap: {
    id: 'twoSwap',
    map: MOUNTAIN,
    procedures: [P.up, P.down],
    prog: {
      main: [s('up'), s('up'), 'F', s('up'), s('down')],
      defs: { up: STAIR, down: STAIR_DOWN },
    },
  },
  fork: {
    id: 'fork',
    map: maze('##########/#S...#####/###......#/#######G##/##########', 'E'),
    procedures: [P.forkR],
    prog: { main: [s('fork'), 'L', s('fork')], defs: { fork: FORK_R } },
  },
  box: {
    id: 'box',
    map: maze('####/#S.#/##.#/#G.#/####', 'E'),
    procedures: [P.turnFirst],
    prog: {
      main: ['F', sn('turn', 2), sn('turn', 1)],
      defs: { turn: TURN_FIRST },
      params: { turn: 'cells' },
    },
  },
} satisfies Record<string, DemoSpec>;
