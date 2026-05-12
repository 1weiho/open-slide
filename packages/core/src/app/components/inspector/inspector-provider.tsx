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
import { ImageCropDialog, type ImageCropRect } from './image-crop-dialog';

export type SelectedTarget = {
  line: number;
  column: number;
  anchor: HTMLElement;
};

type AssetAttrOp = { assetPath: string; previewUrl: string };
type Sequenced<T> = T & { seq: number };
type StyleOp = { value: string | null; prevText?: string };
type TextRangeStyleOp = {
  instanceId: string;
  start: number;
  end: number;
  key: string;
  value: string | null;
  prevText?: string;
};

type Bucket = {
  line: number;
  column: number;
  styleOps: Map<string, Sequenced<StyleOp>>;
  rangeStyleOps: Map<string, Sequenced<TextRangeStyleOp>>;
  // Text edits are scoped per DOM instance: a reused component renders
  // the same JSX `<h2>{title}</h2>` at multiple call sites with the same
  // `data-slide-loc`, but each call site's prop literal is independent.
  // Style/attr ops stay shared because they edit the JSX definition.
  textOps: Map<string /* instanceId */, Sequenced<{ value: string }>>;
  attrOps: Map<string, Sequenced<AssetAttrOp>>;
  // Pre-edit snapshot of the DOM, captured the first time we touch
  // each style key / text / attribute. Used by `cancelEdits` to revert.
  origStyle: Map<string, string>;
  origTexts: Map<string /* instanceId */, { value: string }>;
  origHtmls: Map<string /* instanceId */, string>;
  origAttrs: Map<string, string | null>;
};

const INSTANCE_ID_ATTR = 'data-slide-instance-id';

function readInstanceId(el: HTMLElement): string | null {
  return el.getAttribute(INSTANCE_ID_ATTR);
}

type DomTextPart = { node: Text | HTMLBRElement; current: string };

function readEditableText(el: HTMLElement): string {
  const parts: DomTextPart[] = [];
  collectDomTextParts(el, parts);
  return parts.map((part) => part.current).join('');
}

function collectDomTextParts(node: Node, out: DomTextPart[]): void {
  const parts: DomTextPart[] = [];
  collectDomTextPartsRaw(node, parts);
  out.push(...normalizeDomTextParts(parts));
}

function collectDomTextPartsRaw(node: Node, out: DomTextPart[]): void {
  for (const child of Array.from(node.childNodes)) {
    if (child instanceof Text) {
      const current = renderedTextNodeValue(child);
      if (current) out.push({ node: child, current });
    } else if (child instanceof HTMLBRElement) {
      out.push({ node: child, current: '\n' });
    } else if (child instanceof HTMLElement) {
      collectDomTextPartsRaw(child, out);
    }
  }
}

function normalizeDomTextParts(parts: DomTextPart[]): DomTextPart[] {
  return parts.flatMap((part, index) => {
    if (part.current === '\n') return [part];
    let current = part.current;
    if (parts[index - 1]?.current === '\n') current = current.replace(/^\s+/, '');
    if (parts[index + 1]?.current === '\n') current = current.replace(/\s+$/, '');
    return current ? [{ ...part, current }] : [];
  });
}

function renderedTextNodeValue(node: Text): string {
  const whiteSpace = node.parentElement ? getComputedStyle(node.parentElement).whiteSpace : '';
  if (whiteSpace === 'pre' || whiteSpace === 'pre-wrap' || whiteSpace === 'break-spaces') {
    return node.data;
  }
  return node.data.replace(/\s+/g, ' ');
}

function textDiff(prevText: string, nextText: string) {
  let start = 0;
  while (
    start < prevText.length &&
    start < nextText.length &&
    prevText[start] === nextText[start]
  ) {
    start += 1;
  }

  let prevEnd = prevText.length;
  let nextEnd = nextText.length;
  while (prevEnd > start && nextEnd > start && prevText[prevEnd - 1] === nextText[nextEnd - 1]) {
    prevEnd -= 1;
    nextEnd -= 1;
  }

  return { start, end: prevEnd, value: nextText.slice(start, nextEnd) };
}

