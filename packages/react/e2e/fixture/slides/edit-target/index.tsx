import type { Page, SlideMeta } from '@open-slide/core';

export const meta: SlideMeta = {
  title: 'Edit Target',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const fill = {
  width: '100%',
  height: '100%',
  background: '#1a1408',
  color: '#f5ead2',
  padding: 120,
  fontFamily: 'system-ui, sans-serif',
} as const;

const Only: Page = () => (
  <div style={fill}>
    <h1 style={{ fontSize: 96, margin: 0 }}>Editable headline</h1>
    <p style={{ fontSize: 40 }}>Editable body copy</p>
  </div>
);

export default [Only] satisfies Page[];
