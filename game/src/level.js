// Level definitions for Shadow Courier: walls, cover, patrol routes, files and exit.
// Coordinates are in canvas pixels (960 x 600). Walls and crates block movement and
// sight; bushes hide a still player; shadow zones slow detection.

export const WORLD = { width: 960, height: 600 };

function wall(x, y, w, h) { return { x, y, w, h }; }
function crate(x, y) { return { x, y, w: 44, h: 44 }; }
function bush(x, y) { return { x, y, w: 64, h: 52 }; }
function shadow(x, y, w, h) { return { x, y, w, h }; }
function file(x, y) { return { x, y, taken: false }; }
function guard(path, speed, range, fovDeg) {
  return { path, speed, range, fov: (fovDeg * Math.PI) / 180 };
}

export const LEVELS = [
  {
    name: 'Level 1 — The Reading Room',
    intro: 'Two guards, slow patrols. Learn the cones.',
    player: { x: 70, y: 540 },
    exit: { x: 872, y: 40, w: 64, h: 56 },
    files: [file(480, 110), file(700, 470), file(220, 300)],
    walls: [
      wall(0, 0, 960, 16), wall(0, 584, 960, 16), wall(0, 0, 16, 600), wall(944, 0, 16, 600),
      wall(300, 0, 18, 150), wall(300, 230, 18, 200), wall(640, 150, 18, 220),
    ],
    crates: [crate(180, 120), crate(180, 168), crate(420, 320), crate(560, 120), crate(760, 300), crate(760, 348)],
    bushes: [bush(120, 420), bush(520, 480), bush(820, 180)],
    shadows: [shadow(330, 430, 180, 120), shadow(700, 60, 160, 110)],
    guards: [
      guard([[180, 220], [560, 220], [560, 430], [180, 430]], 55, 190, 70),
      guard([[760, 120], [760, 500], [880, 500], [880, 120]], 50, 180, 70),
    ],
    pebbles: 5,
  },
  {
    name: 'Level 2 — The Stacks',
    intro: 'Three guards, faster patrols, tighter shelves.',
    player: { x: 70, y: 540 },
    exit: { x: 872, y: 40, w: 64, h: 56 },
    files: [file(480, 90), file(140, 250), file(830, 430), file(560, 300)],
    walls: [
      wall(0, 0, 960, 16), wall(0, 584, 960, 16), wall(0, 0, 16, 600), wall(944, 0, 16, 600),
      wall(200, 0, 18, 180), wall(200, 260, 18, 180), wall(480, 140, 18, 200),
      wall(480, 420, 18, 164), wall(720, 0, 18, 160), wall(720, 260, 18, 200),
    ],
    crates: [crate(120, 110), crate(330, 300), crate(330, 348), crate(580, 120), crate(580, 480), crate(840, 200)],
    bushes: [bush(90, 320), bush(400, 500), bush(640, 380), bush(860, 300)],
    shadows: [shadow(220, 440, 170, 110), shadow(740, 60, 150, 100), shadow(500, 200, 120, 90)],
    guards: [
      guard([[120, 200], [420, 200], [420, 480], [120, 480]], 65, 200, 70),
      guard([[560, 90], [880, 90], [880, 420], [560, 420]], 60, 195, 70),
      guard([[480, 480], [480, 110], [680, 110], [680, 480]], 70, 185, 65),
    ],
    pebbles: 5,
  },
  {
    name: 'Level 3 — The Vault Floor',
    intro: 'Four guards, long sightlines. Patience wins.',
    player: { x: 70, y: 540 },
    exit: { x: 872, y: 40, w: 64, h: 56 },
    files: [file(300, 90), file(900, 300), file(480, 300), file(140, 180), file(700, 500)],
    walls: [
      wall(0, 0, 960, 16), wall(0, 584, 960, 16), wall(0, 0, 16, 600), wall(944, 0, 16, 600),
      wall(160, 0, 18, 150), wall(160, 240, 18, 200), wall(400, 120, 18, 220),
      wall(400, 420, 18, 164), wall(640, 0, 18, 170), wall(640, 250, 18, 200),
      wall(820, 300, 18, 284),
    ],
    crates: [crate(90, 110), crate(260, 300), crate(260, 348), crate(500, 90), crate(500, 480), crate(740, 180), crate(740, 500)],
    bushes: [bush(90, 400), bush(320, 500), bush(560, 220), bush(880, 120)],
    shadows: [shadow(180, 460, 170, 100), shadow(700, 60, 170, 100), shadow(430, 340, 130, 90)],
    guards: [
      guard([[110, 200], [360, 200], [360, 500], [110, 500]], 75, 210, 65),
      guard([[460, 90], [600, 90], [600, 480], [460, 480]], 72, 205, 65),
      guard([[700, 120], [900, 120], [900, 520], [700, 520]], 78, 210, 65),
      guard([[300, 300], [800, 300], [800, 90], [300, 90]], 68, 195, 70),
    ],
    pebbles: 6,
  },
];

// Rect helpers shared by guards, movement and rendering.
export function rectsCollide(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// Does segment (x1,y1)-(x2,y2) cross rect r? Used for vision-cone line of sight.
export function segmentHitsRect(x1, y1, x2, y2, r) {
  if (pointInRect(x1, y1, r) || pointInRect(x2, y2, r)) return true;
  const edges = [
    [r.x, r.y, r.x + r.w, r.y], [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h], [r.x, r.y + r.h, r.x, r.y],
  ];
  for (const [ax, ay, bx, by] of edges) {
    const d = (x2 - x1) * (by - ay) - (y2 - y1) * (bx - ax);
    if (d === 0) continue;
    const t = ((ax - x1) * (by - ay) - (ay - y1) * (bx - ax)) / d;
    const u = ((ax - x1) * (y2 - y1) - (ay - y1) * (x2 - x1)) / d;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return true;
  }
  return false;
}
