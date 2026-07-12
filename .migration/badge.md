# badge

2026-07-12 — transformation engine (legacy style). Verdict: Slot idiom → `useRender`; clean.

## Changed

- `packages/core/src/app/components/ui/badge.tsx`
  - `Slot` from `radix-ui` → `useRender` (`@base-ui/react/use-render`) + `mergeProps` (`@base-ui/react/merge-props`).
  - `asChild ? Slot.Root : 'span'` idiom replaced with `useRender({ defaultTagName: 'span', render, props: mergeProps(...) })`. Props type `React.ComponentProps<'span'> & { asChild?: boolean }` → `useRender.ComponentProps<'span'>`.
  - The `data-*` object literal passed to `mergeProps` is cast `as React.ComponentPropsWithRef<'span'>` (the ref-inclusive input type `mergeProps` expects; a plain `React.ComponentProps<'span'>` cast fails excess-property checking here).
  - `badgeVariants` cva preserved verbatim.
  - Leftover scan clean.

## Left alone

- `badgeVariants` export unchanged.

## Behavior changes

- Consumers previously using `<Badge asChild>` must switch to `<Badge render={<a .../>} />`. No consumer in this repo used `asChild` on Badge, so no call sites changed.

## Verify by hand

- Render a default badge and a badge composed onto a link via `render`; confirm variant styling and that the link is clickable.
