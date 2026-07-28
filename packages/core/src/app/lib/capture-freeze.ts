/**
 * Shared capture-time animation freezing for the image exporters.
 *
 * Both image pipelines (`export-pptx.ts` via `html-to-image`, `export-png.ts`
 * via the hand-rolled `<foreignObject>` rasteriser) rasterise a *clone* of the
 * mounted slide. A clone re-enters the document with its CSS animations at
 * their 0% frame, and intro animations conventionally start invisible
 * (`opacity: 0`) with `animation-fill-mode: both` — so a clone taken after the
 * live animations have settled still paints an empty slide. Waiting for the
 * live DOM to settle is necessary but not sufficient; the settled state has to
 * be pinned into the markup the rasteriser actually reads.
 *
 * @agents-index Pins settled animation state inline and disables animations so
 *               capture clones paint the final frame, not the first one.
 */

/**
 * Properties intro animations drive from a hidden start state to a visible end
 * state. Read back once settled and pinned inline so the capture clone cannot
 * re-run the keyframes from their invisible 0% frame.
 */
const FROZEN_PROPS = ['opacity', 'transform', 'filter', 'clip-path'] as const;

/**
 * Pin each element's settled visual state inline and remove its animation so a
 * clone of `root` rasterises the final frame instead of replaying the
 * (initially invisible) keyframes.
 *
 * Mutates `root`'s subtree in place, so callers must own the subtree — both
 * exporters apply it to an offscreen host they mount and unmount themselves,
 * never to the slide the user is looking at.
 *
 * @param root Subtree to freeze. Every descendant element is visited.
 */
export function freezeForCapture(root: HTMLElement): void {
  for (const el of root.querySelectorAll<HTMLElement>('*')) {
    const cs = getComputedStyle(el);
    for (const prop of FROZEN_PROPS) {
      el.style.setProperty(prop, cs.getPropertyValue(prop), 'important');
    }
    el.style.setProperty('animation', 'none', 'important');
    el.style.setProperty('transition', 'none', 'important');
  }
}
