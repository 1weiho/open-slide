import type { Page } from '@open-slide/core';
import type { ReactNode } from 'react';

const styles = `
@keyframes sp-pop {
  0%   { transform: scale(0.92) rotate(var(--sp-tilt, 0deg)); opacity: 0; }
  60%  { transform: scale(1.04) rotate(var(--sp-tilt, 0deg)); opacity: 1; }
  100% { transform: scale(1) rotate(var(--sp-tilt, 0deg)); }
}
@keyframes sp-bob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}
@keyframes sp-wiggle {
  0%, 100% { transform: rotate(-2deg); }
  50%      { transform: rotate(2deg); }
}
`;

const Title = ({ children }: { children: ReactNode }) => (
  <h1
    style={{
      fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
      fontSize: 152,
      fontWeight: 800,
      lineHeight: 0.98,
      letterSpacing: '-0.025em',
      margin: 0,
      color: '#2d1b4e',
    }}
  >
    {children}
  </h1>
);

const Footer = ({ pageNum, total }: { pageNum: number; total: number }) => (
  <div
    style={{
      position: 'absolute',
      left: 110,
      right: 110,
      bottom: 60,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: 18,
      fontWeight: 600,
      color: '#9a8aa8',
    }}
  >
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <span
        aria-hidden
        style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff4d8d' }}
      />
      <span
        aria-hidden
        style={{ width: 12, height: 12, borderRadius: '50%', background: '#6d4cff' }}
      />
      <span
        aria-hidden
        style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffd24c' }}
      />
      <span style={{ marginLeft: 8 }}>Sticker Pop</span>
    </span>
    <span
      style={{
        background: '#2d1b4e',
        color: '#fff2e8',
        padding: '6px 14px',
        borderRadius: 999,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {pageNum} / {total}
    </span>
  </div>
);

const Sticker = ({
  children,
  tone = 'pink',
  tilt = -3,
}: {
  children: ReactNode;
  tone?: 'pink' | 'purple' | 'yellow';
  tilt?: number;
}) => {
  const fill = tone === 'purple' ? '#6d4cff' : tone === 'yellow' ? '#ffd24c' : '#ff4d8d';
  const ink = tone === 'yellow' ? '#2d1b4e' : '#fff2e8';
  return (
    <span
      style={
        {
          alignSelf: 'flex-start',
          display: 'inline-block',
          background: fill,
          color: ink,
          padding: '10px 20px',
          borderRadius: 999,
          border: '2px solid #2d1b4e',
          boxShadow: '4px 4px 0 0 #2d1b4e',
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '0.06em',
          transform: `rotate(${tilt}deg)`,
          ['--sp-tilt' as string]: `${tilt}deg`,
          animation: 'sp-pop 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        } as React.CSSProperties
      }
    >
      {children}
    </span>
  );
};

const pageBase: React.CSSProperties = {
  width: '100%',
  height: '100%',
  background: '#fff2e8',
  color: '#2d1b4e',
  padding: '90px 110px',
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  fontFamily: "'Inter', system-ui, sans-serif",
  position: 'relative',
  overflow: 'hidden',
};

const Dot = ({
  size,
  color,
  top,
  left,
  right,
  bottom,
  delay = 0,
}: {
  size: number;
  color: string;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  delay?: number;
}) => (
  <span
    aria-hidden
    style={{
      position: 'absolute',
      top,
      left,
      right,
      bottom,
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      animation: `sp-bob 3.4s ease-in-out ${delay}ms infinite`,
    }}
  />
);

const TOTAL = 3;

const Cover: Page = () => (
  <div style={{ ...pageBase, justifyContent: 'center', gap: 40 }}>
    <style>{styles}</style>
    <Dot size={64} color="#ffd24c" top={120} right={180} delay={0} />
    <Dot size={28} color="#6d4cff" top={220} right={120} delay={300} />
    <Dot size={42} color="#ff4d8d" bottom={220} left={120} delay={600} />
    <Sticker tone="pink" tilt={-4}>
      chapter one
    </Sticker>
    <Title>Big things, made tiny.</Title>
    <p style={{ fontSize: 34, lineHeight: 1.45, color: '#2d1b4e', maxWidth: 1200, margin: 0 }}>
      A short, cheerful tour of the small ideas we have been having lately.
    </p>
    <Footer pageNum={1} total={TOTAL} />
  </div>
);

const items: { tone: 'pink' | 'purple' | 'yellow'; label: string; body: string; tilt: number }[] = [
  {
    tone: 'pink',
    label: 'tiny wins',
    body: 'A two-line patch that saved the team an afternoon every week.',
    tilt: -2,
  },
  {
    tone: 'purple',
    label: 'side quest',
    body: 'A weekend tool that turned into the way we ship demos now.',
    tilt: 1.5,
  },
  {
    tone: 'yellow',
    label: 'one for fun',
    body: 'A toy build that taught us more about caching than any RFC.',
    tilt: -1,
  },
];

const Content: Page = () => (
  <div style={{ ...pageBase, gap: 36 }}>
    <style>{styles}</style>
    <Dot size={36} color="#ffd24c" top={80} right={140} delay={200} />
    <Sticker tone="purple" tilt={-2}>
      what we made
    </Sticker>
    <h2
      style={{
        fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
        fontSize: 64,
        fontWeight: 800,
        lineHeight: 1.05,
        letterSpacing: '-0.02em',
        margin: 0,
        color: '#2d1b4e',
        maxWidth: 1300,
      }}
    >
      Three small things that made us smile.
    </h2>
    <ul
      style={{
        margin: 0,
        padding: 0,
        listStyle: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      {items.map((it, i) => (
        <li
          key={it.label}
          style={{
            background: '#ffe6d3',
            border: '2px solid #2d1b4e',
            borderRadius: 24,
            padding: '24px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            boxShadow: '6px 6px 0 0 #2d1b4e',
            transform: `rotate(${i % 2 === 0 ? -0.6 : 0.6}deg)`,
          }}
        >
          <Sticker tone={it.tone} tilt={it.tilt}>
            {it.label}
          </Sticker>
          <p style={{ fontSize: 28, lineHeight: 1.4, color: '#2d1b4e', margin: 0 }}>{it.body}</p>
        </li>
      ))}
    </ul>
    <Footer pageNum={2} total={TOTAL} />
  </div>
);

const Closer: Page = () => (
  <div style={{ ...pageBase, justifyContent: 'center', gap: 32 }}>
    <style>{styles}</style>
    <Dot size={48} color="#ff4d8d" top={140} right={220} delay={0} />
    <Dot size={24} color="#6d4cff" top={240} right={150} delay={400} />
    <Dot size={36} color="#ffd24c" bottom={240} left={160} delay={800} />
    <Dot size={20} color="#ff4d8d" bottom={320} left={260} delay={1200} />
    <Sticker tone="yellow" tilt={3}>
      that is all
    </Sticker>
    <Title>Made with love.</Title>
    <p style={{ fontSize: 28, lineHeight: 1.45, color: '#2d1b4e', maxWidth: 1100, margin: 0 }}>
      Borrow whatever you like. The dot pattern is on the house.
    </p>
    <Footer pageNum={TOTAL} total={TOTAL} />
  </div>
);

export default [Cover, Content, Closer];
