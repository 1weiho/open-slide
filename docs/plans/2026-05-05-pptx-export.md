# PPTX Export Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add hybrid PPTX export to open-slide so decks can download high-quality PowerPoint files with editable native objects where possible.

**Architecture:** Build a browser-side PPTX export pipeline in `@open-slide/core`. The exporter uses explicit export-aware primitives when present, falls back to conservative DOM-to-scene inference for existing slides, and logs unsupported rasterized cases to developer logs instead of product UI.

**Tech Stack:** React 18, Vite 5, TypeScript, Vitest, `pptxgenjs`, existing open-slide `1920 x 1080` canvas model, existing HTML/PDF export patterns.

---

### Task 1: Add PPTX Dependency And Public Config

**Files:**
- Modify: `packages/core/package.json`
- Modify: `packages/core/src/config.ts`
- Modify: `packages/core/src/vite/open-slide-plugin.ts`
- Test: `packages/core/src/vite/open-slide-plugin.test.ts`
- Create: `.changeset/<generated-name>.md`

**Step 1: Add dependency**

Add `pptxgenjs` to `packages/core/package.json` dependencies.

Expected package entry:

```json
"pptxgenjs": "^4.0.1"
```

**Step 2: Add config field**

Extend `OpenSlideBuildConfig`:

```ts
export type OpenSlideBuildConfig = {
  showSlideBrowser?: boolean;
  showSlideUi?: boolean;
  allowHtmlDownload?: boolean;
  allowPptxDownload?: boolean;
};
```

**Step 3: Resolve defaults in Vite config virtual module**

In `open-slide-plugin.ts`, set `allowPptxDownload` the same way as `allowHtmlDownload`:

```ts
const buildResolved = isDev
  ? {
      showSlideBrowser: true,
      showSlideUi: true,
      allowHtmlDownload: true,
      allowPptxDownload: true,
    }
  : {
      showSlideBrowser: userBuild.showSlideBrowser ?? true,
      showSlideUi: userBuild.showSlideUi ?? true,
      allowHtmlDownload: userBuild.allowHtmlDownload ?? true,
      allowPptxDownload: userBuild.allowPptxDownload ?? true,
    };
```

**Step 4: Add/update tests**

In `open-slide-plugin.test.ts`, assert dev and build virtual config include `allowPptxDownload`.

Expected test intent:

```ts
expect(config.build.allowPptxDownload).toBe(true);
```

Also test `allowPptxDownload: false` survives production config resolution.

**Step 5: Verify**

Run:

```bash
pnpm core typecheck
pnpm test packages/core/src/vite/open-slide-plugin.test.ts
```

Expected: both pass.

**Step 6: Commit**

```bash
git add packages/core/package.json packages/core/src/config.ts packages/core/src/vite/open-slide-plugin.ts packages/core/src/vite/open-slide-plugin.test.ts pnpm-lock.yaml .changeset/*.md
git commit -m "feat: add pptx export config"
```

---

### Task 2: Define PPTX Scene Types

**Files:**
- Create: `packages/core/src/app/lib/pptx/scene.ts`
- Create: `packages/core/src/app/lib/pptx/scene.test.ts`

**Step 1: Write scene type tests**

Test the helpers that create a slide and validate canvas bounds:

```ts
import { describe, expect, it } from 'vitest';
import { createPptxSlide, isRenderableNode } from './scene';

describe('pptx scene', () => {
  it('creates a slide scene with default dimensions', () => {
    const slide = createPptxSlide();
    expect(slide.width).toBe(1920);
    expect(slide.height).toBe(1080);
    expect(slide.nodes).toEqual([]);
  });

  it('rejects nodes without positive size', () => {
    expect(isRenderableNode({ kind: 'shape', x: 0, y: 0, w: 0, h: 10 })).toBe(false);
  });
});
```

**Step 2: Implement scene types**

Create discriminated unions:

```ts
export type PptxRect = { x: number; y: number; w: number; h: number; rotation?: number };

export type PptxTextNode = PptxRect & {
  kind: 'text';
  text: string;
  style: PptxTextStyle;
};

export type PptxShapeNode = PptxRect & {
  kind: 'shape';
  shape: 'rect' | 'roundRect' | 'ellipse' | 'line';
  fill?: string;
  stroke?: PptxStroke;
};

export type PptxImageNode = PptxRect & {
  kind: 'image';
  src: string;
  alt?: string;
  fit?: 'contain' | 'cover' | 'stretch';
};

export type PptxRasterNode = PptxRect & {
  kind: 'raster';
  dataUrl: string;
  reason: string;
};
```

