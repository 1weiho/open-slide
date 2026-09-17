---
"@open-slide/core": patch
---

Fix `/__comments/:id` deleting the marker's entire physical line instead of just the `@slide-comment` token. A marker is spliced in with a leading newline but no trailing one, so it can share a line with real content that immediately follows it (e.g. `{/* @slide-comment ... */}{children}</div>`); deleting the whole line took that content with it. The route now removes only the marker text, dropping the line itself only when nothing but the marker remained on it. The bundled `apply-comments` skill is updated to match: it now instructs agents to remove the exact marker token rather than the whole line.
