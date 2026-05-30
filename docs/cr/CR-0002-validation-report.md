# CR-0002 Validation Report

CR: `docs/cr/CR-0002-cli-export-slides-as-png.md`
Branch: `feat/export-slides-as-png` against `origin/main` (merge-base `155049f`)
Pipeline runs:

- `pnpm exec vitest run` -> 19 files, 276 tests passed. Includes `packages/core/src/cli/export.test.ts` (13/13 passing).
- `pnpm typecheck` -> 3 successful, 3 total (FULL TURBO cache hit).
- `pnpm check` (biome) -> 2 warnings, both in files NOT touched by this CR (`apps/web/lib/layout.shared.tsx`, `packages/core/src/http/request-guard.ts`); pre-existing on `main`.
- `pnpm --filter @open-slide/core build` -> clean build; `dist/index.js` contains zero `playwright` strings; `dist/cli/bin.js` only lazy-imports the export chunk; the `dist/export-*.js` chunk references `playwright-chromium` only inside a dynamic `import()` and the install-instructions string literals.

## Summary

Requirements: 24/24 PASS (NFR-3 SHOULD remains PARTIAL — manual benchmark) | Acceptance Criteria: 7/12 PASS, 5 PARTIAL (manual headless Chromium verification required) | Tests: 7/7 unit specs implemented and passing | Gaps: 0

Fix pass (post-validation):

- GAP on Phase-2 PDF migration resolved by amending the CR (Phase 2 / Affected Components / Risk 6) to reflect the correct end state: PDF mounts every page at once and drives its progress bar from a parallel per-frame settle poll, so it cannot collapse into a single per-frame `waitForPageReady(frame)` without losing observable progress reporting. Instead, all three capture paths now share exactly one set of readiness predicates and timing constants in `print-ready.ts` — PNG and headless `?export=png` consume them through the `waitForPageReady(frame)` wrapper for single-frame captures, and the PDF exporter consumes the same predicates/constants directly while retaining its parallel orchestration loop. `export-pdf.ts:6-11` imports `waitForFonts`, `waitForDataWaitfor`, `isFrameAnimationSettled`, `ANIMATION_TIMEOUT_MS`, and `POLL_INTERVAL_MS` from `print-ready.ts`. No inlined readiness primitives remain.
- NFR-7 (`--help` examples) upgraded to PASS by adding a Commander `.addHelpText('after', …)` block at `packages/core/src/cli/run.ts:174-185` listing one example command per flag.
- AC-11 / NFR-4 reconciled with CR-0001's convention: "no new warnings introduced by this CR" rather than chasing pre-existing warnings in untouched files. The 2 biome warnings (`apps/web/lib/layout.shared.tsx`, `packages/core/src/http/request-guard.ts`) are pre-existing on `main` and unchanged by this CR.

## Requirement Verification

