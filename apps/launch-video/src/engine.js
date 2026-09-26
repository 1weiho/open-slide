import { impulse } from './lib/anim.js';
import { h, set } from './lib/dom.js';
import { bezier, clamp } from './lib/ease.js';
import { noise1 } from './lib/rand.js';
import { H } from './theme.js';

const cardEase = bezier(0.76, 0, 0.24, 1);

// Returns how far `name` is through a hand-off at time T, as the incoming
// card (`rise`) or the scene receding behind it (`recede`).
function handoff(film, name, T) {
  for (const tr of film.transitions) {
    const p = clamp((T - (tr.t - film.card / 2)) / film.card);
    if (p <= 0 || p >= 1) continue;
    if (tr.to === name) return { rise: cardEase(p) };
    if (tr.from === name) return { recede: cardEase(p) };
  }
  return null;
}

export function createEngine(stage, film) {
  const shaker = h('div', { class: 'shaker' });
  stage.append(shaker);
  const mounted = film.scenes.map((scene, i) => {
    const root = h('div', { class: 'scene', 'data-scene': scene.name });
    root.style.zIndex = String(scene.z ?? i + 1);
    shaker.append(root);
    const state = scene.build(root);
    const dim = h('div', { class: 'post', style: 'background:#000;opacity:0;z-index:1000' });
    const edge = h('div', {
      class: 'post',
      style:
        'z-index:1001;opacity:0;box-shadow:inset 0 1.5px 0 rgb(255 255 255 / 0.22), inset 0 0 0 1px rgb(255 255 255 / 0.1)',
    });
    root.append(dim, edge);
    root.style.display = 'none';
    return { scene, root, dim, edge, state, visible: false };
  });

  // Film grain is added by ffmpeg at encode time, after motion blur, so it
  // stays crisp and costs nothing to rasterize here.
  const flash = h('div', { class: 'post flash' });
  const vignette = h('div', { class: 'post vignette' });
  stage.append(flash, vignette);

  function seek(T) {
    for (const m of mounted) {
      const [a, b] = m.scene.span;
      const active = T >= a && T < b;
      if (active !== m.visible) {
        m.root.style.display = active ? '' : 'none';
        m.visible = active;
      }
      if (!active) continue;
      m.scene.update(m.state, T - a, T);
      const ho = handoff(film, m.scene.name, T);
      if (ho?.rise != null) {
        const e = ho.rise;
        set(m.root, {
          transform: `translateY(${(1 - e) * H}px) scale(${0.9 + 0.1 * e})`,
          clipPath: `inset(0 round ${(1 - e) * 48}px)`,
        });
        set(m.dim, { opacity: 0 });
        set(m.edge, { opacity: 1 - e, borderRadius: `${(1 - e) * 48}px` });
      } else if (ho?.recede != null) {
        const e = ho.recede;
        set(m.root, {
          transform: `translateY(${-e * 40}px) scale(${1 - 0.08 * e})`,
          clipPath: `inset(0 round ${e * 48}px)`,
        });
        set(m.dim, { opacity: 0.7 * e });
        set(m.edge, { opacity: 0 });
      } else {
        set(m.root, { transform: 'none', clipPath: 'none' });
        set(m.dim, { opacity: 0 });
        set(m.edge, { opacity: 0 });
      }
    }

    let shake = 0;
    let fl = 0;
    for (const hit of film.hits) {
      shake += impulse(T, hit.t, 0.18) * hit.amount;
      fl += impulse(T, hit.t, 0.045) * (hit.flash ?? 0);
    }
    const sx = noise1(T * 38, 3) * 18 * shake;
    const sy = noise1(T * 41, 7) * 14 * shake;
    const sr = noise1(T * 29, 11) * 0.5 * shake;
    set(shaker, { transform: `translate(${sx}px, ${sy}px) rotate(${sr}deg)` });
    set(flash, { opacity: Math.min(0.3, fl * 0.3) });
  }

  return { seek };
}
