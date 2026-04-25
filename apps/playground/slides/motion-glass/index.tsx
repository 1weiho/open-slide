import type { ReactElement } from 'react';
import type { Page, SlideMeta } from '@open-slide/core';

const palette = {
  bg: '#0E1B3A',
  text: '#FAFAFF',
  muted: 'rgba(250, 250, 255, 0.72)',
  cyan: '#4DD8FF',
  magenta: '#FF66B2',
  lime: '#B5FF66',
};

const fontStack = '"Inter", "SF Pro Display", system-ui, sans-serif';

const fill = {
  position: 'relative' as const,
  width: '100%',
  height: '100%',
  overflow: 'hidden' as const,
  background: palette.bg,
  color: palette.text,
  fontFamily: fontStack,
};

const styles = `
  @keyframes gl-orb-a {
    0%   { transform: translate(-10%, -10%) scale(1); }
    50%  { transform: translate(8%, 14%) scale(1.12); }
    100% { transform: translate(-10%, -10%) scale(1); }
  }
  @keyframes gl-orb-b {
    0%   { transform: translate(20%, 30%) scale(1.05); }
    50%  { transform: translate(-12%, 6%) scale(0.95); }
    100% { transform: translate(20%, 30%) scale(1.05); }
  }
  @keyframes gl-orb-c {
    0%   { transform: translate(60%, -10%) scale(1); }
    50%  { transform: translate(40%, 24%) scale(1.18); }
    100% { transform: translate(60%, -10%) scale(1); }
  }
  @keyframes gl-orb-d {
    0%   { transform: translate(40%, 60%) scale(1.05); filter: blur(80px) hue-rotate(0deg); }
    50%  { transform: translate(60%, 40%) scale(1.2);  filter: blur(80px) hue-rotate(60deg); }
    100% { transform: translate(40%, 60%) scale(1.05); filter: blur(80px) hue-rotate(0deg); }
  }
  @keyframes gl-orb-hue {
    0%   { filter: blur(90px) hue-rotate(0deg) saturate(1.1); }
    50%  { filter: blur(90px) hue-rotate(80deg) saturate(1.4); }
    100% { filter: blur(90px) hue-rotate(0deg) saturate(1.1); }
  }
  @keyframes gl-float-a {
    0%   { transform: translateY(0) rotate(-1.2deg); }
    50%  { transform: translateY(-18px) rotate(0.4deg); }
    100% { transform: translateY(0) rotate(-1.2deg); }
  }
  @keyframes gl-float-b {
    0%   { transform: translateY(-6px) rotate(0.8deg); }
    50%  { transform: translateY(14px) rotate(-0.6deg); }
    100% { transform: translateY(-6px) rotate(0.8deg); }
  }
  @keyframes gl-float-c {
    0%   { transform: translateY(8px) rotate(0.4deg); }
    50%  { transform: translateY(-12px) rotate(-0.8deg); }
    100% { transform: translateY(8px) rotate(0.4deg); }
  }
  @keyframes gl-float-d {
    0%   { transform: translateY(-4px) rotate(-0.5deg); }
    50%  { transform: translateY(10px) rotate(0.6deg); }
    100% { transform: translateY(-4px) rotate(-0.5deg); }
  }
  @keyframes gl-card-in {
    0%   { opacity: 0; transform: scale(0.92) translateY(24px); filter: blur(8px); }
    100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
  }
  @keyframes gl-sheen {
    0%   { transform: translateX(-130%) skewX(-18deg); opacity: 0; }
    18%  { opacity: 0.9; }
    50%  { transform: translateX(130%) skewX(-18deg); opacity: 0; }
    100% { transform: translateX(130%) skewX(-18deg); opacity: 0; }
  }
  @keyframes gl-letter-up {
    0%   { opacity: 0; transform: translateY(48px); filter: blur(10px); }
    100% { opacity: 1; transform: translateY(0); filter: blur(0); }
  }
  @keyframes gl-fade-up {
    0%   { opacity: 0; transform: translateY(28px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes gl-pulse {
    0%   { opacity: 0.55; transform: scale(1); }
    50%  { opacity: 0.95; transform: scale(1.04); }
    100% { opacity: 0.55; transform: scale(1); }
  }

  .gl-card {
    position: absolute;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 28px;
    box-shadow:
      0 30px 80px rgba(0, 0, 0, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
    overflow: hidden;
    animation: gl-card-in 1.1s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  }
  .gl-card::after {
    content: '';
    position: absolute;
    top: -20%;
    left: 0;
    width: 60%;
    height: 140%;
    background: linear-gradient(
      120deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.18) 45%,
      rgba(255, 255, 255, 0.55) 50%,
      rgba(255, 255, 255, 0.18) 55%,
      rgba(255, 255, 255, 0) 100%
    );
    transform: translateX(-130%) skewX(-18deg);
    animation: gl-sheen 4.4s ease-in-out infinite;
    pointer-events: none;
    mix-blend-mode: screen;
  }
  .gl-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
    will-change: transform, filter;
  }
`;

