// Pictures for Bài 1 "Cùng di chuyển" (content/leanbot/bai-01.json).
import {
  C,
  scene,
  pairScene,
  touchPads,
  group,
  robot,
  arrow,
  arc,
  text,
  pill,
  badge,
  mark,
  ruler,
  finger,
  child,
} from '../draw.mjs';
import { program, run, distance, turnBy, stop } from '../blocks.mjs';

/** Motion blocks are this blue in the editor. */
const BLOCK = '#4c6fd1';

/** A little block shape, for drawings that talk about blocks without showing a real program. */
const miniBlock = (x, y, w, fill = BLOCK) =>
  `<path d="M${x},${y} h14 l6,6 h14 l6,-6 h${w - 40} v30 h${-(w - 40)} l-6,6 h-14 l-6,-6 h-14 z" fill="${fill}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;

// --- the noodle pot, five little pictures -------------------------------------------------
const bowl = (x, y) =>
  `<path d="M${x - 50},${y} h100 a50,42 0 0 1 -100,0 z" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/><rect x="${x - 22}" y="${y + 38}" width="44" height="8" rx="3" fill="${C.ink}"/>`;
const noodles = (x, y) =>
  `<path d="M${x - 40},${y + 2} q10,-12 20,0 t20,0 t20,0 t20,0" fill="none" stroke="${C.coinDeep}" stroke-width="5" stroke-linecap="round"/>`;
const steam = (x, y) =>
  [-18, 0, 18]
    .map(
      (dx) =>
        `<path d="M${x + dx},${y} q-8,-12 0,-24 t0,-24" fill="none" stroke="${C.inkSoft}" stroke-width="3" stroke-linecap="round" opacity="0.6"/>`,
    )
    .join('');
const packet = (x, y) =>
  `<path d="M${x - 50},${y - 40} l12,-8 l12,8 l12,-8 l12,8 l12,-8 l12,8 l12,-8 l16,8 v80 h-100 z" fill="${C.coin}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>${text(x, y + 2, 'MÌ', { size: 30, color: C.oops })}`;
const kettle = (x, y) =>
  `<g transform="translate(${x} ${y}) rotate(-28)"><rect x="-34" y="-30" width="68" height="56" rx="16" fill="${C.brandSoft}" stroke="${C.ink}" stroke-width="3"/><path d="M34,-10 l30,-16 l4,8 l-30,22 z" fill="${C.brandSoft}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/><path d="M-20,-30 q20,-26 40,0" fill="none" stroke="${C.ink}" stroke-width="5"/></g>`;
const clock = (x, y) =>
  `<circle cx="${x}" cy="${y}" r="42" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/><line x1="${x}" y1="${y}" x2="${x}" y2="${y - 28}" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/><line x1="${x}" y1="${y}" x2="${x + 18}" y2="${y + 10}" stroke="${C.oops}" stroke-width="5" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="5" fill="${C.ink}"/>`;
const chopsticks = (x, y) =>
  `<line x1="${x + 10}" y1="${y - 6}" x2="${x + 62}" y2="${y - 62}" stroke="${C.coinDeep}" stroke-width="6" stroke-linecap="round"/><line x1="${x + 22}" y1="${y - 2}" x2="${x + 72}" y2="${y - 52}" stroke="${C.coinDeep}" stroke-width="6" stroke-linecap="round"/>`;

const noodleSteps = [
  ['Xé gói mì', (x, y) => packet(x, y)],
  ['Cho mì vào bát', (x, y) => bowl(x, y + 4) + noodles(x, y + 4)],
  [
    'Đổ nước sôi',
    (x, y) =>
      bowl(x + 18, y + 22) +
      kettle(x - 20, y - 26) +
      `<circle cx="${x + 30}" cy="${y - 2}" r="5" fill="#5aa9e6"/><circle cx="${x + 22}" cy="${y + 12}" r="5" fill="#5aa9e6"/>`,
  ],
  ['Chờ 3 phút', (x, y) => clock(x, y) + pill(x, y + 62, '3 phút', { size: 18, fill: C.coin })],
  [
    'Ăn thôi!',
    (x, y) =>
      bowl(x - 8, y + 10) +
      noodles(x - 8, y + 10) +
      steam(x - 8, y - 6) +
      chopsticks(x - 8, y + 10),
  ],
];

