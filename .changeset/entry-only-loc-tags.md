---
"@open-slide/core": patch
---

Only tag the deck's `index.tsx` for inspector edits, so clicking JSX imported from a sibling file no longer writes to the wrong place in the entry file.
