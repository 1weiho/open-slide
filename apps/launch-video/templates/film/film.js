import { defineFilm } from '#lib/film.js';
import { FEATURE } from './copy.js';
import feature from './scenes/feature.js';
import intro from './scenes/intro.js';
import outro from './scenes/outro.js';
import { DURATION, HITS, TRANSITIONS } from './timeline.js';

export default defineFilm({
  title: `${FEATURE} launch`,
  duration: DURATION,
  bpm: 120,
  poster: 2.6,
  scenes: [intro, feature, outro],
  transitions: TRANSITIONS,
  hits: HITS,
});
