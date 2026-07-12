# tabs

2026-07-12 — transformation engine (legacy style). Verdict: migrated; manual-activation default flagged.

## Changed

- `packages/core/src/app/components/ui/tabs.tsx`
  - Import from `radix-ui` → `@base-ui/react/tabs`. `TabsPrimitive.Trigger` → `TabsPrimitive.Tab`; `TabsPrimitive.Content` → `TabsPrimitive.Panel`. Root and List unchanged.
  - `TabsTrigger` class hooks: `data-[state=active]:*` → `data-active:*` (three occurrences, incl. the `group-data-[variant=line]/tabs-list:data-active:*` and `after:` active-underline rule).
  - `data-[orientation=…]` and `group-data-[orientation=…]/tabs` hooks kept (Base UI Tabs emits `data-orientation`).
  - Leftover scan clean.

## Left alone

- The manual `data-orientation={orientation}` passthrough on Root is kept (harmless; matches the prior wrapper).

## Behavior changes

- **Activation mode.** Radix defaulted to automatic activation (arrow keys change the panel immediately). Base UI 1.6.0 defaults to MANUAL activation (arrow keys move focus; Enter/Space activates). The base registry accepts this default and does not add `List activateOnFocus`; matched here. Flagged, not patched — if automatic activation is desired, add `<TabsList activateOnFocus>`.

## Verify by hand

- In the `slide.tsx` slides/assets tab strip: click each tab, then arrow-key across the list and confirm the delta (focus moves first, activation on Enter/Space). Confirm the active-tab background + brand underline (line variant) still render.
