# PPTX Export Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace best-effort PPTX DOM inference with a contract-based hybrid exporter that targets Microsoft PowerPoint Desktop on Windows and Mac.

**Architecture:** Keep the browser as the source of layout truth, compile rendered slides into a richer PPTX IR, run each node through a policy engine, then write native PowerPoint objects or raster layers with explicit diagnostics. Add a gauntlet demo deck early so fidelity and editability failures are obvious.

**Tech Stack:** React, TypeScript, Vite, Vitest, `pptxgenjs`, OOXML post-processing where needed, existing open-slide `1920 x 1080` canvas model.

---

### Task 1: Baseline Current Export Behavior

**Files:**
- Modify: `packages/core/src/app/lib/pptx/dom-collector.test.ts`
- Modify: `packages/core/src/app/lib/pptx/write-pptx.test.ts`
- Create: `packages/core/src/app/lib/pptx/test-utils.ts`

**Step 1: Add PPTX zip test helpers**

Create `packages/core/src/app/lib/pptx/test-utils.ts`:

```ts
import { strFromU8, unzipSync } from 'fflate';

export async function unzipPptx(blob: Blob): Promise<Record<string, Uint8Array>> {
  return unzipSync(new Uint8Array(await blob.arrayBuffer()));
}

export async function readPptxXml(blob: Blob, path: string): Promise<string> {
  const zip = await unzipPptx(blob);
  const file = zip[path];
  if (!file) throw new Error(`Missing PPTX part: ${path}`);
  return strFromU8(file);
}
```

**Step 2: Refactor existing tests to use the helper**

Replace local unzip helper code in `write-pptx.test.ts` with `readPptxXml` and `unzipPptx`.

**Step 3: Add regression tests for known current gaps**

Add tests that document current incorrect behavior for:

- `PptxGroup` skips children.
- `PptxShape shape="ellipse"` is ignored.
- rich inline text is flattened.

Use `it.todo` only if the failure is too broad to land immediately.

**Step 4: Run tests**

```bash
pnpm test packages/core/src/app/lib/pptx/write-pptx.test.ts packages/core/src/app/lib/pptx/dom-collector.test.ts
```

Expected: existing tests pass. New regression tests should either fail intentionally before the fixing task or be recorded as `it.todo`.

**Step 5: Commit**

```bash
git add packages/core/src/app/lib/pptx
git commit -m "test: baseline pptx export behavior"
```

---

### Task 2: Fix Export Primitive Semantics

**Files:**
- Modify: `packages/core/src/app/components/pptx/index.tsx`
- Modify: `packages/core/src/app/components/pptx/pptx-primitives.test.tsx`
- Modify: `packages/core/src/app/lib/pptx/dom-collector.ts`
- Modify: `packages/core/src/app/lib/pptx/dom-collector.test.ts`

**Step 1: Write failing primitive collector tests**

Add tests that assert:

- `PptxGroup` descendants are collected.
- `PptxBox` exports its box and still collects child text.
- `PptxShape shape="ellipse"` exports an ellipse.
- `PptxShape shape="line"` exports a line.

**Step 2: Update primitive metadata**

Keep the existing data attributes but treat `group` as traversal metadata, not a renderable object by itself.

**Step 3: Update collector behavior**

In `collectElement`:

- If `primitiveKind === 'group'`, traverse children and return.
- If `primitiveKind === 'box'`, collect shape node, then continue traversing children.
- If `primitiveKind === 'shape'`, read `data-osd-pptx-shape`.
- If `primitiveKind === 'text'` or `image`, collect node and skip descendants.

**Step 4: Run focused tests**

```bash
pnpm test packages/core/src/app/components/pptx/pptx-primitives.test.tsx packages/core/src/app/lib/pptx/dom-collector.test.ts
```

Expected: all primitive tests pass.

**Step 5: Commit**

```bash
git add packages/core/src/app/components/pptx packages/core/src/app/lib/pptx/dom-collector.ts packages/core/src/app/lib/pptx/dom-collector.test.ts
git commit -m "fix: honor pptx export primitives"
```

---

### Task 3: Introduce PPTX IR And Export Decisions

**Files:**
- Modify: `packages/core/src/app/lib/pptx/scene.ts`
- Modify: `packages/core/src/app/lib/pptx/scene.test.ts`
- Create: `packages/core/src/app/lib/pptx/decision.ts`
- Create: `packages/core/src/app/lib/pptx/decision.test.ts`

