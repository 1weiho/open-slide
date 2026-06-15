import type { DesignSystem } from '@open-slide/core';
import { type Page, useSlidePageNumber } from '@open-slide/core';

const css = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Sans:wght@400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');

@keyframes rp-fadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes rp-fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.rp-fadeUp { opacity: 0; animation: rp-fadeUp 0.8s cubic-bezier(.2,.7,.2,1) forwards; }
.rp-fadeIn { opacity: 0; animation: rp-fadeIn 1s ease forwards; }
`;

const Styles = () => <style>{css}</style>;

export const design: DesignSystem = {
  palette: {
    bg: '#FAF6F1',
    text: '#2F3034',
    accent: '#FF3C00',
  },
  fonts: {
    display: '"Space Grotesk", system-ui, -apple-system, sans-serif',
    body: '"IBM Plex Sans", system-ui, -apple-system, sans-serif',
  },
  typeScale: {
    hero: 164,
    body: 40,
  },
  radius: 10,
};

const p = {
  bg: '#FAF6F1',
  text: '#2F3034',
  accent: '#FF3C00',
  surface: '#FFFFFF',
  panel: '#F3EDE5',
  border: 'rgba(47,48,52,0.10)',
  muted: '#6E6F77',
  subtle: 'rgba(47,48,52,0.55)',
  onAccent: '#FAF6F1',
};

const font = {
  display: '"Space Grotesk", system-ui, sans-serif',
  body: '"IBM Plex Sans", system-ui, sans-serif',
  mono: '"IBM Plex Mono", ui-monospace, Menlo, monospace',
};

const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontFamily: font.display,
      fontSize: 164,
      fontWeight: 700,
      lineHeight: 0.96,
      letterSpacing: '-0.04em',
      margin: 0,
      color: p.text,
    }}
  >
    {children}
  </h1>
);

const Footer = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        bottom: 56,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: font.mono,
        fontSize: 22,
        color: p.muted,
        letterSpacing: '0.04em',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 10, height: 10, background: p.accent, borderRadius: 3 }} />
        <span>REPLIT</span>
      </div>
      <span>
        {current} / {total}
      </span>
    </div>
  );
};

const Eyebrow = ({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) => (
  <div
    style={{
      fontFamily: font.mono,
      fontSize: 22,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: muted ? p.subtle : p.accent,
      marginBottom: 24,
    }}
  >
    {children}
  </div>
);

const LogoMark = ({ size = 36 }: { size?: number }) => (
  <div
    style={{
      width: size,
      height: size,
      background: p.accent,
      borderRadius: Math.round(size * 0.19),
      flexShrink: 0,
    }}
  />
);

const DotGrid = ({ opacity = 0.05 }: { opacity?: number }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      backgroundImage: `radial-gradient(circle, rgba(47,48,52,${opacity}) 1.5px, transparent 1.5px)`,
      backgroundSize: '52px 52px',
      pointerEvents: 'none',
    }}
  />
);

const OrangeGlow = ({
  corner = 'top-right',
}: {
  corner?: 'top-right' | 'top-left' | 'bottom-right';
}) => {
  const pos: React.CSSProperties =
    corner === 'top-right'
      ? { top: -120, right: -120 }
      : corner === 'top-left'
        ? { top: -160, left: -160 }
        : { bottom: -140, right: -140 };
  return (
    <div
      style={{
        position: 'absolute',
        ...pos,
        width: 680,
        height: 680,
        background: 'radial-gradient(circle, rgba(255,60,0,0.16), transparent 65%)',
        pointerEvents: 'none',
      }}
    />
  );
};

const WindowShell = ({
  title = 'index.tsx',
  children,
}: {
  title?: string;
  children?: React.ReactNode;
}) => (
  <div
    style={{
      background: p.surface,
      border: `1px solid ${p.border}`,
      borderRadius: 10,
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '14px 20px',
        borderBottom: `1px solid ${p.border}`,
        background: p.panel,
      }}
    >
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F57' }} />
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FEBC2E' }} />
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28C840' }} />
      <span
        style={{
          marginLeft: 12,
          fontFamily: font.mono,
          fontSize: 20,
          color: p.subtle,
          letterSpacing: '0.02em',
        }}
      >
        {title}
      </span>
    </div>
    {children && <div style={{ padding: '24px 28px' }}>{children}</div>}
  </div>
);

const Cover: Page = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: p.bg,
      color: p.text,
      fontFamily: font.body,
      overflow: 'hidden',
      position: 'relative',
    }}
  >
    <Styles />
    <DotGrid opacity={0.05} />
    <OrangeGlow corner="top-right" />

    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '120px 140px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div
        className="rp-fadeIn"
        style={{ animationDelay: '0.05s', display: 'flex', alignItems: 'center', gap: 16 }}
      >
        <LogoMark size={38} />
        <span
          style={{ fontFamily: font.mono, fontSize: 22, color: p.muted, letterSpacing: '0.04em' }}
        >
          Replit — Platform Overview
        </span>
      </div>

      <div>
        <div className="rp-fadeUp" style={{ animationDelay: '0.1s' }}>
          <Title>Build anything.</Title>
          <h1
            style={{
              fontFamily: font.display,
              fontSize: 164,
              fontWeight: 700,
              lineHeight: 0.96,
              letterSpacing: '-0.04em',
              margin: 0,
              color: p.accent,
            }}
          >
            Ship anywhere.
          </h1>
        </div>

        <p
          className="rp-fadeUp"
          style={{
            animationDelay: '0.22s',
            marginTop: 52,
            fontSize: 40,
            fontWeight: 400,
            color: p.muted,
            maxWidth: 1080,
            lineHeight: 1.5,
          }}
        >
          The complete platform for building, running, and deploying software — right from your
          browser.
        </p>
      </div>

      <div
        className="rp-fadeUp"
        style={{
          animationDelay: '0.36s',
          display: 'flex',
          gap: 48,
          alignItems: 'center',
          paddingBottom: 40,
        }}
      >
        {['IDE in the browser', 'AI-native', 'Zero-config deploy', 'Real-time collab'].map(
          (tag) => (
            <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 8, height: 8, background: p.accent, borderRadius: '50%' }} />
              <span style={{ fontFamily: font.body, fontSize: 28, color: p.muted }}>{tag}</span>
            </div>
          ),
        )}
      </div>
    </div>

    <Footer />
  </div>
);

const Features: Page = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: p.bg,
      color: p.text,
      fontFamily: font.body,
      overflow: 'hidden',
      position: 'relative',
    }}
  >
    <Styles />
    <DotGrid opacity={0.04} />
    <OrangeGlow corner="bottom-right" />

    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '100px 140px 120px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 72,
        alignItems: 'center',
      }}
    >
      <div>
        <div className="rp-fadeUp" style={{ animationDelay: '0.05s' }}>
          <Eyebrow>Replit AI</Eyebrow>
          <h2
            style={{
              fontFamily: font.display,
              fontSize: 80,
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.06,
              letterSpacing: '-0.03em',
              color: p.text,
            }}
          >
            AI that builds alongside you.
          </h2>
        </div>

        <p
          className="rp-fadeUp"
          style={{
            animationDelay: '0.18s',
            marginTop: 40,
            fontSize: 34,
            color: p.subtle,
            lineHeight: 1.55,
            maxWidth: 680,
          }}
        >
          Describe what you want. The agent writes code, runs it, and iterates until it works — no
          setup, no context-switching.
        </p>

        <div
          className="rp-fadeUp"
          style={{
            animationDelay: '0.28s',
            marginTop: 48,
            display: 'flex',
            gap: 24,
          }}
        >
          {[
            { label: '50+', sub: 'languages' },
            { label: '∞', sub: 'repls' },
            { label: '1-click', sub: 'deploy' },
          ].map(({ label, sub }) => (
            <div
              key={sub}
              style={{
                background: p.surface,
                border: `1px solid ${p.border}`,
                borderRadius: 10,
                padding: '18px 28px',
                textAlign: 'center',
              }}
            >
              <div
                style={{ fontFamily: font.display, fontSize: 40, fontWeight: 700, color: p.accent }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: font.mono,
                  fontSize: 20,
                  color: p.muted,
                  marginTop: 4,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {sub}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rp-fadeUp"
        style={{ animationDelay: '0.14s', display: 'flex', flexDirection: 'column', gap: 20 }}
      >
        <WindowShell title="agent.ts">
          <div style={{ fontFamily: font.mono, fontSize: 24, color: p.text, lineHeight: 1.7 }}>
            <span style={{ color: '#FF3C00' }}>const</span>{' '}
            <span style={{ color: '#2F3034' }}>result</span>{' '}
            <span style={{ color: '#A8A096' }}>=</span>{' '}
            <span style={{ color: '#FF3C00' }}>await</span>{' '}
            <span style={{ color: '#2F3034' }}>agent</span>
            <span style={{ color: '#A8A096' }}>.</span>
            <span style={{ color: '#2F3034' }}>run</span>
            <span style={{ color: '#A8A096' }}>(</span>
            <span style={{ color: '#1A7F37' }}>&ldquo;Build a todo app&rdquo;</span>
            <span style={{ color: '#A8A096' }}>);</span>
            <br />
            <span style={{ color: '#9A958C' }}>{'// ✓ Deployed to replit.app in 8s'}</span>
          </div>
        </WindowShell>

        {[
          {
            title: 'AI Agent',
            body: 'Writes code, runs it, and iterates autonomously until it works.',
          },
          {
            title: 'Code Completion',
            body: 'Context-aware across your entire codebase — not just the current line.',
          },
          {
            title: 'Chat & Debug',
            body: 'Ask questions in plain English. Get fixes and explanations instantly.',
          },
        ].map(({ title, body }, i) => (
          <div
            key={title}
            className="rp-fadeUp"
            style={{
              animationDelay: `${0.22 + i * 0.08}s`,
              background: p.surface,
              border: `1px solid ${p.border}`,
              borderLeft: `3px solid ${p.accent}`,
              borderRadius: 10,
              padding: '22px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ fontFamily: font.display, fontSize: 28, fontWeight: 700, color: p.text }}>
              {title}
            </div>
            <div style={{ fontSize: 24, color: p.subtle, lineHeight: 1.48 }}>{body}</div>
          </div>
        ))}
      </div>
    </div>

    <Footer />
  </div>
);

const Closer: Page = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: p.bg,
      color: p.text,
      fontFamily: font.body,
      overflow: 'hidden',
      position: 'relative',
    }}
  >
    <Styles />
    <DotGrid opacity={0.05} />
    <OrangeGlow corner="top-left" />

    <div
      style={{
        position: 'absolute',
        inset: 0,
        padding: '120px 140px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div className="rp-fadeIn" style={{ animationDelay: '0.05s' }}>
        <Eyebrow>Get started — it&rsquo;s free</Eyebrow>
      </div>

      <div>
        <h2
          className="rp-fadeUp"
          style={{
            animationDelay: '0.12s',
            fontFamily: font.display,
            fontSize: 148,
            fontWeight: 700,
            margin: 0,
            lineHeight: 0.96,
            letterSpacing: '-0.04em',
            color: p.accent,
          }}
        >
          Start building
          <br />
          today.
        </h2>
        <p
          className="rp-fadeUp"
          style={{
            animationDelay: '0.26s',
            marginTop: 52,
            fontSize: 42,
            color: p.muted,
            lineHeight: 1.38,
            maxWidth: 1100,
          }}
        >
          No credit card. No local setup. No DevOps. Just open your browser and build.
        </p>
      </div>

      <div
        className="rp-fadeUp"
        style={{
          animationDelay: '0.38s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <LogoMark size={44} />
          <span
            style={{
              fontFamily: font.display,
              fontSize: 52,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: p.text,
            }}
          >
            replit.com
          </span>
        </div>
        <span
          style={{ fontFamily: font.mono, fontSize: 24, color: p.muted, letterSpacing: '0.06em' }}
        >
          BUILD · LEARN · SHIP
        </span>
      </div>
    </div>
  </div>
);

export default [Cover, Features, Closer];
