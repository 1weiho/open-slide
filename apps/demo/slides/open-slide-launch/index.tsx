import { ImagePlaceholder } from '@open-slide/core';
import type { CSSProperties } from 'react';
import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';
import openSlide from './assets/open-slide.png';


export const design: DesignSystem = {
  palette: { bg: '#f6f3ec', text: '#0a0a0a', accent: '#ff4f1a' },
  fonts: {
    display:
      "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  },
  typeScale: { hero: 320, body: 40 },
  radius: 0,
};

const tokens = {
  ink: '#0a0a0a',
  paper: '#f6f3ec',
  accent: '#ff4f1a',
  cream: '#fffdf6',
  mono: "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace",
} as const;

const fill: CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  fontFamily: 'var(--osd-font-display)',
  boxSizing: 'border-box',
};

const keyframes = `
@keyframes mWipeR { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
@keyframes mWipeL { from { clip-path: inset(0 0 0 100%); } to { clip-path: inset(0 0 0 0); } }
@keyframes mWipeD { from { clip-path: inset(100% 0 0 0); } to { clip-path: inset(0 0 0 0); } }
@keyframes mWipeU { from { clip-path: inset(0 0 100% 0); } to { clip-path: inset(0 0 0 0); } }

@keyframes mSlamUp {
  0%   { opacity: 0; transform: translateY(160px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes mSlamDown {
  0%   { opacity: 0; transform: translateY(-160px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes mSlamL {
  0%   { opacity: 0; transform: translateX(-200px); }
  100% { opacity: 1; transform: translateX(0); }
}
@keyframes mSlamR {
  0%   { opacity: 0; transform: translateX(200px); }
  100% { opacity: 1; transform: translateX(0); }
}
@keyframes mPop {
  0%   { opacity: 0; transform: scale(0.6); }
  60%  { transform: scale(1.08); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes mFlyIn {
  0%   { opacity: 0; transform: translate(var(--dx, -120px), var(--dy, -120px)) rotate(var(--r, -10deg)); }
  100% { opacity: 1; transform: translate(0, 0) rotate(0); }
}

@keyframes mSweepX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes mSweepY { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes mPushR { from { transform: translateX(-105%); } to { transform: translateX(0); } }
@keyframes mPushL { from { transform: translateX(105%); } to { transform: translateX(0); } }

@keyframes mBlink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
@keyframes mTick { from { transform: translateY(0); } to { transform: translateY(-100%); } }
@keyframes mFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
@keyframes mDrift {
  0%   { transform: translate(0, 0); }
  50%  { transform: translate(8px, -6px); }
  100% { transform: translate(0, 0); }
}
@keyframes mFade { from { opacity: 0; } to { opacity: 1; } }
`;

/* ───────────────── Helpers ───────────────── */

const Letters = ({
  text,
  className = '',
  delay = 0,
  step = 38,
  duration = 720,
  ease = 'cubic-bezier(0.2, 0.9, 0.25, 1)',
  anim = 'mSlamUp',
  style,
}: {
  text: string;
  className?: string;
  delay?: number;
  step?: number;
  duration?: number;
  ease?: string;
  anim?: 'mSlamUp' | 'mSlamDown' | 'mSlamL' | 'mSlamR' | 'mPop';
  style?: CSSProperties;
}) => (
  <span
    className={className}
    style={{ display: 'inline-flex', whiteSpace: 'pre', ...style }}
  >
    {[...text].map((c, i) => (
      <span
        key={i}
        style={{
          display: 'inline-block',
          whiteSpace: 'pre',
          animation: `${anim} ${duration}ms ${ease} ${delay + i * step}ms both`,
        }}
      >
        {c}
      </span>
    ))}
  </span>
);

const Bar = ({
  color,
  delay,
  duration = 700,
  origin = 'left',
  axis = 'x',
  style,
}: {
  color: string;
  delay: number;
  duration?: number;
  origin?: 'left' | 'right' | 'top' | 'bottom';
  axis?: 'x' | 'y';
  style: CSSProperties;
}) => (
  <span
    style={{
      ...style,
      background: color,
      transformOrigin: origin,
      animation: `${
        axis === 'x' ? 'mSweepX' : 'mSweepY'
      } ${duration}ms cubic-bezier(0.7, 0, 0.2, 1) ${delay}ms both`,
    }}
  />
);

