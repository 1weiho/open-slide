---
name: create-slide
description: Use this skill when the user wants to create, draft, author, or generate new slides / a presentation in this open-slide repo. Triggers on phrases like "make slides about X", "create a presentation", "draft slides for", "new slide", or when the user asks to add content under `slides/`. Do NOT use for editing the framework itself — only for authoring content inside `slides/<id>/`.
---

# Create a slide in open-slide

This skill owns the **workflow** for drafting a new deck. The technical reference — file contract, 1920×1080 canvas, type scale, palette, layout, assets — lives in the **`slide-authoring`** skill. Read that skill whenever you need details on *how* a page is structured. This skill assumes you'll consult it before writing code.

You only write files under `slides/<id>/`. Never modify `package.json`, `open-slide.json`, or existing slides.

## Step 1 — Pick a theme

List files under `themes/`. If any theme markdown files exist (anything other than `README.md`), call `AskUserQuestion` with each theme id as an option plus a final **"no theme — design from scratch"** option.

- If the user picks a theme: read `themes/<id>.md` end-to-end. The theme's palette, typography, layout, and Title/Footer components are now authoritative — copy them directly into the slide. In Step 2, you can skip the **topic & aesthetic** question (the theme already commits to one direction); still ask about page count, text density, and motion since those are independent of theme.
- If the user picks "no theme", or `themes/` is empty (or contains only `README.md`): proceed to Step 2 unchanged.

If you skip the aesthetic question because a theme was picked, restate the theme name in Step 2 so the user can correct course before you start writing.

## Step 2 — Clarify requirements (MUST ask before writing code)

**Before doing anything else, call `AskUserQuestion` to confirm the four key style decisions below.** These shape every downstream choice (layout, type scale, asset needs, motion code), so locking them in up front avoids rework. Only skip a question when the user's original message already gave an unambiguous answer for it — and if you skip, restate your assumption so they can correct it.

Ask these four in a single `AskUserQuestion` call (multi-question form):

1. **Topic & aesthetic** — what is this slide about, and what visual direction? Offer options like: minimal editorial, playful, corporate-clean, retro, brutalist, soft/pastel, dark neon. If they have no preference, propose one.
2. **Page count** — rough length. Offer brackets: 3–5 (short), 6–10 (standard), 11–20 (deep dive), custom.
3. **Text density per page** — how much copy lives on each page? Offer: minimal (one line / big number), light (heading + 2–3 bullets), standard (heading + 4–5 bullets or short paragraph), dense (multi-column / detailed). This directly drives type scale and layout.
4. **Motion** — does the user want CSS/React animations and transitions, or a fully static deck? Offer: static (no motion), subtle (fades / entrance only), rich (keyframes, staggered reveals, looping visuals). If animated, plan to use CSS `@keyframes` / inline `style` + `useEffect`; no extra libraries.

After those four, ask follow-ups **only if still unclear**: audience, any drafted outline/content, brand colors, required assets. Don't pad the conversation with questions already answered.

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

## Step 5 — Commit to a visual direction

Pick one coherent palette / type scale / aesthetic and hold it across every page. The full set of constraints (palette structure, type scale, padding, aesthetic options) lives in `slide-authoring` — apply it.

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
