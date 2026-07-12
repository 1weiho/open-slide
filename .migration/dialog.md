# dialog

2026-07-12 — transformation engine (legacy style). Verdict: Overlay→Backdrop, Content→Popup; clean.

## Changed

- `packages/core/src/app/components/ui/dialog.tsx`
  - Import from `radix-ui` → `@base-ui/react/dialog`.
  - `DialogOverlay` renders `DialogPrimitive.Backdrop` (was `.Overlay`); `data-slot="dialog-overlay"` kept.
  - `DialogContent` renders `DialogPrimitive.Popup` (was `.Content`). Centered modal — no Positioner (correct for dialog).
  - `DialogFooter` close button: `<DialogPrimitive.Close asChild><Button/></DialogPrimitive.Close>` → `<DialogPrimitive.Close render={<Button variant="outline">Close</Button>} />`.
  - Enter/exit animations restated: Backdrop `animate-in/out fade` → `transition-opacity data-starting-style:opacity-0 data-ending-style:opacity-0`; Popup `animate-in/out zoom/fade` → `transition-[transform,scale,opacity] data-starting-style:scale-95/opacity-0 data-ending-style:scale-95/opacity-0`. Centering translate + `container` passthrough preserved.
  - Leftover scan clean.

## Left alone

- `DialogHeader` / `DialogFooter` (plain divs), Trigger/Portal/Close/Title/Description wrappers keep their names and data-slots.

## Behavior changes

- `onOpenAutoFocus`/`onCloseAutoFocus` would map to Popup `initialFocus`/`finalFocus` and the dismiss callbacks to `onOpenChange` `eventDetails.reason` — no consumer used any of these, so nothing to restructure.

## Verify by hand

- Open the asset-picker and image-crop dialogs; confirm the backdrop fades, the card zooms in, focus is trapped, Escape/outside-click closes, and focus returns to the trigger. Confirm the footer "Close" button and the top-right ✕ both dismiss.
