# scroll-area

2026-07-12 — transformation engine (legacy style). Verdict: direct migration (part renames); scrollbar-visibility delta flagged.

## Changed

- `packages/core/src/app/components/ui/scroll-area.tsx`
  - Import from `radix-ui` → `@base-ui/react/scroll-area`.
  - `ScrollAreaScrollbar` → `ScrollArea.Scrollbar`; `ScrollAreaThumb` → `ScrollArea.Thumb`. Root, Viewport, Corner unchanged.
  - Class strings preserved (`data-horizontal:` / `data-vertical:` still key off the emitted `data-orientation`).
  - Leftover scan clean.

## Left alone

- Did not add the optional `ScrollArea.Content` wrapper — the existing content is vertical-scroll only; adding it would change DOM nesting under the `size-full` viewport. Revisit if horizontal overflow measurement is ever needed.

## Behavior changes

- **Scrollbar visibility.** Radix `type` defaulted to `"hover"` (scrollbar fades in on hover/scroll). Base UI dropped `type`; the scrollbar mounts whenever the area is scrollable and is visible unless styled otherwise. The wrapper carries no opacity/`data-hovering`/`data-scrolling` hooks, so the scrollbar may read as always-visible rather than hover-reveal. Flagged, not patched — restyle with `data-hovering`/`data-scrolling` opacity + `transition-delay` if the hover-reveal feel matters.

## Verify by hand

- Scroll a `ScrollArea` (e.g. inspector/asset panels); confirm the thumb tracks and decide whether the always-visible scrollbar is acceptable vs. the old hover-reveal.
