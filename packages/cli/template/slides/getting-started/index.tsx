import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';

import claudeLogo from './assets/claude.svg';
import cloudflareLogo from './assets/cloudflare.svg';
import geminiLogo from './assets/gemini.svg';
import codexLogo from './assets/openai.svg';
import opencodeLogo from './assets/opencode.svg';
import vercelLogo from './assets/vercel.svg';
import zeaburLogo from './assets/zeabur.svg';

// ─── Panel-tweakable design tokens ────────────────────────────────────────────
// Edit live from the Design panel; consumed via `var(--osd-*)` in inline styles.
export const design: DesignSystem = {
  palette: {
    bg: '#08090a',
    text: '#f7f8f8',
    accent: '#7170ff',
  },
  fonts: {
    display: '"Inter", "SF Pro Display", system-ui, -apple-system, sans-serif',
    body: '"Inter", "SF Pro Display", system-ui, -apple-system, sans-serif',
  },
  typeScale: {
    hero: 168,
    body: 36,
  },
  radius: 16,
};

// ─── Local (non-tweakable) constants ──────────────────────────────────────────
// Mirrors of the panel tokens for template-string / arithmetic use, plus the
// secondary palette and the mono font (kept hard-coded — outside what the
// Design panel currently exposes).
const palette = {
  bg: design.palette.bg,
  text: design.palette.text,
  accent: design.palette.accent,
  surface: '#0e0f12',
  surfaceHi: '#14161a',
  surfaceMax: '#1a1c21',
  textSoft: '#c7c9d1',
  muted: '#6f727c',
  dim: '#3e4048',
  border: 'rgba(255,255,255,0.07)',
  borderBright: 'rgba(255,255,255,0.14)',
  accentSoft: '#a3a0ff',
  accent2: '#5e6ad2',
  mint: '#68cc9a',
  amber: '#e0b25c',
  inspect: '#3b82f6',
  inspectFill: 'rgba(59,130,246,0.10)',
};

const font = {
  sans: design.fonts.body,
  display: design.fonts.display,
  mono: '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, monospace',
};

const fill = {
  width: '100%',
  height: '100%',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: 'var(--osd-font-body)',
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
  @keyframes es-blink {
    0%, 49%   { opacity: 1; }
    50%, 100% { opacity: 0; }
  }
  @keyframes gs-type {
    from { width: 0; }
    to   { width: 100%; }
  }
  @keyframes gs-thumbIn {
    from { opacity: 0; transform: translateY(24px) scale(.96); }
    to   { opacity: 1; transform: translateY(0)    scale(1); }
  }
  @keyframes gs-canvasSwap {
    0%   { opacity: 0; transform: scale(.985); filter: blur(6px); }
    60%  { opacity: 1; transform: scale(1);    filter: blur(0); }
    100% { opacity: 1; transform: scale(1);    filter: blur(0); }
  }
  @keyframes gs-crosshair {
    0%   { transform: translate(-60px, 40px); }
    55%  { transform: translate(0, 0); }
    100% { transform: translate(0, 0); }
  }
  @keyframes gs-outline {
    0%, 40% { opacity: 0; transform: scale(1.02); }
    60%     { opacity: 1; transform: scale(1); }
    100%    { opacity: 1; transform: scale(1); }
  }
  @keyframes gs-popover {
    0%, 60% { opacity: 0; transform: translateY(6px) scale(.96); }
    80%     { opacity: 1; transform: translateY(0) scale(1); }
    100%    { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes gs-morph {
    0%, 30% { color: ${palette.text}; text-shadow: 0 0 0 transparent; }
    55%     { color: ${palette.accent}; text-shadow: 0 0 28px ${palette.accent}55; }
    100%    { color: ${palette.accent}; text-shadow: 0 0 0 transparent; }
  }
  @keyframes gs-strike {
    from { background-size: 0 1px; }
    to   { background-size: 100% 1px; }
  }
  @keyframes gs-pulse {
    0%, 100% { box-shadow: 0 0 0 0 ${palette.inspect}00; }
    50%      { box-shadow: 0 0 0 8px ${palette.inspect}22; }
  }
  .es-fadeUp { opacity: 0; animation: es-fadeUp 0.9s cubic-bezier(.2,.7,.2,1) forwards; }
  .es-fadeIn { opacity: 0; animation: es-fadeIn 1.2s ease forwards; }
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
  .gs-type {
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;
    width: 0;
    animation: gs-type 1.6s steps(40, end) forwards;
  }
  .gs-stream { opacity: 0; animation: es-fadeIn .45s ease forwards; }
  .gs-thumbIn  { opacity: 0; animation: gs-thumbIn .75s cubic-bezier(.2,.7,.2,1) forwards; }
  .gs-canvasSwap { opacity: 0; animation: gs-canvasSwap 1.1s cubic-bezier(.2,.7,.2,1) forwards; }
  .gs-crosshair  { animation: gs-crosshair 1.6s cubic-bezier(.2,.7,.2,1) forwards; }
  .gs-outline    { opacity: 0; animation: gs-outline 1.9s cubic-bezier(.2,.7,.2,1) forwards; }
  .gs-popover    { opacity: 0; animation: gs-popover 2.3s cubic-bezier(.2,.7,.2,1) forwards; }
  .gs-morph      { animation: gs-morph 2.4s cubic-bezier(.2,.7,.2,1) forwards; }
  .gs-strike {
    background-image: linear-gradient(${palette.muted}, ${palette.muted});
    background-repeat: no-repeat;
    background-position: left center;
    background-size: 0 1px;
    animation: gs-strike 1s ease forwards;
  }
  .gs-pulse { animation: gs-pulse 2s ease-in-out infinite; }
`;

const Styles = () => <style>{styles}</style>;

// ─── Shared chrome ────────────────────────────────────────────────────────────
const GridBg = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      backgroundImage:
        'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
      backgroundSize: '96px 96px',
      maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 70%)',
      WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 70%)',
    }}
  />
);

const Eyebrow = ({
  children,
  style,
  className,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) => (
  <div
    className={className}
    style={{
      fontFamily: font.mono,
      fontSize: 22,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: palette.muted,
      ...style,
    }}
  >
    {children}
  </div>
);

const TrafficLights = () => (
  <div style={{ display: 'flex', gap: 10 }}>
    {['#ff5f56', '#ffbd2e', '#27c93f'].map((c) => (
      <span
        key={c}
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: c,
          boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.25)`,
        }}
      />
    ))}
  </div>
);

