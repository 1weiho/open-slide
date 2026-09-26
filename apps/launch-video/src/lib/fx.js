import { prog } from './anim.js';
import { hash2 } from './rand.js';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/{}[]=+*#%&';

// Characters resolve left to right; unresolved ones flicker through glyphs.
export function scramble(final, t, start, dur, seed = 1, rate = 24) {
  if (t < start) return '';
  const p = prog(t, start, dur);
  const n = final.length;
  const revealed = Math.floor(p * (n + 4));
  const tick = Math.floor(t * rate);
  let out = '';
  for (let i = 0; i < n; i++) {
    const ch = final[i];
    if (i < revealed - 4 || p >= 1) out += ch;
    else if (i < revealed) {
      out += ch === ' ' ? ' ' : GLYPHS[Math.floor(hash2(tick + i * 7, seed) * GLYPHS.length)];
    } else break;
  }
  return out;
}

export function typeOn(final, t, start, cps = 30) {
  if (t < start) return '';
  const n = Math.floor((t - start) * cps);
  return final.slice(0, Math.max(0, n));
}

export const caretOn = (t, rate = 1.1) => Math.floor(t * rate * 2) % 2 === 0;

export function formatInt(n, width = 0) {
  const s = String(Math.round(n));
  return width ? s.padStart(width, '0') : s;
}

export const withCommas = (n) => Math.round(n).toLocaleString('en-US');
