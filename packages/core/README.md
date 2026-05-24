# @open-slide/core

Runtime and CLI for [open-slide](https://github.com/1weiho/open-slide) — a React-based slide framework where you write slides and the framework handles the Vite/React stack, layout, navigation, hot reload, and fullscreen play mode.

## Install

```bash
pnpm add @open-slide/core
```

Most users get this installed automatically by running `npx @open-slide/cli init`. Use this package directly only if you're wiring up an existing workspace by hand.

## What's inside

- **Runtime** — home page, slide viewer, thumbnail rail, keyboard navigation, and fullscreen presenter mode. Every slide renders into a fixed **1920×1080** canvas; the framework scales it.
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
};

export default openSlideConfig;
```

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

## PPTX export

The runtime can export the active deck as a PowerPoint file from the download
menu. The primary target is Microsoft PowerPoint Desktop on Windows and Mac.
open-slide writes editable PowerPoint text, rich text, shapes, images, raster
layers, equation fallbacks, and tables where it can, and reports conservative
fallbacks for browser-only effects.

Use the PPTX primitives for content that should stay editable:

```tsx
import { PptxEquation, PptxRasterLayer, PptxTable, PptxText, type Page } from '@open-slide/core';

const Cover: Page = () => (
  <>
    <PptxText style={{ position: 'absolute', left: 120, top: 120, fontSize: 72 }}>
      Editable in PowerPoint
    </PptxText>
    <PptxEquation
      latex="E = mc^2"
      fallbackText="E = m c squared"
      style={{ position: 'absolute', left: 120, top: 240, fontSize: 36 }}
    />
    <PptxTable
      columns={['Metric', 'Status']}
      rows={[['Text', 'Editable']]}
      style={{ position: 'absolute', left: 120, top: 340, width: 520, height: 160 }}
    />
    <PptxRasterLayer
      alt="Decorative texture"
      dataUrl="data:image/png;base64,..."
      reason="browser-only texture"
      style={{ position: 'absolute', left: 720, top: 120, width: 320, height: 220 }}
    />
  </>
);
```

## Exports

```ts
import {
  CANVAS_WIDTH,   // 1920
  CANVAS_HEIGHT,  // 1080
  PptxEquation,
  PptxRasterLayer,
  PptxTable,
  PptxText,
  type Page,
  type SlideMeta,
  type SlideModule,
  type OpenSlideConfig,
} from '@open-slide/core';
```

The Vite plugin is exposed under a subpath for advanced setups:

```ts
import { createViteConfig } from '@open-slide/core/vite';
```

## License

MIT
