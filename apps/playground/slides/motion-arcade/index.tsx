import { useEffect, useState } from 'react';
import type { Page, SlideMeta } from '@open-slide/core';

const palette = {
  bg: '#0B0420',
  pink: '#FF2BD8',
  cyan: '#21F0FF',
  yellow: '#FFEA3F',
  green: '#1FFF7B',
  orange: '#FFB23F',
  dim: '#3A1B5C',
} as const;

const fontStack =
  '"Press Start 2P", "VT323", "Courier New", ui-monospace, monospace';

const fill = {
  width: '100%',
  height: '100%',
  background: palette.bg,
  color: palette.cyan,
  fontFamily: fontStack,
  letterSpacing: '0.05em',
  position: 'relative',
  overflow: 'hidden',
} as const;

const keyframes = `
@keyframes ar-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
@keyframes ar-marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes ar-marquee-rev {
  0% { transform: translateX(-50%); }
  100% { transform: translateX(0); }
}
@keyframes ar-bounce-x {
  0% { transform: translateX(0) translateY(0); }
  25% { transform: translateX(440px) translateY(-90px); }
  50% { transform: translateX(880px) translateY(0); }
  75% { transform: translateX(1320px) translateY(-90px); }
  100% { transform: translateX(1700px) translateY(0); }
}
@keyframes ar-sprite-flip {
  0%, 49% { transform: scaleX(1); }
  50%, 100% { transform: scaleX(-1); }
}
@keyframes ar-grid-scroll {
  0% { background-position: 0 0; }
  100% { background-position: 0 80px; }
}
@keyframes ar-flash {
  0%, 96%, 100% { opacity: 0; }
  97%, 99% { opacity: 0.22; }
}
@keyframes ar-glow-pulse {
  0%, 100% {
    text-shadow:
      0 0 8px ${palette.pink},
      0 0 22px ${palette.pink},
      6px 0 0 ${palette.cyan},
      -6px 0 0 ${palette.yellow};
  }
  50% {
    text-shadow:
      0 0 14px ${palette.pink},
      0 0 36px ${palette.pink},
      8px 0 0 ${palette.cyan},
      -8px 0 0 ${palette.yellow};
  }
}
@keyframes ar-runner {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
@keyframes ar-shake {
  0%, 100% { transform: translate(0,0); }
  25% { transform: translate(-3px, 2px); }
  50% { transform: translate(2px, -2px); }
  75% { transform: translate(-2px, -1px); }
}
@keyframes ar-stars {
  0% { background-position: 0 0, 0 0; }
  100% { background-position: -800px 0, 600px 0; }
}
.ar-scanlines::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    to bottom,
    rgba(0,0,0,0) 0,
    rgba(0,0,0,0) 2px,
    rgba(0,0,0,0.28) 3px,
    rgba(0,0,0,0.28) 4px
  );
  mix-blend-mode: multiply;
  z-index: 50;
}
.ar-vignette::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.7) 100%);
  z-index: 49;
}
.ar-flash-layer {
  position: absolute;
  inset: 0;
  background: ${palette.cyan};
  opacity: 0;
  pointer-events: none;
  animation: ar-flash 5.2s linear infinite;
  z-index: 48;
  mix-blend-mode: screen;
}
.ar-pixel { image-rendering: pixelated; }
`;

// ----- Sprite: 8x8-ish pixel alien rendered with <rect> blocks -----
const Alien = ({
  size = 96,
  color = palette.green,
  eye = palette.bg,
}: {
  size?: number;
  color?: string;
  eye?: string;
}) => {
  // 8x8 grid; 1 = body, 2 = eye
  const grid = [
    '..1111..',
    '.111111.',
    '11122111',
    '11122111',
    '11111111',
    '.1.11.1.',
    '1.1..1.1',
    '1.1..1.1',
  ];
  const cell = size / 8;
  return (
    <svg
      className="ar-pixel"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
    >
      {grid.flatMap((row, y) =>
        row.split('').map((c, x) => {
          if (c === '.') return null;
          return (
            <rect
              key={`${x}-${y}`}
              x={x * cell}
              y={y * cell}
              width={cell}
              height={cell}
              fill={c === '2' ? eye : color}
            />
          );
        }),
      )}
    </svg>
  );
};

// Pixel heart sprite
const Heart = ({ size = 64, color = palette.pink }: { size?: number; color?: string }) => {
  const grid = [
    '.11..11.',
    '11111111',
    '11111111',
    '11111111',
    '.111111.',
    '..1111..',
    '...11...',
    '........',
  ];
  const cell = size / 8;
  return (
    <svg
      className="ar-pixel"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
    >
      {grid.flatMap((row, y) =>
        row.split('').map((c, x) =>
          c === '1' ? (
            <rect
              key={`${x}-${y}`}
              x={x * cell}
              y={y * cell}
              width={cell}
              height={cell}
              fill={color}
            />
          ) : null,
        ),
      )}
    </svg>
  );
};

