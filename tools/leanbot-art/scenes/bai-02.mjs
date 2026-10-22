// Pictures for Bài 2 "Cánh tay kẹp thần kỳ" (content/leanbot/bai-02.json).
// The gripper moves in a plane facing the child, so most pictures use front(): 0 degrees hangs
// to the floor (open), 90 lies flat toward the middle (closed).
import {
  C,
  scene,
  pairScene,
  group,
  robot,
  front,
  arrow,
  arc,
  text,
  pill,
  badge,
  mark,
} from '../draw.mjs';
import {
  program,
  gripperOpen,
  gripperClose,
  gripperTo,
  gripperLR,
  wait,
  run,
  distance,
  stop,
} from '../blocks.mjs';

const card = (x, y, w, h, fill = C.white) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${fill}" stroke="${C.ink}" stroke-width="3"/>`;
const floor = (y, w) =>
  `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${C.inkSoft}" stroke-width="4"/>`;
/** A foam cube seen from above. */
const cubeTop = (x, y, s = 40) =>
  `<rect x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" rx="5" fill="${C.coin}" stroke="${C.ink}" stroke-width="3"/>`;
/** The arms clamp the cube at this angle: the cube stops them before 90. */
const GRIP = 24;

/** One arm on its own, big, for the safe-range fan. Angles as in front(): 0 down, 90 inward. */
function fan(cx, cy, r) {
  const pt = (deg) => [
    cx + r * Math.sin((deg * Math.PI) / 180),
    cy + r * Math.cos((deg * Math.PI) / 180),
  ];
  const wedge = (a, b, fill) => {
    const [x1, y1] = pt(a);
    const [x2, y2] = pt(b);
    return `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${b - a > 180 ? 1 : 0} 0 ${x2},${y2} Z" fill="${fill}" stroke="${C.ink}" stroke-width="2"/>`;
  };
  const label = (deg, s, color = C.ink) => {
    const [x, y] = pt(deg).map(
      (v, i) =>
        v + (i === 0 ? Math.sin((deg * Math.PI) / 180) : Math.cos((deg * Math.PI) / 180)) * 50,
    );
    return pill(x, y, s, { size: 22, fill: C.white, color });
  };
  return [
    wedge(-90, -30, C.oopsSoft),
    wedge(-30, 120, '#d6efd9'),
    wedge(120, 180, C.oopsSoft),
    `<g transform="translate(${cx} ${cy}) rotate(-90)"><rect x="-12" y="-8" width="24" height="${r - 10}" rx="10" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/></g>`,
    `<circle cx="${cx}" cy="${cy}" r="14" fill="#3f6fb5" stroke="${C.ink}" stroke-width="3"/>`,
    label(-30, '−30°'),
    label(0, '0° mở'),
    label(90, '90° đóng'),
    label(120, '120°'),
    label(155, '150: GÃY!', C.oops),
  ];
}

