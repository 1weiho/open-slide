import type { Page, SlideMeta } from '@open-slide/core';
import { useEffect, useState } from 'react';

const palette = {
  black: '#0A0A0A',
  yellow: '#FFE600',
  red: '#E63946',
  off: '#F5F1E8',
};

const fontStack = '"Inter", "SF Pro Display", "Helvetica Neue", system-ui, sans-serif';

const fill = {
  width: '100%',
  height: '100%',
  fontFamily: fontStack,
  overflow: 'hidden',
  position: 'relative',
} as const;

const sharedStyles = `
  @keyframes kt-marquee-l {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }
  @keyframes kt-marquee-r {
    from { transform: translateX(-50%); }
    to { transform: translateX(0); }
  }
  @keyframes kt-letter-in {
    0%   { transform: translateY(120%) skewY(8deg); opacity: 0; }
    60%  { transform: translateY(-12%) skewY(-2deg); opacity: 1; }
    100% { transform: translateY(0) skewY(0); opacity: 1; }
  }
  @keyframes kt-letter-side {
    0%   { transform: translateX(-180%); opacity: 0; }
    70%  { transform: translateX(8%); opacity: 1; }
    100% { transform: translateX(0); opacity: 1; }
  }
  @keyframes kt-letter-side-r {
    0%   { transform: translateX(180%); opacity: 0; }
    70%  { transform: translateX(-8%); opacity: 1; }
    100% { transform: translateX(0); opacity: 1; }
  }
  @keyframes kt-stretch {
    0%, 100% { transform: scaleX(1) scaleY(1); }
    50%      { transform: scaleX(1.08) scaleY(0.94); }
  }
  @keyframes kt-stretch-y {
    0%, 100% { transform: scaleY(1); }
    50%      { transform: scaleY(1.12); }
  }
  @keyframes kt-drift {
    0%, 100% { transform: translate(0, 0) rotate(var(--kt-rot, 0deg)); }
    50%      { transform: translate(var(--kt-dx, 0px), var(--kt-dy, 0px)) rotate(calc(var(--kt-rot, 0deg) + 4deg)); }
  }
  @keyframes kt-slot-in {
    0%   { transform: translateY(110%); opacity: 0; }
    50%  { transform: translateY(-10%); opacity: 1; }
    100% { transform: translateY(0); opacity: 1; }
  }
  @keyframes kt-blink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }
  @keyframes kt-bar {
    0%, 100% { transform: scaleX(0.2); }
    50%      { transform: scaleX(1); }
  }
`;

// ---------- helpers ----------

const Letters = ({
  word,
  anim,
  baseDelay = 0,
  step = 60,
}: {
  word: string;
  anim: string;
  baseDelay?: number;
  step?: number;
}) => (
  <span style={{ display: 'inline-flex' }}>
    {Array.from(word).map((ch, i) => (
      <span
        key={i}
        style={{
          display: 'inline-block',
          animation: `${anim} 900ms ${baseDelay + i * step}ms cubic-bezier(.2,.9,.2,1.1) both`,
        }}
      >
        {ch === ' ' ? ' ' : ch}
      </span>
    ))}
  </span>
);

const useRotator = (words: string[], ms: number) => {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % words.length), ms);
    return () => clearInterval(id);
  }, [words.length, ms]);
  return [words[i], i] as const;
};

// ---------- PAGE 1 — COVER ----------