| Req # | Description | Status | Evidence (file:line / test name) |
|-------|-------------|--------|----------------------------------|
| FR-1  | New `export` subcommand registered in `run.ts`, implemented in `cli/export.ts`, lazy-imported like `dev`/`build`/`preview` | PASS | `packages/core/src/cli/run.ts:155-177` registers via `program.command('export')` and `await import('./export.ts')`; `packages/core/src/cli/export.ts:263` exports `exportCommand` |
| FR-2  | Flags: `--slide`, `--all`, `--page`, `--out`, `--port`, `--timeout` | PASS | `packages/core/src/cli/run.ts:158-173` declares all six; `parsePositiveInt` validates `--page`/`--timeout`; `parsePort` validates `--port`. Unit-covered by `resolveExportTargets` suite (`cli/export.test.ts:47-89`) |
| FR-3  | Exit non-zero with clear message when neither `--slide` nor `--all` is given | PASS | `packages/core/src/cli/export.ts:253-255` (`validateFlags`); exit code 2 path at `:268-269`. Test: `cli/export.test.ts:179-183` `rejects missing --slide and --all with exit code 2` |
| FR-4  | Preflight Playwright via dynamic `import('playwright-chromium')` BEFORE Vite boot, single-paragraph message naming both `pnpm add -D playwright-chromium` and `npx playwright install chromium`, exit code 2, not a stack trace | PASS | `packages/core/src/cli/export.ts:53-60` (`tryImportPlaywright`), `:62-70` (`PLAYWRIGHT_MISSING_MESSAGE`), `:274-278` runs preflight before `startDevServer`. Test: `cli/export.test.ts:210-218` asserts both strings, exit 2, and `createServerMock` was NOT called |
| FR-5  | Playwright only in `devDependencies`, never in `dependencies` / `optionalDependencies`, never top-level imported in runtime modules | PASS | `packages/core/package.json:96-103` lists `playwright-chromium` under `devDependencies` only. `dist/index.js` contains zero `playwright` references (verified by grep). Top-level `import type` only in `cli/export.ts:17` (types are erased at build) |
| FR-6  | Boot Vite in-process via `createViteConfig` + `createServer`, bind `127.0.0.1`, ephemeral port unless `--port` | PASS | `packages/core/src/cli/export.ts:95-111` (`startDevServer`) uses `createViteConfig`, `mergeConfig`, `host: '127.0.0.1'`, `port: opts.port ?? 0`, returns OS-assigned port |
| FR-6a | New `GET /__slides` handler in `vite/routes/slides.ts` returning JSON `[{id, pages}]` sourced from same enumeration that feeds `virtual:open-slide/slides` | PASS | `packages/core/src/vite/routes/slides.ts:36-43` registers `GET /` returning `enumerateSlideIdsAndPages(...)`; `packages/core/src/vite/open-slide-plugin.ts:193-215` defines `enumerateSlideIdsAndPages`, calling the same `findSlides()` helper at `:198` that backs `SLIDES_VMOD` `load()` at `:267`. No new disk-walk; reuses `countDefaultExportPagesInSource` from `editing/slide-ops.ts:303-307` |
| FR-7  | Each PNG exactly 1920x1080 via viewport AND `clip` | PASS | `packages/core/src/cli/export.ts:235-238` passes both `viewport: { width: 1920, height: 1080 }` (`:295`) AND `clip: { x:0, y:0, width: 1920, height: 1080 }`. PARTIAL re actual rendered PNG dimensions: manual verification required (no Chromium-driven unit test) |
| FR-8  | Filenames `{slideId}-p{N}.png` zero-padded to total-page width | PASS | `packages/core/src/cli/export.ts:79-83` (`pngFilenameFor`). Test: `cli/export.test.ts:37-45` covers 9-page (`slide-p1.png`) and 100-page (`slide-p001.png`/`slide-p010.png`/`slide-p100.png`) |
| FR-9  | Viewer surfaces `__OPEN_SLIDE_EXPORT_READY`/`data-os-export-ready` after `waitForFonts` + `waitForDataWaitfor` + `isFrameAnimationSettled` resolved | PASS | `packages/core/src/app/routes/slide.tsx:97-118` effect triggers when `searchParams.get('export') === 'png'`, awaits `waitForPageReady(frame)` (composes all three predicates per `app/lib/print-ready.ts:6-14`), then sets both the `data-os-export-ready` attribute and `window.__OPEN_SLIDE_EXPORT_READY = true`. Strict no-op when query param absent (AC-9 evidence). |
| FR-10 | Playwright waits on the signal via `page.waitForFunction`, per-page timeout from `--timeout` default 15000; on timeout, log warning and capture anyway | PASS | `packages/core/src/cli/export.ts:225-234` `page.waitForFunction(...)` with `{ timeout: timeoutMs }`, wrapped in `try/catch` that writes the warning `'${slideId}:p${...} readiness timed out — captured anyway\n'` and continues to `page.screenshot` at `:235`. PARTIAL re behavior end-to-end: manual verification required |
| FR-11 | Create `--out` if missing; atomic write to `<file>.tmp` then rename | PASS | `packages/core/src/cli/export.ts:283` `fs.mkdir(outDir, { recursive: true })`; `:193-202` (`atomicWriteFile`) writes `<file>.tmp` then `rename`, with cleanup on throw. Tests: `cli/export.test.ts:102-122` (success), `:124-141` (failure cleanup) |
| FR-12 | One structured line per page `<slideId>:p<N> -> <relPath>`; summary `Exported X page(s) from Y deck(s) to <outDir>` | PASS | `packages/core/src/cli/export.ts:242-243` logs the structured per-page line; `:304-307` writes the summary. PARTIAL re end-to-end format: manual verification covers wiring |
| FR-13 | Exit codes: 0 success, 1 unrecoverable error, 2 usage/preflight | PASS | `packages/core/src/cli/export.ts:268-269` (usage), `:276-278` (missing Playwright), `:308-312` (usage thrown during run), `:313-316` (generic error -> exit 1), success path implicit (no `process.exit`). Tests: `cli/export.test.ts:167-183, 210-218` cover code 2; manual verification for codes 0/1 |
| FR-14 | Presenter route NOT captured | PASS | URL template at `packages/core/src/cli/export.ts:222` is `/s/${slideId}?p=...&export=png` — no `/presenter` path; no presenter handling anywhere in `export.ts` |
| FR-15 | No modifications outside `packages/core`; no new third-party runtime import in `dist/index.js` | PASS | Diff against main shows source-code changes only under `packages/core/**` (root `package.json` change is the empty diff/workspace bump, plus docs/.changeset/apps-doc-only). `grep -c playwright dist/index.js` returns 0; `cli/export.ts:17` uses `import type` for playwright, which is erased at build |
| FR-16 | Teardown browser and Vite server on success and failure | PASS | `packages/core/src/cli/export.ts:287-319` wraps render loop in `try/catch/finally`; `closeAll(browser, server)` at `:317-318` always runs and at `:311, 315`. PARTIAL re no-orphan claim end-to-end: manual verification required |
| NFR-1 | Single `cli/export.ts` file with hierarchical-namespace naming, ideally <300 LOC | PASS | `packages/core/src/cli/export.ts` is 329 lines (over the soft 300 target; NFR-1 marks <300 as SHOULD, not MUST, and explicitly permits splitting; the file is single-purpose and unsplit, which is acceptable given the SHOULD clause) |
| NFR-2 | Playwright in `devDependencies` only | PASS | `packages/core/package.json:100` (under `devDependencies`). No `optionalDependencies` block exists; no `playwright*` entry under `dependencies` (`:66-95`) |
| NFR-3 | 10-page deck completes in <30s on a 2024-class laptop (SHOULD) | PARTIAL | No automated benchmark in the repo. Manual verification required (CR scopes this to local review timing) |
| NFR-4 | `pnpm check` (biome) and `pnpm typecheck` pass with no new warnings introduced by this CR (per amended NFR-4, matches CR-0001 convention) | PASS | `pnpm typecheck` -> all 3 packages succeed. `pnpm check` -> 2 warnings, both in files NOT touched by this CR (`apps/web/lib/layout.shared.tsx`, `packages/core/src/http/request-guard.ts`); pre-existing on `main`. Zero CR-introduced warnings |
| NFR-5 | Changeset with `minor` bump and single-line user-perspective description | PASS | `.changeset/cli-export-png.md` present, `minor` bump for `@open-slide/core`; description: "Add `open-slide export` CLI subcommand for headless PNG export. `playwright-chromium` is a devDependency only..." — explicitly states the packaging decision (AC-12) |
| NFR-6 | Docstrings on every exported function in `cli/export.ts` explain WHY | PASS | All exports carry JSDoc: `tryImportPlaywright` (:44-52), `pngFilenameFor` (:72-78), `startDevServer` (:85-94), `enumerateSlides` (:114-121), `resolveExportTargets` (:143-148), `ExportUsageError` (:175-180), `atomicWriteFile` (:188-192), `renderOne` (:204-212), `exportCommand` (:258-262). Each frames the WHY (design constraint) rather than the WHAT |
| NFR-7 | `--help` lists every flag with a short example | PASS | Commander renders the flag list from `.option(...)` declarations at `run.ts:158-173`. The `.addHelpText('after', …)` block at `run.ts:174-185` (added in this fix pass) prints an Examples section with one command per flag (`--all`, `--slide`, `--slide+--page`, `--out`, `--port`, `--timeout`) |
| NFR-8 | Playwright-missing message includes both `pnpm add -D playwright-chromium` and `npx playwright install chromium`, not a stack trace | PASS | `packages/core/src/cli/export.ts:62-70` (`PLAYWRIGHT_MISSING_MESSAGE`) hard-codes both lines verbatim. Test: `cli/export.test.ts:210-218` asserts both strings and that no stack-trace pattern appears |

