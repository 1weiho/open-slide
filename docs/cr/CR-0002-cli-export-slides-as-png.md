---
name: cli-export-slides-as-png
description: Add an `open-slide export` CLI subcommand that renders deck slides to PNG files on disk via headless Chromium (Playwright), as a follow-up to CR-0001's in-viewer client-side PNG export.
id: "CR-0002"
status: "draft"
date: 2026-05-30
requestor: Framework maintainers
stakeholders:
  - "@open-slide/core maintainers"
  - Slide authors running open-slide in local dev and CI pipelines
priority: "medium"
target-version: "@open-slide/core 1.9.0"
source-branch: feat/export-slides-as-png
source-commit: 6e4dfab
---

# Export slides as PNG from the CLI (headless)

## Change Summary

CR-0001 added a client-side, in-viewer PNG export driven by a hand-rolled
`<foreignObject>` → canvas rasterizer. This CR adds the second leg of PNG export:
a programmatic `open-slide export` subcommand that renders the same slides to PNG
files on disk **without any human browser interaction**, by booting the existing
dev/preview server, navigating a headless Chromium instance to the real viewer
route, awaiting the same readiness signals the in-viewer exporter uses, and
calling `page.screenshot()` once per page at the canonical 1920×1080 canvas size.

The render path is intentionally independent of CR-0001's client rasterizer:
server-side has no DOM and no `<canvas>`, so the hand-rolled `<foreignObject>`
pipeline cannot be reused. Using the real browser via Playwright also sidesteps
the pixel-fidelity caveats documented in CR-0001 (advanced CSS, blend modes,
filters), because the browser itself does the painting.

To keep `@open-slide/core` shippable as a lean npm package, **Playwright is an
optional / dev-only dependency**, never bundled into the client runtime. The
exporter degrades gracefully with a clear, actionable install message when
Playwright is not present, mirroring Slidev's `playwright-chromium`
optional-dependency pattern (`slidev export --format png`).

## Motivation and Background

The in-viewer export from CR-0001 covers the interactive case: an author looks
at the deck and clicks a button. It does not cover three concrete user needs:

* **CI rendering.** A repository wants to regenerate deck thumbnails on every
  commit and post them as PR comments or push them to a docs site. There is no
  human to click a dropdown.
* **Local dev batch export.** An author needs PNGs of every page of every deck
  during a docs refresh, or wants to feed the PNGs into a downstream pipeline
  (image diffing, OCR, social-card generation). Opening each deck in the viewer
  and clicking twice is not the right loop.
* **Higher fidelity for heavy CSS.** CR-0001's hand-rolled rasterizer is bounded
  by what SVG `<foreignObject>` can paint. Decks that rely on advanced filters,
  blend modes, or backdrop effects rasterise more faithfully in a real browser.
  Playwright + `page.screenshot()` uses the browser's own compositor.

A CLI subcommand is the smallest surface that solves all three: it is scriptable
(works in CI), composable (pipes into other tooling), and re-uses code paths
that already exist (the dev server, the viewer route, the readiness signals).

### Change Drivers

* Author feedback: "I want to regenerate deck PNGs in CI without keeping a
  browser tab open."
* Parity with Slidev's `slidev export --format png` ergonomics.
* Pixel-perfect output path for the small set of slides where `<foreignObject>`
  rasterisation drifts from the live viewer.
* Captures the **Future Enhancement** explicitly deferred in CR-0001 (Playwright
  CLI path, opt-in, never in the client bundle).

## Current State

`@open-slide/core` ships a `open-slide` CLI wired up in
`packages/core/src/cli/run.ts` with four subcommands:

* `open-slide dev` — `packages/core/src/cli/dev.ts`, runs Vite's dev server.
* `open-slide build` — `packages/core/src/cli/build.ts`, runs Vite's production
  build.
* `open-slide preview` — `packages/core/src/cli/preview.ts`, serves the build.
* `open-slide sync:skills` — `packages/core/src/cli/sync.ts`, refreshes bundled
  skills.

All subcommands share Commander setup in `run.ts` (parsed via
`program.parseAsync`), use a single small file per subcommand, and import their
implementation lazily via dynamic `import()` so cold-start cost stays low. The
viewer routes are declared in `packages/core/src/app/app.tsx`:

* `/s/:slideId` → `<Slide />` — the deck viewer.
* `/s/:slideId/presenter` → `<Presenter />` — the presenter window.

Inside the viewer, the canonical canvas size is exported from
`packages/core/src/app/lib/sdk.ts` as `CANVAS_WIDTH = 1920` and
`CANVAS_HEIGHT = 1080`. Readiness is determined client-side by helpers in
`packages/core/src/app/lib/print-ready.ts`: `waitForFonts()`,
`waitForDataWaitfor(root)`, and `isFrameAnimationSettled(frame)`. CR-0001's
in-viewer PNG exporter calls these the same way the PDF exporter does.

There is **no** CLI subcommand for exporting PNGs, **no** headless-browser code
anywhere in `packages/core`, and **no** optional Playwright dependency in
`packages/core/package.json`.

### Current State Diagram

```mermaid
flowchart TD
    User[Author in terminal] --> CLI["open-slide CLI<br/>(cli/run.ts)"]
    CLI --> Dev["open-slide dev"]
    CLI --> Build["open-slide build"]
    CLI --> Preview["open-slide preview"]
    CLI --> Sync["open-slide sync:skills"]
    CLI -. no export subcommand .-> NoExport[(missing)]
    Author2[Author in viewer] --> Dropdown["Download dropdown<br/>(slide.tsx)"]
    Dropdown --> PngClient["Export as PNG<br/>(CR-0001, in-viewer)"]
```

## Proposed Change

Add an `open-slide export` subcommand to `packages/core/src/cli/run.ts`, backed
by a new `packages/core/src/cli/export.ts` module that follows the same shape as
`dev.ts` / `build.ts` / `preview.ts`: a single small file, one exported
`export()` function, lazy-imported from `run.ts`.

