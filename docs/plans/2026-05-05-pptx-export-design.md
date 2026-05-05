# Hybrid PPTX Export Design

## Goal

Add PowerPoint export to open-slide with high visual fidelity and strongly editable output. The exporter should preserve the current React authoring model while giving authors a path to native, editable PowerPoint objects.

## Non-Goals

- Do not build a screenshot-only export and call it editable.
- Do not promise perfect conversion of arbitrary React, CSS, SVG, animation, and browser layout into PowerPoint.
- Do not expose export diagnostics as prominent product UI. Diagnostics should be developer-facing logs or optional export metadata.
- Do not make `packages/core/src/app/components/ui` changes.

## Recommendation

Use a hybrid export engine:

1. Prefer explicit export-aware primitives for important slide content.
2. Fall back to DOM inference for existing decks and plain HTML/CSS.
3. Rasterize only isolated unsupported layers, and record that decision in developer logs.

This gives existing decks a working export path while making high-quality, editable output possible for decks that opt into the export-aware primitives.

## Architecture

### PPTX Scene Model

Add a small internal scene model that is independent of React and maps cleanly to PowerPoint objects:

- `slide`
- `group`
- `text`
- `shape`
- `image`
- `svg`
- `table`
- `chart` later
- `rasterLayer` fallback

The model stores slide-space coordinates in the existing `1920 x 1080` canvas coordinate system. The PPTX writer converts those values into PowerPoint units.

### Export-Aware Primitives

Add optional public components that render normally in the browser and also expose PPTX export metadata:

- `PptxText`
- `PptxBox`
- `PptxImage`
- `PptxShape`
- `PptxGroup`

Later additions:

- `PptxTable`
- `PptxChart`

These components should be a convenience layer, not a new required authoring framework. Existing slides remain valid.

### DOM Fallback Collector

The fallback collector renders each page offscreen, waits for fonts and `data-waitfor`, freezes motion, then walks the DOM under `[data-osd-canvas]`.

It converts safe cases into editable PPTX nodes:

- simple text elements become editable text boxes
- simple boxes become native shapes
- `img` elements become PPTX images
- inline `svg` may become SVG/image fallback depending on library support
- unsupported effects become isolated raster layers where possible

Unsupported CSS includes filters, blend modes, complex clipping, masks, pseudo-elements, advanced transforms, animation states, and browser-specific layout effects.

### Diagnostics

Diagnostics are not a product surface. They should be written to:

- `console.info` / `console.warn` in dev
- an optional JSON metadata blob in the downloaded bundle only if needed later
- tests and internal debug helpers

Do not add a toolbar panel or user-facing report summary for diagnostics in v1.

### User Surface

Add `Export as PPTX` to the existing download menu. The menu item should behave like HTML export: click, generate, download `${slideId}.pptx`.

Errors should use the existing toast style with one localized failure string. Detailed causes can stay in console logs.

### Dependency

Use `pptxgenjs` unless implementation testing proves it cannot support the required browser/Vite path. It is the practical browser-compatible PowerPoint writer for native objects.

Because this changes `@open-slide/core`, add a changeset.

## Quality Bar

The exporter should preserve:

- slide size and aspect ratio
- text content as editable text where possible
- basic typography: font family, font size, weight, style, color, line height, alignment
- basic geometry: left, top, width, height, rotation
- basic fills, borders, and radii
- image fit/crop for common object-fit cases
- speaker notes from `slide.notes`

If an element cannot be represented natively, the exporter may rasterize only that element or layer. Whole-slide rasterization should be a last resort and logged.

## Testing Strategy

Add unit tests for:

- scene model conversion
- CSS color parsing
- DOM element classification
- text style extraction
- fallback raster decisions
- PPTX export wiring from `SlideModule`

Add focused integration tests where feasible:

- generated PPTX contains slide files
- generated PPTX contains editable text XML
- notes are included when `slide.notes` exists
- images are embedded

## Rollout

Ship in phases:

1. Core PPTX writer and simple DOM fallback.
2. Export-aware primitives.
3. Better image fit/crop and SVG support.
4. Tables and charts.
5. Documentation and examples that teach authors how to get highly editable output.