const WindowShell = ({
  title,
  badge,
  children,
  style,
}: {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => (
  <div
    style={{
      background: palette.surface,
      border: `1px solid ${palette.border}`,
      borderRadius: 'var(--osd-radius)',
      boxShadow: '0 40px 80px -30px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.02)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      ...style,
    }}
  >
    <div
      style={{
        height: 52,
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        background: palette.surfaceHi,
        borderBottom: `1px solid ${palette.border}`,
        flexShrink: 0,
      }}
    >
      <TrafficLights />
      <div
        style={{
          flex: 1,
          textAlign: 'center',
          fontFamily: font.mono,
          fontSize: 20,
          color: palette.muted,
          letterSpacing: '0.02em',
        }}
      >
        {title}
      </div>
      <div style={{ minWidth: 40, display: 'flex', justifyContent: 'flex-end' }}>{badge}</div>
    </div>
    {children}
  </div>
);

const SlashCmd = ({ name, color = palette.accent }: { name: string; color?: string }) => (
  <span
    style={{
      fontFamily: font.mono,
      color,
      background: `${color}16`,
      border: `1px solid ${color}40`,
      padding: '2px 10px',
      borderRadius: 6,
      fontWeight: 500,
    }}
  >
    /{name}
  </span>
);

const AgentLine = ({
  speaker,
  children,
  delay,
}: {
  speaker: 'user' | 'assistant' | 'tool';
  children: React.ReactNode;
  delay: number;
}) => {
  const label = speaker === 'user' ? 'you' : speaker === 'assistant' ? 'agent' : 'tool';
  const color =
    speaker === 'user'
      ? palette.mint
      : speaker === 'assistant'
        ? palette.accentSoft
        : palette.amber;
  return (
    <div
      className="gs-stream"
      style={{
        animationDelay: `${delay}s`,
        display: 'flex',
        gap: 18,
        alignItems: 'flex-start',
        padding: '12px 0',
      }}
    >
      <span
        style={{
          flex: '0 0 110px',
          fontFamily: font.mono,
          fontSize: 20,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color,
          paddingTop: 6,
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          fontFamily: font.mono,
          fontSize: 26,
          color: palette.textSoft,
          lineHeight: 1.45,
        }}
      >
        {children}
      </div>
    </div>
  );
};

const LogoCard = ({
  src,
  name,
  delay = 0,
  logoHeight = 72,
}: {
  src: string;
  name: string;
  delay?: number;
  logoHeight?: number;
}) => (
  <div
    className="es-fadeUp"
    style={{
      animationDelay: `${delay}s`,
      flex: 1,
      background: palette.surface,
      border: `1px solid ${palette.border}`,
      borderRadius: 'var(--osd-radius)',
      padding: '40px 28px 32px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 28,
      minHeight: 0,
    }}
  >
    <div
      style={{
        height: logoHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src={src}
        alt={name}
        style={{ height: logoHeight, width: 'auto', objectFit: 'contain' }}
      />
    </div>
    <div
      style={{
        fontFamily: font.mono,
        fontSize: 22,
        color: palette.textSoft,
        letterSpacing: '0.02em',
      }}
    >
      {name}
    </div>
  </div>
);

// ─── Slide 1: Cover ──────────────────────────────────────────────────────────
const Cover: Page = () => (
  <div style={fill}>
    <Styles />
    <GridBg />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '140px 140px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Eyebrow className="es-fadeUp" style={{ animationDelay: '0.05s' }}>
          open-slide · getting started
        </Eyebrow>
        <div
          className="es-fadeUp"
          style={{
            animationDelay: '0.05s',
            fontFamily: font.mono,
            fontSize: 20,
            color: palette.muted,
            border: `1px solid ${palette.border}`,
            padding: '8px 16px',
            borderRadius: 999,
          }}
        >
          v1
        </div>
      </div>

      <div>
        <h1
          className="es-fadeUp"
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 'var(--osd-size-hero)',
            lineHeight: 0.98,
            fontWeight: 600,
            margin: 0,
            letterSpacing: '-0.045em',
            animationDelay: '0.15s',
          }}
        >
          Author slides
          <br />
          <span
            style={{
              background: `linear-gradient(90deg, ${palette.accentSoft}, var(--osd-accent))`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            with your agent.
          </span>
        </h1>
        <p
          className="es-fadeUp"
          style={{
            marginTop: 48,
            maxWidth: 1100,
            fontSize: 'var(--osd-size-body)',
            lineHeight: 1.35,
            color: palette.textSoft,
            animationDelay: '0.35s',
          }}
        >
          Three steps from empty folder to a live, editable slide.
        </p>
      </div>

      <div
        className="es-fadeUp"
        style={{
          animationDelay: '0.55s',
          display: 'flex',
          gap: 48,
          fontFamily: font.mono,
          fontSize: 22,
          color: palette.muted,
        }}
      >
        <span>
          <span style={{ color: palette.accentSoft }}>01</span> init
        </span>
        <span>
          <span style={{ color: palette.accentSoft }}>02</span> prompt
        </span>
        <span>
          <span style={{ color: palette.accentSoft }}>03</span> edit
        </span>
        <span>
          <span style={{ color: palette.accentSoft }}>04</span> assets
        </span>
        <span>
          <span style={{ color: palette.accentSoft }}>05</span> comment
        </span>
      </div>
    </div>
  </div>
);

// ─── Slide 2: Init in a terminal ─────────────────────────────────────────────
type InitLine =
  | { kind: 'blank' }
  | { kind: 'success'; text: string; dim?: string }
  | { kind: 'bold'; text: string }
  | { kind: 'cmd'; text: string }
  | { kind: 'dim'; text: string };

const Init: Page = () => {
  const stream: InitLine[] = [
    { kind: 'blank' },
    {
      kind: 'success',
      text: 'Created open-slide workspace',
      dim: 'in /Users/you/my-slide',
    },
    { kind: 'blank' },
    { kind: 'bold', text: 'Installing dependencies with pnpm…' },
    { kind: 'blank' },
    { kind: 'success', text: 'Initialized git repository with first commit.' },
    { kind: 'blank' },
    { kind: 'bold', text: 'Next steps:' },
    { kind: 'cmd', text: 'cd my-slide' },
    { kind: 'cmd', text: 'pnpm dev' },
    { kind: 'blank' },
    {
      kind: 'dim',
      text: 'Then open the dev server and start authoring in slides/<your-slide>/.',
    },
  ];

  const renderLine = (line: InitLine): React.ReactNode => {
    switch (line.kind) {
      case 'blank':
        return ' ';
      case 'success':
        return (
          <>
            <span style={{ color: palette.mint }}>✔</span>{' '}
            <span style={{ color: palette.text }}>{line.text}</span>
            {line.dim && <span style={{ color: palette.muted }}> {line.dim}</span>}
          </>
        );
      case 'bold':
        return <span style={{ color: palette.text, fontWeight: 600 }}>{line.text}</span>;
      case 'cmd':
        return (
          <>
            {'  '}
            <span style={{ color: palette.accentSoft }}>{line.text}</span>
          </>
        );
      case 'dim':
        return <span style={{ color: palette.muted }}>{line.text}</span>;
    }
  };

  return (
    <div style={fill}>
      <Styles />
      <GridBg />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '100px 140px',
          display: 'flex',
          flexDirection: 'column',
          gap: 48,
        }}
      >
        <div className="es-fadeUp">
          <Eyebrow>01 / Initialize</Eyebrow>
          <h2
            style={{
              marginTop: 20,
              marginBottom: 0,
              fontFamily: 'var(--osd-font-display)',
              fontSize: 88,
              fontWeight: 600,
              letterSpacing: '-0.035em',
              lineHeight: 1.02,
            }}
          >
            One command to scaffold.
          </h2>
          <p
            style={{
              marginTop: 20,
              fontSize: 28,
              color: palette.textSoft,
              letterSpacing: '-0.01em',
            }}
          >
            Installs deps, inits git, drops you at the dev server. No global installs, no Vite
            config to touch.
          </p>
        </div>

        <WindowShell title="~/code — zsh" style={{ flex: 1 }}>
          <div
            style={{
              flex: 1,
              padding: '32px 44px',
              fontFamily: font.mono,
              fontSize: 24,
              lineHeight: 1.45,
              color: palette.textSoft,
              background: palette.surface,
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', gap: 16 }}>
              <span style={{ color: palette.mint }}>$</span>
              <span className="gs-type" style={{ color: palette.text }}>
                npx @open-slide/cli init my-slide
              </span>
            </div>
            <div style={{ height: 16 }} />
            {stream.map((line, i) => (
              <div
                key={i}
                className="gs-stream"
                style={{
                  minHeight: 34,
                  animationDelay: `${1.8 + i * 0.1}s`,
                  whiteSpace: 'pre',
                }}
              >
                {renderLine(line)}
              </div>
            ))}
            <div
              className="gs-stream"
              style={{
                marginTop: 14,
                animationDelay: `${1.8 + stream.length * 0.1 + 0.1}s`,
                display: 'flex',
                gap: 16,
              }}
            >
              <span style={{ color: palette.mint }}>$</span>
              <span className="es-caret" style={{ color: palette.text }} />
            </div>
          </div>
        </WindowShell>
      </div>
    </div>
  );
};

// ─── Slide 3: Prompt → create-slide → pages appear ───────────────────────────
const Prompt: Page = () => {
  const thumbs = ['Cover', 'Agenda', 'Problem', 'Solution', 'Metrics', 'Next'];
  return (
    <div style={fill}>
      <Styles />
      <GridBg />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '90px 120px 100px',
          display: 'flex',
          flexDirection: 'column',
          gap: 36,
        }}
      >
        <div className="es-fadeUp">
          <Eyebrow>02 / Prompt the agent</Eyebrow>
          <h2
            style={{
              marginTop: 20,
              marginBottom: 0,
              fontFamily: 'var(--osd-font-display)',
              fontSize: 88,
              fontWeight: 600,
              letterSpacing: '-0.035em',
              lineHeight: 1.02,
            }}
          >
            Ask. Watch slides appear.
          </h2>
        </div>

        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1fr 1.15fr',
            gap: 40,
            minHeight: 0,
          }}
        >
          {/* LEFT — agent CLI */}
          <WindowShell title="claude · ~/my-slide">
            <div
              style={{
                flex: 1,
                padding: '28px 36px',
                background: palette.surface,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <AgentLine speaker="user" delay={0.3}>
                <div>
                  <SlashCmd name="create-slide" />
                </div>
                <div style={{ marginTop: 10 }}>
                  <span className="gs-type" style={{ maxWidth: '100%', color: palette.text }}>
                    slides about the Q2 launch
                  </span>
                </div>
              </AgentLine>
              <div style={{ height: 1, background: palette.border, margin: '8px 0' }} />
              <AgentLine speaker="assistant" delay={2.0}>
                Drafting 6 pages…
              </AgentLine>
              <AgentLine speaker="tool" delay={2.7}>
                <div style={{ color: palette.muted }}>
                  write <span style={{ color: palette.text }}>slides/q2-launch/index.tsx</span>
                </div>
              </AgentLine>
              <AgentLine speaker="tool" delay={3.4}>
                <div style={{ color: palette.muted }}>
                  hmr <span style={{ color: palette.mint }}>✓</span> localhost:5173 updated
                </div>
              </AgentLine>
              <div style={{ flex: 1 }} />
              <div
                className="gs-stream"
                style={{
                  animationDelay: '4.1s',
                  display: 'flex',
                  gap: 16,
                  fontFamily: font.mono,
                  fontSize: 26,
                  color: palette.muted,
                }}
              >
                <span style={{ color: palette.accentSoft }}>{'>'}</span>
                <span className="es-caret" />
              </div>
            </div>
          </WindowShell>

          {/* RIGHT — browser preview */}
          <WindowShell title="localhost:5173/s/q2-launch">
            <div
              style={{
                flex: 1,
                display: 'flex',
                background: palette.surface,
                minHeight: 0,
              }}
            >
              {/* Thumbnail rail */}
              <div
                style={{
                  width: 220,
                  padding: '20px 14px',
                  borderRight: `1px solid ${palette.border}`,
                  background: palette.surfaceHi,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  overflow: 'hidden',
                }}
              >
                {thumbs.map((label, i) => (
                  <div
                    key={label}
                    className="gs-thumbIn"
                    style={{
                      animationDelay: `${1.2 + i * 0.25}s`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: 8,
                      borderRadius: 10,
                      border: `1px solid ${i === 0 ? palette.accent : palette.border}`,
                      background: i === 0 ? `${palette.accent}12` : palette.surface,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: font.mono,
                        fontSize: 16,
                        color: palette.muted,
                        width: 22,
                      }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 66,
                        borderRadius: 6,
                        background: `linear-gradient(135deg, ${palette.surfaceMax}, ${palette.bg})`,
                        border: `1px solid ${palette.border}`,
                        padding: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{
                          height: 6,
                          width: '60%',
                          background: palette.textSoft,
                          opacity: 0.55,
                          borderRadius: 2,
                        }}
                      />
                      <div
                        style={{
                          height: 4,
                          width: '40%',
                          background: palette.muted,
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Canvas */}
              <div
                style={{
                  flex: 1,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 40,
                }}
              >
                <div
                  className="gs-canvasSwap"
                  style={{
                    animationDelay: `${1.2 + thumbs.length * 0.25 + 0.2}s`,
                    width: '100%',
                    height: '100%',
                    borderRadius: 14,
                    border: `1px solid ${palette.border}`,
                    background: `radial-gradient(ellipse at 30% 30%, ${palette.accent2}22, transparent 60%), ${palette.bg}`,
                    padding: 48,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.02)',
                  }}
                >
                  <Eyebrow style={{ fontSize: 14 }}>cover</Eyebrow>
                  <div>
                    <div
                      style={{
                        fontSize: 64,
                        fontWeight: 600,
                        letterSpacing: '-0.035em',
                        lineHeight: 1.02,
                      }}
                    >
                      Q2 Launch
                    </div>
                    <div
                      style={{
                        marginTop: 16,
                        fontSize: 22,
                        color: palette.textSoft,
                        maxWidth: 560,
                      }}
                    >
                      What we're shipping, why it matters, and how we'll measure success.
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontFamily: font.mono,
                      fontSize: 14,
                      color: palette.muted,
                    }}
                  >
                    <span>acme · product</span>
                    <span>01 / 06</span>
                  </div>
                </div>
              </div>
            </div>
          </WindowShell>
        </div>
      </div>
    </div>
  );
};

// ─── Slide: Visual editor (click → tweak → save) ─────────────────────────────
const VisualEdit: Page = () => {
  return (
    <div style={fill}>
      <Styles />
      <GridBg />
      <style>{`
        @keyframes ve-saveSwap {
          0%, 88% { opacity: 1; transform: translateY(0); }
          92%     { opacity: 0; transform: translateY(-4px); }
          100%    { opacity: 0; transform: translateY(-4px); }
        }
        @keyframes ve-savedIn {
          0%, 88% { opacity: 0; transform: translateY(4px); }
          100%    { opacity: 1; transform: translateY(0); }
        }
        @keyframes ve-swatchPulse {
          0%, 100% { box-shadow: 0 0 0 0 ${palette.accent}00; transform: scale(1); }
          50%      { box-shadow: 0 0 0 6px ${palette.accent}33; transform: scale(1.06); }
        }
        .ve-saveSwap  { animation: ve-saveSwap  3.6s ease forwards; }
        .ve-savedIn   { animation: ve-savedIn   3.6s ease forwards; }
        .ve-swatchPulse { animation: ve-swatchPulse 1.6s ease-in-out 1.0s 1 both; }
      `}</style>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '90px 120px 100px',
          display: 'flex',
          flexDirection: 'column',
          gap: 36,
        }}
      >
        <div className="es-fadeUp">
          <Eyebrow>03 / Edit visually</Eyebrow>
          <h2
            style={{
              marginTop: 20,
              marginBottom: 0,
              fontFamily: 'var(--osd-font-display)',
              fontSize: 88,
              fontWeight: 600,
              letterSpacing: '-0.035em',
              lineHeight: 1.02,
            }}
          >
            Click. Tweak. Save.
          </h2>
          <p
            style={{
              marginTop: 20,
              fontSize: 28,
              color: palette.textSoft,
              maxWidth: 1280,
            }}
          >
            Pick any element. Change text, font, color, or swap an image — right on the canvas.
            Edits buffer until you hit{' '}
            <span style={{ fontFamily: font.mono, color: palette.accentSoft }}>Save</span>.
          </p>
        </div>

        <WindowShell
          title="localhost:5173/s/q2-launch"
          badge={
            <span
              className="gs-pulse"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                background: `${palette.inspect}22`,
                border: `1px solid ${palette.inspect}`,
                borderRadius: 8,
                fontFamily: font.mono,
                fontSize: 20,
                color: palette.inspect,
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: palette.inspect,
                }}
              />
              Inspect on
            </span>
          }
          style={{ flex: 1, minHeight: 0 }}
        >
          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: '1fr 360px',
              background: palette.surface,
              minHeight: 0,
            }}
          >
            {/* LEFT — canvas with selection + SaveBar */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 40,
                borderRight: `1px solid ${palette.border}`,
                minHeight: 0,
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 14,
                  border: `1px solid ${palette.border}`,
                  background: `radial-gradient(ellipse at 30% 30%, ${palette.accent2}22, transparent 60%), ${palette.bg}`,
                  padding: 56,
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Eyebrow style={{ fontSize: 14 }}>cover</Eyebrow>
                <div
                  style={{
                    position: 'relative',
                    marginTop: 20,
                    display: 'inline-block',
                    width: 'fit-content',
                  }}
                >
                  <div
                    className="gs-outline"
                    style={{
                      position: 'absolute',
                      inset: -10,
                      border: `2px solid ${palette.inspect}`,
                      background: palette.inspectFill,
                      borderRadius: 6,
                      pointerEvents: 'none',
                      animationDelay: '0.6s',
                    }}
                  />
                  <div
                    className="gs-morph"
                    style={{
                      animationDelay: '1.4s',
                      fontSize: 88,
                      fontWeight: 600,
                      letterSpacing: '-0.035em',
                      lineHeight: 1.02,
                      color: palette.text,
                      position: 'relative',
                    }}
                  >
                    Q2 Launch
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 18,
                    fontSize: 24,
                    color: palette.textSoft,
                    maxWidth: 620,
                  }}
                >
                  What we're shipping, why it matters, and how we'll measure success.
                </div>

                {/* Crosshair cursor */}
                <div
                  className="gs-crosshair"
                  style={{
                    position: 'absolute',
                    left: 220,
                    top: 200,
                    width: 28,
                    height: 28,
                    pointerEvents: 'none',
                    animationDelay: '0.2s',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      width: '100%',
                      height: 2,
                      background: palette.inspect,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      width: 2,
                      height: '100%',
                      background: palette.inspect,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: '25%',
                      border: `2px solid ${palette.inspect}`,
                      borderRadius: '50%',
                      background: 'transparent',
                    }}
                  />
                </div>

                {/* SaveBar pill */}
                <div
                  className="es-fadeUp"
                  style={{
                    animationDelay: '2.0s',
                    position: 'absolute',
                    left: '50%',
                    bottom: 28,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '6px 6px 6px 16px',
                      borderRadius: 999,
                      background: `${palette.surfaceHi}f0`,
                      border: `1px solid ${palette.borderBright}`,
                      boxShadow: '0 24px 48px -16px rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(8px)',
                      fontFamily: font.sans,
                      fontSize: 18,
                      color: palette.text,
                      minHeight: 40,
                    }}
                  >
                    <span
                      className="ve-saveSwap"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>1 unsaved change</span>
                      <span
                        style={{
                          fontFamily: font.mono,
                          fontSize: 15,
                          color: palette.muted,
                          padding: '6px 12px',
                          borderRadius: 999,
                        }}
                      >
                        ↺ Discard
                      </span>
                      <span
                        style={{
                          fontFamily: font.sans,
                          fontSize: 15,
                          fontWeight: 500,
                          color: palette.text,
                          background: palette.accent,
                          padding: '6px 14px',
                          borderRadius: 999,
                        }}
                      >
                        ⤓ Save
                      </span>
                    </span>
                    <span
                      className="ve-savedIn"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        color: palette.text,
                        fontWeight: 500,
                      }}
                    >
                      <span style={{ color: palette.mint, fontSize: 18 }}>✓</span>
                      Saved
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT — inspector property panel mock */}
            <div
              style={{
                background: palette.surfaceHi,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '20px 22px 14px',
                  borderBottom: `1px solid ${palette.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontFamily: font.mono,
                  fontSize: 18,
                  color: palette.muted,
                }}
              >
                <span style={{ color: palette.textSoft, letterSpacing: '0.02em' }}>
                  &lt;h1&gt; · line 58
                </span>
                <span style={{ color: palette.dim }}>✕</span>
              </div>

              <PanelSection title="Content">
                <div
                  style={{
                    background: palette.surface,
                    border: `1px solid ${palette.border}`,
                    borderRadius: 8,
                    padding: '12px 14px',
                    fontFamily: font.sans,
                    fontSize: 18,
                    color: palette.text,
                    minHeight: 64,
                  }}
                >
                  Q2 Launch
                </div>
              </PanelSection>

              <PanelDivider />

              <PanelSection title="Typography">
                <PanelRow label="Size">
                  <div
                    style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 3,
                      background: palette.surfaceMax,
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '38%',
                        background: palette.accent,
                        borderRadius: 3,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        left: '38%',
                        top: '50%',
                        width: 14,
                        height: 14,
                        marginLeft: -7,
                        marginTop: -7,
                        borderRadius: '50%',
                        background: palette.text,
                        border: `2px solid ${palette.accent}`,
                      }}
                    />
                  </div>
                  <PanelInput value="88px" />
                </PanelRow>
                <PanelRow label="Weight">
                  <PanelSelect value="Semibold · 600" />
                </PanelRow>
              </PanelSection>

              <PanelDivider />

              <PanelSection title="Color">
                <PanelRow label="Color">
                  <div
                    className="ve-swatchPulse"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: palette.accent,
                      border: `1px solid ${palette.borderBright}`,
                    }}
                  />
                  <PanelInput value={palette.accent} />
                </PanelRow>
                <PanelRow label="Background">
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: 'transparent',
                      border: `1px dashed ${palette.dim}`,
                    }}
                  />
                  <PanelInput value="—" dim />
                </PanelRow>
              </PanelSection>

              <PanelDivider />

              <PanelSection title="Image">
                <div
                  style={{
                    fontFamily: font.mono,
                    fontSize: 15,
                    color: palette.dim,
                  }}
                >
                  No image on this element.
                </div>
              </PanelSection>
            </div>
          </div>
        </WindowShell>
      </div>
    </div>
  );
};

// ─── Slide: Assets manager ───────────────────────────────────────────────────
const AssetsManager: Page = () => {
  const cards: { name: string; size: string; src: string }[] = [
    { name: 'claude.svg', size: '3.4 KB', src: claudeLogo },
    { name: 'openai.svg', size: '2.1 KB', src: codexLogo },
    { name: 'gemini.svg', size: '4.0 KB', src: geminiLogo },
    { name: 'opencode.svg', size: '5.2 KB', src: opencodeLogo },
    { name: 'cloudflare.svg', size: '6.8 KB', src: cloudflareLogo },
    { name: 'zeabur.svg', size: '4.7 KB', src: zeaburLogo },
  ];

  const svglResults: { name: string; src: string }[] = [
    { name: 'Vercel', src: vercelLogo },
    { name: 'Cloudflare', src: cloudflareLogo },
    { name: 'Zeabur', src: zeaburLogo },
  ];

  return (
    <div style={fill}>
      <Styles />
      <GridBg />
      <style>{`
        @keyframes am-marchingAnts {
          to { background-position: 16px 0, -16px 0, 0 16px, 0 -16px; }
        }
        @keyframes am-overlayLoop {
          0%, 8%   { opacity: 0; }
          14%, 38% { opacity: 1; }
          44%, 100% { opacity: 0; }
        }
        @keyframes am-newCardIn {
          0%, 50% { opacity: 0; transform: translateY(12px) scale(.96); }
          70%     { opacity: 1; transform: translateY(0) scale(1); }
          100%    { opacity: 1; transform: translateY(0) scale(1); }
        }
        .am-overlay {
          background-image:
            linear-gradient(90deg, ${palette.borderBright} 50%, transparent 0),
            linear-gradient(90deg, ${palette.borderBright} 50%, transparent 0),
            linear-gradient(0deg, ${palette.borderBright} 50%, transparent 0),
            linear-gradient(0deg, ${palette.borderBright} 50%, transparent 0);
          background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
          background-size: 16px 1px, 16px 1px, 1px 16px, 1px 16px;
          background-position: 0 0, 0 100%, 0 0, 100% 0;
          animation: am-marchingAnts 0.9s linear infinite, am-overlayLoop 4.5s ease-in-out 1.6s infinite;
        }
        .am-overlayPill { animation: am-overlayLoop 4.5s ease-in-out 1.6s infinite; }
        .am-newCard { opacity: 0; animation: am-newCardIn 4.5s ease-in-out 1.6s infinite; }
      `}</style>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '90px 120px 100px',
          display: 'flex',
          flexDirection: 'column',
          gap: 36,
        }}
      >
        <div className="es-fadeUp">
          <Eyebrow>04 / Manage assets</Eyebrow>
          <h2
            style={{
              marginTop: 20,
              marginBottom: 0,
              fontFamily: 'var(--osd-font-display)',
              fontSize: 88,
              fontWeight: 600,
              letterSpacing: '-0.035em',
              lineHeight: 1.02,
            }}
          >
            Drop images. Pull in logos.
          </h2>
          <p
            style={{
              marginTop: 20,
              fontSize: 28,
              color: palette.textSoft,
              maxWidth: 1280,
            }}
          >
            Drag files into the deck — or search{' '}
            <span style={{ fontFamily: font.mono, color: palette.accentSoft }}>svgl</span> for a
            brand logo. Rename, replace, or delete without leaving the editor.
          </p>
        </div>

        <WindowShell title="localhost:5173/s/q2-launch · assets" style={{ flex: 1, minHeight: 0 }}>
          <div
            style={{
              flex: 1,
              background: palette.surface,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              position: 'relative',
            }}
          >
            {/* Toolbar: Slides/Assets switcher + Upload */}
            <div
              style={{
                padding: '20px 28px',
                borderBottom: `1px solid ${palette.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  background: palette.surfaceHi,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 999,
                  padding: 4,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 4,
                    left: 'calc(50% + 0px)',
                    width: 'calc(50% - 4px)',
                    bottom: 4,
                    background: `${palette.accent}22`,
                    border: `1px solid ${palette.accent}`,
                    borderRadius: 999,
                    transition: 'left 200ms ease',
                  }}
                />
                <span
                  style={{
                    position: 'relative',
                    padding: '8px 22px',
                    fontFamily: font.mono,
                    fontSize: 18,
                    color: palette.muted,
                  }}
                >
                  Slides
                </span>
                <span
                  style={{
                    position: 'relative',
                    padding: '8px 22px',
                    fontFamily: font.mono,
                    fontSize: 18,
                    color: palette.accentSoft,
                  }}
                >
                  Assets
                </span>
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 18px',
                  background: palette.surfaceHi,
                  border: `1px solid ${palette.borderBright}`,
                  borderRadius: 10,
                  fontFamily: font.sans,
                  fontSize: 18,
                  color: palette.text,
                }}
              >
                <span style={{ color: palette.accentSoft }}>↑</span>
                Upload
              </div>
            </div>

            {/* Grid */}
            <div
              style={{
                flex: 1,
                padding: '28px 32px',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gridAutoRows: 'min-content',
                gap: 22,
                minHeight: 0,
                alignContent: 'start',
              }}
            >
              {cards.map((c, i) => (
                <AssetCardMock
                  key={c.name}
                  name={c.name}
                  size={c.size}
                  src={c.src}
                  className="gs-thumbIn"
                  delay={0.3 + i * 0.08}
                />
              ))}
              <AssetCardMock
                key="vercel-new"
                name="vercel.svg"
                size="3.2 KB"
                src={vercelLogo}
                className="am-newCard"
                accent
              />
            </div>

            {/* Drag-drop overlay (loops) */}
            <div
              className="am-overlay"
              style={{
                position: 'absolute',
                inset: 12,
                pointerEvents: 'none',
                borderRadius: 14,
                background: `${palette.bg}26`,
              }}
            />
            <div
              className="am-overlayPill"
              style={{
                position: 'absolute',
                left: '50%',
                bottom: 36,
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 20px',
                  borderRadius: 999,
                  background: `${palette.surfaceHi}f0`,
                  border: `1px solid ${palette.borderBright}`,
                  boxShadow: '0 18px 36px -12px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(8px)',
                  fontFamily: font.sans,
                  fontSize: 18,
                  color: palette.textSoft,
                }}
              >
                <span style={{ color: palette.accentSoft }}>↓</span>
                Drop to upload
              </div>
            </div>

            {/* svgl Logo Search dialog (popovers in late) */}
            <div
              className="gs-popover"
              style={{
                position: 'absolute',
                right: 36,
                bottom: 36,
                width: 420,
                background: palette.surfaceHi,
                border: `1px solid ${palette.borderBright}`,
                borderRadius: 14,
                padding: 18,
                boxShadow: '0 40px 80px -24px rgba(0,0,0,0.7)',
                animationDelay: '3.4s',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontFamily: font.mono,
                  fontSize: 15,
                  color: palette.muted,
                  marginBottom: 10,
                }}
              >
                <span>Search svgl</span>
                <span style={{ color: palette.dim }}>✕</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: palette.surface,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontFamily: font.mono,
                  fontSize: 17,
                  color: palette.text,
                  marginBottom: 14,
                }}
              >
                <span style={{ color: palette.muted }}>⌕</span>
                vercel
                <span className="es-caret" style={{ color: palette.text }} />
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 10,
                }}
              >
                {svglResults.map((r, i) => (
                  <div
                    key={r.name}
                    style={{
                      background: palette.surface,
                      border: `1px solid ${i === 0 ? palette.accent : palette.border}`,
                      borderRadius: 10,
                      padding: '14px 8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <img
                        src={r.src}
                        alt={r.name}
                        style={{ height: 32, width: 'auto', objectFit: 'contain' }}
                      />
                    </div>
                    <div
                      style={{
                        fontFamily: font.mono,
                        fontSize: 13,
                        color: palette.textSoft,
                      }}
                    >
                      {r.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </WindowShell>
      </div>
    </div>
  );
};

// ─── Inspector panel mock helpers ────────────────────────────────────────────
const PanelSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ padding: '16px 22px' }}>
    <div
      style={{
        marginBottom: 12,
        fontFamily: font.mono,
        fontSize: 12,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: palette.muted,
      }}
    >
      {title}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
  </div>
);

const PanelDivider = () => <div style={{ height: 1, background: palette.border }} />;

const PanelRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '80px 1fr',
      alignItems: 'center',
      gap: 12,
    }}
  >
    <span
      style={{
        fontFamily: font.sans,
        fontSize: 14,
        color: palette.muted,
      }}
    >
      {label}
    </span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{children}</div>
  </div>
);

