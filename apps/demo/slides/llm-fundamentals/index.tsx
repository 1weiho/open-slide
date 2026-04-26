import type { Page, SlideMeta } from '@open-slide/core';

/* ─────────────── Tokens & primitives ─────────────── */

const palette = {
  bg: '#f7f5f0',
  surface: '#ffffff',
  text: '#1a1814',
  muted: '#6b6660',
  faint: '#a8a29a',
  line: '#e4e0d8',
  accent: '#6d4cff', // violet — the "model" color
  accentSoft: 'rgba(109, 76, 255, 0.10)',
  warm: '#c2410c',
  warmSoft: 'rgba(194, 65, 12, 0.10)',
};

// Token chunk colors — cycled deterministically.
const tokenColors = [
  { fg: '#7c3aed', bg: 'rgba(124, 58, 237, 0.12)', border: 'rgba(124, 58, 237, 0.45)' },
  { fg: '#0891b2', bg: 'rgba(8, 145, 178, 0.12)', border: 'rgba(8, 145, 178, 0.45)' },
  { fg: '#c2410c', bg: 'rgba(194, 65, 12, 0.12)', border: 'rgba(194, 65, 12, 0.45)' },
  { fg: '#15803d', bg: 'rgba(21, 128, 61, 0.12)', border: 'rgba(21, 128, 61, 0.45)' },
  { fg: '#b91c1c', bg: 'rgba(185, 28, 28, 0.12)', border: 'rgba(185, 28, 28, 0.45)' },
  { fg: '#a16207', bg: 'rgba(161, 98, 7, 0.12)', border: 'rgba(161, 98, 7, 0.45)' },
];

const fonts = {
  serif: '"Times New Roman", "Georgia", serif',
  sans: '-apple-system, BlinkMacSystemFont, "Inter", "SF Pro Display", system-ui, sans-serif',
  mono: '"SF Mono", "JetBrains Mono", "Menlo", monospace',
};

const fill = {
  width: '100%',
  height: '100%',
  fontFamily: fonts.sans,
  color: palette.text,
  background: palette.bg,
  position: 'relative',
  overflow: 'hidden',
} as const;

const ease = 'cubic-bezier(0.16, 1, 0.3, 1)';

const keyframes = `
@keyframes lFadeUp {
  from { opacity: 0; transform: translateY(28px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes lFade {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes lFadeRight {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes lScale {
  from { opacity: 0; transform: scale(0.94); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes lLineGrow {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
@keyframes lBarGrow {
  from { transform: scaleX(0); }
  to { transform: scaleX(var(--scale, 1)); }
}
@keyframes lBlink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
@keyframes lSlide {
  0% { transform: translateX(0); }
  100% { transform: translateX(var(--dist, 0px)); }
}
@keyframes lWindowSlide {
  0%, 100% { transform: translateX(0px); }
  50% { transform: translateX(var(--dist, 200px)); }
}
.l-fadeup    { animation: lFadeUp 1000ms ${ease} both; }
.l-fade      { animation: lFade 1200ms ${ease} both; }
.l-faderight { animation: lFadeRight 800ms ${ease} both; }
.l-scale     { animation: lScale 1000ms ${ease} both; }
.l-line      { animation: lLineGrow 900ms ${ease} both; transform-origin: left center; }
.l-blink     { animation: lBlink 1.1s steps(1) infinite; }
.l-bar       { animation: lBarGrow 1100ms ${ease} both; transform-origin: left center; }
`;

const Style = () => <style>{keyframes}</style>;

const PAD_X = 140;
const PAD_Y = 110;
const TOTAL = 12;

const Eyebrow = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <div
    className="l-fadeup"
    style={{
      animationDelay: `${delay}ms`,
      fontFamily: fonts.sans,
      fontSize: 22,
      fontWeight: 500,
      letterSpacing: '0.32em',
      textTransform: 'uppercase',
      color: palette.accent,
    }}
  >
    {children}
  </div>
);

const PageNumber = ({ n, total }: { n: number; total: number }) => (
  <div
    style={{
      position: 'absolute',
      left: PAD_X,
      bottom: 60,
      fontFamily: fonts.sans,
      fontSize: 18,
      letterSpacing: '0.3em',
      textTransform: 'uppercase',
      color: palette.faint,
    }}
  >
    LLM · {String(n).padStart(2, '0')} / {String(total).padStart(2, '0')}
  </div>
);

const SectionTitle = ({
  children,
  size = 84,
  delay = 180,
  margin = '32px 0 16px',
  maxWidth,
}: {
  children: React.ReactNode;
  size?: number;
  delay?: number;
  margin?: string;
  maxWidth?: number;
}) => (
  <h2
    className="l-fadeup"
    style={{
      animationDelay: `${delay}ms`,
      fontFamily: fonts.serif,
      fontSize: size,
      fontWeight: 400,
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
      margin,
      maxWidth,
      color: palette.text,
    }}
  >
    {children}
  </h2>
);