const Cover: Page = () => {
  const ROT = ['MOVE', 'FLOW', 'PUSH', 'BEND', 'SNAP'];
  const [word, idx] = useRotator(ROT, 1400);

  return (
    <div
      style={{
        ...fill,
        background: palette.black,
        color: palette.yellow,
      }}
    >
      <style>{sharedStyles}</style>

      {/* top eyebrow */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 120,
          right: 120,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 22,
          letterSpacing: '0.32em',
          fontWeight: 700,
        }}
      >
        <span>VOL.&nbsp;01 — KINETIC</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              width: 14,
              height: 14,
              background: palette.yellow,
              animation: 'kt-blink 1s steps(1) infinite',
            }}
          />
          LIVE
        </span>
      </div>

      {/* hero stack */}
      <div
        style={{
          position: 'absolute',
          top: 200,
          left: 120,
          right: 120,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 0.92,
        }}
      >
        <div style={{ fontSize: 280, overflow: 'hidden' }}>
          <Letters word="TYPE" anim="kt-letter-in" baseDelay={100} step={80} />
        </div>

        <div
          style={{
            fontSize: 200,
            fontStyle: 'italic',
            color: palette.off,
            overflow: 'hidden',
            paddingLeft: 200,
          }}
        >
          <Letters word="IS" anim="kt-letter-side" baseDelay={500} step={70} />
        </div>

        {/* rotating slot */}
        <div
          style={{
            fontSize: 260,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'baseline',
            gap: 40,
          }}
        >
          <span style={{ color: palette.off }}>—</span>
          <span
            style={{
              display: 'inline-block',
              minWidth: 760,
              position: 'relative',
              overflow: 'hidden',
              height: 260,
            }}
          >
            <span
              key={idx}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'inline-block',
                color: palette.yellow,
                animation: 'kt-slot-in 600ms cubic-bezier(.2,.9,.2,1.2) both',
              }}
            >
              {word}
            </span>
          </span>
        </div>
      </div>

      {/* bottom bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 120,
          right: 120,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          fontSize: 24,
          letterSpacing: '0.24em',
          fontWeight: 700,
        }}
      >
        <span>A FIELD GUIDE TO MOTION</span>
        <span style={{ fontStyle: 'italic', fontWeight: 500 }}>
          / scroll, blink, breathe
        </span>
      </div>

      {/* animated baseline accent */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: 120,
          right: 120,
          height: 4,
          background: palette.yellow,
          transformOrigin: 'left center',
          animation: 'kt-bar 3.2s ease-in-out infinite',
        }}
      />
    </div>
  );
};

// ---------- PAGE 2 — MARQUEE ----------

const MarqueeRow = ({
  words,
  direction,
  size,
  italic = false,
  duration = 24,
}: {
  words: string[];
  direction: 'l' | 'r';
  size: number;
  italic?: boolean;
  duration?: number;
}) => {
  const seq = [...words, ...words, ...words, ...words];
  return (
    <div
      style={{
        width: '100%',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        display: 'flex',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          gap: 80,
          fontSize: size,
          fontWeight: 900,
          letterSpacing: '-0.03em',
          fontStyle: italic ? 'italic' : 'normal',
          paddingRight: 80,
          animation: `kt-marquee-${direction} ${duration}s linear infinite`,
        }}
      >
        {seq.map((w, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 80 }}>
            {w}
            <span style={{ fontSize: size * 0.6, transform: 'translateY(-0.1em)' }}>✻</span>
          </span>
        ))}
      </div>
    </div>
  );
};

