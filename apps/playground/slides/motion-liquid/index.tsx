import type { Page, SlideMeta } from '@open-slide/core';

// ─────────────────────────────────────────────────────────────────────────────
// Palette — soft sunset gradient
// ─────────────────────────────────────────────────────────────────────────────
const palette = {
  peach: '#FFB199',
  pink: '#FF6B9E',
  violet: '#7C5CFF',
  indigo: '#2A1D5C',
  ivory: '#FFF7EE',
  plum: '#1A0F2E',
};

const fontStack =
  '"Inter", "SF Pro Display", -apple-system, system-ui, sans-serif';

// ─────────────────────────────────────────────────────────────────────────────
// Morphing blob paths — 4 organic shapes per blob, all built from a fixed
// 6-anchor cubic-bezier loop so the point counts match for SVG <animate>.
// Each path: M x,y C c1x,c1y c2x,c2y x,y  (×6) Z
// ─────────────────────────────────────────────────────────────────────────────

// Blob A — large amorphous lobe, ~520×520 viewbox centred on (260,260)
const blobA = [
  'M260,60 C380,80 470,160 480,260 C490,380 410,470 290,490 C170,500 80,420 60,300 C50,190 130,90 220,60 C240,55 250,58 260,60 Z',
  'M270,50 C400,90 460,180 470,300 C480,400 380,480 260,490 C160,500 70,400 50,290 C40,180 150,80 240,55 C250,52 260,50 270,50 Z',
  'M250,70 C370,60 490,170 470,290 C460,410 360,490 240,475 C140,470 70,390 60,280 C70,170 150,80 230,65 C240,68 245,69 250,70 Z',
  'M280,55 C390,90 480,170 470,290 C480,400 390,490 270,485 C160,490 60,410 65,295 C60,180 140,75 235,60 C255,57 270,53 280,55 Z',
];

// Blob B — flatter elongated drift
const blobB = [
  'M310,80 C440,90 510,200 500,290 C490,390 380,470 260,460 C150,470 60,400 70,290 C80,180 180,90 280,75 C290,76 300,78 310,80 Z',
  'M300,70 C430,100 520,190 500,300 C480,400 370,480 250,470 C140,460 50,380 80,270 C90,170 190,80 270,70 C285,68 295,69 300,70 Z',
  'M320,90 C420,100 500,210 510,300 C500,400 390,460 270,470 C150,480 70,390 65,280 C70,180 180,100 290,80 C305,82 315,87 320,90 Z',
  'M295,75 C435,85 530,200 495,300 C495,395 365,475 245,455 C150,470 50,390 75,275 C100,170 200,85 280,72 C285,72 290,73 295,75 Z',
];

// Blob C — wide soft disc, used for the closing giant blob
const blobC = [
  'M400,120 C580,150 690,290 680,420 C670,560 530,670 380,665 C230,670 100,560 90,420 C100,280 220,160 360,125 C375,122 390,121 400,120 Z',
  'M380,110 C570,130 690,260 695,400 C700,550 540,680 380,670 C220,680 90,550 95,400 C90,260 210,140 350,115 C365,112 375,111 380,110 Z',
  'M420,130 C600,170 700,300 670,440 C660,580 510,670 370,660 C230,665 110,560 100,410 C110,270 230,170 365,135 C390,130 410,128 420,130 Z',
  'M390,115 C595,160 705,275 685,420 C690,570 525,675 380,665 C220,670 80,540 105,395 C95,255 230,150 360,120 C370,118 380,116 390,115 Z',
];

