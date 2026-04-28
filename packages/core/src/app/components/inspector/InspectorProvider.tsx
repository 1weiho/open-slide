import { Crosshair } from 'lucide-react';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button } from '@/components/ui/button';
import { type SlideComment, useComments } from '@/lib/inspector/useComments';
import { type Edit, type EditOp, useEditor } from '@/lib/inspector/useEditor';

export type SelectedTarget = {
  line: number;
  column: number;
  anchor: HTMLElement;
};

type OpsBucket = { styleOps: Map<string, string | null>; textOp: string | null };
type ElementBucket = { line: number; column: number; ops: OpsBucket };

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
  // Buffer ops in memory; `commitEdits` (manual Save or auto-flush on
  // close) is what actually writes to disk.
  bufferOps: (line: number, column: number, ops: EditOp[]) => void;
  pendingCount: number;
  commitEdits: () => Promise<void>;
  committing: boolean;
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

  const pendingRef = useRef<Map<string, ElementBucket>>(new Map());
  const [pendingCount, setPendingCount] = useState(0);
  const [committing, setCommitting] = useState(false);

  const refreshCount = useCallback(() => {
    let n = 0;
    for (const b of pendingRef.current.values()) {
      if (b.ops.styleOps.size > 0 || b.ops.textOp !== null) n++;
    }
    setPendingCount(n);
  }, []);

  const bufferOps = useCallback(
    (line: number, column: number, ops: EditOp[]) => {
      const key = `${line}:${column}`;
      let bucket = pendingRef.current.get(key);
      if (!bucket) {
        bucket = { line, column, ops: { styleOps: new Map(), textOp: null } };
        pendingRef.current.set(key, bucket);
      }
      for (const op of ops) {
        if (op.kind === 'set-style') bucket.ops.styleOps.set(op.key, op.value);
        else if (op.kind === 'set-text') bucket.ops.textOp = op.value;
      }
      refreshCount();
    },
    [refreshCount],
  );

  const commitEdits = useCallback(async () => {
    const buckets = pendingRef.current;
    if (buckets.size === 0) return;
    const edits: Edit[] = [];
    for (const { line, column, ops } of buckets.values()) {
      const list: EditOp[] = [];
      for (const [k, v] of ops.styleOps) list.push({ kind: 'set-style', key: k, value: v });
      if (ops.textOp !== null) list.push({ kind: 'set-text', value: ops.textOp });
      if (list.length > 0) edits.push({ line, column, ops: list });
    }
    pendingRef.current = new Map();
    setPendingCount(0);
    if (edits.length === 0) return;
    setCommitting(true);
    try {
      await applyEdits(edits);
    } finally {
      setCommitting(false);
    }
  }, [applyEdits]);

  // Auto-flush on inspector close and on route unmount so toggling
  // off or navigating away doesn't drop buffered edits.
  const commitRef = useRef(commitEdits);
  commitRef.current = commitEdits;
  useEffect(() => {
    if (!active) commitRef.current().catch(() => {});
  }, [active]);
  useEffect(() => {
    return () => {
      commitRef.current().catch(() => {});
    };
  }, []);

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
      bufferOps,
      pendingCount,
      commitEdits,
      committing,
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
      bufferOps,
      pendingCount,
      commitEdits,
      committing,
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
