import { CodeXml, Eye, PanelRight } from 'lucide-react';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { findSlideSource } from '@/lib/inspector/fiber';
import {
  appendTextEdit,
  type TextEditOp,
  type TextEditStep,
} from '@/lib/inspector/text-edit-timeline';
import { type SlideComment, useComments } from '@/lib/inspector/use-comments';
import { type Edit, type EditOp, useEditor } from '@/lib/inspector/use-editor';
import { useVisualEditor, type VisualEdit } from '@/lib/inspector/use-visual-editor';
import { isShortcutControlTarget, isTypingTarget } from '@/lib/keys';
import { textDiff } from '@/lib/text-diff';
import { useLocale } from '@/lib/use-locale';
import { round2 } from '@/lib/utils';
import { AssetPickerDialog } from './asset-picker-dialog';
import { ImageCropDialog, type ImageCropRect } from './image-crop-dialog';

export type SelectedTarget = {
  line: number;
  column: number;
  anchor: HTMLElement;
  canvasPath?: number[];
};

function rememberTarget(target: SelectedTarget): SelectedTarget {
  const root = target.anchor.closest('[data-osd-canvas]');
  if (!root) return target;
  const path: number[] = [];
  for (let node: Element | null = target.anchor; node && node !== root; node = node.parentElement) {
    const parent: Element | null = node.parentElement;
    if (!parent) return target;
    path.unshift(Array.from(parent.children).indexOf(node));
  }
  return { ...target, canvasPath: path };
}

function findRememberedTarget(root: HTMLElement, path?: number[]): HTMLElement | null {
  let node = root.querySelector('[data-osd-canvas]');
  if (!path) return null;
  for (const index of path) node = node?.children[index] ?? null;
  return node instanceof HTMLElement ? node : null;
}

export type InlineEditTarget = SelectedTarget & {
  point?: { x: number; y: number };
  // Double-click entry selects the word under the caret; a single-click
  // switch from another editing session just places the caret.
  selectWord?: boolean;
  // Distinguishes sessions on the same source loc (reused components render
  // several DOM instances of one loc), so each switch remounts the editor.
  session?: number;
};

export type InlineTextSelection = { start: number; end: number };
type InlineStyleHandler = (ops: EditOp[]) => boolean;

type AssetAttrOp = { assetPath: string; previewUrl: string };
type Sequenced<T> = T & { seq: number };
type StyleOp = { value: string | null; prevText?: string };

type Bucket = {
  line: number;
  column: number;
  styleOps: Map<string, Sequenced<StyleOp>>;
  // Text edits are scoped per DOM instance: a reused component renders
  // the same JSX `<h2>{title}</h2>` at multiple call sites with the same
  // `data-slide-loc`, but each call site's prop literal is independent.
  // Style/attr ops stay shared because they edit the JSX definition.
  textEdits: Map<string, TextEditStep[]>;
  textTargets: Map<string, SelectedTarget & { pageIndex: number }>;
  attrOps: Map<string, Sequenced<AssetAttrOp>>;
  // Pre-edit snapshot of the DOM, captured the first time we touch
  // each style key / text / attribute. Used by `cancelEdits` to revert.
  origStyle: Map<string, string>;
  origTexts: Map<string /* instanceId */, { value: string }>;
  origHtmls: Map<string /* instanceId */, TextDomSnapshot>;
  origAttrs: Map<string, string | null>;
};

function createBucket(line: number, column: number): Bucket {
  return {
    line,
    column,
    styleOps: new Map(),
    textEdits: new Map(),
    textTargets: new Map(),
    attrOps: new Map(),
    origStyle: new Map(),
    origTexts: new Map(),
    origHtmls: new Map(),
    origAttrs: new Map(),
  };
}

const INSTANCE_ID_ATTR = 'data-slide-instance-id';

export type DomTextPart = {
  node: Text | HTMLBRElement;
  current: string;
  preserveWhitespace?: boolean;
};
type WhiteSpaceResolver = (element: HTMLElement) => string;
type TextDomSnapshot = { html: string; whiteSpaces: string[] };

const computedWhiteSpace: WhiteSpaceResolver = (element) => getComputedStyle(element).whiteSpace;

