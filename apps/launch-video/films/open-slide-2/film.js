import { defineFilm } from '#lib/film.js';
import editor from './scenes/editor.js';
import finale from './scenes/finale.js';
import fonts from './scenes/fonts.js';
import hook from './scenes/hook.js';
import logo from './scenes/logo.js';
import pptx from './scenes/pptx.js';
import stack from './scenes/stack.js';
import ui from './scenes/ui.js';
import { SPECIMENS } from './specimens.js';
import { DURATION, HITS, TRANSITIONS } from './timeline.js';

export default defineFilm({
  title: 'open-slide 2.0 launch',
  duration: DURATION,
  bpm: 120,
  poster: 8.4,
  fonts: SPECIMENS,
  scenes: [hook, logo, editor, pptx, ui, fonts, stack, finale],
  transitions: TRANSITIONS,
  hits: HITS,
});
