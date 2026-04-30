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
- Do **not** touch `package.json`, `open-slide.config.ts`, or other slides.
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

### Vertical budget — content MUST fit 1080px

The canvas does **not** scroll. Anything below 1080px is silently cropped. Before writing JSX, do the math on paper and confirm the page fits. This is the #1 cause of broken slides — assume you will overflow unless you've checked.

**Usable height** = `1080 − top_padding − bottom_padding`. With 120px padding on each side that's **840px**. With 160px each side, **760px**. Pick the padding first, then design within that budget.

**Element height** = `font_size × line_height × number_of_lines`. A bullet that wraps to 2 lines counts as 2 lines. Add the gap below it (32–64px) before summing the next element.

**Worked example — single content page, 120px padding (budget = 840px):**

| Element                                  | Height                  |
| ---------------------------------------- | ----------------------- |
| Heading: 80px × 1.2 × 1 line             | 96px                    |
| Gap                                      | 64px                    |
| Body paragraph: 40px × 1.6 × 3 lines     | 192px                   |
| Gap                                      | 48px                    |
| 5 bullets: 40px × 1.6 × 1 line each      | 320px (5 × 64px)        |
| 4 gaps between bullets: 24px each        | 96px                    |
| **Total**                                | **816px ✅ fits in 840** |

Swap the heading to 120px or add a 6th bullet and you're over. **Verify every page like this before you write it.**

**Page-level rules:**

- One heading + body OR one heading + ≤5 short bullets. Not both blocks of body copy *and* a long bullet list.
- A bullet should fit on one line at the chosen font size. If it wraps, either shorten the copy or move it to its own page.
- Hero title pages (140–200px) carry a title + 1 subtitle + maybe an eyebrow — nothing else.
- Section headings (80–120px) need almost nothing else on the page.
- If you find yourself raising padding, shrinking type below the scale's lower bound, or tightening line-height under 1.4 to make things fit — **split into two pages instead**. Splitting is always the right answer when the budget is tight.

**Never** use `overflow: auto/scroll`, negative margins, or transforms to hide overflow. The canvas is fixed; cropped content is gone.

## Visual direction

Pick a coherent look and hold it across every page:

- **Palette** — 1 background, 1 primary text, 1 accent, 1 muted. Define as constants at the top of the file.
- **Typography** — one display font + one body font. System stack unless the user specifies. Heavy weight for headlines (800–900), normal for body (400–500).
- **Layout grid** — pick a single content padding (e.g. 120px) and stick to it. Left-aligned content feels editorial; centered feels ceremonial.
- **Aesthetic commitment** — choose ONE: minimal, maximalist, editorial, retro, brutalist, soft/pastel, neon, paper/print. Don't mix.

Consult the `frontend-design` skill for deeper aesthetic guidance if the user wants something bold.

## Themes

If `themes/<id>.md` exists at the project root and the slide is meant to follow it, **the theme file overrides the defaults in this skill** — its palette, typography, layout padding, and Title/Footer components are authoritative. Read the theme file before applying anything else in this section.

Themes are produced by the `create-theme` skill and are pure documentation: copy the palette and the paste-ready Title / Footer / Eyebrow components straight into your slide. If the theme's frontmatter has `mode: dark` or `mode: light`, treat that as the slide's background mode (e.g. when picking which logo variant to import).

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
- [ ] **For every page, sum (font_size × line_height × lines) + gaps + 2×padding ≤ 1080px.** If close, split the page. No `overflow: auto` escape hatches.
- [ ] No bullet wraps to a second line at the chosen font size.
- [ ] One coherent visual direction across every page (palette + type scale).
- [ ] One idea per page.
- [ ] All imported assets exist on disk under `slides/<id>/assets/`.
- [ ] Nothing outside `slides/<id>/` was edited.

## Anti-patterns

- ❌ Walls of text. If a page has more than ~40 words, split it.
- ❌ Using the full canvas for body copy. Respect 100–160px padding.
- ❌ Overflowing 1080px vertically. Cropped content is invisible — split the page.
- ❌ `overflow: auto` / `overflow: scroll` / `overflow: hidden` to "hide" too much content. The canvas doesn't scroll; you've just hidden the bug.
- ❌ Shrinking type below the scale's lower bound, or padding below 100px, to cram more in. Split instead.
- ❌ Bullets that wrap to a second line — either shorten or move to its own page.
- ❌ Body type under 28px — unreadable on a projector.
- ❌ Inconsistent palette across pages.
- ❌ Installing packages. Only `react` and standard web APIs are available.
- ❌ Writing CSS to a shared file. Inline styles or scoped classnames only.
- ❌ Creating `README.md` or other prose files inside the slide folder.
- ❌ Editing `package.json`, `open-slide.config.ts`, or other slides.
