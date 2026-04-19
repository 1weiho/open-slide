import type { DeckMeta, SlidePage } from '@open-slide/core';

// ─── Design tokens ────────────────────────────────────────────────────────────
const palette = {
  bg: '#08090a',
  surface: '#0e0f12',
  surfaceHi: '#14161a',
  text: '#f7f8f8',
  textSoft: '#c7c9d1',
  muted: '#6f727c',
  dim: '#3e4048',
  border: 'rgba(255,255,255,0.07)',
  borderBright: 'rgba(255,255,255,0.14)',
  accent: '#7170ff',
  accentSoft: '#a3a0ff',
  accent2: '#5e6ad2',
  mint: '#68cc9a',
  amber: '#e0b25c',
};

const font = {
  sans: '"Inter", "SF Pro Display", system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, monospace',
};

const fill = {
  width: '100%',
  height: '100%',
  background: palette.bg,
  color: palette.text,
  fontFamily: font.sans,
  letterSpacing: '-0.015em',
  overflow: 'hidden',
  position: 'relative' as const,
};

// ─── Shared animations (injected per slide so direct-nav also works) ──────────
const styles = `
  @keyframes es-fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes es-fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes es-grow {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
  @keyframes es-shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes es-glow {
    0%, 100% { opacity: 0.55; transform: scale(1); }
    50%      { opacity: 0.85; transform: scale(1.04); }
  }
  @keyframes es-drift {
    0%   { transform: translate3d(0, 0, 0); }
    50%  { transform: translate3d(18px, -12px, 0); }
    100% { transform: translate3d(0, 0, 0); }
  }
  @keyframes es-blink {
    0%, 49%   { opacity: 1; }
    50%, 100% { opacity: 0; }
  }
  .es-fadeUp { opacity: 0; animation: es-fadeUp 0.9s cubic-bezier(.2,.7,.2,1) forwards; }
  .es-fadeIn { opacity: 0; animation: es-fadeIn 1.2s ease forwards; }
  .es-grow   { transform-origin: left center; animation: es-grow 1.1s cubic-bezier(.2,.7,.2,1) forwards; }
  .es-caret::after {
    content: '';
    display: inline-block;
    width: 0.06em;
    height: 0.9em;
    background: currentColor;
    margin-left: 0.08em;
    vertical-align: baseline;
    animation: es-blink 1.05s steps(1) infinite;
  }
`;

const Styles = () => <style>{styles}</style>;

// ─── Reusable chrome ─────────────────────────────────────────────────────────
const GridBg = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      backgroundImage:
        'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
      backgroundSize: '96px 96px',
      maskImage:
        'radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 70%)',
      WebkitMaskImage:
        'radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 70%)',
    }}
  />
);

const GlowOrb = ({
  x,
  y,
  size = 900,
  color = palette.accent,
  delay = 0,
}: { x: string; y: string; size?: number; color?: string; delay?: number }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size,
      transform: 'translate(-50%, -50%)',
      background: `radial-gradient(circle, ${color} 0%, rgba(0,0,0,0) 60%)`,
      opacity: 0.5,
      filter: 'blur(40px)',
      animation: `es-glow 8s ease-in-out ${delay}s infinite, es-drift 14s ease-in-out ${delay}s infinite`,
      pointerEvents: 'none',
    }}
  />
);

const Chrome = ({ page, total }: { page: number; total: number }) => (
  <div
    style={{
      position: 'absolute',
      left: 96,
      right: 96,
      bottom: 56,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: 20,
      fontFamily: font.mono,
      color: palette.muted,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    }}
    className="es-fadeIn"
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: 2,
          background: palette.accent,
          boxShadow: `0 0 12px ${palette.accent}`,
        }}
      />
      Open Slide · Example
    </div>
    <div>
      {String(page).padStart(2, '0')} / {String(total).padStart(2, '0')}
    </div>
  </div>
);

const Eyebrow = ({
  children,
  delay = 0,
}: { children: React.ReactNode; delay?: number }) => (
  <div
    className="es-fadeUp"
    style={{
      fontSize: 20,
      fontFamily: font.mono,
      color: palette.muted,
      letterSpacing: '0.24em',
      textTransform: 'uppercase',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      animationDelay: `${delay}s`,
    }}
  >
    <span
      style={{
        width: 36,
        height: 1,
        background: palette.borderBright,
        display: 'inline-block',
      }}
    />
    {children}
  </div>
);