// Pixel coin
const Coin = ({ size = 56 }: { size?: number }) => {
  const grid = [
    '..1111..',
    '.122221.',
    '12233221',
    '12232221',
    '12232221',
    '12233221',
    '.122221.',
    '..1111..',
  ];
  const cell = size / 8;
  const colors: Record<string, string> = {
    '1': palette.orange,
    '2': palette.yellow,
    '3': '#FFFFFF',
  };
  return (
    <svg
      className="ar-pixel"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
    >
      {grid.flatMap((row, y) =>
        row.split('').map((c, x) =>
          c === '.' ? null : (
            <rect
              key={`${x}-${y}`}
              x={x * cell}
              y={y * cell}
              width={cell}
              height={cell}
              fill={colors[c]}
            />
          ),
        ),
      )}
    </svg>
  );
};

// Marquee strip
const Marquee = ({
  text,
  speed = 22,
  color = palette.yellow,
  reverse = false,
}: {
  text: string;
  speed?: number;
  color?: string;
  reverse?: boolean;
}) => {
  const repeated = Array.from({ length: 6 }, () => text).join('  ');
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        height: 80,
        background: '#15082E',
        borderTop: `4px solid ${palette.pink}`,
        borderBottom: `4px solid ${palette.pink}`,
      }}
    >
      <div
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          fontSize: 36,
          color,
          lineHeight: '80px',
          animation: `${reverse ? 'ar-marquee-rev' : 'ar-marquee'} ${speed}s linear infinite`,
          willChange: 'transform',
        }}
      >
        <span style={{ paddingRight: 0 }}>{repeated}  </span>
        <span>{repeated}  </span>
      </div>
    </div>
  );
};

// Score ticker hook
const useTicker = (start: number, step: number, intervalMs: number) => {
  const [value, setValue] = useState(start);
  useEffect(() => {
    const id = setInterval(() => setValue((v) => v + step), intervalMs);
    return () => clearInterval(id);
  }, [step, intervalMs]);
  return value;
};

const pad = (n: number, len: number) => n.toString().padStart(len, '0');

// ----- Page 1: Title -----
const TitlePage: Page = () => {
  return (
    <div className="ar-scanlines ar-vignette" style={fill}>
      <style>{keyframes}</style>
      <div className="ar-flash-layer" />

      {/* Starfield backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            `radial-gradient(2px 2px at 20% 30%, ${palette.cyan} 50%, transparent 51%),` +
            `radial-gradient(2px 2px at 70% 80%, ${palette.pink} 50%, transparent 51%),` +
            `radial-gradient(2px 2px at 40% 70%, ${palette.yellow} 50%, transparent 51%),` +
            `radial-gradient(2px 2px at 85% 20%, ${palette.green} 50%, transparent 51%),` +
            `radial-gradient(2px 2px at 10% 85%, ${palette.cyan} 50%, transparent 51%),` +
            `radial-gradient(2px 2px at 55% 15%, ${palette.pink} 50%, transparent 51%)`,
          opacity: 0.7,
          backgroundSize: '1920px 1080px',
        }}
      />

      {/* Top marquee */}
      <div style={{ position: 'absolute', top: 60, left: 0, right: 0 }}>
        <Marquee text="INSERT COIN  ▶  PRESS START  ▶  1UP READY  ▶  " color={palette.yellow} />
      </div>

      {/* Title block */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 160px',
          gap: 48,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 28,
            color: palette.cyan,
            letterSpacing: '0.4em',
          }}
        >
          ★ A 1986 PRODUCTION ★
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 200,
            lineHeight: 1,
            fontWeight: 900,
            color: palette.yellow,
            animation: 'ar-glow-pulse 1.6s ease-in-out infinite',
          }}
        >
          MOTION
        </h1>
        <h1
          style={{
            margin: 0,
            marginTop: -32,
            fontSize: 200,
            lineHeight: 1,
            fontWeight: 900,
            color: palette.pink,
            animation: 'ar-glow-pulse 1.6s ease-in-out infinite',
          }}
        >
          QUEST
        </h1>

        <div
          style={{
            fontSize: 44,
            color: palette.green,
            animation: 'ar-blink 1s steps(1) infinite',
            marginTop: 16,
          }}
        >
          ▶ PRESS START ◀
        </div>

        <div style={{ fontSize: 22, color: palette.cyan, opacity: 0.8, letterSpacing: '0.3em' }}>
          © OPEN-SLIDE  ARCADE DIVISION
        </div>
      </div>

      {/* Bouncing alien sprite track */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 200,
          width: '100%',
          height: 120,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            animation: 'ar-bounce-x 4s steps(8) infinite',
          }}
        >
          <div style={{ animation: 'ar-sprite-flip 2s steps(1) infinite' }}>
            <Alien size={96} color={palette.green} eye={palette.bg} />
          </div>
        </div>
      </div>

      {/* Bottom marquee */}
      <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0 }}>
        <Marquee text="◀ HI-SCORE 999900  ◀  PLAYER ONE  ◀  " color={palette.cyan} reverse />
      </div>

      {/* Corner sprites */}
      <div style={{ position: 'absolute', top: 180, left: 80 }}>
        <Heart size={56} color={palette.pink} />
      </div>
      <div style={{ position: 'absolute', top: 180, right: 80 }}>
        <Heart size={56} color={palette.pink} />
      </div>
    </div>
  );
};

