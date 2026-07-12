# context-menu

2026-07-12 — transformation engine (legacy style). Verdict: restructured (menu mapping); item `onSelect`→`onClick` swept.

## Changed

- `packages/core/src/app/components/ui/context-menu.tsx`
  - `ContextMenu` from `radix-ui` → `@base-ui/react/context-menu` (shares the `Menu` part family).
  - Part renames: `Sub`→`SubmenuRoot`, `SubTrigger`→`SubmenuTrigger`, `Label`→`GroupLabel`, `ItemIndicator`→`CheckboxItemIndicator`/`RadioItemIndicator`.
  - `ContextMenuContent` (pointer-anchored) restructured `Portal > Content` → `Portal > Positioner > Popup` — Positioner gets NO `side`/`alignOffset` (keeps its pointer anchoring; adding a side would mis-position every right-click menu).
  - `ContextMenuSubContent` rebuilt as `Portal > Positioner > Popup` with submenu defaults `align="start" alignOffset={4} side="right" sideOffset={0}`.
  - Class hooks: SubTrigger `data-[state=open]:bg-muted` → `data-popup-open:bg-muted`; CSS vars → `--available-height` / `--transform-origin`; enter/exit → `data-starting-style:*` / `data-ending-style:*`. Item highlight kept as `focus:*`.
  - Leftover scan clean.

## Consumer sweep

- `<ContextMenuTrigger asChild aria-label={x}><node/></ContextMenuTrigger>` → `<ContextMenuTrigger aria-label={x} render={node} />` in `thumbnail-rail.tsx` (`render={children as React.ReactElement}` since `children` is typed `ReactNode`).
- Menu-item `onSelect`→`onClick` on the `ContextMenuItem`s in `thumbnail-rail.tsx` (duplicate / delete page).

## Behavior changes

- `ContextMenu.Root` `modal` and `ContextMenu.Trigger` `disabled` are DROPPED in Base UI (no consumer set either).

## Verify by hand

- Right-click a thumbnail in the rail; confirm the menu opens at the pointer, Duplicate/Delete fire their actions and close, and the disabled Delete (single page) stays disabled.
