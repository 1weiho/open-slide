import {
  type DesignSystem,
  type Page,
  type SlideMeta,
  type SlideTransition,
  Step,
  Steps,
  useSlidePageNumber,
} from '@open-slide/core';
import type { CSSProperties, ReactNode } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#0a0b0f', text: '#f3f2ec', accent: '#5ce0c6' },
  fonts: {
    display: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
    body: '-apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif',
  },
  typeScale: { hero: 168, body: 34 },
  radius: 14,
};

const muted = 'rgba(243, 242, 236, 0.5)';
const faint = 'rgba(243, 242, 236, 0.32)';
const hairline = 'rgba(243, 242, 236, 0.12)';
const accentSoft = 'rgba(92, 224, 198, 0.32)';
const coral = '#ff6b5d';
const mono = '"SF Mono", "JetBrains Mono", "Menlo", ui-monospace, monospace';

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const OVERSHOOT = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

// Each rule only matches once its <Step> wrapper flips to
// data-osd-step="revealed", so the entrance keyframe fires on reveal rather
// than on page mount. `both` fill-mode leaves the element in its resting
// state, which is also how static (thumbnail / export) renders read it.
const css = `
@property --m-count { syntax: '<integer>'; initial-value: 0; inherits: false; }

@keyframes mRise { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
@keyframes mLeft { from { opacity: 0; transform: translateX(-64px); } to { opacity: 1; transform: translateX(0); } }
@keyframes mRight { from { opacity: 0; transform: translateX(64px); } to { opacity: 1; transform: translateX(0); } }
@keyframes mPop { from { opacity: 0; transform: scale(0.62); } to { opacity: 1; transform: scale(1); } }
@keyframes mBlur { from { opacity: 0; filter: blur(18px); transform: translateY(8px); } to { opacity: 1; filter: blur(0); transform: translateY(0); } }
@keyframes mFlip { from { opacity: 0; transform: rotateX(-92deg); } to { opacity: 1; transform: rotateX(0); } }
@keyframes mWipe { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
@keyframes mTile { from { opacity: 0; transform: scale(0.5) translateY(18px); } to { opacity: 1; transform: scale(1) translateY(0); } }
@keyframes mBar { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes mDraw { from { stroke-dashoffset: var(--m-len, 1500); } to { stroke-dashoffset: 0; } }
@keyframes mDash { from { opacity: 0; transform: scaleX(0); } to { opacity: 1; transform: scaleX(1); } }
@keyframes mCount { from { --m-count: 0; } to { --m-count: var(--m-to, 0); } }
@keyframes mSweep { from { background-size: 0% 0.5em; } to { background-size: 100% 0.5em; } }

[data-osd-step="revealed"] .m-rise     { animation: mRise 680ms ${EASE} both; }
[data-osd-step="revealed"] .m-left     { animation: mLeft 640ms ${EASE} both; }
[data-osd-step="revealed"] .m-right    { animation: mRight 640ms ${EASE} both; }
[data-osd-step="revealed"] .m-pop      { animation: mPop 620ms ${OVERSHOOT} both; }
[data-osd-step="revealed"] .m-pop-late { animation: mPop 560ms ${OVERSHOOT} 820ms both; }
[data-osd-step="revealed"] .m-blur     { animation: mBlur 760ms ${EASE} both; }
[data-osd-step="revealed"] .m-flip     { animation: mFlip 720ms ${OVERSHOOT} both; transform-origin: top center; backface-visibility: hidden; }
[data-osd-step="revealed"] .m-wipe     { animation: mWipe 720ms ${EASE} both; }
[data-osd-step="revealed"] .m-bar      { animation: mBar 820ms ${OVERSHOOT} both; transform-origin: bottom center; }
[data-osd-step="revealed"] .m-draw     { animation: mDraw 1100ms ${EASE} both; }
[data-osd-step="revealed"] .m-dash     { animation: mDash 600ms ${EASE} both; transform-origin: left center; }
[data-osd-step="revealed"] .m-count    { animation: mCount 1200ms ${EASE} both; }
[data-osd-step="revealed"] .m-sweep    { animation: mSweep 620ms ${EASE} both; }

[data-osd-step="revealed"] .m-grid > * { animation: mTile 560ms ${OVERSHOOT} both; }
[data-osd-step="revealed"] .m-grid > *:nth-child(1)  { animation-delay: 0ms; }
[data-osd-step="revealed"] .m-grid > *:nth-child(2)  { animation-delay: 50ms; }
[data-osd-step="revealed"] .m-grid > *:nth-child(3)  { animation-delay: 100ms; }
[data-osd-step="revealed"] .m-grid > *:nth-child(4)  { animation-delay: 150ms; }
[data-osd-step="revealed"] .m-grid > *:nth-child(5)  { animation-delay: 80ms; }
[data-osd-step="revealed"] .m-grid > *:nth-child(6)  { animation-delay: 130ms; }
[data-osd-step="revealed"] .m-grid > *:nth-child(7)  { animation-delay: 180ms; }
[data-osd-step="revealed"] .m-grid > *:nth-child(8)  { animation-delay: 230ms; }
[data-osd-step="revealed"] .m-grid > *:nth-child(9)  { animation-delay: 160ms; }
[data-osd-step="revealed"] .m-grid > *:nth-child(10) { animation-delay: 210ms; }
[data-osd-step="revealed"] .m-grid > *:nth-child(11) { animation-delay: 260ms; }
[data-osd-step="revealed"] .m-grid > *:nth-child(12) { animation-delay: 310ms; }

.m-count-val { counter-reset: mc var(--m-count); }
.m-count-val::after { content: counter(mc); }
.m-sweep { background-image: linear-gradient(${accentSoft}, ${accentSoft}); background-repeat: no-repeat; background-position: left 88%; background-size: 100% 0.5em; }

/* During a page change the framework remounts the OUTGOING page fully
   revealed (so it shows what the audience just saw). Since our entrances are
   keyed on data-osd-step="revealed", they would replay on that exiting copy.
   The outgoing layer is the first of two sibling layers; freeze its step
   animations so it simply rides the page-exit fade out. Resting states above
   are authored to be the final composed look, so nothing is lost. */
.absolute.inset-0:first-child:not(:last-child) [data-osd-step] * {
  animation: none !important;
}

@media (prefers-reduced-motion: reduce) {
  [data-osd-step] * { animation-duration: 1ms !important; animation-delay: 0ms !important; }
}
`;

