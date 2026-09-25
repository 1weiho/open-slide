import {
  type DesignSystem,
  MorphElement,
  type Page,
  type SlideMeta,
  type SlideTransition,
  Step,
  Steps,
  useIsActivePage,
  useSlidePageNumber,
} from '@open-slide/core';
import type { CSSProperties, ReactNode } from 'react';

import claudeLogo from './assets/claude.svg';
import cloudflareLogo from './assets/cloudflare.svg';
import codexLogo from './assets/codex.svg';
import cursorLogo from './assets/cursor.svg';
import geminiLogo from './assets/gemini.svg';
import opencodeLogo from './assets/opencode.svg';
import vercelLogo from './assets/vercel.svg';
import windsurfLogo from './assets/windsurf.svg';
import zeaburLogo from './assets/zeabur.svg';
import zedLogo from './assets/zed.svg';

export const design: DesignSystem = {
  palette: { bg: '#ffffff', text: '#0a0a0a', accent: '#de3b3d' },
  fonts: {
    display:
      '"Geist Variable", Geist, -apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif',
    body: '"Geist Variable", Geist, -apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif',
  },
  typeScale: { hero: 152, body: 32 },
  radius: 12,
};

const ink = {
  text: '#0a0a0a',
  soft: '#404040',
  muted: '#6b6b6b',
  dim: '#a3a3a3',
  rule: '#e4e4e4',
  hairline: '#ececec',
  panel: '#f7f7f7',
  muted2: '#efefef',
  accent: '#de3b3d',
  accentSoft: 'rgba(222, 59, 61, 0.1)',
  mint: '#1f9e6e',
  emerald: '#10b981',
  inspect: '#3b82f6',
  guide: '#06b6d4',
  laser: '#ef4444',
  kw: '#b3383a',
  str: '#8a6a24',
  num: '#1f8a63',
};

const font = {
  sans: 'var(--osd-font-body)',
  display: 'var(--osd-font-display)',
  mono: '"Geist Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
};

const shadow = {
  edge: '0 0 0 1px rgba(0, 0, 0, 0.06), 0 1px 0 rgba(0, 0, 0, 0.025)',
  floating: '0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 24px -8px rgba(0, 0, 0, 0.1)',
  window:
    '0 0 0 1px rgba(0, 0, 0, 0.07), 0 1px 2px rgba(0, 0, 0, 0.04), 0 12px 32px -12px rgba(0, 0, 0, 0.12)',
  overlay:
    '0 0 0 1px rgba(0, 0, 0, 0.08), 0 8px 28px -4px rgba(0, 0, 0, 0.14), 0 24px 64px -12px rgba(0, 0, 0, 0.16)',
};

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';
const EASE_IN_OUT = 'cubic-bezier(0.4, 0, 0.2, 1)';

export const transition: SlideTransition = {
  duration: 200,
  exit: {
    duration: 140,
    easing: EASE_IN,
    keyframes: [
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(-4px)' },
    ],
  },
  enter: {
    duration: 200,
    delay: 80,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(6px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
};

const MORPH_MS = 700;

const morphFade: SlideTransition = {
  duration: 280,
  exit: { duration: 200, easing: EASE_IN, keyframes: [{ opacity: 1 }, { opacity: 0 }] },
  enter: {
    duration: 280,
    delay: 100,
    easing: EASE_OUT,
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
  },
  morph: { duration: MORPH_MS, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
};

const S = 1.6;
const u = (n: number) => n * S;
const pad2 = (n: number) => String(n).padStart(2, '0');

const fill: CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: 'var(--osd-font-body)',
  letterSpacing: '-0.01em',
  WebkitFontSmoothing: 'antialiased',
};

// Every animated element's base style is its resting state; keyframes only
// describe where it comes from. Inactive instances (thumbnails, overview,
// the outgoing morph snapshot) set data-still and render settled.
const css = `
  .gs { animation-timing-function: ${EASE}; animation-fill-mode: both; }
  [data-still] .gs { animation: none !important; }
  @media (prefers-reduced-motion: reduce) { .gs { animation: none !important; } }
  @keyframes gs-rise { from { opacity: 0; transform: translateY(12px); } }
  @keyframes gs-rise-sm { from { opacity: 0; transform: translateY(6px); } }
  @keyframes gs-fade { from { opacity: 0; } }
  @keyframes gs-out { from { opacity: 1; } }
  @keyframes gs-bloom { from { opacity: 0; transform: translateY(6px) scale(0.98); } }
  @keyframes gs-pop { from { opacity: 0; transform: translateY(6px) scale(0.95); } }
  @keyframes gs-bar { from { opacity: 0; transform: translateY(32px) scale(0.9); filter: blur(4px); } }
  @keyframes gs-flash { 0% { opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { opacity: 0; } }
  @keyframes gs-type { from { width: 0; } }
  @keyframes gs-caret-pos { from { left: 0; } }
  @keyframes gs-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
  @keyframes gs-roll { from { transform: translateY(0); } }
  @keyframes gs-ping { 0% { transform: scale(1); opacity: 0.6; } 75%, 100% { transform: scale(2.2); opacity: 0; } }
  @keyframes gs-spin { to { transform: rotate(360deg); } }
  @keyframes gs-press { 50% { transform: scale(0.93); } }
  .gs-rise { animation-name: gs-rise; animation-duration: 0.7s; }
  .gs-rise-sm { animation-name: gs-rise-sm; animation-duration: 0.45s; }
  .gs-fade { animation-name: gs-fade; animation-duration: 0.45s; }
  .gs-out { opacity: 0; animation-name: gs-out; animation-duration: 0.2s; }
  .gs-bloom { animation-name: gs-bloom; animation-duration: 0.32s; }
  .gs-pop { animation-name: gs-pop; animation-duration: 0.28s; }
  .gs-bar { animation-name: gs-bar; animation-duration: 0.42s; }
  .gs-flash { opacity: 0; animation-name: gs-flash; }
  .gs-type { width: 100%; animation-name: gs-type; }
  .gs-caret {
    position: absolute; left: 100%; top: 0.08em; width: 0.08em; height: 1.05em; margin-left: 0.1em;
    background: currentColor; animation-name: gs-caret-pos, gs-blink; animation-iteration-count: 1, infinite;
  }
  .gs-roll { transform: translateY(-1em); animation-name: gs-roll; animation-duration: 0.4s; }
  .gs-ping {
    transform: scale(2.2); opacity: 0; animation-name: gs-ping; animation-duration: 1.6s;
    animation-timing-function: ${EASE_OUT}; animation-iteration-count: infinite;
  }
  .gs-spin { animation-name: gs-spin; animation-duration: 1s; animation-timing-function: linear; animation-iteration-count: infinite; }
  .gs-press { animation-name: gs-press; animation-duration: 0.24s; }

  @keyframes hp-word-a { 0%, 30% { opacity: 1; transform: none; } 34%, 96% { opacity: 0; transform: translateY(-0.3em); } 96.1% { opacity: 0; transform: translateY(0.3em); } 100% { opacity: 1; transform: none; } }
  @keyframes hp-word-b { 0%, 33.3% { opacity: 0; transform: translateY(0.3em); } 37.3%, 63.3% { opacity: 1; transform: none; } 67.3%, 100% { opacity: 0; transform: translateY(-0.3em); } }
  @keyframes hp-word-c { 0%, 66.6% { opacity: 0; transform: translateY(0.3em); } 70.6%, 96.6% { opacity: 1; transform: none; } 100% { opacity: 0; transform: translateY(-0.3em); } }
  .hp-a { animation-name: hp-word-a; }
  .hp-b { opacity: 0; animation-name: hp-word-b; }
  .hp-c { opacity: 0; animation-name: hp-word-c; }
  .hp-a, .hp-b, .hp-c { animation-duration: 9.6s; animation-iteration-count: infinite; animation-timing-function: ${EASE}; }

  @keyframes ve-cursor {
    0% { transform: translate(323px, -83px); }
    24% { transform: translate(-477px, -313px); animation-timing-function: ${EASE}; }
    78% { transform: translate(-477px, -313px); animation-timing-function: ${EASE}; }
    100% { transform: translate(0, 0); }
  }
  @keyframes ve-size { from { font-size: 176px; } }
  @keyframes ve-card { from { width: 565px; } }
  @keyframes ve-empty { 0%, 99% { opacity: 1; } 100% { opacity: 0; } }
  .ve-cursor { animation-name: ve-cursor; animation-duration: 3.7s; animation-timing-function: linear; animation-delay: 0.6s; }
  .ve-size { animation-name: ve-size; animation-duration: 0.45s; animation-delay: 2.5s; }

  @keyframes ar-cursor {
    0% { transform: translate(253px, 217px); }
    25% { transform: translate(0, -159px); animation-timing-function: linear; }
    45% { transform: translate(0, -159px); animation-timing-function: ${EASE_IN_OUT}; }
    75% { transform: translate(0, 0); }
    100% { transform: translate(0, 0); }
  }
  @keyframes ar-box { from { top: 160px; } }
  @keyframes ar-guide { 0% { opacity: 0; } 12% { opacity: 1; } 85% { opacity: 1; } 100% { opacity: 0; } }
  .ar-cursor { animation-name: ar-cursor; animation-duration: 3.2s; animation-timing-function: ${EASE}; animation-delay: 0.5s; }
  .ar-box { animation-name: ar-box; animation-duration: 0.96s; animation-timing-function: ${EASE_IN_OUT}; animation-delay: 1.94s; }
  .ar-guide { opacity: 0; animation-name: ar-guide; animation-duration: 1.3s; animation-timing-function: linear; animation-delay: 1.85s; }

  @keyframes cm-cursor { 0% { transform: translate(-700px, -180px); } 100% { transform: translate(0, 0); } }
  @keyframes cm-btn { 0% { opacity: 0.45; } 20%, 80% { opacity: 1; } 100% { opacity: 0.45; } }
  @keyframes cm-ph { 0%, 100% { opacity: 1; } 1%, 99% { opacity: 0; } }
  @keyframes cm-focus {
    0%, 100% { border-color: ${ink.rule}; box-shadow: 0 0 0 0 transparent; }
    2%, 98% { border-color: rgba(10, 10, 10, 0.4); box-shadow: 0 0 0 ${u(2)}px ${ink.accentSoft}; }
  }
  .cm-cursor { animation-name: cm-cursor; animation-duration: 0.7s; animation-delay: 2.4s; }
  .cm-btn { opacity: 0.45; animation-name: cm-btn; animation-duration: 0.8s; animation-timing-function: linear; animation-delay: 2.9s; }
  .cm-ph { animation-name: cm-ph; animation-duration: 2.3s; animation-timing-function: linear; animation-delay: 1.2s; }
  .cm-focus { animation-name: cm-focus; animation-duration: 2.6s; animation-timing-function: linear; animation-delay: 1s; }

  @keyframes ap-color { from { color: ${ink.text}; } }
  @keyframes ap-strike { from { opacity: 1; text-decoration-color: transparent; } }
  .ap-color { animation-name: ap-color; animation-duration: 0.6s; animation-delay: 3.4s; }
  .ap-strike { opacity: 0.4; text-decoration: line-through; text-decoration-color: ${ink.muted}; animation-name: ap-strike; animation-duration: 0.4s; animation-delay: 3.2s; }

  @keyframes as-drag { 0% { transform: translate(-640px, 300px); } 100% { transform: translate(0, 0); } }
  @keyframes as-ghost { 0% { opacity: 0; transform: scale(0.96); } 8%, 90% { opacity: 1; transform: none; } 100% { opacity: 0; transform: scale(0.9); } }
  .as-drag { animation-name: as-drag; animation-duration: 1.4s; animation-delay: 0.9s; }
  .as-ghost { opacity: 0; animation-name: as-ghost; animation-duration: 1.9s; animation-timing-function: linear; animation-delay: 0.85s; }

  @keyframes dp-cursor {
    0% { transform: translate(54px, -13px); }
    20.6% { transform: translate(495px, -137px); animation-timing-function: linear; }
    35.3% { transform: translate(495px, -137px); animation-timing-function: ${EASE_IN_OUT}; }
    52.9% { transform: translate(522px, -137px); animation-timing-function: linear; }
    82.4% { transform: translate(522px, -137px); animation-timing-function: ${EASE}; }
    100% { transform: translate(0, 0); }
  }
  @keyframes dp-range { from { width: 66.7%; } }
  @keyframes dp-thumb { from { left: 66.7%; } }
  .dp-cursor { animation-name: dp-cursor; animation-duration: 3.4s; animation-timing-function: ${EASE}; animation-delay: 0.6s; }
  .dp-range { width: 79.2%; animation-name: dp-range; animation-duration: 0.6s; animation-timing-function: ${EASE_IN_OUT}; animation-delay: 1.8s; }
  .dp-thumb { left: 79.2%; animation-name: dp-thumb; animation-duration: 0.6s; animation-timing-function: ${EASE_IN_OUT}; animation-delay: 1.8s; }

  @keyframes mo-a { 0%, 44% { opacity: 1; transform: none; } 50%, 94% { opacity: 0; transform: translateY(-4px); } 94.1% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: none; } }
  @keyframes mo-b { 0%, 44% { opacity: 0; transform: translateY(6px); } 50%, 94% { opacity: 1; transform: none; } 100% { opacity: 0; transform: translateY(-4px); } }
  .mo-a { animation-name: mo-a; }
  .mo-b { opacity: 0; animation-name: mo-b; }
  .mo-a, .mo-b { animation-duration: 3.2s; animation-iteration-count: infinite; animation-timing-function: ${EASE_OUT}; }

  @keyframes pr-laser { 0% { transform: translate(-360px, -20px); } 100% { transform: translate(0, 0); } }
  @keyframes pr-progress { from { transform: scaleX(0.1667); } }
  .pr-laser { animation-name: pr-laser; animation-duration: 1.6s; animation-timing-function: ${EASE_IN_OUT}; animation-delay: 2s; }
  .pr-progress { transform: scaleX(0.3333); transform-origin: left; animation-name: pr-progress; animation-duration: 0.2s; animation-delay: 1.4s; }

  @keyframes ex-cursor { 0% { transform: translate(-260px, 220px); } 100% { transform: translate(0, 0); } }
  .ex-cursor { animation-name: ex-cursor; animation-duration: 0.9s; animation-delay: 0.7s; }
`;

const Styles = () => <style>{css}</style>;

const ICONS = {
  'chevron-left': <path d="m15 18-6-6 6-6" />,
  'chevron-right': <path d="m9 18 6-6-6-6" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  'chevron-up': <path d="m18 15-6-6-6 6" />,
  eye: (
    <>
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  pencil: (
    <>
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
      <path d="m15 5 4 4" />
    </>
  ),
  link: (
    <>
      <path d="M9 17H7A5 5 0 0 1 7 7h2" />
      <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
      <line x1="8" x2="16" y1="12" y2="12" />
    </>
  ),
  download: (
    <>
      <path d="M12 15V3" />
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
    </>
  ),
  palette: (
    <>
      <path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z" />
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    </>
  ),
  'panel-right': (
    <>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M15 3v18" />
    </>
  ),
  play: (
    <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
  ),
  type: (
    <>
      <path d="M12 4v16" />
      <path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2" />
      <path d="M9 20h6" />
    </>
  ),
  move: (
    <>
      <path d="M12 2v20" />
      <path d="m15 19-3 3-3-3" />
      <path d="m19 9 3 3-3 3" />
      <path d="M2 12h20" />
      <path d="m5 9-3 3 3 3" />
      <path d="m9 5 3-3 3 3" />
    </>
  ),
  bold: <path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" />,
  italic: (
    <>
      <line x1="19" x2="10" y1="4" y2="4" />
      <line x1="14" x2="5" y1="20" y2="20" />
      <line x1="15" x2="9" y1="4" y2="20" />
    </>
  ),
  'align-left': (
    <>
      <path d="M21 5H3" />
      <path d="M15 12H3" />
      <path d="M17 19H3" />
    </>
  ),
  'align-center': (
    <>
      <path d="M21 5H3" />
      <path d="M17 12H7" />
      <path d="M19 19H5" />
    </>
  ),
  'align-right': (
    <>
      <path d="M21 5H3" />
      <path d="M21 12H9" />
      <path d="M21 19H7" />
    </>
  ),
  'align-justify': (
    <>
      <path d="M3 5h18" />
      <path d="M3 12h18" />
      <path d="M3 19h18" />
    </>
  ),
  'unfold-vertical': (
    <>
      <path d="M12 22v-6" />
      <path d="M12 8V2" />
      <path d="M4 12H2" />
      <path d="M10 12H8" />
      <path d="M16 12h-2" />
      <path d="M22 12h-2" />
      <path d="m15 19-3 3-3-3" />
      <path d="m15 5-3-3-3 3" />
    </>
  ),
  'move-horizontal': (
    <>
      <path d="m18 8 4 4-4 4" />
      <path d="M2 12h20" />
      <path d="m6 8-4 4 4 4" />
    </>
  ),
  'a-large-small': (
    <>
      <path d="m15 16 2.536-7.328a1.02 1.02 1 0 1 1.928 0L22 16" />
      <path d="M15.697 14h5.606" />
      <path d="m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16" />
      <path d="M3.304 13h6.392" />
    </>
  ),
  x: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  'pencil-line': (
    <>
      <path d="M13 21h8" />
      <path d="m15 5 4 4" />
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
    </>
  ),
  'message-square': (
    <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />
  ),
  undo: (
    <>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />
    </>
  ),
  redo: (
    <>
      <path d="m15 14 5-5-5-5" />
      <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13" />
    </>
  ),
  save: (
    <>
      <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
      <path d="M7 3v4a1 1 0 0 0 1 1h7" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  search: (
    <>
      <path d="m21 21-4.34-4.34" />
      <circle cx="11" cy="11" r="8" />
    </>
  ),
  upload: (
    <>
      <path d="M12 3v12" />
      <path d="m17 8-5-5-5 5" />
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    </>
  ),
  'layout-grid': (
    <>
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </>
  ),
  list: (
    <>
      <path d="M3 5h.01" />
      <path d="M3 12h.01" />
      <path d="M3 19h.01" />
      <path d="M8 5h13" />
      <path d="M8 12h13" />
      <path d="M8 19h13" />
    </>
  ),
  'grid-2x2': (
    <>
      <path d="M12 3v18" />
      <path d="M3 12h18" />
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </>
  ),
  crosshair: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="22" x2="18" y1="12" y2="12" />
      <line x1="6" x2="2" y1="12" y2="12" />
      <line x1="12" x2="12" y1="6" y2="2" />
      <line x1="12" x2="12" y1="22" y2="18" />
    </>
  ),
  square: <rect width="18" height="18" x="3" y="3" rx="2" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </>
  ),
  keyboard: (
    <>
      <path d="M10 8h.01" />
      <path d="M12 12h.01" />
      <path d="M14 8h.01" />
      <path d="M16 12h.01" />
      <path d="M18 8h.01" />
      <path d="M6 8h.01" />
      <path d="M7 16h10" />
      <path d="M8 12h.01" />
      <rect width="20" height="16" x="2" y="4" rx="2" />
    </>
  ),
  'monitor-speaker': (
    <>
      <path d="M5.5 20H8" />
      <path d="M17 9h.01" />
      <rect width="10" height="16" x="12" y="4" rx="2" />
      <path d="M8 6H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4" />
      <circle cx="17" cy="15" r="1" />
    </>
  ),
  maximize: (
    <>
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </>
  ),
  'log-out': (
    <>
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    </>
  ),
  pointer: (
    <path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z" />
  ),
  image: (
    <>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </>
  ),
  shuffle: (
    <>
      <path d="m18 14 4 4-4 4" />
      <path d="m18 2 4 4-4 4" />
      <path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22" />
      <path d="M2 6h1.972a4 4 0 0 1 3.6 2.2" />
      <path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45" />
    </>
  ),
  'arrow-down-to-line': (
    <>
      <path d="M12 17V3" />
      <path d="m6 11 6 6 6-6" />
      <path d="M19 21H5" />
    </>
  ),
  'columns-3': (
    <>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
      <path d="M15 3v18" />
    </>
  ),
  'arrow-up-down': (
    <>
      <path d="m21 16-4 4-4-4" />
      <path d="M17 20V4" />
      <path d="m3 8 4-4 4 4" />
      <path d="M7 4v16" />
    </>
  ),
  'file-text': (
    <>
      <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
      <path d="M14 2v5a1 1 0 0 0 1 1h5" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </>
  ),
  'file-code': (
    <>
      <path d="M4 12.15V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2h-3.35" />
      <path d="M14 2v5a1 1 0 0 0 1 1h5" />
      <path d="m5 16-3 3 3 3" />
      <path d="m9 22 3-3-3-3" />
    </>
  ),
  'file-image': (
    <>
      <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
      <path d="M14 2v5a1 1 0 0 0 1 1h5" />
      <circle cx="10" cy="12" r="2" />
      <path d="m20 17-1.296-1.296a2.41 2.41 0 0 0-3.408 0L9 22" />
    </>
  ),
  presentation: (
    <>
      <path d="M2 3h20" />
      <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" />
      <path d="m7 21 5-5 5 5" />
    </>
  ),
  'rotate-cw': (
    <>
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </>
  ),
  paintbrush: (
    <>
      <path d="m14.622 17.897-10.68-2.913" />
      <path d="M18.376 2.622a1 1 0 1 1 3.002 3.002L17.36 9.643a.5.5 0 0 0 0 .707l.944.944a2.41 2.41 0 0 1 0 3.408l-.944.944a.5.5 0 0 1-.707 0L8.354 7.348a.5.5 0 0 1 0-.707l.944-.944a2.41 2.41 0 0 1 3.408 0l.944.944a.5.5 0 0 0 .707 0z" />
      <path d="M9 8c-1.804 2.71-3.97 3.46-6.583 3.948a.507.507 0 0 0-.302.819l7.32 8.883a1 1 0 0 0 1.185.204C12.735 20.405 16 16.792 16 15" />
    </>
  ),
  magnet: (
    <>
      <path d="m12 15 4 4" />
      <path d="M2.352 10.648a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l6.029-6.029a1 1 0 1 1 3 3l-6.029 6.029a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l6.365-6.367A1 1 0 0 0 8.716 4.282z" />
      <path d="m5 8 4 4" />
    </>
  ),
  'bring-to-front': (
    <>
      <rect x="8" y="8" width="8" height="8" rx="2" />
      <path d="M4 10a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2" />
      <path d="M14 20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2" />
    </>
  ),
  'send-to-back': (
    <>
      <rect x="14" y="14" width="8" height="8" rx="2" />
      <rect x="2" y="2" width="8" height="8" rx="2" />
      <path d="M7 14v1a2 2 0 0 0 2 2h1" />
      <path d="M14 7h1a2 2 0 0 1 2 2v1" />
    </>
  ),
  'arrow-up': (
    <>
      <path d="m5 12 7-7 7 7" />
      <path d="M12 19V5" />
    </>
  ),
  'arrow-down': (
    <>
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </>
  ),
  'corner-left-up': (
    <>
      <path d="M14 9 9 4 4 9" />
      <path d="M20 20h-7a4 4 0 0 1-4-4V4" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </>
  ),
  'align-h-start': (
    <>
      <rect width="6" height="14" x="6" y="5" rx="2" />
      <rect width="6" height="10" x="16" y="7" rx="2" />
      <path d="M2 2v20" />
    </>
  ),
  'align-h-center': (
    <>
      <rect width="6" height="14" x="2" y="5" rx="2" />
      <rect width="6" height="10" x="16" y="7" rx="2" />
      <path d="M12 2v20" />
    </>
  ),
  'align-h-end': (
    <>
      <rect width="6" height="14" x="2" y="5" rx="2" />
      <rect width="6" height="10" x="12" y="7" rx="2" />
      <path d="M22 2v20" />
    </>
  ),
  'align-v-start': (
    <>
      <rect width="14" height="6" x="5" y="16" rx="2" />
      <rect width="10" height="6" x="7" y="6" rx="2" />
      <path d="M2 2h20" />
    </>
  ),
  'align-v-center': (
    <>
      <rect width="14" height="6" x="5" y="16" rx="2" />
      <rect width="10" height="6" x="7" y="2" rx="2" />
      <path d="M2 12h20" />
    </>
  ),
  'align-v-end': (
    <>
      <rect width="14" height="6" x="5" y="12" rx="2" />
      <rect width="10" height="6" x="7" y="2" rx="2" />
      <path d="M2 22h20" />
    </>
  ),
  ellipsis: (
    <>
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </>
  ),
  trash: (
    <>
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  ),
  loader: <path d="M21 12a9 9 0 1 1-6.219-8.56" />,
  'mouse-pointer': (
    <path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z" />
  ),
  'arrow-right': (
    <>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </>
  ),
};

type IconName = keyof typeof ICONS;

const Icon = ({
  name,
  size = 14,
  stroke = 2,
  fill = 'none',
  className,
  style,
}: {
  name: IconName;
  size?: number;
  stroke?: number;
  fill?: string;
  className?: string;
  style?: CSSProperties;
}) => (
  <svg
    className={className}
    width={u(size)}
    height={u(size)}
    viewBox="0 0 24 24"
    fill={fill}
    stroke="currentColor"
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, display: 'block', ...style }}
  >
    {ICONS[name]}
  </svg>
);

