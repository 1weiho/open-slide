---
"@open-slide/core": patch
---

Inspector text edits now descend into wrapper elements and disambiguate sibling text leaves via the pre-edit DOM value, so edits land on slides that wrap text in nested elements or component children.
