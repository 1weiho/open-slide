# Contributing to open-slide

Thanks for your interest in improving open-slide! This guide covers the workflow for contributing to the framework itself — the `@open-slide/core` runtime, the `@open-slide/cli` scaffolder, and the supporting apps.

If you're authoring slides inside a scaffolded project, you don't need this file — drive your deck through your coding agent or edit `slides/<id>/index.tsx` directly.

## Ways to contribute

- **Report a bug** via the [bug report template](./.github/ISSUE_TEMPLATE/bug_report.yml). Include a minimal reproduction.
- **Propose a feature** via the [feature request template](./.github/ISSUE_TEMPLATE/feature_request.yml). Describe the problem before the solution.
- **Ask a question or share what you're building** in [GitHub Discussions](https://github.com/1weiho/open-slide/discussions).
- **Send a pull request** — see below.

For non-trivial changes, please open an issue or discussion first so we can align on direction before you invest the time.

## Repo layout

pnpm + Turbo monorepo.

| Path | Package | Role |
| --- | --- | --- |
| [`packages/core`](packages/core) | `@open-slide/core` | Runtime (viewer, present mode, inspector), Vite plugin, `open-slide` dev/build CLI. |
| [`packages/cli`](packages/cli) | `@open-slide/cli` | `npx @open-slide/cli init` scaffolder + project template. |
| [`apps/demo`](apps/demo) | private | Local consumer of `@open-slide/core` via `workspace:*`. The dogfood target for the framework. |
| [`apps/web`](apps/web) | private | Marketing site (Next.js). |

## Prerequisites

- **Node.js 22+** (matches CI).
- **pnpm 10.17.0+** — `corepack enable` will pick up the version pinned in `package.json`.
- A Unix-y shell. Windows works via WSL.

## Getting set up

```bash
git clone https://github.com/1weiho/open-slide.git
cd open-slide
pnpm install
```

Then run the demo against the local `@open-slide/core`:

```bash
pnpm dev
```

`apps/demo` is the fastest way to exercise framework changes — edit `packages/core`, the demo hot-reloads.

## Useful scripts

```bash
pnpm dev          # turbo: runs demo against local core
pnpm build        # build all packages
pnpm typecheck    # tsc across the graph
pnpm format:check # biome formatter
pnpm lint         # oxlint (JS/TS) + biome (CSS/JSON)
pnpm check        # format:check + lint + typecheck
pnpm check:fix   # oxlint --fix + biome check --write
pnpm test         # vitest
```

Filter to one package:

```bash
pnpm core <script>   # e.g. pnpm core build
pnpm cli <script>
```

## Pull request workflow

1. **Fork & branch.** Branch off `main`. Keep branches focused — one logical change per PR.
2. **Make your change.** Match the surrounding style. Don't reformat unrelated code.
3. **Run the checks before pushing:**
   ```bash
   pnpm check       # must pass — CI enforces format + lint + typecheck
   pnpm test
   ```
   `pnpm check:fix` will auto-fix most formatting and lint issues.
4. **Add a changeset if you touched `packages/core` or `packages/cli`:**
   ```bash
   pnpm changeset
   ```
   Pick the affected package(s) and the right bump:
   - `patch` — bug fixes, internal refactors, polish.
   - `minor` — new public API, additive features.
   - `major` — breaking changes.

   Apps (`apps/demo`, `apps/web`) and root tooling do **not** need a changeset.

   Keep the description **short and direct** — one line, present-tense, what changed from a user's perspective. Match the tone of existing `.changeset/*.md` files. No paragraphs, no rationale, no "this PR…".

   > Good: `Replace spinner with a hairline + sliding bar for slide and presenter loading states.`
   >
   > Bad: `This change introduces a new loading indicator because the previous spinner felt heavy…`

   Don't bump versions or edit `CHANGELOG.md` by hand — `changeset version` owns that.
5. **Open the PR.** Describe the problem, the change, and how you tested it. Link related issues. Screenshots or short clips help for UI changes.
6. **Address review feedback** by pushing follow-up commits. We'll squash on merge.

## Style & conventions

- **Format and lint must pass.** Formatting and non-JS lint are enforced by Biome; JS/TS semantic lint is enforced by Oxlint. Use `pnpm check`.
- **No casual dependencies.** The `core` runtime ships to users — every dep inflates install size. Prefer a small piece of inline code over a new package.
- **Default to writing no comments.** Only add one when the *why* is non-obvious — a hidden constraint, a subtle invariant, a workaround for a specific bug. Don't explain *what* the code does; well-named identifiers handle that.
- **Leave `packages/core/src/app/components/ui` alone.** It's shadcn-generated and ignored by Biome/Oxlint unless you're regenerating it.

## Testing

- Unit tests run via `pnpm test` (Vitest). Add tests next to the code (`*.test.ts`) when fixing a bug or adding logic that warrants it.
- For runtime/UI changes, please verify the change in `apps/demo` and describe what you exercised in the PR.

## Releases

Releases are cut by the maintainer via `pnpm release`, which builds `@open-slide/core` + `@open-slide/cli` and runs `changeset publish`. Contributors don't need to publish anything — just land the changeset alongside your code.

## Questions

Open a [discussion](https://github.com/1weiho/open-slide/discussions) — happy to help.