The exporter MUST:

1. Resolve which decks and which pages to render from the flags.
2. Detect whether Playwright is installed; if not, exit with a non-zero status
   and a one-paragraph install message telling the user exactly what to run.
3. Boot the existing Vite dev server in-process (the same `createServer(config)`
   path `cli/dev.ts` already uses), bound to an ephemeral port on `127.0.0.1`
   so it does not conflict with a running `open-slide dev`.
4. Launch headless Chromium via Playwright, open one page sized
   `{ width: 1920, height: 1080 }`, navigate per slide+page to
   `http://127.0.0.1:<port>/s/<slideId>?page=<n>&export=png` (or an equivalent
   route that the viewer recognises as an export render — see "readiness
   signalling" below).
5. Wait for a deterministic "ready" signal that maps to the same conditions
   CR-0001 awaits client-side: fonts loaded, `data-waitfor` selectors resolved,
   and `isFrameAnimationSettled` for the current frame. Implementors MUST
   expose a single window-level flag (e.g. `window.__OPEN_SLIDE_EXPORT_READY`
   set to `true` and/or a `data-os-export-ready="true"` attribute on the
   `<SlideCanvas>` host) so Playwright can `page.waitForFunction(...)` or
   `page.waitForSelector(...)` on it rather than poll heuristically.
6. Call `page.screenshot({ type: 'png', omitBackground: false, clip: { x: 0, y:
   0, width: 1920, height: 1080 } })` and write the bytes to
   `<outDir>/<slideId>-p<N>.png` using the same `{slideId}-p{N}.png`
   convention as CR-0001 and the same zero-padding-to-total-page-count rule
   (FR-1 of CR-0001).
7. Tear everything down on success and on failure (browser, server, file
   handles).

### Proposed State Diagram

```mermaid
flowchart TD
    User[Author / CI] --> CLI["open-slide CLI<br/>(cli/run.ts)"]
    CLI --> Export["open-slide export<br/>(cli/export.ts — new)"]
    Export --> Detect["Detect Playwright<br/>(dynamic import)"]
    Detect -- missing --> Fail["Print install instructions<br/>Exit code 2"]
    Detect -- present --> StartVite["Start Vite dev server<br/>on 127.0.0.1:<ephemeral>"]
    StartVite --> Resolve["Resolve slides & pages<br/>(--slide / --all / --page)"]
    Resolve --> Browser["Launch headless Chromium<br/>viewport 1920×1080"]
    Browser --> Loop{"For each (slideId, pageIndex)"}
    Loop --> Nav["page.goto /s/<id>?page=N&export=png"]
    Nav --> Ready["page.waitForFunction<br/>window.__OPEN_SLIDE_EXPORT_READY"]
    Ready --> Shot["page.screenshot<br/>{type:'png', clip 1920×1080}"]
    Shot --> Write["Write <outDir>/<slideId>-p<N>.png"]
    Write --> Loop
    Loop -- done --> Teardown["Close browser & server"]
    Teardown --> Exit["Exit code 0"]
```

## Requirements

### Functional Requirements

1. The CLI **MUST** expose a new subcommand `open-slide export` registered in
   `packages/core/src/cli/run.ts` and implemented in
   `packages/core/src/cli/export.ts`, following the same lazy-import pattern as
   `dev`, `build`, and `preview`.
2. The subcommand **MUST** accept the following flags:
   * `--slide <id>` — restrict the export to a single deck (the `slideId` that
     would appear in `/s/:slideId`).
   * `--all` — export every discoverable deck. Mutually exclusive with
     `--slide`.
   * `--page <n>` — restrict the export to a single 1-based page index within
     the selected deck. Requires `--slide`.
   * `--out <dir>` — destination directory; defaults to `./png-export`
     (created if it does not exist).
   * `--port <port>` — optional ephemeral-server port override; defaults to an
     OS-assigned ephemeral port on `127.0.0.1`.
   * `--timeout <ms>` — per-page readiness timeout; defaults to `15000` to
     match CR-0001's `ANIMATION_TIMEOUT_MS`.
3. The subcommand **MUST** exit non-zero with a clear, single-paragraph,
   actionable message when neither `--slide` nor `--all` is provided, telling
   the user which flag to pass.
4. The subcommand **MUST** detect whether the optional Playwright dependency is
   importable (via a dynamic `import('playwright')` or
   `import('playwright-chromium')` inside a `try/catch`) and **MUST** exit with
   a non-zero status and a single-paragraph install message
   (`slide.pngCliPlaywrightMissing`-equivalent prose, hard-coded in
   `cli/export.ts` because CLI output is not locale-routed) when it is not.
5. The subcommand **MUST NOT** import Playwright at the top level of any module
   that is part of the runtime bundle, and **MUST NOT** add Playwright to
   `packages/core`'s `dependencies`. Playwright **MUST** appear only under
   `optionalDependencies` or `devDependencies` in
   `packages/core/package.json`.
6. The subcommand **MUST** boot a Vite dev server in-process using the same
   `createViteConfig({ userCwd: process.cwd() })` + `createServer(config)`
   pattern as `cli/dev.ts`, on `127.0.0.1`, on an ephemeral port unless
   `--port` is provided. The subcommand **MUST NOT** require the user to have
   `open-slide dev` already running.
7. Each rendered PNG **MUST** be exactly `CANVAS_WIDTH` × `CANVAS_HEIGHT`
   (1920×1080), enforced via Playwright's viewport size **and** the
   `clip: { x: 0, y: 0, width: 1920, height: 1080 }` parameter passed to
   `page.screenshot`.
8. Filenames **MUST** match CR-0001's convention:
   `${slideId}-p${String(pageIndex + 1).padStart(String(total).length, '0')}.png`.
   In particular, a 9-page deck yields `slide-p1.png`…`slide-p9.png` (width 1)
   and a 100-page deck yields `slide-p001.png`…`slide-p100.png` (width 3).
9. The subcommand **MUST** wait for a deterministic per-page readiness flag
   surfaced by the viewer before invoking `page.screenshot`. The viewer (the
   `<SlideCanvas>` host or the `<Slide>` route under an `export=png` query
   param) **MUST** set a single observable signal — either
   `window.__OPEN_SLIDE_EXPORT_READY = true` or a `data-os-export-ready="true"`
   attribute on the page-frame element — once the same gating conditions the
   in-viewer exporter awaits have all resolved: `waitForFonts()`,
   `waitForDataWaitfor()`, and `isFrameAnimationSettled()` for the current
   frame.
10. Playwright **MUST** wait on that signal via `page.waitForFunction` or
    `page.waitForSelector`, with the per-page timeout from `--timeout` (default
    15000 ms). On timeout the subcommand **MUST** continue with the screenshot
    rather than abort the whole run, but **MUST** log a warning line that
    names the slide and page (`{slideId}:p{N} readiness timed out — captured
    anyway`).
11. The subcommand **MUST** create `--out` if it does not exist, and **MUST**
    write each PNG atomically (write to `<file>.tmp` then rename) so partial
    files are never observed by downstream tooling.
12. Console output **MUST** be one structured line per page in the format
    `<slideId>:p<N> → <relative/path/to/file.png>` so output is greppable per
    the project's logging standard, and **MUST** end with a summary line
    `Exported <X> page(s) from <Y> deck(s) to <outDir>`.
13. The subcommand **MUST** exit with code `0` on a successful run, `1` on any
    unrecoverable error (server failed to start, Chromium crashed, write
    failed), and `2` on a usage/preflight error (missing Playwright, mutually
    exclusive flags, `--page` without `--slide`, nonexistent `--slide`).
14. The subcommand **MUST NOT** capture the presenter route
    (`/s/:slideId/presenter`) in this CR.
15. The subcommand **MUST NOT** modify any source file outside `packages/core`
    and **MUST NOT** introduce a runtime dependency that lands in the client
    bundle (cross-checked at build time by `tsdown` output inspection — no new
    third-party `import` in `dist/index.js`).
16. The subcommand **MUST** tear down the launched Chromium browser **and** the
    in-process Vite dev server on both success and failure paths (the
    `try/finally` pattern), so no orphan process is left after the CLI exits.

### Non-Functional Requirements

1. `packages/core/src/cli/export.ts` **MUST** be a single file with
   hierarchical-namespace naming and **SHOULD** stay under 300 lines of
   TypeScript, in line with the project's small-single-purpose-files rule.
   Helpers (filename padding, slide enumeration, ready-flag waiting) **MAY**
   be split into sibling files in the same `cli/export.*` namespace if the
   line count is exceeded.
2. This CR **MUST NOT** add any new entry under `dependencies` in
   `packages/core/package.json`. Playwright **MUST** be added under
   `optionalDependencies` (preferred, so `npm install --no-optional` users
   never pull it) or `devDependencies` (acceptable for the workspace's own
   dev loop). The CR **MUST** record which of the two was chosen and why.
3. The subcommand **SHOULD** complete a 10-page deck export in under 30
   seconds on a 2024-class laptop, measured locally during review. Slower runs
   in CI environments without Chromium pre-installed are acceptable.
4. The new code **MUST** pass `pnpm check` (Biome) and `pnpm typecheck` with
   zero warnings.
5. The change **MUST** include a Changeset entry against `@open-slide/core`
   with a single-line, user-perspective description per `CLAUDE.md`. The bump
   **MUST** be `minor` (new public CLI surface).
6. Docstrings on every exported function in `cli/export.ts` **MUST** explain
   *why* (the design constraint each function satisfies), not just *what*, per
   `documentation_standards`.
7. The subcommand **MUST** print its full help text via `--help` listing every
   flag with a short example, matching Commander's existing rendering for the
   other subcommands.
8. The optional-Playwright-not-installed message **MUST** include the exact
   `pnpm add -D playwright-chromium` (or equivalent `npm` / `yarn`) command,
   so the user can copy-paste it. The message **MUST NOT** be a stack trace.

## Affected Components

* `packages/core/src/cli/run.ts` — register the new `export` subcommand
  alongside `dev`, `build`, `preview`, `sync:skills`.
* `packages/core/src/cli/export.ts` — **new**, the headless export
  implementation. Single file, mirrors the shape of `dev.ts` / `build.ts`.
* `packages/core/src/cli/export.test.ts` — **new**, unit tests for
  flag-parsing, filename padding, slide/page resolution, and the
  Playwright-missing branch (the actual headless render is exercised by the
  manual smoke step, not by Vitest).
* `packages/core/src/app/routes/slide.tsx` and/or
  `packages/core/src/app/components/slide-canvas.tsx` — small additive change
  that recognises `?export=png` and sets the readiness signal
  (`window.__OPEN_SLIDE_EXPORT_READY = true` and/or `data-os-export-ready`)
  after `waitForFonts`, `waitForDataWaitfor`, and `isFrameAnimationSettled`
  have all resolved for the current page. This **MUST** be a no-op when the
  query param is absent so the interactive viewer is unaffected.
* `packages/core/src/app/lib/print-ready.ts` — unchanged unless a small helper
  (e.g. a unified `waitForPageReady(frame)` that wraps the three existing
  predicates) is extracted; if extracted, the in-viewer PNG/PDF exporters
  **MUST** be updated to call it too, to avoid two readiness implementations.
* `packages/core/package.json` — add `playwright-chromium` (or `playwright`)
  to `optionalDependencies` (preferred) **or** `devDependencies` (acceptable
  for the workspace's own dev loop). Decision recorded in the changeset
  prose.
* `.changeset/<slug>.md` — minor bump for `@open-slide/core` with a
  one-line, present-tense, user-perspective description.
* `docs/cr/CR-0002-cli-export-slides-as-png.md` — this file.

## Scope Boundaries

### In Scope

* A single new CLI subcommand `open-slide export` with the flags listed in
  FR-2.
* Booting the existing dev server in-process to serve the viewer to headless
  Chromium.
* Headless rendering via Playwright (`playwright-chromium` preferred).
* Per-page readiness signalling so screenshots are deterministic.
* Filename convention identical to CR-0001 (`{slideId}-p{N}.png`, zero-padded
  to total-page width).
* Graceful, actionable degradation when Playwright is not installed.
* Atomic file writes into `--out` (default `./png-export`).
* A changeset and a minor bump on `@open-slide/core`.

### Out of Scope ("Here, But Not Further")

* **Dev-server HTTP endpoint** (e.g. `GET /__export/png?slide=…&page=…`).
  Tempting, but introduces a long-running ambient render route in the viewer's
  dev server and complicates the readiness contract. Deferred to a possible
  future CR.
* **JPEG, WebP, AVIF, or PDF output formats.** PNG only in this CR.
* **Custom resolutions / scale factors / DPR.** Fixed 1920×1080. A `--scale`
  flag for retina is deferred.
* **Presenter-mode capture** (`/s/:slideId/presenter`). The presenter window
  is intentionally not part of the export surface in this CR.
* **Animated capture** (frame sequences, GIF, MP4, APNG). Single steady-state
  screenshot per page.
* **`packages/cli` changes.** The scaffolder is untouched. The `open-slide`
  CLI lives in `@open-slide/core`.
* **Parallel browser contexts / sharding for very large decks.** The first
  cut is single-context, sequential. Parallelism is a future enhancement once
  real-deck profiling exists.
* **Reusing the CR-0001 client `<foreignObject>` rasterizer in a headless
  page.** Possible in principle, but redundant — Playwright's
  `page.screenshot()` already paints with the browser engine, which is the
  whole reason we are launching one.
* **Configurable filename templates.** Naming is fixed.

## Alternative Approaches Considered

* **Playwright `page.screenshot()` against a real viewer route.** **Chosen.**
  The browser's compositor does the painting, which is pixel-perfect by
  construction. Reuses every readiness predicate the viewer already exposes.
  The only cost is an optional dependency the user opts into.
* **Reuse CR-0001's client-side `<foreignObject>` rasterizer inside a
  headless page.** Technically possible — Playwright could navigate to the
  viewer, click "Export as PNG", and intercept the download. Rejected because
  it (a) inherits CR-0001's documented `<foreignObject>` fidelity caveats for
  no benefit (we already have a real browser), (b) couples the CLI path
  tightly to the viewer's DOM dropdown, which is brittle, and (c) adds two
  serialisation hops (live DOM → SVG → canvas → PNG) where
  `page.screenshot()` does one.
* **Server-side SVG rasterisation (e.g. `satori` + `@resvg/resvg-js`).**
  Rejected. Open-slide renders arbitrary React component trees with full CSS,
  including effects (`backdrop-filter`, blends, transforms, gradients) that
  Satori does not support. Bridging that gap is a much larger project than
  shelling out to Chromium.
* **Puppeteer instead of Playwright.** Puppeteer would also work, with a
  similar API surface. Playwright wins on (a) first-class TypeScript types,
  (b) explicit `playwright-chromium` package that ships only the Chromium
  bits (smaller install for users who only need PNGs), (c) better
  cross-platform reliability for headless screenshots in CI, and (d)
  precedent: Slidev's `slidev export` already uses Playwright (specifically
  `playwright-chromium` as an optional dep), giving authors a familiar
  install story.
* **Bundling Chromium with `@open-slide/core` directly.** Hard rejected.
  Chromium is ~150 MB and would inflate every `npm install` for users who
  never touch this subcommand. CLAUDE.md's "core runtime ships to users;
  every dep inflates install size" rule rules this out.
* **Spawning the user's `open-slide dev` server from a separate process.**
  Adds inter-process plumbing for no benefit; `createServer(config)` returns
  a programmatic handle we can `listen()` and `close()` in-process. The
  existing `cli/dev.ts` proves the pattern.

### Future Enhancements (documented follow-up)

* **Dev-server HTTP endpoint** that returns a PNG for a given slide+page
  directly, so external scripts can render without spawning the CLI. Out of
  scope for this CR.
* **`--format jpeg|webp|pdf`** as additional output formats once PNG is
  stable.
* **Presenter capture** via a second flag (`--presenter`) once the viewer's
  presenter route exposes a stable readiness signal.
* **`--scale 2`** for retina output by doubling Playwright's viewport DPR.
* **Parallel rendering** with multiple browser contexts for very large decks
  in CI, profile-driven, behind a `--concurrency N` flag.

## Impact Assessment

### User Impact

* Authors and CI pipelines gain a scriptable PNG export with one command.
* The in-viewer PNG export from CR-0001 is unchanged. Users who never run
  `open-slide export` see no behavioural change.
* Users who do run it pay a one-time install cost for `playwright-chromium`
  (the first time they run the command), with a clear, copy-pasteable error
  message guiding them through it.

### Technical Impact

* No new entry under `dependencies` in `packages/core/package.json`. Install
  size for non-export users is unchanged.
* New small additive code path in the viewer to surface a readiness signal
  under `?export=png`. The path is gated on the query param and is a no-op
  for the interactive viewer.
* The Vite dev server gains a second consumer (Playwright) but uses the same
  in-process `createServer(config)` already proven by `cli/dev.ts`.
* No breaking API change; no change to the runtime exports of
  `@open-slide/core`.

### Business Impact

* Closes the deferred-from-CR-0001 ask ("the Playwright CLI path"), giving
  CI users a path that does not require a headed browser.
* Keeps the npm install lean for everyone who only consumes the runtime.

## Implementation Approach

Sequenced so each phase is independently reviewable.

### Phase 1: Foundation — CLI subcommand skeleton + Playwright detection

1. Add a new `export` subcommand to `packages/core/src/cli/run.ts` following
   the existing pattern: declare flags via Commander's `option(...)`, lazy-
   import the implementation via `await import('./export.ts')`.
2. Create `packages/core/src/cli/export.ts` exporting an `export()` function
   with the flag interface (`ExportFlags`).
3. Implement the Playwright-detection helper (`tryImportPlaywright()`) that
   returns either the imported `{ chromium }` namespace or `null`. On `null`,
   the subcommand prints the single-paragraph install instructions and exits
   with code `2`.
4. Add the optional dependency to `packages/core/package.json` under
   `optionalDependencies` (preferred) and capture the decision in the
   changeset.

**Affected components:** `packages/core/src/cli/run.ts`,
`packages/core/src/cli/export.ts` (new),
`packages/core/package.json`.

### Phase 2: Viewer-side readiness signal

1. Extend `packages/core/src/app/routes/slide.tsx` (or
   `slide-canvas.tsx` — pick whichever already has access to the current
   `Page` instance) to recognise the `export=png` query param. When set:
   1. Await `waitForFonts()`.
   2. Await `waitForDataWaitfor(frameEl)`.
   3. Poll `isFrameAnimationSettled(frameEl)` with the same
      `ANIMATION_TIMEOUT_MS = 15_000` / `POLL_INTERVAL_MS = 100` constants the
      in-viewer exporters use.
   4. Set `window.__OPEN_SLIDE_EXPORT_READY = true` and add
      `data-os-export-ready="true"` to the page frame element.
2. Ensure the path is a strict no-op when the query param is absent (the
   interactive viewer must not pay any cost or render any extra DOM).
3. Optionally extract a unified `waitForPageReady(frame)` helper into
   `packages/core/src/app/lib/print-ready.ts` so the in-viewer PNG/PDF
   exporters and the headless path call the same predicate.

**Affected components:** `packages/core/src/app/routes/slide.tsx` or
`packages/core/src/app/components/slide-canvas.tsx`,
`packages/core/src/app/lib/print-ready.ts` (optional helper extraction).

### Phase 3: Headless render loop

1. In `cli/export.ts`, implement `startDevServer()` that calls
   `createViteConfig({ userCwd: process.cwd() })`, then `createServer(config)`,
   `await server.listen(0, '127.0.0.1')` (or the explicit `--port`), and
   returns `{ server, port }`. Mirrors `cli/dev.ts` but binds to the
   loopback interface and an ephemeral port.
2. Implement `enumerateSlides()` that lists deck IDs by reading from the
   server's known slide manifest path (`/__slides` is the same API the viewer
   already uses for reorder/duplicate operations — confirm the right
   read-only endpoint or read the filesystem under `slidesDir` directly).
