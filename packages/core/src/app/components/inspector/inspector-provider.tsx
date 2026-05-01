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
import { useHistory } from '@/components/history-provider';
import { Button } from '@/components/ui/button';
import { type SlideComment, useComments } from '@/lib/inspector/use-comments';
import { type Edit, type EditOp, useEditor } from '@/lib/inspector/use-editor';

export type SelectedTarget = {
  line: number;
  column: number;
  anchor: HTMLElement;
};

type AssetAttrOp = { assetPath: string; previewUrl: string };

type Bucket = {
  line: number;
  column: number;
  styleOps: Map<string, string | null>;
  textOp: { value: string } | null;
  attrOps: Map<string, AssetAttrOp>;
  // Pre-edit snapshot of the DOM, captured the first time we touch
  // each style key / text / attribute. Used by `cancelEdits` to revert.
  origStyle: Map<string, string>;
  origText: { value: string } | null;
  origAttrs: Map<string, string | null>;
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
  // Mutate the DOM optimistically, snapshot the pre-edit values, and
  // remember the ops. `commitEdits` (manual Save or auto-flush on
  // close) is what actually writes to disk; `cancelEdits` reverts.
  bufferOps: (line: number, column: number, anchor: HTMLElement, ops: EditOp[]) => void;
  pendingCount: number;
  commitEdits: () => Promise<void>;
  cancelEdits: () => void;
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
  const history = useHistory();

  const pendingRef = useRef<Map<string, Bucket>>(new Map());
  const [pendingCount, setPendingCount] = useState(0);
  const [committing, setCommitting] = useState(false);

  const refreshCount = useCallback(() => {
    let n = 0;
    for (const b of pendingRef.current.values()) {
      if (b.styleOps.size > 0 || b.textOp !== null || b.attrOps.size > 0) n++;
    }
    setPendingCount(n);
  }, []);

  // Find the live anchor for a buffered loc. Used by history undo/redo
  // since the original `anchor` reference may have unmounted.
  const findAnchor = useCallback((line: number, column: number) => {
    const root = document.querySelector<HTMLElement>('[data-inspector-root]');
    return root?.querySelector<HTMLElement>(`[data-slide-loc="${line}:${column}"]`) ?? null;
  }, []);

  // Mutate bucket + DOM without recording history. Shared by `bufferOps`
  // (the public, history-recording entry point) and by `redo` closures.
  const applyOpsRaw = useCallback(
    (line: number, column: number, anchor: HTMLElement | null, ops: EditOp[]) => {
      const key = `${line}:${column}`;
      let bucket = pendingRef.current.get(key);
      if (!bucket) {
        bucket = {
          line,
          column,
          styleOps: new Map(),
          textOp: null,
          attrOps: new Map(),
          origStyle: new Map(),
          origText: null,
          origAttrs: new Map(),
        };
        pendingRef.current.set(key, bucket);
      }
      const style = (anchor?.style ?? {}) as unknown as Record<string, string>;
      for (const op of ops) {
        if (op.kind === 'set-style') {
          if (anchor && !bucket.origStyle.has(op.key)) {
            bucket.origStyle.set(op.key, style[op.key] ?? '');
          }
          bucket.styleOps.set(op.key, op.value);
          if (anchor?.isConnected) style[op.key] = op.value ?? '';
        } else if (op.kind === 'set-text') {
          if (anchor && bucket.origText === null) {
            bucket.origText = { value: anchor.textContent ?? '' };
          }
          bucket.textOp = { value: op.value };
          if (anchor?.isConnected) anchor.textContent = op.value;
        } else if (op.kind === 'set-attr-asset') {
          if (anchor && !bucket.origAttrs.has(op.attr)) {
            bucket.origAttrs.set(
              op.attr,
              anchor.hasAttribute(op.attr) ? anchor.getAttribute(op.attr) : null,
            );
          }
          bucket.attrOps.set(op.attr, { assetPath: op.assetPath, previewUrl: op.previewUrl });
          if (anchor?.isConnected) anchor.setAttribute(op.attr, op.previewUrl);
        }
      }
      refreshCount();
    },
    [refreshCount],
  );

  // Pre-edit snapshot for history: capture the *currently effective* value of
  // each touched field so undo can restore exactly the prior state, including
  // the case where the bucket already had a buffered edit before this op.
  type StyleSnap = { kind: 'style'; key: string; value: string | null; existed: boolean };
  type TextSnap = { kind: 'text'; value: string | null; existed: boolean };
  type AttrSnap = {
    kind: 'attr';
    attr: string;
    value: AssetAttrOp | string | null;
    source: 'op' | 'orig' | 'dom-missing' | 'dom-present';
  };
  type Snap = StyleSnap | TextSnap | AttrSnap;

  const snapshotForOps = useCallback(
    (line: number, column: number, anchor: HTMLElement, ops: EditOp[]): Snap[] => {
      const key = `${line}:${column}`;
      const bucket = pendingRef.current.get(key);
      const style = anchor.style as unknown as Record<string, string>;
      const snaps: Snap[] = [];
      for (const op of ops) {
        if (op.kind === 'set-style') {
          if (bucket?.styleOps.has(op.key)) {
            snaps.push({
              kind: 'style',
              key: op.key,
              value: bucket.styleOps.get(op.key) ?? null,
              existed: true,
            });
          } else {
            snaps.push({
              kind: 'style',
              key: op.key,
              value: style[op.key] ?? '',
              existed: false,
            });
          }
        } else if (op.kind === 'set-text') {
          if (bucket?.textOp) {
            snaps.push({ kind: 'text', value: bucket.textOp.value, existed: true });
          } else {
            snaps.push({ kind: 'text', value: anchor.textContent ?? '', existed: false });
          }
        } else if (op.kind === 'set-attr-asset') {
          const prev = bucket?.attrOps.get(op.attr);
          if (prev) {
            snaps.push({ kind: 'attr', attr: op.attr, value: prev, source: 'op' });
          } else if (bucket?.origAttrs.has(op.attr)) {
            snaps.push({
              kind: 'attr',
              attr: op.attr,
              value: bucket.origAttrs.get(op.attr) ?? null,
              source: 'orig',
            });
          } else if (anchor.hasAttribute(op.attr)) {
            snaps.push({
              kind: 'attr',
              attr: op.attr,
              value: anchor.getAttribute(op.attr),
              source: 'dom-present',
            });
          } else {
            snaps.push({ kind: 'attr', attr: op.attr, value: null, source: 'dom-missing' });
          }
        }
      }
      return snaps;
    },
    [],
  );

  // Restore the snapshotted values to bucket + DOM. Mirrors the bucket-empty
  // logic of `cancelEdits` so an undo back to the absolute baseline cleans up.
  const restoreSnapshot = useCallback(
    (line: number, column: number, snaps: Snap[]) => {
      const key = `${line}:${column}`;
      const bucket = pendingRef.current.get(key);
      if (!bucket) return;
      const anchor = findAnchor(line, column);
      const style = (anchor?.style ?? {}) as unknown as Record<string, string>;
      for (const snap of snaps) {
        if (snap.kind === 'style') {
          if (snap.existed) {
            const v = snap.value ?? '';
            bucket.styleOps.set(snap.key, snap.value);
            if (anchor?.isConnected) style[snap.key] = v;
          } else {
            bucket.styleOps.delete(snap.key);
            const orig = bucket.origStyle.get(snap.key);
            if (anchor?.isConnected) style[snap.key] = orig ?? '';
          }
        } else if (snap.kind === 'text') {
          if (snap.existed) {
            bucket.textOp = { value: snap.value ?? '' };
            if (anchor?.isConnected) anchor.textContent = snap.value ?? '';
          } else {
            bucket.textOp = null;
            if (anchor?.isConnected) anchor.textContent = bucket.origText?.value ?? '';
          }
        } else if (snap.kind === 'attr') {
          if (snap.source === 'op') {
            const op = snap.value as AssetAttrOp;
            bucket.attrOps.set(snap.attr, op);
            if (anchor?.isConnected) anchor.setAttribute(snap.attr, op.previewUrl);
          } else {
            bucket.attrOps.delete(snap.attr);
            const orig = bucket.origAttrs.get(snap.attr);
            if (anchor?.isConnected) {
              if (orig === null || orig === undefined) anchor.removeAttribute(snap.attr);
              else anchor.setAttribute(snap.attr, orig);
            }
          }
        }
      }
      if (bucket.styleOps.size === 0 && bucket.textOp === null && bucket.attrOps.size === 0) {
        pendingRef.current.delete(key);
      }
      refreshCount();
    },
    [findAnchor, refreshCount],
  );

  const bufferOps = useCallback(
    (line: number, column: number, anchor: HTMLElement, ops: EditOp[]) => {
      const snaps = snapshotForOps(line, column, anchor, ops);
      applyOpsRaw(line, column, anchor, ops);
      const first = ops[0];
      const opKey = first
        ? first.kind === 'set-style'
          ? first.key
          : first.kind === 'set-attr-asset'
            ? first.attr
            : 'text'
        : 'noop';
      const coalesceKey = `inspector:${line}:${column}:${first?.kind ?? 'noop'}:${opKey}`;
      history.record({
        coalesceKey,
        undo: () => restoreSnapshot(line, column, snaps),
        redo: () => applyOpsRaw(line, column, findAnchor(line, column), ops),
      });
    },
    [applyOpsRaw, snapshotForOps, restoreSnapshot, findAnchor, history],
  );

  const commitEdits = useCallback(async () => {
    const buckets = pendingRef.current;
    if (buckets.size === 0) return;
    const edits: Edit[] = [];
    for (const { line, column, styleOps, textOp, attrOps } of buckets.values()) {
      const list: EditOp[] = [];
      for (const [k, v] of styleOps) list.push({ kind: 'set-style', key: k, value: v });
      if (textOp !== null) list.push({ kind: 'set-text', value: textOp.value });
      for (const [attr, op] of attrOps) {
        list.push({
          kind: 'set-attr-asset',
          attr,
          assetPath: op.assetPath,
          previewUrl: op.previewUrl,
        });
      }
      if (list.length > 0) edits.push({ line, column, ops: list });
    }
    pendingRef.current = new Map();
    setPendingCount(0);
    if (edits.length === 0) {
      history.clear();
      return;
    }
    setCommitting(true);
    try {
      await applyEdits(edits);
    } finally {
      setCommitting(false);
      history.clear();
    }
  }, [applyEdits, history]);

  const cancelEdits = useCallback(() => {
    if (pendingRef.current.size === 0) {
      history.clear();
      return;
    }
    const root = document.querySelector<HTMLElement>('[data-inspector-root]');
    for (const b of pendingRef.current.values()) {
      const el = root?.querySelector<HTMLElement>(`[data-slide-loc="${b.line}:${b.column}"]`);
      if (!el) continue;
      const style = el.style as unknown as Record<string, string>;
      for (const [k, v] of b.origStyle) style[k] = v;
      if (b.origText !== null) el.textContent = b.origText.value;
      for (const [attr, value] of b.origAttrs) {
        if (value === null) el.removeAttribute(attr);
        else el.setAttribute(attr, value);
      }
    }
    pendingRef.current = new Map();
    setPendingCount(0);
    history.clear();
  }, [history]);

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

  // Re-apply buffered ops onto any `[data-slide-loc]` element that gets
  // (re)mounted in the slide canvas. Without this, navigating to a
  // different page and back drops the optimistic styles, since the
  // page's DOM nodes are torn down on unmount even though the buffer
  // (keyed by source line:col) survives.
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-inspector-root]');
    if (!root) return;

    const applyBuffered = (el: HTMLElement) => {
      const loc = el.dataset.slideLoc;
      if (!loc) return;
      const bucket = pendingRef.current.get(loc);
      if (!bucket) return;
      const style = el.style as unknown as Record<string, string>;
      for (const [key, value] of bucket.styleOps) {
        const v = value ?? '';
        if (style[key] !== v) style[key] = v;
      }
      if (bucket.textOp !== null && el.textContent !== bucket.textOp.value) {
        el.textContent = bucket.textOp.value;
      }
      for (const [attr, op] of bucket.attrOps) {
        if (el.getAttribute(attr) !== op.previewUrl) el.setAttribute(attr, op.previewUrl);
      }
    };

    const replayAll = () => {
      if (pendingRef.current.size === 0) return;
      root.querySelectorAll<HTMLElement>('[data-slide-loc]').forEach(applyBuffered);
    };

    replayAll();
    const observer = new MutationObserver(replayAll);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
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
      cancelEdits,
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
      cancelEdits,
      committing,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function InspectToggleButton() {
  const { active, toggle } = useInspector();
  if (import.meta.env.PROD) return null;
  return (
    <Button
      size="sm"
      variant={active ? 'default' : 'ghost'}
      onClick={toggle}
      data-inspector-ui
      title="Inspect"
    >
      <Crosshair className="size-3.5" />
      <span className="hidden md:inline">Inspect</span>
    </Button>
  );
}
