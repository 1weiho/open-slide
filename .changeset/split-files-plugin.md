---
'@open-slide/core': patch
---

Split the files Vite plugin into focused modules: slide source-editing (`slide-ops.ts`), asset validation and path resolution (`assets.ts`), folders manifest and validators (`folders.ts`). Move its `/__slides`, `/__assets`, `/__svgl`, `/__folders` middlewares plus asset/folder watchers into the unified `api-plugin.ts`.