const Mark = () => (
  <MorphElement id="mark">
    <div
      style={{
        position: 'absolute',
        left: 120,
        top: 101,
        width: 16,
        height: 16,
        borderRadius: 4,
        background: 'var(--osd-accent)',
      }}
    />
  </MorphElement>
);

const Footer = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      className="gs gs-fade"
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        bottom: 88,
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: font.mono,
        fontSize: 20,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: ink.muted,
        animationDelay: '0.3s',
      }}
    >
      <span>open-slide · getting started</span>
      <span>
        {pad2(current)} / {pad2(total)}
      </span>
    </div>
  );
};

const Frame = ({
  eyebrow,
  title,
  lead,
  mark = true,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  mark?: boolean;
  children: ReactNode;
}) => {
  const active = useIsActivePage();
  return (
    <div style={fill} data-still={active ? undefined : ''}>
      <Styles />
      {mark && <Mark />}
      <div
        className="gs gs-rise"
        style={{
          position: 'absolute',
          left: mark ? 148 : 120,
          top: 96,
          fontSize: 22,
          lineHeight: '26px',
          fontWeight: 500,
          color: 'var(--osd-accent)',
        }}
      >
        {eyebrow}
      </div>
      <h2
        className="gs gs-rise"
        style={{
          position: 'absolute',
          left: 120,
          top: 138,
          margin: 0,
          fontFamily: font.display,
          fontSize: 64,
          fontWeight: 500,
          letterSpacing: '-0.03em',
          lineHeight: 1.06,
          animationDelay: '0.06s',
        }}
      >
        {title}
      </h2>
      {lead && (
        <p
          className="gs gs-rise"
          style={{
            position: 'absolute',
            left: 120,
            top: 224,
            margin: 0,
            maxWidth: 1240,
            fontSize: 26,
            lineHeight: 1.45,
            color: ink.soft,
            animationDelay: '0.12s',
          }}
        >
          {lead}
        </p>
      )}
      <div
        style={{ position: 'absolute', left: 120, right: 120, top: lead ? 316 : 280, bottom: 160 }}
      >
        {children}
      </div>
      <Footer />
    </div>
  );
};

const Dots = () => (
  <span style={{ display: 'flex', gap: 8, width: 49 }}>
    <span style={{ width: 11, height: 11, borderRadius: '50%', background: ink.rule }} />
    <span style={{ width: 11, height: 11, borderRadius: '50%', background: ink.rule }} />
    <span style={{ width: 11, height: 11, borderRadius: '50%', background: ink.rule }} />
  </span>
);

const Window = ({
  title,
  right,
  children,
  className,
  delay = 0,
  style,
  bodyStyle,
}: {
  title: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  delay?: number;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
}) => (
  <div
    className={className}
    style={{
      display: 'flex',
      flexDirection: 'column',
      background: '#fff',
      borderRadius: 12,
      boxShadow: shadow.window,
      overflow: 'hidden',
      animationDelay: `${delay}s`,
      ...style,
    }}
  >
    <div
      style={{
        height: 52,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        borderBottom: `1px solid ${ink.hairline}`,
        fontFamily: font.mono,
        fontSize: 17,
        color: ink.muted,
      }}
    >
      <Dots />
      <span style={{ flex: 1, textAlign: 'center', letterSpacing: '0.01em' }}>{title}</span>
      <span
        style={{
          minWidth: 49,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontSize: 14,
          whiteSpace: 'nowrap',
        }}
      >
        {right}
      </span>
    </div>
    <div style={{ flex: 1, minHeight: 0, position: 'relative', ...bodyStyle }}>{children}</div>
  </div>
);

const Typed = ({
  text,
  delay,
  speed = 0.045,
  color,
  caret = true,
}: {
  text: string;
  delay: number;
  speed?: number;
  color?: string;
  caret?: boolean;
}) => {
  const dur = Math.max(0.3, text.length * speed);
  const steps = `steps(${text.length}, end)`;
  return (
    <span style={{ position: 'relative', display: 'inline-block', whiteSpace: 'pre', color }}>
      <span style={{ visibility: 'hidden' }}>{text}</span>
      <span
        className="gs gs-type"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          overflow: 'hidden',
          whiteSpace: 'pre',
          animationDelay: `${delay}s`,
          animationDuration: `${dur}s`,
          animationTimingFunction: steps,
        }}
      >
        {text}
      </span>
      {caret && (
        <span
          className="gs gs-caret"
          style={{
            animationDelay: `${delay}s, 0s`,
            animationDuration: `${dur}s, 1.05s`,
            animationTimingFunction: `${steps}, steps(1, end)`,
          }}
        />
      )}
    </span>
  );
};

const Roll = ({
  from,
  to,
  delay,
  style,
}: {
  from: ReactNode;
  to: ReactNode;
  delay: number;
  style?: CSSProperties;
}) => (
  <span
    style={{
      display: 'inline-block',
      overflow: 'hidden',
      height: '1em',
      lineHeight: '1em',
      verticalAlign: '-0.08em',
      ...style,
    }}
  >
    <span
      className="gs gs-roll"
      style={{ display: 'flex', flexDirection: 'column', animationDelay: `${delay}s` }}
    >
      <span style={{ height: '1em', lineHeight: '1em' }}>{from}</span>
      <span style={{ height: '1em', lineHeight: '1em' }}>{to}</span>
    </span>
  </span>
);

const Cursor = ({
  className,
  left,
  top,
  press = [],
}: {
  className?: string;
  left: number;
  top: number;
  press?: number[];
}) => (
  <div
    className={className}
    style={{ position: 'absolute', left, top, zIndex: 20, pointerEvents: 'none' }}
  >
    <svg
      className={press.length === 0 ? undefined : 'gs'}
      width={u(20)}
      height={u(20)}
      viewBox="0 0 24 24"
      style={{
        display: 'block',
        filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
        animationName: press.map(() => 'gs-press').join(', '),
        animationDuration: press.map(() => '0.24s').join(', '),
        animationDelay: press.map((p) => `${p}s`).join(', '),
      }}
    >
      <path
        d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"
        fill="#0a0a0a"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

const Line = ({
  delay,
  children,
  style,
  className = 'gs gs-fade',
}: {
  delay: number;
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}) => (
  <div
    className={className}
    style={{ minHeight: '1.6em', whiteSpace: 'pre', animationDelay: `${delay}s`, ...style }}
  >
    {children ?? ' '}
  </div>
);

const K = ({ children }: { children: ReactNode }) => (
  <span style={{ color: ink.kw }}>{children}</span>
);
const Str = ({ children }: { children: ReactNode }) => (
  <span style={{ color: ink.str }}>{children}</span>
);
const Tag = ({ children }: { children: ReactNode }) => (
  <span style={{ color: ink.accent }}>{children}</span>
);
const P = ({ children }: { children: ReactNode }) => (
  <span style={{ color: ink.dim }}>{children}</span>
);
const N = ({ children }: { children: ReactNode }) => (
  <span style={{ color: ink.num }}>{children}</span>
);
const Dim = ({ children }: { children: ReactNode }) => (
  <span style={{ color: ink.muted }}>{children}</span>
);
const Prompt = () => <span style={{ color: ink.accent }}>$ </span>;
const Chevron = () => <span style={{ color: ink.accent }}>› </span>;
const Ok = () => <span style={{ color: ink.mint }}>✓ </span>;

const term: CSSProperties = {
  padding: '32px 40px',
  fontFamily: font.mono,
  fontSize: 23,
  lineHeight: 1.6,
  color: ink.soft,
};

const Live = () => (
  <>
    <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
      <span
        className="gs gs-ping"
        style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: ink.accent }}
      />
      <span
        style={{
          position: 'relative',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: ink.accent,
        }}
      />
    </span>
    live
  </>
);

const MiniCanvas = ({
  scale,
  children,
  style,
}: {
  scale: number;
  children: ReactNode;
  style?: CSSProperties;
}) => (
  <div
    style={{
      width: 1920 * scale,
      height: 1080 * scale,
      position: 'relative',
      overflow: 'hidden',
      background: '#fff',
      color: ink.text,
      ...style,
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 1920,
        height: 1080,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        fontFamily: font.sans,
      }}
    >
      {children}
    </div>
  </div>
);

const HANDLES: [number, number][] = [
  [0, 0],
  [0.5, 0],
  [1, 0],
  [1, 0.5],
  [1, 1],
  [0.5, 1],
  [0, 1],
  [0, 0.5],
];

