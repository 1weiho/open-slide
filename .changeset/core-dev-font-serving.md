---
"@open-slide/core": patch
---

Serve the runtime's bundled webfont in dev. Vite's file-serving guard only allowed the app root and the user's project, so under pnpm or in a workspace the Geist font resolved outside both and was refused.
