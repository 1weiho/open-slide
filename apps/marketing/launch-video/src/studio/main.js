import { h } from '../lib/dom.js';
import { icon } from '../ui/icons.js';

const POLL_MS = 2500;
const renderCmd = (id) => `pnpm --filter launch-video render ${id}`;

const state = { films: [], film: null, renders: [], active: null, signature: '' };
const cards = new Map();

const pad = (n) => String(n).padStart(2, '0');
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const fmtTime = (s) => `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`;
const fmtSize = (b) => (b >= 1e9 ? `${(b / 1e9).toFixed(2)} GB` : `${(b / 1e6).toFixed(1)} MB`);
const fileName = (id) => id.split('/').pop();
const resLabel = (height) => (height >= 2160 ? '4K' : height >= 1440 ? '1440p' : `${height}p`);
const isDraft = (r) => r.meta?.samples === 1 || /draft/.test(r.id);
const displayName = (r) => r.meta?.name ?? fileName(r.id).replace(/\.mp4$/, '');

// Poster at the film's `poster` second; partial renders (--from/--to) fall back to their midpoint.
function posterTime(r, duration = r.meta?.duration) {
  const t = (state.film?.poster ?? 0) - (r.meta?.from ?? 0);
  if (duration && (t < 0 || t > duration)) return duration / 2;
  return t;
}

function ago(ms) {
  const s = (Date.now() - ms) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return new Date(ms).toLocaleDateString();
}

function specs(r, video) {
  const m = r.meta ?? {};
  const width = m.width ?? video?.videoWidth;
  const height = m.height ?? video?.videoHeight;
  const duration = m.duration ?? (video?.duration || null);
  return { width, height, duration, fps: m.fps, samples: m.samples, git: m.git };
}

async function copy(text, el, label) {
  await navigator.clipboard?.writeText(text).catch(() => null);
  const prev = el.lastChild.textContent;
  el.lastChild.textContent = label;
  setTimeout(() => {
    el.lastChild.textContent = prev;
  }, 1200);
}

const navRenders = h(
  'button',
  { class: 'nav-row', 'data-view': 'renders' },
  icon('film', { size: 16 }),
  'Renders',
  h('span', { class: 'count mono', text: '00' }),
);
const navComposition = h(
  'button',
  { class: 'nav-row', 'data-view': 'composition' },
  icon('clapperboard', { size: 16 }),
  'Composition',
);
navRenders.onclick = () => {
  location.hash = `#/${state.film.id}/renders`;
};
navComposition.onclick = () => {
  location.hash = `#/${state.film.id}/composition`;
};
const filmList = h('div', { class: 'film-list' });

const side = h(
  'aside',
  { class: 'side' },
  h(
    'div',
    { class: 'brand' },
    h('img', { src: '/@repo/apps/web/public/open-slide.png', alt: '' }),
    h('b', { text: 'open-slide' }),
    h('span', { text: 'Films' }),
  ),
  navRenders,
  navComposition,
  h('div', { class: 'eyebrow', text: 'Films' }),
  filmList,
  h(
    'div',
    { class: 'side-foot' },
    h('span', { class: 'live-dot' }),
    h('span', { class: 'mono', text: 'watching out/' }),
  ),
);

const count = h('span', { class: 'count mono' });
const heading = h('h1');
const cmdText = h('span');
const cmd = h(
  'button',
  { class: 'cmd', title: 'Copy render command' },
  h('b', { text: '$' }),
  cmdText,
);
cmd.onclick = () => copy(renderCmd(state.film.id), cmd, 'Copied to clipboard');
const grid = h('div', { class: 'grid' });
const emptyCmd = h('code', { class: 'mono' });
const empty = h(
  'div',
  { class: 'empty', hidden: true },
  icon('film', { size: 28, stroke: 1.5 }),
  h('h2', { text: 'No renders yet' }),
  h('div', {}, 'Every render lands here with its settings. Start one with'),
  emptyCmd,
);
const rendersView = h(
  'section',
  { class: 'view renders' },
  h('div', { class: 'head' }, icon('film', { size: 18 }), heading, count, cmd),
  empty,
  grid,
);

let iframe = null;
let iframeFilm = null;
const compositionView = h('section', { class: 'view composition', hidden: true });