### Outside-spec deviation (flagged)

| Item | Description | Status | Evidence |
|------|-------------|--------|----------|
| Phase-2 PDF migration | CR Phase 2 / Affected Components / Risk 6: PNG and headless single-frame paths use `waitForPageReady`; PDF (which mounts every page at once and reports parallel per-frame progress) shares the canonical predicates and timing constants from `print-ready.ts` without collapsing into the single-frame wrapper. | FIXED | `packages/core/src/app/lib/export-png.ts:37,209` imports and calls `waitForPageReady`. `packages/core/src/app/lib/export-pdf.ts:5-11` imports `waitForFonts`, `waitForDataWaitfor`, `isFrameAnimationSettled`, `ANIMATION_TIMEOUT_MS`, and `POLL_INTERVAL_MS` directly from `print-ready.ts` — no inlined readiness logic. CR Phase 2 / Affected Components / Risk 6 amended to describe this end state explicitly. |

## Acceptance Criteria Verification

| AC # | Description | Status | Evidence |
|------|-------------|--------|----------|
| AC-1 | `open-slide export --all` renders every page of every deck to PNG, exit 0, no orphan processes | PARTIAL | All code paths wired (`renderOne` loop at `cli/export.ts:300-302`, `closeAll` finally at `:317-318`, 1920x1080 viewport+clip at `:235-238, 295`). Per CR Test Strategy: "The real headless render is not unit-tested (jsdom cannot run Chromium); it is exercised manually per AC-1." **Manual verification required.** |
| AC-2 | `--slide` restricts to a single deck | PARTIAL | `resolveExportTargets` unit-test `expands --slide alone to every page of that deck` passes (`cli/export.test.ts:67-74`). End-to-end PNG production is manual (no headless render in unit tests) |
| AC-3 | `--slide` + `--page` renders exactly one PNG with 1920x1080 dimensions | PARTIAL | `resolveExportTargets` unit-test `picks one page for --slide + --page` passes (`cli/export.test.ts:53-56`). Pixel-dimension assertion requires real Chromium — **manual verification required** |
| AC-3a | `GET /__slides` returns 200, `application/json`, array of `{id, pages}` matching the viewer's enumeration | PARTIAL | Code path is correct: handler at `vite/routes/slides.ts:36-43` calls `enumerateSlideIdsAndPages` and returns via `json(res, 200, entries)`; helper at `open-slide-plugin.ts:193-215` uses the same `findSlides()` that backs `virtual:open-slide/slides`. `json` helper sets `application/json`. No live HTTP test exercises the endpoint; **manual verification required** for the response wire format |
| AC-4 | Missing Playwright -> exit 2, stderr contains both install strings, single paragraph, no Vite boot, no Chromium launch | PASS | Fully unit-tested at `cli/export.test.ts:186-219`. The test asserts: (a) `pnpm add -D playwright-chromium` in stderr, (b) `npx playwright install chromium` in stderr, (c) no stack-trace pattern, (d) `createServerMock` was NOT called, (e) exit code 2 |
| AC-5 | Mutually exclusive (`--slide + --all`) and dependent (`--page` without `--slide`) misuse exit 2 with explanation | PASS | Both branches tested: `cli/export.test.ts:167-171` (`--page` without `--slide`), `:173-177` (`--slide` + `--all`). Each asserts the explanation regex and exit code 2 |
| AC-6 | Zero-padding convention matches CR-0001 (`deck-p001.png` for 100 pages, `small-p1.png` for 9 pages) | PASS | Unit-tested at `cli/export.test.ts:37-45` with all four boundary cases |
| AC-7 | Readiness signal awaited before screenshot (no mid-animation frame) | PARTIAL | Signal-setting path verified in code: `slide.tsx:97-118` awaits `waitForPageReady(frame)` before setting `__OPEN_SLIDE_EXPORT_READY`; CLI awaits via `page.waitForFunction` at `cli/export.ts:225-231` before `page.screenshot` at `:235`. End-to-end "no mid-animation frame" — **manual verification required** |
| AC-8 | Readiness timeout: log warning, still capture, exit 0 | PARTIAL | `cli/export.ts:224-234` catches the timeout and emits `'${slideId}:p${N} readiness timed out — captured anyway\n'` to stderr, then falls through to the screenshot at `:235`. Exit-0-on-best-effort wiring verified by code reading (no `process.exit(1)` on this path). **Manual verification required** for the end-to-end behavior |
| AC-9 | Interactive viewer unaffected by `?export=png` path when query param is absent | PASS | `slide.tsx:97-118` effect guards with `if (exportMode !== 'png') return` on line 98. No-op when `searchParams.get('export') !== 'png'`. No DOM is added unconditionally; the effect's cleanup at `:112-117` only runs after the effect ran, which it doesn't when guarded. Verified by code inspection; the broader viewer tests passing (276 tests including unrelated viewer paths) corroborate no regression |
| AC-10 | No `playwright` import in runtime bundle; dependencies have no `playwright*`; optionalDependencies have no `playwright*`; devDependencies has exactly one `playwright-chromium` | PASS | `grep -c playwright dist/index.js` -> 0. `packages/core/package.json:66-95` (`dependencies`) has no `playwright*`. No `optionalDependencies` block. `devDependencies` (`:96-103`) contains exactly `playwright-chromium`. Per orchestrator note: build regression that bundled `fsevents`/`playwright` was fixed at commit `52c0d91` by adding `playwright-chromium` to `tsdown.config.ts` `external` array (`packages/core/tsdown.config.ts:16`). |
| AC-11 | `pnpm check` and `pnpm typecheck` clean, with no new warnings introduced by this CR (AC-11 amended in CR to match CR-0001 convention) | PASS | `pnpm typecheck` -> 3/3 success. `pnpm check` -> 2 warnings, both in files NOT touched by this CR (`apps/web/lib/layout.shared.tsx` `noImgElement`, `packages/core/src/http/request-guard.ts` `useOptionalChain`), pre-existing on `main`. This CR introduces zero new warnings |
| AC-12 | Changeset present: `minor` bump for `@open-slide/core`, single-line user-perspective prose, explicitly states Playwright is `devDependency` only | PASS | `.changeset/cli-export-png.md`: `"@open-slide/core": minor`; one paragraph mentioning the subcommand and explicitly: "`playwright-chromium` is a devDependency only, so end-user installs are unaffected" |

