# CR-0001 Validation Report

## Summary
Requirements: 25/25 | Acceptance Criteria: 9/10 PASS, 1 PARTIAL | Tests: 5/5 specified tests present and passing | Gaps: 1

Branch under test: `feat/export-slides-as-png` against `origin/main`.
Project checks executed:
- `pnpm test` -> 18 files, 261 tests passed (incl. `export-png.test.ts` 4/4, `download.test.ts` 1/1).
- `pnpm typecheck` -> 3/3 turbo tasks successful (cache hit).
- `pnpm check` -> 2 pre-existing warnings in unrelated files (`apps/web/lib/layout.shared.tsx`, `packages/core/src/http/request-guard.ts`); none in CR-touched files.
- `pnpm build` (run via typecheck pipeline) -> successful for `@open-slide/core`.

Diff scope (16 files): all map to Affected Components in the CR (rasteriser, download helper, locale files, toast component, slide route, changeset, root devDep `happy-dom` for jsdom-style test env). No stray files outside scope, with one note: `package.json` + `pnpm-lock.yaml` add `happy-dom` as a root devDependency to support the `@vitest-environment happy-dom` directive in the new tests. This is a devDep, not a runtime dep on `@open-slide/core`, so NFR-2 is honoured.

## Requirement Verification

### Functional Requirements

