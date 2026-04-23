---
name: create-slide
description: Use this skill when the user wants to create, draft, author, or generate new slides / a presentation in this open-slide repo. Triggers on phrases like "make slides about X", "create a presentation", "draft slides for", "new slide", "投影片", "簡報", or when the user asks to add content under `slides/`. Do NOT use for editing the framework itself — only for authoring content inside `slides/<id>/`.
---

# Create a slide in open-slide

This skill owns the **workflow** for drafting a new deck. The technical reference — file contract, 1920×1080 canvas, type scale, palette, layout, assets — lives in the **`slide-authoring`** skill. Read that skill whenever you need details on *how* a page is structured. This skill assumes you'll consult it before writing code.

You only write files under `slides/<id>/`. Never modify `package.json`, `open-slide.json`, or existing slides.

## Step 1 — Clarify requirements (MUST ask before writing code)

**Before doing anything else, call `AskUserQuestion` to confirm the four key style decisions below.** These shape every downstream choice (layout, type scale, asset needs, motion code), so locking them in up front avoids rework. Only skip a question when the user's original message already gave an unambiguous answer for it — and if you skip, restate your assumption so they can correct it.

Ask these four in a single `AskUserQuestion` call (multi-question form):

1. **主題風格 / Topic & aesthetic** — what is this slide about, and what visual direction? Offer options like: minimal editorial, playful, corporate-clean, retro, brutalist, soft/pastel, dark neon. If they have no preference, propose one.
2. **頁數篇幅 / Page count** — rough length. Offer brackets: 3–5 (short), 6–10 (standard), 11–20 (deep dive), custom.
3. **每頁文字多寡 / Text density per page** — how much copy lives on each page? Offer: 極簡 (one line / big number), 精簡 (heading + 2–3 bullets), 標準 (heading + 4–5 bullets or short paragraph), 密集 (multi-column / detailed). This directly drives type scale and layout.
4. **動畫 vs 靜態 / Motion** — does the user want CSS/React animations and transitions, or a fully static deck? Offer: 靜態 (no motion), 輕動畫 (subtle fades / entrance only), 豐富動畫 (keyframes, staggered reveals, looping visuals). If animated, plan to use CSS `@keyframes` / inline `style` + `useEffect`; no extra libraries.

After those four, ask follow-ups **only if still unclear**: audience, any drafted outline/content, brand colors, required assets. Don't pad the conversation with questions already answered.

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

Pick one coherent palette / type scale / aesthetic and hold it across every page. The full set of constraints (palette structure, type scale, padding, aesthetic options) lives in `slide-authoring` — apply it.

Consult the `frontend-design` skill for deeper aesthetic guidance if the user wants something bold.

## Step 5 — Write `slides/<id>/index.tsx`

Read the **`slide-authoring`** skill before writing — it covers the file contract, canvas rules, type scale, spacing, and asset imports, and it includes a starter template you can copy. Don't duplicate that knowledge here; use it.

## Step 6 — Self-review

Run the checklist in `slide-authoring` ("Self-review before finishing"). It covers structural correctness, layout discipline, and asset existence.

## Step 7 — Hand off to the user

Tell the user:

- The slide id and file path you created.
- That the dev server will hot-reload — they can open `http://localhost:5173/s/<id>` (or refresh the home page).
- If dev isn't running: `pnpm dev` from the repo root.

Don't run the dev server yourself unless asked.
