import { createEngine } from './engine.js';
import { h } from './lib/dom.js';
import { FPS, fontLoads, H, W } from './theme.js';

const params = new URLSearchParams(location.search);
const isRender = params.has('render');
if (isRender) document.documentElement.classList.add('render');

// `?film=<id>` picks the film; without it the first one in films/ plays.
async function loadFilm() {
  let id = params.get('film');
  if (!id) {
    const films = await fetch('/api/films')
      .then((r) => r.json())
      .catch(() => []);
    id = films[0];
  }
  const mod = await import(`../films/${id}/film.js`);
  return { ...mod.default, id };
}

async function loadFonts(film) {
  const loads = fontLoads(film.fonts);
  const link = document.getElementById('fonts');
  const loaded = new Promise((resolve) => {
    link.onload = resolve;
    link.onerror = resolve;
  });
  link.href = `./out/fonts/${film.id}/fonts.css`;
  await loaded;
  await Promise.all(loads.map((f) => document.fonts.load(f).catch(() => null)));
  await document.fonts.ready;
  const missing = loads.filter((f) => !document.fonts.check(f));
  if (missing.length) console.warn(`fonts missing: ${missing.join(', ')}`);
}

async function decodeImages(root) {
  const imgs = [...root.querySelectorAll('img')];
  await Promise.all(imgs.map((img) => img.decode().catch(() => null)));
}

function fitPreview(stage) {
  Object.assign(stage.style, { position: 'absolute', left: '50%', top: 'calc(50% - 22px)' });
  const fit = () => {
    const s = Math.min(innerWidth / W, (innerHeight - 56) / H);
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  };
  addEventListener('resize', fit);
  fit();
}

function mountScrubber(engine, film) {
  const range = h('input', { type: 'range', min: 0, max: film.duration, step: 1 / FPS, value: 0 });
  const label = h('span', { text: '0.00s' });
  const play = h('button', { text: 'Play' });
  const audio = h('audio', { src: `./out/${film.id}/soundtrack.wav`, preload: 'auto' });
  document.body.append(h('div', { id: 'scrubber' }, play, range, label, audio));

  let t = Number(params.get('t') ?? 0);
  let playing = false;
  let last = 0;
  const show = () => {
    engine.seek(t);
    range.value = String(t);
    label.textContent = `${t.toFixed(2)}s`;
    history.replaceState(null, '', `?film=${film.id}&t=${t.toFixed(2)}`);
  };
  const loop = (now) => {
    if (!playing) return;
    t = audio.readyState >= 2 && !audio.paused ? audio.currentTime : t + (now - last) / 1000;
    last = now;
    if (t >= film.duration) {
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
    if (e.key === 'ArrowRight') t = Math.min(film.duration, t + (e.shiftKey ? 1 : 1 / FPS));
    if (e.key === 'ArrowLeft') t = Math.max(0, t - (e.shiftKey ? 1 : 1 / FPS));
    if (e.key.startsWith('Arrow')) show();
  });
  show();
}

async function boot() {
  const stage = document.getElementById('stage');
  const film = await loadFilm();
  document.title = film.title;
  await loadFonts(film);
  const engine = createEngine(stage, film);
  await decodeImages(stage);
  window.__duration = film.duration;
  window.__seek = (t) => engine.seek(t);
  if (isRender) {
    engine.seek(0);
  } else {
    fitPreview(stage);
    mountScrubber(engine, film);
  }
  window.__ready = true;
}

boot();
