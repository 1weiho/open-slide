---
name: slide-authoring
description: Technical reference for writing or editing open-slide pages — file contract, 1920×1080 canvas, type scale, layout, palette/visual direction, assets, page transitions, and shared-element magic move. Consult this whenever you are about to write or modify any file under `slides/<id>/`, including from inside the `create-slide` or `apply-comments` workflows, or for any ad-hoc slide edit. Triggers on phrases like "edit slide", "tweak this page", "fix the layout", "change the palette", "add a transition", "magic move", "investigate the slide framework", "how do slides work here".
---

# Authoring open-slide pages

This skill is the **technical reference** for everything that happens inside `slides/<id>/index.tsx`. It does not own a workflow:

- `create-slide` owns "draft a new deck" — it asks the user scoping questions, then delegates the *how* to this skill.
- `apply-comments` owns "process inspector markers" — it finds markers and applies edits, but the edits themselves follow the rules here.
- `current-slide` resolves deictic references ("this page", "the slide I'm on") to a concrete `slideId` + `pageIndex`. Consult it **first** when the user references the current slide without naming it, then come back here for how to edit it.
- Any ad-hoc slide edit (manual tweak, one-off fix) should also consult this skill before touching the file.

When any of those paths reach the point of *writing React code for a page*, this is the source of truth. Do not duplicate the knowledge below into other skills — link here instead.

## Hard rules

- Put the slide under `slides/<kebab-case-id>/`.
- Entry is `slides/<id>/index.tsx`. Images/videos/fonts go under `slides/<id>/assets/`.
- Do **not** touch `package.json`, `open-slide.config.ts`, or other slides.
- Do not add dependencies. Only `react` and standard web APIs are available.
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

## Webfonts

The default is a system font stack — prefer it. When a deck genuinely needs a webfont (a brand font, or CJK / Thai / Arabic where system coverage is poor):

- **Load the stylesheet once, in `<head>` — never inside a per-page component.** Every page is mounted live at the same time (thumbnail rail, overview grid, and the PDF print root), so a `<style>@import>` / `<link>` rendered inside a `Page` registers the whole `@font-face` set once *per page*. Inject it once, idempotently:

  ```tsx
  const FONT_HREF = 'https://fonts.googleapis.com/css2?family=...&display=swap';
  if (typeof document !== 'undefined' && !document.getElementById('osd-webfont')) {
    const link = document.createElement('link');
    link.id = 'osd-webfont';
    link.rel = 'stylesheet';
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }
  ```

- **List only the weights you actually use.** Each extra weight multiplies the number of `@font-face` rules.
- **CJK fonts are large.** A Google Fonts CJK family registers hundreds of `unicode-range` subset faces (Noto Sans TC ≈ 105 subsets × each weight), and PDF export waits on fonts before printing. If the deck's text is fixed, add `&text=<unique chars>` to the URL to request a tiny single-face subset instead of the full set.

## Themes

If `themes/<id>.md` exists at the project root and the slide is meant to follow it, **the theme file overrides the defaults in this skill** — its palette, typography, layout padding, and Title/Footer components are authoritative. Read the theme file before applying anything else in this section.

Themes are produced by the `create-theme` skill and are pure documentation: copy the palette and the paste-ready Title / Footer / Eyebrow components straight into your slide. If the theme's frontmatter has `mode: dark` or `mode: light`, treat that as the slide's background mode (e.g. when picking which logo variant to import).

## Design system (opt-in, per-slide)

A slide can declare its own typed design tokens at the top of `index.tsx`:

```tsx
import type { DesignSystem, Page } from '@open-slide/core';

export const design: DesignSystem = {
  palette: { bg: '#f7f5f0', text: '#1a1814', accent: '#6d4cff' },
  fonts: {
    display: 'Georgia, "Times New Roman", serif',
    body: '-apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif',
  },
  typeScale: { hero: 168, body: 36 },
  radius:    12,
};
```

`export` it (rather than plain `const`) so the framework can read the object and inject CSS variables at the canvas root automatically.

The shape is intentionally minimal — it only covers what the Design panel can currently tweak. Anything outside this set (heading sizes, spacing, motion, extra palette colors) belongs as plain hard-coded constants in the slide file.

There are **two consumption surfaces**, and you should mix them inside the same slide:

