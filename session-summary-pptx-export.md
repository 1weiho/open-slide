# Session Summary: PPTX Export Overhaul

**Session ID:** `019e5a89-1e88-79f2-a3b1-4ba66f605a96`
**Date:** 2026-05-24
**Worktree:** `open-slide/.worktrees/pptx-export`
**Model:** GPT-5.5
**Total Entries:** 2,303 lines in JSONL

---

## What Was Being Built

A **hybrid PPTX export engine** for the open-slide framework (`@open-slide/core`). The goal is to export React slides to PowerPoint `.pptx` files with:

- **High visual fidelity** — the exported PPTX should look like the browser-rendered slide
- **Good editability** — text, shapes, tables, charts, and equations should be editable native PowerPoint objects, not raster images

The session iterated through **four major phases**: investigation, design, implementation, and corrective layout iteration.

---

## Phase 1: Investigation (First Turn)

The agent inspected the existing PPTX export pipeline:

| File | Role |
|------|------|
| `packages/core/src/app/lib/export-pptx.ts` | Entry point: renders each slide offscreen at 1920×1080, applies CSS vars, waits for paint/fonts |
| `packages/core/src/app/lib/pptx/dom-collector.ts` | Walks rendered DOM and infers text/shape/image scene nodes |
| `packages/core/src/app/lib/pptx/write-pptx.ts` | Writes scene nodes to PPTX via `pptxgenjs` |
| `packages/core/src/app/components/pptx/index.tsx` | Author-facing primitives: `PptxText`, `PptxBox`, `PptxImage`, `PptxShape`, `PptxGroup` |
| `packages/core/src/app/lib/pptx/scene.ts` | Scene model types (`PptxTextNode`, `PptxShapeNode`, `PptxImageNode`, `PptxRasterNode`) |
| `packages/core/src/app/lib/pptx/css.ts` | CSS color normalization, rect reading, text style extraction |
| `docs/plans/2026-05-05-pptx-export.md` | Original v1 implementation plan |
| `docs/plans/2026-05-05-pptx-export-design.md` | Original v1 design doc |

### Key Findings from Investigation

1. **Font fidelity was unreliable** — The exporter grabbed only the first computed font-family. If PowerPoint doesn't have it, fallback differs from the browser.
2. **Browser text layout reflowed by PowerPoint** — Text boxes used `fit: 'shrink'` and PowerPoint re-wrapped everything differently.
3. **Inline rich text was flattened** — `<em>Code.</em>` inside a heading became one flat text node with the parent style.
4. **Primitives were broken** — `PptxGroup` stopped descending (children disappeared). `PptxBox` with children lost child content. `PptxShape` ignored `shape="ellipse"` etc.
5. **No raster fallback** — `PptxRasterNode` existed in the scene model but the collector never actually rasterized anything.
6. **No export report** — Compromises were silent.
7. **Coordinate system mismatch** — `getBoundingClientRect()` returned scaled browser coordinates, while the writer assumed fixed 1920×1080. Font sizes were in unscaled CSS pixels. This caused oversized text, shifted positions, and overlap.
8. **Line geometry was too aggressive** — Browser line preservation was preserving noisy glyph/range boxes instead of stable CSS line boxes.

---

## Phase 2: Design Discussion (Turns 2–4)

The user and agent discussed the long-term approach:

### Three Options Considered

1. **Pure Native Export** — Everything editable PowerPoint objects. Rejected because it can't faithfully preserve arbitrary browser/CSS.
2. **Screenshot-First Export** — Whole-slide images. Rejected because editability is destroyed and doesn't meet the equation/editability goal.
3. **Contract-Based Hybrid Export** (selected) — Native objects for what PowerPoint can do well (text, shapes, images, tables, charts); raster layers for visual effects PowerPoint cannot reproduce; export report for every compromise.

### Design Decisions Made

