---
name: create-slide
description: Use this skill when the user wants to create, draft, author, or generate new slides / a presentation in this open-slide repo. Triggers on phrases like "make slides about X", "create a presentation", "draft slides for", "new slide", or when the user asks to add content under `slides/`. Do NOT use for editing the framework itself — only for authoring content inside `slides/<id>/`.
---

# Create a slide in open-slide

This skill owns the **workflow** for drafting a new deck. The technical reference — file contract, 1920×1080 canvas, type scale, palette, layout, assets — lives in the **`slide-authoring`** skill. Read that skill whenever you need details on *how* a page is structured. This skill assumes you'll consult it before writing code.

You only write files under `slides/<id>/`. Never modify `package.json`, `open-slide.config.ts`, or existing slides.

## Step 1 — Pick a theme

List files under `themes/`. If any theme markdown files exist (anything other than `README.md`), call `AskUserQuestion` with each theme id as an option plus a final **"no theme — design from scratch"** option.

- If the user picks a theme: read `themes/<id>.md` end-to-end. The theme's palette, typography, layout, and Title/Footer components are now authoritative — copy them directly into the slide. **Also set `theme: '<theme-id>'` on the `meta` export in `index.tsx`** (e.g. `export const meta: SlideMeta = { title: '…', theme: '<theme-id>' };`) so the slide back-links to the theme (chip on the slide card + listing on `/themes/<id>`). In Step 2, skip the **aesthetic direction** question (the theme already commits to one direction); you still need the topic itself, so confirm it before moving on. Page count, text density, and motion are independent of theme — ask those normally.
- If the user picks "no theme", or `themes/` is empty (or contains only `README.md`): proceed to Step 2 unchanged.

If you skip the aesthetic question because a theme was picked, restate the theme name in Step 2 so the user can correct course before you start writing.

## Step 2 — Clarify requirements (MUST ask before writing code)

**Before writing any code, lock in the four key style decisions below via `AskUserQuestion`.** They shape every downstream choice (layout, type scale, asset needs, motion code), so locking them in up front avoids rework. Only skip a question when the user's original message already gave an unambiguous answer for it — and if you skip, restate your assumption so they can correct it.

**Topic comes first.** A meaningful aesthetic recommendation requires knowing what the deck is about. If the user's initial request is thin ("make me a deck", "draft some slides"), make a *separate* `AskUserQuestion` call first to gather topic, audience, and any draft outline. Skip this only if the topic is already clear from the user's message — in which case restate your reading of the topic in the next call so they can correct course.

Then ask these four in a single `AskUserQuestion` call (multi-question form):

1. **Aesthetic direction** — propose 3 visual directions tailored to *this* topic. Do **not** pull from a fixed preset list. Each option must combine a vibe word + a concrete visual cue (palette, typography, motif) so the user can picture it; bare labels like "minimal" or "corporate" alone are too vague. The three options should feel meaningfully different from each other — not three flavors of the same idea.

   How options should shift with topic:
   - *"Intro to Rust for backend engineers"* → **rust-orange technical editorial** (warm rust/charcoal, mono headings, code-grid layout) · **blueprint dev-doc** (cyan grid on near-black, monospace, schematic feel) · **brutalist terminal** (lime-on-black, ASCII rules, no-nonsense)
   - *"Q2 product roadmap for stakeholders"* → **calm corporate clean** (off-white, single accent, generous whitespace) · **confident editorial** (large display serif, tight grid, one bold accent) · **data-forward dashboard** (charts as hero, muted neutrals + status colors)
   - *"Kindergarten parent night"* → **playful crayon** (paper texture, hand-drawn accents, primary colors) · **soft pastel storybook** (peach/mint, rounded type, illustrated icons) · **warm photo-led** (full-bleed kid photos, simple captions)

   Mark the option that best fits the topic and audience as "(Recommended)" so the user has a sensible default. (`AskUserQuestion` already auto-adds "Other" — don't add a generic catch-all yourself.)

2. **Page count** — rough length. Offer brackets: 3–5 (short), 6–10 (standard), 11–20 (deep dive), custom.
3. **Text density per page** — how much copy lives on each page? Offer: minimal (one line / big number), light (heading + 2–3 bullets), standard (heading + 4–5 bullets or short paragraph), dense (multi-column / detailed). This directly drives type scale and layout.
4. **Motion** — does the user want CSS/React animations and transitions, or a fully static deck? Offer: static (no motion), subtle (fades / entrance only), rich (keyframes, staggered reveals, looping visuals). If animated, plan to use CSS `@keyframes` / inline `style` + `useEffect`; no extra libraries.

After those four, ask follow-ups **only if still unclear**: brand colors, required assets. Don't pad the conversation with questions already answered.

## Step 3 — Pick a slide id

Use **kebab-case**, short, descriptive. Examples: `rust-intro`, `q2-roadmap`, `team-offsite-2026`. Check `slides/` to avoid collisions.

## Step 4 — Plan the structure

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

If the deck topic naturally calls for specific real images the user must supply (product screenshots, team photos, customer dashboards), plan where those go and use `<ImagePlaceholder>` from `@open-slide/core` — see the **Image placeholders** section in `slide-authoring`. Default is **no placeholders**: only insert one when a real image is genuinely required.

## Step 5 — Commit to a visual direction

Pick one coherent palette / type scale / aesthetic and hold it across every page. The full set of constraints (palette structure, type scale, padding, aesthetic options) lives in `slide-authoring` — apply it.

**Default: declare a top-level `export const design: DesignSystem = { … }`** at the top of `index.tsx` (after imports) using the chosen palette / type scale, and reference the values via `var(--osd-X)` from inline styles. This keeps the slide tweakable from the Design panel after generation, which is what the user almost always wants. Only skip the `design` const for a one-off slide whose palette is intentionally locked and not meant to be re-themed — in that case, fall back to the local `palette` constants pattern. The "Design system" section of `slide-authoring` covers the format and available tokens.

Consult the `frontend-design` skill for deeper aesthetic guidance if the user wants something bold.

## Step 6 — Write `slides/<id>/index.tsx`

Read the **`slide-authoring`** skill before writing — it covers the file contract, canvas rules, type scale, spacing, and asset imports, and it includes a starter template you can copy. Don't duplicate that knowledge here; use it.

## Step 7 — Self-review

Run the checklist in `slide-authoring` ("Self-review before finishing"). It covers structural correctness, layout discipline, and asset existence.

## Step 8 — Hand off to the user

Tell the user:

- The slide id and file path you created.
- That the dev server will hot-reload — they can open `http://localhost:5173/s/<id>` (or refresh the home page).
- If dev isn't running: `pnpm dev` from the repo root.

Don't run the dev server yourself unless asked.
