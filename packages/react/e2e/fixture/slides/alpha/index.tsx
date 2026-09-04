import type { Page, SlideMeta } from '@open-slide/core';

export const meta: SlideMeta = {
  title: 'Alpha Deck',
  theme: 'plain',
  createdAt: '2026-01-03T00:00:00.000Z',
};

const fill = {
  width: '100%',
  height: '100%',
  background: '#101014',
  color: '#f2f2ef',
  padding: 120,
  fontFamily: 'system-ui, sans-serif',
} as const;

const One: Page = () => (
  <div style={fill}>
    <h1 style={{ fontSize: 96, margin: 0 }}>Alpha page one</h1>
    <p style={{ fontSize: 40 }}>Opening content</p>
  </div>
);

const Two: Page = () => (
  <div style={fill}>
    <h1 style={{ fontSize: 96, margin: 0 }}>Alpha page two</h1>
    <p style={{ fontSize: 40 }}>Middle content</p>
  </div>
);

const Three: Page = () => (
  <div style={fill}>
    <h1 style={{ fontSize: 96, margin: 0 }}>Alpha page three</h1>
    <p style={{ fontSize: 40 }}>Closing content</p>
  </div>
);

export const notes: (string | undefined)[] = ['Alpha speaker note', undefined, 'Alpha final note'];

export default [One, Two, Three] satisfies Page[];
