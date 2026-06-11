---
'@open-slide/core': patch
---

Remove the touchcancel listener on cleanup in the present-mode swipe handler so listeners no longer accumulate while navigating.
