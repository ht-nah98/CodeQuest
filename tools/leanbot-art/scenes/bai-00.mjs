// Pictures for Bài 0 "Làm quen và kiểm tra Leanbot" (content/leanbot/bai-00.json).
// Part positions follow the photos in apps/web/public/leanbot/img/leanbot-phan-cung-*.png:
// touch buttons TB1A front-left, TB1B front-right, TB2A rear-left, TB2B rear-right; the Arduino
// port sits on top at the back, the charging port low on the battery.
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
  touchPads,
  PADS,
  shot,
  shotHeight,
} from '../draw.mjs';

const card = (x, y, w, h, fill = C.white) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${fill}" stroke="${C.ink}" stroke-width="3"/>`;
const ring = (x, y, w, h, color = C.coin) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${color}" stroke-width="6"/>`;
const dot = (x, y, r, fill) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${C.ink}" stroke-width="2.5"/>`;

/** The robot's back: two wheels, the red board with its switch, the Arduino port above, the battery below. */
function rear(x, y, s = 1) {
  return group(
    `translate(${x} ${y}) scale(${s})`,
    `<rect x="-118" y="10" width="40" height="80" rx="12" fill="${C.tyre}" stroke="${C.ink}" stroke-width="3"/>`,
    `<rect x="78" y="10" width="40" height="80" rx="12" fill="${C.tyre}" stroke="${C.ink}" stroke-width="3"/>`,
    `<rect x="-60" y="-118" width="120" height="30" rx="4" fill="#6a6f78" stroke="${C.ink}" stroke-width="3"/>`,
    `<rect x="-22" y="-110" width="44" height="16" rx="3" fill="#c9ccd2" stroke="${C.ink}" stroke-width="2.5"/>`,
    `<rect x="-90" y="-88" width="180" height="120" rx="8" fill="${C.robot}" stroke="${C.ink}" stroke-width="3"/>`,
    `<circle cx="0" cy="-40" r="16" fill="${C.tyre}" stroke="${C.ink}" stroke-width="3"/>`,
    `<rect x="-80" y="32" width="160" height="56" rx="8" fill="#5b8fd6" stroke="${C.ink}" stroke-width="3"/>`,
    `<rect x="-16" y="38" width="32" height="12" rx="3" fill="#c9ccd2" stroke="${C.ink}" stroke-width="2.5"/>`,
  );
}
/** Where a cable plugs into rear(): the top (Arduino) or the bottom (battery) port, at scale 1. */
const PORT = { top: [0, -102], bottom: [0, 44] };

const laptop = (x, y) =>
  `<rect x="${x - 70}" y="${y - 90}" width="140" height="90" rx="8" fill="${C.brandSoft}" stroke="${C.ink}" stroke-width="3"/><rect x="${x - 58}" y="${y - 80}" width="116" height="70" rx="4" fill="${C.white}" stroke="${C.ink}" stroke-width="2"/><path d="M${x - 90},${y} h180 l-14,18 h-152 z" fill="${C.brandSoft}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
const charger = (x, y) =>
  `<rect x="${x - 34}" y="${y - 40}" width="68" height="80" rx="12" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/><line x1="${x - 14}" y1="${y - 40}" x2="${x - 14}" y2="${y - 62}" stroke="${C.ink}" stroke-width="6"/><line x1="${x + 14}" y1="${y - 40}" x2="${x + 14}" y2="${y - 62}" stroke="${C.ink}" stroke-width="6"/>`;
const cable = (d) =>
  `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#9aa0aa" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;
const glow = (x, y, color, blink = false) =>
  `<circle cx="${x}" cy="${y}" r="26" fill="${color}" opacity="0.25"/>${dot(x, y, 12, color)}${blink ? `<path d="M${x - 34},${y - 22} l-10,-8 M${x + 34},${y - 22} l10,-8 M${x},${y - 38} v-12" stroke="${color}" stroke-width="4" stroke-linecap="round"/>` : ''}`;

/** The bottom bar of the Leanbot IDE, drawn large. `rings` holds the indices to circle. */
function ideBar(y, { rings = [], serial = false, numbered = false } = {}) {
  // [label, left edge, width of its ring]
  const items = [
    [serial ? 'SERIAL: SELECTED' : 'SELECT DEVICE', 34, serial ? 262 : 236],
    ['BOARD: ARDUINO UNO', 300, 338],
    ['SERVER:', 650, 270],
  ];
  return [
    `<rect x="20" y="${y - 32}" width="920" height="64" rx="10" fill="#f1f1f3" stroke="${C.ink}" stroke-width="3"/>`,
    items.map(([s, x]) =>
      text(x + 14, y, s, { size: 26, font: 'body', color: C.ink, anchor: 'start' }),
    ),
    `<rect x="790" y="${y - 16}" width="110" height="32" rx="16" fill="${C.go}"/>`,
    text(845, y, 'ONLINE', { size: 20, color: C.white }),
    rings.map((i) => {
      const [, left, w] = items[i];
      return (
        ring(left, y - 30, w, 60) + (numbered ? badge(left + w - 10, y - 40, String(i + 1)) : '')
      );
    }),
  ];
}

