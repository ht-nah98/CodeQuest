// SVG pieces for the Leanbot lesson pictures: the robot seen from above, arrows, turn arcs,
// labels. Every scene is drawn in the app's palette (apps/web/src/ui/tokens.css) and rendered to
// PNG by render.mjs with the app's own fonts, so the words in a picture look like the page.
import { readFileSync } from 'node:fs';

export const C = {
  ink: '#1e1b2e',
  inkSoft: '#4a4560',
  paper: '#fff8ee',
  white: '#ffffff',
  brand: '#7b769e',
  brandDeep: '#4b4673',
  brandSoft: '#d9d5ee',
  go: '#4faf5a',
  goDeep: '#2f7d3a',
  coin: '#fbc73f',
  coinDeep: '#c98a12',
  oops: '#e8615e',
  oopsSoft: '#fde7e6',
  sky: '#bfe3f2',
  robot: '#e0483e',
  robotDeep: '#a8302a',
  tyre: '#2b2a33',
  floor: '#f3eee4',
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** A whole picture: `w`×`h` on paper, with the parts inside. */
export function scene(w, h, ...parts) {
  return sized(w, h, w, parts);
}

/**
 * Half of a pair (Đúng / Sai, Trước / Sau): drawn on the same `w`×`h` canvas but shown 346 px
 * wide, so two fit side by side in the 728 px lesson column.
 */
export function pairScene(w, h, ...parts) {
  return sized(w, h, 346, parts);
}

function sized(w, h, shown, parts) {
  const sh = Math.round((h * shown) / w);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${shown}" height="${sh}" viewBox="0 0 ${w} ${h}">
<rect width="${w}" height="${h}" fill="${C.paper}"/>
${parts.flat().join('\n')}
</svg>`;
}

export const group = (transform, ...parts) =>
  `<g transform="${transform}">${parts.flat().join('')}</g>`;

/**
 * Leanbot from above, facing `angle` degrees (0 = up the picture, 90 = right). The gripper is
 * the front, so a child can tell where the robot is looking. `ghost` draws a pale outline: where
 * the robot was, or where it will be.
 */
export function robot(x, y, { angle = 0, scale = 1, ghost = false, wheels } = {}) {
  const body = ghost ? 'none' : C.robot;
  const line = ghost ? C.inkSoft : C.ink;
  const dash = ghost ? ' stroke-dasharray="6 5"' : '';
  const op = ghost ? ' opacity="0.55"' : '';
  const parts = [
    // wheels, a little behind the middle like the real robot
    `<rect x="-47" y="-8" width="15" height="40" rx="5" fill="${ghost ? 'none' : C.tyre}" stroke="${line}" stroke-width="3"${dash}/>`,
    `<rect x="32" y="-8" width="15" height="40" rx="5" fill="${ghost ? 'none' : C.tyre}" stroke="${line}" stroke-width="3"${dash}/>`,
    // gripper arms in front
    `<rect x="-24" y="-66" width="11" height="26" rx="4" fill="${ghost ? 'none' : C.white}" stroke="${line}" stroke-width="3"${dash}/>`,
    `<rect x="13" y="-66" width="11" height="26" rx="4" fill="${ghost ? 'none' : C.white}" stroke="${line}" stroke-width="3"${dash}/>`,
    // body
    `<rect x="-32" y="-46" width="64" height="88" rx="12" fill="${body}" stroke="${line}" stroke-width="3"${dash}/>`,
  ];
  if (!ghost) {
    parts.push(
      `<rect x="-22" y="-8" width="44" height="40" rx="6" fill="${C.robotDeep}"/>`,
      // ultrasonic eyes: the robot's face
      `<rect x="-24" y="-42" width="48" height="20" rx="5" fill="#3f6fb5" stroke="${C.ink}" stroke-width="2.5"/>`,
      `<circle cx="-12" cy="-32" r="7" fill="#dfe6ee" stroke="${C.ink}" stroke-width="2"/>`,
      `<circle cx="12" cy="-32" r="7" fill="#dfe6ee" stroke="${C.ink}" stroke-width="2"/>`,
    );
  }
  if (wheels) {
    // speed numbers beside each wheel, kept upright whatever the robot's angle
    parts.push(
      group(
        `translate(-56 12) rotate(${-angle})`,
        pill(0, 0, wheels[0], { size: 20, fill: C.white, anchor: 'end' }),
      ),
      group(
        `translate(56 12) rotate(${-angle})`,
        pill(0, 0, wheels[1], { size: 20, fill: C.white, anchor: 'start' }),
      ),
    );
  }
  return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})"${op}>${parts.join('')}</g>`;
}

/** Straight arrow from (x1,y1) to (x2,y2). */
export function arrow(x1, y1, x2, y2, { color = C.go, width = 8, head = 22, dash } = {}) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const bx = x2 - Math.cos(a) * head * 0.9;
  const by = y2 - Math.sin(a) * head * 0.9;
  const left = [
    x2 - Math.cos(a) * head + Math.sin(a) * head * 0.6,
    y2 - Math.sin(a) * head - Math.cos(a) * head * 0.6,
  ];
  const right = [
    x2 - Math.cos(a) * head - Math.sin(a) * head * 0.6,
    y2 - Math.sin(a) * head + Math.cos(a) * head * 0.6,
  ];
  const d = dash ? ` stroke-dasharray="${dash}"` : '';
  return `<line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"${d}/>
<polygon points="${x2},${y2} ${left.join(',')} ${right.join(',')}" fill="${color}" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`;
}

