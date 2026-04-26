import type { Page, SlideMeta } from '@open-slide/core';

const palette = {
  bg: '#fafaf9',
  surface: '#ffffff',
  text: '#1c1917',
  muted: '#78716c',
  faint: '#a8a29e',
  line: '#e7e5e4',
  accent: '#2563eb',
  accentSoft: 'rgba(37, 99, 235, 0.08)',
  warn: '#b45309',
};

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
@keyframes sFadeUp {
  from { opacity: 0; transform: translateY(28px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes sFade {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes sFadeRight {
  from { opacity: 0; transform: translateX(-24px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes sScale {
  from { opacity: 0; transform: scale(0.94); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes sLineGrow {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
@keyframes sTravel {
  0% { transform: translateX(0); opacity: 0; }
  8%, 92% { opacity: 1; }
  100% { transform: translateX(var(--dist, 0px)); opacity: 0; }
}
@keyframes sPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.35); }
  50% { box-shadow: 0 0 0 28px rgba(37, 99, 235, 0); }
}
@keyframes sBlink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
@keyframes sLockShake {
  0%, 100% { transform: rotate(0deg); }
  20% { transform: rotate(-3deg); }
  40% { transform: rotate(3deg); }
  60% { transform: rotate(-2deg); }
  80% { transform: rotate(2deg); }
}
@keyframes sFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes sShimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.s-fadeup { animation: sFadeUp 1000ms ${ease} both; }
.s-fade   { animation: sFade 1200ms ${ease} both; }
.s-faderight { animation: sFadeRight 900ms ${ease} both; }
.s-scale  { animation: sScale 1000ms ${ease} both; }
.s-line   { animation: sLineGrow 900ms ${ease} both; transform-origin: left center; }
.s-pulse  { animation: sPulse 2.4s ease-out infinite; }
.s-blink  { animation: sBlink 1.1s steps(1) infinite; }
.s-shake  { animation: sLockShake 1.6s ease-in-out infinite; }
.s-float  { animation: sFloat 3.2s ease-in-out infinite; }
`;

const Style = () => <style>{keyframes}</style>;

const PAD_X = 140;
const PAD_Y = 110;

const GridBg = () => (
  <svg
    width="100%"
    height="100%"
    style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5 }}
    aria-hidden="true"
    role="presentation"
  >
    <title>decorative grid</title>
    <defs>
      <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
        <path d="M 80 0 L 0 0 0 80" fill="none" stroke={palette.line} strokeWidth="1" />
      </pattern>
      <radialGradient id="vignette" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor={palette.bg} stopOpacity="0" />
        <stop offset="100%" stopColor={palette.bg} stopOpacity="1" />
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
    <rect width="100%" height="100%" fill="url(#vignette)" />
  </svg>
);

const Eyebrow = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <div
    className="s-fadeup"
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
    SSH · {String(n).padStart(2, '0')} / {String(total).padStart(2, '0')}
  </div>
);

const TOTAL = 10;

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
    <GridBg />
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Eyebrow>A visual primer · 2026</Eyebrow>
      <h1
        className="s-fadeup"
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
        How <em style={{ fontStyle: 'italic', color: palette.accent }}>SSH</em>
        <br />
        actually works.
      </h1>
      <div
        className="s-line"
        style={{
          animationDelay: '900ms',
          height: 1,
          width: 520,
          background: palette.text,
          margin: '64px 0 32px',
        }}
      />
      <p
        className="s-fadeup"
        style={{
          animationDelay: '1100ms',
          fontFamily: fonts.sans,
          fontSize: 36,
          lineHeight: 1.5,
          color: palette.muted,
          maxWidth: 1100,
          margin: 0,
          fontWeight: 300,
        }}
      >
        From a curious{' '}
        <span
          style={{
            fontFamily: fonts.mono,
            fontSize: 32,
            color: palette.text,
            background: palette.accentSoft,
            padding: '4px 12px',
            borderRadius: 6,
          }}
        >
          ssh user@host
        </span>{' '}
        to a fully encrypted shell — in nine quiet steps.
      </p>
    </div>
    <PageNumber n={1} total={TOTAL} />
  </div>
);

/* ─────────────── 2. What is SSH ─────────────── */
const WhatIs: Page = () => (
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
    <Eyebrow>Definition</Eyebrow>
    <h2
      className="s-fadeup"
      style={{
        animationDelay: '180ms',
        fontFamily: fonts.serif,
        fontSize: 88,
        fontWeight: 400,
        lineHeight: 1.1,
        letterSpacing: '-0.02em',
        margin: '32px 0 0',
        maxWidth: 1500,
      }}
    >
      Secure Shell is a <em style={{ color: palette.accent }}>protocol</em> — not a program — for
      running commands on a remote machine, safely, over an untrusted network.
    </h2>
    <div style={{ display: 'flex', gap: 80, marginTop: 80 }}>
      {[
        { label: 'Confidentiality', body: 'Nobody on the wire can read your bytes.' },
        { label: 'Integrity', body: 'Nobody can tamper with them in flight.' },
        { label: 'Authenticity', body: 'You know the server is the server.' },
      ].map((it, i) => (
        <div
          key={it.label}
          className="s-fadeup"
          style={{ animationDelay: `${500 + i * 140}ms`, flex: 1 }}
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
            {it.label}
          </div>
          <div style={{ height: 1, width: 64, background: palette.text, margin: '20px 0' }} />
          <div style={{ fontSize: 30, lineHeight: 1.5, color: palette.text, fontWeight: 300 }}>
            {it.body}
          </div>
        </div>
      ))}
    </div>
    <PageNumber n={2} total={TOTAL} />
  </div>
);

/* ─────────────── 3. The problem ─────────────── */
const Problem: Page = () => (
  <div
    style={{ ...fill, padding: `${PAD_Y}px ${PAD_X}px`, display: 'flex', flexDirection: 'column' }}
  >
    <Style />
    <Eyebrow>Why we need it</Eyebrow>
    <h2
      className="s-fadeup"
      style={{
        animationDelay: '180ms',
        fontFamily: fonts.serif,
        fontSize: 96,
        fontWeight: 400,
        lineHeight: 1.1,
        letterSpacing: '-0.02em',
        margin: '32px 0 60px',
        maxWidth: 1400,
      }}
    >
      Telnet sent your password as <em style={{ color: palette.warn }}>plain text</em>.
    </h2>

    <div
      className="s-fade"
      style={{
        animationDelay: '600ms',
        position: 'relative',
        height: 200,
        background: palette.surface,
        border: `1px solid ${palette.line}`,
        borderRadius: 12,
        padding: '40px 56px',
        display: 'flex',
        alignItems: 'center',
        gap: 60,
      }}
    >
      {/* Client */}
      <div style={{ width: 140, textAlign: 'center', flexShrink: 0 }}>
        <div
          style={{
            fontSize: 22,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: palette.muted,
            marginBottom: 8,
          }}
        >
          You
        </div>
        <div style={{ fontFamily: fonts.mono, fontSize: 36, color: palette.text }}>◐</div>
      </div>

      {/* The wire */}
      <div style={{ flex: 1, position: 'relative', height: 80 }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            height: 1,
            background: palette.line,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            transform: 'translateY(-50%)',
            display: 'flex',
            justifyContent: 'space-evenly',
            alignItems: 'center',
          }}
        >
          {['login: alice', 'password: hunter2', 'token: ab12…'].map((t, i) => (
            <div
              key={t}
              className="s-faderight"
              style={{
                animationDelay: `${900 + i * 350}ms`,
                fontFamily: fonts.mono,
                fontSize: 26,
                color: palette.warn,
                background: palette.bg,
                padding: '6px 14px',
                border: `1px solid ${palette.warn}`,
                borderRadius: 4,
              }}
            >
              {t}
            </div>
          ))}
        </div>
        {/* eavesdropper */}
        <div
          className="s-fade"
          style={{
            animationDelay: '1700ms',
            position: 'absolute',
            top: -70,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <div
            className="s-float"
            style={{
              fontSize: 24,
              color: palette.warn,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            ↓ anyone watching
          </div>
        </div>
      </div>

      {/* Server */}
      <div style={{ width: 140, textAlign: 'center', flexShrink: 0 }}>
        <div
          style={{
            fontSize: 22,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: palette.muted,
            marginBottom: 8,
          }}
        >
          Server
        </div>
        <div style={{ fontFamily: fonts.mono, fontSize: 36, color: palette.text }}>◑</div>
      </div>
    </div>

    <p
      className="s-fadeup"
      style={{
        animationDelay: '2200ms',
        fontFamily: fonts.serif,
        fontStyle: 'italic',
        fontSize: 44,
        lineHeight: 1.4,
        color: palette.text,
        margin: '80px 0 0',
        maxWidth: 1400,
      }}
    >
      SSH is the answer: every byte after the handshake is encrypted with a key
      <br />
      that nobody else on the wire ever sees.
    </p>

    <PageNumber n={3} total={TOTAL} />
  </div>
);

/* ─────────────── 4. Four phases overview ─────────────── */
const phases = [
  { n: '01', title: 'TCP handshake', body: 'Open a reliable byte stream on port 22.' },
  { n: '02', title: 'Key exchange', body: 'Agree on a shared secret without ever sending one.' },
  { n: '03', title: 'Server authentication', body: 'Confirm the server is who it claims to be.' },
  { n: '04', title: 'User authentication', body: 'Confirm you are who you claim to be.' },
];

const Overview: Page = () => (
  <div
    style={{ ...fill, padding: `${PAD_Y}px ${PAD_X}px`, display: 'flex', flexDirection: 'column' }}
  >
    <Style />
    <Eyebrow>The four phases</Eyebrow>
    <h2
      className="s-fadeup"
      style={{
        animationDelay: '180ms',
        fontFamily: fonts.serif,
        fontSize: 96,
        fontWeight: 400,
        lineHeight: 1.08,
        letterSpacing: '-0.02em',
        margin: '32px 0 80px',
      }}
    >
      Every SSH session starts the same way.
    </h2>
    <div style={{ display: 'flex', gap: 32, flex: 1 }}>
      {phases.map((p, i) => (
        <div
          key={p.n}
          className="s-fadeup"
          style={{
            animationDelay: `${500 + i * 160}ms`,
            flex: 1,
            background: palette.surface,
            border: `1px solid ${palette.line}`,
            borderRadius: 16,
            padding: '48px 40px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: palette.accent,
              transformOrigin: 'left center',
              animation: `sLineGrow 900ms ${ease} both`,
              animationDelay: `${900 + i * 160}ms`,
            }}
          />
          <div
            style={{
              fontFamily: fonts.serif,
              fontSize: 96,
              lineHeight: 1,
              color: palette.faint,
              fontWeight: 400,
            }}
          >
            {p.n}
          </div>
          <div
            style={{
              fontFamily: fonts.serif,
              fontSize: 44,
              fontWeight: 400,
              lineHeight: 1.15,
              margin: '40px 0 24px',
              color: palette.text,
              letterSpacing: '-0.01em',
            }}
          >
            {p.title}
          </div>
          <div style={{ fontSize: 24, lineHeight: 1.55, color: palette.muted, fontWeight: 300 }}>
            {p.body}
          </div>
        </div>
      ))}
    </div>
    <PageNumber n={4} total={TOTAL} />
  </div>
);

/* ─────────────── Protocol diagram primitives ─────────────── */
type Msg = {
  dir: 'right' | 'left';
  label: string;
  sub?: string;
  delay: number;
};

const ProtocolDiagram = ({
  clientLabel,
  serverLabel,
  messages,
  height = 600,
}: {
  clientLabel: string;
  serverLabel: string;
  messages: Msg[];
  height?: number;
}) => {
  const colW = 220;
  const gap = 40;
  const rowH = (height - 100) / messages.length;
  return (
    <div style={{ position: 'relative', height, width: '100%' }}>
      {/* column heads */}
      <div
        className="s-fadeup"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: colW,
          textAlign: 'center',
          padding: '20px 0',
          background: palette.surface,
          border: `1px solid ${palette.line}`,
          borderRadius: 10,
          fontFamily: fonts.mono,
          fontSize: 26,
          color: palette.text,
        }}
      >
        {clientLabel}
      </div>
      <div
        className="s-fadeup"
        style={{
          animationDelay: '120ms',
          position: 'absolute',
          top: 0,
          right: 0,
          width: colW,
          textAlign: 'center',
          padding: '20px 0',
          background: palette.surface,
          border: `1px solid ${palette.line}`,
          borderRadius: 10,
          fontFamily: fonts.mono,
          fontSize: 26,
          color: palette.text,
        }}
      >
        {serverLabel}
      </div>
      {/* lifelines */}
      <div
        className="s-fade"
        style={{
          animationDelay: '300ms',
          position: 'absolute',
          top: 80,
          bottom: 20,
          left: colW / 2,
          width: 1,
          borderLeft: `1px dashed ${palette.line}`,
        }}
      />
      <div
        className="s-fade"
        style={{
          animationDelay: '300ms',
          position: 'absolute',
          top: 80,
          bottom: 20,
          right: colW / 2,
          width: 1,
          borderLeft: `1px dashed ${palette.line}`,
        }}
      />
      {/* messages */}
      {messages.map((m, i) => {
        const top = 100 + i * rowH;
        return (
          <div
            key={`${m.dir}-${m.label}`}
            className="s-fade"
            style={{
              animationDelay: `${m.delay}ms`,
              position: 'absolute',
              top,
              left: colW + gap,
              right: colW + gap,
              height: rowH,
            }}
          >
            <ArrowRow dir={m.dir} label={m.label} sub={m.sub} delay={m.delay} />
          </div>
        );
      })}
    </div>
  );
};

const ArrowRow = ({
  dir,
  label,
  sub,
  delay,
}: {
  dir: 'right' | 'left';
  label: string;
  sub?: string;
  delay: number;
}) => {
  const isRight = dir === 'right';
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* line */}
      <div
        className="s-line"
        style={{
          animationDelay: `${delay + 200}ms`,
          position: 'absolute',
          top: 28,
          left: 0,
          right: 0,
          height: 2,
          background: palette.text,
          transformOrigin: isRight ? 'left center' : 'right center',
        }}
      />
      {/* arrow head */}
      <div
        className="s-fade"
        style={{
          animationDelay: `${delay + 1000}ms`,
          position: 'absolute',
          top: 18,
          [isRight ? 'right' : 'left']: -2,
          width: 0,
          height: 0,
          borderTop: '11px solid transparent',
          borderBottom: '11px solid transparent',
          [isRight ? 'borderLeft' : 'borderRight']: `16px solid ${palette.text}`,
        }}
      />
      {/* label */}
      <div
        className="s-fadeup"
        style={{
          animationDelay: `${delay + 600}ms`,
          position: 'absolute',
          top: 50,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: fonts.mono,
          fontSize: 26,
          color: palette.text,
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      {sub && (
        <div
          className="s-fadeup"
          style={{
            animationDelay: `${delay + 750}ms`,
            position: 'absolute',
            top: 86,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 22,
            color: palette.muted,
            fontWeight: 300,
            fontStyle: 'italic',
            fontFamily: fonts.serif,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
};

/* ─────────────── 5. TCP handshake ─────────────── */
const TCPHandshake: Page = () => (
  <div
    style={{ ...fill, padding: `${PAD_Y}px ${PAD_X}px`, display: 'flex', flexDirection: 'column' }}
  >
    <Style />
    <Eyebrow>Phase 01 · Transport</Eyebrow>
    <h2
      className="s-fadeup"
      style={{
        animationDelay: '180ms',
        fontFamily: fonts.serif,
        fontSize: 84,
        fontWeight: 400,
        lineHeight: 1.1,
        letterSpacing: '-0.02em',
        margin: '32px 0 16px',
      }}
    >
      First, TCP opens a pipe on port 22.
    </h2>
    <p
      className="s-fadeup"
      style={{
        animationDelay: '320ms',
        fontSize: 28,
        lineHeight: 1.5,
        color: palette.muted,
        fontWeight: 300,
        margin: '0 0 60px',
        maxWidth: 1400,
      }}
    >
      The same three-way handshake every TCP connection starts with — SSH then runs <em>inside</em>{' '}
      it.
    </p>
    <ProtocolDiagram
      clientLabel="client"
      serverLabel="server :22"
      height={520}
      messages={[
        { dir: 'right', label: 'SYN', sub: '"hello, can we talk?"', delay: 600 },
        { dir: 'left', label: 'SYN + ACK', sub: '"hello, yes."', delay: 1400 },
        { dir: 'right', label: 'ACK', sub: '"connection established."', delay: 2200 },
      ]}
    />
    <PageNumber n={5} total={TOTAL} />
  </div>
);

/* ─────────────── 6. Key exchange ─────────────── */
const KeyExchange: Page = () => (
  <div
    style={{ ...fill, padding: `${PAD_Y}px ${PAD_X}px`, display: 'flex', flexDirection: 'column' }}
  >
    <Style />
    <Eyebrow>Phase 02 · The magic step</Eyebrow>
    <h2
      className="s-fadeup"
      style={{
        animationDelay: '180ms',
        fontFamily: fonts.serif,
        fontSize: 84,
        fontWeight: 400,
        lineHeight: 1.1,
        letterSpacing: '-0.02em',
        margin: '32px 0 16px',
      }}
    >
      They invent a shared secret, in public.
    </h2>
    <p
      className="s-fadeup"
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
      Diffie–Hellman: each side keeps a private number, swaps a public one, and ends up at the same
      answer. An eavesdropper sees both public halves and still cannot reach it.
    </p>

    <div style={{ display: 'flex', gap: 60, alignItems: 'center', flex: 1 }}>
      {/* Client side */}
      <div
        className="s-scale"
        style={{
          animationDelay: '500ms',
          flex: 1,
          background: palette.surface,
          border: `1px solid ${palette.line}`,
          borderRadius: 16,
          padding: '40px 44px',
        }}
      >
        <div
          style={{ fontFamily: fonts.mono, fontSize: 22, color: palette.muted, marginBottom: 20 }}
        >
          client
        </div>
        <div style={{ fontFamily: fonts.mono, fontSize: 30, lineHeight: 1.7 }}>
          <div className="s-faderight" style={{ animationDelay: '900ms', color: palette.muted }}>
            private: <span style={{ color: palette.text }}>a</span>
          </div>
          <div className="s-faderight" style={{ animationDelay: '1100ms', color: palette.muted }}>
            sends:&nbsp;&nbsp;&nbsp;
            <span style={{ color: palette.accent }}>
              g<sup>a</sup>
            </span>
          </div>
          <div className="s-faderight" style={{ animationDelay: '2400ms', color: palette.muted }}>
            gets:&nbsp;&nbsp;&nbsp;&nbsp;
            <span style={{ color: palette.accent }}>
              g<sup>b</sup>
            </span>
          </div>
          <div
            className="s-fadeup"
            style={{
              animationDelay: '2800ms',
              marginTop: 20,
              padding: '16px 20px',
              background: palette.accentSoft,
              borderRadius: 8,
            }}
          >
            <span style={{ color: palette.muted, fontSize: 22 }}>computes</span>
            <br />
            <span style={{ fontSize: 36, color: palette.accent, fontWeight: 600 }}>
              (g<sup>b</sup>)<sup>a</sup> = g<sup>ab</sup>
            </span>
          </div>
        </div>
      </div>

      {/* Wire / equality */}
      <div style={{ flexShrink: 0, textAlign: 'center', position: 'relative', width: 220 }}>
        <div
          className="s-fade"
          style={{
            animationDelay: '1200ms',
            fontFamily: fonts.serif,
            fontStyle: 'italic',
            fontSize: 28,
            color: palette.muted,
          }}
        >
          public wire
        </div>
        <div
          className="s-fade"
          style={{
            animationDelay: '1600ms',
            margin: '24px 0',
            height: 1,
            background: palette.line,
          }}
        />
        <div
          className="s-scale"
          style={{
            animationDelay: '3200ms',
            fontFamily: fonts.serif,
            fontSize: 96,
            color: palette.accent,
            lineHeight: 1,
            fontWeight: 400,
          }}
        >
          =
        </div>
        <div
          className="s-fadeup"
          style={{
            animationDelay: '3500ms',
            marginTop: 16,
            fontSize: 22,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: palette.muted,
          }}
        >
          shared secret
        </div>
      </div>

      {/* Server side */}
      <div
        className="s-scale"
        style={{
          animationDelay: '700ms',
          flex: 1,
          background: palette.surface,
          border: `1px solid ${palette.line}`,
          borderRadius: 16,
          padding: '40px 44px',
        }}
      >
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 22,
            color: palette.muted,
            marginBottom: 20,
            textAlign: 'right',
          }}
        >
          server
        </div>
        <div style={{ fontFamily: fonts.mono, fontSize: 30, lineHeight: 1.7, textAlign: 'right' }}>
          <div className="s-faderight" style={{ animationDelay: '1000ms', color: palette.muted }}>
            <span style={{ color: palette.text }}>b</span> :private
          </div>
          <div className="s-faderight" style={{ animationDelay: '1200ms', color: palette.muted }}>
            <span style={{ color: palette.accent }}>
              g<sup>b</sup>
            </span>
            &nbsp;&nbsp;&nbsp;:sends
          </div>
          <div className="s-faderight" style={{ animationDelay: '2500ms', color: palette.muted }}>
            <span style={{ color: palette.accent }}>
              g<sup>a</sup>
            </span>
            &nbsp;&nbsp;&nbsp;:gets
          </div>
          <div
            className="s-fadeup"
            style={{
              animationDelay: '2900ms',
              marginTop: 20,
              padding: '16px 20px',
              background: palette.accentSoft,
              borderRadius: 8,
            }}
          >
            <span style={{ color: palette.muted, fontSize: 22 }}>computes</span>
            <br />
            <span style={{ fontSize: 36, color: palette.accent, fontWeight: 600 }}>
              (g<sup>a</sup>)<sup>b</sup> = g<sup>ab</sup>
            </span>
          </div>
        </div>
      </div>
    </div>
    <PageNumber n={6} total={TOTAL} />
  </div>
);

/* ─────────────── 7. Server authentication ─────────────── */
const ServerAuth: Page = () => (
  <div
    style={{ ...fill, padding: `${PAD_Y}px ${PAD_X}px`, display: 'flex', flexDirection: 'column' }}
  >
    <Style />
    <Eyebrow>Phase 03 · Trust the server</Eyebrow>
    <h2
      className="s-fadeup"
      style={{
        animationDelay: '180ms',
        fontFamily: fonts.serif,
        fontSize: 84,
        fontWeight: 400,
        lineHeight: 1.1,
        letterSpacing: '-0.02em',
        margin: '32px 0 16px',
      }}
    >
      The server proves it owns its host key.
    </h2>
    <p
      className="s-fadeup"
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
      The server signs the key-exchange transcript with its private host key. The client checks the
      signature with the public key it already trusts (from{' '}
      <span style={{ fontFamily: fonts.mono, fontSize: 24 }}>~/.ssh/known_hosts</span>).
    </p>

    <div style={{ display: 'flex', gap: 80, alignItems: 'stretch', flex: 1 }}>
      <div
        className="s-fadeup"
        style={{
          animationDelay: '500ms',
          flex: 1,
          background: palette.surface,
          border: `1px solid ${palette.line}`,
          borderRadius: 16,
          padding: 40,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
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
          Server signs
        </div>
        <div style={{ fontFamily: fonts.mono, fontSize: 26, lineHeight: 1.7, color: palette.text }}>
          sig = <span style={{ color: palette.accent }}>sign</span>(transcript,{' '}
          <span style={{ color: palette.warn }}>host_priv</span>)
        </div>
        <div
          style={{
            fontFamily: fonts.serif,
            fontStyle: 'italic',
            fontSize: 28,
            color: palette.muted,
            marginTop: 'auto',
          }}
        >
          Only the real server holds the private host key.
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          alignSelf: 'center',
          width: 80,
          textAlign: 'center',
        }}
      >
        <div className="s-fade" style={{ animationDelay: '900ms' }}>
          <div className="s-float" style={{ fontSize: 64, color: palette.accent }}>
            →
          </div>
        </div>
      </div>

      <div
        className="s-fadeup"
        style={{
          animationDelay: '700ms',
          flex: 1,
          background: palette.surface,
          border: `1px solid ${palette.line}`,
          borderRadius: 16,
          padding: 40,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
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
          Client verifies
        </div>
        <div style={{ fontFamily: fonts.mono, fontSize: 26, lineHeight: 1.7, color: palette.text }}>
          <span style={{ color: palette.accent }}>verify</span>(sig, transcript,{' '}
          <span style={{ color: palette.text }}>host_pub</span>)
        </div>
        <div
          className="s-scale"
          style={{
            animationDelay: '1500ms',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '16px 20px',
            background: palette.accentSoft,
            borderRadius: 8,
            alignSelf: 'flex-start',
          }}
        >
          <span style={{ fontSize: 28, color: palette.accent, fontWeight: 600 }}>✓</span>
          <span style={{ fontFamily: fonts.mono, fontSize: 24, color: palette.text }}>
            fingerprint matches
          </span>
        </div>
        <div
          style={{
            fontFamily: fonts.serif,
            fontStyle: 'italic',
            fontSize: 28,
            color: palette.muted,
            marginTop: 'auto',
          }}
        >
          Otherwise: man-in-the-middle. Refuse.
        </div>
      </div>
    </div>
    <PageNumber n={7} total={TOTAL} />
  </div>
);

/* ─────────────── 8. User authentication ─────────────── */
const UserAuth: Page = () => (
  <div
    style={{ ...fill, padding: `${PAD_Y}px ${PAD_X}px`, display: 'flex', flexDirection: 'column' }}
  >
    <Style />
    <Eyebrow>Phase 04 · Trust the user</Eyebrow>
    <h2
      className="s-fadeup"
      style={{
        animationDelay: '180ms',
        fontFamily: fonts.serif,
        fontSize: 84,
        fontWeight: 400,
        lineHeight: 1.1,
        letterSpacing: '-0.02em',
        margin: '32px 0 50px',
      }}
    >
      Now you prove who <em style={{ color: palette.accent }}>you</em> are.
    </h2>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      {[
        {
          step: '1',
          label: 'Server sends a random challenge',
          mono: 'challenge = random_bytes(32)',
          delay: 500,
        },
        {
          step: '2',
          label: 'You sign it with your private key',
          mono: 'sig = sign(challenge, ~/.ssh/id_ed25519)',
          delay: 900,
        },
        {
          step: '3',
          label: 'Server verifies with your public key',
          mono: 'verify(sig, challenge, ~/.ssh/authorized_keys)',
          delay: 1300,
        },
        {
          step: '✓',
          label: 'Login granted — your private key never left your machine',
          mono: null,
          delay: 1700,
          highlight: true,
        },
      ].map((row) => (
        <div
          key={row.step}
          className="s-fadeup"
          style={{
            animationDelay: `${row.delay}ms`,
            display: 'flex',
            alignItems: 'center',
            gap: 40,
            padding: '28px 40px',
            background: row.highlight ? palette.accentSoft : palette.surface,
            border: `1px solid ${row.highlight ? palette.accent : palette.line}`,
            borderRadius: 14,
          }}
        >
          <div
            style={{
              flexShrink: 0,
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: `1.5px solid ${row.highlight ? palette.accent : palette.text}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: fonts.serif,
              fontSize: 30,
              color: row.highlight ? palette.accent : palette.text,
              fontWeight: 400,
            }}
          >
            {row.step}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 30, fontWeight: 400, color: palette.text, lineHeight: 1.4 }}>
              {row.label}
            </div>
            {row.mono && (
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 22,
                  color: palette.muted,
                  marginTop: 8,
                  letterSpacing: '-0.01em',
                }}
              >
                {row.mono}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
    <PageNumber n={8} total={TOTAL} />
  </div>
);

/* ─────────────── 9. Encrypted session ─────────────── */
const EncryptedSession: Page = () => (
  <div
    style={{ ...fill, padding: `${PAD_Y}px ${PAD_X}px`, display: 'flex', flexDirection: 'column' }}
  >
    <Style />
    <Eyebrow>The session</Eyebrow>
    <h2
      className="s-fadeup"
      style={{
        animationDelay: '180ms',
        fontFamily: fonts.serif,
        fontSize: 96,
        fontWeight: 400,
        lineHeight: 1.08,
        letterSpacing: '-0.02em',
        margin: '32px 0 16px',
      }}
    >
      Now every keystroke is ciphertext.
    </h2>
    <p
      className="s-fadeup"
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
      The shared secret derives symmetric keys (AES, ChaCha20). Each direction gets its own. Each
      packet gets a MAC. Welcome to your remote shell.
    </p>

    <div
      style={{
        flex: 1,
        background: palette.surface,
        border: `1px solid ${palette.line}`,
        borderRadius: 16,
        padding: '50px 60px',
        display: 'flex',
        alignItems: 'center',
        gap: 60,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* client */}
      <div
        className="s-scale"
        style={{ animationDelay: '500ms', textAlign: 'center', flexShrink: 0, width: 200 }}
      >
        <div
          className="s-pulse"
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            border: `2px solid ${palette.accent}`,
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
            color: palette.accent,
          }}
        >
          ◐
        </div>
        <div style={{ fontFamily: fonts.mono, fontSize: 22, color: palette.muted }}>client</div>
      </div>

      {/* tunnel */}
      <div style={{ flex: 1, position: 'relative', height: 200 }}>
        {/* upper rail */}
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: 0,
            right: 0,
            height: 1,
            background: palette.line,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            left: 0,
            right: 0,
            height: 1,
            background: palette.line,
          }}
        />

        {/* upper traveling cipher (client → server) */}
        {['8a3f', 'c1e0', '4b2d', '9f17'].map((c, i) => (
          <div
            key={`up-${c}`}
            style={{
              position: 'absolute',
              top: 30,
              left: 0,
              fontFamily: fonts.mono,
              fontSize: 20,
              color: palette.accent,
              padding: '4px 10px',
              background: palette.bg,
              border: `1px solid ${palette.accent}`,
              borderRadius: 4,
              ...({ '--dist': '880px' } as React.CSSProperties),
              animation: `sTravel 4.5s linear ${i * 1.1}s infinite`,
            }}
          >
            {c}
          </div>
        ))}
        {/* lower traveling cipher (server → client) */}
        {['d4a2', '7e91', '2cb6'].map((c, i) => (
          <div
            key={`dn-${c}`}
            style={{
              position: 'absolute',
              bottom: 30,
              right: 0,
              fontFamily: fonts.mono,
              fontSize: 20,
              color: palette.accent,
              padding: '4px 10px',
              background: palette.bg,
              border: `1px solid ${palette.accent}`,
              borderRadius: 4,
              ...({ '--dist': '-880px' } as React.CSSProperties),
              animation: `sTravel 4.5s linear ${0.55 + i * 1.3}s infinite`,
            }}
          >
            {c}
          </div>
        ))}

        {/* center label */}
        <div
          className="s-fade"
          style={{
            animationDelay: '900ms',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 22,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: palette.accent,
              fontWeight: 500,
            }}
          >
            encrypted tunnel
          </div>
          <div
            style={{
              fontFamily: fonts.serif,
              fontStyle: 'italic',
              fontSize: 26,
              color: palette.muted,
              marginTop: 10,
            }}
          >
            AES-256-GCM · HMAC-SHA-256
          </div>
        </div>
      </div>

      {/* server */}
      <div
        className="s-scale"
        style={{ animationDelay: '700ms', textAlign: 'center', flexShrink: 0, width: 200 }}
      >
        <div
          className="s-pulse"
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            border: `2px solid ${palette.accent}`,
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
            color: palette.accent,
            animationDelay: '1.2s',
          }}
        >
          ◑
        </div>
        <div style={{ fontFamily: fonts.mono, fontSize: 22, color: palette.muted }}>server</div>
      </div>
    </div>
    <PageNumber n={9} total={TOTAL} />
  </div>
);

