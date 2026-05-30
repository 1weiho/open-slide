---
"@open-slide/core": patch
"@open-slide/cli": patch
---

Remove duplicated internal helpers (HTTP `readBody`/`json`, slide-path resolution, the `SLIDE_ID_RE` pattern, and locale `format`/`plural`) by routing them through a single source.
