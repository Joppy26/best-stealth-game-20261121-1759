# Shadow Courier — Night Archive

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/Joppy26/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/Joppy26/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

An original top-down stealth game for the [make.fun best stealth game bounty](https://make.fun/bounty/best-stealth-game-20261121-1759). You are a courier slipping through a night archive: steal the glowing files from each floor and reach the green EXIT without ever being fully seen.

## How to play

- **Move:** WASD / arrow keys, or left-click a spot to walk there.
- **Distract:** right-click (or press F) to toss a pebble at the cursor — nearby guards leave their patrol to investigate the noise.
- **Hide:** crates and walls block a guard's sight. Standing still in a bush makes you invisible; shadow pools slow detection to half speed.
- **Detection:** a guard's vision cone fills its suspicion meter while it can see you. Break line of sight and the meter drains — you can always recover. At full meter the guard raises the alarm and chases you; if it catches you, the level restarts.
- **Goal:** collect every file on the floor, then reach the green EXIT. Three floors, each with more guards, faster patrols and longer sightlines.
- **Restart:** R restarts the current floor, Enter continues after a win or a capture, M mutes the sound.

## The game

- 3 hand-designed levels with patrol routes you can learn (dotted route lines on the floor), vision cones that react to cover, bushes and shadow, a per-guard suspicion meter, alarm and chase states with a cooldown and return to patrol, and a pebble-distraction system.
- Synthesized WebAudio sound: footsteps that get louder near a guard, a rising cue as suspicion grows, an alarm klaxon, and chimes for pickups — no audio files, no network.
- Static files only: `game/index.html` plus its ES modules, no build step, no network requests. Serve with `node serve.ts` and open http://localhost:8080.

## Layout

- `game/index.html` — page, HUD and help text
- `game/style.css` — page styling
- `game/src/main.js` — game loop, movement, pickups, win/lose
- `game/src/level.js` — the three levels, walls, cover, line-of-sight math
- `game/src/guards.js` — guard AI: patrol, vision, suspicion, alarm, distraction
- `game/src/render.js` — canvas drawing: cones, cover, guards, screens
- `game/src/input.js` — keyboard and mouse
- `game/src/sound.js` — synthesized WebAudio effects
- `game/src/shots.js` — deterministic screenshot staging (`?shot=cover|patrol|exit|alert`)

Screenshots are in `screenshots/` (the first by name is the cover). `main.ts` hands the game in to make.fun; `shots.json` lists the staged shots.