function textFragment(value: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const lines = value.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]) fragment.append(document.createTextNode(lines[i]));
    if (i < lines.length - 1) fragment.append(document.createElement('br'));
  }
  return fragment;
}

function replaceDomTextPart(part: DomTextPart, value: string) {
  if (part.node instanceof Text && !value.includes('\n')) {
    part.node.data = value;
    return;
  }
  const fragment = textFragment(value);
  part.node.replaceWith(fragment);
}

function setEditableText(el: HTMLElement, value: string) {
  const parts: DomTextPart[] = [];
  collectDomTextParts(el, parts);
  const current = parts.map((part) => part.current).join('');
  if (current === value) return;
  if (parts.length === 0) {
    el.replaceChildren(textFragment(value));
    return;
  }

  const diff = textDiff(current, value);
  let offset = 0;
  let inserted = false;
  for (const part of parts) {
    const partStart = offset;
    const partEnd = partStart + part.current.length;
    offset = partEnd;

    const overlaps = diff.start < partEnd && diff.end > partStart;
    const insertsHere =
      diff.start === diff.end && !inserted && diff.start >= partStart && diff.start <= partEnd;
    if (!overlaps && !insertsHere) continue;

    if (part.node instanceof Text) {
      const localStart = Math.max(diff.start, partStart) - partStart;
      const localEnd = overlaps ? Math.min(diff.end, partEnd) - partStart : localStart;
      replaceDomTextPart(
        part,
        `${part.current.slice(0, localStart)}${inserted ? '' : diff.value}${part.current.slice(localEnd)}`,
      );
    } else if (overlaps) {
      replaceDomTextPart(part, inserted ? '' : diff.value);
    } else {
      const fragment = textFragment(diff.value);
      if (diff.start === partStart) part.node.before(fragment);
      else part.node.after(fragment);
    }

    inserted = true;
  }

  if (!inserted && diff.start === diff.end && diff.start === offset) {
    el.append(textFragment(diff.value));
  }
}

function rangeStyleKey(
  instanceId: string,
  op: { start: number; end: number; key: string },
): string {
  return `${instanceId}:${op.start}:${op.end}:${op.key}`;
}

function applyDomTextRangeStyle(
  el: HTMLElement,
  op: Pick<TextRangeStyleOp, 'start' | 'end' | 'key' | 'value'>,
) {
  const value = op.value ?? resetValueForRangeStyle(op.key);
  if (value === null) return;
  const parts: DomTextPart[] = [];
  collectDomTextParts(el, parts);
  let offset = 0;
  for (const part of parts) {
    const partStart = offset;
    const partEnd = partStart + part.current.length;
    offset = partEnd;
    if (!(part.node instanceof Text)) continue;
    const selectedStart = Math.max(op.start, partStart);
    const selectedEnd = Math.min(op.end, partEnd);
    if (selectedStart >= selectedEnd) continue;

    const localStart = selectedStart - partStart;
    const localEnd = selectedEnd - partStart;
    const before = part.current.slice(0, localStart);
    const selected = part.current.slice(localStart, localEnd);
    const after = part.current.slice(localEnd);
    const span = document.createElement('span');
    (span.style as unknown as Record<string, string>)[op.key] = value;
    span.textContent = selected;
    part.node.replaceWith(document.createTextNode(before), span, document.createTextNode(after));
  }
}

function resetValueForRangeStyle(key: string): string | null {
  if (key === 'fontWeight') return '400';
  if (key === 'fontStyle') return 'normal';
  return null;
}

