---
'@open-slide/core': patch
---

Skip slide folders whose id isn't ASCII-safe (e.g. CJK folder names) instead of listing slides that then fail to move into folders or be edited; warn once per ignored folder.