/**
 * Arc arrow around (cx,cy), from `from` to `to` degrees (0 = up, clockwise positive), so a
 * right turn of 90 is arc(…, 0, 90) and a left turn is arc(…, 0, -90).
 */
export function arc(cx, cy, r, from, to, { color = C.coinDeep, width = 7, head = 20 } = {}) {
  const pt = (deg) => [
    cx + r * Math.sin((deg * Math.PI) / 180),
    cy - r * Math.cos((deg * Math.PI) / 180),
  ];
  const sweep = to > from ? 1 : 0;
  // stop the line a little short so the head covers its end
  const back = ((head * 0.8) / (2 * Math.PI * r)) * 360 * Math.sign(to - from);
  const end = to - back;
  const segs = [];
  // SVG arcs cannot draw a full circle in one go: split into pieces under 180 degrees
  const n = Math.ceil(Math.abs(end - from) / 170) || 1;
  let [px, py] = pt(from);
  let d = `M${px},${py}`;
  for (let i = 1; i <= n; i += 1) {
    const deg = from + ((end - from) * i) / n;
    [px, py] = pt(deg);
    d += ` A${r},${r} 0 0 ${sweep} ${px},${py}`;
  }
  segs.push(
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`,
  );
  // head: tangent at `to`
  const [tx, ty] = pt(to);
  const tangent = ((to + (sweep ? 90 : -90)) * Math.PI) / 180; // direction of travel, 0 = up
  const dx = Math.sin(tangent);
  const dy = -Math.cos(tangent);
  const bx = tx - dx * head;
  const by = ty - dy * head;
  const left = [bx + dy * head * 0.6, by - dx * head * 0.6];
  const right = [bx - dy * head * 0.6, by + dx * head * 0.6];
  segs.push(
    `<polygon points="${tx},${ty} ${left.join(',')} ${right.join(',')}" fill="${color}" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`,
  );
  return segs.join('');
}

/** Plain text. `anchor` is start | middle | end. */
export function text(
  x,
  y,
  s,
  { size = 24, color = C.ink, weight = 800, anchor = 'middle', font = 'display' } = {},
) {
  const family = font === 'display' ? "'Baloo 2', 'Nunito', sans-serif" : "'Nunito', sans-serif";
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}" dominant-baseline="central">${esc(s)}</text>`;
}

/** Text on a rounded pill. Width is estimated from the characters, generously. */
export function pill(
  x,
  y,
  s,
  { size = 22, fill = C.white, color = C.ink, border = C.ink, anchor = 'middle' } = {},
) {
  const w = Math.max(size * 1.6, String(s).length * size * 0.56 + size * 0.9);
  const h = size * 1.55;
  const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  return `<rect x="${left}" y="${y - h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" stroke="${border}" stroke-width="3"/>${text(left + w / 2, y + 1, s, { size, color })}`;
}

/** Numbered round badge, as on the steps of a screen. */
export function badge(x, y, n, { fill = C.brandDeep, r = 18 } = {}) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${C.ink}" stroke-width="3"/>${text(x, y + 1, n, { size: r * 1.25, color: C.white })}`;
}

