import { Crosshair } from 'lucide-react';
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { type SlideComment, useComments } from '@/lib/inspector/useComments';

export type PendingTarget = {
  line: number;
  column: number;
  anchorRect: DOMRect;
  clickX: number;
  clickY: number;
};

type InspectorCtx = {
  slideId: string;
  active: boolean;
  toggle: () => void;
  comments: SlideComment[];
  error: string | null;
  refetch: () => Promise<void>;
  add: (line: number, column: number, text: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  pending: PendingTarget | null;
  setPending: (p: PendingTarget | null) => void;
};

const Ctx = createContext<InspectorCtx | null>(null);

export function useInspector(): InspectorCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useInspector must be used inside <InspectorProvider>');
  return v;
}

export function InspectorProvider({ slideId, children }: { slideId: string; children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [pending, setPending] = useState<PendingTarget | null>(null);
  const { comments, error, refetch, add, remove } = useComments(slideId);

  const toggle = useCallback(() => {
    setActive((a) => {
      if (a) setPending(null);
      return !a;
    });
  }, []);

  const value = useMemo<InspectorCtx>(
    () => ({
      slideId,
      active,
      toggle,
      comments,
      error,
      refetch,
      add,
      remove,
      pending,
      setPending,
    }),
    [slideId, active, toggle, comments, error, refetch, add, remove, pending],
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
