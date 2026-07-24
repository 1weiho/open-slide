---
'@open-slide/core': patch
---

Store Vite's optimize-deps cache at the project root and clear it on in-app update, so upgrading no longer leaves the dev server failing on missing `.vite/deps` chunks.
