# open-slide — Framework Repo Guide

You are working on the **open-slide framework** — the runtime, CLI, and tooling that ship to npm.

(Slide-authoring guidance lives in the `slide-authoring` / `create-slide` skills under `apps/demo/.claude/skills/`. Use those only when editing files inside `apps/demo/slides/`.)

## Layout

pnpm + Turbo monorepo.

| Path | Package | Role |
| --- | --- | --- |
| `packages/core` | `@open-slide/core` | Compatibility package that automatically routes existing installations to the React runtime. |
| `packages/shared` | `@open-slide/shared` | Framework-neutral config, types, slide discovery, virtual modules, and shared utilities. |
| `packages/react` | `@open-slide/react` | React viewer, presenter, inspector, Vite integration, and runtime CLI. |
| `packages/svelte` | `@open-slide/svelte` | Svelte viewer, presenter, inspector, Vite integration, and runtime CLI. |
| `packages/cli` | `@open-slide/cli` | `npx @open-slide/cli init` scaffolder + project template. |
| `apps/demo` | private | React dogfood target consuming `@open-slide/react` via `workspace:*`. |
| `apps/svelte-demo` | private | Svelte dogfood target consuming `@open-slide/svelte` via `workspace:*`. |
| `apps/web` | private | Marketing site (Next.js). |

Shared config: `biome.json`, `turbo.json`, `pnpm-workspace.yaml`, `tsconfig` per package.

## Workflow

```bash
pnpm dev          # turbo: runs demo against local core
pnpm build        # build all packages
pnpm typecheck    # tsc across the graph
pnpm check        # biome (format + lint + organize imports)
pnpm check:fix    # auto-fix what biome can
pnpm test         # vitest
```

Filter to one package: `pnpm shared <script>` / `pnpm core <script>` / `pnpm react <script>` / `pnpm svelte <script>` / `pnpm cli <script>`.

## Hard rules

- **Biome must pass before commit.** Run `pnpm check` (or `pnpm check:fix`). CI and the user's review both expect a clean tree.
- **If a published package changes, add a changeset.** Run `pnpm changeset`, pick the right package(s) and bump (`patch` for fixes/polish, `minor` for new public API, `major` for breaking). Apps and root tooling do **not** need one.
- **Changeset descriptions: short and direct.** One line, present-tense, what changed from a user's perspective. Match the tone of `.changeset/*.md` already in the repo. No paragraphs, no rationale, no "this PR…".
  - Good: `Replace spinner with a hairline + sliding bar for slide and presenter loading states.`
  - Bad: `This change introduces a new loading indicator because the previous spinner felt heavy and we wanted something more subtle for presentation contexts…`
- Don't bump versions or edit `CHANGELOG.md` by hand — `changeset version` owns that.
- Don't add dependencies casually. The framework runtimes ship to users; every dep inflates install size.
- `packages/react/src/app/components/ui` is shadcn-generated and biome-ignored — leave it alone unless regenerating.
- **Default to writing no comments.** Only add one when the WHY is non-obvious — a hidden constraint, a subtle invariant, a workaround for a specific bug, behavior that would surprise a reader. Don't explain WHAT the code does (well-named identifiers handle that), don't reference tasks/PRs/callers ("added for X", "used by Y"), don't write section-divider banners (`// ── Section ──`) or module-header descriptions, and don't leave commented-out code. If removing a comment wouldn't confuse a future reader, don't write it.

## Releasing (reference)

`pnpm release` builds all published packages and runs `changeset publish`. Triggered by the maintainer, not by agents.
