# Morph transitions (`MorphElement`)

> Morph builds on the `SlideTransition` contract — read `transitions.md` first if you haven't.

When the *same visual object* exists on two adjacent pages, the runtime can morph it across the cut — position, size, border-radius, and colors interpolate in one continuous move (Keynote calls this "Magic Move") — instead of fading out and back in. Two parts opt in:

1. Wrap the object on **both** pages in `MorphElement` with the **same `id`**.
2. Enable `morph` on the incoming page's transition.

```tsx
import { MorphElement, type Page, type SlideTransition } from '@open-slide/core';
import type { CSSProperties } from 'react';

// Morph transition — opacity-only enter/exit keeps all the motion on the clones (see rules).
const morphTransition: SlideTransition = {
  duration: 280,
  exit:  { duration: 224, easing: 'cubic-bezier(0.4, 0, 1, 1)', keyframes: [{ opacity: 1 }, { opacity: 0 }] },
  enter: { duration: 308, delay: 112, easing: 'cubic-bezier(0, 0, 0.2, 1)', keyframes: [{ opacity: 0 }, { opacity: 1 }] },
  morph: { duration: 868, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
};

const stage: CSSProperties = { width: '100%', height: '100%', position: 'relative', background: '#000000', overflow: 'hidden' };

const Narrow: Page = () => (
  <div style={stage}>
    <MorphElement id="pill"><div style={{ position: 'absolute', left: 842, top: 479, width: 236, height: 122, borderRadius: 999, background: '#ffffff' }} /></MorphElement>
  </div>
);
const Wide: Page = () => (
  <div style={stage}>
    <MorphElement id="pill"><div style={{ position: 'absolute', left: 721, top: 479, width: 478, height: 122, borderRadius: 999, background: '#0a0a0a' }} /></MorphElement>
  </div>
);

Wide.transition = morphTransition;   // forward: Narrow → Wide morphs the pill
Narrow.transition = morphTransition; // backward: Wide → Narrow morphs it back
```

## Contract

- `morph: true` inherits the transition's top-level `duration`/`easing`; pass `{ duration?, easing?, delay? }` to time the morph independently of the page cross-fade. Morphs usually read best 2–4× longer than the fade (e.g. 280 ms fade, 868 ms morph). Fade phases on morphing pages may run past the 140–280 ms band in `transitions.md` — they're timed against the longer morph, not the standard cut; the band still binds non-morph pages.
- Elements pair by `id` across the cut. A matched pair FLIP-morphs: the runtime measures both rects, clones the outgoing element into an overlay above both pages, hides the originals, and animates transform + border-radius + colors (border widths ride a separate frame so they don't stretch with the box). Keep each `id` unique within a page; don't nest one `MorphElement` inside another.
- An `id` present on only one side fades in/out **in place**. This is how "a third box joins the row" reads: carried boxes glide to their new slots, the new one materializes.
- Colors on the morph node *and its descendants* interpolate too — a label that flips black → white mid-glide just works.
- The transition lives on the **incoming** page. For a morph that also plays when stepping backward, assign the same transition object to both pages (as above).

## Rules — each one earned on a real deck

1. **Prefer opacity-only enter/exit on morphing pages.** Any transition family composes correctly with the morph (shared rects are measured before the phases start), but while clones glide, a transform-bearing enter also slides the rest of the page — two competing motions. Giving the clones all the motion and fading everything else is what makes a morph read as one confident gesture.
2. **Morph geometry must be deterministic at mount.** Rects are snapshotted once at the cut. Position morph elements with pixel constants — never with a value measured in an effect after mount (the re-render shifts the target mid-morph and the move jumps). If text inside a morph box grows over time (typewriter etc.), render a hidden full-width spacer so the measured box never changes size.
3. **No `transform` on the morph node itself.** A percentage translate (`translate(-50%, -50%)`) gets mis-scaled by the morph and lands the clone tens of px off. Put centering/positioning transforms on a plain wrapper `<div>` *around* the `MorphElement`.
4. **`MorphElement` merges `className`/`style` onto its single host child** (it adds no wrapper when the child is a lone DOM element). A crop box (`overflow: hidden` + fixed width) therefore needs an explicit nested `<div>` — otherwise the box collapses onto the `<img>` inside and squishes it.
5. **Gate entrance animations behind `useIsActivePage()`.** During the cut the runtime mounts a *fresh instance* of the outgoing page to snapshot its exit state (and the dev UI mounts every page for thumbnails/overview). If an intro replays there, the snapshot is mid-animation and the morph starts from garbage. The hook returns `true` only for the instance the audience is watching; every other instance (outgoing snapshot, thumbnails, overview, presenter preview, print) should render the final, settled state — no intro, full text.

   ```tsx
   import { useIsActivePage } from '@open-slide/core';

   // Inside the page component:
   const animate = useIsActivePage();
   ```

6. **Clones travel above everything.** The morph overlay sits over both pages, so an incoming element that should appear only when a clone "lands" will otherwise pop early. Give such reveals a delay equal to the morph: `animation: 'osd-fade 0.63s ease-out 0.868s both'` where `0.868s` is `morph.duration` (`osd-fade` is not framework-provided — define `@keyframes osd-fade { from { opacity: 0 } to { opacity: 1 } }` in the slide yourself). Keep that number in one shared const so the two can't drift.
7. **A "hold" page is a separate component.** Transitions attach to the incoming page, so to follow a morph cut with a plain cut of the same content, mint a second page component without `.transition` (e.g. `const Flow4Hold: Page = () => <Flow count={4} />`).

## When to reach for it

Morph is for **state continuity**: a toggle whose thumb slides to the next option, a card that expands into a detail view, a logo that glides from center stage into the next page's diagram, a row that gains one more box. The object *is the story* across the cut. Don't morph decoration, and don't tag elements "just in case" — every morph id is a promise to the audience that it's the same object. One or two morphing sequences per chapter is plenty; the surrounding pages should cut or fade quietly.
