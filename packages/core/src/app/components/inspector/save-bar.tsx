import { useEffect } from 'react';
import { useHistory } from '@/components/history-provider';
import { SaveCard } from '@/components/panel/save-card';
import { useDesignPanelState } from '@/components/style-panel/design-provider';
import { isTypingTarget } from '@/lib/keys';
import { format, plural, useLocale } from '@/lib/use-locale';
import { useInspector } from './inspector-provider';

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

  useEffect(() => {
    if (!insp.active || committing) return;
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      if (isTypingTarget(event.target) && event.key.toLowerCase() !== 's') return;
      if (document.querySelector('[data-visual-gesture]')) return;
      if (
        event.target instanceof Element &&
        event.target.closest('[role="dialog"], [role="menu"], [role="listbox"]')
      )
        return;
      const key = event.key.toLowerCase();
      if (key === 'z' || (key === 'y' && event.ctrlKey)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (event.shiftKey || key === 'y') history.redo();
        else history.undo();
      } else if (key === 's') {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (
          document.activeElement instanceof HTMLElement &&
          !document.activeElement.isContentEditable
        ) {
          document.activeElement.blur();
        }
        void insp.commitEdits().catch(() => {});
        if (design.dirty) void Promise.resolve(design.commit()).catch(() => {});
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [insp.active, insp.commitEdits, committing, history, design.dirty, design.commit]);

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