const TOTAL = 7;

// ─── 01 · Cover ──────────────────────────────────────────────────────────────
const Cover: SlidePage = () => (
  <div style={fill}>
    <Styles />
    <GridBg />
    <GlowOrb x="22%" y="38%" size={1100} color={palette.accent} />
    <GlowOrb x="78%" y="72%" size={900} color={palette.accent2} delay={2} />

    <div
      style={{
        position: 'absolute',
        top: 64,
        left: 96,
        right: 96,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 20,
        fontFamily: font.mono,
        color: palette.muted,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
      }}
      className="es-fadeIn"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <title>logo</title>
          <rect x="1" y="1" width="20" height="20" rx="5" stroke={palette.accent} strokeWidth="1.4" />
          <rect x="6" y="6" width="10" height="10" rx="2" fill={palette.accent} />
        </svg>
        Open Slide
      </div>
      <div>Vol. 01 — 2026</div>
    </div>

    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        top: '50%',
        transform: 'translateY(-58%)',
      }}
    >
      <div style={{ marginBottom: 40 }}>
        <Eyebrow delay={0.05}>A Gentle Introduction</Eyebrow>
      </div>

      <h1
        className="es-fadeUp"
        style={{
          fontSize: 184,
          lineHeight: 0.98,
          fontWeight: 600,
          margin: 0,
          letterSpacing: '-0.045em',
          animationDelay: '0.15s',
        }}
      >
        Language
        <br />
        <span
          style={{
            background: `linear-gradient(90deg, ${palette.accentSoft} 0%, ${palette.accent} 40%, #b8b5ff 100%)`,
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            animation: 'es-shimmer 6s linear infinite',
          }}
        >
          Models
        </span>
        <span style={{ color: palette.accent }}>.</span>
      </h1>

      <p
        className="es-fadeUp"
        style={{
          fontSize: 36,
          color: palette.textSoft,
          marginTop: 44,
          maxWidth: 1100,
          lineHeight: 1.4,
          fontWeight: 400,
          animationDelay: '0.4s',
        }}
      >
        What they are, how they read,
        <br />
        and why the window matters.
      </p>
    </div>

    <Chrome page={1} total={TOTAL} />
  </div>
);

// ─── 02 · Chapters ───────────────────────────────────────────────────────────
const chapters = [
  { n: '01', t: 'The model', d: 'A statistical machine that predicts the next word.' },
  { n: '02', t: 'Tokens', d: 'The atomic units of text it actually reads.' },
  { n: '03', t: 'Context window', d: 'How much it can hold in mind at once.' },
  { n: '04', t: 'Scale', d: 'Why a million tokens changes what is possible.' },
];

