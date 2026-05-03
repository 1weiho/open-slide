---
"@open-slide/cli": patch
---

Add `vite` to the scaffolded template's `devDependencies` so projects created via `open-slide init` are auto-detected as Vite projects on Vercel. Vercel's framework detector regex-matches `"vite"` in `package.json` dependencies, and previously the template only declared `@open-slide/core`, leaving vite transitive and undetected. The existing `build` script (`open-slide build`) and `dist` output directory already match Vercel's Vite preset defaults.
