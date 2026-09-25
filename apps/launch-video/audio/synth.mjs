import fs from 'node:fs';
import path from 'node:path';
import { SCENES } from '../src/scenes/index.js';
import { BAR, BEAT, DURATION } from '../src/timeline.js';
import {
  Biquad,
  Bus,
  db,
  mtof,
  pingPong,
  reverb,
  rng,
  Saw,
  Sine,
  SR,
  TAU,
  writeWav,
} from './dsp.mjs';

const root = path.resolve(import.meta.dirname, '..');
const LEN = DURATION + 0.5;
const noise = rng(7);
const N = () => noise() * 2 - 1;

const CHORDS = {
  Dm: { pad: [62, 65, 69, 72, 76], bass: 38, arp: [62, 65, 69, 72, 76, 81] },
  Bb: { pad: [58, 62, 65, 69, 72], bass: 34, arp: [58, 62, 65, 69, 72, 74] },
  F: { pad: [57, 60, 64, 65, 67], bass: 41, arp: [60, 64, 65, 69, 72, 76] },
  C: { pad: [60, 64, 67, 69, 74], bass: 36, arp: [60, 64, 67, 69, 72, 76] },
};
// One chord per 2 s bar.
const BARS =
  'Dm Dm Bb C Dm Bb F C Dm Bb F C Dm Bb C Dm Bb F C Dm Bb F C Dm Bb F Bb Dm Bb C Dm Dm Bb F C F F F F'.split(
    ' ',
  );
const chordAt = (t) => CHORDS[BARS[Math.min(BARS.length - 1, Math.floor(t / BAR))]];

const beats = (from, to, step = BEAT) => {
  const out = [];
  for (let t = from; t < to - 1e-6; t += step) out.push(Math.round(t * 1000) / 1000);
  return out;
};

const drums = new Bus(LEN);
const bass = new Bus(LEN);
const pads = new Bus(LEN);
const arps = new Bus(LEN);
const sfx = new Bus(LEN);
const verbSend = new Bus(LEN);

function kick(t, gain = 1, { tone = 1 } = {}) {
  const osc = new Sine();
  const hp = new Biquad('hp', 2000);
  drums.voice(
    t,
    0.6,
    (x) => {
      const f = 46 + 150 * Math.exp(-x / 0.03) * tone;
      const amp = x < 0.004 ? x / 0.004 : Math.exp(-(x - 0.004) / 0.32);
      const click = hp.run(N()) * Math.exp(-x / 0.003) * 0.35;
      return Math.tanh(osc.run(f) * amp * 1.8) * 0.8 + click;
    },
    { gain },
  );
}

function clap(t, gain = 1) {
  const bp = new Biquad('bp', 1400, 0.9);
  const hp = new Biquad('hp', 600);
  const fn = (x) => {
    let env = 0;
    for (const o of [0, 0.011, 0.022]) if (x >= o) env += Math.exp(-(x - o) / 0.006);
    env += x > 0.03 ? Math.exp(-(x - 0.03) / 0.09) * 0.6 : 0;
    return hp.run(bp.run(N())) * env * 1.6;
  };
  drums.voice(t, 0.4, fn, { gain });
  verbSend.voice(t, 0.4, (x) => (x < 0.05 ? N() * 0.4 : 0), { gain: gain * 0.35 });
}

function hat(t, gain = 1, open = false, pan = 0) {
  const hp = new Biquad('hp', open ? 7000 : 8500, 0.8);
  const tau = open ? 0.14 : 0.028;
  drums.voice(t, open ? 0.5 : 0.12, (x) => hp.run(N()) * Math.exp(-x / tau), { gain, pan });
}

function snare(t, gain = 1) {
  const osc = new Sine();
  const bp = new Biquad('bp', 3000, 0.7);
  drums.voice(
    t,
    0.3,
    (x) => {
      const body = osc.run(185 - 40 * x) * Math.exp(-x / 0.05) * 0.5;
      return body + bp.run(N()) * Math.exp(-x / 0.1);
    },
    { gain },
  );
}

