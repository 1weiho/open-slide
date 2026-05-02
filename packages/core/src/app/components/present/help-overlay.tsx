import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const SHORTCUTS: Array<{ keys: string[]; label: string }> = [
  { keys: ['→', '↓', 'Space', 'PgDn'], label: 'Next slide' },
  { keys: ['←', '↑', 'PgUp'], label: 'Previous slide' },
  { keys: ['Home', 'End'], label: 'First / last slide' },
  { keys: ['1–9', 'Enter'], label: 'Jump to slide' },
  { keys: ['O'], label: 'Slide overview' },
  { keys: ['B'], label: 'Black screen' },
  { keys: ['W'], label: 'White screen' },
  { keys: ['L'], label: 'Laser pointer' },
  { keys: ['P'], label: 'Open Presenter View' },
  { keys: ['?', 'H'], label: 'Toggle this help' },
  { keys: ['Esc'], label: 'Close overlay / exit' },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Portal target — pass the player root so the dialog renders inside
   *  the fullscreen subtree (otherwise it paints invisibly under it). */
  container?: HTMLElement | null;
};

export function PresentHelpOverlay({ open, onOpenChange, container }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent container={container ?? undefined} className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <span className="eyebrow">Present mode</span>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
          {SHORTCUTS.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-3 border-b border-hairline py-1.5 last:border-0"
            >
              <span className="text-[12.5px] text-foreground/85">{row.label}</span>
              <span className="flex shrink-0 items-center gap-1">
                {row.keys.map((k) => (
                  <kbd
                    key={k}
                    className="rounded-[4px] border border-border bg-muted px-1.5 py-0.5 font-mono text-[10.5px] tabular-nums"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
