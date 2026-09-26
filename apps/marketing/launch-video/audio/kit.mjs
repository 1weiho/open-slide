import { beatGrid } from '../src/lib/film.js';
import { Biquad, Bus, mtof, rng, Saw, Sine } from './dsp.mjs';

// The instruments a film's score plays. Voices render into the buses as soon
// as they're called, so call order (and the shared noise stream) is part of
// the sound: reordering calls changes the mix.
export function createKit({ duration, bpm }) {
  const LEN = duration + 0.5;
  const { BEAT, BAR } = beatGrid(bpm);
  const noise = rng(7);
  const N = () => noise() * 2 - 1;

  const drums = new Bus(LEN);
  const bass = new Bus(LEN);
  const pads = new Bus(LEN);
  const arps = new Bus(LEN);
  const sfx = new Bus(LEN);
  const verbSend = new Bus(LEN);

  const beats = (from, to, step = BEAT) => {
    const out = [];
    for (let t = from; t < to - 1e-6; t += step) out.push(Math.round(t * 1000) / 1000);
    return out;
  };

  // `bars` is a space-separated chord name per bar.
  const progression = (chords, bars) => {
    const names = bars.trim().split(/\s+/);
    return (t) => chords[names[Math.min(names.length - 1, Math.floor(t / BAR))]];
  };

  // Sidechain: kicks played with `sidechain: true` duck the tonal buses.
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

  function kick(t, gain = 1, { tone = 1, sidechain = false } = {}) {
    if (sidechain) kickTimes.push(t);
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

  // The house groove: four-on-the-floor kick (ducking the tonal buses),
  // claps on 2 and 4, hats, bass, optional arp, and a pad per bar.
  function groove(
    from,
    to,
    {
      chordAt,
      hats = '16',
      clapOn = true,
      bassMode = 'off',
      padGain = 0.7,
      cutoff = 2200,
      arp = false,
      openHats = false,
      arpBright = 1,
    },
  ) {
    for (const b of beats(from, to)) {
      kick(b, 0.95, { sidechain: true });
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
  }

  return {
    LEN,
    BEAT,
    BAR,
    buses: { drums, bass, pads, arps, sfx, verbSend },
    noise,
    N,
    beats,
    progression,
    duck,
    kickTimes,
    kick,
    clap,
    hat,
    snare,
    crash,
    reverseCymbal,
    snareRoll,
    bassNote,
    padChord,
    pluck,
    bell,
    groove,
  };
}
