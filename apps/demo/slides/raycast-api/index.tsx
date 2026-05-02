import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';
import raycastIcon from './assets/raycast.svg';

export const design: DesignSystem = {
  palette: { bg: '#0E0E0E', text: '#F5F5F5', accent: '#FF6363' },
  fonts: {
    display: '-apple-system, BlinkMacSystemFont, "Inter", "SF Pro Display", system-ui, sans-serif',
    body: '-apple-system, BlinkMacSystemFont, "Inter", "SF Pro Display", system-ui, sans-serif',
  },
  typeScale: { hero: 112, body: 24 },
  radius: 14,
};

const palette = {
  bg: '#0E0E0E',
  surface: '#1A1A1A',
  surfaceHi: '#222222',
  border: '#2A2A2A',
  text: '#F5F5F5',
  muted: '#8B8B8B',
  accent: '#FF6363',
  accentSoft: 'rgba(255, 99, 99, 0.12)',
};

const fonts = {
  sans: '-apple-system, BlinkMacSystemFont, "Inter", "SF Pro Display", system-ui, sans-serif',
  mono: '"SF Mono", "JetBrains Mono", "Menlo", monospace',
};

const fill = {
  width: '100%',
  height: '100%',
  fontFamily: 'var(--osd-font-body)',
  color: 'var(--osd-text)',
  background: 'var(--osd-bg)',
  position: 'relative',
  overflow: 'hidden',
} as const;

const keyframes = `
@keyframes rcFadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes rcFade {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes rcCaret {
  0%, 60% { opacity: 1; }
  61%, 100% { opacity: 0; }
}
@keyframes rcGlow {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 0.85; }
}
.rc-fadeup { animation: rcFadeUp 700ms cubic-bezier(0.22, 1, 0.36, 1) both; }
.rc-fade { animation: rcFade 800ms ease-out both; }
.rc-caret { animation: rcCaret 1.1s steps(1) infinite; }
.rc-glow { animation: rcGlow 4s ease-in-out infinite; }
`;

const Style = () => <style>{keyframes}</style>;

const Glow = ({
  x = '50%',
  y = '50%',
  size = 1200,
  color = 'var(--osd-accent)',
  opacity = 0.18,
}) => (
  <div
    className="rc-glow"
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size,
      transform: 'translate(-50%, -50%)',
      background: `radial-gradient(circle, ${color} 0%, transparent 60%)`,
      opacity,
      filter: 'blur(40px)',
      pointerEvents: 'none',
    }}
  />
);

const Eyebrow = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <div
    className="rc-fadeup"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 18px',
      borderRadius: 999,
      border: `1px solid ${palette.border}`,
      background: palette.surface,
      fontSize: 22,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: palette.muted,
      animationDelay: `${delay}ms`,
    }}
  >
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: 'var(--osd-accent)',
        boxShadow: `0 0 12px var(--osd-accent)`,
      }}
    />
    {children}
  </div>
);

const Footer = ({ index, total }: { index: number; total: number }) => (
  <div
    style={{
      position: 'absolute',
      bottom: 56,
      left: 120,
      right: 120,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: 22,
      color: palette.muted,
      fontFamily: fonts.mono,
      letterSpacing: '0.04em',
    }}
  >
    <span>raycast.com / developers</span>
    <span>
      {String(index).padStart(2, '0')}{' '}
      <span style={{ opacity: 0.4 }}>/ {String(total).padStart(2, '0')}</span>
    </span>
  </div>
);

const TOTAL = 9;