// k converts editor-mock pixels into the coordinate space of a scaled mini
// slide, so frames and handles keep their on-screen size at any scale.
const SelectionFrame = ({
  k,
  rotate = true,
  className,
  style,
}: {
  k: number;
  rotate?: boolean;
  className?: string;
  style?: CSSProperties;
}) => {
  const handle: CSSProperties = {
    position: 'absolute',
    width: 12 * k,
    height: 12 * k,
    marginLeft: -6 * k,
    marginTop: -6 * k,
    borderRadius: 2 * k,
    border: `${k}px solid ${ink.inspect}`,
    background: '#fff',
    boxShadow: `0 ${k}px ${2 * k}px rgba(0, 0, 0, 0.08)`,
    boxSizing: 'border-box',
  };
  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        border: `${k}px solid ${ink.inspect}`,
        pointerEvents: 'none',
        ...style,
      }}
    >
      {rotate && (
        <>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: -24 * k,
              width: k,
              height: 24 * k,
              background: ink.inspect,
            }}
          />
          <div style={{ ...handle, left: '50%', top: -28 * k, borderRadius: '50%' }} />
        </>
      )}
      {HANDLES.map(([x, y]) => (
        <div key={`${x}-${y}`} style={{ ...handle, left: `${x * 100}%`, top: `${y * 100}%` }} />
      ))}
    </div>
  );
};

const miniEyebrow: CSSProperties = {
  position: 'absolute',
  left: 160,
  top: 160,
  fontFamily: font.mono,
  fontSize: 26,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: ink.muted,
};

const miniTitle: CSSProperties = {
  position: 'absolute',
  left: 160,
  top: 300,
  margin: 0,
  fontSize: 120,
  fontWeight: 600,
  letterSpacing: '-0.035em',
  lineHeight: 1,
};

const MiniFooter = ({ n }: { n: number }) => (
  <div
    style={{
      position: 'absolute',
      left: 160,
      right: 160,
      bottom: 140,
      display: 'flex',
      justifyContent: 'space-between',
      fontFamily: font.mono,
      fontSize: 24,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: ink.dim,
    }}
  >
    <span>acme · product</span>
    <span>{pad2(n)} / 06</span>
  </div>
);

const Q2Cover = ({
  titleColor,
  titleClass,
  titleSize = 176,
  k = 1,
  frame = false,
  children,
}: {
  titleColor?: string;
  titleClass?: string;
  titleSize?: number;
  k?: number;
  frame?: boolean;
  children?: ReactNode;
}) => (
  <div style={{ position: 'absolute', inset: 0 }}>
    <div style={miniEyebrow}>Cover</div>
    <div style={{ position: 'absolute', left: 160, top: 420 }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <div
          className={titleClass}
          style={{
            fontSize: titleSize,
            fontWeight: 600,
            letterSpacing: '-0.035em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            color: titleColor ?? ink.text,
          }}
        >
          Q2 Launch
        </div>
        {frame && <SelectionFrame k={k} />}
      </div>
      <div
        style={{ marginTop: 32, fontSize: 44, lineHeight: 1.35, color: ink.soft, maxWidth: 1000 }}
      >
        What we're shipping, why it matters.
      </div>
    </div>
    {children}
    <MiniFooter n={1} />
  </div>
);

const MiniRow = ({ n, children }: { n: string; children: ReactNode }) => (
  <div
    style={{
      display: 'flex',
      gap: 40,
      alignItems: 'baseline',
      padding: '24px 0',
      borderTop: `1px solid ${ink.rule}`,
      fontSize: 44,
    }}
  >
    <span style={{ fontFamily: font.mono, fontSize: 28, color: ink.accent }}>{n}</span>
    <span>{children}</span>
  </div>
);

const MiniStat = ({ value, label }: { value: string; label: string }) => (
  <div>
    <div style={{ fontSize: 160, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1 }}>
      {value}
    </div>
    <div style={{ marginTop: 20, fontSize: 36, color: ink.muted }}>{label}</div>
  </div>
);

type MiniKind = 'cover' | 'agenda' | 'problem' | 'solution' | 'metrics' | 'next';

const MiniPage = ({ kind }: { kind: MiniKind }) => {
  if (kind === 'cover') return <Q2Cover />;
  if (kind === 'agenda') {
    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div style={miniEyebrow}>Agenda</div>
        <h1 style={miniTitle}>What's inside</h1>
        <div style={{ position: 'absolute', left: 160, right: 160, top: 500 }}>
          <MiniRow n="01">The problem</MiniRow>
          <MiniRow n="02">Our solution</MiniRow>
          <MiniRow n="03">Metrics</MiniRow>
          <MiniRow n="04">What's next</MiniRow>
        </div>
        <MiniFooter n={2} />
      </div>
    );
  }
  if (kind === 'problem') {
    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div style={miniEyebrow}>Problem</div>
        <div
          style={{
            position: 'absolute',
            left: 160,
            top: 340,
            fontSize: 320,
            fontWeight: 600,
            letterSpacing: '-0.05em',
            lineHeight: 1,
            color: ink.accent,
          }}
        >
          3×
        </div>
        <div style={{ position: 'absolute', left: 160, top: 720, fontSize: 48, color: ink.soft }}>
          slower onboarding than our fastest competitor.
        </div>
        <MiniFooter n={3} />
      </div>
    );
  }
  if (kind === 'solution') {
    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div style={miniEyebrow}>Solution</div>
        <h1 style={{ ...miniTitle, top: 440, width: 760 }}>One flow, three clicks.</h1>
        <div
          style={{
            position: 'absolute',
            left: 1080,
            top: 260,
            width: 680,
            height: 560,
            borderRadius: 24,
            background: ink.panel,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: ink.dim,
          }}
        >
          <svg
            width="96"
            height="96"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            {ICONS.image}
          </svg>
        </div>
        <MiniFooter n={4} />
      </div>
    );
  }
  if (kind === 'metrics') {
    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div style={miniEyebrow}>Metrics</div>
        <div
          style={{
            position: 'absolute',
            left: 160,
            right: 160,
            top: 400,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 40,
          }}
        >
          <MiniStat value="+38%" label="activation" />
          <MiniStat value="12k" label="weekly actives" />
          <MiniStat value="4.9" label="app rating" />
        </div>
        <MiniFooter n={5} />
      </div>
    );
  }
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div style={miniEyebrow}>Next</div>
      <h1 style={miniTitle}>What's next</h1>
      <div style={{ position: 'absolute', left: 160, right: 160, top: 500 }}>
        <MiniRow n="→">Ship the beta in May</MiniRow>
        <MiniRow n="→">Open the waitlist</MiniRow>
        <MiniRow n="→">Measure, then scale</MiniRow>
      </div>
      <MiniFooter n={6} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Editor chrome. Sizes are core's real pixel values passed through u(), so
// the mock keeps the editor's proportions at 1.6× on the canvas.

const Eyebrow11 = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <span
    style={{
      fontSize: u(11),
      fontWeight: 500,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: ink.muted,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </span>
);

const Folio = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <span
    style={{
      fontFamily: font.mono,
      fontSize: u(10.5),
      letterSpacing: '0.08em',
      color: ink.muted,
      fontVariantNumeric: 'tabular-nums',
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </span>
);

const GhostIcon = ({
  name,
  size = 16,
  active = false,
  dim = false,
  box = 28,
  style,
}: {
  name: IconName;
  size?: number;
  active?: boolean;
  dim?: boolean;
  box?: number;
  style?: CSSProperties;
}) => (
  <span
    style={{
      display: 'inline-flex',
      width: u(box),
      height: u(box),
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: u(5),
      color: active ? ink.text : 'rgba(10, 10, 10, 0.75)',
      background: active ? ink.muted2 : 'transparent',
      opacity: dim ? 0.45 : 1,
      flexShrink: 0,
      ...style,
    }}
  >
    <Icon name={name} size={size} />
  </span>
);

const Divider = ({ height = 20 }: { height?: number }) => (
  <span
    style={{
      width: 1,
      height: u(height),
      background: ink.hairline,
      margin: `0 ${u(2)}px`,
      flexShrink: 0,
    }}
  />
);

const TabsMock = ({ items, active }: { items: string[]; active: number }) => (
  <span
    style={{
      display: 'inline-flex',
      height: u(28),
      padding: u(2),
      borderRadius: u(6),
      background: 'rgba(10, 10, 10, 0.045)',
      boxShadow: 'inset 0 0 0 1px rgba(10, 10, 10, 0.05)',
      boxSizing: 'border-box',
      flexShrink: 0,
    }}
  >
    {items.map((label, i) => (
      <span
        key={label}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          height: u(24) - 1,
          padding: `0 ${u(10)}px`,
          borderRadius: u(5),
          fontSize: u(12),
          fontWeight: 500,
          color: i === active ? ink.text : 'rgba(10, 10, 10, 0.55)',
          background: i === active ? '#fff' : 'transparent',
          boxShadow: i === active ? shadow.edge : 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    ))}
  </span>
);

const Switcher = ({ index, icons }: { index: number; icons: [IconName, IconName] }) => (
  <span
    style={{
      position: 'relative',
      display: 'inline-flex',
      height: u(32),
      padding: u(2),
      borderRadius: u(8),
      border: '1px solid rgba(10, 10, 10, 0.07)',
      background: 'rgba(10, 10, 10, 0.04)',
      boxSizing: 'border-box',
      flexShrink: 0,
    }}
  >
    <span
      style={{
        position: 'absolute',
        top: u(2),
        left: u(2) + index * u(32),
        width: u(32),
        height: u(32) - 2 - u(4),
        borderRadius: u(6),
        background: '#fff',
        boxShadow: shadow.edge,
      }}
    />
    {icons.map((name, i) => (
      <span
        key={name}
        style={{
          position: 'relative',
          display: 'inline-flex',
          width: u(32),
          alignItems: 'center',
          justifyContent: 'center',
          color: i === index ? ink.text : ink.muted,
        }}
      >
        <Icon name={name} size={14} />
      </span>
    ))}
  </span>
);

type BtnVariant = 'ghost' | 'secondary' | 'default' | 'brand' | 'outline';

const btnVariants: Record<BtnVariant, CSSProperties> = {
  ghost: { color: 'rgba(10, 10, 10, 0.75)' },
  secondary: { background: '#f4f4f4', color: ink.text },
  default: {
    background: ink.text,
    color: '#fff',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 1px 0 rgba(0, 0, 0, 0.12)',
  },
  brand: {
    background: ink.accent,
    color: '#fff',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 1px 0 rgba(0, 0, 0, 0.16)',
  },
  outline: { background: '#fff', color: ink.text, border: `1px solid ${ink.rule}` },
};

const Btn = ({
  variant = 'ghost',
  size = 'sm',
  children,
  className,
  style,
}: {
  variant?: BtnVariant;
  size?: 'xs' | 'sm' | 'default';
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) => (
  <span
    className={className}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: u(6),
      height: size === 'xs' ? u(24) : size === 'sm' ? u(28) : u(32),
      padding: `0 ${size === 'xs' ? u(8) : size === 'sm' ? u(10) : u(12)}px`,
      borderRadius: u(5),
      fontSize: size === 'xs' ? u(11.5) : size === 'sm' ? u(12) : u(13),
      fontWeight: 500,
      whiteSpace: 'nowrap',
      flexShrink: 0,
      boxSizing: 'border-box',
      ...btnVariants[variant],
      ...style,
    }}
  >
    {children}
  </span>
);

const Kbd = ({ children }: { children: ReactNode }) => (
  <span
    style={{
      marginLeft: u(4),
      borderRadius: u(3),
      background: 'rgba(10, 10, 10, 0.1)',
      padding: `0 ${u(4)}px`,
      fontFamily: font.mono,
      fontSize: u(9.5),
      letterSpacing: '0.04em',
      lineHeight: `${u(14)}px`,
    }}
  >
    {children}
  </span>
);

const PingDot = ({ size = 6, color = ink.emerald }: { size?: number; color?: string }) => (
  <span style={{ position: 'relative', display: 'inline-flex', width: u(size), height: u(size) }}>
    <span
      className="gs gs-ping"
      style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color }}
    />
    <span
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        background: color,
      }}
    />
  </span>
);

const AgentBadge = ({ label }: { label: string }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: u(6),
      height: u(20),
      padding: `0 ${u(6)}px`,
      borderRadius: u(3),
      border: `1px solid ${ink.hairline}`,
      background: '#fff',
      fontSize: u(10.5),
      color: 'rgba(10, 10, 10, 0.85)',
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
    }}
  >
    <PingDot />
    {label}
  </span>
);

const EditorHeader = ({
  view,
  mode,
  title,
  compact,
  designActive,
  formatActive,
  downloadOpen,
}: {
  view: 'slides' | 'assets';
  mode: 'preview' | 'edit';
  title: string;
  compact: boolean;
  designActive: boolean;
  formatActive: boolean;
  downloadOpen: boolean;
}) => {
  const slides = view === 'slides';
  return (
    <header
      style={{
        height: u(48),
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        padding: `0 ${u(12)}px`,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: u(8) }}>
        <GhostIcon name="chevron-left" size={16} />
        <Divider />
        <TabsMock items={['Slides', 'Assets']} active={slides ? 0 : 1} />
        {!compact && <AgentBadge label="Agent connected" />}
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <span style={{ fontSize: u(13.5), fontWeight: 600, letterSpacing: '-0.01em' }}>
          {title}
        </span>
      </div>
      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: u(4),
          position: 'relative',
        }}
      >
        {slides && <Switcher index={mode === 'edit' ? 1 : 0} icons={['eye', 'pencil']} />}
        {slides && <Divider />}
        {slides && !compact && <GhostIcon name="link" size={16} />}
        {slides && (!compact || downloadOpen) && (
          <GhostIcon name="download" size={16} active={downloadOpen} />
        )}
        {slides && (
          <Btn variant={designActive ? 'default' : 'ghost'}>
            <Icon name="palette" size={14} />
            {!compact && (
              <>
                Design
                <Kbd>D</Kbd>
              </>
            )}
          </Btn>
        )}
        {slides && (
          <Btn variant={formatActive ? 'secondary' : 'ghost'}>
            <Icon name="panel-right" size={14} />
            {!compact && 'Format'}
          </Btn>
        )}
        {slides && <Divider />}
        {slides && (
          <span style={{ display: 'inline-flex' }}>
            <Btn
              variant="brand"
              style={{
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
                padding: `0 ${u(12)}px`,
              }}
            >
              <Icon name="play" size={14} fill="currentColor" />
              {!compact && 'Present'}
            </Btn>
            <Btn
              variant="brand"
              style={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                padding: `0 ${u(6)}px`,
                boxShadow:
                  'inset 1px 0 0 rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 1px 0 rgba(0, 0, 0, 0.16)',
              }}
            >
              <Icon name="chevron-down" size={14} />
            </Btn>
          </span>
        )}
      </div>
    </header>
  );
};

const Editor = ({
  view = 'slides',
  mode = 'preview',
  title = 'Q2 Launch',
  compact = false,
  designActive = false,
  formatActive = false,
  downloadOpen = false,
  zoom = 1,
  width,
  height,
  rail,
  panel,
  children,
  className,
  delay = 0,
}: {
  view?: 'slides' | 'assets';
  mode?: 'preview' | 'edit';
  title?: string;
  compact?: boolean;
  designActive?: boolean;
  formatActive?: boolean;
  downloadOpen?: boolean;
  zoom?: number;
  width: number;
  height: number;
  rail?: ReactNode;
  panel?: ReactNode;
  children?: ReactNode;
  className?: string;
  delay?: number;
}) => (
  <div
    className={className}
    style={{
      width,
      height,
      borderRadius: 12,
      boxShadow: shadow.window,
      overflow: 'hidden',
      position: 'relative',
      animationDelay: `${delay}s`,
    }}
  >
    <div
      style={{
        width: width / zoom,
        height: height / zoom,
        transform: `scale(${zoom})`,
        transformOrigin: 'top left',
        display: 'flex',
        flexDirection: 'column',
        background: ink.panel,
        fontFamily: font.sans,
        color: ink.text,
        letterSpacing: '-0.005em',
      }}
    >
      <EditorHeader
        view={view}
        mode={mode}
        title={title}
        compact={compact}
        designActive={designActive}
        formatActive={formatActive}
        downloadOpen={downloadOpen}
      />
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {rail}
        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>{children}</div>
        {panel}
      </div>
    </div>
  </div>
);

const THUMB_W = u(120);
const THUMB_H = (THUMB_W * 9) / 16;
const RAIL_PAGES: MiniKind[] = ['cover', 'agenda', 'problem', 'solution', 'metrics', 'next'];

