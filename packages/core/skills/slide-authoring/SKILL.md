---
name: slide-authoring
description: Technical reference for writing or editing open-slide pages — file contract, 1920×1080 canvas, type scale, layout, palette/visual direction, assets, stepped reveals, page transitions, and morph transitions. Consult this whenever you are about to write or modify any file under `slides/<id>/`, including from inside the `create-slide` or `apply-comments` workflows, or for any ad-hoc slide edit. Triggers on phrases like "edit slide", "tweak this page", "fix the layout", "change the palette", "reveal one by one", "add a transition", "morph transition", "investigate the slide framework", "how do slides work here".
---

# Authoring open-slide pages

This skill is the **technical reference** for everything that happens inside `slides/<id>/index.tsx`. It does not own a workflow:

- `create-slide` owns "draft a new deck" — it asks the user scoping questions, then delegates the *how* to this skill.
- `apply-comments` owns "process inspector markers" — it finds markers and applies edits, but the edits themselves follow the rules here.
- `current-slide` resolves deictic references ("this page", "the slide I'm on") to a concrete `slideId` + `pageIndex`. Consult it **first** when the user references the current slide without naming it, then come back here for how to edit it.
- Any ad-hoc slide edit (manual tweak, one-off fix) should also consult this skill before touching the file.

When any of those paths reach the point of *writing React code for a page*, this is the source of truth. Do not duplicate the knowledge below into other skills — link here instead.

## Primitive references

Each framework primitive has a full reference file under `references/` in this skill — contract, worked examples, and its own anti-patterns. This file keeps only the always-on rules and a short summary per primitive. **Read the relevant reference file before using a primitive on a page**:

| Primitive | Read before | File |
| --- | --- | --- |
| `design` const + `var(--osd-X)` tokens | writing any new slide (default baseline) | `references/design-system.md` |
| Assets + `<ImagePlaceholder>` | importing images/videos or leaving a placeholder | `references/assets.md` |
| Webfonts | loading any non-system font | `references/webfonts.md` |
| `useSlidePageNumber()` | rendering a page-number footer | `references/page-numbers.md` |
| `<Steps>` / `<Step>` | staging a page's reveal | `references/steps.md` |
| `SlideTransition` | declaring any enter/exit animation | `references/transitions.md` |
| `MorphElement` + `morph` | morphing a shared element across pages | `references/morph.md` |

## Hard rules

- Put the slide under `slides/<kebab-case-id>/`.
- Entry is `slides/<id>/index.tsx`. Images/videos/fonts go under `slides/<id>/assets/`.
- Do **not** touch `package.json`, `open-slide.config.ts`, or other slides.
- Do not add dependencies. Only `react`, `@open-slide/core`, and standard web APIs are available.
- A slide is **one `index.tsx` plus `assets/`** — nothing else. Do not create sibling `.tsx`/`.ts` files (`Card.tsx`, `components/`, `helpers.ts`, etc.); helper components and constants go inside `index.tsx`. Do not create `README.md` or other prose files either.

## File contract

```tsx
// slides/<id>/index.tsx
import type { Page, SlideMeta } from '@open-slide/core';

const Cover: Page = () => <div>…</div>;
const Body: Page = () => <div>…</div>;

export const meta: SlideMeta = {
  title: 'My slide',
  createdAt: '2026-05-16T12:00:00Z',
};
export default [Cover, Body] satisfies Page[];
```

- `export default` is a **non-empty array of zero-prop React components**, one per page, in order.
- `meta.title` (optional) shows in the slide header. Default is the folder name.
- The slide id is the kebab-case folder name. Pick something short and descriptive (`q2-roadmap`, `team-offsite-2026`).
- `meta.theme` (optional) marks the slide as built from a theme under `themes/`. The id must match a `<id>.md` basename. Surfaces a back-link chip on the slide card and lists the slide on `/themes/<id>`. Omit if the slide isn't derived from a registered theme.
- `meta.createdAt` is an **ISO 8601 string literal** (e.g. `'2026-05-16T12:00:00Z'`) set once when the slide is scaffolded. The home page uses it for the default "newest first" sort. Always include it on new slides — **immediately before writing the file, run `node -e "console.log(new Date().toISOString())"` via Bash and paste the exact output** as the value. Don't type a timestamp from memory — you will get the date or time wrong. Must be a plain string literal (no `new Date(...)` or imports in the slide itself) — the framework reads it via a regex at build time, not by evaluating the module.

