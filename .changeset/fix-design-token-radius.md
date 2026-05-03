---
"@open-slide/core": patch
"@open-slide/cli": patch
---

Add the required `radius` field to the `slide-authoring` skill's starter template. Without it, slides scaffolded from the template fail TypeScript because `DesignSystem` requires `radius: number`.