const Style = () => <style>{css}</style>;

const PAD_X = 140;
const PAD_Y = 110;

const fill = {
  width: '100%',
  height: '100%',
  fontFamily: 'var(--osd-font-body)',
  color: 'var(--osd-text)',
  background: 'var(--osd-bg)',
  position: 'relative',
  overflow: 'hidden',
  display: 'grid',
  gridTemplateRows: 'auto 1fr auto',
  padding: `${PAD_Y}px ${PAD_X}px`,
  boxSizing: 'border-box',
} as const;

const EYEBROW: CSSProperties = {
  fontFamily: mono,
  fontSize: 19,
  letterSpacing: '0.32em',
  color: 'var(--osd-accent)',
  textTransform: 'uppercase',
};

const HEADING: CSSProperties = {
  fontFamily: 'var(--osd-font-display)',
  fontSize: 76,
  fontWeight: 800,
  lineHeight: 1.02,
  letterSpacing: '-0.03em',
  margin: 0,
};

const Eyebrow = ({ children }: { children: ReactNode }) => <div style={EYEBROW}>{children}</div>;

const Footer = ({ note }: { note: string }) => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        fontFamily: mono,
        fontSize: 16,
        letterSpacing: '0.16em',
        color: faint,
        textTransform: 'uppercase',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <span>{note}</span>
      <span>
        {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
    </div>
  );
};

const Cover: Page = () => (
  <div style={fill}>
    <Style />
    <Eyebrow>open-slide · steps × motion</Eyebrow>
    <div style={{ alignSelf: 'center' }}>
      <div style={{ ...EYEBROW, color: muted, marginBottom: 28 }}>
        one arrow press · one beat of motion
      </div>
      <h1
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 'var(--osd-size-hero)',
          fontWeight: 850,
          lineHeight: 0.92,
          letterSpacing: '-0.045em',
          margin: 0,
        }}
      >
        Steps,
        <br />
        <span style={{ color: 'var(--osd-accent)' }}>in motion.</span>
      </h1>
      <p style={{ fontSize: 30, lineHeight: 1.5, color: muted, marginTop: 44, maxWidth: 980 }}>
        Every reveal carries its own entrance. Press → to step through — each animation fires the
        moment its Step appears.
      </p>
    </div>
    <Footer note="01 · cover" />
  </div>
);