**Step 1: Add decision types**

Create `decision.ts`:

```ts
export type PptxExportDecision =
  | { kind: 'native'; reason?: string }
  | { kind: 'native-reduced'; reason: string }
  | { kind: 'raster'; reason: string }
  | { kind: 'omitted'; reason: string };
```

**Step 2: Add decision metadata to scene nodes**

Add optional `decision?: PptxExportDecision` and `source?: { tagName?: string; id?: string; className?: string }` to shared scene node metadata.

**Step 3: Add tests**

Assert `createPptxSlide` initializes diagnostics and that renderable checks ignore decision metadata.

**Step 4: Run tests**

```bash
pnpm test packages/core/src/app/lib/pptx/scene.test.ts packages/core/src/app/lib/pptx/decision.test.ts
```

Expected: pass.

**Step 5: Commit**

```bash
git add packages/core/src/app/lib/pptx/scene.ts packages/core/src/app/lib/pptx/scene.test.ts packages/core/src/app/lib/pptx/decision.ts packages/core/src/app/lib/pptx/decision.test.ts
git commit -m "feat: add pptx export decisions"
```

---

### Task 4: Add Export Report Model

**Files:**
- Create: `packages/core/src/app/lib/pptx/report.ts`
- Create: `packages/core/src/app/lib/pptx/report.test.ts`
- Modify: `packages/core/src/app/lib/export-pptx.ts`
- Modify: `packages/core/src/app/lib/pptx/dom-collector.ts`

**Step 1: Implement report types**

Create a report model:

```ts
export type PptxSlideReport = {
  slideIndex: number;
  nativeCount: number;
  nativeReducedCount: number;
  rasterCount: number;
  omittedCount: number;
  warnings: string[];
};

export type PptxExportReport = {
  slides: PptxSlideReport[];
};
```

**Step 2: Add summarizer**

Add `summarizePptxScene(slideIndex, scene)` that counts node decisions and diagnostics.

**Step 3: Test summary behavior**

Build a scene with native, raster, omitted, and diagnostic entries. Assert the summary counts and warnings.

**Step 4: Wire report logging**

In `export-pptx.ts`, build a report while exporting and log a compact table with `console.info`.

**Step 5: Run tests**

```bash
pnpm test packages/core/src/app/lib/pptx/report.test.ts packages/core/src/app/lib/export-pptx.test.ts
```

Expected: pass.

**Step 6: Commit**

```bash
git add packages/core/src/app/lib/pptx/report.ts packages/core/src/app/lib/pptx/report.test.ts packages/core/src/app/lib/export-pptx.ts packages/core/src/app/lib/pptx/dom-collector.ts
git commit -m "feat: report pptx export decisions"
```

---

### Task 5: Build The PPTX Export Gauntlet Deck

**Files:**
- Create: `apps/demo/slides/pptx-export-gauntlet/index.tsx`

**Step 1: Create the deck**

Build a focused test deck with at least four pages:

1. Typography page:
   - large serif headline
   - explicit line breaks
   - rich inline text
   - mono span
   - footnote

2. Equation page:
   - display equation placeholder using `PptxEquation` once available
   - inline equation placeholder
   - explanatory text

3. Media/effects page:
   - SVG logo
   - image crop
   - rounded image/card
   - decorative grain/filter layer

4. Structured data page:
   - table-like layout
   - chart-like layout
   - speaker notes

Before `PptxEquation`, `PptxTable`, and `PptxChart` exist, use clear TODO comments and visual placeholders.

**Step 2: Run typecheck**

```bash
pnpm core typecheck
```

Expected: pass.

**Step 3: Commit**

```bash
git add apps/demo/slides/pptx-export-gauntlet/index.tsx
git commit -m "test: add pptx export gauntlet deck"
```

---

### Task 6: Add Rich Text Scene Nodes

**Files:**
- Modify: `packages/core/src/app/lib/pptx/scene.ts`
- Modify: `packages/core/src/app/lib/pptx/scene.test.ts`
- Modify: `packages/core/src/app/lib/pptx/dom-collector.ts`
- Modify: `packages/core/src/app/lib/pptx/dom-collector.test.ts`
- Modify: `packages/core/src/app/lib/pptx/write-pptx.ts`
- Modify: `packages/core/src/app/lib/pptx/write-pptx.test.ts`

