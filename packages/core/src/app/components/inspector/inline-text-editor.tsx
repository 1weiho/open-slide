import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Minus, Plus } from 'lucide-react';
import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useHistory } from '@/components/history-provider';
import { findSlideSource } from '@/lib/inspector/fiber';
import {
  isEditableTextContainer,
  isInspectableEventTarget,
  pickElement,
  pickInspectorTarget,
} from '@/lib/inspector/pick-target';
import {
  restoreTextSelection,
  selectionTextOffsets,
  styleContext,
} from '@/lib/inspector/text-selection';
import type { EditOp } from '@/lib/inspector/use-editor';
import { isTypingTarget } from '@/lib/keys';
import { useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import { type InlineEditTarget, readEditableText, useInspector } from './inspector-provider';

type RelRect = { left: number; top: number; width: number; height: number };
type TextRange = { start: number; end: number };

const RANGE_STYLE_KEYS = new Set(['fontSize', 'fontWeight', 'fontStyle', 'fontFamily', 'color']);
const TOOLBAR_GAP = 8;
const TOOLBAR_HEIGHT = 36;

function pickEditableAnchor(
  x: number,
  y: number,
  slideId: string,
): { line: number; column: number; anchor: HTMLElement } | null {
  const el = pickInspectorTarget(pickElement(x, y));
  if (!el) return null;
  const hit = findSlideSource(el, slideId, { hostOnly: true });
  if (!hit) return null;
  // Images keep their double-click behavior (crop, in inspect mode).
  if (hit.anchor instanceof HTMLImageElement) return null;
  if (!isEditableTextContainer(hit.anchor)) return null;
  return hit;
}

export function InlineEditLayer() {
  const { slideId, active, inlineEdit, selected, selection, startInlineEdit, stopInlineEdit } =
    useInspector();
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const onDblClick = (event: MouseEvent) => {
      if (inlineEdit?.anchor.contains(event.target as Node)) return;
      if (!isInspectableEventTarget(event.target)) return;
      const hit = pickEditableAnchor(event.clientX, event.clientY, slideId);
      if (!hit) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      startInlineEdit({ ...hit, point: { x: event.clientX, y: event.clientY }, selectWord: true });
    };
    const onKey = (event: KeyboardEvent) => {
      if (
        event.key !== 'Enter' ||
        event.isComposing ||
        event.keyCode === 229 ||
        inlineEdit ||
        !selected ||
        selection.length !== 1
      )
        return;
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey ||
        isTypingTarget(event.target)
      )
        return;
      if (
        event.target instanceof Element &&
        event.target.closest(
          '[data-inspector-ui], [role="dialog"], [role="menu"], [role="listbox"], button, a',
        )
      )
        return;
      if (!isEditableTextContainer(selected.anchor)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      startInlineEdit(selected);
    };
    window.addEventListener('dblclick', onDblClick, true);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('dblclick', onDblClick, true);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [active, slideId, inlineEdit, selected, selection.length, startInlineEdit]);

  useEffect(() => {
    if (!inlineEdit) return;
    const { anchor } = inlineEdit;
    const onPointerDown = (event: PointerEvent) => {
      if (anchor.contains(event.target as Node) || !isInspectableEventTarget(event.target)) return;
      stopInlineEdit();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.isComposing || event.keyCode === 229) return;
      if (
        event.target instanceof Element &&
        event.target.closest(
          '[data-inspector-ui], [role="dialog"], [role="menu"], [role="listbox"]',
        )
      )
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
      stopInlineEdit();
    };
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [inlineEdit, stopInlineEdit]);

  if (import.meta.env.PROD) return null;
  return (
    <div ref={layerRef} data-inspector-ui className="pointer-events-none absolute inset-0 z-30">
      {inlineEdit && (
        <ActiveInlineEditor
          key={inlineEdit.session ?? `${inlineEdit.line}:${inlineEdit.column}`}
          target={inlineEdit}
          layerRef={layerRef}
        />
      )}
    </div>
  );
}

const INLINE_EDITING_CSS = `
[data-inspector-root] [data-slide-editing][data-slide-editing],
[data-inspector-root] [data-slide-editing][data-slide-editing] * {
  cursor: text !important;
  -webkit-user-select: text !important;
  user-select: text !important;
}
[data-inspector-root] [data-slide-editing][data-slide-editing] {
  outline: none !important;
}
`;

