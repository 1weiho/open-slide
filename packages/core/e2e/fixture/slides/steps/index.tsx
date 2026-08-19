import { Mermaid, type Page, type SlideMeta, Step, Steps } from '@open-slide/core';
import { useEffect, useState } from 'react';

export const meta: SlideMeta = {
  title: 'Steps Deck',
  createdAt: '2026-01-02T00:00:00.000Z',
};

const fill = {
  width: '100%',
  height: '100%',
  background: '#0d1117',
  color: '#e6edf3',
  padding: 120,
  fontFamily: 'system-ui, sans-serif',
} as const;

const One: Page = () => (
  <div style={fill}>
    <h1 style={{ fontSize: 96, margin: 0 }}>Steps page one</h1>
  </div>
);

const Two: Page = () => (
  <div style={fill}>
    <h1 style={{ fontSize: 96, margin: 0 }}>Steps page two</h1>
    <Steps>
      <Step>
        <p style={{ fontSize: 40 }}>Step item first</p>
      </Step>
      <Step>
        <p style={{ fontSize: 40 }}>Step item second</p>
      </Step>
    </Steps>
  </div>
);

const Three: Page = () => (
  <div style={fill}>
    <h1 style={{ fontSize: 96, margin: 0 }}>Steps page three</h1>
  </div>
);

const MermaidPage: Page = () => {
  const [updated, setUpdated] = useState(false);
  useEffect(() => {
    const update = () => setUpdated(true);
    window.addEventListener('open-slide-mermaid-update', update);
    return () => window.removeEventListener('open-slide-mermaid-update', update);
  }, []);
  const firstChart = updated
    ? 'flowchart LR\n  Updated[Updated source] --> Result'
    : 'flowchart LR\n  Initial[Initial source] --> Result';

  return (
    <div style={{ ...fill, padding: 80 }}>
      <h1 style={{ fontSize: 72, margin: '0 0 24px' }}>Mermaid diagrams</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, height: 480 }}>
        <Mermaid chart={firstChart} />
        <Mermaid chart={'sequenceDiagram\n  Client->>API: Request\n  API-->>Client: Response'} />
      </div>
      <Mermaid
        chart="this is not valid mermaid syntax"
        fallback={<div data-testid="custom-mermaid-fallback">Diagram unavailable</div>}
        style={{ height: 140 }}
      />
    </div>
  );
};

export default [One, Two, Three, MermaidPage] satisfies Page[];