const Rail = ({ current = 0, streamFrom }: { current?: number; streamFrom?: number }) => (
  <aside
    style={{
      width: u(200),
      flexShrink: 0,
      padding: `0 ${u(12)}px`,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${u(12)}px ${u(4)}px ${u(6)}px`,
      }}
    >
      <Eyebrow11>Pages</Eyebrow11>
      <span style={{ display: 'flex', alignItems: 'center', gap: u(6) }}>
        <Folio>{pad2(RAIL_PAGES.length)}</Folio>
        <Icon
          name="grid-2x2"
          size={14}
          stroke={1.75}
          style={{ color: 'rgba(107, 107, 107, 0.7)' }}
        />
      </span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: u(8) }}>
      {RAIL_PAGES.map((kind, i) => (
        <div
          key={kind}
          className={streamFrom === undefined ? undefined : 'gs gs-rise-sm'}
          style={{
            display: 'flex',
            gap: u(10),
            padding: u(6),
            borderRadius: u(6),
            background: i === current ? ink.muted2 : 'transparent',
            animationDelay: streamFrom === undefined ? undefined : `${streamFrom + i * 0.22}s`,
          }}
        >
          <span
            style={{
              width: u(28),
              paddingTop: u(6),
              textAlign: 'right',
              fontFamily: font.mono,
              fontSize: u(10),
              fontWeight: 500,
              letterSpacing: '0.06em',
              color: i === current ? ink.accent : 'rgba(107, 107, 107, 0.7)',
              flexShrink: 0,
            }}
          >
            {pad2(i + 1)}
          </span>
          <div
            style={{
              width: THUMB_W,
              height: THUMB_H,
              borderRadius: u(4),
              overflow: 'hidden',
              background: '#fff',
              boxShadow: i === current ? `0 0 0 2px ${ink.accent}` : `0 0 0 1px ${ink.hairline}`,
              flexShrink: 0,
            }}
          >
            <MiniCanvas scale={THUMB_W / 1920}>
              <MiniPage kind={kind} />
            </MiniCanvas>
          </div>
        </div>
      ))}
    </div>
  </aside>
);

// The white slide card floating on the canvas ground. `scale` is exposed so
// overlays can convert slide coordinates into mock pixels.
const CanvasCard = ({
  width,
  className,
  style,
  children,
}: {
  width: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) => (
  <div
    className={className}
    style={{
      position: 'absolute',
      left: '50%',
      top: '50%',
      width,
      height: (width * 9) / 16,
      marginLeft: -width / 2,
      marginTop: (-width * 9) / 32,
      borderRadius: u(6),
      boxShadow: shadow.floating,
      overflow: 'hidden',
      background: '#fff',
      ...style,
    }}
  >
    <MiniCanvas scale={width / 1920}>{children}</MiniCanvas>
  </div>
);

const Panel = ({
  title,
  icon,
  headerRight,
  banner,
  footer,
  tail = false,
  children,
}: {
  title: string;
  icon: IconName;
  headerRight?: ReactNode;
  banner?: ReactNode;
  footer?: ReactNode;
  tail?: boolean;
  children?: ReactNode;
}) => (
  <aside
    style={{
      width: u(320),
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      background: ink.panel,
      borderLeft: `1px solid ${ink.hairline}`,
      minHeight: 0,
      boxSizing: 'border-box',
    }}
  >
    <header
      style={{
        height: u(36),
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: u(8),
        padding: `0 ${u(12)}px`,
        borderBottom: `1px solid ${ink.hairline}`,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: u(8) }}>
        <Icon name={icon} size={14} style={{ color: ink.muted }} />
        <span style={{ fontSize: u(12), fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</span>
        {headerRight}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: u(2) }}>
        <GhostIcon name="x" size={14} />
      </span>
    </header>
    {banner}
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: tail ? 'flex-end' : 'flex-start',
        overflow: 'hidden',
      }}
    >
      {children}
      {footer && <div style={{ marginTop: tail ? 0 : 'auto' }}>{footer}</div>}
    </div>
  </aside>
);

const Section = ({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <section style={{ padding: `${u(16)}px ${u(14)}px`, flexShrink: 0 }}>
    <div
      style={{
        marginBottom: u(10),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: u(8),
        minHeight: u(16),
      }}
    >
      <Eyebrow11>{title}</Eyebrow11>
      {action && (
        <span style={{ margin: `-${u(4)}px 0`, display: 'flex', alignItems: 'center' }}>
          {action}
        </span>
      )}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: u(10) }}>{children}</div>
  </section>
);

const Collapsible = ({
  title,
  open = false,
  children,
}: {
  title: string;
  open?: boolean;
  children?: ReactNode;
}) => (
  <div style={{ flexShrink: 0 }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: u(8),
        padding: `${u(16)}px ${u(14)}px`,
      }}
    >
      <Eyebrow11>{title}</Eyebrow11>
      <Icon
        name="chevron-right"
        size={12}
        style={{ color: ink.muted, transform: open ? 'rotate(90deg)' : undefined }}
      />
    </div>
    {open && children && (
      <div
        style={{
          marginTop: -u(6),
          padding: `0 ${u(14)}px ${u(16)}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: u(10),
        }}
      >
        {children}
      </div>
    )}
  </div>
);

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: `${u(68)}px 1fr`,
      alignItems: 'center',
      gap: u(12),
    }}
  >
    <span style={{ fontSize: u(11), color: ink.muted }}>{label}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: u(6), minWidth: 0 }}>{children}</div>
  </div>
);

const control: CSSProperties = {
  height: u(28),
  borderRadius: u(5),
  border: `1px solid ${ink.rule}`,
  background: '#fff',
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
};

const NumberShell = ({
  icon,
  prefix,
  suffix,
  children,
  style,
}: {
  icon?: IconName;
  prefix?: string;
  suffix?: string;
  children: ReactNode;
  style?: CSSProperties;
}) => (
  <div
    style={{
      ...control,
      paddingLeft: icon || prefix ? u(8) : 0,
      paddingRight: u(6),
      flexShrink: 0,
      ...style,
    }}
  >
    {icon && <Icon name={icon} size={14} style={{ color: ink.muted }} />}
    {prefix && (
      <span style={{ fontFamily: font.mono, fontSize: u(10), color: ink.muted }}>{prefix}</span>
    )}
    <span
      style={{
        flex: 1,
        minWidth: 0,
        padding: `0 ${u(8)}px`,
        textAlign: 'right',
        fontFamily: font.mono,
        fontSize: u(11),
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
    {suffix && (
      <span
        style={{
          fontFamily: font.mono,
          fontSize: u(9.5),
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'rgba(107, 107, 107, 0.8)',
        }}
      >
        {suffix}
      </span>
    )}
  </div>
);

const SelectMock = ({ value, style }: { value: string; style?: CSSProperties }) => (
  <div
    style={{
      ...control,
      justifyContent: 'space-between',
      gap: u(8),
      padding: `0 ${u(10)}px`,
      fontSize: u(12),
      flex: 1,
      minWidth: 0,
      ...style,
    }}
  >
    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {value}
    </span>
    <Icon name="chevron-down" size={14} style={{ opacity: 0.5 }} />
  </div>
);

const ToggleGroup = ({
  items,
  pressed,
  size = 28,
}: {
  items: IconName[];
  pressed: number[];
  size?: number;
}) => (
  <div style={{ display: 'flex', flexShrink: 0 }}>
    {items.map((name, i) => {
      const on = pressed.includes(i);
      return (
        <span
          key={name}
          style={{
            display: 'inline-flex',
            width: u(size),
            height: u(size),
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
            border: `1px solid ${on ? ink.text : ink.rule}`,
            marginLeft: i > 0 ? -1 : 0,
            borderRadius:
              i === 0
                ? `${u(5)}px 0 0 ${u(5)}px`
                : i === items.length - 1
                  ? `0 ${u(5)}px ${u(5)}px 0`
                  : 0,
            background: on ? ink.text : '#fff',
            color: on ? '#fff' : 'rgba(10, 10, 10, 0.75)',
            position: 'relative',
            zIndex: on ? 1 : 0,
          }}
        >
          <Icon name={name} size={14} />
        </span>
      );
    })}
  </div>
);

const ColorField = ({
  label,
  value,
  dim = false,
  clear = false,
}: {
  label: string;
  value: string;
  dim?: boolean;
  clear?: boolean;
}) => (
  <Field label={label}>
    <span style={{ ...control, width: u(28), justifyContent: 'center', flexShrink: 0 }}>
      <span
        style={{
          width: u(16),
          height: u(16),
          borderRadius: u(3),
          background: dim ? undefined : value,
          backgroundImage: dim
            ? `repeating-conic-gradient(${ink.muted2} 0 25%, transparent 0 50%)`
            : undefined,
          backgroundSize: dim ? `${u(8)}px ${u(8)}px` : undefined,
        }}
      />
    </span>
    <span
      style={{
        ...control,
        flex: 1,
        padding: `0 ${u(8)}px`,
        fontFamily: font.mono,
        fontSize: u(11),
        textTransform: 'uppercase',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {value}
    </span>
    {clear && <GhostIcon name="x" size={14} />}
  </Field>
);

const TextareaMock = ({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) => (
  <div
    className={className}
    style={{
      minHeight: u(64),
      borderRadius: u(6),
      border: `1px solid ${ink.rule}`,
      background: '#fff',
      padding: `${u(8)}px ${u(10)}px`,
      fontSize: u(12),
      lineHeight: 1.6,
      whiteSpace: 'pre-wrap',
      boxSizing: 'border-box',
      position: 'relative',
      ...style,
    }}
  >
    {children}
  </div>
);

const PanelBanner = ({ tab }: { tab: 0 | 1 }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: u(12),
      padding: `${u(14)}px ${u(14)}px ${u(4)}px`,
      flexShrink: 0,
    }}
  >
    <span
      style={{ display: 'flex', alignItems: 'center', gap: u(8), fontSize: u(12), fontWeight: 500 }}
    >
      <Icon name="type" size={16} style={{ color: ink.muted }} />
      Text
    </span>
    <Switcher index={tab} icons={['type', 'move']} />
  </div>
);

const TypographySection = ({ size }: { size: ReactNode }) => (
  <Section title="Typography">
    <div style={{ display: 'flex', alignItems: 'center', gap: u(6) }}>
      <SelectMock value="Semibold" />
      <NumberShell icon="a-large-small" suffix="px" style={{ width: u(96) }}>
        {size}
      </NumberShell>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: u(8) }}>
      <ToggleGroup items={['bold', 'italic']} pressed={[0]} />
      <ToggleGroup
        items={['align-left', 'align-center', 'align-right', 'align-justify']}
        pressed={[0]}
      />
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: u(6) }}>
      <NumberShell icon="unfold-vertical" style={{ flex: 1 }}>
        1
      </NumberShell>
      <NumberShell icon="move-horizontal" suffix="px" style={{ flex: 1 }}>
        -6.2
      </NumberShell>
    </div>
  </Section>
);

const ColorSection = ({ text = '#0A0A0A' }: { text?: string }) => (
  <Section title="Color">
    <ColorField label="Text" value={text} />
    <ColorField label="Background" value="#FFFFFF" dim />
  </Section>
);

const ContentSection = () => (
  <Section
    title="Content"
    action={
      <Btn variant="ghost" size="xs" style={{ color: ink.muted }}>
        <Icon name="pencil-line" size={14} />
        Edit on slide
      </Btn>
    }
  >
    <TextareaMock>Q2 Launch</TextareaMock>
  </Section>
);

const SourceSection = () => (
  <Collapsible title="Source" open>
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: u(8) }}
    >
      <span style={{ fontFamily: font.mono, fontSize: u(10.5), color: ink.muted }}>
        &lt;h1&gt; · 12:7
      </span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: u(6),
          padding: `1px ${u(6)}px`,
          borderRadius: u(3),
          border: `1px solid ${ink.hairline}`,
          background: '#fff',
          fontSize: u(10.5),
          color: 'rgba(10, 10, 10, 0.85)',
          whiteSpace: 'nowrap',
        }}
      >
        <PingDot />
        Agent is watching
      </span>
    </div>
  </Collapsible>
);

const EmptySelection = ({ className, style }: { className?: string; style?: CSSProperties }) => (
  <div
    className={className}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: u(12),
      padding: `${u(64)}px ${u(28)}px`,
      textAlign: 'center',
      ...style,
    }}
  >
    <Icon name="mouse-pointer" size={32} style={{ color: 'rgba(107, 107, 107, 0.5)' }} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: u(6) }}>
      <span style={{ fontSize: u(13), fontWeight: 500 }}>Select an object</span>
      <span style={{ fontSize: u(12), lineHeight: 1.6, color: ink.muted }}>
        Click an object to format it. Double-click text to edit.
      </span>
    </div>
  </div>
);

const ArrangeButton = ({
  name,
  first,
  last,
}: {
  name: IconName;
  first?: boolean;
  last?: boolean;
}) => (
  <span
    style={{
      display: 'inline-flex',
      width: u(28),
      height: u(28),
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      border: `1px solid ${ink.rule}`,
      marginLeft: first ? 0 : -1,
      borderRadius: first ? `${u(5)}px 0 0 ${u(5)}px` : last ? `0 ${u(5)}px ${u(5)}px 0` : 0,
      background: '#fff',
      color: 'rgba(10, 10, 10, 0.75)',
    }}
  >
    <Icon name={name} size={14} />
  </span>
);

const ArrangeFields = ({ y }: { y: ReactNode }) => (
  <>
    <Section
      title="Position"
      action={
        <span style={{ display: 'flex', alignItems: 'center', gap: u(2) }}>
          <GhostIcon name="corner-left-up" size={14} box={24} style={{ color: ink.muted }} />
          <GhostIcon name="help" size={14} box={24} style={{ color: ink.muted }} />
        </span>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: u(6) }}>
        <NumberShell prefix="X">1200</NumberShell>
        <NumberShell prefix="Y">{y}</NumberShell>
        <NumberShell prefix="W">480</NumberShell>
        <NumberShell prefix="H">320</NumberShell>
        <NumberShell icon="rotate-cw" suffix="°">
          0
        </NumberShell>
      </div>
    </Section>
    <Section
      title="Align"
      action={<GhostIcon name="magnet" size={14} box={24} active style={{ color: ink.text }} />}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: u(8) }}>
        <span style={{ display: 'flex' }}>
          <ArrangeButton name="align-h-start" first />
          <ArrangeButton name="align-h-center" />
          <ArrangeButton name="align-h-end" last />
        </span>
        <span style={{ display: 'flex' }}>
          <ArrangeButton name="align-v-start" first />
          <ArrangeButton name="align-v-center" />
          <ArrangeButton name="align-v-end" last />
        </span>
      </div>
    </Section>
    <Section title="Layer">
      <span style={{ display: 'flex' }}>
        <ArrangeButton name="bring-to-front" first />
        <ArrangeButton name="arrow-up" />
        <ArrangeButton name="arrow-down" />
        <ArrangeButton name="send-to-back" last />
      </span>
    </Section>
  </>
);