- **`var(--osd-X)` for visual properties (color, font, font-size, radius)** — these get instant updates while the user drags a slider in the Design panel, before any file write.
  ```tsx
  <div style={{ background: 'var(--osd-bg)', color: 'var(--osd-text)', borderRadius: 'var(--osd-radius)', fontFamily: 'var(--osd-font-body)', fontSize: 'var(--osd-size-body)' }}>
  ```
  Available vars: `--osd-bg`, `--osd-text`, `--osd-accent`, `--osd-font-display`, `--osd-font-body`, `--osd-size-hero`, `--osd-size-body`, `--osd-radius`.

- **Direct `design.X` reads** — when you need a JS number for arithmetic or to label something in the UI. These update via HMR after the panel commits the file, not while dragging.
  ```tsx
  <p>{design.typeScale.hero}px</p>
  ```

The dev UI has a **Design** button in the slide header (next to Inspect). Edits update an in-memory draft and the live-preview overlay; a floating Save / Discard bar at the bottom of the canvas commits or reverts. The const stays the single source of truth — production builds bake the saved values.

**Default to using it.** Every new slide should declare a `design` const so it stays tweakable from the panel after generation — this is the expected baseline. Only fall back to the local `palette` constants pattern (see starter template) for a one-off slide whose palette is intentionally locked and not meant to be re-themed. Both styles can coexist across slides — the panel only operates on the *currently viewed* slide.

