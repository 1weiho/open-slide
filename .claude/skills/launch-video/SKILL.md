---
name: launch-video
description: Build a new open-slide launch film in apps/marketing/launch-video from just a feature name. Researches the feature in the repo, scaffolds films/<id>, storyboards it, writes the scenes, score, and sound cues, and verifies with rendered stills. Use when asked for a launch video, launch film, trailer, teaser, or promo clip for an open-slide feature or release.
---

# Launch video

The user names a feature ("make a launch video for comments"). You deliver a finished film in `apps/marketing/launch-video/films/<id>/` that previews in the studio and renders to MP4, with its soundtrack. Work autonomously. Ask only if the repo has no trace of the feature.

Read [reference.md](reference.md) before writing scenes. It lists every helper, UI mock, sound effect, and instrument. For craft, `films/open-slide-2/scenes/` is the reference film: `hook.js` (cursor + selection on a dark stage), `editor.js` (full editor walkthrough), `pptx.js` (export flow), `ui.js` (home + command menu), `finale.js` (feature wall + lockup).

## 1. Research the feature

Find out what the user does, what they see, and the single moment that sells it.

- `git log --oneline -i --grep "<keyword>"`, then read the relevant diffs.
- `.changeset/*.md` and `packages/core/CHANGELOG.md` for the user-facing wording.
- `packages/core/src/app/components/**` for the UI, and `packages/core/src/locale/` for its exact strings.
- `apps/web` for any existing marketing copy about it.

Write down: the feature's name, a one-line value prop (the tagline), the 3–6 on-screen steps of the interaction, and the payoff moment.

## 2. Storyboard

Post a short beat sheet in chat, then continue without waiting. A single-feature film runs 20–40 s at 120 BPM (a beat is 0.5 s, a bar is 2 s):

| Chapter | Typical length | Content |
| --- | --- | --- |
| `intro` | ~4 s | "New in open-slide" + feature name; the first hit lands on a bar line. |
| demo chapters (1–3) | 8–25 s | The real interaction, step by step, in a recreation of the actual UI. One idea per chapter. Enter each with a `card`. |
| `outro` | ~6 s | Lockup, the tagline, a CTA command, open-slide.dev, and a fade to black. |

Put big moments (hits, reveals, clicks that matter) on beats. Put the biggest ones on bar lines (whole multiples of 2 s). Leave each result on screen about a beat before moving on.

## 3. Scaffold

```bash
pnpm --filter launch-video new <id> --feature "<Feature Name>" --tagline "<value prop>"
```

`<id>` is short kebab-case (`comments`, `live-reload`). This copies `templates/film`, a working 20 s intro → feature → outro, into `films/<id>/`. Nothing needs registering: the studio, `render`, and `stills` discover `films/*/film.js`.

**Before editing anything under `src/` or `audio/`** (shared by every film), record the other films' key frames:

```bash
pnpm --filter launch-video snapshot --save
```

## 4. Build

Files in `films/<id>/`:

- `copy.js`: all on-screen words. Keep copy short, concrete, and in the product's voice.
- `timeline.js`: set `DURATION`, the chapter list for `sequence()`, and `HITS` (camera shake + flash; pair each with an `impact` or `slam` cue).
- `film.js`: import every scene in z-order (later scenes sit above earlier ones). Set `poster` to a frame that shows the feature. Add any extra Google Fonts to `fonts`.
- `scenes/*.js`: one per chapter. Replace the template's `feature.js` placeholder with the real demo. Split long demos into more scenes and add them to the chapter list.
- `score.js`: shape the music to the chapters. Build tension into hits, thin it out under dense UI moments, and resolve on the outro.

### Scene rules

These are what make parallel, out-of-order rendering possible. Breaking one shows up as flicker or mismatched frames.

- `update(state, t, T)` must set every animated property from time alone. `t` is seconds since the scene's span start, and `T` is film time. Write cue times as absolute film seconds in a `CUE` object and use `T`, so the visuals and the `sfx` list share constants.
- No `Math.random`, `Date`, `performance.now`, CSS transitions/animations, or state carried between frames. Use `rng`/`hash`/`noise1` from `#lib/rand.js` for variation.
- Build the DOM once in `build(root)` and measure there (`rectIn`, `offsetWidth`). Write styles in `update` with `set`/`text`/`attr`, which skip unchanged values.
- No DOM access at module top level: `audio/synth.mjs` imports scenes in Node for their `sfx` lists.
- A scene that enters as a `card` needs an opaque full-frame background on its root.
- Stage is 1920 × 1080. Text must stay legible at 960 × 540 (the draft size), so nothing below ~20 px on a dark stage.
- Only local assets: fonts come from `film.fonts`. Images go in `films/<id>/assets/` (served as `/films/<id>/assets/…`) or come from the repo via `/@repo/<path>`.

### Recreating UI

The film shows the real product, so mocks must match it.

1. Reuse `src/ui/*` first: `slideViewer` (editor window with toolbar, rail, format panel, save bar), `homeView`/`commandMenu`, export pieces, `codeEditor`, `cursor`, `selection`/`guides`, `keycap`, `icon`. Pass a custom `slide` to `slideViewer` for different slide content.
2. For UI that doesn't exist yet, read the core component and copy its layout, spacing, colors (`LIGHT`/`DARK`/`SHADOW` in `#theme` mirror core's tokens), and locale strings. A generic piece of product UI goes in `src/ui/` so later films can reuse it. Film-only props go in `films/<id>/ui/`.
3. Icons are Lucide. If one is missing from `src/ui/icon-data.js`, copy its `__iconNode` from `packages/core/node_modules/lucide-react/dist/esm/icons/<name>.mjs` (drop the `key` fields).
4. When a shared module needs new behavior, add an option with a default that keeps today's output. Don't change existing defaults.

### Sound

Each scene's `sfx` is a list of `[T, type, gain?, opts?]`. Cue every visible action: cursor clicks (`click`), typing (`type`, one per character), panels (`slide`), elements appearing (`pop`), landings (`thud`), successes (`success`), and big moves (`whoosh`). Build into hits with `riser` and land them with `impact`. Card transitions get their whoosh automatically. Keep gains around 0.4–1. Stacked cues get loud fast.

## 5. Verify

Render stills at every cue that matters: the first and last frames of each chapter, each transition midpoint, each hit, and the payoff.

```bash
pnpm --filter launch-video stills <id> 1.5,4,6.2,9,14,16.4
```

Then Read each PNG in `out/<id>/stills/`. Check alignment against the real UI, text overflow, elements hidden behind the cursor, empty frames, and whether each step reads without narration. Iterate until every still is clean.

If you touched `src/` or `audio/`:

```bash
pnpm --filter launch-video snapshot
```

Every other film must report `unchanged`. If one changed, make your change opt-in instead.

Last, confirm it encodes. This is fast, and the draft lands in the studio:

```bash
pnpm --filter launch-video render:draft <id>
```

## 6. Finish

- Run `pnpm check` from the repo root (Biome). No changeset: `apps/*` doesn't need one.
- Don't start the studio or run the full master render yourself. Tell the user:
  - Preview: `pnpm dev:video` → `http://127.0.0.1:5180/#/<id>/composition`
  - Master: `pnpm --filter launch-video render <id>` (`--scale 2` for 4K)
- Report the storyboard as built (chapter, time, beat), and anything about the feature you had to guess.
