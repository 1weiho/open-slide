import { prog } from '#lib/anim.js';
import { h, set } from '#lib/dom.js';
import { clamp, outExpo, swift } from '#lib/ease.js';
import { typeOn } from '#lib/fx.js';
import { defineScene } from '#lib/scene.js';
import { C, FONT } from '#theme';
import { SPANS } from '../timeline.js';

const SLAMS = [
  { t: 60.0, label: 'React', num: '19', bg: C.ink, fg: '#f6f6f6', accent: C.brand },
  { t: 60.5, label: 'Vite', num: '8', bg: C.brand, fg: '#fff', accent: '#0a0a0a' },
  { t: 61.0, label: 'TypeScript', num: '7', bg: C.paper, fg: '#0a0a0a', accent: C.brand },
  { t: 61.5, label: 'Node', num: '20.19+', bg: '#0a0a0a', fg: '#f6f6f6', accent: C.brand },
];
const TERM = 62.0;

const K = {
  dim: 'color:#7b7f87',
  cyan: 'color:#5fd4e8',
  green: 'color:#5fd38a',
  mag: 'color:#d88cf0',
  bold: 'font-weight:700;color:#fafafa',
  inv: 'background:#f2f2f2;color:#0a0a0a;font-weight:700;padding:0 2px',
  gray: 'color:#5c6068',
  prompt: `color:${C.brand};font-weight:700`,
};

// [time, [[text, style], ...], typed?]
const LINES = [
  [
    TERM + 0.1,
    [
      ['$ ', K.prompt],
      ['npx @open-slide/cli init', ''],
    ],
    0.5,
  ],
  [
    TERM + 0.85,
    [
      ['┌  ', K.gray],
      [' open-slide ', K.inv],
      [' v2.0.0', K.dim],
    ],
  ],
  [TERM + 0.9, [['│', K.gray]]],
  [
    TERM + 0.95,
    [
      ['◇  ', K.green],
      ['Where should we create your workspace?', ''],
    ],
  ],
  [
    TERM + 1.0,
    [
      ['│  ', K.gray],
      ['my-deck', K.dim],
    ],
  ],
  [TERM + 1.05, [['│', K.gray]]],
  [
    TERM + 1.15,
    [
      ['◇  ', K.green],
      ['Package manager', ''],
    ],
  ],
  [
    TERM + 1.2,
    [
      ['│  ', K.gray],
      ['pnpm', K.dim],
    ],
  ],
  [TERM + 1.25, [['│', K.gray]]],
  [
    TERM + 1.35,
    [
      ['◇  ', K.green],
      ['Created workspace ', ''],
      ['in my-deck', K.dim],
    ],
  ],
  [TERM + 1.4, [['│', K.gray]]],
  [TERM + 1.45, 'install'],
  [TERM + 1.95, [['│', K.gray]]],
  [
    TERM + 2.0,
    [
      ['◇  ', K.green],
      ['Initialized git repository', ''],
    ],
  ],
  [TERM + 2.05, [['│', K.gray]]],
  [
    TERM + 2.1,
    [
      ['◇  ', K.green],
      ['Next steps ', ''],
      ['─────────╮', K.gray],
    ],
  ],
  [
    TERM + 2.12,
    [
      ['│                     ', K.gray],
      ['│', K.gray],
    ],
  ],
  [
    TERM + 2.14,
    [
      ['│  ', K.gray],
      ['cd my-deck', K.cyan],
      ['         │', K.gray],
    ],
  ],
  [
    TERM + 2.16,
    [
      ['│  ', K.gray],
      ['pnpm dev', K.cyan],
      ['           │', K.gray],
    ],
  ],
  [
    TERM + 2.18,
    [
      ['│                     ', K.gray],
      ['│', K.gray],
    ],
  ],
  [TERM + 2.2, [['├─────────────────────╯', K.gray]]],
  [
    TERM + 2.25,
    [
      ['└  ', K.gray],
      ['All set! ', ''],
      ['Docs: https://open-slide.dev/docs', K.dim],
    ],
  ],
  [TERM + 2.3, [['', '']]],
  [
    TERM + 2.45,
    [
      ['$ ', K.prompt],
      ['cd my-deck && pnpm dev', ''],
    ],
    0.4,
  ],
  [TERM + 2.95, [['', '']]],
  [
    TERM + 3.0,
    [
      ['  ', ''],
      [' open-slide ', K.inv],
      ['  v2.0.0  ', K.dim],
      ['ready in 412 ms', K.dim],
    ],
  ],
  [TERM + 3.05, [['', '']]],
  [
    TERM + 3.1,
    [
      ['  ┃  ', K.dim],
      ['Local    ', K.bold],
      ['http://localhost:5173/', K.cyan],
    ],
  ],
  [
    TERM + 3.15,
    [
      ['  ┃  ', K.dim],
      ['Network  ', K.bold],
      ['use --host to expose', K.dim],
    ],
  ],
  [TERM + 3.2, [['', '']]],
  [
    TERM + 3.25,
    [
      ['  ', ''],
      ['press ', K.dim],
      ['h + enter', K.bold],
      [' for shortcuts', K.dim],
    ],
  ],
];
const SPIN = ['◒', '◐', '◓', '◑'];
const LH = 36;

