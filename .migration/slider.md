# slider

2026-07-12 — transformation engine (legacy style). Verdict: restructured (Control added); call-site handler arity fixed.

## Changed

- `packages/core/src/app/components/ui/slider.tsx`
  - Import from `radix-ui` → `@base-ui/react/slider`.
  - New anatomy `Root > Control > Track > (Indicator, Thumb)`: added `Slider.Control` wrapping Track + Thumbs; `Slider.Range` → `Slider.Indicator`.
  - Added `thumbAlignment="edge"` on Root (Base UI defaults to `center`; `edge` keeps the thumb inside the track bounds like Radix did).
  - Thumbs now take the required `index={index}` prop.
  - Class strings and the `_values` thumb-count memo preserved.
  - Leftover scan clean.

## Consumer sweep

Base UI `onValueChange` value is `number | number[]` (shape follows what you pass; wrappers pass `[value]`), so array-destructuring handlers break. Fixed in every slider call site:
- `asset-view.tsx` (grid columns), `style-panel.tsx` (generic slider row), `inspector-panel.tsx` (font-size, line-height, letter-spacing): `onValueChange={([n]) => …}` → `onValueChange={(v) => …((Array.isArray(v) ? v[0] : v) ?? fallback)}`.

## Left alone

- No consumer used `onValueCommit` or `inverted` (both changed/removed in Base UI — `onValueCommit` → `onValueCommitted`, `inverted` dropped).

## Behavior changes

- `onValueChange` gains a second `eventDetails` argument; existing handlers ignore it.

## Verify by hand

- Drag each slider (asset grid columns, inspector font-size/line-height/letter-spacing, style-panel rows); confirm the fill and thumb track the value, keyboard arrows step, and the bound number field stays in sync.
