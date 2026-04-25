import { useEffect, useRef, useState } from 'react';
import type { Page, SlideMeta } from '@open-slide/core';

const palette = {
  bg: '#FFFFFF',
  ink: '#0A0A0A',
  accent: '#D6260F',
  muted: '#9A9A9A',
  hairline: '#0A0A0A',
} as const;

const fontStack =
  'Helvetica Neue, Helvetica, Inter, "Inter var", system-ui, -apple-system, Arial, sans-serif';

const fill = {
  width: '100%',
  height: '100%',
  background: palette.bg,
  color: palette.ink,
  fontFamily: fontStack,
  position: 'relative',
  overflow: 'hidden',
} as const;

const easing = 'cubic-bezier(0.65, 0, 0.35, 1)';

const styles = `
  @keyframes ms-mask-wipe {
    0%   { clip-path: inset(0 100% 0 0); }
    100% { clip-path: inset(0 0 0 0); }
  }
  @keyframes ms-mask-wipe-up {
    0%   { clip-path: inset(100% 0 0 0); }
    100% { clip-path: inset(0 0 0 0); }
  }
  @keyframes ms-rule-draw {
    0%   { transform: scaleX(0); }
    100% { transform: scaleX(1); }
  }
  @keyframes ms-rule-draw-v {
    0%   { transform: scaleY(0); }
    100% { transform: scaleY(1); }
  }
  @keyframes ms-fade-up {
    0%   { opacity: 0; transform: translateY(24px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes ms-fade-in {
    0%   { opacity: 0; }
    100% { opacity: 1; }
  }
  @keyframes ms-track-in {
    0%   { letter-spacing: 0.6em; opacity: 0; }
    100% { letter-spacing: 0.1em; opacity: 1; }
  }
  @keyframes ms-track-in-tight {
    0%   { letter-spacing: 0.3em; opacity: 0; }
    100% { letter-spacing: -0.02em; opacity: 1; }
  }
  @keyframes ms-parallax-drift {
    0%   { transform: translate3d(0, 24px, 0); opacity: 0; }
    100% { transform: translate3d(0, 0, 0); opacity: 1; }
  }
  @keyframes ms-bg-numeral-drift {
    0%   { transform: translate3d(0, 60px, 0); opacity: 0; }
    100% { transform: translate3d(0, 0, 0); opacity: 0.05; }
  }

  .ms-mask-wipe   { animation: ms-mask-wipe 1100ms ${easing} both; }
  .ms-mask-wipe-up{ animation: ms-mask-wipe-up 1100ms ${easing} both; }
  .ms-rule        { transform-origin: left center; animation: ms-rule-draw 900ms ${easing} both; }
  .ms-rule-v      { transform-origin: top center;  animation: ms-rule-draw-v 900ms ${easing} both; }
  .ms-fade-up     { animation: ms-fade-up 900ms ${easing} both; }
  .ms-fade-in     { animation: ms-fade-in 900ms ${easing} both; }
  .ms-track-in    { animation: ms-track-in 1200ms ${easing} both; }
  .ms-track-in-tight { animation: ms-track-in-tight 1200ms ${easing} both; }
  .ms-parallax    { animation: ms-parallax-drift 1600ms ${easing} both; }
  .ms-bg-numeral  { animation: ms-bg-numeral-drift 1800ms ${easing} both; }
`;

const StyleTag = () => <style dangerouslySetInnerHTML={{ __html: styles }} />;

// ---------- Page 1: Cover ----------

