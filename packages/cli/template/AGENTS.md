# open-slide — Agent Guide

You are authoring **slides** in this repo. Every slide is arbitrary React code that you write.

## Hard rules

- Put your slide under `slides/<kebab-case-id>/`.
- The entry is `slides/<id>/index.tsx`.
- Put images/videos/fonts under `slides/<id>/assets/`.
- Do **not** touch `package.json`, `open-slide.config.ts`, or other slides.
- Do not add dependencies. Use only `react` and standard web APIs.

## Single skill: `openslide`

One skill handles everything — Docker, authoring, comments, themes, export:

- **Creating/editing slides** — the skill has the full technical reference: 1920×1080 canvas, type scale, palette, layout, assets, anti-patterns
- **Applying inspector comments** (`@slide-comment` markers) — regex, base64 decode, edit procedure
- **Docker management** — container lifecycle, volume mounts, URL routing, troubleshooting
- **Themes** — palette extraction, theme files in `themes/<id>.md`
- **Export** — static HTML build, PDF

Use `/openslide` for any slide-related task. Read the skill before writing or modifying any file under `slides/<id>/`.

## Running with Docker

```bash
docker compose up -d          # start
docker compose down            # stop
docker compose down && docker compose up -d  # restart after new slide folder
```

Slides: `http://localhost:5173/s/<slide-id>`