Include `PptxSceneNode`, `PptxSlideScene`, `createPptxSlide`, and `isRenderableNode`.

**Step 3: Verify**

Run:

```bash
pnpm test packages/core/src/app/lib/pptx/scene.test.ts
pnpm core typecheck
```

Expected: pass.

**Step 4: Commit**

```bash
git add packages/core/src/app/lib/pptx/scene.ts packages/core/src/app/lib/pptx/scene.test.ts
git commit -m "feat: define pptx scene model"
```

---

### Task 3: Add CSS Extraction Utilities

**Files:**
- Create: `packages/core/src/app/lib/pptx/css.ts`
- Create: `packages/core/src/app/lib/pptx/css.test.ts`

**Step 1: Write tests**

Cover RGB, hex, transparent, font size, font weight, line height, and text alignment:

```ts
expect(normalizeCssColor('rgb(255, 79, 26)')).toBe('FF4F1A');
expect(normalizeCssColor('rgba(0, 0, 0, 0)')).toBeUndefined();
expect(parseCssPx('24px')).toBe(24);
```

**Step 2: Implement utilities**

Add:

- `normalizeCssColor(value: string): string | undefined`
- `parseCssPx(value: string): number | undefined`
- `fontWeightToBold(value: string): boolean`
- `readElementTextStyle(el: Element): PptxTextStyle`
- `readElementRect(el: Element, canvas: Element): PptxRect | null`

Only support clear cases in v1. Return `undefined` for unsupported color syntax such as gradients.

**Step 3: Verify**

Run:

```bash
pnpm test packages/core/src/app/lib/pptx/css.test.ts
pnpm core typecheck
```

Expected: pass.

**Step 4: Commit**

```bash
git add packages/core/src/app/lib/pptx/css.ts packages/core/src/app/lib/pptx/css.test.ts
git commit -m "feat: add pptx css extraction"
```

---

### Task 4: Build DOM Fallback Collector

**Files:**
- Create: `packages/core/src/app/lib/pptx/dom-collector.ts`
- Create: `packages/core/src/app/lib/pptx/dom-collector.test.ts`

**Step 1: Write tests**

Use jsdom-compatible elements to verify:

- plain text element becomes `text`
- simple background div becomes `shape`
- image becomes `image`
- unsupported filter creates a diagnostic

Example intent:

```ts
const scene = collectDomPptxScene(canvas);
expect(scene.nodes.some((n) => n.kind === 'text' && n.text === 'Hello')).toBe(true);
expect(scene.diagnostics[0]?.level).toBe('warn');
```

**Step 2: Implement collector**

Export:

```ts
export function collectDomPptxScene(canvas: HTMLElement): PptxSlideScene;
```

Collector rules:

- Walk descendants in DOM order.
- Skip elements with `display: none`, `visibility: hidden`, or zero opacity.
- Skip children of elements already handled as a primitive export node.
- Convert text leaf elements with non-empty visible text.
- Convert simple visual boxes when they have background, border, or radius.
- Convert `HTMLImageElement`.
- Add diagnostics for unsupported effects.

**Step 3: Log diagnostics only in dev/debug**

Add a helper:

```ts
export function logPptxDiagnostics(slideIndex: number, diagnostics: PptxDiagnostic[]): void;
```

It should use `console.info` / `console.warn`, not product UI.

**Step 4: Verify**

Run:

```bash
pnpm test packages/core/src/app/lib/pptx/dom-collector.test.ts
pnpm core typecheck
```

Expected: pass.

**Step 5: Commit**

```bash
git add packages/core/src/app/lib/pptx/dom-collector.ts packages/core/src/app/lib/pptx/dom-collector.test.ts
git commit -m "feat: collect pptx scene from dom"
```

---

### Task 5: Add Export-Aware Primitives

**Files:**
- Create: `packages/core/src/app/components/pptx/index.tsx`
- Modify: `packages/core/src/index.ts`
- Create: `packages/core/src/app/components/pptx/pptx-primitives.test.tsx`

**Step 1: Write tests**

Test that primitives render normal HTML and attach metadata:

```tsx
render(<PptxText style={{ fontSize: 40 }}>Hello</PptxText>);
expect(screen.getByText('Hello')).toBeInTheDocument();
expect(screen.getByText('Hello')).toHaveAttribute('data-osd-pptx-kind', 'text');
```

