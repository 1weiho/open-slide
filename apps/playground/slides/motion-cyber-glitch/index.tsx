import { useEffect, useRef, useState } from 'react';
import type { Page, SlideMeta } from '@open-slide/core';

const palette = {
  bg: '#05060B',
  cyan: '#22F1FF',
  magenta: '#FF2EC2',
  green: '#A8FFB0',
  white: '#F4FBFF',
  muted: '#5A6478',
  grid: 'rgba(34, 241, 255, 0.08)',
};

const fonts = {
  mono: '"JetBrains Mono", "SF Mono", "Menlo", monospace',
  display:
    '"Space Grotesk", "Inter", "SF Pro Display", system-ui, sans-serif',
};

const fill = {
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  background: palette.bg,
  color: palette.white,
  fontFamily: fonts.mono,
} as const;

// ---------- shared overlay (scanlines + vignette + sweep + grain) ----------

const Overlays = () => (
  <>
    <div className="cg-scanlines" />
    <div className="cg-sweep" />
    <div className="cg-vignette" />
    <div className="cg-grid" />
    <div className="cg-grain" />
  </>
);

// ---------- RGB-split glitch headline ----------

const GlitchText = ({
  text,
  size,
  weight = 900,
  letterSpacing = '-0.04em',
}: {
  text: string;
  size: number;
  weight?: number;
  letterSpacing?: string;
}) => {
  const base = {
    fontFamily: fonts.display,
    fontSize: size,
    fontWeight: weight,
    letterSpacing,
    lineHeight: 0.95,
    margin: 0,
    position: 'absolute' as const,
    top: 0,
    left: 0,
    whiteSpace: 'nowrap' as const,
  };
  return (
    <div
      style={{
        position: 'relative',
        height: size * 1.05,
        display: 'inline-block',
      }}
    >
      <div
        aria-hidden
        style={{
          ...base,
          color: palette.magenta,
          mixBlendMode: 'screen',
          animation: 'cg-shift-mag 2.6s steps(1) infinite',
        }}
      >
        {text}
      </div>
      <div
        aria-hidden
        style={{
          ...base,
          color: palette.cyan,
          mixBlendMode: 'screen',
          animation: 'cg-shift-cyan 2.6s steps(1) infinite',
        }}
      >
        {text}
      </div>
      <div
        style={{
          ...base,
          color: palette.white,
          mixBlendMode: 'screen',
          animation: 'cg-shift-white 2.6s steps(1) infinite',
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ---------- typewriter terminal ----------

const useTypewriter = (lines: string[], speed = 28, lineDelay = 220) => {
  const [out, setOut] = useState<string[]>(['']);
  const doneRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let timers: number[] = [];
    setOut(['']);
    doneRef.current = false;

    const run = async () => {
      const buf: string[] = [];
      for (let i = 0; i < lines.length; i++) {
        if (cancelled) return;
        buf.push('');
        const target = lines[i];
        for (let c = 0; c < target.length; c++) {
          if (cancelled) return;
          await new Promise<void>((res) => {
            const t = window.setTimeout(res, speed);
            timers.push(t);
          });
          buf[i] = target.slice(0, c + 1);
          setOut([...buf]);
        }
        await new Promise<void>((res) => {
          const t = window.setTimeout(res, lineDelay);
          timers.push(t);
        });
      }
      doneRef.current = true;
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [lines, speed, lineDelay]);

  return out;
};

// ---------- scramble-then-resolve value ----------

const SCRAMBLE_CHARS =
  '!<>-_\\/[]{}—=+*^?#________01010110ΣΦΩ@%&';

const useScramble = (target: string, intervalMs = 4200, dur = 700) => {
  const [val, setVal] = useState(target);
  useEffect(() => {
    let raf = 0;
    let burstTimer = 0;
    const tick = () => {
      const start = performance.now();
      const step = () => {
        const t = performance.now() - start;
        if (t > dur) {
          setVal(target);
          return;
        }
        const progress = t / dur;
        let s = '';
        for (let i = 0; i < target.length; i++) {
          if (target[i] === ' ') {
            s += ' ';
            continue;
          }
          if (Math.random() < progress * 0.95) {
            s += target[i];
          } else {
            s += SCRAMBLE_CHARS[
              Math.floor(Math.random() * SCRAMBLE_CHARS.length)
            ];
          }
        }
        setVal(s);
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    burstTimer = window.setInterval(tick, intervalMs);
    // initial burst after mount
    const initial = window.setTimeout(tick, 600);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(burstTimer);
      window.clearTimeout(initial);
    };
  }, [target, intervalMs, dur]);
  return val;
};

// ---------- styles ----------

const Styles = () => (
  <style>{`
    @keyframes cg-sweep {
      0%   { transform: translateY(-30%); opacity: 0.0; }
      10%  { opacity: 0.55; }
      90%  { opacity: 0.55; }
      100% { transform: translateY(130%); opacity: 0; }
    }
    @keyframes cg-flicker {
      0%, 92%, 100% { opacity: 1; }
      93% { opacity: 0.2; }
      94% { opacity: 1; }
      96% { opacity: 0.4; }
      97% { opacity: 1; }
    }
    @keyframes cg-caret {
      0%, 49% { opacity: 1; }
      50%, 100% { opacity: 0; }
    }
    @keyframes cg-shift-cyan {
      0%, 100% { transform: translate(-2px, 0); }
      20%      { transform: translate(-6px, 1px); }
      40%      { transform: translate(-2px, -1px); }
      60%      { transform: translate(-3px, 2px); }
      80%      { transform: translate(-1px, 0); }
    }
    @keyframes cg-shift-mag {
      0%, 100% { transform: translate(2px, 0); }
      20%      { transform: translate(6px, -1px); }
      40%      { transform: translate(3px, 1px); }
      60%      { transform: translate(2px, -2px); }
      80%      { transform: translate(4px, 0); }
    }
    @keyframes cg-shift-white {
      0%, 100% { transform: translate(0, 0); }
      18%      { transform: translate(0, -1px); clip-path: inset(0 0 60% 0); }
      19%      { transform: translate(0, 0); clip-path: inset(0 0 0 0); }
      55%      { clip-path: inset(0 0 0 0); }
      56%      { clip-path: inset(40% 0 0 0); }
      57%      { clip-path: inset(0 0 0 0); }
    }
    @keyframes cg-glow {
      0%, 100% { box-shadow: 0 0 8px rgba(34,241,255,0.4), inset 0 0 8px rgba(34,241,255,0.15); }
      50%      { box-shadow: 0 0 22px rgba(34,241,255,0.85), inset 0 0 14px rgba(34,241,255,0.3); }
    }
    @keyframes cg-grain {
      0%   { transform: translate(0, 0); }
      20%  { transform: translate(-2%, 1%); }
      40%  { transform: translate(1%, -2%); }
      60%  { transform: translate(-1%, 2%); }
      80%  { transform: translate(2%, -1%); }
      100% { transform: translate(0, 0); }
    }
    @keyframes cg-flash {
      0%, 88%, 100% { opacity: 0; }
      89% { opacity: 0.85; background: ${palette.cyan}; }
      90% { opacity: 0; }
      92% { opacity: 0.6; background: ${palette.magenta}; }
      93% { opacity: 0; }
    }
    @keyframes cg-bar-jitter {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      50% { transform: translateX(3px); }
      75% { transform: translateX(-2px); }
    }
    @keyframes cg-pulse-text {
      0%, 100% { text-shadow: 0 0 12px ${palette.cyan}, 0 0 32px rgba(34,241,255,0.5); }
      50%      { text-shadow: 0 0 28px ${palette.cyan}, 0 0 64px rgba(34,241,255,0.85), 0 0 96px rgba(255,46,194,0.4); }
    }
    @keyframes cg-marquee {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }

    .cg-scanlines {
      position: absolute; inset: 0; pointer-events: none;
      background: repeating-linear-gradient(
        to bottom,
        rgba(255,255,255,0.045) 0px,
        rgba(255,255,255,0.045) 1px,
        transparent 2px,
        transparent 4px
      );
      mix-blend-mode: overlay;
      z-index: 50;
    }
    .cg-sweep {
      position: absolute; left: 0; right: 0; height: 240px; pointer-events: none;
      background: linear-gradient(to bottom,
        transparent 0%,
        rgba(34,241,255,0.05) 30%,
        rgba(34,241,255,0.18) 50%,
        rgba(34,241,255,0.05) 70%,
        transparent 100%);
      mix-blend-mode: screen;
      animation: cg-sweep 6s linear infinite;
      z-index: 49;
    }
    .cg-vignette {
      position: absolute; inset: 0; pointer-events: none;
      background: radial-gradient(ellipse at center,
        transparent 40%,
        rgba(0,0,0,0.55) 100%);
      z-index: 48;
    }
    .cg-grid {
      position: absolute; inset: 0; pointer-events: none;
      background-image:
        linear-gradient(${palette.grid} 1px, transparent 1px),
        linear-gradient(90deg, ${palette.grid} 1px, transparent 1px);
      background-size: 80px 80px;
      mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
      z-index: 1;
    }
    .cg-grain {
      position: absolute; inset: -10%; pointer-events: none; opacity: 0.06;
      background:
        radial-gradient(circle at 20% 30%, white 1px, transparent 2px),
        radial-gradient(circle at 60% 70%, white 1px, transparent 2px),
        radial-gradient(circle at 80% 20%, white 1px, transparent 2px),
        radial-gradient(circle at 30% 80%, white 1px, transparent 2px);
      background-size: 3px 3px, 5px 5px, 4px 4px, 6px 6px;
      mix-blend-mode: screen;
      animation: cg-grain 0.4s steps(5) infinite;
      z-index: 47;
    }
    .cg-crt-box {
      border: 1px solid ${palette.cyan};
      animation: cg-glow 2.8s ease-in-out infinite;
    }
    .cg-flicker { animation: cg-flicker 5s steps(1) infinite; }
    .cg-caret {
      display: inline-block;
      width: 0.55em;
      height: 1em;
      background: ${palette.cyan};
      margin-left: 6px;
      vertical-align: text-bottom;
      animation: cg-caret 1s steps(1) infinite;
      box-shadow: 0 0 12px ${palette.cyan};
    }
    .cg-flash {
      position: absolute; inset: 0; pointer-events: none;
      animation: cg-flash 5s steps(1) infinite;
      mix-blend-mode: screen;
      z-index: 60;
    }
    .cg-marquee {
      display: flex;
      animation: cg-marquee 22s linear infinite;
      white-space: nowrap;
    }
  `}</style>
);

// ---------- PAGE 1 — Boot ----------

const Boot: Page = () => {
  const lines = useTypewriter(
    [
      '> SYS_BOOT v0.42.7 ............................. [OK]',
      '> LINK    cyber.glitch.local @ 1920x1080 ........ [OK]',
      '> KERNEL  motion-runtime ........................ [OK]',
      '> AUDIO   /dev/null ............................. [MUTED]',
      '> READY.',
    ],
    18,
    180,
  );

  return (
    <div style={fill}>
      <Styles />

      {/* corner marks */}
      <div
        style={{
          position: 'absolute',
          top: 56,
          left: 80,
          right: 80,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 22,
          color: palette.cyan,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          zIndex: 10,
          fontFamily: fonts.mono,
        }}
      >
        <span>// channel_01</span>
        <span className="cg-flicker">REC ●</span>
        <span>2026 / NEO-GRID</span>
      </div>

      {/* hero */}
      <div
        style={{
          position: 'absolute',
          top: 320,
          left: 120,
          right: 120,
          zIndex: 5,
        }}
      >
        <div
          style={{
            fontSize: 26,
            color: palette.green,
            letterSpacing: '0.4em',
            marginBottom: 28,
            fontFamily: fonts.mono,
          }}
        >
          &gt; INITIATING_DECK
        </div>
        <GlitchText text="// MOTION.GLITCH" size={196} />
        <div
          style={{
            marginTop: 240,
            fontSize: 34,
            color: palette.muted,
            maxWidth: 1100,
            lineHeight: 1.5,
            fontFamily: fonts.mono,
          }}
        >
          A field manual for moving pixels in a broken-signal aesthetic.
          <br />
          Three transmissions. No cooldown.
        </div>
      </div>

      {/* terminal box */}
      <div
        className="cg-crt-box"
        style={{
          position: 'absolute',
          left: 120,
          bottom: 80,
          width: 1200,
          padding: '28px 36px',
          background: 'rgba(34,241,255,0.04)',
          fontSize: 28,
          lineHeight: 1.6,
          color: palette.white,
          zIndex: 5,
          fontFamily: fonts.mono,
        }}
      >
        {lines.map((l, i) => (
          <div key={i}>
            {l}
            {i === lines.length - 1 && l.length > 0 && (
              <span className="cg-caret" />
            )}
          </div>
        ))}
      </div>

      {/* page indicator */}
      <div
        style={{
          position: 'absolute',
          right: 80,
          bottom: 80,
          fontSize: 24,
          color: palette.magenta,
          letterSpacing: '0.3em',
          zIndex: 10,
          fontFamily: fonts.mono,
        }}
      >
        01 / 03
      </div>

      <Overlays />
    </div>
  );
};

// ---------- PAGE 2 — Diagnostics ----------

const Row = ({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit: string;
  accent: string;
}) => {
  const scrambled = useScramble(value, 3500 + Math.random() * 2000, 650);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr 120px',
        alignItems: 'baseline',
        gap: 32,
        padding: '22px 28px',
        borderBottom: `1px dashed rgba(34,241,255,0.18)`,
        fontFamily: fonts.mono,
      }}
    >
      <div
        style={{
          fontSize: 26,
          color: palette.muted,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 56,
          color: accent,
          fontWeight: 700,
          textShadow: `0 0 18px ${accent}55`,
          letterSpacing: '0.02em',
        }}
      >
        {scrambled}
      </div>
      <div
        style={{
          fontSize: 28,
          color: palette.cyan,
          textAlign: 'right',
          opacity: 0.7,
        }}
      >
        {unit}
      </div>
    </div>
  );
};

const Diagnostics: Page = () => {
  return (
    <div style={fill}>
      <Styles />

      <div
        style={{
          position: 'absolute',
          top: 56,
          left: 80,
          right: 80,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 22,
          color: palette.cyan,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          zIndex: 10,
          fontFamily: fonts.mono,
        }}
      >
        <span>// channel_02</span>
        <span className="cg-flicker">DIAG ▒</span>
        <span>SIG: -42dB</span>
      </div>

      {/* heading */}
      <div
        style={{
          position: 'absolute',
          top: 140,
          left: 120,
          zIndex: 5,
        }}
      >
        <div
          style={{
            fontSize: 24,
            color: palette.green,
            letterSpacing: '0.4em',
            marginBottom: 18,
            fontFamily: fonts.mono,
          }}
        >
          &gt; SYS_DIAGNOSTICS
        </div>
        <GlitchText text="DATA_STREAM" size={132} />
      </div>

      {/* table */}
      <div
        className="cg-crt-box"
        style={{
          position: 'absolute',
          top: 380,
          left: 120,
          right: 120,
          background: 'rgba(34,241,255,0.03)',
          padding: '12px 28px',
          zIndex: 5,
        }}
      >
        <Row label="FRAME_RATE"    value="119.97" unit="fps"   accent={palette.cyan} />
        <Row label="GLITCH_DENSITY" value="0.842" unit="ratio" accent={palette.magenta} />
        <Row label="PACKET_LOSS"   value="00.07%" unit="loss"  accent={palette.green} />
        <Row label="ENTROPY"       value="7F3A91" unit="hex"   accent={palette.cyan} />
        <Row label="UPTIME"        value="42:17:08" unit="hrs" accent={palette.magenta} />
      </div>

      {/* side stripe / marquee */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 70,
          overflow: 'hidden',
          fontSize: 22,
          color: palette.cyan,
          opacity: 0.6,
          fontFamily: fonts.mono,
          letterSpacing: '0.4em',
          zIndex: 10,
          animation: 'cg-bar-jitter 0.18s steps(1) infinite',
        }}
      >
        <div className="cg-marquee">
          <span style={{ paddingRight: 80 }}>
            ░░ STREAM_OK ░░ NO_SIGNAL ░░ NEON_ONLINE ░░ COLOR_BLEED_LOW ░░ AUDIO_MUTED ░░ STREAM_OK ░░ NO_SIGNAL ░░ NEON_ONLINE ░░ COLOR_BLEED_LOW ░░ AUDIO_MUTED ░░
          </span>
          <span style={{ paddingRight: 80 }}>
            ░░ STREAM_OK ░░ NO_SIGNAL ░░ NEON_ONLINE ░░ COLOR_BLEED_LOW ░░ AUDIO_MUTED ░░ STREAM_OK ░░ NO_SIGNAL ░░ NEON_ONLINE ░░ COLOR_BLEED_LOW ░░ AUDIO_MUTED ░░
          </span>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 80,
          bottom: 28,
          fontSize: 24,
          color: palette.magenta,
          letterSpacing: '0.3em',
          zIndex: 10,
          fontFamily: fonts.mono,
        }}
      >
        02 / 03
      </div>

      <Overlays />
    </div>
  );
};

