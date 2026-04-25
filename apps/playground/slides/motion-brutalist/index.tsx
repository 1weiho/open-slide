import { useEffect, useRef, useState } from 'react';
import type { Page, SlideMeta } from '@open-slide/core';

const palette = {
  bg: '#F2F2F2',
  text: '#000000',
  accent: '#FF2E1F',
} as const;

const fill = {
  width: '100%',
  height: '100%',
  background: palette.bg,
  color: palette.text,
  fontFamily: '"Arial Black", "Helvetica Neue", Arial, sans-serif',
  position: 'relative',
  overflow: 'hidden',
} as const;

const keyframes = `
@keyframes mb-flicker {
  0% { opacity: 0; transform: translateY(40px); }
  20% { opacity: 1; transform: translateY(0); }
  30% { opacity: 0; }
  40% { opacity: 1; }
  55% { opacity: 0; }
  65% { opacity: 1; }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes mb-wipe {
  0% { transform: translateX(-110%); }
  45% { transform: translateX(0%); }
  55% { transform: translateX(0%); }
  100% { transform: translateX(110%); }
}
@keyframes mb-marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes mb-shake {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  10% { transform: translate(-6px, 4px) rotate(-1deg); }
  20% { transform: translate(8px, -3px) rotate(1deg); }
  30% { transform: translate(-5px, -5px) rotate(-1deg); }
  40% { transform: translate(7px, 6px) rotate(1deg); }
  50% { transform: translate(-8px, 2px) rotate(-1deg); }
  60% { transform: translate(5px, -6px) rotate(1deg); }
  70% { transform: translate(-3px, 5px) rotate(0deg); }
  80% { transform: translate(6px, 3px) rotate(-1deg); }
  90% { transform: translate(-4px, -4px) rotate(1deg); }
}
@keyframes mb-drop {
  0% { opacity: 0; transform: translateY(-120%); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes mb-underline {
  0% { transform: scaleX(0); }
  100% { transform: scaleX(1); }
}
@keyframes mb-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
.mb-letter {
  display: inline-block;
  opacity: 0;
  animation: mb-flicker 0.9s steps(1) forwards;
}
.mb-shake {
  display: inline-block;
  animation: mb-shake 0.4s steps(2) infinite;
}
.mb-marquee-track {
  display: inline-block;
  white-space: nowrap;
  animation: mb-marquee 14s linear infinite;
}
.mb-wipe {
  position: absolute;
  inset: 0;
  background: ${palette.accent};
  transform: translateX(-110%);
  animation: mb-wipe 1.6s cubic-bezier(0.7, 0, 0.3, 1) forwards;
}
.mb-drop {
  display: block;
  opacity: 0;
  animation: mb-drop 0.45s steps(3) forwards;
}
.mb-underline-bar {
  display: block;
  height: 14px;
  background: ${palette.accent};
  transform-origin: left center;
  transform: scaleX(0);
  animation: mb-underline 0.7s steps(6) forwards;
}
.mb-cursor {
  display: inline-block;
  width: 0.55em;
  background: ${palette.text};
  margin-left: 6px;
  animation: mb-blink 0.6s steps(1) infinite;
}
`;

const Style = () => <style>{keyframes}</style>;

// ---------- helpers ----------
const FlickerWord = ({ text, delay = 0, size, color }: { text: string; delay?: number; size: number; color?: string }) => (
  <span style={{ display: 'inline-block', color: color ?? palette.text }}>
    {text.split('').map((ch, i) => (
      <span
        key={i}
        className="mb-letter"
        style={{
          fontSize: size,
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 0.95,
          animationDelay: `${delay + i * 60}ms`,
          whiteSpace: 'pre',
        }}
      >
        {ch}
      </span>
    ))}
  </span>
);

const Scramble = ({ target, delay = 0, size }: { target: string; delay?: number; size: number }) => {
  const [out, setOut] = useState(target.replace(/[^ ]/g, '#'));
  useEffect(() => {
    const glyphs = '!@#$%^&*()_+={}[]<>?/|\\ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let frame = 0;
    const total = 36;
    let timeout: number;
    const tick = () => {
      frame += 1;
      const reveal = Math.floor((frame / total) * target.length);
      let s = '';
      for (let i = 0; i < target.length; i += 1) {
        if (target[i] === ' ') s += ' ';
        else if (i < reveal) s += target[i];
        else s += glyphs[Math.floor(Math.random() * glyphs.length)];
      }
      setOut(s);
      if (frame < total) timeout = window.setTimeout(tick, 45);
      else setOut(target);
    };
    const start = window.setTimeout(tick, delay);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(timeout);
    };
  }, [target, delay]);
  return (
    <span
      style={{
        fontFamily: '"Courier New", ui-monospace, monospace',
        fontSize: size,
        fontWeight: 700,
        letterSpacing: '0.02em',
      }}
    >
      {out}
    </span>
  );
};