const Cover: Page = () => (
  <div style={fill}>
    <StyleTag />

    {/* Top hairline rule */}
    <div
      className="ms-rule"
      style={{
        position: 'absolute',
        top: 120,
        left: 120,
        right: 120,
        height: 1,
        background: palette.hairline,
        animationDelay: '120ms',
      }}
    />

    {/* Issue-style header row */}
    <div
      style={{
        position: 'absolute',
        top: 144,
        left: 120,
        right: 120,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        fontSize: 24,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        fontWeight: 500,
      }}
    >
      <span className="ms-fade-in" style={{ animationDelay: '500ms' }}>
        Motion / Swiss
      </span>
      <span
        className="ms-fade-in"
        style={{ animationDelay: '620ms', color: palette.muted }}
      >
        Vol. 04 &nbsp;·&nbsp; MMXXVI
      </span>
      <span className="ms-fade-in" style={{ animationDelay: '740ms' }}>
        № 01
      </span>
    </div>

    {/* Vermilion eyebrow */}
    <div
      className="ms-fade-up"
      style={{
        position: 'absolute',
        top: 360,
        left: 120,
        fontSize: 26,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        fontWeight: 600,
        color: palette.accent,
        animationDelay: '700ms',
      }}
    >
      An editorial study
    </div>

    {/* Hero title — mask wipe */}
    <h1
      style={{
        position: 'absolute',
        top: 420,
        left: 120,
        right: 120,
        margin: 0,
        fontSize: 196,
        lineHeight: 0.96,
        fontWeight: 900,
        letterSpacing: '-0.035em',
      }}
    >
      <span
        className="ms-mask-wipe"
        style={{ display: 'block', animationDelay: '900ms' }}
      >
        Quiet
      </span>
      <span
        className="ms-mask-wipe"
        style={{ display: 'block', animationDelay: '1150ms' }}
      >
        Motion,
      </span>
      <span
        className="ms-mask-wipe"
        style={{
          display: 'block',
          animationDelay: '1400ms',
          fontWeight: 300,
          fontStyle: 'italic',
        }}
      >
        Loud Ideas.
      </span>
    </h1>

    {/* Bottom hairline + meta */}
    <div
      className="ms-rule"
      style={{
        position: 'absolute',
        bottom: 140,
        left: 120,
        right: 120,
        height: 1,
        background: palette.hairline,
        animationDelay: '1600ms',
      }}
    />
    <div
      style={{
        position: 'absolute',
        bottom: 80,
        left: 120,
        right: 120,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        fontSize: 22,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: palette.muted,
        fontWeight: 500,
      }}
    >
      <span className="ms-fade-in" style={{ animationDelay: '1750ms' }}>
        Three pages
      </span>
      <span className="ms-fade-in" style={{ animationDelay: '1850ms' }}>
        Set in Helvetica
      </span>
      <span className="ms-fade-in" style={{ animationDelay: '1950ms' }}>
        Read slowly
      </span>
    </div>
  </div>
);

// ---------- Page 2: Numeric feature ----------

