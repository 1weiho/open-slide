---
"@open-slide/core": patch
"@open-slide/cli": patch
---

Flatten `DesignSystem.radius` from `{ md: number }` to a plain `number`. The Design panel only exposes one global Radius slider and there is no planned `sm` / `lg` scale, so the wrapping object was dead structure. The CSS variable is renamed `--osd-radius-md` → `--osd-radius`, the `DesignRadius` type is removed, and the `slide-authoring` skill plus all bundled slides are updated to match.
