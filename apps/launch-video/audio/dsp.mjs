export const SR = 48000;
export const TAU = Math.PI * 2;

export const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
export const db = (d) => 10 ** (d / 20);

export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Bus {
  constructor(seconds) {
    this.n = Math.ceil(seconds * SR);
    this.L = new Float32Array(this.n);
    this.R = new Float32Array(this.n);
  }

  // Renders fn(localTime, i) → mono sample (or [l, r]) from t0 for dur seconds.
  voice(t0, dur, fn, { gain = 1, pan = 0 } = {}) {
    const start = Math.max(0, Math.round(t0 * SR));
    const end = Math.min(this.n, Math.round((t0 + dur) * SR));
    const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
    const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
    for (let i = start; i < end; i++) {
      const v = fn((i - start) / SR, i);
      if (typeof v === 'number') {
        this.L[i] += v * gl;
        this.R[i] += v * gr;
      } else {
        this.L[i] += v[0] * gain;
        this.R[i] += v[1] * gain;
      }
    }
  }

  mix(other, gain = 1) {
    for (let i = 0; i < this.n; i++) {
      this.L[i] += other.L[i] * gain;
      this.R[i] += other.R[i] * gain;
    }
  }

  apply(fnGain) {
    for (let i = 0; i < this.n; i++) {
      const g = fnGain(i / SR);
      this.L[i] *= g;
      this.R[i] *= g;
    }
  }
}

// RBJ biquad; call set() whenever parameters change.
export class Biquad {
  constructor(type = 'lp', f = 1000, q = Math.SQRT1_2) {
    this.type = type;
    this.x1 = this.x2 = this.y1 = this.y2 = 0;
    this.set(f, q);
  }

  set(f, q = this.q) {
    this.q = q;
    const w = (TAU * Math.min(f, SR * 0.45)) / SR;
    const cw = Math.cos(w);
    const alpha = Math.sin(w) / (2 * q);
    let b0;
    let b1;
    let b2;
    if (this.type === 'lp') {
      b0 = (1 - cw) / 2;
      b1 = 1 - cw;
      b2 = (1 - cw) / 2;
    } else if (this.type === 'hp') {
      b0 = (1 + cw) / 2;
      b1 = -(1 + cw);
      b2 = (1 + cw) / 2;
    } else {
      b0 = alpha;
      b1 = 0;
      b2 = -alpha;
    }
    const a0 = 1 + alpha;
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = (-2 * cw) / a0;
    this.a2 = (1 - alpha) / a0;
  }

  run(x) {
    const y =
      this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

export class Saw {
  constructor(phase = 0) {
    this.p = phase;
  }

  // PolyBLEP band-limited sawtooth.
  run(f) {
    const dt = f / SR;
    this.p += dt;
    if (this.p >= 1) this.p -= 1;
    let v = 2 * this.p - 1;
    const t = this.p;
    if (t < dt) {
      const x = t / dt;
      v -= x + x - x * x - 1;
    } else if (t > 1 - dt) {
      const x = (t - 1) / dt;
      v -= x * x + x + x + 1;
    }
    return v;
  }
}

export class Sine {
  constructor(phase = 0) {
    this.p = phase;
  }

  run(f) {
    this.p += f / SR;
    if (this.p >= 1) this.p -= 1;
    return Math.sin(this.p * TAU);
  }
}

class Comb {
  constructor(size, feedback, damp) {
    this.buf = new Float32Array(size);
    this.i = 0;
    this.fb = feedback;
    this.damp = damp;
    this.store = 0;
  }

  run(x) {
    const out = this.buf[this.i];
    this.store = out * (1 - this.damp) + this.store * this.damp;
    this.buf[this.i] = x + this.store * this.fb;
    this.i = (this.i + 1) % this.buf.length;
    return out;
  }
}

class Allpass {
  constructor(size) {
    this.buf = new Float32Array(size);
    this.i = 0;
  }

  run(x) {
    const b = this.buf[this.i];
    const out = -x + b;
    this.buf[this.i] = x + b * 0.5;
    this.i = (this.i + 1) % this.buf.length;
    return out;
  }
}

// Freeverb-style stereo reverb, rendered offline from a send bus.
export function reverb(bus, { room = 0.86, damp = 0.35, width = 1, preDelay = 0.02 } = {}) {
  const k = SR / 44100;
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const aps = [556, 441, 341, 225];
  const spread = 23;
  const mk = (off) => ({
    c: combs.map((s) => new Comb(Math.round((s + off) * k), room, damp)),
    a: aps.map((s) => new Allpass(Math.round((s + off) * k))),
  });
  const l = mk(0);
  const r = mk(spread);
  const out = new Bus(bus.n / SR);
  const pd = Math.round(preDelay * SR);
  for (let i = 0; i < bus.n; i++) {
    const j = i - pd;
    const x = j >= 0 ? (bus.L[j] + bus.R[j]) * 0.015 : 0;
    let yl = 0;
    let yr = 0;
    for (const c of l.c) yl += c.run(x);
    for (const c of r.c) yr += c.run(x);
    for (const a of l.a) yl = a.run(yl);
    for (const a of r.a) yr = a.run(yr);
    const w1 = width / 2 + 0.5;
    const w2 = (1 - width) / 2;
    out.L[i] = yl * w1 + yr * w2;
    out.R[i] = yr * w1 + yl * w2;
  }
  return out;
}

export function pingPong(bus, { time = 0.375, feedback = 0.35, tone = 3200 } = {}) {
  const d = Math.round(time * SR);
  const out = new Bus(bus.n / SR);
  const lpL = new Biquad('lp', tone);
  const lpR = new Biquad('lp', tone);
  for (let i = 0; i < bus.n; i++) {
    const inL = bus.L[i];
    const inR = bus.R[i];
    const dl = i >= d ? out.L[i - d] : 0;
    const dr = i >= d ? out.R[i - d] : 0;
    out.L[i] = lpL.run((inL + inR) * 0.5 + dr * feedback);
    out.R[i] = lpR.run(dl * feedback);
  }
  return out;
}

export function writeWav(file, bus, fs) {
  const n = bus.n;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 4, 40);
  const r = rng(99);
  for (let i = 0; i < n; i++) {
    const dither = (r() - r()) / 32768;
    const l = Math.max(-1, Math.min(1, bus.L[i] + dither));
    const rr = Math.max(-1, Math.min(1, bus.R[i] + dither));
    buf.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(rr * 32767), 46 + i * 4);
  }
  fs.writeFileSync(file, buf);
}
