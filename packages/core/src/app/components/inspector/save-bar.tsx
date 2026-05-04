import { X } from 'lucide-react';
import { useHistory } from '@/components/history-provider';
import { SaveCard } from '@/components/panel/save-card';
import { useDesignPanelState } from '@/components/style-panel/design-provider';
import { Button } from '@/components/ui/button';
import { format, plural, useLocale } from '@/lib/use-locale';
import { useInspector } from './inspector-provider';

// Single save card for both inspector edits and design-token edits.
// Counts the design draft as one unit; the user sees one combined
// "N unsaved changes" pill. Save/Discard fan out to both providers.
export function SaveBar() {
  const insp = useInspector();
  const design = useDesignPanelState();
  const history = useHistory();
  const t = useLocale();

  const inspectorCount = insp.pendingCount;
  const designCount = design.dirty ? 1 : 0;
  const total = inspectorCount + designCount;

  const dirty = total > 0;
  const committing = insp.committing || design.committing;

  const onSave = async () => {
    const tasks: Promise<void>[] = [];
    if (inspectorCount > 0) tasks.push(Promise.resolve(insp.commitEdits()));
    if (designCount > 0) tasks.push(Promise.resolve(design.commit()));
    await Promise.all(tasks).catch(() => {});
  };

  const onDiscard = () => {
    if (inspectorCount > 0) insp.cancelEdits();
    if (designCount > 0) design.discard();
  };

  return (
    <>
      <SaveCard
        uiAttr="inspector"
        dirty={dirty}
        committing={committing}
        onSave={onSave}
        onDiscard={onDiscard}
        unsavedLabel={format(plural(total, t.inspector.unsavedChanges), { count: total })}
        onUndo={history.undo}
        onRedo={history.redo}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
      />
      {insp.commitError && (
        <div
          data-inspector-ui
          className="pointer-events-none absolute bottom-16 left-1/2 z-30 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-200 ease-out"
          role="alert"
        >
          <div className="pointer-events-auto flex max-w-[80vw] items-start gap-2 rounded-[8px] border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive shadow-overlay backdrop-blur-md">
            <span className="font-medium">{t.inspector.saveFailed}</span>
            <span className="break-words">{insp.commitError}</span>
            <Button
              size="icon-sm"
              variant="ghost"
              className="-mt-1 -mr-1 ml-auto size-5 shrink-0 text-destructive hover:text-destructive"
              onClick={insp.clearCommitError}
              aria-label={t.inspector.saveFailedDismissAria}
            >
              <X className="size-3" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