## Editing an existing slide

A finished slide commonly runs 1000–1800 lines. When you only need to touch one page, **don't read the whole file** — locate the page first, then read just that range:

```bash
grep -n ": Page = " slides/<id>/index.tsx
```

This lists every `const Foo: Page = …` declaration with its line number. Read the target page with `Read` using `offset` + `limit` (~150 lines is usually enough to capture one page plus its helper components). Read the whole file only when you need cross-page context (palette audit, reordering, design const tweaks).

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

The canvas does **not** scroll. Anything past the 1080px bottom edge is silently cropped. Before writing JSX, do the math on paper and confirm the page fits. This is the #1 cause of broken slides — assume you will overflow unless you've checked.

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
- If you find yourself raising padding, shrinking type below the scale's lower bound, or tightening body line-height under 1.4 to make things fit — **split into two pages instead**. Splitting is always the right answer when the budget is tight.

**Never** use `overflow: auto/scroll`, negative margins, or transforms to hide overflow. The canvas is fixed; cropped content is gone.

## Visual direction

Pick a coherent look and hold it across every page:

- **Palette** — 1 background, 1 primary text, 1 accent, 1 muted. Put bg/text/accent in the `design` const (see Design system below); extra colors like muted stay as plain consts.
- **Typography** — one display font + one body font. System stack unless the user specifies. Heavy weight for headlines (800–900), normal for body (400–500).
- **Layout grid** — pick a single content padding (e.g. 120px) and stick to it. Left-aligned content feels editorial; centered feels ceremonial.
- **Aesthetic commitment** — choose ONE: minimal, maximalist, editorial, retro, brutalist, soft/pastel, neon, paper/print. Don't mix.

If the `frontend-design` skill is available, consult it for deeper aesthetic guidance when the user wants something bold.

## Webfonts

The default is a system font stack — prefer it. When a deck genuinely needs a webfont (a brand font, or CJK / Thai / Arabic where system coverage is poor), read `references/webfonts.md` first — loading the stylesheet inside a page component registers the whole `@font-face` set once per mounted page, and CJK families need subsetting.

## Themes

If `themes/<id>.md` exists at the project root and the slide is meant to follow it, **the theme file overrides the defaults in this skill** — its palette, typography, layout padding, and Title/Footer components are authoritative. Read the theme file before applying anything else in this section.

Themes are produced by the `create-theme` skill and are pure documentation: copy the palette and the paste-ready Title / Footer / Eyebrow components straight into your slide. If the theme's frontmatter has `mode: dark` or `mode: light`, treat that as the slide's background mode (e.g. when picking which logo variant to import).

## Design system (opt-in, per-slide)

A slide can declare typed design tokens at the top of `index.tsx` — `export const design: DesignSystem = { palette, fonts, typeScale, radius }` — and consume them via `var(--osd-X)` in inline styles. The framework injects the CSS variables at the canvas root, and the dev UI's Design panel can live-tweak them.

**Default to using it.** Every new slide should declare a `design` const so it stays tweakable from the panel after generation. Only fall back to plain palette constants for a one-off slide whose palette is intentionally locked (`references/design-system.md` covers the fallback).

`references/design-system.md` has the full token shape, the two consumption surfaces (`var(--osd-X)` vs direct `design.X` reads), Design panel behavior, and the format constraints the panel's AST writer requires. Read it before writing the const.

## Starter template