const Backdrop = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      background:
        'radial-gradient(ellipse at 50% 120%, #1A2C5C 0%, #0E1B3A 60%, #070E22 100%)',
    }}
  >
    <div
      className="gl-orb"
      style={{
        width: 1100,
        height: 1100,
        left: -200,
        top: -200,
        background: `radial-gradient(circle, ${palette.cyan} 0%, rgba(77,216,255,0) 70%)`,
        animation: 'gl-orb-a 22s ease-in-out infinite',
      }}
    />
    <div
      className="gl-orb"
      style={{
        width: 900,
        height: 900,
        left: 600,
        top: 200,
        background: `radial-gradient(circle, ${palette.magenta} 0%, rgba(255,102,178,0) 70%)`,
        animation: 'gl-orb-b 26s ease-in-out infinite',
      }}
    />
    <div
      className="gl-orb"
      style={{
        width: 800,
        height: 800,
        left: 1200,
        top: -100,
        background: `radial-gradient(circle, ${palette.lime} 0%, rgba(181,255,102,0) 70%)`,
        animation: 'gl-orb-c 30s ease-in-out infinite',
      }}
    />
    <div
      className="gl-orb"
      style={{
        width: 700,
        height: 700,
        left: 900,
        top: 600,
        background: `radial-gradient(circle, ${palette.cyan} 0%, rgba(77,216,255,0) 70%)`,
        animation: 'gl-orb-d 24s ease-in-out infinite',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(7,14,34,0.5) 100%)',
        pointerEvents: 'none',
      }}
    />
  </div>
);

const HeroLetters = ({ text, delay = 0 }: { text: string; delay?: number }) => (
  <span style={{ display: 'inline-block', whiteSpace: 'pre' }}>
    {text.split('').map((ch, i) => (
      <span
        key={i}
        style={{
          display: 'inline-block',
          opacity: 0,
          animation: `gl-letter-up 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) ${
            delay + i * 0.04
          }s forwards`,
          whiteSpace: 'pre',
        }}
      >
        {ch === ' ' ? ' ' : ch}
      </span>
    ))}
  </span>
);

const Cover: Page = () => (
  <div style={fill}>
    <style>{styles}</style>
    <Backdrop />

    {/* Floating accent card – top left */}
    <div
      style={{
        position: 'absolute',
        left: 120,
        top: 120,
        animation: 'gl-float-a 6.4s ease-in-out infinite',
      }}
    >
      <div
        className="gl-card"
        style={{
          position: 'relative',
          width: 360,
          height: 220,
          padding: '32px 36px',
          animationDelay: '0.05s',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: '0.32em',
            color: palette.muted,
            textTransform: 'uppercase',
          }}
        >
          Vol. 04
        </div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.2 }}>
            Depth, blur,
            <br />
            and light.
          </div>
          <div style={{ fontSize: 22, color: palette.muted, marginTop: 12 }}>
            A study in glass.
          </div>
        </div>
      </div>
    </div>

    {/* Hero card – center */}
    <div
      style={{
        position: 'absolute',
        left: 260,
        top: 260,
        animation: 'gl-float-b 7.2s ease-in-out infinite',
      }}
    >
      <div
        className="gl-card"
        style={{
          position: 'relative',
          width: 1400,
          height: 600,
          padding: '96px 120px',
          animationDelay: '0.25s',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: '0.4em',
            color: palette.cyan,
            textTransform: 'uppercase',
            opacity: 0,
            animation: 'gl-fade-up 0.9s ease-out 0.6s forwards',
          }}
        >
          Motion · Glass
        </div>
        <h1
          style={{
            fontSize: 168,
            fontWeight: 800,
            lineHeight: 1.0,
            margin: '28px 0 0 0',
            letterSpacing: '-0.03em',
          }}
        >
          <HeroLetters text="Through" delay={0.5} />
          <br />
          <HeroLetters text="the glass." delay={0.95} />
        </h1>
        <div
          style={{
            fontSize: 32,
            color: palette.muted,
            marginTop: 36,
            maxWidth: 900,
            lineHeight: 1.5,
            opacity: 0,
            animation: 'gl-fade-up 0.9s ease-out 1.6s forwards',
          }}
        >
          A traveling exhibit on translucency, ambient light, and what
          happens when interfaces stop being flat.
        </div>
      </div>
    </div>

    {/* Floating accent card – bottom right */}
    <div
      style={{
        position: 'absolute',
        right: 140,
        bottom: 110,
        animation: 'gl-float-c 8s ease-in-out infinite',
      }}
    >
      <div
        className="gl-card"
        style={{
          position: 'relative',
          width: 420,
          height: 180,
          padding: '32px 40px',
          animationDelay: '0.45s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 28,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 22,
              letterSpacing: '0.28em',
              color: palette.muted,
              textTransform: 'uppercase',
            }}
          >
            Opens
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, marginTop: 8 }}>
            04 · 25
          </div>
        </div>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            background: `linear-gradient(135deg, ${palette.cyan}, ${palette.magenta})`,
            boxShadow: `0 0 40px ${palette.cyan}88`,
            animation: 'gl-pulse 3.6s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  </div>
);

