import { Check, Loader2, Redo2, Save, Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/lib/use-locale';

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

// Optimistic DOM updates make the canvas *look* saved, so without this
// affordance a user could close the tab thinking their tweaks hit disk
// when they're still buffered in memory.
export function SaveCard({
  dirty,
  committing,
  onSave,
  onDiscard,
  unsavedLabel,
  savedLabel,
  uiAttr,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: SaveCardProps) {
  const t = useLocale();
  const [justSaved, setJustSaved] = useState(false);
  const resolvedSavedLabel = savedLabel ?? t.common.saved;

  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 1200);
    return () => clearTimeout(t);
  }, [justSaved]);

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
      className="pointer-events-none absolute bottom-6 left-1/2 z-30 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-200 ease-out"
    >
      <div className="pointer-events-auto flex h-9 items-center gap-1 rounded-[8px] border border-border bg-popover/95 py-0.5 pr-0.5 pl-1 shadow-overlay backdrop-blur-md">
        {showHistory && (
          <div className="flex items-center">
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={onUndo}
              disabled={committing || !canUndo}
              aria-label={t.common.undo}
              title={t.common.undo}
            >
              <Undo2 className="size-3.5" />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={onRedo}
              disabled={committing || !canRedo}
              aria-label={t.common.redo}
              title={t.common.redo}
            >
              <Redo2 className="size-3.5" />
            </Button>
            {(justSaved || dirty || committing) && (
              <span aria-hidden className="ml-1 mr-0.5 h-4 w-px bg-hairline" />
            )}
          </div>
        )}
        {justSaved ? (
          <span className="flex items-center gap-1.5 px-2.5 text-[12px] font-medium text-foreground">
            <Check className="size-3.5 text-[oklch(0.55_0.13_165)]" strokeWidth={2.5} />
            {resolvedSavedLabel}
          </span>
        ) : dirty || committing ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 text-[12px] font-medium text-foreground">
            <span
              aria-hidden
              className="size-1.5 rounded-full bg-brand shadow-[0_0_0_3px_var(--brand-soft)]"
            />
            <span className="nums">{unsavedLabel}</span>
          </span>
        ) : null}
        {!justSaved && dirty && (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={onDiscard}
            disabled={committing || !dirty}
          >
            {t.common.discard}
          </Button>
        )}
        {(dirty || committing) && (
          <Button
            size="sm"
            variant="brand"
            className="h-7 px-3"
            onClick={handleSave}
            disabled={committing || !dirty}
          >
            {committing ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                {t.common.saving}
              </>
            ) : (
              <>
                <Save className="size-3.5" />
                {t.common.save}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
