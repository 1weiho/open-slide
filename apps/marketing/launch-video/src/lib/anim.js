import { clamp, lerp, linear, swift } from './ease.js';

export const prog = (t, start, dur, ease = linear) => ease(clamp((t - start) / dur));

export const tween = (t, start, dur, from, to, ease = swift) =>
  lerp(from, to, prog(t, start, dur, ease));

const mix = (a, b, p) => {
  if (Array.isArray(a)) return a.map((v, i) => lerp(v, b[i], p));
  return lerp(a, b, p);
};

// Piecewise keyframes: [[time, value, easeIntoThisKey?], ...] sorted by time.
export function keys(t, frames) {
  if (t <= frames[0][0]) return frames[0][1];
  for (let i = 1; i < frames.length; i++) {
    const [t1, v1, ease = swift] = frames[i];
    if (t < t1) {
      const [t0, v0] = frames[i - 1];
      const p = t1 === t0 ? 1 : ease((t - t0) / (t1 - t0));
      return mix(v0, v1, p);
    }
  }
  return frames[frames.length - 1][1];
}

// 0 → 1 → 0 envelope: rises over `attack`, holds, falls over `release`.
export function envelope(t, start, end, attack = 0.3, release = 0.3, ease = swift) {
  if (t <= start || t >= end) return 0;
  const a = ease(clamp((t - start) / attack));
  const r = ease(clamp((end - t) / release));
  return Math.min(a, r);
}

export const inRange = (t, a, b) => t >= a && t < b;

export const stagger = (i, gap, base = 0) => base + i * gap;

// Decaying impulse used for hits: 1 at `at`, falling off with time constant `tau`.
export const impulse = (t, at, tau = 0.15) => (t < at ? 0 : Math.exp(-(t - at) / tau));

export function steps(t, start, interval, count) {
  if (t < start) return -1;
  return Math.min(count - 1, Math.floor((t - start) / interval));
}

// Evaluate a path of [time, x, y, ease?] waypoints.
export function path(t, pts) {
  return keys(
    t,
    pts.map(([time, x, y, ease]) => [time, [x, y], ease]),
  );
}

export function arc(t, start, dur, from, to, bend = 0.25, ease = swift) {
  const p = prog(t, start, dur, ease);
  const mx = (from[0] + to[0]) / 2;
  const my = (from[1] + to[1]) / 2;
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const cx = mx - dy * bend;
  const cy = my + dx * bend;
  const u = 1 - p;
  return [
    u * u * from[0] + 2 * u * p * cx + p * p * to[0],
    u * u * from[1] + 2 * u * p * cy + p * p * to[1],
  ];
}

export const osc = (t, freq = 1, amp = 1, phase = 0) =>
  Math.sin((t * freq + phase) * Math.PI * 2) * amp;

export const snapTo = (v, grid) => Math.round(v / grid) * grid;

export { clamp, lerp };
