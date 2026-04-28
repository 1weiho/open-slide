import { Check, Loader2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useInspector } from './InspectorProvider';

// Floating "you have unsaved changes" pill at the bottom-center of the
// slide canvas. Lives inside `<main data-inspector-root>` so it tracks
// the canvas area when the editor panel slides in. Renders only while
// there are buffered edits — the optimistic DOM updates make the
// canvas *look* saved, so without this affordance a user could close
// the tab without realising their tweaks never hit disk.
export function SaveBar() {
  const { pendingCount, commitEdits, committing } = useInspector();
  const [justSaved, setJustSaved] = useState(false);

  // Show a brief "Saved" state after a manual commit so the
  // disappearance of the bar feels intentional, not glitchy.
  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 1200);
    return () => clearTimeout(t);
  }, [justSaved]);

  const visible = pendingCount > 0 || committing || justSaved;
  if (!visible) return null;

  const onSave = async () => {
    await commitEdits();
    setJustSaved(true);
  };

  return (
    <div
      data-inspector-ui
      className="pointer-events-none absolute bottom-6 left-1/2 z-30 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border bg-card/95 py-1 pr-1 pl-3 shadow-lg backdrop-blur">
        {justSaved ? (
          <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Check className="size-3.5 text-emerald-600" />
            Saved
          </span>
        ) : (
          <span className="text-xs font-medium text-foreground">
            {pendingCount} unsaved {pendingCount === 1 ? 'change' : 'changes'}
          </span>
        )}
        <Button
          size="sm"
          className="h-7 rounded-full px-3 text-[11px]"
          onClick={onSave}
          disabled={committing || pendingCount === 0}
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
