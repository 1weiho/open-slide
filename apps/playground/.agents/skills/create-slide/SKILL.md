---
name: create-slide
description: Use this skill when the user wants to create, draft, author, or generate new slides / a presentation in this open-slide repo. Triggers on phrases like "make slides about X", "create a presentation", "draft slides for", "new slide", "投影片", "簡報", or when the user asks to add content under `slides/`. Do NOT use for editing the framework itself — only for authoring content inside `slides/<id>/`.
---

# Create a slide in open-slide

You are authoring a new slide in this framework. The framework is installed as `@open-slide/core` — you only write files under `slides/<id>/`. Never modify `package.json`, `open-slide.json`, or existing slides.

Read the full contract in `CLAUDE.md` at the repo root first. This skill extends it with process and design guidance.

## Step 1 — Clarify requirements

Before writing code, understand what's needed. Ask the user (use `AskUserQuestion` if any of these are ambiguous):

- **Topic** — what is the slide about?
- **Audience** — technical? investors? teammates? public?
- **Length** — rough page count (typical: 5–15)
- **Tone / aesthetic** — e.g. minimal editorial, playful, corporate, retro. If the user has no preference, propose one and commit to it.
- **Any content they've drafted** — outline, bullets, key messages

Don't ask all of these if the request is already specific (e.g. "make me a 3-page intro to Rust for beginners"). Ask only what's actually unclear.

## Step 2 — Pick a slide id

Use **kebab-case**, short, descriptive. Examples: `rust-intro`, `q2-roadmap`, `team-offsite-2026`. Check `slides/` to avoid collisions.

## Step 3 — Plan the structure

Sketch the slide as a list of page roles before writing code. Common page types:

| Role             | Purpose                                       |
| ---------------- | --------------------------------------------- |
| Cover            | Title + subtitle, strong visual               |
| Agenda           | What's coming (3–5 items)                     |
| Section divider  | Big label between chapters                    |
| Content          | Heading + 2–5 bullets OR heading + one visual |
| Big number       | One statistic the size of the canvas          |
| Quote            | Pull-quote with attribution                   |
| Comparison       | Two-column before/after or A vs B             |
| Closing          | CTA, thanks, contact                          |

**Rule of thumb**: one idea per page. If you're tempted to put two, split them.

## Step 4 — Commit to a visual direction

Before writing JSX, pick a coherent look and stick to it across every page:

- **Palette** — 1 background, 1 primary text, 1 accent, 1 muted. That's it. Define as constants at the top of the file.
- **Typography** — one display font + one body font. Default to system stack unless the user specifies. Heavy weight for headlines (800–900), normal for body (400–500).
- **Layout grid** — pick a consistent content padding (e.g. 120px) and stick to it. Left-aligned content feels editorial; centered feels ceremonial.
- **Aesthetic commitment** — choose ONE: minimal, maximalist, editorial, retro, brutalist, soft/pastel, neon, paper/print, etc. Don't mix.

Consult `.claude/skills/frontend-design/SKILL.md` for deeper aesthetic guidance if the user wants something bold.

## Step 5 — Write `slides/<id>/index.tsx`

The canvas is **1920 × 1080** absolute pixels. Design as if that is literally the viewport.

### Type scale (start here, adjust to taste)

| Element          | Size       |
| ---------------- | ---------- |
| Hero title       | 140–200px  |
| Section heading  | 80–120px   |
| Page heading     | 56–80px    |
| Body text        | 32–44px    |
| Caption / label  | 22–28px    |

### Spacing

- Content padding: **100–160px** from canvas edges. Never let text touch the edge.
- Line-height: 1.2 for headings, 1.5–1.7 for body.
- Breathing room between elements: 32–64px.

### Page template

```tsx
import type { Page, SlideMeta } from '@open-slide/core';

const palette = {
  bg: '#0f172a',
  text: '#f8fafc',
  accent: '#fbbf24',
  muted: '#94a3b8',
};

const fill = {
  width: '100%',
  height: '100%',
  fontFamily: 'system-ui, -apple-system, sans-serif',
} as const;

const Cover: Page = () => (
  <div
    style={{
      ...fill,
      background: palette.bg,
      color: palette.text,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '0 160px',
    }}
  >
    <div style={{ fontSize: 28, color: palette.accent, letterSpacing: '0.2em' }}>
      CHAPTER 01
    </div>
    <h1 style={{ fontSize: 180, fontWeight: 900, margin: '32px 0', lineHeight: 1.05 }}>
      The Big Idea
    </h1>
    <p style={{ fontSize: 40, color: palette.muted, maxWidth: 1200 }}>
      A short subtitle that explains what this slide is about.
    </p>
  </div>
);

const Content: Page = () => (
  <div style={{ ...fill, background: palette.bg, color: palette.text, padding: 120 }}>
    <h2 style={{ fontSize: 80, fontWeight: 800, margin: 0 }}>Section heading</h2>
    <ul style={{ fontSize: 40, lineHeight: 1.6, marginTop: 64, paddingLeft: 48 }}>
      <li>One clear point per line</li>
      <li>Keep to 3–5 bullets</li>
      <li>Let the space breathe</li>
    </ul>
  </div>
);

export const meta: SlideMeta = { title: 'The Big Idea' };
export default [Cover, Content] satisfies Page[];
```

### Assets

Put images, videos, fonts under `slides/<id>/assets/`. Import them as ES modules:

```tsx
import hero from './assets/hero.jpg';
// …
<img src={hero} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
```

The `assets/` folder is only needed if you actually have files — skip it for pure-text slides.

## Step 6 — Self-review before finishing

- [ ] `slides/<id>/index.tsx` `export default`s a non-empty `Page[]`.
- [ ] Every page's root fills `100% × 100%`.
- [ ] Content lives inside padding (no text kisses the edge).
- [ ] One visual direction across every page (same palette, same type scale).
- [ ] One idea per page.
- [ ] All imported assets exist on disk.
- [ ] Nothing outside `slides/<id>/` was edited.

## Step 7 — Hand off to the user

Tell the user:

- The slide id and file path you created.
- That the dev server will hot-reload — they can open `http://localhost:5173/s/<id>` (or refresh the home page).
- If dev isn't running: `pnpm dev` from the repo root.

Don't run the dev server yourself unless asked.

## Anti-patterns (do not do these)

- ❌ Walls of text. If a page has more than ~40 words, split it.
- ❌ Using the full canvas for body copy. Respect the 100–160px padding.
- ❌ Tiny type. Body under 28px is unreadable on a projector.
- ❌ Inconsistent palette across pages — feels glued together from different sources.
- ❌ Installing packages. Only `react` and standard web APIs are available.
- ❌ Writing CSS to a shared file. Inline styles or scoped classnames only.
- ❌ Creating `README.md` or other prose files inside the slide folder. Just `index.tsx` + `assets/`.
