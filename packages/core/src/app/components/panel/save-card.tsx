import { Check, Loader2, Redo2, Save, Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

type SaveCardProps = {
  dirty: boolean;
  committing: boolean;
  onSave: () => Promise<void> | void;
  onDiscard: () => void;
  unsavedLabel: React.ReactNode;
  savedLabel?: string;
  uiAttr: 'inspector' | 'design';
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
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
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: SaveCardProps) {
  const [justSaved, setJustSaved] = useState(false);

  // Brief "Saved" hold so the bar's disappearance feels intentional.
  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 1200);
    return () => clearTimeout(t);
  }, [justSaved]);

  // Keep the pill mounted while history has a redo to offer, even if
  // the user has undone all the way back to a clean state.
  const visible = dirty || committing || justSaved || canUndo || canRedo;
  if (!visible) return null;

  const handleSave = async () => {
    await onSave();
    setJustSaved(true);
  };

  const dataAttrs = uiAttr === 'inspector' ? { 'data-inspector-ui': '' } : { 'data-design-ui': '' };

  const showHistory = !justSaved && (onUndo || onRedo);

  return (
    <div
      {...dataAttrs}
      className="pointer-events-none absolute bottom-6 left-1/2 z-30 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-3 duration-300 ease-out"
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border bg-card py-1 pr-1 pl-1.5 shadow-lg">
        {showHistory && (
          <div className="flex items-center">
            <Button
              size="icon"
              variant="ghost"
              className="size-7 rounded-full text-muted-foreground hover:text-foreground"
              onClick={onUndo}
              disabled={committing || !canUndo}
              aria-label="Undo"
              title="Undo"
            >
              <Undo2 className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-7 rounded-full text-muted-foreground hover:text-foreground"
              onClick={onRedo}
              disabled={committing || !canRedo}
              aria-label="Redo"
              title="Redo"
            >
              <Redo2 className="size-3.5" />
            </Button>
          </div>
        )}
        {justSaved ? (
          <span className="flex items-center gap-1.5 px-2 text-xs font-medium text-foreground">
            <Check className="size-3.5 text-emerald-600" />
            {savedLabel}
          </span>
        ) : dirty || committing ? (
          <span className="px-2 text-xs font-medium text-foreground">{unsavedLabel}</span>
        ) : null}
        {!justSaved && dirty && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 rounded-full px-2.5 text-[11px] text-muted-foreground hover:text-foreground"
            onClick={onDiscard}
            disabled={committing || !dirty}
          >
            Discard
          </Button>
        )}
        {(dirty || committing) && (
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
        )}
      </div>
    </div>
  );
}