const RISE_ROW: CSSProperties = {
  fontSize: 44,
  lineHeight: 1.2,
  padding: '30px 0',
  borderBottom: `1px solid ${hairline}`,
  display: 'flex',
  alignItems: 'center',
  gap: 32,
};

const RiseRow = ({ n, last, children }: { n: string; last?: boolean; children: ReactNode }) => (
  <div
    className="m-rise"
    style={{ ...RISE_ROW, borderBottom: last ? 'none' : RISE_ROW.borderBottom }}
  >
    <span
      style={{
        fontFamily: mono,
        fontSize: 26,
        lineHeight: 1,
        width: 52,
        flexShrink: 0,
        color: 'var(--osd-accent)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {n}
    </span>
    <span>{children}</span>
  </div>
);

const FadeRise: Page = () => (
  <div style={fill}>
    <Style />
    <Eyebrow>§ 01 · fade + rise</Eyebrow>
    <div style={{ alignSelf: 'center', maxWidth: 1500 }}>
      <h2 style={{ ...HEADING, marginBottom: 56 }}>The quiet one.</h2>
      <Steps>
        <Step>
          <RiseRow n="01">Forty pixels up, fading in. The default beat.</RiseRow>
        </Step>
        <Step>
          <RiseRow n="02">Each line waits for its own press — nothing pre-reads.</RiseRow>
        </Step>
        <Step>
          <RiseRow n="03" last>
            Restraint reads as confidence.
          </RiseRow>
        </Step>
      </Steps>
    </div>
    <Footer note="02 · m-rise · staggered reveals" />
  </div>
);

const SlideRow = ({
  dir,
  label,
  children,
}: {
  dir: 'left' | 'right';
  label: string;
  children: ReactNode;
}) => (
  <div
    className={dir === 'left' ? 'm-left' : 'm-right'}
    style={{ display: 'flex', justifyContent: dir === 'left' ? 'flex-start' : 'flex-end' }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        background: 'rgba(243, 242, 236, 0.04)',
        border: `1px solid ${hairline}`,
        borderRadius: 'var(--osd-radius)',
        padding: '24px 36px',
        fontSize: 36,
        maxWidth: 1000,
      }}
    >
      <span style={{ fontFamily: mono, fontSize: 22, color: 'var(--osd-accent)' }}>{label}</span>
      <span>{children}</span>
    </div>
  </div>
);

const Directional: Page = () => (
  <div style={fill}>
    <Style />
    <Eyebrow>§ 02 · directional</Eyebrow>
    <div style={{ alignSelf: 'center', width: '100%' }}>
      <h2 style={{ ...HEADING, marginBottom: 48 }}>From the wings.</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Steps>
          <Step>
            <SlideRow dir="left" label="←">
              Slides in from the left.
            </SlideRow>
          </Step>
          <Step>
            <SlideRow dir="right" label="→">
              And this one answers from the right.
            </SlideRow>
          </Step>
          <Step>
            <SlideRow dir="left" label="←">
              Alternating sides build a rhythm.
            </SlideRow>
          </Step>
          <Step>
            <SlideRow dir="right" label="→">
              Sixty-four pixels — enough to feel, not jar.
            </SlideRow>
          </Step>
        </Steps>
      </div>
    </div>
    <Footer note="03 · m-left / m-right · alternating" />
  </div>
);

const POP_CARD: CSSProperties = {
  background: 'rgba(243, 242, 236, 0.04)',
  border: `1px solid ${hairline}`,
  borderRadius: 'var(--osd-radius)',
  padding: '40px 36px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  minHeight: 320,
  boxSizing: 'border-box',
};

const PopCard = ({ k, title, body }: { k: string; title: string; body: string }) => (
  <div className="m-pop" style={POP_CARD}>
    <div style={{ fontFamily: mono, fontSize: 22, color: 'var(--osd-accent)' }}>{k}</div>
    <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</div>
    <div style={{ fontSize: 26, lineHeight: 1.45, color: muted }}>{body}</div>
  </div>
);

const Pop: Page = () => (
  <div style={fill}>
    <Style />
    <Eyebrow>§ 03 · pop · overshoot</Eyebrow>
    <div style={{ alignSelf: 'center', width: '100%' }}>
      <h2 style={{ ...HEADING, marginBottom: 48 }}>Spring into place.</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
        <Steps>
          <Step>
            <PopCard
              k="01"
              title="Scale 0.62 → 1"
              body="Each card starts small and snaps to size."
            />
          </Step>
          <Step>
            <PopCard
              k="02"
              title="Overshoot ease"
              body="A back-curve nudges it just past 1, then rests."
            />
          </Step>
          <Step>
            <PopCard
              k="03"
              title="One at a time"
              body="The eye lands on each card before the next."
            />
          </Step>
        </Steps>
      </div>
    </div>
    <Footer note="04 · m-pop · overshoot easing" />
  </div>
);

const BlurLine = ({ children }: { children: ReactNode }) => (
  <p
    className="m-blur"
    style={{ fontSize: 52, fontWeight: 600, lineHeight: 1.3, margin: 0, letterSpacing: '-0.02em' }}
  >
    {children}
  </p>
);

const Blur: Page = () => (
  <div style={fill}>
    <Style />
    <Eyebrow>§ 04 · blur → focus</Eyebrow>
    <div
      style={{
        alignSelf: 'center',
        maxWidth: 1400,
        display: 'flex',
        flexDirection: 'column',
        gap: 40,
      }}
    >
      <Steps>
        <Step>
          <BlurLine>
            First, <span style={{ color: 'var(--osd-accent)' }}>out of focus.</span>
          </BlurLine>
        </Step>
        <Step>
          <BlurLine>Then the blur resolves —</BlurLine>
        </Step>
        <Step>
          <BlurLine>
            and the thought lands <span style={{ color: coral }}>sharp.</span>
          </BlurLine>
        </Step>
      </Steps>
    </div>
    <Footer note="05 · m-blur · filter blur(18px) → 0" />
  </div>
);

const FLIP_CARD: CSSProperties = {
  background: 'linear-gradient(160deg, rgba(92,224,198,0.12), rgba(243,242,236,0.03))',
  border: `1px solid ${hairline}`,
  borderRadius: 'var(--osd-radius)',
  padding: '36px 32px',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  minHeight: 300,
  boxSizing: 'border-box',
};

const FlipCard = ({ k, title, body }: { k: string; title: string; body: string }) => (
  <div style={{ perspective: 1200 }}>
    <div className="m-flip" style={FLIP_CARD}>
      <div style={{ fontFamily: mono, fontSize: 60, fontWeight: 800, color: 'var(--osd-accent)' }}>
        {k}
      </div>
      <div style={{ fontSize: 34, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 24, lineHeight: 1.45, color: muted }}>{body}</div>
    </div>
  </div>
);

const Flip: Page = () => (
  <div style={fill}>
    <Style />
    <Eyebrow>§ 05 · 3d flip</Eyebrow>
    <div style={{ alignSelf: 'center', width: '100%' }}>
      <h2 style={{ ...HEADING, marginBottom: 48 }}>Fold down into view.</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
        <Steps>
          <Step>
            <FlipCard
              k="X"
              title="rotateX(-92°)"
              body="Each panel hinges down from its top edge."
            />
          </Step>
          <Step>
            <FlipCard
              k="Z"
              title="perspective 1200"
              body="A shared vanishing point keeps the depth honest."
            />
          </Step>
          <Step>
            <FlipCard
              k="↻"
              title="overshoot land"
              body="It settles a hair past flat, then rests."
            />
          </Step>
        </Steps>
      </div>
    </div>
    <Footer note="06 · m-flip · rotateX + perspective" />
  </div>
);

const WipeLine = ({ children, color }: { children: ReactNode; color?: string }) => (
  <div
    className="m-wipe"
    style={{
      fontFamily: 'var(--osd-font-display)',
      fontSize: 104,
      fontWeight: 850,
      lineHeight: 1.0,
      letterSpacing: '-0.04em',
      color: color ?? 'var(--osd-text)',
      // The clip-path insets to this element's box; lineHeight 1.0 hugs the
      // glyphs, so without bottom room the inset would shear off descenders.
      padding: '0.06em 0.04em 0.24em',
    }}
  >
    {children}
  </div>
);

const Wipe: Page = () => (
  <div style={fill}>
    <Style />
    <Eyebrow>§ 06 · clip wipe</Eyebrow>
    <div style={{ alignSelf: 'center' }}>
      <Steps>
        <Step>
          <WipeLine>Wiped in,</WipeLine>
        </Step>
        <Step>
          <WipeLine color="var(--osd-accent)">edge to edge,</WipeLine>
        </Step>
        <Step>
          <WipeLine>left to right.</WipeLine>
        </Step>
        <Step>
          <div
            className="m-rise"
            style={{ fontSize: 26, color: muted, marginTop: 40, maxWidth: 900 }}
          >
            A clip-path inset uncovers each line like a curtain pull.
          </div>
        </Step>
      </Steps>
    </div>
    <Footer note="07 · m-wipe · clip-path inset" />
  </div>
);

const Tile = ({ n }: { n: number }) => (
  <div
    style={{
      aspectRatio: '2.2 / 1',
      borderRadius: 10,
      border: `1px solid ${hairline}`,
      background:
        n % 5 === 0
          ? 'rgba(92,224,198,0.16)'
          : n % 3 === 0
            ? 'rgba(255,107,93,0.12)'
            : 'rgba(243,242,236,0.04)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: mono,
      fontSize: 22,
      color: faint,
    }}
  >
    {String(n).padStart(2, '0')}
  </div>
);

const StaggerGrid: Page = () => (
  <div style={fill}>
    <Style />
    <Eyebrow>§ 07 · stagger</Eyebrow>
    <div style={{ alignSelf: 'center', width: '100%' }}>
      <h2 style={{ ...HEADING, marginBottom: 40 }}>One reveal, a cascade.</h2>
      <Steps>
        <Step>
          <div
            className="m-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}
          >
            <Tile n={1} />
            <Tile n={2} />
            <Tile n={3} />
            <Tile n={4} />
            <Tile n={5} />
            <Tile n={6} />
            <Tile n={7} />
            <Tile n={8} />
            <Tile n={9} />
            <Tile n={10} />
            <Tile n={11} />
            <Tile n={12} />
          </div>
        </Step>
      </Steps>
    </div>
    <Footer note="08 · one Step · nth-child delays" />
  </div>
);

const Stat = ({ to, suffix, label }: { to: number; suffix: string; label: string }) => (
  <div className="m-rise" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 132,
        fontWeight: 850,
        lineHeight: 1,
        letterSpacing: '-0.04em',
        display: 'flex',
        alignItems: 'baseline',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <span
        className="m-count m-count-val"
        style={{
          ['--m-to' as string]: String(to),
          ['--m-count' as string]: String(to),
          color: 'var(--osd-accent)',
        }}
      />
      <span style={{ fontSize: 56, color: muted, marginLeft: 6 }}>{suffix}</span>
    </div>
    <div
      style={{
        fontFamily: mono,
        fontSize: 20,
        letterSpacing: '0.14em',
        color: faint,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </div>
  </div>
);

const Counters: Page = () => (
  <div style={fill}>
    <Style />
    <Eyebrow>§ 08 · count up</Eyebrow>
    <div style={{ alignSelf: 'center', width: '100%' }}>
      <h2 style={{ ...HEADING, marginBottom: 64 }}>Numbers that climb.</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48 }}>
        <Steps>
          <Step>
            <Stat to={60} suffix="fps" label="motion budget" />
          </Step>
          <Step>
            <Stat to={180} suffix="ms" label="default beat" />
          </Step>
          <Step>
            <Stat to={12} suffix="px" label="travel ceiling" />
          </Step>
        </Steps>
      </div>
    </div>
    <Footer note="09 · @property --m-count · counts on reveal" />
  </div>
);

const Bar = ({ h, label, hot }: { h: number; label: string; hot?: boolean }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 18,
      height: '100%',
      justifyContent: 'flex-end',
    }}
  >
    <div
      className="m-bar"
      style={{
        width: 120,
        height: h,
        borderRadius: '8px 8px 0 0',
        background: hot
          ? 'linear-gradient(180deg, #ff8a7d, #ff6b5d)'
          : 'linear-gradient(180deg, rgba(92,224,198,0.95), rgba(92,224,198,0.45))',
      }}
    />
    <div style={{ fontFamily: mono, fontSize: 18, color: faint }}>{label}</div>
  </div>
);