3. Implement `renderOne(page, slideId, pageIndex, totalPages, outDir)` that:
   1. Navigates `page.goto('http://127.0.0.1:<port>/s/<slideId>?page=<n>&export=png')`.
   2. Awaits the readiness signal via
      `page.waitForFunction(() => (window as any).__OPEN_SLIDE_EXPORT_READY === true, { timeout })`.
   3. Calls `page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1920, height: 1080 } })`.
   4. Writes the buffer to
      `path.join(outDir, \`${slideId}-p${padded(pageIndex+1, totalPages)}.png\`)`
      via the atomic temp+rename helper.
   5. Logs `<slideId>:p<N> → <relPath>`.
4. Implement the top-level orchestration: launch one Chromium browser, open
   one page sized 1920×1080, iterate the resolved (slide, pageIndex) tuples,
   call `renderOne` for each. Use a single page across pages — `page.goto`
   between renders so we do not pay context-creation cost per page.
5. Wrap the whole thing in `try/finally` so the browser and the Vite server
   are closed on any throw.

**Affected components:** `packages/core/src/cli/export.ts`.

### Phase 4: Polish, tests, changeset

1. Add unit tests per the Test Strategy below — flag parsing, filename
   padding, missing-Playwright branch, atomic-write helper, and slide/page
   resolution. The real headless render is not unit-tested (jsdom cannot
   run Chromium); it is exercised manually per AC-1.
