---
'@open-slide/core': patch
---

Fix dev-time slide imports on Windows by emitting `/@fs/` with a leading slash before the absolute path.