- **Primary target:** Microsoft PowerPoint Desktop, Windows and Mac
- **Text rule:** Pick one visible representation per element — native text (default), raster text only when effects require it, no visible duplicate layers
- **Equations:** Native OMML/OfficeMath for display equations; inline equations as a harder second-phase goal
- **Policy engine:** Every element gets a decision: native, reduced-fidelity, raster, or omitted-with-diagnostic
- **Export report:** Developer-facing diagnostics per slide (count of native/reduced/raster nodes, font fallback warnings)
- **Gauntlet deck:** A torture-test demo deck intentionally designed to stress the exporter

### Planning Docs Created & Committed

- `docs/plans/2026-05-24-pptx-export-long-term-design.md` — `86bc119`
- `docs/plans/2026-05-24-pptx-export-overhaul.md` (implementation plan) — `bd98639`

---

## Phase 3: Implementation (Turns 5–9)

The plan was executed in this worktree (no new worktree). Here are all commits made:

### Batch 1 — Primitive Fixes & Foundation

| Commit | Description |
|--------|-------------|
| `8316e60` | **Primitive semantics fixes** — Shared PPTX test helpers; fixed `PptxGroup` traversal; fixed `PptxBox` child export; honored `PptxShape shape="ellipse"\|"line"`; added export decision metadata |

### Batch 2 — Report + Gauntlet + Rich Text

| Commit | Description |
|--------|-------------|
| `2145cba` | **Export report model** — Logs native/reduced/raster/omitted counts and warnings |
| `61b4835` | **Gauntlet deck** — `apps/demo/slides/pptx-export-gauntlet` stressing typography, rich text, equations placeholders, media/effects, table/chart placeholders, and notes |
| `e07f8e5` | **Rich text export** — Rich text scene nodes; collects inline styled runs; writes through PowerPoint text runs |
| `33232d0` | **Font fallback policy** — PowerPoint-safe font fallback rules; emits diagnostics for substitutions like "Iowan Old Style → Times New Roman" |
| `9b04418` | **Explicit line-break policy** — Marks browser-measured/preserved lines |

### Batch 3 — Raster, Equations, Images, Tables, Charts

| Commit | Description |
|--------|-------------|
| (explicit raster primitive) | **PptxRasterLayer** — Explicit raster layer component with scene/writer support |
| (equation fallback) | **PptxEquation** — Equation primitive that exports as editable fallback text with reduced-fidelity diagnostic |
| (image fit) | **Image `object-fit` preservation** — Collects and writes `object-fit` styles for images |
| (table primitive) | **PptxTable** — Table primitive with metadata-driven native PPTX table output |
| `1cd0e91` | **Documentation + changeset** — Documents PPTX export contract |
| `1d63484` | **Native PPTX charts** — `PptxChart` component, chart IR/writer, structural contract test |
| `e3380c2` | **OfficeMath equations** — Constrained OMML XML output (still marked reduced fidelity until PPT Desktop round-trip confirms it) |
| `ecd201b` | **Reduced-effects reporting** — Filters, blend modes, masks, shadows, clip paths count as reduced-fidelity |

### Verification

- Focused PPTX tests: **62 tests passing** across 10 files
- `pnpm typecheck` passed
- `pnpm check` still failed due to pre-existing repo-wide CRLF/formatting issues outside PPTX work

---

## Phase 4: Corrective Layout Iteration (Turns 10–20+)

The user provided screenshots repeatedly showing the exported PPTX still had major rendering issues. Each round identified and narrowed a specific root cause.

### Round 1: "We are not in a better position" — Coordinate Mismatch

**Root cause:** `getBoundingClientRect()` returns scaled browser coords; font sizes are unscaled CSS pixels; writer assumes 1920×1080. Everything oversized/shifted.

**Fix:** `555b56f` — Normalize DOM rects to canonical 1920×1080; capture browser-measured text lines; export layout-critical text as separate editable line boxes; disable PowerPoint text autofit; add `letter-spacing` mapping.

