import {
  type DesignSystem,
  Mermaid,
  type Page,
  type SlideMeta,
  useSlidePageNumber,
} from '@open-slide/core';
import type { ReactNode } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#0b1020', text: '#f4f7ff', accent: '#8b9cff' },
  fonts: {
    display: "'Space Grotesk', 'Avenir Next', system-ui, sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  },
  typeScale: { hero: 164, body: 34 },
  radius: 18,
};

const muted = '#aab4d0';
const faint = '#65708e';
const surface = '#141b35';
const rule = 'rgba(170, 180, 208, 0.18)';
const mint = '#79f2c0';
const warm = '#ffc27a';

const mermaidConfig = {
  theme: 'dark',
  themeVariables: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '22px',
    primaryColor: '#202b52',
    primaryTextColor: '#f4f7ff',
    primaryBorderColor: '#8b9cff',
    lineColor: '#8b9cff',
    secondaryColor: '#173e42',
    tertiaryColor: '#3f2f27',
  },
} as const;

const fill = {
  width: '100%',
  height: '100%',
  boxSizing: 'border-box' as const,
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: 'var(--osd-font-body)',
  position: 'relative' as const,
} as const;

const grid = {
  position: 'absolute' as const,
  inset: 0,
  pointerEvents: 'none' as const,
  opacity: 0.32,
  backgroundImage: `linear-gradient(${rule} 1px, transparent 1px), linear-gradient(90deg, ${rule} 1px, transparent 1px)`,
  backgroundSize: '80px 80px',
  maskImage: 'linear-gradient(120deg, black, transparent 72%)',
};

const Eyebrow = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      color: 'var(--osd-accent)',
      fontFamily: 'var(--osd-font-display)',
      fontSize: 21,
      fontWeight: 600,
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
    }}
  >
    {children}
  </div>
);

const Footer = ({ label }: { label: string }) => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={{
        position: 'absolute',
        left: 144,
        right: 144,
        bottom: 46,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: `1px solid ${rule}`,
        paddingTop: 18,
        color: faint,
        fontFamily: 'var(--osd-font-display)',
        fontSize: 19,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      <span>
        <span style={{ color: 'var(--osd-accent)' }}>●</span>
        <span style={{ marginLeft: 14 }}>{label}</span>
      </span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
        {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
    </div>
  );
};

const diagramFallback = (
  <div
    style={{
      display: 'grid',
      placeItems: 'center',
      width: '100%',
      height: '100%',
      color: warm,
      fontSize: 28,
    }}
  >
    Diagram unavailable
  </div>
);

const flowchart = `
flowchart LR
  A[Intent] --> B[index.tsx]
  B --> C[Chart string]
  C --> D[Mermaid component]
  D --> E[SVG on canvas]
`;

const sequence = `
sequenceDiagram
  participant B as Browser
  participant O as Mermaid
  participant M as mermaid.js
  B->>O: mount with chart
  O->>M: render(chart)
  M-->>O: SVG + bind functions
  O-->>B: inject SVG
`;

const lifecycle = `
stateDiagram-v2
  direction LR
  [*] --> Idle
  Idle --> Loading: change
  Loading --> Rendered: ready
  Loading --> Failed: error
  Rendered --> Loading: edit
  Failed --> Loading: fix
  Rendered --> [*]
`;

const Cover: Page = () => (
  <div style={{ ...fill, padding: '126px 144px' }}>
    <div style={grid} aria-hidden="true" />
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: -260,
        right: -120,
        width: 780,
        height: 780,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,156,255,0.24), transparent 68%)',
      }}
    />
    <div
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '1.05fr 0.95fr',
        gap: 100,
        alignItems: 'center',
        height: '100%',
      }}
    >
      <div>
        <Eyebrow>open-slide · mermaid</Eyebrow>
        <h1
          style={{
            margin: '34px 0 30px',
            maxWidth: 900,
            fontFamily: 'var(--osd-font-display)',
            fontSize: 'var(--osd-size-hero)',
            fontWeight: 700,
            lineHeight: 0.98,
            letterSpacing: '-0.05em',
          }}
        >
          Diagrams that
          <br />
          <span style={{ color: 'var(--osd-accent)' }}>carry meaning.</span>
        </h1>
        <p
          style={{
            maxWidth: 760,
            margin: 0,
            color: muted,
            fontSize: 34,
            lineHeight: 1.45,
          }}
        >
          Mermaid turns a few lines of text into a visual explanation — right inside a 1920×1080
          slide.
        </p>
      </div>
      <div
        style={{
          padding: 36,
          border: `1px solid ${rule}`,
          borderRadius: 'var(--osd-radius)',
          background: 'rgba(20, 27, 53, 0.78)',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.24)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 30,
            color: faint,
            fontFamily: 'var(--osd-font-display)',
            fontSize: 18,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          <span>three diagrams</span>
          <span style={{ color: mint }}>ready</span>
        </div>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <span style={{ color: 'var(--osd-accent)', fontSize: 28 }}>→</span>
            <span style={{ fontSize: 30 }}>Flowchart · paths</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <span style={{ color: mint, fontSize: 28 }}>↔</span>
            <span style={{ fontSize: 30 }}>Sequence · timing</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <span style={{ color: warm, fontSize: 28 }}>◌</span>
            <span style={{ fontSize: 30 }}>State · lifecycle</span>
          </div>
        </div>
        <div
          style={{
            marginTop: 38,
            paddingTop: 24,
            borderTop: `1px solid ${rule}`,
            color: faint,
            fontFamily: 'var(--osd-font-display)',
            fontSize: 20,
          }}
        >
          <span style={{ color: 'var(--osd-accent)' }}>Mermaid</span> is the source. SVG is the
          result.
        </div>
      </div>
    </div>
    <Footer label="mermaid showcase" />
  </div>
);

