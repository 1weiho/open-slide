---
name: current-slide
description: Resolve which slide, page, and (optionally) selected element the user is currently viewing in the open-slide dev server. Consult this whenever the user references "this page", "this slide", "this element", "the slide I'm on", "the current page", or any deictic reference to slide content without naming it. Re-read `node_modules/.open-slide/current.json` at the start of every such turn — the user navigates between turns, so a value you read earlier in the conversation is almost certainly stale.
---

# Where is the user right now?

When the user says "fix this page", "tweak this heading", or "the slide I'm looking at", they almost never name the slide id, page number, or element — they mean wherever they are in the dev viewer. Before asking "which slide?" or "which element?", check the file the dev server writes on every navigation and inspector pick.

## Re-read on every deictic turn — never reuse a prior read

`current.json` is a live cursor, not a fact about the conversation. The user moves between slides, pages, and elements freely between your turns — including while you were doing other work. **Read the file fresh at the start of every new turn that uses a deictic reference**, even if:

- you already read it earlier in this same conversation,
- you just finished editing the slide it pointed to,
- the user's new message sounds like a continuation ("now make it bigger", "also fix this one", "keep going").

A "continue editing" follow-up is exactly the case where the user has likely just navigated to a different slide or picked a different element. Trusting your last read here will silently edit the wrong file. Re-read, compare `slideId` / `pageIndex` / `selection` against what you used last time, and act on the new values.

## How to read it

```
node_modules/.open-slide/current.json
```

Path is relative to the project root (the user's `cwd`, the directory that contains `slides/` and `package.json`). Use the `Read` tool. The file is JSON.

## What you get

```json
{
  "slideId": "q2-roadmap",
  "pageIndex": 2,
  "pageNumber": 3,
  "totalPages": 8,
  "slideTitle": "Q2 Roadmap",
  "view": "slides",
  "pagePath": "slides/q2-roadmap/index.tsx",
  "selection": {
    "line": 42,
    "column": 6,
    "tagName": "h1",
    "text": "Q2 Roadmap"
  },
  "updatedAt": "2026-05-09T14:32:11.123Z"
}
```

- `slideId` — folder name under `slides/`. Use as-is for any `/__slides/<id>/...` API or as the URL segment.
- `pageIndex` — 0-based, for use with the page array in `index.tsx` (`export default [Cover, Body, ...]`).
- `pageNumber` — 1-based, for use in messages to the user ("page 3 of 8") and for the URL `?p=N`.
- `pagePath` — relative path to the slide source. Hand straight to `Read` / `Edit`.
- `view` — `"slides"` (canvas view) or `"assets"` (asset manager). If `"assets"`, the user is browsing files for that slide rather than viewing a page.
- `selection` — `null` if nothing is selected. Otherwise, the JSX element the user picked in the inspector overlay:
  - `line` (1-indexed) and `column` (0-indexed) point to the JSX opening tag inside `pagePath`. This is the canonical handle — match against the source line, not the rendered DOM.
  - `tagName` is the rendered DOM tag, lowercased (`"h1"`, `"div"`, `"img"`).
  - `text` is a trimmed text snippet (≤120 chars) from the element's `textContent`, useful as a sanity check that you're looking at the right node.
  - Selection auto-clears whenever the user navigates to a different slide or page.
- `updatedAt` — ISO timestamp of the last navigation or selection change. Use it to detect staleness.

## When to use this

- The user references the current slide/page deictically: "this", "here", "the page I'm on", "the slide I'm looking at", "what I'm working on".
- The user references a specific element: "this heading", "this image", "the button I just clicked", "tighten this", "change the color of this". If `selection` is non-null, that's the element they mean.
- Before asking "which slide?" or "which element?" as a clarifying question — check this file first.
- Before guessing from `git log`, recently-edited files, or the most recent slide folder.

## When NOT to use this

- The user names a slide explicitly ("edit `q2-roadmap`") — use that name directly.
- The `apply-comments` workflow already finds the right file via `@slide-comment` markers; it doesn't need this skill.
- For listing or discovering slides — read `slides/` directly.

## Staleness — verify before acting

`updatedAt` is the last time the user navigated. Treat it like a cache:

- **Fresh (under ~5 minutes old)**: trust it. Open `pagePath`, do the work.
- **Older than ~5 minutes**: confirm with the user before editing. The dev server may not be running; the user may have switched contexts.
- **Hours/days old**: ignore it. Ask the user which slide they mean.

A *newer* `updatedAt` than the one you saw last turn is the normal signal that the user has moved — switch to the new `slideId` / `pageIndex` / `selection` without asking.

## When the file is missing

- The dev server hasn't been opened on a slide yet, or has never run.
- Don't create the file or guess. Ask the user which slide they mean, or suggest they open the slide in the dev server first.

## Example — page-level reference

User: "tighten the spacing on this page"

1. Read `node_modules/.open-slide/current.json`.
2. Check `updatedAt` is recent.
3. Read `pagePath` (e.g. `slides/q2-roadmap/index.tsx`).
4. Identify the page at `pageIndex` in the default-exported array.
5. Consult the `slide-authoring` skill for spacing rules, then edit that page in place.

If `current.json` is missing or stale, ask: "Which slide and page should I tighten? The dev server hasn't published a current page recently."

## Example — element-level reference

User: "make this bigger"

1. Read `node_modules/.open-slide/current.json`.
2. If `selection` is non-null, the user means that element. Read `pagePath`, jump to `selection.line`, and find the JSX opening tag near that line/column. Confirm with the snippet in `selection.text` and the `tagName`.
3. Consult `slide-authoring` for type-scale and layout rules before editing.
4. Edit the JSX node in place.

If `selection` is null, fall back to the page-level flow above — and consider asking "which element?" since the user used a deictic but hasn't picked one in the inspector.