/* ─────────────────────── 1. Introducing ─────────────────────── */

const Cover: Page = () => (
  <div
    style={{
      ...fill,
      background: tokens.paper,
      color: tokens.ink,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '0 140px',
    }}
  >
    <style>{keyframes}</style>

    {/* Top + bottom rules push in from opposite sides */}
    <Bar
      color={tokens.accent}
      delay={80}
      origin="left"
      style={{ position: 'absolute', top: 96, left: 140, right: 140, height: 6 }}
    />
    <Bar
      color={tokens.ink}
      delay={220}
      origin="right"
      style={{ position: 'absolute', bottom: 96, left: 140, right: 140, height: 6 }}
    />

    {/* Eyebrow */}
    <div
      style={{
        fontFamily: tokens.mono,
        fontSize: 26,
        letterSpacing: '0.42em',
        textTransform: 'uppercase',
        color: tokens.accent,
        marginBottom: 64,
        animation: 'mWipeR 800ms cubic-bezier(0.7, 0, 0.2, 1) 260ms both',
      }}
    >
      Introducing ——
    </div>

    {/* Logo + wordmark lockup */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 56,
        marginBottom: 72,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          animation: 'mPop 800ms cubic-bezier(0.2, 1.1, 0.3, 1) 520ms both',
        }}
      >
        <img src={openSlide} alt='open-slide square logo mark' style={{ width: 260, height: 260, objectFit: 'cover' }} />
      </div>

      <div
        style={{
          fontSize: '166px',
          fontWeight: 900,
          letterSpacing: '-0.05em',
          lineHeight: 0.92,
          margin: 0,
          display: 'flex',
          overflowY: 'hidden',
          paddingBottom: 12,
          paddingRight: 24,
        }}
      >
        <Letters text="open-slide" delay={780} step={42} duration={720} />
      </div>
    </div>

    {/* Tagline */}
    <div
      style={{
        fontSize: 76,
        fontWeight: 700,
        letterSpacing: '-0.03em',
        lineHeight: 1.06,
        margin: 0,
        maxWidth: 1500,
      }}
    >
      <div style={{ overflow: 'hidden' }}>
        <Letters text="A slide framework " delay={1500} step={26} />
      </div>
      <div style={{ overflow: 'hidden', marginTop: 4 }}>
        <Letters text="built for " delay={1820} step={26} />
        <span style={{ position: 'relative', display: 'inline-block' }}>
          <Letters
            text="agents."
            delay={2080}
            step={30}
            style={{ color: tokens.accent, fontStyle: 'italic' }}
          />
          <Bar
            color={tokens.accent}
            delay={2520}
            duration={600}
            origin="left"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 6,
              height: 6,
            }}
          />
        </span>
      </div>
    </div>

  </div>
);

/* ─────────────────────── 2. /create-slide ─────────────────────── */

