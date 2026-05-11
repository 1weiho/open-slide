---
name: create-theme
description: Use this skill when the user wants to create, draft, author, or extract a slide theme in this open-slide repo. Triggers on phrases like "create a theme", "make a theme called X", "extract a theme from <slide>", "build a theme from these images". Produces two paired files under `themes/`: `<id>.md` (palette, typography, layout, fixed Title/Footer components, motion) and `<id>.demo.tsx` (a runnable demo slide that the dev-UI Themes panel previews). Do NOT use for editing real slides — only for authoring the theme bundle.
---

# Create a slide theme

This skill produces a **theme bundle** under `themes/`: two paired files that together describe a reusable visual identity.

1. `themes/<id>.md` — agent-facing documentation: palette, typography, layout, fixed Title/Footer/Eyebrow components, motion. This is what `create-slide` reads when an author picks the theme.
2. `themes/<id>.demo.tsx` — a runnable mini-slide (a normal slide module: `export default Page[]`) that demonstrates the theme on 2–3 pages. The dev UI's **Themes panel** loads this file and renders it as the theme's live preview.

Both files share the same stem so the runtime can pair them automatically.

A theme is **distinct from a slide's `design` const**. The theme markdown is authoring-time aesthetic direction (copied into a real slide's source by `create-slide`). The demo `.tsx` is a self-contained preview, not a real slide — it does not appear in the slides list. A per-slide `const design: DesignSystem = { … }` (declared at the top of `slides/<id>/index.tsx`) is the runtime tokens object the user can tweak from the Design panel. The markdown commits the *direction*; the per-slide `design` const makes the slide *tweakable*; the demo `.tsx` makes the theme *previewable*.

You only write files under `themes/<id>.md` and `themes/<id>.demo.tsx`. Never modify real slides or other configuration. The canvas / type-scale defaults that themes can override live in the **`slide-authoring`** skill — read it before writing the theme so your overrides are stated explicitly.

## Step 1 — Identify the input source

A theme can be derived from any combination of three input shapes:

- **Image references** — paths or URLs to slide screenshots, mood-board images, brand assets.
- **Free-text description** — prose describing the desired palette, fonts, feel.
- **An existing slide** — `slides/<id>/index.tsx` whose visual identity should be lifted out into a reusable theme.

If the user's original message already specifies the inputs unambiguously, skip the question and proceed. Otherwise call `AskUserQuestion` (multi-select) so they can pick one or more sources, and ask follow-ups (paths, slide id, prose) only as needed.

## Step 2 — Gather raw inputs

- **Images**: read each path with the `Read` tool (it accepts images). Note dominant colors as hex, type weight/style, layout rhythm, decorative motifs, and any recurring chrome (header bar, footer line, page numbers).
- **Text**: extract explicit tokens (hex codes, font names, motion verbs) and implicit tone words ("editorial", "playful", "brutalist"). Resolve vague language into concrete decisions before writing.
- **Existing slide**: read `slides/<id>/index.tsx` and pull:
  - The `palette` object → Palette section.
  - Font constants and any `font-size` patterns → Typography section.
  - Padding / alignment patterns → Layout section.
  - Recurring components (TrafficLights, Eyebrow, Footer-style helpers, WindowShell, …) → Fixed components section.
  - `@keyframes` blocks and the shared `styles` string → Motion section.
  - The aesthetic feel implied by the design → Aesthetic paragraph.

When inputs disagree (e.g. images use blue but the description says green), ask the user which to honor.

## Step 3 — Pick a theme id

Use **kebab-case**, short, descriptive. Examples: `editorial-noir`, `brutalist-mono`, `pastel-soft`, `dev-terminal`. Check `themes/` to avoid collisions.

## Step 4 — Write `themes/<id>.md`

Produce a file with this exact section order. Section bodies adapt to the theme; the headings stay consistent across all themes.

````markdown
---
name: <Human title, e.g. "Editorial Noir">
description: <one-line elevator pitch>
---

# <Theme name>

## Palette

| Role   | Value     | Notes                          |
| ------ | --------- | ------------------------------ |
| bg     | `#0f172a` | page background                |
| text   | `#f8fafc` | primary copy                   |
| accent | `#fbbf24` | callouts, eyebrow, key numbers |
| muted  | `#94a3b8` | secondary copy, dividers       |
| ...    | ...       | extend as the theme requires   |

## Typography

- Display font: `<stack>` — weight 800–900 for headlines.
- Body font: `<stack>` — weight 400–500.
- Type-scale overrides (only list what differs from `slide-authoring` defaults):
  - Hero title: 180 px (default 140–200 ✓)
  - Body text: 36 px

## Layout

- Content padding: 120 px from canvas edges (1920 × 1080).
- Alignment: left-aligned, single column.
- Grid notes: optional 12-column overlay at 80 px gutter for content pages.

## Fixed components

These are paste-ready. Copy them verbatim into a slide that uses this theme.

### Title

```tsx
const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontSize: 140,
      fontWeight: 900,
      lineHeight: 1.05,
      letterSpacing: '-0.02em',
      margin: 0,
      color: '#f8fafc',
    }}
  >
    {children}
  </h1>
);
```

### Footer

