import { beatGrid, sequence } from '#lib/film.js';

export const DURATION = 20;
export const { BEAT, BAR } = beatGrid(120);

export const { spans: SPANS, transitions: TRANSITIONS } = sequence(DURATION, [
  { name: 'intro', at: 0 },
  { name: 'feature', at: 4, enter: 'card' },
  { name: 'outro', at: 14, enter: 'card' },
]);

export const HITS = [
  { t: 2, amount: 0.8, flash: 0.6 },
  { t: 16, amount: 1, flash: 0.5 },
];
