# @open-slide/core

Runtime and CLI for [open-slide](https://github.com/1weiho/open-slide) — a React-based slide framework where you write slides and the framework handles the Vite/React stack, layout, navigation, hot reload, and fullscreen play mode.

## Install

```bash
pnpm add @open-slide/core
```

Most users get this installed automatically by running `npx @open-slide/cli init`. Use this package directly only if you're wiring up an existing workspace by hand.

## What's inside

- **Runtime** — home page, slide viewer, thumbnail rail, keyboard navigation, and fullscreen presenter mode. Every slide renders into a fixed pixel canvas — **1920×1080** by default, configurable via `canvas` — and the framework scales it.
- **Vite plugin** — discovers `slides/<id>/index.{tsx,jsx,ts,js}`, exposes them via virtual modules, and reloads when slides are added or removed.
- **CLI** — `open-slide dev | build | preview` so workspaces never need to touch Vite, React, or tsconfig directly.

## CLI

Once installed, the `open-slide` bin is available in the workspace:

| Command | Description |
| --- | --- |
| `open-slide dev` | Start the dev server. Flags: `-p, --port <port>`, `--host [host]`, `--open`. |
| `open-slide build` | Build a static site. Flags: `--out-dir <dir>` (defaults to `dist`). |
| `open-slide preview` | Preview the production build. Flags: `-p, --port <port>`, `--host [host]`, `--open`. |

## Config

Create `open-slide.config.ts` in the workspace root (all fields optional):

```ts
import type { OpenSlideConfig } from '@open-slide/core';

const openSlideConfig: OpenSlideConfig = {
  slidesDir: 'slides',
  port: 5173,
  canvas: '16:9',
};

export default openSlideConfig;
```

### Canvas size

`canvas` sets the pixel canvas every slide renders into. It takes a named preset or explicit dimensions:

```ts
const openSlideConfig: OpenSlideConfig = {
  canvas: '4:5', // or { width: 1080, height: 1350 }
};
```

| Preset | Size | Typical use |
| --- | --- | --- |
| `'16:9'` *(default)* | 1920 × 1080 | Talks, screen shares |
| `'4:3'` | 1440 × 1080 | Projectors, older displays |
| `'4:5'` | 1080 × 1350 | LinkedIn document carousels, Instagram |
| `'1:1'` | 1080 × 1080 | Square social posts |
| `'9:16'` | 1080 × 1920 | Stories, Reels, Shorts |

The setting is workspace-wide and flows through the viewer, thumbnails, presenter, and the PDF, HTML, and PPTX exports — a PDF exported from a `'4:5'` workspace has 1080 × 1350 pages. Landscape presets keep the 1080px height so a deck authored at 1920 × 1080 keeps its type scale when narrowed.

Slides do not reflow. The canvas is scaled to fit, so changing this on an existing deck re-frames its layout rather than adapting it.

### Hosting under a subpath

Set `base` to deploy the built site under a sub-directory (intranet folders, GitHub Pages project sites, reverse proxies). Use a leading and trailing slash:

```ts
const openSlideConfig: OpenSlideConfig = {
  base: '/my-slides/',
};
```

The value is passed straight to Vite's `base` and to React Router's `basename`, so client-side navigation matches the deployed path.

## Authoring slides

Slides live under `slides/<kebab-case-id>/index.tsx` and default-export an array of `Page` components:

```tsx
import type { Page } from '@open-slide/core';

const Cover: Page = () => (
  <div className="flex h-full w-full items-center justify-center">
    <h1 className="text-[120px] font-bold">Hello, open-slide</h1>
  </div>
);

const pages: Page[] = [Cover];
export default pages;

export const meta = { title: 'Hello' };
```

## Exports

```ts
import {
  CANVAS_WIDTH,   // 1920 by default, or whatever `canvas` resolves to
  CANVAS_HEIGHT,  // 1080 by default
  MorphElement,   // match or fade objects across pages for morph transitions
  type Page,
  type SlideMeta,
  type SlideModule,
  type SlideTransition,
  type OpenSlideConfig,
} from '@open-slide/core';
```

The Vite plugin is exposed under a subpath for advanced setups:

```ts
import { createViteConfig } from '@open-slide/core/vite';
```

## License

MIT
