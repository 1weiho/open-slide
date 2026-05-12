# @open-slide/cli

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
