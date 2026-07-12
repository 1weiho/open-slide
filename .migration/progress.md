# progress

2026-07-12 — transformation engine (legacy style). Verdict: restructured (Track added, manual transform dropped); clean.

## Changed

- `packages/core/src/app/components/ui/progress.tsx`
  - Import from `radix-ui` → `@base-ui/react/progress`.
  - New required anatomy `Root > Track > Indicator`: the Indicator is now nested in a `Progress.Track`.
  - Dropped the manual fill `style={{ transform: translateX(-(100 - value)%) }}` — the Base UI primitive computes the Indicator width itself. Removed the now-unused `w-full` on the Indicator.
  - `data-slot="progress"` (Root) and `data-slot="progress-indicator"` (Indicator) preserved; Track gets no `data-slot` (new part).
  - Leftover scan clean.

## Left alone

- Root rail classes (`h-[3px] w-full overflow-hidden rounded-full bg-muted`) and Indicator `bg-brand transition-all` preserved.

## Behavior changes

- Fill is now primitive-driven (width) rather than a CSS translate. Visually equivalent for a determinate bar; `value={null}` renders indeterminate on both sides.

## Verify by hand

- Render a progress bar at 0/50/100% and confirm the brand fill width tracks the value and animates.
