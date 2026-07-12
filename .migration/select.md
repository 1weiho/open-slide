# select

2026-07-12 — transformation engine (legacy style). Verdict: restructured (Viewport→List, position→alignItemWithTrigger); clean.

## Changed

- `packages/core/src/app/components/ui/select.tsx`
  - Import from `radix-ui` → `@base-ui/react/select`.
  - `Select` is now a bare re-export `const Select = SelectPrimitive.Root` (Base UI `Select.Root.Props` is generic `<Value, Multiple>`, which breaks the `React.ComponentProps` wrapper pattern — the bare re-export sidesteps it; also drops the Root `data-slot`).
  - `SelectContent` restructured `Portal > Content` → `Portal > Positioner > Popup`; `Viewport` → `List`. Dropped the radix `position` prop and its popper-conditional classes; expose `alignItemWithTrigger` (default `true`) plus forwarded `side/align/sideOffset/alignOffset`. Popup carries `isolate z-50`.
  - `SelectLabel` → `GroupLabel`; `SelectScrollUpButton`/`DownButton` → `ScrollUpArrow`/`ScrollDownArrow` (kept the `data-slot` names; added `top-0`/`bottom-0 w-full`). `SelectIcon` `asChild` → `render`.
  - `SelectItem` highlight `focus:bg-foreground focus:text-background` → `data-highlighted:*` (in Base UI Select the trigger keeps focus while navigating; items highlight via `data-highlighted`, not `:focus`).
  - CSS vars `--radix-select-content-available-height/transform-origin` → `--available-height` / `--transform-origin`; enter/exit → `data-starting-style:*` / `data-ending-style:*`.
  - Leftover scan clean.

## Consumer sweep

- `onValueChange` widened to `(value: string | null, eventDetails)`. In `style-panel.tsx` the font-preset handler now guards `typeof v === 'string'` before calling `onChange(v)`.
- No consumer passed `position="popper"` / `"item-aligned"` (would now be `alignItemWithTrigger={false}` / default).

## `Select.Value` label resolution (fixed, not just flagged)

Radix `Value` rendered the selected item's `ItemText`; Base UI `Value` renders the RAW value unless the Root gets an `items` map (or `Value` gets a `children` formatter). Every select in this app uses `value` ≠ visible label (e.g. `value="all"` shows "All assets"), so the trigger would have shown raw values. Fixed by supplying the Base UI `items` prop (the documented mechanism) on each `Select` Root — this is completing the migration, not a behavior patch:
- `asset-view.tsx`: usage filter, type filter (inline `items` records), sort (`items={labels}`).
- `inspector-panel.tsx`: font-weight (`items` built from `weightOptions`).
- `style-panel.tsx`: font preset (`items` from `FONT_PRESETS` + `__custom__`).

## Behavior changes

- `onValueChange` now receives `Value | null` + `eventDetails`; handlers guard/cast as needed.

## Verify by hand

- Open the font-preset select (style panel) and any other selects; confirm the trigger shows the correct selected LABEL (not a raw value), the popup aligns to the trigger, keyboard typeahead + highlight work, and scroll arrows appear on long lists.
