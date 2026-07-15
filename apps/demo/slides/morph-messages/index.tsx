import {
  type DesignSystem,
  MorphElement,
  type Page,
  type SlideMeta,
  type SlideTransition,
  useIsActivePage,
} from '@open-slide/core';
import type { CSSProperties, ReactNode } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#fbfbfd', text: '#1d1d1f', accent: '#0a84ff' },
  fonts: {
    display: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    body: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
  },
  typeScale: { hero: 144, body: 44 },
  radius: 999,
};

export const meta: SlideMeta = {
  title: 'Introducing Morph Transition',
  createdAt: '2026-07-15T13:59:59.809Z',
};

const MORPH_MS = 820;

export const transition: SlideTransition = {
  duration: 280,
  exit: {
    duration: 224,
    easing: 'cubic-bezier(0.4, 0, 1, 1)',
    keyframes: [{ opacity: 1 }, { opacity: 0 }],
  },
  enter: {
    duration: 308,
    delay: 112,
    easing: 'cubic-bezier(0, 0, 0.2, 1)',
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
  },
  morph: { duration: MORPH_MS, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
};

const muted = '#86868b';

if (typeof document !== 'undefined' && !document.getElementById('morph-messages-styles')) {
  const style = document.createElement('style');
  style.id = 'morph-messages-styles';
  style.textContent =
    '@keyframes morph-messages-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }';
  document.head.appendChild(style);
}

const stage: CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: 'var(--osd-font-display)',
};

const centered: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

// All box geometry rides in em so the pill keeps its aspect ratio at every
// font size — the morph clone then scales uniformly instead of stretching.
const Line = ({
  id,
  fontSize,
  color,
  background = 'transparent',
  children,
}: {
  id: string;
  fontSize: number | string;
  color: string;
  background?: string;
  children: ReactNode;
}) => (
  <MorphElement id={id}>
    <div
      style={{
        fontSize,
        lineHeight: 1.25,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        whiteSpace: 'nowrap',
        padding: '0.3em 0.7em',
        borderRadius: 'var(--osd-radius)',
        background,
        color,
      }}
    >
      {children}
    </div>
  </MorphElement>
);

const Introducing: Page = () => (
  <section style={stage}>
    <div style={centered}>
      <Line id="msg-introducing" fontSize="var(--osd-size-hero)" color="var(--osd-text)">
        Introducing
      </Line>
    </div>
  </section>
);

const Reveal: Page = () => (
  <section style={stage}>
    <div style={{ ...centered, gap: 8 }}>
      <Line id="msg-introducing" fontSize={72} color={muted}>
        Introducing
      </Line>
      <Line id="msg-morph" fontSize="var(--osd-size-hero)" color="var(--osd-text)">
        Morph Transition
      </Line>
    </div>
  </section>
);

const Thread: Page = () => {
  const animate = useIsActivePage();
  return (
    <section style={stage}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 160,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 14,
        }}
      >
        <Line
          id="msg-introducing"
          fontSize="var(--osd-size-body)"
          color="#ffffff"
          background="var(--osd-accent)"
        >
          Introducing
        </Line>
        <Line
          id="msg-morph"
          fontSize="var(--osd-size-body)"
          color="#ffffff"
          background="var(--osd-accent)"
        >
          Morph Transition
        </Line>
        <div
          style={{
            fontFamily: 'var(--osd-font-body)',
            fontSize: 24,
            fontWeight: 500,
            color: muted,
            marginRight: 12,
            animation: animate
              ? `morph-messages-rise 480ms cubic-bezier(0, 0, 0.2, 1) ${MORPH_MS}ms both`
              : 'none',
          }}
        >
          Delivered
        </div>
      </div>
    </section>
  );
};

export default [Introducing, Reveal, Thread] satisfies Page[];