const Skill: Page = () => (
  <div
    style={{
      ...fill,
      background: tokens.ink,
      color: tokens.paper,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '0 140px',
    }}
  >
    <style>{keyframes}</style>

    {/* Sliding ink bar that wipes across, then text overlays */}
    <Bar
      color={tokens.accent}
      delay={0}
      duration={650}
      origin="left"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 14,
      }}
    />

    {/* Big ghost text behind */}
    <div
      style={{
        position: 'absolute',
        top: 80,
        left: -40,
        fontSize: 480,
        fontWeight: 900,
        color: 'transparent',
        WebkitTextStroke: `2px rgba(246, 243, 236, 0.07)`,
        letterSpacing: '-0.05em',
        lineHeight: 0.85,
        userSelect: 'none',
        animation: 'mFade 1200ms ease 200ms both',
      }}
    >
      01
    </div>

    {/* Small label */}
    <div
      style={{
        fontFamily: tokens.mono,
        fontSize: 24,
        letterSpacing: '0.42em',
        textTransform: 'uppercase',
        color: tokens.accent,
        marginBottom: 36,
        animation: 'mWipeR 800ms cubic-bezier(0.7, 0, 0.2, 1) 280ms both',
      }}
    >
      Skill ——
    </div>

    {/* Hero command */}
    <div
      style={{ fontFamily: tokens.mono, fontSize: '180px', fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 1, margin: 0, display: 'flex', alignItems: 'baseline', gap: 8 }}
    >
      <Letters
        text="/create-slide"
        delay={520}
        step={48}
        duration={780}
        anim="mSlamUp"
      />
      <span
        style={{
          display: 'inline-block',
          width: 26,
          height: 180,
          background: tokens.accent,
          marginLeft: 18,
          animation:
            'mFade 220ms ease 1400ms both, mBlink 1s steps(1) 1600ms infinite',
        }}
      />
    </div>

    {/* Underline + caption row */}
    <div
      style={{
        marginTop: 64,
        display: 'flex',
        alignItems: 'center',
        gap: 32,
        width: '100%',
      }}
    >
      <Bar
        color={tokens.paper}
        delay={1500}
        duration={900}
        origin="left"
        style={{ height: 4, flex: 1, opacity: 0.6 }}
      />
      <div
        style={{
          fontFamily: tokens.mono,
          fontSize: 30,
          color: tokens.paper,
          opacity: 0.8,
          whiteSpace: 'nowrap',
          animation: 'mWipeR 700ms cubic-bezier(0.7, 0, 0.2, 1) 1900ms both',
        }}
      >
        tell the agent — it writes the deck.
      </div>
    </div>
  </div>
);

/* ─────────────────────── 3. Inspect & send ─────────────────────── */

const Inspect: Page = () => {
  const Step = ({
    n,
    label,
    delay,
    accent = false,
  }: {
    n: string;
    label: string;
    delay: number;
    accent?: boolean;
  }) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 36,
        animation: `mSlamL 720ms cubic-bezier(0.2, 0.9, 0.25, 1) ${delay}ms both`,
      }}
    >
      <span
        style={{
          fontFamily: tokens.mono,
          fontSize: 30,
          letterSpacing: '0.32em',
          color: tokens.accent,
          width: 64,
          flexShrink: 0,
        }}
      >
        {n}
      </span>
      <span
        style={{
          fontSize: 188,
          fontWeight: 900,
          letterSpacing: '-0.045em',
          lineHeight: 0.96,
          color: accent ? tokens.accent : tokens.ink,
        }}
      >
        {label}
      </span>
    </div>
  );

  return (
    <div
      style={{
        ...fill,
        background: tokens.paper,
        color: tokens.ink,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 140px',
      }}
    >
      <style>{keyframes}</style>

      {/* Drifting accent square */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          right: 140,
          width: 220,
          height: 220,
          background: tokens.accent,
          animation:
            'mPushL 700ms cubic-bezier(0.7, 0, 0.2, 1) 200ms both, mDrift 6s ease-in-out 1s infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 100,
          right: 140,
          width: 220,
          height: 220,
          border: `4px solid ${tokens.ink}`,
          transform: 'translate(36px, 36px)',
          animation: 'mFade 600ms ease 700ms both',
        }}
      />

      <Step n="01" label="Inspect." delay={300} />
      <div style={{ height: 32 }} />
      <Step n="02" label="Comment." delay={620} />
      <div style={{ height: 32 }} />
      <Step n="03" label="Send →" delay={940} accent />

      {/* Bottom strapline */}
      <div
        style={{
          position: 'absolute',
          bottom: 100,
          left: 140,
          right: 140,
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: tokens.mono,
          fontSize: 24,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: tokens.ink,
          animation: 'mFade 700ms ease 1500ms both',
        }}
      >
        <span>Point at the canvas</span>
        <span>The agent fixes it</span>
      </div>
    </div>
  );
};

/* ─────────────────────── 4. Visual Editor ─────────────────────── */

