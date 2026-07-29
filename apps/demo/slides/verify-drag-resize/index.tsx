import type { Page, SlideMeta } from '@open-slide/core';

// Fixture for tools/verify-drag-resize.mjs. The heading text is what the script
// clicks on, so keep it in sync with the script's default selector.

const Cover: Page = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: '#0d0d10',
      color: '#f4f4f5',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '0 160px',
      gap: 32,
    }}
  >
    <p style={{ fontSize: 28, letterSpacing: 6, color: '#8b5cf6', margin: 0 }}>DRAG AND RESIZE</p>
    <h1 style={{ fontSize: 120, fontWeight: 700, lineHeight: 1.05, margin: 0 }}>
      Original headline of the cover
    </h1>
    <p style={{ fontSize: 40, color: '#a1a1aa', margin: 0 }}>
      This paragraph exists so the fixture has more than one text block.
    </p>
  </div>
);

export const meta: SlideMeta = { title: 'Verify drag and resize', createdAt: '2026-07-29' };
export default [Cover] satisfies Page[];
