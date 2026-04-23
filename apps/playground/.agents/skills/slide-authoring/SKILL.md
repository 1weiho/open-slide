---
name: slide-authoring
description: Technical reference for writing or editing open-slide pages — file contract, 1920×1080 canvas, type scale, layout, palette/visual direction, and assets. Consult this whenever you are about to write or modify any file under `slides/<id>/`, including from inside the `create-slide` or `apply-comments` workflows, or for any ad-hoc slide edit. Triggers on phrases like "edit slide", "tweak this page", "fix the layout", "change the palette", "investigate the slide framework", "how do slides work here".
---

# Authoring open-slide pages

This skill is the **technical reference** for everything that happens inside `slides/<id>/index.tsx`. It does not own a workflow:

- `create-slide` owns "draft a new deck" — it asks the user scoping questions, then delegates the *how* to this skill.
- `apply-comments` owns "process inspector markers" — it finds markers and applies edits, but the edits themselves follow the rules here.
- Any ad-hoc slide edit (manual tweak, one-off fix) should also consult this skill before touching the file.

When any of those paths reach the point of *writing React code for a page*, this is the source of truth. Do not duplicate the knowledge below into other skills — link here instead.

## Hard rules

- Put the slide under `slides/<kebab-case-id>/`.
- Entry is `slides/<id>/index.tsx`. Images/videos/fonts go under `slides/<id>/assets/`.
- Do **not** touch `package.json`, `open-slide.json`, or other slides.
- Do not add dependencies. Only `react` and standard web APIs are available.
- Do not create `README.md` or other prose files inside the slide folder — just `index.tsx` + `assets/`.

## File contract

```tsx
// slides/<id>/index.tsx
import type { Page, SlideMeta } from '@open-slide/core';

const Cover: Page = () => <div>…</div>;
const Body: Page = () => <div>…</div>;

export const meta: SlideMeta = { title: 'My slide' };
export default [Cover, Body] satisfies Page[];
```

- `export default` is a **non-empty array of zero-prop React components**, one per page, in order.
- `meta.title` (optional) shows in the slide header. Default is the folder name.
- The slide id is the kebab-case folder name. Pick something short and descriptive (`q2-roadmap`, `team-offsite-2026`).

## Canvas

Every page renders into a fixed **1920 × 1080** canvas. The framework scales it; you design as if the viewport is literally 1920×1080.

- Use **absolute pixel values** for `font-size`, padding, positioning. No `rem`, no `vw`/`vh`, no `%` for type.
- The root element of each page should fill the canvas: `width: '100%'; height: '100%'`.
- Prefer inline `style={{ … }}`. Any CSS you load is global — scope classnames carefully.

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

## Visual direction

Pick a coherent look and hold it across every page:

- **Palette** — 1 background, 1 primary text, 1 accent, 1 muted. Define as constants at the top of the file.
- **Typography** — one display font + one body font. System stack unless the user specifies. Heavy weight for headlines (800–900), normal for body (400–500).
- **Layout grid** — pick a single content padding (e.g. 120px) and stick to it. Left-aligned content feels editorial; centered feels ceremonial.
- **Aesthetic commitment** — choose ONE: minimal, maximalist, editorial, retro, brutalist, soft/pastel, neon, paper/print. Don't mix.

Consult the `frontend-design` skill for deeper aesthetic guidance if the user wants something bold.

## Starter template

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

## Assets

Place files under `slides/<id>/assets/`. Import them as ES modules:

```tsx
import hero from './assets/hero.jpg';
// …
<img src={hero} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
```

For URL-only access:

```tsx
const videoUrl = new URL('./assets/intro.mp4', import.meta.url).href;
```

Skip the `assets/` folder entirely for pure-text slides.

## Runtime behavior you get for free

- Home page lists every folder under `slides/`.
- Clicking a slide shows a left thumbnail rail, main page, prev/next, page counter.
- Arrow keys / PageUp / PageDown navigate. `F` enters fullscreen play mode.
- In play mode: Space/→ next, ← prev, Esc exit.
- Hot reload: edit `index.tsx` and the browser updates live.

## Self-review before finishing

- [ ] `slides/<id>/index.tsx` `export default`s a non-empty `Page[]`.
- [ ] Every page's root fills `100% × 100%`.
- [ ] Content lives inside padding (no text kisses the edge).
- [ ] One coherent visual direction across every page (palette + type scale).
- [ ] One idea per page.
- [ ] All imported assets exist on disk under `slides/<id>/assets/`.
- [ ] Nothing outside `slides/<id>/` was edited.

## Anti-patterns

- ❌ Walls of text. If a page has more than ~40 words, split it.
- ❌ Using the full canvas for body copy. Respect 100–160px padding.
- ❌ Body type under 28px — unreadable on a projector.
- ❌ Inconsistent palette across pages.
- ❌ Installing packages. Only `react` and standard web APIs are available.
- ❌ Writing CSS to a shared file. Inline styles or scoped classnames only.
- ❌ Creating `README.md` or other prose files inside the slide folder.
- ❌ Editing `package.json`, `open-slide.json`, or other slides.
