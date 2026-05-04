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
import { toast } from 'sonner';
import { useHistory } from '@/components/history-provider';
import { Button } from '@/components/ui/button';
import { type SlideComment, useComments } from '@/lib/inspector/use-comments';
import { type Edit, type EditOp, type EditResult, useEditor } from '@/lib/inspector/use-editor';
import { useLocale } from '@/lib/use-locale';

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
  // Text edits are scoped per DOM instance: a reused component renders
  // the same JSX `<h2>{title}</h2>` at multiple call sites with the same
  // `data-slide-loc`, but each call site's prop literal is independent.
  // Style/attr ops stay shared because they edit the JSX definition.
  textOps: Map<string /* instanceId */, { value: string }>;
  attrOps: Map<string, AssetAttrOp>;
  // Pre-edit snapshot of the DOM, captured the first time we touch
  // each style key / text / attribute. Used by `cancelEdits` to revert.
  origStyle: Map<string, string>;
  origTexts: Map<string /* instanceId */, { value: string }>;
  origAttrs: Map<string, string | null>;
};

const INSTANCE_ID_ATTR = 'data-slide-instance-id';

function readInstanceId(el: HTMLElement): string | null {
  return el.getAttribute(INSTANCE_ID_ATTR);
}

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
  applyEdits: (edits: Edit[]) => Promise<EditResult[]>;
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
  const instanceCounterRef = useRef(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [committing, setCommitting] = useState(false);
  const t = useLocale();

  const ensureInstanceId = useCallback((el: HTMLElement): string => {
    const existing = el.getAttribute(INSTANCE_ID_ATTR);
    if (existing) return existing;
    const next = `inst-${++instanceCounterRef.current}`;
    el.setAttribute(INSTANCE_ID_ATTR, next);
    return next;
  }, []);

  const refreshCount = useCallback(() => {
    let n = 0;
    for (const b of pendingRef.current.values()) {
      if (b.styleOps.size > 0 || b.textOps.size > 0 || b.attrOps.size > 0) n++;
    }
    setPendingCount(n);
  }, []);

  // Find the live anchor for a buffered loc. Used by history undo/redo
  // since the original `anchor` reference may have unmounted. With an
  // instance id, prefer the matching DOM node so per-instance text edits
  // round-trip onto the right element.
  const findAnchor = useCallback((line: number, column: number, instanceId?: string) => {
    const root = document.querySelector<HTMLElement>('[data-inspector-root]');
    if (!root) return null;
    if (instanceId) {
      const byInstance = root.querySelector<HTMLElement>(`[${INSTANCE_ID_ATTR}="${instanceId}"]`);
      if (byInstance) return byInstance;
    }
    return root.querySelector<HTMLElement>(`[data-slide-loc="${line}:${column}"]`);
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
          textOps: new Map(),
          attrOps: new Map(),
          origStyle: new Map(),
          origTexts: new Map(),
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
          // Reused JSX renders multiple DOM nodes with the same
          // `data-slide-loc` but distinct call-site literals; without an
          // anchor we can't tell which instance to route to, so skip.
          if (!anchor) continue;
          const instanceId = ensureInstanceId(anchor);
          if (!bucket.origTexts.has(instanceId)) {
            bucket.origTexts.set(instanceId, { value: anchor.textContent ?? '' });
          }
          bucket.textOps.set(instanceId, { value: op.value });
          if (anchor.isConnected) anchor.textContent = op.value;
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
    [refreshCount, ensureInstanceId],
  );

  // Pre-edit snapshot for history: capture the *currently effective* value of
  // each touched field so undo can restore exactly the prior state, including
  // the case where the bucket already had a buffered edit before this op.
  type StyleSnap = { kind: 'style'; key: string; value: string | null; existed: boolean };
  type TextSnap = {
    kind: 'text';
    instanceId: string;
    value: string | null;
    existed: boolean;
  };
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
          const instanceId = ensureInstanceId(anchor);
          const existing = bucket?.textOps.get(instanceId);
          if (existing) {
            snaps.push({ kind: 'text', instanceId, value: existing.value, existed: true });
          } else {
            snaps.push({
              kind: 'text',
              instanceId,
              value: anchor.textContent ?? '',
              existed: false,
            });
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
    [ensureInstanceId],
  );

  // Restore the snapshotted values to bucket + DOM. Mirrors the bucket-empty
  // logic of `cancelEdits` so an undo back to the absolute baseline cleans up.
  const restoreSnapshot = useCallback(
    (line: number, column: number, snaps: Snap[]) => {
      const key = `${line}:${column}`;
      const bucket = pendingRef.current.get(key);
      if (!bucket) return;
      // Style/attr snaps share the loc-level anchor (first match);
      // text snaps look up their per-instance node below.
      const sharedAnchor = findAnchor(line, column);
      const sharedStyle = (sharedAnchor?.style ?? {}) as unknown as Record<string, string>;
      for (const snap of snaps) {
        if (snap.kind === 'style') {
          if (snap.existed) {
            const v = snap.value ?? '';
            bucket.styleOps.set(snap.key, snap.value);
            if (sharedAnchor?.isConnected) sharedStyle[snap.key] = v;
          } else {
            bucket.styleOps.delete(snap.key);
            const orig = bucket.origStyle.get(snap.key);
            if (sharedAnchor?.isConnected) sharedStyle[snap.key] = orig ?? '';
          }
        } else if (snap.kind === 'text') {
          const textAnchor = findAnchor(line, column, snap.instanceId);
          if (snap.existed) {
            bucket.textOps.set(snap.instanceId, { value: snap.value ?? '' });
            if (textAnchor?.isConnected) textAnchor.textContent = snap.value ?? '';
          } else {
            bucket.textOps.delete(snap.instanceId);
            const orig = bucket.origTexts.get(snap.instanceId);
            if (textAnchor?.isConnected) textAnchor.textContent = orig?.value ?? '';
          }
        } else if (snap.kind === 'attr') {
          if (snap.source === 'op') {
            const op = snap.value as AssetAttrOp;
            bucket.attrOps.set(snap.attr, op);
            if (sharedAnchor?.isConnected) sharedAnchor.setAttribute(snap.attr, op.previewUrl);
          } else {
            bucket.attrOps.delete(snap.attr);
            const orig = bucket.origAttrs.get(snap.attr);
            if (sharedAnchor?.isConnected) {
              if (orig === null || orig === undefined) sharedAnchor.removeAttribute(snap.attr);
              else sharedAnchor.setAttribute(snap.attr, orig);
            }
          }
        }
      }
      if (bucket.styleOps.size === 0 && bucket.textOps.size === 0 && bucket.attrOps.size === 0) {
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
    // Each bucket flattens to one Edit per text instance plus one Edit
    // for the shared style/attr ops. We track which entries in `pending`
    // belong to which bucket so a per-edit failure can clear just the
    // landed pieces while leaving the rest buffered for retry.
    type PendingItem = {
      key: string;
      edit: Edit;
      onSuccess: (bucket: Bucket) => void;
    };
    const pending: PendingItem[] = [];
    for (const [key, bucket] of buckets) {
      const { line, column, styleOps, textOps, attrOps, origTexts } = bucket;
      // Shared edit (style + asset attrs) — one per bucket.
      const sharedOps: EditOp[] = [];
      for (const [k, v] of styleOps) sharedOps.push({ kind: 'set-style', key: k, value: v });
      for (const [attr, op] of attrOps) {
        sharedOps.push({
          kind: 'set-attr-asset',
          attr,
          assetPath: op.assetPath,
          previewUrl: op.previewUrl,
        });
      }
      if (sharedOps.length > 0) {
        pending.push({
          key,
          edit: { line, column, ops: sharedOps },
          onSuccess: (b) => {
            b.styleOps.clear();
            b.attrOps.clear();
          },
        });
      }
      // Per-instance text edits — one Edit per call site, each with its
      // own prevText so the server can disambiguate among siblings.
      for (const [instanceId, textOp] of textOps) {
        const orig = origTexts.get(instanceId);
        pending.push({
          key,
          edit: {
            line,
            column,
            ops: [{ kind: 'set-text', value: textOp.value, prevText: orig?.value }],
          },
          onSuccess: (b) => {
            b.textOps.delete(instanceId);
          },
        });
      }
    }
    if (pending.length === 0) {
      pendingRef.current = new Map();
      setPendingCount(0);
      history.clear();
      return;
    }
    setCommitting(true);
    try {
      const results = await applyEdits(pending.map((p) => p.edit));
      const failures: string[] = [];
      for (let i = 0; i < results.length; i++) {
        const item = pending[i];
        const r = results[i];
        const bucket = pendingRef.current.get(item.key);
        if (r.ok) {
          if (bucket) {
            item.onSuccess(bucket);
            if (
              bucket.styleOps.size === 0 &&
              bucket.textOps.size === 0 &&
              bucket.attrOps.size === 0
            ) {
              pendingRef.current.delete(item.key);
            }
          }
        } else {
          failures.push(`line ${item.edit.line}: ${r.error ?? 'edit failed'}`);
        }
      }
      refreshCount();
      if (failures.length > 0) toast.error(`${t.inspector.saveFailed} ${failures.join('; ')}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`${t.inspector.saveFailed} ${msg}`);
      throw err;
    } finally {
      setCommitting(false);
      history.clear();
    }
  }, [applyEdits, history, refreshCount, t]);

  const cancelEdits = useCallback(() => {
    if (pendingRef.current.size === 0) {
      history.clear();
      return;
    }
    const root = document.querySelector<HTMLElement>('[data-inspector-root]');
    for (const b of pendingRef.current.values()) {
      const sharedEl = root?.querySelector<HTMLElement>(`[data-slide-loc="${b.line}:${b.column}"]`);
      if (sharedEl) {
        const style = sharedEl.style as unknown as Record<string, string>;
        for (const [k, v] of b.origStyle) style[k] = v;
        for (const [attr, value] of b.origAttrs) {
          if (value === null) sharedEl.removeAttribute(attr);
          else sharedEl.setAttribute(attr, value);
        }
      }
      // Each text edit has its own anchor — locate by instance id.
      for (const [instanceId, orig] of b.origTexts) {
        const textEl =
          root?.querySelector<HTMLElement>(`[${INSTANCE_ID_ATTR}="${instanceId}"]`) ?? null;
        if (textEl?.isConnected) textEl.textContent = orig.value;
      }
    }
    pendingRef.current = new Map();
    setPendingCount(0);
    history.clear();
  }, [history]);

  // Auto-flush on inspector close and on route unmount so toggling
  // off or navigating away doesn't drop buffered edits. Failures are
  // surfaced via toast inside `commitEdits`; the catch here only
  // swallows the rethrown rejection.
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
      // Text replays per-instance: only the originally clicked DOM node
      // (stamped with its `data-slide-instance-id`) gets the buffered
      // value, so siblings of a reused component aren't clobbered.
      const instanceId = readInstanceId(el);
      if (instanceId) {
        const textOp = bucket.textOps.get(instanceId);
        if (textOp && el.textContent !== textOp.value) {
          el.textContent = textOp.value;
        }
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
  const t = useLocale();
  const { active, toggle } = useInspector();
  if (import.meta.env.PROD) return null;
  return (
    <Button
      size="sm"
      variant={active ? 'default' : 'ghost'}
      onClick={toggle}
      data-inspector-ui
      title={t.inspector.inspect}
    >
      <Crosshair className="size-3.5" />
      <span className="hidden md:inline">{t.inspector.inspect}</span>
    </Button>
  );
}