| Req # | Description | Status | Evidence (file:line / test name) |
|-------|-------------|--------|----------------------------------|
| FR-1 | `exportSlidePageAsPng(slide, slideId, pageIndex)` in `export-png.ts`, returns `Promise<void>`, downloads `{slideId}-p{N, zero-padded}.png` | PASS | `packages/core/src/app/lib/export-png.ts:82-91`; filename helper at `:69-73`; download via `downloadBlob` at `:90`. Test `pngFilenameFor` at `packages/core/src/app/lib/export-png.test.ts:41-48`. |
| FR-2 | `exportSlideAsPngZip(slide, slideId, onProgress?)` in same module, downloads `{slideId}.zip` with `{slideId}-p{N}.png` entries | PASS | `packages/core/src/app/lib/export-png.ts:104-136`; ZIP archive name at `:134`. Test `exportSlideAsPngZip calls onProgress at least once per phase` at `packages/core/src/app/lib/export-png.test.ts:84-105`. |
| FR-3 | Render at exactly `CANVAS_WIDTH` x `CANVAS_HEIGHT` regardless of viewport | PASS | `packages/core/src/app/lib/export-png.ts:174-175` (host sized to `CANVAS_WIDTH`x`CANVAS_HEIGHT`); SVG viewBox at `:357`; rasteriser invocation at `:212`. |
| FR-4 | Offscreen container positioned at `left: -99999px` | PASS | `packages/core/src/app/lib/export-png.ts:170-178` (`position: 'fixed'`, `left: '-99999px'`). |
| FR-5 | Apply `designToCssVars(slide.design)` to host | PASS | `packages/core/src/app/lib/export-png.ts:179-182`. |
| FR-6 | Wrap page in `<SlidePageProvider>` | PASS | `packages/core/src/app/lib/export-png.ts:188-194` (`SlidePageProvider` with `index`, `total`). |
| FR-7 | Wait for fonts via `waitForFonts()` | PASS | `packages/core/src/app/lib/export-png.ts:199`. |
| FR-8 | Wait for `data-waitfor` via `waitForDataWaitfor()` | PASS | `packages/core/src/app/lib/export-png.ts:200`. |
| FR-9 | Poll `isFrameAnimationSettled` with 15 000 ms timeout | PASS | `packages/core/src/app/lib/export-png.ts:47-48` (constants), `:202-206` (polling loop). Matches `export-pdf.ts` constants per Risk 3. |
| FR-9a | Hand-rolled `<foreignObject>` -> canvas pipeline; no new runtime dep | PASS | `packages/core/src/app/lib/export-png.ts:208-212` (clone -> inline styles -> inline fonts -> inline imgs -> SVG -> rasterise); `cloneWithInlinedStyles` at `:226-238`; `inlineGeistFonts` at `:261-284`; `inlineSameOriginImages` at `:322-344`; `nodeToSvgDataUrl` at `:352-359`. `packages/core/package.json:81` confirms only `fflate` added; no `html-to-image` / `html2canvas` / `dom-to-image`. |
| FR-9b | x2 supersampled offscreen canvas (3840x2160 backing, 1920x1080 output) | PASS | `packages/core/src/app/lib/export-png.ts:374-385` (`scale = 2`; `canvas.width = width * scale`; `ctx.drawImage(img, 0, 0, canvas.width, canvas.height)`). |
| FR-9c | ZIP built with `fflate`; no second ZIP lib | PASS | `packages/core/src/app/lib/export-png.ts:130` (`await import('fflate')`, `zipSync`); `packages/core/package.json:81` (`fflate: ^0.8.2`); no other ZIP libs in the diff. |
| FR-10 | `onProgress` shaped `{phase, current, total, percent}` matching PDF | PASS | `packages/core/src/app/lib/export-png.ts:31-45` (type); emissions at `:113-116`, `:119-135`. Phase coverage validated by test `exportSlideAsPngZip calls onProgress at least once per phase`. |
| FR-11 | New `png-progress-toast.tsx` mirroring `pdf-progress-toast.tsx` | PASS | `packages/core/src/app/components/png-progress-toast.tsx:1-54`. |
| FR-12 | Dropdown in `slide.tsx` has two new items below the PDF item | PASS | `packages/core/src/app/routes/slide.tsx:506-526` (`exportCurrentPageAsPng`) and `:527-567` (`exportAllPagesAsPng`); PDF item ends at `:505`. |
| FR-13 | New locale keys added to `types.ts` + en/ja/zh-cn/zh-tw | PASS | `packages/core/src/locale/types.ts:112-115` (slide keys), `:375-382` (`pngToast` block). `en.ts:111-115` + `:353-359`; `ja.ts:111-115` + `:357-363`; `zh-cn.ts:110-114` + `:352-358`; `zh-tw.ts:110-114` + `:352-358`. All nine required keys present in all four locales. |
| FR-14 | PNG dropdown items gated by `config.build.allowHtmlDownload` | PASS | `packages/core/src/app/routes/slide.tsx:431` (`view === 'slides' && allowHtmlDownload`) wraps the entire `DropdownMenu` (lines 432-569) including the two new items at `:506` and `:527`. |
| FR-15 | Cleanup of offscreen mount, React root, injected nodes on success and failure | PASS | `packages/core/src/app/lib/export-png.ts:213-216` (`try/finally`: `root.unmount()` + `host.remove()`). Validated by test `exportSlidePageAsPng rejects with no DOM residue when the rasterizer throws` at `packages/core/src/app/lib/export-png.test.ts:75-80`. |
| FR-16 | On failure, no DOM/root/object URL residue; surface rejection to caller | PASS | `packages/core/src/app/lib/export-png.ts:213-216` (finally tears down host); errors propagate from `rasteriserImpl` at `:212`. Test at `export-png.test.ts:75-80` asserts both. Caller surfaces `slide.pngExportFailed` at `routes/slide.tsx:518` and `:558`. |
| FR-17 | Downloads triggered via hidden `<a download>` + `revokeObjectURL` | PASS | `packages/core/src/app/lib/download.ts:17-27` (shared helper); `export-html.ts:4` switched to the shared import (its local copy removed). Test `downloadBlob creates and revokes object URL` at `packages/core/src/app/lib/download.test.ts:31-44`. |

### Non-Functional Requirements

