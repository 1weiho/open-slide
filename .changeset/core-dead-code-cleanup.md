---
"@open-slide/core": patch
---

Remove dead code from the runtime: unused theme tokens and the `.hairline` rule from the shipped stylesheet, seven unused locale keys, unreferenced context values and hook returns, and unreachable branches in the editing engine. `shadcn` moves to a devDependency so it no longer installs with the package.
