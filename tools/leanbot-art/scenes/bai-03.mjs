// Pictures for Bài 3 "Mắt thần siêu âm" (content/leanbot/bai-03.json).
// The robot mostly faces right toward a wall, so distances read left to right like a ruler.
// On the real sensor the "T" (sender) is the right-hand eye as you face the robot
// (photo leanbot-phan-cung-1.png).
import {
  C,
  scene,
  pairScene,
  robot,
  front,
  arrow,
  arc,
  text,
  pill,
  badge,
  mark,
  ruler,
} from '../draw.mjs';
import { program, run, stop, ifDo, repeatWhile, objectInFront, pingAtMost } from '../blocks.mjs';

const card = (x, y, w, h, fill = C.white) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${fill}" stroke="${C.ink}" stroke-width="3"/>`;
/** A wall of cardboard boxes, seen from above, its face at x. */
const wall = (x, y1, y2) =>
  `<rect x="${x}" y="${y1}" width="40" height="${y2 - y1}" fill="#c9a06a" stroke="${C.ink}" stroke-width="3"/>` +
  Array.from(
    { length: Math.floor((y2 - y1) / 50) },
    (_, i) =>
      `<line x1="${x}" y1="${y1 + (i + 1) * 50}" x2="${x + 40}" y2="${y1 + (i + 1) * 50}" stroke="${C.ink}" stroke-width="2"/>`,
  ).join('');
/** Sound waves: arcs around (cx, cy) facing `dir` degrees (0 = right, 180 = left). */
function waves(cx, cy, radii, dir = 0, color = C.go, spread = 32) {
  return radii
    .map((r) => {
      const a1 = ((dir - spread) * Math.PI) / 180;
      const a2 = ((dir + spread) * Math.PI) / 180;
      return `<path d="M${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} A${r},${r} 0 0 1 ${cx + r * Math.cos(a2)},${cy + r * Math.sin(a2)}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`;
    })
    .join('');
}
/** Robot facing right with its eyes (front) at x. */
const facing = (x, y, s = 0.8, opts = {}) => robot(x - 66 * s, y, { angle: 90, scale: s, ...opts });
const bat = (x, y) =>
  `<path d="M${x},${y} q-30,-40 -80,-30 q20,10 15,30 q-20,-5 -30,10 q40,-5 60,15 z M${x},${y} q30,-40 80,-30 q-20,10 -15,30 q20,-5 30,10 q-40,-5 -60,15 z" fill="${C.brandDeep}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/><ellipse cx="${x}" cy="${y + 4}" rx="16" ry="22" fill="${C.brandDeep}" stroke="${C.ink}" stroke-width="3"/><path d="M${x - 10},${y - 14} l-4,-14 l10,8 M${x + 10},${y - 14} l4,-14 l-10,8" fill="${C.brandDeep}" stroke="${C.ink}" stroke-width="3"/><circle cx="${x - 6}" cy="${y - 4}" r="3" fill="${C.coin}"/><circle cx="${x + 6}" cy="${y - 4}" r="3" fill="${C.coin}"/>`;

/** Ruler zones in front of the robot: px per cm. */
const CM = 8;
/** Wall face in the 27 cm pair. */
const W = 470;

function zones(x0, y, { stop = 25, clear = 30, until = 45 } = {}) {
  const at = (cm) => x0 + cm * CM;
  return [
    `<rect x="${x0}" y="${y - 22}" width="${stop * CM}" height="44" fill="${C.oopsSoft}" stroke="${C.ink}" stroke-width="2"/>`,
    `<rect x="${at(stop)}" y="${y - 22}" width="${(clear - stop) * CM}" height="44" fill="${C.coin}" stroke="${C.ink}" stroke-width="2"/>`,
    `<rect x="${at(clear)}" y="${y - 22}" width="${(until - clear) * CM}" height="44" fill="#d6efd9" stroke="${C.ink}" stroke-width="2"/>`,
    text(at(stop) - 4, y + 44, `${stop} cm`, { size: 22, anchor: 'end' }),
    text(at(clear) + 4, y + 44, `${clear} cm`, { size: 22, anchor: 'start' }),
  ];
}