const SliderMock = ({ pct, animate = false }: { pct: number; animate?: boolean }) => (
  <div
    style={{ position: 'relative', flex: 1, height: u(14), display: 'flex', alignItems: 'center' }}
  >
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: u(3),
        borderRadius: 999,
        background: ink.muted2,
        overflow: 'hidden',
      }}
    >
      <div
        className={animate ? 'gs dp-range' : undefined}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${pct}%`,
          background: ink.text,
        }}
      />
    </div>
    <div
      className={animate ? 'gs dp-thumb' : undefined}
      style={{
        position: 'absolute',
        top: 0,
        left: `${pct}%`,
        width: u(14),
        height: u(14),
        marginLeft: -u(7),
        borderRadius: '50%',
        border: `1px solid ${ink.text}`,
        background: '#fff',
        boxShadow: shadow.edge,
        boxSizing: 'border-box',
      }}
    />
  </div>
);

const DesignPanel = () => (
  <Panel
    title="Design tokens"
    icon="palette"
    headerRight={
      <span
        className="gs gs-flash"
        style={{
          width: u(6),
          height: u(6),
          borderRadius: '50%',
          background: ink.accent,
          animationDelay: '1.8s',
          animationDuration: '2.9s',
        }}
      />
    }
  >
    <Section title="Colors">
      <ColorField label="Background" value="#FFFFFF" />
      <ColorField label="Text" value="#0A0A0A" />
      <ColorField label="Accent" value="#DE3B3D" />
    </Section>
    <Section title="Typography">
      <Field label="Display">
        <SelectMock value="Custom…" />
      </Field>
      <Field label="Body">
        <SelectMock value="Custom…" />
      </Field>
      <Field label="Hero">
        <SliderMock pct={79.2} animate />
        <NumberShell suffix="px" style={{ width: u(72) }}>
          <Roll from="176" to="200" delay={1.8} />
        </NumberShell>
      </Field>
      <Field label="Body">
        <SliderMock pct={28.6} />
        <NumberShell suffix="px" style={{ width: u(72) }}>
          32
        </NumberShell>
      </Field>
    </Section>
    <Section title="Shape">
      <Field label="Radius">
        <SliderMock pct={15} />
        <NumberShell suffix="px" style={{ width: u(72) }}>
          12
        </NumberShell>
      </Field>
    </Section>
  </Panel>
);

// Centering through a zero-width flex anchor keeps `transform` free for the
// entrance keyframes and lets each card keep its natural width.
const CenterAnchor = ({
  bottom,
  className,
  style,
  children,
}: {
  bottom: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) => (
  <div
    className={className}
    style={{
      position: 'absolute',
      left: '50%',
      bottom,
      width: 0,
      display: 'flex',
      justifyContent: 'center',
      zIndex: 10,
      ...style,
    }}
  >
    {children}
  </div>
);

const saveCard: CSSProperties = {
  height: u(36),
  borderRadius: u(8),
  border: `1px solid ${ink.rule}`,
  background: 'rgba(255, 255, 255, 0.95)',
  boxShadow: shadow.overlay,
  display: 'flex',
  alignItems: 'center',
  gap: u(4),
  padding: `${u(2)}px ${u(2)}px ${u(2)}px ${u(4)}px`,
  boxSizing: 'border-box',
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

const HistoryIcons = () => (
  <span style={{ display: 'flex', alignItems: 'center' }}>
    <GhostIcon name="undo" size={14} style={{ color: ink.muted }} />
    <GhostIcon name="redo" size={14} dim style={{ color: ink.muted }} />
    <span
      style={{
        width: 1,
        height: u(16),
        background: ink.hairline,
        margin: `0 ${u(2)}px 0 ${u(4)}px`,
      }}
    />
  </span>
);

const UnsavedLabel = ({ children }: { children: ReactNode }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: u(6),
      padding: `0 ${u(10)}px`,
      fontSize: u(12),
      fontWeight: 500,
    }}
  >
    <span
      style={{
        width: u(6),
        height: u(6),
        borderRadius: '50%',
        background: ink.accent,
        boxShadow: `0 0 0 ${u(3)}px ${ink.accentSoft}`,
      }}
    />
    {children}
  </span>
);

// dirty → (saving) → saved. The dirty card fades out while the saved card
// fades in; both auto-size, so nothing is measured or hardcoded.
const SaveFlow = ({
  appear,
  press,
  label = '1 unsaved change',
}: {
  appear: number;
  press?: number;
  label?: string;
}) => (
  <>
    <CenterAnchor bottom={u(24)} className="gs gs-bloom" style={{ animationDelay: `${appear}s` }}>
      <div
        className={press === undefined ? undefined : 'gs gs-out'}
        style={{ ...saveCard, animationDelay: press === undefined ? undefined : `${press + 0.7}s` }}
      >
        <HistoryIcons />
        <UnsavedLabel>{label}</UnsavedLabel>
        <Btn variant="ghost" style={{ color: ink.muted }}>
          Discard
        </Btn>
        <Btn
          variant="brand"
          className={press === undefined ? undefined : 'gs gs-press'}
          style={{
            padding: `0 ${u(12)}px`,
            animationDelay: press === undefined ? undefined : `${press}s`,
          }}
        >
          <span style={{ display: 'grid' }}>
            <span
              className={press === undefined ? undefined : 'gs gs-out'}
              style={{
                gridArea: '1 / 1',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: u(6),
                animationDelay: press === undefined ? undefined : `${press + 0.1}s`,
              }}
            >
              <Icon name="save" size={14} />
              Save
            </span>
            {press !== undefined && (
              <span
                className="gs gs-fade"
                style={{
                  gridArea: '1 / 1',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: u(6),
                  animationDelay: `${press + 0.1}s`,
                  animationDuration: '0.15s',
                }}
              >
                <Icon name="loader" size={14} className="gs gs-spin" />
                Saving
              </span>
            )}
          </span>
        </Btn>
      </div>
    </CenterAnchor>
    {press !== undefined && (
      <CenterAnchor
        bottom={u(24)}
        className="gs gs-fade"
        style={{ animationDelay: `${press + 0.7}s`, animationDuration: '0.2s' }}
      >
        <div style={saveCard}>
          <HistoryIcons />
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: u(6),
              padding: `0 ${u(10)}px`,
              fontSize: u(12),
              fontWeight: 500,
            }}
          >
            <Icon name="check" size={14} stroke={2.5} style={{ color: ink.mint }} />
            Saved
          </span>
        </div>
      </CenterAnchor>
    )}
  </>
);

const CommentFab = ({ count, panel }: { count: ReactNode; panel?: ReactNode }) => (
  <div
    style={{
      position: 'absolute',
      right: u(16),
      bottom: u(16),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: u(8),
      zIndex: 10,
    }}
  >
    {panel}
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: u(8),
        padding: `${u(8)}px ${u(12)}px`,
        borderRadius: 999,
        border: `1px solid ${ink.rule}`,
        background: '#fff',
        boxShadow: shadow.floating,
        fontSize: u(12),
        fontWeight: 500,
      }}
    >
      <Icon name="message-square" size={16} />
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{count}</span>
    </span>
  </div>
);

const CommentPanel = ({ delay }: { delay: number }) => (
  <div
    className="gs gs-pop"
    style={{
      width: u(320),
      borderRadius: u(8),
      border: `1px solid ${ink.rule}`,
      background: '#fff',
      boxShadow: shadow.overlay,
      transformOrigin: 'bottom right',
      animationDelay: `${delay}s`,
      textAlign: 'left',
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${u(8)}px ${u(12)}px`,
        borderBottom: `1px solid ${ink.rule}`,
      }}
    >
      <span style={{ fontSize: u(12), fontWeight: 600 }}>1 comment</span>
      <Icon name="x" size={14} style={{ color: ink.muted }} />
    </div>
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: u(8),
        padding: `${u(8)}px ${u(12)}px`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: font.mono, fontSize: u(10), color: ink.muted }}>line 12</div>
        <div style={{ marginTop: u(2), fontSize: u(12) }}>Use the accent color on this title</div>
      </div>
      <GhostIcon name="trash" size={14} box={22} style={{ color: ink.muted }} />
    </div>
    <div
      style={{
        borderTop: `1px solid ${ink.rule}`,
        padding: `${u(8)}px ${u(12)}px`,
        fontSize: u(11),
        color: ink.muted,
      }}
    >
      Run{' '}
      <span
        style={{
          borderRadius: u(3),
          background: ink.muted2,
          padding: `${u(2)}px ${u(4)}px`,
          fontFamily: font.mono,
          color: ink.text,
        }}
      >
        /apply-comments
      </span>{' '}
      in your agent to apply these.
    </div>
  </div>
);

const AssetCard = ({
  src,
  name,
  size,
  date = 'Sep 24',
  className,
  delay = 0,
}: {
  src: string;
  name: string;
  size: string;
  date?: string;
  className?: string;
  delay?: number;
}) => (
  <div
    className={className}
    style={{
      borderRadius: u(6),
      border: `1px solid ${ink.rule}`,
      background: '#fff',
      boxShadow: shadow.edge,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      animationDelay: `${delay}s`,
    }}
  >
    <div
      style={{
        aspectRatio: '1 / 1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: `1px solid ${ink.hairline}`,
        backgroundImage: `repeating-conic-gradient(${ink.muted2} 0 25%, transparent 0 50%)`,
        backgroundSize: `${u(14)}px ${u(14)}px`,
      }}
    >
      <img src={src} alt="" style={{ width: '44%', height: '44%', objectFit: 'contain' }} />
    </div>
    <div
      style={{
        padding: `${u(8)}px ${u(6)}px ${u(8)}px ${u(10)}px`,
        display: 'flex',
        alignItems: 'center',
        gap: u(4),
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: u(12.5),
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name}
        </div>
        <Folio>{size}</Folio>
        <div
          style={{
            marginTop: u(2),
            fontSize: u(10.5),
            color: ink.muted,
            display: 'flex',
            gap: u(4),
            whiteSpace: 'nowrap',
          }}
        >
          Modified<span style={{ opacity: 0.4 }}>·</span>
          <span style={{ fontFamily: font.mono }}>{date}</span>
        </div>
      </div>
      <GhostIcon name="ellipsis" size={14} box={24} style={{ color: ink.dim }} />
    </div>
  </div>
);

const AssetsView = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      background: '#fff',
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: u(12),
        padding: `${u(12)}px ${u(24)}px`,
        borderBottom: `1px solid ${ink.hairline}`,
        background: ink.panel,
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: u(12), minWidth: 0 }}>
        <TabsMock items={['This slide', 'Global']} active={0} />
        <span
          style={{
            fontSize: u(12),
            color: ink.muted,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span style={{ fontFamily: font.mono, fontSize: u(11.5) }}>slides/q2-launch/assets/</span>
          <span style={{ margin: `0 ${u(8)}px`, opacity: 0.5 }}>·</span>
          <Folio>
            <Roll from="06 files" to="07 files" delay={2.6} />
          </Folio>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: u(6) }}>
        <Btn variant="outline" size="default" style={{ fontSize: u(12.5) }}>
          <Icon name="search" size={14} />
          Search logos
        </Btn>
        <Btn variant="outline" size="default" style={{ fontSize: u(12.5) }}>
          <Icon name="type" size={14} />
          Search fonts
        </Btn>
        <Btn variant="default" size="default" style={{ fontSize: u(12.5) }}>
          <Icon name="upload" size={14} />
          Upload
        </Btn>
      </div>
    </div>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: u(8),
        padding: `${u(10)}px ${u(24)}px`,
        borderBottom: `1px solid ${ink.hairline}`,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          ...control,
          height: u(32),
          width: u(280),
          borderRadius: u(6),
          padding: `0 ${u(10)}px`,
          gap: u(8),
          color: 'rgba(107, 107, 107, 0.7)',
          fontSize: u(12.5),
        }}
      >
        <Icon name="search" size={14} style={{ color: ink.muted }} />
        Search assets…
      </div>
      <SelectMock value="All usage" style={{ height: u(32), flex: 'none', width: u(112) }} />
      <SelectMock value="All types" style={{ height: u(32), flex: 'none', width: u(108) }} />
      <Btn variant="outline" size="default" style={{ fontSize: u(12.5), gap: u(4) }}>
        <Icon name="arrow-up-down" size={14} style={{ color: ink.muted, marginRight: u(2) }} />
        Name
        <Icon name="chevron-down" size={12} style={{ color: ink.muted }} />
      </Btn>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: u(8) }}>
        <Btn variant="outline" size="default" style={{ fontSize: u(12.5) }}>
          <Icon name="columns-3" size={14} style={{ color: ink.muted }} />7
        </Btn>
        <ToggleGroup items={['layout-grid', 'list']} pressed={[0]} size={32} />
      </div>
    </div>
    <div
      style={{
        flex: 1,
        minHeight: 0,
        padding: u(24),
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: u(16),
        alignContent: 'start',
      }}
    >
      <AssetCard
        src={claudeLogo}
        name="claude.svg"
        size="2.0 KB"
        className="gs gs-rise-sm"
        delay={0.3}
      />
      <AssetCard
        src={codexLogo}
        name="codex.svg"
        size="1.4 KB"
        className="gs gs-rise-sm"
        delay={0.36}
      />
      <AssetCard
        src={geminiLogo}
        name="gemini.svg"
        size="3.8 KB"
        className="gs gs-rise-sm"
        delay={0.42}
      />
      <AssetCard
        src={cursorLogo}
        name="cursor.svg"
        size="0.8 KB"
        className="gs gs-rise-sm"
        delay={0.48}
      />
      <AssetCard
        src={opencodeLogo}
        name="opencode.svg"
        size="0.3 KB"
        className="gs gs-rise-sm"
        delay={0.54}
      />
      <AssetCard src={zedLogo} name="zed.svg" size="0.7 KB" className="gs gs-rise-sm" delay={0.6} />
      <AssetCard
        src={vercelLogo}
        name="vercel.svg"
        size="0.2 KB"
        date="just now"
        className="gs gs-rise-sm"
        delay={2.55}
      />
    </div>

    <div
      className="gs gs-flash"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 3,
        animationDelay: '1.5s',
        animationDuration: '1.05s',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(222, 59, 61, 0.05)' }} />
      <div
        style={{
          position: 'absolute',
          inset: u(8),
          borderRadius: u(10),
          border: '1px dashed rgba(222, 59, 61, 0.4)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: u(32),
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: u(8),
            padding: `${u(6)}px ${u(12)}px`,
            borderRadius: u(6),
            border: `1px solid ${ink.rule}`,
            background: '#fff',
            boxShadow: shadow.floating,
            fontSize: u(12),
            fontWeight: 500,
          }}
        >
          <Icon name="arrow-down-to-line" size={14} style={{ color: ink.accent }} />
          Drop to upload
        </span>
      </div>
    </div>

    <div
      className="gs as-drag"
      style={{ position: 'absolute', left: 1180, top: 300, zIndex: 4, pointerEvents: 'none' }}
    >
      <div
        className="gs as-ghost"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: u(8),
          padding: `${u(6)}px ${u(10)}px`,
          borderRadius: u(6),
          border: `1px solid ${ink.rule}`,
          background: '#fff',
          boxShadow: shadow.overlay,
          fontSize: u(12),
          fontWeight: 500,
          marginLeft: u(12),
          marginTop: u(10),
        }}
      >
        <Icon name="file-image" size={14} style={{ color: ink.muted }} />
        vercel.svg
      </div>
    </div>
    <Cursor className="gs as-drag" left={1180} top={300} />

    <div
      className="gs gs-flash"
      style={{
        position: 'absolute',
        right: u(16),
        bottom: u(16),
        zIndex: 5,
        display: 'flex',
        alignItems: 'flex-start',
        gap: u(12),
        width: u(300),
        borderRadius: u(8),
        border: `1px solid ${ink.rule}`,
        background: '#fff',
        boxShadow: shadow.floating,
        padding: `${u(12)}px ${u(14)}px`,
        boxSizing: 'border-box',
        animationDelay: '2.8s',
        animationDuration: '2.6s',
      }}
    >
      <Icon name="check" size={14} stroke={2.5} style={{ color: ink.mint, marginTop: u(2) }} />
      <span style={{ fontSize: u(12.5), fontWeight: 500 }}>Uploaded vercel.svg</span>
    </div>
  </div>
);

const barButton: CSSProperties = {
  display: 'inline-flex',
  width: u(32),
  height: u(32),
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  color: 'rgba(255, 255, 255, 0.85)',
  flexShrink: 0,
};

const BarDivider = () => (
  <span
    style={{
      width: 1,
      height: u(16),
      background: 'rgba(255, 255, 255, 0.15)',
      margin: `0 ${u(4)}px`,
      flexShrink: 0,
    }}
  />
);

const PresentBar = () => (
  <CenterAnchor bottom={u(16)} className="gs gs-bar" style={{ animationDelay: '0.8s' }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: u(4),
        height: u(44),
        padding: `0 ${u(8)}px`,
        borderRadius: 999,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(0, 0, 0, 0.55)',
        boxShadow: '0 8px 30px -8px rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(12px)',
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
      }}
    >
      <span style={barButton}>
        <Icon name="chevron-left" size={16} />
      </span>
      <span style={barButton}>
        <Icon name="chevron-right" size={16} />
      </span>
      <BarDivider />
      <span
        style={{
          padding: `0 ${u(8)}px`,
          fontFamily: font.mono,
          fontSize: u(11.5),
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontVariantNumeric: 'tabular-nums',
          color: 'rgba(255, 255, 255, 0.85)',
        }}
      >
        <span style={{ color: '#fff' }}>02</span>
        <span style={{ color: 'rgba(255, 255, 255, 0.35)' }}> / </span>06
      </span>
      <BarDivider />
      <span
        style={{
          padding: `0 ${u(8)}px`,
          fontFamily: font.mono,
          fontSize: u(11.5),
          letterSpacing: '0.08em',
          fontVariantNumeric: 'tabular-nums',
          color: 'rgba(255, 255, 255, 0.7)',
        }}
      >
        04:12
      </span>
      <BarDivider />
      <span style={barButton}>
        <Icon name="grid-2x2" size={16} />
      </span>
      <span style={barButton}>
        <Icon name="square" size={16} fill="currentColor" />
      </span>
      <span style={barButton}>
        <Icon name="sun" size={16} />
      </span>
      <span style={{ ...barButton, background: 'rgba(222, 59, 61, 0.85)', color: '#fff' }}>
        <Icon name="crosshair" size={16} />
      </span>
      <span style={barButton}>
        <Icon name="monitor-speaker" size={16} />
      </span>
      <span style={barButton}>
        <Icon name="maximize" size={16} />
      </span>
      <span style={barButton}>
        <Icon name="keyboard" size={16} />
      </span>
      <BarDivider />
      <span style={barButton}>
        <Icon name="log-out" size={16} />
      </span>
    </div>
  </CenterAnchor>
);

const PRESENTER_NOW_SCALE = 359 / 1080;
const PRESENTER_NEXT_SCALE = 337.6 / 1920;

const dark = {
  bg: '#111111',
  card: '#161616',
  border: 'rgba(255, 255, 255, 0.1)',
  hairline: 'rgba(255, 255, 255, 0.07)',
  text: '#ededed',
  muted: '#a1a1a1',
};

const DarkLabel = ({ children }: { children: ReactNode }) => (
  <Eyebrow11 style={{ color: 'rgba(255, 255, 255, 0.45)' }}>{children}</Eyebrow11>
);

const DarkButton = ({ children, ghost = false }: { children: ReactNode; ghost?: boolean }) => (
  <Btn
    variant="outline"
    size="default"
    style={{
      background: ghost ? 'transparent' : dark.card,
      border: ghost ? '1px solid transparent' : `1px solid ${dark.border}`,
      color: ghost ? 'rgba(237, 237, 237, 0.75)' : dark.text,
      fontSize: u(13),
      padding: `0 ${u(12)}px`,
    }}
  >
    {children}
  </Btn>
);

