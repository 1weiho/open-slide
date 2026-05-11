import type { Page } from '@open-slide/core';
import type { ReactNode } from 'react';

const styles = `
@keyframes bs-fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
`;

const Title = ({ children }: { children: ReactNode }) => (
  <h1
    style={{
      fontFamily: "'Inter Tight', 'Inter', -apple-system, system-ui, sans-serif",
      fontSize: 132,
      fontWeight: 600,
      lineHeight: 1.05,
      letterSpacing: '-0.02em',
      margin: 0,
      color: '#202124',
    }}
  >
    {children}
  </h1>
);

const Footer = ({
  pageNum,
  total,
  dotColor = '#1a73e8',
  label = 'Spring product update',
}: {
  pageNum: number;
  total: number;
  dotColor?: string;
  label?: string;
}) => (
  <div
    style={{
      position: 'absolute',
      left: 120,
      right: 120,
      bottom: 60,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: 18,
      color: '#5f6368',
    }}
  >
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      <span
        aria-hidden
        style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor }}
      />
      {label}
    </span>
    <span>
      {pageNum} / {total}
    </span>
  </div>
);

const Eyebrow = ({
  children,
  tone = 'blue',
}: {
  children: ReactNode;
  tone?: 'blue' | 'red' | 'yellow' | 'green';
}) => {
  const fill =
    tone === 'red'
      ? '#ea4335'
      : tone === 'yellow'
        ? '#fbbc04'
        : tone === 'green'
          ? '#34a853'
          : '#1a73e8';
  const ink = tone === 'yellow' ? '#202124' : '#ffffff';
  return (
    <span
      style={{
        alignSelf: 'flex-start',
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 18px',
        borderRadius: 999,
        background: fill,
        color: ink,
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 16,
        fontWeight: 600,
        letterSpacing: '0.04em',
      }}
    >
      {children}
    </span>
  );
};

const pageBase: React.CSSProperties = {
  width: '100%',
  height: '100%',
  background: '#ffffff',
  color: '#202124',
  padding: '100px 120px',
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
};

const TOTAL = 3;

const Cover: Page = () => (
  <div
    style={{
      ...pageBase,
      justifyContent: 'center',
      gap: 36,
      animation: 'bs-fadeUp 500ms ease-out both',
    }}
  >
    <style>{styles}</style>
    <Eyebrow tone="blue">Spring update · 2026</Eyebrow>
    <Title>Built for the moments that matter.</Title>
    <p style={{ fontSize: 32, lineHeight: 1.5, color: '#5f6368', maxWidth: 1180, margin: 0 }}>
      Four small features that make the next eight months of work feel a little easier.
    </p>
    <Footer pageNum={1} total={TOTAL} />
  </div>
);

type Card = {
  tone: 'blue' | 'red' | 'yellow' | 'green';
  fill: string;
  title: string;
  body: string;
};

const cards: Card[] = [
  {
    tone: 'blue',
    fill: '#1a73e8',
    title: 'Smart drafts',
    body: 'Pick up a thought from anywhere and finish it in one place.',
  },
  {
    tone: 'red',
    fill: '#ea4335',
    title: 'Fewer alerts',
    body: 'We grouped seventeen kinds of notifications down to four.',
  },
  {
    tone: 'yellow',
    fill: '#fbbc04',
    title: 'Faster replies',
    body: 'Suggested responses now read your tone, not just your inbox.',
  },
  {
    tone: 'green',
    fill: '#34a853',
    title: 'Cleaner search',
    body: 'Find a doc by what you remember, not by what you titled it.',
  },
];

const Content: Page = () => (
  <div style={{ ...pageBase, gap: 40 }}>
    <style>{styles}</style>
    <Eyebrow tone="blue">What is new</Eyebrow>
    <h2
      style={{
        fontFamily: "'Inter Tight', 'Inter', system-ui, sans-serif",
        fontSize: 56,
        fontWeight: 600,
        lineHeight: 1.1,
        letterSpacing: '-0.015em',
        margin: 0,
        color: '#202124',
        maxWidth: 1300,
      }}
    >
      Four features, one quiet release.
    </h2>
    <ul
      style={{
        margin: 0,
        padding: 0,
        listStyle: 'none',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 24,
        marginTop: 8,
      }}
    >
      {cards.map((c, i) => (
        <li
          key={c.title}
          style={{
            background: '#f7f9fc',
            border: '1px solid #e8eaed',
            borderRadius: 24,
            padding: 36,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            animation: `bs-fadeUp 500ms ease-out both`,
            animationDelay: `${i * 80}ms`,
          }}
        >
          <span
            aria-hidden
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: c.fill,
            }}
          />
          <h3
            style={{
              fontFamily: "'Inter Tight', 'Inter', system-ui, sans-serif",
              fontSize: 32,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              margin: 0,
              color: '#202124',
            }}
          >
            {c.title}
          </h3>
          <p
            style={{
              fontSize: 22,
              lineHeight: 1.5,
              color: '#5f6368',
              margin: 0,
            }}
          >
            {c.body}
          </p>
        </li>
      ))}
    </ul>
    <Footer pageNum={2} total={TOTAL} />
  </div>
);

const Closer: Page = () => (
  <div
    style={{
      ...pageBase,
      justifyContent: 'center',
      gap: 32,
      animation: 'bs-fadeUp 500ms ease-out both',
    }}
  >
    <style>{styles}</style>
    <Eyebrow tone="green">Available today</Eyebrow>
    <Title>Roll out at your own pace.</Title>
    <p style={{ fontSize: 28, lineHeight: 1.5, color: '#5f6368', maxWidth: 1180, margin: 0 }}>
      Everything in this deck is opt-in. Turn it on for one team, then the next, then the rest.
    </p>
    <Footer pageNum={TOTAL} total={TOTAL} dotColor="#34a853" label="Available today" />
  </div>
);

export default [Cover, Content, Closer];
