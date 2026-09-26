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

export function hash(n) {
  let x = Math.imul(n | 0, 0x9e3779b1);
  x ^= x >>> 16;
  x = Math.imul(x, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

export const hash2 = (a, b) => hash(Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663));

// Smooth 1D value noise in [-1, 1].
export function noise1(x, seed = 0) {
  const i = Math.floor(x);
  const fr = x - i;
  const u = fr * fr * (3 - 2 * fr);
  const a = hash2(i, seed) * 2 - 1;
  const b = hash2(i + 1, seed) * 2 - 1;
  return a + (b - a) * u;
}
