# Page transitions (`SlideTransition`)

The framework can run an enter/exit animation between every slide change. There's **no default** — pages snap unless you declare a `SlideTransition`. Snap-swap is a perfectly tasteful default; only opt in when motion adds something.

`prefers-reduced-motion: reduce` is honored automatically. You don't write a fallback.

(For morphing a shared element across two pages — Keynote's "Magic Move" — see `morph.md`, which builds on the contract here.)

## Contract

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
  delay?: number;     // ms
};
type SlideTransition = {
  duration: number;          // top-level fallback
  easing?: string;           // top-level fallback
  enter?: TransitionPhase;   // runs on incoming page
  exit?:  TransitionPhase;   // runs on outgoing page — opacity is held at 1 (see below)
  morph?: boolean | MorphTransition;  // shared-element morph — see morph.md
  throughBackground?: boolean;        // let exit fade out and dip through --osd-bg
};
type MorphTransition = {
  duration?: number;
  easing?: string;
  delay?: number;
};
```

The framework also exposes `--osd-dir` (`1` forward, `-1` backward) and `data-osd-dir` (`"forward"` / `"backward"`) on the wrapper, so a single keyframe can mirror direction without a JS callback.

## How the layers stack (read this before writing an `exit`)

During a cut the outgoing page and the incoming page are stacked in one container painted `--osd-bg`, incoming on top. Every page root fills the canvas and paints its own background, so as long as the outgoing page stays opaque, **the incoming page simply fades in over it and the container colour is never seen**.

An exit that fades to `opacity: 0` breaks that: for the stretch where the old page is already transparent and the new one isn't yet opaque, the container shows through. On a deck whose pages all match `--osd-bg` this is invisible; on any page with its own background (a white chapter, a gradient, a full-bleed photo) it reads as a dip to black or a flash. Because this is never what you want by accident, **the framework ignores `opacity` in `exit` keyframes** — the outgoing page holds at full opacity while `transform` / `filter` still apply.

- Put the fade on `enter`. The exit is a hold (or a transform-only nudge).
- Don't delay `enter` — a delay just leaves the old page sitting there for that long.
- Keep exit transforms tiny or skip them: a translated outgoing page exposes a strip of `--osd-bg` along one edge until the incoming page covers it.
- If you genuinely want a dip through the background (a section break that goes to black), set `throughBackground: true` on that transition. Exit keyframes then run as written. Only do this where the pages on both sides share `--osd-bg`.

## Design principles (hold the line)

The single loudest signal of "made in PowerPoint" is six different transitions in one deck. Restraint is the rhythm.

- **Pick one DNA, hold it across the deck.** Same duration band, same easing pair, same hold-then-fade-in shape. Variation lives only in *which property* gets the small nudge on enter — Y, X, scale, blur.
- **Duration: 200–280 ms.** One number for the whole cut; the exit holds for the same duration so the two layers release together. Past 350 ms is video-editor territory; reserve for genuine state changes.
- **Magnitude ceiling: 12 px or 3% scale.** A 6 px Y-rise reads as "next thought." A 1920 px translateX reads as "different document." Premium tools move barely enough to register.
- **Opacity is always part of enter.** Pure-transform enters look stiff; a pure-opacity enter is the safest possible default.
- **Easing: ease-out for enter.** `cubic-bezier(0, 0, 0.2, 1)`. Never `linear` (feels like a slideshow). Reserve symmetric `ease-in-out` for state-anchored morphs only.

## Tasteful family — six members, one DNA

Use this set as a starting point. Pick one as the deck's house transition; optionally reserve a second for hero/cover slides and a third for genuine section breaks. Every member holds the outgoing page and fades the incoming one in on top, so none of them can flash the container background.

```tsx
const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN  = 'cubic-bezier(0.4, 0, 1, 1)';
const HOLD: Keyframe[] = [{ opacity: 1 }, { opacity: 1 }];

