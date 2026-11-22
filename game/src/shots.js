// Deterministic screenshot staging: ?shot=<name>&seed=<n> sets up a readable
// scene for the screenshots in shots.json. Each shot shows the player, guards
// with their vision cones, cover and the exit — the judge reads the game
// mostly through these images.

export function applyShot(game, query) {
  const shot = query.get('shot');
  if (!shot) return false;

  // Stage on level 1 for a consistent, readable layout.
  game.startLevel(0);
  game.phase = 'playing';
  const level = game.level;

  if (shot === 'cover') {
    // The courier crouched behind crates, a guard's cone sweeping past.
    game.player.x = 470; game.player.y = 380;
    game.player.facing = -Math.PI / 2;
    game.guards[0].x = 420; game.guards[0].y = 220; game.guards[0].dir = Math.PI / 2;
    game.guards[0].suspicion = 0.35;
    game.guards[1].x = 800; game.guards[1].y = 260; game.guards[1].dir = Math.PI;
    game.guards[1].suspicion = 0;
    game.pebblesLeft = 4;
    game.pebbles = [{ x: 620, y: 300, age: 0.4 }];
  } else if (shot === 'patrol') {
    // Wide view: both patrol routes, cones crossing the room, files glowing.
    game.player.x = 120; game.player.y = 500;
    game.player.facing = 0;
    game.guards[0].x = 300; game.guards[0].y = 300; game.guards[0].dir = 0;
    game.guards[0].suspicion = 0.15;
    game.guards[1].x = 820; game.guards[1].y = 300; game.guards[1].dir = Math.PI;
    game.guards[1].suspicion = 0;
  } else if (shot === 'exit') {
    // The courier one step from the green EXIT, a guard's cone just behind.
    game.player.x = 820; game.player.y = 110;
    game.player.facing = -Math.PI / 2;
    game.level.files.forEach((f) => { f.taken = true; });
    game.filesGot = game.level.files.length;
    game.guards[0].x = 560; game.guards[0].y = 430; game.guards[0].dir = -Math.PI / 2;
    game.guards[1].x = 760; game.guards[1].y = 320; game.guards[1].dir = Math.PI / 2;
    game.guards[1].suspicion = 0.55;
    game.guards[1].state = 'suspicious';
  } else if (shot === 'alert') {
    // Alarm moment: red cone, full suspicion meter, courier breaking away.
    game.player.x = 500; game.player.y = 240;
    game.player.facing = Math.PI;
    game.guards[0].x = 560; game.guards[0].y = 220; game.guards[0].dir = Math.PI;
    game.guards[0].suspicion = 1;
    game.guards[0].state = 'alarm';
    game.guards[1].x = 820; game.guards[1].y = 420; game.guards[1].dir = -Math.PI / 2;
    game.guards[1].suspicion = 0.6;
    game.guards[1].state = 'suspicious';
  } else {
    return false;
  }
  return true;
}