const PanelInput = ({ value, dim = false }: { value: string; dim?: boolean }) => (
  <div
    style={{
      flex: 1,
      background: palette.surface,
      border: `1px solid ${palette.border}`,
      borderRadius: 6,
      padding: '6px 10px',
      fontFamily: font.mono,
      fontSize: 14,
      color: dim ? palette.dim : palette.text,
      minHeight: 28,
    }}
  >
    {value}
  </div>
);

const PanelSelect = ({ value }: { value: string }) => (
  <div
    style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: palette.surface,
      border: `1px solid ${palette.border}`,
      borderRadius: 6,
      padding: '6px 10px',
      fontFamily: font.sans,
      fontSize: 14,
      color: palette.text,
      minHeight: 28,
    }}
  >
    <span>{value}</span>
    <span style={{ color: palette.muted, fontSize: 12 }}>▾</span>
  </div>
);

// ─── Asset card mock ─────────────────────────────────────────────────────────
const AssetCardMock = ({
  name,
  size,
  src,
  className,
  delay = 0,
  accent = false,
}: {
  name: string;
  size: string;
  src: string;
  className?: string;
  delay?: number;
  accent?: boolean;
}) => (
  <div
    className={className}
    style={{
      animationDelay: `${delay}s`,
      borderRadius: 12,
      border: `1px solid ${accent ? palette.accent : palette.border}`,
      background: palette.surfaceHi,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: accent ? `0 0 0 3px ${palette.accent}22` : 'none',
    }}
  >
    <div
      style={{
        height: 130,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'repeating-conic-gradient(#1a1c2155 0deg 90deg, transparent 90deg 180deg) 0 0 / 16px 16px',
      }}
    >
      <img src={src} alt="" style={{ height: 64, width: 'auto', objectFit: 'contain' }} />
    </div>
    <div
      style={{
        padding: '10px 14px',
        borderTop: `1px solid ${palette.border}`,
        background: palette.surfaceHi,
      }}
    >
      <div
        style={{
          fontFamily: font.sans,
          fontSize: 16,
          color: palette.text,
          letterSpacing: '-0.005em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontFamily: font.mono,
          fontSize: 12,
          color: palette.muted,
          marginTop: 2,
        }}
      >
        {size}
      </div>
    </div>
  </div>
);

