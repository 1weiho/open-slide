# PPTX Export Fidelity Fallback Design

**Goal:** Improve PPTX export fidelity for equations, complex raster effects, and custom visualizations without turning the whole deck into screenshots.

**Approved approach:** Use a contract-based hybrid export. Keep native PowerPoint objects where the browser visual maps safely to PowerPoint, and intentionally rasterize or shape-compose regions that depend on browser-only behavior.

## Scope

- Display equations must not export as empty boxes.
- Inline equations must not become separately layered text that overlaps paragraph text.
- Complex image/effect stacks must not silently drop overlays, blend modes, filters, or shadows.
- Custom progress-card visuals must not be converted to default PowerPoint charts.
- Table styling should avoid the heavy default grid look where the source is intentionally minimal.

## Export Policy

1. **Equations**
   - Display `PptxEquation` nodes continue to export as reduced OfficeMath when possible, with visible fallback text if replacement fails.
   - Inline `PptxEquation` nodes inside normal paragraph flow should contribute to the surrounding text instead of being independently positioned over it.
   - Equation fallback text should use reliable Unicode/math glyphs and a PowerPoint-safe math font.

2. **Raster Effects**
   - Explicit raster primitives are the supported path for visual stacks PowerPoint cannot reproduce.
   - The gauntlet media card should export its intended dark composite, not the raw underlying image plus dropped CSS effects.
   - Diagnostics should report the raster decision.

3. **Custom Visualizations**
   - Native charts are only for actual chart intent.
   - Progress bars, score cards, and similar bespoke UI should export as shapes and text, or as a raster fallback if the design depends on unsupported effects.
   - The gauntlet score card should preserve card background, title, bar colors, labels, and percentages.

4. **Tables**
   - Native tables remain editable, but writer defaults should better match minimal source styling.
   - Avoid adding full heavy borders when the source uses a quiet table surface.

## Verification

- Add focused collector/writer tests for inline equation containment, visible equation fallback, progress-card shape composition, and table style XML.
- Run focused PPTX tests for `packages/core`.
- Run `pnpm typecheck`.
- Run targeted Biome checks on touched files. Full `pnpm check` may still report unrelated pre-existing repo formatting issues.