// ----- Page 2: High Scores -----
const HighScoresPage: Page = () => {
  const score1 = useTicker(847_320, 137, 60);
  const score2 = useTicker(612_410, 91, 80);
  const score3 = useTicker(488_900, 53, 110);
  const score4 = useTicker(305_775, 29, 140);
  const score5 = useTicker(112_040, 17, 180);

  const rows = [
    { rank: 1, name: 'AAA', score: score1, color: palette.yellow },
    { rank: 2, name: 'CLD', score: score2, color: palette.pink },
    { rank: 3, name: 'NEO', score: score3, color: palette.cyan },
    { rank: 4, name: 'ZZ9', score: score4, color: palette.green },
    { rank: 5, name: 'YOU', score: score5, color: palette.orange },
  ];

  return (
    <div className="ar-scanlines ar-vignette" style={fill}>
      <style>{keyframes}</style>
      <div className="ar-flash-layer" />

      {/* Top marquee */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
        <Marquee
          text="◆ TOP PLAYERS  ◆  CONGRATULATIONS  ◆  ENTER YOUR INITIALS  ◆  "
          color={palette.pink}
          speed={26}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '180px 160px 160px',
          display: 'flex',
          flexDirection: 'column',
          gap: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Coin size={72} />
          <h2
            style={{
              margin: 0,
              fontSize: 96,
              fontWeight: 900,
              color: palette.yellow,
              textShadow: `4px 4px 0 ${palette.pink}, 8px 8px 0 ${palette.dim}`,
            }}
          >
            HI-SCORES
          </h2>
          <Coin size={72} />
        </div>

        <div
          style={{
            border: `4px solid ${palette.cyan}`,
            background: 'rgba(0,0,0,0.45)',
            padding: '40px 56px',
            boxShadow: `0 0 0 4px ${palette.bg}, 0 0 0 8px ${palette.pink}`,
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '180px 320px 1fr 220px',
              fontSize: 28,
              color: palette.cyan,
              letterSpacing: '0.3em',
              borderBottom: `2px dashed ${palette.dim}`,
              paddingBottom: 16,
              marginBottom: 8,
            }}
          >
            <div>RANK</div>
            <div>NAME</div>
            <div style={{ textAlign: 'right' }}>SCORE</div>
            <div style={{ textAlign: 'right' }}>STAGE</div>
          </div>

          {rows.map((r) => (
            <div
              key={r.rank}
              style={{
                display: 'grid',
                gridTemplateColumns: '180px 320px 1fr 220px',
                alignItems: 'center',
                fontSize: 56,
                fontWeight: 900,
                color: r.color,
                padding: '18px 0',
              }}
            >
              <div>{`#${r.rank}`}</div>
              <div style={{ letterSpacing: '0.2em' }}>{r.name}</div>
              <div
                style={{
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                  color: palette.yellow,
                }}
              >
                {pad(r.score, 8)}
              </div>
              <div
                style={{
                  textAlign: 'right',
                  fontSize: 32,
                  color: palette.green,
                }}
              >
                {`ST-${pad(r.rank * 3, 2)}`}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: palette.cyan,
            fontSize: 28,
          }}
        >
          <span style={{ animation: 'ar-blink 1s steps(1) infinite' }}>▶ ENTER NAME</span>
          <span style={{ color: palette.yellow }}>CREDITS 03</span>
        </div>
      </div>

      {/* Running sprite along the bottom */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 80,
          width: '100%',
          height: 80,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            animation: 'ar-bounce-x 5s steps(8) infinite',
          }}
        >
          <div style={{ animation: 'ar-runner 0.4s steps(2) infinite' }}>
            <Alien size={72} color={palette.pink} eye={palette.bg} />
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            left: -300,
            top: 8,
            animation: 'ar-bounce-x 5s steps(8) infinite',
            animationDelay: '-1.6s',
          }}
        >
          <Coin size={56} />
        </div>
      </div>
    </div>
  );
};

