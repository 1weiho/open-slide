// Chapter hand-offs: the next scene rises as a rounded card over the current
// one, which recedes behind it. The card lands fully at `t + CARD / 2`.
export const CARD = 0.8;

export function defineFilm({
  title,
  duration,
  bpm = 120,
  poster = 0,
  fonts = [],
  scenes,
  transitions = [],
  hits = [],
  card = CARD,
}) {
  return { title, duration, bpm, poster, fonts, scenes, transitions, hits, card };
}

export function beatGrid(bpm) {
  const BEAT = 60 / bpm;
  return { BEAT, BAR: BEAT * 4 };
}

// Turns a chapter list into scene spans and card transitions. A chapter
// starts at `at` with a hard cut unless it enters as a `card` (overlapping
// the previous scene by CARD / 2 on each side) or sets its own symmetric
// `overlap` in seconds.
export function sequence(duration, chapters, { card = CARD } = {}) {
  const lead = (c) => (c.enter === 'card' ? card / 2 : (c.overlap ?? 0));
  const spans = {};
  const transitions = [];
  chapters.forEach((c, i) => {
    const next = chapters[i + 1];
    spans[c.name] = [c.at - lead(c), next ? next.at + lead(next) : duration];
    if (i > 0 && c.enter === 'card') {
      transitions.push({ t: c.at, from: chapters[i - 1].name, to: c.name });
    }
  });
  return { spans, transitions };
}
