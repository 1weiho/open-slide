import { Check, Loader2, Save, Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SaveCardProps = {
  dirty: boolean;
  committing: boolean;
  onSave: () => Promise<void> | void;
  onDiscard: () => void;
  unsavedLabel: React.ReactNode;
  savedLabel?: string;
  uiAttr: 'inspector' | 'design';
  className?: string;
};

// Optimistic DOM updates make the canvas *look* saved, so without
// this affordance a user could close the tab thinking their tweaks
// hit disk when they're still buffered in memory.
export function SaveCard({
  dirty,
  committing,
  onSave,
  onDiscard,
  unsavedLabel,
  savedLabel = 'Saved',
  uiAttr,
  className,
}: SaveCardProps) {
  const [justSaved, setJustSaved] = useState(false);

  // Brief "Saved" hold so the bar's disappearance feels intentional.
  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 1200);
    return () => clearTimeout(t);
  }, [justSaved]);

  const visible = dirty || committing || justSaved;
  if (!visible) return null;

  const handleSave = async () => {
    await onSave();
    setJustSaved(true);
  };

  const dataAttrs = uiAttr === 'inspector' ? { 'data-inspector-ui': '' } : { 'data-design-ui': '' };

  return (
    <div
      {...dataAttrs}
      className={cn(
        'pointer-events-none absolute left-1/2 z-30 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-200',
        className,
      )}
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border bg-card/95 py-1 pr-1 pl-3 shadow-lg backdrop-blur">
        {justSaved ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Check className="size-3.5 text-emerald-600" />
            {savedLabel}
          </span>
        ) : (
          <span className="text-xs font-medium text-foreground">{unsavedLabel}</span>
        )}
        {!justSaved && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 rounded-full px-2.5 text-[11px] text-muted-foreground hover:text-foreground"
            onClick={onDiscard}
            disabled={committing || !dirty}
          >
            <Undo2 className="size-3.5" />
            Discard
          </Button>
        )}
        <Button
          size="sm"
          className="h-7 rounded-full px-3 text-[11px]"
          onClick={handleSave}
          disabled={committing || !dirty}
        >
          {committing ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Saving
            </>
          ) : (
            <>
              <Save className="size-3.5" />
              Save
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
