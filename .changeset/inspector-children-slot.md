---
"@open-slide/core": patch
---

Inspector text edits now fall through to the call sites of a wrapper component when the clicked element only renders `{children}`, so editing text inside small layout components like `<Eyebrow>` lands on the consumer instead of failing with "no editable text".