2. Run `pnpm check`, `pnpm typecheck`, `pnpm test`.
3. Run `pnpm changeset` and write a single-line minor-bump entry for
   `@open-slide/core`, e.g. `Add "open-slide export" CLI subcommand for
   headless PNG export.` Note in the changeset prose whether Playwright is
   under `optionalDependencies` or `devDependencies`.
4. Smoke-test against `apps/demo`: run
   `pnpm --filter @open-slide/demo open-slide export --all --out ./tmp-png`,
   open the PNGs, and confirm they match the live viewer.

**Affected components:** `packages/core/src/cli/export.test.ts` (new),
`.changeset/<slug>.md` (new).

### Implementation Flow

```mermaid
flowchart LR
    subgraph P1["Phase 1: CLI skeleton"]
        A1[Register export subcommand]
        A2[cli/export.ts skeleton]
        A3[Optional-dep detection]
        A1 --> A2 --> A3
    end
    subgraph P2["Phase 2: Viewer ready signal"]
        B1[Recognise ?export=png]
        B2[Set window flag + data attr]
        B1 --> B2
    end
    subgraph P3["Phase 3: Headless loop"]
        C1[Start Vite in-process]
        C2[Enumerate slides]
        C3[renderOne via Playwright]
        C4[Atomic write + log]
        C1 --> C2 --> C3 --> C4
    end
    subgraph P4["Phase 4: Verify"]
        D1[Unit tests]
        D2[Biome + typecheck + test]
        D3[Changeset]
        D4[Manual smoke]
        D1 --> D2 --> D3 --> D4
    end
    P1 --> P2 --> P3 --> P4
```

