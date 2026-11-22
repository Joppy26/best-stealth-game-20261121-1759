// Synthesized sound effects via WebAudio — no audio files, no network.
// Footsteps tick softly and get louder near a guard; a rising tone marks
// suspicion, a klaxon marks the alarm, a chime marks a picked-up file.

export function createSound() {
  let ctx = null;
  let muted = false;
  let lastStep = 0;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = null) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t = ac.currentTime + when;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    get muted() { return muted; },

    // Soft footstep tick; volume follows how close the nearest guard is.
    step(nearestGuardDist) {
      const now = performance.now();
      if (now - lastStep < 240) return;
      lastStep = now;
      const vol = Math.max(0.02, 0.12 - nearestGuardDist / 4000);
      tone(90 + Math.random() * 30, 0.07, 'triangle', vol);
    },
    // Short rustle when a pebble lands.
    pebble() { tone(1400, 0.08, 'square', 0.05, 0, 500); },
    pickup() { tone(660, 0.12, 'sine', 0.12); tone(990, 0.18, 'sine', 0.12, 0.1); },
    // Rising two-note cue as a guard gets suspicious.
    suspicious() { tone(330, 0.15, 'sawtooth', 0.05, 0, 440); },
    alarm() {
      tone(220, 0.5, 'sawtooth', 0.09, 0, 440);
      tone(220, 0.5, 'sawtooth', 0.09, 0.55, 440);
    },
    caught() { tone(180, 0.9, 'sawtooth', 0.12, 0, 60); },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'sine', 0.1, i * 0.13));
    },
    click() { tone(800, 0.05, 'square', 0.04); },
  };
}