function useEased(target: number, durationMs: number, delayMs: number) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let raf = 0;
    let start = 0;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // ease-out cubic

    const tick = (now: number) => {
      if (!start) start = now + delayMs;
      const t = Math.min(1, Math.max(0, (now - start) / durationMs));
      setValue(Math.round(target * ease(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, delayMs]);

  return value;
}

const Numeric: Page = () => {
  const count = useEased(2026, 2200, 600);
  const sub = useEased(94, 1600, 1400);

  return (
    <div style={fill}>
      <StyleTag />

      {/* Background oversize numeral — parallax (slow & subtle) */}
      <div
        className="ms-bg-numeral"
        aria-hidden
        style={{
          position: 'absolute',
          top: -120,
          right: -80,
          fontSize: 1400,
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: '-0.06em',
          color: palette.ink,
          opacity: 0,
          pointerEvents: 'none',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        24
      </div>

      {/* Top hairline */}
      <div
        className="ms-rule"
        style={{
          position: 'absolute',
          top: 120,
          left: 120,
          right: 120,
          height: 1,
          background: palette.hairline,
          animationDelay: '100ms',
        }}
      />

      {/* Eyebrow */}
      <div
        className="ms-track-in"
        style={{
          position: 'absolute',
          top: 152,
          left: 120,
          fontSize: 24,
          textTransform: 'uppercase',
          fontWeight: 600,
          color: palette.accent,
          animationDelay: '300ms',
        }}
      >
        Figure 02 &nbsp;—&nbsp; Cadence
      </div>

      {/* Section label, right */}
      <div
        className="ms-fade-in"
        style={{
          position: 'absolute',
          top: 152,
          right: 120,
          fontSize: 22,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: palette.muted,
          fontWeight: 500,
          animationDelay: '500ms',
        }}
      >
        ii / iii
      </div>

      {/* The numeral */}
      <div
        style={{
          position: 'absolute',
          top: 280,
          left: 120,
          right: 120,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 48,
        }}
      >
        <div
          className="ms-fade-up"
          style={{
            fontSize: 540,
            fontWeight: 900,
            lineHeight: 0.92,
            letterSpacing: '-0.05em',
            margin: 0,
            fontVariantNumeric: 'tabular-nums',
            animationDelay: '500ms',
          }}
        >
          {count.toString().padStart(4, '0')}
        </div>
      </div>

      {/* Vertical hairline divider */}
      <div
        className="ms-rule-v"
        style={{
          position: 'absolute',
          top: 760,
          left: 120,
          width: 1,
          height: 200,
          background: palette.hairline,
          animationDelay: '1300ms',
        }}
      />

      {/* Caption block */}
      <div
        style={{
          position: 'absolute',
          left: 200,
          top: 770,
          right: 120,
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          columnGap: 80,
          alignItems: 'baseline',
        }}
      >
        <div
          className="ms-track-in"
          style={{
            fontSize: 24,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontWeight: 600,
            animationDelay: '1500ms',
          }}
        >
          The year
        </div>
        <div
          className="ms-fade-up"
          style={{
            fontSize: 36,
            lineHeight: 1.4,
            fontWeight: 400,
            maxWidth: 880,
            animationDelay: '1700ms',
          }}
        >
          Two decades after the first whisper of motion design as discipline,
          we count{' '}
          <span style={{ color: palette.accent, fontWeight: 700 }}>
            {sub}%
          </span>{' '}
          of editorial work as kinetic — pages that breathe, headlines that
          arrive, hairlines that draw themselves.
        </div>
      </div>

      {/* Bottom hairline */}
      <div
        className="ms-rule"
        style={{
          position: 'absolute',
          bottom: 80,
          left: 120,
          right: 120,
          height: 1,
          background: palette.hairline,
          animationDelay: '2000ms',
        }}
      />
    </div>
  );
};

// ---------- Page 3: Three-column editorial ----------

type Column = {
  number: string;
  title: string;
  body: string;
};

const columns: Column[] = [
  {
    number: '01',
    title: 'Restraint',
    body: 'Move one element at a time. Let the eye land before the next gesture begins. A single mask wipe at 900ms says more than four overlapping fades.',
  },
  {
    number: '02',
    title: 'Hierarchy',
    body: 'Animate the structure first — the rule, the eyebrow, the title — then the supporting copy. Order is the message; timing is the punctuation.',
  },
  {
    number: '03',
    title: 'Tempo',
    body: 'Cubic-bezier(0.65, 0, 0.35, 1). Slow in, slow out, almost ceremonial. Editorial motion is closer to turning a page than scrolling a feed.',
  },
];

const ThreeColumn: Page = () => (
  <div style={fill}>
    <StyleTag />

    {/* Top hairline */}
    <div
      className="ms-rule"
      style={{
        position: 'absolute',
        top: 120,
        left: 120,
        right: 120,
        height: 1,
        background: palette.hairline,
        animationDelay: '100ms',
      }}
    />

    {/* Header row */}
    <div
      style={{
        position: 'absolute',
        top: 152,
        left: 120,
        right: 120,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        fontSize: 24,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        fontWeight: 600,
      }}
    >
      <span
        className="ms-fade-in"
        style={{ color: palette.accent, animationDelay: '250ms' }}
      >
        Three principles
      </span>
      <span
        className="ms-fade-in"
        style={{ color: palette.muted, animationDelay: '400ms' }}
      >
        iii / iii
      </span>
    </div>

    {/* Section title — mask wipe */}
    <h2
      style={{
        position: 'absolute',
        top: 240,
        left: 120,
        right: 120,
        margin: 0,
        fontSize: 132,
        fontWeight: 900,
        letterSpacing: '-0.035em',
        lineHeight: 1,
      }}
    >
      <span
        className="ms-mask-wipe"
        style={{ display: 'inline-block', animationDelay: '500ms' }}
      >
        How it moves.
      </span>
    </h2>

    {/* Column grid */}
    <div
      style={{
        position: 'absolute',
        top: 480,
        left: 120,
        right: 120,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        columnGap: 80,
      }}
    >
      {columns.map((col, i) => {
        const base = 950 + i * 350;
        return (
          <div key={col.number} style={{ position: 'relative' }}>
            {/* Per-column hairline drawing in */}
            <div
              className="ms-rule"
              style={{
                height: 1,
                background: palette.hairline,
                marginBottom: 32,
                animationDelay: `${base}ms`,
              }}
            />
            <div
              className="ms-fade-up"
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: palette.accent,
                letterSpacing: '0.1em',
                marginBottom: 24,
                animationDelay: `${base + 150}ms`,
              }}
            >
              {col.number}
            </div>
            <div
              className="ms-track-in-tight"
              style={{
                fontSize: 64,
                fontWeight: 900,
                lineHeight: 1.05,
                marginBottom: 32,
                animationDelay: `${base + 300}ms`,
              }}
            >
              {col.title}
            </div>
            <p
              className="ms-fade-up"
              style={{
                fontSize: 30,
                lineHeight: 1.55,
                fontWeight: 400,
                color: palette.ink,
                margin: 0,
                animationDelay: `${base + 480}ms`,
              }}
            >
              {col.body}
            </p>
          </div>
        );
      })}
    </div>

    {/* Bottom rule + colophon */}
    <div
      className="ms-rule"
      style={{
        position: 'absolute',
        bottom: 140,
        left: 120,
        right: 120,
        height: 1,
        background: palette.hairline,
        animationDelay: '2200ms',
      }}
    />
    <div
      style={{
        position: 'absolute',
        bottom: 80,
        left: 120,
        right: 120,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        fontSize: 22,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: palette.muted,
        fontWeight: 500,
      }}
    >
      <span className="ms-fade-in" style={{ animationDelay: '2400ms' }}>
        Motion / Swiss
      </span>
      <span className="ms-fade-in" style={{ animationDelay: '2500ms' }}>
        End of issue
      </span>
    </div>
  </div>
);

export const meta: SlideMeta = { title: 'Motion / Swiss' };
export default [Cover, Numeric, ThreeColumn] satisfies Page[];
