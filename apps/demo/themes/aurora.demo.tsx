import type { Page } from '@open-slide/core';
import type { ReactNode } from 'react';

const styles = `
@keyframes au-fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes au-glow { 0%, 100% { opacity: 0.55; } 50% { opacity: 0.9; } }
`;

const SANS = "-apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', system-ui, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', 'Menlo', monospace";

const Title = ({ children }: { children: ReactNode }) => (
  <h1
    style={{
      fontFamily: SANS,
      fontSize: 116,
      fontWeight: 600,
      lineHeight: 1.05,
      letterSpacing: '-0.02em',
      margin: 0,
      color: '#F5F5F5',
    }}
  >
    {children}
  </h1>
);

const Footer = ({
  pageNum,
  total,
  path = '/docs',
}: {
  pageNum: number;
  total: number;
  path?: string;
}) => (
  <div
    style={{
      position: 'absolute',
      left: 120,
      right: 120,
      bottom: 56,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontFamily: MONO,
      fontSize: 22,
      letterSpacing: '0.04em',
      color: '#8B8B8B',
    }}
  >
    <span>{path}</span>
    <span>
      {String(pageNum).padStart(2, '0')}{' '}
      <span style={{ opacity: 0.4 }}>/ {String(total).padStart(2, '0')}</span>
    </span>
  </div>
);

const Eyebrow = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      alignSelf: 'flex-start',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 18px',
      borderRadius: 999,
      border: '1px solid #2A2A2A',
      background: '#161616',
      fontFamily: MONO,
      fontSize: 18,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: '#8B8B8B',
    }}
  >
    <span
      aria-hidden
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: '#A78BFA',
        boxShadow: '0 0 12px #A78BFA',
      }}
    />
    {children}
  </div>
);

const Glow = ({ x = '50%', y = '50%', size = 1200 }: { x?: string; y?: string; size?: number }) => (
  <div
    aria-hidden
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size,
      transform: 'translate(-50%, -50%)',
      background: 'radial-gradient(circle, #A78BFA 0%, transparent 60%)',
      opacity: 0.18,
      filter: 'blur(40px)',
      pointerEvents: 'none',
      animation: 'au-glow 4s ease-in-out infinite',
    }}
  />
);

const pageBase: React.CSSProperties = {
  width: '100%',
  height: '100%',
  background: '#0E0E0E',
  color: '#F5F5F5',
  padding: '100px 120px',
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  fontFamily: SANS,
  position: 'relative',
  overflow: 'hidden',
};

const TOTAL = 3;

const Cover: Page = () => (
  <div style={{ ...pageBase, justifyContent: 'center', gap: 32 }}>
    <style>{styles}</style>
    <Glow x="78%" y="36%" />
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
        animation: 'au-fadeUp 700ms cubic-bezier(0.22, 1, 0.36, 1) both',
      }}
    >
      <Eyebrow>release notes · v3</Eyebrow>
      <Title>Quiet, but built for the long run.</Title>
      <p
        style={{
          fontSize: 26,
          lineHeight: 1.5,
          color: '#8B8B8B',
          maxWidth: 1180,
          margin: 0,
        }}
      >
        Three changes that landed this quarter — none of them flashy, all of them load-bearing.
      </p>
    </div>
    <Footer pageNum={1} total={TOTAL} />
  </div>
);

const stats = [
  { n: '4.2×', label: 'cold start', body: 'Server bootstrap is now under a hundred milliseconds.' },
  { n: '−38%', label: 'memory', body: 'Idle workers shed allocations they never freed.' },
  { n: '0', label: 'breaking changes', body: 'Every public API from v2 still works, untouched.' },
];

const Content: Page = () => (
  <div style={{ ...pageBase, gap: 40 }}>
    <style>{styles}</style>
    <Glow x="20%" y="78%" size={1400} />
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        animation: 'au-fadeUp 700ms cubic-bezier(0.22, 1, 0.36, 1) both',
      }}
    >
      <Eyebrow>numbers</Eyebrow>
      <h2
        style={{
          fontFamily: SANS,
          fontSize: 56,
          fontWeight: 600,
          letterSpacing: '-0.015em',
          lineHeight: 1.1,
          margin: 0,
          color: '#F5F5F5',
          maxWidth: 1280,
        }}
      >
        Three measurements we believed in.
      </h2>
    </div>
    <ul
      style={{
        margin: 0,
        padding: 0,
        listStyle: 'none',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 20,
        marginTop: 8,
      }}
    >
      {stats.map((s, i) => (
        <li
          key={s.label}
          style={{
            background: '#161616',
            border: '1px solid #2A2A2A',
            borderRadius: 16,
            padding: '32px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            boxShadow: '0 0 0 1px rgba(255,255,255,0.03) inset',
            animation: `au-fadeUp 700ms cubic-bezier(0.22, 1, 0.36, 1) both`,
            animationDelay: `${i * 100}ms`,
          }}
        >
          <div
            style={{
              fontFamily: SANS,
              fontSize: 96,
              fontWeight: 600,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              color: '#F5F5F5',
            }}
          >
            {s.n}
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 16,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#A78BFA',
            }}
          >
            {s.label}
          </div>
          <div
            style={{
              fontFamily: SANS,
              fontSize: 20,
              lineHeight: 1.5,
              color: '#8B8B8B',
              marginTop: 8,
            }}
          >
            {s.body}
          </div>
        </li>
      ))}
    </ul>
    <Footer pageNum={2} total={TOTAL} path="/docs/changelog" />
  </div>
);

const Closer: Page = () => (
  <div style={{ ...pageBase, justifyContent: 'center', gap: 32 }}>
    <style>{styles}</style>
    <Glow x="22%" y="68%" />
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
        animation: 'au-fadeUp 700ms cubic-bezier(0.22, 1, 0.36, 1) both',
      }}
    >
      <Eyebrow>get started</Eyebrow>
      <Title>Read the docs.</Title>
      <p
        style={{
          fontSize: 26,
          lineHeight: 1.5,
          color: '#8B8B8B',
          maxWidth: 1180,
          margin: 0,
        }}
      >
        Upgrade is one bumped dependency. Everything else can wait until you have time.
      </p>
    </div>
    <Footer pageNum={TOTAL} total={TOTAL} path="/docs/upgrade" />
  </div>
);

export default [Cover, Content, Closer];