function preservesWhitespace(whiteSpace: string): boolean {
  return whiteSpace === 'pre' || whiteSpace === 'pre-wrap' || whiteSpace === 'break-spaces';
}

export function readEditableText(el: HTMLElement): string {
  const parts: DomTextPart[] = [];
  collectDomTextParts(el, parts);
  return parts.map((part) => part.current).join('');
}

export function collectDomTextParts(
  node: Node,
  out: DomTextPart[],
  whiteSpace: WhiteSpaceResolver = computedWhiteSpace,
): void {
  const parts: DomTextPart[] = [];
  collectDomTextPartsRaw(node, parts, whiteSpace);
  out.push(...normalizeDomTextParts(parts));
}

function collectDomTextPartsRaw(
  node: Node,
  out: DomTextPart[],
  whiteSpace: WhiteSpaceResolver,
): void {
  for (const child of Array.from(node.childNodes)) {
    if (child instanceof Text) {
      const preserveWhitespace = preservesWhitespace(
        child.parentElement ? whiteSpace(child.parentElement) : '',
      );
      const current = preserveWhitespace ? child.data : child.data.replace(/\s+/g, ' ');
      if (current) out.push({ node: child, current, preserveWhitespace });
    } else if (child instanceof HTMLBRElement) {
      out.push({ node: child, current: '\n' });
    } else if (child instanceof HTMLElement) {
      collectDomTextPartsRaw(child, out, whiteSpace);
    }
  }
}