const Chapters: SlidePage = () => (
  <div style={fill}>
    <Styles />
    <GridBg />
    <GlowOrb x="92%" y="12%" size={700} color={palette.accent} />

    <div style={{ position: 'absolute', top: 120, left: 120, right: 120 }}>
      <div className="es-fadeUp" style={{ animationDelay: '0.05s' }}>
        <Eyebrow>Contents</Eyebrow>
      </div>
      <h2
        className="es-fadeUp"
        style={{
          fontSize: 96,
          fontWeight: 600,
          margin: '28px 0 0',
          letterSpacing: '-0.035em',
          animationDelay: '0.15s',
        }}
      >
        What we'll cover.
      </h2>
    </div>

    <div
      style={{
        position: 'absolute',
        top: 460,
        left: 120,
        right: 120,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {chapters.map((c, i) => (
        <div
          key={c.n}
          className="es-fadeUp"
          style={{
            animationDelay: `${0.3 + i * 0.12}s`,
            display: 'grid',
            gridTemplateColumns: '120px 1fr auto',
            alignItems: 'center',
            padding: '28px 0',
            borderTop: `1px solid ${palette.border}`,
            borderBottom: i === chapters.length - 1 ? `1px solid ${palette.border}` : undefined,
            gap: 40,
          }}
        >
          <div
            style={{
              fontFamily: font.mono,
              fontSize: 22,
              color: palette.muted,
              letterSpacing: '0.08em',
            }}
          >
            {c.n}
          </div>
          <div
            style={{
              fontSize: 52,
              fontWeight: 500,
              letterSpacing: '-0.02em',
            }}
          >
            {c.t}
          </div>
          <div
            style={{
              fontSize: 26,
              color: palette.muted,
              textAlign: 'right',
              maxWidth: 560,
              lineHeight: 1.4,
            }}
          >
            {c.d}
          </div>
        </div>
      ))}
    </div>

    <Chrome page={2} total={TOTAL} />
  </div>
);

// ─── 03 · What is an LLM ─────────────────────────────────────────────────────
const Model: SlidePage = () => (
  <div style={fill}>
    <Styles />
    <GridBg />
    <GlowOrb x="18%" y="82%" size={800} color={palette.accent2} />

    <div style={{ position: 'absolute', top: 120, left: 120, right: 120 }}>
      <div className="es-fadeUp" style={{ animationDelay: '0.05s' }}>
        <Eyebrow>Chapter 01 — The model</Eyebrow>
      </div>
      <h2
        className="es-fadeUp"
        style={{
          fontSize: 112,
          fontWeight: 600,
          margin: '28px 0 0',
          letterSpacing: '-0.04em',
          animationDelay: '0.15s',
          lineHeight: 1.02,
        }}
      >
        A next-word
        <br />
        <span style={{ color: palette.muted }}>predictor.</span>
      </h2>
    </div>

    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        bottom: 220,
        display: 'grid',
        gridTemplateColumns: '1.1fr 1fr',
        gap: 80,
        alignItems: 'end',
      }}
    >
      <p
        className="es-fadeUp"
        style={{
          fontSize: 34,
          lineHeight: 1.5,
          color: palette.textSoft,
          margin: 0,
          animationDelay: '0.35s',
        }}
      >
        An LLM reads what came before and guesses what comes next — one small
        piece at a time. That loop, run billions of times over trillions of
        words, is the whole trick.
      </p>

      <div
        className="es-fadeUp"
        style={{
          background: palette.surface,
          border: `1px solid ${palette.border}`,
          borderRadius: 16,
          padding: 36,
          fontFamily: font.mono,
          fontSize: 30,
          lineHeight: 1.6,
          animationDelay: '0.55s',
        }}
      >
        <div style={{ color: palette.muted, fontSize: 18, letterSpacing: '0.18em', marginBottom: 20 }}>
          PROMPT → COMPLETION
        </div>
        <div>
          <span style={{ color: palette.textSoft }}>The capital of France is</span>{' '}
          <span style={{ color: palette.accent }} className="es-caret">
            Paris
          </span>
        </div>
      </div>
    </div>

    <Chrome page={3} total={TOTAL} />
  </div>
);

// ─── 04 · Tokens ─────────────────────────────────────────────────────────────
const tokenSample: { t: string; c: string }[] = [
  { t: 'Large', c: palette.accent },
  { t: ' language', c: palette.accentSoft },
  { t: ' models', c: palette.mint },
  { t: ' read', c: palette.amber },
  { t: ' text', c: palette.accent },
  { t: ' in', c: palette.muted },
  { t: ' pieces', c: palette.accentSoft },
  { t: '.', c: palette.mint },
];