const Bars: Page = () => (
  <div style={fill}>
    <Style />
    <Eyebrow>§ 09 · bars grow</Eyebrow>
    <div style={{ alignSelf: 'center', width: '100%' }}>
      <h2 style={{ ...HEADING, marginBottom: 32 }}>Rise from the baseline.</h2>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: 56,
          height: 420,
          borderBottom: `1px solid ${hairline}`,
        }}
      >
        <Steps>
          <Step>
            <Bar h={140} label="mon" />
          </Step>
          <Step>
            <Bar h={230} label="tue" />
          </Step>
          <Step>
            <Bar h={190} label="wed" />
          </Step>
          <Step>
            <Bar h={320} label="thu" />
          </Step>
          <Step>
            <Bar h={400} label="fri" hot />
          </Step>
        </Steps>
      </div>
    </div>
    <Footer note="10 · m-bar · scaleY from baseline" />
  </div>
);

const LineDraw: Page = () => (
  <div style={fill}>
    <Style />
    <Eyebrow>§ 10 · line draw</Eyebrow>
    <div style={{ alignSelf: 'center', width: '100%' }}>
      <h2 style={{ ...HEADING, marginBottom: 36 }}>Drawn, not dropped.</h2>
      <Steps>
        <Step>
          <svg
            viewBox="0 0 1400 420"
            width="100%"
            height={420}
            fill="none"
            role="img"
            aria-label="A line being drawn across a chart, peaking at the end"
          >
            <line x1="0" y1="418" x2="1400" y2="418" stroke={hairline} strokeWidth="2" />
            <line x1="2" y1="0" x2="2" y2="420" stroke={hairline} strokeWidth="2" />
            <polyline
              className="m-draw"
              points="20,360 260,300 500,330 740,180 980,220 1240,60"
              stroke="var(--osd-accent)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ ['--m-len' as string]: '1500', strokeDasharray: 1500, strokeDashoffset: 0 }}
            />
            <circle
              className="m-pop-late"
              cx="1240"
              cy="60"
              r="14"
              fill={coral}
              style={{ transformOrigin: '1240px 60px' }}
            />
          </svg>
        </Step>
        <Step>
          <div className="m-rise" style={{ fontSize: 30, color: muted, marginTop: 12 }}>
            <span style={{ color: coral, fontWeight: 700 }}>+312%</span> — and the peak announces
            itself last.
          </div>
        </Step>
      </Steps>
    </div>
    <Footer note="11 · m-draw · stroke-dashoffset" />
  </div>
);