Use the repo’s current React test setup. If no DOM test helper exists, use plain Vitest plus `react-dom/client` in a document element.

**Step 2: Implement primitives**

Add:

- `PptxText`
- `PptxBox`
- `PptxImage`
- `PptxShape`
- `PptxGroup`

Each should render a normal element and set `data-osd-pptx-kind`. Keep props minimal and close to React HTML props.

Example:

```tsx
export function PptxText({ children, ...props }: PptxTextProps) {
  return (
    <div {...props} data-osd-pptx-kind="text">
      {children}
    </div>
  );
}
```

**Step 3: Update collector**

Make `dom-collector.ts` prefer primitive metadata over generic inference.

**Step 4: Export public API**

In `packages/core/src/index.ts`, export primitive components and props.

**Step 5: Verify**

Run:

```bash
pnpm test packages/core/src/app/components/pptx/pptx-primitives.test.tsx
pnpm core typecheck
```

Expected: pass.

**Step 6: Commit**

```bash
git add packages/core/src/app/components/pptx packages/core/src/index.ts packages/core/src/app/lib/pptx/dom-collector.ts
git commit -m "feat: add pptx export primitives"
```

---

### Task 6: Write PPTX File Exporter

**Files:**
- Create: `packages/core/src/app/lib/pptx/write-pptx.ts`
- Create: `packages/core/src/app/lib/pptx/write-pptx.test.ts`

**Step 1: Write tests**

Create a scene with one text node and export it:

```ts
const blob = await writePptxFile({
  title: 'Test',
  slides: [{ width: 1920, height: 1080, nodes: [textNode], diagnostics: [] }],
});
expect(blob.type).toContain('presentation');
expect(blob.size).toBeGreaterThan(0);
```

If inspecting the zip is practical with `fflate`, assert it contains `ppt/slides/slide1.xml` and the text string.

**Step 2: Implement writer**

Use `pptxgenjs` browser API. Create a wide layout corresponding to `1920 x 1080`.

Add helpers:

- `pxToIn(px: number): number`
- `addTextNode(slide, node)`
- `addShapeNode(slide, node)`
- `addImageNode(slide, node)`
- `addRasterNode(slide, node)`

Start with text, shapes, images, and raster nodes. Defer tables/charts to later tasks.

**Step 3: Speaker notes**

Support `notes?: string[]` in the export request and write notes if `pptxgenjs` supports notes in the selected API. If not supported, document it in code with a TODO and test only current behavior.

**Step 4: Verify**

Run:

```bash
pnpm test packages/core/src/app/lib/pptx/write-pptx.test.ts
pnpm core typecheck
```

Expected: pass.

**Step 5: Commit**

```bash
git add packages/core/src/app/lib/pptx/write-pptx.ts packages/core/src/app/lib/pptx/write-pptx.test.ts
git commit -m "feat: write pptx files"
```

---

### Task 7: Add SlideModule PPTX Export Flow

**Files:**
- Create: `packages/core/src/app/lib/export-pptx.ts`
- Create: `packages/core/src/app/lib/export-pptx.test.ts`

**Step 1: Write tests**

Test that `exportSlideAsPptx` exits early for empty slides and calls download for non-empty slides. Factor `downloadBlob` so it can be injected in tests.

**Step 2: Implement offscreen render pipeline**

Follow `export-html.ts` and `export-pdf.ts` patterns:

- Create hidden fixed render root.
- Render each page at `1920 x 1080`.
- Apply `designToCssVars`.
- Wait two animation frames.
- Wait for fonts.
- Wait for `data-waitfor`.
- Collect PPTX scene from `[data-osd-canvas]`.
- Write PPTX blob.
- Download `${slideId}.pptx`.

**Step 3: Keep diagnostics out of UI**

Call `logPptxDiagnostics` after each scene collection. Do not add toasts for warnings or a UI report.

**Step 4: Verify**

Run:

```bash
pnpm test packages/core/src/app/lib/export-pptx.test.ts
pnpm core typecheck
```

Expected: pass.

**Step 5: Commit**

```bash
git add packages/core/src/app/lib/export-pptx.ts packages/core/src/app/lib/export-pptx.test.ts
git commit -m "feat: export slides as pptx"
```

---

### Task 8: Add Toolbar Menu Item And Locales

**Files:**
- Modify: `packages/core/src/app/routes/slide.tsx`
- Modify: `packages/core/src/locale/types.ts`
- Modify: `packages/core/src/locale/en.ts`
- Modify: `packages/core/src/locale/ja.ts`
- Modify: `packages/core/src/locale/zh-cn.ts`
- Modify: `packages/core/src/locale/zh-tw.ts`

