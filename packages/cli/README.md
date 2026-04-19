# open-slide

Scaffold a deck workspace for [open-slide](https://github.com/1weiho/open-slide) — a React-based slide framework with Claude Code skills preconfigured.

## Usage

```bash
npx @open-slide/cli init my-deck
cd my-deck
pnpm install
pnpm dev
```

This creates a workspace containing:

- `src/` — the open-slide runtime (home page, deck viewer, fullscreen mode).
- `slides/example-slide/` — a starter deck you can edit or delete.
- `.claude/skills/` and `.agents/skills/` — Claude Code skills (`create-slide`, `apply-comments`, …).
- `CLAUDE.md` — agent guide for authoring decks.
- `vite.config.ts`, `tsconfig.json`, `package.json`, etc.

## Commands

| Command | Description |
| --- | --- |
| `open-slide init [dir]` | Scaffold a new workspace in `dir` (defaults to current dir). |
| `open-slide init --force` | Scaffold into a non-empty directory. |
| `open-slide init --name <name>` | Override the generated `package.json` name. |

## Authoring a deck

Inside the scaffolded workspace, decks live under `slides/<kebab-case-id>/index.tsx` and default-export an array of `SlidePage` components. Each slide renders into a fixed 1920×1080 canvas; the framework handles scaling.

Ask Claude Code to "make a slide deck about X" and the `create-slide` skill will take it from there.