```tsx
import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';

export const design: DesignSystem = {
  palette: { bg: '#0f172a', text: '#f8fafc', accent: '#fbbf24' },
  fonts: {
    display: 'system-ui, -apple-system, sans-serif',
    body: 'system-ui, -apple-system, sans-serif',
  },
  typeScale: { hero: 180, body: 40 },
  radius: 12,
};

// Extra colors / sizes outside the DesignSystem shape stay as plain consts.
const muted = '#94a3b8';

const fill = {
  width: '100%',
  height: '100%',
  fontFamily: 'var(--osd-font-body)',
} as const;

const Cover: Page = () => (
  <div
    style={{
      ...fill,
      background: 'var(--osd-bg)',
      color: 'var(--osd-text)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '0 160px',
    }}
  >
    <div style={{ fontSize: 28, color: 'var(--osd-accent)', letterSpacing: '0.2em' }}>
      CHAPTER 01
    </div>
    <h1
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 'var(--osd-size-hero)',
        fontWeight: 900,
        margin: '32px 0',
        lineHeight: 1.05,
      }}
    >
      The Big Idea
    </h1>
    <p style={{ fontSize: 'var(--osd-size-body)', color: muted, maxWidth: 1200 }}>
      A short subtitle that explains what this slide is about.
    </p>
  </div>
);

const Content: Page = () => (
  <div style={{ ...fill, background: 'var(--osd-bg)', color: 'var(--osd-text)', padding: 120 }}>
    <h2 style={{ fontFamily: 'var(--osd-font-display)', fontSize: 80, fontWeight: 800, margin: 0 }}>
      Section heading
    </h2>
    <ul style={{ fontSize: 'var(--osd-size-body)', lineHeight: 1.6, marginTop: 64, paddingLeft: 48 }}>
      <li>One clear point per line</li>
      <li>Keep to 3–5 bullets</li>
      <li>Let the space breathe</li>
    </ul>
  </div>
);

export const meta: SlideMeta = {
  title: 'The Big Idea',
  createdAt: '2026-05-16T12:00:00Z',
};
export default [Cover, Content] satisfies Page[];
```

## Assets

Slide-local assets live under `slides/<id>/assets/` and are imported as ES modules (`import hero from './assets/hero.jpg'`). Global assets shared across decks (logos, avatars, recurring icons) live in the project root `assets/` and are imported via the `@assets` alias. For a pure-text slide, don't create `slides/<id>/assets/` at all.

`references/assets.md` covers import forms (module vs `new URL(...)`), the `@assets` alias, and how themes name asset paths.

## Image placeholders

When a page genuinely needs a real image **the user has to provide** (product screenshot, team photo, chart from their data), leave a typed `<ImagePlaceholder hint="…" />` from `@open-slide/core` instead of inventing a stand-in — the user replaces it via the Assets panel + inspector. **Do not** use placeholders for decoration or generic stock-photo filler; if type, layout, and color can carry the page, do that.

`references/assets.md` has the full usage rules, sizing guidance, and examples of when a placeholder is (and isn't) warranted.

## Page numbers

If a footer shows the current page (`03 / 12`), read it from `useSlidePageNumber()` — **never hardcode** `n` / `TOTAL`. See `references/page-numbers.md` for the hook's contract and where it can be called.

## Stepped reveals (`<Steps>` / `<Step>`)

Reveal a page one beat at a time: wrap deferred parts in `<Step>`, the group in `<Steps>`; each `→` reveals the next step. Use it when the *order* of ideas is the point — not reflexively on every page. Two rules are load-bearing: `<Step>` must be a **direct child** of `<Steps>` (otherwise it silently renders fully revealed), and a page must still read as complete when jumped to via the overview grid (jumping in shows all steps revealed).

Read `references/steps.md` before authoring a stepped page — it covers composition order across multiple `<Steps>` blocks, the "headline always, body in turn" pattern, and entry-direction behavior. If `slides/build-on-reveal/` exists in this project, it is the canonical worked example.

## Page transitions

The framework can run an enter/exit animation between slide changes, declared as a `SlideTransition` (module-level default, per-page override; the **incoming page wins**). There's **no default** — pages snap unless you opt in, and snap-swap is a perfectly tasteful default. If you do opt in: one motion DNA per deck, 140–280 ms, magnitude under 12 px / 3% scale, opacity always part of it.

Read `references/transitions.md` before declaring one — it has the full type contract, design principles, a six-member "tasteful family" of ready-to-use transitions sharing one DNA, direction-aware keyframes, and the anti-pattern list.

## Morph transitions

When the *same visual object* exists on two adjacent pages, wrap it on both pages in `MorphElement` with the same `id` and enable `morph` on the incoming page's transition — position, size, radius, and colors interpolate in one continuous move (Keynote's "Magic Move"). Morph is for **state continuity** (a toggle sliding, a card expanding, a box joining a row); don't morph decoration.

