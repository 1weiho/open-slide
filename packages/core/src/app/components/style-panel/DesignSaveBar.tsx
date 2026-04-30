import { Check, Loader2, Save, Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { useDesignPanelState } from './DesignProvider';

export function DesignSaveBar() {
  const { dirty, committing, commit, discard } = useDesignPanelState();
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 1200);
    return () => clearTimeout(t);
  }, [justSaved]);

  const visible = dirty || committing || justSaved;
  if (!visible) return null;

  const onSave = async () => {
    await commit();
    setJustSaved(true);
  };

  return (
    <div
      data-design-ui
      className="pointer-events-none absolute bottom-20 left-1/2 z-30 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border bg-card/95 py-1 pr-1 pl-3 shadow-lg backdrop-blur">
        {justSaved ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Check className="size-3.5 text-emerald-600" />
            Design saved
          </span>
        ) : (
          <span className="text-xs font-medium text-foreground">Unsaved design changes</span>
        )}
        {!justSaved && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 rounded-full px-2.5 text-[11px] text-muted-foreground hover:text-foreground"
            onClick={discard}
            disabled={committing || !dirty}
          >
            <Undo2 className="size-3.5" />
            Discard
          </Button>
        )}
        <Button
          size="sm"
          className="h-7 rounded-full px-3 text-[11px]"
          onClick={onSave}
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