```tsx
const Footer = ({ pageNum, total }: { pageNum: number; total: number }) => (
  <div
    style={{
      position: 'absolute',
      left: 120,
      right: 120,
      bottom: 60,
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 24,
      color: '#94a3b8',
    }}
  >
    <span>EDITORIAL NOIR · 2026</span>
    <span>{pageNum} / {total}</span>
  </div>
);
```

### Eyebrow / accents (optional)

```tsx
const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 26, letterSpacing: '0.2em', color: '#fbbf24' }}>
    {children}
  </div>
);
```

## Motion

- Philosophy: static / subtle / rich — pick one and explain in one sentence.
- Reusable keyframes (paste-ready, only if the philosophy is subtle or rich):

```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

## Aesthetic

One paragraph. What it feels like, the references it draws on, what to avoid (e.g. "no rounded corners; no gradients; no decorative emoji"). Commit to a single direction — minimal, maximalist, editorial, retro, brutalist, soft/pastel, neon, paper/print.

## Example usage

```tsx
const Cover: Page = () => (
  <div style={{ width: '100%', height: '100%', background: '#0f172a', color: '#f8fafc', padding: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Eyebrow>CHAPTER 01</Eyebrow>
    <Title>The Big Idea</Title>
    <p style={{ fontSize: 36, color: '#94a3b8', maxWidth: 1200, marginTop: 32 }}>
      A short subtitle that explains what this slide is about.
    </p>
    <Footer pageNum={1} total={5} />
  </div>
);
```
````

## Step 4b — Write `themes/<id>.demo.tsx`

The demo is a normal slide module — same shape as `slides/<id>/index.tsx`, just sitting under `themes/` so the runtime knows it's preview-only. The dev-UI Themes panel imports it and renders it inside `SlideCanvas` (1920×1080).

Contract:

- `import type { Page } from '@open-slide/core';`
- Inline the **same** `Title`, `Footer`, `Eyebrow` components defined in the theme markdown — verbatim, no abstractions, no imports from elsewhere. The demo and the markdown must stay in lockstep so what the user sees in the panel matches what `create-slide` will paste into a real slide.
- Export 2–3 `Page` components and a default array. Aim for: a Cover (Eyebrow + Title + subtitle), one Content page exercising body type + accent, and a Closer or "End" card. The "Example usage" block at the bottom of the markdown is a good starting point — extend it.
- If the theme has runtime-tweakable tokens worth surfacing in the Design panel later, also `export const design: DesignSystem = {...}`.
- No external assets, no `import` from `@/`, no slides-only helpers (e.g. `WindowShell` from a real slide). Demo files must be self-contained.

Skeleton:

```tsx
import type { Page } from '@open-slide/core';

const Title = ({ children }: { children: React.ReactNode }) => (
  // …same JSX as in themes/<id>.md
);
const Footer = ({ pageNum, total }: { pageNum: number; total: number }) => (
  // …
);
const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  // …
);

const Cover: Page = () => (
  // …
);
const Content: Page = () => (
  // …
);
const Closer: Page = () => (
  // …
);

export default [Cover, Content, Closer];
```

## Step 5 — Self-review

Run this checklist before finishing:

- [ ] Palette covers `bg` / `text` / `accent` / `muted` at minimum, all as hex.
- [ ] Type scale specifies hero, heading, body, caption sizes (or explicitly defers to `slide-authoring` defaults).
- [ ] At least Title and Footer are defined as paste-ready React with concrete inline styles.
- [ ] Motion section commits to one of static / subtle / rich.
- [ ] Aesthetic paragraph names a single coherent direction.
- [ ] Both files written: `themes/<id>.md` and `themes/<id>.demo.tsx`. No slide changes, no config changes.
- [ ] Demo `.tsx` exports 2–3 pages and inlines the same Title/Footer/Eyebrow components defined in the markdown.
- [ ] Demo opens cleanly in the **Themes** panel of the dev UI — re-checked by you only by reading the file (do not start a server).

## Step 6 — Hand off

Tell the user:

- The theme id and the two file paths (`themes/<id>.md` + `themes/<id>.demo.tsx`).
- That the demo will appear in the dev UI's **Themes** panel as a live card and detail view (HMR — no restart needed).
- That `/create-slide` will list the theme as a picker option on its next run.
- A one-line summary of the look (palette + aesthetic).

Do not run the dev server. Do not modify real slides — even to demonstrate the theme; the demo `.tsx` is the demonstration.

## Anti-patterns

- ❌ Writing executable code in `themes/<id>.md` outside the labeled component snippets — the markdown is documentation.
- ❌ Producing only the markdown without the demo, or only the demo without the markdown. A theme is the **bundle** — both files, every time.
- ❌ Treating `themes/<id>.demo.tsx` as a real slide. It is preview-only and lives outside the slides list; never put it under `slides/`.
- ❌ Importing from `@/` or any slide-specific helper inside the demo. The demo is self-contained.
- ❌ Inventing palette / fonts when the user supplied images or an existing slide. Extract, don't fabricate.
- ❌ Editing `slides/`, `packages/`, `package.json`, or `open-slide.config.ts`.
- ❌ Skipping the Fixed components section. Title and Footer are the most common reuse target — they must be paste-ready.
