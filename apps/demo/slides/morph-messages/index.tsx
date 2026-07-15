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

const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';
const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_STANDARD = 'cubic-bezier(0.4, 0, 0.2, 1)';

const HERO_MORPH_MS = 1250;
const THREAD_MORPH_MS = 750;
const RISE_MS = 420;

export const transition: SlideTransition = {
  duration: 360,
  exit: {
    duration: 288,
    easing: EASE_IN,
    keyframes: [{ opacity: 1 }, { opacity: 0 }],
  },
  enter: {
    duration: 396,
    delay: 144,
    easing: EASE_OUT,
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
  },
  morph: { duration: HERO_MORPH_MS, easing: EASE_STANDARD },
};

const threadTransition: SlideTransition = {
  duration: 280,
  exit: {
    duration: 224,
    easing: EASE_IN,
    keyframes: [{ opacity: 1 }, { opacity: 0 }],
  },
  enter: {
    duration: 308,
    delay: 112,
    easing: EASE_OUT,
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
  },
  morph: { duration: THREAD_MORPH_MS, easing: EASE_STANDARD },
};

const muted = '#86868b';
const grayBubble = '#e9e9eb';

if (typeof document !== 'undefined' && !document.getElementById('morph-messages-styles')) {
  const style = document.createElement('style');
  style.id = 'morph-messages-styles';
  style.textContent =
    '@keyframes morph-messages-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }';
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

const thread: CSSProperties = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: 160,
  right: 160,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  justifyContent: 'center',
  gap: 14,
};

// All box geometry rides in em so the pill keeps its aspect ratio at every
// font size — the morph clone then scales uniformly instead of stretching.
const pill = (
  fontSize: number | string,
  color: string,
  background: string,
  received: boolean,
): CSSProperties => ({
  fontSize,
  lineHeight: 1.25,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  whiteSpace: 'nowrap',
  padding: '0.3em 0.7em',
  borderRadius: 'var(--osd-radius)',
  background,
  color,
  alignSelf: received ? 'flex-start' : undefined,
});

type LineProps = {
  id: string;
  fontSize: number | string;
  color: string;
  background?: string;
  received?: boolean;
  style?: CSSProperties;
  children: ReactNode;
};

const Line = ({
  id,
  fontSize,
  color,
  background = 'transparent',
  received = false,
  style,
  children,
}: LineProps) => (
  <MorphElement id={id}>
    <div style={{ ...pill(fontSize, color, background, received), ...style }}>{children}</div>
  </MorphElement>
);

// A message on its debut page: the audience-facing instance renders without a
// morph id so the runtime doesn't clone it and the fade-up owns the entrance;
// every other instance (exit snapshot, thumbnails, print) renders the settled
// MorphElement so the next cut can still pair it.
const DebutLine = (props: LineProps) => {
  const animate = useIsActivePage();
  if (!animate) return <Line {...props} />;
  const { fontSize, color, background = 'transparent', received = false, style, children } = props;
  return (
    <div
      style={{
        ...pill(fontSize, color, background, received),
        ...style,
        animation: `morph-messages-rise ${RISE_MS}ms ${EASE_OUT} ${THREAD_MORPH_MS}ms both`,
      }}
    >
      {children}
    </div>
  );
};

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
    <div style={centered}>
      <Line id="msg-introducing" fontSize={72} color={muted}>
        Introducing
      </Line>
      <Line
        id="msg-morph"
        fontSize="var(--osd-size-hero)"
        color="var(--osd-text)"
        style={{ marginTop: -36 }}
      >
        Morph Transition
      </Line>
    </div>
  </section>
);

const Sent: Page = () => {
  const animate = useIsActivePage();
  return (
    <section style={stage}>
      <div style={thread}>
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
              ? `morph-messages-rise 480ms ${EASE_OUT} ${HERO_MORPH_MS}ms both`
              : 'none',
          }}
        >
          Delivered
        </div>
      </div>
    </section>
  );
};

const Question: Page = () => (
  <section style={stage}>
    <div style={thread}>
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
      <DebutLine
        id="msg-question"
        fontSize="var(--osd-size-body)"
        color="var(--osd-text)"
        background={grayBubble}
        received
      >
        How do I use it? 👀
      </DebutLine>
    </div>
  </section>
);

const Answer: Page = () => (
  <section style={stage}>
    <div style={thread}>
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
      <Line
        id="msg-question"
        fontSize="var(--osd-size-body)"
        color="var(--osd-text)"
        background={grayBubble}
        received
      >
        How do I use it? 👀
      </Line>
      <DebutLine
        id="msg-answer"
        fontSize="var(--osd-size-body)"
        color="#ffffff"
        background="var(--osd-accent)"
      >
        Use the new Morph Transition primitive from open-slide
      </DebutLine>
    </div>
  </section>
);

Question.transition = threadTransition;
Answer.transition = threadTransition;

export default [Introducing, Reveal, Sent, Question, Answer] satisfies Page[];
