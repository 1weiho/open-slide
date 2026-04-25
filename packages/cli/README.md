# @open-slide/cli

Scaffold a workspace for [open-slide](https://github.com/1weiho/open-slide) — a React-based slide framework with Claude Code skills preconfigured.

## Usage

```bash
npx @open-slide/cli init my-slide
cd my-slide
pnpm install
pnpm dev
```

This creates a workspace containing:

- `slides/getting-started/` — a starter slide you can edit or delete.
- `package.json` — depends on `@open-slide/core`, which provides the runtime (home page, slide viewer, fullscreen mode) and the `open-slide` CLI.
- `open-slide.config.ts` — optional typed config (slidesDir, port).
- `.claude/skills/` and `.agents/skills/` — Claude Code skills (`create-slide`, `apply-comments`, …).
- `CLAUDE.md` — agent guide for authoring slides.

You won't see any Vite, React, or tsconfig files in the workspace. They live inside `@open-slide/core` and you never touch them.

## Commands

| Command | Description |
| --- | --- |
| `open-slide init [dir]` | Scaffold a new workspace in `dir` (defaults to current dir). |
| `open-slide init --force` | Scaffold into a non-empty directory. |
| `open-slide init --name <name>` | Override the generated `package.json` name. |

(Once installed in the workspace, `@open-slide/core` provides `open-slide dev`, `open-slide build`, and `open-slide preview` via its own bin.)

## Authoring

Inside the scaffolded workspace, slides live under `slides/<kebab-case-id>/index.tsx` and default-export an array of `Page` components. Each page renders into a fixed 1920×1080 canvas; the framework handles scaling.

Ask Claude Code to "make slides about X" and the `create-slide` skill will take it from there.