function ActiveInlineEditor({
  target,
  layerRef,
}: {
  target: InlineEditTarget;
  layerRef: RefObject<HTMLDivElement | null>;
}) {
  const {
    bufferOps,
    stopInlineEdit,
    setInlineSelection,
    registerInlineStyle,
    panelOpen,
    panelHidden,
    opsVersion,
    committing,
  } = useInspector();
  const history = useHistory();
  const [sel, setSel] = useState<TextRange | null>(null);
  const selectionRef = useRef<TextRange | null>(null);
  const { anchor } = target;
  const rect = useAnchorRect(anchor, layerRef);
  const previousTextRef = useRef(readEditableText(anchor));

  const commit = useCallback(() => {
    if (!anchor.isConnected) return;
    const value = readEditableText(anchor);
    const prevText = previousTextRef.current;
    if (value === prevText) return;
    previousTextRef.current = value;
    bufferOps(target.line, target.column, anchor, [{ kind: 'set-text', value, prevText }]);
  }, [anchor, target.line, target.column, bufferOps]);

  const applyStyleOps = useCallback(
    (ops: EditOp[]) => {
      if (!anchor.isConnected || ops.some((op) => op.kind !== 'set-style')) return false;
      commit();
      const range = selectionTextOffsets(anchor) ?? selectionRef.current;
      const focused = document.activeElement;
      const prevText = readEditableText(anchor);
      bufferOps(
        target.line,
        target.column,
        anchor,
        ops.map((op): EditOp => {
          if (op.kind !== 'set-style') return op;
          return range && range.end > range.start && RANGE_STYLE_KEYS.has(op.key)
            ? { ...op, kind: 'set-text-range-style', ...range, prevText }
            : { ...op, prevText };
        }),
      );
      if (range) restoreTextSelection(anchor, range);
      if (
        focused instanceof HTMLElement &&
        focused !== document.body &&
        !anchor.contains(focused)
      ) {
        focused.focus({ preventScroll: true });
      }
      return true;
    },
    [anchor, target.line, target.column, bufferOps, commit],
  );

  useEffect(() => registerInlineStyle(applyStyleOps), [registerInlineStyle, applyStyleOps]);
  useEffect(() => {
    void opsVersion;
    previousTextRef.current = readEditableText(anchor);
  }, [anchor, opsVersion]);

  const applyTextStyle = useCallback(
    (key: string, value: string | null) => {
      applyStyleOps([{ kind: 'set-style', key, value }]);
    },
    [applyStyleOps],
  );

  const toggleBold = useCallback(() => {
    const bold = parseInt(getComputedStyle(styleContext(anchor, sel)).fontWeight, 10) >= 600;
    applyTextStyle('fontWeight', bold ? '400' : '700');
  }, [anchor, sel, applyTextStyle]);

  const toggleItalic = useCallback(() => {
    const italic = getComputedStyle(styleContext(anchor, sel)).fontStyle === 'italic';
    applyTextStyle('fontStyle', italic ? 'normal' : 'italic');
  }, [anchor, sel, applyTextStyle]);

  const applyHistory = useCallback(
    (redo: boolean) => {
      if (committing) return;
      commit();
      const range = selectionTextOffsets(anchor) ?? selectionRef.current;
      if (redo) history.redo();
      else history.undo();
      previousTextRef.current = readEditableText(anchor);
      if (range) restoreTextSelection(anchor, range);
    },
    [anchor, commit, committing, history.undo, history.redo],
  );

  // The setup effect must run exactly once per anchor — re-running it would
  // re-place the caret and clobber the user's live selection — so everything
  // with an unstable identity is reached through latest-refs.
  const latestRef = useRef({ commit, toggleBold, toggleItalic, applyHistory });
  latestRef.current = { commit, toggleBold, toggleItalic, applyHistory };
  const initialCaretRef = useRef({ point: target.point, selectWord: target.selectWord ?? false });

  useEffect(() => {
    anchor.setAttribute('contenteditable', 'true');
    anchor.setAttribute('spellcheck', 'false');
    anchor.setAttribute('data-slide-editing', 'true');
    const styleEl = document.createElement('style');
    styleEl.textContent = INLINE_EDITING_CSS;
    document.head.appendChild(styleEl);
    focusAndPlaceCaret(anchor, initialCaretRef.current.point, initialCaretRef.current.selectWord);

    const onBeforeInput = (e: Event) => {
      const ev = e as InputEvent;
      if (ev.isComposing) return;
      const type = ev.inputType;
      if (type === 'historyUndo' || type === 'historyRedo') {
        ev.preventDefault();
        latestRef.current.applyHistory(type === 'historyRedo');
      } else if (type === 'insertParagraph' || type === 'insertLineBreak') {
        ev.preventDefault();
        document.execCommand('insertLineBreak');
      } else if (type === 'insertFromPaste' || type === 'insertFromDrop') {
        ev.preventDefault();
        const text = ev.dataTransfer?.getData('text/plain') ?? ev.data;
        if (text) document.execCommand('insertText', false, text);
      } else if (type === 'formatBold') {
        ev.preventDefault();
        latestRef.current.toggleBold();
      } else if (type === 'formatItalic') {
        ev.preventDefault();
        latestRef.current.toggleItalic();
      } else if (type.startsWith('format')) {
        ev.preventDefault();
      }
    };
    const onInput = (e: Event) => {
      if ((e as InputEvent).isComposing) return;
      latestRef.current.commit();
    };
    const onCompositionEnd = () => latestRef.current.commit();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing || e.keyCode === 229) return;
      if ((e.metaKey || e.ctrlKey) && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 'b') {
          e.preventDefault();
          latestRef.current.toggleBold();
        } else if (key === 'i') {
          e.preventDefault();
          latestRef.current.toggleItalic();
        } else if (key === 'z' || (key === 'y' && e.ctrlKey)) {
          e.preventDefault();
          latestRef.current.applyHistory(e.shiftKey || key === 'y');
        }
      }
    };
    const onSelectionChange = () => {
      const offsets = selectionTextOffsets(anchor);
      if (offsets === null) return;
      if (selectionRef.current?.start === offsets.start && selectionRef.current.end === offsets.end)
        return;
      selectionRef.current = offsets;
      const range = offsets.end > offsets.start ? offsets : null;
      setSel(range);
      setInlineSelection(range);
    };

    anchor.addEventListener('beforeinput', onBeforeInput);
    anchor.addEventListener('input', onInput);
    anchor.addEventListener('compositionend', onCompositionEnd);
    anchor.addEventListener('keydown', onKeyDown);
    document.addEventListener('selectionchange', onSelectionChange);
    onSelectionChange();
    return () => {
      anchor.removeEventListener('beforeinput', onBeforeInput);
      anchor.removeEventListener('input', onInput);
      anchor.removeEventListener('compositionend', onCompositionEnd);
      anchor.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('selectionchange', onSelectionChange);
      styleEl.remove();
      if (anchor.isConnected) {
        if (document.activeElement === anchor) anchor.blur();
        anchor.removeAttribute('contenteditable');
        anchor.removeAttribute('spellcheck');
        anchor.removeAttribute('data-slide-editing');
      }
    };
  }, [anchor, setInlineSelection]);

  // An HMR remount replaces the anchor node (taking its contenteditable
  // attribute with it), so a disconnected anchor ends the session.
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-inspector-root]');
    if (!root) return;
    const check = () => {
      if (!anchor.isConnected) stopInlineEdit();
    };
    const observer = new MutationObserver(check);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [anchor, stopInlineEdit]);

  if (!rect) return null;
  return (
    <>
      {(!panelOpen || panelHidden) && (
        <TextToolbar
          anchor={anchor}
          layerRef={layerRef}
          rect={rect}
          sel={sel}
          applyStyle={applyTextStyle}
        />
      )}
    </>
  );
}