const Visual: Page = () => (
  <div
    style={{
      ...fill,
      background: tokens.accent,
      color: tokens.ink,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 0,
    }}
  >
    <style>{keyframes}</style>

    {/* Push-in ink slab from left */}
    <Bar
      color={tokens.ink}
      delay={0}
      duration={700}
      origin="left"
      style={{
        position: 'absolute',
        top: 80,
        left: 0,
        width: '38%',
        height: 60,
      }}
    />
    {/* Push-in ink slab from right (opposite line) */}
    <Bar
      color={tokens.ink}
      delay={120}
      duration={700}
      origin="right"
      style={{
        position: 'absolute',
        bottom: 80,
        right: 0,
        width: '38%',
        height: 60,
      }}
    />

    {/* "VISUAL" — wipes down (clip-path mask) */}
    <div
      style={{
        fontSize: 360,
        fontWeight: 900,
        letterSpacing: '-0.05em',
        lineHeight: 0.86,
        paddingRight: 24,
        animation: 'mWipeD 900ms cubic-bezier(0.7, 0, 0.2, 1) 360ms both',
      }}
    >
      VISUAL
    </div>

    {/* Strikethrough sweep across between */}
    <div
      style={{
        position: 'relative',
        height: 32,
        width: '70%',
        margin: '20px 0',
      }}
    >
      <Bar
        color={tokens.paper}
        delay={1000}
        duration={650}
        origin="left"
        style={{
          position: 'absolute',
          inset: 0,
        }}
      />
    </div>

    {/* "EDITOR" — wipes up */}
    <div
      style={{
        fontSize: 360,
        fontWeight: 900,
        letterSpacing: '-0.05em',
        lineHeight: 0.86,
        paddingRight: 24,
        color: tokens.paper,
        animation: 'mWipeU 900ms cubic-bezier(0.7, 0, 0.2, 1) 1200ms both',
      }}
    >
      EDITOR
    </div>

    {/* Caption — flows below EDITOR inside the centered flex stack */}
    <div
      style={{
        marginTop: 36,
        fontFamily: tokens.mono,
        fontSize: 28,
        letterSpacing: '0.42em',
        textTransform: 'uppercase',
        color: tokens.ink,
        animation: 'mWipeR 700ms cubic-bezier(0.7, 0, 0.2, 1) 2100ms both',
      }}
    >
      drag · resize · retype
    </div>

    {/* Selection corner marks pinned to the canvas corners, clear of the bars */}
    {([
      [40, 40, '0deg'],
      [1880, 40, '90deg'],
      [40, 1040, '270deg'],
      [1880, 1040, '180deg'],
    ] as const).map(([x, y, rot], i) => (
      <span
        key={i}
        style={{
          position: 'absolute',
          left: x - 24,
          top: y - 24,
          width: 48,
          height: 48,
          borderTop: `6px solid ${tokens.ink}`,
          borderLeft: `6px solid ${tokens.ink}`,
          transform: `rotate(${rot})`,
          animation: `mPop 500ms cubic-bezier(0.2, 1.1, 0.3, 1) ${
            1700 + i * 90
          }ms both`,
        }}
      />
    ))}
  </div>
);

/* ─────────────────────── 5. Design system ─────────────────────── */

