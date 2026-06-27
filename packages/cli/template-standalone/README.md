# open-slide — standalone deck

A standalone open-slide deck. The whole presentation is one file: `index.tsx`.

## Getting started

```bash
npm install
npm run dev
```

The dev server opens straight to your slide — no home page, no folders, no theme
library. Edit `index.tsx` and it hot-reloads.

## Layout

```text
.
├── index.tsx            # your deck — edit this
├── assets/              # images / video / fonts, imported via ./assets/...
└── open-slide.config.ts # mode: 'standalone'
```

## Authoring

`index.tsx` exports:

- `export default [...]` — an array of pages. Each page is a zero-prop React
  component rendered on a fixed **1920×1080** canvas.
- `export const design` — palette, fonts, and type scale. Editable live from the
  Design panel (press `d`); your changes are written back into this file.
- `export const meta` — `{ title }` and other metadata.
- `export const notes` (optional) — speaker notes, index-aligned with pages.

Put images in `assets/` and import them: `import logo from './assets/logo.png'`.

## Present & export

- Press **F** to present fullscreen.
- Use the toolbar to export to HTML, PDF, or PPTX.

## Build

```bash
npm run build      # static site in dist/
npm run preview
```

## Want multiple slides instead?

Scaffold a full workspace with `npx @open-slide/cli init --workspace`.
