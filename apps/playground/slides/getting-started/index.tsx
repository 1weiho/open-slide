import type { DeckMeta, SlidePage } from '@open-slide/core';

// ─── Design tokens ────────────────────────────────────────────────────────────
const palette = {
  bg: '#08090a',
  surface: '#0e0f12',
  surfaceHi: '#14161a',
  surfaceMax: '#1a1c21',
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
  inspect: '#3b82f6',
  inspectFill: 'rgba(59,130,246,0.10)',
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
      maskImage:
        'radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 70%)',
      WebkitMaskImage:
        'radial-gradient(ellipse at center, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 70%)',
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
      borderRadius: 16,
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
  role,
  children,
  delay,
}: {
  role: 'user' | 'assistant' | 'tool';
  children: React.ReactNode;
  delay: number;
}) => {
  const label = role === 'user' ? 'you' : role === 'assistant' ? 'agent' : 'tool';
  const color =
    role === 'user' ? palette.mint : role === 'assistant' ? palette.accentSoft : palette.amber;
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

// ─── Slide 1: Cover ──────────────────────────────────────────────────────────
const Cover: SlidePage = () => (
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
            fontSize: 168,
            lineHeight: 0.98,
            fontWeight: 600,
            margin: 0,
            letterSpacing: '-0.045em',
            animationDelay: '0.15s',
          }}
        >
          Author decks
          <br />
          <span
            style={{
              background: `linear-gradient(90deg, ${palette.accentSoft}, ${palette.accent})`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            with your coding agent.
          </span>
        </h1>
        <p
          className="es-fadeUp"
          style={{
            marginTop: 48,
            maxWidth: 1100,
            fontSize: 36,
            lineHeight: 1.35,
            color: palette.textSoft,
            animationDelay: '0.35s',
          }}
        >
          Three steps from empty folder to a live, editable deck.
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
          <span style={{ color: palette.accentSoft }}>01</span>  init
        </span>
        <span>
          <span style={{ color: palette.accentSoft }}>02</span>  prompt
        </span>
        <span>
          <span style={{ color: palette.accentSoft }}>03</span>  inspect
        </span>
      </div>
    </div>
  </div>
);

// ─── Slide 2: Init in a terminal ─────────────────────────────────────────────
const Init: SlidePage = () => {
  const stream = [
    '',
    'Created open-slide workspace in /Users/you/my-deck',
    '',
    'Next steps:',
    '  cd my-deck',
    '  pnpm install    # or npm install / yarn',
    '  pnpm dev',
    '',
    'Then open the dev server and start authoring in slides/<your-deck>/.',
  ];
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
            Runs anywhere. No global installs, no Vite config to touch.
          </p>
        </div>

        <WindowShell title="~/code — zsh" style={{ flex: 1 }}>
          <div
            style={{
              flex: 1,
              padding: '36px 48px',
              fontFamily: font.mono,
              fontSize: 28,
              lineHeight: 1.55,
              color: palette.textSoft,
              background: palette.surface,
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', gap: 16 }}>
              <span style={{ color: palette.mint }}>$</span>
              <span className="gs-type" style={{ color: palette.text }}>
                npx @open-slide/cli init my-deck
              </span>
            </div>
            <div style={{ height: 18 }} />
            {stream.map((line, i) => (
              <div
                key={i}
                className="gs-stream"
                style={{
                  minHeight: 44,
                  animationDelay: `${1.8 + i * 0.12}s`,
                  color: line.startsWith('Next steps')
                    ? palette.accentSoft
                    : line.startsWith('Created')
                      ? palette.mint
                      : palette.textSoft,
                  whiteSpace: 'pre',
                }}
              >
                {line || ' '}
              </div>
            ))}
            <div
              className="gs-stream"
              style={{
                marginTop: 16,
                animationDelay: `${1.8 + stream.length * 0.12 + 0.1}s`,
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
const Prompt: SlidePage = () => {
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
          <WindowShell title="claude · ~/my-deck">
            <div
              style={{
                flex: 1,
                padding: '28px 36px',
                background: palette.surface,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <AgentLine role="user" delay={0.3}>
                <div>
                  <SlashCmd name="create-slide" />
                </div>
                <div style={{ marginTop: 10 }}>
                  <span className="gs-type" style={{ maxWidth: '100%', color: palette.text }}>
                    a deck about the Q2 launch
                  </span>
                </div>
              </AgentLine>
              <div style={{ height: 1, background: palette.border, margin: '8px 0' }} />
              <AgentLine role="assistant" delay={2.0}>
                Drafting 6 pages…
              </AgentLine>
              <AgentLine role="tool" delay={2.7}>
                <div style={{ color: palette.muted }}>
                  write <span style={{ color: palette.text }}>slides/q2-launch/index.tsx</span>
                </div>
              </AgentLine>
              <AgentLine role="tool" delay={3.4}>
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
          <WindowShell title="localhost:5173/decks/q2-launch">
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

// ─── Slide 4: Inspect a block ────────────────────────────────────────────────
const Inspect: SlidePage = () => (
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
        <Eyebrow>03 / Inspect &amp; comment</Eyebrow>
        <h2
          style={{
            marginTop: 20,
            marginBottom: 0,
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
          <span style={{ fontFamily: font.mono, color: palette.accentSoft }}>
            @slide-comment
          </span>{' '}
          marker in your source.
        </p>
      </div>

      <WindowShell
        title="localhost:5173/decks/q2-launch"
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
const Apply: SlidePage = () => (
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
        <Eyebrow>04 / Apply comments</Eyebrow>
        <h2
          style={{
            marginTop: 20,
            marginBottom: 0,
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
        <WindowShell title="claude · ~/my-deck">
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
            <AgentLine role="user" delay={0.2}>
              <SlashCmd name="apply-comments" color={palette.amber} />
            </AgentLine>
            <AgentLine role="assistant" delay={1.0}>
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
                <span style={{ color: palette.accentSoft }}>@slide-comment</span>{' '}
                id=<span style={{ color: palette.mint }}>"c-a1b2c3d4"</span>{' '}
                ts=<span style={{ color: palette.mint }}>"2026-04-20T10:15:00.000Z"</span>{' '}
                text=<span style={{ color: palette.mint }}>"eyJub3RlIjoi…"</span>{' '}
                {'*/}'}
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

            <AgentLine role="tool" delay={3.8}>
              <div style={{ color: palette.muted }}>
                edit <span style={{ color: palette.text }}>slides/q2-launch/index.tsx</span>{' '}
                <span style={{ color: palette.mint }}>✓ 1 comment applied</span>
              </div>
            </AgentLine>
            <div style={{ flex: 1 }} />
          </div>
        </WindowShell>

        {/* RIGHT — browser canvas morphs */}
        <WindowShell title="localhost:5173/decks/q2-launch">
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

// ─── Slide 6: Recap ──────────────────────────────────────────────────────────
const Recap: SlidePage = () => {
  const steps = [
    { n: '01', title: 'init', caption: 'npx @open-slide/cli init' },
    { n: '02', title: 'prompt', caption: 'create-slide' },
    { n: '03', title: 'inspect', caption: 'apply-comments' },
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
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 32,
          }}
        >
          {steps.map((s, i) => (
            <div
              key={s.n}
              className="es-fadeUp"
              style={{
                animationDelay: `${0.35 + i * 0.12}s`,
                padding: '32px 36px',
                border: `1px solid ${palette.border}`,
                borderRadius: 16,
                background: palette.surface,
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }}
            >
              <div
                style={{
                  fontFamily: font.mono,
                  fontSize: 22,
                  color: palette.accentSoft,
                  letterSpacing: '0.12em',
                }}
              >
                {s.n}
              </div>
              <div
                style={{
                  fontSize: 52,
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                }}
              >
                {s.title}
              </div>
              <div
                style={{
                  fontFamily: font.mono,
                  fontSize: 22,
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
            edit <span style={{ color: palette.text }}>slides/&lt;your-deck&gt;/index.tsx</span> — HMR does the rest
          </span>
          <span>open-slide</span>
        </div>
      </div>
    </div>
  );
};

// ─── Deck export ─────────────────────────────────────────────────────────────
export const meta: DeckMeta = {
  title: 'Getting started with open-slide',
  theme: 'dark',
};

export default [Cover, Init, Prompt, Inspect, Apply, Recap] satisfies SlidePage[];