/* Token pill — used everywhere */
const TokenPill = ({
  text,
  i,
  delay = 0,
  size = 38,
}: {
  text: string;
  i: number;
  delay?: number;
  size?: number;
}) => {
  const c = tokenColors[i % tokenColors.length];
  // Render a leading space as a visible glyph so users see whitespace is part of a token.
  const display = text.replace(/ /g, '·');
  return (
    <span
      className="l-scale"
      style={{
        animationDelay: `${delay}ms`,
        display: 'inline-block',
        fontFamily: fonts.mono,
        fontSize: size,
        fontWeight: 500,
        color: c.fg,
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 8,
        padding: `${Math.round(size * 0.18)}px ${Math.round(size * 0.4)}px`,
        marginRight: 8,
        marginBottom: 8,
        whiteSpace: 'pre',
        letterSpacing: '-0.01em',
      }}
    >
      {display}
    </span>
  );
};

/* ─────────────── 1. Cover ─────────────── */
const Cover: Page = () => (
  <div
    style={{
      ...fill,
      padding: `${PAD_Y}px ${PAD_X}px`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}
  >
    <Style />
    {/* faint grid */}
    <svg
      width="100%"
      height="100%"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5 }}
      aria-hidden="true"
      role="presentation"
    >
      <title>decorative grid</title>
      <defs>
        <pattern id="lgrid" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M 80 0 L 0 0 0 80" fill="none" stroke={palette.line} strokeWidth="1" />
        </pattern>
        <radialGradient id="lvignette" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={palette.bg} stopOpacity="0" />
          <stop offset="100%" stopColor={palette.bg} stopOpacity="1" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#lgrid)" />
      <rect width="100%" height="100%" fill="url(#lvignette)" />
    </svg>

    <div style={{ position: 'relative', zIndex: 1 }}>
      <Eyebrow>A field guide · 2026</Eyebrow>
      <h1
        className="l-fadeup"
        style={{
          animationDelay: '180ms',
          fontFamily: fonts.serif,
          fontSize: 196,
          fontWeight: 400,
          lineHeight: 1.02,
          letterSpacing: '-0.025em',
          margin: '40px 0 0',
          color: palette.text,
        }}
      >
        How <em style={{ fontStyle: 'italic', color: palette.accent }}>LLMs</em>
        <br />
        actually work.
      </h1>
      <div
        className="l-line"
        style={{
          animationDelay: '900ms',
          height: 1,
          width: 520,
          background: palette.text,
          margin: '64px 0 32px',
        }}
      />
      <p
        className="l-fadeup"
        style={{
          animationDelay: '1100ms',
          fontFamily: fonts.sans,
          fontSize: 36,
          lineHeight: 1.5,
          color: palette.muted,
          maxWidth: 1200,
          margin: 0,
          fontWeight: 300,
        }}
      >
        From a single prompt to a paragraph of fluent prose — twelve quiet pages on tokens,
        attention, and the art of guessing the next word.
      </p>
    </div>
    <PageNumber n={1} total={TOTAL} />
  </div>
);