const Counter = ({ to, durationMs = 2200, size }: { to: number; durationMs?: number; size: number }) => {
  const [v, setV] = useState(0);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    let raf = 0;
    const step = (t: number) => {
      if (startRef.current == null) startRef.current = t;
      const p = Math.min(1, (t - startRef.current) / durationMs);
      // ease-out for visual punch but keep it brutal — round hard
      setV(Math.floor(to * (1 - Math.pow(1 - p, 2))));
      if (p < 1) raf = requestAnimationFrame(step);
      else setV(to);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, durationMs]);
  return (
    <span
      style={{
        fontSize: size,
        fontWeight: 900,
        letterSpacing: '-0.06em',
        lineHeight: 0.85,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {v.toLocaleString('en-US')}
    </span>
  );
};

const Marquee = ({ word, position }: { word: string; position: 'top' | 'bottom' }) => {
  const repeated = ` ${word} / `.repeat(20);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        [position]: 0,
        height: 90,
        background: palette.text,
        color: palette.bg,
        borderTop: position === 'bottom' ? `8px solid ${palette.text}` : 'none',
        borderBottom: position === 'top' ? `8px solid ${palette.text}` : 'none',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        className="mb-marquee-track"
        style={{
          fontSize: 56,
          fontWeight: 900,
          letterSpacing: '0.04em',
        }}
      >
        {repeated}
        {repeated}
      </div>
    </div>
  );
};