## Test Strategy

Real headless rendering cannot run in the unit-test environment (Vitest +
jsdom cannot launch Chromium), so this CR follows CR-0001's split: unit-test
the arg-parsing, filename, path, and preflight logic, and treat the actual
render as a manual / e2e verification step against `apps/demo`.

### Tests to Add

| Test File | Test Name | Description | Inputs | Expected Output |
|-----------|-----------|-------------|--------|-----------------|
| `packages/core/src/cli/export.test.ts` | `filename for headless export uses page-count-width zero padding` | Verifies the filename helper matches CR-0001's convention (FR-8): produces `slide-p1.png` for a 9-page deck (width 1, no padding) and `slide-p001.png` for a 100-page deck (width 3). | `slideId = 'slide'`, `pageIndex = 0`, `total = 9` and `total = 100` | `'slide-p1.png'` (width 1) and `'slide-p001.png'` (width 3). |
| `packages/core/src/cli/export.test.ts` | `flag preflight rejects --page without --slide with exit code 2` | Calls the CLI flag preflight with `{ page: 1 }` and asserts it throws a typed preflight error mapped to exit code 2 (FR-13). | `{ page: 1, all: false, slide: undefined }` | Preflight error mentioning `--page requires --slide`; mapped exit code 2. |
| `packages/core/src/cli/export.test.ts` | `flag preflight rejects --slide and --all together with exit code 2` | Mutually exclusive flags (FR-2) produce a preflight error mapped to exit code 2. | `{ slide: 'intro', all: true }` | Preflight error; mapped exit code 2. |
| `packages/core/src/cli/export.test.ts` | `missing Playwright produces a single-paragraph install message and exit code 2` | Mocks the dynamic import to throw `ERR_MODULE_NOT_FOUND`, captures stderr, and asserts the output contains the exact `pnpm add -D playwright-chromium` install hint and exits with code 2 (FR-4, NFR-8). | Mocked `tryImportPlaywright()` returning `null`. | stderr includes `pnpm add -D playwright-chromium`; process exit code 2. |
| `packages/core/src/cli/export.test.ts` | `atomic write writes to .tmp then renames` | Verifies the atomic-write helper writes to `<file>.tmp` and renames on success, and removes the `.tmp` on failure (FR-11). | Mocked `fs.promises` with a successful write and a failing write. | On success: one `writeFile` to `*.tmp` and one `rename` to the final name. On failure: `*.tmp` cleaned up; final file never created. |
| `packages/core/src/cli/export.test.ts` | `slide/page resolution picks one page for --slide + --page` | The resolver under `{ slide: 'intro', page: 2, all: false }` returns exactly one `(slideId, pageIndex)` tuple with `pageIndex === 1` (0-based internally) and the slide's total page count attached. | Mocked enumerator returning `intro: 5 pages`, `outro: 3 pages`. | `[{ slideId: 'intro', pageIndex: 1, total: 5 }]`. |
| `packages/core/src/cli/export.test.ts` | `slide/page resolution expands --all to every page of every deck` | Asserts cross-product expansion. | Same mocked enumerator. | 8 tuples total: 5 from `intro`, 3 from `outro`, in declared order. |