// ─────────────────────────────────────────────────────────────────────────────
// Shared style block — every selector prefixed `lq-`
// ─────────────────────────────────────────────────────────────────────────────
const styles = `
  @keyframes lq-gradient-drift {
    0%   { background-position:   0% 30%, 100% 70%, 50% 100%, 50% 0%; }
    50%  { background-position: 100% 70%,   0% 30%, 30%  20%, 70% 80%; }
    100% { background-position:   0% 30%, 100% 70%, 50% 100%, 50% 0%; }
  }

  @keyframes lq-float-1 {
    0%   { transform: translate(0, 0) rotate(0deg); }
    25%  { transform: translate(80px, -60px) rotate(8deg); }
    50%  { transform: translate(-40px, -120px) rotate(-6deg); }
    75%  { transform: translate(-90px, 40px) rotate(4deg); }
    100% { transform: translate(0, 0) rotate(0deg); }
  }

  @keyframes lq-float-2 {
    0%   { transform: translate(0, 0) rotate(0deg); }
    25%  { transform: translate(-110px, 70px) rotate(-10deg); }
    50%  { transform: translate(60px, 140px) rotate(6deg); }
    75%  { transform: translate(120px, -50px) rotate(-3deg); }
    100% { transform: translate(0, 0) rotate(0deg); }
  }

  @keyframes lq-ambient-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  @keyframes lq-fade-up {
    from { opacity: 0; transform: translateY(40px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes lq-letter-wave {
    0%, 100% { transform: scale(1) translateY(0); }
    50%      { transform: scale(1.08) translateY(-8px); }
  }

  @keyframes lq-caption-fade {
    from { opacity: 0; letter-spacing: 0.4em; }
    to   { opacity: 0.85; letter-spacing: 0.32em; }
  }

  .lq-root {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    color: ${palette.ivory};
    font-family: ${fontStack};
    background: ${palette.indigo};
  }

  .lq-bg-gradient {
    position: absolute;
    inset: -10%;
    background:
      radial-gradient(60% 50% at 20% 30%, ${palette.peach}cc 0%, transparent 60%),
      radial-gradient(55% 45% at 80% 70%, ${palette.pink}cc 0%, transparent 65%),
      radial-gradient(70% 60% at 50% 100%, ${palette.violet}dd 0%, transparent 70%),
      radial-gradient(60% 50% at 50% 0%,   ${palette.indigo} 0%, transparent 80%);
    background-size: 200% 200%, 200% 200%, 200% 200%, 200% 200%;
    background-repeat: no-repeat;
    animation: lq-gradient-drift 22s ease-in-out infinite;
    filter: saturate(1.05);
  }

  .lq-vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(80% 70% at 50% 50%, transparent 55%, ${palette.plum}99 100%);
    pointer-events: none;
  }

  .lq-blob {
    position: absolute;
    filter: blur(60px);
    mix-blend-mode: screen;
    pointer-events: none;
    will-change: transform;
  }

  .lq-blob-spin {
    position: absolute;
    filter: blur(80px);
    mix-blend-mode: screen;
    pointer-events: none;
    transform-origin: center;
    animation: lq-ambient-spin 60s linear infinite;
  }

  .lq-fade-up {
    animation: lq-fade-up 1200ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .lq-fluid-letter {
    display: inline-block;
    animation: lq-letter-wave 4.2s ease-in-out infinite;
    will-change: transform;
  }

  .lq-quote-letter {
    display: inline-block;
    animation: lq-letter-wave 3.6s ease-in-out infinite;
  }

  .lq-content {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
  }
`;