const Tokens: SlidePage = () => (
  <div style={fill}>
    <Styles />
    <GridBg />
    <GlowOrb x="82%" y="22%" size={700} color={palette.accent} />

    <div style={{ position: 'absolute', top: 120, left: 120, right: 120 }}>
      <div className="es-fadeUp" style={{ animationDelay: '0.05s' }}>
        <Eyebrow>Chapter 02 — Tokens</Eyebrow>
      </div>
      <h2
        className="es-fadeUp"
        style={{
          fontSize: 112,
          fontWeight: 600,
          margin: '28px 0 0',
          letterSpacing: '-0.04em',
          animationDelay: '0.15s',
          lineHeight: 1.02,
        }}
      >
        Words, but <span style={{ color: palette.muted }}>smaller.</span>
      </h2>
    </div>

    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        top: 460,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          padding: 36,
          background: palette.surface,
          border: `1px solid ${palette.border}`,
          borderRadius: 16,
          fontFamily: font.mono,
        }}
      >
        {tokenSample.map((tok, i) => (
          <span
            key={`${tok.t}-${i}`}
            className="es-fadeUp"
            style={{
              animationDelay: `${0.35 + i * 0.08}s`,
              padding: '14px 22px',
              fontSize: 38,
              color: palette.text,
              background: `${tok.c}22`,
              border: `1px solid ${tok.c}55`,
              borderRadius: 10,
              whiteSpace: 'pre',
              letterSpacing: 0,
            }}
          >
            {tok.t}
          </span>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 32,
          marginTop: 56,
        }}
      >
        {[
          { k: '≈ 4', v: 'characters per token (English)' },
          { k: '≈ ¾', v: 'a word per token on average' },
          { k: '100k+', v: 'distinct tokens in the vocabulary' },
        ].map((s, i) => (
          <div
            key={s.k}
            className="es-fadeUp"
            style={{
              animationDelay: `${0.9 + i * 0.1}s`,
              borderTop: `1px solid ${palette.border}`,
              paddingTop: 24,
            }}
          >
            <div
              style={{
                fontSize: 64,
                fontWeight: 500,
                letterSpacing: '-0.03em',
                color: palette.text,
              }}
            >
              {s.k}
            </div>
            <div style={{ fontSize: 22, color: palette.muted, marginTop: 10 }}>{s.v}</div>
          </div>
        ))}
      </div>
    </div>

    <Chrome page={4} total={TOTAL} />
  </div>
);

// ─── 05 · Context Window ─────────────────────────────────────────────────────
const contextRows: { name: string; tokens: number; label: string; accent: string }[] = [
  { name: 'GPT-2 (2019)', tokens: 1024, label: '1K', accent: palette.dim },
  { name: 'GPT-3.5', tokens: 4096, label: '4K', accent: palette.muted },
  { name: 'Early Claude', tokens: 100_000, label: '100K', accent: palette.mint },
  { name: 'Claude 3', tokens: 200_000, label: '200K', accent: palette.amber },
  { name: 'Claude Opus 4.7', tokens: 1_000_000, label: '1M', accent: palette.accentSoft },
  { name: 'Gemini 1.5 Pro', tokens: 2_000_000, label: '2M', accent: palette.accent },
];