/* ─────────────── 2. Big idea ─────────────── */
const BigIdea: Page = () => (
  <div
    style={{
      ...fill,
      padding: `${PAD_Y}px ${PAD_X}px`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}
  >
    <Style />
    <Eyebrow>The whole thing in one sentence</Eyebrow>
    <SectionTitle size={120} margin="40px 0 60px" maxWidth={1600}>
      An LLM predicts the <em style={{ color: palette.accent }}>next token</em>,
      <br />
      one token at a time.
    </SectionTitle>
    <p
      className="l-fadeup"
      style={{
        animationDelay: '600ms',
        fontFamily: fonts.serif,
        fontStyle: 'italic',
        fontSize: 40,
        lineHeight: 1.5,
        color: palette.muted,
        maxWidth: 1500,
        margin: 0,
      }}
    >
      Everything else — context windows, attention, temperature, hallucinations — is a consequence
      of that one loop.
    </p>
    <PageNumber n={2} total={TOTAL} />
  </div>
);

/* ─────────────── 3. What is a token ─────────────── */
const sentenceTokens = ['Understand', 'ing', ' L', 'LMs', ' is', ' fun', '.'];

const WhatIsToken: Page = () => (
  <div
    style={{ ...fill, padding: `${PAD_Y}px ${PAD_X}px`, display: 'flex', flexDirection: 'column' }}
  >
    <Style />
    <Eyebrow>Definition</Eyebrow>
    <SectionTitle>A token is the unit the model actually sees.</SectionTitle>
    <p
      className="l-fadeup"
      style={{
        animationDelay: '320ms',
        fontSize: 28,
        lineHeight: 1.5,
        color: palette.muted,
        fontWeight: 300,
        margin: '0 0 60px',
        maxWidth: 1500,
      }}
    >
      Not a word, not a character — a chunk somewhere in between. Common words become single tokens;
      rare ones get split. Whitespace counts.
    </p>

    <div
      className="l-fade"
      style={{
        animationDelay: '600ms',
        background: palette.surface,
        border: `1px solid ${palette.line}`,
        borderRadius: 16,
        padding: '50px 60px',
      }}
    >
      <div
        style={{
          fontSize: 22,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: palette.muted,
          marginBottom: 24,
        }}
      >
        The string
      </div>
      <div
        style={{
          fontFamily: fonts.serif,
          fontStyle: 'italic',
          fontSize: 56,
          color: palette.text,
          marginBottom: 48,
          lineHeight: 1.2,
        }}
      >
        “Understanding LLMs is fun.”
      </div>

      <div
        style={{
          fontSize: 22,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: palette.accent,
          marginBottom: 24,
        }}
      >
        becomes 7 tokens
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
        {sentenceTokens.map((t, i) => (
          <TokenPill key={`${t}-${i}`} text={t} i={i} delay={900 + i * 140} size={42} />
        ))}
      </div>

      <div
        className="l-fadeup"
        style={{
          animationDelay: '2200ms',
          marginTop: 40,
          fontFamily: fonts.sans,
          fontSize: 22,
          color: palette.muted,
        }}
      >
        <span style={{ fontFamily: fonts.mono, color: palette.text }}>·</span> marks a leading space
        — yes, it's part of the token.
      </div>
    </div>
    <PageNumber n={3} total={TOTAL} />
  </div>
);

/* ─────────────── 4. Tokenization (BPE) ─────────────── */
const Tokenization: Page = () => (
  <div
    style={{ ...fill, padding: `${PAD_Y}px ${PAD_X}px`, display: 'flex', flexDirection: 'column' }}
  >
    <Style />
    <Eyebrow>Tokenization · BPE</Eyebrow>
    <SectionTitle>Why subwords?</SectionTitle>
    <p
      className="l-fadeup"
      style={{
        animationDelay: '320ms',
        fontSize: 28,
        lineHeight: 1.5,
        color: palette.muted,
        fontWeight: 300,
        margin: '0 0 50px',
        maxWidth: 1500,
      }}
    >
      A <em>character</em> vocabulary is too small (sequences explode). A pure <em>word</em>{' '}
      vocabulary is too brittle (every typo is unknown).
      <br />
      Byte-pair encoding learns a middle ground: keep frequent strings whole, split rare ones into
      reusable pieces.
    </p>

    <div style={{ display: 'flex', gap: 40, flex: 1 }}>
      {[
        {
          label: 'common',
          src: '" the"',
          out: [' the'],
          note: 'a single token — high frequency wins',
          delay: 500,
        },
        {
          label: 'compound',
          src: '"transformer"',
          out: ['transform', 'er'],
          note: 'a stem plus a productive suffix',
          delay: 800,
        },
        {
          label: 'rare',
          src: '"rzęsy"',
          out: ['rz', 'ęs', 'y'],
          note: 'fall back to short reusable pieces',
          delay: 1100,
        },
      ].map((c) => (
        <div
          key={c.label}
          className="l-fadeup"
          style={{
            animationDelay: `${c.delay}ms`,
            flex: 1,
            background: palette.surface,
            border: `1px solid ${palette.line}`,
            borderRadius: 16,
            padding: 40,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: 22,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: palette.accent,
              fontWeight: 500,
              marginBottom: 28,
            }}
          >
            {c.label}
          </div>
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: 30,
              color: palette.text,
              marginBottom: 28,
            }}
          >
            {c.src}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 28 }}>
            {c.out.map((tk, i) => (
              <TokenPill
                key={`${c.label}-${tk}-${i}`}
                text={tk}
                i={i}
                delay={c.delay + 400 + i * 120}
                size={28}
              />
            ))}
          </div>
          <div
            style={{
              fontFamily: fonts.serif,
              fontStyle: 'italic',
              fontSize: 24,
              color: palette.muted,
              marginTop: 'auto',
              lineHeight: 1.5,
            }}
          >
            {c.note}
          </div>
        </div>
      ))}
    </div>
    <PageNumber n={4} total={TOTAL} />
  </div>
);

