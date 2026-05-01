import { SaveCard } from '@/components/panel/SaveCard';
import { useDesignPanelState } from './DesignProvider';

export function DesignSaveBar() {
  const { dirty, committing, commit, discard } = useDesignPanelState();

  return (
    <SaveCard
      uiAttr="design"
      className="bottom-20"
      dirty={dirty}
      committing={committing}
      onSave={commit}
      onDiscard={discard}
      unsavedLabel="Unsaved design changes"
      savedLabel="Design saved"
    />
  );
}