**Step 1: Add rich text types**

Add:

```ts
export type PptxTextRun = {
  text: string;
  style?: PptxTextStyle;
};

export type PptxRichTextNode = PptxRect & {
  kind: 'richText';
  runs: PptxTextRun[];
  style: PptxTextStyle;
};
```

**Step 2: Write collector tests**

Assert that:

```tsx
Hello <em>world</em>
```

exports as one rich text node with two runs and italic style on the second run.

**Step 3: Implement inline run collection**

For text containers with inline children, traverse text nodes and inline elements. Merge adjacent runs with identical style.

**Step 4: Write PPTX writer tests**

Assert generated slide XML contains multiple text runs.

**Step 5: Implement writer support**

Use `slide.addText(TextProps[], options)` for rich text.

**Step 6: Run tests**

```bash
pnpm test packages/core/src/app/lib/pptx/dom-collector.test.ts packages/core/src/app/lib/pptx/write-pptx.test.ts
```

Expected: pass.

**Step 7: Commit**

```bash
git add packages/core/src/app/lib/pptx
git commit -m "feat: export rich pptx text"
```

---

### Task 7: Add Font Fallback Policy

**Files:**
- Create: `packages/core/src/app/lib/pptx/fonts.ts`
- Create: `packages/core/src/app/lib/pptx/fonts.test.ts`
- Modify: `packages/core/src/app/lib/pptx/css.ts`
- Modify: `packages/core/src/app/lib/pptx/css.test.ts`

**Step 1: Add font resolver**

Create `resolvePptxFontFace(fontFamily: string): { fontFace: string; warning?: string }`.

Initial policy:

- If first family is known PowerPoint-safe, use it.
- If stack contains `Times New Roman`, use it for serif.
- If stack contains `Georgia`, use it for serif.
- If stack contains `Arial`, use it for sans.
- If stack contains `Aptos`, use it for sans.
- Otherwise keep first family and warn.

**Step 2: Add tests**

Cover:

- `"Iowan Old Style", "Times New Roman", Georgia, serif` -> `Times New Roman`
- `Inter, Arial, sans-serif` -> `Arial`
- `ui-monospace, "SF Mono", Menlo, monospace` -> `Consolas` or `Courier New`

**Step 3: Wire into CSS style extraction**

Use `resolvePptxFontFace` from `readElementTextStyle`.

**Step 4: Add diagnostics**

When a fallback is used, add a diagnostic to the scene or report.

**Step 5: Run tests**

```bash
pnpm test packages/core/src/app/lib/pptx/fonts.test.ts packages/core/src/app/lib/pptx/css.test.ts
```

Expected: pass.

**Step 6: Commit**

```bash
git add packages/core/src/app/lib/pptx/fonts.ts packages/core/src/app/lib/pptx/fonts.test.ts packages/core/src/app/lib/pptx/css.ts packages/core/src/app/lib/pptx/css.test.ts
git commit -m "feat: resolve pptx font fallbacks"
```

---

### Task 8: Preserve Browser-Measured Text Lines

**Files:**
- Modify: `packages/core/src/app/lib/pptx/dom-collector.ts`
- Modify: `packages/core/src/app/lib/pptx/dom-collector.test.ts`
- Modify: `packages/core/src/app/lib/pptx/write-pptx.ts`

**Step 1: Add tests for line preservation**

Test that a rendered heading with browser-measured line breaks exports text with explicit `\n` breaks.

**Step 2: Add policy control**

Add an internal option for text nodes:

```ts
lineBreakPolicy?: 'preserve-browser-lines' | 'powerpoint-wrap';
```

Default large headings to `preserve-browser-lines`.

**Step 3: Implement collector behavior**

Reuse existing range-based text segment measurement, but store the policy on the node.

**Step 4: Keep writer simple**

The writer can pass `\n` text directly to PowerPoint text boxes.

**Step 5: Run tests**

```bash
pnpm test packages/core/src/app/lib/pptx/dom-collector.test.ts packages/core/src/app/lib/pptx/write-pptx.test.ts
```

Expected: pass.

**Step 6: Commit**

```bash
git add packages/core/src/app/lib/pptx
git commit -m "feat: preserve pptx text line breaks"
```

---

### Task 9: Add Raster Layer Fallback