/* ─────────────── 10. Closing ─────────────── */
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
    <GridBg />
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Eyebrow>In nine quiet steps</Eyebrow>
      <h2
        className="s-fadeup"
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
        TCP. Keys.
        <br />
        <em style={{ color: palette.accent }}>Trust. Talk.</em>
      </h2>
      <div
        className="s-line"
        style={{
          animationDelay: '900ms',
          height: 1,
          width: 520,
          background: palette.text,
          margin: '64px 0 32px',
        }}
      />
      <p
        className="s-fadeup"
        style={{
          animationDelay: '1100ms',
          fontSize: 36,
          lineHeight: 1.5,
          color: palette.muted,
          maxWidth: 1200,
          margin: 0,
          fontWeight: 300,
        }}
      >
        Behind every{' '}
        <span
          style={{
            fontFamily: fonts.mono,
            fontSize: 32,
            color: palette.text,
            background: palette.accentSoft,
            padding: '4px 12px',
            borderRadius: 6,
          }}
        >
          $
        </span>
        <span className="s-blink" style={{ marginLeft: 4, fontFamily: fonts.mono, fontSize: 32 }}>
          ▍
        </span>{' '}
        prompt on a remote box, this entire dance just happened — in under a second.
      </p>
      <div
        className="s-fadeup"
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
    <PageNumber n={10} total={TOTAL} />
  </div>
);

export const meta: SlideMeta = { title: 'How SSH Works' };
export default [
  Cover,
  WhatIs,
  Problem,
  Overview,
  TCPHandshake,
  KeyExchange,
  ServerAuth,
  UserAuth,
  EncryptedSession,
  Closing,
] satisfies Page[];
