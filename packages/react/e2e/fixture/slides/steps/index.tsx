import { type Page, type SlideMeta, Step, Steps } from '@open-slide/core';

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

export default [One, Two, Three] satisfies Page[];
