import type { ReactNode } from 'react';
import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';

// ─── Panel-tweakable design tokens ────────────────────────────────────────────
export const design: DesignSystem = {
  palette: {
    bg: '#0a0a0a',
    text: '#ededed',
    accent: '#00d4ff',
  },
  fonts: {
    display: '"Inter", "SF Pro Display", system-ui, -apple-system, sans-serif',
    body: '"Inter", "SF Pro Display", system-ui, -apple-system, sans-serif',
  },
  typeScale: {
    hero: 168,
    body: 36,
  },
  radius: 14,
};

// ─── Local non-tweakable palette + fonts ──────────────────────────────────────
const palette = {
  surface: '#111114',
  surfaceHi: '#17181c',
  border: 'rgba(255,255,255,0.08)',
  borderBright: 'rgba(255,255,255,0.16)',
  textSoft: '#c8c8cc',
  muted: '#7a7b82',
  dim: '#3f4046',
  accentSoft: 'rgba(0,212,255,0.14)',
  green: '#7ee787',
  pink: '#ff7eb6',
  amber: '#e3b341',
};

const font = {
  display: design.fonts.display,
  body: design.fonts.body,
  mono: '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, monospace',
};

const fill = {
  width: '100%',
  height: '100%',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: 'var(--osd-font-body)',
  letterSpacing: '-0.015em',
  position: 'relative' as const,
  overflow: 'hidden',
} as const;

// ─── Shared keyframes (injected per page so direct-nav works) ─────────────────
const keyframes = `
  @keyframes vai-fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes vai-fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes vai-pulse {
    0%, 100% { opacity: 0.6; }
    50%      { opacity: 1; }
  }
  @keyframes vai-sweep {
    0%   { transform: translateX(-30%); opacity: 0; }
    20%  { opacity: 1; }
    100% { transform: translateX(130%); opacity: 0; }
  }
`;

const Style = () => <style>{keyframes}</style>;

const fadeUp = (delayMs: number) =>
  ({
    animation: `vai-fadeUp 700ms cubic-bezier(0.2, 0.7, 0.2, 1) ${delayMs}ms both`,
  }) as const;

const fadeIn = (delayMs: number) =>
  ({
    animation: `vai-fadeIn 800ms ease-out ${delayMs}ms both`,
  }) as const;

// ─── Decorative grid background ───────────────────────────────────────────────
const GridBg = ({ opacity = 0.04 }: { opacity?: number }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      backgroundImage:
        'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
      backgroundSize: '80px 80px',
      opacity,
      pointerEvents: 'none',
    }}
  />
);