function crash(t, gain = 1, dur = 2.4) {
  const envf = (x) => Math.exp(-x / (dur * 0.33));
  const a = new Biquad('hp', 5000, 0.5);
  const b = new Biquad('hp', 5000, 0.5);
  drums.voice(t, dur, (x) => [a.run(N()) * envf(x), b.run(N()) * envf(x)], { gain: gain * 0.5 });
  verbSend.voice(t, 0.6, (x) => N() * Math.exp(-x / 0.3), { gain: gain * 0.25 });
}

function reverseCymbal(at, dur = 1.0, gain = 1) {
  const a = new Biquad('hp', 3000, 0.6);
  const b = new Biquad('hp', 3000, 0.6);
  drums.voice(
    at - dur,
    dur,
    (x) => {
      const e = (x / dur) ** 3;
      return [a.run(N()) * e, b.run(N()) * e];
    },
    { gain: gain * 0.5 },
  );
}

function snareRoll(from, to, gain = 1) {
  let t = from;
  while (t < to - 0.01) {
    const p = (t - from) / (to - from);
    const step = p < 0.5 ? BEAT / 2 : p < 0.8 ? BEAT / 4 : BEAT / 8;
    snare(t, gain * (0.25 + 0.75 * p * p));
    t += step;
  }
}