function useAnchorRect(
  anchor: HTMLElement,
  layerRef: RefObject<HTMLDivElement | null>,
): RelRect | null {
  const [rect, setRect] = useState<RelRect | null>(null);

  const measure = useCallback(() => {
    const layer = layerRef.current;
    if (!anchor.isConnected || !layer) return;
    const a = anchor.getBoundingClientRect();
    const o = layer.getBoundingClientRect();
    const next = { left: a.left - o.left, top: a.top - o.top, width: a.width, height: a.height };
    setRect((prev) =>
      prev &&
      Math.abs(prev.left - next.left) < 0.5 &&
      Math.abs(prev.top - next.top) < 0.5 &&
      Math.abs(prev.width - next.width) < 0.5 &&
      Math.abs(prev.height - next.height) < 0.5
        ? prev
        : next,
    );
  }, [anchor, layerRef]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    let scheduled = 0;
    const scheduleMeasure = () => {
      cancelAnimationFrame(scheduled);
      scheduled = requestAnimationFrame(measure);
    };
    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(anchor);
    if (layerRef.current) resizeObserver.observe(layerRef.current);
    window.addEventListener('resize', scheduleMeasure, true);
    window.addEventListener('scroll', scheduleMeasure, true);
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(scheduled);
      window.removeEventListener('resize', scheduleMeasure, true);
      window.removeEventListener('scroll', scheduleMeasure, true);
    };
  }, [measure, anchor, layerRef]);

  return rect;
}