// Helper: split text into per-letter spans with staggered delay
function FluidText({
  children,
  className,
  baseDelay = 0,
  step = 80,
}: {
  children: string;
  className: string;
  baseDelay?: number;
  step?: number;
}) {
  return (
    <>
      {children.split('').map((ch, i) => (
        <span
          key={i}
          className={className}
          style={{ animationDelay: `${baseDelay + i * step}ms` }}
        >
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 1 — Cover
// ─────────────────────────────────────────────────────────────────────────────
const Cover: Page = () => (
  <div className="lq-root">
    <style>{styles}</style>
    <div className="lq-bg-gradient" />

    {/* Background blob, slow ambient rotation */}
    <div
      className="lq-blob-spin"
      style={{ left: -260, top: -200, width: 1100, height: 1100 }}
    >
      <svg viewBox="0 0 520 520" width="100%" height="100%">
        <path fill={palette.pink} opacity="0.55">
          <animate
            attributeName="d"
            dur="14s"
            repeatCount="indefinite"
            values={`${blobA[0]};${blobA[1]};${blobA[2]};${blobA[3]};${blobA[0]}`}
          />
        </path>
      </svg>
    </div>

    {/* Floating morphing blob — peach */}
    <div
      className="lq-blob"
      style={{
        right: -180,
        bottom: -160,
        width: 900,
        height: 900,
        animation: 'lq-float-1 18s ease-in-out infinite',
      }}
    >
      <svg viewBox="0 0 580 580" width="100%" height="100%">
        <path fill={palette.peach} opacity="0.7">
          <animate
            attributeName="d"
            dur="11s"
            repeatCount="indefinite"
            values={`${blobB[0]};${blobB[1]};${blobB[2]};${blobB[3]};${blobB[0]}`}
          />
        </path>
      </svg>
    </div>

    {/* Floating morphing blob — violet */}
    <div
      className="lq-blob"
      style={{
        left: 600,
        top: 80,
        width: 700,
        height: 700,
        animation: 'lq-float-2 24s ease-in-out infinite',
      }}
    >
      <svg viewBox="0 0 520 520" width="100%" height="100%">
        <path fill={palette.violet} opacity="0.55">
          <animate
            attributeName="d"
            dur="13s"
            repeatCount="indefinite"
            values={`${blobA[1]};${blobA[2]};${blobA[3]};${blobA[0]};${blobA[1]}`}
          />
        </path>
      </svg>
    </div>

    <div className="lq-vignette" />

    <div
      className="lq-content"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 140px',
      }}
    >
      <div
        className="lq-fade-up"
        style={{
          fontSize: 26,
          letterSpacing: '0.42em',
          textTransform: 'uppercase',
          color: palette.ivory,
          opacity: 0.78,
          animationDelay: '120ms',
        }}
      >
        A study in motion
      </div>

      <h1
        style={{
          fontSize: 192,
          fontWeight: 800,
          margin: '36px 0 28px',
          lineHeight: 1.02,
          letterSpacing: '-0.03em',
          color: palette.ivory,
          textShadow: `0 8px 60px ${palette.plum}aa`,
        }}
      >
        <FluidText className="lq-fluid-letter">Move like</FluidText>
        <br />
        <span style={{ fontStyle: 'italic', fontWeight: 300 }}>
          <FluidText className="lq-fluid-letter" baseDelay={400}>
            water.
          </FluidText>
        </span>
      </h1>

      <p
        className="lq-fade-up"
        style={{
          fontSize: 38,
          fontWeight: 400,
          maxWidth: 1100,
          lineHeight: 1.5,
          color: palette.ivory,
          opacity: 0.86,
          margin: 0,
          animationDelay: '600ms',
        }}
      >
        Soft surfaces, organic motion, and a palette that breathes —
        an exploration of how interfaces can feel alive.
      </p>

      <div
        className="lq-fade-up"
        style={{
          marginTop: 96,
          fontSize: 22,
          letterSpacing: '0.34em',
          textTransform: 'uppercase',
          color: palette.ivory,
          opacity: 0.62,
          animationDelay: '900ms',
        }}
      >
        01 — Opening
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 2 — Pull quote with wave-scaling letters
// ─────────────────────────────────────────────────────────────────────────────
const Quote: Page = () => (
  <div className="lq-root">
    <style>{styles}</style>
    <div className="lq-bg-gradient" />

    {/* Ambient rotating violet blob behind */}
    <div
      className="lq-blob-spin"
      style={{ right: -300, top: -200, width: 1200, height: 1200 }}
    >
      <svg viewBox="0 0 580 580" width="100%" height="100%">
        <path fill={palette.violet} opacity="0.6">
          <animate
            attributeName="d"
            dur="16s"
            repeatCount="indefinite"
            values={`${blobB[2]};${blobB[3]};${blobB[0]};${blobB[1]};${blobB[2]}`}
          />
        </path>
      </svg>
    </div>

    {/* Floating peach blob bottom-left */}
    <div
      className="lq-blob"
      style={{
        left: -200,
        bottom: -240,
        width: 880,
        height: 880,
        animation: 'lq-float-2 22s ease-in-out infinite',
      }}
    >
      <svg viewBox="0 0 520 520" width="100%" height="100%">
        <path fill={palette.peach} opacity="0.7">
          <animate
            attributeName="d"
            dur="12s"
            repeatCount="indefinite"
            values={`${blobA[3]};${blobA[0]};${blobA[1]};${blobA[2]};${blobA[3]}`}
          />
        </path>
      </svg>
    </div>

    <div className="lq-vignette" />

    <div
      className="lq-content"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 160px',
      }}
    >
      <div
        className="lq-fade-up"
        style={{
          fontSize: 26,
          letterSpacing: '0.42em',
          textTransform: 'uppercase',
          color: palette.ivory,
          opacity: 0.7,
          marginBottom: 56,
          animationDelay: '100ms',
        }}
      >
        On rhythm
      </div>

      <blockquote
        style={{
          margin: 0,
          fontSize: 116,
          fontWeight: 700,
          lineHeight: 1.12,
          letterSpacing: '-0.02em',
          color: palette.ivory,
          maxWidth: 1500,
          textShadow: `0 4px 40px ${palette.plum}88`,
        }}
      >
        <span style={{ fontSize: 220, lineHeight: 0.4, opacity: 0.4 }}>“</span>
        <br />
        <span>
          <FluidText className="lq-quote-letter">Pixels don't</FluidText>
          <br />
          <FluidText className="lq-quote-letter" baseDelay={300}>
            need to be still
          </FluidText>
          <br />
          <span style={{ fontStyle: 'italic', fontWeight: 400 }}>
            <FluidText className="lq-quote-letter" baseDelay={700}>
              to feel calm.
            </FluidText>
          </span>
        </span>
      </blockquote>

      <div
        className="lq-fade-up"
        style={{
          marginTop: 80,
          fontSize: 30,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: palette.ivory,
          opacity: 0.7,
          animationDelay: '900ms',
        }}
      >
        — A note on motion design
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 3 — Closing, giant centered morphing blob
// ─────────────────────────────────────────────────────────────────────────────
const Closing: Page = () => (
  <div className="lq-root">
    <style>{styles}</style>
    <div className="lq-bg-gradient" />

    {/* Faint background glow blob */}
    <div
      className="lq-blob-spin"
      style={{ left: -200, top: -200, width: 1400, height: 1400 }}
    >
      <svg viewBox="0 0 580 580" width="100%" height="100%">
        <path fill={palette.violet} opacity="0.35">
          <animate
            attributeName="d"
            dur="20s"
            repeatCount="indefinite"
            values={`${blobB[0]};${blobB[2]};${blobB[1]};${blobB[3]};${blobB[0]}`}
          />
        </path>
      </svg>
    </div>

    {/* Giant centered morphing blob — the hero */}
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: 1300,
        height: 1300,
        transform: 'translate(-50%, -50%)',
        filter: 'blur(40px)',
        mixBlendMode: 'screen',
        animation: 'lq-float-1 26s ease-in-out infinite',
      }}
    >
      <svg viewBox="0 0 800 800" width="100%" height="100%">
        <defs>
          <radialGradient id="lq-grad-center" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor={palette.peach} stopOpacity="0.95" />
            <stop offset="55%" stopColor={palette.pink} stopOpacity="0.85" />
            <stop offset="100%" stopColor={palette.violet} stopOpacity="0.55" />
          </radialGradient>
        </defs>
        <path fill="url(#lq-grad-center)">
          <animate
            attributeName="d"
            dur="9s"
            repeatCount="indefinite"
            values={`${blobC[0]};${blobC[1]};${blobC[2]};${blobC[3]};${blobC[0]}`}
          />
        </path>
      </svg>
    </div>

    <div className="lq-vignette" />

    <div
      className="lq-content"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 160px',
        textAlign: 'center',
      }}
    >
      <div
        className="lq-fade-up"
        style={{
          fontSize: 24,
          letterSpacing: '0.5em',
          textTransform: 'uppercase',
          color: palette.ivory,
          opacity: 0.75,
          animation: 'lq-caption-fade 1800ms cubic-bezier(0.16, 1, 0.3, 1) both',
          animationDelay: '200ms',
        }}
      >
        Fin.
      </div>

      <h2
        className="lq-fade-up"
        style={{
          fontSize: 136,
          fontWeight: 300,
          fontStyle: 'italic',
          margin: '40px 0 32px',
          letterSpacing: '-0.02em',
          color: palette.ivory,
          lineHeight: 1.05,
          textShadow: `0 8px 50px ${palette.plum}99`,
          animationDelay: '500ms',
        }}
      >
        stay&nbsp;fluid.
      </h2>

      <p
        className="lq-fade-up"
        style={{
          fontSize: 30,
          fontWeight: 400,
          maxWidth: 900,
          lineHeight: 1.55,
          color: palette.ivory,
          opacity: 0.78,
          margin: 0,
          animationDelay: '900ms',
        }}
      >
        Thanks for watching the surface ripple for a while.
      </p>

      <div
        className="lq-fade-up"
        style={{
          marginTop: 96,
          fontSize: 22,
          letterSpacing: '0.36em',
          textTransform: 'uppercase',
          color: palette.ivory,
          opacity: 0.55,
          animationDelay: '1200ms',
        }}
      >
        03 — End
      </div>
    </div>
  </div>
);

export const meta: SlideMeta = { title: 'Move like water' };
export default [Cover, Quote, Closing] satisfies Page[];
