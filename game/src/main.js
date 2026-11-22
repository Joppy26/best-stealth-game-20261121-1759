// Shadow Courier — Night Archive: game loop, movement, pickups, win/lose.
// Top-down stealth: reach the green exit with the files, unseen.

import { LEVELS, WORLD, rectsCollide, pointInRect } from './level.js';
import { makeGuard, updateGuard, distractGuards, alarmLevel } from './guards.js';
import { createInput } from './input.js';
import { createSound } from './sound.js';
import { drawScreen } from './render.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hudLevel = document.getElementById('hud-level');
const hudObjective = document.getElementById('hud-objective');
const hudAlert = document.getElementById('hud-alert');
const hudTimer = document.getElementById('hud-timer');
const hudPebbles = document.getElementById('hud-pebbles');
const overlay = document.getElementById('overlay');

const input = createInput(canvas);
const sound = createSound();

const game = {
  levelIndex: 0,
  level: LEVELS[0],
  guards: [],
  player: { x: 70, y: 540, facing: 0, speedNow: 0, crouch: false },
  pebbles: [],          // pebbles lying on the floor (visual + ring)
  pebblesLeft: 5,
  filesGot: 0,
  phase: 'title',       // title | playing | caught | levelClear | win
  time: 0,              // seconds in the current level
  totalTime: 0,
  totalFiles: 0,
  totalFilesNeeded: LEVELS.reduce((n, l) => n + l.files.length, 0),
  input,
  startLevel,
  timeText,
  totalTimeText,
};

function startLevel(index) {
  game.levelIndex = index;
  // Deep-copy the level so a restart resets files and guard state.
  game.level = JSON.parse(JSON.stringify(LEVELS[index]));
  game.guards = game.level.guards.map((def, i) => makeGuard(def, i));
  game.player.x = game.level.player.x;
  game.player.y = game.level.player.y;
  game.player.facing = 0;
  game.pebbles = [];
  game.pebblesLeft = game.level.pebbles;
  game.filesGot = 0;
  game.time = 0;
}