const DesignPanel: Page = () => {
  const swatches = [
    { name: 'BG', value: '#f6f3ec', text: tokens.ink },
    { name: 'TEXT', value: '#0a0a0a', text: tokens.paper },
    { name: 'ACCENT', value: '#ff4f1a', text: tokens.paper },
    { name: 'MUTED', value: '#7a7468', text: tokens.paper },
  ];
  return (
    <div
      style={{
        ...fill,
        background: tokens.paper,
        color: tokens.ink,
        display: 'flex',
      }}
    >
      <style>{keyframes}</style>

      {/* Four full-height color stripes pushing up from below */}
      <div style={{ display: 'flex', width: '100%', height: '100%' }}>
        {swatches.map((s, i) => (
          <div
            key={s.name}
            style={{
              flex: 1,
              background: s.value,
              color: s.text,
              position: 'relative',
              transformOrigin: 'bottom',
              animation: `mSweepY 720ms cubic-bezier(0.7, 0, 0.2, 1) ${
                100 + i * 110
              }ms both`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 80,
                left: 36,
                right: 36,
                fontFamily: tokens.mono,
                fontSize: 22,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                animation: `mWipeR 600ms cubic-bezier(0.7, 0, 0.2, 1) ${
                  700 + i * 110
                }ms both`,
              }}
            >
              {s.name}
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: 80,
                left: 36,
                right: 36,
                fontFamily: tokens.mono,
                fontSize: 28,
                fontWeight: 600,
                animation: `mSlamUp 600ms cubic-bezier(0.2, 0.9, 0.25, 1) ${
                  900 + i * 110
                }ms both`,
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Center title — slabs in */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            background: tokens.paper,
            color: tokens.ink,
            padding: '36px 64px',
            fontSize: 168,
            fontWeight: 900,
            letterSpacing: '-0.04em',
            lineHeight: 0.95,
            animation: 'mPop 800ms cubic-bezier(0.2, 1.1, 0.3, 1) 1500ms both',
            boxShadow: `0 0 0 8px ${tokens.ink}`,
          }}
        >
          DESIGN
        </div>
        <div
          style={{
            background: tokens.ink,
            color: tokens.paper,
            padding: '36px 64px',
            fontSize: 168,
            fontWeight: 900,
            letterSpacing: '-0.04em',
            lineHeight: 0.95,
            marginTop: 16,
            animation: 'mPop 800ms cubic-bezier(0.2, 1.1, 0.3, 1) 1700ms both',
          }}
        >
          SYSTEM
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────── 6. Assets manager ─────────────────────── */

const Assets: Page = () => {
  const blocks = [
    { x: 140, y: 120, w: 360, h: 220, color: tokens.accent, dx: '-200px', dy: '-200px', r: '-12deg', delay: 200 },
    { x: 540, y: 90, w: 480, h: 280, color: '#f5b85a', dx: '0px', dy: '-260px', r: '8deg', delay: 320 },
    { x: 1060, y: 130, w: 420, h: 300, color: tokens.paper, dx: '240px', dy: '-220px', r: '-6deg', delay: 440 },
    { x: 1520, y: 110, w: 280, h: 260, color: tokens.cream, dx: '320px', dy: '-180px', r: '14deg', delay: 560 },
    { x: 180, y: 700, w: 320, h: 260, color: tokens.cream, dx: '-280px', dy: '260px', r: '12deg', delay: 380 },
    { x: 560, y: 720, w: 360, h: 240, color: tokens.accent, dx: '-100px', dy: '300px', r: '-10deg', delay: 500 },
    { x: 980, y: 700, w: 460, h: 260, color: tokens.paper, dx: '120px', dy: '300px', r: '6deg', delay: 620 },
    { x: 1480, y: 720, w: 300, h: 240, color: '#f5b85a', dx: '320px', dy: '260px', r: '-14deg', delay: 740 },
  ];

  return (
    <div
      style={{
        ...fill,
        background: tokens.ink,
        color: tokens.paper,
      }}
    >
      <style>{keyframes}</style>

      {blocks.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: b.x,
            top: b.y,
            width: b.w,
            height: b.h,
            background: b.color,
            ['--dx' as string]: b.dx,
            ['--dy' as string]: b.dy,
            ['--r' as string]: b.r,
            animation: `mFlyIn 800ms cubic-bezier(0.2, 0.9, 0.25, 1) ${b.delay}ms both`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: 18,
              fontFamily: tokens.mono,
              fontSize: 16,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: b.color === tokens.ink || b.color === tokens.accent ? tokens.paper : tokens.ink,
              opacity: 0.85,
              animation: `mFade 500ms ease ${b.delay + 600}ms both`,
            }}
          >
            {['IMG', 'MP4', 'SVG', 'TTF', 'PNG', 'WEBP', 'JPG', 'WOFF2'][i]}
          </div>
        </div>
      ))}

      {/* Center mega title */}
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
        <div
          style={{
            fontSize: 380,
            fontWeight: 900,
            letterSpacing: '-0.05em',
            lineHeight: 0.85,
            color: tokens.paper,
            mixBlendMode: 'difference',
            animation: 'mPop 900ms cubic-bezier(0.2, 1.1, 0.3, 1) 1100ms both',
          }}
        >
          ASSETS
        </div>
      </div>

      {/* Bottom mono ticker */}
      <div
        style={{
          position: 'absolute',
          bottom: 36,
          left: 140,
          right: 140,
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: tokens.mono,
          fontSize: 22,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: tokens.paper,
          opacity: 0.7,
          animation: 'mFade 700ms ease 1700ms both',
        }}
      >
        <span>· image / video / vector / font</span>
        <span>drop · paste · import</span>
      </div>
    </div>
  );
};

