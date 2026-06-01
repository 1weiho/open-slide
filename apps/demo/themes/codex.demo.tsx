import { type DesignSystem, type Page, useSlidePageNumber } from '@open-slide/core';
import type { ReactNode } from 'react';

export const design: DesignSystem = {
  palette: {
    bg: '#F8FAFC',
    text: '#111827',
    accent: '#4F8CFF',
  },
  fonts: {
    display: "Inter, -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
    body: "Inter, -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
  },
  typeScale: {
    hero: 124,
    body: 32,
  },
  radius: 18,
};

const styles = `
@keyframes cx-fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
@keyframes cx-glow { 0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.42; } 50% { transform: translate(-50%, -50%) scale(1.06); opacity: 0.62; } }
@keyframes cx-scan { from { transform: translateX(-18%); opacity: 0.3; } to { transform: translateX(118%); opacity: 0; } }
`;

const SANS = "Inter, -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif";
const MONO = "'SF Mono', 'JetBrains Mono', 'Menlo', 'Consolas', monospace";

const palette = {
  bg: '#F8FAFC',
  canvas: '#FFFFFF',
  text: '#111827',
  muted: '#64748B',
  border: '#DDE7F3',
  panel: '#EFF6FF',
  panelHi: '#E0F2FE',
  accent: '#4F8CFF',
  success: '#10A37F',
  ink: '#0B1220',
};

const Title = ({ children }: { children: ReactNode }) => (
  <h1
    style={{
      fontFamily: SANS,
      fontSize: 124,
      fontWeight: 720,
      lineHeight: 1.02,
      letterSpacing: 0,
      margin: 0,
      color: palette.text,
      maxWidth: 1120,
    }}
  >
    {children}
  </h1>
);

const Footer = ({ path = 'codex://workspace' }: { path?: string }) => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={{
        position: 'absolute',
        left: 112,
        right: 112,
        bottom: 48,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: MONO,
        fontSize: 20,
        letterSpacing: '0.04em',
        color: palette.muted,
      }}
    >
      <span>{path}</span>
      <span>
        {String(current).padStart(2, '0')}{' '}
        <span style={{ opacity: 0.45 }}>/ {String(total).padStart(2, '0')}</span>
      </span>
    </div>
  );
};

const Eyebrow = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 16px',
      borderRadius: 999,
      border: `1px solid ${palette.border}`,
      background: palette.canvas,
      fontFamily: MONO,
      fontSize: 18,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: palette.muted,
      alignSelf: 'flex-start',
    }}
  >
    <span
      aria-hidden
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: palette.success,
        boxShadow: '0 0 0 6px rgba(16, 163, 127, 0.12)',
      }}
    />
    {children}
  </div>
);

const SoftGlow = ({
  x = '50%',
  y = '50%',
  size = 900,
}: {
  x?: string;
  y?: string;
  size?: number;
}) => (
  <div
    aria-hidden
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size,
      transform: 'translate(-50%, -50%)',
      background:
        'radial-gradient(circle, rgba(79, 140, 255, 0.28) 0%, rgba(125, 211, 252, 0.15) 35%, transparent 68%)',
      filter: 'blur(18px)',
      animation: 'cx-glow 5s ease-in-out infinite',
      pointerEvents: 'none',
    }}
  />
);

const AgentPanel = ({ title, lines }: { title: string; lines: string[] }) => (
  <div
    style={{
      borderRadius: 18,
      border: `1px solid ${palette.border}`,
      background: palette.canvas,
      overflow: 'hidden',
      position: 'relative',
    }}
  >
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(90deg, transparent, rgba(79,140,255,0.11), transparent)',
        width: '40%',
        animation: 'cx-scan 3.2s ease-in-out infinite',
      }}
    />
    <div
      style={{
        height: 54,
        padding: '0 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${palette.border}`,
        fontFamily: MONO,
        fontSize: 18,
        color: palette.muted,
        position: 'relative',
      }}
    >
      <span>{title}</span>
      <span style={{ color: palette.success }}>ready</span>
    </div>
    <div style={{ padding: 24, display: 'grid', gap: 12, position: 'relative' }}>
      {lines.map((line) => (
        <div
          key={line}
          style={{
            fontFamily: MONO,
            fontSize: 20,
            color: palette.text,
            background: palette.bg,
            border: `1px solid ${palette.border}`,
            borderRadius: 12,
            padding: '14px 16px',
          }}
        >
          {line}
        </div>
      ))}
    </div>
  </div>
);

const pageBase: React.CSSProperties = {
  width: '100%',
  height: '100%',
  background: palette.bg,
  color: palette.text,
  padding: '88px 112px',
  boxSizing: 'border-box',
  fontFamily: SANS,
  position: 'relative',
  overflow: 'hidden',
};