### Round 2: "We will need to work more on it" — Line Boxes Too Aggressive

**Root cause:** Measured-line strategy was splitting text by word geometry. "step 1" became "step" / "1", and large serif headings broke mid-line. Fixed 4px top tolerance was splitting words when font ink boxes varied; per-word range widths reused as PPT box widths caused tiny boxes.

**Fix:** `6133d92` — Font-size/line-height-aware tolerance instead of fixed 4px; preserved line boxes use source text container width (not word/glyph width); line y/h from stable CSS-style line boxes; text width expansion uses canonical PPTX canvas width.

### Round 3: "Look into it again" — Rich Text Line Loss

**Root cause:** Rich text nodes collected browser-measured lines but threw them away, so "An agent that does the work" went back to PowerPoint wrapping. Also, after the last fix, element box top was reused for every preserved line (too coarse).

**Fix:** `7e9f600` — Rich text now carries measured line boxes and exports each browser line as its own editable rich text box preserving inline styles (accent/italic `agent`). Preserved text lines use browser-measured line y again with safe full-container width.

### Round 4: "Make corrections accordingly" — Auto-Wrap Split

**Root cause:** The preserved-line path was too aggressive — splitting normal browser-wrapped paragraphs/headings into separate PowerPoint text boxes, causing overlap in cover text, capability cards, footer wraps, and the "Difference" slide heading.

**Fix:** `e0fcb35` — Auto-wrapped text stays as one editable PowerPoint text box. Only explicit author line breaks (`<br>` / real newlines) use preserved line boxes. Explicit preserved lines use stable line-height positioning instead of glyph-top y positions. Removed range-measured fallback injecting browser wrap newlines into normal text.

### Round 5: External Agent Feedback — Font Metrics + Fill Loss

**User supplied:** Feedback from another agent reviewing the screenshots.

**Root cause identified:** Text-bearing elements with their own fill (like colored bars/labels) were exported as text only, losing the background rectangle. Fallback collection chose either "text" or "shape", so colored label boxes became editable text and lost their fill.

**Fix (in progress at session end):** Text containers with backgrounds emit the backing shape first, then the editable text, so bars/cards keep their visual container (shape+fill) without rasterizing.

### Verification (at session end)

- PPTX test suite: **70 tests passing**
- `pnpm typecheck` passing
- Targeted Biome passing on touched files
- Full `pnpm check` still fails due to pre-existing unrelated repo-wide formatting/CRLF issues

---

## Architecture Overview (at session end)

```
React slide component
    ↓
export-pptx.ts — render offscreen at 1920×1080, apply CSS vars, wait for paint/fonts
    ↓
dom-collector.ts — walk DOM → scene graph:
    • PptxTextNode / PptxRichTextNode
    • PptxShapeNode (rect, roundRect, ellipse, line)
    • PptxImageNode (with object-fit)
    • PptxTableNode
    • PptxChartNode
    • PptxEquationNode (with OfficeMath XML or fallback text)
    • PptxRasterNode (for explicit raster layers)
    • ExportDecision metadata per node
    ↓
ppt-to-ir policy — what's native, reduced, raster, omitted
    ↓
write-pptx.ts → pptxgenjs → Blob download
    ↓
Export report with fidelity diagnostics
```

**Author-facing primitives** (`components/pptx/index.tsx`):
- `PptxText` — editable text box
- `PptxBox` — container with dimensions
- `PptxImage` — image with alt text
- `PptxShape` — rect/roundRect/ellipse/line
- `PptxGroup` — logical grouping
- `PptxRasterLayer` — explicit raster fallback
- `PptxEquation` — equation (OfficeMath fallback text)
- `PptxTable` — native table
- `PptxChart` — native chart

---

## Known Remaining Issues (at session end)