// ---------- PAGE 3 — Outro ----------

const Outro: Page = () => {
  return (
    <div style={fill}>
      <Styles />

      <div
        style={{
          position: 'absolute',
          top: 56,
          left: 80,
          right: 80,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 22,
          color: palette.cyan,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          zIndex: 10,
          fontFamily: fonts.mono,
        }}
      >
        <span>// channel_03</span>
        <span className="cg-flicker">SIGNAL LOST</span>
        <span>END_OF_FILE</span>
      </div>

      {/* huge centerpiece */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5,
        }}
      >
        <div
          style={{
            fontSize: 28,
            color: palette.green,
            letterSpacing: '0.5em',
            marginBottom: 32,
            fontFamily: fonts.mono,
          }}
          className="cg-flicker"
        >
          &gt; TRANSMISSION_COMPLETE
        </div>

        <div
          style={{
            position: 'relative',
            height: 380,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              fontFamily: fonts.display,
              fontSize: 420,
              fontWeight: 900,
              letterSpacing: '-0.06em',
              color: palette.magenta,
              mixBlendMode: 'screen',
              animation: 'cg-shift-mag 2.2s steps(1) infinite',
              lineHeight: 1,
            }}
          >
            // EOF
          </div>
          <div
            style={{
              position: 'absolute',
              fontFamily: fonts.display,
              fontSize: 420,
              fontWeight: 900,
              letterSpacing: '-0.06em',
              color: palette.cyan,
              mixBlendMode: 'screen',
              animation: 'cg-shift-cyan 2.2s steps(1) infinite',
              lineHeight: 1,
            }}
          >
            // EOF
          </div>
          <div
            style={{
              position: 'relative',
              fontFamily: fonts.display,
              fontSize: 420,
              fontWeight: 900,
              letterSpacing: '-0.06em',
              color: palette.white,
              mixBlendMode: 'screen',
              animation:
                'cg-shift-white 2.2s steps(1) infinite, cg-pulse-text 3.4s ease-in-out infinite',
              lineHeight: 1,
            }}
          >
            // EOF
          </div>
        </div>

        <div
          style={{
            marginTop: 40,
            fontSize: 32,
            color: palette.muted,
            letterSpacing: '0.3em',
            fontFamily: fonts.mono,
          }}
        >
          [ press any key to disconnect ]
          <span className="cg-caret" />
        </div>
      </div>

      {/* corner CRT decorations */}
      {(['tl', 'tr', 'bl', 'br'] as const).map((c) => {
        const pos: React.CSSProperties = {
          position: 'absolute',
          width: 48,
          height: 48,
          zIndex: 8,
        };
        if (c === 'tl') Object.assign(pos, { top: 100, left: 100, borderTop: `2px solid ${palette.cyan}`, borderLeft: `2px solid ${palette.cyan}` });
        if (c === 'tr') Object.assign(pos, { top: 100, right: 100, borderTop: `2px solid ${palette.cyan}`, borderRight: `2px solid ${palette.cyan}` });
        if (c === 'bl') Object.assign(pos, { bottom: 100, left: 100, borderBottom: `2px solid ${palette.cyan}`, borderLeft: `2px solid ${palette.cyan}` });
        if (c === 'br') Object.assign(pos, { bottom: 100, right: 100, borderBottom: `2px solid ${palette.cyan}`, borderRight: `2px solid ${palette.cyan}` });
        return (
          <div
            key={c}
            style={{
              ...pos,
              boxShadow: `0 0 18px ${palette.cyan}`,
              animation: 'cg-glow 2.8s ease-in-out infinite',
            }}
          />
        );
      })}

      <div
        style={{
          position: 'absolute',
          right: 80,
          bottom: 60,
          fontSize: 24,
          color: palette.magenta,
          letterSpacing: '0.3em',
          zIndex: 10,
          fontFamily: fonts.mono,
        }}
      >
        03 / 03
      </div>

      {/* full-canvas glitch flash */}
      <div className="cg-flash" />
      <Overlays />
    </div>
  );
};

export const meta: SlideMeta = { title: 'motion.glitch — neon cyberpunk' };
export default [Boot, Diagnostics, Outro] satisfies Page[];
