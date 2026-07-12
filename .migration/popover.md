# popover

2026-07-12 — transformation engine (legacy style). Verdict: Portal>Positioner>Popup restructure; Anchor dropped.

## Changed

- `packages/core/src/app/components/ui/popover.tsx`
  - Import from `radix-ui` → `@base-ui/react/popover`.
  - `PopoverContent` restructured `Portal > Content` → `Portal > Positioner > Popup`. Positioner (`isolate z-50`) owns positioning; Popup is the styled box.
  - FORWARD discipline: `side`, `align`, `sideOffset`, `alignOffset`, `collisionPadding` destructured and forwarded to `Positioner`.
  - CSS var `origin-(--radix-popover-content-transform-origin)` → `origin-(--transform-origin)`. Enter/exit restated to `transition-[transform,scale,opacity]` + `data-starting-style:*` / `data-ending-style:*`.
  - **Removed the `PopoverAnchor` export** — Base UI has no Anchor part (the Positioner takes an `anchor` prop instead). No consumer used `PopoverAnchor`.
  - `PopoverHeader` / `PopoverTitle` / `PopoverDescription` (plain divs) unchanged.
  - Leftover scan clean.

## Consumer sweep

- `<PopoverTrigger asChild><Button/></PopoverTrigger>` → `<PopoverTrigger render={<Button/>} />` in `folder-item.tsx` and `sidebar.tsx` (both wrap our `<Button>`, a native button — no `nativeButton` needed).

## Left alone

- Nothing third-party.

## Behavior changes

- `PopoverAnchor` removed (flagged). If a detached anchor is ever needed, pass `anchor` to the Positioner. `Root`-level `openDelay`/`closeDelay` would now live on the Trigger, but no consumer used them.

## Verify by hand

- Open the folder icon-picker and sidebar icon popovers; confirm they anchor to the trigger, animate in, and dismiss on outside-click / Escape.