| NFR # | Description | Status | Evidence |
|-------|-------------|--------|----------|
| NFR-1 | Single-file `export-png.ts`, hierarchical naming, SHOULD stay under 300 lines | PARTIAL | `packages/core/src/app/lib/export-png.ts` exists and is hierarchically named. Total line count is 426 — the SHOULD threshold (300 lines) is exceeded. CR text says "helpers may be split into sibling files in the same namespace if the count is exceeded" but no split was performed. Not a failure (SHOULD, not MUST), but flagged as a gap. |
| NFR-2 | No new runtime dependency in `packages/core/package.json` | PASS | `packages/core/package.json` runtime deps unchanged in this diff (only `fflate` already present at `:81`). Root `package.json:30` adds `happy-dom` under `devDependencies`, which is a repo-wide test devDep and does not ship in `@open-slide/core`. |
| NFR-3 | Single-page PNG export < 4 seconds on 2024-class Chromium | GAP | Performance was not measured in CI; CR specifies "measured locally during review." Pure file:line evidence is insufficient. Not validated here. |
| NFR-4 | Does not block the viewer's main React tree (own `createRoot`, removed before return) | PASS | `packages/core/src/app/lib/export-png.ts:187` (`createRoot(host)`) + `:214-215` cleanup. |
| NFR-5 | Passes `pnpm check` and `pnpm typecheck` with zero warnings | PARTIAL | `pnpm typecheck` clean. `pnpm check` reports two pre-existing warnings in files outside this CR (`apps/web/lib/layout.shared.tsx`, `packages/core/src/http/request-guard.ts`); zero warnings on CR-touched files. Strict "zero warnings repo-wide" is not satisfied, but no regression introduced. |
| NFR-6 | Changeset entry against `@open-slide/core`, single-line user-perspective | PASS | `.changeset/export-slides-as-png.md:1-5` — `minor` bump, body: `Add "Export as PNG" entry to the viewer download menu.` |
| NFR-7 | Docstrings on every exported function explain *why* | PASS | `packages/core/src/app/lib/export-png.ts:27-30` (`PngExportProgress`), `:64-67` (`__setRasteriserForTesting`), `:65-68` (`pngFilenameFor`), `:75-81` (`exportSlidePageAsPng`), `:93-103` (`exportSlideAsPngZip`), `:138-143` (`computePercent`). Each docstring discusses intent / constraint satisfied. |

## Acceptance Criteria Verification

| AC # | Description | Status | Evidence |
|------|-------------|--------|----------|
| AC-1 | Single-page PNG downloads at 1920x1080; no error toast; no host residue | PASS | Wiring at `routes/slide.tsx:506-526`; filename produced by `pngFilenameFor` (test at `export-png.test.ts:41-48`); cleanup proven by `exportSlidePageAsPng rejects with no DOM residue` test at `export-png.test.ts:75-80`. Canvas dims fixed at `export-png.ts:174-175` + SVG viewBox at `:357`. |
| AC-2 | Full-deck ZIP advances through `processing`, `rasterising`, `zipping`; downloads `deck.zip`; toast dismissed | PASS | Phase coverage proven by test at `export-png.test.ts:84-105`. Toast lifecycle (custom progress -> dismiss in `finally`) at `routes/slide.tsx:535-562`. ZIP build + download at `export-png.ts:130-135`. Manual eyeballing of "each entry is a valid PNG of 1920x1080" is part of the CR's Phase-5 smoke test (not automated). |
| AC-3 | PNG entries hidden when `allowHtmlDownload === false` | PASS | The two new items are inside the `view === 'slides' && allowHtmlDownload &&` block at `routes/slide.tsx:431`, so they share the gate with HTML and PDF items (also unchanged). |
| AC-4 | Failure path: shows `pngExportFailed` toast, cleans up, releases `exporting` lock | PASS | Error handlers at `routes/slide.tsx:516-521` and `:556-562` (toast.error + `setExporting(false)` in `finally`). Cleanup proven by `export-png.test.ts:75-80`. |
| AC-5 | Rendered PNG uses slide's design tokens | PASS | `designToCssVars` applied to host at `export-png.ts:179-182` before mount; tokens propagate via inlined computed styles in `cloneWithInlinedStyles` at `:226-238`. (Pixel-level verification is a Phase-5 manual smoke step.) |
| AC-6 | `useSlidePageNumber()` shows correct 1-based page index in exported PNG | PASS | `SlidePageProvider` wraps each rendered page with the correct `index` at `export-png.ts:188-194`. Page-context propagation is the same mechanism the PDF exporter uses. (End-to-end pixel verification is manual.) |
| AC-7 | Locale strings render correctly in en/ja/zh-cn/zh-tw | PASS | All four locale files contain the nine new keys (see FR-13 evidence). Existing locale plumbing (`useLocale`) is unchanged and consumes these keys at `routes/slide.tsx:525, :566, :511, :518, :532, :558` and inside `png-progress-toast.tsx:25-46`. |
| AC-8 | `pnpm check` and `pnpm typecheck` exit 0 with no warnings | PARTIAL | Both commands exit 0. `pnpm typecheck` is warning-free. `pnpm check` shows two pre-existing warnings in files not touched by this CR; zero warnings introduced on CR-touched files. Downgraded to PARTIAL because the AC wording is "and emit no warnings". |
| AC-9 | A changeset exists, `minor` bump for `@open-slide/core`, single-line | PASS | `.changeset/export-slides-as-png.md:1-5` matches all three conditions. |
| AC-10 | Safari: best-effort warn before export, falls through to `pngExportFailed` on error | PASS | Safari detection + `toast.message(t.slide.pngSafariBestEffort, ...)` at `routes/slide.tsx:510-512` (single page) and `:531-533` (full deck); pipeline proceeds regardless; standard `pngExportFailed` toast in the catch blocks. Locale key present in all four locales. |

