import type { DesignSystem, Page, SlideMeta, SlideTransition } from '@open-slide/core';
import type { CSSProperties } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#0c0c0d', text: '#f3f1ea', accent: '#d6d2c4' },
  fonts: {
    display: 'ui-serif, Georgia, "Times New Roman", serif',
    body: '-apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif',
  },
  typeScale: { hero: 168, body: 34 },
  radius: 6,
};

const muted = 'rgba(243, 241, 234, 0.42)';
const hairline = 'rgba(243, 241, 234, 0.10)';

const fill = {
  width: '100%',
  height: '100%',
  fontFamily: 'var(--osd-font-body)',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
} as const;

const EYEBROW: CSSProperties = {
  fontSize: 20,
  letterSpacing: '0.28em',
  color: 'var(--osd-accent)',
  textTransform: 'uppercase',
  fontWeight: 500,
};

const FOOT: CSSProperties = {
  fontSize: 18,
  letterSpacing: '0.22em',
  color: muted,
  textTransform: 'uppercase',
  fontVariantNumeric: 'tabular-nums',
};

const Cover: Page = () => (
  <div
    style={{
      ...fill,
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
      padding: '120px 144px',
    }}
  >
    <div style={EYEBROW}>open-slide · field notes</div>
    <div style={{ alignSelf: 'center' }}>
      <h1
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 'var(--osd-size-hero)',
          fontWeight: 400,
          lineHeight: 0.96,
          letterSpacing: '-0.035em',
          margin: 0,
        }}
      >
        On tasteful
        <br />
        transitions.
      </h1>
      <p
        style={{
          fontSize: 32,
          lineHeight: 1.5,
          color: muted,
          marginTop: 48,
          maxWidth: 980,
          fontStyle: 'italic',
        }}
      >
        Six pages, six transitions, one quiet family of motion.
      </p>
    </div>
    <div style={{ ...FOOT, display: 'flex', justifyContent: 'space-between' }}>
      <span>01 · settle</span>
      <span>arrow keys ⇆</span>
    </div>
  </div>
);

const Lesson = ({
  n,
  label,
  heading,
  body,
  pull,
}: {
  n: string;
  label: string;
  heading: string;
  body: string;
  pull: string;
}) => (
  <div
    style={{
      ...fill,
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
      padding: '120px 144px',
    }}
  >
    <div style={EYEBROW}>{`§ ${n}`}</div>
    <div
      style={{
        alignSelf: 'center',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        columnGap: 120,
        alignItems: 'start',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 92,
          fontWeight: 400,
          lineHeight: 1.02,
          letterSpacing: '-0.025em',
          margin: 0,
        }}
      >
        {heading}
      </h2>
      <div>
        <p
          style={{
            fontSize: 36,
            lineHeight: 1.45,
            color: 'var(--osd-text)',
            margin: 0,
            fontFamily: 'var(--osd-font-display)',
            fontStyle: 'italic',
          }}
        >
          “{pull}”
        </p>
        <p
          style={{
            fontSize: 26,
            lineHeight: 1.6,
            color: muted,
            marginTop: 56,
            borderTop: `1px solid ${hairline}`,
            paddingTop: 32,
          }}
        >
          {body}
        </p>
      </div>
    </div>
    <div style={{ ...FOOT, display: 'flex', justifyContent: 'space-between' }}>
      <span>
        {n} · {label}
      </span>
      <span>transition · {label}</span>
    </div>
  </div>
);

const Family: Page = () => (
  <Lesson
    n="02"
    label="dissolve"
    heading={'A family,\nnot a sampler.'}
    pull="Vary the property — never the vocabulary."
    body="Every transition in this deck shares the same DNA: a 140 ms exit, a 200 ms enter delayed 80 ms, and ease-out on the way in. What changes is only which property gets nudged — opacity, six pixels of Y, three hundredths of scale, a hair of blur. Restraint is the rhythm; difference lives at the edges."
  />
);

const ShortDurations: Page = () => (
  <Lesson
    n="03"
    label="rise"
    heading={'Two hundred\nmilliseconds.'}
    pull="If you can feel the duration, it is already too long."
    body="The house default — opacity plus six pixels of vertical rise, exit and enter overlapped. Brisk enough to be invisible, slow enough to read as continuity. Anything past 350 ms drifts into video-editor territory; reserve that range for moments that genuinely transform on screen."
  />
);

