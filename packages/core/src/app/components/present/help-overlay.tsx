import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLocale } from '@/lib/use-locale';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Portal target — pass the player root so the dialog renders inside
   *  the fullscreen subtree (otherwise it paints invisibly under it). */
  container?: HTMLElement | null;
};

export function PresentHelpOverlay({ open, onOpenChange, container }: Props) {
  const t = useLocale();
  const shortcuts: Array<{ keys: string[]; label: string }> = [
    { keys: ['→', '↓', 'Space', 'PgDn'], label: t.present.shortcutNext },
    { keys: ['←', '↑', 'PgUp'], label: t.present.shortcutPrev },
    { keys: ['Home', 'End'], label: t.present.shortcutFirstLast },
    { keys: ['1–9', 'Enter'], label: t.present.shortcutJump },
    { keys: ['O'], label: t.present.shortcutOverview },
    { keys: ['B'], label: t.present.shortcutBlack },
    { keys: ['W'], label: t.present.shortcutWhite },
    { keys: ['L'], label: t.present.shortcutLaser },
    { keys: ['P'], label: t.present.shortcutPresenter },
    { keys: ['?', 'H'], label: t.present.shortcutToggleHelp },
    { keys: ['Esc'], label: t.present.shortcutCloseExit },
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent container={container ?? undefined} className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <span className="eyebrow">{t.present.helpEyebrow}</span>
          <DialogTitle>{t.present.helpTitle}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
          {shortcuts.map((row) => (
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
