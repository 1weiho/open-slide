# open-slide — Agent Guide (standalone)

This is a **single standalone slide**. The entire deck is one file: `index.tsx` at
the project root. There is no `slides/` directory, no themes, and no home page.

## Hard rules

- Author the deck in `index.tsx` at the root. Do not create a `slides/` folder.
- `index.tsx` exports:
  - `export default [Page, ...]` — the pages, in order. Each is a zero-prop React
    component rendered on a fixed **1920×1080** canvas.
  - `export const design` — palette / fonts / type scale (optional, recommended).
  - `export const meta` — `{ title }` and metadata (optional).
  - `export const notes` — speaker notes, index-aligned with pages (optional).
- Put images / video / fonts under `assets/` and import them with relative paths,
  e.g. `import logo from './assets/logo.png'`.
- Do **not** touch `package.json` or `open-slide.config.ts`.
- Do not add dependencies. Use only `react` and standard web APIs.

## Canvas & layout

- The canvas is exactly **1920×1080**. Size everything against that — a full-bleed
  page is `width: '100%'; height: '100%'`.
- Read design tokens via CSS variables: `var(--osd-bg)`, `var(--osd-text)`,
  `var(--osd-accent)`, `var(--osd-font-display)`, `var(--osd-font-body)`,
  `var(--osd-size-hero)`, `var(--osd-size-body)`, `var(--osd-radius)`.
- Keep type large and legible — this is a projected slide, not a web page.

## Inspector comments

When the user leaves `@slide-comment` markers in `index.tsx` via the inspector,
resolve each one, apply the requested change, and delete the marker.
