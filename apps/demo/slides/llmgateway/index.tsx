import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';
import type { ReactNode } from 'react';

export const design: DesignSystem = {
  palette: {
    bg: '#0a0a12',
    text: '#ededf4',
    accent: '#a78bfa',
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

const palette = {
  surface: '#12121a',
  surfaceHi: '#1a1a26',
  border: 'rgba(255,255,255,0.08)',
  borderBright: 'rgba(255,255,255,0.16)',
  textSoft: '#cccddc',
  muted: '#7d7e8f',
  dim: '#42434f',
  accentSoft: 'rgba(167,139,250,0.14)',
  green: '#7ee787',
  pink: '#ff9eb5',
  amber: '#fbbf24',
  blue: '#60a5fa',
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

const keyframes = `
  @keyframes llg-fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes llg-fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes llg-pulse {
    0%, 100% { opacity: 0.55; }
    50%      { opacity: 1; }
  }
  @keyframes llg-drift {
    0%   { transform: translateY(0px); }
    50%  { transform: translateY(-12px); }
    100% { transform: translateY(0px); }
  }
`;

const Style = () => <style>{keyframes}</style>;

const fadeUp = (delayMs: number) =>
  ({
    animation: `llg-fadeUp 700ms cubic-bezier(0.2, 0.7, 0.2, 1) ${delayMs}ms both`,
  }) as const;

const fadeIn = (delayMs: number) =>
  ({
    animation: `llg-fadeIn 800ms ease-out ${delayMs}ms both`,
  }) as const;

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

const eyebrow = (n: string, label: string) => (
  <div
    style={{
      ...fadeUp(0),
      fontSize: 26,
      letterSpacing: '0.28em',
      color: palette.muted,
      textTransform: 'uppercase',
    }}
  >
    <span style={{ color: 'var(--osd-accent)' }}>{n}</span>
    <span style={{ color: palette.dim, margin: '0 14px' }}>·</span>
    {label}
  </div>
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
    <GlowBlob top={-200} left={1200} size={900} opacity={0.28} />
    <GlowBlob top={600} left={-200} size={700} color={palette.blue} opacity={0.14} />

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
          animation: 'llg-pulse 2.4s ease-in-out infinite',
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
      LLM<span style={{ color: 'var(--osd-accent)' }}>Gateway</span>
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
      Every model behind <span style={{ color: 'var(--osd-text)', fontWeight: 500 }}>one key</span>{' '}
      — and <span style={{ color: 'var(--osd-text)', fontWeight: 500 }}>one</span> API surface.
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
      <span>llmgateway.io</span>
      <span style={{ display: 'flex', gap: 24 }}>
        <span>AI SDK provider</span>
        <span style={{ color: palette.dim }}>·</span>
        <span>{new Date().getFullYear()}</span>
      </span>
    </div>
  </div>
);

// ─── 02 · The problem ─────────────────────────────────────────────────────────
const ProviderChip = ({
  name,
  delay,
  dim = false,
}: {
  name: string;
  delay: number;
  dim?: boolean;
}) => (
  <div
    style={{
      ...fadeUp(delay),
      padding: '20px 28px',
      border: `1px solid ${dim ? palette.border : palette.borderBright}`,
      borderRadius: 12,
      background: dim ? 'transparent' : palette.surface,
      fontFamily: font.mono,
      fontSize: 26,
      color: dim ? palette.muted : palette.textSoft,
      letterSpacing: '-0.005em',
    }}
  >
    {name}
  </div>
);

const Problem: Page = () => (
  <div style={{ ...fill, padding: 120, display: 'flex', flexDirection: 'column' }}>
    <Style />

    {eyebrow('01', 'The problem')}

    <h2
      style={{
        ...fadeUp(120),
        fontFamily: 'var(--osd-font-display)',
        fontSize: 96,
        fontWeight: 800,
        margin: '24px 0 0',
        letterSpacing: '-0.035em',
        lineHeight: 1.05,
      }}
    >
      Five providers.{' '}
      <span style={{ color: palette.muted }}>Five SDKs. Five keys. Five bills.</span>
    </h2>

    <div
      style={{
        ...fadeIn(280),
        marginTop: 52,
        fontSize: 32,
        color: palette.textSoft,
        maxWidth: 1400,
        lineHeight: 1.5,
      }}
    >
      Want to A/B test Claude against GPT against Gemini? You're juggling separate accounts,
      separate billing portals, and a different client per provider.
    </div>

    <div
      style={{
        marginTop: 64,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        maxWidth: 1600,
      }}
    >
      <ProviderChip name="@anthropic-ai/sdk" delay={360} />
      <ProviderChip name="openai" delay={400} />
      <ProviderChip name="@google/genai" delay={440} />
      <ProviderChip name="groq-sdk" delay={480} />
      <ProviderChip name="@mistralai/mistralai" delay={520} />
      <ProviderChip name="…" delay={560} dim />
    </div>

    <div
      style={{
        ...fadeIn(720),
        marginTop: 'auto',
        fontFamily: font.mono,
        fontSize: 22,
        color: palette.muted,
      }}
    >
      <span style={{ color: palette.dim }}>$</span> npm i {'@anthropic-ai/sdk openai @google/genai'}
      …
    </div>
  </div>
);

// ─── 03 · The pitch ───────────────────────────────────────────────────────────
const Pitch: Page = () => (
  <div
    style={{
      ...fill,
      padding: 120,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}
  >
    <Style />
    <GlowBlob top={-100} left={1300} size={800} opacity={0.18} />

    {eyebrow('02', 'The pitch')}

    <h2
      style={{
        ...fadeUp(120),
        fontFamily: 'var(--osd-font-display)',
        fontSize: 140,
        fontWeight: 800,
        margin: '40px 0 0',
        letterSpacing: '-0.04em',
        lineHeight: 1.0,
      }}
    >
      One <span style={{ color: 'var(--osd-accent)' }}>gateway</span>.
      <br />
      Every model.
    </h2>

    <p
      style={{
        ...fadeUp(280),
        fontSize: 36,
        lineHeight: 1.5,
        color: palette.textSoft,
        margin: '56px 0 0',
        maxWidth: 1500,
      }}
    >
      LLMGateway proxies every major provider behind a single endpoint, a single API key, and a
      single invoice. Drop in a Vercel AI SDK provider and you're routed to OpenAI, Anthropic,
      Google, Groq — whichever you ask for.
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
  blue: palette.blue,
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

    {eyebrow('03', 'Looks like this')}

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
      Drop-in Vercel AI SDK provider.
    </h2>

    <div
      style={{
        ...fadeUp(180),
        marginTop: 48,
        background: palette.surface,
        border: `1px solid ${palette.border}`,
        borderRadius: 'var(--osd-radius)',
        padding: '40px 48px',
        fontFamily: font.mono,
        fontSize: 28,
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
            <span style={{ color: tokens.fn }}>llmgateway</span>
            <span style={{ color: tokens.txt }}> {'} '}</span>
            <span style={{ color: tokens.k }}>from</span>
            <span style={{ color: tokens.s }}> "@llmgateway/ai-sdk-provider"</span>
            <span style={{ color: tokens.txt }}>;</span>
          </>,
        )}
        {codeLine(
          1,
          <>
            <span style={{ color: tokens.k }}>import</span>
            <span style={{ color: tokens.txt }}> {'{ '}</span>
            <span style={{ color: tokens.fn }}>generateText</span>
            <span style={{ color: tokens.txt }}> {'} '}</span>
            <span style={{ color: tokens.k }}>from</span>
            <span style={{ color: tokens.s }}> "ai"</span>
            <span style={{ color: tokens.txt }}>;</span>
          </>,
        )}
        {codeLine(2, <span style={{ color: tokens.txt }}> </span>)}
        {codeLine(
          3,
          <>
            <span style={{ color: tokens.k }}>const</span>
            <span style={{ color: tokens.txt }}>
              {' '}
              {'{ '}text{' }'}
            </span>
            <span style={{ color: tokens.k }}> =</span>
            <span style={{ color: tokens.txt }}> </span>
            <span style={{ color: tokens.k }}>await</span>
            <span style={{ color: tokens.txt }}> </span>
            <span style={{ color: tokens.fn }}>generateText</span>
            <span style={{ color: tokens.txt }}>{'({'}</span>
          </>,
        )}
        {codeLine(
          4,
          <>
            <span style={{ color: tokens.txt }}>{'    '}</span>
            <span style={{ color: tokens.prop }}>model</span>
            <span style={{ color: tokens.txt }}>: </span>
            <span style={{ color: tokens.fn }}>llmgateway</span>
            <span style={{ color: tokens.txt }}>(</span>
            <span style={{ color: tokens.s }}>"gpt-4o"</span>
            <span style={{ color: tokens.txt }}>),</span>
          </>,
        )}
        {codeLine(
          5,
          <>
            <span style={{ color: tokens.txt }}>{'    '}</span>
            <span style={{ color: tokens.prop }}>prompt</span>
            <span style={{ color: tokens.txt }}>: </span>
            <span style={{ color: tokens.s }}>
              "Write a vegetarian lasagna recipe for 4 people."
            </span>
            <span style={{ color: tokens.txt }}>,</span>
          </>,
        )}
        {codeLine(6, <span style={{ color: tokens.txt }}>{'});'}</span>)}
      </div>
    </div>

    <div
      style={{
        ...fadeIn(700),
        marginTop: 32,
        fontSize: 24,
        color: palette.muted,
        letterSpacing: '0.04em',
      }}
    >
      Swap <span style={{ fontFamily: font.mono, color: palette.textSoft }}>"gpt-4o"</span> for{' '}
      <span style={{ fontFamily: font.mono, color: palette.textSoft }}>"claude-sonnet-4.5"</span>{' '}
      and ship. Same shape. Same types.
    </div>
  </div>
);

// ─── 05 · Models ──────────────────────────────────────────────────────────────
const ModelChip = ({ name, delay }: { name: string; delay: number }) => (
  <div
    style={{
      ...fadeUp(delay),
      padding: '22px 24px',
      border: `1px solid ${palette.border}`,
      borderRadius: 12,
      background: palette.surface,
      fontFamily: font.mono,
      fontSize: 24,
      color: palette.textSoft,
      textAlign: 'center',
      letterSpacing: '-0.005em',
    }}
  >
    {name}
  </div>
);

const Models: Page = () => (
  <div style={{ ...fill, padding: 120, display: 'flex', flexDirection: 'column' }}>
    <Style />

    {eyebrow('04', 'Models')}

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
        Pick <span style={{ color: 'var(--osd-accent)' }}>any</span> of them.
      </h2>
      <span
        style={{
          fontFamily: font.mono,
          fontSize: 26,
          color: palette.muted,
          letterSpacing: '0.05em',
        }}
      >
        100+ available
      </span>
    </div>

    <div
      style={{
        marginTop: 56,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
      }}
    >
      <ModelChip name="gpt-4o" delay={200} />
      <ModelChip name="gpt-4o-mini" delay={225} />
      <ModelChip name="o3" delay={250} />
      <ModelChip name="o3-mini" delay={275} />
      <ModelChip name="claude-opus-4.7" delay={300} />
      <ModelChip name="claude-sonnet-4.6" delay={325} />
      <ModelChip name="claude-haiku-4.5" delay={350} />
      <ModelChip name="claude-3-7-sonnet" delay={375} />
      <ModelChip name="gemini-2.5-pro" delay={400} />
      <ModelChip name="gemini-2.5-flash" delay={425} />
      <ModelChip name="grok-4" delay={450} />
      <ModelChip name="grok-3" delay={475} />
      <ModelChip name="llama-3.3-70b" delay={500} />
      <ModelChip name="deepseek-v3" delay={525} />
      <ModelChip name="mistral-large" delay={550} />
      <ModelChip name="qwen-2.5-72b" delay={575} />
    </div>

    <div
      style={{
        ...fadeIn(800),
        marginTop: 'auto',
        fontFamily: font.mono,
        fontSize: 22,
        color: palette.muted,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span style={{ color: palette.dim }}>→</span>
      <span>llmgateway.io/models</span>
    </div>
  </div>
);

// ─── 06 · Closing ─────────────────────────────────────────────────────────────
const Closing: Page = () => (
  <div
    style={{
      ...fill,
      padding: 120,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}
  >
    <Style />
    <GridBg opacity={0.05} />
    <GlowBlob top={-200} left={200} size={900} opacity={0.22} />
    <GlowBlob top={500} left={1100} size={700} color={palette.blue} opacity={0.12} />

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
      Ship
    </div>

    <h2
      style={{
        ...fadeUp(120),
        fontFamily: 'var(--osd-font-display)',
        fontSize: 168,
        fontWeight: 800,
        margin: '40px 0 0',
        letterSpacing: '-0.04em',
        lineHeight: 1.0,
      }}
    >
      One key.
      <br />
      <span style={{ color: 'var(--osd-accent)' }}>Every model.</span>
    </h2>

    <p
      style={{
        ...fadeUp(280),
        fontSize: 40,
        lineHeight: 1.4,
        color: palette.textSoft,
        margin: '56px 0 0',
        maxWidth: 1400,
      }}
    >
      npm i{' '}
      <span style={{ fontFamily: font.mono, color: 'var(--osd-text)' }}>
        @llmgateway/ai-sdk-provider
      </span>
    </p>

    <div
      style={{
        ...fadeIn(560),
        marginTop: 56,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        fontFamily: font.mono,
        fontSize: 28,
        color: palette.textSoft,
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: 'var(--osd-accent)',
          boxShadow: '0 0 28px var(--osd-accent)',
        }}
      />
      llmgateway.io
    </div>
  </div>
);

export const meta: SlideMeta = { title: 'LLMGateway' };
export default [Cover, Problem, Pitch, Code, Models, Closing] satisfies Page[];