/* ─────────────────────── 7. CLI init ─────────────────────── */

const Cli: Page = () => (
  <div
    style={{
      ...fill,
      background: tokens.paper,
      color: tokens.ink,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '0 120px',
    }}
  >
    <style>{keyframes}</style>

    {/* Top accent rule */}
    <Bar
      color={tokens.accent}
      delay={0}
      duration={700}
      origin="left"
      style={{
        position: 'absolute',
        top: 120,
        left: 120,
        right: 120,
        height: 6,
      }}
    />

    {/* Eyebrow */}
    <div
      style={{
        marginTop: 40,
        fontFamily: tokens.mono,
        fontSize: 28,
        letterSpacing: '0.42em',
        textTransform: 'uppercase',
        color: tokens.accent,
        marginBottom: 80,
        animation: 'mWipeR 800ms cubic-bezier(0.7, 0, 0.2, 1) 320ms both',
      }}
    >
      Available now ——
    </div>

    {/* Hero command line */}
    <div
      style={{ fontFamily: tokens.mono, fontSize: '100px', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}
    >
      <span
        style={{
          color: tokens.accent,
          animation: 'mPop 600ms cubic-bezier(0.2, 1.1, 0.3, 1) 600ms both',
        }}
      >
        $
      </span>
      <Letters
        text="npx @open-slide/cli init"
        delay={780}
        step={42}
        duration={620}
        anim="mSlamUp"
      />
      <span
        style={{
          display: 'inline-block',
          width: 22,
          height: 110,
          background: tokens.ink,
          marginLeft: 8,
          alignSelf: 'center',
          animation:
            'mFade 220ms ease 1900ms both, mBlink 1s steps(1) 2100ms infinite',
        }}
      />
    </div>

    {/* Underline sweep */}
    <Bar
      color={tokens.ink}
      delay={2100}
      duration={1100}
      origin="left"
      style={{
        marginTop: 64,
        height: 6,
        width: 'calc(100% - 240px)',
      }}
    />

    {/* Tag line below */}
    <div
      style={{
        marginTop: 56,
        fontSize: 64,
        fontWeight: 800,
        letterSpacing: '-0.03em',
        lineHeight: 1.06,
        animation: 'mSlamUp 700ms cubic-bezier(0.2, 0.9, 0.25, 1) 2400ms both',
      }}
    >
      Build slides with your{' '}
      <span style={{ color: tokens.accent, fontStyle: 'italic' }}>agent</span>.
    </div>

    {/* Bottom rail */}
    <div
      style={{
        position: 'absolute',
        bottom: 80,
        left: 120,
        right: 120,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: tokens.mono,
        fontSize: 22,
        letterSpacing: '0.32em',
        textTransform: 'uppercase',
        color: tokens.ink,
        animation: 'mFade 700ms ease 3000ms both',
      }}
    >
      <span>open-slide.dev</span>
    </div>
  </div>
);

export const meta: SlideMeta = { title: 'open-slide — Launch Motion' };
export default [
  Cover,
  Skill,
  Inspect,
  Visual,
  DesignPanel,
  Assets,
  Cli,
] satisfies Page[];
