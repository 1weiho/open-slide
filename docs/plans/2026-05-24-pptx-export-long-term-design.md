# Long-Term PPTX Export Design

## Goal

Build a dependable PPTX export system for open-slide that targets Microsoft PowerPoint Desktop on Windows and Mac. The exporter should preserve the visual design of browser-rendered slides while keeping as much content editable as PowerPoint can reliably support.

## Primary Target

The primary compatibility target is Microsoft PowerPoint Desktop on Windows and Mac.

PowerPoint Web, Keynote, Google Slides, and LibreOffice are best-effort follow-ups. The first serious exporter should optimize for native PowerPoint behavior rather than the lowest common denominator.

## Recommendation

Use a contract-based hybrid exporter.

The exporter should write native PowerPoint objects for content that can be represented dependably:

- text
- rich text
- equations
- simple shapes
- lines
- images
- tables
- charts
- speaker notes

The exporter should rasterize content that PowerPoint cannot reproduce faithfully:

- SVG filters
- CSS filters
- blend modes
- masks
- complex clipping
- complex shadows
- decorative grain and texture
- browser-only visual effects

The exporter should not silently approximate unsupported features. Every compromise should be recorded in an export report.

## Non-Goals

- Do not promise perfect editable conversion of arbitrary React, CSS, SVG, and browser layout.
- Do not make screenshot-only export the primary model.
- Do not create visible duplicate text layers.
- Do not optimize v1 for Keynote, Google Slides, LibreOffice, or PowerPoint Web.
- Do not require all slides to use PPTX-specific primitives.

## Export Decisions

Every visible element should receive one explicit export decision:

1. Native editable object.
2. Native object with reduced fidelity.
3. Raster layer.
4. Omitted object with diagnostic.

Visible duplicate text should be avoided. A rasterized text layer plus visible editable overlay leaves stale baked-in text after editing, so it should not be the default. If a text effect cannot be represented natively, the exporter should either keep the text native with reduced fidelity or rasterize it and report that it is not editable.

Hidden metadata is acceptable for accessibility, search, source mapping, or diagnostics, but it should not create selectable ghost text on the slide.

## Architecture

The exporter should compile browser-rendered slides into an internal PowerPoint-oriented intermediate representation.

```txt
React slide
  -> offscreen browser render
  -> DOM/layout collector
  -> export policy engine
  -> PPTX IR
  -> PowerPoint writer
  -> export report
```

The existing `1920 x 1080` canvas remains the coordinate source. The browser remains responsible for layout. The exporter should not reimplement flexbox, grid, wrapping, or CSS layout rules.

## PPTX IR

The internal scene graph should support:

- `Slide`
- `Group`
- `TextBox`
- `RichTextBox`
- `Equation`
- `Shape`
- `Line`
- `Image`
- `SvgImage`
- `Table`
- `Chart`
- `RasterLayer`
- `SpeakerNotes`

The IR should store:

- slide-space coordinates
- z-order
- grouping
- source DOM/debug metadata
- export decision
- diagnostics
- fallback reason when rasterized

## Export Policy Engine

The policy engine decides how each element exports.

Examples:

- Plain text becomes native `TextBox`.
- Inline styled text becomes native `RichTextBox`.
- Display equations become native OfficeMath/OMML where possible.
- CSS background rectangles become native shapes.
- Simple SVG icons may become embedded SVG images.
- SVG filters or CSS blend modes become raster layers.
- Unknown interactive/browser-only content becomes raster or omitted with a warning.

Policy output should be deterministic. If the exporter cannot decide safely, it should choose fidelity through rasterization and report the loss of editability.

## Author-Facing Primitives

Existing React slides should keep exporting through DOM fallback, but dependable editable output should be available through explicit primitives.

Harden existing primitives:

- `PptxText`
- `PptxBox`
- `PptxImage`
- `PptxShape`
- `PptxGroup`

Add new primitives:

- `PptxRichText`
- `PptxEquation`
- `PptxRasterLayer`
- `PptxTable`
- `PptxChart`
- `PptxCodeBlock`

These primitives should render normally in the browser and add export metadata. They should not create a second slide-authoring framework.

## Text Model

Text should be native by default.