Format constraints (for the panel's AST writer):
- Must be `[export] const design: DesignSystem = { … }` (or `as DesignSystem` / `satisfies DesignSystem`) at module top level.
- Object initializer must be a literal — no spreads, no helper calls. Plain values only.
- `DesignSystem` must be imported from `@open-slide/core` (the panel adds the import automatically when creating a fresh block).

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

**Slide-local assets** live under `slides/<id>/assets/` — anything one-off to a single slide. Import them as ES modules:

```tsx
import hero from './assets/hero.jpg';
// …
<img src={hero} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
```

For URL-only access:

```tsx
const videoUrl = new URL('./assets/intro.mp4', import.meta.url).href;
```

**Global assets** — anything reused across decks or themes (company logos, presenter avatars, recurring icons) — live in the project root `assets/` folder. Import them via the `@assets` alias:

```tsx
import logo from '@assets/logos/acme.svg';
```

A `themes/*.md` file may name an asset path in its prose (e.g. "use `@assets/logos/acme.svg` in the title slot"); the slide imports it explicitly.

Skip the `assets/` folder entirely for pure-text slides.

## Image placeholders

When a page genuinely needs a real image **the user has to provide** — a product screenshot, a team photo, a chart from their data — leave a typed placeholder instead of inventing a stand-in:

```tsx
import { ImagePlaceholder } from '@open-slide/core';

<ImagePlaceholder hint="Product hero screenshot" width={1280} height={720} />
```

The user uploads the real file via the Assets panel, then clicks the placeholder in the inspector and picks "Replace…" — the JSX is rewritten to a real `<img>` with the import added.

**Use a placeholder only when** a specific concrete image is required by the deck's topic. Examples that warrant one: a product-intro deck (product screenshot per feature), an offsite recap (team photo), a case study (customer logo, dashboard screenshot).

**Do not use a placeholder** for decoration, generic "stock photo" filler, hero imagery on a text-heavy slide, or anywhere a typographic / iconographic / illustrative solution would do. If you can carry the page with type, layout, and color — do that. Empty placeholders the user has to fill are friction; only spend that friction when the alternative is worse.

Size the placeholder to the slot it occupies. Pass `width`/`height` when the layout has a fixed image box; omit them when the placeholder fills a flex/grid cell. The `hint` should describe the *content* the user needs ("Q3 revenue chart") not the *role* ("hero image").

## Page numbers

If a footer shows the current page (`03 / 12`, `Page 3`, etc.), read it from `useSlidePageNumber()` — **never hardcode** `n` / `TOTAL`. Inserting, reordering, or deleting a page would otherwise force you to retouch every footer.

```tsx
import { useSlidePageNumber } from '@open-slide/core';

const Footer = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <span>{String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
  );
};
```

`current` is 1-indexed (matches what readers see) and `total` is the slide's page count. The hook works in every render context (main viewer, thumbnails, overview grid, present mode, presenter window, HTML/PDF export) — the same `<Footer />` JSX is correct everywhere. Call the hook inside a component that's used **per page**; don't try to call it at module top level.

## Stepped reveals (`<Steps>` / `<Step>`)

Reveal a page one beat at a time instead of showing everything at once. Wrap the deferred parts in `<Step>`, wrap the group in `<Steps>`. Each `→` reveals the next `<Step>`; `→` after the last one advances to the next page. `←` peels the last reveal back. Use it to stage attention — show framing first, then the consequence, then the turn — so the audience reads at the speaker's pace, not ahead.

`slides/build-on-reveal/` is the canonical worked example; study it before authoring a stepped page.

```tsx
import { Step, Steps } from '@open-slide/core';

<Steps>
  <Step><div style={BULLET_ROW}>An audience reads faster than a presenter speaks.</div></Step>
  <Step><div style={BULLET_ROW}>Showing every bullet at once invites pre-reading.</div></Step>
  <Step><div style={BULLET_ROW}>Revealing in time stages attention.</div></Step>
</Steps>
```

### Rules

- **`<Step>` must be a *direct* child of `<Steps>`.** A `<Step>` nested deeper (or used without a `<Steps>` parent) renders fully revealed and defers nothing.
- **Non-`Step` children render immediately.** Put a headline or intro paragraph *inside* `<Steps>` as a plain element and it shows from the start; only the `<Step>` blocks wait. This is the "headline always, body in turn" pattern:
  ```tsx
  <Steps>
    <h2>Not everything has to wait.</h2>{/* visible immediately */}
    <Step><p>First, set the stage…</p></Step>
    <Step><p>Then, layer the consequence…</p></Step>
  </Steps>
  ```
- **Multiple `<Steps>` blocks on one page compose in document order.** The first block reveals all its steps before the second begins; `←` unwinds in reverse. Use this for two columns that build left-then-right, each column owning its own `<Steps>`:
  ```tsx
  <div style={COL}><Steps><Step>…</Step><Step>…</Step></Steps></div>{/* finishes first */}
  <div style={COL}><Steps><Step>…</Step><Step>…</Step></Steps></div>{/* then this */}
  ```
- **Entry direction decides the starting state — same content, two rhythms.** Entering forward (`→` from the previous page) starts empty and builds up. Jumping in via the overview grid, or arriving backward from a later page, shows the page **fully composed** with every step already revealed. Design the page to read well both ways: a thumbnail or overview jump should look complete, not blank.
- **`<Step>` fades in over `duration` ms (default 180).** Pass `<Step duration={...}>` to adjust. `prefers-reduced-motion: reduce` collapses it to an instant cut automatically — don't write a fallback.

### When to reach for it

Use stepped reveals when the *order* of ideas is the point — a list whose payoff is the last item, a build-up to a conclusion, a before/after. Don't wrap every page's content in `<Step>` reflexively: a page the audience should take in at a glance (a hero title, a single quote, a diagram) is stronger shown whole. Reveals are timing, not decoration — same restraint as transitions.

## Page transitions

The framework can run an enter/exit animation between every slide change. There's **no default** — pages snap unless you declare a `SlideTransition`. Snap-swap is a perfectly tasteful default; only opt in when motion adds something.

`prefers-reduced-motion: reduce` is honored automatically. You don't write a fallback.

### Contract

Module-level for the whole deck; per-page to override. The **incoming page wins**: navigating A → B uses `pages[B].transition ?? module.transition`. Its `exit` plays on A, its `enter` plays on B. Going back B → A uses A's transition.

```tsx
import type { Page, SlideTransition } from '@open-slide/core';

const Cover: Page = () => <section>…</section>;
const Body:  Page = () => <section>…</section>;

// Module-level default — every page inherits unless it overrides.
export const transition: SlideTransition = { /* … */ };

// Per-page override.
Cover.transition = { /* … */ };

export default [Cover, Body];
```

```ts
type TransitionPhase = {
  keyframes: Keyframe[] | PropertyIndexedKeyframes;  // WAAPI keyframes
  duration?: number;  // ms (falls back to top-level duration)
  easing?: string;    // CSS easing
  delay?: number;     // ms — use to overlap exit + enter
};
type SlideTransition = {
  duration: number;          // top-level fallback
  easing?: string;           // top-level fallback
  enter?: TransitionPhase;   // runs on incoming page
  exit?:  TransitionPhase;   // runs on outgoing page
};
```

The framework also exposes `--osd-dir` (`1` forward, `-1` backward) and `data-osd-dir` on the wrapper, so a single keyframe can mirror direction without a JS callback.

### Design principles (hold the line)

The single loudest signal of "made in PowerPoint" is six different transitions in one deck. Restraint is the rhythm.

- **Pick one DNA, hold it across the deck.** Same duration band, same easing pair, same out-then-in stagger. Variation lives only in *which property* gets the small nudge — Y, X, opacity, scale, blur.
- **Duration: 140–280 ms.** Exit 140–180 ms, enter 200–280 ms, enter delayed ~80 ms so they overlap but don't fight. Past 350 ms is video-editor territory; reserve for genuine state changes.
- **Magnitude ceiling: 12 px or 3% scale.** A 6 px Y-rise reads as "next thought." A 1920 px translateX reads as "different document." Premium tools move barely enough to register.
- **Opacity is always part of it.** Pure-transform transitions look stiff; pure-opacity transitions are the safest possible default.
- **Easing: ease-in for exit, ease-out for enter.** `cubic-bezier(0.4, 0, 1, 1)` going out, `cubic-bezier(0, 0, 0.2, 1)` coming in. Never `linear` (feels like a slideshow). Reserve symmetric `ease-in-out` for state-anchored morphs only.

### Tasteful family — six members, one DNA

Use this set as a starting point. Pick one as the deck's house transition; optionally reserve a second for hero/cover slides and a third for genuine section breaks. The CSS-`calc` + `--osd-dir` trick lets a single definition mirror itself on backward navigation when needed.

```tsx
const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN  = 'cubic-bezier(0.4, 0, 1, 1)';

// RISE — house quiet. 6 px Y. Use as module default.
export const transition: SlideTransition = {
  duration: 200,
  exit:  { duration: 140, easing: EASE_IN,
           keyframes: [
             { opacity: 1, transform: 'translateY(0)' },
             { opacity: 0, transform: 'translateY(-4px)' },
           ] },
  enter: { duration: 200, delay: 80, easing: EASE_OUT,
           keyframes: [
             { opacity: 0, transform: 'translateY(6px)' },
             { opacity: 1, transform: 'translateY(0)' },
           ] },
};

// DISSOLVE — pure opacity. The quietest possible.
const dissolve: SlideTransition = {
  duration: 240,
  exit:  { duration: 200, easing: EASE_IN,
           keyframes: [{ opacity: 1 }, { opacity: 0 }] },
  enter: { duration: 240, delay: 40, easing: EASE_OUT,
           keyframes: [{ opacity: 0 }, { opacity: 1 }] },
};

// SETTLE — cover-grade. Rise + a hair of blur on enter only.
Cover.transition = {
  duration: 280,
  exit:  { duration: 160, easing: EASE_IN,
           keyframes: [
             { opacity: 1, transform: 'translateY(0)' },
             { opacity: 0, transform: 'translateY(-6px)' },
           ] },
  enter: { duration: 280, delay: 100, easing: EASE_OUT,
           keyframes: [
             { opacity: 0, transform: 'translateY(12px)', filter: 'blur(4px)' },
             { opacity: 1, transform: 'translateY(0)',    filter: 'blur(0)'   },
           ] },
};

// BLOOM — scale 0.97 → 1, no translate. Materializes in place.
const bloom: SlideTransition = {
  duration: 240,
  exit:  { duration: 160, easing: EASE_IN,
           keyframes: [
             { opacity: 1, transform: 'scale(1)' },
             { opacity: 0, transform: 'scale(1.01)' },
           ] },
  enter: { duration: 240, delay: 80, easing: EASE_OUT,
           keyframes: [
             { opacity: 0, transform: 'scale(0.97)' },
             { opacity: 1, transform: 'scale(1)' },
           ] },
};

// FALL — mirrored Rise. Incoming page comes down from above.
const fall: SlideTransition = {
  duration: 200,
  exit:  { duration: 140, easing: EASE_IN,
           keyframes: [
             { opacity: 1, transform: 'translateY(0)' },
             { opacity: 0, transform: 'translateY(4px)' },
           ] },
  enter: { duration: 200, delay: 80, easing: EASE_OUT,
           keyframes: [
             { opacity: 0, transform: 'translateY(-6px)' },
             { opacity: 1, transform: 'translateY(0)' },
           ] },
};

// BREATH — section break. Exit fully, hold 120 ms, then enter.
// Reserve for genuine chapter dividers; use at most 1–2× per deck.
const breath: SlideTransition = {
  duration: 460,
  exit:  { duration: 180, easing: EASE_IN,
           keyframes: [{ opacity: 1 }, { opacity: 0 }] },
  enter: { duration: 240, delay: 300, easing: EASE_OUT,
           keyframes: [
             { opacity: 0, transform: 'translateY(8px)' },
             { opacity: 1, transform: 'translateY(0)' },
           ] },
};
```

All six share the same DNA — they only differ in which property carries the small nudge. The reader perceives variety; the eye still reads one consistent hand.

### Direction-aware keyframes (use sparingly)

Most tasteful tools don't mirror on backward navigation. When you genuinely need to — e.g. a horizontal slide that should reverse — use `--osd-dir` inside `calc()`:

```tsx
{ transform: 'translateX(calc(var(--osd-dir, 1) * 8px))' },
{ transform: 'translateX(0)' },
```

If you find yourself reaching for this on every transition, you're probably over-designing. Forward = backward is the more refined default.

### Shared element transitions (magic move)

When the *same visual object* exists on two adjacent pages, the runtime can morph it across the cut — position, size, border-radius, and colors interpolate in one continuous move (Keynote's "Magic Move") — instead of fading out and back in. Two parts opt in:

1. Wrap the object on **both** pages in `unstable_SharedElement` with the **same `id`**.
2. Enable `sharedElements` on the incoming page's transition.

The component is exported with an `unstable_` prefix — it works and real decks lean on it heavily, but the API surface may still change. Alias it on import.

```tsx
import { unstable_SharedElement as SharedElement } from '@open-slide/core';

// Morph transition — opacity-only enter/exit keeps all the motion on the clones (see rules).
const morph: SlideTransition = {
  duration: 280,
  exit:  { duration: 224, easing: 'cubic-bezier(0.4, 0, 1, 1)', keyframes: [{ opacity: 1 }, { opacity: 0 }] },
  enter: { duration: 308, delay: 112, easing: 'cubic-bezier(0, 0, 0.2, 1)', keyframes: [{ opacity: 0 }, { opacity: 1 }] },
  sharedElements: { duration: 868, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
};

const stage: CSSProperties = { width: '100%', height: '100%', position: 'relative', background: '#000000', overflow: 'hidden' };

const Narrow: Page = () => (
  <div style={stage}>
    <SharedElement id="pill" style={{ position: 'absolute', left: 842, top: 479, width: 236, height: 122, borderRadius: 999, background: '#ffffff' }} />
  </div>
);
const Wide: Page = () => (
  <div style={stage}>
    <SharedElement id="pill" style={{ position: 'absolute', left: 721, top: 479, width: 478, height: 122, borderRadius: 999, background: '#0a0a0a' }} />
  </div>
);

Wide.transition = morph;   // forward: Narrow → Wide morphs the pill
Narrow.transition = morph; // backward: Wide → Narrow morphs it back
```

#### Contract

- `sharedElements: true` inherits the transition's top-level `duration`/`easing`; pass `{ duration?, easing?, delay? }` to time the morph independently of the page cross-fade. Morphs usually read best 2–4× longer than the fade (e.g. 280 ms fade, 868 ms morph).
- Elements pair by `id` across the cut. A matched pair FLIP-morphs: the runtime measures both rects, clones the outgoing element into an overlay above both pages, hides the originals, and animates transform + border-radius + colors (border widths ride a separate frame so they don't stretch with the box). Keep each `id` unique within a page; don't nest one `SharedElement` inside another.
- An `id` present on only one side fades in/out **in place**. This is how "a third box joins the row" reads: carried boxes glide to their new slots, the new one materializes.
- Colors on the shared node *and its descendants* interpolate too — a label that flips black → white mid-glide just works.
- The transition lives on the **incoming** page. For a morph that also plays when stepping backward, assign the same transition object to both pages (as above).

#### Rules — each one earned on a real deck

1. **Prefer opacity-only enter/exit on morphing pages.** Any transition family composes correctly with the morph (shared rects are measured before the phases start), but while clones glide, a transform-bearing enter also slides the rest of the page — two competing motions. Giving the clones all the motion and fading everything else is what makes a magic move read as one confident gesture.
2. **Shared geometry must be deterministic at mount.** Rects are snapshotted once at the cut. Position shared elements with pixel constants — never with a value measured in an effect after mount (the re-render shifts the target mid-morph and the move jumps). If text inside a shared box grows over time (typewriter etc.), render a hidden full-width spacer so the measured box never changes size.
3. **No `transform` on the shared node itself.** A percentage translate (`translate(-50%, -50%)`) gets mis-scaled by the morph and lands the clone tens of px off. Put centering/positioning transforms on a plain wrapper `<div>` *around* the `SharedElement`.
4. **`SharedElement` merges `className`/`style` onto its single host child** (it adds no wrapper when the child is a lone DOM element). A crop box (`overflow: hidden` + fixed width) therefore needs an explicit nested `<div>` — otherwise the box collapses onto the `<img>` inside and squishes it.
5. **Gate entrance animations behind `unstable_useIsActivePage()`.** During the cut the runtime mounts a *fresh instance* of the outgoing page to snapshot its exit state (and the dev UI mounts every page for thumbnails/overview). If an intro replays there, the snapshot is mid-animation and the morph starts from garbage. The hook returns `true` only for the instance the audience is watching; every other instance (outgoing snapshot, thumbnails, overview, presenter preview, print) should render the final, settled state — no intro, full text.

   ```tsx
   import { unstable_useIsActivePage as useIsActivePage } from '@open-slide/core';

   // Inside the page component:
   const animate = useIsActivePage();
   ```

6. **Clones travel above everything.** The morph overlay sits over both pages, so an incoming element that should appear only when a clone "lands" will otherwise pop early. Give such reveals a delay equal to the morph: `animation: 'osd-fade 0.63s ease-out 0.868s both'` where `0.868s` is `sharedElements.duration`. Keep that number in one shared const so the two can't drift.
7. **A "hold" page is a separate component.** Transitions attach to the incoming page, so to follow a morph cut with a plain cut of the same content, mint a second page component without `.transition` (e.g. `const Flow4Hold: Page = () => <Flow count={4} />`).

#### When to reach for it

Magic move is for **state continuity**: a toggle whose thumb slides to the next option, a card that expands into a detail view, a logo that glides from center stage into the next page's diagram, a row that gains one more box. The object *is the story* across the cut. Don't morph decoration, and don't tag elements "just in case" — every shared id is a promise to the audience that it's the same object. One or two morphing sequences per chapter is plenty; the surrounding pages should cut or fade quietly.

### Transition anti-patterns

- ❌ Six different transitions across six pages — the single loudest "made in PowerPoint" tell.
- ❌ `translateX(100%)` slide-from-side — iOS modal / PowerPoint Push; not a slide change.
- ❌ Aggressive scale-pop (e.g. `0.85 → 1`) + blur — lightbox / photo-viewer vocabulary; implies zooming *into* something.
- ❌ `clip-path: inset(…)` reveals — After Effects vocabulary; theatrical.
- ❌ Parallel blur on both layers at once — visual mush; the eye can't fixate.
- ❌ Duration > 350 ms for a standard slide change — drags.
- ❌ Translate > 12 px or scale > 3% — reads as rupture, not continuity.
- ❌ `linear` easing — feels like a slideshow, not a product.
- ❌ Declaring a transition on every deck. **If you don't have a clear reason, omit it.** Snap-swap is fine.

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
- [ ] If a `SlideTransition` is declared, every page sits in one family — same duration band (140–280 ms), same easing pair, same out-then-in stagger, magnitude under 12 px / 3%. No six-different-vocabularies decks. When in doubt, omit transitions entirely.
- [ ] If a transition opts into `sharedElements`: every shared `id` is unique per page and stable across the pair, shared geometry is pixel-constant (never measured after mount), no `transform` sits on the shared node, and entrance animations are gated behind `unstable_useIsActivePage()`.
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
- ❌ Sprinkling `<ImagePlaceholder>` across pages "for visual interest". Placeholders are for content the user owns; they're not stock-photo slots.
- ❌ Using a placeholder for an icon or decorative shape — those are typography/SVG problems, not asset problems.
- ❌ Rendering visually repeated elements with `array.map(...)` over a data array. Define a component and instantiate it explicitly per item (`<Card />`, `<Card />`, `<Card />`) so the inspector can edit each independently — a shared `map` body mutates every instance at once.
- ❌ Wrapping every page's content in `<Step>` reflexively. Stepped reveals are for content whose *order* is the point; a glance-and-get-it page (hero title, single quote, diagram) is stronger shown whole.
- ❌ A `<Step>` that isn't a direct child of `<Steps>` (nested deeper, or with no `<Steps>` parent). It renders fully revealed and defers nothing — the reveal silently does nothing.
