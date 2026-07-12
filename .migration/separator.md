# separator

2026-07-12 — transformation engine (legacy style). Verdict: direct callable migration; clean.

## Changed

- `packages/core/src/app/components/ui/separator.tsx`
  - `SeparatorPrimitive.Root` from `radix-ui` → callable `Separator` from `@base-ui/react/separator`.
  - Dropped the `decorative` prop (no Base UI equivalent; Base UI separator is always `role="separator"`).
  - `orientation` still forwarded; `data-horizontal:` / `data-vertical:` classes kept — both libraries emit the same `data-orientation` attribute the variants key off.
  - Leftover scan clean.

## Left alone

- Class string preserved.

## Behavior changes

- `decorative={true}` (default) is gone. The separator now always carries semantic `role="separator"`. If a purely-decorative rule is ever needed, use a plain `<div aria-hidden>` — no current consumer relied on `decorative`.

## Verify by hand

- Confirm horizontal and vertical separators still render at 1px on the correct axis.