The exporter should support:

- explicit line breaks
- rich text runs
- font family
- PowerPoint-safe fallback font selection
- font size
- weight
- italic
- underline
- color
- opacity where supported
- alignment
- line spacing
- baseline-ish inline spans
- code/mono spans

Browser wrapping and PowerPoint wrapping differ. For high-fidelity text boxes, the exporter should preserve browser-measured line breaks as explicit line breaks where appropriate. If a text box is likely to reflow, the export report should say so.

## Equations

Equations should become first-class export nodes.

Supported authoring inputs should include:

- LaTeX
- MathML
- possibly UnicodeMath later

The writer should prefer native PowerPoint-editable OfficeMath/OMML output for the primary Windows/Mac PowerPoint target. A visual SVG/PNG fallback may be embedded where useful for compatibility, but native editability is the main goal.

Implementation should be phased:

1. Display equations as separate editable equation objects.
2. Inline equations approximated by splitting text and equations into aligned objects.
3. True inline OfficeMath inside text paragraphs only after round-trip validation in PowerPoint Desktop.

## Images And SVG

Images should support:

- embedding
- `object-fit: contain`
- `object-fit: cover`
- object position
- crop
- alt text
- opacity
- clipping/radius where PowerPoint supports it

Simple SVGs may export as SVG images. Complex SVGs with filters, masks, blend modes, or unsupported effects should rasterize.

## Tables And Charts

Tables and charts should not rely on DOM inference for v1 quality. They should use explicit primitives.

`PptxTable` should export native editable PowerPoint tables.

`PptxChart` should export native editable PowerPoint charts where the chart type maps cleanly to PowerPoint. Unsupported custom charts should rasterize with diagnostics.

## Export Report

Each export should produce diagnostics that can be shown in developer logs and later surfaced in an optional report UI.

The report should include:

- native object count
- raster layer count
- omitted object count
- font substitutions
- unsupported CSS effects
- equation fallback decisions
- image embedding failures
- likely text reflow warnings
- per-slide editability/fidelity summary

Example:

```txt
Slide 1
- 8 native text boxes
- 4 native shapes
- 1 raster layer: SVG filter paper grain
- Font fallback: Iowan Old Style -> Georgia
- Warning: heading line height may differ in PowerPoint
```

## Gauntlet Deck

Add a dedicated demo deck to stress the exporter:

`apps/demo/slides/pptx-export-gauntlet`

The deck should include:

- large editorial serif title with explicit line breaks
- inline rich text with bold, italic, accent color, and mono spans
- display equation
- inline equation
- syntax-colored code block
- SVG logo/icon
- image with `object-fit: cover`
- transparent PNG or clipped image
- rounded cards
- hairline and dashed rules
- flex/grid layout
- editable table
- chart-like graphic and later native chart
- decorative rasterized grain/shadow/filter layer
- speaker notes

This deck is a quality gate. It should make exporter failures obvious.

## Reliability Strategy

Testing should combine structural and visual checks.

Structural tests:

- generated PPTX contains slide XML
- text is represented as editable PowerPoint text
- rich text runs are present
- notes are present
- images are embedded
- equations write expected OfficeMath XML
- raster fallbacks are reported

Visual tests:

- browser screenshot of gauntlet slide
- exported PPTX rendered in PowerPoint Desktop where available
- screenshot comparison or manual visual review

Until automated PowerPoint rendering is available in CI, user-provided screenshots can be accepted as manual QA evidence.

## Rollout

1. Fix current primitive semantics and diagnostics.
2. Introduce richer IR and policy decisions.
3. Add gauntlet deck.
4. Add rich text and font fallback improvements.
5. Add real raster-layer fallback.
6. Add display equation support.
7. Add image fit/crop improvements.
8. Add table support.
9. Add chart support.
10. Add inline equation support after validation.

## Success Criteria

- PowerPoint Desktop opens generated files without repair prompts.
- Normal text is editable and does not visibly reflow in common cases.
- Rich text preserves inline styles.
- Display equations are editable in PowerPoint.
- Unsupported effects rasterize visibly instead of disappearing.
- The export report explains every fidelity/editability compromise.
- The gauntlet deck exposes regressions before users do.