// ---------- pages ----------
const Cover: Page = () => (
  <div style={fill}>
    <Style />
    <Marquee word="MOTION" position="top" />

    {/* red wipe block over title */}
    <div
      style={{
        position: 'absolute',
        top: 320,
        left: 120,
        right: 120,
        height: 520,
        border: `12px solid ${palette.text}`,
        background: palette.bg,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '0 60px',
      }}
    >
      <div style={{ position: 'relative', zIndex: 2 }}>
        <FlickerWord text="MOTION" size={220} delay={1500} />
        <div style={{ height: 24 }} />
        <FlickerWord text="/ BRUTALIST" size={140} delay={2400} color={palette.accent} />
      </div>
      <div className="mb-wipe" />
    </div>

    {/* eyebrow tag */}
    <div
      style={{
        position: 'absolute',
        top: 180,
        left: 120,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
      }}
    >
      <div
        style={{
          padding: '12px 24px',
          background: palette.text,
          color: palette.bg,
          fontSize: 26,
          fontWeight: 900,
          letterSpacing: '0.18em',
        }}
      >
        VOL.01 // 2026
      </div>
      <div
        style={{
          width: 120,
          height: 8,
          background: palette.accent,
        }}
      />
    </div>

    {/* scramble subtitle */}
    <div
      style={{
        position: 'absolute',
        bottom: 220,
        left: 120,
        right: 120,
        borderTop: `8px solid ${palette.text}`,
        paddingTop: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Scramble target="A FIELD MANUAL FOR LOUD INTERFACES." delay={400} size={42} />
      <span
        style={{
          fontSize: 24,
          fontWeight: 900,
          letterSpacing: '0.2em',
          padding: '10px 18px',
          border: `4px solid ${palette.text}`,
        }}
      >
        001 / 003
      </span>
    </div>

    <Marquee word="BRUTALIST" position="bottom" />
  </div>
);

const Stat: Page = () => (
  <div style={fill}>
    <Style />

    {/* corner ticker label */}
    <div
      style={{
        position: 'absolute',
        top: 100,
        left: 120,
        fontSize: 28,
        fontWeight: 900,
        letterSpacing: '0.2em',
        padding: '12px 20px',
        background: palette.text,
        color: palette.bg,
      }}
    >
      FIG.02 — THE NUMBER
    </div>

    {/* offset frame */}
    <div
      style={{
        position: 'absolute',
        top: 220,
        left: 120,
        right: 360,
        bottom: 240,
        border: `12px solid ${palette.text}`,
        background: palette.bg,
        padding: 60,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 68, fontWeight: 900, color: palette.accent, marginRight: 18, lineHeight: 0.85 }}>
          +
        </span>
        <Counter to={184320} size={420} />
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div
          className="mb-shake"
          style={{
            fontSize: 56,
            fontWeight: 900,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            maxWidth: 900,
            lineHeight: 1,
          }}
        >
          Frames rendered
          <br />
          before lunch.
        </div>

        <div
          style={{
            padding: '14px 22px',
            background: palette.accent,
            color: palette.text,
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: '0.18em',
            border: `6px solid ${palette.text}`,
          }}
        >
          NO ROUNDED CORNERS
        </div>
      </div>
    </div>

    {/* offset secondary block */}
    <div
      style={{
        position: 'absolute',
        top: 320,
        right: 120,
        width: 220,
        height: 520,
        background: palette.accent,
        border: `12px solid ${palette.text}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 24,
        color: palette.text,
        fontWeight: 900,
      }}
    >
      <span style={{ fontSize: 22, letterSpacing: '0.18em' }}>UNIT</span>
      <span style={{ fontSize: 120, lineHeight: 0.85, letterSpacing: '-0.04em' }}>FPS</span>
      <span style={{ fontSize: 22, letterSpacing: '0.18em' }}>SAMPLE / 2026</span>
    </div>
  </div>
);

const rules = [
  { text: 'TYPE SCREAMS. WHITESPACE OBEYS.', highlight: false },
  { text: 'EVERY EDGE IS A DECISION.', highlight: true },
  { text: 'NO GRADIENTS. NO BLUR. NO MERCY.', highlight: false },
  { text: 'MOTION HITS — THEN STOPS COLD.', highlight: false },
];

const Manifesto: Page = () => (
  <div style={fill}>
    <Style />

    {/* heading */}
    <div
      style={{
        position: 'absolute',
        top: 120,
        left: 120,
        right: 120,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        borderBottom: `12px solid ${palette.text}`,
        paddingBottom: 28,
      }}
    >
      <div style={{ fontSize: 140, fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 0.9 }}>
        <FlickerWord text="MANIFESTO" size={140} delay={200} />
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 900,
          letterSpacing: '0.2em',
          padding: '12px 20px',
          background: palette.accent,
          color: palette.text,
          border: `6px solid ${palette.text}`,
        }}
      >
        FOUR RULES
      </div>
    </div>

    {/* rules */}
    <div
      style={{
        position: 'absolute',
        top: 360,
        left: 120,
        right: 120,
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
      }}
    >
      {rules.map((rule, i) => (
        <div
          key={i}
          className="mb-drop"
          style={{
            animationDelay: `${600 + i * 280}ms`,
            display: 'flex',
            alignItems: 'center',
            gap: 32,
            position: 'relative',
          }}
        >
          <span
            style={{
              fontSize: 56,
              fontWeight: 900,
              color: palette.accent,
              minWidth: 110,
              letterSpacing: '-0.02em',
            }}
          >
            0{i + 1}
          </span>
          <div style={{ position: 'relative', flex: 1 }}>
            <span
              style={{
                fontSize: 64,
                fontWeight: 900,
                letterSpacing: '-0.03em',
                lineHeight: 1,
                textTransform: 'uppercase',
                display: 'inline-block',
              }}
            >
              {rule.text}
            </span>
            {rule.highlight && (
              <span
                className="mb-underline-bar"
                style={{
                  width: '100%',
                  marginTop: 8,
                  animationDelay: `${1400 + i * 280}ms`,
                }}
              />
            )}
          </div>
        </div>
      ))}
    </div>

    {/* footer slab */}
    <div
      style={{
        position: 'absolute',
        bottom: 80,
        left: 120,
        right: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: `8px solid ${palette.text}`,
        paddingTop: 24,
      }}
    >
      <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: '0.2em' }}>
        END OF TRANSMISSION
        <span className="mb-cursor" style={{ height: 28 }} />
      </span>
      <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: '0.2em' }}>003 / 003</span>
    </div>
  </div>
);

export const meta: SlideMeta = { title: 'Motion / Brutalist' };
export default [Cover, Stat, Manifesto] satisfies Page[];