**Step 1: Add locale keys**

Add:

```ts
exportAsPptx: string;
pptxExportFailed: string;
```

English:

```ts
exportAsPptx: 'Export as PPTX',
pptxExportFailed: 'PPTX export failed',
```

Use direct translations matching the style of PDF/HTML keys for other locales.

**Step 2: Import PPTX exporter and icon**

In `slide.tsx`, import `FileType2` or another existing lucide file icon and `exportSlideAsPptx`.

**Step 3: Gate menu item**

Read:

```ts
const { showSlideUi, showSlideBrowser, allowHtmlDownload, allowPptxDownload } = config.build;
```

Render `Export as PPTX` only when `view === 'slides'` and download is allowed.

**Step 4: Implement click handler**

Use the existing `exporting` state. On failure, log the error and show `t.slide.pptxExportFailed`.

**Step 5: Verify**

Run:

```bash
pnpm core typecheck
pnpm check
```

Expected: pass.

**Step 6: Commit**

```bash
git add packages/core/src/app/routes/slide.tsx packages/core/src/locale packages/core/src/app/lib/export-pptx.ts
git commit -m "feat: add pptx export action"
```

---

### Task 9: Document PPTX Export And Editability

**Files:**
- Modify: `apps/web/content/docs/tools/export.mdx`
- Modify: `packages/core/README.md`
- Modify: `apps/web/content/docs/reference/config.mdx`
- Optional Modify: `packages/cli/template/README.md`

**Step 1: Update export docs**

Add a PPTX section:

```md
## PPTX

The dev server can export the active deck to PowerPoint from **Export -> PPTX**.
open-slide exports native editable objects where it can and falls back conservatively for browser-only effects.
Use the PPTX primitives for the best editability.
```

Do not mention a product UI diagnostics panel.

**Step 2: Document config**

Add `allowPptxDownload` beside `allowHtmlDownload`.

**Step 3: Document primitives**

Add a short code sample:

```tsx
import { PptxText, type Page } from '@open-slide/core';

const PageOne: Page = () => (
  <PptxText style={{ position: 'absolute', left: 120, top: 120, fontSize: 72 }}>
    Editable in PowerPoint
  </PptxText>
);
```

**Step 4: Verify**

Run:

```bash
pnpm check
```

Expected: pass.

**Step 5: Commit**

```bash
git add apps/web/content/docs/tools/export.mdx apps/web/content/docs/reference/config.mdx packages/core/README.md packages/cli/template/README.md
git commit -m "docs: document pptx export"
```

---

### Task 10: Dogfood Against Demo Slides

**Files:**
- Modify only if bugs are found in files from prior tasks.

**Step 1: Start demo server**

Run:

```bash
pnpm dev:demo
```

Expected: demo opens or logs a local URL.

**Step 2: Export representative decks**

Use browser manually or Playwright if available:

- `open-slide-launch`
- `llm-fundamentals`
- one SVG-heavy slide
- one image-heavy slide

**Step 3: Inspect generated PPTX**

Open at least one PPTX in PowerPoint or compatible viewer. Confirm:

- slide size is 16:9
- visible text is editable where expected
- images render
- simple shapes render
- visual quality is acceptable
- console logs identify fallback rasterizations

**Step 4: Fix actionable bugs**

For each bug:

1. Add a focused failing test.
2. Implement the minimal fix.
3. Rerun the focused test.
4. Rerun `pnpm core typecheck`.

**Step 5: Final verification**

Run:

```bash
pnpm typecheck
pnpm check
pnpm test
pnpm build
```

Expected: all pass.

**Step 6: Final commit**

```bash
git add .
git commit -m "fix: harden pptx export"
```

Skip this commit if no fixes were needed.

---

### Task 11: Release Hygiene

**Files:**
- Modify: `.changeset/*.md`

**Step 1: Review changeset**

Because `packages/core` changes, ensure the changeset has a patch bump and a short one-line description:

```md
---
"@open-slide/core": patch
---

Add PPTX export with editable text, shapes, and image support.
```

**Step 2: Final status**

Run:

```bash
git status --short
```

Expected: clean except intentionally untracked generated PPTX samples, which should not be committed.

**Step 3: Handoff note**

Record any known limitations:

- advanced CSS effects rasterize
- native charts are follow-up unless implemented
- complex SVG may rasterize
- diagnostics are console-only
