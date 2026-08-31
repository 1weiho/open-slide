---
"@open-slide/core": patch
---

Clean up the runtime: drop unused theme tokens, locale keys, and dead code, consolidate duplicated internal helpers, serve the bundled Geist webfont in dev when the package resolves outside the project directory, and write a valid `DesignSystem` import when saving a design to a slide whose `@open-slide/core` import is type-only.