const PresenterWindow = ({ width, height }: { width: number; height: number }) => (
  <div
    className="gs gs-rise"
    style={{
      width,
      height,
      borderRadius: 12,
      background: dark.bg,
      color: dark.text,
      boxShadow: `0 0 0 1px ${dark.border}, 0 24px 64px -24px rgba(0, 0, 0, 0.5)`,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: font.sans,
      letterSpacing: '-0.005em',
      animationDelay: '0.1s',
    }}
  >
    <header
      style={{
        height: u(48),
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `0 ${u(24)}px`,
        borderBottom: `1px solid ${dark.hairline}`,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: u(12) }}>
        <DarkLabel>Presenter</DarkLabel>
        <span
          style={{
            fontSize: u(14),
            fontWeight: 600,
            letterSpacing: '-0.01em',
            display: 'flex',
            alignItems: 'center',
            gap: u(4),
          }}
        >
          Q2 Launch
          <Icon name="chevron-down" size={14} style={{ color: dark.muted }} />
        </span>
      </span>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: u(24),
          fontFamily: font.mono,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <span style={{ fontSize: u(11.5), letterSpacing: '0.08em', color: dark.muted }}>14:02</span>
        <span style={{ fontSize: u(11.5), letterSpacing: '0.08em', color: dark.muted }}>04:12</span>
        <span style={{ fontSize: u(18) }}>
          02<span style={{ opacity: 0.3 }}> / </span>
          <span style={{ color: dark.muted }}>06</span>
        </span>
      </span>
    </header>
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: u(24),
        padding: `${u(12)}px ${u(24)}px ${u(16)}px`,
      }}
    >
      <section style={{ display: 'flex', flexDirection: 'column', gap: u(8), minHeight: 0 }}>
        <DarkLabel>Now showing</DarkLabel>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            position: 'relative',
            borderRadius: u(8),
            background: '#000',
            boxShadow: `0 0 0 1px ${dark.border}`,
            overflow: 'hidden',
          }}
        >
          <PresenterPreview kind="agenda" scale={PRESENTER_NOW_SCALE} />
        </div>
      </section>
      <aside style={{ display: 'flex', flexDirection: 'column', gap: u(12), minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: u(8) }}>
          <DarkLabel>Up next</DarkLabel>
          <div
            style={{
              position: 'relative',
              aspectRatio: '16 / 9',
              borderRadius: u(8),
              background: '#000',
              boxShadow: `0 0 0 1px ${dark.border}`,
              overflow: 'hidden',
            }}
          >
            <PresenterPreview kind="problem" scale={PRESENTER_NEXT_SCALE} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: u(8), flex: 1, minHeight: 0 }}>
          <DarkLabel>Speaker notes</DarkLabel>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              borderRadius: u(6),
              border: `1px solid ${dark.border}`,
              background: dark.card,
              padding: u(12),
              fontSize: u(13.5),
              lineHeight: 1.6,
              overflow: 'hidden',
            }}
          >
            Four beats, one per row. Pause after the metrics line.
          </div>
        </div>
      </aside>
    </div>
    <footer
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: u(12),
        padding: `${u(12)}px ${u(24)}px`,
        borderTop: `1px solid ${dark.hairline}`,
        flexShrink: 0,
      }}
    >
      <span style={{ display: 'flex', gap: u(8) }}>
        <DarkButton>
          <Icon name="chevron-left" size={16} /> Prev
        </DarkButton>
        <DarkButton>
          Next <Icon name="chevron-right" size={16} />
        </DarkButton>
      </span>
      <span style={{ display: 'flex', gap: u(8) }}>
        <DarkButton>
          <Icon name="square" size={16} fill="currentColor" /> Black
        </DarkButton>
        <DarkButton>
          <Icon name="sun" size={16} /> White
        </DarkButton>
        <DarkButton ghost>
          <Icon name="rotate-cw" size={16} /> Reset
        </DarkButton>
      </span>
    </footer>
  </div>
);

const PresenterPreview = ({ kind, scale }: { kind: MiniKind; scale: number }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <MiniCanvas scale={scale}>
      <MiniPage kind={kind} />
    </MiniCanvas>
  </div>
);

const Toast = ({ delay }: { delay: number }) => (
  <div
    className="gs gs-bloom"
    style={{
      position: 'absolute',
      right: u(16),
      bottom: u(16),
      width: u(320),
      display: 'flex',
      alignItems: 'flex-start',
      gap: u(12),
      borderRadius: u(8),
      border: `1px solid ${ink.rule}`,
      background: '#fff',
      boxShadow: shadow.floating,
      padding: `${u(12)}px ${u(14)}px`,
      boxSizing: 'border-box',
      animationDelay: `${delay}s`,
      zIndex: 5,
    }}
  >
    <Icon
      name="loader"
      size={14}
      className="gs gs-spin"
      style={{ color: ink.accent, marginTop: u(2) }}
    />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: u(12.5), fontWeight: 600, letterSpacing: '-0.01em' }}>
        Exporting PPTX
      </div>
      <div
        style={{
          fontFamily: font.mono,
          fontSize: u(10.5),
          letterSpacing: '0.04em',
          color: ink.muted,
        }}
      >
        Rendering page 3 of 6
      </div>
      <div
        style={{
          marginTop: u(8),
          height: u(3),
          borderRadius: 999,
          background: ink.muted2,
          overflow: 'hidden',
        }}
      >
        <div style={{ width: '50%', height: '100%', background: ink.text }} />
      </div>
    </div>
  </div>
);

const LogoTile = ({
  src,
  name,
  delay,
  logoHeight = 68,
}: {
  src: string;
  name: string;
  delay: number;
  logoHeight?: number;
}) => (
  <div
    className="gs gs-rise"
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 28,
      padding: '40px 16px 36px',
      animationDelay: `${delay}s`,
    }}
  >
    <div style={{ height: 80, display: 'flex', alignItems: 'center' }}>
      <img
        src={src}
        alt=""
        style={{
          height: logoHeight,
          width: 'auto',
          maxWidth: 160,
          objectFit: 'contain',
          filter: 'brightness(0)',
          opacity: 0.78,
        }}
      />
    </div>
    <div
      style={{
        fontSize: 24,
        fontWeight: 500,
        color: ink.text,
        letterSpacing: '-0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      {name}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Pages

const Pill = ({ dark = false, children }: { dark?: boolean; children: ReactNode }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 14,
      height: 60,
      padding: '0 28px',
      borderRadius: 999,
      fontSize: 23,
      fontWeight: 500,
      whiteSpace: 'nowrap',
      background: dark ? 'var(--osd-text)' : 'transparent',
      color: dark ? 'var(--osd-bg)' : 'var(--osd-text)',
      border: dark ? '1px solid transparent' : `1px solid ${ink.rule}`,
      fontFamily: dark ? font.sans : font.mono,
      letterSpacing: dark ? '-0.01em' : '0',
    }}
  >
    {children}
  </span>
);

const Cover: Page = () => {
  const active = useIsActivePage();
  return (
    <div style={fill} data-still={active ? undefined : ''}>
      <Styles />
      <Mark />
      <div
        className="gs gs-rise"
        style={{
          position: 'absolute',
          left: 148,
          top: 96,
          fontSize: 22,
          lineHeight: '26px',
          fontWeight: 500,
          color: 'var(--osd-accent)',
        }}
      >
        Getting started
      </div>
      <h1
        className="gs gs-rise"
        style={{
          position: 'absolute',
          left: 120,
          top: 330,
          margin: 0,
          maxWidth: 1500,
          fontFamily: font.display,
          fontSize: 'var(--osd-size-hero)',
          fontWeight: 500,
          letterSpacing: '-0.04em',
          lineHeight: 1.02,
          animationDelay: '0.1s',
        }}
      >
        The slide framework
        <br />
        built for agents.
      </h1>
      <p
        className="gs gs-rise"
        style={{
          position: 'absolute',
          left: 120,
          top: 680,
          margin: 0,
          maxWidth: 1080,
          fontSize: 'var(--osd-size-body)',
          lineHeight: 1.45,
          color: ink.soft,
          animationDelay: '0.22s',
        }}
      >
        Every page is a React component on a 1920 × 1080 canvas. This deck walks the loop: init,
        prompt, edit, comment, present.
      </p>
      <div
        className="gs gs-rise"
        style={{
          position: 'absolute',
          left: 120,
          top: 820,
          display: 'flex',
          gap: 16,
          animationDelay: '0.34s',
        }}
      >
        <Pill dark>
          Press <Icon name="arrow-right" size={13} stroke={2.2} /> to begin
        </Pill>
        <Pill>
          <span style={{ color: 'var(--osd-accent)' }}>$</span>npx @open-slide/cli init
        </Pill>
      </div>
      <Footer />
    </div>
  );
};

const CycleWord = ({
  delay,
  before = '',
  after = '',
}: {
  delay: number;
  before?: string;
  after?: string;
}) => (
  <span style={{ display: 'inline-grid', verticalAlign: 'baseline' }}>
    <span className="gs hp-a" style={{ gridArea: '1 / 1', animationDelay: `${delay}s` }}>
      {before}deck{after}
    </span>
    <span className="gs hp-b" style={{ gridArea: '1 / 1', animationDelay: `${delay}s` }}>
      {before}talk{after}
    </span>
    <span className="gs hp-c" style={{ gridArea: '1 / 1', animationDelay: `${delay}s` }}>
      {before}demo{after}
    </span>
  </span>
);

const HelloPage = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      padding: 160,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}
  >
    <h1
      style={{ margin: 0, fontSize: 188, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 1 }}
    >
      Hello,{' '}
      <em style={{ fontStyle: 'normal', color: ink.accent }}>
        <CycleWord delay={1.4} after="." />
      </em>
    </h1>
    <p style={{ margin: '40px 0 0', fontSize: 44, color: ink.soft }}>
      A React slide, rendered live.
    </p>
  </div>
);

const code: CSSProperties = {
  padding: '28px 36px',
  fontFamily: font.mono,
  fontSize: 22,
  lineHeight: 1.55,
  color: ink.text,
};

const FilePage: Page = () => (
  <Frame
    eyebrow="The idea"
    title="A slide is a file."
    lead="No DSL, no template language. Each page is a React component, and the default export is the deck."
  >
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 620px', gap: 32, height: '100%' }}>
      <Window
        className="gs gs-rise"
        title="slides/hello/index.tsx"
        right="tsx · 14 lines"
        delay={0.2}
      >
        <div style={code}>
          <Line delay={0.5}>
            <K>import type</K> <P>{'{ '}</P>
            <Tag>Page</Tag>
            <P>{' }'}</P> <K>from</K> <Str>'@open-slide/core'</Str>
            <P>;</P>
          </Line>
          <Line delay={0.55} />
          <Line delay={0.6}>
            <K>const</K> WORD <P>=</P>{' '}
            <Str>
              <CycleWord delay={1.4} before="'" after="';" />
            </Str>
          </Line>
          <Line delay={0.65} />
          <Line delay={0.7}>
            <K>const</K> <Tag>Cover</Tag>
            <P>:</P> <Tag>Page</Tag> <P>= () =&gt; (</P>
          </Line>
          <Line delay={0.75}>
            {'  '}
            <P>&lt;</P>
            <Tag>div</Tag> style<P>={'{{'}</P> padding<P>:</P> <N>160</N>
            <P>,</P> background<P>:</P> <Str>'#fff'</Str> <P>{'}}'}&gt;</P>
          </Line>
          <Line delay={0.8}>
            {'    '}
            <P>&lt;</P>
            <Tag>h1</Tag> style<P>={'{{'}</P> fontSize<P>:</P> <N>188</N>
            <P>,</P> letterSpacing<P>:</P> <Str>'-0.04em'</Str> <P>{'}}'}&gt;</P>
          </Line>
          <Line delay={0.85}>
            {'      '}Hello, <P>&lt;</P>
            <Tag>em</Tag> style<P>={'{{'}</P> color<P>:</P> <Str>'#de3b3d'</Str> <P>{'}}'}&gt;</P>
            <P>{'{'}</P>WORD<P>{'}'}</P>
            <P>&lt;/</P>
            <Tag>em</Tag>
            <P>&gt;</P>.
          </Line>
          <Line delay={0.9}>
            {'    '}
            <P>&lt;/</P>
            <Tag>h1</Tag>
            <P>&gt;</P>
          </Line>
          <Line delay={0.95}>
            {'    '}
            <P>&lt;</P>
            <Tag>p</Tag>
            <P>&gt;</P>A React slide, rendered live.<P>&lt;/</P>
            <Tag>p</Tag>
            <P>&gt;</P>
          </Line>
          <Line delay={1.0}>
            {'  '}
            <P>&lt;/</P>
            <Tag>div</Tag>
            <P>&gt;</P>
          </Line>
          <Line delay={1.05}>
            <P>);</P>
          </Line>
          <Line delay={1.1} />
          <Line delay={1.15}>
            <K>export default</K> <P>[</P>
            <Tag>Cover</Tag>
            <P>]</P> <K>satisfies</K> <Tag>Page</Tag>
            <P>[];</P>
          </Line>
        </div>
      </Window>
      <Window className="gs gs-rise" title="rendered output" right={<Live />} delay={0.3}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            className="gs gs-bloom"
            style={{
              borderRadius: 8,
              overflow: 'hidden',
              boxShadow: `0 0 0 1px ${ink.rule}`,
              animationDelay: '1.3s',
              animationDuration: '0.5s',
            }}
          >
            <MiniCanvas scale={564 / 1920}>
              <HelloPage />
            </MiniCanvas>
          </div>
        </div>
      </Window>
    </div>
  </Frame>
);

const InitPage: Page = () => (
  <Frame
    eyebrow="01 · Init"
    title="One command."
    lead="Scaffolds the workspace, installs dependencies, and initializes git. No global installs, no config to touch."
  >
    <Window className="gs gs-rise" title="~/code — zsh" delay={0.2} style={{ height: '100%' }}>
      <div style={term}>
        <Line delay={0} className="gs">
          <Prompt />
          <Typed
            text="npx @open-slide/cli init my-deck"
            delay={0.6}
            color={ink.text}
            caret={false}
          />
        </Line>
        <Line delay={2.3} />
        <Line delay={2.4}>
          <Ok />
          <span style={{ color: ink.text }}>Created open-slide workspace</span>{' '}
          <Dim>in ~/code/my-deck</Dim>
        </Line>
        <Line delay={2.9}>
          <Ok />
          <span style={{ color: ink.text }}>Installed dependencies with pnpm</span>
        </Line>
        <Line delay={3.3}>
          <Ok />
          <span style={{ color: ink.text }}>Initialized git repository with first commit</span>
        </Line>
        <Line delay={3.4} />
        <Line delay={3.5}>
          <span style={{ color: ink.text, fontWeight: 600 }}>Next steps:</span>
        </Line>
        <Line delay={3.6}>
          {'  '}
          <span style={{ color: ink.text }}>cd my-deck</span>
        </Line>
        <Line delay={3.7}>
          {'  '}
          <span style={{ color: ink.text }}>pnpm dev</span>
        </Line>
        <Line delay={3.8} />
        <Line delay={3.9}>
          <Dim>Then open the dev server and start authoring in slides/&lt;your-slide&gt;/.</Dim>
        </Line>
        <Line delay={4.3}>
          <Prompt />
          <Typed text="" delay={4.3} color={ink.text} />
        </Line>
      </div>
    </Window>
  </Frame>
);

const AgentLogoRow = () => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 18 }}>
    <img src={claudeLogo} alt="" style={{ height: 22, filter: 'brightness(0)', opacity: 0.7 }} />
    <img src={codexLogo} alt="" style={{ height: 22, filter: 'brightness(0)', opacity: 0.7 }} />
    <img src={cursorLogo} alt="" style={{ height: 22, filter: 'brightness(0)', opacity: 0.7 }} />
    <img src={geminiLogo} alt="" style={{ height: 22, filter: 'brightness(0)', opacity: 0.7 }} />
    <span
      style={{ fontFamily: font.mono, fontSize: 15, letterSpacing: '0.08em', color: ink.muted }}
    >
      …
    </span>
  </span>
);

