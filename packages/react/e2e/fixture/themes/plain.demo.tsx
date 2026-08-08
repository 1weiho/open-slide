import type { Page } from '@open-slide/core';

const base = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#0b0b0f',
  color: '#f5f5f5',
} as const;

const One: Page = () => (
  <div style={base}>
    <h1 style={{ fontSize: 96, margin: 0 }}>Theme demo one</h1>
  </div>
);

const Two: Page = () => (
  <div style={base}>
    <h1 style={{ fontSize: 96, margin: 0 }}>Theme demo two</h1>
  </div>
);

export default [One, Two] satisfies Page[];
