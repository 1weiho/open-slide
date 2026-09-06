import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';
import type { CSSProperties } from 'react';
import anvilIcon from './assets/anvil-icon.png';

export const design: DesignSystem = {
  palette: { bg: '#060806', text: '#F4F7F1', accent: '#76FF86' },
  fonts: {
    display: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif",
    body: "'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif",
  },
  typeScale: { hero: 176, body: 42 },
  radius: 44,
};

const muted = '#9AA49B';
const mono = "'SF Mono', 'JetBrains Mono', Menlo, monospace";

const fill: CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  boxSizing: 'border-box',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: 'var(--osd-font-body)',
};

const Cover: Page = () => (
  <div
    style={{
      ...fill,
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1.15fr) minmax(560px, 0.85fr)',
      alignItems: 'center',
      gap: 84,
      padding: '104px 112px',
    }}
  >
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontFamily: mono,
          fontSize: 23,
          fontWeight: 600,
          letterSpacing: '0.18em',
          lineHeight: 1,
          color: 'var(--osd-accent)',
          textTransform: 'uppercase',
          marginBottom: 54,
        }}
      >
        ● Vision Pro · Spatial training
      </div>

      <h1
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 'var(--osd-size-hero)',
          fontWeight: 800,
          lineHeight: 0.94,
          letterSpacing: '-0.065em',
          margin: 0,
          whiteSpace: 'nowrap',
        }}
      >
        Anvil Vision
      </h1>

      <p
        style={{
          fontSize: 'var(--osd-size-body)',
          fontWeight: 520,
          lineHeight: 1.24,
          letterSpacing: '-0.025em',
          maxWidth: 820,
          margin: '42px 0 0',
        }}
      >
        An AI spatial copilot for physical work.
      </p>

      <p
        style={{
          fontSize: 28,
          fontWeight: 430,
          lineHeight: 1.48,
          color: muted,
          maxWidth: 790,
          margin: '58px 0 0',
        }}
      >
        A training video can show you what to do. Anvil knows what you just did wrong.
      </p>
    </main>

    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 0,
      }}
    >
      <img
        src={anvilIcon}
        alt="Anvil app icon with a green spatial-tracking reticle"
        style={{
          width: 648,
          height: 648,
          maxWidth: '100%',
          objectFit: 'cover',
          borderRadius: 156,
          boxShadow:
            '0 40px 110px rgba(54, 255, 91, 0.14), 0 2px 0 rgba(255, 255, 255, 0.08) inset',
        }}
      />
    </div>
  </div>
);

export const meta: SlideMeta = {
  title: 'Anvil Vision',
  createdAt: '2026-08-29T22:17:46.552Z',
};

export default [Cover] satisfies Page[];