### Tests to Modify

| Test File | Test Name | Current Behavior | New Behavior | Reason for Change |
|-----------|-----------|------------------|--------------|-------------------|
| `packages/core/src/cli/run.test.ts` | `parsePort` suite | Tests `parsePort` in isolation. | Unchanged — `parsePort` is reused as-is for the new `--port` flag. | Reuse, not change. |
| _none others_ | _n/a_ | _n/a_ | _n/a_ | The Phase 2 viewer change is a no-op when `?export=png` is absent, so existing viewer behaviour is unchanged. |

### Tests to Remove

| Test File | Test Name | Reason for Removal |
|-----------|-----------|-------------------|
| _none_ | _n/a_ | No tests are removed by this CR. |

## Acceptance Criteria

### AC-1: `open-slide export --all` renders every page of every deck to PNG

```gherkin
Given the workspace `apps/demo` contains a deck "intro" with 3 pages
  And a deck "outro" with 2 pages
  And `playwright-chromium` is installed
When the user runs `open-slide export --all --out ./tmp-png`
Then the command exits with code 0
  And `./tmp-png/intro-p1.png`, `./tmp-png/intro-p2.png`, `./tmp-png/intro-p3.png` exist
  And `./tmp-png/outro-p1.png`, `./tmp-png/outro-p2.png` exist
  And each PNG has pixel dimensions 1920 × 1080
  And no orphan Chromium process or Vite dev server remains after the command exits
```

### AC-2: `--slide` restricts the export to a single deck

```gherkin
Given decks "intro" and "outro" exist
When the user runs `open-slide export --slide intro --out ./tmp-png`
Then the command exits with code 0
  And only PNGs prefixed `intro-` appear under `./tmp-png/`
  And no `outro-` PNGs are produced
```

### AC-3: `--slide` + `--page` renders exactly one PNG

```gherkin
Given the deck "intro" has 5 pages
When the user runs `open-slide export --slide intro --page 2 --out ./tmp-png`
Then the command exits with code 0
  And exactly one file is created at `./tmp-png/intro-p2.png`
  And it has pixel dimensions 1920 × 1080
```

### AC-4: Missing Playwright produces a copy-pasteable install message

```gherkin
Given the workspace has `playwright-chromium` uninstalled
When the user runs `open-slide export --all`
Then the command exits with code 2
  And stderr contains the literal string `pnpm add -D playwright-chromium`
  And stderr is a single paragraph (not a stack trace)
  And no Vite dev server is started
```

### AC-5: Mutually exclusive and dependent flag misuse exits 2

```gherkin
Given the user runs `open-slide export --slide intro --all`
Then the command exits with code 2
  And stderr explains that `--slide` and `--all` are mutually exclusive
Given the user runs `open-slide export --page 1`
Then the command exits with code 2
  And stderr explains that `--page` requires `--slide`
```