function timeText() {
  const s = Math.floor(game.time);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function totalTimeText() {
  const s = Math.floor(game.totalTime);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function tryMove(dx, dy) {
  const p = game.player;
  const speed = p.crouch ? 95 : 165;
  const step = (dx * speed) / 60;
  const stepY = (dy * speed) / 60;
  const box = (x, y) => ({ x: x - 11, y: y - 11, w: 22, h: 22 });
  const blocked = (x, y) =>
    x < 16 || x > WORLD.width - 16 || y < 16 || y > WORLD.height - 16 ||
    game.level.walls.some((w) => rectsCollide(box(x, y), w)) ||
    game.level.crates.some((c) => rectsCollide(box(x, y), c));
  if (!blocked(p.x + step, p.y)) p.x += step;
  if (!blocked(p.x, p.y + stepY)) p.y += stepY;
  p.speedNow = Math.hypot(step, stepY) * 60;
  if (dx !== 0 || dy !== 0) p.facing = Math.atan2(dy, dx);
}

function update(dt) {
  if (game.phase !== 'playing') return;
  game.time += dt;

  // Movement: keys first, else walk toward the click target.
  game.player.crouch = input.crouch();
  const dir = input.keyDirection();
  let mx = dir.x; let my = dir.y;
  if (mx === 0 && my === 0 && input.clickTarget) {
    const dx = input.clickTarget.x - game.player.x;
    const dy = input.clickTarget.y - game.player.y;
    const d = Math.hypot(dx, dy);
    if (d < 8) input.clickTarget = null;
    else { mx = dx / d; my = dy / d; }
  }
  const len = Math.hypot(mx, my);
  if (len > 0) {
    tryMove(mx / len, my / len);
    const nearest = Math.min(...game.guards.map((g) => Math.hypot(g.x - game.player.x, g.y - game.player.y)));
    sound.step(nearest);
  } else {
    game.player.speedNow = 0;
  }

  // Pebble throw: right-click or F, at the mouse position.
  const pebbleAt = input.consumePebble();
  if (pebbleAt && game.pebblesLeft > 0) {
    game.pebblesLeft -= 1;
    game.pebbles.push({ x: pebbleAt.x, y: pebbleAt.y, age: 0 });
    distractGuards(game.guards, pebbleAt.x, pebbleAt.y);
    sound.pebble();
  }

  for (const p of game.pebbles) p.age += dt;
  game.pebbles = game.pebbles.filter((p) => p.age < 2.5);

  // Guards: patrol, see, chase. Getting caught ends the level.
  let wasAlarm = false;
  for (const g of game.guards) {
    const before = g.suspicion;
    updateGuard(g, dt, game.player, game.level, () => {
      game.phase = 'caught';
      sound.caught();
    });
    if (g.state === 'alarm') wasAlarm = true;
    if (before < 0.5 && g.suspicion >= 0.5) sound.suspicious();
    if (game.phase !== 'playing') break;
  }
  if (wasAlarm && game.phase === 'playing' && !game._alarmSounded) {
    game._alarmSounded = true;
    sound.alarm();
  }
  if (!wasAlarm) game._alarmSounded = false;
  if (game.phase !== 'playing') return;

  // Pick up files by walking over them.
  for (const f of game.level.files) {
    if (!f.taken && Math.hypot(f.x - game.player.x, f.y - game.player.y) < 26) {
      f.taken = true;
      game.filesGot += 1;
      game.totalFiles += 1;
      sound.pickup();
    }
  }

  // Exit opens once every file on the floor is taken.
  const e = game.level.exit;
  const allFiles = game.filesGot >= game.level.files.length;
  if (allFiles && pointInRect(game.player.x, game.player.y, e)) {
    game.totalTime += game.time;
    if (game.levelIndex + 1 >= LEVELS.length) {
      game.phase = 'win';
      sound.win();
    } else {
      game.phase = 'levelClear';
      sound.win();
    }
  }
}

function updateHud() {
  hudLevel.textContent = `${game.level.name} · ${game.levelIndex + 1}/${LEVELS.length}`;
  hudObjective.textContent = `Files ${game.filesGot}/${game.level.files.length}`;
  const alert = alarmLevel(game.guards);
  hudAlert.textContent = alert === 'alarm' ? 'ALARM!' : alert === 'suspicious' ? 'SUSPICIOUS' : 'CALM';
  hudAlert.className = alert === 'alarm' ? 'alarm' : alert === 'suspicious' ? 'suspicious' : '';
  hudTimer.textContent = game.timeText();
  hudPebbles.textContent = `Pebbles ×${game.pebblesLeft}`;
  const allFiles = game.filesGot >= game.level.files.length;
  overlay.textContent =
    game.phase === 'playing'
      ? allFiles
        ? 'All files stolen — get to the green EXIT!'
        : `${game.level.intro} Grab the glowing files, then reach the EXIT.`
      : '';
}

function advance() {
  if (game.phase === 'title' || game.phase === 'caught') {
    startLevel(game.phase === 'caught' ? game.levelIndex : 0);
    game.phase = 'playing';
    sound.click();
  } else if (game.phase === 'levelClear') {
    startLevel(game.levelIndex + 1);
    game.phase = 'playing';
    sound.click();
  } else if (game.phase === 'win') {
    game.totalTime = 0;
    game.totalFiles = 0;
    startLevel(0);
    game.phase = 'playing';
    sound.click();
  }
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && game.phase !== 'playing') advance();
  if (event.key.toLowerCase() === 'r' && (game.phase === 'caught' || game.phase === 'playing')) {
    startLevel(game.levelIndex);
    game.phase = 'playing';
  }
  if (event.key.toLowerCase() === 'm') sound.toggleMute();
  sound.unlock();
});
canvas.addEventListener('mousedown', () => {
  sound.unlock();
  if (game.phase !== 'playing') advance();
});

let last = performance.now();
let shotStaged = false;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!shotStaged) {
    shotStaged = true;
    // Freeze staged shots: a still scene for screenshots.
    if (applyShot(game, new URLSearchParams(location.search))) {
      game.frozen = true;
    }
  }
  if (!game.frozen) update(dt);
  drawScreen(ctx, game);
  updateHud();
  requestAnimationFrame(frame);
}

startLevel(0);
// Exposed for automated play-testing only (read player/guard state).
window.__game = game;
requestAnimationFrame(frame);
