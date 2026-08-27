# @open-slide/core

Runtime and CLI for [open-slide](https://github.com/1weiho/open-slide) — a React-based slide framework where you write slides and the framework handles the Vite/React stack, layout, navigation, hot reload, and fullscreen play mode.

## Install

```bash
pnpm add @open-slide/core
```

Most users get this installed automatically by running `npx @open-slide/cli init`. Use this package directly only if you're wiring up an existing workspace by hand.

## What's inside

- **Runtime** — home page, slide viewer, thumbnail rail, keyboard navigation, and fullscreen presenter mode. Every slide is authored and rendered on one configured canvas: **1920×1080** by default, a **4K / 8K** preset, or explicit dimensions.
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
  canvas: '4k',
};

export default openSlideConfig;
```

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

Use `canvas: '1080p' | '4k' | '8k' | { width, height }` to choose the
end-to-end canvas and output target. Source coordinates use those exact pixel
dimensions. For example, `canvas: { width: 1080, height: 1350 }` creates a
portrait workspace.

## Exports

```ts
import {
  CANVAS_WIDTH,   // configured width (1920 by default)
  CANVAS_HEIGHT,  // configured height (1080 by default)
  MorphElement,   // match or fade objects across pages for morph transitions
  type Page,
  type SlideMeta,
  type SlideModule,
  type SlideTransition,
  type OpenSlideConfig,
} from '@open-slide/core';
```

`CANVAS_WIDTH` and `CANVAS_HEIGHT` follow the workspace's configured canvas in
Vite-powered slide projects.

The Vite plugin is exposed under a subpath for advanced setups:

```ts
import { createViteConfig } from '@open-slide/core/vite';
```

## License

MIT