type FeatureIconProps = { color: string };

const IconPrism = ({ color }: FeatureIconProps) => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
    <path
      d="M28 6 L50 46 L6 46 Z"
      stroke={color}
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <path d="M28 6 L28 46" stroke={color} strokeWidth="1.5" opacity="0.7" />
    <path d="M16 28 L40 28" stroke={color} strokeWidth="1.5" opacity="0.5" />
  </svg>
);
const IconWave = ({ color }: FeatureIconProps) => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
    <path
      d="M4 36 C 12 20, 20 52, 28 36 S 44 20, 52 36"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M4 22 C 12 6, 20 38, 28 22 S 44 6, 52 22"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.6"
      fill="none"
    />
  </svg>
);
const IconOrb = ({ color }: FeatureIconProps) => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
    <circle cx="28" cy="28" r="20" stroke={color} strokeWidth="2.5" />
    <circle cx="22" cy="22" r="6" fill={color} opacity="0.55" />
    <circle cx="36" cy="34" r="3" fill={color} opacity="0.85" />
  </svg>
);
const IconSpark = ({ color }: FeatureIconProps) => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
    <path
      d="M28 6 L32 24 L50 28 L32 32 L28 50 L24 32 L6 28 L24 24 Z"
      stroke={color}
      strokeWidth="2.2"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

type Feature = {
  icon: (p: FeatureIconProps) => ReactElement;
  color: string;
  eyebrow: string;
  title: string;
  body: string;
};

const features: Feature[] = [
  {
    icon: IconPrism,
    color: palette.cyan,
    eyebrow: '01 · Refraction',
    title: 'Light bends.',
    body: 'Every surface carries a hue from somewhere else in the room.',
  },
  {
    icon: IconWave,
    color: palette.magenta,
    eyebrow: '02 · Motion',
    title: 'Drift, never settle.',
    body: 'Backgrounds breathe on long, asymmetric loops you never quite catch.',
  },
  {
    icon: IconOrb,
    color: palette.lime,
    eyebrow: '03 · Depth',
    title: 'Stack the planes.',
    body: 'Foreground glass, midground orbs, far ambient — read the layers.',
  },
  {
    icon: IconSpark,
    color: '#FFE066',
    eyebrow: '04 · Sheen',
    title: 'Catch the highlight.',
    body: 'A passing streak of white reveals the edge of every pane.',
  },
];