## Test Strategy Verification

| Test File | Test Name | Specified | Exists | Matches Spec |
|-----------|-----------|-----------|--------|--------------|
| `packages/core/src/app/lib/export-png.test.ts` | `filename for single-page export uses page-count-width zero padding` | yes | yes (`export-png.test.ts:41-48`) | yes — asserts `slide-p1.png` for 9 pages and `slide-p001.png` for 100 pages (plus extra cases for 10 and full ranges). Passes. |
| `packages/core/src/app/lib/export-png.test.ts` | `progress emitter produces monotonically non-decreasing percent` | yes | yes (`export-png.test.ts:51-71`) | yes — sequence covers processing -> rasterising -> zipping -> done; asserts each `percent >= prev`. Passes. |
| `packages/core/src/app/lib/export-png.test.ts` | `exportSlidePageAsPng rejects with no DOM residue when the rasterizer throws` | yes | yes (`export-png.test.ts:75-80`) | yes — mocks the rasteriser to reject, asserts the host is removed from `document.body`. Passes. |
| `packages/core/src/app/lib/export-png.test.ts` | `exportSlideAsPngZip calls onProgress at least once per phase` | yes | yes (`export-png.test.ts:84-105`) | yes — mocks rasteriser to a synthetic PNG, asserts the four phases each appear at least once. Passes. |
| `packages/core/src/app/lib/download.test.ts` | `downloadBlob creates and revokes object URL` | yes | yes (`download.test.ts:31-44`) | yes — asserts `createObjectURL` x1, `<a>` removed, `revokeObjectURL` x1 after timer flush. Passes. |

All five specified tests pass under `pnpm test` (4 in `export-png.test.ts`, 1 in `download.test.ts`).

## Diff Coverage