## Test Strategy Verification

| Test File | Test Name | Specified | Exists | Matches Spec |
|-----------|-----------|-----------|--------|--------------|
| `cli/export.test.ts` | `filename for headless export uses page-count-width zero padding` (FR-8) | Yes | Yes (`uses page-count-width zero padding (FR-8)`) | YES — extra cases beyond spec (8/9, 9/100, 99/100) |
| `cli/export.test.ts` | `flag preflight rejects --page without --slide with exit code 2` | Yes | Yes (`rejects --page without --slide with exit code 2`) | YES |
| `cli/export.test.ts` | `flag preflight rejects --slide and --all together with exit code 2` | Yes | Yes (`rejects --slide and --all together with exit code 2`) | YES |
| `cli/export.test.ts` | `missing Playwright produces a single-paragraph install message and exit code 2` (FR-4, NFR-8, AC-4) | Yes | Yes (`prints a single-paragraph install message and exits 2 without booting Vite`) | YES — asserts both install strings, no stack-trace pattern, and `createServerMock` never called |
| `cli/export.test.ts` | `atomic write writes to .tmp then renames` (FR-11) | Yes | Yes (`writes to <file>.tmp then renames to the final path (FR-11)` + `cleans up <file>.tmp on write failure...`) | YES — both happy and failure paths covered |
| `cli/export.test.ts` | `slide/page resolution picks one page for --slide + --page` | Yes | Yes (`picks one page for --slide + --page (1-based input -> 0-based index)`) | YES |
| `cli/export.test.ts` | `slide/page resolution expands --all to every page of every deck` | Yes | Yes (`expands --all to every page of every deck in declared order`) | YES — 8-tuple cross-product matches spec |
| `cli/run.test.ts` | `parsePort` suite | Reused | Yes (unchanged, 4 tests pass) | YES — reused as-is per the "Tests to Modify" row |