// RISE — house quiet. 6 px Y. Use as module default.
export const transition: SlideTransition = {
  duration: 260,
  exit:  { duration: 260, easing: EASE_IN, keyframes: HOLD },
  enter: { duration: 260, easing: EASE_OUT,
           keyframes: [
             { opacity: 0, transform: 'translateY(6px)' },
             { opacity: 1, transform: 'translateY(0)' },
           ] },
};

// DISSOLVE — pure opacity. The quietest possible.
const dissolve: SlideTransition = {
  duration: 240,
  exit:  { duration: 240, easing: EASE_IN, keyframes: HOLD },
  enter: { duration: 240, easing: EASE_OUT,
           keyframes: [{ opacity: 0 }, { opacity: 1 }] },
};

// SETTLE — cover-grade. Rise + a hair of blur on enter only.
Cover.transition = {
  duration: 280,
  exit:  { duration: 280, easing: EASE_IN, keyframes: HOLD },
  enter: { duration: 280, easing: EASE_OUT,
           keyframes: [
             { opacity: 0, transform: 'translateY(12px)', filter: 'blur(4px)' },
             { opacity: 1, transform: 'translateY(0)',    filter: 'blur(0)'   },
           ] },
};

// BLOOM — scale 0.97 → 1, no translate. Materializes in place.
const bloom: SlideTransition = {
  duration: 240,
  exit:  { duration: 240, easing: EASE_IN, keyframes: HOLD },
  enter: { duration: 240, easing: EASE_OUT,
           keyframes: [
             { opacity: 0, transform: 'scale(0.97)' },
             { opacity: 1, transform: 'scale(1)' },
           ] },
};

// FALL — mirrored Rise. Incoming page comes down from above.
const fall: SlideTransition = {
  duration: 260,
  exit:  { duration: 260, easing: EASE_IN, keyframes: HOLD },
  enter: { duration: 260, easing: EASE_OUT,
           keyframes: [
             { opacity: 0, transform: 'translateY(-6px)' },
             { opacity: 1, transform: 'translateY(0)' },
           ] },
};

// BREATH — section break. Exit fully, hold 120 ms, then enter.
// The one member that dips through --osd-bg on purpose, so it opts in with
// `throughBackground`. Use only between pages that share the deck background,
// and at most 1–2× per deck.
const breath: SlideTransition = {
  duration: 460,
  throughBackground: true,
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

## Direction-aware keyframes (use sparingly)

Most tasteful tools don't mirror on backward navigation. When you genuinely need to — e.g. a horizontal slide that should reverse — use `--osd-dir` inside `calc()`:

```tsx
{ transform: 'translateX(calc(var(--osd-dir, 1) * 8px))' },
{ transform: 'translateX(0)' },
```

If you find yourself reaching for this on every transition, you're probably over-designing. Forward = backward is the more refined default.

## Anti-patterns

- ❌ Fading the exit to `opacity: 0` and delaying the enter — the framework ignores the exit fade, so the outgoing page just sits there for the delay (a dead beat); with `throughBackground: true` the same shape becomes a flash of the container background. Write a hold instead.
- ❌ `throughBackground: true` on the house transition, or between pages with different backgrounds — every cut dips to black.
- ❌ Six different transitions across six pages — the single loudest "made in PowerPoint" tell.
- ❌ `translateX(100%)` slide-from-side — iOS modal / PowerPoint Push; not a slide change.
- ❌ Aggressive scale-pop (e.g. `0.85 → 1`) + blur — lightbox / photo-viewer vocabulary; implies zooming *into* something.
- ❌ `clip-path: inset(…)` reveals — After Effects vocabulary; theatrical.
- ❌ Parallel blur on both layers at once — visual mush; the eye can't fixate.
- ❌ Duration > 350 ms for a standard slide change — drags.
- ❌ Translate > 12 px or scale > 3% — reads as rupture, not continuity.
- ❌ `linear` easing — feels like a slideshow, not a product.
- ❌ Declaring a transition on every deck. **If you don't have a clear reason, omit it.** Snap-swap is fine.