// ─── Slide: Inspect a block ──────────────────────────────────────────────────
const Inspect: Page = () => (
  <div style={fill}>
    <Styles />
    <GridBg />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '90px 120px 100px',
        display: 'flex',
        flexDirection: 'column',
        gap: 36,
      }}
    >
      <div className="es-fadeUp">
        <Eyebrow>05 / Inspect &amp; comment</Eyebrow>
        <h2
          style={{
            marginTop: 20,
            marginBottom: 0,
            fontFamily: 'var(--osd-font-display)',
            fontSize: 88,
            fontWeight: 600,
            letterSpacing: '-0.035em',
            lineHeight: 1.02,
          }}
        >
          Point at what's wrong.
        </h2>
        <p
          style={{
            marginTop: 20,
            fontSize: 28,
            color: palette.textSoft,
          }}
        >
          Toggle inspect, click a block, leave a note. The tool drops a{' '}
          <span style={{ fontFamily: font.mono, color: palette.accentSoft }}>@slide-comment</span>{' '}
          marker in your source.
        </p>
      </div>

      <WindowShell
        title="localhost:5173/s/q2-launch"
        badge={
          <span
            className="gs-pulse"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              background: `${palette.inspect}22`,
              border: `1px solid ${palette.inspect}`,
              borderRadius: 8,
              fontFamily: font.mono,
              fontSize: 20,
              color: palette.inspect,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: palette.inspect,
              }}
            />
            Inspect on
          </span>
        }
        style={{ flex: 1, minHeight: 0 }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            background: palette.surface,
            position: 'relative',
            minHeight: 0,
          }}
        >
          {/* Thumbnail rail (static) */}
          <div
            style={{
              width: 200,
              padding: '20px 14px',
              borderRight: `1px solid ${palette.border}`,
              background: palette.surfaceHi,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 80,
                  borderRadius: 8,
                  border: `1px solid ${i === 0 ? palette.accent : palette.border}`,
                  background: i === 0 ? `${palette.accent}10` : palette.surface,
                }}
              />
            ))}
          </div>

          {/* Canvas with inspect overlay */}
          <div
            style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 60,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 14,
                border: `1px solid ${palette.border}`,
                background: `radial-gradient(ellipse at 30% 30%, ${palette.accent2}22, transparent 60%), ${palette.bg}`,
                padding: 56,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Eyebrow style={{ fontSize: 14 }}>cover</Eyebrow>
              <div
                style={{
                  position: 'relative',
                  marginTop: 20,
                  display: 'inline-block',
                  width: 'fit-content',
                }}
              >
                {/* Inspect outline */}
                <div
                  className="gs-outline"
                  style={{
                    position: 'absolute',
                    inset: -10,
                    border: `2px solid ${palette.inspect}`,
                    background: palette.inspectFill,
                    borderRadius: 6,
                    pointerEvents: 'none',
                  }}
                />
                <div
                  style={{
                    fontSize: 72,
                    fontWeight: 600,
                    letterSpacing: '-0.035em',
                    lineHeight: 1.02,
                    color: palette.text,
                    position: 'relative',
                  }}
                >
                  Q2 Launch
                </div>
              </div>
              <div
                style={{
                  marginTop: 18,
                  fontSize: 24,
                  color: palette.textSoft,
                  maxWidth: 620,
                }}
              >
                What we're shipping, why it matters, and how we'll measure success.
              </div>

              {/* Crosshair cursor (approaches target) */}
              <div
                className="gs-crosshair"
                style={{
                  position: 'absolute',
                  left: 240,
                  top: 220,
                  width: 28,
                  height: 28,
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    width: '100%',
                    height: 2,
                    background: palette.inspect,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    width: 2,
                    height: '100%',
                    background: palette.inspect,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: '25%',
                    border: `2px solid ${palette.inspect}`,
                    borderRadius: '50%',
                    background: 'transparent',
                  }}
                />
              </div>

              {/* Comment popover */}
              <div
                className="gs-popover"
                style={{
                  position: 'absolute',
                  left: 320,
                  top: 240,
                  width: 380,
                  background: palette.surfaceHi,
                  border: `1px solid ${palette.borderBright}`,
                  borderRadius: 12,
                  padding: 18,
                  boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6)',
                  transformOrigin: 'top left',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontFamily: font.mono,
                    fontSize: 15,
                    color: palette.muted,
                    marginBottom: 12,
                  }}
                >
                  <span>Line 58 · Comment</span>
                  <span style={{ color: palette.dim }}>✕</span>
                </div>
                <div
                  style={{
                    background: palette.surface,
                    border: `1px solid ${palette.border}`,
                    borderRadius: 8,
                    padding: '14px 14px',
                    fontSize: 20,
                    color: palette.text,
                    minHeight: 78,
                    lineHeight: 1.4,
                  }}
                >
                  <span className="gs-type" style={{ maxWidth: '100%' }}>
                    use the accent color on this title
                  </span>
                  <span className="es-caret" style={{ color: palette.text }} />
                </div>
                <div
                  style={{
                    marginTop: 12,
                    fontFamily: font.mono,
                    fontSize: 13,
                    color: palette.muted,
                    textAlign: 'right',
                  }}
                >
                  ⌘ / Ctrl + Enter to submit
                </div>
              </div>
            </div>
          </div>
        </div>
      </WindowShell>
    </div>
  </div>
);