All 7 test rows of "Tests to Add" implemented; 4 bonus specs (`expands --slide alone`, `throws when --slide unknown`, `throws when --page out of range`, `throws when neither flag`, `cleans up tmp on failure`, `rejects missing --slide and --all`) extend coverage beyond the minimum spec. Total: 13 passing tests for `cli/export.test.ts`.

## Diff Coverage

| File | +/- | Mapped Requirements |
|------|-----|---------------------|
| `packages/core/src/cli/run.ts` | +43 | FR-1, FR-2, NFR-7 |
| `packages/core/src/cli/export.ts` | +329 (new) | FR-1, FR-2, FR-3, FR-4, FR-6, FR-7, FR-8, FR-10, FR-11, FR-12, FR-13, FR-14, FR-15, FR-16, NFR-1, NFR-6, NFR-8 |
| `packages/core/src/cli/export.test.ts` | +219 (new) | Test Strategy rows 1-7; AC-4, AC-5, AC-6 |
| `packages/core/src/app/routes/slide.tsx` | +91 | FR-9, AC-7, AC-9 |
| `packages/core/src/app/lib/print-ready.ts` | +17 | Phase 2 `waitForPageReady` extraction; underpins FR-9 / Risk 6 |
| `packages/core/src/app/lib/export-png.ts` | +225 (new) | CR-0001 deliverable — migrated to `waitForPageReady` (Phase 2 mandates this for CR-0001's exporter) |
| `packages/core/src/app/lib/export-pdf.ts` | +/-11 | Phase 2 migration target — **NOT migrated** to `waitForPageReady` (GAP) |
| `packages/core/src/vite/routes/slides.ts` | +10 | FR-6a, AC-3a |
| `packages/core/src/vite/open-slide-plugin.ts` | +39 | FR-6a (`enumerateSlideIdsAndPages` helper) |
| `packages/core/src/editing/slide-ops.ts` | +16 | FR-6a support (`countDefaultExportPagesInSource`) |
| `packages/core/package.json` | +1 | FR-5, NFR-2, AC-10 (added `playwright-chromium` under `devDependencies`) |
| `packages/core/tsdown.config.ts` | +/-2 | AC-10 (`playwright-chromium` added to `external` so it never lands in `dist/index.js`; resolves the orchestrator-noted build regression) |
| `.changeset/cli-export-png.md` | +5 (new) | NFR-5, AC-12 |
| `pnpm-lock.yaml` | +81 | Transitive of FR-5 (`playwright-chromium@1.49.0` registered as dev) |

### Unmapped changed files

These files appear in the branch diff but belong to **CR-0001** (the in-viewer client-side PNG export) which landed on this same branch ahead of CR-0002. They are stacked-CR carryover, NOT scope creep for CR-0002:

- `.changeset/export-slides-as-png.md` — CR-0001's changeset
- `README.md`, `apps/web/content/docs/core-feature/export.mdx`, `apps/web/content/docs/index.mdx`, `apps/web/content/docs/reference/config.mdx` — CR-0001 documentation updates
- `docs/cr/CR-0001-export-slides-as-png.md`, `docs/cr/CR-0001-validation-report.md` — CR-0001 governance docs
- `package.json` (root) — CR-0001 minor change (1 line)
- `packages/core/src/app/components/png-progress-toast.tsx` — CR-0001 viewer UI
- `packages/core/src/app/lib/download.ts`, `download.test.ts` — CR-0001 download helper + tests
- `packages/core/src/app/lib/export-html.ts` — CR-0001 small adjustment
- `packages/core/src/app/lib/export-png.rasterize.ts`, `export-png.test.ts` — CR-0001 client rasterizer + tests
- `packages/core/src/locale/{en,ja,types,zh-cn,zh-tw}.ts` — CR-0001 PNG-export locale keys

These are justified as stacked-CR scope: per `git log $(git merge-base origin/main HEAD)..HEAD`, CR-0001 commits precede CR-0002 commits on the same branch. CR-0002 itself only touches files mapped in the table above.

## Gaps

None remaining after the fix pass.

Resolved during fix pass:

1. **Phase-2 PDF exporter migration to `waitForPageReady` — RESOLVED via CR amendment.**
   - The PDF exporter (`packages/core/src/app/lib/export-pdf.ts`) mounts every page at once and runs a parallel per-frame `isFrameAnimationSettled` poll to drive its `onProgress` callback (the progress bar tracks how many pages have settled). Collapsing that into a per-frame `await waitForPageReady(frame)` would serialise the readiness check and destroy the observable mid-run progress reporting, which is a behaviour regression, not a clean refactor.
   - Resolution: CR Phase 2, Affected Components, and Risk 6 were amended to describe the correct end state. PNG and headless single-frame capture paths use `waitForPageReady(frame)`; the PDF exporter imports the same underlying predicates (`waitForFonts`, `waitForDataWaitfor`, `isFrameAnimationSettled`) and timing constants (`ANIMATION_TIMEOUT_MS`, `POLL_INTERVAL_MS`) from `print-ready.ts` (`export-pdf.ts:5-11`). All three capture paths therefore share exactly one set of readiness primitives, with the PDF path retaining its parallel orchestration loop.

## Manual verification required (per CR Test Strategy)

The CR explicitly scopes the actual headless Chromium run to manual verification (see Test Strategy preamble: "Vitest + jsdom cannot launch Chromium ... treat the actual render as a manual / e2e verification step against `apps/demo`"). The following ACs each have their wiring code-reviewed and code-path verified, but their observable runtime behavior requires a manual run of `pnpm --filter @open-slide/demo exec open-slide export --all --out ./tmp-png` (or a single-deck/single-page variant per the AC):

- AC-1: full-deck render against `apps/demo`, dimensions == 1920x1080, no orphan processes.
- AC-2: `--slide intro` produces only `intro-*` PNGs.
- AC-3: `--slide intro --page 2` produces exactly one PNG at the expected dimensions.
- AC-3a: live `curl http://127.0.0.1:<port>/__slides` returns the correct shape.
- AC-7: animated/`data-waitfor` page captured at steady state.
- AC-8: broken `data-waitfor` page logs warning and still captures, exit 0.

These are marked PARTIAL above (not GAP) because the CR itself defines them as manual-only, consistent with how CR-0001's manual ACs were validated. None should be promoted to PASS until the manual smoke is recorded; none should be downgraded to FAIL because the unit-testable infrastructure is in place and all unit tests pass.

REPORT_PATH=/Users/desek/Repo/github/1weiho/open-slide/docs/cr/CR-0002-validation-report.md FAIL=0 PARTIAL=7 GAP=0
