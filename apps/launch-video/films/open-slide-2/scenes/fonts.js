import { envelope, prog } from '#lib/anim.js';
import { h, set, split, text } from '#lib/dom.js';
import { clamp, inCubic, outBack, outExpo, snap, swift } from '#lib/ease.js';
import { route } from '#lib/route.js';
import { defineScene, rectIn } from '#lib/scene.js';
import { C, FONT, LIGHT as P, SHADOW } from '#theme';
import { cursor } from '#ui/cursor.js';
import { icon } from '#ui/icons.js';
import { SPECIMENS } from '../specimens.js';
import { SPANS } from '../timeline.js';

const T = {
  dialog: 54.3,
  type: 54.55,
  results: 54.9,
  montage: 55.45,
  step: 0.25,
  land: 58.45,
  add: 58.95,
  toast: 59.2,
};
const QUERY = 'serif';
const WORD = 'Make it yours.';
const MONTAGE = SPECIMENS.slice(0, 12);
const FINAL = SPECIMENS.at(-1);
const POPULAR = [
  { family: 'Space Grotesk', category: 'Sans Serif' },
  { family: 'Playfair Display', category: 'Serif' },
  { family: 'Bricolage Grotesque', category: 'Sans Serif' },
];
const RESULTS = [
  { family: 'Instrument Serif', category: 'Serif' },
  { family: 'DM Serif Display', category: 'Serif' },
  { family: 'Young Serif', category: 'Serif' },
];

function fontCss(spec) {
  return `font-family:'${spec.family}';font-weight:${spec.weight};${spec.italic ? 'font-style:italic;' : ''}`;
}

function resultRow(r, { add = false } = {}) {
  const addBtn = h(
    'div',
    {
      class: 'add',
      style: `height:26px;padding:0 10px;border-radius:5px;border:1px solid ${P.border};display:flex;align-items:center;gap:5px;font-size:11px;font-weight:500;color:${P.fg};background:${P.card}`,
    },
    h('span', { class: 'spin', style: 'display:none' }, icon('loader-circle', { size: 12 })),
    h('span', { class: 'lbl', text: 'Add' }),
  );
  return h(
    'div',
    {
      class: 'row',
      style: `display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:8px;border:1px solid ${P.border};background:${P.card}`,
    },
    h(
      'div',
      { style: 'flex:1;min-width:0' },
      h(
        'div',
        { style: 'display:flex;gap:8px;align-items:baseline' },
        h('span', { text: r.family, style: `font-size:11px;font-weight:500;color:${P.fg}` }),
        h('span', { text: r.category, style: `font-size:10px;color:${P.mutedFg}` }),
      ),
      h('div', {
        text: r.family,
        style: `font-family:'${r.family}';font-size:26px;line-height:1.3;color:${P.fg};white-space:nowrap;${r.italic ? 'font-style:italic' : ''}`,
      }),
    ),
    h(
      'div',
      {
        style: `height:26px;padding:0 8px;border-radius:5px;border:1px solid ${P.border};display:flex;align-items:center;gap:4px;font-size:11px;color:${P.fg}`,
      },
      add ? 'Italic' : 'Regular',
      h('span', { style: `color:${P.mutedFg}` }, icon('chevron-down', { size: 12 })),
    ),
    addBtn,
  );
}

