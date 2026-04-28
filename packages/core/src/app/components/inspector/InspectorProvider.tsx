import { Crosshair, MessageSquare, SlidersHorizontal } from 'lucide-react';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { type SlideComment, useComments } from '@/lib/inspector/useComments';
import { type EditOp, useEditor } from '@/lib/inspector/useEditor';

export type PendingTarget = {
  line: number;
  column: number;
  anchorRect: DOMRect;
  clickX: number;
  clickY: number;
};

export type SelectedTarget = {
  line: number;
  column: number;
  anchor: HTMLElement;
};

export type InspectorMode = 'comment' | 'edit';

type InspectorCtx = {
  slideId: string;
  active: boolean;
  toggle: () => void;
  cancel: () => void;
  mode: InspectorMode;
  setMode: (m: InspectorMode) => void;
  comments: SlideComment[];
  error: string | null;
  refetch: () => Promise<void>;
  add: (line: number, column: number, text: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  pending: PendingTarget | null;
  setPending: (p: PendingTarget | null) => void;
  selected: SelectedTarget | null;
  setSelected: (s: SelectedTarget | null) => void;
  applyEdit: (line: number, column: number, ops: EditOp[]) => Promise<void>;
};

const Ctx = createContext<InspectorCtx | null>(null);

export function useInspector(): InspectorCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useInspector must be used inside <InspectorProvider>');
  return v;
}

export function InspectorProvider({ slideId, children }: { slideId: string; children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [mode, setModeState] = useState<InspectorMode>('comment');
  const [pending, setPending] = useState<PendingTarget | null>(null);
  const [selected, setSelected] = useState<SelectedTarget | null>(null);
  const { comments, error, refetch, add, remove } = useComments(slideId);
  const { applyEdit } = useEditor(slideId);

  const toggle = useCallback(() => {
    setActive((a) => {
      if (a) {
        setPending(null);
        setSelected(null);
      }
      return !a;
    });
  }, []);

  const cancel = useCallback(() => {
    setActive(false);
    setPending(null);
    setSelected(null);
  }, []);

  const setMode = useCallback((m: InspectorMode) => {
    setModeState(m);
    setPending(null);
    setSelected(null);
  }, []);

  const value = useMemo<InspectorCtx>(
    () => ({
      slideId,
      active,
      toggle,
      cancel,
      mode,
      setMode,
      comments,
      error,
      refetch,
      add,
      remove,
      pending,
      setPending,
      selected,
      setSelected,
      applyEdit,
    }),
    [
      slideId,
      active,
      toggle,
      cancel,
      mode,
      setMode,
      comments,
      error,
      refetch,
      add,
      remove,
      pending,
      selected,
      applyEdit,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function InspectToggleButton() {
  const { active, toggle, mode, setMode } = useInspector();
  if (import.meta.env.PROD) return null;

  if (!active) {
    return (
      <Button size="sm" variant="outline" onClick={toggle} data-inspector-ui>
        <Crosshair className="size-4" />
        Inspect
      </Button>
    );
  }

  return (
    <div data-inspector-ui className="flex items-center overflow-hidden rounded-md border bg-card">
      <button
        type="button"
        onClick={() => setMode('comment')}
        title="Comment mode"
        className={modeClass(mode === 'comment')}
      >
        <MessageSquare className="size-3.5" />
        Comment
      </button>
      <div className="h-5 w-px bg-border" />
      <button
        type="button"
        onClick={() => setMode('edit')}
        title="Visual edit mode"
        className={modeClass(mode === 'edit')}
      >
        <SlidersHorizontal className="size-3.5" />
        Edit
      </button>
      <div className="h-5 w-px bg-border" />
      <button
        type="button"
        onClick={toggle}
        title="Exit inspector"
        className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Crosshair className="size-3.5" />
      </button>
    </div>
  );
}

function modeClass(active: boolean): string {
  return [
    'flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition-colors',
    active
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
  ].join(' ');
}
