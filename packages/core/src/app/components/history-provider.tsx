import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { type HistoryEntry, HistoryStack } from '@/lib/history-stack';

export type { HistoryEntry };

type HistoryCtx = {
  canUndo: boolean;
  canRedo: boolean;
  // Page the next undo/redo will jump to; null when it applies to the
  // current page (or is page-agnostic, like a design change).
  undoPage: number | null;
  redoPage: number | null;
  record: (entry: Omit<HistoryEntry, 'ts'>) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
};

const Ctx = createContext<HistoryCtx | null>(null);

export function useHistory(): HistoryCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useHistory must be used inside <HistoryProvider>');
  return v;
}

export function HistoryProvider({
  page,
  onNavigate,
  children,
}: {
  page?: number;
  onNavigate?: (page: number) => void;
  children: ReactNode;
}) {
  const pageRef = useRef(page);
  pageRef.current = page;
  const navigateRef = useRef(onNavigate);
  navigateRef.current = onNavigate;
  const [version, setVersion] = useState(0);
  const [stack] = useState(
    () =>
      new HistoryStack({
        currentPage: () => pageRef.current,
        navigate: (p) => navigateRef.current?.(p),
        onChange: () => setVersion((v) => v + 1),
      }),
  );

  const record = useCallback((entry: Omit<HistoryEntry, 'ts'>) => stack.record(entry), [stack]);
  const undo = useCallback(() => stack.undo(), [stack]);
  const redo = useCallback(() => stack.redo(), [stack]);
  const clear = useCallback(() => stack.clear(), [stack]);

  const value = useMemo<HistoryCtx>(() => {
    void version;
    const jumpTarget = (p: number | undefined) => (p === undefined || p === page ? null : p);
    return {
      canUndo: stack.canUndo,
      canRedo: stack.canRedo,
      undoPage: jumpTarget(stack.undoPage),
      redoPage: jumpTarget(stack.redoPage),
      record,
      undo,
      redo,
      clear,
    };
  }, [version, page, stack, record, undo, redo, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
