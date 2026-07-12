# dropdown-menu

2026-07-12 — transformation engine (legacy style). Verdict: renamed to `Menu` + restructured; item `onSelect`→`onClick` swept.

## Changed

- `packages/core/src/app/components/ui/dropdown-menu.tsx`
  - `DropdownMenu` from `radix-ui` → `Menu` from `@base-ui/react/menu`.
  - Part renames: `Sub`→`SubmenuRoot`, `SubTrigger`→`SubmenuTrigger`, `Label`→`GroupLabel`, `ItemIndicator`→`CheckboxItemIndicator`/`RadioItemIndicator` (split by parent item type).
  - `DropdownMenuContent` restructured `Portal > Content` → `Portal > Positioner > Popup`; `side/sideOffset/align/alignOffset` destructured and forwarded to Positioner (`isolate z-50 outline-none`).
  - `DropdownMenuSubContent` rebuilt as `Portal > Positioner > Popup` with load-bearing submenu defaults `align="start" alignOffset={-3} side="right" sideOffset={0}`.
  - Class hooks: `data-[state=open]:bg-muted` on SubTrigger → `data-popup-open:bg-muted`; CSS vars `--radix-dropdown-menu-content-available-height/transform-origin` → `--available-height` / `--transform-origin`; enter/exit restated to `data-starting-style:*` / `data-ending-style:*`. Item highlight kept as `focus:*` (Base UI menu items receive real focus when highlighted).
  - Leftover scan clean.

## Consumer sweep (menu-item `onSelect` → `onClick`)

Base UI `Menu.Item` has NO `onSelect` prop — `onSelect` is silently swallowed as the DOM `onselect` handler and never fires. Converted `onSelect`→`onClick` on every `DropdownMenuItem` (closes on click by default, matching Radix): `slide.tsx` (export html/pdf/pptx, copy-link, play-window/fullscreen/presenter), `home.tsx` (folders + slide-card actions), `home-shell.tsx` (all-slides/themes/assets), `asset-view.tsx` (preview/rename/delete), `folder-item.tsx` (rename/delete), `language-toggle.tsx`, `theme-toggle.tsx`. Non-menu `onSelect` props (`<Sidebar>`, `<Overview>`, `<OverviewGrid>`, custom rows) left untouched.

Trigger `asChild` → `render` in `home-shell.tsx`, `home.tsx` (×3), `folder-item.tsx`.

## Behavior changes

- CheckboxItem/RadioItem `closeOnClick` defaults to FALSE in Base UI (Radix closed by default). No checkbox/radio dropdown items exist in this repo, so no divergence in practice.

## Verify by hand

- Open the slide export menu, the home sort/folder/card menus, and the theme/language toggles; confirm every item fires its action AND the menu closes, keyboard arrow/typeahead nav works, and the submenu (if any) opens to the right.
