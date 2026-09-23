import { useState } from 'react';
import { InspectorPanel } from '@/components/inspector/inspector-panel';
import { useInspector } from '@/components/inspector/inspector-provider';
import { useDesignPanelState } from '@/components/style-panel/design-provider';
import { DesignPanel } from '@/components/style-panel/style-panel';
import { PANEL_TRANSITION_MS, PANEL_W, usePanelMount } from './panel-shell';

export function EditorSidebar({
  designOpen,
  onCloseDesign,
}: {
  designOpen: boolean;
  onCloseDesign: () => void;
}) {
  const { active, panelOpen } = useInspector();
  const { loaded, draft } = useDesignPanelState();
  const [preferredTab, setPreferredTab] = useState<'format' | 'arrange'>('format');
  const mode = designOpen
    ? loaded && draft
      ? 'design'
      : null
    : active && panelOpen
      ? 'format'
      : null;
  const [lastMode, setLastMode] = useState<'format' | 'design'>('format');
  if (mode && mode !== lastMode) setLastMode(mode);
  const open = mode !== null;
  const { mounted, animVisible } = usePanelMount(open);

  if (!mounted) return null;

  return (
    <div
      data-editor-sidebar
      inert={!open}
      aria-hidden={!open}
      className="flex h-full shrink-0 justify-end overflow-hidden bg-sidebar transition-[width] ease-swift motion-reduce:transition-none"
      style={{
        width: animVisible ? PANEL_W : 0,
        transitionDuration: `${PANEL_TRANSITION_MS}ms`,
      }}
    >
      {(mode ?? lastMode) === 'design' ? (
        <DesignPanel onClose={onCloseDesign} />
      ) : (
        <InspectorPanel preferredTab={preferredTab} onTabChange={setPreferredTab} />
      )}
    </div>
  );
}
