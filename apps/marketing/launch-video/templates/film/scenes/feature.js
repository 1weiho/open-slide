import { envelope, prog, tween } from '#lib/anim.js';
import { h, set } from '#lib/dom.js';
import { outExpo, swift } from '#lib/ease.js';
import { route } from '#lib/route.js';
import { defineScene, rectIn } from '#lib/scene.js';
import { FONT } from '#theme';
import { slideViewer, WIN } from '#ui/app.js';
import { cursor } from '#ui/cursor.js';
import { selection } from '#ui/selection.js';
import { TAGLINE } from '../copy.js';
import { SPANS } from '../timeline.js';

// Placeholder demo: select the headline, then open the Format panel.
// Replace with the feature's real interaction.
const CUE = { caption: 4.6, select: 6.2, format: 8.2, panel: 8.3 };
const SCALE = 0.84;

export default defineScene({
  name: 'feature',
  span: SPANS.feature,
  sfx: [
    [CUE.caption, 'pop', 0.6],
    [CUE.select, 'click', 1],
    [CUE.format, 'click', 0.9],
    [CUE.panel, 'slide', 0.4],
  ],
  build(root) {
    set(root, {
      background:
        'radial-gradient(120% 100% at 50% 20%, oklch(0.985 0 0) 0%, oklch(0.93 0.004 80) 70%, oklch(0.88 0.006 80) 100%)',
    });
    const app = slideViewer();
    const win = h(
      'div',
      { class: 'abs', style: `transform-origin:${WIN.w / 2}px ${WIN.h / 2}px` },
      app.el,
    );
    const sel = selection();
    const cur = cursor();
    app.overlay.append(sel.el, cur.el);
    const caption = h('div', {
      text: TAGLINE,
      style: `position:absolute;left:0;right:0;top:960px;text-align:center;font-family:${FONT.sans};font-size:44px;font-weight:600;letter-spacing:-0.02em;color:#0a0a0a`,
    });
    root.append(win, caption);

    app.slide.update();
    const L0 = app.update({});
    const head = app.toWin(app.slide.rect('head'), L0);
    const fmt = rectIn(app.toolbar.formatBtn, app.el);
    const path = route(
      [WIN.w * 0.62, WIN.h + 60],
      [
        { at: CUE.select - 0.15, dur: 1.1, to: [head.x + head.w * 0.55, head.y + head.h * 0.5] },
        { at: CUE.format - 0.15, dur: 1.0, to: [fmt.cx, fmt.cy], bend: -0.1 },
        { at: CUE.panel + 1.6, dur: 1.0, to: [WIN.w * 0.4, WIN.h * 0.6] },
      ],
    );
    return { app, win, sel, cur, caption, path };
  },
  update(s, _t, T) {
    const zoom = tween(T, 3.6, 10.4, SCALE, SCALE + 0.04, swift);
    set(s.win, {
      transform: `translate(${(1920 - WIN.w) / 2}px, ${(1080 - WIN.h) / 2 - 50}px) scale(${zoom})`,
    });
    const L = s.app.update({ panelOpen: prog(T, CUE.panel, 0.5) });

    const selP = prog(T, CUE.select, 0.35, outExpo);
    const head = s.app.toWin(s.app.slide.rect('head'), L);
    s.sel.update({ ...head, show: selP, handles: selP, badgeText: '<h1>', badgeShow: selP });

    const [x, y] = s.path(T);
    s.cur.update(T, { x, y, clicks: [CUE.select, CUE.format] });

    const cp = envelope(T, CUE.caption, 14.4, 0.6, 0.4);
    set(s.caption, { opacity: cp, transform: `translateY(${(1 - cp) * 14}px)` });
  },
});