// Sidechain: every kick ducks the tonal buses.
const kickTimes = [];
function duck(t, depth = 0.6) {
  let lo = 0;
  let hi = kickTimes.length - 1;
  let last = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (kickTimes[mid] <= t) {
      last = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  if (last < 0) return 1;
  const d = t - kickTimes[last];
  if (d > 0.6) return 1;
  const a = d < 0.006 ? d / 0.006 : 1;
  return 1 - depth * a * Math.exp(-d / 0.13);
}

function bassNote(t, midi, dur, gain = 1, bright = 1) {
  const s1 = new Saw(0.1);
  const s2 = new Saw(0.6);
  const sub = new Sine();
  const lp1 = new Biquad('lp', 400, 0.9);
  const lp2 = new Biquad('lp', 400, 0.7);
  const f = mtof(midi);
  bass.voice(
    t,
    dur + 0.08,
    (x, i) => {
      if (i % 16 === 0) {
        const c = 120 + 900 * bright * Math.exp(-x / 0.07);
        lp1.set(c, 0.9);
        lp2.set(c, 0.7);
      }
      const env = x < 0.005 ? x / 0.005 : x > dur ? Math.max(0, 1 - (x - dur) / 0.08) : 1;
      const v = (s1.run(f * 1.003) + s2.run(f * 0.997)) * 0.5;
      return (lp2.run(lp1.run(v)) * 0.8 + sub.run(f) * 0.45) * env;
    },
    { gain },
  );
}

function padChord(t, dur, notes, { gain = 1, cutoff = 1800, attack = 0.25, release = 0.5 } = {}) {
  notes.forEach((m, n) => {
    const f = mtof(m);
    [-0.12, 0, 0.12].forEach((cents, k) => {
      const osc = new Saw((n * 0.37 + k * 0.21) % 1);
      const lp = new Biquad('lp', typeof cutoff === 'function' ? cutoff(t) : cutoff, 0.6);
      const ff = f * 2 ** (cents / 12 / 10);
      const pan = (k - 1) * 0.9;
      pads.voice(
        t,
        dur + release,
        (x, i) => {
          if (i % 64 === 0) lp.set(typeof cutoff === 'function' ? cutoff(t + x) : cutoff, 0.6);
          const a = Math.min(1, x / attack);
          const r = x > dur ? Math.max(0, 1 - (x - dur) / release) : 1;
          return lp.run(osc.run(ff)) * a * r;
        },
        { gain: gain * 0.06, pan },
      );
    });
  });
}

function pluck(t, midi, { gain = 1, pan = 0, decay = 0.22, bright = 1 } = {}) {
  const s = new Saw(0.3);
  const q = new Sine();
  const lp = new Biquad('lp', 2000, 1.2);
  const f = mtof(midi);
  arps.voice(
    t,
    decay * 3,
    (x, i) => {
      if (i % 16 === 0) lp.set(300 + 5200 * bright * Math.exp(-x / 0.06), 1.2);
      const v = s.run(f) * 0.6 + (q.run(f * 2) > 0 ? 0.25 : -0.25);
      return lp.run(v) * Math.exp(-x / decay);
    },
    { gain, pan },
  );
}

function bell(t, midi, gain = 1, pan = 0, decay = 1.6, bus = arps) {
  const car = new Sine();
  const mod = new Sine();
  const f = mtof(midi);
  bus.voice(
    t,
    decay * 3.5,
    (x) => {
      const idx = 2.2 * Math.exp(-x / 0.4);
      const m = mod.run(f * 3.5) * idx * f;
      return car.run(f + m) * Math.exp(-x / decay) * (x < 0.003 ? x / 0.003 : 1);
    },
    { gain, pan },
  );
}

function arrange() {
  for (const t of [2, 3, 4, 5, 6, 7]) {
    kick(t, 0.35 + (t - 2) * 0.06, { tone: 0.6 });
    kickTimes.push(t);
  }
  padChord(0, 4, CHORDS.Dm.pad, { gain: 0.9, cutoff: (t) => 500 + t * 300, attack: 2.5 });
  padChord(4, 2, CHORDS.Bb.pad, { gain: 0.9, cutoff: 1800 });
  padChord(6, 2, CHORDS.C.pad, { gain: 0.9, cutoff: (t) => 1800 + (t - 6) * 1200 });
  reverseCymbal(8, 1.6, 1.2);

  const groove = (
    from,
    to,
    {
      hats = '16',
      clapOn = true,
      bassMode = 'off',
      padGain = 0.7,
      cutoff = 2200,
      arp = false,
      openHats = false,
      arpBright = 1,
    },
  ) => {
    for (const b of beats(from, to)) {
      kick(b, 0.95);
      kickTimes.push(b);
      const beatIdx = Math.round(b / BEAT) % 4;
      if (clapOn && (beatIdx === 1 || beatIdx === 3)) clap(b, 0.7);
      if (hats === '16')
        for (let k = 0; k < 4; k++)
          hat(b + (k * BEAT) / 4, k === 2 ? 0.4 : 0.18 + noise() * 0.06, false, 0.2);
      if (hats === '8') hat(b + BEAT / 2, 0.45, false, 0.15);
      if (openHats) hat(b + BEAT / 2, 0.24, true, -0.2);
      const ch = chordAt(b);
      if (bassMode === 'off') bassNote(b + BEAT / 2, ch.bass, BEAT / 2 - 0.04, 0.9);
      if (bassMode === 'roll')
        for (const k of [1, 2, 3])
          bassNote(b + (k * BEAT) / 4, ch.bass + (k === 3 ? 12 : 0), BEAT / 4 - 0.03, 0.8, 0.8);
      if (arp) {
        const pat = [0, 2, 4, 5, 3, 1, 4, 2];
        for (let k = 0; k < 4; k++) {
          const step = Math.round((b + (k * BEAT) / 4) / (BEAT / 4));
          const m = ch.arp[pat[step % pat.length] % ch.arp.length];
          pluck(b + (k * BEAT) / 4, m, {
            gain: 0.22,
            pan: step % 2 ? 0.45 : -0.45,
            bright: arpBright,
          });
        }
      }
    }
    for (let bar = Math.ceil(from / BAR) * BAR; bar < to - 0.01; bar += BAR) {
      padChord(bar, BAR, chordAt(bar).pad, { gain: padGain, cutoff });
    }
  };

  crash(8, 1.1);
  groove(8, 18.5, { hats: '16', arp: false, padGain: 0.55, cutoff: 1600 });
  padChord(18.5, 1.5, CHORDS.Dm.pad, {
    gain: 0.8,
    cutoff: (t) => 900 + (t - 18.5) * 2600,
    attack: 0.2,
  });
  for (const t of beats(18.5, 20, BEAT / 2)) hat(t, 0.25, false, t % 1 ? 0.3 : -0.3);
  reverseCymbal(20, 1.2, 0.9);
  crash(20, 0.8);
  groove(20, 28, { hats: '16', arp: false, padGain: 0.55, cutoff: 1800 });
  for (let t = 12; t < 28; t += BEAT / 4) {
    const ch = chordAt(t);
    const step = Math.round(t / (BEAT / 4));
    if (step % 2 === 0)
      pluck(t, ch.arp[[0, 2, 4, 3][Math.floor(step / 2) % 4]], {
        gain: 0.18,
        pan: step % 4 ? 0.4 : -0.4,
        bright: 0.7,
      });
  }
  padChord(28, 2, CHORDS.C.pad, { gain: 0.9, cutoff: (t) => 800 + (t - 28) * 2500, attack: 0.4 });
  snareRoll(29, 30, 0.6);
  reverseCymbal(30, 1.2, 1);
  crash(30, 1);
  groove(30, 40.5, {
    hats: '16',
    bassMode: 'roll',
    arp: true,
    padGain: 0.45,
    cutoff: 1400,
    openHats: true,
  });
  groove(40.5, 42, {
    hats: '8',
    bassMode: 'off',
    arp: false,
    padGain: 0.6,
    cutoff: 2600,
    clapOn: false,
  });
  crash(42, 0.8);
  groove(42, 51.5, {
    hats: '16',
    bassMode: 'off',
    arp: true,
    padGain: 0.55,
    cutoff: 2600,
    openHats: true,
    arpBright: 1.3,
  });
  reverseCymbal(47.65, 0.8, 0.8);
  padChord(51.5, 2.5, CHORDS.Bb.pad, { gain: 0.5, cutoff: 2400, attack: 0.3, release: 0.8 });
  for (const t of [52, 52.5, 53]) {
    kick(t, 0.6);
    bassNote(t, 34, 0.4, 0.7, 0.6);
  }
  crash(54, 0.7);
  groove(54, 59, { hats: '16', bassMode: 'roll', arp: false, padGain: 0.4, cutoff: 1500 });
  for (let i = 0; i < 12; i++)
    pluck(55.45 + i * 0.25, chordAt(55.45 + i * 0.25).arp[(i * 2) % 6] + 12, {
      gain: 0.2,
      pan: i % 2 ? 0.5 : -0.5,
      decay: 0.15,
    });
  for (const b of beats(59, 60)) {
    kick(b, 0.9);
    kickTimes.push(b);
  }
  snareRoll(59, 60, 0.7);
  reverseCymbal(60, 1.0, 1);
  [60, 60.5, 61, 61.5].forEach((t, i) => {
    kick(t, 1.1);
    crash(t, 0.5 + i * 0.1, 1.2);
    padChord(
      t,
      0.3,
      CHORDS.Dm.pad.map((m) => m - 12 + [0, 0, 2, 5][i]),
      { gain: 1.4, cutoff: 3500, attack: 0.005, release: 0.25 },
    );
    bassNote(t, 38 + [0, 0, 3, 7][i], 0.35, 1.1, 1.4);
  });
  crash(62, 0.8);
  groove(62, 66, {
    hats: '8',
    bassMode: 'off',
    arp: true,
    padGain: 0.0,
    cutoff: 1000,
    arpBright: 0.8,
  });
  groove(66, 70, {
    hats: '16',
    bassMode: 'roll',
    arp: true,
    padGain: 0.6,
    cutoff: 2400,
    openHats: true,
  });
  snareRoll(68, 70, 0.7);
  reverseCymbal(70, 1.6, 1.3);
  crash(70, 1.3, 4);
  kick(70, 1.2);
  padChord(70, 7, [53, 57, 60, 64, 67, 72], {
    gain: 1.1,
    cutoff: (t) => 4200 - (t - 70) * 380,
    attack: 0.02,
    release: 1.2,
  });
  bassNote(70, 41, 5.5, 0.9, 0.5);
  const bells = [72, 76, 79, 84, 81, 76, 79, 72, 76, 84];
  bells.forEach((m, i) => {
    bell(70.5 + i * 0.5, m, 0.12, i % 2 ? 0.5 : -0.5);
  });
}

// Sound design: one generator per cue type used in the scenes' sfx lists.
const SFX = {
  tick(t, g) {
    const s = new Sine();
    sfx.voice(t, 0.05, (x) => s.run(2600 - 900 * x * 20) * Math.exp(-x / 0.01), { gain: g * 0.35 });
  },
  click(t, g) {
    const bp = new Biquad('bp', 3200, 1.4);
    const s = new Sine();
    sfx.voice(
      t,
      0.06,
      (x) => bp.run(N()) * Math.exp(-x / 0.002) * 1.4 + s.run(1700) * Math.exp(-x / 0.008) * 0.5,
      { gain: g * 0.55 },
    );
  },
  type(t, g, _o, seed) {
    const r = rng(seed);
    const bp = new Biquad('bp', 1800 + r() * 2200, 1.1);
    const s = new Sine();
    const f = 140 + r() * 60;
    sfx.voice(
      t,
      0.07,
      (x) => bp.run(N()) * Math.exp(-x / 0.006) * 1.2 + s.run(f) * Math.exp(-x / 0.015) * 0.6,
      { gain: g * 0.45, pan: r() * 0.6 - 0.3 },
    );
  },
  key(t, g) {
    const bp = new Biquad('bp', 1200, 1);
    const s = new Sine();
    sfx.voice(
      t,
      0.12,
      (x) => bp.run(N()) * Math.exp(-x / 0.01) * 1.3 + s.run(110) * Math.exp(-x / 0.03) * 0.9,
      { gain: g * 0.6 },
    );
  },
  snap(t, g) {
    const a = new Sine();
    const b = new Sine();
    const s = new Sine();
    sfx.voice(
      t,
      0.2,
      (x) =>
        a.run(3400) * Math.exp(-x / 0.012) * 0.5 +
        (x > 0.035 ? b.run(5200) * Math.exp(-(x - 0.035) / 0.02) * 0.4 : 0) +
        s.run(90) * Math.exp(-x / 0.05) * 0.8,
      { gain: g * 0.6 },
    );
    verbSend.voice(t, 0.1, (x) => a.run(3400) * Math.exp(-x / 0.02), { gain: g * 0.5 });
  },
  grab(t, g) {
    const s = new Sine();
    sfx.voice(t, 0.12, (x) => s.run(260 - 500 * x) * Math.exp(-x / 0.03), { gain: g * 0.45 });
  },
  swish(t, g) {
    const bp = new Biquad('bp', 800, 1.5);
    sfx.voice(
      t,
      0.35,
      (x, i) => {
        if (i % 32 === 0) bp.set(600 + x * 6000, 1.5);
        return bp.run(N()) * Math.sin((Math.PI * x) / 0.35);
      },
      { gain: g * 0.35 },
    );
  },
  whoosh(t, g, o = {}) {
    const dur = o.dur ?? 0.7;
    const a = new Biquad('bp', 500, 0.8);
    const b = new Biquad('bp', 500, 0.8);
    sfx.voice(
      t - dur * 0.35,
      dur,
      (x, i) => {
        const p = x / dur;
        if (i % 32 === 0) {
          const f = 250 + 3200 * Math.sin(Math.PI * p) ** 2;
          a.set(f, 0.8);
          b.set(f * 1.1, 0.8);
        }
        const e = Math.sin(Math.PI * p) ** 2;
        return [a.run(N()) * e * (1.2 - p), b.run(N()) * e * (0.2 + p)];
      },
      { gain: g * 0.7 },
    );
  },
  wipe(t, g) {
    SFX.whoosh(t + 0.2, g * 1.1, { dur: 0.8 });
    const s = new Sine();
    sfx.voice(t + 0.15, 0.4, (x) => s.run(70 - 30 * x) * Math.exp(-x / 0.12), { gain: g * 0.5 });
  },
  riser(t, g, o = {}) {
    const dur = o.dur ?? 2;
    const bp = new Biquad('bp', 400, 2);
    const saw = new Saw();
    const lp = new Biquad('lp', 400, 1.5);
    sfx.voice(
      t,
      dur,
      (x, i) => {
        const p = x / dur;
        if (i % 32 === 0) {
          bp.set(300 + 7000 * p * p, 2);
          lp.set(300 + 5000 * p * p, 1.5);
        }
        const e = p ** 2.2;
        return bp.run(N()) * e * 1.2 + lp.run(saw.run(110 * 2 ** (p * 3))) * e * 0.25;
      },
      { gain: g * 0.5 },
    );
  },
  impact(t, g) {
    const s = new Sine();
    sfx.voice(
      t,
      2.2,
      (x) => Math.tanh(s.run(62 * Math.exp(-x / 1.4) + 18) * Math.exp(-x / 0.7) * 1.6),
      { gain: g * 0.8 },
    );
    const lp = new Biquad('lp', 1200, 0.7);
    sfx.voice(t, 0.8, (x) => lp.run(N()) * Math.exp(-x / 0.18), { gain: g * 0.5 });
    verbSend.voice(t, 0.4, (x) => N() * Math.exp(-x / 0.12), { gain: g * 0.9 });
    kick(t, g * 0.8);
  },
  slam(t, g) {
    const s = new Sine();
    sfx.voice(
      t,
      1.2,
      (x) => Math.tanh(s.run(55 * Math.exp(-x / 0.8) + 25) * Math.exp(-x / 0.35) * 1.5),
      { gain: g * 0.6 },
    );
    const lp = new Biquad('lp', 2500, 0.7);
    sfx.voice(t, 0.4, (x) => lp.run(N()) * Math.exp(-x / 0.07), { gain: g * 0.45 });
    verbSend.voice(t, 0.2, (x) => N() * Math.exp(-x / 0.06), { gain: g * 0.5 });
  },
  dart(t, g) {
    const s = new Sine();
    const hp = new Biquad('hp', 3000);
    const r = rng(Math.round(t * 1000));
    const pan = r() - 0.5;
    sfx.voice(
      t - 0.12,
      0.2,
      (x) =>
        s.run(1800 + 2400 * (x / 0.2)) * Math.sin((Math.PI * x) / 0.2) * 0.25 +
        hp.run(N()) * Math.exp(-Math.abs(x - 0.12) / 0.02) * 0.6,
      { gain: g * 0.5, pan },
    );
  },
  shimmer(t, g) {
    [2637, 3520, 4186, 5274].forEach((f, k) => {
      const s = new Sine();
      sfx.voice(
        t + k * 0.04,
        1.0,
        (x) => s.run(f) * Math.exp(-x / 0.35) * (0.6 + 0.4 * Math.sin(x * TAU * 9)),
        { gain: g * 0.08, pan: k % 2 ? 0.5 : -0.5 },
      );
    });
    verbSend.voice(t, 0.3, (x) => Math.sin(x * TAU * 3520) * Math.exp(-x / 0.1), { gain: g * 0.4 });
  },
  pop(t, g) {
    const s = new Sine();
    sfx.voice(t, 0.1, (x) => s.run(500 + 900 * Math.min(1, x / 0.03)) * Math.exp(-x / 0.03), {
      gain: g * 0.4,
    });
  },
  thud(t, g) {
    const s = new Sine();
    const lp = new Biquad('lp', 600);
    sfx.voice(
      t,
      0.3,
      (x) => s.run(95 - 40 * x) * Math.exp(-x / 0.08) + lp.run(N()) * Math.exp(-x / 0.02) * 0.4,
      { gain: g * 0.55 },
    );
  },
  slide(t, g) {
    const lp = new Biquad('lp', 1200);
    sfx.voice(t, 0.35, (x) => lp.run(N()) * Math.sin((Math.PI * x) / 0.35), { gain: g * 0.3 });
  },
  swell(t, g) {
    const bp = new Biquad('bp', 800, 0.9);
    sfx.voice(
      t - 0.4,
      0.7,
      (x, i) => {
        if (i % 32 === 0) bp.set(400 + x * 3000, 0.9);
        return bp.run(N()) * (x / 0.7) ** 2 * (x < 0.62 ? 1 : Math.max(0, 1 - (x - 0.62) / 0.08));
      },
      { gain: g * 0.4 },
    );
  },
  rise(t, g) {
    const s = new Sine();
    sfx.voice(t, 0.35, (x) => s.run(300 + 1600 * x) * Math.sin((Math.PI * x) / 0.35) * 0.6, {
      gain: g * 0.3,
    });
  },
  rewind(t, g) {
    const saw = new Saw();
    const lp = new Biquad('lp', 1800);
    sfx.voice(
      t,
      0.3,
      (x) =>
        lp.run(saw.run(900 * (1 - x * 2.4) + 40 * Math.sin(x * TAU * 30))) *
        Math.sin((Math.PI * x) / 0.3),
      { gain: g * 0.18 },
    );
  },
  success(t, g) {
    bell(t, 88, g * 0.1, -0.2, 0.35, sfx);
    bell(t + 0.09, 93, g * 0.1, 0.2, 0.45, sfx);
  },
  blip(t, g) {
    const s = new Sine();
    sfx.voice(t, 0.06, (x) => (s.run(1250) > 0 ? 0.5 : -0.5) * Math.exp(-x / 0.012), {
      gain: g * 0.18,
    });
  },
  check(t, g) {
    bell(t, 86, g * 0.09, 0, 0.4, sfx);
  },
  suck(t, g) {
    const bp = new Biquad('bp', 3000, 0.9);
    sfx.voice(
      t - 0.1,
      0.55,
      (x, i) => {
        if (i % 32 === 0) bp.set(4000 - x * 6000, 0.9);
        return bp.run(N()) * (x / 0.55) ** 2.5;
      },
      { gain: g * 0.6 },
    );
  },
  reveal(t, g) {
    SFX.whoosh(t + 0.25, g, { dur: 0.9 });
    SFX.shimmer(t + 0.3, g * 0.8);
  },
  flip(t, g) {
    const bp = new Biquad('bp', 2400, 1.2);
    const s = new Sine();
    sfx.voice(
      t,
      0.08,
      (x) => bp.run(N()) * Math.exp(-x / 0.012) + s.run(2200) * Math.exp(-x / 0.006) * 0.3,
      { gain: g * 0.4 },
    );
  },
};

function sfxPass() {
  let seed = 1;
  let count = 0;
  for (const scene of SCENES) {
    for (const [t, type, gain = 1, opts] of scene.sfx) {
      const fn = SFX[type];
      if (!fn) throw new Error(`no sfx "${type}" (scene ${scene.name})`);
      fn(t, gain, opts ?? {}, seed++);
      count++;
    }
  }
  return count;
}

function limiter(out, ceiling, lookahead = 0.004, release = 0.18) {
  const la = Math.round(lookahead * SR);
  const need = new Float32Array(out.n);
  for (let i = 0; i < out.n; i++) {
    const p = Math.max(Math.abs(out.L[i]), Math.abs(out.R[i]));
    need[i] = p > ceiling ? ceiling / p : 1;
  }
  const win = new Float32Array(out.n);
  const dq = [];
  for (let i = out.n - 1; i >= 0; i--) {
    while (dq.length && need[dq[dq.length - 1]] >= need[i]) dq.pop();
    dq.push(i);
    while (dq[0] > i + la) dq.shift();
    win[i] = need[dq[0]];
  }
  const att = 1 - Math.exp(-1 / (la / 3));
  const rel = 1 - Math.exp(-1 / (release * SR));
  let g = 1;
  let peak = 0;
  for (let i = 0; i < out.n; i++) {
    const target = win[i];
    g += (target - g) * (target < g ? att : rel);
    out.L[i] = Math.max(-ceiling, Math.min(ceiling, out.L[i] * g));
    out.R[i] = Math.max(-ceiling, Math.min(ceiling, out.R[i] * g));
    peak = Math.max(peak, Math.abs(out.L[i]), Math.abs(out.R[i]));
  }
  return peak;
}

// Fade the tail, set loudness from RMS, then look-ahead limit to -1 dBFS.
function master(out) {
  let sum = 0;
  for (let i = 0; i < out.n; i++) {
    const t = i / SR;
    const fade = t > DURATION - 1.2 ? Math.max(0, (DURATION - t) / 1.2) : 1;
    const g = fade * Math.min(1, t / 0.05);
    out.L[i] *= g;
    out.R[i] *= g;
    sum += out.L[i] ** 2 + out.R[i] ** 2;
  }
  const rms = Math.sqrt(sum / (out.n * 2));
  const hpL = new Biquad('hp', 25, 0.7);
  const hpR = new Biquad('hp', 25, 0.7);
  for (let i = 0; i < out.n; i++) {
    out.L[i] = hpL.run(out.L[i]);
    out.R[i] = hpR.run(out.R[i]);
  }
  const k = db(-15) / rms;
  for (let i = 0; i < out.n; i++) {
    out.L[i] = Math.tanh(out.L[i] * k * 0.9) / 0.9;
    out.R[i] = Math.tanh(out.R[i] * k * 0.9) / 0.9;
  }
  const peak = limiter(out, db(-1));
  let sum2 = 0;
  for (let i = 0; i < out.n; i++) sum2 += out.L[i] ** 2 + out.R[i] ** 2;
  return { peak, rms: Math.sqrt(sum2 / (out.n * 2)) };
}

const started = Date.now();
arrange();
kickTimes.sort((a, b) => a - b);
bass.apply((t) => duck(t, 0.75));
pads.apply((t) => duck(t, 0.45));
arps.apply((t) => duck(t, 0.35));
const cues = sfxPass();

const music = new Bus(LEN);
music.mix(drums, db(-3));
music.mix(bass, db(-5));
music.mix(pads, db(-4));
const delayed = pingPong(arps, { time: BEAT * 0.75, feedback: 0.38 });
music.mix(arps, db(-6));
music.mix(delayed, db(-12));
verbSend.mix(pads, 0.5);
verbSend.mix(arps, 0.7);
verbSend.mix(sfx, 0.25);
const wet = reverb(verbSend, { room: 0.88, damp: 0.3 });

const out = new Bus(LEN);
out.mix(music, 1);
out.mix(sfx, db(-2));
out.mix(wet, db(-7));
const stats = master(out);

const file = path.join(root, 'out/soundtrack.wav');
fs.mkdirSync(path.dirname(file), { recursive: true });
writeWav(file, out, fs);
console.log(
  `soundtrack: ${cues} cues, ${LEN.toFixed(1)}s, rms ${(20 * Math.log10(stats.rms)).toFixed(1)} dBFS, ${((Date.now() - started) / 1000).toFixed(1)}s → ${path.relative(process.cwd(), file)}`,
);