const Context: SlidePage = () => {
  const max = Math.max(...contextRows.map((r) => r.tokens));
  return (
    <div style={fill}>
      <Styles />
      <GridBg />
      <GlowOrb x="8%" y="18%" size={700} color={palette.accent} />

      <div style={{ position: 'absolute', top: 120, left: 120, right: 120 }}>
        <div className="es-fadeUp" style={{ animationDelay: '0.05s' }}>
          <Eyebrow>Chapter 03 — Context window</Eyebrow>
        </div>
        <h2
          className="es-fadeUp"
          style={{
            fontSize: 112,
            fontWeight: 600,
            margin: '28px 0 0',
            letterSpacing: '-0.04em',
            animationDelay: '0.15s',
            lineHeight: 1.02,
          }}
        >
          How much it can
          <br />
          <span style={{ color: palette.muted }}>hold in mind.</span>
        </h2>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 120,
          right: 120,
          top: 500,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {contextRows.map((r, i) => {
          const pct = Math.sqrt(r.tokens / max); // perceptual scaling
          return (
            <div
              key={r.name}
              className="es-fadeUp"
              style={{
                animationDelay: `${0.35 + i * 0.09}s`,
                display: 'grid',
                gridTemplateColumns: '320px 1fr 120px',
                alignItems: 'center',
                gap: 28,
              }}
            >
              <div style={{ fontSize: 24, color: palette.textSoft, letterSpacing: '-0.01em' }}>
                {r.name}
              </div>
              <div
                style={{
                  height: 28,
                  background: palette.surface,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 6,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  className="es-grow"
                  style={{
                    width: `${Math.max(pct * 100, 1.2)}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${r.accent}55 0%, ${r.accent} 100%)`,
                    boxShadow: `0 0 18px ${r.accent}66`,
                    animationDelay: `${0.55 + i * 0.09}s`,
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: font.mono,
                  fontSize: 26,
                  color: r.accent,
                  textAlign: 'right',
                  letterSpacing: '-0.01em',
                }}
              >
                {r.label}
              </div>
            </div>
          );
        })}
      </div>

      <Chrome page={5} total={TOTAL} />
    </div>
  );
};

// ─── 06 · Big number ─────────────────────────────────────────────────────────
const BigNumber: SlidePage = () => (
  <div style={fill}>
    <Styles />
    <GridBg />
    <GlowOrb x="50%" y="50%" size={1200} color={palette.accent} />

    <div
      style={{
        position: 'absolute',
        top: 96,
        left: 120,
        right: 120,
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 20,
        fontFamily: font.mono,
        color: palette.muted,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
      }}
      className="es-fadeIn"
    >
      <span>Chapter 04 — Scale</span>
      <span>Claude Opus 4.7 · 2026</span>
    </div>

    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <div
        className="es-fadeUp"
        style={{
          fontSize: 26,
          color: palette.muted,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          fontFamily: font.mono,
          animationDelay: '0.05s',
        }}
      >
        Tokens in the window
      </div>

      <div
        className="es-fadeUp"
        style={{
          fontSize: 460,
          fontWeight: 600,
          lineHeight: 1,
          margin: '32px 0 0',
          letterSpacing: '-0.06em',
          background: `linear-gradient(180deg, #ffffff 0%, ${palette.accentSoft} 60%, ${palette.accent} 100%)`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          animationDelay: '0.2s',
        }}
      >
        1M
      </div>

      <div
        className="es-fadeUp"
        style={{
          fontSize: 36,
          color: palette.textSoft,
          maxWidth: 1100,
          lineHeight: 1.4,
          marginTop: 40,
          animationDelay: '0.5s',
        }}
      >
        Enough for a whole codebase, a long novel, or a week of conversation —
        held in mind all at once.
      </div>
    </div>

    <Chrome page={6} total={TOTAL} />
  </div>
);

// ─── 07 · Closing ────────────────────────────────────────────────────────────
const Closing: SlidePage = () => (
  <div style={fill}>
    <Styles />
    <GridBg />
    <GlowOrb x="50%" y="90%" size={1100} color={palette.accent} />
    <GlowOrb x="12%" y="20%" size={500} color={palette.accent2} delay={1.5} />

    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        top: '50%',
        transform: 'translateY(-58%)',
      }}
    >
      <div className="es-fadeUp" style={{ animationDelay: '0.05s' }}>
        <Eyebrow>Fin.</Eyebrow>
      </div>

      <h2
        className="es-fadeUp"
        style={{
          fontSize: 160,
          fontWeight: 600,
          margin: '32px 0 0',
          letterSpacing: '-0.045em',
          lineHeight: 1,
          animationDelay: '0.15s',
        }}
      >
        Now you know
        <br />
        <span style={{ color: palette.muted }}>the whole thing</span>
        <span style={{ color: palette.accent }}>.</span>
      </h2>

      <div
        className="es-fadeUp"
        style={{
          marginTop: 80,
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          animationDelay: '0.45s',
        }}
      >
        {[
          { k: '← / →', v: 'navigate' },
          { k: 'F', v: 'fullscreen' },
          { k: 'Esc', v: 'exit play' },
        ].map((h) => (
          <div
            key={h.k}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 22px',
              background: palette.surface,
              border: `1px solid ${palette.border}`,
              borderRadius: 10,
              fontFamily: font.mono,
              fontSize: 22,
            }}
          >
            <kbd
              style={{
                padding: '4px 10px',
                background: palette.surfaceHi,
                border: `1px solid ${palette.borderBright}`,
                borderRadius: 6,
                color: palette.text,
              }}
            >
              {h.k}
            </kbd>
            <span style={{ color: palette.muted }}>{h.v}</span>
          </div>
        ))}
      </div>
    </div>

    <Chrome page={7} total={TOTAL} />
  </div>
);

export const meta: DeckMeta = { title: 'Example slide · LLMs' };

export default [Cover, Chapters, Model, Tokens, Context, BigNumber, Closing] satisfies SlidePage[];