const Features: Page = () => (
  <div style={fill}>
    <style>{styles}</style>
    <Backdrop />

    <div
      style={{
        position: 'absolute',
        left: 120,
        top: 100,
        right: 120,
        opacity: 0,
        animation: 'gl-fade-up 0.9s ease-out 0.2s forwards',
      }}
    >
      <div
        style={{
          fontSize: 26,
          letterSpacing: '0.4em',
          color: palette.cyan,
          textTransform: 'uppercase',
        }}
      >
        Four properties of glass
      </div>
      <h2
        style={{
          fontSize: 104,
          fontWeight: 800,
          margin: '20px 0 0 0',
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
        }}
      >
        What we&rsquo;re looking at.
      </h2>
    </div>

    <div
      style={{
        position: 'absolute',
        left: 120,
        top: 380,
        right: 120,
        bottom: 100,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: 32,
      }}
    >
      {features.map((f, i) => {
        const Icon = f.icon;
        const floats = [
          'gl-float-a 6.6s',
          'gl-float-b 7.4s',
          'gl-float-c 8.2s',
          'gl-float-d 7s',
        ];
        return (
          <div
            key={i}
            style={{
              position: 'relative',
              animation: `${floats[i]} ease-in-out infinite`,
            }}
          >
            <div
              className="gl-card"
              style={{
                position: 'absolute',
                inset: 0,
                padding: '48px 56px',
                animationDelay: `${0.25 + i * 0.15}s`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 24,
                }}
              >
                <div
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: 22,
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `inset 0 0 30px ${f.color}33`,
                  }}
                >
                  <Icon color={f.color} />
                </div>
                <div
                  style={{
                    fontSize: 22,
                    letterSpacing: '0.28em',
                    color: palette.muted,
                    textTransform: 'uppercase',
                  }}
                >
                  {f.eyebrow}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 56,
                    fontWeight: 700,
                    lineHeight: 1.1,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {f.title}
                </div>
                <div
                  style={{
                    fontSize: 28,
                    color: palette.muted,
                    marginTop: 16,
                    lineHeight: 1.5,
                    maxWidth: 620,
                  }}
                >
                  {f.body}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const Closing: Page = () => (
  <div style={fill}>
    <style>{styles}</style>
    <Backdrop />

    {/* Extra hue-shifting orb on top of the backdrop for the closing */}
    <div
      className="gl-orb"
      style={{
        position: 'absolute',
        width: 1300,
        height: 1300,
        left: 320,
        top: -200,
        background: `radial-gradient(circle, ${palette.magenta} 0%, rgba(255,102,178,0) 70%)`,
        animation: 'gl-orb-hue 14s ease-in-out infinite',
        opacity: 0.7,
      }}
    />

    <div
      style={{
        position: 'absolute',
        left: 200,
        top: 120,
        right: 200,
        bottom: 120,
        animation: 'gl-float-b 8.4s ease-in-out infinite',
      }}
    >
      <div
        className="gl-card"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          padding: '120px 140px',
          animationDelay: '0.2s',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              fontSize: 26,
              letterSpacing: '0.42em',
              color: palette.cyan,
              textTransform: 'uppercase',
              opacity: 0,
              animation: 'gl-fade-up 0.9s ease-out 0.4s forwards',
            }}
          >
            Closing
          </div>
          <div
            style={{
              fontSize: 22,
              letterSpacing: '0.32em',
              color: palette.muted,
              textTransform: 'uppercase',
              opacity: 0,
              animation: 'gl-fade-up 0.9s ease-out 0.5s forwards',
            }}
          >
            Motion · Glass · 2026
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 64 }}>
          <div
            style={{
              fontSize: 420,
              fontWeight: 800,
              lineHeight: 0.85,
              letterSpacing: '-0.06em',
              background: `linear-gradient(135deg, ${palette.cyan} 0%, ${palette.magenta} 60%, ${palette.lime} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              opacity: 0,
              animation: 'gl-fade-up 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) 0.6s forwards',
            }}
          >
            04
          </div>
          <div style={{ paddingBottom: 32, maxWidth: 760 }}>
            <div
              style={{
                fontSize: 44,
                fontWeight: 600,
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
                opacity: 0,
                animation: 'gl-fade-up 0.9s ease-out 0.95s forwards',
              }}
            >
              &ldquo;The interface should feel like weather&mdash;ambient,
              shifting, never quite the same twice.&rdquo;
            </div>
            <div
              style={{
                fontSize: 26,
                color: palette.muted,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                marginTop: 32,
                opacity: 0,
                animation: 'gl-fade-up 0.9s ease-out 1.25s forwards',
              }}
            >
              &mdash; Studio note, Vol. 04
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            opacity: 0,
            animation: 'gl-fade-up 0.9s ease-out 1.5s forwards',
          }}
        >
          <div
            style={{
              fontSize: 28,
              color: palette.muted,
            }}
          >
            Thanks for looking.
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: palette.cyan,
                boxShadow: `0 0 24px ${palette.cyan}`,
                animation: 'gl-pulse 2.4s ease-in-out infinite',
              }}
            />
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: palette.magenta,
                boxShadow: `0 0 24px ${palette.magenta}`,
                animation: 'gl-pulse 2.4s ease-in-out 0.4s infinite',
              }}
            />
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: palette.lime,
                boxShadow: `0 0 24px ${palette.lime}`,
                animation: 'gl-pulse 2.4s ease-in-out 0.8s infinite',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const meta: SlideMeta = { title: 'Motion · Glass' };
export default [Cover, Features, Closing] satisfies Page[];
