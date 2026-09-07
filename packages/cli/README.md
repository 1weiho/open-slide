# @open-slide/cli

Scaffold a React or Svelte workspace for [open-slide](https://github.com/1weiho/open-slide).

## Usage

```bash
npx @open-slide/cli init my-slide
npx @open-slide/cli init my-svelte-slide --framework svelte
cd my-slide
pnpm install
pnpm dev
```

This creates a workspace containing:

- `slides/getting-started/` — a starter slide you can edit or delete.
- `package.json` — depends on the selected `@open-slide/react` or `@open-slide/svelte` runtime.
- `open-slide.config.ts` — optional typed config (slidesDir, port).
- React workspaces include `.claude/skills/`, `.agents/skills/`, and the existing agent authoring guide.
- Svelte workspaces include a Svelte-specific `AGENTS.md` and component-per-page starter deck.

The selected runtime owns the Vite application shell. Your workspace contains only deck components, assets, config, and framework dependencies.

## Commands

| Command | Description |
| --- | --- |
| `open-slide init [dir]` | Scaffold a new workspace in `dir` (defaults to current dir). |
| `open-slide init --force` | Scaffold into a non-empty directory. |
| `open-slide init --name <name>` | Override the generated `package.json` name. |
| `open-slide init --framework svelte` | Scaffold the native Svelte runtime instead of the default React runtime. |

(Once installed, the selected runtime provides `open-slide dev`, `open-slide build`, and `open-slide preview`.)

## Authoring

React decks live at `slides/<kebab-case-id>/index.tsx`. Svelte decks use `index.ts` plus `.svelte` page components. Both default-export an ordered array of pages rendered on a fixed 1920×1080 canvas.

The existing `create-slide` skill remains available in React workspaces. Svelte workspaces expose the same file convention directly for any coding agent.
