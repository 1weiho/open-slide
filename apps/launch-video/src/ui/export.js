import { h, set, text } from '../lib/dom.js';
import { C, LIGHT as P, SHADOW } from '../theme.js';
import { icon } from './icons.js';
import { divider, iconBtn, kbd, textBtn } from './kit.js';

export function toolbarFragment() {
  const download = iconBtn('download', { size: 28 });
  const el = h(
    'div',
    {
      style: `position:absolute;left:0;top:0;display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:12px;background:${P.chrome};box-shadow:${SHADOW.overlay};transform-origin:0 0;color:${P.fg}`,
    },
    h(
      'div',
      {
        style: `display:flex;padding:2px;border-radius:8px;border:1px solid oklch(0.92 0 0 / 0.7);background:oklch(0.955 0 0 / 0.7)`,
      },
      iconBtn('eye', { size: 28 }),
      iconBtn('pencil', { size: 28, active: true }),
    ),
    divider(),
    iconBtn('link-2'),
    download,
    h(
      'div',
      { style: 'display:flex;align-items:center;gap:6px' },
      textBtn('Design', 'palette'),
      kbd('D'),
    ),
    textBtn('Format', 'panel-right'),
    divider(),
    h(
      'div',
      {
        style: `display:flex;align-items:center;gap:6px;height:28px;padding:0 12px;border-radius:5px;background:${C.brand};color:#fff;font-size:12.5px;font-weight:500`,
      },
      icon('play', { size: 13, fill: '#fff' }),
      'Present',
    ),
  );
  return { el, download };
}

export function downloadMenu() {
  const item = (name, label) =>
    h(
      'div',
      {
        style: `display:flex;align-items:center;gap:9px;height:30px;padding:0 9px;border-radius:5px;font-size:12.5px;color:${P.fg}`,
      },
      h('span', { style: `color:${P.mutedFg}` }, icon(name, { size: 14 })),
      label,
    );
  const items = [
    item('file-code-corner', 'Export as HTML'),
    item('file-text', 'Export as PDF'),
    item('presentation', 'Export as PPTX'),
    item('file-image', 'Export as image PPTX'),
  ];
  const el = h(
    'div',
    {
      style: `position:absolute;left:0;top:0;min-width:210px;padding:4px;border-radius:8px;border:1px solid ${P.border};background:${P.popover};box-shadow:${SHADOW.overlay};transform-origin:100% 0`,
    },
    items[0],
    items[1],
    h('div', { style: `height:1px;background:${P.hairline};margin:4px -4px` }),
    items[2],
    items[3],
  );
  return { el, items };
}

export function exportToast() {
  const spin = h(
    'span',
    { style: `color:${C.brand};display:inline-block` },
    icon('loader-circle', { size: 14 }),
  );
  const check = h(
    'span',
    { style: `color:${C.green};display:none` },
    icon('check', { size: 14, stroke: 2.4 }),
  );
  const status = h('div', {
    class: 'mono nums',
    style: `font-size:10.5px;color:${P.mutedFg};margin-top:3px`,
  });
  const bar = h('div', {
    style: `height:3px;border-radius:2px;background:${C.brand};width:0;transform-origin:0 50%`,
  });
  const el = h(
    'div',
    {
      style: `position:absolute;left:0;top:0;width:320px;padding:12px 14px;border-radius:8px;background:${P.popover};box-shadow:${SHADOW.floating}, 0 20px 50px -20px rgb(0 0 0 / 0.5);color:${P.fg};transform-origin:100% 100%`,
    },
    h(
      'div',
      { style: 'display:flex;gap:10px' },
      h('div', { style: 'padding-top:1px' }, spin, check),
      h(
        'div',
        { style: 'flex:1' },
        h('div', { text: 'Exporting PPTX', style: 'font-size:12.5px;font-weight:600' }),
        status,
        h(
          'div',
          { style: `margin-top:10px;height:3px;border-radius:2px;background:${P.muted}` },
          bar,
        ),
      ),
    ),
  );
  return {
    el,
    update(t, { page, total, phase, progress }) {
      set(spin, {
        display: phase === 'done' ? 'none' : 'inline-block',
        transform: `rotate(${t * 540}deg)`,
      });
      set(check, { display: phase === 'done' ? 'inline-block' : 'none' });
      const pad = (n) => String(n).padStart(2, '0');
      text(
        status,
        phase === 'render'
          ? `Rendering page ${pad(page)} of ${pad(total)}`
          : phase === 'build'
            ? 'Building presentation…'
            : 'Done',
      );
      set(bar, { width: `${progress}%` });
    },
  };
}

export function fileTile(name) {
  return h(
    'div',
    {
      style: 'position:absolute;left:0;top:0;width:300px;height:380px;transform-origin:50% 50%',
    },
    h(
      'svg',
      {
        width: 300,
        height: 380,
        viewBox: '0 0 300 380',
        style: 'position:absolute;inset:0;overflow:visible',
      },
      h('path', {
        d: 'M24 0 H212 L300 88 V356 Q300 380 276 380 H24 Q0 380 0 356 V24 Q0 0 24 0 Z',
        fill: '#fbfbfb',
      }),
      h('path', { d: 'M212 0 V64 Q212 88 236 88 H300 Z', fill: '#d9d9d9' }),
    ),
    h('div', {
      text: 'PPTX',
      style: `position:absolute;left:28px;bottom:34px;padding:10px 18px;border-radius:8px;background:${C.brand};color:#fff;font-family:Geist;font-weight:800;font-size:44px;letter-spacing:-0.02em`,
    }),
    h(
      'div',
      {
        style:
          'position:absolute;left:28px;top:56px;width:180px;display:flex;flex-direction:column;gap:14px',
      },
      [150, 110, 170, 90].map((w) =>
        h('div', { style: `height:12px;width:${w}px;border-radius:6px;background:#e3e3e3` }),
      ),
    ),
    h('div', {
      text: name,
      class: 'mono',
      style:
        'position:absolute;left:50%;top:410px;transform:translateX(-50%);white-space:nowrap;font-size:26px;color:rgb(255 255 255 / 0.85)',
    }),
  );
}
