# @open-slide/core

## 1.17.1

### Patch Changes

- [#356](https://github.com/1weiho/open-slide/pull/356) [`f182fbd`](https://github.com/1weiho/open-slide/commit/f182fbdf13b367c6245a8a14049b82dc830545cf) Thanks [@1weiho](https://github.com/1weiho)! - Restore React 18 and Vite 5 compatibility for existing and newly generated projects.

## 1.17.0

### Minor Changes

- [#344](https://github.com/1weiho/open-slide/pull/344) [`4a4fa17`](https://github.com/1weiho/open-slide/commit/4a4fa17484a3caabf28cdd6885db3a1feaef356d) Thanks [@1weiho](https://github.com/1weiho)! - Upgrade to React 19 and Vite 8.

## 1.16.0

### Minor Changes

- [#315](https://github.com/1weiho/open-slide/pull/315) [`61839b7`](https://github.com/1weiho/open-slide/commit/61839b78969edc1173657b7f53d53f6bff939f39) Thanks [@1weiho](https://github.com/1weiho)! - Stabilize the morph transition API: rename `unstable_SharedElement` to `MorphElement` and the `sharedElements` transition option to `morph`.

- [#313](https://github.com/1weiho/open-slide/pull/313) [`afa9d8c`](https://github.com/1weiho/open-slide/commit/afa9d8c56fcf458403d746900b62fb27a4aec801) Thanks [@1weiho](https://github.com/1weiho)! - Add useIsActivePage() so pages can gate entrance animations to the live audience-facing instance.

### Patch Changes

- [#316](https://github.com/1weiho/open-slide/pull/316) [`118965e`](https://github.com/1weiho/open-slide/commit/118965e6aae6f6a2a96a6b1a9f8dd3d7213ddbad) Thanks [@1weiho](https://github.com/1weiho)! - Fix morph transitions snapping background, border, and outline colors at the end of the glide instead of interpolating them.

- [#313](https://github.com/1weiho/open-slide/pull/313) [`afa9d8c`](https://github.com/1weiho/open-slide/commit/afa9d8c56fcf458403d746900b62fb27a4aec801) Thanks [@1weiho](https://github.com/1weiho)! - Measure morph-element rects before the enter/exit phases start so transform keyframes no longer offset morph targets.

- [#313](https://github.com/1weiho/open-slide/pull/313) [`afa9d8c`](https://github.com/1weiho/open-slide/commit/afa9d8c56fcf458403d746900b62fb27a4aec801) Thanks [@1weiho](https://github.com/1weiho)! - Document morph transitions in the slide-authoring skill.

- [#328](https://github.com/1weiho/open-slide/pull/328) [`e850d8e`](https://github.com/1weiho/open-slide/commit/e850d8e2785a171c5d4fed6c43028699931f5f30) Thanks [@1weiho](https://github.com/1weiho)! - Split the slide-authoring skill into per-primitive reference files under `references/`.

- [#337](https://github.com/1weiho/open-slide/pull/337) [`5e5bcdf`](https://github.com/1weiho/open-slide/commit/5e5bcdf58f02bd50ac2c95d4e8c16c9d9252b684) Thanks [@1weiho](https://github.com/1weiho)! - Fix bundled skill prompts so agent instructions, commands, and file references work correctly in scaffolded projects.

## 1.15.3

### Patch Changes

- [#297](https://github.com/1weiho/open-slide/pull/297) [`771902c`](https://github.com/1weiho/open-slide/commit/771902c3345223d0e54d32d1bbd7e869722f955f) Thanks [@ridemountainpig](https://github.com/ridemountainpig)! - Add adjustable speaker notes text size in presenter view, persisted across sessions.

- [#270](https://github.com/1weiho/open-slide/pull/270) [`9bea0a4`](https://github.com/1weiho/open-slide/commit/9bea0a4244185296692aea2201f922166ffa9e60) Thanks [@mvanhorn](https://github.com/mvanhorn)! - Stop remounting the slide canvas when speaker notes are saved in dev.

- [#271](https://github.com/1weiho/open-slide/pull/271) [`4fece8d`](https://github.com/1weiho/open-slide/commit/4fece8d4507dcd4df88b39f04c7d0ca29b9958df) Thanks [@Yacolate0519-cmd](https://github.com/Yacolate0519-cmd)! - Skip slide folders whose id isn't ASCII-safe (e.g. CJK folder names) instead of listing slides that then fail to move into folders or be edited; warn once per ignored folder.

## 1.15.2

### Patch Changes

- [#308](https://github.com/1weiho/open-slide/pull/308) [`9782b86`](https://github.com/1weiho/open-slide/commit/9782b86e0b53e499a286a23a90a398d03f6d4026) Thanks [@1weiho](https://github.com/1weiho)! - Declare `use-sync-external-store` as a direct dependency so Vite can resolve and pre-bundle the Base UI shim under pnpm, fixing the missing `useSyncExternalStore` export at runtime.

## 1.15.1

### Patch Changes

- [#306](https://github.com/1weiho/open-slide/pull/306) [`8d2f937`](https://github.com/1weiho/open-slide/commit/8d2f937d34dc6cbe82b542ac75cb34637dbe4413) Thanks [@1weiho](https://github.com/1weiho)! - Pre-bundle the Base UI `use-sync-external-store` shim so the dev server no longer throws a missing `useSyncExternalStore` export.

## 1.15.0

### Minor Changes

- [#303](https://github.com/1weiho/open-slide/pull/303) [`e8cc746`](https://github.com/1weiho/open-slide/commit/e8cc746b4da5f8c6aa9bad351415a25c3821f8de) Thanks [@1weiho](https://github.com/1weiho)! - Migrate the internal UI primitives from Radix UI to Base UI (`@base-ui/react`), dropping the `radix-ui` dependency.

- [#301](https://github.com/1weiho/open-slide/pull/301) [`f4b4672`](https://github.com/1weiho/open-slide/commit/f4b4672d82e718c273d63a1011caa7753d07384b) Thanks [@1weiho](https://github.com/1weiho)! - Retone the app UI to a neutral SaaS palette: flat pure-gray surfaces, crisper labels, refreshed folder colors.

### Patch Changes

- [#304](https://github.com/1weiho/open-slide/pull/304) [`9dbce8d`](https://github.com/1weiho/open-slide/commit/9dbce8d947bca1058b06a2660528a1bef97b0664) Thanks [@1weiho](https://github.com/1weiho)! - Hide the Assets sidebar entry in production builds, where asset management is unavailable.

## 1.14.0

### Minor Changes

- [#296](https://github.com/1weiho/open-slide/pull/296) [`82c8a7c`](https://github.com/1weiho/open-slide/commit/82c8a7ccea30d42f4c983c3cae9525601493ec90) Thanks [@1weiho](https://github.com/1weiho)! - Add a restart button to the sidebar update tooltip that restarts the dev server after an in-app update, keep the tooltip open while updating, and shorten the update-available copy.

### Patch Changes

- [#298](https://github.com/1weiho/open-slide/pull/298) [`97fe094`](https://github.com/1weiho/open-slide/commit/97fe094b7939112a29f4e86a7c22f04f05787fe0) Thanks [@1weiho](https://github.com/1weiho)! - Show an edge control to return to the current slide when its thumbnail is out of view.

- [#299](https://github.com/1weiho/open-slide/pull/299) [`2aa085f`](https://github.com/1weiho/open-slide/commit/2aa085fa5d3fb198c793e6ed4c604c90e31df120) Thanks [@1weiho](https://github.com/1weiho)! - Add search, sorting, usage and file type filters, adjustable grid columns, list view, and asset creation and modification dates to the assets manager.

## 1.13.6

### Patch Changes

- [#292](https://github.com/1weiho/open-slide/pull/292) [`87db8f4`](https://github.com/1weiho/open-slide/commit/87db8f453c5dda12066de786bd1132c7446f01ae) Thanks [@jeremyjordan](https://github.com/jeremyjordan)! - Play a deck's exported `transition` in the read-only build (`showSlideUi: false`) instead of swapping pages instantly.

- [#291](https://github.com/1weiho/open-slide/pull/291) [`0f866d5`](https://github.com/1weiho/open-slide/commit/0f866d54ea58c0ab80a062dbc6922cc96a654b1e) Thanks [@jeremyjordan](https://github.com/jeremyjordan)! - Reveal `<Steps>` one at a time in the read-only build (`showSlideUi: false`) instead of skipping straight to the next slide on Space/Arrow.

## 1.13.5

### Patch Changes

- [#289](https://github.com/1weiho/open-slide/pull/289) [`983743f`](https://github.com/1weiho/open-slide/commit/983743fae3634a35d0aad22514f7efec71694dac) Thanks [@1weiho](https://github.com/1weiho)! - Fix slide content bleeding through the asset loading screen when pages contain revealed steps.

## 1.13.4

### Patch Changes

- [#287](https://github.com/1weiho/open-slide/pull/287) [`c1b89d5`](https://github.com/1weiho/open-slide/commit/c1b89d5c08cf0d3199ec8e5ad810e5e94ca28ee5) Thanks [@1weiho](https://github.com/1weiho)! - Preload every page's images and fonts behind the deck loading screen — slides and presenter views first render with all assets cached, eliminating font flashes and image pop-in during playback.

## 1.13.3

### Patch Changes

- [#284](https://github.com/1weiho/open-slide/pull/284) [`0d4e669`](https://github.com/1weiho/open-slide/commit/0d4e6698aefe043f97c1cf437124dddc18cecabb) Thanks [@1weiho](https://github.com/1weiho)! - Add an all-slides "Slides" view as the default home page, move Draft into the sidebar folders list, and give the mobile home a hamburger menu, folder dropdown, and theme/language toggles.

- [#282](https://github.com/1weiho/open-slide/pull/282) [`1ef7f84`](https://github.com/1weiho/open-slide/commit/1ef7f84f7d435cd61f7c8b4db0853b3ada3739a5) Thanks [@1weiho](https://github.com/1weiho)! - Revert inspector quick activation gestures (Command/Control hold and double-click selection).

## 1.13.2

### Patch Changes

- [#263](https://github.com/1weiho/open-slide/pull/263) [`bda2fd6`](https://github.com/1weiho/open-slide/commit/bda2fd6646814541d6a5623840c4c5396b9b0c5a) Thanks [@1weiho](https://github.com/1weiho)! - Virtualize the horizontal thumbnail rail in large decks.

## 1.13.1

### Patch Changes

- [#260](https://github.com/1weiho/open-slide/pull/260) [`3adaa7c`](https://github.com/1weiho/open-slide/commit/3adaa7c332bac124a3a5fa6ad1c814d275b58858) Thanks [@1weiho](https://github.com/1weiho)! - Keep shared-element borders at their intended width while elements resize.

- [#261](https://github.com/1weiho/open-slide/pull/261) [`5f167f7`](https://github.com/1weiho/open-slide/commit/5f167f7c6f3dcbbf48bf2388238d5d0b11bf1856) Thanks [@1weiho](https://github.com/1weiho)! - Virtualize the editor thumbnail rail for smoother navigation in large decks.

## 1.13.0

### Minor Changes

- [#257](https://github.com/1weiho/open-slide/pull/257) [`e000a81`](https://github.com/1weiho/open-slide/commit/e000a8147ed4e6dd592c856e5530b042263563b4) Thanks [@1weiho](https://github.com/1weiho)! - Add unstable_SharedElement for shared-element transitions across slide pages.

### Patch Changes

- [#256](https://github.com/1weiho/open-slide/pull/256) [`0e61272`](https://github.com/1weiho/open-slide/commit/0e61272daaa40efbf05f489c97dacf28c2b5aeb8) Thanks [@1weiho](https://github.com/1weiho)! - Make present mode easier to use on phones with single-tap playback and compact auto-hiding controls.

- [#247](https://github.com/1weiho/open-slide/pull/247) [`ac33d70`](https://github.com/1weiho/open-slide/commit/ac33d70acf8aa98c6203326b772b1a6b6131ff13) Thanks [@1weiho](https://github.com/1weiho)! - Let the inspector open while holding Command on macOS or Control elsewhere, and select elements by double-clicking them without selecting slide text.

- [#239](https://github.com/1weiho/open-slide/pull/239) [`45f6882`](https://github.com/1weiho/open-slide/commit/45f6882cf5cdcc112aa71fc963f41e5a07cec64f) Thanks [@adawang1210](https://github.com/adawang1210)! - Keep speaker notes aligned with pages when deleting or duplicating a page.

## 1.12.1

### Patch Changes

- [#233](https://github.com/1weiho/open-slide/pull/233) [`0128ba4`](https://github.com/1weiho/open-slide/commit/0128ba43b75a6e9a4760708c20064a8c570db962) Thanks [@1weiho](https://github.com/1weiho)! - Center longer slide UI tooltip messages.

- [#242](https://github.com/1weiho/open-slide/pull/242) [`949bdbf`](https://github.com/1weiho/open-slide/commit/949bdbfd4580eceec0f0710d67561ad6d56754ed) Thanks [@poterpan](https://github.com/poterpan)! - Fix HTML export distorting the slide aspect ratio on narrow viewports.

- [#241](https://github.com/1weiho/open-slide/pull/241) [`3c57091`](https://github.com/1weiho/open-slide/commit/3c5709153e80244545957f8d9ee8039429068eb9) Thanks [@ridemountainpig](https://github.com/ridemountainpig)! - Fix the slide toolbar on narrow screens: keep the title from overlapping the icons, and collapse the copy-link and download actions into a single overflow menu.

- [#244](https://github.com/1weiho/open-slide/pull/244) [`57e2845`](https://github.com/1weiho/open-slide/commit/57e2845b80b4a1f52bd947524fb4eeb5dea06ef8) Thanks [@ridemountainpig](https://github.com/ridemountainpig)! - Block pointer input on frozen slide previews so interactive content no longer hijacks thumbnail and overview clicks.

- [#235](https://github.com/1weiho/open-slide/pull/235) [`ef265e8`](https://github.com/1weiho/open-slide/commit/ef265e8bad56355e52bda6d12d1b6e2676f68f4b) Thanks [@1weiho](https://github.com/1weiho)! - Show transition and step indicators in the slide overview grid.

## 1.12.0

### Minor Changes

- [#211](https://github.com/1weiho/open-slide/pull/211) [`12ee858`](https://github.com/1weiho/open-slide/commit/12ee8587458843c8389344336d93fe07bd99a674) Thanks [@ridemountainpig](https://github.com/ridemountainpig)! - Open the slide overview grid from the pages editor — press O or click the grid button next to the page count. The overlay adopts the editor theme instead of the present-mode black.

### Patch Changes

- [#230](https://github.com/1weiho/open-slide/pull/230) [`75653e1`](https://github.com/1weiho/open-slide/commit/75653e1abed5aed93ec9835fe5eee299ddde24e5) Thanks [@1weiho](https://github.com/1weiho)! - Add a one-click update action that upgrades open-slide and syncs bundled skills from the home sidebar.

- [#219](https://github.com/1weiho/open-slide/pull/219) [`f5a60ad`](https://github.com/1weiho/open-slide/commit/f5a60ade563dd9e80f0ecb02fe696cb8bb70968c) Thanks [@adawang1210](https://github.com/adawang1210)! - Stop force-loading every registered font face before PDF export, which hung or crashed the tab on subsetted CJK webfonts.

- [#216](https://github.com/1weiho/open-slide/pull/216) [`80dda4e`](https://github.com/1weiho/open-slide/commit/80dda4e687242bafd6bf56bfd64a5641e64034d2) Thanks [@poterpan](https://github.com/poterpan)! - Add webfont guidance to the slide-authoring skill: load the stylesheet once in `<head>`, list only the weights used, and subset CJK with `&text=`.

## 1.11.1

### Patch Changes

- [#218](https://github.com/1weiho/open-slide/pull/218) [`ba26721`](https://github.com/1weiho/open-slide/commit/ba267217e4c66e5040123fc27847bc8a82ef82e1) Thanks [@adawang1210](https://github.com/adawang1210)! - Keep the notes textarea focused when Escape is pressed during IME composition.

- [#220](https://github.com/1weiho/open-slide/pull/220) [`336bade`](https://github.com/1weiho/open-slide/commit/336badec7d2384457830c0db0a6c7242a2ea349f) Thanks [@adawang1210](https://github.com/adawang1210)! - Ignore Enter/Escape during IME composition in slide title, slide rename, asset rename, and folder name inputs.

- [#217](https://github.com/1weiho/open-slide/pull/217) [`b8916e3`](https://github.com/1weiho/open-slide/commit/b8916e37a0071ed53bc6d5ef8c5c826f76da6c4c) Thanks [@ridemountainpig](https://github.com/ridemountainpig)! - Fix PPTX export producing a theme that triggers PowerPoint's repair prompt by ensuring the fill style list has the schema-required three entries.

- [#221](https://github.com/1weiho/open-slide/pull/221) [`9052f44`](https://github.com/1weiho/open-slide/commit/9052f4416f9835b0831dfe7aed546b3a74647d7a) Thanks [@adawang1210](https://github.com/adawang1210)! - Remove the touchcancel listener on cleanup in the present-mode swipe handler so listeners no longer accumulate while navigating.

## 1.11.0

### Minor Changes

- [#207](https://github.com/1weiho/open-slide/pull/207) [`cb5ebf4`](https://github.com/1weiho/open-slide/commit/cb5ebf4208149417f072a29764431f091f123efa) Thanks [@ridemountainpig](https://github.com/ridemountainpig)! - Add `base` to `OpenSlideConfig` for hosting under a subpath (e.g. GitHub Pages, Nginx subdirectory). Wires through to Vite's `base` and React Router's `basename`.

- [#203](https://github.com/1weiho/open-slide/pull/203) [`5561b41`](https://github.com/1weiho/open-slide/commit/5561b410f732291c4fedeed63b76eff5ca24d6ef) Thanks [@1weiho](https://github.com/1weiho)! - Add slide-view shortcuts: Space advances, Enter plays in window, P opens presenter mode (F stays fullscreen).

### Patch Changes

- [#209](https://github.com/1weiho/open-slide/pull/209) [`b45389c`](https://github.com/1weiho/open-slide/commit/b45389c62e112adc3a4b5d31a796da1858058e58) Thanks [@1weiho](https://github.com/1weiho)! - Fix homepage thumbnails flashing at full size before scaling down by measuring the fit scale before first paint.

- [#208](https://github.com/1weiho/open-slide/pull/208) [`2cbc7b4`](https://github.com/1weiho/open-slide/commit/2cbc7b408bfa918aa01f1db57162740a5cc91a69) Thanks [@ridemountainpig](https://github.com/ridemountainpig)! - Presenter window now reflects in-slide `<Steps>` state: Now Showing mirrors the projection's revealed count, and Up Next previews the next step until the current slide's steps are exhausted before rolling over to the next slide.

- [#197](https://github.com/1weiho/open-slide/pull/197) [`27230b3`](https://github.com/1weiho/open-slide/commit/27230b3213d53a6606d9c7d4d83d2c531f9aba44) Thanks [@mvanhorn](https://github.com/mvanhorn)! - Preserve raster backgrounds in PDF exports while stripping gradient layers.

## 1.10.0

### Minor Changes

- [#164](https://github.com/1weiho/open-slide/pull/164) [`411a8c7`](https://github.com/1weiho/open-slide/commit/411a8c743e94e6703ab4d535529c853822179b3e) Thanks [@1weiho](https://github.com/1weiho)! - Add `Steps` / `Step` primitive for revealing page elements one-by-one via next/previous inputs.

## 1.9.0

### Minor Changes

- [#188](https://github.com/1weiho/open-slide/pull/188) [`0d78b73`](https://github.com/1weiho/open-slide/commit/0d78b73549d6804d39263617bdcb8cd9ad3483f2) Thanks [@1weiho](https://github.com/1weiho)! - Add an "Export as image PPTX" download option that renders each slide to an image via html-to-image and stitches them into a one-page-per-slide PPTX, plus a coming-soon "Export as PPTX" entry for the editable format.

- [#196](https://github.com/1weiho/open-slide/pull/196) [`0c99cf6`](https://github.com/1weiho/open-slide/commit/0c99cf60aa094c3bc3cd6d242ceba110742c9856) Thanks [@1weiho](https://github.com/1weiho)! - Show the open-slide version at the bottom of the home sidebar, with a hover hint to update when a newer release is available.

- [#189](https://github.com/1weiho/open-slide/pull/189) [`6ae2dd9`](https://github.com/1weiho/open-slide/commit/6ae2dd9b188032d0b21bf43a7e3ab549b98db282) Thanks [@1weiho](https://github.com/1weiho)! - Add an in-UI language switcher (next to the theme toggle) that remembers the choice locally; deprecate `config.locale` and drop the `init` language prompt and `--locale` flag.

### Patch Changes

- [#180](https://github.com/1weiho/open-slide/pull/180) [`9b8202e`](https://github.com/1weiho/open-slide/commit/9b8202e8b17abc85caf5cd5a62c59e277a4f91ef) Thanks [@1weiho](https://github.com/1weiho)! - Remove duplicated internal helpers (HTTP `readBody`/`json`, slide-path resolution, the `SLIDE_ID_RE` pattern, and locale `format`/`plural`) by routing them through a single source.

## 1.8.0

### Minor Changes

- [#165](https://github.com/1weiho/open-slide/pull/165) [`b6dfc99`](https://github.com/1weiho/open-slide/commit/b6dfc9954a5aa320aeb0475b49de0734a8755197) Thanks [@1weiho](https://github.com/1weiho)! - Drag folders in the sidebar to reorder them.

### Patch Changes

- [#174](https://github.com/1weiho/open-slide/pull/174) [`2b70cb4`](https://github.com/1weiho/open-slide/commit/2b70cb4f6e913365ca63caed5a5d6749cdf96a77) Thanks [@1weiho](https://github.com/1weiho)! - Stop marking imported assets as unused when they are passed as props to wrapper components (e.g. `<DiagramImage src={img} />`) instead of consumed directly by `<img src={img}>`.

- [#160](https://github.com/1weiho/open-slide/pull/160) [`608ce61`](https://github.com/1weiho/open-slide/commit/608ce6134e8019a9c5e28c68b8f7458f41c0bb50) Thanks [@1weiho](https://github.com/1weiho)! - Fix invalid YAML in the create-theme skill frontmatter so it loads correctly.

- [#179](https://github.com/1weiho/open-slide/pull/179) [`ea67658`](https://github.com/1weiho/open-slide/commit/ea67658061889f5e257af87b6f9e39953d92c153) Thanks [@1weiho](https://github.com/1weiho)! - Click-to-navigate no longer covers the slide in present mode or the mobile viewer — embedded videos, links, and other interactive content near the left/right edges stay clickable, and a stray outline no longer flashes on click.

- [#172](https://github.com/1weiho/open-slide/pull/172) [`155049f`](https://github.com/1weiho/open-slide/commit/155049f30b6de64bc704eb9eee4eebea0bb76f44) Thanks [@why39](https://github.com/why39)! - Fix Inspect overlay on Windows: normalize path separators and strip HMR query/hash when matching slide source files.

- [#175](https://github.com/1weiho/open-slide/pull/175) [`5e65d64`](https://github.com/1weiho/open-slide/commit/5e65d6438b10f8c9ff7ea23445eac05dd4ac692d) Thanks [@ridemountainpig](https://github.com/ridemountainpig)! - Fix sidebar Draft/Themes/Assets rows not switching when clicking the icon — the whole icon area is now part of the select target. Also close the inspector comment panel when clicking outside it.

- [#176](https://github.com/1weiho/open-slide/pull/176) [`c6cb866`](https://github.com/1weiho/open-slide/commit/c6cb8667fa0a0ffe1e661bdc34a4cd9c0bef7157) Thanks [@1weiho](https://github.com/1weiho)! - Edit a slide title by clicking it directly — hovering shows an outline, the title becomes an input on click, and the title is centered to the viewport. Replaces the pencil icon.

## 1.7.0

### Minor Changes

- [#153](https://github.com/1weiho/open-slide/pull/153) [`7952a06`](https://github.com/1weiho/open-slide/commit/7952a06a518a5b444e7df34307aef13324e36518) Thanks [@ridemountainpig](https://github.com/ridemountainpig)! - Add I and D shortcuts for the inspector and design panel, show a dashed hover frame alongside the inspector selection, and polish the inspector header and save bar.

- [#148](https://github.com/1weiho/open-slide/pull/148) [`78333bc`](https://github.com/1weiho/open-slide/commit/78333bcd7156e511ad2c84a0800f084705c44536) Thanks [@1weiho](https://github.com/1weiho)! - Show a floating action panel below the inspector selection box when an image is selected, with quick-access Replace and Crop icons.

- [#149](https://github.com/1weiho/open-slide/pull/149) [`26f6cb1`](https://github.com/1weiho/open-slide/commit/26f6cb13cdc1c738d41bd5bab90940b38562e828) Thanks [@1weiho](https://github.com/1weiho)! - Add SlideTransition API for declaring per-page page-transition animations, plus a transitions section in the bundled slide-authoring skill with tasteful few-shot examples.

### Patch Changes

- [#154](https://github.com/1weiho/open-slide/pull/154) [`51108f1`](https://github.com/1weiho/open-slide/commit/51108f1547942c2fb1cf6d18c62e8c449b5be587) Thanks [@ridemountainpig](https://github.com/ridemountainpig)! - Truncate long slide titles in the editor header instead of letting them overlap the right-side controls.

## 1.6.0

### Minor Changes

- [#144](https://github.com/1weiho/open-slide/pull/144) [`68bfb3e`](https://github.com/1weiho/open-slide/commit/68bfb3e890cb9f66433004dda1ec8c01876865d8) Thanks [@1weiho](https://github.com/1weiho)! - Flag unused files in the assets manager with an "Unused" pill so they're easy to spot.

- [#141](https://github.com/1weiho/open-slide/pull/141) [`9d24d18`](https://github.com/1weiho/open-slide/commit/9d24d1875a8e3c368822a4eeda59d8040c51ba7d) Thanks [@mvanhorn](https://github.com/mvanhorn)! - Add a Duplicate action to slide cards so you can use a deck as a template without destroying it.

- [#137](https://github.com/1weiho/open-slide/pull/137) [`f5b9a31`](https://github.com/1weiho/open-slide/commit/f5b9a3168452e9e95595fbb96f3d843a8cd0d4f8) Thanks [@1weiho](https://github.com/1weiho)! - Add `useSlidePageNumber()` hook so slide pages can render their own page number without hardcoding.

### Patch Changes

- [#142](https://github.com/1weiho/open-slide/pull/142) [`f1fa6b9`](https://github.com/1weiho/open-slide/commit/f1fa6b91bb7fa47f88bd78a9abead2a89c814bb6) Thanks [@mvanhorn](https://github.com/mvanhorn)! - Inspector now selects elements inside multi-file slide structures (e.g. slides composed of shared.tsx + 01-Cover.tsx).

- [#145](https://github.com/1weiho/open-slide/pull/145) [`12b2853`](https://github.com/1weiho/open-slide/commit/12b285337eab22e5f58640a8826975fbcdcc9b45) Thanks [@1weiho](https://github.com/1weiho)! - Strip box-shadows and CSS gradients during PDF export so macOS Preview pages through the file at full speed.

- [#118](https://github.com/1weiho/open-slide/pull/118) [`c768bbd`](https://github.com/1weiho/open-slide/commit/c768bbd8625f60a9af0343d2b13a6690023b0c03) Thanks [@samzzi](https://github.com/samzzi)! - Skip wheel-based page navigation while the visual viewport is pinch-zoomed, so panning a zoomed slide no longer jumps to the next or previous page.

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
