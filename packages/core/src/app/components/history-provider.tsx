import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useLayoutEffect,
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

type HistoryState = {
  past: HistoryEntry[];
  future: HistoryEntry[];
};

const COALESCE_WINDOW_MS = 500;

const Ctx = createContext<HistoryCtx | null>(null);

export function useHistory(): HistoryCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useHistory must be used inside <HistoryProvider>');
  return v;
}

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<HistoryState>({ past: [], future: [] });
  const historyRef = useRef(history);
  // Set while invoking an entry's undo/redo so providers can skip
  // re-recording the resulting state mutation.
  const suppressedRef = useRef(false);

  useLayoutEffect(() => {
    historyRef.current = history;
  }, [history]);

  const record = useCallback((entry: Omit<HistoryEntry, 'ts'>) => {
    if (suppressedRef.current) return;
    const ts = Date.now();
    setHistory((current) => {
      const { past } = current;
      const top = past.at(-1);
      const nextPast =
        top &&
        entry.coalesceKey !== undefined &&
        top.coalesceKey === entry.coalesceKey &&
        ts - top.ts < COALESCE_WINDOW_MS
          ? [
              ...past.slice(0, -1),
              {
                undo: top.undo,
                redo: entry.redo,
                coalesceKey: entry.coalesceKey,
                ts,
              },
            ]
          : [...past, { ...entry, ts }];
      return { past: nextPast, future: [] };
    });
  }, []);

  const undo = useCallback(() => {
    const { past } = historyRef.current;
    const top = past.at(-1);
    if (!top) return;
    suppressedRef.current = true;
    try {
      top.undo();
    } finally {
      suppressedRef.current = false;
    }
    setHistory((current) =>
      current.past.at(-1) === top
        ? { past: current.past.slice(0, -1), future: [...current.future, top] }
        : current,
    );
  }, []);

  const redo = useCallback(() => {
    const { future } = historyRef.current;
    const top = future.at(-1);
    if (!top) return;
    suppressedRef.current = true;
    try {
      top.redo();
    } finally {
      suppressedRef.current = false;
    }
    setHistory((current) =>
      current.future.at(-1) === top
        ? { past: [...current.past, top], future: current.future.slice(0, -1) }
        : current,
    );
  }, []);

  const clear = useCallback(() => {
    setHistory({ past: [], future: [] });
  }, []);

  const isSuppressed = useCallback(() => suppressedRef.current, []);

  const value = useMemo<HistoryCtx>(
    () => ({
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
      record,
      undo,
      redo,
      clear,
      isSuppressed,
    }),
    [history.past.length, history.future.length, record, undo, redo, clear, isSuppressed],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