const CommandBar = ({
  query,
  results,
}: {
  query: string;
  results: { icon: string; title: string; sub: string; kbd?: string }[];
}) => (
  <div
    style={{
      width: 820,
      borderRadius: 16,
      background: palette.surface,
      border: `1px solid ${palette.border}`,
      boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03) inset',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '18px 22px',
        borderBottom: `1px solid ${palette.border}`,
      }}
    >
      <img
        src={raycastIcon}
        alt="Raycast"
        style={{
          width: 32,
          height: 32,
          display: 'block',
        }}
      />
      <div style={{ fontSize: 24, fontWeight: 500, flex: 1, color: 'var(--osd-text)' }}>
        {query}
        <span
          className="rc-caret"
          style={{
            display: 'inline-block',
            width: 2,
            height: 24,
            background: 'var(--osd-accent)',
            marginLeft: 6,
            verticalAlign: 'middle',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {['⌘', 'K'].map((k) => (
          <span
            key={k}
            style={{
              fontFamily: fonts.mono,
              fontSize: 16,
              padding: '4px 10px',
              borderRadius: 6,
              background: palette.surfaceHi,
              color: palette.muted,
              border: `1px solid ${palette.border}`,
            }}
          >
            {k}
          </span>
        ))}
      </div>
    </div>
    <div style={{ padding: '10px 12px' }}>
      <div
        style={{
          fontSize: 14,
          color: palette.muted,
          padding: '6px 12px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        Results
      </div>
      {results.map((r, i) => (
        <div
          key={i}
          className="rc-fadeup"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px',
            borderRadius: 8,
            background: i === 0 ? palette.accentSoft : 'transparent',
            animationDelay: `${600 + i * 90}ms`,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: palette.surfaceHi,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            {r.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 500 }}>{r.title}</div>
            <div style={{ fontSize: 15, color: palette.muted, marginTop: 2 }}>{r.sub}</div>
          </div>
          {r.kbd && (
            <span
              style={{
                fontFamily: fonts.mono,
                fontSize: 14,
                padding: '4px 8px',
                borderRadius: 5,
                background: palette.surfaceHi,
                color: palette.muted,
                border: `1px solid ${palette.border}`,
              }}
            >
              {r.kbd}
            </span>
          )}
        </div>
      ))}
    </div>
  </div>
);

const Cover: Page = () => (
  <div style={fill}>
    <Style />
    <Glow x="30%" y="40%" size={1200} opacity={0.16} />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        alignItems: 'center',
        padding: '0 120px',
        gap: 80,
      }}
    >
      <div>
        <img
          src={raycastIcon}
          alt="Raycast"
          className="rc-fadeup"
          style={{
            width: 64,
            height: 64,
            display: 'block',
            marginBottom: 28,
            filter: `drop-shadow(0 0 28px var(--osd-accent))`,
          }}
        />
        <Eyebrow delay={80}>Developer Platform</Eyebrow>
        <h1
          className="rc-fadeup"
          style={{
            fontSize: 'var(--osd-size-hero)',
            fontWeight: 800,
            margin: '28px 0 24px',
            lineHeight: 1.02,
            letterSpacing: '-0.03em',
            animationDelay: '160ms',
          }}
        >
          Raycast
          <br />
          <span style={{ color: 'var(--osd-accent)' }}>Developer API</span>
        </h1>
        <p
          className="rc-fadeup"
          style={{
            fontSize: 'var(--osd-size-body)',
            color: palette.muted,
            maxWidth: 620,
            lineHeight: 1.5,
            animationDelay: '240ms',
          }}
        >
          Build extensions for the launcher people already live in — with TypeScript, React, and a
          strongly-typed API.
        </p>
      </div>
      <div
        className="rc-fade"
        style={{ animationDelay: '300ms', display: 'flex', justifyContent: 'flex-end' }}
      >
        <CommandBar
          query="Create Extension"
          results={[
            {
              icon: '⚡',
              title: 'Create Extension',
              sub: 'Scaffold a new Raycast extension',
              kbd: '↵',
            },
            { icon: '📦', title: 'Manage Extensions', sub: 'View installed and local extensions' },
            { icon: '📚', title: 'Open Documentation', sub: 'developers.raycast.com' },
          ]}
        />
      </div>
    </div>
    <Footer index={1} total={TOTAL} />
  </div>
);