// ─── Slide 5: Apply comments ─────────────────────────────────────────────────
const Apply: Page = () => (
  <div style={fill}>
    <Styles />
    <GridBg />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '90px 120px 100px',
        display: 'flex',
        flexDirection: 'column',
        gap: 36,
      }}
    >
      <div className="es-fadeUp">
        <Eyebrow>06 / Apply comments</Eyebrow>
        <h2
          style={{
            marginTop: 20,
            marginBottom: 0,
            fontFamily: 'var(--osd-font-display)',
            fontSize: 88,
            fontWeight: 600,
            letterSpacing: '-0.035em',
            lineHeight: 1.02,
          }}
        >
          Agent reads markers. Edits apply live.
        </h2>
      </div>

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          gap: 40,
          minHeight: 0,
        }}
      >
        {/* LEFT — agent CLI + code */}
        <WindowShell title="claude · ~/my-slide">
          <div
            style={{
              flex: 1,
              background: palette.surface,
              padding: '28px 36px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            <AgentLine speaker="user" delay={0.2}>
              <SlashCmd name="apply-comments" color={palette.amber} />
            </AgentLine>
            <AgentLine speaker="assistant" delay={1.0}>
              1 marker found. Applying…
            </AgentLine>

            {/* Code snippet with marker being struck-through */}
            <div
              className="gs-stream"
              style={{
                animationDelay: '1.8s',
                marginTop: 8,
                background: palette.bg,
                border: `1px solid ${palette.border}`,
                borderRadius: 10,
                padding: '18px 22px',
                fontFamily: font.mono,
                fontSize: 18,
                lineHeight: 1.55,
                color: palette.textSoft,
                overflow: 'hidden',
              }}
            >
              <div style={{ color: palette.muted }}>
                <span style={{ color: palette.dim, marginRight: 14 }}>57</span>
                &lt;section&gt;
              </div>
              <div
                className="gs-strike"
                style={{
                  color: palette.muted,
                  animationDelay: '2.8s',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  paddingRight: 8,
                }}
              >
                <span style={{ color: palette.dim, marginRight: 14 }}>58</span>
                {'{/* '}
                <span style={{ color: palette.accentSoft }}>@slide-comment</span> id=
                <span style={{ color: palette.mint }}>"c-a1b2c3d4"</span> ts=
                <span style={{ color: palette.mint }}>"2026-04-20T10:15:00.000Z"</span> text=
                <span style={{ color: palette.mint }}>"eyJub3RlIjoi…"</span> {'*/}'}
              </div>
              <div>
                <span style={{ color: palette.dim, marginRight: 14 }}>59</span>
                &lt;h1 style={'{{'} color:{' '}
                <span
                  className="gs-morph"
                  style={{
                    animationDelay: '3.2s',
                    color: palette.text,
                  }}
                >
                  '{palette.accent}'
                </span>
                {' }}'}&gt;Q2 Launch&lt;/h1&gt;
              </div>
              <div style={{ color: palette.muted }}>
                <span style={{ color: palette.dim, marginRight: 14 }}>60</span>
                &lt;/section&gt;
              </div>
            </div>

            <AgentLine speaker="tool" delay={3.8}>
              <div style={{ color: palette.muted }}>
                edit <span style={{ color: palette.text }}>slides/q2-launch/index.tsx</span>{' '}
                <span style={{ color: palette.mint }}>✓ 1 comment applied</span>
              </div>
            </AgentLine>
            <div style={{ flex: 1 }} />
          </div>
        </WindowShell>

        {/* RIGHT — browser canvas morphs */}
        <WindowShell title="localhost:5173/s/q2-launch">
          <div
            style={{
              flex: 1,
              background: palette.surface,
              display: 'flex',
              padding: 40,
              minHeight: 0,
            }}
          >
            <div
              style={{
                flex: 1,
                borderRadius: 14,
                border: `1px solid ${palette.border}`,
                background: `radial-gradient(ellipse at 30% 30%, ${palette.accent2}22, transparent 60%), ${palette.bg}`,
                padding: 56,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Eyebrow style={{ fontSize: 14 }}>cover</Eyebrow>
              <div
                className="gs-morph"
                style={{
                  animationDelay: '3.2s',
                  marginTop: 20,
                  fontSize: 84,
                  fontWeight: 600,
                  letterSpacing: '-0.035em',
                  lineHeight: 1.02,
                  color: palette.text,
                }}
              >
                Q2 Launch
              </div>
              <div
                style={{
                  marginTop: 18,
                  fontSize: 24,
                  color: palette.textSoft,
                  maxWidth: 620,
                }}
              >
                What we're shipping, why it matters, and how we'll measure success.
              </div>
              <div
                className="gs-stream"
                style={{
                  animationDelay: '3.6s',
                  marginTop: 40,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 12px',
                  borderRadius: 999,
                  background: `${palette.mint}18`,
                  border: `1px solid ${palette.mint}55`,
                  color: palette.mint,
                  fontFamily: font.mono,
                  fontSize: 16,
                  width: 'fit-content',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: palette.mint,
                  }}
                />
                hmr · updated
              </div>
            </div>
          </div>
        </WindowShell>
      </div>
    </div>
  </div>
);

// ─── Slide: Themes ───────────────────────────────────────────────────────────
const Themes: Page = () => {
  const themes = [
    {
      id: 'editorial-noir',
      mode: 'dark · serif',
      bg: '#0b0d10',
      text: '#f4ecdc',
      accent: '#d6a64b',
      muted: '#7a7468',
      titleFont: "'Georgia', 'Source Serif Pro', serif",
      sample: 'A quiet year.',
    },
    {
      id: 'paper-press',
      mode: 'light · serif',
      bg: '#f6f1e7',
      text: '#141210',
      accent: '#c43a1d',
      muted: '#8a8276',
      titleFont: "'Times New Roman', serif",
      sample: 'Field notes.',
    },
    {
      id: 'neon-terminal',
      mode: 'dark · mono',
      bg: '#05070a',
      text: '#e6edf3',
      accent: '#39ff88',
      muted: '#4a5560',
      titleFont: font.mono,
      sample: '$ boot.',
    },
  ];

  return (
    <div style={fill}>
      <Styles />
      <GridBg />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '140px 140px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Eyebrow className="es-fadeUp">themes · /create-theme</Eyebrow>

        <div className="es-fadeUp" style={{ animationDelay: '0.15s' }}>
          <h2
            style={{
              fontSize: 132,
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 0.98,
              margin: 0,
              maxWidth: 1500,
            }}
          >
            Pin your look once,{' '}
            <span
              style={{
                background: `linear-gradient(90deg, ${palette.accentSoft}, ${palette.accent})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              reuse it everywhere.
            </span>
          </h2>
          <p
            style={{
              marginTop: 28,
              fontSize: 28,
              lineHeight: 1.45,
              color: palette.textSoft,
              maxWidth: 1380,
            }}
          >
            Each{' '}
            <code style={{ fontFamily: font.mono, color: palette.accentSoft }}>
              themes/&lt;id&gt;.md
            </code>{' '}
            describes one visual identity — palette, typography, fixed Title and Footer.{' '}
            <code style={{ fontFamily: font.mono, color: palette.accentSoft }}>/create-slide</code>{' '}
            picks one before authoring; every page in the deck stays consistent.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 28,
          }}
        >
          {themes.map((t, i) => (
            <div
              key={t.id}
              className="es-fadeUp"
              style={{
                animationDelay: `${0.35 + i * 0.12}s`,
                borderRadius: 18,
                border: `1px solid ${palette.border}`,
                background: t.bg,
                padding: '32px 32px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: 22,
                minHeight: 320,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  fontFamily: font.mono,
                  fontSize: 18,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                <span style={{ color: t.accent }}>{t.id}</span>
                <span style={{ color: t.muted }}>{t.mode}</span>
              </div>

              <div
                style={{
                  fontFamily: t.titleFont,
                  fontSize: 64,
                  fontWeight: 700,
                  lineHeight: 1.04,
                  color: t.text,
                  letterSpacing: '-0.015em',
                }}
              >
                {t.sample}
              </div>

              <div style={{ flex: 1 }} />

              <div style={{ display: 'flex', gap: 8 }}>
                {[t.bg, t.text, t.accent, t.muted].map((c) => (
                  <span
                    key={c}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: c,
                      border: '1px solid rgba(255,255,255,0.10)',
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          className="es-fadeUp"
          style={{
            animationDelay: '0.85s',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: font.mono,
            fontSize: 22,
            color: palette.muted,
          }}
        >
          <span>
            extract from a slide, image, or prose —{' '}
            <span style={{ color: palette.text }}>/create-theme</span>
          </span>
          <span>themes/*.md</span>
        </div>
      </div>
    </div>
  );
};

// ─── Slide 6: Recap ──────────────────────────────────────────────────────────
const Recap: Page = () => {
  const steps = [
    { n: '01', title: 'init', caption: 'npx @open-slide/cli init' },
    { n: '02', title: 'prompt', caption: 'create-slide' },
    { n: '03', title: 'edit', caption: 'click → save' },
    { n: '04', title: 'assets', caption: 'drag · drop · svgl' },
    { n: '05', title: 'comment', caption: 'apply-comments' },
  ];
  return (
    <div style={fill}>
      <Styles />
      <GridBg />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '140px 140px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Eyebrow className="es-fadeUp">recap</Eyebrow>

        <div className="es-fadeUp" style={{ animationDelay: '0.15s' }}>
          <h2
            style={{
              fontFamily: 'var(--osd-font-display)',
              fontSize: 160,
              fontWeight: 600,
              letterSpacing: '-0.045em',
              lineHeight: 0.98,
              margin: 0,
            }}
          >
            That's the
            <br />
            <span
              style={{
                background: `linear-gradient(90deg, ${palette.accentSoft}, ${palette.accent})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              whole loop.
            </span>
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 20,
          }}
        >
          {steps.map((s, i) => (
            <div
              key={s.n}
              className="es-fadeUp"
              style={{
                animationDelay: `${0.35 + i * 0.1}s`,
                padding: '24px 24px',
                border: `1px solid ${palette.border}`,
                borderRadius: 14,
                background: palette.surface,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div
                style={{
                  fontFamily: font.mono,
                  fontSize: 20,
                  color: palette.accentSoft,
                  letterSpacing: '0.12em',
                }}
              >
                {s.n}
              </div>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                }}
              >
                {s.title}
              </div>
              <div
                style={{
                  fontFamily: font.mono,
                  fontSize: 18,
                  color: palette.muted,
                }}
              >
                {s.caption}
              </div>
            </div>
          ))}
        </div>

        <div
          className="es-fadeUp"
          style={{
            animationDelay: '0.75s',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: font.mono,
            fontSize: 22,
            color: palette.muted,
          }}
        >
          <span>
            edit <span style={{ color: palette.text }}>slides/&lt;your-slide&gt;/index.tsx</span> —
            HMR does the rest
          </span>
          <span>open-slide</span>
        </div>
      </div>
    </div>
  );
};

// ─── Slide: Agent agnostic ───────────────────────────────────────────────────
const AgentAgnostic: Page = () => {
  const agents = [
    { name: 'Claude Code', src: claudeLogo },
    { name: 'Codex', src: codexLogo },
    { name: 'Gemini CLI', src: geminiLogo },
    { name: 'opencode', src: opencodeLogo },
  ];
  return (
    <div style={fill}>
      <Styles />
      <GridBg />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '110px 140px',
          display: 'flex',
          flexDirection: 'column',
          gap: 56,
        }}
      >
        <div className="es-fadeUp">
          <Eyebrow>why open-slide · 01</Eyebrow>
          <h2
            style={{
              marginTop: 24,
              marginBottom: 0,
              fontFamily: 'var(--osd-font-display)',
              fontSize: 120,
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1.0,
            }}
          >
            Bring your{' '}
            <span
              style={{
                background: `linear-gradient(90deg, ${palette.accentSoft}, ${palette.accent})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              favorite agent.
            </span>
          </h2>
          <p
            style={{
              marginTop: 28,
              maxWidth: 1280,
              fontSize: 32,
              lineHeight: 1.4,
              color: palette.textSoft,
              letterSpacing: '-0.01em',
            }}
          >
            open-slide speaks plain React and a file-convention protocol. Any agent can author and
            edit slides — no lock-in, no bespoke SDK.
          </p>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            gap: 28,
            minHeight: 0,
          }}
        >
          {agents.map((a, i) => (
            <LogoCard
              key={a.name}
              src={a.src}
              name={a.name}
              delay={0.25 + i * 0.1}
              logoHeight={96}
            />
          ))}
        </div>

        <div
          className="es-fadeUp"
          style={{
            animationDelay: '0.8s',
            fontFamily: font.mono,
            fontSize: 22,
            color: palette.muted,
            textAlign: 'center',
          }}
        >
          …and anything else that can write files.
        </div>
      </div>
    </div>
  );
};

// ─── Slide: Free layout ──────────────────────────────────────────────────────
const FreeLayout: Page = () => {
  const mockSlide = (
    kind: 'hero' | 'split' | 'bleed' | 'grid' | 'quote' | 'bullets',
  ): React.ReactNode => {
    const base: React.CSSProperties = {
      width: '100%',
      height: '100%',
      borderRadius: 12,
      border: `1px solid ${palette.border}`,
      background: `radial-gradient(ellipse at 30% 30%, ${palette.accent2}1f, transparent 60%), ${palette.bg}`,
      padding: 26,
      display: 'flex',
      overflow: 'hidden',
      position: 'relative',
    };
    if (kind === 'hero') {
      return (
        <div style={{ ...base, flexDirection: 'column', justifyContent: 'center' }}>
          <div
            style={{
              fontSize: 44,
              fontWeight: 600,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              color: palette.text,
            }}
          >
            Ship
            <br />
            <span style={{ color: palette.accentSoft }}>louder.</span>
          </div>
        </div>
      );
    }
    if (kind === 'split') {
      return (
        <div style={{ ...base, padding: 0 }}>
          <div
            style={{
              flex: 1,
              padding: 22,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                height: 8,
                width: '70%',
                background: palette.textSoft,
                opacity: 0.7,
                borderRadius: 2,
              }}
            />
            <div style={{ height: 6, width: '55%', background: palette.muted, borderRadius: 2 }} />
            <div style={{ height: 6, width: '60%', background: palette.muted, borderRadius: 2 }} />
            <div style={{ height: 6, width: '40%', background: palette.muted, borderRadius: 2 }} />
          </div>
          <div
            style={{
              flex: 1,
              background: `linear-gradient(135deg, ${palette.accent}55, ${palette.accent2}33)`,
            }}
          />
        </div>
      );
    }
    if (kind === 'bleed') {
      return (
        <div
          style={{
            ...base,
            padding: 0,
            background: `linear-gradient(160deg, ${palette.accentSoft}55, ${palette.accent2}33 40%, ${palette.bg} 100%)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 22,
              bottom: 22,
              right: 22,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div
              style={{
                height: 7,
                width: '45%',
                background: palette.text,
                opacity: 0.95,
                borderRadius: 2,
              }}
            />
            <div
              style={{
                height: 5,
                width: '65%',
                background: palette.textSoft,
                opacity: 0.75,
                borderRadius: 2,
              }}
            />
          </div>
        </div>
      );
    }
    if (kind === 'grid') {
      return (
        <div
          style={{
            ...base,
            padding: 22,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(3, 1fr)',
            gap: 8,
          }}
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              style={{
                borderRadius: 4,
                background: i % 4 === 0 ? `${palette.accent}44` : palette.surfaceMax,
                border: `1px solid ${palette.border}`,
              }}
            />
          ))}
        </div>
      );
    }
    if (kind === 'quote') {
      return (
        <div
          style={{
            ...base,
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: 30,
          }}
        >
          <div
            style={{
              fontSize: 40,
              color: palette.muted,
              lineHeight: 1,
              marginBottom: 6,
              fontFamily: font.mono,
            }}
          >
            “
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              color: palette.textSoft,
            }}
          >
            Any layout.
            <br />
            Any time.
          </div>
        </div>
      );
    }
    return (
      <div
        style={{
          ...base,
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 12,
          paddingLeft: 32,
        }}
      >
        {['— prompt. write. ship.', '— no templates.', '— no themes.', '— zero friction.'].map(
          (t, i) => (
            <div
              key={i}
              style={{
                fontFamily: font.mono,
                fontSize: 18,
                color: i === 0 ? palette.accentSoft : palette.textSoft,
                letterSpacing: '-0.01em',
              }}
            >
              {t}
            </div>
          ),
        )}
      </div>
    );
  };

  const kinds: Array<'hero' | 'split' | 'bleed' | 'grid' | 'quote' | 'bullets'> = [
    'hero',
    'split',
    'bleed',
    'grid',
    'quote',
    'bullets',
  ];

  return (
    <div style={fill}>
      <Styles />
      <GridBg />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '110px 140px',
          display: 'flex',
          flexDirection: 'column',
          gap: 48,
        }}
      >
        <div className="es-fadeUp">
          <Eyebrow>why open-slide · 02</Eyebrow>
          <h2
            style={{
              marginTop: 24,
              marginBottom: 0,
              fontFamily: 'var(--osd-font-display)',
              fontSize: 120,
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1.0,
            }}
          >
            No templates.{' '}
            <span
              style={{
                background: `linear-gradient(90deg, ${palette.accentSoft}, ${palette.accent})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              No opinions.
            </span>
          </h2>
          <p
            style={{
              marginTop: 28,
              maxWidth: 1280,
              fontSize: 32,
              lineHeight: 1.4,
              color: palette.textSoft,
              letterSpacing: '-0.01em',
            }}
          >
            Zero layouts. Zero slide types. Zero "themes". Each page is just a React component on a
            1920×1080 canvas — the agent decides everything.
          </p>
        </div>

        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            gap: 28,
            minHeight: 0,
          }}
        >
          {kinds.map((k, i) => (
            <div key={k} className="gs-thumbIn" style={{ animationDelay: `${0.25 + i * 0.09}s` }}>
              {mockSlide(k)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Slide: Git-tracked, yours forever ───────────────────────────────────────
const GitTracked: Page = () => {
  const commits = [
    {
      hash: 'a1b2c3d',
      head: '(HEAD -> main)',
      msg: 'refine cover typography',
    },
    {
      hash: '9f8e7d6',
      head: '',
      msg: 'revise Q2 metrics from finance review',
    },
    {
      hash: '6a5b4c3',
      head: '',
      msg: 'initial draft of Q2 launch deck',
    },
  ];

  const properties = [
    { label: 'plain .tsx files', caption: 'no proprietary format' },
    { label: 'diffable in any tool', caption: 'review like any other PR' },
    { label: 'branch · merge · revert', caption: 'the tools you already know' },
  ];

  return (
    <div style={fill}>
      <Styles />
      <GridBg />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '90px 120px 100px',
          display: 'flex',
          flexDirection: 'column',
          gap: 40,
        }}
      >
        <div className="es-fadeUp">
          <Eyebrow>why open-slide · 03</Eyebrow>
          <h2
            style={{
              marginTop: 20,
              marginBottom: 0,
              fontFamily: 'var(--osd-font-display)',
              fontSize: 104,
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1.0,
            }}
          >
            Your slides are{' '}
            <span
              style={{
                background: `linear-gradient(90deg, ${palette.accentSoft}, ${palette.accent})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              yours. Forever.
            </span>
          </h2>
          <p
            style={{
              marginTop: 20,
              fontSize: 28,
              color: palette.textSoft,
              maxWidth: 1280,
              letterSpacing: '-0.01em',
            }}
          >
            Every slide is a file in your repo. No proprietary database. No SaaS lock-in. No
            export-to-PDF-and-pray.
          </p>
        </div>

        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1.25fr 1fr',
            gap: 36,
            minHeight: 0,
          }}
        >
          <WindowShell title="~/my-slide — git log">
            <div
              style={{
                flex: 1,
                background: palette.surface,
                padding: '32px 40px',
                fontFamily: font.mono,
                fontSize: 22,
                lineHeight: 1.65,
                color: palette.textSoft,
                overflow: 'hidden',
              }}
            >
              <div style={{ color: palette.muted, marginBottom: 14 }}>
                <span style={{ color: palette.mint }}>$</span> git log --oneline slides/q2-launch/
              </div>
              {commits.map((c, i) => (
                <div
                  key={c.hash}
                  className="gs-stream"
                  style={{
                    animationDelay: `${0.4 + i * 0.25}s`,
                    display: 'flex',
                    gap: 14,
                    padding: '6px 0',
                  }}
                >
                  <span style={{ color: palette.amber }}>*</span>
                  <span style={{ color: palette.accentSoft }}>{c.hash}</span>
                  {c.head && <span style={{ color: palette.mint }}>{c.head}</span>}
                  <span style={{ color: palette.text }}>{c.msg}</span>
                </div>
              ))}
              <div
                className="gs-stream"
                style={{
                  animationDelay: '1.25s',
                  marginTop: 22,
                  display: 'flex',
                  gap: 14,
                  color: palette.muted,
                }}
              >
                <span style={{ color: palette.mint }}>$</span>
                <span className="es-caret" style={{ color: palette.text }} />
              </div>
            </div>
          </WindowShell>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              minHeight: 0,
            }}
          >
            {properties.map((p, i) => (
              <div
                key={p.label}
                className="es-fadeUp"
                style={{
                  animationDelay: `${0.5 + i * 0.12}s`,
                  flex: 1,
                  padding: '28px 32px',
                  borderRadius: 14,
                  border: `1px solid ${palette.border}`,
                  background: palette.surface,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: palette.accent,
                      boxShadow: `0 0 16px ${palette.accent}`,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: font.mono,
                      fontSize: 28,
                      color: palette.text,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {p.label}
                  </span>
                </div>
                <div
                  style={{
                    paddingLeft: 24,
                    fontSize: 22,
                    color: palette.muted,
                  }}
                >
                  {p.caption}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Slide: Deploy anywhere ──────────────────────────────────────────────────
const DeployAnywhere: Page = () => {
  const hosts = [
    { name: 'Vercel', src: vercelLogo },
    { name: 'Cloudflare', src: cloudflareLogo },
    { name: 'Zeabur', src: zeaburLogo },
  ];
  return (
    <div style={fill}>
      <Styles />
      <GridBg />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '110px 140px',
          display: 'flex',
          flexDirection: 'column',
          gap: 48,
        }}
      >
        <div className="es-fadeUp">
          <Eyebrow>why open-slide · 04</Eyebrow>
          <h2
            style={{
              marginTop: 24,
              marginBottom: 0,
              fontFamily: 'var(--osd-font-display)',
              fontSize: 104,
              fontWeight: 600,
              letterSpacing: '-0.04em',
              lineHeight: 1.0,
            }}
          >
            Ship it{' '}
            <span
              style={{
                background: `linear-gradient(90deg, ${palette.accentSoft}, ${palette.accent})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              anywhere.
            </span>
          </h2>
          <p
            style={{
              marginTop: 24,
              maxWidth: 1280,
              fontSize: 32,
              lineHeight: 1.4,
              color: palette.textSoft,
              letterSpacing: '-0.01em',
            }}
          >
            open-slide builds to plain static assets. Drop them on Vercel, Cloudflare, Zeabur — or
            any server that serves HTML.
          </p>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            gap: 32,
            minHeight: 0,
          }}
        >
          {hosts.map((h, i) => (
            <LogoCard
              key={h.name}
              src={h.src}
              name={h.name}
              delay={0.25 + i * 0.12}
              logoHeight={104}
            />
          ))}
        </div>

        <div
          className="es-fadeUp"
          style={{
            animationDelay: '0.75s',
            alignSelf: 'center',
            padding: '18px 28px',
            borderRadius: 12,
            border: `1px solid ${palette.border}`,
            background: palette.surface,
            fontFamily: font.mono,
            fontSize: 26,
            color: palette.textSoft,
            display: 'flex',
            gap: 16,
            alignItems: 'center',
          }}
        >
          <span style={{ color: palette.mint }}>$</span>
          <span style={{ color: palette.text }}>pnpm build</span>
          <span style={{ color: palette.muted }}>→ dist/</span>
        </div>
      </div>
    </div>
  );
};

// ─── Slide export ────────────────────────────────────────────────────────────
export const meta: SlideMeta = {
  title: 'Getting started with open-slide',
};

export default [
  Cover,
  AgentAgnostic,
  FreeLayout,
  Init,
  Prompt,
  VisualEdit,
  AssetsManager,
  Inspect,
  Apply,
  Themes,
  GitTracked,
  DeployAnywhere,
  Recap,
] satisfies Page[];
