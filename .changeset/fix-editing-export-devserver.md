---
"@open-slide/core": patch
"@open-slide/cli": patch
---

Fix editing/export correctness and harden the dev server:

- Edit meta.title via a Babel AST walk so a non-string title value no longer produces a duplicate `title` key.
- Reject overlapping/nested splices in applyEdit/applyRevertAsset, and reuse a single import per asset path within an edit.
- Prevent prototype pollution in the design merge (`PUT /__design`).
- Fix Windows note-edit focus loss (Vite-normalized HMR path) and a hung asset upload on oversized/aborted bodies; bound the note index.
- Serialize and atomically write the folders manifest.
- Export full-bleed slides as a picture shape sized to the exact slide extents for reliable, undistorted Google Slides import.
- Count emoji icon length by grapheme, and count only renderable pages for export progress.
- CLI: always materialize `CLAUDE.md` from `AGENTS.md` so a Windows checkout no longer scaffolds a placeholder file.