// ----- Page 3: Level Up -----
const LevelUpPage: Page = () => {
  const stage = useTicker(7, 1, 1200);

  // Synthwave grid as a fixed plane perspective-warped
  const gridStyle: React.CSSProperties = {
    position: 'absolute',
    left: '-50%',
    bottom: 0,
    width: '200%',
    height: '60%',
    transform: 'perspective(800px) rotateX(60deg)',
    transformOrigin: '50% 100%',
    backgroundImage:
      `linear-gradient(to right, ${palette.pink} 2px, transparent 2px),` +
      `linear-gradient(to bottom, ${palette.pink} 2px, transparent 2px)`,
    backgroundSize: '120px 80px, 120px 80px',
    animation: 'ar-grid-scroll 1.4s linear infinite',
    filter: `drop-shadow(0 0 14px ${palette.pink})`,
    opacity: 0.9,
  };

  return (
    <div className="ar-scanlines ar-vignette" style={fill}>
      <style>{keyframes}</style>
      <div className="ar-flash-layer" />

      {/* Synthwave horizon */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(to bottom, ${palette.bg} 0%, ${palette.bg} 35%, #2A0A4E 50%, ${palette.pink} 58%, ${palette.orange} 62%, ${palette.bg} 65%, ${palette.bg} 100%)`,
        }}
      />

      {/* Sun */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '38%',
          transform: 'translate(-50%, -50%)',
          width: 420,
          height: 420,
          borderRadius: '50%',
          background: `linear-gradient(to bottom, ${palette.yellow} 0%, ${palette.orange} 60%, ${palette.pink} 100%)`,
          boxShadow: `0 0 80px ${palette.pink}, 0 0 160px ${palette.pink}`,
          overflow: 'hidden',
        }}
      >
        {/* Sun stripes */}
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${55 + i * 9}%`,
              height: 14,
              background: palette.bg,
            }}
          />
        ))}
      </div>

      {/* Grid floor */}
      <div style={gridStyle} />

      {/* Floor base masking line */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '60%',
          height: 6,
          background: palette.cyan,
          boxShadow: `0 0 22px ${palette.cyan}`,
        }}
      />

      {/* LEVEL UP headline */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: 140,
          gap: 36,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 32,
            color: palette.cyan,
            letterSpacing: '0.5em',
          }}
        >
          ★ STAGE CLEARED ★
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 220,
            fontWeight: 900,
            lineHeight: 1,
            color: palette.yellow,
            animation: 'ar-glow-pulse 1.4s ease-in-out infinite, ar-shake 0.18s steps(2) infinite',
          }}
        >
          LEVEL UP
        </h1>

        <div
          style={{
            fontSize: 56,
            color: palette.pink,
            display: 'flex',
            gap: 32,
            alignItems: 'center',
          }}
        >
          <span style={{ color: palette.cyan }}>STAGE</span>
          <span
            style={{
              fontVariantNumeric: 'tabular-nums',
              color: palette.yellow,
              minWidth: 120,
              display: 'inline-block',
              textShadow: `4px 4px 0 ${palette.pink}`,
            }}
          >
            {pad(stage, 2)}
          </span>
          <span style={{ color: palette.cyan }}>UNLOCKED</span>
        </div>

        {/* Power-up row */}
        <div
          style={{
            marginTop: 24,
            display: 'flex',
            gap: 60,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Heart size={72} />
            <span style={{ fontSize: 24, color: palette.pink }}>+1 LIFE</span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Coin size={72} />
            <span style={{ fontSize: 24, color: palette.yellow }}>x3 COINS</span>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ animation: 'ar-runner 0.4s steps(2) infinite' }}>
              <Alien size={72} color={palette.green} eye={palette.bg} />
            </div>
            <span style={{ fontSize: 24, color: palette.green }}>SPEED+</span>
          </div>
        </div>
      </div>

      {/* CTA marquee on the floor */}
      <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0 }}>
        <Marquee
          text="▶ CONTINUE? 9  8  7  ▶  PRESS ANY KEY  ▶  "
          color={palette.yellow}
          speed={20}
        />
      </div>
    </div>
  );
};

export const meta: SlideMeta = { title: 'Motion Arcade' };
export default [TitlePage, HighScoresPage, LevelUpPage] satisfies Page[];
