# Editable PPTX Math Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add dependable editable equation export for STEM-level LaTeX in PPTX.

**Architecture:** Use Temml to convert LaTeX into MathML and mathml2omml to convert MathML into Office Math Markup Language. Keep the current PPTX post-processing token replacement path, but replace its hand-written OMML generator with generated OMML and add broad conversion tests.

**Tech Stack:** TypeScript, React, pptxgenjs, fflate, Temml, mathml2omml, Vitest, pnpm.

---

### Task 1: Add Converter Dependencies

**Files:**
- Modify: `packages/core/package.json`
- Modify: `pnpm-lock.yaml`

**Steps:**

1. Run `pnpm --filter @open-slide/core add temml mathml2omml`.
2. Confirm licenses and package sizes remain acceptable for the approved design.

### Task 2: Replace Hand-Written OMML

**Files:**
- Modify: `packages/core/src/app/lib/pptx/equation.ts`
- Test: `packages/core/src/app/lib/pptx/equation.test.ts`

**Steps:**

1. Add failing tests for integral/fraction, aligned derivation, matrix/eigenvalue, and summation/binomial LaTeX.
2. Implement `createOmmlEquation` using Temml and mathml2omml.
3. Normalize generated OMML namespaces so slide XML has the required `m` and `w` namespaces.
4. Keep readable fallback behavior for invalid LaTeX.

### Task 3: Restore Native Equation Injection

**Files:**
- Modify: `packages/core/src/app/lib/pptx/write-pptx.ts`
- Test: `packages/core/src/app/lib/pptx/export-contract.test.ts`
- Test: `packages/core/src/app/lib/pptx/equation.test.ts`

**Steps:**

1. Restore equation placeholder replacement for successful conversion.
2. Ensure failed conversions leave visible fallback text.
3. Assert exported slide XML contains generated OMML and no stale placeholder tokens.

### Task 4: Add STEM Math Gauntlet Slide

**Files:**
- Modify: `apps/demo/slides/pptx-export-gauntlet/index.tsx`

**Steps:**

1. Add a new `StemMathStress` page after the current equations slide.
2. Include inline math prose and a step-by-step solution card.
3. Add matrix/eigenvalue and summation/binomial display equations.
4. Update footer/notes/default export.

### Task 5: Verify

**Steps:**

1. Run focused PPTX tests.
2. Run `pnpm typecheck`.
3. Run targeted Biome on touched files.
4. Run `pnpm --filter demo build`.
5. Update the existing changeset description if needed.