/* ─────────────── 5. Vocabulary size ─────────────── */
const VocabSize: Page = () => (
  <div
    style={{ ...fill, padding: `${PAD_Y}px ${PAD_X}px`, display: 'flex', flexDirection: 'column' }}
  >
    <Style />
    <Eyebrow>Vocabulary</Eyebrow>
    <SectionTitle>The model knows around 100,000 tokens.</SectionTitle>
    <p
      className="l-fadeup"
      style={{
        animationDelay: '320ms',
        fontSize: 28,
        lineHeight: 1.5,
        color: palette.muted,
        fontWeight: 300,
        margin: '0 0 60px',
        maxWidth: 1500,
      }}
    >
      Every token has an integer id. The model emits a probability over the entire vocabulary at
      every step.
    </p>

    <div style={{ display: 'flex', gap: 50, alignItems: 'stretch', flex: 1 }}>
      {[
        { era: 'GPT-2', size: '50,257', tone: 'compact', delay: 500 },
        { era: 'GPT-4', size: '~100,000', tone: 'standard today', delay: 750 },
        { era: 'frontier', size: '~200,000', tone: 'multilingual + code', delay: 1000 },
      ].map((v) => (
        <div
          key={v.era}
          className="l-fadeup"
          style={{
            animationDelay: `${v.delay}ms`,
            flex: 1,
            background: palette.surface,
            border: `1px solid ${palette.line}`,
            borderRadius: 16,
            padding: 48,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              fontSize: 22,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: palette.accent,
              fontWeight: 500,
            }}
          >
            {v.era}
          </div>
          <div
            style={{
              fontFamily: fonts.serif,
              fontSize: 96,
              color: palette.text,
              lineHeight: 1,
              margin: '40px 0',
              letterSpacing: '-0.02em',
            }}
          >
            {v.size}
          </div>
          <div
            style={{
              fontFamily: fonts.serif,
              fontStyle: 'italic',
              fontSize: 26,
              color: palette.muted,
            }}
          >
            {v.tone}
          </div>
        </div>
      ))}
    </div>

    <p
      className="l-fadeup"
      style={{
        animationDelay: '1500ms',
        fontFamily: fonts.serif,
        fontStyle: 'italic',
        fontSize: 30,
        lineHeight: 1.5,
        color: palette.muted,
        margin: '50px 0 0',
        maxWidth: 1500,
      }}
    >
      For perspective: an unabridged English dictionary lists roughly 470,000 headwords. A model
      with 100k tokens can spell any of them.
    </p>
    <PageNumber n={5} total={TOTAL} />
  </div>
);

/* ─────────────── 6. Context window ─────────────── */
const ContextWindow: Page = () => {
  // build a row of 80 little blocks; the window covers ~24 of them
  const total = 80;
  const winSize = 24;
  return (
    <div
      style={{
        ...fill,
        padding: `${PAD_Y}px ${PAD_X}px`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Style />
      <Eyebrow>Context window</Eyebrow>
      <SectionTitle>How much the model can see at once.</SectionTitle>
      <p
        className="l-fadeup"
        style={{
          animationDelay: '320ms',
          fontSize: 28,
          lineHeight: 1.5,
          color: palette.muted,
          fontWeight: 300,
          margin: '0 0 50px',
          maxWidth: 1500,
        }}
      >
        Tokens flow in from the left. Anything outside the window is invisible to the next
        prediction. Bigger windows cost more compute and memory.
      </p>

      {/* the visualization */}
      <div
        className="l-fade"
        style={{
          animationDelay: '600ms',
          background: palette.surface,
          border: `1px solid ${palette.line}`,
          borderRadius: 16,
          padding: '50px 60px',
          marginBottom: 40,
          position: 'relative',
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: palette.muted,
            marginBottom: 32,
          }}
        >
          A stream of tokens
        </div>
        <div
          style={{
            position: 'relative',
            height: 90,
            display: 'flex',
            gap: 4,
            alignItems: 'center',
          }}
        >
          {Array.from({ length: total }).map((_, i) => {
            const inWin = i >= 30 && i < 30 + winSize;
            return (
              <div
                key={`tok-cell-${i}`}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 3,
                  background: inWin ? palette.accent : palette.line,
                  opacity: inWin ? 1 : 0.7,
                  transition: 'background 600ms ease',
                }}
              />
            );
          })}

          {/* sliding window outline */}
          <div
            style={{
              position: 'absolute',
              top: -14,
              bottom: -14,
              left: `${(30 / total) * 100}%`,
              width: `${(winSize / total) * 100}%`,
              border: `2px solid ${palette.accent}`,
              borderRadius: 8,
              pointerEvents: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: -46,
              left: `${(30 / total) * 100}%`,
              width: `${(winSize / total) * 100}%`,
              textAlign: 'center',
              fontSize: 20,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: palette.accent,
              fontWeight: 500,
            }}
          >
            visible to the model
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 28,
            fontFamily: fonts.serif,
            fontStyle: 'italic',
            fontSize: 22,
            color: palette.muted,
          }}
        >
          <span>← older tokens (forgotten)</span>
          <span>newest tokens →</span>
        </div>
      </div>

      {/* size bars */}
      <div style={{ display: 'flex', gap: 60, alignItems: 'flex-end', flex: 1 }}>
        {[
          { label: '8k', frac: 0.08, year: 'GPT-3.5 era', delay: 1000 },
          { label: '128k', frac: 0.18, year: 'GPT-4 turbo', delay: 1200 },
          { label: '200k', frac: 0.3, year: 'Claude 3', delay: 1400 },
          { label: '1M+', frac: 0.95, year: 'Gemini · Claude', delay: 1600 },
        ].map((b) => (
          <div key={b.label} style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: fonts.serif,
                fontSize: 56,
                color: palette.text,
                lineHeight: 1,
                margin: '0 0 16px',
                letterSpacing: '-0.02em',
              }}
            >
              {b.label}
            </div>
            <div
              className="l-bar"
              style={
                {
                  animationDelay: `${b.delay}ms`,
                  '--scale': b.frac,
                  height: 14,
                  background: palette.accent,
                  borderRadius: 4,
                  width: '100%',
                } as React.CSSProperties
              }
            />
            <div
              style={{
                marginTop: 14,
                fontSize: 22,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: palette.muted,
              }}
            >
              {b.year}
            </div>
          </div>
        ))}
      </div>
      <PageNumber n={6} total={TOTAL} />
    </div>
  );
};

