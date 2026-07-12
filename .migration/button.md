# button

2026-07-12 — transformation engine (legacy `new-york` style, in place). Verdict: migrated to the real Base UI Button primitive; clean.

## Changed

- `packages/core/src/app/components/ui/button.tsx`
  - Import `Slot` from `radix-ui` → `Button as ButtonPrimitive` from `@base-ui/react/button`. The shadcn `asChild ? Slot.Root : 'button'` idiom is dropped; the wrapper now renders `<ButtonPrimitive>` directly, which accepts `render` natively.
  - Props type `React.ComponentProps<'button'> & { asChild?: boolean }` → `React.ComponentProps<typeof ButtonPrimitive>` (exposes `render`, `nativeButton`, `focusableWhenDisabled`).
  - `outline` variant: `data-[state=on]:*` → `data-pressed:*` (Base UI Toggle emits `data-pressed`; button is used as a toggle target via `render`).
  - Leftover scan clean: `grep -n "radix-ui\|@radix-ui" button.tsx` → none.

## Left alone

- The editorial `cva` class strings (colors, radii, shadows) are preserved verbatim — legacy style, look stays theirs.

## Behavior changes

- None functional. `disabled:*` / `aria-invalid:*` / `aria-expanded:*` hooks unchanged (Base UI Button renders a native `<button>` by default).

## Verify by hand

- Click a primary and an `outline` button; confirm hover/active/focus-ring and the pressed (`data-pressed`) styling on toggle-style buttons.
- Consumers that render a non-button via `render` (e.g. `slide.tsx` back-link renders a router `<Link>`) pass `nativeButton={false}`; confirm the link navigates and looks right.
