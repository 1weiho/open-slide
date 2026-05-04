# @open-slide/core

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