const main = h('main', { class: 'main' }, rendersView, compositionView);
document.getElementById('app').append(h('div', { class: 'shell' }, side, main));

function makeCard(r) {
  const video = h('video', { preload: 'metadata', playsinline: true });
  video.muted = true;
  video.src = `${r.url}#t=${posterTime(r).toFixed(2)}`;
  const badges = h('div', { class: 'badges' });
  const timecode = h('div', { class: 'timecode mono' });
  const bar = h('i');
  const thumb = h(
    'div',
    { class: 'thumb' },
    video,
    badges,
    timecode,
    h('div', { class: 'scrub' }, bar),
  );
  const title = h('span');
  const when = h('span', { class: 'ago' });
  const meta = h('div', { class: 'meta mono' });
  const el = h(
    'article',
    { class: 'render' },
    thumb,
    h('div', { class: 'info' }, h('div', { class: 'title' }, title, when), meta),
  );

  let pending = null;
  const seek = (t) => {
    if (video.seeking) pending = t;
    else video.currentTime = t;
  };
  video.addEventListener('seeked', () => {
    if (pending == null) return;
    const t = pending;
    pending = null;
    video.currentTime = t;
  });
  thumb.addEventListener('pointermove', (e) => {
    const box = thumb.getBoundingClientRect();
    const f = clamp01((e.clientX - box.left) / box.width);
    const d = video.duration;
    if (!Number.isFinite(d)) return;
    seek(f * d);
    bar.style.width = `${f * 100}%`;
    timecode.textContent = `${fmtTime(f * d)} / ${fmtTime(d)}`;
  });
  thumb.addEventListener('pointerleave', () => {
    if (Number.isFinite(video.duration)) seek(posterTime(r, video.duration));
    bar.style.width = '0';
  });

  const card = {
    el,
    video,
    update(render, latest) {
      card.render = render;
      const s = specs(render, video);
      title.textContent = displayName(render);
      title.title = fileName(render.id);
      when.textContent = ago(
        render.meta?.createdAt ? Date.parse(render.meta.createdAt) : render.mtime,
      );
      badges.replaceChildren(
        ...(latest ? [h('span', { class: 'badge brand', text: 'Latest' })] : []),
        ...(s.height ? [h('span', { class: 'badge', text: resLabel(s.height) })] : []),
        ...(isDraft(render) ? [h('span', { class: 'badge', text: 'Draft' })] : []),
      );
      const parts = [
        s.width ? `${s.width}×${s.height}` : null,
        s.fps ? `${s.fps}fps` : null,
        s.duration ? fmtTime(s.duration) : null,
        fmtSize(render.size),
      ].filter(Boolean);
      meta.replaceChildren(
        parts.join(' · '),
        ...(s.git
          ? [
              ` · ${s.git.commit}`,
              ...(s.git.dirty ? [h('span', { class: 'dirty', text: '*' })] : []),
            ]
          : []),
      );
    },
  };
  video.addEventListener('loadedmetadata', () => card.update(card.render, card.latest));
  el.addEventListener('click', () => {
    location.hash = `#/${state.film.id}/renders/${encodeURIComponent(r.id)}`;
  });
  return card;
}

const progress = (() => {
  const pct = h('div', { class: 'pct mono' });
  const fill = h('i');
  const title = h('span');
  const meta = h('div', { class: 'meta mono' });
  const el = h(
    'article',
    { class: 'render rendering' },
    h('div', { class: 'thumb' }, pct, h('div', { class: 'bar' }, fill)),
    h(
      'div',
      { class: 'info' },
      h('div', { class: 'title' }, title, h('span', { class: 'ago', text: 'rendering' })),
      meta,
    ),
  );
  return {
    el,
    update(a) {
      const p = a.total ? a.frames / a.total : 0;
      pct.textContent = `${Math.floor(p * 100)}%`;
      fill.style.width = `${p * 100}%`;
      title.textContent = a.name.replace(/-\d{8}-\d{6}\.mp4$|\.mp4$/, '');
      const eta = Number.isFinite(a.eta) ? `eta ${fmtTime(a.eta)}` : 'starting';
      meta.textContent = `${a.width}×${a.height} · ${a.frames}/${a.total} frames · ${a.fps.toFixed(1)} fps · ${eta}`;
    },
  };
})();

