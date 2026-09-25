export const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => clamp((v - a) / (b - a));
export const remap = (v, a, b, c, d) => lerp(c, d, invLerp(a, b, v));

export const linear = (t) => t;
export const inQuad = (t) => t * t;
export const outQuad = (t) => 1 - (1 - t) * (1 - t);
export const inOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
export const inCubic = (t) => t * t * t;
export const outCubic = (t) => 1 - (1 - t) ** 3;
export const inOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const inQuart = (t) => t ** 4;
export const outQuart = (t) => 1 - (1 - t) ** 4;
export const inOutQuart = (t) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2);
export const outQuint = (t) => 1 - (1 - t) ** 5;
export const inOutQuint = (t) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2);
export const inExpo = (t) => (t <= 0 ? 0 : 2 ** (10 * t - 10));
export const outExpo = (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));
export const inOutExpo = (t) => {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2;
};
export const outCirc = (t) => Math.sqrt(1 - (t - 1) ** 2);
export const inOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
export const outSine = (t) => Math.sin((t * Math.PI) / 2);

export const outBack =
  (s = 1.70158) =>
  (t) =>
    1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2;
export const inBack =
  (s = 1.70158) =>
  (t) =>
    (s + 1) * t ** 3 - s * t * t;

export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (u) => ((ax * u + bx) * u + cx) * u;
  const sy = (u) => ((ay * u + by) * u + cy) * u;
  const dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let u = x;
    for (let i = 0; i < 8; i++) {
      const err = sx(u) - x;
      if (Math.abs(err) < 1e-6) return sy(u);
      const d = dx(u);
      if (Math.abs(d) < 1e-6) break;
      u -= err / d;
    }
    let lo = 0;
    let hi = 1;
    u = x;
    for (let i = 0; i < 30; i++) {
      const v = sx(u);
      if (Math.abs(v - x) < 1e-6) break;
      if (x > v) lo = u;
      else hi = u;
      u = (lo + hi) / 2;
    }
    return sy(u);
  };
}

// open-slide's house curve (--ease-swift in packages/core/src/app/styles.css).
export const swift = bezier(0.22, 1, 0.36, 1);
export const snap = bezier(0.16, 1, 0.3, 1);
export const glide = bezier(0.65, 0, 0.35, 1);
export const whip = bezier(0.85, 0, 0.15, 1);
export const anticipate = bezier(0.68, -0.35, 0.32, 1.25);

// Closed-form damped spring from 0 to 1, where t is seconds since release.
export function spring(t, { stiffness = 180, damping = 18, mass = 1, velocity = 0 } = {}) {
  if (t <= 0) return 0;
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const v0 = -velocity;
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    const env = Math.exp(-zeta * w0 * t);
    return 1 - env * (Math.cos(wd * t) + ((zeta * w0 - v0) / wd) * Math.sin(wd * t));
  }
  const env = Math.exp(-w0 * t);
  return 1 - env * (1 + (w0 - v0) * t);
}
