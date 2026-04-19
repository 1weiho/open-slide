# open-slide

Write slide decks as React components. The framework handles layout, scaling, navigation, and fullscreen play mode — you just write the slides.

Every deck renders into a fixed **1920 × 1080** canvas and gets a thumbnail rail, keyboard navigation, hot reload, and a fullscreen presenter mode for free.

## Quick start

```bash
npx @open-slide/cli init my-deck
cd my-deck
pnpm install
pnpm dev
```

Then edit `slides/<id>/index.tsx`:

```tsx
import type { DeckMeta, SlidePage } from '@open-slide/core';

const Cover: SlidePage = () => (
  <div style={{ width: '100%', height: '100%' }}>Hello</div>
);

export const meta: DeckMeta = { title: 'My deck' };
export default [Cover] satisfies SlidePage[];
```

See [CLAUDE.md](CLAUDE.md) for the full authoring guide.

## Claude Code integration

The scaffolded workspace ships with Claude Code skills preconfigured. Ask Claude Code to "make a slide deck about X" and the `create-slide` skill takes over. The `apply-comments` skill lets you iterate via inspector-style markers inside your deck source.

## Repo layout

This repo is a pnpm + Turbo monorepo.

| Path | Description |
| --- | --- |
| [packages/core](packages/core) | `@open-slide/core` — runtime (home page, deck viewer, fullscreen mode), Vite plugin, and the `open-slide` dev/build/preview CLI. |
| [packages/cli](packages/cli) | `@open-slide/cli` — `npx @open-slide/cli init` scaffolder. Generates a minimal workspace where Vite/React/tsconfig stay hidden inside core. |
| [apps/playground](apps/playground) | Example workspace that consumes `@open-slide/core` via `workspace:*`. Used for local development of the framework. |

## Development

```bash
pnpm install
pnpm dev      # runs the playground against the local @open-slide/core
pnpm build    # builds all packages
pnpm check    # type-checks all packages
pnpm lint     # lints via biome
```

## License

MIT