export default defineScene({
  name: 'stack',
  span: SPANS.stack,
  sfx: [
    ...SLAMS.map((s) => [s.t, 'slam', 1]),
    ...Array.from({ length: 12 }, (_, i) => [TERM + 0.1 + i * 0.04, 'type', 0.45]),
    ...LINES.filter((l) => !l[2] && l[1] !== 'install').map((l) => [l[0], 'tick', 0.18]),
    [TERM + 1.95, 'success', 0.5],
    ...Array.from({ length: 10 }, (_, i) => [TERM + 2.45 + i * 0.04, 'type', 0.45]),
    [TERM + 3.0, 'pop', 0.8],
  ],
  build(root) {
    const slams = SLAMS.map((sl) => {
      const label = h('div', {
        text: sl.label,
        style: `position:absolute;left:130px;top:430px;font-family:${FONT.sans};font-size:150px;font-weight:600;letter-spacing:-0.05em;line-height:1;color:${sl.fg};white-space:nowrap`,
      });
      const num = h('div', {
        text: sl.num,
        style: `position:absolute;right:120px;top:540px;font-family:${FONT.sans};font-size:${sl.num.length > 3 ? 360 : 640}px;font-weight:800;letter-spacing:-0.06em;line-height:0.8;color:${sl.accent === C.brand ? C.brand : sl.fg};white-space:nowrap;transform-origin:100% 50%`,
      });
      const cap = h('div', {
        class: 'mono',
        text: 'under the hood',
        style: `position:absolute;left:136px;top:390px;font-size:24px;letter-spacing:0.16em;text-transform:uppercase;color:${sl.fg};opacity:0.55`,
      });
      const el = h(
        'div',
        { class: 'fill', style: `background:${sl.bg};display:none` },
        cap,
        label,
        num,
      );
      root.append(el);
      return { el, label, num };
    });

    const body = h('div', { style: 'position:absolute;left:0;top:0;right:0' });
    const rows = LINES.map(([, parts]) => {
      const row = h('div', { style: `height:${LH}px;white-space:pre` });
      body.append(row);
      return { row, parts };
    });
    const term = h(
      'div',
      {
        style: `position:absolute;left:0;top:0;width:1480px;height:880px;border-radius:18px;background:#0c0c0e;box-shadow:0 0 0 1px rgb(255 255 255 / 0.08), 0 60px 140px -30px rgb(0 0 0 / 0.8);overflow:hidden;font-family:${FONT.mono};font-size:25px;color:#e9e9e9;transform-origin:50% 50%`,
      },
      h(
        'div',
        {
          style:
            'height:52px;display:flex;align-items:center;gap:9px;padding:0 20px;border-bottom:1px solid rgb(255 255 255 / 0.07);position:relative',
        },
        ['#ff5f57', '#febc2e', '#28c840'].map((c) =>
          h('div', { style: `width:13px;height:13px;border-radius:50%;background:${c}` }),
        ),
        h('div', {
          text: '~/decks — zsh',
          style: `position:absolute;left:50%;transform:translateX(-50%);font-family:${FONT.sans};font-size:15px;color:#9a9a9a`,
        }),
      ),
      h(
        'div',
        { style: 'position:absolute;left:44px;right:44px;top:84px;bottom:30px;overflow:hidden' },
        body,
      ),
    );
    const termWrap = h(
      'div',
      {
        class: 'fill',
        style:
          'display:none;background:radial-gradient(90% 80% at 50% 40%, #151517 0%, #070707 75%)',
      },
      term,
    );
    root.append(termWrap);
    return { slams, termWrap, term, body, rows };
  },
  update(s, _t, Tm) {
    const which = Tm >= TERM ? -1 : SLAMS.findLastIndex((sl) => Tm >= sl.t);
    s.slams.forEach((sl, i) => {
      if (i !== which) {
        set(sl.el, { display: 'none' });
        return;
      }
      const p = prog(Tm, SLAMS[i].t, 0.32, outExpo);
      set(sl.el, { display: 'block' });
      set(sl.num, {
        transform: `scale(${1.5 - 0.5 * p}) translateY(${(1 - p) * 30}px)`,
        filter: p < 1 ? `blur(${(1 - p) * 16}px)` : 'none',
      });
      set(sl.label, { transform: `translateX(${(1 - p) * -80}px)`, opacity: p });
    });

    const on = Tm >= TERM;
    set(s.termWrap, { display: on ? 'block' : 'none' });
    if (!on) return;
    const tin = prog(Tm, TERM, 0.45, swift);
    const push = prog(Tm, TERM, 4.2, (x) => x);
    set(s.term, {
      transform: `translate(${960 - 740}px, ${540 - 440}px) scale(${(0.92 + 0.08 * tin) * (1 + push * 0.05)})`,
      opacity: tin,
    });
    LINES.forEach(([t0, parts, typedDur], i) => {
      const row = s.rows[i].row;
      if (Tm < t0) {
        set(row, { display: 'none' });
        return;
      }
      set(row, { display: 'block' });
      if (parts === 'install') {
        const doneAt = TERM + 1.95;
        const key =
          Tm < doneAt ? `spin${Math.floor(Tm * 12) % 4}${Math.floor(Tm * 3) % 4}` : 'done';
        if (row.dataset.k !== key) {
          row.dataset.k = key;
          row.replaceChildren(
            ...(Tm < doneAt
              ? [
                  h('span', { text: `${SPIN[Math.floor(Tm * 12) % 4]}  `, style: K.mag }),
                  h('span', {
                    text: `Installing dependencies with pnpm${'.'.repeat((Math.floor(Tm * 6) % 3) + 1)}`,
                  }),
                ]
              : [
                  h('span', { text: '◇  ', style: K.green }),
                  h('span', { text: 'Installed dependencies with pnpm' }),
                ]),
          );
        }
        return;
      }
      if (typedDur) {
        const [prompt, cmd] = parts;
        const n = typeOn(cmd[0], Tm, t0 + 0.05, cmd[0].length / typedDur).length;
        const key = `t${n}${Tm - t0 < typedDur + 0.2 ? Math.floor(Tm * 3) % 2 : 'x'}`;
        if (row.dataset.k !== key) {
          row.dataset.k = key;
          row.replaceChildren(
            h('span', { text: prompt[0], style: prompt[1] }),
            h('span', { text: cmd[0].slice(0, n) }),
            h('span', {
              text: ' ',
              style: `background:${Math.floor(Tm * 3) % 2 === 0 || n < cmd[0].length ? '#e9e9e9' : 'transparent'}`,
            }),
          );
        }
        return;
      }
      if (row.dataset.k !== 'full') {
        row.dataset.k = 'full';
        row.replaceChildren(...parts.map(([tx, st]) => h('span', { text: tx, style: st })));
      }
    });
    const maxRows = 20;
    let scroll = 0;
    for (let i = maxRows; i < LINES.length; i++) {
      scroll += LH * swift(clamp((Tm - LINES[i][0]) / 0.14));
    }
    set(s.body, { transform: `translateY(${-scroll}px)` });
  },
});
