---
"@open-slide/core": minor
---

Add `open-slide export` CLI subcommand for headless PNG export. `playwright-chromium` is a devDependency only, so end-user installs are unaffected; the subcommand preflights for it and prints copy-pasteable install instructions when absent.