### Core Fidelity Gaps
1. **Text layout still drifts** — PowerPoint's font metrics differ from the browser. Measured line boxes help but don't eliminate the gap. Font fallback (e.g., Iowan Old Style → Times New Roman) changes metrics.
2. **Coordinate normalization might still have edge cases** — If the slide canvas is rendered at a non-standard scale or in a different viewport.
3. **Auto-wrapped text in PowerPoint still reflows differently** — Even as one editable box, PowerPoint may wrap at different widths/lines than the browser.

### Missing Features
1. **True automatic raster capture** — No DOM screenshot pipeline yet. Only explicit `PptxRasterLayer` exists.
2. **`object-position` / crop fidelity** — Beyond basic `object-fit`, we don't read `object-position`.
3. **OfficeMath equations** — Constrained prototype only (token-based OMML generation into PPTX XML). Not full LaTeX/MathML conversion yet.
4. **Inline equations** — Not native yet.
5. **No visual regression harness** — No automated PPTX→image comparison pipeline.
6. **No PowerPoint Desktop round-trip validation** — No automated verification that generated PPTX renders correctly in PowerPoint.
7. **Gauntlet deck has widget TODOs** — Some placeholder patterns remain that could cause warnings even when the corresponding primitive exists (e.g., `PptxChart` added but gauntlet not fully updated).

### Infrastructure / Code Quality
1. **Pre-existing unrelated changes** in the worktree: Vite config/plugin changes, changesets, `apps/demo/slides/rome-downfall/`
2. **`pnpm check` doesn't pass** — Repo-wide CRLF/formatting issues outside this PPTX work
3. **Some PPTX collector/writer tests still use loose mocks** — Not full structural PPTX XML inspection for all node types

---

## Next Steps for the Next Agent

1. **Test the current implementation** — Open the demo app, export the `claude-code-intro` and `pptx-export-gauntlet` decks, review in PowerPoint Desktop. The next round of user screenshots will determine the next priority.

2. **Most likely next work:**
   - Text layout stabilization — If slides still have wrapping/overlap issues, iterate on the text export policy. The core tension is: single text box (PowerPoint reflows differently) vs split line boxes (PowerPoint positions differently).
   - Background-fill-on-text bug — The last fix in progress (emit backing shape + text for text-with-fill) needs completion.
   - Automatic raster capture — Add a `html-to-image` or `dom-to-image` dependency for effects that PowerPoint cannot reproduce. The user hasn't approved this yet; it was deferred.

3. **Medium-term priorities** (from the implementation plan):
   - Better `object-position` / crop support
   - Full equation conversion pipeline (LaTeX/MathML → OMML)
   - Inline equation support
   - Export fixture harness with structural PPTX XML assertions
   - Visual regression testing

4. **Worktree hygiene:** Before making changes, check `git status` — there are unrelated pre-existing modifications in `packages/core/src/vite/` and unstaged changesets that should not be committed with PPTX work.

5. **Run `pnpm exec vitest run packages/core/src/app/lib/pptx packages/core/src/app/components/pptx/pptx-primitives.test.tsx packages/core/src/app/lib/export-pptx.test.ts`** for focused PPTX tests.
   Run `pnpm typecheck` for monorepo type checking (passes).
   Run `pnpm check` will show unrelated failures; use `pnpm biome check --changed` for targeted checks.

6. **Gauntlet deck location:** `apps/demo/slides/pptx-export-gauntlet/`

7. **Key source files to know:**
   - `packages/core/src/app/lib/pptx/dom-collector.ts` — DOM→scene collection
   - `packages/core/src/app/lib/pptx/write-pptx.ts` — scene→PPTX writing
   - `packages/core/src/app/lib/pptx/scene.ts` — scene model types
   - `packages/core/src/app/lib/pptx/css.ts` — CSS utilities
   - `packages/core/src/app/lib/export-pptx.ts` — export entry point
   - `packages/core/src/app/components/pptx/` — author-facing primitives