const DiagramPage = ({
  eyebrow,
  title,
  description,
  chart,
  note,
}: {
  eyebrow: string;
  title: string;
  description: string;
  chart: string;
  note: string;
}) => (
  <div style={{ ...fill, padding: '104px 144px 118px' }}>
    <div style={grid} aria-hidden="true" />
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
        height: '100%',
      }}
    >
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2
          style={{
            margin: '24px 0 14px',
            fontFamily: 'var(--osd-font-display)',
            fontSize: 82,
            fontWeight: 700,
            lineHeight: 1.02,
            letterSpacing: '-0.04em',
          }}
        >
          {title}
        </h2>
        <p style={{ maxWidth: 1100, margin: 0, color: muted, fontSize: 28, lineHeight: 1.4 }}>
          {description}
        </p>
      </div>
      <div
        style={{
          boxSizing: 'border-box',
          flex: '0 0 520px',
          height: 520,
          padding: '24px 44px',
          border: `1px solid ${rule}`,
          borderRadius: 'var(--osd-radius)',
          background: surface,
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.18)',
        }}
      >
        <Mermaid
          chart={chart}
          config={mermaidConfig}
          style={{ width: '100%', height: 470, display: 'block' }}
          fallback={diagramFallback}
        />
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flex: '0 0 auto',
          color: faint,
          fontFamily: 'var(--osd-font-display)',
          fontSize: 20,
          letterSpacing: '0.04em',
        }}
      >
        <span style={{ color: 'var(--osd-accent)', fontSize: 26 }}>✦</span>
        <span>{note}</span>
      </div>
    </div>
    <Footer label="mermaid showcase" />
  </div>
);

const FlowchartPage: Page = () => (
  <DiagramPage
    eyebrow="01 · flowchart"
    title="Follow the path."
    description="Use a flowchart when the order of work and the dependencies between steps are the story."
    chart={flowchart}
    note="Left to right keeps the transformation legible at a glance."
  />
);

const SequencePage: Page = () => (
  <DiagramPage
    eyebrow="02 · sequence diagram"
    title="Watch the handoff."
    description="Use a sequence diagram when timing matters — who calls whom, and what comes back."
    chart={sequence}
    note="The arrows make the runtime contract visible without extra prose."
  />
);

const StatePage: Page = () => (
  <DiagramPage
    eyebrow="03 · state diagram"
    title="Name every state."
    description="Use a state diagram when a thing changes over time and failure is part of the story."
    chart={lifecycle}
    note="A named failure path is more useful than a happy-path-only diagram."
  />
);

export const meta: SlideMeta = {
  title: 'Mermaid showcase',
  createdAt: '2026-08-19T19:48:54.417Z',
};

export default [Cover, FlowchartPage, SequencePage, StatePage] satisfies Page[];
