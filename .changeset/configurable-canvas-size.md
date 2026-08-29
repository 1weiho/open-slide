---
"@open-slide/core": minor
"@open-slide/cli": patch
---

Add `canvas` to `open-slide.config.ts` so a workspace can author at a size other than 1920×1080. Takes a preset (`'16:9'`, `'4:3'`, `'4:5'`, `'1:1'`, `'9:16'`) or explicit `{ width, height }`, and flows through the viewer, thumbnails, presenter, and the PDF, HTML, and PPTX exports. Defaults to `'16:9'`, so existing decks are unaffected.