const PromptPage: Page = () => (
  <Frame
    eyebrow="02 · Prompt"
    title="Ask your agent."
    lead="One /create-slide prompt drafts every page as a real component. Refine with follow-ups, not templates."
  >
    <div style={{ display: 'grid', gridTemplateColumns: '600px 1fr', gap: 32, height: '100%' }}>
      <Window
        className="gs gs-rise"
        title="claude · ~/my-deck"
        delay={0.2}
        style={{ height: '100%' }}
      >
        <div
          style={{
            ...code,
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            color: ink.soft,
          }}
        >
          <Line delay={0} className="gs">
            <Chevron />
            <span style={{ color: ink.accent }}>/create-slide</span>{' '}
            <Typed text="the Q2 launch deck" delay={1.0} color={ink.text} caret={false} />
          </Line>
          <Line delay={1.9} />
          <Line delay={2.0}>Drafting 6 pages…</Line>
          <Line delay={2.4}>
            <Dim>write</Dim> <span style={{ color: ink.text }}>slides/q2-launch/index.tsx</span>
          </Line>
          <Line delay={4.1}>
            <Dim>hmr</Dim> <span style={{ color: ink.text }}>localhost:5173/s/q2-launch</span>{' '}
            <Ok />
          </Line>
          <Line delay={4.5}>Done. Cover, Agenda, Problem,</Line>
          <Line delay={4.5}>Solution, Metrics, Next.</Line>
          <Line delay={5.0}>
            <Chevron />
            <Typed text="" delay={5.0} color={ink.text} />
          </Line>
          <div
            style={{
              marginTop: 'auto',
              paddingTop: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <AgentLogoRow />
            <span
              style={{
                fontFamily: font.mono,
                fontSize: 15,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: ink.muted,
              }}
            >
              any agent
            </span>
          </div>
        </div>
      </Window>
      <Editor
        className="gs gs-rise"
        width={1048}
        height={604}
        compact
        delay={0.3}
        rail={<Rail streamFrom={2.6} />}
      >
        <CanvasCard
          width={664}
          className="gs gs-bloom"
          style={{ animationDelay: '3.9s', animationDuration: '0.5s' }}
        >
          <Q2Cover />
        </CanvasCard>
      </Editor>
    </div>
  </Frame>
);

const EDIT_CARD = 1171;
const EDIT_K = S / (EDIT_CARD / 1920);

const EditPage: Page = () => (
  <Frame eyebrow="03 · Edit" title="Click any element. Tweak it. Save once.">
    <Editor
      className="gs gs-rise"
      width={1680}
      height={640}
      zoom={0.8}
      mode="edit"
      formatActive
      delay={0.2}
      rail={<Rail />}
      panel={
        <Panel
          title="Format"
          icon="paintbrush"
          banner={
            <div className="gs gs-fade" style={{ animationDelay: '1.65s' }}>
              <PanelBanner tab={0} />
            </div>
          }
        >
          <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
            <EmptySelection
              className="gs"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                opacity: 0,
                animationName: 've-empty',
                animationDuration: '1.65s',
                animationTimingFunction: 'linear',
              }}
            />
            <div className="gs gs-fade" style={{ animationDelay: '1.7s' }}>
              <TypographySection size={<Roll from="176" to="200" delay={2.5} />} />
              <ColorSection />
              <ContentSection />
            </div>
          </div>
        </Panel>
      }
    >
      <CanvasCard width={EDIT_CARD}>
        <Q2Cover titleClass="gs ve-size" titleSize={200} k={EDIT_K} frame>
          <span />
        </Q2Cover>
      </CanvasCard>
      <SaveFlow appear={2.7} press={4.35} />
      <Cursor className="gs ve-cursor" left={856} top={656} press={[1.5, 4.35]} />
    </Editor>
  </Frame>
);

const ArrangePage: Page = () => (
  <Frame eyebrow="03 · Edit" title="Drag. Align. Snap.">
    <Editor
      className="gs gs-rise"
      width={1680}
      height={640}
      zoom={0.8}
      mode="edit"
      formatActive
      delay={0.2}
      rail={<Rail />}
      panel={
        <Panel
          title="Format"
          icon="paintbrush"
          banner={<PanelBanner tab={1} />}
          footer={
            <>
              <Collapsible title="Comment" />
              <Collapsible title="Source" />
            </>
          }
        >
          <ArrangeFields y={<Roll from="160" to="420" delay={1.94} />} />
        </Panel>
      }
    >
      <CanvasCard width={EDIT_CARD}>
        <Q2Cover>
          <div
            className="gs ar-guide"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 420,
              height: EDIT_K,
              background: ink.guide,
            }}
          />
          <div
            className="gs ar-box"
            style={{
              position: 'absolute',
              left: 1200,
              top: 420,
              width: 480,
              height: 320,
              borderRadius: 24,
              background: ink.panel,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: ink.dim,
            }}
          >
            <svg
              width="72"
              height="72"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              {ICONS.image}
            </svg>
            <SelectionFrame k={EDIT_K} className="gs gs-fade" style={{ animationDelay: '1.3s' }} />
            <span
              className="gs ar-guide"
              style={{
                position: 'absolute',
                left: '50%',
                bottom: -34 * EDIT_K,
                transform: 'translateX(-50%)',
                padding: `${4 * EDIT_K}px ${8 * EDIT_K}px`,
                borderRadius: 4 * EDIT_K,
                background: ink.text,
                color: '#fff',
                fontFamily: font.mono,
                fontSize: 10 * EDIT_K,
                whiteSpace: 'nowrap',
              }}
            >
              480 × 320
            </span>
          </div>
        </Q2Cover>
      </CanvasCard>
      <Cursor className="gs ar-cursor" left={927} top={386} press={[1.3]} />
    </Editor>
  </Frame>
);

const CommentPage: Page = () => (
  <Frame eyebrow="04 · Comment" title="Point at what's wrong.">
    <Editor
      className="gs gs-rise"
      width={1680}
      height={640}
      zoom={0.8}
      mode="edit"
      formatActive
      delay={0.2}
      rail={<Rail />}
      panel={
        <Panel
          title="Format"
          icon="paintbrush"
          banner={<PanelBanner tab={0} />}
          tail
          footer={
            <>
              <Collapsible title="Comment" open>
                <TextareaMock className="gs cm-focus">
                  <span className="gs cm-ph" style={{ color: 'rgba(107, 107, 107, 0.7)' }}>
                    Describe a change for the agent…
                  </span>
                  <span
                    className="gs gs-out"
                    style={{
                      position: 'absolute',
                      left: u(10),
                      top: u(8),
                      color: ink.text,
                      animationDelay: '3.55s',
                    }}
                  >
                    <Typed text="Use the accent color on this title" delay={1.2} speed={0.04} />
                  </span>
                </TextareaMock>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: u(8),
                  }}
                >
                  <span
                    style={{
                      fontFamily: font.mono,
                      fontSize: u(10.5),
                      color: 'rgba(107, 107, 107, 0.7)',
                    }}
                  >
                    ⌘/ to focus · ⌘↵ to add
                  </span>
                  <Btn
                    variant="brand"
                    className="gs"
                    style={{
                      opacity: 0.45,
                      animationName: 'cm-btn, gs-press',
                      animationDuration: '0.8s, 0.24s',
                      animationDelay: '2.9s, 3.4s',
                      animationTimingFunction: `linear, ${EASE}`,
                    }}
                  >
                    Add comment
                  </Btn>
                </div>
              </Collapsible>
              <SourceSection />
            </>
          }
        >
          <TypographySection size="176" />
          <ColorSection />
          <ContentSection />
        </Panel>
      }
    >
      <CanvasCard width={EDIT_CARD}>
        <Q2Cover k={EDIT_K} frame />
      </CanvasCard>
      <CommentFab
        count={<Roll from="0" to="1" delay={3.55} />}
        panel={<CommentPanel delay={4.1} />}
      />
      <Cursor className="gs cm-cursor" left={1679} top={603} press={[3.4]} />
    </Editor>
  </Frame>
);

const ApplyPage: Page = () => (
  <Frame
    eyebrow="04 · Apply"
    title="The agent applies it."
    lead="Run /apply-comments. The agent reads each marker, edits exactly what you flagged, and removes the marker."
  >
    <div style={{ display: 'grid', gridTemplateColumns: '760px 1fr', gap: 32, height: '100%' }}>
      <Window
        className="gs gs-rise"
        title="claude · ~/my-deck"
        delay={0.2}
        style={{ height: '100%' }}
      >
        <div style={{ ...code, color: ink.soft }}>
          <Line delay={0} className="gs">
            <Chevron />
            <Typed text="/apply-comments" delay={0.5} color={ink.accent} caret={false} />
          </Line>
          <Line delay={1.7} />
          <Line delay={1.8}>1 comment found. Applying…</Line>
          <div
            className="gs gs-fade"
            style={{
              margin: '14px 0 18px',
              padding: '16px 20px',
              borderRadius: 8,
              background: ink.panel,
              fontSize: 19,
              lineHeight: 1.6,
              color: ink.soft,
              animationDelay: '2.3s',
            }}
          >
            <Line delay={2.3}>
              <P>11 </P> <P>&lt;</P>
              <Tag>section</Tag>
              <P>&gt;</P>
            </Line>
            <div
              className="gs ap-strike"
              style={{
                minHeight: '1.6em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <P>12 </P>
              {'   {/* '}
              <span style={{ color: ink.kw }}>@slide-comment</span> id=<Str>"c-a1b2c3d4"</Str> text=
              <Str>"Use the accent color on this title"</Str>
              {' */}'}
            </div>
            <Line delay={2.3}>
              <P>13 </P>
              {'   '}
              <P>&lt;</P>
              <Tag>h1</Tag> style<P>={'{{'}</P> color<P>:</P>{' '}
              <Str>
                '<Roll from="#0a0a0a" to="#de3b3d" delay={3.2} />'
              </Str>{' '}
              <P>{'}}'}&gt;</P>Q2 Launch<P>&lt;/</P>
              <Tag>h1</Tag>
              <P>&gt;</P>
            </Line>
            <Line delay={2.3}>
              <P>14 </P> <P>&lt;/</P>
              <Tag>section</Tag>
              <P>&gt;</P>
            </Line>
          </div>
          <Line delay={3.8}>
            <Dim>edit</Dim> <span style={{ color: ink.text }}>slides/q2-launch/index.tsx</span>
          </Line>
          <Line delay={4.0}>
            <Ok />
            <span style={{ color: ink.text }}>1 comment applied</span>
          </Line>
        </div>
      </Window>
      <Editor
        className="gs gs-rise"
        width={888}
        height={604}
        compact
        title=""
        delay={0.3}
        rail={<Rail />}
      >
        <CanvasCard width={504}>
          <Q2Cover titleClass="gs ap-color" titleColor={ink.accent} />
        </CanvasCard>
        <CommentFab count={<Roll from="1" to="0" delay={3.9} />} />
      </Editor>
    </div>
  </Frame>
);

const AssetsPage: Page = () => (
  <Frame
    eyebrow="Toolbox"
    title="Assets, in one place."
    lead="Drop files, search logos on svgl, pull Google Fonts. Everything lands in slides/<id>/assets/, ready to import."
  >
    <Editor className="gs gs-rise" width={1680} height={604} view="assets" delay={0.2}>
      <AssetsView />
    </Editor>
  </Frame>
);

const DesignPage: Page = () => (
  <Frame eyebrow="Toolbox" title="Design tokens, live.">
    <div style={{ display: 'grid', gridTemplateColumns: '560px 1fr', gap: 32, height: '100%' }}>
      <Window
        className="gs gs-rise"
        title="slides/q2-launch/index.tsx"
        right="design"
        delay={0.2}
        style={{ height: '100%' }}
      >
        <div style={{ ...code, fontSize: 21, lineHeight: 1.6 }}>
          <Line delay={0.5}>
            <K>export const</K> design<P>:</P> <Tag>DesignSystem</Tag> <P>= {'{'}</P>
          </Line>
          <Line delay={0.55}>
            {'  '}palette<P>: {'{'}</P>
          </Line>
          <Line delay={0.6}>
            {'    '}bg<P>:</P> <Str>'#ffffff'</Str>
            <P>,</P>
          </Line>
          <Line delay={0.65}>
            {'    '}text<P>:</P> <Str>'#0a0a0a'</Str>
            <P>,</P>
          </Line>
          <Line delay={0.7}>
            {'    '}accent<P>:</P> <Str>'#de3b3d'</Str>
            <P>,</P>
          </Line>
          <Line delay={0.75}>
            {'  '}
            <P>{'},'}</P>
          </Line>
          <Line delay={0.8}>
            {'  '}fonts<P>: {'{'}</P>
          </Line>
          <Line delay={0.85}>
            {'    '}display<P>:</P> <Str>'Geist, sans-serif'</Str>
            <P>,</P>
          </Line>
          <Line delay={0.9}>
            {'    '}body<P>:</P> <Str>'Geist, sans-serif'</Str>
            <P>,</P>
          </Line>
          <Line delay={0.95}>
            {'  '}
            <P>{'},'}</P>
          </Line>
          <Line delay={1.0}>
            {'  '}typeScale<P>: {'{'}</P> hero<P>:</P>{' '}
            <N>
              <Roll from="176" to="200" delay={4.9} />
            </N>
            <P>,</P> body<P>:</P> <N>32</N> <P>{'},'}</P>
          </Line>
          <Line delay={1.05}>
            {'  '}radius<P>:</P> <N>12</N>
            <P>,</P>
          </Line>
          <Line delay={1.1}>
            <P>{'};'}</P>
          </Line>
          <Line delay={1.15} />
          <Line delay={1.2}>
            <Dim>{'// read as var(--osd-size-hero)'}</Dim>
          </Line>
        </div>
      </Window>
      <Editor
        className="gs gs-rise"
        width={1088}
        height={640}
        zoom={0.8}
        title=""
        designActive
        delay={0.3}
        panel={<DesignPanel />}
      >
        <CanvasCard width={784}>
          <Q2Cover titleClass="gs ve-size" titleSize={200}>
            <span
              className="gs"
              style={{ display: 'none', animationDelay: '1.8s', animationDuration: '0.6s' }}
            />
          </Q2Cover>
        </CanvasCard>
        <SaveFlow appear={2.6} press={4.1} />
        <Cursor className="gs dp-cursor" left={646} top={656} press={[1.4, 4.1]} />
      </Editor>
    </div>
  </Frame>
);

const ThemeCard = ({
  id,
  mode,
  bg,
  text,
  accent,
  muted,
  family,
  sample,
  sub,
  delay,
}: {
  id: string;
  mode: string;
  bg: string;
  text: string;
  accent: string;
  muted: string;
  family: string;
  sample: string;
  sub: string;
  delay: number;
}) => (
  <div
    className="gs gs-rise"
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      padding: 16,
      borderRadius: 12,
      background: '#fff',
      boxShadow: shadow.window,
      animationDelay: `${delay}s`,
      minHeight: 0,
    }}
  >
    <div
      style={{
        flex: 1,
        minHeight: 0,
        borderRadius: 8,
        background: bg,
        color: text,
        padding: 40,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          fontFamily: font.mono,
          fontSize: 18,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: accent,
        }}
      >
        {id}
      </div>
      <div>
        <div
          style={{
            fontFamily: family,
            fontSize: 68,
            fontWeight: 600,
            lineHeight: 1.02,
            letterSpacing: '-0.02em',
          }}
        >
          {sample}
        </div>
        <div style={{ marginTop: 18, fontSize: 24, color: muted }}>{sub}</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: text,
            boxShadow: `inset 0 0 0 1px ${muted}`,
          }}
        />
        <span style={{ width: 26, height: 26, borderRadius: 6, background: accent }} />
        <span style={{ width: 26, height: 26, borderRadius: 6, background: muted }} />
      </div>
    </div>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 8px 4px',
        fontFamily: font.mono,
        fontSize: 18,
        color: ink.muted,
      }}
    >
      <span style={{ color: ink.text }}>themes/{id}.md</span>
      <span style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: 15 }}>
        {mode}
      </span>
    </div>
  </div>
);

const ThemesPage: Page = () => (
  <Frame
    eyebrow="Toolbox"
    title="Pin a look. Reuse it."
    lead="/create-theme writes themes/<id>.md: palette, type, and paste-ready Title and Footer components. /create-slide reads it before drafting."
  >
    <div
      style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, height: '100%' }}
    >
      <ThemeCard
        id="editorial-noir"
        mode="dark · serif"
        bg="#0b0d10"
        text="#f4ecdc"
        accent="#d6a64b"
        muted="#7a7468"
        family='Georgia, "Times New Roman", serif'
        sample="A quiet year."
        sub="Annual letter, 2026"
        delay={0.2}
      />
      <ThemeCard
        id="paper-press"
        mode="light · serif"
        bg="#f6f1e7"
        text="#141210"
        accent="#c43a1d"
        muted="#8a8276"
        family='"Times New Roman", Times, serif'
        sample="Field notes."
        sub="Research readout"
        delay={0.3}
      />
      <ThemeCard
        id="neon-terminal"
        mode="dark · mono"
        bg="#05070a"
        text="#e6edf3"
        accent="#39ff88"
        muted="#5b6773"
        family={font.mono}
        sample="$ boot"
        sub="Infra all-hands"
        delay={0.4}
      />
    </div>
  </Frame>
);

