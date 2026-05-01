import { SaveCard } from '@/components/panel/SaveCard';
import { useInspector } from './InspectorProvider';

export function SaveBar() {
  const { pendingCount, commitEdits, cancelEdits, committing } = useInspector();

  return (
    <SaveCard
      uiAttr="inspector"
      className="bottom-6"
      dirty={pendingCount > 0}
      committing={committing}
      onSave={commitEdits}
      onDiscard={cancelEdits}
      unsavedLabel={`${pendingCount} unsaved ${pendingCount === 1 ? 'change' : 'changes'}`}
    />
  );
}
