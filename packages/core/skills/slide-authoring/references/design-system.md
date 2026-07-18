# Design system (`design` const + `var(--osd-X)`)

A slide can declare its own typed design tokens at the top of `index.tsx`:

```tsx
import type { DesignSystem, Page } from '@open-slide/core';

export const design: DesignSystem = {
  palette: { bg: '#f7f5f0', text: '#1a1814', accent: '#6d4cff' },
  fonts: {
    display: 'Georgia, "Times New Roman", serif',
    body: '-apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif',
  },
  typeScale: { hero: 168, body: 36 },
  radius:    12,
};
```

`export` it (rather than plain `const`) so the framework can read the object and inject CSS variables at the canvas root automatically.

The shape is intentionally minimal — it only covers what the Design panel can currently tweak. Anything outside this set (heading sizes, spacing, motion, extra palette colors) belongs as plain hard-coded constants in the slide file.

## Two consumption surfaces

There are **two consumption surfaces**; both may appear in the same slide:

- **`var(--osd-X)` for visual properties (color, font, font-size, radius)** — these get instant updates while the user drags a slider in the Design panel, before any file write.
  ```tsx
  <div style={{ background: 'var(--osd-bg)', color: 'var(--osd-text)', borderRadius: 'var(--osd-radius)', fontFamily: 'var(--osd-font-body)', fontSize: 'var(--osd-size-body)' }}>
  ```
  Available vars: `--osd-bg`, `--osd-text`, `--osd-accent`, `--osd-font-display`, `--osd-font-body`, `--osd-size-hero`, `--osd-size-body`, `--osd-radius`.

- **Direct `design.X` reads** — when you need a JS number for arithmetic or to label something in the UI. These update via HMR after the panel commits the file, not while dragging.
  ```tsx
  <p>{design.typeScale.hero}px</p>
  ```

## The Design panel

The dev UI has a **Design** button in the slide header (next to Inspect). Edits update an in-memory draft and the live-preview overlay; a floating Save / Discard bar at the bottom of the canvas commits or reverts. The const stays the single source of truth — production builds bake the saved values.

**Default to using it.** Every new slide should declare a `design` const so it stays tweakable from the panel after generation — this is the expected baseline. Only fall back to plain top-of-file constants (`const palette = { bg: …, text: …, accent: … }`, referenced directly in styles) for a one-off slide whose palette is intentionally locked and not meant to be re-themed. Both styles can coexist across slides — the panel only operates on the *currently viewed* slide.

## Format constraints (for the panel's AST writer)

- Must be `export const design: DesignSystem = { … }` (or `as DesignSystem` / `satisfies DesignSystem`) at module top level. (The panel's parser also tolerates a non-exported const, but the runtime reads `design` off the module's exports — without `export`, every `var(--osd-X)` is unresolved.)
- Object initializer must be a literal — no spreads, no helper calls. Plain values only.
- `DesignSystem` must be imported from `@open-slide/core` (the panel adds the import automatically when creating a fresh block).