function TextToolbar({
  anchor,
  layerRef,
  rect,
  sel,
  applyStyle,
}: {
  anchor: HTMLElement;
  layerRef: RefObject<HTMLDivElement | null>;
  rect: RelRect;
  sel: TextRange | null;
  applyStyle: (key: string, value: string | null) => void;
}) {
  const { opsVersion } = useInspector();
  const t = useLocale();
  const toolbarRef = useRef<HTMLDivElement>(null);

  void opsVersion;
  const contextEl = styleContext(anchor, sel);
  const cs = anchor.isConnected ? getComputedStyle(contextEl) : null;
  const fontSize = cs ? Math.round(parseFloat(cs.fontSize) || 16) : 16;
  const bold = cs ? parseInt(cs.fontWeight, 10) >= 600 : false;
  const italic = cs ? cs.fontStyle === 'italic' : false;
  const color = cs ? (rgbToHex(cs.color) ?? '#000000') : '#000000';
  const anchorAlign = anchor.isConnected ? getComputedStyle(anchor).textAlign : 'left';
  const align =
    anchorAlign === 'center' || anchorAlign === 'right' || anchorAlign === 'justify'
      ? anchorAlign
      : 'left';

  const layerWidth = layerRef.current?.clientWidth ?? 0;
  const barWidth = toolbarRef.current?.offsetWidth ?? 0;
  const centerX = rect.left + rect.width / 2;
  const clampedX =
    barWidth > 0 && layerWidth > 0
      ? Math.min(Math.max(centerX, barWidth / 2 + 4), layerWidth - barWidth / 2 - 4)
      : centerX;
  const above = rect.top - TOOLBAR_HEIGHT - TOOLBAR_GAP >= 0;
  const top = above ? rect.top - TOOLBAR_GAP : rect.top + rect.height + TOOLBAR_GAP;

  const setFontSize = (px: number) => {
    if (!Number.isFinite(px)) return;
    applyStyle('fontSize', `${Math.min(Math.max(Math.round(px), 4), 400)}px`);
  };

  return (
    <div
      ref={toolbarRef}
      data-inspector-ui
      className="pointer-events-auto absolute z-10 flex items-center gap-0.5 rounded-[8px] border border-border bg-popover p-1 text-popover-foreground shadow-floating"
      style={{
        left: clampedX,
        top,
        transform: above ? 'translate(-50%, -100%)' : 'translateX(-50%)',
      }}
      onPointerDown={(e) => {
        // Keep focus (and the text selection) inside the contenteditable.
        e.preventDefault();
      }}
    >
      <ToolbarIconButton
        label={t.inspector.decreaseFontSize}
        onClick={() => setFontSize(fontSize - 1)}
      >
        <Minus className="size-3.5" />
      </ToolbarIconButton>
      <FontSizeInput value={fontSize} onCommit={setFontSize} label={t.inspector.sizeLabel} />
      <ToolbarIconButton
        label={t.inspector.increaseFontSize}
        onClick={() => setFontSize(fontSize + 1)}
      >
        <Plus className="size-3.5" />
      </ToolbarIconButton>
      <span aria-hidden className="mx-0.5 h-4 w-px bg-hairline" />
      <ToolbarIconButton
        label={t.inspector.boldAria}
        pressed={bold}
        onClick={() => applyStyle('fontWeight', bold ? '400' : '700')}
      >
        <Bold className="size-3.5" />
      </ToolbarIconButton>
      <ToolbarIconButton
        label={t.inspector.italicAria}
        pressed={italic}
        onClick={() => applyStyle('fontStyle', italic ? 'normal' : 'italic')}
      >
        <Italic className="size-3.5" />
      </ToolbarIconButton>
      <label
        className="relative ml-0.5 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[5px] transition-colors duration-150 hover:bg-muted"
        aria-label={t.inspector.textColor}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span
          className="size-4 rounded-[3px] border border-foreground/15"
          style={{ backgroundColor: color }}
        />
        <input
          type="color"
          value={color}
          onChange={(e) => applyStyle('color', e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
      <span aria-hidden className="mx-0.5 h-4 w-px bg-hairline" />
      {(
        [
          ['left', AlignLeft],
          ['center', AlignCenter],
          ['right', AlignRight],
        ] as const
      ).map(([value, Icon]) => (
        <ToolbarIconButton
          key={value}
          label={value}
          pressed={align === value}
          onClick={() => applyStyle('textAlign', value === 'left' ? null : value)}
        >
          <Icon className="size-3.5" />
        </ToolbarIconButton>
      ))}
    </div>
  );
}

function ToolbarIconButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
      className={cn(
        'inline-flex size-7 items-center justify-center rounded-[5px] transition-[background-color,color,scale] duration-150 active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
        pressed
          ? 'bg-muted text-foreground'
          : 'text-foreground/85 hover:bg-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function FontSizeInput({
  value,
  onCommit,
  label,
}: {
  value: number;
  onCommit: (px: number) => void;
  label: string;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const n = parseFloat(draft);
    if (Number.isFinite(n)) onCommit(n);
    else setDraft(String(value));
  };
  return (
    <input
      type="text"
      inputMode="numeric"
      value={draft}
      aria-label={label}
      onPointerDown={(e) => e.stopPropagation()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          onCommit(value + 1);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          onCommit(value - 1);
        }
        e.stopPropagation();
      }}
      className="nums h-7 w-9 rounded-[5px] border border-transparent bg-transparent text-center font-mono text-[11px] text-foreground outline-none transition-colors duration-150 hover:border-hairline focus:border-ring/50"
    />
  );
}