/* ─────────────── 7. Attention ─────────────── */
const Attention: Page = () => {
  const tokens = ['The', ' cat', ' sat', ' on', ' the', ' mat'];
  const focusIdx = 5; // " mat" looks back at all prior tokens
  const W = 1640;
  const H = 320;
  const positions = tokens.map((_, i) => ({
    x: 40 + (i * (W - 80)) / (tokens.length - 1),
    y: H / 2,
  }));

  return (
    <div
      style={{
        ...fill,
        padding: `${PAD_Y}px ${PAD_X}px`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Style />
      <Eyebrow>Attention</Eyebrow>
      <SectionTitle>Every token looks at every prior token.</SectionTitle>
      <p
        className="l-fadeup"
        style={{
          animationDelay: '320ms',
          fontSize: 28,
          lineHeight: 1.5,
          color: palette.muted,
          fontWeight: 300,
          margin: '0 0 50px',
          maxWidth: 1500,
        }}
      >
        To pick the next word, the model lets the most recent token attend to all the ones before it
        — weighing some heavily, ignoring others. This is why long context costs roughly <em>n²</em>
        .
      </p>

      <div
        className="l-fade"
        style={{
          animationDelay: '600ms',
          background: palette.surface,
          border: `1px solid ${palette.line}`,
          borderRadius: 16,
          padding: '40px 30px',
        }}
      >
        <svg
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          style={{ display: 'block' }}
          aria-hidden="true"
          role="presentation"
        >
          <title>attention diagram</title>
          {/* curves from focus → each prior */}
          {positions.slice(0, focusIdx).map((p, i) => {
            const fp = positions[focusIdx];
            const cx = (p.x + fp.x) / 2;
            const cy = H * 0.15;
            const weight = 0.25 + (i / focusIdx) * 0.6;
            return (
              <path
                key={`att-${tokens[i]}-${i}`}
                d={`M ${fp.x} ${fp.y - 24} Q ${cx} ${cy} ${p.x} ${p.y - 24}`}
                fill="none"
                stroke={palette.accent}
                strokeWidth={1 + weight * 4}
                strokeOpacity={weight}
              />
            );
          })}
          {/* token boxes */}
          {tokens.map((t, i) => {
            const p = positions[i];
            const isFocus = i === focusIdx;
            const display = t.replace(/ /g, '·');
            return (
              <g key={`tok-${t}-${i}`}>
                <rect
                  x={p.x - 100}
                  y={p.y - 24}
                  width={200}
                  height={70}
                  rx={10}
                  fill={isFocus ? palette.accent : palette.bg}
                  stroke={isFocus ? palette.accent : palette.line}
                  strokeWidth={1.5}
                />
                <text
                  x={p.x}
                  y={p.y + 22}
                  textAnchor="middle"
                  fontFamily={fonts.mono}
                  fontSize={32}
                  fontWeight={500}
                  fill={isFocus ? '#ffffff' : palette.text}
                >
                  {display}
                </text>
              </g>
            );
          })}
        </svg>
        <div
          style={{
            marginTop: 24,
            fontFamily: fonts.serif,
            fontStyle: 'italic',
            fontSize: 26,
            color: palette.muted,
            textAlign: 'center',
          }}
        >
          “mat” attends most strongly to “cat” and “sat” — the words that decide what follows.
        </div>
      </div>
      <PageNumber n={7} total={TOTAL} />
    </div>
  );
};

/* ─────────────── 8. Autoregressive loop ─────────────── */
const Autoregressive: Page = () => (
  <div
    style={{ ...fill, padding: `${PAD_Y}px ${PAD_X}px`, display: 'flex', flexDirection: 'column' }}
  >
    <Style />
    <Eyebrow>The loop</Eyebrow>
    <SectionTitle>One token in. One token out. Repeat.</SectionTitle>
    <p
      className="l-fadeup"
      style={{
        animationDelay: '320ms',
        fontSize: 28,
        lineHeight: 1.5,
        color: palette.muted,
        fontWeight: 300,
        margin: '0 0 50px',
        maxWidth: 1500,
      }}
    >
      The model is autoregressive: each new token is appended to the input, and the whole thing runs
      again. Generation is a chain of single-step bets.
    </p>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>
      {[
        {
          n: '01',
          label: 'Input tokens',
          mono: '[The, ·cat, ·sat, ·on, ·the]',
          delay: 500,
        },
        {
          n: '02',
          label: 'Forward pass through the network',
          mono: 'logits = model(tokens)',
          delay: 800,
        },
        {
          n: '03',
          label: 'Probabilities over the entire vocabulary',
          mono: 'p = softmax(logits)   // shape: [vocab_size]',
          delay: 1100,
        },
        {
          n: '04',
          label: 'Sample one token',
          mono: 'next = sample(p)      // → "·mat"',
          delay: 1400,
        },
        {
          n: '05',
          label: 'Append and loop',
          mono: 'tokens.push(next)     // back to step 02',
          delay: 1700,
          highlight: true,
        },
      ].map((row) => (
        <div
          key={row.n}
          className="l-fadeup"
          style={{
            animationDelay: `${row.delay}ms`,
            display: 'flex',
            alignItems: 'center',
            gap: 36,
            padding: '24px 36px',
            background: row.highlight ? palette.accentSoft : palette.surface,
            border: `1px solid ${row.highlight ? palette.accent : palette.line}`,
            borderRadius: 14,
          }}
        >
          <div
            style={{
              flexShrink: 0,
              width: 72,
              fontFamily: fonts.serif,
              fontSize: 56,
              color: row.highlight ? palette.accent : palette.faint,
              lineHeight: 1,
              fontWeight: 400,
            }}
          >
            {row.n}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 28, color: palette.text, lineHeight: 1.4 }}>{row.label}</div>
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: 22,
                color: palette.muted,
                marginTop: 6,
                letterSpacing: '-0.01em',
              }}
            >
              {row.mono}
            </div>
          </div>
        </div>
      ))}
    </div>
    <PageNumber n={8} total={TOTAL} />
  </div>
);