const Cover: Page = () => (
  <div
    style={{
      ...pageBase,
      display: 'grid',
      gridTemplateColumns: '1.05fr 0.95fr',
      gap: 72,
      alignItems: 'center',
    }}
  >
    <style>{styles}</style>
    <SoftGlow x="78%" y="32%" />
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 30,
        animation: 'cx-fadeUp 720ms cubic-bezier(0.22, 1, 0.36, 1) both',
      }}
    >
      <Eyebrow>codex workflow</Eyebrow>
      <Title>Ship engineering work with agents in the loop.</Title>
      <p
        style={{
          fontSize: 32,
          lineHeight: 1.45,
          color: palette.muted,
          maxWidth: 880,
          margin: 0,
        }}
      >
        A calm, product-native system for explaining parallel tasks, worktrees, reviews, and
        delivery.
      </p>
    </div>
    <AgentPanel
      title="agent run"
      lines={['read repo context', 'plan safe edits', 'run tests', 'prepare handoff']}
    />
    <Footer />
  </div>
);

const steps = [
  {
    label: '01',
    title: 'Context',
    body: 'Start with repo rules, changed files, and the real constraints already in the workspace.',
  },
  {
    label: '02',
    title: 'Parallel work',
    body: 'Split independent tasks across worktrees while keeping one clear product direction.',
  },
  {
    label: '03',
    title: 'Review',
    body: 'Bring code, tests, and notes back into one readable handoff before shipping.',
  },
];

const Content: Page = () => (
  <div style={{ ...pageBase, display: 'flex', flexDirection: 'column', gap: 44 }}>
    <style>{styles}</style>
    <SoftGlow x="16%" y="18%" size={720} />
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        animation: 'cx-fadeUp 720ms cubic-bezier(0.22, 1, 0.36, 1) both',
      }}
    >
      <Eyebrow>operating model</Eyebrow>
      <h2
        style={{
          fontFamily: SANS,
          fontSize: 72,
          fontWeight: 720,
          lineHeight: 1.08,
          letterSpacing: 0,
          color: palette.text,
          margin: 0,
          maxWidth: 1080,
        }}
      >
        A command center, not a chat transcript.
      </h2>
    </div>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 22,
      }}
    >
      {steps.map((step, index) => (
        <div
          key={step.title}
          style={{
            background: palette.canvas,
            border: `1px solid ${palette.border}`,
            borderRadius: 18,
            padding: 30,
            minHeight: 340,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            animation: 'cx-fadeUp 720ms cubic-bezier(0.22, 1, 0.36, 1) both',
            animationDelay: `${index * 100}ms`,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 20,
              color: index === 1 ? palette.accent : palette.muted,
            }}
          >
            {step.label}
          </div>
          <div>
            <h3
              style={{
                fontSize: 42,
                lineHeight: 1.08,
                letterSpacing: 0,
                margin: '0 0 16px',
              }}
            >
              {step.title}
            </h3>
            <p style={{ fontSize: 25, lineHeight: 1.45, color: palette.muted, margin: 0 }}>
              {step.body}
            </p>
          </div>
        </div>
      ))}
    </div>
    <Footer path="codex://multi-agent" />
  </div>
);

const Closer: Page = () => (
  <div
    style={{
      ...pageBase,
      display: 'grid',
      gridTemplateColumns: '0.9fr 1.1fr',
      gap: 64,
      alignItems: 'center',
    }}
  >
    <style>{styles}</style>
    <SoftGlow x="72%" y="64%" size={960} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <Eyebrow>handoff</Eyebrow>
      <h2
        style={{
          fontSize: 86,
          lineHeight: 1.04,
          letterSpacing: 0,
          margin: 0,
          maxWidth: 760,
        }}
      >
        End with evidence the team can trust.
      </h2>
      <p style={{ fontSize: 32, lineHeight: 1.45, color: palette.muted, margin: 0, maxWidth: 760 }}>
        Keep the final slide plain: what changed, what passed, and what still deserves attention.
      </p>
    </div>
    <div
      style={{
        background: palette.ink,
        borderRadius: 18,
        padding: 30,
        color: '#E5EEF9',
        fontFamily: MONO,
        fontSize: 22,
        lineHeight: 1.75,
        border: '1px solid rgba(255,255,255,0.14)',
      }}
    >
      <div style={{ color: '#93C5FD' }}>$ codex finish --verify</div>
      <div style={{ color: '#A7F3D0' }}>tests passed</div>
      <div>changed files: 2</div>
      <div>review notes: ready</div>
      <div style={{ color: '#64748B' }}>handoff.md written</div>
    </div>
    <Footer path="codex://handoff" />
  </div>
);

export default [Cover, Content, Closer];
