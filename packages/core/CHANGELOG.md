# @open-slide/core

## 1.5.0

### Minor Changes

- [#132](https://github.com/1weiho/open-slide/pull/132) [`cdc6dd2`](https://github.com/1weiho/open-slide/commit/cdc6dd21bebf67b744b64264f24b174171b4196b) Thanks [@1weiho](https://github.com/1weiho)! - Add a copy-link button next to the download button on the slide toolbar; copies the current slide URL and shows a toast.

- [#125](https://github.com/1weiho/open-slide/pull/125) [`06b7159`](https://github.com/1weiho/open-slide/commit/06b7159895c202b218a5802b31dc7136de56eeb7) Thanks [@1weiho](https://github.com/1weiho)! - Add slide list sorting on the home page by creation time or name (asc/desc). Reads a new optional `meta.createdAt` (ISO 8601 string) on each slide; preference persists per browser; default is newest-created first.

### Patch Changes

- [#126](https://github.com/1weiho/open-slide/pull/126) [`a59835d`](https://github.com/1weiho/open-slide/commit/a59835d1c3396a237ecdbf01c007d4aa206a818d) Thanks [@1weiho](https://github.com/1weiho)! - Extend cross-origin mutation guard to the design, notes, slides, assets, and folders dev-server endpoints.

- [#138](https://github.com/1weiho/open-slide/pull/138) [`49382a7`](https://github.com/1weiho/open-slide/commit/49382a799b77b7714f6f3a7396a144e73e5bd248) Thanks [@1weiho](https://github.com/1weiho)! - Fix a vertical-line artifact that could appear during fullscreen playback: drive the laser pointer with `transform` instead of `left`/`top` so a moving box-shadow no longer leaves a compositor ghost, and animate the progress bar fill with `scaleX` so its opacity fade-out shares a layer with the parent.

- [#140](https://github.com/1weiho/open-slide/pull/140) [`c6538c4`](https://github.com/1weiho/open-slide/commit/c6538c41c7223f962d9ceb76922b142a38ec9fe3) Thanks [@ridemountainpig](https://github.com/ridemountainpig)! - Add `⌘/` / `Ctrl+/` shortcut to focus the inspector comment input, and allow the inspector panel to scroll its comment input into view when the viewport is too short to fit the full panel.

- [#113](https://github.com/1weiho/open-slide/pull/113) [`fa0d836`](https://github.com/1weiho/open-slide/commit/fa0d836dae38571b98459c7421a9ac21099012ef) Thanks [@DeryFerd](https://github.com/DeryFerd)! - Harden comments and edit mutation endpoints by validating request origin/fetch metadata and requiring JSON content-type for write routes.

- [#135](https://github.com/1weiho/open-slide/pull/135) [`24b7311`](https://github.com/1weiho/open-slide/commit/24b731128701ba90df1f538e7d2ed0e9ee4dc540) Thanks [@1weiho](https://github.com/1weiho)! - Refactor the dev-server Vite plugins: extract pure logic out of the monolithic `comments-plugin` and `files-plugin` into per-domain modules (`editing/`, `files/`, `http/`), and consolidate every `/__*` HTTP endpoint into a single `api-plugin` whose route handlers live under `vite/routes/` (one file per endpoint group with a manifest comment up top). No public API change.

- [#134](https://github.com/1weiho/open-slide/pull/134) [`ac564fa`](https://github.com/1weiho/open-slide/commit/ac564faf8e77127dc98ed2558a1d8638345b0055) Thanks [@1weiho](https://github.com/1weiho)! - Asset deletion now reverts in-slide usages back to image placeholders instead of leaving broken imports.

## 1.4.0

### Minor Changes

- [#114](https://github.com/1weiho/open-slide/pull/114) [`21bb307`](https://github.com/1weiho/open-slide/commit/21bb307db4369b9d40d6fc239c740c85b984bbe3) Thanks [@1weiho](https://github.com/1weiho)! - Add a Global assets manager. Files in the project root `assets/` folder can be imported via the `@assets/*` Vite alias and are reusable across decks and themes. The dev-mode UI exposes it two ways: a Slide / Global scope toggle inside any slide's Assets view, and a dedicated Assets entry in the home sidebar at `/assets`.

- [#119](https://github.com/1weiho/open-slide/pull/119) [`6d9b5f0`](https://github.com/1weiho/open-slide/commit/6d9b5f06b0febf3efbf3316d3037aba4b9422622) Thanks [@1weiho](https://github.com/1weiho)! - Split the Present button into a primary action plus a dropdown with Play (windowed), Fullscreen, and Presenter mode. Windowed play fills the browser viewport without entering the Fullscreen API, and the floating control bar gains a toggle to switch between window and fullscreen mid-presentation.

### Patch Changes

- [#110](https://github.com/1weiho/open-slide/pull/110) [`5a39c31`](https://github.com/1weiho/open-slide/commit/5a39c319f85dff046f9cba67011d314fc5343b89) Thanks [@1weiho](https://github.com/1weiho)! - Fix type errors across inspector, player, slide route, and comments plugin.

- [#115](https://github.com/1weiho/open-slide/pull/115) [`5bc45b7`](https://github.com/1weiho/open-slide/commit/5bc45b7e544958615e4706a6f880f4a56515d21f) Thanks [@1weiho](https://github.com/1weiho)! - Prevent inspector content textarea from expanding the panel width when typing long unbroken lines.

- [#103](https://github.com/1weiho/open-slide/pull/103) [`c7b8f6a`](https://github.com/1weiho/open-slide/commit/c7b8f6a435ed5d27d7e3ab9f8e99b5badcd36515) Thanks [@chentyke](https://github.com/chentyke)! - Support styling selected text ranges in inspector content fields.

- [#117](https://github.com/1weiho/open-slide/pull/117) [`8aab380`](https://github.com/1weiho/open-slide/commit/8aab380bd1840a4183397b2c70b59b387a5144ab) Thanks [@1weiho](https://github.com/1weiho)! - Show a toast when triggering PDF export on Safari, since the print pipeline isn't supported there.

- [#111](https://github.com/1weiho/open-slide/pull/111) [`35158dd`](https://github.com/1weiho/open-slide/commit/35158dd37214978e60775487954168d6cfaf5d4a) Thanks [@1weiho](https://github.com/1weiho)! - Pare back the agent-connected and agent-watching tooltips to a single status line.

## 1.3.0

### Minor Changes

- [#91](https://github.com/1weiho/open-slide/pull/91) [`0e7061a`](https://github.com/1weiho/open-slide/commit/0e7061a21d4d45b7d70a4d1996666a0375913662) Thanks [@1weiho](https://github.com/1weiho)! - Drop external image files onto an `<ImagePlaceholder />` to upload + assign in one step, and upload images straight from the inspector's Replace dialog without switching to the Asset Manager.

- [#90](https://github.com/1weiho/open-slide/pull/90) [`7985d30`](https://github.com/1weiho/open-slide/commit/7985d30f0b30d86770a7c0f28df057b299c8e993) Thanks [@1weiho](https://github.com/1weiho)! - Make the slide editor's thumbnail rail width adjustable via a drag handle. Width persists in localStorage and thumbnails scale to fit.

- [#93](https://github.com/1weiho/open-slide/pull/93) [`5505c3b`](https://github.com/1weiho/open-slide/commit/5505c3b827e1f544504537281c4980b7b41fd02f) Thanks [@1weiho](https://github.com/1weiho)! - Add a Themes panel to the dev UI. Themes under `themes/<id>.md` get their own `/themes` gallery and `/themes/:id` detail page, with a live preview rendered from a paired `themes/<id>.demo.tsx` slide module. Slides can declare a `theme` in `SlideMeta` to back-link to the theme they were built from, and each theme page lists every slide using it. The `/create-theme` skill writes both files so every new theme has an instant preview.

### Patch Changes

- [#95](https://github.com/1weiho/open-slide/pull/95) [`e372b2f`](https://github.com/1weiho/open-slide/commit/e372b2fb1be5d3542a35808db3f1dd9d39fe89bb) Thanks [@1weiho](https://github.com/1weiho)! - Flip the dev-only "Agent connected" and "Agent is watching" badges to a disconnected state when the Vite HMR socket drops, with a tooltip prompting the user to restart the dev server.

- [#96](https://github.com/1weiho/open-slide/pull/96) [`b711765`](https://github.com/1weiho/open-slide/commit/b7117653c6d3e788c09f4fb6e0adb7c2c4c16a56) Thanks [@1weiho](https://github.com/1weiho)! - Point the empty-home hint at `/create-slide` in your agent instead of describing the file layout to author by hand.

- [#102](https://github.com/1weiho/open-slide/pull/102) [`fa21143`](https://github.com/1weiho/open-slide/commit/fa211431a43e847bf9fe9272b81fb202a4c978ec) Thanks [@1weiho](https://github.com/1weiho)! - Add `homepage`, `bugs`, and `author` fields to the published package metadata so npm shows links to the site, repo issues, and author.

- [#92](https://github.com/1weiho/open-slide/pull/92) [`3f959a6`](https://github.com/1weiho/open-slide/commit/3f959a62266a7c08cacd4bd80c3990bd040a0504) Thanks [@1weiho](https://github.com/1weiho)! - Add slide-authoring skill guidance for editing large existing slides: locate the target page with `grep`, then partial-read the range instead of loading the whole file.

- [#88](https://github.com/1weiho/open-slide/pull/88) [`b0665bb`](https://github.com/1weiho/open-slide/commit/b0665bb620e19b995b979ddface46a9ea9bf0eed) Thanks [@1weiho](https://github.com/1weiho)! - Hot-reload the slide list when a new deck is created — previously the dev server had to be restarted before a new slide directory showed up on the home page.

## 1.2.0

### Minor Changes

- [#84](https://github.com/1weiho/open-slide/pull/84) [`1cbbd28`](https://github.com/1weiho/open-slide/commit/1cbbd2847b96db86d962f3fecd1fc01a39cbf4fb) Thanks [@1weiho](https://github.com/1weiho)! - Publish the user's current slide, page, and inspector-selected element to `node_modules/.open-slide/current.json` whenever they navigate or pick an element, and add a `current-slide` skill that teaches agents to resolve references like "this page" or "this element". Surface this in the dev UI with a live "Agent connected" badge in the slide header and an "Agent is watching" badge in the inspector panel; rename the inspector comments section from "note" to "comment" terminology to match the existing `@slide-comment` / `apply-comments` vocabulary.

- [#82](https://github.com/1weiho/open-slide/pull/82) [`ce30d40`](https://github.com/1weiho/open-slide/commit/ce30d407e6e953b92b1039bb94aeabb58b0bd71b) Thanks [@1weiho](https://github.com/1weiho)! - Add a dev-mode notes drawer at the bottom of the slide view for editing speaker notes per page; autosaves to the slide source and creates `export const notes` if missing.

- [#81](https://github.com/1weiho/open-slide/pull/81) [`6922cda`](https://github.com/1weiho/open-slide/commit/6922cdafb902f2b72b9f6b84c276513b2c809668) Thanks [@1weiho](https://github.com/1weiho)! - Add a right-click context menu to thumbnail rail entries with Duplicate and Delete actions, and focus the dragged thumbnail's page on the canvas when reordering starts.

### Patch Changes

- [#87](https://github.com/1weiho/open-slide/pull/87) [`f031771`](https://github.com/1weiho/open-slide/commit/f0317712b9fa084300b82f17c0e39328dc448f77) Thanks [@1weiho](https://github.com/1weiho)! - Tell the `current-slide` skill to re-read `current.json` on every deictic turn, so follow-up edits don't keep targeting the slide the user just navigated away from.

- [#80](https://github.com/1weiho/open-slide/pull/80) [`e922131`](https://github.com/1weiho/open-slide/commit/e92213186fcd79b98f320bf9e64e7719501e3849) Thanks [@1weiho](https://github.com/1weiho)! - Show a loading indicator on the home page while the folders manifest resolves so slides from other folders no longer flash in the draft view on refresh.

- [#77](https://github.com/1weiho/open-slide/pull/77) [`b6613a6`](https://github.com/1weiho/open-slide/commit/b6613a615b0db95ba0a4bad0a62a05b1a5f787fc) Thanks [@1weiho](https://github.com/1weiho)! - Allow resizing the crop rectangle in the image Crop dialog (Fill mode) and add a crop icon to the inspector Crop button.

- [#86](https://github.com/1weiho/open-slide/pull/86) [`d7e1abd`](https://github.com/1weiho/open-slide/commit/d7e1abd0e0d95969a447ebe9ffd7aa2c82a74ec4) Thanks [@1weiho](https://github.com/1weiho)! - Force `cursor: default` and disable text selection across the present player so slide text no longer shows the I-beam, and keep the system cursor hidden over the edge prev/next buttons while the laser pointer is active.

- [#85](https://github.com/1weiho/open-slide/pull/85) [`bcc8420`](https://github.com/1weiho/open-slide/commit/bcc8420d658ff280b30aa5d575cec50dd6b65a13) Thanks [@1weiho](https://github.com/1weiho)! - Make the present overview thumbnail cards hug the preview width instead of stretching to fill the row.

- [#83](https://github.com/1weiho/open-slide/pull/83) [`be26a12`](https://github.com/1weiho/open-slide/commit/be26a127132569c8a83edc266d11503e095e77d8) Thanks [@1weiho](https://github.com/1weiho)! - Reorder the `notes` export alongside the page array when slides are dragged in the thumbnail rail, so speaker notes stay attached to their slides.

- [#79](https://github.com/1weiho/open-slide/pull/79) [`d97b786`](https://github.com/1weiho/open-slide/commit/d97b786b29051dc79a35d9f3be6b685bc9db1c00) Thanks [@1weiho](https://github.com/1weiho)! - Tell agents to render repeated slide elements as explicit `<Component />` instances instead of `array.map`, so the inspector can edit each one independently.

## 1.1.0

### Minor Changes

- [#69](https://github.com/1weiho/open-slide/pull/69) [`b121230`](https://github.com/1weiho/open-slide/commit/b1212304329cf2b437b6c1e496b786dd088537e1) Thanks [@1weiho](https://github.com/1weiho)! - Add a shuffle button to the Design panel that swaps in a curated random preset for inspiration.

- [#72](https://github.com/1weiho/open-slide/pull/72) [`e81b7cd`](https://github.com/1weiho/open-slide/commit/e81b7cd93ebee3c6c9516688d2517db0d83eb864) Thanks [@1weiho](https://github.com/1weiho)! - Drag thumbnails vertically in the dev-mode rail to reorder pages — the new order is written back to the slide's `index.tsx`.

### Patch Changes

- [#64](https://github.com/1weiho/open-slide/pull/64) [`a65a51e`](https://github.com/1weiho/open-slide/commit/a65a51ec310c947706fe98f13782f2bce639b7dd) Thanks [@1weiho](https://github.com/1weiho)! - Align presenter window to design-system tokens and dark-mode palette.

- [#74](https://github.com/1weiho/open-slide/pull/74) [`c2ef916`](https://github.com/1weiho/open-slide/commit/c2ef916585b64e8e27895bd2122cdf591f7e6508) Thanks [@1weiho](https://github.com/1weiho)! - Hide the mouse cursor immediately when navigating slides with the keyboard in fullscreen presentation mode. Cursor reappears as soon as the mouse moves.

- [#57](https://github.com/1weiho/open-slide/pull/57) [`5d780b3`](https://github.com/1weiho/open-slide/commit/5d780b3277732e63ee63be18c181a857b6321df4) Thanks [@1weiho](https://github.com/1weiho)! - Preserve aspect ratio on image-placeholder replacement and add a Crop dialog (with double-click shortcut) for framing images in the inspector.

## 1.0.6

### Patch Changes

- [#49](https://github.com/1weiho/open-slide/pull/49) [`efbcb4e`](https://github.com/1weiho/open-slide/commit/efbcb4eaa38fa9203266caeae750e49fabd06417) Thanks [@1weiho](https://github.com/1weiho)! - Remove redundant section dividers, module headers, and what-comments across the runtime.

- [#54](https://github.com/1weiho/open-slide/pull/54) [`6bcb88e`](https://github.com/1weiho/open-slide/commit/6bcb88e8824c6fe83aa260be8707b28afca2bdd1) Thanks [@Willaiem](https://github.com/Willaiem)! - Fix dev server on Windows: normalize `/@fs/` URL for drive-letter paths and pre-bundle `react`, `react-dom`, `react-dom/client`, and `next-themes`.

- [#53](https://github.com/1weiho/open-slide/pull/53) [`5e674a8`](https://github.com/1weiho/open-slide/commit/5e674a8816479750149b946374ecbfd9128e72d7) Thanks [@chentyke](https://github.com/chentyke)! - Keep the inspect highlight aligned while the inspector panel opens.

## 1.0.5

### Patch Changes

- ca53712: Add i18n support for the slide UI. Set `locale` in `OpenSlideConfig` using one of the presets (`en`, `zhTW`, `zhCN`, `ja`) from `@open-slide/core/locale`.
- fb0c2fa: Inspector edits on repeated content now scope to the clicked instance: typing updates only that DOM node, and saving rewrites the matching source literal — either the call-site prop on a reused component (`<Card title="…" />`) or the matching field of an `.map()`-iterated array entry (`{ tag, label }` objects).
- 2a23011: Inspector text edits now land in more places: descend into wrapper elements, fall through `{children}` slots to component call sites (e.g. `<Eyebrow>` → consumer), and disambiguate sibling text leaves via the pre-edit DOM value. Commit failures are surfaced via toast instead of silently swallowed, and failed edits stay buffered for retry.
- 27d2900: Replace spinner with a hairline + sliding bar for slide and presenter loading states.
- fa709d8: Polish sidebar folder UX: pick color/emoji while creating, success/error toasts on create/delete and slide drag-drop, right-aligned counts.
- 6a4b816: Hide the total folder count next to the sidebar "Folders" header.
- 2b4d0a8: Align sidebar theme toggle flush with the right column of folder counts.

## 1.0.4

### Patch Changes

- 05fb7ca: Make the `create-slide` skill propose aesthetic options tailored to the deck's topic instead of a fixed preset list. Step 2 now requires gathering the topic first and brainstorming three concrete, distinct visual directions for that topic (vibe + palette/typography/motif), so users can actually picture each choice.

## 1.0.3

### Patch Changes

- 802fd51: Add the required `radius` field to the `slide-authoring` skill's starter template. Without it, slides scaffolded from the template fail TypeScript because `DesignSystem` requires `radius: number`.

## 1.0.2

### Patch Changes

- 39780b1: Flatten `DesignSystem.radius` from `{ md: number }` to `number`. CSS var renamed `--osd-radius-md` → `--osd-radius`; `DesignRadius` type removed.

## 1.0.1

### Patch Changes

- 8333608: `create-slide` and `slide-authoring` skills now default new slides to a top-level `export const design: DesignSystem = { … }` consumed via `var(--osd-X)`, so a freshly generated slide is tweakable from the Design panel without extra prompting. The local `palette` constants pattern remains as the explicit fallback for one-off slides whose palette is intentionally locked. The starter template and self-review checklist are updated to match.
