import { useHistory } from '@/components/history-provider';
import { SaveCard } from '@/components/panel/save-card';
import { useDesignPanelState } from '@/components/style-panel/design-provider';
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
    // Each provider surfaces its own errors via toast; swallow here so
    // one failure doesn't reject the combined save.
    await Promise.all(tasks).catch(() => {});
  };

  const onDiscard = () => {
    if (inspectorCount > 0) insp.cancelEdits();
    if (designCount > 0) design.discard();
  };

  return (
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
  );
}
