import {
  type DesignSystem,
  MorphElement,
  type Page,
  type SlideMeta,
  type SlideTransition,
  useIsActivePage,
} from '@open-slide/core';
import { type CSSProperties, type ReactNode, useState } from 'react';

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
const SLIDE_MS = 920;
const DIAMOND_X = 654;

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
  style.textContent = [
    '@keyframes morph-messages-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }',
    `@keyframes morph-messages-slide-left { from { transform: translateX(${960 - DIAMOND_X}px); } to { transform: none; } }`,
    '@keyframes morph-messages-slide-right { from { opacity: 0; transform: translateX(-64px); } to { opacity: 1; transform: none; } }',
    '@keyframes morph-messages-hero-in { from { opacity: 0; transform: translateY(24px); filter: blur(12px); } to { opacity: 1; transform: none; filter: none; } }',
  ].join('');
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

// A message about to depart into a shape-only morph: the exit-snapshot
// instance splits the bubble into a shell and a label morph element, so the
// shell can change aspect freely while the label rides its own pair —
// shrinking uniformly and dissolving via color interpolation — instead of
// squashing inside a single-element clone. The audience-facing instance stays
// a plain Line so arriving morphs still land on a full bubble.
const ShedLine = (props: LineProps) => {
  const animate = useIsActivePage();
  if (animate) return <Line {...props} />;
  const {
    id,
    fontSize,
    color,
    background = 'transparent',
    received = false,
    style,
    children,
  } = props;
  return (
    <div style={{ position: 'relative', alignSelf: received ? 'flex-start' : undefined }}>
      <MorphElement id={id}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'var(--osd-radius)',
            background,
          }}
        />
      </MorphElement>
      <MorphElement id={`${id}-label`}>
        <div
          style={{ ...pill(fontSize, color, 'transparent', false), position: 'relative', ...style }}
        >
          {children}
        </div>
      </MorphElement>
    </div>
  );
};

// The hero entrance plays exactly once — on the deck's first audience-facing
// mount. Every later active mount can be the measured target of a backward
// 2→1 morph, and a replaying rise/fade would poison the measured rect and
// opacity endpoints. The flag is set from onAnimationStart (not an effect)
// so StrictMode's mount/unmount/remount cycle can't burn it before the
// animation ever shows.
let heroEntranceShown = false;

const Introducing: Page = () => {
  const active = useIsActivePage();
  const [entrance] = useState(() => active && !heroEntranceShown);
  return (
    <section style={stage}>
      <div style={centered}>
        <div
          style={{
            animation: entrance ? `morph-messages-hero-in 720ms ${EASE_OUT} 60ms both` : 'none',
          }}
          onAnimationStart={() => {
            heroEntranceShown = true;
          }}
        >
          <Line id="msg-introducing" fontSize="var(--osd-size-hero)" color="var(--osd-text)">
            Introducing
          </Line>
        </div>
      </div>
    </section>
  );
};

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
      <ShedLine
        id="msg-introducing"
        fontSize="var(--osd-size-body)"
        color="#ffffff"
        background="var(--osd-accent)"
      >
        Introducing
      </ShedLine>
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

const FromThis: Page = () => {
  const animate = useIsActivePage();
  return (
    <section style={stage}>
      <MorphElement id="msg-introducing">
        <div
          style={{
            // The exit snapshot pins the radius to exactly half the box so
            // the departing 06→07 morph relaxes its corners across the whole
            // glide — an oversized radius (999px) spends most of the
            // interpolation above the paint-time clamp, compressing the
            // visible change into the final frames. The audience-facing
            // instance keeps the token so the 05→06 arrival morphs against
            // the original value.
            borderRadius: animate ? 'var(--osd-radius)' : 120,
            position: 'absolute',
            left: 840,
            top: 420,
            width: 240,
            height: 240,
            background: 'var(--osd-accent)',
          }}
        />
      </MorphElement>
      {/* Invisible pair target: the departing label glides here, shrinking
          uniformly (em geometry, half the font size) while its color fades to
          zero-alpha white — a visible dissolve instead of a squashed ride. */}
      <div
        style={{
          position: 'absolute',
          left: 840,
          top: 420,
          width: 240,
          height: 240,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MorphElement id="msg-introducing-label">
          <div
            style={pill(
              'calc(var(--osd-size-body) / 2)',
              'rgba(255, 255, 255, 0)',
              'transparent',
              false,
            )}
          >
            Introducing
          </div>
        </MorphElement>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 732,
          textAlign: 'center',
          fontSize: 64,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: muted,
          animation: animate
            ? `morph-messages-rise ${RISE_MS}ms ${EASE_OUT} ${HERO_MORPH_MS}ms both`
            : 'none',
        }}
      >
        from this
      </div>
    </section>
  );
};

const ToThis: Page = () => {
  const animate = useIsActivePage();
  return (
    <section style={stage}>
      <MorphElement id="msg-introducing">
        <div
          style={{
            position: 'absolute',
            left: 582,
            top: 162,
            width: 756,
            height: 756,
            borderRadius: 120,
            background: 'var(--osd-accent)',
          }}
        />
      </MorphElement>
      <div
        style={{
          position: 'absolute',
          left: 582,
          top: 162,
          width: 756,
          height: 756,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 96,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: '#ffffff',
          animation: animate
            ? `morph-messages-rise ${RISE_MS}ms ${EASE_OUT} ${HERO_MORPH_MS}ms both`
            : 'none',
        }}
      >
        to this
      </div>
    </section>
  );
};

// The static layout is the settled end state (diamond at DIAMOND_X, command
// visible). While the morph runs, the fill-both slide-left animation holds
// the wrapper offset so the diamond sits at canvas center — the morph
// measures and lands there — then slides it left as the command sweeps in.
const Spin: Page = () => {
  const animate = useIsActivePage();
  return (
    <section style={stage}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          animation: animate
            ? `morph-messages-slide-left ${SLIDE_MS}ms ${EASE_OUT} ${HERO_MORPH_MS}ms both`
            : 'none',
        }}
      >
        <MorphElement id="msg-introducing">
          <div
            style={{
              // The morph runtime composes the clone's transform about
              // 'top left', so the element must rotate about the same origin;
              // the layout position is offset by R(135°)·(12,12) so the
              // rotated box still centers on (DIAMOND_X, 540). Keeping the
              // rotation on the morph node is what makes the runtime
              // interpolate it into the glide.
              left: DIAMOND_X + 16.97,
              top: 540,
              position: 'absolute',
              width: 24,
              height: 24,
              borderRadius: 4,
              background: 'var(--osd-accent)',
              transform: 'rotate(135deg)',
              transformOrigin: '0 0',
            }}
          />
        </MorphElement>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 707,
          top: 520,
          fontSize: 40,
          lineHeight: 1,
          fontWeight: 600,
          fontFamily: 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace',
          color: 'var(--osd-text)',
          animation: animate
            ? `morph-messages-slide-right ${SLIDE_MS}ms ${EASE_OUT} ${HERO_MORPH_MS + 140}ms both`
            : 'none',
        }}
      >
        npx @open-slide/cli init
      </div>
    </section>
  );
};

Question.transition = threadTransition;
Answer.transition = threadTransition;

export default [
  Introducing,
  Reveal,
  Sent,
  Question,
  Answer,
  FromThis,
  ToThis,
  Spin,
] satisfies Page[];
