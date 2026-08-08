<img width="1280" height="640" alt="open-slide github cover" src="https://github.com/user-attachments/assets/02f5e6d7-12a7-4a8e-88e7-ae8770a96584" />

<br />
<br />
<a href="https://vercel.com/open-source-program">
  <img alt="Vercel OSS Program" src="https://vercel.com/oss/program-badge-2026.svg" />
</a>

# open-slide

[![GitHub stars](https://img.shields.io/github/stars/1weiho/open-slide?style=for-the-badge)](https://github.com/1weiho/open-slide/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/1weiho/open-slide?style=for-the-badge)](https://github.com/1weiho/open-slide/network/members)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**The slide framework built for agents.** Describe your deck in natural language — your coding agent writes React or Svelte. open-slide handles the canvas, scaling, navigation, hot reload, and present mode so the agent can focus on content.

Every slide renders into a fixed **1920 × 1080** canvas. Pages are arbitrary framework components, not a constrained DSL.

```bash
npx @open-slide/cli init my-slide
# or: npx @open-slide/cli init my-slide --framework svelte
```

## Why open-slide

Slides are visual code. Agents are great at writing code. open-slide is the missing runtime that turns "make slides about X" into a polished, presentable deck — without you ever leaving the chat.

## Highlights

### 🤖 Agent-native authoring

Works with any coding agent (Claude Code, Codex, Cursor, …). The scaffolder ships with built-in skills:

- **`/create-slide`** — drafts a deck end-to-end. Asks four scoping questions (topic & aesthetic, page count, text density, motion vs. static), picks an id, plans the structure, and writes the pages.
- **`/slide-authoring`** — the technical reference for the 1920 × 1080 canvas, type scale, palette, and layout rules. The agent reads this before writing.

From a one-line prompt to a polished deck, no boilerplate.

### 🎯 In-browser inspector

Click any element in the dev server and attach a comment — *"make this red"*, *"change to 'Open Slide Rocks'"*, *"shrink the headline"*. Comments are persisted as `@slide-comment` markers in source. Run `/apply-comments` and the agent applies every pending edit, then clears the markers.

The loop: present → click to comment → `/apply-comments` → repeat.

### 🖼️ Assets manager + svgl logo search

Manage images, videos, and fonts per deck through a built-in assets panel. Search and drop in any brand logo via the integrated [svgl](https://svgl.app/) catalogue — no more hunting for SVGs.

### 🎬 Professional present mode

Fullscreen playback with keyboard navigation, plus a **presenter mode** with current/next slide preview, speaker notes, and a timer. Built for the stage, not just the browser tab.

### 📦 Export to static HTML & PDF

One command exports your deck as a self-contained static HTML site or a print-ready PDF. Share without a server.

### 📁 Slide manager

Organise decks into folders with custom emoji and drag-and-drop to reorder. Useful once you've built more than three decks and need to find anything.

### 🚀 Deploy-friendly

Outputs a plain static build — one-click deploy to Vercel, Cloudflare Pages, Zeabur, Netlify, or any static host. No server, no runtime, no lock-in.

## Get started

```bash
npx @open-slide/cli init my-slide
cd my-slide
pnpm dev
```

The React scaffold ships with agent skills preconfigured for Claude Code. From there you drive the deck through your agent, or edit `slides/<id>/index.tsx` directly. Svelte workspaces use an `index.ts` deck manifest and one `.svelte` component per page.

## Repo layout

This repo is a pnpm + Turbo monorepo.

| Path | Description |
| --- | --- |
| [packages/core](packages/core) | `@open-slide/core` — framework-neutral config, types, slide discovery, virtual modules, filesystem helpers, and shared runtime utilities. |
| [packages/react](packages/react) | `@open-slide/react` — the existing React viewer, presenter, inspector, Vite integration, and runtime CLI. |
| [packages/svelte](packages/svelte) | `@open-slide/svelte` — native Svelte viewer, presenter, inspector, Vite integration, and runtime CLI. |
| [packages/cli](packages/cli) | `@open-slide/cli` — framework-selecting workspace scaffolder. |
| [apps/demo](apps/demo) | React dogfood workspace that consumes `@open-slide/react` via `workspace:*`. |
| [apps/svelte-demo](apps/svelte-demo) | Svelte dogfood workspace that validates the native runtime in the Turbo graph. |

## Development

```bash
pnpm install
pnpm dev                # runs both framework demos
pnpm dev:svelte-demo    # runs only the Svelte demo
pnpm build              # builds all packages and apps
pnpm typecheck          # type-checks the workspace graph
pnpm check              # formats and lints with Biome
```

## Support

If open-slide has been useful to you, consider supporting development:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/D1D11YPUP1)

## License

MIT © [Yiwei Ho](https://github.com/1weiho)