// --- turning in place: wheel arrows and the spin ------------------------------------------
function spin(cx, cy, dir) {
  const right = dir === 'right';
  const fwd = right ? -60 : 60; // x of the wheel that goes forward
  const back = -fwd;
  return [
    robot(cx, cy),
    arrow(cx + fwd, cy + 34, cx + fwd, cy - 46, { color: C.go, width: 7, head: 18 }),
    arrow(cx + back, cy - 10, cx + back, cy + 70, { color: C.coinDeep, width: 7, head: 18 }),
    arc(cx, cy, 128, right ? -40 : 40, right ? 90 : -90, {
      color: C.brandDeep,
      width: 8,
      head: 24,
    }),
    pill(cx + (right ? 150 : -150), cy + 76, right ? 'Quay phải' : 'Quay trái', {
      size: 24,
      fill: C.coin,
    }),
  ];
}

export const scenes = [
  {
    name: 'ky-su',
    svg: scene(
      860,
      300,
      text(150, 46, 'Con ra lệnh', { size: 30 }),
      miniBlock(70, 80, 160),
      miniBlock(70, 116, 160),
      miniBlock(70, 152, 160),
      arrow(290, 150, 450, 150, { color: C.brandDeep }),
      robot(600, 170, { angle: 90 }),
      arrow(680, 170, 800, 170, { color: C.go }),
      text(650, 46, 'Leanbot làm đúng từng lệnh', { size: 30 }),
      pill(150, 250, 'khối lệnh', { size: 20, fill: C.brandSoft }),
      pill(620, 262, 'robot chạy thật', { size: 20, fill: C.brandSoft }),
    ),
  },
  {
    name: 'pha-mi',
    svg: scene(
      1000,
      270,
      noodleSteps.map(([label, draw], i) => {
        const x = 100 + i * 200;
        return [
          badge(x - 70, 34, String(i + 1)),
          draw(x, 116),
          text(x, 232, label, { size: 24 }),
          i < 4 ? arrow(x + 72, 116, x + 128, 116, { color: C.brandDeep, width: 5, head: 14 }) : '',
        ].join('');
      }),
    ),
  },
  {
    name: 'tren-xuong',
    blocks: {
      stacks: [
        {
          x: 60,
          y: 30,
          blocks: [run(30, 30, { id: 'a' }), distance(15, { id: 'b' }), stop({ id: 'c' })],
        },
      ],
      badges: [
        { id: 'a', n: '1' },
        { id: 'b', n: '2' },
        { id: 'c', n: '3' },
      ],
    },
  },
  {
    name: 'lang-vi',
    svg: scene(
      900,
      250,
      `<rect x="30" y="40" width="840" height="70" rx="35" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/>`,
      `<circle cx="78" cy="75" r="14" fill="none" stroke="${C.inkSoft}" stroke-width="3"/>`,
      text(590, 76, 'ide.pythaverse.space/lbeditor/', {
        size: 32,
        anchor: 'end',
        color: C.inkSoft,
        font: 'body',
      }),
      `<rect x="596" y="50" width="150" height="52" rx="12" fill="${C.coin}" stroke="${C.ink}" stroke-width="3"/>`,
      text(671, 76, '?lang=vi', { size: 32, font: 'body' }),
      arrow(671, 180, 671, 118, { color: C.brandDeep }),
      text(450, 214, 'Gõ thêm vào cuối, rồi bấm Enter', { size: 28 }),
    ),
  },
  {
    name: 'keo-chua-dinh',
    blocks: {
      stacks: [
        { x: 60, y: 30, blocks: run(30, 30) },
        { x: 90, y: 104, blocks: distance(15) },
      ],
    },
  },
  {
    name: 'keo-da-khop',
    blocks: { stacks: [{ x: 60, y: 30, blocks: [run(30, 30), distance(15)] }] },
  },
  {
    name: 'khung-dung',
    blocks: {
      stacks: [
        {
          x: 60,
          y: 40,
          blocks: program([run(30, 30, { id: 'a' }), distance(15), stop()], { id: 'hat' }),
        },
      ],
      badges: [
        { id: 'hat', n: '1' },
        { id: 'mission', n: '2', at: 'top' },
        { id: 'a', n: '3' },
        { id: 'mission', n: '4', at: 'bottom' },
      ],
    },
  },
  {
    name: 'khung-sai',
    blocks: {
      stacks: [
        { x: 60, y: 40, blocks: program([]) },
        { x: 60, y: 190, blocks: [run(30, 30), distance(15), stop()] },
      ],
    },
  },
  {
    name: 'di-thang',
    svg: scene(
      800,
      360,
      robot(210, 250, { wheels: ['Trái 30', 'Phải 30'] }),
      arrow(210, 170, 210, 100),
      text(210, 60, 'chậm', { size: 28, color: C.goDeep }),
      robot(590, 250, { wheels: ['Trái 50', 'Phải 50'] }),
      arrow(590, 170, 590, 40),
      text(680, 60, 'nhanh hơn', { size: 28, color: C.goDeep }),
    ),
  },
  {
    name: 'di-15cm-khoi',
    blocks: { stacks: [{ x: 60, y: 40, blocks: program([run(30, 30), distance(15), stop()]) }] },
  },
  {
    name: 'di-15cm',
    svg: scene(
      520,
      400,
      robot(200, 310, { ghost: true }),
      robot(200, 120),
      arrow(200, 290, 200, 196, { color: C.go }),
      ruler(250, 352, 250, 162, '15 cm', { offset: 70 }),
      text(200, 380, 'xuất phát', { size: 22, color: C.inkSoft }),
    ),
  },
  {
    name: 'cham-hai-nut',
    svg: scene(
      600,
      400,
      group('translate(300 260) scale(2)', robot(0, 0), touchPads(['TB1A', 'TB1B'])),
      // TB1A front-left, TB1B front-right: strips along the board's edge, ahead of the wheels
      finger(242, 204),
      finger(358, 204),
      pill(150, 204, 'TB1A', { size: 24, fill: C.white }),
      pill(450, 204, 'TB1B', { size: 24, fill: C.white }),
      pill(300, 40, 'Chạm CÙNG LÚC 2 vùng phía trước', { size: 24, fill: C.coin }),
    ),
  },
  {
    name: 'toi-lui',
    svg: scene(
      800,
      400,
      robot(210, 230, { wheels: ['30', '30'] }),
      arrow(210, 150, 210, 50),
      pill(210, 360, 'Không dấu trừ: TỚI', { size: 22, fill: C.white }),
      robot(590, 150, { wheels: ['−50', '−50'] }),
      arrow(590, 200, 590, 300, { color: C.coinDeep }),
      pill(590, 360, 'Có dấu trừ: LÙI', { size: 22, fill: C.coin }),
    ),
  },
  {
    name: 'toc-do',
    svg: (() => {
      const cx = 380;
      const cy = 270;
      const r = 200;
      const pt = (deg, rr = r) => [
        cx + rr * Math.sin((deg * Math.PI) / 180),
        cy - rr * Math.cos((deg * Math.PI) / 180),
      ];
      const [lx, ly] = pt(-90);
      const [rx, ry] = pt(90);
      const [nx, ny] = pt((30 / 59) * 90, r - 40);
      return scene(
        760,
        360,
        `<path d="M${lx},${ly} A${r},${r} 0 0 1 ${rx},${ry}" fill="none" stroke="${C.go}" stroke-width="34"/>`,
        `<path d="M${lx},${ly} A${r},${r} 0 0 1 ${rx},${ry}" fill="none" stroke="${C.ink}" stroke-width="3" transform="translate(0 0)" opacity="0"/>`,
        [-90, -45, 0, 45, 90].map((d) => {
          const [ax, ay] = pt(d, r - 24);
          const [bx, by] = pt(d, r + 24);
          return `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="${C.ink}" stroke-width="4"/>`;
        }),
        text(lx, ly + 34, '−59', { size: 30 }),
        text(cx, cy - r - 46, '0', { size: 30 }),
        text(rx, ry + 34, '59', { size: 30 }),
        text(lx + 6, ly + 70, 'lùi nhanh', { size: 22, color: C.inkSoft }),
        text(cx, cy - r - 80, 'đứng yên', { size: 22, color: C.inkSoft }),
        text(rx - 6, ry + 70, 'tới nhanh', { size: 22, color: C.inkSoft }),
        `<line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="${C.oops}" stroke-width="8" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="14" fill="${C.ink}"/>`,
        pill(cx, cy + 50, 'Ví dụ: 30', { size: 22, fill: C.white }),
      );
    })(),
  },
  {
    name: 'xoay-tai-cho',
    svg: scene(
      560,
      380,
      spin(280, 210, 'right'),
      text(150, 40, 'bánh trái TỚI', { size: 22, color: C.goDeep }),
      text(420, 360, 'bánh phải LÙI', { size: 22, color: C.coinDeep }),
    ),
  },
  {
    name: 'chay-sang-re',
    blocks: {
      stacks: [{ x: 60, y: 30, blocks: run(50, -50, { turn: true, id: 'r' }) }],
      rings: [{ id: 'r', field: 'MotionType' }],
    },
  },
  {
    name: 'bao-nhieu-do',
    svg: scene(
      1000,
      360,
      [
        [90, '90 độ', 'góc vuông'],
        [180, '180 độ', 'quay ngược lại'],
        [360, '360 độ', 'đúng một vòng'],
      ].map(([deg, big, small], i) => {
        const x = 170 + i * 330;
        return [
          robot(x, 170, { angle: deg % 360, scale: 0.8 }),
          arc(x, 170, 110, 0, deg, { color: C.brandDeep, width: 7, head: 20 }),
          text(x, 318, big, { size: 30 }),
          text(x, 348, small, { size: 20, color: C.inkSoft }),
        ].join('');
      }),
    ),
  },
  {
    name: 'trai-phai-doi-dien',
    svg: pairScene(
      520,
      420,
      robot(260, 110, { angle: 180 }),
      pill(400, 110, 'Trái robot', { size: 24, fill: C.white }),
      pill(120, 110, 'Phải robot', { size: 24, fill: C.white }),
      child(260, 310),
      pill(120, 310, 'Trái con', { size: 24, fill: C.sky }),
      pill(400, 310, 'Phải con', { size: 24, fill: C.sky }),
      mark(470, 380, false, 30),
    ),
  },
  {
    name: 'trai-phai-sau-lung',
    svg: pairScene(
      520,
      420,
      robot(260, 120),
      pill(120, 120, 'Trái robot', { size: 24, fill: C.white }),
      pill(400, 120, 'Phải robot', { size: 24, fill: C.white }),
      child(260, 320),
      pill(120, 320, 'Trái con', { size: 24, fill: C.sky }),
      pill(400, 320, 'Phải con', { size: 24, fill: C.sky }),
      mark(470, 380, true, 30),
    ),
  },
  {
    name: 'quay-phai-khoi',
    blocks: {
      stacks: [{ x: 60, y: 30, blocks: [run(50, -50, { turn: true }), turnBy(90), stop()] }],
    },
  },
  { name: 'quay-phai', svg: scene(560, 380, spin(280, 210, 'right')) },
  {
    name: 'quay-trai-khoi',
    blocks: {
      stacks: [{ x: 60, y: 30, blocks: [run(-50, 50, { turn: true }), turnBy(90), stop()] }],
    },
  },
  { name: 'quay-trai', svg: scene(560, 380, spin(280, 210, 'left')) },
  {
    name: 'quay-lo',
    svg: (() => {
      const cx = 230;
      const cy = 220;
      const ray = (deg, len, color, dash = '') =>
        `<line x1="${cx}" y1="${cy}" x2="${cx + len * Math.sin((deg * Math.PI) / 180)}" y2="${cy - len * Math.cos((deg * Math.PI) / 180)}" stroke="${color}" stroke-width="6" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
      return scene(
        600,
        400,
        ray(90, 300, C.go, '14 10'),
        ray(118, 300, C.oops),
        robot(cx, cy, { scale: 0.8 }),
        arc(cx, cy, 120, 0, 118, { color: C.oops, width: 7 }),
        pill(500, 165, 'muốn: 90°', { size: 22, fill: C.white }),
        pill(480, 370, 'quay lố!', { size: 22, fill: C.oopsSoft }),
      );
    })(),
  },
  {
    name: 'thu-suc-1-khoi',
    blocks: {
      stacks: [
        {
          x: 60,
          y: 30,
          blocks: [
            run(50, 50, { id: 'a' }),
            distance(50, { id: 'b' }),
            stop({ id: 'c' }),
            run(30, -30, { turn: true, id: 'd' }),
            turnBy(85, { id: 'e' }),
            stop({ id: 'f' }),
          ],
        },
      ],
      badges: ['a', 'b', 'c', 'd', 'e', 'f'].map((id, i) => ({ id, n: String(i + 1) })),
    },
  },
  {
    name: 'thu-suc-1',
    svg: scene(
      560,
      460,
      robot(200, 390, { ghost: true, scale: 0.8 }),
      arrow(200, 350, 200, 150, { color: C.go }),
      ruler(200, 410, 200, 120, '50 cm', { offset: -90 }),
      robot(200, 110, { angle: 90, scale: 0.8 }),
      arc(200, 110, 95, -10, 90, { color: C.brandDeep, width: 6, head: 18 }),
      pill(420, 110, 'rồi quay phải', { size: 22, fill: C.coin }),
      text(200, 445, 'xuất phát', { size: 20, color: C.inkSoft }),
    ),
  },
  {
    name: 'chu-l',
    svg: scene(
      620,
      460,
      `<polyline points="140,400 140,120 420,120" fill="none" stroke="${C.brandSoft}" stroke-width="26" stroke-linejoin="round"/>`,
      robot(140, 400, { ghost: true, scale: 0.6 }),
      arrow(140, 360, 140, 140, { color: C.go }),
      arrow(150, 120, 410, 120, { color: C.go }),
      robot(450, 120, { scale: 0.6 }),
      pill(70, 250, '50 cm', { size: 20, fill: C.coin }),
      pill(280, 70, '35 cm', { size: 20, fill: C.coin }),
      pill(160, 40, 'quay phải', { size: 18, fill: C.white }),
      pill(520, 200, 'quay trái', { size: 18, fill: C.white }),
      text(140, 445, 'xuất phát', { size: 20, color: C.inkSoft }),
    ),
  },
  {
    name: 'kho-bau',
    svg: (() => {
      const cells = [];
      for (let x = 40; x <= 600; x += 40)
        cells.push(
          `<line x1="${x}" y1="30" x2="${x}" y2="430" stroke="${C.brandSoft}" stroke-width="2"/>`,
        );
      for (let y = 30; y <= 430; y += 40)
        cells.push(
          `<line x1="40" y1="${y}" x2="600" y2="${y}" stroke="${C.brandSoft}" stroke-width="2"/>`,
        );
      const chest = (x, y) =>
        `<rect x="${x - 34}" y="${y - 6}" width="68" height="40" rx="4" fill="#a0632e" stroke="${C.ink}" stroke-width="3"/><path d="M${x - 34},${y - 6} q34,-34 68,0 z" fill="#c07a3a" stroke="${C.ink}" stroke-width="3"/><rect x="${x - 7}" y="${y - 2}" width="14" height="16" fill="${C.coin}" stroke="${C.ink}" stroke-width="2"/>`;
      const flag = (x, y) =>
        `<line x1="${x}" y1="${y + 30}" x2="${x}" y2="${y - 34}" stroke="${C.ink}" stroke-width="4"/><path d="M${x},${y - 34} l36,12 l-36,12 z" fill="${C.oops}" stroke="${C.ink}" stroke-width="3"/>`;
      return scene(
        640,
        470,
        cells,
        `<path d="M110,390 L150,350 M150,390 L110,350" stroke="${C.oops}" stroke-width="8" stroke-linecap="round"/>`,
        arrow(130, 340, 130, 150, { color: C.go, dash: '2 14', width: 7 }),
        arrow(160, 130, 410, 130, { color: C.go, dash: '2 14', width: 7 }),
        flag(130, 120),
        chest(470, 130),
        pill(60, 250, '50 cm', { size: 20, fill: C.coin, anchor: 'start' }),
        pill(290, 84, '30 cm', { size: 20, fill: C.coin }),
        pill(200, 190, 'quay phải 90°', { size: 18, fill: C.white, anchor: 'start' }),
        text(130, 440, 'X: xuất phát', { size: 22 }),
        text(470, 200, 'kho báu', { size: 22 }),
      );
    })(),
  },
  {
    name: 'sua-loi',
    svg: scene(
      800,
      430,
      [20, 110, 200, 290].map((a) =>
        arc(380, 215, 150, a, a + 50, { color: C.brandDeep, width: 6, head: 18 }),
      ),
      pill(380, 65, '1. Nhìn chỗ sai', { size: 22, fill: C.white }),
      pill(620, 215, '2. Kiểm số từng khối', { size: 22, fill: C.white }),
      pill(380, 365, '3. Chỉnh một chút', { size: 22, fill: C.white }),
      pill(140, 215, '4. Chạy thử lại', { size: 22, fill: C.coin }),
      text(380, 215, 'SỬA LỖI', { size: 34, color: C.brandDeep }),
    ),
  },
  {
    name: 'do-50cm',
    svg: scene(
      800,
      330,
      `<rect x="0" y="80" width="800" height="200" fill="${C.floor}"/>`,
      `<rect x="122" y="70" width="18" height="220" fill="${C.coin}" stroke="${C.ink}" stroke-width="2"/>`,
      `<rect x="622" y="70" width="18" height="220" fill="${C.coin}" stroke="${C.ink}" stroke-width="2"/>`,
      robot(143, 180, { angle: 90, scale: 0.8 }),
      robot(643, 180, { angle: 90, scale: 0.8, ghost: true }),
      ruler(131, 300, 631, 300, '50 cm'),
      text(131, 40, 'băng dính 1', { size: 22 }),
      text(631, 40, 'băng dính 2', { size: 22 }),
    ),
  },
];