function replayDomTextRangeStyles(el: HTMLElement, html: string, ops: TextRangeStyleOp[]) {
  const preview = document.createElement('span');
  preview.innerHTML = html;
  for (const op of ops) applyDomTextRangeStyle(preview, op);
  if (el.innerHTML !== preview.innerHTML) el.innerHTML = preview.innerHTML;
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
  openCrop: (anchor: HTMLImageElement) => void;
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
  const pendingSeqRef = useRef(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [committing, setCommitting] = useState(false);
  const [cropTarget, setCropTarget] = useState<{
    line: number;
    column: number;
    anchor: HTMLImageElement;
    src: string;
    targetWidth: number;
    targetHeight: number;
    initialFit: 'cover' | 'contain';
    initialPosition: { x: number; y: number };
    initialRect: ImageCropRect | null;
  } | null>(null);
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
      if (
        b.styleOps.size > 0 ||
        b.rangeStyleOps.size > 0 ||
        b.textOps.size > 0 ||
        b.attrOps.size > 0
      ) {
        n++;
      }
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
          rangeStyleOps: new Map(),
          textOps: new Map(),
          attrOps: new Map(),
          origStyle: new Map(),
          origTexts: new Map(),
          origHtmls: new Map(),
          origAttrs: new Map(),
        };
        pendingRef.current.set(key, bucket);
      }
      const style = (anchor?.style ?? {}) as unknown as Record<string, string>;
      for (const op of ops) {
        const seq = ++pendingSeqRef.current;
        if (op.kind === 'set-style') {
          if (anchor && !bucket.origStyle.has(op.key)) {
            bucket.origStyle.set(op.key, style[op.key] ?? '');
          }
          bucket.styleOps.set(op.key, { value: op.value, prevText: op.prevText, seq });
          if (anchor?.isConnected) style[op.key] = op.value ?? '';
        } else if (op.kind === 'set-text-range-style') {
          if (!anchor) continue;
          const instanceId = ensureInstanceId(anchor);
          if (!bucket.origHtmls.has(instanceId)) bucket.origHtmls.set(instanceId, anchor.innerHTML);
          const nextOp: Sequenced<TextRangeStyleOp> = {
            instanceId,
            start: op.start,
            end: op.end,
            key: op.key,
            value: op.value,
            prevText: op.prevText ?? readEditableText(anchor),
            seq,
          };
          bucket.rangeStyleOps.set(rangeStyleKey(instanceId, op), nextOp);
          if (anchor.isConnected) {
            replayDomTextRangeStyles(
              anchor,
              bucket.origHtmls.get(instanceId) ?? anchor.innerHTML,
              Array.from(bucket.rangeStyleOps.values()).filter(
                (item) => item.instanceId === instanceId,
              ),
            );
          }
        } else if (op.kind === 'set-text') {
          // Reused JSX renders multiple DOM nodes with the same
          // `data-slide-loc` but distinct call-site literals; without an
          // anchor we can't tell which instance to route to, so skip.
          if (!anchor) continue;
          const instanceId = ensureInstanceId(anchor);
          if (!bucket.origTexts.has(instanceId)) {
            bucket.origTexts.set(instanceId, { value: readEditableText(anchor) });
          }
          bucket.textOps.set(instanceId, { value: op.value, seq });
          if (anchor.isConnected) setEditableText(anchor, op.value);
        } else if (op.kind === 'set-attr-asset') {
          if (anchor && !bucket.origAttrs.has(op.attr)) {
            bucket.origAttrs.set(
              op.attr,
              anchor.hasAttribute(op.attr) ? anchor.getAttribute(op.attr) : null,
            );
          }
          bucket.attrOps.set(op.attr, {
            assetPath: op.assetPath,
            previewUrl: op.previewUrl,
            seq,
          });
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
  type StyleSnap = {
    kind: 'style';
    key: string;
    value: Sequenced<StyleOp> | string | null;
    existed: boolean;
  };
  type RangeStyleSnap = {
    kind: 'range-style';
    id: string;
    instanceId: string;
    value: Sequenced<TextRangeStyleOp> | null;
    existed: boolean;
  };
  type TextSnap = {
    kind: 'text';
    instanceId: string;
    value: string | null;
    existed: boolean;
  };
  type AttrSnap = {
    kind: 'attr';
    attr: string;
    value: Sequenced<AssetAttrOp> | string | null;
    source: 'op' | 'orig' | 'dom-missing' | 'dom-present';
  };
  type Snap = StyleSnap | RangeStyleSnap | TextSnap | AttrSnap;

  const snapshotForOps = useCallback(
    (line: number, column: number, anchor: HTMLElement, ops: EditOp[]): Snap[] => {
      const key = `${line}:${column}`;
      const bucket = pendingRef.current.get(key);
      const style = anchor.style as unknown as Record<string, string>;
      const snaps: Snap[] = [];
      for (const op of ops) {
        if (op.kind === 'set-style') {
          const existing = bucket?.styleOps.get(op.key);
          if (existing) {
            snaps.push({
              kind: 'style',
              key: op.key,
              value: { ...existing },
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
        } else if (op.kind === 'set-text-range-style') {
          const instanceId = ensureInstanceId(anchor);
          const id = rangeStyleKey(instanceId, op);
          const existing = bucket?.rangeStyleOps.get(id);
          snaps.push({
            kind: 'range-style',
            id,
            instanceId,
            value: existing ? { ...existing } : null,
            existed: !!existing,
          });
        } else if (op.kind === 'set-text') {
          const instanceId = ensureInstanceId(anchor);
          const existing = bucket?.textOps.get(instanceId);
          if (existing) {
            snaps.push({ kind: 'text', instanceId, value: existing.value, existed: true });
          } else {
            snaps.push({
              kind: 'text',
              instanceId,
              value: readEditableText(anchor),
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
            const prev =
              typeof snap.value === 'object' && snap.value !== null
                ? snap.value
                : { value: snap.value };
            const v = prev.value ?? '';
            bucket.styleOps.set(snap.key, { ...prev, seq: ++pendingSeqRef.current });
            if (sharedAnchor?.isConnected) sharedStyle[snap.key] = v;
          } else {
            bucket.styleOps.delete(snap.key);
            const orig = bucket.origStyle.get(snap.key);
            if (sharedAnchor?.isConnected) sharedStyle[snap.key] = orig ?? '';
          }
        } else if (snap.kind === 'range-style') {
          const textAnchor = findAnchor(line, column, snap.instanceId);
          if (snap.existed && snap.value) {
            bucket.rangeStyleOps.set(snap.id, { ...snap.value, seq: ++pendingSeqRef.current });
          } else {
            bucket.rangeStyleOps.delete(snap.id);
          }
          const html = bucket.origHtmls.get(snap.instanceId);
          if (textAnchor?.isConnected && html !== undefined) {
            replayDomTextRangeStyles(
              textAnchor,
              html,
              Array.from(bucket.rangeStyleOps.values()).filter(
                (op) => op.instanceId === snap.instanceId,
              ),
            );
          }
        } else if (snap.kind === 'text') {
          const textAnchor = findAnchor(line, column, snap.instanceId);
          if (snap.existed) {
            bucket.textOps.set(snap.instanceId, {
              value: snap.value ?? '',
              seq: ++pendingSeqRef.current,
            });
            if (textAnchor?.isConnected) setEditableText(textAnchor, snap.value ?? '');
          } else {
            bucket.textOps.delete(snap.instanceId);
            const orig = bucket.origTexts.get(snap.instanceId);
            if (textAnchor?.isConnected) setEditableText(textAnchor, orig?.value ?? '');
          }
        } else if (snap.kind === 'attr') {
          if (snap.source === 'op') {
            const op = snap.value as Sequenced<AssetAttrOp>;
            bucket.attrOps.set(snap.attr, { ...op, seq: ++pendingSeqRef.current });
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
      if (
        bucket.styleOps.size === 0 &&
        bucket.rangeStyleOps.size === 0 &&
        bucket.textOps.size === 0 &&
        bucket.attrOps.size === 0
      ) {
        pendingRef.current.delete(key);
      }
      refreshCount();
    },
    [findAnchor, refreshCount],
  );

  const bufferOps = useCallback(
    (line: number, column: number, anchor: HTMLElement, ops: EditOp[]) => {
      const instanceId = ops.some(
        (op) => op.kind === 'set-text' || op.kind === 'set-text-range-style',
      )
        ? ensureInstanceId(anchor)
        : undefined;
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
        redo: () => applyOpsRaw(line, column, findAnchor(line, column, instanceId), ops),
      });
    },
    [applyOpsRaw, snapshotForOps, restoreSnapshot, findAnchor, history, ensureInstanceId],
  );

  const commitEdits = useCallback(async () => {
    const buckets = pendingRef.current;
    if (buckets.size === 0) return;
    type PendingItem = {
      key: string;
      seq: number;
      edit: Edit;
      onSuccess: (bucket: Bucket) => void;
    };
    const pending: PendingItem[] = [];
    for (const [key, bucket] of buckets) {
      const { line, column, styleOps, rangeStyleOps, textOps, attrOps, origTexts } = bucket;
      for (const [k, op] of styleOps) {
        pending.push({
          key,
          seq: op.seq,
          edit: {
            line,
            column,
            ops: [{ kind: 'set-style', key: k, value: op.value, prevText: op.prevText }],
          },
          onSuccess: (b) => {
            b.styleOps.delete(k);
          },
        });
      }
      for (const [attr, op] of attrOps) {
        pending.push({
          key,
          seq: op.seq,
          edit: {
            line,
            column,
            ops: [
              {
                kind: 'set-attr-asset',
                attr,
                assetPath: op.assetPath,
                previewUrl: op.previewUrl,
              },
            ],
          },
          onSuccess: (b) => {
            b.attrOps.delete(attr);
          },
        });
      }
      for (const [id, op] of rangeStyleOps) {
        pending.push({
          key,
          seq: op.seq,
          edit: {
            line,
            column,
            ops: [
              {
                kind: 'set-text-range-style',
                start: op.start,
                end: op.end,
                key: op.key,
                value: op.value,
                prevText: op.prevText,
              },
            ],
          },
          onSuccess: (b) => {
            b.rangeStyleOps.delete(id);
          },
        });
      }
      // Per-instance text edits — one Edit per call site, each with its
      // own prevText so the server can disambiguate among siblings.
      for (const [instanceId, textOp] of textOps) {
        const orig = origTexts.get(instanceId);
        pending.push({
          key,
          seq: textOp.seq,
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
    pending.sort((a, b) => a.seq - b.seq);
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
              bucket.rangeStyleOps.size === 0 &&
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
      for (const [instanceId, html] of b.origHtmls) {
        const textEl =
          root?.querySelector<HTMLElement>(`[${INSTANCE_ID_ATTR}="${instanceId}"]`) ?? null;
        if (textEl?.isConnected) textEl.innerHTML = html;
      }
      for (const [instanceId, orig] of b.origTexts) {
        const textEl =
          root?.querySelector<HTMLElement>(`[${INSTANCE_ID_ATTR}="${instanceId}"]`) ?? null;
        if (textEl?.isConnected) setEditableText(textEl, orig.value);
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
      for (const [key, op] of bucket.styleOps) {
        const v = op.value ?? '';
        if (style[key] !== v) style[key] = v;
      }
      // Text replays per-instance: only the originally clicked DOM node
      // (stamped with its `data-slide-instance-id`) gets the buffered
      // value, so siblings of a reused component aren't clobbered.
      const instanceId = readInstanceId(el);
      if (instanceId) {
        const html = bucket.origHtmls.get(instanceId);
        if (html !== undefined) {
          replayDomTextRangeStyles(
            el,
            html,
            Array.from(bucket.rangeStyleOps.values()).filter((op) => op.instanceId === instanceId),
          );
        }
        const textOp = bucket.textOps.get(instanceId);
        if (textOp && readEditableText(el) !== textOp.value) {
          setEditableText(el, textOp.value);
        }
      }
      for (const [attr, op] of bucket.attrOps) {
        if (el.getAttribute(attr) !== op.previewUrl) el.setAttribute(attr, op.previewUrl);
      }
    };

    let observer: MutationObserver | null = null;
    const replayAll = () => {
      if (pendingRef.current.size === 0) return;
      observer?.disconnect();
      root.querySelectorAll<HTMLElement>('[data-slide-loc]').forEach(applyBuffered);
      observer?.observe(root, { childList: true, subtree: true });
    };

    replayAll();
    observer = new MutationObserver(replayAll);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer?.disconnect();
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

  const openCrop = useCallback((anchor: HTMLImageElement) => {
    const loc = anchor.dataset.slideLoc;
    if (!loc) return;
    const [lineStr, columnStr] = loc.split(':');
    const line = Number(lineStr);
    const column = Number(columnStr);
    if (!Number.isFinite(line) || !Number.isFinite(column)) return;
    const cs = window.getComputedStyle(anchor);
    setCropTarget({
      line,
      column,
      anchor,
      src: anchor.currentSrc || anchor.src,
      targetWidth: anchor.offsetWidth || anchor.getBoundingClientRect().width,
      targetHeight: anchor.offsetHeight || anchor.getBoundingClientRect().height,
      initialFit: cs.objectFit === 'contain' ? 'contain' : 'cover',
      initialPosition: parseObjectPosition(cs.objectPosition),
      initialRect: parseObjectViewBox(cs.getPropertyValue('object-view-box')),
    });
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
      openCrop,
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
      openCrop,
    ],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {cropTarget && (
        <ImageCropDialog
          src={cropTarget.src}
          targetWidth={cropTarget.targetWidth}
          targetHeight={cropTarget.targetHeight}
          initialFit={cropTarget.initialFit}
          initialPosition={cropTarget.initialPosition}
          initialRect={cropTarget.initialRect}
          onClose={() => setCropTarget(null)}
          onApply={(result) => {
            const { line, column, anchor } = cropTarget;
            if (anchor.isConnected) {
              const ops: EditOp[] = [
                { kind: 'set-style', key: 'objectFit', value: result.fit },
                { kind: 'set-style', key: 'objectPosition', value: '50% 50%' },
              ];
              if (result.fit === 'cover') {
                const { x, y, width, height } = result.rect;
                const top = round2(y);
                const left = round2(x);
                const right = round2(100 - x - width);
                const bottom = round2(100 - y - height);
                ops.push({
                  kind: 'set-style',
                  key: 'objectViewBox',
                  value: `inset(${top}% ${right}% ${bottom}% ${left}%)`,
                });
              } else {
                ops.push({ kind: 'set-style', key: 'objectViewBox', value: null });
              }
              bufferOps(line, column, anchor, ops);
            }
            setCropTarget(null);
          }}
        />
      )}
    </Ctx.Provider>
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function parseObjectViewBox(value: string): ImageCropRect | null {
  const v = value?.trim();
  if (!v || v === 'none') return null;
  const m = v.match(/^inset\(([^)]+)\)$/);
  if (!m?.[1]) return null;
  const nums = m[1]
    .trim()
    .split(/\s+/)
    .map((p) => {
      const n = p.match(/^(-?\d+(?:\.\d+)?)%$/);
      return n?.[1] ? Number(n[1]) : null;
    });
  if (nums.some((n) => n === null)) return null;
  let top: number, right: number, bottom: number, left: number;
  if (nums.length === 1) {
    top = right = bottom = left = nums[0] as number;
  } else if (nums.length === 2) {
    top = bottom = nums[0] as number;
    right = left = nums[1] as number;
  } else if (nums.length === 3) {
    top = nums[0] as number;
    right = left = nums[1] as number;
    bottom = nums[2] as number;
  } else if (nums.length === 4) {
    top = nums[0] as number;
    right = nums[1] as number;
    bottom = nums[2] as number;
    left = nums[3] as number;
  } else {
    return null;
  }
  const x = left;
  const y = top;
  const width = 100 - left - right;
  const height = 100 - top - bottom;
  if (width <= 0 || height <= 0) return null;
  return { x, y, width, height };
}

function parseObjectPosition(value: string): { x: number; y: number } {
  const parts = value.trim().split(/\s+/);
  const xRaw = parts[0] ?? '50%';
  const yRaw = parts[1] ?? xRaw;
  return { x: parsePercent(xRaw, 50), y: parsePercent(yRaw, 50) };
}

function parsePercent(s: string, fallback: number): number {
  if (s === 'center') return 50;
  if (s === 'left' || s === 'top') return 0;
  if (s === 'right' || s === 'bottom') return 100;
  const m = s.match(/(-?\d+(?:\.\d+)?)%/);
  if (m?.[1]) return Number(m[1]);
  return fallback;
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
