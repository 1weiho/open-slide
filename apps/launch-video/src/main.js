import { createEngine } from './engine.js';
import { h } from './lib/dom.js';
import { SCENES } from './scenes/index.js';
import { FONT_LOADS, FPS, H, W } from './theme.js';
import { DURATION } from './timeline.js';

const params = new URLSearchParams(location.search);
const isRender = params.has('render');
if (isRender) document.documentElement.classList.add('render');

async function loadFonts() {
  const link = document.getElementById('fonts');
  const loaded = new Promise((resolve) => {
    link.onload = resolve;
    link.onerror = resolve;
  });
  link.href = './out/fonts/fonts.css';
  await loaded;
  await Promise.all(FONT_LOADS.map((f) => document.fonts.load(f).catch(() => null)));
  await document.fonts.ready;
  const missing = FONT_LOADS.filter((f) => !document.fonts.check(f));
  if (missing.length) console.warn(`fonts missing: ${missing.join(', ')}`);
}

async function decodeImages(root) {
  const imgs = [...root.querySelectorAll('img')];
  await Promise.all(imgs.map((img) => img.decode().catch(() => null)));
}

function fitPreview(stage) {
  const fit = () => {
    const s = Math.min(innerWidth / W, (innerHeight - 56) / H);
    stage.style.transform = `scale(${s})`;
    stage.style.marginBottom = '44px';
  };
  addEventListener('resize', fit);
  fit();
}

function mountScrubber(engine) {
  const range = h('input', { type: 'range', min: 0, max: DURATION, step: 1 / FPS, value: 0 });
  const label = h('span', { text: '0.00s' });
  const play = h('button', { text: 'Play' });
  const audio = h('audio', { src: './out/soundtrack.wav', preload: 'auto' });
  document.body.append(h('div', { id: 'scrubber' }, play, range, label, audio));

  let t = Number(params.get('t') ?? 0);
  let playing = false;
  let last = 0;
  const show = () => {
    engine.seek(t);
    range.value = String(t);
    label.textContent = `${t.toFixed(2)}s`;
    history.replaceState(null, '', `?t=${t.toFixed(2)}`);
  };
  const loop = (now) => {
    if (!playing) return;
    t = audio.readyState >= 2 && !audio.paused ? audio.currentTime : t + (now - last) / 1000;
    last = now;
    if (t >= DURATION) {
      t = 0;
      audio.currentTime = 0;
    }
    show();
    requestAnimationFrame(loop);
  };
  play.onclick = () => {
    playing = !playing;
    play.textContent = playing ? 'Pause' : 'Play';
    if (playing) {
      audio.currentTime = t;
      audio.play().catch(() => null);
      last = performance.now();
      requestAnimationFrame(loop);
    } else audio.pause();
  };
  range.oninput = () => {
    t = Number(range.value);
    audio.currentTime = t;
    show();
  };
  addEventListener('keydown', (e) => {
    if (e.key === ' ') play.onclick();
    if (e.key === 'ArrowRight') t = Math.min(DURATION, t + (e.shiftKey ? 1 : 1 / FPS));
    if (e.key === 'ArrowLeft') t = Math.max(0, t - (e.shiftKey ? 1 : 1 / FPS));
    if (e.key.startsWith('Arrow')) show();
  });
  show();
}

async function boot() {
  const stage = document.getElementById('stage');
  await loadFonts();
  const engine = createEngine(stage, SCENES);
  await decodeImages(stage);
  window.__duration = DURATION;
  window.__seek = (t) => engine.seek(t);
  if (isRender) {
    engine.seek(0);
  } else {
    fitPreview(stage);
    mountScrubber(engine);
  }
  window.__ready = true;
}

boot();
