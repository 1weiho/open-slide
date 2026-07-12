---
"@open-slide/core": patch
---

Declare `use-sync-external-store` as a direct dependency so Vite can resolve and pre-bundle the Base UI shim under pnpm, fixing the missing `useSyncExternalStore` export at runtime.
