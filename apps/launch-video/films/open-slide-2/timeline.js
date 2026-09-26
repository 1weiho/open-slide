import { sequence } from '#lib/film.js';

export const DURATION = 78;

export const { spans: SPANS, transitions: TRANSITIONS } = sequence(DURATION, [
  { name: 'hook', at: 0 },
  { name: 'logo', at: 6.0, overlap: 0.4 },
  { name: 'editor', at: 10.2, enter: 'card' },
  { name: 'pptx', at: 28.25, enter: 'card' },
  { name: 'ui', at: 42.25, enter: 'card' },
  { name: 'fonts', at: 54.2, enter: 'card' },
  { name: 'stack', at: 60.0 },
  { name: 'finale', at: 66.15, enter: 'card' },
]);

// Big downbeats: drive camera shake + flash in the post layer and the impact
// voices in the soundtrack.
export const HITS = [
  { t: 8.0, amount: 1, flash: 1 },
  { t: 30.0, amount: 0.55 },
  { t: 60.0, amount: 0.8 },
  { t: 60.5, amount: 0.6 },
  { t: 61.0, amount: 0.6 },
  { t: 61.5, amount: 0.8 },
  { t: 70.0, amount: 1, flash: 0.8 },
];
