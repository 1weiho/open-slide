# project — Radix UI → Base UI (whole-project)

2026-07-12 — whole-project migration of `packages/core`, transformation engine (legacy `new-york` style: classify + rewire primitives on the user's own files, keep their exact classes, apply the data-attribute/CSS-var renames). Verdict: complete and green.

## Scope

`components.json` style is `new-york` — a legacy unprefixed style with no `base-new-york` counterpart, so the golden-pair/CLI replay path does not apply. Each wrapper was transformed in place: primitives rewired to `@base-ui/react` subpaths, `asChild`→`render`, Portal→Positioner→Popup restructures, part renames, and class-hook renames (`data-[state=…]`→presence attrs, `--radix-*`→Base UI vars, `animate-in/out`→`data-starting-style`/`data-ending-style`). Visual classes (colors/spacing/radii) were left verbatim.

## Dependency swap

- Installed `@base-ui/react@1.6.0` (subpath exports confirmed: button, separator, toggle, toggle-group, tabs, progress, slider, scroll-area, tooltip, popover, dialog, menu, context-menu, select, use-render, merge-props).
- Removed `radix-ui` (`pnpm --filter @open-slide/core remove radix-ui`; 63 transitive packages pruned). pnpm lockfile updated.
- `src/vite/config.ts` `optimizeDeps.include`: `'radix-ui'` → `'@base-ui/react'`.

## Components migrated (16)

Leaf/shared first, then dependents:
button, label (→ native `<label>`), separator, toggle, badge (→ `useRender`), toggle-group, tabs, progress, slider, scroll-area, tooltip, popover, dialog, dropdown-menu (→ `Menu`), context-menu, select. One `.migration/<component>.md` each.

## App-code sweep (consumers)

- **`asChild` → `render`** on every Trigger/Button call site across `control-bar`, `inspect-overlay`, `inspector-panel`, `overview-grid`, `sidebar-footer`, `sidebar`, `folder-item`, `thumbnail-rail`, `home-shell`, `home`, `slide`. Non-button render targets (`<span role="img">`, `<div>`, router `<Link>`) get `nativeButton={false}` ONLY where the component supports it (Button, menu/select triggers) — `TooltipTrigger` has no `nativeButton` prop, so its non-button renders omit it.
- **`delayDuration` → `delay`** on every `<TooltipProvider>` (7 sites).
- **Menu item `onSelect` → `onClick`** (29 sites). Critical: Base UI `Menu.Item` has no `onSelect` — it is swallowed as the DOM `onselect` handler and never fires. Converted on every `DropdownMenuItem`/`ContextMenuItem`; custom `onSelect` props (`<Sidebar>`, `<Overview>`, `<OverviewGrid>`, rail components) left intact.
- **ToggleGroup value model** (`type="single"` dropped, value wrapped in arrays, handlers unwrap `value[0]`): `asset-view`, `image-crop-dialog`, `inspector-panel`.
- **Slider handler arity** (`onValueChange` value is `number | number[]`): `asset-view`, `style-panel`, `inspector-panel` (×3).
- **Select `items` prop** added to all 5 selects (`asset-view` ×3, `inspector-panel`, `style-panel`) so `Select.Value` renders labels, not raw values (Base UI `Value` shows the raw value without an `items` map / `children` formatter).
- **Select `onValueChange`** widened to `Value | null`: `style-panel` guards `typeof v === 'string'`.

## Flagged behavior deltas (not patched)

- **Tabs** default to MANUAL activation in Base UI 1.6.0 (Radix was automatic); matches the base registry. See `tabs.md`.
- **ScrollArea** scrollbar is visible-when-scrollable rather than hover-reveal (Radix `type="hover"` default dropped). See `scroll-area.md`.
- **PopoverAnchor** export removed (no Base UI Anchor part; unused). See `popover.md`.
- **CheckboxItem/RadioItem `closeOnClick`** defaults to false in Base UI — no such items exist in this repo.

## Verification (vs. baseline)

Baseline before touching deps: `tsc --noEmit` clean.
- `pnpm core typecheck` — clean.
- `pnpm check` (biome) — passes (exit 0); one PRE-EXISTING `useOptionalChain` warning in an untouched server file (`requireJsonBody` handler), not introduced here.
- `pnpm build` — 4/4 tasks successful (the `web#build` "no output files" turbo warning is pre-existing and unrelated).
- `pnpm test` — 20 files / 300 tests passing.
- Changeset added: `.changeset/base-ui-migration.md` (`@open-slide/core` patch).

## What's left

0 wrappers remain on Radix. `grep -rn "radix-ui\|@radix-ui" packages/core/src` → no matches; `radix-ui` is gone from `package.json`.

## Not migrated (intentionally)

`sonner.tsx` (sonner — not Radix), plus `card.tsx`, `input.tsx`, `textarea.tsx` (plain elements, no primitive). No cmdk/vaul/input-otp/react-day-picker/recharts present in this package.
