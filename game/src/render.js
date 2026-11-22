// Canvas rendering: floor, cover, guards with vision cones, player, exit and
// the title / win / caught screens. Cones are drawn translucent so the player
// can read at a glance what is safe: green calm, amber suspicious, red alarm.

import { WORLD } from './level.js';

function conePath(ctx, g) {
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.arc(g.x, g.y, g.range, g.dir - g.fov / 2, g.dir + g.fov / 2);
  ctx.closePath();
}

function coneColor(g) {
  if (g.state === 'alarm') return 'rgba(255, 70, 70, 0.30)';
  if (g.state === 'suspicious' || g.suspicion > 0.4) return 'rgba(255, 190, 60, 0.30)';
  return 'rgba(255, 215, 90, 0.20)';
}

export function drawWorld(ctx, game) {
  const level = game.level;
  const { width, height } = WORLD;

  // Floor: dark archive tiles with a faint grid.
  ctx.fillStyle = '#171c2a';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = 'rgba(255,255,255,0.045)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
  for (let y = 0; y <= height; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

  // Shadow zones: pools of dark where detection rises half as fast.
  for (const s of level.shadows) {
    ctx.fillStyle = 'rgba(4, 6, 14, 0.55)';
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.strokeStyle = 'rgba(140,160,220,0.25)';
    ctx.strokeRect(s.x, s.y, s.w, s.h);
    ctx.fillStyle = 'rgba(160,175,220,0.5)';
    ctx.font = '11px sans-serif';
    ctx.fillText('SHADOW', s.x + 6, s.y + 15);
  }

  // Bushes: leafy hiding spots.
  for (const b of level.bushes) {
    ctx.fillStyle = '#1d4a26';
    ctx.beginPath();
    ctx.ellipse(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, b.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a6b35';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(b.x + 10 + i * 11, b.y + b.h / 2 + ((i % 2) ? -8 : 8), 9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Exit: glowing green door on the far wall.
  const e = level.exit;
  ctx.fillStyle = '#0f7a3d';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = '#7ee787';
  ctx.lineWidth = 3;
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = '#bff5cd';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', e.x + e.w / 2, e.y + e.h / 2 + 5);
  ctx.textAlign = 'left';

  // Files to steal: glowing yellow folders.
  for (const f of level.files) {
    if (f.taken) continue;
    const pulse = 0.6 + 0.4 * Math.sin(game.time * 3 + f.x);
    ctx.fillStyle = `rgba(255, 215, 94, ${0.25 + pulse * 0.25})`;
    ctx.beginPath(); ctx.arc(f.x, f.y, 20, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd75e';
    ctx.fillRect(f.x - 9, f.y - 7, 18, 14);
    ctx.fillStyle = '#7a5b00';
    ctx.fillRect(f.x - 9, f.y - 7, 18, 4);
  }

  // Walls and crates: solid cover that blocks sight and movement.
  ctx.fillStyle = '#39415a';
  for (const w of level.walls) ctx.fillRect(w.x, w.y, w.w, w.h);
  for (const c of level.crates) {
    ctx.fillStyle = '#8a6b3a';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = '#5d4522';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
    ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + c.w, c.y + c.h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(c.x + c.w, c.y); ctx.lineTo(c.x, c.y + c.h); ctx.stroke();
  }

  // Patrol routes: faint dotted lines so routes can be learned.
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.setLineDash([4, 6]);
  for (const g of game.guards) {
    ctx.beginPath();
    g.path.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
    ctx.closePath();
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Vision cones, then the guards themselves.
  for (const g of game.guards) {
    ctx.fillStyle = coneColor(g);
    conePath(ctx, g);
    ctx.fill();
    ctx.strokeStyle = coneColor(g).replace('0.30', '0.7').replace('0.20', '0.5');
    ctx.stroke();
  }
  for (const g of game.guards) {
    ctx.fillStyle = g.state === 'alarm' ? '#ff5252' : '#e8b23a';
    ctx.beginPath(); ctx.arc(g.x, g.y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#10141f'; ctx.lineWidth = 2; ctx.stroke();
    // Facing tick.
    ctx.strokeStyle = '#10141f';
    ctx.beginPath(); ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.dir) * 17, g.y + Math.sin(g.dir) * 17); ctx.stroke();
    // Suspicion meter above the guard.
    if (g.suspicion > 0.03) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(g.x - 16, g.y - 30, 32, 6);
      ctx.fillStyle = g.suspicion > 0.7 ? '#ff5252' : '#ffd75e';
      ctx.fillRect(g.x - 15, g.y - 29, 30 * g.suspicion, 4);
    }
    if (g.state === 'alarm') {
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 34);
      ctx.textAlign = 'left';
    }
  }

  // Thrown pebbles in flight / on the floor.
  for (const p of game.pebbles) {
    ctx.fillStyle = '#cfd6e4';
    ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.arc(p.x, p.y, 8 + p.age * 14, 0, Math.PI * 2); ctx.stroke();
  }

  // Click-to-move marker.
  if (game.input.clickTarget) {
    ctx.strokeStyle = 'rgba(127, 200, 255, 0.8)';
    ctx.beginPath(); ctx.arc(game.input.clickTarget.x, game.input.clickTarget.y, 8, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(game.input.clickTarget.x - 12, game.input.clickTarget.y);
    ctx.lineTo(game.input.clickTarget.x + 12, game.input.clickTarget.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(game.input.clickTarget.x, game.input.clickTarget.y - 12);
    ctx.lineTo(game.input.clickTarget.x, game.input.clickTarget.y + 12); ctx.stroke();
  }

  // The player: a hooded courier, teal cloak, dark hood.
  const p = game.player;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 10, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2dd4bf';
  ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0f3a35';
  ctx.beginPath(); ctx.arc(p.x, p.y - 2, 7, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2dd4bf';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + Math.cos(p.facing) * 16, p.y + Math.sin(p.facing) * 16); ctx.stroke();

  // Level name banner.
  ctx.fillStyle = 'rgba(10,13,22,0.75)';
  ctx.fillRect(16, 16, 250, 30);
  ctx.fillStyle = '#ffd75e';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(game.level.name.toUpperCase(), 26, 36);
}

function panel(ctx, title, lines, color) {
  ctx.fillStyle = 'rgba(8, 10, 18, 0.88)';
  ctx.fillRect(180, 140, 600, 300);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(180, 140, 600, 300);
  ctx.fillStyle = color;
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 480, 200);
  ctx.fillStyle = '#dfe6f2';
  ctx.font = '16px sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, 480, 245 + i * 30));
  ctx.fillStyle = '#8fb8ff';
  ctx.font = '14px sans-serif';
  ctx.fillText('Press ENTER or click to continue', 480, 405);
  ctx.textAlign = 'left';
}

export function drawScreen(ctx, game) {
  drawWorld(ctx, game);
  if (game.phase === 'title') {
    panel(ctx, 'SHADOW COURIER', [
      'Night Archive — slip past the guards, steal the files,',
      'reach the green EXIT unseen.',
      'WASD / arrows or click to move · right-click / F to toss a pebble',
      'Crates block sight · bushes hide you · shadows slow detection',
    ], '#ffd75e');
  } else if (game.phase === 'caught') {
    panel(ctx, 'CAUGHT!', [
      'A guard spotted you and raised the alarm.',
      `You had ${game.filesGot} of ${game.level.files.length} files.`,
      'Break line of sight next time — suspicion drains when unseen.',
    ], '#ff6b6b');
  } else if (game.phase === 'levelClear') {
    panel(ctx, 'LEVEL CLEAR', [
      `You slipped out with ${game.filesGot} files in ${game.timeText()}.`,
      'The next floor has more guards and longer sightlines.',
    ], '#7ee787');
  } else if (game.phase === 'win') {
    panel(ctx, 'GHOST — YOU WIN', [
      'All three floors cleared. The archive never knew you were there.',
      `Total time ${game.totalTimeText()} · files ${game.totalFiles} / ${game.totalFilesNeeded}`,
    ], '#7ee787');
  }
}
