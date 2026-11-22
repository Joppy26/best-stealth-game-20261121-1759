// Guard AI: patrol routes, vision cones, detection meter, alarm and recovery.
// A guard fills its suspicion meter while it can see the player; at full it raises
// the alarm and chases. Break line of sight and the meter drains — the player can
// always recover. A thrown pebble sends the nearest guards to investigate the noise.

import { pointInRect, rectsCollide, segmentHitsRect } from './level.js';

export function makeGuard(def, index) {
  const [sx, sy] = def.path[0];
  return {
    index,
    path: def.path,
    waypoint: 1 % def.path.length,
    x: sx, y: sy,
    dir: 0,
    speed: def.speed,
    range: def.range,
    fov: def.fov,
    suspicion: 0,          // 0..1, fills while the player is seen
    state: 'patrol',       // patrol | suspicious | alarm | return
    investigate: null,     // {x, y} noise point
    pause: 0,              // seconds to stand at a waypoint
    chaseLost: 0,          // seconds since the player was last seen while alarmed
    seenPlayer: false,
  };
}

function angleTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); }

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// True when the guard can see the player right now.
export function canSee(guard, player, level) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > guard.range) return false;
  if (dist > 14 && Math.abs(angleDiff(angleTo(guard.x, guard.y, player.x, player.y), guard.dir)) > guard.fov / 2) return false;
  for (const w of level.walls) if (segmentHitsRect(guard.x, guard.y, player.x, player.y, w)) return false;
  for (const c of level.crates) if (segmentHitsRect(guard.x, guard.y, player.x, player.y, c)) return false;
  return true;
}

export function playerHidden(player, level) {
  // Standing still inside a bush hides the player; shadow halves detection.
  const inBush = level.bushes.some((b) => pointInRect(player.x, player.y, b));
  const inShadow = level.shadows.some((s) => pointInRect(player.x, player.y, s));
  return { inBush: inBush && player.speedNow < 5, inShadow };
}

export function updateGuard(guard, dt, player, level, onCaught) {
  const hidden = playerHidden(player, level);
  const sees = canSee(guard, player, level) && !hidden.inBush;
  guard.seenPlayer = sees;

  // Detection: fill fast up close, slower far away, half speed in shadow.
  if (sees) {
    const dist = Math.hypot(player.x - guard.x, player.y - guard.y);
    let rate = 1.15 - (dist / guard.range) * 0.75;
    if (hidden.inShadow) rate *= 0.45;
    if (player.crouch) rate *= 0.6;
    guard.suspicion = Math.min(1, guard.suspicion + rate * dt);
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - 0.35 * dt);
  }

  if (guard.suspicion >= 1 && guard.state !== 'alarm') {
    guard.state = 'alarm';
    guard.chaseLost = 0;
  }

  const moveToward = (tx, ty, speed) => {
    const dx = tx - guard.x;
    const dy = ty - guard.y;
    const d = Math.hypot(dx, dy);
    if (d < 2) return true;
    const step = Math.min(d, speed * dt);
    const nx = guard.x + (dx / d) * step;
    const ny = guard.y + (dy / d) * step;
    const box = { x: nx - 10, y: ny - 10, w: 20, h: 20 };
    const blocked = level.walls.some((w) => rectsCollide(box, w)) || level.crates.some((c) => rectsCollide(box, c));
    if (!blocked) { guard.x = nx; guard.y = ny; }
    guard.dir = Math.atan2(dy, dx);
    return d - step < 3;
  };

  if (guard.state === 'alarm') {
    if (sees) {
      guard.chaseLost = 0;
      const arrived = moveToward(player.x, player.y, guard.speed * 1.55);
      if (arrived || Math.hypot(player.x - guard.x, player.y - guard.y) < 24) onCaught();
    } else {
      guard.chaseLost += dt;
      moveToward(player.x, player.y, guard.speed * 1.2);
      if (guard.chaseLost > 4) { guard.state = 'return'; guard.suspicion = 0.55; }
    }
    return;
  }

  if (guard.state === 'suspicious' && guard.investigate) {
    const arrived = moveToward(guard.investigate.x, guard.investigate.y, guard.speed * 1.25);
    if (arrived) { guard.pause = 1.2; guard.investigate = null; guard.state = 'patrol'; }
    return;
  }

  if (guard.state === 'return') {
    // Walk back to the nearest waypoint, then resume the patrol.
    let best = 0; let bestD = Infinity;
    guard.path.forEach(([px, py], i) => {
      const d = Math.hypot(px - guard.x, py - guard.y);
      if (d < bestD) { bestD = d; best = i; }
    });
    const arrived = moveToward(guard.path[best][0], guard.path[best][1], guard.speed);
    if (arrived) { guard.waypoint = (best + 1) % guard.path.length; guard.state = 'patrol'; }
    return;
  }

  // Patrol: walk the waypoints, pausing briefly at each one to look around.
  if (guard.pause > 0) {
    guard.pause -= dt;
    guard.dir += dt * 0.9; // scan the room while waiting
    return;
  }
  const [tx, ty] = guard.path[guard.waypoint];
  const arrived = moveToward(tx, ty, guard.speed);
  if (arrived) {
    guard.waypoint = (guard.waypoint + 1) % guard.path.length;
    guard.pause = 0.8;
  }
}

// A pebble landing at (x, y) draws every guard in earshot to look.
export function distractGuards(guards, x, y) {
  for (const g of guards) {
    const d = Math.hypot(x - g.x, y - g.y);
    if (d < 260 && g.state !== 'alarm') {
      g.investigate = { x, y };
      g.state = 'suspicious';
      g.suspicion = Math.max(g.suspicion, 0.45);
    }
  }
}

export function alarmLevel(guards) {
  if (guards.some((g) => g.state === 'alarm')) return 'alarm';
  if (guards.some((g) => g.state === 'suspicious' || g.suspicion > 0.4)) return 'suspicious';
  return 'calm';
}
