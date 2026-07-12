# tooltip

2026-07-12 — transformation engine (legacy style). Verdict: Portal>Positioner>Popup restructure; clean.

## Changed

- `packages/core/src/app/components/ui/tooltip.tsx`
  - Import from `radix-ui` → `@base-ui/react/tooltip`.
  - `TooltipContent` restructured `Portal > Content` → `Portal > Positioner > Popup`. Positioner gets `isolate z-50` and OWNS the positioning props; Popup is the styled box (`data-slot="tooltip-content"`).
  - FORWARD discipline: `side`, `sideOffset`, `align`, `alignOffset`, `collisionPadding` are destructured and forwarded to `Positioner` (not left to fall through onto Popup). `collisionPadding` added to the Positioner `Pick` for `sidebar-footer.tsx`.
  - `TooltipProvider`: `delayDuration` → `delay`.
  - CSS var `origin-(--radix-tooltip-content-transform-origin)` → `origin-(--transform-origin)`. Enter/exit animation restated from `animate-in/out` + per-side slide to `transition-[transform,scale,opacity]` + `data-starting-style:*` / `data-ending-style:*` (+ `data-[instant]:duration-0`).
  - Arrow kept as the rotated-square div (dropped the `fill-foreground`; Base UI Arrow renders a `<div>`, not an SVG).
  - Leftover scan clean.

## Consumer sweep

- `delayDuration={N}` → `delay={N}` on every `<TooltipProvider>`: `inspect-overlay.tsx`, `inspector-panel.tsx`, `overview-grid.tsx`, `control-bar.tsx`, `sidebar-footer.tsx`, `thumbnail-rail.tsx`, `slide.tsx` (×2).
- `<TooltipTrigger asChild><X/></TooltipTrigger>` → `<TooltipTrigger render={<X/>} />` at every call site. `TooltipTrigger` has NO `nativeButton` prop, so non-button render targets (`<span role="img">`, `<div>`) do not (and cannot) set it.

## Behavior changes

- Default `skipDelayDuration` concept is gone (Provider `timeout` replaces it; not used here). Tooltip enter/exit is now transition-based; the directional slide-in was simplified to scale+fade.

## Verify by hand

- Hover the present-mode control-bar buttons, thumbnail-rail indicators, and inspector agent badges; confirm the tooltip opens after the delay, is positioned on the right side, and the arrow points correctly.