/** Big tick or cross for right / wrong pictures. */
export function mark(x, y, ok, r = 26) {
  const fill = ok ? C.go : C.oops;
  const sign = ok
    ? `<polyline points="${x - r * 0.45},${y} ${x - r * 0.1},${y + r * 0.38} ${x + r * 0.5},${y - r * 0.4}" fill="none" stroke="${C.white}" stroke-width="${r * 0.28}" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<path d="M${x - r * 0.4},${y - r * 0.4} L${x + r * 0.4},${y + r * 0.4} M${x + r * 0.4},${y - r * 0.4} L${x - r * 0.4},${y + r * 0.4}" stroke="${C.white}" stroke-width="${r * 0.28}" stroke-linecap="round"/>`;
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${C.ink}" stroke-width="3"/>${sign}`;
}

/** Measuring tape between two points, with the distance written on it. */
export function ruler(x1, y1, x2, y2, label, { offset = 0 } = {}) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const ox = -Math.sin(a) * offset;
  const oy = Math.cos(a) * offset;
  const [ax, ay, bx, by] = [x1 + ox, y1 + oy, x2 + ox, y2 + oy];
  const tick = (px, py) =>
    `<line x1="${px - Math.sin(a) * 12}" y1="${py + Math.cos(a) * 12}" x2="${px + Math.sin(a) * 12}" y2="${py - Math.cos(a) * 12}" stroke="${C.inkSoft}" stroke-width="3"/>`;
  return `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="${C.inkSoft}" stroke-width="3" stroke-dasharray="8 6"/>${tick(ax, ay)}${tick(bx, by)}${pill((ax + bx) / 2, (ay + by) / 2, label, { size: 20, fill: C.coin })}`;
}

/** A finger tip pressing a spot, seen from above. */
export function finger(x, y) {
  return `<circle cx="${x}" cy="${y}" r="17" fill="#f6c9a5" stroke="${C.ink}" stroke-width="3"/><ellipse cx="${x}" cy="${y - 5}" rx="8" ry="6" fill="#fde7d6"/>`;
}

/** A child seen from above: head and shoulders, facing `angle` like the robot. */
export function child(x, y, { angle = 0, shirt = C.sky } = {}) {
  return `<g transform="translate(${x} ${y}) rotate(${angle})">
<ellipse cx="0" cy="6" rx="38" ry="18" fill="${shirt}" stroke="${C.ink}" stroke-width="3"/>
<circle cx="0" cy="0" r="17" fill="#5a3b2a" stroke="${C.ink}" stroke-width="3"/>
<path d="M-9,-14 Q0,-24 9,-14" fill="#f6c9a5" stroke="${C.ink}" stroke-width="2.5"/>
</g>`;
}

/**
 * Leanbot seen from the front, to show the gripper. Each arm hangs from a servo at the robot's
 * lower front corner: 0 degrees points straight at the floor (open), 90 lies flat and points at
 * the middle (closed), 120 tilts above flat. `left` and `right` are the robot's own left and
 * right, which the viewer sees mirrored: the robot's left arm is on the picture's right.
 */
export function front(x, y, { left = 0, right = left, scale = 1, cube = false } = {}) {
  const arm = (side, deg) => {
    // side -1 = picture left (robot's right arm), +1 = picture right (robot's left arm)
    const px = side * 62;
    const rot = side * deg; // rotate from straight down toward the middle
    return `<g transform="translate(${px} 30) rotate(${rot})"><rect x="-9" y="-6" width="18" height="74" rx="8" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/></g>`;
  };
  return group(
    `translate(${x} ${y}) scale(${scale})`,
    // wheels behind the body
    `<rect x="-104" y="-6" width="30" height="80" rx="10" fill="${C.tyre}" stroke="${C.ink}" stroke-width="3"/>`,
    `<rect x="74" y="-6" width="30" height="80" rx="10" fill="${C.tyre}" stroke="${C.ink}" stroke-width="3"/>`,
    `<rect x="-78" y="-70" width="156" height="104" rx="10" fill="${C.robot}" stroke="${C.ink}" stroke-width="3"/>`,
    // ultrasonic eyes on top
    `<rect x="-50" y="-108" width="100" height="40" rx="6" fill="#3f6fb5" stroke="${C.ink}" stroke-width="3"/>`,
    `<circle cx="-24" cy="-88" r="14" fill="#dfe6ee" stroke="${C.ink}" stroke-width="2.5"/><circle cx="24" cy="-88" r="14" fill="#dfe6ee" stroke="${C.ink}" stroke-width="2.5"/>`,
    cube
      ? `<rect x="-32" y="40" width="64" height="64" rx="6" fill="${C.coin}" stroke="${C.ink}" stroke-width="3"/>`
      : '',
    // servos and arms
    `<rect x="-80" y="8" width="36" height="44" rx="6" fill="#3f6fb5" stroke="${C.ink}" stroke-width="3"/>`,
    `<rect x="44" y="8" width="36" height="44" rx="6" fill="#3f6fb5" stroke="${C.ink}" stroke-width="3"/>`,
    arm(-1, right),
    arm(1, left),
    `<circle cx="-62" cy="30" r="6" fill="${C.ink}"/><circle cx="62" cy="30" r="6" fill="${C.ink}"/>`,
  );
}

