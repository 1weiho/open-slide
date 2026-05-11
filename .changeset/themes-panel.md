---
'@open-slide/core': minor
---

Add a Themes panel to the dev UI. Themes under `themes/<id>.md` get their own `/themes` gallery and `/themes/:id` detail page, with a live preview rendered from a paired `themes/<id>.demo.tsx` slide module. Slides can declare a `theme` in `SlideMeta` to back-link to the theme they were built from, and each theme page lists every slide using it. The `/create-theme` skill writes both files so every new theme has an instant preview.
