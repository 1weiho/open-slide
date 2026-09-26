import { arc } from './anim.js';
import { clamp, swift } from './ease.js';

// A cursor route: `start` position, then moves that each end at `at`.
// A move is { at, dur, to: [x, y] | (T) => [x, y], bend?, ease? } or a
// driven segment { from, until, fn: (T) => [x, y] } that follows an object.
export function route(start, moves) {
  return (T) => {
    let pos = start;
    for (const m of moves) {
      if (m.fn) {
        if (T < m.from) break;
        pos = m.fn(Math.min(T, m.until));
        continue;
      }
      const t0 = m.at - m.dur;
      const to = typeof m.to === 'function' ? m.to(m.at) : m.to;
      if (T < t0) break;
      if (T >= m.at) {
        pos = to;
        continue;
      }
      const p = clamp((T - t0) / m.dur);
      const e = m.ease ?? swift;
      pos = arc(p, 0, 1, pos, to, m.bend ?? 0.12, e);
      break;
    }
    return pos;
  };
}
