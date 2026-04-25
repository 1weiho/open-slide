<img width="2172" height="724" alt="open-slide github cover" src="https://github.com/user-attachments/assets/9c063932-f3b6-45bb-9a74-06dc5fc49c5e" />

# open-slide

A slide framework built for agents. You describe the deck in natural language; the agent authors the pages. The framework handles layout, scaling, navigation, hot reload, and fullscreen play mode so the agent can focus on content.

Every slide renders into a fixed **1920 × 1080** canvas with a thumbnail rail, keyboard navigation, and a fullscreen presenter mode out of the box.

## Quick start

```bash
npx @open-slide/cli init my-slide
cd my-slide
pnpm dev
```

The scaffolded workspace ships with agent skills preconfigured for Claude Code. From here you drive the deck through your agent.

## Working with the agent

Two skills cover the full authoring loop:

### `/create-slide` — drafting a new deck

Ask the agent to "make slides about X". The skill takes over and:

1. Asks four scoping questions up front — topic & aesthetic, page count, text density per page, and motion vs. static — so the visual direction is locked in before any code is written.
2. Picks a kebab-case slide id and plans the page structure.
3. Writes everything under `slides/<id>/` following the canvas, type scale, and palette rules in the `/slide-authoring` reference.

You review the result in the dev server and iterate.

### `/apply-comments` — iterating via inspector markers

The dev server has an inspector tool: click any element on a rendered page and attach a comment like *"make this red"* or *"change to 'Open Slide Rocks'"*. Each comment is persisted as an in-source `@slide-comment` marker above the JSX it refers to.

When you're ready, run the `/apply-comments` command. The skill reads every pending marker, performs the edits, and removes the markers — so the loop is: present → click to comment → run `/apply-comments` → repeat.

### Manual edits

For tweaks you'd rather make yourself, slides are just files under `slides/<id>/`. See [CLAUDE.md](CLAUDE.md) for the hard rules and the `slide-authoring` skill for the full technical reference.

## Repo layout

This repo is a pnpm + Turbo monorepo.

| Path | Description |
| --- | --- |
| [packages/core](packages/core) | `@open-slide/core` — runtime (home page, slide viewer, fullscreen mode), Vite plugin, and the `open-slide` dev/build/preview CLI. |
| [packages/cli](packages/cli) | `@open-slide/cli` — `npx @open-slide/cli init` scaffolder. Generates a minimal workspace where Vite/React/tsconfig stay hidden inside core. |
| [apps/demo](apps/demo) | Example workspace that consumes `@open-slide/core` via `workspace:*`. Used for local development of the framework. |

## Development

```bash
pnpm install
pnpm dev      # runs the demo against the local @open-slide/core
pnpm build    # builds all packages
pnpm check    # type-checks all packages
pnpm lint     # lints via biome
```

## License

MIT