function renderGrid() {
  const { renders, active } = state;
  count.textContent = String(renders.length).padStart(2, '0');
  navRenders.querySelector('.count').textContent = count.textContent;
  empty.hidden = renders.length > 0 || !!active;

  const seen = new Set();
  const order = [];
  if (active) {
    progress.update(active);
    order.push(progress.el);
  }
  renders.forEach((r, i) => {
    let card = cards.get(r.id);
    if (!card) {
      card = makeCard(r);
      card.el.style.animationDelay = `${Math.min(i, 11) * 30}ms`;
      cards.set(r.id, card);
    }
    card.latest = i === 0;
    card.update(r, i === 0);
    seen.add(r.id);
    order.push(card.el);
  });
  for (const [id, card] of cards) {
    if (!seen.has(id)) {
      card.video.removeAttribute('src');
      card.el.remove();
      cards.delete(id);
    }
  }
  order.forEach((el, i) => {
    if (grid.children[i] !== el) grid.insertBefore(el, grid.children[i] ?? null);
  });
  while (grid.children.length > order.length) grid.lastChild.remove();
}

async function refresh() {
  if (!state.film) return;
  try {
    const res = await fetch(`/api/films/${state.film.id}/renders`, { cache: 'no-store' });
    const data = await res.json();
    const signature = JSON.stringify([data.renders.map((r) => [r.id, r.mtime]), data.active]);
    if (signature === state.signature) return;
    state.signature = signature;
    state.renders = data.renders;
    state.active = data.active;
    renderGrid();
    if (currentRoute().render) route();
  } catch {}
}

const playerVideo = h('video', { controls: true, playsinline: true });
const details = h('aside', { class: 'details' });
const player = h(
  'div',
  { class: 'player', hidden: true },
  h('div', { class: 'screen' }, playerVideo),
  details,
);
player.addEventListener('click', (e) => {
  if (e.target === player) location.hash = `#/${state.film.id}/renders`;
});
document.body.append(player);

function fact(label, value) {
  return [h('dt', { text: label }), h('dd', { text: value ?? '—' })];
}

function showPlayer(r) {
  const s = specs(r, cards.get(r.id)?.video);
  const m = r.meta ?? {};
  if (playerVideo.dataset.id !== r.id) {
    playerVideo.dataset.id = r.id;
    playerVideo.src = r.url;
    playerVideo.play().catch(() => null);
  }
  const created = new Date(m.createdAt ? Date.parse(m.createdAt) : r.mtime);
  const close = h('button', { class: 'nav-row', title: 'Close (Esc)' }, icon('x', { size: 16 }));
  close.onclick = () => {
    location.hash = `#/${state.film.id}/renders`;
  };
  const download = h(
    'a',
    { class: 'btn primary', href: r.url, download: fileName(r.id) },
    icon('download', { size: 14 }),
    'Download',
  );
  const copyPath = h(
    'button',
    { class: 'btn' },
    icon('copy', { size: 14 }),
    h('span', { text: 'Copy path' }),
  );
  copyPath.onclick = () => copy(`apps/marketing/launch-video/${r.id}`, copyPath, 'Copied');
  details.replaceChildren(
    h(
      'div',
      { style: 'display:flex;gap:10px;align-items:flex-start' },
      h(
        'div',
        { style: 'flex:1;min-width:0' },
        h('h2', { text: displayName(r) }),
        h('div', { class: 'sub', text: `${created.toLocaleString()} · ${ago(created.getTime())}` }),
      ),
      close,
    ),
    h(
      'dl',
      { class: 'facts' },
      ...fact('Resolution', s.width ? `${s.width} × ${s.height}` : null),
      ...fact('Frame rate', s.fps ? `${s.fps} fps` : null),
      ...fact(
        'Duration',
        s.duration ? `${fmtTime(s.duration)}.${pad(Math.round((s.duration % 1) * 100))}` : null,
      ),
      ...fact(
        'Motion blur',
        m.samples
          ? m.samples > 1
            ? `${m.samples} samples · ${Math.round(m.shutter * 360)}°`
            : 'Off'
          : null,
      ),
      ...fact('Encode', m.crf != null ? `CRF ${m.crf} · grain ${m.grain}` : null),
      ...fact('Audio', m.audio == null ? null : m.audio ? 'Soundtrack' : 'None'),
      ...fact('Render time', m.renderSeconds ? fmtTime(m.renderSeconds) : null),
      ...fact('Commit', m.git ? `${m.git.commit}${m.git.dirty ? ' · modified' : ''}` : null),
      ...fact('Size', fmtSize(r.size)),
    ),
    h('div', { class: 'meta mono', text: r.id, title: r.id }),
    h('div', { class: 'actions' }, download, copyPath),
    h(
      'div',
      { class: 'keys mono' },
      h('span', { text: '← → switch' }),
      h('span', { text: 'space play' }),
      h('span', { text: 'esc close' }),
    ),
  );
  player.hidden = false;
}