const Marquee: Page = () => {
  const HERO = ['LOUDER', 'FASTER', 'SHARPER', 'BOLDER'];
  const [hero, hi] = useRotator(HERO, 1600);

  return (
    <div
      style={{
        ...fill,
        background: palette.yellow,
        color: palette.black,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <style>{sharedStyles}</style>

      <div style={{ paddingTop: 60 }}>
        <MarqueeRow
          words={['MOTION', 'TENSION', 'RHYTHM', 'PULSE', 'KINETIC']}
          direction="l"
          size={120}
          duration={26}
        />
      </div>

      {/* center hero */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 120px',
          gap: 24,
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: '0.4em',
            fontWeight: 800,
          }}
        >
          THE&nbsp;BRIEF&nbsp;IS&nbsp;SIMPLE —
        </div>

        <div
          style={{
            fontSize: 240,
            fontWeight: 900,
            letterSpacing: '-0.05em',
            lineHeight: 0.95,
            display: 'flex',
            alignItems: 'baseline',
            gap: 40,
          }}
        >
          <span style={{ fontStyle: 'italic', fontWeight: 500 }}>be</span>
          <span
            style={{
              display: 'inline-block',
              minWidth: 900,
              height: 240,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <span
              key={hi}
              style={{
                position: 'absolute',
                inset: 0,
                animation: 'kt-slot-in 600ms cubic-bezier(.2,.9,.2,1.2) both',
              }}
            >
              {hero}
            </span>
          </span>
          <span
            style={{
              display: 'inline-block',
              animation: 'kt-stretch 3s ease-in-out infinite',
              transformOrigin: 'left center',
            }}
          >
            .
          </span>
        </div>

        <div
          style={{
            fontSize: 36,
            fontWeight: 500,
            maxWidth: 1100,
            lineHeight: 1.3,
            paddingTop: 24,
          }}
        >
          Letters do not sit still on the page —{' '}
          <em style={{ background: palette.black, color: palette.yellow, padding: '0 12px' }}>
            they perform
          </em>
          .
        </div>
      </div>

      <div style={{ paddingBottom: 60 }}>
        <MarqueeRow
          words={['scroll', 'breathe', 'snap', 'drift', 'twitch']}
          direction="r"
          size={140}
          italic
          duration={32}
        />
      </div>
    </div>
  );
};

// ---------- PAGE 3 — EXPLOSION ----------

const HERO_WORD = 'KINETIC';
// pre-baked offsets so the explosion is repeatable per char
const offsets = [
  { x: -260, y: -180, r: -14 },
  { x: 180, y: -240, r: 9 },
  { x: -340, y: 120, r: 22 },
  { x: 90, y: 220, r: -18 },
  { x: 320, y: -90, r: 12 },
  { x: -160, y: 260, r: -8 },
  { x: 280, y: 180, r: 16 },
];

const Explosion: Page = () => {
  // 0 = together, 1 = exploded mid-flight (color-inverting halfway already happens)
  const [state, setState] = useState<0 | 1>(0);

  useEffect(() => {
    const id = setInterval(() => setState((s) => (s ? 0 : 1)), 1800);
    return () => clearInterval(id);
  }, []);

  const exploded = state === 1;

  return (
    <div
      style={{
        ...fill,
        background: exploded ? palette.off : palette.red,
        color: exploded ? palette.red : palette.off,
        transition: 'background 700ms ease, color 700ms ease',
      }}
    >
      <style>{sharedStyles}</style>

      {/* top label */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 120,
          right: 120,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 24,
          letterSpacing: '0.32em',
          fontWeight: 800,
        }}
      >
        <span>03 / FRAGMENT</span>
        <span style={{ fontStyle: 'italic', fontWeight: 500 }}>break &amp; converge</span>
      </div>

      {/* drifting word chips */}
      {[
        { w: 'rhythm', x: 160, y: 220, rot: -8, dx: 24, dy: -18, dur: 6 },
        { w: 'TENSION', x: 1480, y: 180, rot: 6, dx: -32, dy: 22, dur: 7.5 },
        { w: 'pulse.', x: 220, y: 880, rot: -4, dx: 18, dy: -22, dur: 5.5 },
        { w: 'SNAP', x: 1500, y: 860, rot: 9, dx: -22, dy: -18, dur: 8 },
      ].map((c, i) => (
        <span
          key={i}
          style={
            {
              position: 'absolute',
              top: c.y,
              left: c.x,
              fontSize: 44,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              fontStyle: c.w === c.w.toLowerCase() ? 'italic' : 'normal',
              opacity: 0.55,
              ['--kt-dx' as string]: `${c.dx}px`,
              ['--kt-dy' as string]: `${c.dy}px`,
              ['--kt-rot' as string]: `${c.rot}deg`,
              animation: `kt-drift ${c.dur}s ease-in-out infinite`,
            } as React.CSSProperties
          }
        >
          {c.w}
        </span>
      ))}

      {/* hero exploding word */}
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
          style={{
            display: 'flex',
            fontSize: 360,
            fontWeight: 900,
            letterSpacing: '-0.05em',
            lineHeight: 1,
          }}
        >
          {Array.from(HERO_WORD).map((ch, i) => {
            const o = offsets[i % offsets.length];
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  transition: `transform 900ms cubic-bezier(.7,-0.2,.2,1.4) ${i * 40}ms`,
                  transform: exploded
                    ? `translate(${o.x}px, ${o.y}px) rotate(${o.r}deg)`
                    : 'translate(0,0) rotate(0)',
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
      </div>

      {/* bottom caption */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 120,
          right: 120,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: '0.18em',
        }}
      >
        <span>
          state:&nbsp;
          <span
            style={{
              display: 'inline-block',
              minWidth: 240,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          >
            {exploded ? 'FRAGMENTED' : 'CONVERGED'}
          </span>
        </span>
        <span
          style={{
            display: 'inline-block',
            animation: 'kt-stretch-y 2s ease-in-out infinite',
            transformOrigin: 'right bottom',
            fontSize: 56,
            fontWeight: 900,
            fontStyle: 'italic',
          }}
        >
          end.
        </span>
      </div>
    </div>
  );
};

export const meta: SlideMeta = { title: 'Kinetic Type' };
export default [Cover, Marquee, Explosion] satisfies Page[];