| File | +/- | Mapped Requirements |
|------|-----|---------------------|
| `.changeset/export-slides-as-png.md` | +5 / -0 | NFR-6, AC-9 |
| `docs/cr/CR-0001-export-slides-as-png.md` | +926 / -0 | governance doc (not a code requirement) |
| `package.json` | +1 / -0 | NFR-2 note: root devDep `happy-dom` for test env; does not affect `@open-slide/core` runtime deps |
| `packages/core/src/app/components/png-progress-toast.tsx` | +54 / -0 | FR-11 |
| `packages/core/src/app/lib/download.test.ts` | +45 / -0 | FR-17 (Test Strategy row 5) |
| `packages/core/src/app/lib/download.ts` | +27 / -0 | FR-17 (extracted helper; Phase 2 step 3) |
| `packages/core/src/app/lib/export-html.ts` | +1 / -13 | FR-17 (replaces local `downloadBlob` with shared import; refactor side of Phase 2) |
| `packages/core/src/app/lib/export-png.test.ts` | +106 / -0 | Test Strategy rows 1–4 |
| `packages/core/src/app/lib/export-png.ts` | +425 / -0 | FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7, FR-8, FR-9, FR-9a, FR-9b, FR-9c, FR-10, FR-15, FR-16, NFR-1, NFR-4, NFR-7 |
| `packages/core/src/app/routes/slide.tsx` | +66 / -0 | FR-12, FR-14, FR-16 surface, AC-1, AC-2, AC-3, AC-4, AC-10 |
| `packages/core/src/locale/en.ts` | +13 / -0 | FR-13, AC-7 |
| `packages/core/src/locale/ja.ts` | +13 / -0 | FR-13, AC-7 |
| `packages/core/src/locale/types.ts` | +14 / -0 | FR-13 |
| `packages/core/src/locale/zh-cn.ts` | +13 / -0 | FR-13, AC-7 |
| `packages/core/src/locale/zh-tw.ts` | +13 / -0 | FR-13, AC-7 |
| `pnpm-lock.yaml` | +60 / -2 | Lockfile follow-on for the `happy-dom` devDep added to root `package.json` |

### Unmapped changed files

None. The two non-source files (`docs/cr/CR-0001-export-slides-as-png.md` and `pnpm-lock.yaml`) are governance and lockfile artefacts.

Note: the root `package.json` adds `happy-dom` as a devDependency, which is **not** listed in the CR's "Affected Components" section (the CR explicitly says `packages/core/package.json` is unchanged, which is true). The root-level addition is required to make `// @vitest-environment happy-dom` work in the two new test files. NFR-2 forbids adding a *runtime* dep to `@open-slide/core`, and that holds. Flagged here for transparency rather than as a violation.

## Gaps

1. **NFR-1 (SHOULD < 300 lines)** — `packages/core/src/app/lib/export-png.ts` is 426 lines. The CR provides an explicit escape hatch ("helpers may be split into sibling files in the same namespace if the count is exceeded") that was not exercised. Suggested minimal fix: extract `cloneWithInlinedStyles` + `copyComputedStyle`, `inlineGeistFonts` + `inlineFontFaceSources`, `inlineSameOriginImages`, `nodeToSvgDataUrl`, `defaultRasteriseSvgToPng` into sibling files (e.g. `export-png.clone-styles.ts`, `export-png.inline-fonts.ts`, `export-png.inline-images.ts`, `export-png.svg.ts`, `export-png.rasterise.ts`) so `export-png.ts` itself shrinks below ~300 lines and the small-single-purpose-file rule is fully observed.

2. **NFR-3 (single-page export < 4 s on 2024-class Chromium)** — No measurement was captured during validation. The CR delegates measurement to local review; this report cannot confirm or refute it from diff evidence alone. Suggested minimal fix: record a single-page export timing on a representative deck from `apps/demo` and append the wall-clock to the PR description, or add an opt-in `performance.now()` instrumentation around `renderPageToPng`.

3. **AC-8 / NFR-5 (zero warnings from `pnpm check`)** — Two pre-existing Biome warnings exist outside this CR (`apps/web/lib/layout.shared.tsx`, `packages/core/src/http/request-guard.ts`). They are not regressions, but the AC text is absolute ("emit no warnings"). Suggested minimal fix: either fix the two warnings in-flight (one is a Biome FIXABLE optional-chain refactor in `request-guard.ts`; the other is a `next/image` advisory) or accept the gap as out-of-scope pre-existing tech debt — not a CR-0001 introduced regression.

REPORT_PATH=/Users/desek/Repo/github/1weiho/open-slide/docs/cr/CR-0001-validation-report.md FAIL=0 PARTIAL=3 GAP=1
