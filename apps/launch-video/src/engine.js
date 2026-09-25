import { impulse } from './lib/anim.js';
import { h, set } from './lib/dom.js';
import { noise1 } from './lib/rand.js';
import { HITS } from './timeline.js';

export function createEngine(stage, scenes) {
  const shaker = h('div', { class: 'shaker' });
  stage.append(shaker);
  const mounted = scenes.map((scene, i) => {
    const root = h('div', { class: 'scene', 'data-scene': scene.name });
    root.style.zIndex = String(scene.z ?? i + 1);
    shaker.append(root);
    const state = scene.build(root);
    root.style.display = 'none';
    return { scene, root, state, visible: false };
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
      if (active) m.scene.update(m.state, T - a, T);
    }

    let shake = 0;
    let fl = 0;
    for (const hit of HITS) {
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
