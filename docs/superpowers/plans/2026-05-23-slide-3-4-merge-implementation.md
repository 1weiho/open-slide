# Slide 3/4 Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge page 3 and page 4 in `my-story-30min` so page 3 keeps the current declaration headline and page 4's original roadmap content becomes the lower half of page 3.

**Architecture:** Keep all edits inside `slides/my-story-30min/index.tsx`. Replace the current lower-half content of `Promise` with the existing `Map` roadmap sequence, then remove `Map` from the exported page list so the deck loses one stop without introducing new abstractions.

**Tech Stack:** React page components in `@open-slide/core`, inline styles, `pnpm` build via `open-slide`.

---

### Task 1: Merge `Promise` and `Map`

**Files:**
- Modify: `open-slide-upstream/apps/demo/slides/my-story-30min/index.tsx`
- Test: `open-slide-upstream/apps/demo` build output

- [ ] **Step 1: Replace the lower-half content of `Promise`**

Update `const Promise: Page = () => (` so that it:

- keeps the current page-3 title block and supporting copy
- removes the current right-side declaration card
- removes the current bottom row of four summary cards
- reuses the roadmap line and four-step structure from `Map`
- uses the original `Map` labels: `起點`, `轉折`, `選擇`, `現在`

- [ ] **Step 2: Remove the standalone `Map` page from presentation order**

Update `export default [...] satisfies Page[]` so `Map` is removed from the array and later pages shift forward by one.

- [ ] **Step 3: Remove or inline dead `Map` code if no longer referenced**

Delete the standalone `const Map: Page = () => (` block if it is no longer used after the merge.

- [ ] **Step 4: Run the build to verify the merged page compiles**

Run:

```bash
corepack pnpm --filter demo build
```

Expected:

- build exits with code `0`
- `apps/demo/dist` is regenerated
- page 3 now contains the declaration title plus roadmap content

- [ ] **Step 5: Commit**

```bash
git add open-slide-upstream/apps/demo/slides/my-story-30min/index.tsx open-slide-upstream/docs/superpowers/specs/2026-05-23-slide-3-4-merge-design.md open-slide-upstream/docs/superpowers/plans/2026-05-23-slide-3-4-merge-implementation.md
git commit -m "refactor: merge slide 3 and 4 roadmap"
```
