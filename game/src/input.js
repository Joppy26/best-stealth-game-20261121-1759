// Keyboard + mouse input: WASD/arrows to move, left-click to walk to a spot,
// right-click (or F) to toss a pebble at the cursor. All coordinates are converted
// from page pixels into the canvas's 960x600 world.

export function createInput(canvas) {
  const input = {
    keys: new Set(),
    mouse: { x: 0, y: 0, inside: false },
    clickTarget: null,   // {x, y} world point to walk to, or null
    pebbleTarget: null,  // {x, y} world point to throw at, consumed by main.js
    crouch: false,
  };

  const toWorld = (event) => {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - r.left) / r.width) * 960,
      y: ((event.clientY - r.top) / r.height) * 600,
    };
  };

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
    input.keys.add(event.key.toLowerCase());
    if (event.key.toLowerCase() === 'f') {
      input.pebbleTarget = { ...input.mouse };
    }
  });
  window.addEventListener('keyup', (event) => input.keys.delete(event.key.toLowerCase()));

  canvas.addEventListener('mousemove', (event) => {
    input.mouse = { ...toWorld(event), inside: true };
  });
  canvas.addEventListener('mouseleave', () => { input.mouse.inside = false; });
  canvas.addEventListener('mousedown', (event) => {
    event.preventDefault();
    if (event.button === 2) input.pebbleTarget = toWorld(event);
    else if (event.button === 0) input.clickTarget = toWorld(event);
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  // Hold Shift to crouch: slower, but guards notice you half as fast.
  input.crouch = () => input.keys.has('shift');
  input.keyDirection = () => {
    let x = 0; let y = 0;
    if (input.keys.has('a') || input.keys.has('arrowleft')) x -= 1;
    if (input.keys.has('d') || input.keys.has('arrowright')) x += 1;
    if (input.keys.has('w') || input.keys.has('arrowup')) y -= 1;
    if (input.keys.has('s') || input.keys.has('arrowdown')) y += 1;
    if (x !== 0 || y !== 0) input.clickTarget = null;
    return { x, y };
  };

  input.consumePebble = () => {
    const p = input.pebbleTarget;
    input.pebbleTarget = null;
    return p;
  };

  return input;
}