/** A SERIAL window: lines the robot sends, and the box where the child types. */
function serialWin(x, y, w, lines, typed) {
  const h = 70 + lines.length * 40 + (typed ? 70 : 0);
  const parts = [
    card(x, y, w, h, '#1e1b2e'),
    text(x + 24, y + 30, 'SERIAL', { size: 22, color: C.coin, anchor: 'start' }),
    lines.map((l, i) =>
      text(x + 24, y + 74 + i * 40, l, {
        size: 24,
        color: '#e9e4f3',
        anchor: 'start',
        font: 'body',
      }),
    ),
  ];
  if (typed) {
    const ty = y + h - 50;
    parts.push(
      `<rect x="${x + 16}" y="${ty - 24}" width="${w - 150}" height="48" rx="8" fill="${C.white}" stroke="${C.coin}" stroke-width="4"/>`,
      text(x + 34, ty, typed, { size: 26, anchor: 'start', font: 'body' }),
      `<rect x="${x + w - 120}" y="${ty - 24}" width="104" height="48" rx="8" fill="${C.brandSoft}" stroke="${C.ink}" stroke-width="3"/>`,
      text(x + w - 68, ty, 'Enter ↵', { size: 22 }),
    );
  }
  return parts;
}

/** Leanbot from above with its four touch pads; `press` puts fingers on the two front ones. */
function touchMap(press) {
  const k = 2.2;
  return [
    group(`translate(300 230) scale(${k})`, robot(0, 0), touchPads()),
    Object.entries(PADS).map(([name, [x, y1, y2]]) => {
      const px = 300 + x * k;
      const py = 230 + ((y1 + y2) / 2) * k;
      const front = name.startsWith('TB1');
      return [
        press && front ? finger(px, py) : '',
        pill(px + (x < 0 ? -110 : 110), py, name, { size: 24, fill: front ? C.coin : C.white }),
      ].join('');
    }),
    text(300, 420, 'phía sau', { size: 22, color: C.inkSoft }),
    text(300, 24, 'phía trước', { size: 22, color: C.inkSoft }),
  ];
}

const tick = (x, y, done = true) =>
  `<rect x="${x - 14}" y="${y - 14}" width="28" height="28" rx="6" fill="${done ? C.go : C.white}" stroke="${C.ink}" stroke-width="3"/>${done ? `<polyline points="${x - 7},${y} ${x - 2},${y + 6} ${x + 8},${y - 6}" fill="none" stroke="${C.white}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` : ''}`;

/** A whole screenshot as one picture, `w` wide. */
const shotScene = (name, w, marks) =>
  scene(w, Math.round(shotHeight(name, w)), shot(name, 0, 0, w, marks));
/** A screenshot shown as half of a pair (346 px wide in the lesson). */
const shotPair = (name, marks) => {
  const w = 520;
  return pairScene(w, Math.round(shotHeight(name, w)), shot(name, 0, 0, w, marks));
};

const NINE = [
  'Hai cổng USB',
  'Sạc robot',
  'Máy thấy robot',
  'Nạp code',
  'Đọc số liệu',
  'Bánh xe',
  'Tay gắp',
  'Đèn và còi',
  'Hai loại mắt',
];

const black = (x, y, w, h) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.ink}"/>`;