const MotionCol = ({
  label,
  copy,
  delay,
  children,
}: {
  label: string;
  copy: string;
  delay: number;
  children: ReactNode;
}) => (
  <div
    className="gs gs-rise"
    style={{ display: 'flex', flexDirection: 'column', gap: 24, animationDelay: `${delay}s` }}
  >
    <div
      style={{
        position: 'relative',
        height: 372,
        borderRadius: 12,
        background: ink.panel,
        boxShadow: `inset 0 0 0 1px ${ink.hairline}`,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
    <div style={{ fontFamily: font.mono, fontSize: 22, color: ink.text }}>{label}</div>
    <div style={{ marginTop: -10, fontSize: 24, lineHeight: 1.45, color: ink.soft }}>{copy}</div>
  </div>
);

const StepRow = ({
  n,
  children,
  first = false,
}: {
  n: string;
  children: ReactNode;
  first?: boolean;
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      height: 92,
      padding: '0 32px',
      borderTop: first ? 'none' : `1px solid ${ink.rule}`,
      fontSize: 26,
    }}
  >
    <span style={{ fontFamily: font.mono, fontSize: 20, color: ink.accent }}>{n}</span>
    {children}
  </div>
);

const MiniTransitionPage = ({ className, label }: { className: string; label: string }) => (
  <div
    className={className}
    style={{
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: 300,
      height: 169,
      marginLeft: -150,
      marginTop: -84.5,
      borderRadius: 8,
      background: '#fff',
      boxShadow: shadow.window,
      padding: 28,
      boxSizing: 'border-box',
    }}
  >
    <div
      style={{
        fontFamily: font.mono,
        fontSize: 12,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: ink.muted,
      }}
    >
      {label}
    </div>
    <div
      style={{
        marginTop: 18,
        fontSize: 30,
        fontWeight: 600,
        letterSpacing: '-0.03em',
        lineHeight: 1,
      }}
    >
      Next thought.
    </div>
    <div style={{ marginTop: 16, height: 6, width: 120, borderRadius: 3, background: ink.rule }} />
  </div>
);

const MotionPage: Page = () => (
  <Frame
    eyebrow="Toolbox"
    title="Motion, in three primitives."
    lead="Stepped reveals, one house transition, and shared-element morphs. All declared in the file. Press → to reveal the steps."
    mark={false}
  >
    <div
      style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48, height: '100%' }}
    >
      <MotionCol
        label="<Steps> / <Step>"
        copy="Each → reveals the next beat. Jumping in shows the page complete."
        delay={0.2}
      >
        <div style={{ padding: '48px 0' }}>
          <Steps>
            <Step>
              <StepRow n="01" first>
                Set the stage.
              </StepRow>
            </Step>
            <Step>
              <StepRow n="02">Layer the consequence.</StepRow>
            </Step>
            <Step>
              <StepRow n="03">Land the turn.</StepRow>
            </Step>
          </Steps>
        </div>
      </MotionCol>
      <MotionCol
        label="SlideTransition"
        copy="One DNA per deck: 6 px rise, 200 ms, ease-out. This deck uses it."
        delay={0.3}
      >
        <MiniTransitionPage className="gs mo-a" label="Page 01" />
        <MiniTransitionPage className="gs mo-b" label="Page 02" />
      </MotionCol>
      <MotionCol
        label="MorphElement"
        copy="The mark from the eyebrow glided here. Same id on both pages."
        delay={0.4}
      >
        <div
          style={{
            position: 'absolute',
            left: 196,
            top: 118,
            width: 136,
            height: 136,
            borderRadius: 34,
            border: `2px dashed ${ink.rule}`,
            boxSizing: 'border-box',
          }}
        />
        <MorphElement id="mark">
          <div
            style={{
              position: 'absolute',
              left: 204,
              top: 126,
              width: 120,
              height: 120,
              borderRadius: 28,
              background: 'var(--osd-accent)',
            }}
          />
        </MorphElement>
      </MotionCol>
    </div>
  </Frame>
);

const STAGE_SCALE = 604 / 1080;
const STAGE_W = 1920 * STAGE_SCALE;

const PresentPage: Page = () => (
  <Frame
    eyebrow="05 · Present"
    title="Present from the browser."
    lead="F for fullscreen, Enter for a window. Overview, laser, blackout, and the keyboard map are one key away."
  >
    <div
      className="gs gs-rise"
      style={{
        position: 'relative',
        width: 1680,
        height: 604,
        borderRadius: 12,
        background: '#000',
        overflow: 'hidden',
        boxShadow: shadow.window,
        animationDelay: '0.2s',
      }}
    >
      <div style={{ position: 'absolute', left: (1680 - STAGE_W) / 2, top: 0 }}>
        <MiniCanvas scale={STAGE_SCALE}>
          <MiniPage kind="agenda" />
        </MiniCanvas>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 3,
          background: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <div
          className="gs pr-progress"
          style={{ height: '100%', width: '100%', background: ink.accent }}
        />
      </div>
      <div
        className="gs pr-laser"
        style={{
          position: 'absolute',
          left: 806,
          top: 208,
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: ink.laser,
          boxShadow: `0 0 0 5px rgba(239, 68, 68, 0.25), 0 0 26px rgba(239, 68, 68, 0.85)`,
        }}
      />
      <PresentBar />
    </div>
  </Frame>
);

const PresenterPage: Page = () => (
  <Frame
    eyebrow="05 · Present"
    title="Notes travel with the deck."
    lead="Export notes next to your pages. Presenter view shows the current slide, what's next, and your script with a timer."
  >
    <div style={{ display: 'grid', gridTemplateColumns: '520px 1fr', gap: 32, height: '100%' }}>
      <Window
        className="gs gs-rise"
        title="slides/q2-launch/index.tsx"
        right="notes"
        delay={0.2}
        style={{ height: '100%' }}
      >
        <div style={{ ...code, fontSize: 21, lineHeight: 1.6 }}>
          <Line delay={0.5}>
            <K>export const</K> notes <P>= [</P>
          </Line>
          <Line delay={0.55}>
            {'  '}
            <Str>'Open with the customer quote.'</Str>
            <P>,</P>
          </Line>
          <Line delay={0.6}>
            {'  '}
            <Str>'Four beats, one per row.'</Str>
            <P>,</P>
          </Line>
          <Line delay={0.65}>
            {'  '}
            <Str>'Let the 3× land. Then breathe.'</Str>
            <P>,</P>
          </Line>
          <Line delay={0.7}>
            {'  '}
            <K>undefined</K>
            <P>,</P>
          </Line>
          <Line delay={0.75}>
            {'  '}
            <Str>'Cite the Q1 baseline first.'</Str>
            <P>,</P>
          </Line>
          <Line delay={0.8}>
            {'  '}
            <Str>'End on the waitlist link.'</Str>
            <P>,</P>
          </Line>
          <Line delay={0.85}>
            <P>];</P>
          </Line>
          <Line delay={0.9} />
          <Line delay={0.95}>
            <Dim>{'// index-aligned with the pages'}</Dim>
          </Line>
        </div>
      </Window>
      <PresenterWindow width={1128} height={604} />
    </div>
  </Frame>
);

const MenuItem = ({
  icon,
  children,
  hover = false,
}: {
  icon: IconName;
  children: ReactNode;
  hover?: boolean;
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: u(8),
      height: u(32),
      padding: `0 ${u(8)}px`,
      borderRadius: u(4),
      fontSize: u(12.5),
      background: hover ? ink.muted2 : 'transparent',
      whiteSpace: 'nowrap',
    }}
  >
    <Icon name={icon} size={14} style={{ color: ink.muted }} />
    {children}
  </div>
);

const HostTile = ({ src, name, delay }: { src: string; name: string; delay: number }) => (
  <LogoTile src={src} name={name} delay={delay} logoHeight={44} />
);

const ExportPage: Page = () => (
  <Frame
    eyebrow="Ship"
    title="Export it. Or deploy it."
    lead="Download HTML, PDF, or an editable PPTX from the editor. Or build once and drop dist/ on any static host."
  >
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, height: '100%' }}>
      <Editor
        className="gs gs-rise"
        width={824}
        height={604}
        compact
        title=""
        downloadOpen
        delay={0.2}
      >
        <CanvasCard width={760}>
          <Q2Cover />
        </CanvasCard>
        <div
          className="gs gs-pop"
          style={{
            position: 'absolute',
            right: u(165),
            top: -u(4),
            width: u(200),
            padding: u(4),
            borderRadius: u(6),
            border: `1px solid ${ink.rule}`,
            background: '#fff',
            boxShadow: shadow.overlay,
            transformOrigin: 'top right',
            animationDelay: '0.6s',
            zIndex: 6,
          }}
        >
          <MenuItem icon="file-code">Export as HTML</MenuItem>
          <MenuItem icon="file-text">Export as PDF</MenuItem>
          <MenuItem icon="presentation" hover>
            Export as PPTX
          </MenuItem>
          <MenuItem icon="file-image">Export as image PPTX</MenuItem>
        </div>
        <Cursor className="gs ex-cursor" left={300} top={128} press={[1.7]} />
        <Toast delay={2.1} />
      </Editor>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, height: '100%' }}>
        <Window className="gs gs-rise" title="~/my-deck — zsh" delay={0.3} style={{ height: 268 }}>
          <div style={term}>
            <Line delay={0} className="gs">
              <Prompt />
              <Typed text="pnpm build" delay={0.9} color={ink.text} caret={false} />
            </Line>
            <Line delay={1.9}>
              <Dim>vite v7</Dim> <span style={{ color: ink.text }}>building for production…</span>
            </Line>
            <Line delay={2.5}>
              <Ok />
              <span style={{ color: ink.text }}>built in 1.2s</span> <Dim>→ dist/</Dim>
            </Line>
            <Line delay={3.0}>
              <Prompt />
              <Typed text="" delay={3.0} color={ink.text} />
            </Line>
          </div>
        </Window>
        <div
          className="gs gs-rise"
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            alignItems: 'center',
            borderRadius: 12,
            background: '#fff',
            boxShadow: shadow.window,
            animationDelay: '0.4s',
          }}
        >
          <HostTile src={vercelLogo} name="Vercel" delay={0.6} />
          <HostTile src={cloudflareLogo} name="Cloudflare" delay={0.7} />
          <HostTile src={zeaburLogo} name="Zeabur" delay={0.8} />
        </div>
      </div>
    </div>
  </Frame>
);

const AgentsPage: Page = () => (
  <Frame
    eyebrow="Why open-slide"
    title="Bring your own agent."
    lead="Slides are plain .tsx files, so any tool that reads and writes React already works. No SDK, no lock-in."
  >
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 64,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', alignItems: 'center' }}>
        <LogoTile src={claudeLogo} name="Claude Code" delay={0.2} />
        <LogoTile src={codexLogo} name="Codex" delay={0.26} />
        <LogoTile src={cursorLogo} name="Cursor" delay={0.32} />
        <LogoTile src={geminiLogo} name="Gemini CLI" delay={0.38} />
        <LogoTile src={opencodeLogo} name="OpenCode" delay={0.44} />
        <LogoTile src={windsurfLogo} name="Windsurf" delay={0.5} />
        <LogoTile src={zedLogo} name="Zed" delay={0.56} />
      </div>
      <div
        className="gs gs-fade"
        style={{
          textAlign: 'center',
          fontFamily: font.mono,
          fontSize: 22,
          color: ink.muted,
          animationDelay: '0.9s',
        }}
      >
        …and anything else that can write files.
      </div>
    </div>
  </Frame>
);

const GitRow = ({ label, caption, delay }: { label: string; caption: string; delay: number }) => (
  <div
    className="gs gs-rise"
    style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 10,
      borderTop: `1px solid ${ink.rule}`,
      animationDelay: `${delay}s`,
    }}
  >
    <div style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.02em' }}>{label}</div>
    <div style={{ fontSize: 22, color: ink.muted }}>{caption}</div>
  </div>
);

const Commit = ({
  hash,
  head,
  msg,
  delay,
}: {
  hash: string;
  head?: string;
  msg: string;
  delay: number;
}) => (
  <Line delay={delay}>
    <span style={{ color: ink.accent }}>* </span>
    <span style={{ color: ink.num }}>{hash}</span>{' '}
    {head && <span style={{ color: ink.mint }}>{head} </span>}
    <span style={{ color: ink.text }}>{msg}</span>
  </Line>
);

const GitPage: Page = () => (
  <Frame
    eyebrow="Why open-slide"
    title="Yours. Forever."
    lead="Every slide is a file in your repo. Diff it, review it, branch it. No proprietary database, no export-and-pray."
  >
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 520px', gap: 64, height: '100%' }}>
      <Window
        className="gs gs-rise"
        title="~/my-deck — git log"
        delay={0.2}
        style={{ height: '100%' }}
      >
        <div style={term}>
          <Line delay={0} className="gs">
            <Prompt />
            <Typed
              text="git log --oneline slides/q2-launch/"
              delay={0.5}
              color={ink.text}
              caret={false}
            />
          </Line>
          <Line delay={2.2} />
          <Commit hash="a1b2c3d" head="(HEAD -> main)" msg="refine cover typography" delay={2.3} />
          <Commit hash="9f8e7d6" msg="revise Q2 metrics after finance review" delay={2.55} />
          <Commit hash="6a5b4c3" msg="apply comments from design crit" delay={2.8} />
          <Commit hash="3c2d1e0" msg="initial draft of the Q2 launch deck" delay={3.05} />
          <Line delay={3.3} />
          <Line delay={3.4}>
            <Prompt />
            <Typed text="" delay={3.4} color={ink.text} />
          </Line>
        </div>
      </Window>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <GitRow label="Plain .tsx files" caption="No proprietary format." delay={0.4} />
        <GitRow label="Diffable in any tool" caption="Review it like any other PR." delay={0.5} />
        <GitRow label="Branch · merge · revert" caption="The tools you already know." delay={0.6} />
      </div>
    </div>
  </Frame>
);

const RecapStep = ({
  n,
  title,
  caption,
  delay,
}: {
  n: string;
  title: string;
  caption: string;
  delay: number;
}) => (
  <div
    className="gs gs-rise"
    style={{
      borderTop: `1px solid ${ink.rule}`,
      paddingTop: 28,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      animationDelay: `${delay}s`,
    }}
  >
    <span
      style={{
        fontFamily: font.mono,
        fontSize: 20,
        letterSpacing: '0.08em',
        color: 'var(--osd-accent)',
      }}
    >
      {n}
    </span>
    <span style={{ fontSize: 40, fontWeight: 500, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
      {title}
    </span>
    <span style={{ fontFamily: font.mono, fontSize: 19, color: ink.muted, whiteSpace: 'nowrap' }}>
      {caption}
    </span>
  </div>
);

const RecapPage: Page = () => {
  const active = useIsActivePage();
  return (
    <div style={fill} data-still={active ? undefined : ''}>
      <Styles />
      <Mark />
      <div
        className="gs gs-rise"
        style={{
          position: 'absolute',
          left: 148,
          top: 96,
          fontSize: 22,
          lineHeight: '26px',
          fontWeight: 500,
          color: 'var(--osd-accent)',
        }}
      >
        Recap
      </div>
      <h2
        className="gs gs-rise"
        style={{
          position: 'absolute',
          left: 120,
          top: 200,
          margin: 0,
          fontFamily: font.display,
          fontSize: 120,
          fontWeight: 500,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          animationDelay: '0.06s',
        }}
      >
        That's the whole loop.
      </h2>
      <div
        style={{
          position: 'absolute',
          left: 120,
          right: 120,
          top: 460,
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 40,
        }}
      >
        <RecapStep n="01" title="Init" caption="npx @open-slide/cli init" delay={0.25} />
        <RecapStep n="02" title="Prompt" caption="/create-slide" delay={0.32} />
        <RecapStep n="03" title="Edit" caption="click · tweak · save" delay={0.39} />
        <RecapStep n="04" title="Comment" caption="/apply-comments" delay={0.46} />
        <RecapStep n="05" title="Present" caption="F · fullscreen" delay={0.53} />
      </div>
      <p
        className="gs gs-rise"
        style={{
          position: 'absolute',
          left: 120,
          top: 780,
          margin: 0,
          fontSize: 28,
          lineHeight: 1.45,
          color: ink.soft,
          animationDelay: '0.7s',
        }}
      >
        Edit{' '}
        <span style={{ fontFamily: font.mono, fontSize: 26, color: ink.text }}>
          slides/&lt;your-slide&gt;/index.tsx
        </span>{' '}
        and watch it hot-reload.
      </p>
      <Footer />
    </div>
  );
};

ThemesPage.transition = morphFade;
MotionPage.transition = morphFade;
PresentPage.transition = morphFade;

export const notes: (string | undefined)[] = [
  'Welcome. This deck is the getting-started tour. Arrow keys move, F goes fullscreen, P opens this presenter view.',
  'Every slide is a plain React file. The default export is the array of pages, in order.',
  'One command scaffolds the workspace: dependencies, git, and a dev server ready to go.',
  'Prompt your agent with /create-slide. Pages stream into the rail as the file is written.',
  'Switch to Edit, click any element, and change it in the Format panel. Save writes the whole batch once.',
  'The Arrange tab and smart guides handle position, size, rotation, and layer order.',
  'Leave a note on an element. It lands in the source as an @slide-comment marker.',
  'Run /apply-comments. The agent edits exactly what you flagged and removes the marker.',
  'Assets live next to the slide. Drop files, or search logos and fonts without leaving the editor.',
  'A design const declares the tokens. The Design panel tweaks them live and writes them back.',
  'Themes are markdown: palette, type, and paste-ready components. /create-slide reads them first.',
  'Three motion primitives: Steps, SlideTransition, and MorphElement. Press → here to reveal the steps.',
  'Press F to present. Overview, laser, blackout, and the keyboard map are one key away.',
  'Speaker notes ship in the file and show up here, in presenter view, next to the timer.',
  'Export HTML, PDF, or PPTX from the editor, or build once and deploy the dist folder anywhere.',
  'Any agent that writes files works. No SDK, no lock-in.',
  'Slides are files in your repo. Diff them, review them, branch them.',
  'That is the whole loop. Edit this file and watch it hot-reload.',
];

export const meta: SlideMeta = {
  title: 'Getting started',
  createdAt: '2026-09-25T06:36:11.800Z',
};

export default [
  Cover,
  FilePage,
  InitPage,
  PromptPage,
  EditPage,
  ArrangePage,
  CommentPage,
  ApplyPage,
  AssetsPage,
  DesignPage,
  ThemesPage,
  MotionPage,
  PresentPage,
  PresenterPage,
  ExportPage,
  AgentsPage,
  GitPage,
  RecapPage,
] satisfies Page[];