/* ─────────────── 9. Sampling ─────────────── */
const sampleCandidates = [
  { tok: ' mat', p: 0.42 },
  { tok: ' floor', p: 0.18 },
  { tok: ' couch', p: 0.11 },
  { tok: ' chair', p: 0.07 },
  { tok: ' rug', p: 0.05 },
  { tok: ' lap', p: 0.03 },
];

const Sampling: Page = () => (
  <div
    style={{ ...fill, padding: `${PAD_Y}px ${PAD_X}px`, display: 'flex', flexDirection: 'column' }}
  >
    <Style />
    <Eyebrow>Sampling</Eyebrow>
    <SectionTitle>Picking from the distribution.</SectionTitle>
    <p
      className="l-fadeup"
      style={{
        animationDelay: '320ms',
        fontSize: 28,
        lineHeight: 1.5,
        color: palette.muted,
        fontWeight: 300,
        margin: '0 0 50px',
        maxWidth: 1500,
      }}
    >
      The model gives a probability to <em>every</em> token. How you draw from that distribution
      decides the personality.
    </p>

    <div style={{ display: 'flex', gap: 50, flex: 1 }}>
      {/* candidates */}
      <div
        className="l-fadeup"
        style={{
          animationDelay: '500ms',
          flex: 1.4,
          background: palette.surface,
          border: `1px solid ${palette.line}`,
          borderRadius: 16,
          padding: 40,
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: palette.accent,
            fontWeight: 500,
            marginBottom: 8,
          }}
        >
          Top candidates
        </div>
        <div
          style={{
            fontFamily: fonts.serif,
            fontStyle: 'italic',
            fontSize: 26,
            color: palette.muted,
            marginBottom: 32,
          }}
        >
          after “The cat sat on the …”
        </div>
        {sampleCandidates.map((c, i) => (
          <div
            key={c.tok}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: 140,
                fontFamily: fonts.mono,
                fontSize: 28,
                color: palette.text,
              }}
            >
              {c.tok.replace(/ /g, '·')}
            </div>
            <div
              style={{
                flex: 1,
                height: 22,
                background: palette.line,
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                className="l-bar"
                style={
                  {
                    animationDelay: `${800 + i * 120}ms`,
                    '--scale': c.p / 0.42,
                    height: '100%',
                    width: '100%',
                    background: palette.accent,
                    borderRadius: 4,
                  } as React.CSSProperties
                }
              />
            </div>
            <div
              style={{
                width: 90,
                textAlign: 'right',
                fontFamily: fonts.mono,
                fontSize: 22,
                color: palette.muted,
              }}
            >
              {(c.p * 100).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>

      {/* knobs */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 28 }}>
        {[
          {
            name: 'temperature',
            t: '0.0',
            body: 'Always pick the top one. Deterministic, often boring.',
            delay: 800,
          },
          {
            name: 'temperature',
            t: '1.0',
            body: 'Sample from the raw distribution. Natural variety.',
            delay: 1100,
          },
          {
            name: 'top-p',
            t: '0.9',
            body: 'Keep only the tokens whose probabilities sum to 0.9. Trim the long tail.',
            delay: 1400,
          },
        ].map((k, i) => (
          <div
            key={`${k.name}-${k.t}-${i}`}
            className="l-fadeup"
            style={{
              animationDelay: `${k.delay}ms`,
              background: palette.surface,
              border: `1px solid ${palette.line}`,
              borderRadius: 14,
              padding: '24px 30px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 16,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 24,
                  color: palette.muted,
                }}
              >
                {k.name}
              </div>
              <div
                style={{
                  fontFamily: fonts.serif,
                  fontSize: 44,
                  color: palette.accent,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                {k.t}
              </div>
            </div>
            <div style={{ fontSize: 22, lineHeight: 1.5, color: palette.text }}>{k.body}</div>
          </div>
        ))}
      </div>
    </div>
    <PageNumber n={9} total={TOTAL} />
  </div>
);

/* ─────────────── 10. Forgetting & hallucination ─────────────── */
const Hallucinate: Page = () => (
  <div
    style={{ ...fill, padding: `${PAD_Y}px ${PAD_X}px`, display: 'flex', flexDirection: 'column' }}
  >
    <Style />
    <Eyebrow>Failure modes</Eyebrow>
    <SectionTitle>Why models forget. Why they hallucinate.</SectionTitle>
    <p
      className="l-fadeup"
      style={{
        animationDelay: '320ms',
        fontSize: 28,
        lineHeight: 1.5,
        color: palette.muted,
        fontWeight: 300,
        margin: '0 0 50px',
        maxWidth: 1500,
      }}
    >
      Both behaviors fall straight out of the loop you just saw.
    </p>

    <div style={{ display: 'flex', gap: 50, flex: 1 }}>
      {[
        {
          icon: '◌',
          title: 'Forgetting',
          body: (
            <>
              Anything that scrolls out of the context window is gone. The model has no memory
              between sessions — only what fits in the current prompt.
            </>
          ),
          delay: 500,
        },
        {
          icon: '◍',
          title: 'Hallucination',
          body: (
            <>
              The model is trained to produce <em>plausible</em> next tokens, not true ones. When
              facts are missing it confabulates fluently — same loop, no internal “I don't know”
              signal.
            </>
          ),
          delay: 800,
        },
      ].map((b) => (
        <div
          key={b.title}
          className="l-fadeup"
          style={{
            animationDelay: `${b.delay}ms`,
            flex: 1,
            background: palette.surface,
            border: `1px solid ${palette.line}`,
            borderRadius: 16,
            padding: 50,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontFamily: fonts.serif,
              fontSize: 88,
              color: palette.accent,
              lineHeight: 1,
              marginBottom: 28,
            }}
          >
            {b.icon}
          </div>
          <div
            style={{
              fontFamily: fonts.serif,
              fontSize: 56,
              fontWeight: 400,
              color: palette.text,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              marginBottom: 28,
            }}
          >
            {b.title}
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.55, color: palette.muted, fontWeight: 300 }}>
            {b.body}
          </div>
        </div>
      ))}
    </div>
    <PageNumber n={10} total={TOTAL} />
  </div>
);

/* ─────────────── 11. Practical implications ─────────────── */
const Practical: Page = () => (
  <div
    style={{ ...fill, padding: `${PAD_Y}px ${PAD_X}px`, display: 'flex', flexDirection: 'column' }}
  >
    <Style />
    <Eyebrow>What this means for you</Eyebrow>
    <SectionTitle size={84} margin="32px 0 50px">
      Three habits that pay off.
    </SectionTitle>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, flex: 1 }}>
      {[
        {
          n: 'I',
          head: 'Be concise.',
          body: 'Every token costs latency and money — and crowds the window for what matters.',
          delay: 500,
        },
        {
          n: 'II',
          head: 'Structure your prompt.',
          body: 'Headings, lists, and code fences give the attention mechanism strong anchors to look back at.',
          delay: 800,
        },
        {
          n: 'III',
          head: "Don't bury the lede.",
          body: 'Recent tokens get the most attention. Put the actual ask near the end.',
          delay: 1100,
        },
      ].map((p) => (
        <div
          key={p.n}
          className="l-fadeup"
          style={{
            animationDelay: `${p.delay}ms`,
            display: 'flex',
            alignItems: 'center',
            gap: 50,
            padding: '36px 44px',
            background: palette.surface,
            border: `1px solid ${palette.line}`,
            borderRadius: 16,
          }}
        >
          <div
            style={{
              flexShrink: 0,
              width: 90,
              fontFamily: fonts.serif,
              fontSize: 76,
              color: palette.accent,
              lineHeight: 1,
              fontWeight: 400,
              letterSpacing: '0.02em',
            }}
          >
            {p.n}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: fonts.serif,
                fontSize: 48,
                fontWeight: 400,
                color: palette.text,
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
                marginBottom: 10,
              }}
            >
              {p.head}
            </div>
            <div style={{ fontSize: 26, lineHeight: 1.5, color: palette.muted, fontWeight: 300 }}>
              {p.body}
            </div>
          </div>
        </div>
      ))}
    </div>
    <PageNumber n={11} total={TOTAL} />
  </div>
);