### AC-6: Filenames use the same zero-padding convention as CR-0001

```gherkin
Given a deck "deck" has 100 pages
When the user runs `open-slide export --slide deck --out ./tmp-png`
Then files are named `deck-p001.png`, `deck-p002.png`, …, `deck-p100.png`
Given a deck "small" has 9 pages
When the user runs `open-slide export --slide small --out ./tmp-png`
Then files are named `small-p1.png`, …, `small-p9.png`
```

### AC-7: Readiness signal is awaited before screenshot

```gherkin
Given a deck has a page with a 2-second intro animation
  And the page declares a `data-waitfor` selector that resolves after fonts load
When the user runs `open-slide export --slide deck --page 1 --out ./tmp-png`
Then the rendered PNG does not show the mid-animation frame
  And the rendered PNG shows the same steady-state frame that the live viewer
   displays once the animation has settled
```

### AC-8: Readiness timeout warns but still captures

```gherkin
Given a deck has a page whose readiness signal never resolves (broken `data-waitfor`)
When the user runs `open-slide export --slide deck --page 1 --timeout 2000 --out ./tmp-png`
Then the command logs a single warning line naming the slide and page
  And `./tmp-png/deck-p1.png` is still written (best-effort capture per FR-10)
  And the command exits with code 0
```

### AC-9: Interactive viewer is unaffected by the readiness signal path

```gherkin
Given the developer runs `pnpm dev` and opens `/s/intro` (no `?export=png`)
Then `window.__OPEN_SLIDE_EXPORT_READY` is not set
  And no `data-os-export-ready` attribute appears on the page frame
  And the viewer behaves identically to before this CR
```

### AC-10: No Playwright import in the runtime bundle

```gherkin
Given the branch contains the full implementation of this CR
When `pnpm --filter @open-slide/core build` completes
Then `packages/core/dist/index.js` contains no string `playwright`
  And the published package's `dependencies` contain no `playwright*` entry
  And `optionalDependencies` (or `devDependencies`) contain exactly one
   `playwright-chromium` entry
```

### AC-11: Biome and TypeScript remain clean

```gherkin
Given the branch contains the full implementation of this CR
When `pnpm check` and `pnpm typecheck` are run from the repo root
Then both commands exit with code 0 and emit no warnings
```

### AC-12: Changeset entry is present

```gherkin
Given the branch contains the full implementation of this CR
When the maintainer inspects `.changeset/`
Then a new markdown file exists with a `minor` bump for `@open-slide/core`
  And the description is a single line, present-tense, user-perspective sentence
  And the prose names whether Playwright is under `optionalDependencies` or
   `devDependencies`
```

## Quality Standards Compliance

### Build & Compilation

- [x] `pnpm build` completes for `packages/core` without errors
- [x] No new TypeScript compiler errors or warnings
- [x] `dist/index.js` contains no `playwright` import (AC-10)

### Linting & Code Style

- [x] `pnpm check` (Biome) passes with zero warnings/errors
- [x] No code added under `packages/core/src/app/components/ui/`
  (shadcn-generated)
- [x] No casual comments; only comments where the WHY is non-obvious
- [x] File names follow hierarchical-namespace convention
  (`cli/export.ts`, `cli/export.test.ts`)

### Test Execution

- [x] `pnpm test` passes locally
- [x] New tests in `cli/export.test.ts` pass
- [x] No existing test in `packages/core` regresses
- [x] Manual smoke run against `apps/demo` documented in the PR description

### Documentation

- [x] Every exported function in `cli/export.ts` has a docstring explaining
  intent
- [x] The subcommand's `--help` output names every flag with a short
  example
- [x] No changes to `README.md` are required (the new subcommand is
  self-documenting via `--help`)

### Code Review

- [x] Changes submitted via a single pull request
- [x] PR title follows Conventional Commits, e.g.
  `feat(core): add "open-slide export" CLI for headless PNG export`
- [x] Squash-merged to maintain linear history
- [x] Changeset committed under `.changeset/`

### Verification Commands

```bash
# From the repo root
pnpm install
pnpm check
pnpm typecheck
pnpm test
pnpm build

# Dogfood
pnpm --filter @open-slide/demo exec open-slide export --all --out ./tmp-png
ls ./apps/demo/tmp-png   # PNGs land here; open one and eyeball at 100 %
```

## Risks and Mitigation

### Risk 1: Playwright is not installed in the user's environment

**Likelihood:** high (especially first-time use, and CI environments without
the dep cached)
**Impact:** medium
**Mitigation:** FR-4 / NFR-8 / AC-4 codify a single-paragraph,
copy-pasteable install message and a deterministic exit code 2 so CI logs
are diagnosable. The detection is a dynamic `import()` in a `try/catch`, so
the subcommand never fails with a raw module-resolution stack trace.

### Risk 2: CI runs without Chromium system libraries (slim Docker images)

**Likelihood:** medium
**Impact:** medium
**Mitigation:** Even with `playwright-chromium` installed, Chromium needs
shared libraries (`libnss3`, `libatk-1.0-0`, `libxkbcommon0`, etc.) on
Linux. When `chromium.launch()` fails with the well-known
`error while loading shared libraries: …` message, the subcommand **MUST**
surface a friendly hint pointing at Playwright's documented system-deps
install command (`npx playwright install-deps chromium`). This is a one-time
CI-image fix, not a per-run cost.

### Risk 3: Animation / font readiness mis-detection produces inconsistent PNGs

**Likelihood:** low
**Impact:** medium
**Mitigation:** The readiness signal awaited by Playwright is set by the
*same* predicates (`waitForFonts`, `waitForDataWaitfor`,
`isFrameAnimationSettled`) the in-viewer exporters already trust. A
broken-`data-waitfor` page falls through to the per-page timeout warning
(FR-10 / AC-8) so the run still produces a PNG and surfaces the issue in
the log. Extracting `waitForPageReady` into `print-ready.ts` (Phase 2) keeps
the predicate canonical across the in-viewer and headless paths.

