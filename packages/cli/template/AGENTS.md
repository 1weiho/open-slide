# open-slide — Agent Guide

You are authoring **slides** in this repo. Every slide is arbitrary React code that you write.

## Hard rules

- Put your slide under `slides/<kebab-case-id>/`.
- The entry is `slides/<id>/index.tsx`.
- Put images/videos/fonts under `slides/<id>/assets/`.
- Do **not** touch `package.json`, `open-slide.config.ts`, or other slides.
- Do not add dependencies. Use only `react` and standard web APIs.

## Which skill to use

- **Drafting a new deck** — use the `create-slide` skill. It walks through scoping questions, structure, and hand-off.
- **Applying inspector comments** (`@slide-comment` markers in a page) — use the `apply-comments` skill.
- **Creating or extracting a theme** — use the `create-theme` skill. Themes live as markdown under `themes/<id>.md` and are read by `create-slide` before authoring.
- **Any other slide edit** — read the `slide-authoring` skill before writing. It is the technical reference for everything inside `slides/<id>/`: file contract, the 1920×1080 canvas, type scale, palette, layout, assets, self-review checklist, and anti-patterns. `create-slide` and `apply-comments` both defer to it for the *how*.

Keep this file short: hard rules only. All deeper guidance lives in the skills above.

## Updating skills

The skills above are managed by `@open-slide/core`. Do not edit them in place. To pull the latest versions:

```
pnpm up @open-slide/core
pnpm sync:skills
```

`pnpm dev` will also detect drift on startup and offer to sync. `pnpm sync:skills --dry-run` (via `pnpm exec open-slide sync:skills --dry-run`) previews changes without writing.
