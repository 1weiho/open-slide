# label

2026-07-12 — transformation engine (no Base UI counterpart). Verdict: replaced with native `<label>`; clean.

## Changed

- `packages/core/src/app/components/ui/label.tsx`
  - Base UI has no Label primitive. `LabelPrimitive.Root` from `radix-ui` → native `<label>`.
  - Props type `React.ComponentProps<typeof LabelPrimitive.Root>` → `React.ComponentProps<'label'>`.
  - Dropped the `"use client"` banner (no longer a client primitive).
  - Class string preserved verbatim (including `group-data-[disabled=true]:*` and `peer-disabled:*`, which target ancestor/sibling state, not the label itself).
  - Leftover scan clean.

## Left alone

- Nothing else; single-part file.

## Behavior changes

- Radix Label suppressed text selection on double-click; the class list already carries `select-none`, so that behavior is preserved.

## Verify by hand

- Click a form label and confirm it still focuses/activates its associated control and does not select text on double-click.
