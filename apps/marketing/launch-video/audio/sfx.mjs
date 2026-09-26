import { Biquad, rng, Saw, Sine, TAU } from './dsp.mjs';

// Sound design: one generator per cue type used in the scenes' sfx lists,
// called as SFX[type](t, gain, opts, seed).
export function createSfx({ buses: { sfx, verbSend }, N, bell, kick }) {
  const SFX = {
    tick(t, g) {
      const s = new Sine();
      sfx.voice(t, 0.05, (x) => s.run(2600 - 900 * x * 20) * Math.exp(-x / 0.01), {
        gain: g * 0.35,
      });
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
    card(t, g) {
      SFX.whoosh(t - 0.12, g * 0.9, { dur: 0.8 });
      const s = new Sine();
      const lp = new Biquad('lp', 500);
      sfx.voice(
        t + 0.36,
        0.35,
        (x) => s.run(78 - 30 * x) * Math.exp(-x / 0.1) + lp.run(N()) * Math.exp(-x / 0.03) * 0.3,
        { gain: g * 0.45 },
      );
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
      verbSend.voice(t, 0.3, (x) => Math.sin(x * TAU * 3520) * Math.exp(-x / 0.1), {
        gain: g * 0.4,
      });
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
  return SFX;
}
