# open-slide (apps/demo dev server) — exploration harvest

## What the app is

open-slide is a slide framework for coding agents: decks are authored as React
components under `apps/demo/slides/<deck>/index.tsx` and viewed in a local dev
viewer (Vite, `pnpm dev` in `apps/demo`, http://localhost:5173). Audience for a
demo of it: developers who write decks with an agent, and PR reviewers of the
framework itself.

Routes: `/` (deck gallery) · `/s/:slideId` (viewer) · `/s/:slideId/presenter` ·
`/themes` · `/assets`. `slideId` is the folder name under `apps/demo/slides/`.

## Hero candidates

- **KEPT — inline text editing (PR #424).** Click any text run on a slide in the
  plain view and you are editing it: caret at the click point, floating toolbar
  (size ± and numeric field, bold, italic, colour, left/center/right), ⌘B/⌘I,
  Escape to leave, Save writes the change back into the deck's `.tsx` source.
  Legible at 1080p, entirely capturable, and it is the PR's whole story.
- Rejected — the deck gallery / theme browsing: pretty but says nothing about
  what a user can now DO.
- Rejected — present mode: unrelated to the change under review.

## Deck used: `open-slide-on-replit`, page 1

Chosen because page 1 is a clean cover: a two-line 164px headline, a 42px
paragraph, and a bullet row. Big type reads at any zoom, and there are two
distinct text runs to prove the session moves between them.

## Verified selector map (page 1 of `/s/open-slide-on-replit`)

`data-slide-loc` is `line:column` in the deck source, and the SAME attribute is
rendered on the page-rail thumbnails — always scope to the canvas:

| target | selector / name |
| --- | --- |
| headline line 1 ("Build slides") | `[data-inspector-root] [data-slide-loc="371:10"]` |
| headline line 2 ("inside Replit.") | `[data-inspector-root] [data-slide-loc="384:10"]` |
| subtitle paragraph | `[data-inspector-root] [data-slide-loc="399:8"]` |
| toolbar size field | accessible name `Size` (text input) |
| toolbar − / + | `Decrease font size` / `Increase font size` |
| toolbar bold / italic | `Bold` / `Italic` |
| toolbar alignment | `left` / `center` / `right` (NOT localized — raw values) |
| toolbar colour | `input[type=color]`, no accessible name |
| save bar | button text `Save` (and `Discard`) |

## Content answers

- The floating toolbar is `[data-inspector-ui]`, so clicks on it never leak to
  the slide and never end the editing session.
- `type` with `clear: true` works on the contenteditable anchor (the runtime
  selects the node contents in-page, not via ⌘A) — the headline is replaced
  wholesale, which films well.
- Typing `200` into the `Size` field only commits on Enter/blur, so the resize
  is a separate, well-timed payoff beat.
- The headline is already `font-weight: 700`; clicking Bold there UN-bolds it
  and looks broken. Do weight beats on the 42px paragraph instead.

## Hazards

- **A `Save` beat writes to the user's real source file.** It rewrites
  `apps/demo/slides/open-slide-on-replit/index.tsx` (and collapses the edited
  JSX element onto one line, which SHIFTS every later `data-slide-loc`).
  `git checkout --` that file before every re-`make`, or the plan's selectors
  point at the wrong nodes.
- **~3s of FOIT at the head of every capture.** The deck `@import`s Inter from
  fonts.googleapis.com; where that host is unreachable Chrome's 3s block period
  leaves the slide BLANK. Budget a leading `wait` of ~5s and head-trim with
  `startMs` (~4400 for this take) or the video opens on a white screen.
- Playwright-style Chromium (`OPEN_TAKE_CHROME=/opt/pw-browsers/chromium-*/
  chrome-linux/chrome`) ships no H.264 decoder: `make` retries the render with a
  VP9 intermediate on its own, but `render` crashed instead in open-take 0.4.1.
- The colour swatch opens the OS-native colour dialog — not drivable headless.
- Inspect mode enters editing on DOUBLE-click; the capture vocabulary has no
  double-click verb, so only the plain-view single-click entry is filmable.