/* ─────────────── 12. Closing ─────────────── */
const Closing: Page = () => (
  <div
    style={{
      ...fill,
      padding: `${PAD_Y}px ${PAD_X}px`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}
  >
    <Style />
    <svg
      width="100%"
      height="100%"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5 }}
      aria-hidden="true"
      role="presentation"
    >
      <title>decorative grid</title>
      <defs>
        <pattern id="lgrid2" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M 80 0 L 0 0 0 80" fill="none" stroke={palette.line} strokeWidth="1" />
        </pattern>
        <radialGradient id="lvignette2" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={palette.bg} stopOpacity="0" />
          <stop offset="100%" stopColor={palette.bg} stopOpacity="1" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#lgrid2)" />
      <rect width="100%" height="100%" fill="url(#lvignette2)" />
    </svg>

    <div style={{ position: 'relative', zIndex: 1 }}>
      <Eyebrow>The whole machine</Eyebrow>
      <h2
        className="l-fadeup"
        style={{
          animationDelay: '180ms',
          fontFamily: fonts.serif,
          fontSize: 152,
          fontWeight: 400,
          lineHeight: 1.05,
          letterSpacing: '-0.025em',
          margin: '40px 0 0',
        }}
      >
        Tokens. Attention.
        <br />
        <em style={{ color: palette.accent }}>Predict. Repeat.</em>
      </h2>
      <div
        className="l-line"
        style={{
          animationDelay: '900ms',
          height: 1,
          width: 520,
          background: palette.text,
          margin: '64px 0 32px',
        }}
      />
      <p
        className="l-fadeup"
        style={{
          animationDelay: '1100ms',
          fontSize: 36,
          lineHeight: 1.5,
          color: palette.muted,
          maxWidth: 1300,
          margin: 0,
          fontWeight: 300,
        }}
      >
        Behind every fluent paragraph an LLM produces, this loop just ran a few hundred times — one
        quiet bet after another, until the cursor stopped
        <span className="l-blink" style={{ marginLeft: 6, fontFamily: fonts.mono, fontSize: 32 }}>
          ▍
        </span>
      </p>
      <div
        className="l-fadeup"
        style={{
          animationDelay: '1500ms',
          fontFamily: fonts.serif,
          fontStyle: 'italic',
          fontSize: 32,
          color: palette.faint,
          marginTop: 80,
        }}
      >
        — thank you.
      </div>
    </div>
    <PageNumber n={12} total={TOTAL} />
  </div>
);

export const meta: SlideMeta = { title: 'How LLMs Work' };
export default [
  Cover,
  BigIdea,
  WhatIsToken,
  Tokenization,
  VocabSize,
  ContextWindow,
  Attention,
  Autoregressive,
  Sampling,
  Hallucinate,
  Practical,
  Closing,
] satisfies Page[];