/**
 * A real screenshot or photo from shots/<name>.png, placed at (x, y) and `w` wide. `marks` are in
 * the picture's own pixels, so they stay put whatever size it is drawn at:
 *   { ring: [x, y, w, h], n?: '1' }   yellow ring, optional numbered badge on its corner
 *   { cover: [x, y, w, h], fill? }    hide something (a name, an address) under a flat patch
 *   { arrow: [x1, y1, x2, y2] }       pointing arrow
 */
export function shot(name, x, y, w, marks = []) {
  const file = new URL(`./shots/${name}.png`, import.meta.url);
  const bytes = readFileSync(file);
  const nw = bytes.readUInt32BE(16);
  const nh = bytes.readUInt32BE(20);
  const k = w / nw;
  const inner = marks
    .map((m) => {
      if (m.cover) {
        const [cx, cy, cw, ch] = m.cover;
        return `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" fill="${m.fill ?? C.white}"/>`;
      }
      if (m.ring) {
        const [rx, ry, rw, rh] = m.ring;
        const ring = `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" rx="${8 / k}" fill="none" stroke="${C.coin}" stroke-width="${6 / k}"/>`;
        return (
          ring + (m.n ? group(`translate(${rx + rw} ${ry}) scale(${1 / k})`, badge(0, 0, m.n)) : '')
        );
      }
      if (m.arrow) {
        const [x1, y1, x2, y2] = m.arrow;
        return group(
          `scale(${1 / k})`,
          arrow(x1 * k, y1 * k, x2 * k, y2 * k, { color: C.oops, width: 7 }),
        );
      }
      return '';
    })
    .join('');
  return `<g transform="translate(${x} ${y}) scale(${k})"><image href="data:image/png;base64,${bytes.toString('base64')}" width="${nw}" height="${nh}"/><rect width="${nw}" height="${nh}" fill="none" stroke="${C.ink}" stroke-width="${3 / k}"/>${inner}</g>`;
}

/** Height a shot() of this picture takes when drawn `w` wide. */
export function shotHeight(name, w) {
  const bytes = readFileSync(new URL(`./shots/${name}.png`, import.meta.url));
  return (w * bytes.readUInt32BE(20)) / bytes.readUInt32BE(16);
}

/** Where the four touch pads run along the board's edge, in robot() units (robot facing up). */
export const PADS = {
  TB1A: [-29, -42, -14],
  TB1B: [29, -42, -14],
  TB2A: [-29, 33, 41],
  TB2B: [29, 33, 41],
};

/**
 * The touch pads, drawn inside robot()'s own transform: not buttons, but zigzag strips printed
 * along the red board's edge (photos IMG_3169/3170, 22/10/2026). `lit` pads are drawn yellow.
 */
export function touchPads(lit = Object.keys(PADS)) {
  return Object.entries(PADS)
    .map(([name, [x, y1, y2]]) => {
      const pts = [];
      for (let y = y1, i = 0; y <= y2; y += 4, i += 1) pts.push(`${x + (i % 2 ? 2.5 : -2.5)},${y}`);
      const on = lit.includes(name);
      return `<polyline points="${pts.join(' ')}" fill="none" stroke="${on ? C.coin : C.white}" stroke-width="${on ? 3.5 : 2}" stroke-linejoin="round"/>`;
    })
    .join('');
}