const NODE: CSSProperties = {
  border: `1px solid ${hairline}`,
  borderRadius: 'var(--osd-radius)',
  padding: '26px 30px',
  background: 'rgba(243,242,236,0.04)',
  fontSize: 30,
  fontWeight: 600,
  textAlign: 'center',
  minWidth: 260,
  boxSizing: 'border-box',
};

const Connector = () => (
  <div
    className="m-dash"
    style={{
      width: 90,
      height: 3,
      background: `linear-gradient(90deg, var(--osd-accent), ${accentSoft})`,
    }}
  />
);

const Node = ({ title, sub, accent }: { title: string; sub: string; accent?: boolean }) => (
  <div className="m-pop" style={{ ...NODE, borderColor: accent ? 'var(--osd-accent)' : hairline }}>
    <div style={{ color: accent ? 'var(--osd-accent)' : 'var(--osd-text)' }}>{title}</div>
    <div style={{ fontFamily: mono, fontSize: 17, color: faint, marginTop: 8, fontWeight: 400 }}>
      {sub}
    </div>
  </div>
);

const Assemble: Page = () => (
  <div style={fill}>
    <Style />
    <Eyebrow>§ 11 · assemble</Eyebrow>
    <div style={{ alignSelf: 'center', width: '100%' }}>
      <h2 style={{ ...HEADING, marginBottom: 64 }}>Build the pipeline live.</h2>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Steps>
          <Step>
            <Node title="Source" sub="slides/*.tsx" />
          </Step>
          <Step>
            <Connector />
          </Step>
          <Step>
            <Node title="Compile" sub="vite plugin" />
          </Step>
          <Step>
            <Connector />
          </Step>
          <Step>
            <Node title="Reveal" sub="<Steps>" accent />
          </Step>
        </Steps>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Steps>
          <Step>
            <div
              className="m-rise"
              style={{
                fontSize: 26,
                color: muted,
                marginTop: 56,
                maxWidth: 1100,
                textAlign: 'center',
              }}
            >
              Boxes pop, connectors draw — the diagram explains itself one press at a time.
            </div>
          </Step>
        </Steps>
      </div>
    </div>
    <Footer note="12 · m-pop + m-dash · staged build-up" />
  </div>
);

