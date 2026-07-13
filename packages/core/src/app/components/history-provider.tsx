import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

export type HistoryEntry = {
  undo: () => void;
  redo: () => void;
  coalesceKey?: string;
  ts: number;
};

type HistoryCtx = {
  canUndo: boolean;
  canRedo: boolean;
  record: (entry: Omit<HistoryEntry, 'ts'>) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  isSuppressed: () => boolean;
};

const COALESCE_WINDOW_MS = 500;

const Ctx = createContext<HistoryCtx | null>(null);

export function useHistory(): HistoryCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useHistory must be used inside <HistoryProvider>');
  return v;
}

export function HistoryProvider({ children }: { children: ReactNode }) {
  // Stacks live in refs and are mutated only from event handlers; state
  // mirrors the lengths so canUndo/canRedo re-render. Doing the work inside
  // setState updaters would run entry.undo()/redo() twice under StrictMode.
  const pastRef = useRef<HistoryEntry[]>([]);
  const futureRef = useRef<HistoryEntry[]>([]);
  const [pastLength, setPastLength] = useState(0);
  const [futureLength, setFutureLength] = useState(0);
  // Set while invoking an entry's undo/redo so providers can skip
  // re-recording the resulting state mutation.
  const suppressedRef = useRef(false);

  const commit = useCallback(() => {
    setPastLength(pastRef.current.length);
    setFutureLength(futureRef.current.length);
  }, []);

  const record = useCallback(
    (entry: Omit<HistoryEntry, 'ts'>) => {
      if (suppressedRef.current) return;
      const ts = Date.now();
      const prev = pastRef.current;
      const top = prev.at(-1);
      if (
        top &&
        entry.coalesceKey !== undefined &&
        top.coalesceKey === entry.coalesceKey &&
        ts - top.ts < COALESCE_WINDOW_MS
      ) {
        const merged: HistoryEntry = {
          undo: top.undo,
          redo: entry.redo,
          coalesceKey: entry.coalesceKey,
          ts,
        };
        pastRef.current = [...prev.slice(0, -1), merged];
      } else {
        pastRef.current = [...prev, { ...entry, ts }];
      }
      futureRef.current = [];
      commit();
    },
    [commit],
  );

  const undo = useCallback(() => {
    const top = pastRef.current.at(-1);
    if (!top) return;
    suppressedRef.current = true;
    try {
      top.undo();
    } finally {
      suppressedRef.current = false;
    }
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [...futureRef.current, top];
    commit();
  }, [commit]);

  const redo = useCallback(() => {
    const top = futureRef.current.at(-1);
    if (!top) return;
    suppressedRef.current = true;
    try {
      top.redo();
    } finally {
      suppressedRef.current = false;
    }
    futureRef.current = futureRef.current.slice(0, -1);
    pastRef.current = [...pastRef.current, top];
    commit();
  }, [commit]);

  const clear = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    commit();
  }, [commit]);

  const isSuppressed = useCallback(() => suppressedRef.current, []);

  const value = useMemo<HistoryCtx>(
    () => ({
      canUndo: pastLength > 0,
      canRedo: futureLength > 0,
      record,
      undo,
      redo,
      clear,
      isSuppressed,
    }),
    [pastLength, futureLength, record, undo, redo, clear, isSuppressed],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