const GlowBlob = ({
  top,
  left,
  size = 720,
  color = 'var(--osd-accent)',
  opacity = 0.18,
}: {
  top?: number | string;
  left?: number | string;
  size?: number;
  color?: string;
  opacity?: number;
}) => (
  <div
    style={{
      position: 'absolute',
      top,
      left,
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle at center, ${color} 0%, transparent 60%)`,
      filter: 'blur(40px)',
      opacity,
      pointerEvents: 'none',
    }}
  />
);

// ─── 01 · Cover ───────────────────────────────────────────────────────────────
const Cover: Page = () => (
  <div
    style={{
      ...fill,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '0 160px',
    }}
  >
    <Style />
    <GridBg opacity={0.05} />
    <GlowBlob top={-200} left={1200} size={900} opacity={0.22} />
    <GlowBlob top={600} left={-200} size={700} color={palette.pink} opacity={0.1} />

    <div
      style={{
        ...fadeUp(0),
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        fontSize: 24,
        letterSpacing: '0.28em',
        color: palette.muted,
        textTransform: 'uppercase',
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: 'var(--osd-accent)',
          boxShadow: '0 0 24px var(--osd-accent)',
          animation: 'vai-pulse 2.4s ease-in-out infinite',
        }}
      />
      Introducing
    </div>

    <h1
      style={{
        ...fadeUp(120),
        fontFamily: 'var(--osd-font-display)',
        fontSize: 'var(--osd-size-hero)',
        fontWeight: 800,
        lineHeight: 1.0,
        margin: '40px 0 0',
        letterSpacing: '-0.04em',
      }}
    >
      Vercel <span style={{ color: 'var(--osd-accent)' }}>AI&nbsp;SDK</span>
    </h1>

    <p
      style={{
        ...fadeUp(260),
        fontSize: 44,
        lineHeight: 1.35,
        color: palette.textSoft,
        margin: '48px 0 0',
        maxWidth: 1300,
        fontWeight: 400,
      }}
    >
      A TypeScript toolkit for building AI-powered apps —{' '}
      <span style={{ color: 'var(--osd-text)', fontWeight: 500 }}>
        one API, any model.
      </span>
    </p>

    <div
      style={{
        ...fadeIn(700),
        position: 'absolute',
        bottom: 72,
        left: 160,
        right: 160,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 22,
        color: palette.muted,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}
    >
      <span>ai-sdk.dev</span>
      <span style={{ display: 'flex', gap: 24 }}>
        <span>v5</span>
        <span style={{ color: palette.dim }}>·</span>
        <span>{new Date().getFullYear()}</span>
      </span>
    </div>
  </div>
);

// ─── 02 · The problem ─────────────────────────────────────────────────────────
const Problem: Page = () => (
  <div style={{ ...fill, padding: 120, display: 'flex', flexDirection: 'column' }}>
    <Style />

    <div
      style={{
        ...fadeUp(0),
        fontSize: 26,
        letterSpacing: '0.28em',
        color: palette.muted,
        textTransform: 'uppercase',
      }}
    >
      <span style={{ color: 'var(--osd-accent)' }}>01</span>
      <span style={{ color: palette.dim, margin: '0 14px' }}>·</span>
      The problem
    </div>

    <div
      style={{
        marginTop: 64,
        display: 'grid',
        gridTemplateColumns: '1.1fr 1fr',
        gap: 100,
        alignItems: 'start',
      }}
    >
      <h2
        style={{
          ...fadeUp(120),
          fontFamily: 'var(--osd-font-display)',
          fontSize: 96,
          fontWeight: 800,
          lineHeight: 1.05,
          margin: 0,
          letterSpacing: '-0.035em',
        }}
      >
        LLM integration
        <br />
        is{' '}
        <span
          style={{
            color: 'var(--osd-accent)',
            fontStyle: 'italic',
            fontWeight: 700,
          }}
        >
          fragmented.
        </span>
      </h2>

      <div
        style={{
          ...fadeUp(260),
          fontSize: 34,
          lineHeight: 1.55,
          color: palette.textSoft,
          paddingTop: 24,
        }}
      >
        Every provider ships its own SDK, its own quirks, its own response shape. Switching
        models means rewriting plumbing — not building product.
      </div>
    </div>

    <div
      style={{
        ...fadeIn(520),
        marginTop: 'auto',
        display: 'flex',
        gap: 24,
        flexWrap: 'wrap',
      }}
    >
      {[
        '@anthropic-ai/sdk',
        'openai',
        '@google/generative-ai',
        '@aws-sdk/client-bedrock-runtime',
        '@mistralai/mistralai',
        'cohere-ai',
        'groq-sdk',
        '…',
      ].map((pkg) => (
        <span
          key={pkg}
          style={{
            fontFamily: font.mono,
            fontSize: 22,
            color: palette.muted,
            padding: '10px 18px',
            border: `1px solid ${palette.border}`,
            borderRadius: 8,
            background: palette.surface,
          }}
        >
          {pkg}
        </span>
      ))}
    </div>
  </div>
);

// ─── 03 · The pitch ───────────────────────────────────────────────────────────
const Pitch: Page = () => (
  <div
    style={{
      ...fill,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      padding: '0 160px',
    }}
  >
    <Style />
    <GridBg opacity={0.04} />
    <GlowBlob top={-100} left={300} size={1200} opacity={0.16} />

    <div
      style={{
        ...fadeUp(0),
        fontSize: 26,
        letterSpacing: '0.28em',
        color: palette.muted,
        textTransform: 'uppercase',
        marginBottom: 56,
      }}
    >
      <span style={{ color: 'var(--osd-accent)' }}>02</span>
      <span style={{ color: palette.dim, margin: '0 14px' }}>·</span>
      The idea
    </div>

    <h2
      style={{
        ...fadeUp(140),
        fontFamily: 'var(--osd-font-display)',
        fontSize: 152,
        fontWeight: 800,
        lineHeight: 1.0,
        letterSpacing: '-0.045em',
        margin: 0,
      }}
    >
      One <span style={{ color: 'var(--osd-accent)' }}>API.</span>
      <br />
      Any model.
    </h2>

    <p
      style={{
        ...fadeUp(320),
        fontSize: 38,
        lineHeight: 1.5,
        color: palette.textSoft,
        margin: '64px 0 0',
        maxWidth: 1300,
        fontWeight: 400,
      }}
    >
      A unified, type-safe surface across 20+ providers. Swap models with a single string —
      the rest of your app stays the same.
    </p>
  </div>
);

// ─── 04 · Code ────────────────────────────────────────────────────────────────
const tokens = {
  k: 'var(--osd-accent)',
  s: palette.green,
  c: palette.muted,
  fn: palette.amber,
  txt: 'var(--osd-text)',
  prop: palette.pink,
};

const codeLine = (i: number, kids: ReactNode) => (
  <div
    key={i}
    style={{
      ...fadeUp(220 + i * 50),
      display: 'grid',
      gridTemplateColumns: '52px 1fr',
      alignItems: 'baseline',
    }}
  >
    <span style={{ color: palette.dim, fontSize: 22, userSelect: 'none' }}>{i + 1}</span>
    <span>{kids}</span>
  </div>
);

const Code: Page = () => (
  <div style={{ ...fill, padding: 120, display: 'flex', flexDirection: 'column' }}>
    <Style />

    <div
      style={{
        ...fadeUp(0),
        fontSize: 26,
        letterSpacing: '0.28em',
        color: palette.muted,
        textTransform: 'uppercase',
      }}
    >
      <span style={{ color: 'var(--osd-accent)' }}>03</span>
      <span style={{ color: palette.dim, margin: '0 14px' }}>·</span>
      Looks like this
    </div>

    <h2
      style={{
        ...fadeUp(120),
        fontFamily: 'var(--osd-font-display)',
        fontSize: 64,
        fontWeight: 700,
        margin: '24px 0 0',
        letterSpacing: '-0.025em',
      }}
    >
      Generate text in five lines.
    </h2>

    <div
      style={{
        ...fadeUp(180),
        marginTop: 56,
        background: palette.surface,
        border: `1px solid ${palette.border}`,
        borderRadius: 'var(--osd-radius)',
        padding: '40px 48px',
        fontFamily: font.mono,
        fontSize: 30,
        lineHeight: 1.7,
        position: 'relative',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 24,
          display: 'flex',
          gap: 8,
        }}
      >
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
          <span
            key={c}
            style={{ width: 12, height: 12, borderRadius: '50%', background: c, opacity: 0.6 }}
          />
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          top: 14,
          right: 24,
          fontSize: 18,
          color: palette.muted,
          letterSpacing: '0.1em',
        }}
      >
        app.ts
      </div>

      <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {codeLine(
          0,
          <>
            <span style={{ color: tokens.k }}>import</span>
            <span style={{ color: tokens.txt }}> {'{ '}</span>
            <span style={{ color: tokens.fn }}>generateText</span>
            <span style={{ color: tokens.txt }}> {'} '}</span>
            <span style={{ color: tokens.k }}>from</span>
            <span style={{ color: tokens.s }}> 'ai'</span>
            <span style={{ color: tokens.txt }}>;</span>
          </>,
        )}
        {codeLine(1, <span style={{ color: tokens.txt }}> </span>)}
        {codeLine(
          2,
          <>
            <span style={{ color: tokens.k }}>const</span>
            <span style={{ color: tokens.txt }}> {'{ '}text {'} '}</span>
            <span style={{ color: tokens.k }}>=</span>
            <span style={{ color: tokens.txt }}> </span>
            <span style={{ color: tokens.k }}>await</span>
            <span style={{ color: tokens.txt }}> </span>
            <span style={{ color: tokens.fn }}>generateText</span>
            <span style={{ color: tokens.txt }}>{'({'}</span>
          </>,
        )}
        {codeLine(
          3,
          <>
            <span style={{ color: tokens.txt }}>{'  '}</span>
            <span style={{ color: tokens.prop }}>model</span>
            <span style={{ color: tokens.txt }}>: </span>
            <span style={{ color: tokens.s }}>'anthropic/claude-sonnet-4.5'</span>
            <span style={{ color: tokens.txt }}>,</span>
          </>,
        )}
        {codeLine(
          4,
          <>
            <span style={{ color: tokens.txt }}>{'  '}</span>
            <span style={{ color: tokens.prop }}>prompt</span>
            <span style={{ color: tokens.txt }}>: </span>
            <span style={{ color: tokens.s }}>'Explain the AI SDK in one sentence.'</span>
            <span style={{ color: tokens.txt }}>,</span>
          </>,
        )}
        {codeLine(5, <span style={{ color: tokens.txt }}>{'});'}</span>)}
      </div>
    </div>

    <div
      style={{
        ...fadeIn(700),
        marginTop: 36,
        fontSize: 24,
        color: palette.muted,
        letterSpacing: '0.04em',
      }}
    >
      Swap <span style={{ fontFamily: font.mono, color: palette.textSoft }}>'anthropic/…'</span>{' '}
      for <span style={{ fontFamily: font.mono, color: palette.textSoft }}>'openai/gpt-…'</span>{' '}
      and ship. Same shape. Same types.
    </div>
  </div>
);

// ─── 05 · Three layers ────────────────────────────────────────────────────────
const layers = [
  {
    n: 'I',
    name: 'AI SDK Core',
    blurb:
      'Generate text, stream tokens, produce structured objects, call tools, build agents — across every supported provider.',
    keys: ['generateText', 'streamText', 'generateObject', 'tools'],
  },
  {
    n: 'II',
    name: 'AI SDK UI',
    blurb:
      'Framework-agnostic hooks for chat and generative UIs. React, Vue, Svelte, Solid — same hooks, same data.',
    keys: ['useChat', 'useCompletion', 'useObject'],
  },
  {
    n: 'III',
    name: 'AI SDK RSC',
    blurb:
      'React Server Components support: stream UI directly from the server, render tool calls as JSX in real time.',
    keys: ['streamUI', 'createAI', 'render'],
  },
];

const Layers: Page = () => (
  <div style={{ ...fill, padding: 120, display: 'flex', flexDirection: 'column' }}>
    <Style />

    <div
      style={{
        ...fadeUp(0),
        fontSize: 26,
        letterSpacing: '0.28em',
        color: palette.muted,
        textTransform: 'uppercase',
      }}
    >
      <span style={{ color: 'var(--osd-accent)' }}>04</span>
      <span style={{ color: palette.dim, margin: '0 14px' }}>·</span>
      Architecture
    </div>

    <h2
      style={{
        ...fadeUp(120),
        fontFamily: 'var(--osd-font-display)',
        fontSize: 88,
        fontWeight: 800,
        margin: '20px 0 0',
        letterSpacing: '-0.035em',
        lineHeight: 1.05,
      }}
    >
      Three layers,
      <br />
      one toolkit.
    </h2>

    <div
      style={{
        marginTop: 72,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 32,
      }}
    >
      {layers.map((l, i) => (
        <div
          key={l.name}
          style={{
            ...fadeUp(220 + i * 120),
            background: palette.surface,
            border: `1px solid ${palette.border}`,
            borderRadius: 'var(--osd-radius)',
            padding: 40,
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -1,
              left: 40,
              right: 40,
              height: 2,
              background: 'var(--osd-accent)',
              opacity: 0.6,
            }}
          />
          <div
            style={{
              fontFamily: font.mono,
              fontSize: 28,
              color: 'var(--osd-accent)',
              letterSpacing: '0.1em',
            }}
          >
            {l.n}
          </div>
          <div
            style={{
              fontFamily: 'var(--osd-font-display)',
              fontSize: 44,
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            {l.name}
          </div>
          <div
            style={{
              fontSize: 24,
              lineHeight: 1.5,
              color: palette.textSoft,
            }}
          >
            {l.blurb}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 'auto' }}>
            {l.keys.map((k) => (
              <span
                key={k}
                style={{
                  fontFamily: font.mono,
                  fontSize: 18,
                  color: palette.textSoft,
                  padding: '6px 12px',
                  borderRadius: 6,
                  background: palette.accentSoft,
                  border: `1px solid ${palette.border}`,
                }}
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── 06 · What you can build ──────────────────────────────────────────────────
const capabilities = [
  {
    name: 'Streaming chat',
    desc: 'Token-by-token streaming with backpressure handled. Ship a working chat in an afternoon.',
  },
  {
    name: 'Structured output',
    desc: 'Define a Zod schema, get a typed object back. No JSON parsing, no retries on malformed output.',
  },
  {
    name: 'Tool calling',
    desc: 'Give the model functions. It picks one, you run it, results stream back into the conversation.',
  },
  {
    name: 'Multi-step agents',
    desc: 'Loop tools, reasoning, and generation until the model decides it’s done. Built in, no glue code.',
  },
];

const Capabilities: Page = () => (
  <div style={{ ...fill, padding: 120, display: 'flex', flexDirection: 'column' }}>
    <Style />

    <div
      style={{
        ...fadeUp(0),
        fontSize: 26,
        letterSpacing: '0.28em',
        color: palette.muted,
        textTransform: 'uppercase',
      }}
    >
      <span style={{ color: 'var(--osd-accent)' }}>05</span>
      <span style={{ color: palette.dim, margin: '0 14px' }}>·</span>
      Capabilities
    </div>

    <h2
      style={{
        ...fadeUp(120),
        fontFamily: 'var(--osd-font-display)',
        fontSize: 80,
        fontWeight: 800,
        margin: '20px 0 56px',
        letterSpacing: '-0.035em',
      }}
    >
      What you can build.
    </h2>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 28,
      }}
    >
      {capabilities.map((c, i) => (
        <div
          key={c.name}
          style={{
            ...fadeUp(220 + i * 100),
            background: palette.surface,
            border: `1px solid ${palette.border}`,
            borderRadius: 'var(--osd-radius)',
            padding: '36px 40px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              fontFamily: 'var(--osd-font-display)',
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            <span
              style={{
                fontFamily: font.mono,
                fontSize: 22,
                color: 'var(--osd-accent)',
                fontWeight: 500,
                letterSpacing: '0.1em',
              }}
            >
              0{i + 1}
            </span>
            <span>{c.name}</span>
          </div>
          <div style={{ fontSize: 26, lineHeight: 1.5, color: palette.textSoft }}>
            {c.desc}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── 07 · Providers ───────────────────────────────────────────────────────────
const providers = [
  'Anthropic',
  'OpenAI',
  'Google',
  'Vertex AI',
  'Azure',
  'AWS Bedrock',
  'xAI',
  'Mistral',
  'Groq',
  'Cohere',
  'DeepSeek',
  'Together',
  'Fireworks',
  'Perplexity',
  'Replicate',
  'Ollama',
  'OpenRouter',
  'Cerebras',
  'Hugging Face',
  '+ more',
];

const Providers: Page = () => (
  <div style={{ ...fill, padding: 120, display: 'flex', flexDirection: 'column' }}>
    <Style />

    <div
      style={{
        ...fadeUp(0),
        fontSize: 26,
        letterSpacing: '0.28em',
        color: palette.muted,
        textTransform: 'uppercase',
      }}
    >
      <span style={{ color: 'var(--osd-accent)' }}>06</span>
      <span style={{ color: palette.dim, margin: '0 14px' }}>·</span>
      Providers
    </div>

    <div
      style={{
        ...fadeUp(120),
        display: 'flex',
        alignItems: 'baseline',
        gap: 28,
        margin: '20px 0 0',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 80,
          fontWeight: 800,
          margin: 0,
          letterSpacing: '-0.035em',
        }}
      >
        Plug in <span style={{ color: 'var(--osd-accent)' }}>any</span> provider.
      </h2>
      <span
        style={{
          fontFamily: font.mono,
          fontSize: 26,
          color: palette.muted,
          letterSpacing: '0.05em',
        }}
      >
        20+ supported
      </span>
    </div>

    <div
      style={{
        marginTop: 64,
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 16,
      }}
    >
      {providers.map((p, i) => (
        <div
          key={p}
          style={{
            ...fadeUp(180 + i * 25),
            padding: '24px 20px',
            border: `1px solid ${palette.border}`,
            borderRadius: 12,
            background: palette.surface,
            fontSize: 28,
            fontWeight: 500,
            color: p === '+ more' ? 'var(--osd-accent)' : palette.textSoft,
            textAlign: 'center',
            letterSpacing: '-0.01em',
          }}
        >
          {p}
        </div>
      ))}
    </div>

    <div
      style={{
        ...fadeIn(900),
        marginTop: 'auto',
        fontFamily: font.mono,
        fontSize: 22,
        color: palette.muted,
      }}
    >
      <span style={{ color: palette.dim }}>$</span> npm i ai @ai-sdk/anthropic
    </div>
  </div>
);

// ─── 08 · Closing ─────────────────────────────────────────────────────────────
const Closing: Page = () => (
  <div
    style={{
      ...fill,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      padding: '0 160px',
    }}
  >
    <Style />
    <GridBg opacity={0.04} />
    <GlowBlob top={200} left={400} size={1100} opacity={0.18} />

    <div
      style={{
        ...fadeUp(0),
        fontSize: 26,
        letterSpacing: '0.28em',
        color: palette.muted,
        textTransform: 'uppercase',
        marginBottom: 48,
      }}
    >
      Start shipping
    </div>

    <h2
      style={{
        ...fadeUp(120),
        fontFamily: 'var(--osd-font-display)',
        fontSize: 168,
        fontWeight: 800,
        lineHeight: 1.0,
        letterSpacing: '-0.045em',
        margin: 0,
      }}
    >
      Build with <span style={{ color: 'var(--osd-accent)' }}>AI.</span>
    </h2>

    <p
      style={{
        ...fadeUp(280),
        fontSize: 38,
        lineHeight: 1.5,
        color: palette.textSoft,
        margin: '48px 0 0',
        maxWidth: 1200,
      }}
    >
      Pick a provider. Pick a model. Pick a layer. The AI SDK gets out of the way.
    </p>

    <div
      style={{
        ...fadeIn(560),
        marginTop: 80,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 18,
        padding: '20px 32px',
        border: `1px solid ${palette.borderBright}`,
        borderRadius: 999,
        fontFamily: font.mono,
        fontSize: 28,
        color: 'var(--osd-text)',
        background: palette.accentSoft,
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: 'var(--osd-accent)',
          boxShadow: '0 0 16px var(--osd-accent)',
        }}
      />
      ai-sdk.dev/docs
    </div>
  </div>
);

export const meta: SlideMeta = { title: 'Vercel AI SDK' };
export default [Cover, Problem, Pitch, Code, Layers, Capabilities, Providers, Closing] satisfies Page[];