function hidePlayer() {
  if (player.hidden) return;
  player.hidden = true;
  playerVideo.pause();
  playerVideo.removeAttribute('src');
  playerVideo.dataset.id = '';
  playerVideo.load();
}

function currentRoute() {
  const [, film, view = 'renders', id] = location.hash.split('/');
  return { film, view, render: id ? decodeURIComponent(id) : null };
}

function selectFilm(film) {
  state.film = film;
  state.renders = [];
  state.active = null;
  state.signature = '';
  for (const card of cards.values()) {
    card.video.removeAttribute('src');
    card.el.remove();
  }
  cards.clear();
  heading.textContent = film.title;
  cmdText.textContent = renderCmd(film.id);
  emptyCmd.textContent = renderCmd(film.id);
  document.title = `${film.title} — open-slide films`;
  for (const row of filmList.children) {
    row.setAttribute('aria-current', row.dataset.film === film.id ? 'page' : 'false');
  }
  grid.replaceChildren();
  empty.hidden = true;
  refresh();
}

function route() {
  const { film: id, view, render } = currentRoute();
  const film = state.films.find((f) => f.id === id);
  if (!film) {
    const fallback =
      state.films.find((f) => f.id === localStorage.getItem('film')) ?? state.films[0];
    if (fallback) location.replace(`#/${fallback.id}/renders`);
    return;
  }
  if (state.film !== film) {
    localStorage.setItem('film', film.id);
    selectFilm(film);
  }
  const isComp = view === 'composition';
  rendersView.hidden = isComp;
  compositionView.hidden = !isComp;
  navRenders.setAttribute('aria-current', isComp ? 'false' : 'page');
  navComposition.setAttribute('aria-current', isComp ? 'page' : 'false');
  if (isComp && iframeFilm !== film.id) {
    iframe?.remove();
    iframe = h('iframe', {
      src: `/index.html?film=${film.id}&t=${film.poster}`,
      title: 'Composition preview',
    });
    iframeFilm = film.id;
    compositionView.append(iframe);
  }
  const r = render && state.renders.find((x) => x.id === render);
  if (r) showPlayer(r);
  else hidePlayer();
}

addEventListener('hashchange', route);
addEventListener('keydown', (e) => {
  if (player.hidden) return;
  if (e.key === 'Escape') location.hash = `#/${state.film.id}/renders`;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault();
    const i = state.renders.findIndex((r) => r.id === playerVideo.dataset.id);
    const next = state.renders[i + (e.key === 'ArrowRight' ? 1 : -1)];
    if (next) location.hash = `#/${state.film.id}/renders/${encodeURIComponent(next.id)}`;
  }
});

// A film that fails to import (mid-edit, say) still gets a row, titled by its id.
async function loadFilms() {
  const ids = await (await fetch('/api/films', { cache: 'no-store' })).json();
  return Promise.all(
    ids.map(async (id) => {
      try {
        const { default: film } = await import(`/films/${id}/film.js`);
        return { id, title: film.title, poster: film.poster };
      } catch (e) {
        console.error(e);
        return { id, title: id, poster: 0 };
      }
    }),
  );
}

state.films = await loadFilms();
filmList.replaceChildren(
  ...state.films.map((f) => {
    const row = h('button', { class: 'film-row', 'data-film': f.id }, h('i'), f.title);
    row.onclick = () => {
      location.hash = `#/${f.id}/renders`;
    };
    return row;
  }),
);
route();
setInterval(() => {
  if (!document.hidden) refresh();
}, POLL_MS);