const SweepLine = ({ pre, mark, post }: { pre: string; mark: string; post: string }) => (
  <p
    style={{ fontSize: 56, fontWeight: 600, lineHeight: 1.4, margin: 0, letterSpacing: '-0.02em' }}
  >
    {pre}
    <span className="m-sweep" style={{ fontWeight: 800 }}>
      {mark}
    </span>
    {post}
  </p>
);

const Sweep: Page = () => (
  <div style={fill}>
    <Style />
    <Eyebrow>§ 12 · highlight sweep</Eyebrow>
    <div
      style={{
        alignSelf: 'center',
        maxWidth: 1500,
        display: 'flex',
        flexDirection: 'column',
        gap: 44,
      }}
    >
      <Steps>
        <Step>
          <SweepLine pre="Lead the eye to the " mark="word that matters" post="." />
        </Step>
        <Step>
          <SweepLine pre="A bar sweeps in behind the " mark="emphasis" post="," />
        </Step>
        <Step>
          <SweepLine pre="so the room reads exactly " mark="where you point" post="." />
        </Step>
      </Steps>
    </div>
    <Footer note="13 · m-sweep · background-size left→right" />
  </div>
);

const Closing: Page = () => (
  <div style={fill}>
    <Style />
    <Eyebrow>fin</Eyebrow>
    <div style={{ alignSelf: 'center', maxWidth: 1500 }}>
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 128,
          fontWeight: 850,
          lineHeight: 0.96,
          letterSpacing: '-0.04em',
          margin: 0,
        }}
      >
        Motion is <span style={{ color: 'var(--osd-accent)' }}>meaning</span>,
        <br />
        not garnish.
      </h2>
      <p
        style={{
          fontSize: 26,
          lineHeight: 1.6,
          color: muted,
          marginTop: 48,
          maxWidth: 1060,
          borderTop: `1px solid ${hairline}`,
          paddingTop: 32,
        }}
      >
        Twelve techniques, one primitive. Each{' '}
        <code style={{ fontFamily: mono, color: 'var(--osd-accent)' }}>&lt;Step&gt;</code> wraps
        content; a single attribute — <code style={{ fontFamily: mono }}>data-osd-step</code> — lets
        CSS fire the entrance on reveal. Jump in via the grid to see it composed; step through to
        feel the rhythm.
      </p>
    </div>
    <Footer note="14 · close · ← to revisit" />
  </div>
);

const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';

export const transition: SlideTransition = {
  duration: 220,
  exit: {
    duration: 150,
    easing: EASE_IN,
    keyframes: [
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(-5px)' },
    ],
  },
  enter: {
    duration: 220,
    delay: 80,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(8px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
};

Cover.transition = {
  duration: 280,
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

export const meta: SlideMeta = {
  title: 'Steps, in Motion',
  createdAt: '2026-06-02T15:13:39.161Z',
};

export default [
  Cover,
  FadeRise,
  Directional,
  Pop,
  Blur,
  Flip,
  Wipe,
  StaggerGrid,
  Counters,
  Bars,
  LineDraw,
  Assemble,
  Sweep,
  Closing,
] satisfies Page[];
