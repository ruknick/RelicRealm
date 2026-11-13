// Procedural music + sound effects with the Web Audio API (no audio files).
// Modes: 2 = music + effects, 1 = effects only, 0 = muted. Saved per device.
window.Sound = (() => {
  const KEY = 'warrior-m3-sound';
  let mode = 2;
  try { const v = localStorage.getItem(KEY); if (v !== null) mode = +v; } catch (e) { /* ignore */ }

  let ctx = null, master, musicBus, sfxBus, noiseBuf;
  let wanted = null, playing = null, timer = null, nextTime = 0, step = 0;

  const midi = m => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.32; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);
    // A little echo on the music so it sounds like a hall, not a beeper.
    const delay = ctx.createDelay(); delay.delayTime.value = 0.27;
    const fb = ctx.createGain(); fb.gain.value = 0.28;
    const wet = ctx.createGain(); wet.gain.value = 0.25;
    musicBus.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }

  // Browsers only allow sound after the first tap.
  function unlock() {
    if (!init()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (wanted && mode === 2 && !timer) startLoop();
  }
  ['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, unlock, { capture: true }));
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });

  // ---------- instruments ----------
  function tone(freq, t, dur, o = {}) {
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    if (o.glide) osc.frequency.exponentialRampToValueAtTime(o.glide, t + dur);
    const v = o.vol ?? 0.2, a = o.attack ?? 0.005;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let out = g;
    if (o.lp) {
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp;
      g.connect(f); out = f;
    }
    osc.connect(g); out.connect(o.bus || sfxBus);
    osc.start(t); osc.stop(t + dur + 0.05);
  }
  function noise(t, dur, o = {}) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = o.filter || 'highpass'; f.frequency.setValueAtTime(o.freq || 1000, t);
    if (o.sweep) f.frequency.exponentialRampToValueAtTime(o.sweep, t + dur);
    const g = ctx.createGain(); const v = o.vol ?? 0.2;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(o.bus || sfxBus);
    src.start(t); src.stop(t + dur + 0.05);
  }
  // Lute-ish pluck: bright attack, quick decay.
  function pluck(m, t, dur, vol = 0.18, bus) {
    tone(midi(m), t, dur, { type: 'triangle', vol, bus });
    tone(midi(m) * 2.001, t, dur * 0.5, { type: 'sawtooth', vol: vol * 0.18, bus, lp: 2200 });
  }
  const kick = (t, bus, vol = 0.5) => tone(130, t, 0.22, { type: 'sine', glide: 42, vol, bus });
  const snare = (t, bus, vol = 0.14) => noise(t, 0.14, { filter: 'bandpass', freq: 1800, vol, bus });
  const hat = (t, bus, vol = 0.04) => noise(t, 0.04, { filter: 'highpass', freq: 7000, vol, bus });

  // ---------- music ----------
  const _ = null;
  const TRACKS = {
    // Calm D-dorian folk tune for home and gathering.
    forest: {
      bpm: 92,
      roots: [38, 36, 31, 33],
      chords: [[50, 53, 57], [48, 52, 55], [43, 47, 50], [45, 48, 52]],
      melody: [
        69, _, 67, 65, 64, _, 62, _,   64, _, 67, _, 72, 71, 69, _,
        71, _, 69, 67, 69, _, 62, 64,  65, _, 64, _, 62, _, _, _,
        74, 72, 69, _, 72, 69, 67, _,  67, _, 64, 67, 69, _, 72, _,
        71, 69, 67, _, 67, 71, 74, _,  72, _, 69, _, 64, _, 62, _,
      ],
      play(i, t, d) {
        const bar = Math.floor(i / 8) % 4, s = i % 8;
        const root = this.roots[bar];
        if (s === 0) {
          tone(midi(root), t, d * 7, { type: 'triangle', vol: 0.16, bus: musicBus });
          this.chords[bar].forEach(n => tone(midi(n), t, d * 8, { type: 'sine', vol: 0.035, attack: 0.25, bus: musicBus }));
          tone(90, t, 0.25, { type: 'sine', glide: 50, vol: 0.18, bus: musicBus });
        }
        if (s === 4) tone(midi(root + 7), t, d * 3, { type: 'triangle', vol: 0.1, bus: musicBus });
        if (s === 2 || s === 6) hat(t, musicBus, 0.025);
        const m = this.melody[i % this.melody.length];
        if (m) pluck(m, t, d * 2.2, 0.13, musicBus);
      },
    },
    // Driving A-minor march for raids.
    battle: {
      bpm: 138,
      roots: [33, 29, 31, 28],
      melody: [
        69, _, 72, _, 76, _, 74, 72,   72, _, 69, _, 65, _, 69, _,
        71, _, 74, _, 79, 77, 76, 74,  76, _, 71, _, 68, 71, 76, _,
        81, _, 79, 76, 77, _, 76, 72,  72, 74, 76, _, 72, _, 69, _,
        74, _, 71, _, 79, _, 77, 76,   76, _, 75, 76, 71, _, _, _,
      ],
      play(i, t, d) {
        const bar = Math.floor(i / 8) % 4, s = i % 8;
        const root = this.roots[bar];
        const bass = [0, 0, 12, 0, 0, 12, 0, 7][s];
        tone(midi(root + 12 + bass), t, d * 0.9, { type: 'sawtooth', vol: 0.06, bus: musicBus, lp: 700 });
        if (s === 0 || s === 3 || s === 4) kick(t, musicBus, 0.32);
        if (s === 2 || s === 6) snare(t, musicBus, 0.07);
        hat(t, musicBus, 0.018);
        const m = this.melody[i % this.melody.length];
        if (m) {
          tone(midi(m), t, d * 1.6, { type: 'square', vol: 0.045, bus: musicBus, lp: 1800 });
          tone(midi(m - 12), t, d * 1.6, { type: 'triangle', vol: 0.06, bus: musicBus });
        }
      },
    },
  };
  // Echoing E-minor mine tune: low drone, sparse plucks, pick clinks.
  TRACKS.mine = {
    bpm: 84,
    roots: [28, 28, 24, 26],
    melody: [
      64, _, _, 67, _, 71, _, _,   69, _, 67, _, 64, _, _, _,
      60, _, 64, _, 67, _, 72, 71, 69, _, _, 67, 66, _, _, _,
      64, _, 71, _, 76, _, 74, 71, 72, _, 69, _, 67, _, _, _,
      64, 67, 71, _, 69, _, 67, 64, 62, _, 64, _, _, _, _, _,
    ],
    play(i, t, d) {
      const bar = Math.floor(i / 8) % 4, s = i % 8;
      const root = this.roots[bar];
      if (s === 0) {
        tone(midi(root), t, d * 8, { type: 'sawtooth', vol: 0.05, bus: musicBus, lp: 300, attack: 0.3 });
        tone(midi(root + 12), t, d * 8, { type: 'sine', vol: 0.06, bus: musicBus, attack: 0.4 });
        tone(80, t, 0.3, { type: 'sine', glide: 45, vol: 0.2, bus: musicBus });
      }
      if (s === 7 && bar % 2 === 1) tone(2400, t, 0.12, { type: 'sine', vol: 0.03, bus: musicBus });
      const m = this.melody[i % this.melody.length];
      if (m) pluck(m - 12, t, d * 2.6, 0.12, musicBus);
    },
  };
  TRACKS.home = TRACKS.forest;
  TRACKS.dwarf = TRACKS.battle;

  function startLoop() {
    if (!ctx || timer || !wanted) return;
    playing = wanted;
    nextTime = ctx.currentTime + 0.1;
    step = 0;
    timer = setInterval(() => {
      const tr = TRACKS[playing];
      const d = 60 / tr.bpm / 2;
      while (nextTime < ctx.currentTime + 0.3) {
        tr.play(step, nextTime, d);
        nextTime += d;
        step = (step + 1) % 64;
      }
    }, 60);
  }
  function stopLoop() { clearInterval(timer); timer = null; playing = null; }

  function music(name) {
    wanted = name;
    if (playing === name && timer) return;
    stopLoop();
    if (mode === 2 && ctx && ctx.state !== 'closed') startLoop();
  }

  // ---------- sound effects ----------
  const SFX = {
    swap: t => tone(520, t, 0.07, { type: 'square', glide: 820, vol: 0.04 }),
    nope: t => { tone(170, t, 0.16, { type: 'sawtooth', vol: 0.07, lp: 900 }); tone(150, t + 0.08, 0.16, { type: 'sawtooth', vol: 0.07, lp: 900 }); },
    match: (t, step = 1) => {
      const base = 72 + Math.min(step - 1, 6) * 2;
      [0, 4, 7].forEach((n, i) => pluck(base + n, t + i * 0.035, 0.3, 0.12));
    },
    blast: t => { noise(t, 0.45, { filter: 'lowpass', freq: 3000, sweep: 200, vol: 0.35 }); tone(110, t, 0.45, { type: 'sine', glide: 35, vol: 0.4 }); },
    hit: t => { noise(t, 0.08, { filter: 'bandpass', freq: 900, vol: 0.2 }); tone(160, t, 0.12, { type: 'sine', glide: 70, vol: 0.25 }); },
    break: t => { noise(t, 0.3, { filter: 'highpass', freq: 1200, vol: 0.22 }); tone(240, t, 0.25, { type: 'square', glide: 90, vol: 0.06 }); },
    coin: t => { tone(1319, t, 0.1, { type: 'sine', vol: 0.12 }); tone(1760, t + 0.08, 0.25, { type: 'sine', vol: 0.12 }); },
    reveal: t => noise(t, 0.45, { filter: 'bandpass', freq: 300, sweep: 2500, vol: 0.12 }),
    drums: t => [0, 0.13, 0.26, 0.45].forEach((o, i) => tone(i === 3 ? 70 : 95, t + o, 0.2, { type: 'sine', glide: 45, vol: 0.4 })),
    victory: t => {
      [72, 76, 79, 84].forEach((m, i) => tone(midi(m), t + i * 0.11, 0.3, { type: 'square', vol: 0.06, lp: 2500 }));
      [72, 76, 79, 84].forEach(m => tone(midi(m), t + 0.5, 1.1, { type: 'triangle', vol: 0.08 }));
    },
    clank: t => {
      tone(1180, t, 0.25, { type: 'square', vol: 0.05, lp: 4000 });
      tone(1730, t, 0.3, { type: 'sine', vol: 0.1 });
      tone(2610, t, 0.2, { type: 'sine', vol: 0.05 });
      noise(t, 0.06, { filter: 'highpass', freq: 3000, vol: 0.25 });
      tone(120, t, 0.12, { type: 'sine', glide: 60, vol: 0.3 });
    },
    whoosh: t => noise(t, 0.25, { filter: 'bandpass', freq: 600, sweep: 2400, vol: 0.08 }),
    crafted: t => {
      [67, 72, 76, 79, 84].forEach((m, i) => pluck(m, t + i * 0.07, 0.5, 0.12));
      for (let i = 0; i < 6; i++) tone(2000 + Math.random() * 2000, t + 0.35 + i * 0.05, 0.12, { type: 'sine', vol: 0.03 });
    },
    tick: t => tone(1500, t, 0.03, { type: 'sine', vol: 0.04 }),
  };

  function sfx(name, arg) {
    if (mode === 0) return;
    if (!init()) return;
    if (ctx.state === 'suspended') ctx.resume();
    const f = SFX[name];
    if (f) f(ctx.currentTime + 0.01, arg);
  }

  // ---------- mute button ----------
  const ICONS = ['🔇', '🔈', '🔊'];
  const TITLES = ['Sound off', 'Effects only', 'Music + effects'];
  function updateButton() {
    const b = document.getElementById('sound-btn');
    if (b) { b.textContent = ICONS[mode]; b.title = TITLES[mode]; }
  }
  function cycle() {
    mode = (mode + 2) % 3;          // 2 → 1 → 0 → 2
    try { localStorage.setItem(KEY, mode); } catch (e) { /* ignore */ }
    if (mode === 2) { unlock(); music(wanted); } else stopLoop();
    updateButton();
    toastMode();
  }
  function toastMode() {
    const t = document.getElementById('sound-toast');
    if (!t) return;
    t.textContent = TITLES[mode];
    t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 1200);
  }
  function bind() {
    const b = document.getElementById('sound-btn');
    if (b) b.onclick = cycle;
    updateButton();
  }

  return { sfx, music, bind, get mode() { return mode; } };
})();
