# toggle

2026-07-12 — transformation engine (legacy style). Verdict: direct callable migration; clean.

## Changed

- `packages/core/src/app/components/ui/toggle.tsx`
  - `TogglePrimitive.Root` from `radix-ui` → callable `Toggle` from `@base-ui/react/toggle`.
  - `toggleVariants` cva: `data-[state=on]:*` → `data-pressed:*` (base string and `outline` variant). Base UI Toggle emits `data-pressed` instead of `data-[state=on]`.
  - `disabled:*` kept — Base UI Toggle renders a native `<button>` so `:disabled` still applies.
  - Leftover scan clean.

## Left alone

- `toggleVariants` is also consumed by `toggle-group.tsx`; the export shape is unchanged.

## Behavior changes

- None functional; `pressed` / `defaultPressed` / `onPressedChange` pass through (the callback gains a second `eventDetails` arg, but existing single-arg handlers stay valid).

## Verify by hand

- Toggle a standalone toggle on/off; confirm the pressed background/border styling switches.