Read `references/morph.md` before writing one — the seven rules there (opacity-only enter/exit, deterministic geometry, no `transform` on the morph node, `useIsActivePage()` gating, …) were each earned on a real deck, and violating any of them produces a visibly broken morph.

## Repeated elements: component, not `map`

When a page has visually repeated items — cards, logo rows, gallery tiles, list rows, step indicators — **define a small component and instantiate it once per item**. Do **not** render the group with `array.map` over a data array.

Define the component **in the same `index.tsx`**, alongside the `Page` components. Never split it into a sibling file like `Card.tsx` — a slide is always a single `index.tsx` plus its `assets/`.

```tsx
// ✅ Each card is its own JSX node — inspector edits one at a time.
const Card = ({ src, label }: { src: string; label: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <img src={src} style={{ width: 320, height: 320, objectFit: 'cover', borderRadius: 12 }} />
    <p style={{ fontSize: 32 }}>{label}</p>
  </div>
);

<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 64 }}>
  <Card src={alpha} label="Alpha" />
  <Card src={beta}  label="Beta"  />
  <Card src={gamma} label="Gamma" />
</div>
```

```tsx
// ❌ One shared template — replacing the image or text in the inspector
//    changes every rendered card at once.
const items = [
  { src: alpha, label: 'Alpha' },
  { src: beta,  label: 'Beta'  },
  { src: gamma, label: 'Gamma' },
];
items.map((item) => (
  <div>
    <img src={item.src} />
    <p>{item.label}</p>
  </div>
));
```

The inspector edits source JSX in place. A `map` body is **one source location** shared by every rendered instance, so when the user replaces an image or tweaks a label there, every card mutates together. Explicit instances give each card its own JSX node and its own props — the unit the inspector can target.

The component definition stays the single source of truth for layout/styling (change it once → all cards update). Only the per-instance data — `src`, `label`, accent color — lives at the call site.

This applies whenever the *visual element* repeats, not whenever the *data* does. Pure-text lists (`<ul><li>` bullets) are fine: each `<li>` is already its own JSX node, so plain literal markup is the correct shape — no need to wrap them in a component.

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
- [ ] Slide declares a top-level `export const design: DesignSystem = { … }` and references the values via `var(--osd-X)` (use `design.X` only when you need a JS number for arithmetic). Only omit the `design` const for a one-off slide whose palette is intentionally locked.
- [ ] One idea per page.
- [ ] Visually repeated elements (cards, tiles, logo rows) are rendered as explicit `<Component />` instances, not via `array.map` over a data list.
- [ ] All imported assets exist on disk — slide-local under `slides/<id>/assets/`, or global under `assets/` (imported via `@assets/...`).
- [ ] Every `<ImagePlaceholder>` corresponds to a real image the user must supply — not decorative filler. If it could be replaced by typography or layout, it should be.
- [ ] If a page uses `<Steps>`/`<Step>`, every `<Step>` is a direct child of a `<Steps>`, and the page still reads as complete when jumped to via the overview grid (entering forward builds up; jumping in shows it fully revealed).
- [ ] If a `SlideTransition` is declared, every page sits in one family — same duration band (140–280 ms), same easing pair, same out-then-in stagger, magnitude under 12 px / 3%. No six-different-vocabularies decks. When in doubt, omit transitions entirely. (Pages that opt into `morph` may exceed the band to match the morph — see `references/morph.md`.)
- [ ] If a transition opts into `morph`: every morph `id` is unique per page and stable across the pair, morph geometry is pixel-constant (never measured after mount), no `transform` sits on the morph node, and entrance animations are gated behind `useIsActivePage()`.
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
- ❌ Installing packages. Only `react`, `@open-slide/core`, and standard web APIs are available.
- ❌ Writing CSS to a shared file. Inline styles or scoped classnames only.
- ❌ Creating `README.md` or other prose files inside the slide folder.
- ❌ Editing `package.json`, `open-slide.config.ts`, or other slides.
- ❌ Using a primitive without reading its reference file — each `references/*.md` carries the primitive's own anti-pattern list (placeholder misuse, transition vocabulary, `<Step>` nesting, morph geometry).