### Risk 4: Large decks exhaust memory / open too many pages

**Likelihood:** low
**Impact:** medium
**Mitigation:** The render loop uses a single `Page` and navigates between
slides via `page.goto`, instead of opening one page per slide. Peak memory
is bounded by a single browser context plus one in-flight PNG buffer.
Parallelism is intentionally deferred to a future CR (see Future
Enhancements).

### Risk 5: Port conflicts when `open-slide dev` is already running

**Likelihood:** low
**Impact:** low
**Mitigation:** The headless server binds to `127.0.0.1` on an
OS-assigned ephemeral port unless the user passes `--port`. The two
servers can coexist.

### Risk 6: The shared readiness extraction regresses the in-viewer exporters

**Likelihood:** low
**Impact:** medium
**Mitigation:** If Phase 2's `waitForPageReady(frame)` extraction is taken,
the in-viewer PNG (CR-0001) and PDF exporters are migrated to the helper in
the same PR, and the existing in-viewer smoke step from CR-0001 is re-run.
If the extraction is skipped, the headless path simply duplicates the three
calls — no regression risk.

### Risk 7: Cross-origin or filesystem-asset paths render as broken images

**Likelihood:** low
**Impact:** low
**Mitigation:** Because the viewer is served by the same in-process Vite
dev server the headless browser navigates to, asset URLs resolve through
the dev server exactly as they do for the interactive author. This avoids
CR-0001's same-origin caveat for client `<img>` inlining: nothing needs to
be inlined; the browser fetches each asset live from the dev server.

## Dependencies

* **No new runtime dependency in `@open-slide/core`'s `dependencies`.**
  Playwright is added under `optionalDependencies` (preferred) or
  `devDependencies`, never `dependencies`. The runtime bundle remains
  unchanged.
* **Conceptually builds on CR-0001** for the slide enumeration model and the
  filename convention, but the render path is independent (server-side
  Playwright vs. client-side `<foreignObject>` rasterizer). The two paths
  share only the readiness predicates from `print-ready.ts`.
* Indirectly depends on Vite's `createServer(config)` programmatic API
  staying stable (already relied on by `cli/dev.ts`).
* No infrastructure or third-party-service dependencies.

## Estimated Effort

* Phase 1 (CLI subcommand + optional-dep detection): ~2 hours.
* Phase 2 (viewer-side readiness signal): ~2 hours.
* Phase 3 (headless render loop): ~5 hours.
* Phase 4 (tests, changeset, smoke): ~3 hours.
* Total: ~12 person-hours, single contributor.

## Decision Outcome

Chosen approach: **add an `open-slide export` CLI subcommand that boots the
existing Vite dev server in-process, drives the real viewer route through
headless Chromium via Playwright, awaits a deterministic per-page readiness
signal, and captures `page.screenshot()` once per page at the canonical
1920×1080 canvas size, writing files under `{slideId}-p{N}.png` to match
CR-0001's convention**.

Playwright is **opt-in**: registered under `optionalDependencies` (or
`devDependencies`) and never imported at the top level of any runtime module,
so `@open-slide/core` ships to users at the same install size as before. When
the dep is missing, the subcommand exits with a single-paragraph,
copy-pasteable install message — mirroring Slidev's `playwright-chromium`
precedent — rather than a stack trace.

This decision captures the **Future Enhancement** explicitly deferred in
CR-0001 (the pixel-perfect Playwright path), keeps the dev-server HTTP
endpoint out of scope as a possible future enhancement, and preserves the
"core runtime ships to users; every dep inflates install size" rule codified
in `CLAUDE.md` without compromise.

## Related Items

* Related CR: `docs/cr/CR-0001-export-slides-as-png.md` — in-viewer PNG export,
  whose "Future Enhancements" section explicitly defers the Playwright CLI
  path to a follow-up CR (this one).
* Related code: `packages/core/src/cli/run.ts`,
  `packages/core/src/cli/dev.ts`,
  `packages/core/src/cli/build.ts`,
  `packages/core/src/cli/preview.ts`,
  `packages/core/src/app/app.tsx` (route table),
  `packages/core/src/app/routes/slide.tsx`,
  `packages/core/src/app/lib/print-ready.ts`,
  `packages/core/src/app/lib/sdk.ts` (`CANVAS_WIDTH`, `CANVAS_HEIGHT`),
  `packages/core/src/vite/config.ts` (`createViteConfig`).
* Related config: `packages/core/package.json` (where the optional dep
  lands).
* External precedent: Slidev `slidev export --format png`, which installs
  `playwright-chromium` on demand as an optional dependency.

## Open Questions

1. **`optionalDependencies` vs. `devDependencies` for `playwright-chromium`.**
   Leaning: `optionalDependencies`. Rationale: it installs by default but is
   not a hard failure under `npm install --no-optional`, which is the most
   user-friendly default for end users while still letting CI opt out.
   Recorded here for the implementor to confirm against the maintainer's
   preference; either choice satisfies NFR-2.
2. **Slide enumeration source.** Two options: read the slide manifest from
   the running dev server (the same `/__slides` API the viewer uses) versus
   walking `slidesDir` on disk via `node:fs`. Leaning: read from the dev
   server, because it already knows which slides are valid and would catch a
   slide that fails to compile. Implementor MAY choose disk walk if it
   simplifies error handling; either way the resolved list MUST match what
   the viewer would render.
3. **Whether to extract `waitForPageReady(frame)` in Phase 2.** Leaning:
   yes. Keeps the readiness predicate canonical across in-viewer PNG/PDF
   exporters and the new headless path. Implementor MAY defer if the
   extraction touches more files than expected, but in that case the
   headless path MUST duplicate the three calls verbatim.
4. **Whether to support `--concurrency N` in this CR.** No — explicitly
   out of scope. The first cut is sequential; parallelism comes after real
   profiling against real decks.
