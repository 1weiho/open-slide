import { Crosshair } from 'lucide-react';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { type SlideComment, useComments } from '@/lib/inspector/useComments';
import { type Edit, type EditOp, useEditor } from '@/lib/inspector/useEditor';

export type SelectedTarget = {
  line: number;
  column: number;
  anchor: HTMLElement;
};

type InspectorCtx = {
  slideId: string;
  active: boolean;
  toggle: () => void;
  cancel: () => void;
  comments: SlideComment[];
  error: string | null;
  refetch: () => Promise<void>;
  add: (line: number, column: number, text: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  selected: SelectedTarget | null;
  setSelected: (s: SelectedTarget | null) => void;
  applyEdit: (line: number, column: number, ops: EditOp[]) => Promise<void>;
  applyEdits: (edits: Edit[]) => Promise<void>;
};

const Ctx = createContext<InspectorCtx | null>(null);

export function useInspector(): InspectorCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useInspector must be used inside <InspectorProvider>');
  return v;
}

export function InspectorProvider({ slideId, children }: { slideId: string; children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [selected, setSelected] = useState<SelectedTarget | null>(null);
  const { comments, error, refetch, add, remove } = useComments(slideId);
  const { applyEdit, applyEdits } = useEditor(slideId);

  const toggle = useCallback(() => {
    setActive((a) => {
      if (a) setSelected(null);
      return !a;
    });
  }, []);

  const cancel = useCallback(() => {
    setActive(false);
    setSelected(null);
  }, []);

  const value = useMemo<InspectorCtx>(
    () => ({
      slideId,
      active,
      toggle,
      cancel,
      comments,
      error,
      refetch,
      add,
      remove,
      selected,
      setSelected,
      applyEdit,
      applyEdits,
    }),
    [
      slideId,
      active,
      toggle,
      cancel,
      comments,
      error,
      refetch,
      add,
      remove,
      selected,
      applyEdit,
      applyEdits,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function InspectToggleButton() {
  const { active, toggle } = useInspector();
  if (import.meta.env.PROD) return null;
  return (
    <Button size="sm" variant={active ? 'default' : 'outline'} onClick={toggle} data-inspector-ui>
      <Crosshair className="size-4" />
      Inspect
    </Button>
  );
}
