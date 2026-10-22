// Pictures for Bài 4 "Đi theo đường thông minh" (content/leanbot/bai-04.json).
// The four line eyes are drawn as ① ② ③ ④ across the robot's nose, robot's left to right, and
// what they see as four boxes ▢ ■ the way the lesson writes them.
import {
  C,
  scene,
  pairScene,
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
} from '../draw.mjs';

const card = (x, y, w, h, fill = C.white) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${fill}" stroke="${C.ink}" stroke-width="3"/>`;
const tape = (d, w = 36) =>
  `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

/** Four boxes for what the eyes see: '1' black, '0' white. */
function boxes(x, y, pattern, size = 34) {
  return [...pattern]
    .map(
      (c, i) =>
        `<rect x="${x + i * (size + 8) - (2 * size + 12)}" y="${y - size / 2}" width="${size}" height="${size}" rx="4" fill="${c === '1' ? C.ink : C.white}" stroke="${C.ink}" stroke-width="3"/>`,
    )
    .join('');
}

/** Robot from above facing up, with its four line eyes across the nose; `seen` colours them. */
function eyes(x, y, { scale = 1, seen = '0000', ghost = false, angle = 0 } = {}) {
  // the sensor strip sits under the nose, ahead of the gripper's root
  const dots =
    `<rect x="-38" y="-84" width="76" height="20" rx="6" fill="${C.brandDeep}" stroke="${C.ink}" stroke-width="2.5"/>` +
    [-27, -9, 9, 27]
      .map(
        (dx, i) =>
          `<circle cx="${dx}" cy="-74" r="7" fill="${seen[i] === '1' ? C.go : C.white}" stroke="${C.ink}" stroke-width="2.5"/>`,
      )
      .join('');
  return group(
    `translate(${x} ${y}) rotate(${angle}) scale(${scale})`,
    robot(0, 0, { ghost }),
    dots,
  );
}

/** A robot over a vertical black line, offset so its eyes read `pattern`. */
function overLine(cx, cy, pattern, s = 0.9) {
  // centre of the line, robot's left (picture left) negative, in robot units
  const centre = { '0110': 0, 1100: -18, '0011': 18, '0001': 27, 1000: -27 }[pattern];
  return [
    centre === undefined
      ? ''
      : `<rect x="${cx + (centre - 16) * s}" y="${cy - 150}" width="${32 * s}" height="240" fill="${C.ink}"/>`,
    eyes(cx, cy + 40, { scale: s, seen: pattern }),
  ].join('');
}

/** Four status lights on the nose, all one colour. */
const lights = (x, y, color, blink = false) =>
  [-30, -10, 10, 30]
    .map(
      (dx) =>
        `<circle cx="${x + dx}" cy="${y}" r="9" fill="${color}" stroke="${C.ink}" stroke-width="2.5"/>`,
    )
    .join('') +
  (blink
    ? `<path d="M${x - 50},${y - 18} l-10,-8 M${x + 50},${y - 18} l10,-8" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`
    : '');

export const scenes = [
  {
    name: 'nha-may',
    svg: scene(
      860,
      320,
      `<rect x="20" y="20" width="160" height="110" rx="10" fill="${C.brandSoft}" stroke="${C.ink}" stroke-width="3"/>`,
      text(100, 75, 'KHU A', { size: 26 }),
      `<rect x="680" y="190" width="160" height="110" rx="10" fill="${C.sky}" stroke="${C.ink}" stroke-width="3"/>`,
      text(760, 245, 'KHU B', { size: 26 }),
      tape('M180,75 H380 Q450,75 450,145 V180 Q450,245 520,245 H680', 22),
      robot(450, 150, { angle: 180, scale: 0.6 }),
      pill(300, 290, 'Vạch đen chỉ đường', { size: 24, fill: C.coin }),
    ),
  },
  {
    name: 'tu-lam-duong',
    svg: scene(
      900,
      330,
      `<rect x="20" y="40" width="620" height="200" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/>`,
      `<rect x="60" y="126" width="540" height="28" fill="${C.ink}"/>`,
      ruler(60, 210, 600, 210, '1 mét'),
      arrow(640, 100, 610, 128, { color: C.inkSoft, width: 4, head: 12 }),
      text(660, 90, 'băng dính đen ~2 cm', { size: 22, anchor: 'start' }),
      `<rect x="680" y="160" width="90" height="90" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/><rect x="790" y="160" width="90" height="90" fill="${C.ink}"/>`,
      text(780, 290, 'trắng + đen để cân chỉnh', { size: 20 }),
    ),
  },
  {
    name: 'nen-trang',
    svg: pairScene(
      520,
      380,
      `<rect x="0" y="290" width="520" height="90" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/>`,
      `<rect x="200" y="40" width="120" height="60" rx="10" fill="${C.robot}" stroke="${C.ink}" stroke-width="3"/>`,
      arrow(230, 105, 230, 280, { color: '#c06bd6', width: 6, head: 16 }),
      arrow(290, 285, 290, 110, { color: C.go, width: 18, head: 34 }),
      pill(260, 345, 'Nền trắng: dội NHIỀU', { size: 24, fill: C.white }),
    ),
  },
  {
    name: 'vach-den',
    svg: pairScene(
      520,
      380,
      `<rect x="0" y="290" width="520" height="90" fill="${C.ink}"/>`,
      `<rect x="200" y="40" width="120" height="60" rx="10" fill="${C.robot}" stroke="${C.ink}" stroke-width="3"/>`,
      arrow(230, 105, 230, 280, { color: '#c06bd6', width: 6, head: 16 }),
      arrow(290, 270, 290, 170, { color: C.go, width: 4, head: 12, dash: '6 8' }),
      pill(260, 335, 'Vạch đen: dội RẤT ÍT', { size: 24, fill: C.white }),
    ),
  },
  {
    name: 'bon-mat',
    svg: scene(
      700,
      420,
      eyes(350, 300, { scale: 2.6 }),
      [-27, -9, 9, 27].map((dx, i) => badge(350 + dx * 2.6, 40, String(i + 1))),
      text(140, 108, 'trái', { size: 24, color: C.inkSoft }),
      text(560, 108, 'phải', { size: 24, color: C.inkSoft }),
    ),
  },
  {
    name: 'robot-thay',
    svg: scene(
      1000,
      380,
      [
        ['0110', 'Vạch ở giữa'],
        ['1100', 'Lệch sang trái'],
        ['0011', 'Lệch sang phải'],
        ['0000', 'Hết vạch'],
      ].map(([p, label], i) => {
        const x = 20 + i * 245;
        return (
          card(x, 20, 230, 340, C.floor) +
          overLine(x + 115, 150, p) +
          boxes(x + 115, 270, p, 30) +
          text(x + 115, 325, label, { size: 22 })
        );
      }),
    ),
  },
  {
    name: 'so-ten',
    svg: scene(
      760,
      220,
      boxes(200, 70, '0110', 50),
      text(400, 70, '= 6', { size: 44 }),
      text(560, 70, 'vạch ở giữa', { size: 26, color: C.goDeep, anchor: 'start' }),
      boxes(200, 160, '0000', 50),
      text(400, 160, '= 0', { size: 44 }),
      text(560, 160, 'hết vạch', { size: 26, color: C.oops, anchor: 'start' }),
    ),
  },
  {
    name: 'ba-nhom',
    svg: scene(
      1000,
      380,
      [
        ['1100', 'Lệch TRÁI: quẹo trái', -1],
        ['0011', 'Lệch PHẢI: quẹo phải', 1],
        ['0110', 'Ở giữa: đi thẳng', 0],
      ].map(([p, label, dir], i) => {
        const x = 20 + i * 325;
        const cx = x + 155;
        const turn =
          dir === 0
            ? arrow(cx, 90, cx, 40, { color: C.go, width: 7, head: 18 })
            : `<path d="M${cx},100 Q${cx},50 ${cx + dir * 60},40" fill="none" stroke="${C.go}" stroke-width="7" stroke-linecap="round"/>` +
              arrow(cx + dir * 50, 42, cx + dir * 70, 38, { color: C.go, width: 7, head: 18 });
        return (
          card(x, 20, 310, 340, C.floor) +
          overLine(cx, 170, p, 0.8) +
          turn +
          boxes(cx, 290, p, 26) +
          text(cx, 334, label, { size: 22 })
        );
      }),
    ),
  },
  {
    name: 'que-trai',
    svg: pairScene(
      520,
      420,
      `<path d="M300,380 Q300,140 120,90" fill="none" stroke="${C.brandSoft}" stroke-width="24" stroke-linecap="round"/>`,
      robot(300, 300, { angle: -20 }),
      arrow(250, 300, 240, 250, { color: C.go, width: 6, head: 14 }),
      arrow(350, 320, 330, 190, { color: C.go, width: 6, head: 14 }),
      pill(170, 330, 'Trái 190', { size: 22, fill: C.white }),
      pill(430, 250, 'Phải 1500', { size: 22, fill: C.white }),
      text(260, 400, 'Quẹo trái', { size: 28 }),
    ),
  },
  {
    name: 'que-phai',
    svg: pairScene(
      520,
      420,
      `<path d="M220,380 Q220,140 400,90" fill="none" stroke="${C.brandSoft}" stroke-width="24" stroke-linecap="round"/>`,
      robot(220, 300, { angle: 20 }),
      arrow(170, 320, 190, 190, { color: C.go, width: 6, head: 14 }),
      arrow(270, 300, 280, 250, { color: C.go, width: 6, head: 14 }),
      pill(90, 250, 'Trái 1500', { size: 22, fill: C.white }),
      pill(350, 330, 'Phải 190', { size: 22, fill: C.white }),
      text(260, 400, 'Quẹo phải', { size: 28 }),
    ),
  },
  {
    name: 'doan-huong',
    svg: scene(
      1000,
      220,
      ['0110', '1100', '0001', '0000'].map((p, i) => {
        const x = 20 + i * 245;
        return (
          card(x, 20, 230, 180) +
          badge(x + 28, 46, String(i + 1)) +
          boxes(x + 115, 90, p, 32) +
          text(x + 115, 160, '→ ?', { size: 34, color: C.brandDeep })
        );
      }),
    ),
  },
  {
    name: 'phong-sang',
    svg: pairScene(
      520,
      380,
      `<circle cx="100" cy="80" r="40" fill="${C.coin}" stroke="${C.ink}" stroke-width="3"/>`,
      `<rect x="0" y="230" width="520" height="150" fill="${C.white}"/>`,
      `<rect x="236" y="230" width="48" height="150" fill="#6a6f78"/>`,
      eyes(260, 300, { scale: 0.9, seen: '0000' }),
      pill(340, 80, 'Phòng sáng: vạch nhạt đi', { size: 22, fill: C.white }),
    ),
  },
  {
    name: 'phong-toi',
    svg: pairScene(
      520,
      380,
      `<rect x="0" y="0" width="520" height="380" fill="#3d3a52"/>`,
      `<path d="M120,50 a40,40 0 1 0 40,60 a32,32 0 1 1 -40,-60 z" fill="#fff4c8" stroke="${C.ink}" stroke-width="3"/>`,
      `<rect x="0" y="230" width="520" height="150" fill="#b9b4c8"/>`,
      `<rect x="236" y="230" width="48" height="150" fill="${C.ink}"/>`,
      eyes(260, 300, { scale: 0.9, seen: '1111' }),
      pill(330, 80, 'Phòng tối: nền xám đi', { size: 22, fill: C.white }),
    ),
  },
  {
    name: 'den-can-chinh',
    svg: scene(
      1000,
      330,
      [
        ['Mới bật', 'đèn ĐỎ nháy', C.oops, C.floor, false, true],
        ['Trên TRẮNG', 'chạm TB1A: VÀNG', C.coin, C.white, true],
        ['Trên ĐEN', 'chạm TB1A: XANH', C.go, C.ink, true],
        ['Chạm TB1A', 'lần 3: XONG', C.go, C.floor, true],
      ].map(([a, b, color, ground, touch, blink], i) => {
        const x = 20 + i * 245;
        const cx = x + 115;
        return [
          card(x, 20, 230, 290),
          `<rect x="${x + 20}" y="60" width="190" height="150" fill="${ground}" stroke="${C.ink}" stroke-width="2"/>`,
          robot(cx, 165, { scale: 0.8 }),
          lights(cx, 98, color, blink),
          touch ? finger(cx - 24, 158) : '',
          badge(x + 28, 46, String(i + 1)),
          text(cx, 244, a, { size: 22 }),
          text(cx, 276, b, { size: 22, color: C.inkSoft }),
        ].join('');
      }),
    ),
  },
  {
    name: 'reset',
    svg: scene(
      700,
      240,
      `<circle cx="120" cy="120" r="44" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/><circle cx="120" cy="120" r="22" fill="${C.oops}" stroke="${C.ink}" stroke-width="3"/>`,
      text(120, 200, 'nút Reset', { size: 24 }),
      arrow(200, 120, 330, 120, { color: C.brandDeep }),
      lights(450, 120, C.oops, true),
      text(450, 200, 'lại từ đèn ĐỎ', { size: 24 }),
      text(620, 120, '< 1 phút', { size: 26, color: C.goDeep }),
    ),
  },
  {
    name: 'ba-phan',
    svg: scene(
      800,
      430,
      arc(400, 215, 150, 30, 90, { color: C.brandDeep, width: 6, head: 18 }),
      arc(400, 215, 150, 150, 210, { color: C.brandDeep, width: 6, head: 18 }),
      arc(400, 215, 150, 270, 330, { color: C.brandDeep, width: 6, head: 18 }),
      pill(400, 65, '1. ĐỌC MẮT', { size: 26, fill: C.sky }),
      pill(600, 300, '2. CHỌN HƯỚNG', { size: 26, fill: C.coin }),
      pill(200, 300, '3. KIỂM ĐÍCH', { size: 26, fill: C.go, color: C.white }),
      text(400, 215, 'mỗi vòng', { size: 24 }),
      text(400, 250, 'nhích 1 mm', { size: 24 }),
    ),
  },
  {
    name: 'hon-1-met',
    svg: scene(
      900,
      260,
      `<rect x="40" y="96" width="780" height="28" fill="${C.ink}"/>`,
      eyes(110, 110, { scale: 0.7, angle: 90 }),
      `<line x1="800" y1="40" x2="800" y2="150" stroke="${C.ink}" stroke-width="4"/><path d="M800,40 l40,14 l-40,14 z" fill="${C.oops}" stroke="${C.ink}" stroke-width="3"/>`,
      ruler(110, 190, 800, 190, '1000 mm = 1 mét'),
      text(110, 40, 'xuất phát: đã ở trên vạch', { size: 22, anchor: 'start' }),
    ),
  },
  {
    name: 'follow-line',
    svg: scene(
      860,
      300,
      Array.from(
        { length: 9 },
        (_, i) =>
          `<rect x="${60 + (i % 3) * 12}" y="${30 + i * 26}" width="${180 - (i % 3) * 30}" height="22" rx="4" fill="${['#e85a6a', '#4c6fd1', '#5ba55b'][i % 3]}" stroke="${C.ink}" stroke-width="2"/>`,
      ),
      text(150, 280, 'rất nhiều khối', { size: 22, color: C.inkSoft }),
      arrow(300, 150, 460, 150, { color: C.brandDeep }),
      text(380, 120, 'gói lại', { size: 22 }),
      `<rect x="500" y="115" width="300" height="70" rx="10" fill="#9a5cc6" stroke="${C.ink}" stroke-width="3"/>`,
      text(650, 150, 'followLine', { size: 34, color: C.white, font: 'body' }),
      text(650, 230, 'chỉ một dòng', { size: 22, color: C.inkSoft }),
    ),
  },
  {
    name: 'thu-vach',
    svg: scene(
      900,
      260,
      `<rect x="20" y="40" width="860" height="150" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/>`,
      `<rect x="70" y="102" width="760" height="26" fill="${C.ink}"/>`,
      eyes(120, 115, { scale: 0.7, seen: '0110', angle: 90 }),
      arrow(200, 70, 800, 70, { color: C.go, dash: '2 14', width: 7 }),
      ruler(70, 220, 830, 220, '~1 mét'),
      mark(850, 30, true, 22),
    ),
  },
  {
    name: 'ba-phep-thu',
    svg: scene(
      1000,
      320,
      [
        [
          'Ôm được khúc cua',
          (cx) =>
            tape(`M${cx - 70},280 V170 Q${cx - 70},110 ${cx},110 H${cx + 90}`, 20) +
            robot(cx - 70, 200, { scale: 0.5 }),
        ],
        [
          'Đặt lệch: tự bắt lại',
          (cx) =>
            tape(`M${cx},280 V60`, 20) +
            robot(cx + 60, 220, { scale: 0.5, angle: -25 }) +
            `<path d="M${cx + 50},180 Q${cx + 20},140 ${cx + 4},110" fill="none" stroke="${C.go}" stroke-width="6" stroke-dasharray="2 10" stroke-linecap="round"/>`,
        ],
        [
          'Đèn sáng hơn: chạy tệ',
          (cx) =>
            `<circle cx="${cx + 80}" cy="80" r="28" fill="${C.coin}" stroke="${C.ink}" stroke-width="3"/>` +
            tape(`M${cx},280 V60`, 20) +
            robot(cx, 200, { scale: 0.5 }) +
            text(cx - 70, 110, '?', { size: 44, color: C.oops }),
        ],
      ].map(([label, draw], i) => {
        const x = 20 + i * 325;
        return (
          card(x, 20, 310, 290, C.floor) +
          badge(x + 28, 46, String(i + 1)) +
          draw(x + 155) +
          text(x + 155, 290, label, { size: 22 })
        );
      }),
    ),
  },
];