**Files:**
- Modify: `packages/core/src/app/lib/pptx/scene.ts`
- Modify: `packages/core/src/app/lib/pptx/dom-collector.ts`
- Modify: `packages/core/src/app/lib/pptx/dom-collector.test.ts`
- Modify: `packages/core/src/app/lib/pptx/write-pptx.ts`
- Modify: `packages/core/src/app/lib/pptx/write-pptx.test.ts`

**Step 1: Choose raster mechanism**

Prefer a minimal local implementation if practical. If a dependency is required, evaluate bundle cost before adding it because `@open-slide/core` ships to users.

**Step 2: Add raster policy tests**

Assert elements with:

- `filter`
- `backdrop-filter`
- `mix-blend-mode`
- mask
- complex SVG filter

receive `decision: { kind: 'raster' }`.

**Step 3: Implement raster node creation**

Capture the element into a data URL and create a `RasterLayer` node with original coordinates.

**Step 4: Write PPTX test**

Assert raster nodes embed images in `ppt/media`.

**Step 5: Run tests**

```bash
pnpm test packages/core/src/app/lib/pptx/dom-collector.test.ts packages/core/src/app/lib/pptx/write-pptx.test.ts
```

Expected: pass.

**Step 6: Commit**

```bash
git add packages/core/src/app/lib/pptx
git commit -m "feat: rasterize unsupported pptx layers"
```

---

### Task 10: Add Display Equation Primitive And IR

**Files:**
- Modify: `packages/core/src/app/components/pptx/index.tsx`
- Modify: `packages/core/src/app/components/pptx/pptx-primitives.test.tsx`
- Modify: `packages/core/src/app/lib/pptx/scene.ts`
- Modify: `packages/core/src/app/lib/pptx/dom-collector.ts`
- Modify: `packages/core/src/app/lib/pptx/write-pptx.ts`
- Create: `packages/core/src/app/lib/pptx/equation.ts`
- Create: `packages/core/src/app/lib/pptx/equation.test.ts`
- Modify: `packages/core/src/index.ts`

**Step 1: Add public primitive**

Add:

```tsx
export type PptxEquationProps = HTMLAttributes<HTMLDivElement> & {
  latex?: string;
  mathml?: string;
  inline?: boolean;
  fallbackText?: string;
};
```

Render a normal `div` with equation text or fallback text and export metadata.

**Step 2: Add scene node**

Add:

```ts
export type PptxEquationNode = PptxRect & {
  kind: 'equation';
  latex?: string;
  mathml?: string;
  fallbackText?: string;
  inline?: boolean;
};
```

**Step 3: Implement display equation collector**

Collect `data-osd-pptx-kind="equation"` into an equation node.

**Step 4: Implement first writer path**

Start with a clear placeholder writer that emits either:

- native OMML when conversion is implemented in this task, or
- a raster/fallback text node with `native-reduced` diagnostic if OMML conversion needs a follow-up.

Do not claim full equation editability until a generated PPTX round-trips in PowerPoint Desktop.

**Step 5: Add tests**

Assert equation nodes are collected and reported. If OMML is implemented, assert equation XML is present.

**Step 6: Update gauntlet deck**

Replace equation placeholders with `PptxEquation`.

**Step 7: Run checks**

```bash
pnpm test packages/core/src/app/components/pptx/pptx-primitives.test.tsx packages/core/src/app/lib/pptx/equation.test.ts packages/core/src/app/lib/pptx/dom-collector.test.ts
pnpm core typecheck
```

Expected: pass.

**Step 8: Commit**

```bash
git add packages/core/src/app/components/pptx packages/core/src/app/lib/pptx packages/core/src/index.ts apps/demo/slides/pptx-export-gauntlet/index.tsx
git commit -m "feat: add pptx equation primitive"
```

---

### Task 11: Add Image Fit And Crop Support

**Files:**
- Modify: `packages/core/src/app/lib/pptx/dom-collector.ts`
- Modify: `packages/core/src/app/lib/pptx/dom-collector.test.ts`
- Modify: `packages/core/src/app/lib/pptx/write-pptx.ts`
- Modify: `packages/core/src/app/lib/pptx/write-pptx.test.ts`

**Step 1: Add collector tests**

Cover:

- `object-fit: contain`
- `object-fit: cover`
- `object-position: center`
- `object-position: left top`

**Step 2: Read image fit style**

Map CSS object fit to existing image `fit` values.

**Step 3: Implement crop/contain sizing**

