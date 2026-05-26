# PPTX Export Fidelity Fallback Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix PPTX export fidelity failures for equations, raster/effect cards, custom progress visuals, and quiet table styling.

**Architecture:** Keep the existing DOM-to-scene-to-PPTX pipeline. Tighten primitive contracts so actual charts remain native charts, custom progress cards are collected as child shapes/text, inline equations do not produce independent overlapping objects, and unsupported effect stacks use explicit raster fallback nodes with diagnostics.

**Tech Stack:** React primitives, TypeScript, Vitest, pptxgenjs, fflate PPTX XML inspection, pnpm.

---

### Task 1: Equation Fallbacks

**Files:**
- Modify: `packages/core/src/app/lib/pptx/dom-collector.ts`
- Modify: `packages/core/src/app/lib/pptx/equation.ts`
- Test: `packages/core/src/app/lib/pptx/dom-collector.test.ts`
- Test: `packages/core/src/app/lib/pptx/equation.test.ts`

**Steps:**

1. Add a failing collector test showing inline equation primitives are not exported as independently positioned nodes when they live in an inline paragraph container.
2. Add a failing equation test for `\int_0^1 x^2 dx = 1/3` producing readable math text with integral, subscript/superscript, and `1/3`.
3. Update equation normalization to use Unicode-safe command and script handling.
4. Update inline equation collection policy so standalone inline equations can still export, but paragraph-embedded inline equations are folded into surrounding text.
5. Run focused equation tests.

### Task 2: Raster Effect Card

**Files:**
- Modify: `apps/demo/slides/pptx-export-gauntlet/index.tsx`
- Test: `packages/core/src/app/lib/pptx/dom-collector.test.ts`

**Steps:**

1. Add or update a collector test proving explicit raster nodes carry `decision.kind = "raster"` and preserve reason text.
2. Replace the gauntlet media card export structure with an explicit raster layer that represents the intended dark composite.
3. Keep browser visuals unchanged for the live slide.
4. Run focused collector tests.

### Task 3: Progress Card Semantics

**Files:**
- Modify: `packages/core/src/app/components/pptx/index.tsx`
- Modify: `packages/core/src/app/lib/pptx/dom-collector.ts`
- Modify: `apps/demo/slides/pptx-export-gauntlet/index.tsx`
- Test: `packages/core/src/app/components/pptx/pptx-primitives.test.tsx`
- Test: `packages/core/src/app/lib/pptx/dom-collector.test.ts`

**Steps:**

1. Add a primitive option or metadata that distinguishes native chart export from custom visual children.
2. Add a failing test showing a custom progress-card wrapper descends into children instead of becoming one chart node.
3. Update the gauntlet score card to use native shape/text children for progress bars rather than `PptxChart`.
4. Run primitive and collector tests.

### Task 4: Table Styling

**Files:**
- Modify: `packages/core/src/app/lib/pptx/write-pptx.ts`
- Test: `packages/core/src/app/lib/pptx/write-pptx.test.ts`

**Steps:**

1. Add a failing writer test that table XML uses quiet/minimal styling and avoids a heavy default grid.
2. Update `addTableNode` defaults to use source-like fill, muted borders, smaller margins, and no extra chart-like styling.
3. Run writer tests.

### Task 5: Verification and Changeset

**Files:**
- Create: `.changeset/<generated-name>.md`

**Steps:**

1. Run `pnpm exec vitest run packages/core/src/app/lib/pptx packages/core/src/app/components/pptx/pptx-primitives.test.tsx packages/core/src/app/lib/export-pptx.test.ts`.
2. Run `pnpm typecheck`.
3. Run targeted Biome on touched files.
4. Add a patch changeset for `@open-slide/core`.