function focusAndPlaceCaret(
  anchor: HTMLElement,
  point: { x: number; y: number } | undefined,
  selectWord: boolean,
) {
  anchor.focus({ preventScroll: true });
  const selection = window.getSelection();
  if (!selection) return;
  if (point) {
    const range = caretRangeAtPoint(point.x, point.y);
    if (range && anchor.contains(range.startContainer)) {
      selection.removeAllRanges();
      selection.addRange(range);
      const modifiable = selection as Selection & {
        modify?: (alter: string, direction: string, granularity: string) => void;
      };
      if (
        selectWord &&
        typeof modifiable.modify === 'function' &&
        range.startContainer instanceof Text
      ) {
        modifiable.modify('move', 'backward', 'word');
        modifiable.modify('extend', 'forward', 'word');
      }
      return;
    }
  }
  const range = document.createRange();
  range.selectNodeContents(anchor);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function caretRangeAtPoint(x: number, y: number): Range | null {
  const doc = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  };
  if (typeof doc.caretRangeFromPoint === 'function') return doc.caretRangeFromPoint(x, y);
  const pos = doc.caretPositionFromPoint?.(x, y);
  if (!pos) return null;
  const range = document.createRange();
  try {
    range.setStart(pos.offsetNode, pos.offset);
  } catch {
    return null;
  }
  range.collapse(true);
  return range;
}

function rgbToHex(value: string): string | null {
  const m = value.match(/^rgba?\(([^)]+)\)$/);
  if (!m) return null;
  const parts = m[1].split(',').map((s) => s.trim());
  if (parts.length < 3) return null;
  const bytes = parts.slice(0, 3).map((p) => {
    const n = Math.round(Number(p));
    return Math.max(0, Math.min(255, Number.isFinite(n) ? n : 0));
  });
  return `#${bytes.map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}
