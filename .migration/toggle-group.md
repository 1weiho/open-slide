# toggle-group

2026-07-12 — transformation engine (legacy style). Verdict: migrated; value model changed at call sites.

## Changed

- `packages/core/src/app/components/ui/toggle-group.tsx`
  - `ToggleGroupPrimitive.Root` → callable `ToggleGroup` from `@base-ui/react/toggle-group`; `ToggleGroupPrimitive.Item` → the `Toggle` primitive from `@base-ui/react/toggle` (Base UI reuses Toggle as group items).
  - Context provider, `data-variant`/`data-size`/`data-spacing` and all class strings preserved verbatim.
  - Leftover scan clean.

## Consumer sweep (repeated in every affected report)

Base UI ToggleGroup value is ALWAYS an array and `type` is gone (single-select is the default, `multiple` opts into multi):
- `asset-view.tsx` (view-mode switch): `type="single" value={viewMode} onValueChange={(next)=>…}` → dropped `type`, `value={[viewMode]}`, `onValueChange={(value)=>{ const next = value[0]; … }}`.
- `image-crop-dialog.tsx` (fit switch): same treatment (`value={[fit]}`, unwrap `value[0]`).
- `inspector-panel.tsx` (text-align): same treatment (`value={[snapshot.textAlign]}`, unwrap `value[0]`).

## Left alone

- `rovingFocus` is not used by any consumer (it is dropped in Base UI — roving focus is always on).

## Behavior changes

- Single-select "empty" state: Radix single mode signalled nothing-selected as `""`; Base UI signals it as `[]`. All three consumers guard on `!value[0]` and keep their previous no-op-on-deselect behavior.

## Verify by hand

- Toggle the asset-view grid/list switch, the crop fit switch, and the text-align group; confirm exactly one option is active at a time and clicking the active one does not clear it.