export const scenes = [
  {
    name: 'bo-phan',
    svg: scene(
      900,
      480,
      group('translate(450 250) scale(2.3)', robot(0, 0)),
      // seven LEDs along the front, under the gripper
      [-3, -2, -1, 0, 1, 2, 3].map((i) =>
        dot(
          450 + i * 14,
          168,
          6,
          ['#e8615e', '#fbc73f', '#4faf5a', '#5aa9e6', '#7b769e', '#e8615e', '#fbc73f'][i + 3],
        ),
      ),
      arrow(250, 70, 405, 160, { color: C.inkSoft, width: 4, head: 14 }),
      pill(170, 60, '1 mắt siêu âm', { size: 24, fill: C.white }),
      arrow(660, 60, 490, 110, { color: C.inkSoft, width: 4, head: 14 }),
      pill(730, 52, '2 càng tay gắp', { size: 24, fill: C.white }),
      arrow(250, 200, 425, 168, { color: C.inkSoft, width: 4, head: 14 }),
      pill(150, 200, '7 đèn màu', { size: 24, fill: C.white }),
      arrow(700, 300, 560, 290, { color: C.inkSoft, width: 4, head: 14 }),
      pill(770, 300, '2 bánh xe', { size: 24, fill: C.white }),
      arrow(250, 330, 384, 300, { color: C.inkSoft, width: 4, head: 14 }),
      pill(150, 340, '4 vùng chạm', { size: 24, fill: C.white }),
      pill(450, 450, '8 mắt hồng ngoại: dưới bụng và hai bên', { size: 22, fill: C.sky }),
    ),
  },
  {
    name: 'ir-duoi-bung',
    svg: pairScene(
      520,
      400,
      black(0, 60, 520, 26),
      `<rect x="0" y="86" width="520" height="314" fill="${C.floor}"/>`,
      black(236, 60, 48, 340),
      group('translate(260 230) scale(1.7)', robot(0, 0, { ghost: true })),
      [-36, -12, 12, 36].map((dx) => dot(260 + dx, 200, 10, C.go)),
      pill(260, 360, 'Nhìn vạch đen dưới sàn', { size: 22, fill: C.white }),
    ),
  },
  {
    name: 'ir-hai-ben',
    svg: pairScene(
      520,
      400,
      group('translate(260 210) scale(1.7)', robot(0, 0)),
      [
        [-62, -40],
        [-62, 30],
        [62, -40],
        [62, 30],
      ].map(([dx, dy]) => dot(260 + dx, 210 + dy, 10, C.sky)),
      `<rect x="420" y="130" width="80" height="110" rx="6" fill="${C.coin}" stroke="${C.ink}" stroke-width="3"/>`,
      arrow(332, 180, 410, 180, { color: C.sky, width: 6, head: 16 }),
      pill(260, 360, 'Nhìn vật ở hai bên', { size: 22, fill: C.white }),
    ),
  },
  { name: 'nut-cham', svg: scene(600, 440, touchMap(true)) },
  {
    name: 'cong-tren',
    svg: pairScene(
      520,
      440,
      rear(260, 260),
      cable(`M260,${260 + PORT.top[1]} C260,90 420,60 480,40`),
      mark(460, 400, true, 28),
      pill(150, 60, 'cổng TRÊN', { size: 24, fill: C.go, color: C.white }),
      text(150, 104, 'để NẠP CODE', { size: 24 }),
    ),
  },
  {
    name: 'cong-duoi',
    svg: pairScene(
      520,
      440,
      rear(260, 230),
      cable(`M260,${230 + PORT.bottom[1]} C260,380 420,400 500,410`),
      mark(460, 60, false, 28),
      pill(150, 390, 'cổng DƯỚI', { size: 24, fill: C.coin }),
      text(150, 430, 'chỉ để SẠC', { size: 24 }),
    ),
  },
  {
    name: 'sac-may-tinh',
    svg: pairScene(
      520,
      340,
      laptop(120, 230),
      cable('M210,240 C300,240 300,250 360,250'),
      rear(420, 220, 0.6),
      pill(260, 310, 'Cáp nối máy tính', { size: 22, fill: C.white }),
    ),
  },
  {
    name: 'sac-o-dien',
    svg: pairScene(
      520,
      340,
      `<rect x="40" y="110" width="100" height="140" rx="10" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/>`,
      dot(76, 160, 8, C.ink),
      dot(104, 160, 8, C.ink),
      charger(170, 170),
      cable('M190,210 C300,260 300,250 360,250'),
      rear(420, 220, 0.6),
      pill(260, 310, 'Củ sạc cắm ổ điện', { size: 22, fill: C.white }),
    ),
  },
  {
    name: 'den-do',
    svg: pairScene(
      400,
      300,
      rear(200, 150, 0.8),
      glow(200, 185, C.oops, true),
      pill(200, 270, 'Nháy đỏ: đang sạc', { size: 22, fill: C.oopsSoft }),
    ),
  },
  {
    name: 'den-xanh',
    svg: pairScene(
      400,
      300,
      rear(200, 150, 0.8),
      glow(200, 185, C.go),
      pill(200, 270, 'Xanh đứng yên: đầy', { size: 22, fill: C.white }),
    ),
  },
  {
    name: 'giu-gin',
    svg: scene(
      960,
      330,
      card(20, 20, 290, 290),
      `<path d="M70,150 h190 v110 h-190 z" fill="#c07a3a" stroke="${C.ink}" stroke-width="3"/><path d="M70,150 l30,-40 h130 l30,40" fill="#a0632e" stroke="${C.ink}" stroke-width="3"/>`,
      robot(165, 160, { scale: 0.6 }),
      text(165, 290, 'Cất vào hộp', { size: 24 }),
      mark(270, 60, true, 22),
      card(335, 20, 290, 290),
      `<circle cx="420" cy="90" r="34" fill="${C.coin}" stroke="${C.ink}" stroke-width="3"/>`,
      [0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const r = (a * Math.PI) / 180;
        return `<line x1="${420 + Math.cos(r) * 44}" y1="${90 + Math.sin(r) * 44}" x2="${420 + Math.cos(r) * 58}" y2="${90 + Math.sin(r) * 58}" stroke="${C.coinDeep}" stroke-width="5" stroke-linecap="round"/>`;
      }),
      robot(510, 200, { scale: 0.6 }),
      text(480, 290, 'Phơi nắng', { size: 24 }),
      mark(585, 60, false, 22),
      card(650, 20, 290, 290),
      rear(795, 150, 0.55),
      glow(795, 175, C.go),
      text(795, 290, 'Sạc đều đặn', { size: 24 }),
      mark(900, 60, true, 22),
    ),
  },
  {
    name: 'ba-thu',
    svg: scene(
      960,
      330,
      card(20, 20, 290, 290),
      `<rect x="50" y="70" width="230" height="150" rx="10" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/><rect x="50" y="70" width="230" height="34" rx="10" fill="${C.brandSoft}" stroke="${C.ink}" stroke-width="3"/>`,
      dot(70, 87, 6, C.oops),
      dot(88, 87, 6, C.coin),
      dot(106, 87, 6, C.go),
      text(165, 160, 'Chrome / Edge', { size: 26 }),
      badge(46, 46, '1'),
      text(165, 280, 'Trình duyệt', { size: 24 }),
      card(335, 20, 290, 290),
      `<rect x="365" y="70" width="230" height="150" rx="10" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/>`,
      `<rect x="380" y="120" width="120" height="22" rx="4" fill="#4c6fd1"/><rect x="380" y="146" width="90" height="22" rx="4" fill="#4c6fd1"/><rect x="380" y="98" width="140" height="22" rx="4" fill="#e85a6a"/>`,
      pill(480, 196, '?lang=vi', { size: 20, fill: C.coin }),
      badge(361, 46, '2'),
      text(480, 280, 'Trình soạn khối', { size: 24 }),
      card(650, 20, 290, 290),
      cable('M700,200 C760,90 840,240 890,130'),
      `<rect x="684" y="196" width="34" height="26" rx="3" fill="#c9ccd2" stroke="${C.ink}" stroke-width="3"/><rect x="880" y="112" width="22" height="30" rx="5" fill="#c9ccd2" stroke="${C.ink}" stroke-width="3"/>`,
      badge(676, 46, '3'),
      text(795, 280, 'Cáp truyền dữ liệu', { size: 24 }),
    ),
  },
  {
    name: 'chon-cong',
    svg: scene(
      960,
      540,
      badge(36, 93, '1'),
      group('translate(60 0) scale(0.93)', ideBar(100, { rings: [0] })),
      badge(36, 270, '2'),
      card(200, 160, 560, 220),
      text(480, 196, 'Chọn cổng để kết nối', { size: 24 }),
      `<rect x="230" y="226" width="500" height="54" rx="8" fill="${C.sky}" stroke="${C.ink}" stroke-width="2"/>`,
      text(250, 253, 'USB-SERIAL CH340 (COM3)', { size: 24, anchor: 'start', font: 'body' }),
      `<rect x="600" y="306" width="130" height="48" rx="24" fill="#3b6fd6" stroke="${C.ink}" stroke-width="3"/>`,
      text(665, 330, 'Connect', { size: 24, color: C.white }),
      ring(592, 298, 146, 64),
      badge(36, 470, '3'),
      group('translate(60 0) scale(0.93)', ideBar(505, { serial: true, rings: [0] })),
      text(480, 420, 'Thấy chữ này là máy đã thấy robot', { size: 24, color: C.goDeep }),
    ),
  },
  {
    name: 'cong-co',
    svg: pairScene(
      520,
      300,
      card(20, 20, 480, 260),
      text(260, 60, 'Chọn cổng để kết nối', { size: 24 }),
      `<rect x="44" y="96" width="432" height="54" rx="8" fill="${C.sky}" stroke="${C.ink}" stroke-width="2"/>`,
      text(64, 123, 'USB-SERIAL CH340 (COM3)', { size: 22, anchor: 'start', font: 'body' }),
      mark(450, 230, true, 26),
    ),
  },
  {
    name: 'cong-trong',
    svg: pairScene(
      520,
      300,
      card(20, 20, 480, 260),
      text(260, 60, 'Chọn cổng để kết nối', { size: 24 }),
      `<rect x="44" y="96" width="432" height="54" rx="8" fill="${C.floor}" stroke="${C.inkSoft}" stroke-width="2" stroke-dasharray="8 6"/>`,
      text(260, 123, '(trống trơn)', { size: 22, color: C.inkSoft, font: 'body' }),
      mark(450, 230, false, 26),
    ),
  },
  {
    name: 'bang-mach',
    svg: scene(
      960,
      170,
      ideBar(70, { rings: [1] }),
      text(455, 140, 'Chọn ARDUINO UNO là nạp được', { size: 22, color: C.goDeep }),
    ),
  },
  {
    name: 'tep-kiem-tra',
    svg: scene(
      960,
      220,
      [
        ['Tools', 100],
        ['Sample Code', 330],
        ['Leanbot_Test_and_Demo_v1.ino', 700],
      ].map(([s, x], i) =>
        i === 2
          ? pill(x, 100, s, { size: 26, fill: C.coin })
          : pill(x, 100, s, { size: 26, fill: C.white }),
      ),
      text(205, 100, '›', { size: 40, color: C.inkSoft }),
      text(450, 100, '›', { size: 40, color: C.inkSoft }),
      text(480, 180, 'Mở thư mục Tools, rồi Sample Code, lấy tệp tô vàng', { size: 24 }),
    ),
  },
  {
    name: 'nut-nap',
    svg: scene(
      960,
      300,
      // check: two chevrons and a tick
      `<path d="M150,60 l-24,24 l24,24 M190,60 l24,24 l-24,24" fill="none" stroke="${C.ink}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><polyline points="140,130 165,155 215,105" fill="none" stroke="${C.ink}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
      pill(170, 225, 'Chỉ kiểm, KHÔNG nạp', { size: 22, fill: C.oopsSoft }),
      // upload: monitor with a play arrow
      `<rect x="420" y="56" width="120" height="96" rx="8" fill="none" stroke="${C.ink}" stroke-width="8"/><polygon points="465,80 465,128 505,104" fill="${C.ink}"/><line x1="480" y1="152" x2="480" y2="176" stroke="${C.ink}" stroke-width="8"/><line x1="440" y1="180" x2="520" y2="180" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/>`,
      ring(400, 40, 160, 160, C.go),
      pill(480, 225, 'NẠP vào robot: bấm nút này', { size: 22, fill: C.go, color: C.white }),
      `<rect x="700" y="66" width="70" height="60" rx="8" fill="none" stroke="${C.ink}" stroke-width="7"/><path d="M714,84 l12,10 l-12,10 M732,108 h20" stroke="${C.ink}" stroke-width="5" fill="none"/>`,
      text(840, 96, 'SERIAL', { size: 36, font: 'body' }),
      pill(790, 225, 'Xem robot nói gì', { size: 22, fill: C.sky }),
    ),
  },
  {
    name: 'nap-6-buoc',
    svg: (() => {
      const cell = (i, draw, label) => {
        const x = 20 + (i % 3) * 320;
        const y = 20 + Math.floor(i / 3) * 260;
        return [
          card(x, y, 300, 240),
          badge(x + 30, y + 30, String(i + 1)),
          draw(x + 150, y + 110),
          text(x + 150, y + 210, label, { size: 22 }),
        ].join('');
      };
      return scene(
        980,
        540,
        cell(
          0,
          (x, y) =>
            `<rect x="${x - 80}" y="${y - 60}" width="160" height="110" rx="8" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/>${[0, 1, 2, 3].map((k) => `<rect x="${x - 64}" y="${y - 44 + k * 22}" width="${110 - k * 18}" height="10" rx="5" fill="${C.brandSoft}"/>`).join('')}`,
          'Dán chương trình',
        ),
        cell(1, (x, y) => rear(x, y + 10, 0.55) + glow(x, y + 34, C.oops), 'Bật công tắc: đèn đỏ'),
        cell(
          2,
          (x, y) =>
            rear(x, y + 30, 0.55) +
            cable(`M${x},${y - 26} C${x},${y - 70} ${x + 80},${y - 70} ${x + 110},${y - 80}`),
          'Cắm cổng TRÊN',
        ),
        cell(
          3,
          (x, y) =>
            `<rect x="${x - 50}" y="${y - 50}" width="100" height="80" rx="8" fill="none" stroke="${C.ink}" stroke-width="7"/><polygon points="${x - 14},${y - 30} ${x - 14},${y + 10} ${x + 20},${y - 10}" fill="${C.ink}"/>${ring(x - 66, y - 66, 132, 112, C.go)}`,
          'Bấm nút nạp',
        ),
        cell(
          4,
          (x, y) =>
            `<rect x="${x - 110}" y="${y - 20}" width="220" height="40" rx="20" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/><rect x="${x - 106}" y="${y - 16}" width="212" height="32" rx="16" fill="${C.go}"/>${text(x, y + 1, '100% – Done!', { size: 22, color: C.white })}`,
          'Chờ đủ 100%',
        ),
        cell(
          5,
          (x, y) =>
            robot(x - 30, y + 10, { angle: 90, scale: 0.7 }) +
            arrow(x + 30, y + 10, x + 110, y + 10, { color: C.go, width: 6, head: 16 }),
          'Rút cáp, robot chạy!',
        ),
      );
    })(),
  },
  { name: 'thanh-duoi', svg: scene(960, 140, ideBar(84, { rings: [0, 1, 2], numbered: true })) },
  {
    name: 'serial-dong',
    svg: scene(
      760,
      280,
      serialWin(20, 20, 720, [
        'TB 0000 - IR 00 .... 00 - 23 cm - GR 50 50',
        'TB 0000 - IR 00 .... 00 - 23 cm - GR 50 50',
        'TB 1000 - IR 00 .... 00 - 22 cm - GR 50 50',
        'TB 1000 - IR 00 .... 00 - 22 cm - GR 50 50',
      ]),
    ),
  },
  {
    name: 'doc-tung-khuc',
    svg: (() => {
      const parts = [
        ['TB 0000', 170, C.coin, '4 vùng chạm'],
        ['IR 00 .... 00', 400, C.go, 'mắt hồng ngoại'],
        ['23 cm', 620, C.sky, 'mắt siêu âm'],
        ['GR 50 50', 820, C.brandSoft, 'góc hai càng'],
      ];
      return scene(
        960,
        260,
        parts.map(([s, x, fill, label]) =>
          [
            `<rect x="${x - 95}" y="40" width="190" height="64" rx="12" fill="${fill}" stroke="${C.ink}" stroke-width="3"/>`,
            text(x, 72, s, { size: 28, font: 'body' }),
            arrow(x, 112, x, 170, { color: C.inkSoft, width: 5, head: 16 }),
            text(x, 206, label, { size: 26 }),
          ].join(''),
        ),
      );
    })(),
  },
  {
    name: 'banh-xe',
    svg: scene(
      820,
      360,
      robot(130, 200),
      arrow(130, 120, 130, 40),
      arrow(70, 260, 70, 330, { color: C.coinDeep, width: 6, head: 16 }),
      arc(130, 200, 105, 100, 250, { color: C.brandDeep, width: 6 }),
      text(130, 350, 'Motion', { size: 26, font: 'body' }),
      robot(470, 200, { angle: 90, ghost: true, scale: 0.7 }),
      arrow(510, 170, 760, 170),
      arrow(760, 230, 510, 230, { color: C.coinDeep }),
      ruler(470, 300, 760, 300, '1 mét'),
      text(615, 350, 'StraightMotion', { size: 26, font: 'body' }),
    ),
  },
  {
    name: 'cang-deu',
    svg: pairScene(
      400,
      350,
      group('translate(200 236) scale(2.4)', robot(0, 0)),
      text(200, 30, 'Hai càng đều nhau', { size: 24 }),
      mark(350, 310, true, 26),
    ),
  },
  {
    name: 'cang-lech',
    svg: pairScene(
      400,
      350,
      group('translate(200 236) scale(2.4)', robot(0, 0)),
      // the right arm hangs crooked: hide the straight one, draw it again turned on its root
      `<rect x="226" y="66" width="40" height="56" fill="${C.paper}"/>`,
      group(
        'translate(244 122) rotate(32)',
        `<rect x="-13" y="-62" width="26" height="64" rx="9" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/>`,
      ),
      text(200, 30, 'Một càng lệch', { size: 24, color: C.oops }),
      mark(350, 310, false, 26),
    ),
  },
  {
    name: 'den-coi',
    svg: scene(
      900,
      300,
      ['#e8615e', '#f08a3c', '#fbc73f', '#4faf5a', '#5aa9e6', '#3b6fd6', '#7b769e'].map((c, i) =>
        glow(110 + i * 60, 90, c),
      ),
      text(290, 170, '7 đèn đều sáng', { size: 26 }),
      ['đô', 'rê', 'mi', 'fa', 'sol', 'la', 'si', 'đô'].map((n, i) => {
        const x = 560 + i * 42;
        const y = 120 - i * 9;
        return `<ellipse cx="${x}" cy="${y}" rx="13" ry="10" fill="${C.ink}" transform="rotate(-20 ${x} ${y})"/><line x1="${x + 12}" y1="${y}" x2="${x + 12}" y2="${y - 50}" stroke="${C.ink}" stroke-width="4"/>${text(x, y + 34, n, { size: 18 })}`;
      }),
      text(710, 210, 'Còi kêu đủ 8 nốt', { size: 26 }),
    ),
  },
  {
    name: 'mat-theo-tay',
    svg: pairScene(
      520,
      400,
      robot(260, 300),
      `<path d="M220,70 q0,-40 20,-40 q10,0 10,20 v-30 q0,-12 12,-12 q12,0 12,12 v30 q0,-12 12,-12 q12,0 12,12 v40 q0,30 -30,40 h-20 q-28,-6 -28,-40 z" fill="#f6c9a5" stroke="${C.ink}" stroke-width="3"/>`,
      ruler(330, 234, 330, 110, '15 cm'),
      text(260, 380, 'Objectfollow', { size: 26, font: 'body' }),
    ),
  },
  {
    name: 'mat-do-vach',
    svg: pairScene(
      520,
      400,
      `<rect x="0" y="0" width="520" height="400" fill="${C.floor}"/>`,
      black(236, 0, 48, 400),
      black(0, 80, 520, 40),
      robot(260, 270),
      arrow(260, 200, 260, 130, { color: C.go }),
      pill(400, 60, 'dừng ở ngã tư', { size: 20, fill: C.coin }),
      text(400, 370, 'LineFollow', { size: 26, font: 'body' }),
    ),
  },
  {
    name: 'hieu-chinh-trang',
    svg: pairScene(
      400,
      340,
      `<rect x="0" y="0" width="400" height="340" fill="${C.white}"/>`,
      robot(200, 170, { scale: 1.4 }),
      finger(158, 150),
      pill(200, 310, 'Nền TRẮNG → chạm TB1A', { size: 20, fill: C.coin }),
    ),
  },
  {
    name: 'hieu-chinh-den',
    svg: pairScene(
      400,
      340,
      `<rect x="0" y="0" width="400" height="340" fill="${C.floor}"/>`,
      black(170, 0, 60, 340),
      robot(200, 170, { scale: 1.4 }),
      finger(158, 150),
      pill(200, 310, 'Vạch ĐEN → chạm TB1A', { size: 20, fill: C.coin }),
    ),
  },
  {
    name: 'hieu-chinh-vong',
    svg: scene(
      900,
      200,
      [
        ['Chuẩn bị dụng cụ', 150, C.white],
        ['Chỉnh cho ĐÚNG', 450, C.coin],
        ['Thử lại việc đó', 750, C.white],
      ].map(
        ([s, x, fill], i) =>
          badge(x - 120, 60, String(i + 1)) + pill(x, 100, s, { size: 26, fill }),
      ),
      arrow(260, 100, 330, 100, { color: C.brandDeep, width: 6, head: 16 }),
      arrow(560, 100, 630, 100, { color: C.brandDeep, width: 6, head: 16 }),
      text(450, 170, 'Không phải sửa chữa, cũng không phải cho nhanh hơn', {
        size: 22,
        color: C.inkSoft,
      }),
    ),
  },
  {
    name: 'chin-viec',
    svg: scene(
      980,
      330,
      NINE.map((s, i) => {
        const x = 20 + (i % 3) * 320;
        const y = 20 + Math.floor(i / 3) * 100;
        return (
          card(x, y, 300, 84) +
          badge(x + 32, y + 42, String(i + 1)) +
          text(x + 62, y + 42, s, { size: 24, anchor: 'start' }) +
          tick(x + 266, y + 42, true)
        );
      }),
    ),
  },
  {
    name: 'mo-khoa',
    svg: scene(
      860,
      260,
      [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) =>
        tick(60 + (i % 3) * 50, 70 + Math.floor(i / 3) * 50, true),
      ),
      text(110, 230, 'đủ 9 ô', { size: 24 }),
      arrow(220, 120, 380, 120, { color: C.go }),
      `<rect x="430" y="100" width="90" height="74" rx="10" fill="${C.coin}" stroke="${C.ink}" stroke-width="3"/><path d="M450,100 v-26 a26,26 0 0 1 52,0 v-4" fill="none" stroke="${C.ink}" stroke-width="8" transform="rotate(-25 450 100)"/>`,
      pill(680, 130, 'Bài 1 mở khóa!', { size: 30, fill: C.go, color: C.white }),
    ),
  },
  {
    name: 'thu-lai',
    svg: scene(
      1000,
      240,
      [
        ['Tắt robot,', 'rút cáp'],
        ['Bật, cắm', 'cổng TRÊN'],
        ['Nạp lại', 'chương trình'],
        ['SERIAL:', 'gõ Buzzer'],
        ['Nghe đủ', '8 nốt'],
      ].map(([a, b], i) => {
        const x = 20 + i * 196;
        return (
          card(x, 20, 180, 170, i === 4 ? C.go : C.white) +
          badge(x + 30, 50, String(i + 1)) +
          text(x + 90, 110, a, { size: 24, color: i === 4 ? C.white : C.ink }) +
          text(x + 90, 145, b, { size: 24, color: i === 4 ? C.white : C.ink })
        );
      }),
      text(500, 220, 'Một lượt, không nhìn hướng dẫn', { size: 22, color: C.inkSoft }),
    ),
  },
  {
    name: 'giu-cap',
    svg: pairScene(
      520,
      380,
      laptop(150, 200),
      [0, 1, 2, 3].map(
        (i) =>
          `<rect x="${96}" y="${126 + i * 14}" width="${108 - i * 10}" height="7" rx="3" fill="${C.go}"/>`,
      ),
      cable('M240,210 C300,210 320,230 350,230'),
      rear(410, 200, 0.5),
      pill(260, 330, 'Giữ cáp: thấy số liệu', { size: 24, fill: C.sky }),
    ),
  },
  {
    name: 'rut-cap',
    svg: pairScene(
      520,
      380,
      laptop(120, 200),
      text(120, 150, '…', { size: 34, color: C.inkSoft }),
      robot(380, 190, { angle: 90, scale: 0.8 }),
      arrow(440, 190, 500, 190, { color: C.go, width: 6, head: 16 }),
      glow(380, 120, C.go),
      pill(260, 330, 'Rút cáp: robot tự chạy', { size: 24, fill: C.go, color: C.white }),
    ),
  },
  // --- real screenshots of the Leanbot IDE (shots/, taken 22/10/2026) -------------------------
  {
    name: 'lay-code',
    svg: scene(
      720,
      150,
      shot('git-path', 10, 10, 700, [
        { ring: [56, 2, 106, 38], n: '2' },
        { ring: [166, 2, 270, 38], n: '3' },
      ]),
      text(20, 110, 'rồi bấm nút', { size: 24, anchor: 'start' }),
      shot('git-raw', 170, 86, 240, [{ ring: [8, 4, 54, 36], n: '4' }]),
    ),
  },
  {
    name: 'du-an-menu',
    svg: shotPair('project-menu', [
      { ring: [8, 12, 160, 44], n: '1' },
      { ring: [16, 184, 140, 32], n: '2' },
    ]),
  },
  { name: 'du-an-cong', svg: shotPair('project-plus', [{ ring: [728, 12, 46, 46], n: '3' }]) },
  {
    name: 'du-an-tao',
    svg: shotPair('create-dialog', [
      { ring: [22, 56, 456, 60], n: '4' },
      { ring: [404, 348, 84, 42], n: '5' },
    ]),
  },
  { name: 'dan-code', svg: shotScene('code-pasted', 560, [{ ring: [8, 50, 190, 40] }]) },
  {
    name: 'chon-cong-that',
    svg: shotPair('chooser', [
      { ring: [18, 74, 412, 34], n: '1' },
      { ring: [330, 404, 104, 46], n: '2' },
    ]),
  },
  { name: 'nut-nap-that', svg: shotPair('tooltip', [{ ring: [120, 4, 44, 40], n: '1' }]) },
  { name: 'nap-50', svg: shotScene('bar-50', 820, []) },
  { name: 'nap-100', svg: shotScene('bar-100', 820, []) },
  {
    name: 'canh-bao',
    svg: scene(
      860,
      128,
      shot('bar-100', 20, 10, 820, []),
      shot('warning', 20, 56, 820, [{ ring: [0, 8, 1260, 40], n: '!' }]),
    ),
  },
  {
    name: 'monitor-that',
    svg: shotScene('monitor-log', 620, [{ ring: [108, 6, 100, 42], n: '1' }]),
  },
  {
    name: 'go-lenh-that',
    svg: scene(
      640,
      130,
      shot('monitor-typed', 10, 10, 620, [{ ring: [4, 2, 120, 40], n: '1' }]),
      shot('monitor-nl', 10, 70, 565, [
        { ring: [64, 2, 70, 40], n: '2' },
        { ring: [150, 2, 300, 40] },
      ]),
    ),
  },
  { name: 'tay-gap-that', svg: shotScene('monitor-near', 620, [{ ring: [290, 202, 100, 24] }]) },
  { name: 'sieu-am-that', svg: shotScene('monitor-near', 620, [{ ring: [226, 110, 52, 116] }]) },
  { name: 'vung-cham-tb1a', svg: shotPair('photo-tb1a', [{ ring: [140, 218, 470, 56] }]) },
  {
    name: 'vung-cham-tb1b-tb2b',
    svg: shotPair('photo-tb1b-tb2b', [{ ring: [0, 108, 290, 40] }, { ring: [588, 120, 345, 42] }]),
  },
];