export default defineScene({
  name: 'fonts',
  span: SPANS.fonts,
  sfx: [
    [T.dialog, 'pop', 0.6],
    ...Array.from(QUERY).map((_, i) => [T.type + i * 0.07, 'type', 0.6]),
    [T.results, 'blip', 0.5],
    [T.montage - 0.15, 'whoosh', 0.7],
    ...MONTAGE.map((_, i) => [T.montage + i * T.step, 'flip', 0.55 + (i % 4 === 0 ? 0.3 : 0)]),
    [T.land, 'impact', 0.5],
    [T.add, 'click', 1],
    [T.toast, 'success', 0.7],
  ],
  build(root) {
    set(root, { background: C.void });
    const dialog = h(
      'div',
      {
        style: `position:absolute;left:0;top:0;width:672px;padding:22px;border-radius:14px;background:${P.popover};box-shadow:${SHADOW.overlay};font-family:${FONT.sans};color:${P.fg};transform-origin:50% 50%`,
      },
      h('div', { text: 'Search Google Fonts', style: 'font-size:16px;font-weight:600' }),
      h('div', {
        text: 'Powered by Google Fonts.',
        style: `font-size:12.5px;color:${P.mutedFg};margin-top:4px`,
      }),
      h(
        'div',
        { style: 'display:flex;gap:10px;margin:18px 0 14px' },
        h(
          'div',
          {
            style: `flex:1;height:34px;border-radius:6px;border:1px solid ${P.border};display:flex;align-items:center;gap:8px;padding:0 10px;font-size:13px;box-shadow:0 0 0 3px oklch(0.6 0.2 25 / 0.12)`,
          },
          h('span', { style: `color:${P.mutedFg}` }, icon('search', { size: 14 })),
          h('span', { class: 'q', style: `color:${P.fg}` }),
          h('span', { class: 'ph', text: 'Search font families…', style: `color:${P.mutedFg}` }),
        ),
        h(
          'div',
          {
            style: `width:200px;height:34px;border-radius:6px;border:1px solid ${P.border};display:flex;align-items:center;gap:8px;padding:0 10px;font-size:13px;color:${P.mutedFg}`,
          },
          icon('type', { size: 14 }),
          'Preview text',
        ),
      ),
      h(
        'div',
        { style: 'position:relative' },
        h(
          'div',
          { class: 'popular', style: 'display:flex;flex-direction:column;gap:8px' },
          POPULAR.map((r) => resultRow(r)),
        ),
        h(
          'div',
          {
            class: 'results',
            style: 'position:absolute;inset:0;display:flex;flex-direction:column;gap:8px',
          },
          RESULTS.map((r) => resultRow(r)),
        ),
      ),
    );
    const q = dialog.querySelector('.q');
    const ph = dialog.querySelector('.ph');
    const rows = [...dialog.querySelectorAll('.results .row')];
    const popular = dialog.querySelector('.popular');

    const specimens = h('div', { class: 'fill' });
    const items = [...MONTAGE, FINAL].map((spec) => {
      const el = h('div', {
        text: WORD,
        style: `position:absolute;left:960px;top:470px;${fontCss(spec)}font-size:230px;line-height:1.1;color:#f6f6f6;white-space:nowrap;letter-spacing:${spec.family === 'Geist' ? '-0.05em' : '-0.02em'};display:none;transform-origin:50% 50%`,
      });
      specimens.append(el);
      return el;
    });
    const meta = h(
      'div',
      {
        class: 'mono',
        style:
          'position:absolute;left:120px;right:120px;bottom:96px;display:flex;justify-content:space-between;font-size:26px;letter-spacing:0.12em;text-transform:uppercase;color:rgb(255 255 255 / 0.6)',
      },
      h('span', { class: 'fam' }),
      h('span', { class: 'idx' }),
    );
    const fam = meta.querySelector('.fam');
    const idx = meta.querySelector('.idx');
    const tag = h(
      'div',
      {
        class: 'mono',
        style: `position:absolute;left:120px;top:96px;display:flex;gap:14px;font-size:24px;letter-spacing:0.16em;text-transform:uppercase;color:${C.brand}`,
      },
      h('span', { text: '04' }),
      h('span', { text: '—' }),
      h('span', { text: 'Google Fonts search' }),
    );

    const finalRow = resultRow(
      { family: 'Instrument Serif', category: 'Serif', italic: true },
      { add: true },
    );
    const finalWrap = h('div', { class: 'abs', style: 'width:640px;opacity:0' }, finalRow);
    const toast = h(
      'div',
      {
        style: `position:absolute;left:0;top:0;display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:8px;background:${P.popover};box-shadow:${SHADOW.floating};font-family:${FONT.sans};font-size:13px;color:${P.fg};opacity:0;white-space:nowrap`,
      },
      h('span', { style: `color:${C.green}` }, icon('check', { size: 15, stroke: 2.4 })),
      'Uploaded ',
      h('span', { class: 'mono', text: 'InstrumentSerif-Italic.ttf', style: 'font-size:12px' }),
    );
    const tagline = h('div', {
      style: `position:absolute;left:0;right:0;top:170px;text-align:center;font-family:${FONT.sans};font-size:88px;font-weight:700;letter-spacing:-0.05em;color:#f6f6f6;white-space:nowrap`,
    });
    const tagWords = split(tagline, 'Every Google Font. One search away.', {
      by: 'word',
      mask: true,
    });
    const cur = cursor({ size: 40 });
    root.append(specimens, meta, tag, dialog, tagline, finalWrap, toast, cur.el);

    const widths = items.map((el) => {
      el.style.display = 'block';
      const w = el.offsetWidth;
      el.style.display = 'none';
      return w;
    });
    const addBtn = finalRow.querySelector('.add');
    const addPos = (() => {
      finalWrap.style.transform = 'translate(640px, 780px) scale(1.4)';
      finalWrap.style.transformOrigin = '0 0';
      const r = rectIn(addBtn, root);
      return [r.x + r.w / 2, r.y + r.h / 2];
    })();
    return {
      dialog,
      q,
      ph,
      rows,
      popular,
      items,
      widths,
      meta,
      fam,
      idx,
      tag,
      finalWrap,
      finalRow,
      addBtn,
      toast,
      tagWords,
      cur,
      route: route([1600, 1150], [{ at: T.add - 0.02, dur: 0.45, to: addPos }]),
    };
  },
  update(s, _t, Tm) {
    const dIn = prog(Tm, T.dialog, 0.4, swift);
    const dOut = prog(Tm, T.montage - 0.2, 0.3, inCubic);
    set(s.dialog, {
      opacity: dIn * (1 - dOut),
      transform: `translate(${960 - 336}px, ${250 + (1 - dIn) * 30}px) scale(${(0.94 + 0.06 * dIn) * 1.45 * (1 + dOut * 0.6)})`,
      filter: dOut > 0 ? `blur(${dOut * 12}px)` : 'none',
    });
    const typed = QUERY.slice(0, clamp(Math.floor((Tm - T.type) / 0.07) + 1, 0, QUERY.length));
    text(s.q, Tm < T.type ? '' : typed);
    set(s.ph, { display: Tm < T.type ? 'inline' : 'none' });
    set(s.popular, { opacity: 1 - prog(Tm, T.results - 0.08, 0.1) });
    s.rows.forEach((r, i) => {
      const p = prog(Tm, T.results + i * 0.06, 0.35, swift);
      set(r, { opacity: p, transform: `translateY(${(1 - p) * 10}px)` });
    });

    const step = Math.floor((Tm - T.montage) / T.step);
    const active =
      Tm < T.montage ? -1 : Tm >= T.land ? MONTAGE.length : Math.min(MONTAGE.length - 1, step);
    const local = Tm >= T.land ? Tm - T.land : Tm - T.montage - step * T.step;
    s.items.forEach((el, i) => {
      if (i !== active) {
        set(el, { display: 'none' });
        return;
      }
      const fit = Math.min(1, 1640 / s.widths[i]);
      const pop = outExpo(clamp(local / 0.18));
      const lift = i === MONTAGE.length ? prog(Tm, T.land + 0.25, 0.6, swift) : 0;
      set(el, {
        display: 'block',
        color: i === MONTAGE.length || i % 4 === 3 ? C.brand : '#f6f6f6',
        transform: `translate(-50%, -50%) translateY(${-lift * 90}px) scale(${fit * (1.06 - 0.06 * pop) * (1 - lift * 0.18)})`,
      });
    });
    const spec = active >= 0 ? (active === MONTAGE.length ? FINAL : MONTAGE[active]) : null;
    text(s.fam, spec ? `${spec.family}${spec.italic ? ' Italic' : ''} · ${spec.category}` : '');
    text(s.idx, spec ? `Google Fonts · ${String(Math.min(active + 1, 12)).padStart(2, '0')}` : '');
    set(s.meta, { opacity: active >= 0 ? 1 - prog(Tm, T.land + 0.2, 0.3) : 0 });
    set(s.tag, { opacity: prog(Tm, 54.3, 0.4) * (1 - prog(Tm, T.land, 0.3)) });

    const fr = prog(Tm, T.land + 0.3, 0.5, outExpo);
    set(s.finalWrap, {
      opacity: fr,
      transform: `translate(640px, ${780 + (1 - fr) * 30}px) scale(1.4)`,
      transformOrigin: '0 0',
    });
    const adding = Tm >= T.add && Tm < T.toast;
    set(s.addBtn.querySelector('.spin'), {
      display: adding ? 'inline-block' : 'none',
      transform: `rotate(${Tm * 720}deg)`,
    });
    text(s.addBtn.querySelector('.lbl'), Tm >= T.toast ? 'Added' : 'Add');
    const tp = prog(Tm, T.toast, 0.35, outBack(1.6));
    set(s.toast, {
      opacity: clamp(tp),
      transform: `translate(${1880 - 470}px, ${980 + (1 - clamp(tp)) * 20}px) scale(1.35)`,
      transformOrigin: '0 0',
    });
    s.tagWords.forEach((w, i) => {
      const p = prog(Tm, T.land + 0.35 + i * 0.06, 0.8, snap);
      set(w.inner, { transform: `translateY(${(1 - p) * 110}%)` });
    });
    const [cx, cy] = s.route(Tm);
    s.cur.update(Tm, {
      x: cx,
      y: cy,
      opacity: envelope(Tm, T.add - 0.5, 60.0, 0.15, 0.1),
      clicks: [T.add],
    });
  },
});