function normalizeDomTextParts(parts: DomTextPart[]): DomTextPart[] {
  return parts.flatMap((part, index) => {
    if (part.preserveWhitespace || part.current === '\n') return [part];
    let current = part.current;
    if (parts[index - 1]?.current === '\n') current = current.replace(/^\s+/, '');
    if (parts[index + 1]?.current === '\n') current = current.replace(/\s+$/, '');
    return current ? [{ ...part, current }] : [];
  });
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

function setEditableText(
  el: HTMLElement,
  value: string,
  whiteSpace: WhiteSpaceResolver = computedWhiteSpace,
) {
  const parts: DomTextPart[] = [];
  collectDomTextParts(el, parts, whiteSpace);
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

function applyDomTextRangeStyle(
  el: HTMLElement,
  op: Extract<TextEditOp, { kind: 'set-text-range-style' }>,
  whiteSpace: WhiteSpaceResolver,
) {
  const value = op.value ?? resetValueForRangeStyle(op.key);
  if (value === null) return;
  const parts: DomTextPart[] = [];
  collectDomTextParts(el, parts, whiteSpace);
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

function textSnapshotElements(el: HTMLElement): HTMLElement[] {
  return [
    el,
    ...Array.from(el.querySelectorAll('*')).filter((node) => node instanceof HTMLElement),
  ];
}

function captureTextDom(
  el: HTMLElement,
  whiteSpace: WhiteSpaceResolver = computedWhiteSpace,
): TextDomSnapshot {
  return { html: el.innerHTML, whiteSpaces: textSnapshotElements(el).map(whiteSpace) };
}

function textEditHtml(snapshot: TextDomSnapshot, steps: TextEditStep[]): TextDomSnapshot {
  const preview = document.createElement('span');
  preview.innerHTML = snapshot.html;
  const contexts = new Map(
    textSnapshotElements(preview).map((element, index) => [element, snapshot.whiteSpaces[index]]),
  );
  const whiteSpace: WhiteSpaceResolver = (element) => {
    for (let node: HTMLElement | null = element; node; node = node.parentElement) {
      const value = contexts.get(node);
      if (value !== undefined) return value;
    }
    return 'normal';
  };
  for (const { op } of steps) {
    if (op.kind === 'set-text') setEditableText(preview, op.value, whiteSpace);
    else applyDomTextRangeStyle(preview, op, whiteSpace);
  }
  return captureTextDom(preview, whiteSpace);
}

function replayDomTextEdits(el: HTMLElement, snapshot: TextDomSnapshot, steps: TextEditStep[]) {
  const next = textEditHtml(snapshot, steps).html;
  if (el.innerHTML !== next) el.innerHTML = next;
}

type InspectorCtx = {
  slideId: string;
  active: boolean;
  toggle: () => void;
  panelOpen: boolean;
  panelHidden: boolean;
  togglePanel: () => void;
  cancel: () => void;
  comments: SlideComment[];
  error: string | null;
  add: (line: number, column: number, text: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  selection: SelectedTarget[];
  setSelection: (targets: SelectedTarget[]) => void;
  bufferBatch: (edits: VisualEdit[], coalesceKey?: string) => void;
  visual: ReturnType<typeof useVisualEditor>;
  selected: SelectedTarget | null;
  setSelected: (s: SelectedTarget | null) => void;
  inlineEdit: InlineEditTarget | null;
  inlineSelection: InlineTextSelection | null;
  setInlineSelection: (selection: InlineTextSelection | null) => void;
  registerInlineStyle: (handler: InlineStyleHandler) => () => void;
  applyInlineStyle: InlineStyleHandler;
  startInlineEdit: (target: InlineEditTarget) => void;
  stopInlineEdit: () => void;
  // Bumped on every buffered-op mutation (including undo/redo restores) so
  // panels can re-read DOM snapshots without polling.
  opsVersion: number;
  applyEdit: (line: number, column: number, ops: EditOp[]) => Promise<void>;
  // Mutate the DOM optimistically, snapshot the pre-edit values, and
  // remember the ops. `commitEdits` (manual Save or auto-flush on
  // close) is what actually writes to disk; `cancelEdits` reverts.
  bufferOps: (line: number, column: number, anchor: HTMLElement, ops: EditOp[]) => void;
  pendingCount: number;
  commitEdits: () => Promise<void>;
  cancelEdits: () => void;
  committing: boolean;
  openCrop: (anchor: HTMLImageElement) => void;
  openReplace: (anchor: HTMLElement) => void;
};

const Ctx = createContext<InspectorCtx | null>(null);

export function useInspector(): InspectorCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useInspector must be used inside <InspectorProvider>');
  return v;
}

export function InspectorProvider({
  slideId,
  pageIndex,
  panelHidden = false,
  onPanelOpen,
  children,
}: {
  slideId: string;
  pageIndex: number;
  panelHidden?: boolean;
  onPanelOpen?: () => void;
  children: ReactNode;
}) {
  const [active, setActive] = useState(import.meta.env.DEV);
  const [panelOpen, setPanelOpen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024,
  );
  const [selection, setSelectionState] = useState<SelectedTarget[]>([]);
  const selected = selection.at(-1) ?? null;
  const setSelection = useCallback((targets: SelectedTarget[]) => {
    setSelectionState(targets.map(rememberTarget));
  }, []);
  const setSelected = useCallback((target: SelectedTarget | null) => {
    setSelectionState((previous) => {
      if (!target) return [];
      const primary = previous.at(-1);
      if (
        primary?.anchor === target.anchor &&
        primary.line === target.line &&
        primary.column === target.column
      )
        return previous;
      if (
        primary?.anchor === target.anchor ||
        (primary?.line === target.line && primary.column === target.column)
      ) {
        return [...previous.slice(0, -1), rememberTarget(target)];
      }
      return [rememberTarget(target)];
    });
  }, []);
  const [inlineEdit, setInlineEdit] = useState<InlineEditTarget | null>(null);
  const [inlineSelection, setInlineSelection] = useState<InlineTextSelection | null>(null);
  const inlineStyleRef = useRef<InlineStyleHandler | null>(null);
  const registerInlineStyle = useCallback((handler: InlineStyleHandler) => {
    inlineStyleRef.current = handler;
    return () => {
      if (inlineStyleRef.current === handler) inlineStyleRef.current = null;
    };
  }, []);
  const applyInlineStyle = useCallback(
    (ops: EditOp[]) => inlineStyleRef.current?.(ops) ?? false,
    [],
  );
  const [opsVersion, setOpsVersion] = useState(0);
  const { comments, error, add, remove } = useComments(slideId);
  const { applyEdit, applyEdits } = useEditor(slideId);
  const history = useHistory();

  const pendingRef = useRef<Map<string, Bucket>>(new Map());
  const inlineBaselinesRef = useRef(
    new WeakMap<HTMLElement, { text: string; html: TextDomSnapshot }>(),
  );
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
  const [replaceTarget, setReplaceTarget] = useState<{
    line: number;
    column: number;
    anchor: HTMLElement;
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
      if (b.styleOps.size > 0 || b.textEdits.size > 0 || b.attrOps.size > 0) {
        n++;
      }
    }
    setPendingCount(n);
    setOpsVersion((v) => v + 1);
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
        bucket = createBucket(line, column);
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
        } else if (op.kind === 'set-text-range-style' || op.kind === 'set-text') {
          if (!anchor) continue;
          const instanceId = ensureInstanceId(anchor);
          bucket.textTargets.set(instanceId, {
            ...rememberTarget({ line, column, anchor }),
            pageIndex,
          });
          const prevText = op.prevText ?? readEditableText(anchor);
          if (!bucket.origTexts.has(instanceId)) {
            bucket.origTexts.set(instanceId, { value: prevText });
          }
          if (!bucket.origHtmls.has(instanceId)) {
            const baseline = inlineBaselinesRef.current.get(anchor);
            bucket.origHtmls.set(
              instanceId,
              baseline?.text === prevText
                ? baseline.html
                : textEditHtml(captureTextDom(anchor), [
                    { seq, op: { kind: 'set-text', value: prevText } },
                  ]),
            );
          }
          const steps = appendTextEdit(
            bucket.textEdits.get(instanceId) ?? [],
            { ...op, prevText },
            seq,
          );
          bucket.textEdits.set(instanceId, steps);
          if (anchor.isConnected) {
            if (op.kind === 'set-text') setEditableText(anchor, op.value);
            else
              replayDomTextEdits(
                anchor,
                bucket.origHtmls.get(instanceId) ?? captureTextDom(anchor),
                steps,
              );
          }
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
    [refreshCount, ensureInstanceId, pageIndex],
  );

  // Pre-edit snapshot for history: capture the *currently effective* value of
  // each touched field so undo can restore exactly the prior state, including
  // the case where the bucket already had a buffered edit before this op.
  type StyleSnap = {
    kind: 'style';
    key: string;
  } & ({ value: Sequenced<StyleOp>; existed: true } | { value: string | null; existed: false });
  type TextSnap = {
    kind: 'text';
    instanceId: string;
    target?: SelectedTarget & { pageIndex: number };
    steps: TextEditStep[];
    html?: TextDomSnapshot;
    text?: string;
  };
  type AttrSnap = {
    kind: 'attr';
    attr: string;
    value: Sequenced<AssetAttrOp> | string | null;
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
        } else if (op.kind === 'set-text-range-style' || op.kind === 'set-text') {
          const instanceId = ensureInstanceId(anchor);
          snaps.push({
            kind: 'text',
            instanceId,
            target: bucket?.textTargets.get(instanceId),
            steps: bucket?.textEdits.get(instanceId) ?? [],
            html: bucket?.origHtmls.get(instanceId),
            text: bucket?.origTexts.get(instanceId)?.value,
          });
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
    (line: number, column: number, snaps: Snap[], recreate = false) => {
      const key = `${line}:${column}`;
      let bucket = pendingRef.current.get(key);
      if (!bucket && recreate) {
        bucket = createBucket(line, column);
        pendingRef.current.set(key, bucket);
      }
      if (!bucket) return;
      // Style/attr snaps share the loc-level anchor (first match);
      // text snaps look up their per-instance node below.
      const sharedAnchor = findAnchor(line, column);
      const sharedStyle = (sharedAnchor?.style ?? {}) as unknown as Record<string, string>;
      for (const snap of snaps) {
        if (snap.kind === 'style') {
          if (snap.existed) {
            const prev = snap.value;
            const v = prev.value ?? '';
            // Undo restores the edit's original position in the text timeline.
            bucket.styleOps.set(snap.key, { ...prev });
            if (sharedAnchor?.isConnected) sharedStyle[snap.key] = v;
          } else {
            bucket.styleOps.delete(snap.key);
            const orig = bucket.origStyle.get(snap.key);
            if (sharedAnchor?.isConnected) sharedStyle[snap.key] = orig ?? '';
          }
        } else if (snap.kind === 'text') {
          const textAnchor = findAnchor(line, column, snap.instanceId);
          if (snap.target) bucket.textTargets.set(snap.instanceId, snap.target);
          if (snap.html !== undefined) bucket.origHtmls.set(snap.instanceId, snap.html);
          if (snap.text !== undefined) bucket.origTexts.set(snap.instanceId, { value: snap.text });
          if (snap.steps.length) bucket.textEdits.set(snap.instanceId, snap.steps);
          else bucket.textEdits.delete(snap.instanceId);
          const html = bucket.origHtmls.get(snap.instanceId);
          if (textAnchor?.isConnected && html !== undefined) {
            replayDomTextEdits(textAnchor, html, snap.steps);
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
      if (bucket.styleOps.size === 0 && bucket.textEdits.size === 0 && bucket.attrOps.size === 0) {
        pendingRef.current.delete(key);
      }
      refreshCount();
    },
    [findAnchor, refreshCount],
  );

  const bufferOps = useCallback(
    (line: number, column: number, anchor: HTMLElement, ops: EditOp[]) => {
      const target = findSlideSource(anchor, slideId, { hostOnly: true }) ?? {
        line,
        column,
        anchor,
      };
      const instanceId = ops.some(
        (op) => op.kind === 'set-text' || op.kind === 'set-text-range-style',
      )
        ? ensureInstanceId(target.anchor)
        : undefined;
      const snaps = snapshotForOps(target.line, target.column, target.anchor, ops);
      applyOpsRaw(target.line, target.column, target.anchor, ops);
      const textAfter = snapshotForOps(target.line, target.column, target.anchor, ops).filter(
        (snap) => snap.kind === 'text',
      );
      const sharedOps = ops.filter(
        (op) => op.kind !== 'set-text' && op.kind !== 'set-text-range-style',
      );
      const first = ops[0];
      const opKey = first
        ? first.kind === 'set-style'
          ? first.key
          : first.kind === 'set-attr-asset'
            ? first.attr
            : 'text'
        : 'noop';
      const coalesceKey = `inspector:${target.line}:${target.column}:${first?.kind ?? 'noop'}:${opKey}`;
      history.record({
        coalesceKey,
        undo: () => restoreSnapshot(target.line, target.column, snaps),
        redo: () => {
          if (sharedOps.length) {
            applyOpsRaw(
              target.line,
              target.column,
              findAnchor(target.line, target.column, instanceId),
              sharedOps,
            );
          }
          if (textAfter.length) restoreSnapshot(target.line, target.column, textAfter, true);
        },
      });
    },
    [applyOpsRaw, snapshotForOps, restoreSnapshot, findAnchor, history, ensureInstanceId, slideId],
  );

  const bufferBatch = useCallback(
    (input: VisualEdit[], coalesceKey?: string) => {
      if (input.length === 0 || committing) return;
      const edits = input.map((edit) => ({
        ...edit,
        ...findSlideSource(edit.anchor, slideId, { hostOnly: true }),
      }));
      const snapshots = edits.map((edit) =>
        snapshotForOps(edit.line, edit.column, edit.anchor, edit.ops),
      );
      for (const edit of edits) applyOpsRaw(edit.line, edit.column, edit.anchor, edit.ops);
      history.record({
        coalesceKey,
        undo: () => {
          for (let index = edits.length - 1; index >= 0; index--) {
            const edit = edits[index];
            restoreSnapshot(edit.line, edit.column, snapshots[index]);
          }
        },
        redo: () => {
          for (const edit of edits)
            applyOpsRaw(edit.line, edit.column, findAnchor(edit.line, edit.column), edit.ops);
        },
      });
    },
    [applyOpsRaw, snapshotForOps, restoreSnapshot, findAnchor, history, committing, slideId],
  );

  const visual = useVisualEditor({
    active,
    inlineEditing: !!inlineEdit,
    committing,
    slideId,
    selection,
    setSelection,
    bufferBatch,
  });

  const commitEdits = useCallback(async () => {
    const buckets = pendingRef.current;
    if (buckets.size === 0) return;
    type PendingItem = {
      bucket: Bucket;
      seq: number;
      instanceId?: string;
      edit: Edit;
      onSuccess: (bucket: Bucket) => void;
    };
    const pending: PendingItem[] = [];
    for (const bucket of buckets.values()) {
      const { line, column, styleOps, textEdits, attrOps } = bucket;
      for (const [k, op] of styleOps) {
        pending.push({
          bucket,
          seq: op.seq,
          edit: {
            line,
            column,
            ops: [{ kind: 'set-style', key: k, value: op.value, prevText: op.prevText }],
          },
          onSuccess: (b) => {
            b.styleOps.delete(k);
            b.origStyle.delete(k);
          },
        });
      }
      for (const [attr, op] of attrOps) {
        pending.push({
          bucket,
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
            b.origAttrs.delete(attr);
          },
        });
      }
      for (const [instanceId, steps] of textEdits) {
        const target = bucket.textTargets.get(instanceId);
        for (const step of steps) {
          pending.push({
            bucket,
            seq: step.seq,
            instanceId,
            edit: {
              line: target?.line ?? line,
              column: target?.column ?? column,
              ops: [step.op],
            },
            onSuccess: (b) => {
              const html = b.origHtmls.get(instanceId);
              if (html !== undefined) b.origHtmls.set(instanceId, textEditHtml(html, [step]));
              if (step.op.kind === 'set-text')
                b.origTexts.set(instanceId, { value: step.op.value });
              const remaining = (b.textEdits.get(instanceId) ?? []).filter(
                (item) => item.seq !== step.seq,
              );
              if (remaining.length) b.textEdits.set(instanceId, remaining);
              else b.textEdits.delete(instanceId);
            },
          });
        }
      }
    }
    pending.sort((a, b) => a.seq - b.seq);
    const lastTextEdit = new Map<string, number>();
    for (const [index, item] of pending.entries()) {
      if (!item.instanceId) continue;
      item.edit.dependsOn = lastTextEdit.get(item.instanceId);
      lastTextEdit.set(item.instanceId, index);
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
        const bucket = item.bucket;
        if (r.ok) {
          item.onSuccess(bucket);
          if (
            bucket.styleOps.size === 0 &&
            bucket.textEdits.size === 0 &&
            bucket.attrOps.size === 0
          ) {
            for (const [key, pendingBucket] of pendingRef.current) {
              if (pendingBucket === bucket) pendingRef.current.delete(key);
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
        if (textEl?.isConnected) textEl.innerHTML = html.html;
      }
      for (const [instanceId, orig] of b.origTexts) {
        const textEl =
          root?.querySelector<HTMLElement>(`[${INSTANCE_ID_ATTR}="${instanceId}"]`) ?? null;
        if (textEl?.isConnected) setEditableText(textEl, orig.value);
      }
    }
    pendingRef.current = new Map();
    setPendingCount(0);
    setOpsVersion((version) => version + 1);
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
      for (const [attr, op] of bucket.attrOps) {
        if (el.getAttribute(attr) !== op.previewUrl) el.setAttribute(attr, op.previewUrl);
      }
    };

    let observer: MutationObserver | null = null;
    const replayAll = () => {
      if (pendingRef.current.size === 0) return;
      observer?.disconnect();
      const relocations: { key: string; nextKey: string; bucket: Bucket }[] = [];
      for (const [key, bucket] of pendingRef.current) {
        for (const [instanceId, target] of bucket.textTargets) {
          if (target.pageIndex !== pageIndex) continue;
          const stamped = root.querySelector<HTMLElement>(`[${INSTANCE_ID_ATTR}="${instanceId}"]`);
          const anchor = stamped ?? findRememberedTarget(root, target.canvasPath);
          if (!anchor || anchor.tagName !== target.anchor.tagName) continue;
          const steps = bucket.textEdits.get(instanceId) ?? [];
          const html = bucket.origHtmls.get(instanceId);
          if (!html) continue;
          if (!stamped) {
            const text = readEditableText(anchor);
            const matchesBaseline = bucket.origTexts.get(instanceId)?.value === text;
            if (
              !matchesBaseline &&
              !steps.some((step) => step.op.kind === 'set-text' && step.op.value === text)
            )
              continue;
          }
          const hit = findSlideSource(anchor, slideId, { hostOnly: true });
          if (!hit || hit.anchor !== anchor) continue;
          anchor.setAttribute(INSTANCE_ID_ATTR, instanceId);
          bucket.textTargets.set(instanceId, { ...rememberTarget(hit), pageIndex });
          bucket.line = hit.line;
          bucket.column = hit.column;
          replayDomTextEdits(anchor, html, steps);
        }
        const nextKey = `${bucket.line}:${bucket.column}`;
        if (nextKey !== key) relocations.push({ key, nextKey, bucket });
      }
      let moved = true;
      while (moved) {
        moved = false;
        for (let index = relocations.length - 1; index >= 0; index--) {
          const { key, nextKey, bucket } = relocations[index];
          if (pendingRef.current.has(nextKey)) continue;
          pendingRef.current.delete(key);
          pendingRef.current.set(nextKey, bucket);
          relocations.splice(index, 1);
          moved = true;
        }
      }
      root.querySelectorAll<HTMLElement>('[data-slide-loc]').forEach(applyBuffered);
      observer?.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-slide-loc'],
      });
    };

    replayAll();
    observer = new MutationObserver(replayAll);
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-slide-loc'],
    });
    return () => observer?.disconnect();
  }, [pageIndex, slideId]);

  useEffect(() => {
    void pageIndex;
    setSelected(null);
  }, [pageIndex, setSelected]);

  useEffect(() => {
    if (!selection.length) return;
    const root = document.querySelector<HTMLElement>('[data-inspector-root]');
    if (!root) return;
    const revalidate = () => {
      let changed = false;
      const next = selection.map((target) => {
        const anchor = target.anchor.isConnected
          ? target.anchor
          : (findRememberedTarget(root, target.canvasPath) ??
            root.querySelector<HTMLElement>(`[data-slide-loc="${target.line}:${target.column}"]`));
        if (!anchor) return target;
        const hit = findSlideSource(anchor, slideId, { hostOnly: true });
        if (
          !hit ||
          (hit.anchor === target.anchor && hit.line === target.line && hit.column === target.column)
        )
          return target;
        changed = true;
        return rememberTarget(hit);
      });
      if (changed) setSelection(next);
    };
    revalidate();
    const observer = new MutationObserver(revalidate);
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-slide-loc'],
    });
    return () => observer.disconnect();
  }, [selection, setSelection, slideId]);

  const toggle = useCallback(() => {
    if (active) {
      setSelected(null);
      setInlineEdit(null);
    }
    setActive(!active);
  }, [active, setSelected]);

  const togglePanel = useCallback(() => {
    setPanelOpen(!active || panelHidden || !panelOpen);
    setActive(true);
    onPanelOpen?.();
  }, [active, panelHidden, panelOpen, onPanelOpen]);

  const cancel = useCallback(() => {
    setSelected(null);
  }, [setSelected]);

  const inlineEditSessionRef = useRef(0);
  const startInlineEdit = useCallback(
    (target: InlineEditTarget) => {
      inlineBaselinesRef.current.set(target.anchor, {
        text: readEditableText(target.anchor),
        html: captureTextDom(target.anchor),
      });
      setInlineSelection(null);
      setSelection([{ line: target.line, column: target.column, anchor: target.anchor }]);
      setInlineEdit({ ...target, session: ++inlineEditSessionRef.current });
    },
    [setSelection],
  );

  const stopInlineEdit = useCallback(() => {
    setInlineEdit(null);
    setInlineSelection(null);
  }, []);

  // Deselecting, selecting another element, or an HMR anchor swap all end
  // the inline session — the contenteditable node is gone or no longer the
  // selection's anchor.
  useEffect(() => {
    if (inlineEdit && selected?.anchor !== inlineEdit.anchor) stopInlineEdit();
  }, [selected, inlineEdit, stopInlineEdit]);

  const openReplace = useCallback((anchor: HTMLElement) => {
    const loc = anchor.dataset.slideLoc;
    if (!loc) return;
    const [lineStr, columnStr] = loc.split(':');
    const line = Number(lineStr);
    const column = Number(columnStr);
    if (!Number.isFinite(line) || !Number.isFinite(column)) return;
    setReplaceTarget({ line, column, anchor });
  }, []);

  useEffect(() => {
    if (import.meta.env.PROD) return;
    const onKey = (e: KeyboardEvent) => {
      if (
        e.defaultPrevented ||
        isShortcutControlTarget(e.target) ||
        isTypingTarget(e.target) ||
        e.isComposing ||
        e.keyCode === 229 ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      )
        return;
      if (e.key !== 'i' && e.key !== 'I') return;
      e.preventDefault();
      togglePanel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePanel]);

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
      panelOpen,
      panelHidden,
      togglePanel,
      cancel,
      comments,
      error,
      add,
      remove,
      selection,
      setSelection,
      bufferBatch,
      visual,
      selected,
      setSelected,
      inlineEdit,
      inlineSelection,
      setInlineSelection,
      registerInlineStyle,
      applyInlineStyle,
      startInlineEdit,
      stopInlineEdit,
      opsVersion,
      applyEdit,
      bufferOps,
      pendingCount,
      commitEdits,
      cancelEdits,
      committing,
      openCrop,
      openReplace,
    }),
    [
      slideId,
      active,
      toggle,
      panelOpen,
      panelHidden,
      togglePanel,
      cancel,
      comments,
      error,
      add,
      remove,
      selection,
      setSelection,
      setSelected,
      bufferBatch,
      visual,
      selected,
      inlineEdit,
      inlineSelection,
      registerInlineStyle,
      applyInlineStyle,
      startInlineEdit,
      stopInlineEdit,
      opsVersion,
      applyEdit,
      bufferOps,
      pendingCount,
      commitEdits,
      cancelEdits,
      committing,
      openCrop,
      openReplace,
    ],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {replaceTarget && (
        <AssetPickerDialog
          slideId={slideId}
          onClose={() => setReplaceTarget(null)}
          onPick={(asset, scope) => {
            const { line, column, anchor } = replaceTarget;
            const assetPath =
              scope === 'global' ? `@assets/${asset.name}` : `./assets/${asset.name}`;
            const ops: EditOp[] = [
              {
                kind: 'set-attr-asset',
                attr: 'src',
                assetPath,
                previewUrl: asset.url,
              },
            ];
            if (anchor.tagName === 'IMG' && anchor.isConnected) {
              const cs = window.getComputedStyle(anchor);
              if (cs.objectFit !== 'cover' && cs.objectFit !== 'contain') {
                ops.push({ kind: 'set-style', key: 'objectFit', value: 'cover' });
              }
              const op = cs.objectPosition.trim();
              if (!op || op === '0% 0%' || op === 'auto') {
                ops.push({ kind: 'set-style', key: 'objectPosition', value: '50% 50%' });
              }
            }
            bufferOps(line, column, anchor, ops);
            setReplaceTarget(null);
          }}
        />
      )}
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
  const { active, toggle, panelOpen, panelHidden, togglePanel } = useInspector();
  if (import.meta.env.PROD) return null;
  return (
    <div className="flex items-center gap-1" data-inspector-ui>
      <ToggleGroup
        size="sm"
        spacing={1}
        value={[active ? 'edit' : 'preview']}
        onValueChange={(value) => {
          const next = value[0];
          if (next && (next === 'edit') !== active) toggle();
        }}
        aria-label={`${t.inspector.previewMode} / ${t.inspector.editMode}`}
        className="h-8 gap-0 rounded-lg border border-border/70 bg-muted/70 p-0.5"
      >
        <ToggleGroupItem
          value="preview"
          title={t.inspector.previewMode}
          aria-label={t.inspector.previewMode}
          onClick={(event) => {
            if (event.detail > 0) event.currentTarget.blur();
          }}
          className="h-full w-8 rounded-md px-0 text-muted-foreground hover:bg-transparent data-pressed:bg-card data-pressed:text-foreground data-pressed:shadow-edge"
        >
          <Eye />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="edit"
          title={t.inspector.editMode}
          aria-label={t.inspector.editMode}
          onClick={(event) => {
            if (event.detail > 0) event.currentTarget.blur();
          }}
          className="h-full w-8 rounded-md px-0 text-muted-foreground hover:bg-transparent data-pressed:bg-card data-pressed:text-foreground data-pressed:shadow-edge"
        >
          <CodeXml />
        </ToggleGroupItem>
      </ToggleGroup>
      <Button
        size="sm"
        variant={active && panelOpen && !panelHidden ? 'secondary' : 'ghost'}
        onClick={togglePanel}
        aria-pressed={active && panelOpen && !panelHidden}
        title={t.inspector.format}
        aria-label={t.inspector.format}
      >
        <PanelRight className="size-3.5" />
        <span className="hidden md:inline">{t.inspector.format}</span>
      </Button>
    </div>
  );
}
