# @open-slide/cli

## 1.3.2

### Patch Changes

- [#216](https://github.com/1weiho/open-slide/pull/216) [`80dda4e`](https://github.com/1weiho/open-slide/commit/80dda4e687242bafd6bf56bfd64a5641e64034d2) Thanks [@poterpan](https://github.com/poterpan)! - Add webfont guidance to the slide-authoring skill: load the stylesheet once in `<head>`, list only the weights used, and subset CJK with `&text=`.

## 1.3.1

### Patch Changes

- [#201](https://github.com/1weiho/open-slide/pull/201) [`9ff819f`](https://github.com/1weiho/open-slide/commit/9ff819fe84218ffe4b22d7df1600dc6601836e1e) Thanks [@1weiho](https://github.com/1weiho)! - Update bundled skills with the `<Steps>` / `<Step>` stepped-reveal authoring guidance.

## 1.3.0

### Minor Changes

- [#189](https://github.com/1weiho/open-slide/pull/189) [`6ae2dd9`](https://github.com/1weiho/open-slide/commit/6ae2dd9b188032d0b21bf43a7e3ab549b98db282) Thanks [@1weiho](https://github.com/1weiho)! - Add an in-UI language switcher (next to the theme toggle) that remembers the choice locally; deprecate `config.locale` and drop the `init` language prompt and `--locale` flag.

### Patch Changes

- [#180](https://github.com/1weiho/open-slide/pull/180) [`9b8202e`](https://github.com/1weiho/open-slide/commit/9b8202e8b17abc85caf5cd5a62c59e277a4f91ef) Thanks [@1weiho](https://github.com/1weiho)! - Remove duplicated internal helpers (HTTP `readBody`/`json`, slide-path resolution, the `SLIDE_ID_RE` pattern, and locale `format`/`plural`) by routing them through a single source.

## 1.2.6

### Patch Changes

- [#181](https://github.com/1weiho/open-slide/pull/181) [`fb1db62`](https://github.com/1weiho/open-slide/commit/fb1db6207c07e84933589f02bf0eb1fa9bc8c3d1) Thanks [@1weiho](https://github.com/1weiho)! - Re-sync scaffolded skills with core so a fresh project no longer reports skills out of date on first dev run.

## 1.2.5

### Patch Changes

- [#152](https://github.com/1weiho/open-slide/pull/152) [`30cec7f`](https://github.com/1weiho/open-slide/commit/30cec7f94b76fea9e0f92357328dcbaccdc25e44) Thanks [@itskylechung](https://github.com/itskylechung)! - Sanitize `init` target directory names and suggest a safe equivalent for shell-unfriendly input.

- [#151](https://github.com/1weiho/open-slide/pull/151) [`75667fa`](https://github.com/1weiho/open-slide/commit/75667fa9968a8956a7a703f4ab8a977c87ee1db4) Thanks [@1weiho](https://github.com/1weiho)! - Add `.DS_Store` to the scaffolded `.gitignore`.

- [#149](https://github.com/1weiho/open-slide/pull/149) [`26f6cb1`](https://github.com/1weiho/open-slide/commit/26f6cb13cdc1c738d41bd5bab90940b38562e828) Thanks [@1weiho](https://github.com/1weiho)! - Add SlideTransition API for declaring per-page page-transition animations, plus a transitions section in the bundled slide-authoring skill with tasteful few-shot examples.

## 1.2.4

### Patch Changes

- [#147](https://github.com/1weiho/open-slide/pull/147) [`ce3afe6`](https://github.com/1weiho/open-slide/commit/ce3afe676355fb38fc8b7b24de58cc5bdca62019) Thanks [@1weiho](https://github.com/1weiho)! - Pin scaffolded `@open-slide/core` to the core version bundled at CLI build time instead of the CLI's own version.

## 1.2.3

### Patch Changes

- [#131](https://github.com/1weiho/open-slide/pull/131) [`377b5ba`](https://github.com/1weiho/open-slide/commit/377b5bafef39e15f1e48b65b88cbc282b8c33731) Thanks [@1weiho](https://github.com/1weiho)! - Trim verbose follow-up text from `init` next-steps output.

## 1.2.2

### Patch Changes

- [#120](https://github.com/1weiho/open-slide/pull/120) [`d6f1551`](https://github.com/1weiho/open-slide/commit/d6f1551e1270e424825da7581d57690e536ed450) Thanks [@1weiho](https://github.com/1weiho)! - Drop the README from the scaffolded `assets/` folder so a fresh project's assets manager opens empty instead of showing a stray file.

## 1.2.1

### Patch Changes

- [#114](https://github.com/1weiho/open-slide/pull/114) [`21bb307`](https://github.com/1weiho/open-slide/commit/21bb307db4369b9d40d6fc239c740c85b984bbe3) Thanks [@1weiho](https://github.com/1weiho)! - Scaffold an empty `assets/` folder for cross-deck reusable assets like logos and avatars.

## 1.2.0

### Minor Changes

- [#100](https://github.com/1weiho/open-slide/pull/100) [`8b2e59b`](https://github.com/1weiho/open-slide/commit/8b2e59b0c55a46afd0e7665c047c03a2c4f996c1) Thanks [@1weiho](https://github.com/1weiho)! - Prompt for the package manager during `init` when no `--use-*` flag is passed, defaulting to the detected one.

### Patch Changes

- [#102](https://github.com/1weiho/open-slide/pull/102) [`fa21143`](https://github.com/1weiho/open-slide/commit/fa211431a43e847bf9fe9272b81fb202a4c978ec) Thanks [@1weiho](https://github.com/1weiho)! - Add `homepage`, `bugs`, and `author` fields to the published package metadata so npm shows links to the site, repo issues, and author.

## 1.1.1

### Patch Changes

- [#87](https://github.com/1weiho/open-slide/pull/87) [`f031771`](https://github.com/1weiho/open-slide/commit/f0317712b9fa084300b82f17c0e39328dc448f77) Thanks [@1weiho](https://github.com/1weiho)! - Tell the `current-slide` skill to re-read `current.json` on every deictic turn, so follow-up edits don't keep targeting the slide the user just navigated away from.

## 1.1.0

### Minor Changes

- [#62](https://github.com/1weiho/open-slide/pull/62) [`ca1c99f`](https://github.com/1weiho/open-slide/commit/ca1c99f4fb532c2002da57e3815bfb173f33b6af) Thanks [@1weiho](https://github.com/1weiho)! - Prompt for slide UI language during `init` and write the chosen locale into `open-slide.config.ts`. Also adds `--locale <en|zh-TW|zh-CN|ja>`.

### Patch Changes

- [#64](https://github.com/1weiho/open-slide/pull/64) [`a65a51e`](https://github.com/1weiho/open-slide/commit/a65a51ec310c947706fe98f13782f2bce639b7dd) Thanks [@1weiho](https://github.com/1weiho)! - Align presenter window to design-system tokens and dark-mode palette.

## 1.0.4

### Patch Changes

- 05fb7ca: Make the `create-slide` skill propose aesthetic options tailored to the deck's topic instead of a fixed preset list. Step 2 now requires gathering the topic first and brainstorming three concrete, distinct visual directions for that topic (vibe + palette/typography/motif), so users can actually picture each choice.
- 2f84f47: Add `vite` to the scaffolded template's `devDependencies` so projects created via `open-slide init` are auto-detected as Vite projects on Vercel. Vercel's framework detector regex-matches `"vite"` in `package.json` dependencies, and previously the template only declared `@open-slide/core`, leaving vite transitive and undetected. The existing `build` script (`open-slide build`) and `dist` output directory already match Vercel's Vite preset defaults.

## 1.0.3

### Patch Changes

- 802fd51: Add the required `radius` field to the `slide-authoring` skill's starter template. Without it, slides scaffolded from the template fail TypeScript because `DesignSystem` requires `radius: number`.

## 1.0.2

### Patch Changes

- 39780b1: Flatten `DesignSystem.radius` from `{ md: number }` to `number`. CSS var renamed `--osd-radius-md` → `--osd-radius`; `DesignRadius` type removed.

## 1.0.1

### Patch Changes

- 8333608: `create-slide` and `slide-authoring` skills now default new slides to a top-level `export const design: DesignSystem = { … }` consumed via `var(--osd-X)`, so a freshly generated slide is tweakable from the Design panel without extra prompting. The local `palette` constants pattern remains as the explicit fallback for one-off slides whose palette is intentionally locked. The starter template and self-review checklist are updated to match.