const Pause: Page = () => (
  <div
    style={{
      ...fill,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 144,
      textAlign: 'center',
    }}
  >
    <div style={{ ...EYEBROW, marginBottom: 72 }}>§ intermission</div>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 200,
        fontWeight: 400,
        lineHeight: 0.95,
        letterSpacing: '-0.04em',
        margin: 0,
      }}
    >
      Restraint.
    </h2>
    <p
      style={{
        fontSize: 28,
        lineHeight: 1.5,
        color: muted,
        marginTop: 64,
        maxWidth: 800,
        fontStyle: 'italic',
      }}
    >
      A chapter deserves a breath — exit, hold, then return.
    </p>
    <div
      style={{
        ...FOOT,
        position: 'absolute',
        left: 144,
        right: 144,
        bottom: 120,
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <span>04 · breath</span>
      <span>transition · breath</span>
    </div>
  </div>
);

const SmallMagnitudes: Page = () => (
  <Lesson
    n="05"
    label="bloom"
    heading={'Three percent,\nnot thirty.'}
    pull="Small motion reads as continuity; large motion reads as rupture."
    body="This page scales in from ninety-seven percent — barely enough to register, more than enough to feel arrival. The brain forgives almost any motion that stays under three percent of magnitude; past that, it starts to demand a reason."
  />
);

const Closing: Page = () => (
  <div
    style={{
      ...fill,
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
      padding: '120px 144px',
    }}
  >
    <div style={EYEBROW}>fin</div>
    <div style={{ alignSelf: 'center', maxWidth: 1400 }}>
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 140,
          fontWeight: 400,
          lineHeight: 0.98,
          letterSpacing: '-0.03em',
          margin: 0,
        }}
      >
        Good motion is
        <br />
        <em style={{ fontStyle: 'italic' }}>invisible</em>.
      </h2>
      <p
        style={{
          fontSize: 26,
          lineHeight: 1.6,
          color: muted,
          marginTop: 56,
          maxWidth: 920,
          borderTop: `1px solid ${hairline}`,
          paddingTop: 32,
        }}
      >
        Six different moves, none of which announce themselves. The reader perceives variety; the
        eye still reads one consistent hand.
      </p>
    </div>
    <div style={{ ...FOOT, display: 'flex', justifyContent: 'space-between' }}>
      <span>06 · fall</span>
      <span>← to revisit</span>
    </div>
  </div>
);

// Shared DNA across all six transitions:
//   - Out-then-in with 80 ms overlap (exit starts immediately, enter delays).
//   - Exit ~140-180 ms · ease-in.  Enter ~200-280 ms · ease-out.
//   - Opacity is always one of the animated properties.
//   - Translate magnitude never exceeds 12px.  Scale never exceeds 3%.
const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';

// 1 · SETTLE — cover-grade. Rise + soft blur falloff on enter.
Cover.transition = {
  duration: 280,
  easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
  exit: {
    duration: 160,
    easing: EASE_IN,
    keyframes: [
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(-6px)' },
    ],
  },
  enter: {
    duration: 280,
    delay: 100,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(12px)', filter: 'blur(4px)' },
      { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' },
    ],
  },
};

// 2 · DISSOLVE — pure opacity. Apple's safe default. Quietest possible.
Family.transition = {
  duration: 240,
  exit: {
    duration: 200,
    easing: EASE_IN,
    keyframes: [{ opacity: 1 }, { opacity: 0 }],
  },
  enter: {
    duration: 240,
    delay: 40,
    easing: EASE_OUT,
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
  },
};

// 3 · RISE — the house quiet. 6 px of Y, exit-then-enter overlap.
// Exported as the module default so future pages inherit it.
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

// 4 · BREATH — section divider. Exit fully, hold 120 ms, then enter.
Pause.transition = {
  duration: 460,
  exit: {
    duration: 180,
    easing: EASE_IN,
    keyframes: [{ opacity: 1 }, { opacity: 0 }],
  },
  enter: {
    duration: 240,
    delay: 300,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(8px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
};

// 5 · BLOOM — scale only. 0.97 → 1, no translate. Materializes in place.
SmallMagnitudes.transition = {
  duration: 240,
  exit: {
    duration: 160,
    easing: EASE_IN,
    keyframes: [
      { opacity: 1, transform: 'scale(1)' },
      { opacity: 0, transform: 'scale(1.01)' },
    ],
  },
  enter: {
    duration: 240,
    delay: 80,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'scale(0.97)' },
      { opacity: 1, transform: 'scale(1)' },
    ],
  },
};

// 6 · FALL — mirrored Rise. Enters from above; the deck settles to a stop.
Closing.transition = {
  duration: 200,
  exit: {
    duration: 140,
    easing: EASE_IN,
    keyframes: [
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(4px)' },
    ],
  },
  enter: {
    duration: 200,
    delay: 80,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(-6px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
};

export const meta: SlideMeta = {
  title: 'On Tasteful Transitions',
  createdAt: '2026-05-20T06:12:31.353Z',
};

export default [Cover, Family, ShortDurations, Pause, SmallMagnitudes, Closing] satisfies Page[];