/** The same zones measured back from a wall whose face is at wallX: where the robot's eyes are. */
function zonesFromWall(wallX, y) {
  const at = (cm) => wallX - cm * CM;
  return [
    `<rect x="${at(25)}" y="${y - 22}" width="${25 * CM}" height="44" fill="${C.oopsSoft}" stroke="${C.ink}" stroke-width="2"/>`,
    `<rect x="${at(30)}" y="${y - 22}" width="${5 * CM}" height="44" fill="${C.coin}" stroke="${C.ink}" stroke-width="2"/>`,
    `<rect x="${at(50)}" y="${y - 22}" width="${20 * CM}" height="44" fill="#d6efd9" stroke="${C.ink}" stroke-width="2"/>`,
    text(at(30) - 4, y + 44, '30 cm', { size: 22, anchor: 'end' }),
    text(at(25) + 4, y + 44, '25 cm', { size: 22, anchor: 'start' }),
  ];
}

const yoyo = (x, y) =>
  arrow(x - 10, y - 14, x + 50, y - 14, { color: C.go, width: 5, head: 14 }) +
  arrow(x + 50, y + 14, x - 10, y + 14, { color: C.coinDeep, width: 5, head: 14 });

export const scenes = [
  {
    name: 'dam-tuong',
    svg: scene(
      700,
      300,
      wall(560, 40, 260),
      facing(555, 150, 0.9),
      arrow(140, 150, 350, 150, { color: C.go }),
      `<path d="M560,110 l20,-30 l6,26 l30,-12 l-16,26 l30,8 l-30,12 l14,26 l-30,-10" fill="${C.coin}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`,
      pill(300, 260, 'Bụp! Đâm vào tường', { size: 24, fill: C.oopsSoft }),
    ),
  },
  {
    name: 'con-doi',
    svg: scene(
      760,
      320,
      bat(150, 160),
      waves(190, 160, [40, 80, 120, 160], 0, C.go),
      waves(620, 160, [60, 110, 160], 180, C.sky),
      `<rect x="640" y="30" width="60" height="260" fill="#8a8f99" stroke="${C.ink}" stroke-width="3"/>`,
      pill(330, 40, '1. Dơi kêu', { size: 22, fill: C.go, color: C.white }),
      pill(470, 290, '2. Tiếng vọng dội về', { size: 22, fill: C.sky }),
    ),
  },
  {
    name: 'hai-mat',
    svg: scene(
      760,
      400,
      front(380, 250, { scale: 1.5 }),
      // T is the right-hand eye as you face the robot, R the left-hand one
      waves(416, 118, [40, 75, 110], -90, C.go, 26),
      waves(344, 118, [40, 75], -90, C.sky, 26),
      pill(600, 80, 'Mắt T: gửi tiếng kêu', { size: 22, fill: C.go, color: C.white }),
      pill(160, 80, 'Mắt R: nghe tiếng vọng', { size: 22, fill: C.sky }),
      arrow(500, 92, 440, 112, { color: C.inkSoft, width: 4, head: 12 }),
      arrow(260, 92, 320, 112, { color: C.inkSoft, width: 4, head: 12 }),
    ),
  },
  {
    name: 'vong-gan',
    svg: pairScene(
      520,
      340,
      facing(200, 150),
      wall(300, 40, 260),
      waves(200, 150, [30, 60, 90], 0, C.go),
      pill(260, 300, 'Về rất nhanh: vật GẦN', { size: 24, fill: C.white }),
    ),
  },
  {
    name: 'vong-xa',
    svg: pairScene(
      520,
      340,
      facing(140, 150),
      wall(460, 40, 260),
      waves(140, 150, [40, 90, 140, 190, 240, 290], 0, C.go),
      pill(260, 300, 'Về chậm: vật XA', { size: 24, fill: C.white }),
    ),
  },
  {
    name: 'ba-so',
    svg: scene(
      900,
      300,
      facing(100, 110),
      zones(100, 110, { until: 50 }),
      text(100 + 12.5 * CM, 110, 'DỪNG', { size: 22, color: C.oops }),
      text(100 + 40 * CM, 110, 'trống', { size: 22, color: C.goDeep }),
      `<line x1="${100 + 50 * CM}" y1="110" x2="830" y2="110" stroke="${C.inkSoft}" stroke-width="4" stroke-dasharray="4 10"/>`,
      text(840, 110, '400 cm', { size: 22, anchor: 'end' }),
      pill(620, 240, 'Xa nhất mắt thần thấy: 4 mét', { size: 22, fill: C.white }),
    ),
  },
  {
    name: 'yo-yo',
    svg: scene(
      720,
      280,
      facing(150, 100),
      wall(100 + 25 * CM + 50, 30, 170),
      yoyo(150 + 25 * CM - 120, 100),
      `<line x1="${100 + 25 * CM}" y1="30" x2="${100 + 25 * CM}" y2="180" stroke="${C.oops}" stroke-width="4" stroke-dasharray="8 6"/>`,
      text(100 + 25 * CM, 200, 'tới 25 dừng, 26 lại tiến', { size: 22 }),
      pill(300, 250, 'Giật tới giật lui như yo-yo', { size: 22, fill: C.oopsSoft }),
      mark(670, 240, false, 24),
    ),
  },
  {
    name: 'vung-dem',
    svg: scene(
      720,
      260,
      facing(100, 100),
      zones(100, 100),
      pill(100 + 27.5 * CM, 210, 'Vùng đệm 5 cm', { size: 22, fill: C.coin }),
      mark(670, 220, true, 24),
    ),
  },
  {
    name: '27-dang-tien',
    svg: pairScene(
      520,
      340,
      wall(W, 60, 280),
      zonesFromWall(W, 220),
      facing(W - 27 * CM, 120, 0.7),
      arrow(W - 27 * CM + 6, 120, W - 27 * CM + 50, 120, { color: C.go, width: 6, head: 16 }),
      pill(220, 30, 'Đang tiến: CHƯA dừng', { size: 22, fill: C.white }),
    ),
  },
  {
    name: '27-dang-lui',
    svg: pairScene(
      520,
      340,
      wall(W, 60, 280),
      zonesFromWall(W, 220),
      facing(W - 27 * CM, 120, 0.7),
      arrow(W - 27 * CM - 110, 120, W - 27 * CM - 160, 120, {
        color: C.coinDeep,
        width: 6,
        head: 16,
      }),
      pill(220, 30, 'Đang lùi: VẪN lùi tiếp', { size: 22, fill: C.white }),
    ),
  },
  {
    name: 'bon-luat',
    svg: scene(
      1000,
      290,
      [
        [
          'Trống hơn 25 cm: đi tiếp',
          (x) =>
            facing(x - 10, 130, 0.55) +
            arrow(x, 130, x + 70, 130, { color: C.go, width: 6, head: 14 }),
        ],
        [
          '25 cm hoặc gần hơn: DỪNG',
          (x) =>
            facing(x + 20, 130, 0.55) +
            wall(x + 40, 80, 180) +
            pill(x - 40, 200, 'STOP', { size: 18, fill: C.oops, color: C.white }),
        ],
        [
          'Lùi tới khi hơn 30 cm',
          (x) =>
            facing(x + 30, 130, 0.55) +
            wall(x + 70, 80, 180) +
            arrow(x - 40, 130, x - 90, 130, { color: C.coinDeep, width: 6, head: 14 }),
        ],
        ['Kiểm tra liên tục', (x) => arc(x, 130, 50, 0, 300, { color: C.brandDeep, width: 7 })],
      ].map(([label, draw], i) => {
        const x = 20 + i * 245;
        return (
          card(x, 20, 230, 250) +
          badge(x + 28, 46, String(i + 1)) +
          draw(x + 115) +
          text(x + 115, 245, label, { size: 18 })
        );
      }),
    ),
  },
  {
    name: 'neu-mot-lan',
    svg: scene(
      860,
      320,
      wall(760, 60, 260),
      facing(220, 160, 0.7, { ghost: true }),
      `<rect x="60" y="20" width="340" height="70" rx="16" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/><path d="M170,90 l20,24 l10,-24" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/>`,
      text(230, 44, 'Có vật trong 25 cm?', { size: 22 }),
      text(230, 72, 'Không. (hỏi xong, thôi)', { size: 22, color: C.inkSoft }),
      arrow(250, 160, 640, 160, { color: C.go, dash: '2 14', width: 7 }),
      facing(755, 160, 0.7),
      pill(560, 280, 'Không hỏi lại: đâm vào tường', { size: 22, fill: C.oopsSoft }),
    ),
  },
  {
    name: 'lap-khi',
    svg: scene(
      760,
      360,
      `<polygon points="240,40 400,110 240,180 80,110" fill="${C.coin}" stroke="${C.ink}" stroke-width="3"/>`,
      text(240, 110, 'Còn đúng?', { size: 26 }),
      arrow(400, 110, 500, 110, { color: C.go, width: 6, head: 16 }),
      text(450, 88, 'đúng', { size: 20, color: C.goDeep }),
      card(500, 70, 230, 80),
      text(615, 110, 'Làm khối bên trong', { size: 22 }),
      `<path d="M615,150 v60 h-375 v-30" fill="none" stroke="${C.brandDeep}" stroke-width="6" stroke-linejoin="round"/>`,
      `<polygon points="240,182 228,204 252,204" fill="${C.brandDeep}"/>`,
      text(450, 234, 'hỏi lại', { size: 20, color: C.brandDeep }),
      arrow(80, 110, 40, 110, { color: C.oops, width: 6, head: 14 }),
      `<path d="M40,110 v170" fill="none" stroke="${C.oops}" stroke-width="6"/>`,
      arrow(40, 280, 120, 280, { color: C.oops, width: 6, head: 16 }),
      text(60, 90, 'sai', { size: 20, color: C.oops }),
      card(120, 250, 260, 64),
      text(250, 282, 'Đi xuống khối dưới', { size: 22 }),
    ),
  },
  {
    name: 'ct1',
    blocks: {
      stacks: [
        {
          x: 60,
          y: 40,
          blocks: program([
            run(30, 30, { id: 'a' }),
            ifDo(objectInFront(25), [stop({ id: 'c' })], { id: 'b' }),
          ]),
        },
      ],
      badges: [
        { id: 'a', n: '1' },
        { id: 'b', n: '2', at: 'top' },
        { id: 'c', n: '3' },
      ],
    },
  },
  {
    name: 'ct2',
    blocks: {
      stacks: [
        {
          x: 60,
          y: 40,
          blocks: program([
            repeatWhile(pingAtMost(30), [run(-30, -30, { id: 'b' })], { id: 'a' }),
            stop({ id: 'c' }),
          ]),
        },
      ],
      badges: [
        { id: 'a', n: '1', at: 'top' },
        { id: 'b', n: '2' },
        { id: 'c', n: '3' },
      ],
    },
  },
  {
    name: 'lui-ra',
    svg: scene(
      700,
      260,
      wall(600, 30, 200),
      facing(600 - 30 * CM, 110, 0.7),
      facing(560, 110, 0.7, { ghost: true }),
      arrow(470, 110, 600 - 30 * CM + 10, 110, { color: C.coinDeep }),
      ruler(600 - 30 * CM, 200, 600, 200, 'hơn 30 cm thì thôi'),
      pill(160, 40, 'Trái −30 · Phải −30', { size: 22, fill: C.white }),
    ),
  },
  {
    name: 'ct-tranh',
    blocks: {
      stacks: [
        {
          x: 60,
          y: 40,
          blocks: program([
            repeatWhile(
              true,
              [
                run(30, 30, { id: 'b' }),
                ifDo(objectInFront(25), [
                  stop({ id: 'c' }),
                  repeatWhile(pingAtMost(30), [run(-30, -30)], { id: 'd' }),
                  stop({ id: 'e' }),
                ]),
              ],
              { id: 'a' },
            ),
          ]),
        },
      ],
      badges: [
        { id: 'a', n: '1', at: 'top' },
        { id: 'b', n: '2' },
        { id: 'c', n: '3' },
        { id: 'd', n: '4', at: 'top' },
        { id: 'e', n: '5' },
      ],
    },
  },
  {
    name: 'doi-nguong',
    blocks: {
      stacks: [{ x: 60, y: 80, blocks: ifDo(objectInFront(25, { id: 'p' }), [stop()]) }],
      rings: [{ id: 'p', input: 'Distance', n: '1' }],
    },
  },
  {
    name: 'dung-trong-sai',
    blocks: {
      stacks: [
        { x: 60, y: 30, blocks: [repeatWhile(pingAtMost(30), [run(-30, -30), stop({ id: 's' })])] },
      ],
      badges: [{ id: 's', n: '!' }],
    },
  },
  {
    name: 'dung-ngoai-dung',
    blocks: {
      stacks: [
        { x: 60, y: 30, blocks: [repeatWhile(pingAtMost(30), [run(-30, -30)]), stop({ id: 's' })] },
      ],
      badges: [{ id: 's', n: '✓' }],
    },
  },
  {
    name: 'o-dau',
    svg: scene(
      960,
      300,
      card(20, 20, 290, 260),
      `<rect x="80" y="110" width="170" height="60" rx="18" fill="${C.sky}" stroke="${C.ink}" stroke-width="3"/><rect x="110" y="80" width="100" height="40" rx="10" fill="${C.sky}" stroke="${C.ink}" stroke-width="3"/><circle cx="115" cy="172" r="18" fill="${C.tyre}"/><circle cx="215" cy="172" r="18" fill="${C.tyre}"/>`,
      text(64, 100, 'bíp!', { size: 24, color: C.oops }),
      text(165, 245, 'Xe hơi lùi sát tường', { size: 22 }),
      card(335, 20, 290, 260),
      `<circle cx="450" cy="140" r="56" fill="${C.brandSoft}" stroke="${C.ink}" stroke-width="3"/><circle cx="450" cy="140" r="20" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/>`,
      `<rect x="540" y="70" width="14" height="130" fill="#a0632e" stroke="${C.ink}" stroke-width="3"/>`,
      text(480, 245, 'Robot hút bụi', { size: 22 }),
      card(650, 20, 290, 260),
      `<rect x="745" y="110" width="100" height="30" rx="8" fill="${C.ink}"/><line x1="720" y1="100" x2="870" y2="100" stroke="${C.ink}" stroke-width="5"/><ellipse cx="720" cy="96" rx="30" ry="6" fill="${C.brandSoft}" stroke="${C.ink}" stroke-width="2"/><ellipse cx="870" cy="96" rx="30" ry="6" fill="${C.brandSoft}" stroke="${C.ink}" stroke-width="2"/><rect x="775" y="150" width="40" height="36" fill="#c9a06a" stroke="${C.ink}" stroke-width="3"/>`,
      text(795, 245, 'Máy bay giao hàng', { size: 22 }),
    ),
  },
  {
    name: 'thu-hop',
    svg: scene(
      860,
      300,
      wall(760, 40, 240),
      facing(120, 140, 0.7, { ghost: true }),
      arrow(130, 140, 540, 140, { color: C.go, dash: '2 14', width: 7 }),
      facing(760 - 25 * CM, 140, 0.7),
      ruler(760 - 25 * CM, 250, 760, 250, '23–27 cm là đạt'),
      text(80, 250, 'cách hộp ~1 mét', { size: 22, anchor: 'start' }),
    ),
  },
  {
    name: 'ba-phep-thu',
    svg: scene(
      1000,
      300,
      [
        [
          'Chắn vở: dừng ngay',
          (x) =>
            facing(x + 10, 140, 0.55) +
            `<rect x="${x + 40}" y="90" width="14" height="100" fill="${C.sky}" stroke="${C.ink}" stroke-width="3"/>` +
            wall(x + 90, 90, 190),
        ],
        [
          'Đẩy hộp sát: lùi',
          (x) =>
            facing(x + 40, 140, 0.55) +
            wall(x + 50, 90, 190) +
            arrow(x - 30, 140, x - 90, 140, { color: C.coinDeep, width: 6, head: 14 }),
        ],
        [
          'Bỏ hộp: chạy tiếp',
          (x) =>
            facing(x - 10, 140, 0.55) +
            arrow(x, 140, x + 90, 140, { color: C.go, width: 6, head: 14 }),
        ],
      ].map(([label, draw], i) => {
        const x = 20 + i * 325;
        return (
          card(x, 20, 310, 260) +
          badge(x + 28, 46, String(i + 1)) +
          draw(x + 155) +
          text(x + 155, 250, label, { size: 22 })
        );
      }),
    ),
  },
];