const Pitch: Page = () => (
  <div style={fill}>
    <Style />
    <Glow x="100%" y="0%" size={900} opacity={0.18} />
    <div style={{ padding: '180px 160px 0' }}>
      <Eyebrow>What is it</Eyebrow>
      <h2
        className="rc-fadeup"
        style={{
          fontSize: 84,
          fontWeight: 800,
          margin: '32px 0 56px',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          maxWidth: 1400,
          animationDelay: '120ms',
        }}
      >
        A platform to extend the macOS launcher you
        <br />
        already use <span style={{ color: 'var(--osd-accent)' }}>40 times a day.</span>
      </h2>
      <div style={{ display: 'flex', gap: 24 }}>
        {[
          { kpi: '2,500+', label: 'Public extensions in the Store' },
          { kpi: '50+', label: 'AI models, zero API keys' },
          { kpi: '100%', label: 'Keyboard-first, mouse optional' },
        ].map((s, i) => (
          <div
            key={s.label}
            className="rc-fadeup"
            style={{
              flex: 1,
              padding: 32,
              borderRadius: 'var(--osd-radius)',
              background: palette.surface,
              border: `1px solid ${palette.border}`,
              animationDelay: `${280 + i * 100}ms`,
            }}
          >
            <div
              style={{
                fontSize: 56,
                fontWeight: 800,
                color: 'var(--osd-accent)',
                letterSpacing: '-0.02em',
              }}
            >
              {s.kpi}
            </div>
            <div style={{ fontSize: 22, color: palette.muted, marginTop: 8 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
    <Footer index={2} total={TOTAL} />
  </div>
);

const Stack: Page = () => (
  <div style={fill}>
    <Style />
    <Glow x="0%" y="100%" size={1000} opacity={0.16} />
    <div style={{ padding: '180px 160px 0' }}>
      <Eyebrow>The stack</Eyebrow>
      <h2
        className="rc-fadeup"
        style={{
          fontSize: 84,
          fontWeight: 800,
          margin: '32px 0 56px',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          animationDelay: '120ms',
        }}
      >
        Tools you already know.
      </h2>
      <div style={{ display: 'flex', gap: 24 }}>
        {[
          {
            tag: '01',
            name: 'TypeScript',
            sub: 'Strongly-typed end-to-end. Autocomplete every API surface.',
          },
          {
            tag: '02',
            name: 'React',
            sub: 'Declarative UI. The same components you write for the web.',
          },
          {
            tag: '03',
            name: 'Node + npm',
            sub: 'The full ecosystem. Bring any package along for the ride.',
          },
        ].map((t, i) => (
          <div
            key={t.name}
            className="rc-fadeup"
            style={{
              flex: 1,
              padding: 36,
              borderRadius: 'var(--osd-radius)',
              background: palette.surface,
              border: `1px solid ${palette.border}`,
              animationDelay: `${260 + i * 110}ms`,
            }}
          >
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: 18,
                color: 'var(--osd-accent)',
                letterSpacing: '0.1em',
              }}
            >
              {t.tag}
            </div>
            <div style={{ fontSize: 40, fontWeight: 700, marginTop: 16, letterSpacing: '-0.02em' }}>
              {t.name}
            </div>
            <div style={{ fontSize: 22, color: palette.muted, marginTop: 14, lineHeight: 1.5 }}>
              {t.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
    <Footer index={3} total={TOTAL} />
  </div>
);

const UIPrimitives: Page = () => {
  const items = [
    { name: '<List />', desc: 'Searchable rows. The bread and butter.' },
    { name: '<Grid />', desc: 'Visual layouts — icon picks, image sets.' },
    { name: '<Detail />', desc: 'Markdown views for one focused item.' },
    { name: '<Form />', desc: 'Native inputs for capturing user data.' },
  ];
  return (
    <div style={fill}>
      <Style />
      <Glow x="50%" y="50%" size={1400} opacity={0.1} />
      <div style={{ padding: '160px 160px 0' }}>
        <Eyebrow>UI primitives</Eyebrow>
        <h2
          className="rc-fadeup"
          style={{
            fontSize: 80,
            fontWeight: 800,
            margin: '32px 0 48px',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            animationDelay: '120ms',
          }}
        >
          Four components. Most extensions need nothing else.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
          {items.map((it, i) => (
            <div
              key={it.name}
              className="rc-fadeup"
              style={{
                padding: '36px 40px',
                borderRadius: 16,
                background: palette.surface,
                border: `1px solid ${palette.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 32,
                animationDelay: `${260 + i * 90}ms`,
              }}
            >
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 32,
                  fontWeight: 600,
                  color: 'var(--osd-accent)',
                  width: 220,
                  whiteSpace: 'nowrap',
                }}
              >
                {it.name}
              </div>
              <div style={{ fontSize: 28, color: 'var(--osd-text)', lineHeight: 1.4 }}>
                {it.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer index={4} total={TOTAL} />
    </div>
  );
};

const ActionPanel: Page = () => (
  <div style={fill}>
    <Style />
    <Glow x="80%" y="50%" size={1100} opacity={0.18} />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        gridTemplateColumns: '1.05fr 1fr',
        alignItems: 'center',
        padding: '0 160px',
        gap: 80,
      }}
    >
      <div>
        <Eyebrow>Keyboard-first</Eyebrow>
        <h2
          className="rc-fadeup"
          style={{
            fontSize: 76,
            fontWeight: 800,
            margin: '28px 0 28px',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            animationDelay: '120ms',
          }}
        >
          ActionPanel:
          <br />
          <span style={{ color: 'var(--osd-accent)' }}>every action,</span> a shortcut.
        </h2>
        <p
          className="rc-fadeup"
          style={{
            fontSize: 'var(--osd-size-body)',
            color: palette.muted,
            lineHeight: 1.5,
            maxWidth: 600,
            animationDelay: '220ms',
          }}
        >
          Bind any action to a key combo. Power users navigate without lifting their hands — and
          your extension feels native to Raycast.
        </p>
      </div>
      <div className="rc-fade" style={{ animationDelay: '300ms' }}>
        <div
          style={{
            width: 540,
            borderRadius: 'var(--osd-radius)',
            background: palette.surface,
            border: `1px solid ${palette.border}`,
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: palette.muted,
              padding: '6px 12px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Actions
          </div>
          {[
            { icon: '↗', name: 'Open in Browser', kbd: '↵' },
            { icon: '⧉', name: 'Copy URL', kbd: '⌘ ⇧ C' },
            { icon: '★', name: 'Add to Favorites', kbd: '⌘ F' },
            { icon: '⌫', name: 'Delete', kbd: '⌃ X' },
          ].map((a, i) => (
            <div
              key={a.name}
              className="rc-fadeup"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px',
                borderRadius: 8,
                background: i === 0 ? palette.accentSoft : 'transparent',
                animationDelay: `${500 + i * 90}ms`,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  background: palette.surfaceHi,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  color: palette.muted,
                }}
              >
                {a.icon}
              </div>
              <div style={{ flex: 1, fontSize: 19, fontWeight: 500 }}>{a.name}</div>
              <span
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 14,
                  padding: '4px 8px',
                  borderRadius: 5,
                  background: palette.surfaceHi,
                  color: palette.muted,
                  border: `1px solid ${palette.border}`,
                }}
              >
                {a.kbd}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
    <Footer index={5} total={TOTAL} />
  </div>
);

const AIApi: Page = () => (
  <div style={fill}>
    <Style />
    <Glow x="30%" y="30%" size={1000} opacity={0.14} />
    <div style={{ padding: '160px 160px 0' }}>
      <Eyebrow>AI API</Eyebrow>
      <h2
        className="rc-fadeup"
        style={{
          fontSize: 84,
          fontWeight: 800,
          margin: '32px 0 48px',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          animationDelay: '120ms',
        }}
      >
        Call any model.
        <br />
        <span style={{ color: 'var(--osd-accent)' }}>No keys. No setup.</span>
      </h2>
      <div
        style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 40, alignItems: 'start' }}
      >
        <div
          className="rc-fadeup"
          style={{
            background: palette.surface,
            border: `1px solid ${palette.border}`,
            borderRadius: 'var(--osd-radius)',
            padding: '24px 28px',
            fontFamily: fonts.mono,
            fontSize: 22,
            lineHeight: 1.6,
            animationDelay: '280ms',
          }}
        >
          <div style={{ color: palette.muted }}>{'// import { AI } from "@raycast/api"'}</div>
          <div style={{ marginTop: 8 }}>
            <span style={{ color: '#C792EA' }}>const</span> answer ={' '}
            <span style={{ color: '#C792EA' }}>await</span> AI.
            <span style={{ color: 'var(--osd-accent)' }}>ask</span>(
          </div>
          <div style={{ paddingLeft: 28, color: '#A5E844' }}>"Summarize my selected text",</div>
          <div style={{ paddingLeft: 28 }}>
            {'{ '}
            <span style={{ color: '#82AAFF' }}>model</span>: AI.Model[
            <span style={{ color: '#A5E844' }}>"Anthropic_Claude_Sonnet"</span>]{' }'}
          </div>
          <div>);</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { k: '50+', v: 'models — OpenAI, Anthropic, Google, Mistral…' },
            { k: 'Stream', v: 'real-time tokens via "data" events' },
            { k: 'Tune', v: 'creativity from none → maximum' },
          ].map((b, i) => (
            <div
              key={b.k}
              className="rc-fadeup"
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 20,
                padding: '20px 24px',
                borderRadius: 12,
                background: palette.surface,
                border: `1px solid ${palette.border}`,
                animationDelay: `${360 + i * 100}ms`,
              }}
            >
              <div
                style={{ fontSize: 30, fontWeight: 800, color: 'var(--osd-accent)', minWidth: 100 }}
              >
                {b.k}
              </div>
              <div style={{ fontSize: 20, color: 'var(--osd-text)', lineHeight: 1.4 }}>{b.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
    <Footer index={6} total={TOTAL} />
  </div>
);

const Platform: Page = () => {
  const apis = [
    { sym: '◐', name: 'LocalStorage', desc: 'Persist data across sessions.' },
    { sym: '⚿', name: 'OAuth', desc: 'Built-in PKCE flow with token storage.' },
    { sym: '⚙', name: 'Preferences', desc: 'Typed user settings, declared in package.json.' },
    { sym: '⌘', name: 'Clipboard', desc: 'Read, write, and watch the system clipboard.' },
    { sym: '⌗', name: 'Browser Tabs', desc: 'Read open tabs across major browsers.' },
    { sym: '⏻', name: 'Window & Apps', desc: 'Inspect or focus any running app.' },
  ];
  return (
    <div style={fill}>
      <Style />
      <Glow x="50%" y="0%" size={1300} opacity={0.14} />
      <div style={{ padding: '160px 160px 0' }}>
        <Eyebrow>Platform APIs</Eyebrow>
        <h2
          className="rc-fadeup"
          style={{
            fontSize: 76,
            fontWeight: 800,
            margin: '32px 0 44px',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            animationDelay: '120ms',
          }}
        >
          Reach into the OS — safely.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {apis.map((a, i) => (
            <div
              key={a.name}
              className="rc-fadeup"
              style={{
                padding: 28,
                borderRadius: 'var(--osd-radius)',
                background: palette.surface,
                border: `1px solid ${palette.border}`,
                animationDelay: `${260 + i * 70}ms`,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: palette.accentSoft,
                  color: 'var(--osd-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  marginBottom: 16,
                }}
              >
                {a.sym}
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.01em' }}>
                {a.name}
              </div>
              <div style={{ fontSize: 19, color: palette.muted, marginTop: 8, lineHeight: 1.45 }}>
                {a.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer index={7} total={TOTAL} />
    </div>
  );
};

const DX: Page = () => (
  <div style={fill}>
    <Style />
    <Glow x="100%" y="100%" size={1100} opacity={0.16} />
    <div style={{ padding: '180px 160px 0' }}>
      <Eyebrow>Developer experience</Eyebrow>
      <h2
        className="rc-fadeup"
        style={{
          fontSize: 84,
          fontWeight: 800,
          margin: '32px 0 48px',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          animationDelay: '120ms',
        }}
      >
        Ship in an afternoon.
      </h2>
      <div style={{ display: 'flex', gap: 24 }}>
        {[
          {
            tag: 'Hot reload',
            desc: 'Save the file. Raycast reloads. No build step in your loop.',
          },
          {
            tag: 'Strongly typed',
            desc: 'Every component, prop, and event lights up in your editor.',
          },
          {
            tag: 'Zero config',
            desc: '`ray develop` and you’re running. The CLI handles the rest.',
          },
        ].map((d, i) => (
          <div
            key={d.tag}
            className="rc-fadeup"
            style={{
              flex: 1,
              padding: 32,
              borderRadius: 'var(--osd-radius)',
              background: palette.surface,
              border: `1px solid ${palette.border}`,
              animationDelay: `${280 + i * 100}ms`,
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: 'var(--osd-accent)',
                letterSpacing: '-0.02em',
              }}
            >
              {d.tag}
            </div>
            <div style={{ fontSize: 21, color: palette.muted, marginTop: 14, lineHeight: 1.5 }}>
              {d.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
    <Footer index={8} total={TOTAL} />
  </div>
);

const Closing: Page = () => (
  <div style={fill}>
    <Style />
    <Glow x="50%" y="50%" size={1600} opacity={0.22} />
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 160px',
        textAlign: 'center',
      }}
    >
      <img
        src={raycastIcon}
        alt="Raycast"
        className="rc-fadeup"
        style={{
          width: 80,
          height: 80,
          display: 'block',
          marginBottom: 32,
          filter: `drop-shadow(0 0 36px var(--osd-accent))`,
        }}
      />
      <Eyebrow delay={80}>Start building</Eyebrow>
      <h1
        className="rc-fadeup"
        style={{
          fontSize: 88,
          fontWeight: 800,
          margin: '32px 0 20px',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          animationDelay: '160ms',
        }}
      >
        npm i{' '}
        <span style={{ color: 'var(--osd-accent)', fontFamily: fonts.mono }}>@raycast/api</span>
      </h1>
      <p
        className="rc-fadeup"
        style={{
          fontSize: 'var(--osd-size-body)',
          color: palette.muted,
          maxWidth: 900,
          marginTop: 32,
          lineHeight: 1.5,
          animationDelay: '240ms',
        }}
      >
        Or open Raycast → <span style={{ color: 'var(--osd-text)' }}>Create Extension</span> → pick
        a template.
        <br />
        Docs at <span style={{ color: 'var(--osd-text)' }}>developers.raycast.com</span>
      </p>
    </div>
    <Footer index={9} total={TOTAL} />
  </div>
);

export const meta: SlideMeta = { title: 'Raycast Developer API' };

export default [
  Cover,
  Pitch,
  Stack,
  UIPrimitives,
  ActionPanel,
  AIApi,
  Platform,
  DX,
  Closing,
] satisfies Page[];