Use `pptxgenjs` image sizing options for contain/cover.

**Step 4: Run tests**

```bash
pnpm test packages/core/src/app/lib/pptx/dom-collector.test.ts packages/core/src/app/lib/pptx/write-pptx.test.ts
```

Expected: pass.

**Step 5: Commit**

```bash
git add packages/core/src/app/lib/pptx
git commit -m "feat: preserve pptx image fitting"
```

---

### Task 12: Add Table Primitive

**Files:**
- Modify: `packages/core/src/app/components/pptx/index.tsx`
- Modify: `packages/core/src/app/components/pptx/pptx-primitives.test.tsx`
- Modify: `packages/core/src/app/lib/pptx/scene.ts`
- Modify: `packages/core/src/app/lib/pptx/dom-collector.ts`
- Modify: `packages/core/src/app/lib/pptx/write-pptx.ts`
- Modify: `packages/core/src/app/lib/pptx/write-pptx.test.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `apps/demo/slides/pptx-export-gauntlet/index.tsx`

**Step 1: Add explicit table data model**

Use data props, not arbitrary DOM inference:

```tsx
<PptxTable
  columns={['Metric', 'Value']}
  rows={[
    ['Native text', 'Yes'],
    ['Raster layers', 'Reported'],
  ]}
/>
```

**Step 2: Add scene node and tests**

Represent table rows/cells in the IR and assert collection from primitive metadata.

**Step 3: Add writer support**

Use native PowerPoint table APIs from `pptxgenjs`.

**Step 4: Update gauntlet deck**

Replace table-like placeholder with `PptxTable`.

**Step 5: Run tests**

```bash
pnpm test packages/core/src/app/components/pptx/pptx-primitives.test.tsx packages/core/src/app/lib/pptx/write-pptx.test.ts
pnpm core typecheck
```

Expected: pass.

**Step 6: Commit**

```bash
git add packages/core/src/app/components/pptx packages/core/src/app/lib/pptx packages/core/src/index.ts apps/demo/slides/pptx-export-gauntlet/index.tsx
git commit -m "feat: add editable pptx tables"
```

---

### Task 13: Add Documentation And Changeset

**Files:**
- Modify: `packages/core/README.md`
- Modify: `apps/web/content/docs/tools/export.mdx`
- Modify: `apps/web/content/docs/reference/config.mdx`
- Create: `.changeset/<generated-name>.md`

**Step 1: Document the export contract**

Explain:

- primary target is PowerPoint Desktop Windows/Mac
- native where dependable
- raster where necessary
- no visible duplicate text layers
- diagnostics/report
- gauntlet deck purpose

**Step 2: Document primitives**

Add examples for:

- `PptxRichText`
- `PptxEquation`
- `PptxRasterLayer`
- `PptxTable`

**Step 3: Add changeset**

Because `packages/core` changes, add a patch changeset:

```md
---
"@open-slide/core": patch
---

Improve PPTX export fidelity and editability with richer native objects and diagnostics.
```

**Step 4: Run docs/checks**

```bash
pnpm check
pnpm core typecheck
```

Expected: pass.

**Step 5: Commit**

```bash
git add packages/core/README.md apps/web/content/docs/tools/export.mdx apps/web/content/docs/reference/config.mdx .changeset/*.md
git commit -m "docs: document pptx export contract"
```

---

### Task 14: Final Verification

**Files:**
- Modify only files touched by prior tasks if verification finds bugs.

**Step 1: Run full validation**

```bash
pnpm typecheck
pnpm check
pnpm test
pnpm build
```

Expected: all pass.

**Step 2: Export gauntlet deck manually**

Run the demo and export `pptx-export-gauntlet`.

```bash
pnpm dev
```

Expected: local demo starts and the deck exports as PPTX.

**Step 3: Review in PowerPoint Desktop**

Open the generated file in PowerPoint Desktop on Windows or Mac.

Check:

- no repair prompt
- text is editable
- rich text styles survive
- display equation behavior is documented honestly
- rasterized effects are visually present
- export report explains compromises
- speaker notes are present

**Step 4: Fix any blocking bugs**

For each bug:

1. Add a failing test.
2. Implement the smallest fix.
3. Run the focused test.
4. Run `pnpm core typecheck`.
5. Commit the fix.

**Step 5: Final status**

```bash
git status --short
```

Expected: clean except intentional generated PPTX samples, which should not be committed.