export const scenes = [
  {
    name: 'may-gap',
    svg: scene(
      780,
      340,
      `<rect x="40" y="30" width="250" height="280" rx="14" fill="${C.sky}" stroke="${C.ink}" stroke-width="3"/>`,
      `<line x1="165" y1="30" x2="165" y2="120" stroke="${C.ink}" stroke-width="4"/>`,
      `<path d="M165,120 l-30,40 M165,120 l30,40 M135,160 l10,14 M195,160 l-10,14" stroke="${C.ink}" stroke-width="6" stroke-linecap="round" fill="none"/>`,
      `<circle cx="165" cy="190" r="18" fill="${C.oops}" stroke="${C.ink}" stroke-width="3"/>`,
      [
        [90, 270, C.go],
        [140, 280, C.coin],
        [210, 272, C.brand],
        [250, 282, C.oops],
      ].map(
        ([x, y, f]) =>
          `<circle cx="${x}" cy="${y}" r="20" fill="${f}" stroke="${C.ink}" stroke-width="3"/>`,
      ),
      text(165, 330, 'Máy gắp thú', { size: 24 }),
      arrow(320, 170, 420, 170, { color: C.brandDeep }),
      front(590, 150, { left: GRIP, cube: true }),
      floor(255, 780),
      text(590, 300, 'Leanbot cũng có tay', { size: 24 }),
    ),
  },
  {
    name: 'servo-giu',
    svg: pairScene(
      520,
      420,
      front(260, 170, { left: 45 }),
      `<rect x="232" y="290" width="56" height="44" rx="8" fill="${C.coin}" stroke="${C.ink}" stroke-width="3"/><path d="M242,290 v-14 a18,18 0 0 1 36,0 v14" fill="none" stroke="${C.ink}" stroke-width="6"/>`,
      text(260, 380, 'Servo: tới góc rồi GIỮ', { size: 28 }),
    ),
  },
  {
    name: 'banh-quay-mai',
    svg: pairScene(
      520,
      420,
      `<circle cx="260" cy="180" r="90" fill="${C.tyre}" stroke="${C.ink}" stroke-width="3"/><circle cx="260" cy="180" r="40" fill="#9aa0aa" stroke="${C.ink}" stroke-width="3"/>`,
      arc(260, 180, 125, 20, 160, { color: C.brandDeep }),
      arc(260, 180, 125, 200, 340, { color: C.brandDeep }),
      text(260, 380, 'Bánh xe: quay mãi', { size: 28 }),
    ),
  },
  {
    name: 'goc-0',
    svg: pairScene(
      520,
      400,
      front(260, 170, { left: 0 }),
      floor(270, 520),
      pill(260, 340, '0 độ: MỞ', { size: 28, fill: C.go, color: C.white }),
    ),
  },
  {
    name: 'goc-90',
    svg: pairScene(
      520,
      400,
      front(260, 170, { left: 90 }),
      floor(270, 520),
      pill(260, 340, '90 độ: ĐÓNG', { size: 28, fill: C.sky }),
    ),
  },
  { name: 'khoang-an-toan', svg: scene(700, 500, fan(350, 240, 170)) },
  {
    name: 'mo-cang-khoi',
    blocks: {
      stacks: [{ x: 60, y: 40, blocks: program([gripperOpen({ id: 'g' })], { id: 'hat' }) }],
      badges: [
        { id: 'hat', n: '1' },
        { id: 'mission', n: '2', at: 'top' },
        { id: 'g', n: '3' },
        { id: 'mission', n: '4', at: 'bottom' },
      ],
    },
  },
  {
    name: 'dong-cang-khoi',
    blocks: { stacks: [{ x: 60, y: 40, blocks: program([gripperClose()]) }] },
  },
  {
    name: 'dong-cang',
    svg: pairScene(
      520,
      400,
      front(260, 170, { left: 90 }),
      floor(270, 520),
      text(260, 340, 'Hai càng khép vào', { size: 28 }),
    ),
  },
  {
    name: 'xoay-120-khoi',
    blocks: {
      stacks: [{ x: 60, y: 30, blocks: gripperTo(120, { id: 'g' }) }],
      rings: [{ id: 'g', input: 'angleDeg' }],
    },
  },
  {
    name: 'xoay-120',
    svg: pairScene(
      520,
      400,
      front(260, 170, { left: 120 }),
      floor(270, 520),
      text(260, 340, '120 độ: đóng sát hơn', { size: 28 }),
    ),
  },
  {
    name: 'ba-o',
    blocks: {
      stacks: [{ x: 60, y: 80, blocks: gripperLR(120, -30, 100, { id: 'g' }) }],
      rings: [
        { id: 'g', input: 'angleDegL', n: '1' },
        { id: 'g', input: 'angleDegR', n: '2' },
        { id: 'g', input: 'timeMs', n: '3' },
      ],
    },
  },
  {
    name: 'mili-giay',
    svg: scene(
      860,
      230,
      `<rect x="60" y="80" width="740" height="40" rx="20" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/>`,
      `<rect x="64" y="84" width="366" height="32" rx="16" fill="${C.coin}"/>`,
      `<rect x="430" y="84" width="366" height="32" rx="16" fill="${C.go}"/>`,
      text(60, 50, '0', { size: 26 }),
      text(430, 50, '500 mili giây', { size: 26 }),
      text(800, 50, '1000 mili giây', { size: 26, anchor: 'end' }),
      pill(250, 170, 'nửa giây', { size: 24, fill: C.coin }),
      pill(620, 170, '1 giây', { size: 24, fill: C.go, color: C.white }),
    ),
  },
  {
    name: 'nhanh-cham-khoi',
    blocks: {
      stacks: [
        {
          x: 60,
          y: 30,
          blocks: [
            gripperLR(120, -30, 100, { id: 'a' }),
            wait(2, { id: 'b' }),
            gripperLR(-30, 120, 5000, { id: 'c' }),
            wait(2, { id: 'd' }),
          ],
        },
      ],
      badges: ['a', 'b', 'c', 'd'].map((id, i) => ({ id, n: String(i + 1) })),
      rings: [
        { id: 'a', input: 'timeMs' },
        { id: 'c', input: 'timeMs' },
      ],
    },
  },
  {
    name: 'gap-4-buoc',
    svg: scene(
      1000,
      330,
      [
        [
          'Tới gần vật',
          (x) =>
            cubeTop(x + 60, 70) +
            robot(x, 190, { scale: 0.8 }) +
            arrow(x, 120, x, 96, { color: C.go, width: 6, head: 14 }),
        ],
        ['Mở càng', (x) => front(x, 140, { left: 0, scale: 0.75 })],
        ['Hạ càng vào đúng chỗ', (x) => front(x, 140, { left: 0, scale: 0.75, cube: true })],
        ['Đóng càng', (x) => front(x, 140, { left: GRIP, scale: 0.75, cube: true })],
      ].map(([label, draw], i) => {
        const x = 20 + i * 245;
        return (
          card(x, 20, 230, 290) +
          badge(x + 28, 46, String(i + 1)) +
          draw(x + 115) +
          text(x + 115, 280, label, { size: 22 })
        );
      }),
    ),
  },
  {
    name: 'tha-4-buoc',
    svg: scene(
      1000,
      330,
      [
        [
          'Đi tới nơi thả',
          (x) =>
            `<rect x="${x - 40}" y="50" width="80" height="60" rx="6" fill="none" stroke="${C.go}" stroke-width="4" stroke-dasharray="8 6"/>` +
            cubeTop(x, 150, 34) +
            robot(x, 220, { scale: 0.6 }) +
            arrow(x, 120, x, 106, { color: C.go, width: 6, head: 14 }),
        ],
        [
          'Đứng đúng chỗ',
          (x) =>
            `<rect x="${x - 40}" y="50" width="80" height="60" rx="6" fill="none" stroke="${C.go}" stroke-width="4" stroke-dasharray="8 6"/>` +
            cubeTop(x, 80, 34) +
            robot(x, 150, { scale: 0.6 }),
        ],
        ['Mở càng, khối rơi', (x) => front(x, 130, { left: 0, scale: 0.75, cube: true })],
        [
          'Lùi ra',
          (x) =>
            `<rect x="${x - 40}" y="50" width="80" height="60" rx="6" fill="none" stroke="${C.go}" stroke-width="4" stroke-dasharray="8 6"/>` +
            cubeTop(x, 80, 34) +
            robot(x, 200, { scale: 0.6 }) +
            arrow(x, 236, x, 262, { color: C.coinDeep, width: 6, head: 14 }),
        ],
      ].map(([label, draw], i) => {
        const x = 20 + i * 245;
        return (
          card(x, 20, 230, 290) +
          badge(x + 28, 46, String(i + 1)) +
          draw(x + 115) +
          text(x + 115, 290, label, { size: 22 })
        );
      }),
    ),
  },
  {
    name: 'dong-roi-chay',
    svg: scene(
      900,
      300,
      `<rect x="30" y="80" width="150" height="130" rx="10" fill="${C.brandSoft}" stroke="${C.ink}" stroke-width="3"/>`,
      text(105, 145, 'KHO', { size: 30 }),
      `<rect x="720" y="80" width="150" height="130" rx="10" fill="${C.sky}" stroke="${C.ink}" stroke-width="3"/>`,
      text(795, 145, 'KHU PHỐ', { size: 28 }),
      arrow(200, 145, 700, 145, { color: C.go, dash: '2 16', width: 8 }),
      cubeTop(512, 145, 36),
      robot(440, 145, { angle: 90, scale: 0.7 }),
      pill(450, 60, 'Càng ĐÓNG suốt đường', { size: 24, fill: C.coin }),
      pill(795, 260, 'Tới nơi mới MỞ', { size: 22, fill: C.white }),
    ),
  },
  {
    name: 'cho-1-giay',
    blocks: {
      stacks: [
        {
          x: 60,
          y: 30,
          blocks: [gripperClose(), wait(1, { id: 'w' }), run(30, 30), distance(20), stop()],
        },
      ],
      rings: [{ id: 'w', input: 'Delay' }],
    },
  },
  {
    name: 'may-gap-thu',
    svg: scene(
      860,
      300,
      `<path d="M120,190 L160,230 M160,190 L120,230" stroke="${C.oops}" stroke-width="7" stroke-linecap="round"/>`,
      robot(140, 120, { angle: 90, scale: 0.8 }),
      cubeTop(640, 120, 50),
      arrow(220, 100, 580, 100, { color: C.go }),
      arrow(580, 160, 220, 160, { color: C.coinDeep }),
      pill(140, 40, '1. Càng MỞ', { size: 20, fill: C.white }),
      pill(400, 60, '2. Tiến tới', { size: 20, fill: C.white }),
      pill(700, 40, '3. Đóng, gắp', { size: 20, fill: C.coin }),
      pill(400, 200, '4. Lùi về', { size: 20, fill: C.white }),
      pill(140, 270, '5. Mở, thả khối', { size: 20, fill: C.coin }),
      text(640, 190, 'khối xốp', { size: 22 }),
    ),
  },
  {
    name: 'chop-hut',
    svg: pairScene(
      520,
      420,
      `<rect x="232" y="96" width="56" height="56" rx="6" fill="${C.coin}" stroke="${C.ink}" stroke-width="3" opacity="0.9"/>`,
      front(260, 200, { left: 90 }),
      floor(300, 520),
      text(260, 360, 'Càng khép vào chỗ trống', { size: 26 }),
      mark(470, 50, false, 26),
    ),
  },
  {
    name: 'gap-trung',
    svg: pairScene(
      520,
      420,
      front(260, 200, { left: GRIP, cube: true }),
      floor(300, 520),
      text(260, 360, 'Tiến gần rồi mới đóng', { size: 26 }),
      mark(470, 50, true, 26),
    ),
  },
  {
    name: 'so-ky-su',
    svg: scene(
      620,
      320,
      `<rect x="120" y="30" width="380" height="270" rx="10" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/>`,
      [0, 1, 2, 3, 4].map(
        (i) =>
          `<circle cx="120" cy="${70 + i * 52}" r="8" fill="${C.paper}" stroke="${C.ink}" stroke-width="3"/>`,
      ),
      ['Khó nhất là…', 'Lần sau con sẽ…', 'Con tự hào vì…'].map(
        (s, i) =>
          badge(170, 90 + i * 72, String(i + 1)) +
          text(200, 90 + i * 72, s, { size: 26, anchor: 'start', font: 'body' }) +
          `<line x1="200" y1="${116 + i * 72}" x2="470" y2="${116 + i * 72}" stroke="${C.brandSoft}" stroke-width="3"/>`,
      ),
      group(
        'translate(520 200) rotate(30)',
        `<rect x="-10" y="-90" width="20" height="150" rx="4" fill="${C.coin}" stroke="${C.ink}" stroke-width="3"/><path d="M-10,60 L0,86 L10,60 z" fill="#f6c9a5" stroke="${C.ink}" stroke-width="3"/>`,
      ),
    ),
  },
  {
    name: 'nhac-robot',
    svg: scene(
      620,
      440,
      front(310, 210, { left: GRIP, cube: true }),
      // two hands holding the body by its sides
      `<rect x="200" y="120" width="44" height="70" rx="20" fill="#f6c9a5" stroke="${C.ink}" stroke-width="3"/>`,
      `<rect x="376" y="120" width="44" height="70" rx="20" fill="#f6c9a5" stroke="${C.ink}" stroke-width="3"/>`,
      arrow(110, 300, 110, 150, { color: C.go }),
      arrow(510, 300, 510, 150, { color: C.go }),
      floor(400, 620),
      pill(310, 370, 'Nhấc lên 5 giây: khối không rơi', { size: 22, fill: C.coin }),
    ),
  },
];
