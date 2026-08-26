import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Minus, Plus } from 'lucide-react';
import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { findSlideSource } from '@/lib/inspector/fiber';
import {
  isEditableTextContainer,
  isInspectableEventTarget,
  pickElement,
  pickInspectorTarget,
} from '@/lib/inspector/pick-target';
import { useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import {
  collectDomTextParts,
  type DomTextPart,
  type InlineEditTarget,
  readEditableText,
  useInspector,
} from './inspector-provider';

type RelRect = { left: number; top: number; width: number; height: number };
type TextRange = { start: number; end: number };

const RANGE_STYLE_KEYS = new Set(['fontSize', 'fontWeight', 'fontStyle', 'color']);
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

// Click-to-edit lives outside the inspector: it works in the plain slide
// view, without activating inspect mode or opening the panel.
export function InlineEditLayer() {
  const { slideId, active, inlineEdit, startInlineEdit, stopInlineEdit } = useInspector();
  const layerRef = useRef<HTMLDivElement>(null);

  // Plain view: a single click on a text run starts editing with the caret
  // at the click point. A double-click's second click lands on the
  // now-contenteditable element, so native word selection still happens.
  useEffect(() => {
    if (import.meta.env.PROD || active) return;
    const onClick = (e: MouseEvent) => {
      if (inlineEdit?.anchor.contains(e.target as Node)) return;
      if (!isInspectableEventTarget(e.target)) return;
      const hit = pickEditableAnchor(e.clientX, e.clientY, slideId);
      if (!hit) return;
      e.preventDefault();
      e.stopPropagation();
      startInlineEdit({
        line: hit.line,
        column: hit.column,
        anchor: hit.anchor,
        point: { x: e.clientX, y: e.clientY },
        selectWord: false,
      });
    };
    window.addEventListener('click', onClick, true);
    return () => window.removeEventListener('click', onClick, true);
  }, [active, slideId, inlineEdit, startInlineEdit]);

  // Inspect mode keeps double-click entry — a single click there means
  // "select the element for the panel".
  useEffect(() => {
    if (import.meta.env.PROD || !active) return;
    const onDblClick = (e: MouseEvent) => {
      if (inlineEdit?.anchor.contains(e.target as Node)) return;
      if (!isInspectableEventTarget(e.target)) return;
      const hit = pickEditableAnchor(e.clientX, e.clientY, slideId);
      if (!hit) return;
      e.preventDefault();
      e.stopPropagation();
      startInlineEdit({
        line: hit.line,
        column: hit.column,
        anchor: hit.anchor,
        point: { x: e.clientX, y: e.clientY },
        selectWord: true,
      });
    };
    window.addEventListener('dblclick', onDblClick, true);
    return () => window.removeEventListener('dblclick', onDblClick, true);
  }, [active, slideId, inlineEdit, startInlineEdit]);

  useEffect(() => {
    if (!inlineEdit) return;
    const { anchor } = inlineEdit;
    const onPointerDown = (e: PointerEvent) => {
      if (anchor.contains(e.target as Node)) return;
      if (e.target instanceof Element && e.target.closest('[data-inspector-ui]')) return;
      // In the plain view a single click on another text run switches the
      // session to it; in inspect mode a click means "select", so just exit.
      if (!active && isInspectableEventTarget(e.target)) {
        const hit = pickEditableAnchor(e.clientX, e.clientY, slideId);
        if (hit) {
          e.preventDefault();
          startInlineEdit({
            line: hit.line,
            column: hit.column,
            anchor: hit.anchor,
            point: { x: e.clientX, y: e.clientY },
            selectWord: false,
          });
          return;
        }
      }
      stopInlineEdit();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      stopInlineEdit();
    };
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [inlineEdit, active, slideId, startInlineEdit, stopInlineEdit]);

  // Hovering an editable text run in the plain view shows a text cursor and
  // a light outline — the discoverability cue for click-to-edit.
  useEffect(() => {
    if (import.meta.env.PROD || active) return;
    const styleEl = document.createElement('style');
    styleEl.textContent = HOVER_HINT_CSS;
    document.head.appendChild(styleEl);
    let hovered: HTMLElement | null = null;
    let raf = 0;
    const clear = () => {
      const el = hovered;
      hovered = null;
      if (!el) return;
      if (el.getAttribute(TEXT_HOVER_ATTR) !== 'true') {
        el.removeAttribute(TEXT_HOVER_ATTR);
        return;
      }
      el.setAttribute(TEXT_HOVER_ATTR, 'out');
      window.setTimeout(() => {
        // Re-entering the element mid-fade flips the value back to 'true'.
        if (el.getAttribute(TEXT_HOVER_ATTR) === 'out') el.removeAttribute(TEXT_HOVER_ATTR);
      }, HOVER_FADE_MS + 40);
    };
    const onMove = (e: PointerEvent) => {
      const { clientX, clientY, target } = e;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const hit = isInspectableEventTarget(target)
          ? pickEditableAnchor(clientX, clientY, slideId)
          : null;
        const anchor =
          hit && hit.anchor.getAttribute('contenteditable') !== 'true' ? hit.anchor : null;
        if (anchor === hovered) return;
        clear();
        if (anchor) {
          hovered = anchor;
          if (anchor.hasAttribute(TEXT_HOVER_ATTR)) {
            // Mid-fade-out re-entry: transition straight back to visible.
            anchor.setAttribute(TEXT_HOVER_ATTR, 'true');
          } else {
            anchor.setAttribute(TEXT_HOVER_ATTR, 'in');
            requestAnimationFrame(() => {
              if (hovered === anchor && anchor.getAttribute(TEXT_HOVER_ATTR) === 'in') {
                anchor.setAttribute(TEXT_HOVER_ATTR, 'true');
              }
            });
          }
        }
      });
    };
    window.addEventListener('pointermove', onMove, true);
    return () => {
      window.removeEventListener('pointermove', onMove, true);
      cancelAnimationFrame(raf);
      hovered = null;
      for (const el of document.querySelectorAll(`[${TEXT_HOVER_ATTR}]`)) {
        el.removeAttribute(TEXT_HOVER_ATTR);
      }
      styleEl.remove();
    };
  }, [active, slideId]);

  if (import.meta.env.PROD) return null;
  return (
    <div ref={layerRef} data-inspector-ui className="pointer-events-none absolute inset-0 z-30">
      {inlineEdit && (
        <ActiveInlineEditor
          key={inlineEdit.session ?? `${inlineEdit.line}:${inlineEdit.column}`}
          target={inlineEdit}
          layerRef={layerRef}
          showOutline={!active}
        />
      )}
    </div>
  );
}

const TEXT_HOVER_ATTR = 'data-slide-text-hover';
const HOVER_FADE_MS = 160;

// The outline fades by transitioning outline-color through transient
// attribute values: 'in' (transparent) → 'true' (visible) on enter, and
// 'true' → 'out' (transparent) before removal on leave.
const HOVER_HINT_CSS = `
[data-inspector-root] [${TEXT_HOVER_ATTR}],
[data-inspector-root] [${TEXT_HOVER_ATTR}] * {
  cursor: text !important;
}
[data-inspector-root] [${TEXT_HOVER_ATTR}] {
  outline: 2px solid rgba(59, 130, 246, 0.5) !important;
  outline-offset: 2px !important;
}
[data-inspector-root] [${TEXT_HOVER_ATTR}='in'],
[data-inspector-root] [${TEXT_HOVER_ATTR}='out'] {
  outline-color: rgba(59, 130, 246, 0) !important;
}
@media (prefers-reduced-motion: no-preference) {
  [data-inspector-root] [${TEXT_HOVER_ATTR}] {
    transition: outline-color ${HOVER_FADE_MS}ms ease !important;
  }
  /* The 'in' frame must land on transparent instantly; with the transition
     active it would itself animate away from the pre-hover outline-color. */
  [data-inspector-root] [${TEXT_HOVER_ATTR}='in'] {
    transition: none !important;
  }
  @keyframes osd-inline-outline-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
}
`;

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
  showOutline,
}: {
  target: InlineEditTarget;
  layerRef: RefObject<HTMLDivElement>;
  showOutline: boolean;
}) {
  const { bufferOps, stopInlineEdit } = useInspector();
  const [sel, setSel] = useState<TextRange | null>(null);
  const { anchor } = target;
  const rect = useAnchorRect(anchor, layerRef);

  const commit = useCallback(() => {
    if (!anchor.isConnected) return;
    bufferOps(target.line, target.column, anchor, [
      { kind: 'set-text', value: readEditableText(anchor) },
    ]);
  }, [anchor, target.line, target.column, bufferOps]);

  const applyTextStyle = useCallback(
    (key: string, value: string | null) => {
      if (!anchor.isConnected) return;
      if (sel && sel.end > sel.start && RANGE_STYLE_KEYS.has(key)) {
        bufferOps(target.line, target.column, anchor, [
          { kind: 'set-text-range-style', start: sel.start, end: sel.end, key, value },
        ]);
        return;
      }
      bufferOps(target.line, target.column, anchor, [
        { kind: 'set-style', key, value, prevText: readEditableText(anchor) },
      ]);
    },
    [anchor, sel, target.line, target.column, bufferOps],
  );

  const toggleBold = useCallback(() => {
    const bold = parseInt(getComputedStyle(styleContext(anchor, sel)).fontWeight, 10) >= 600;
    applyTextStyle('fontWeight', bold ? null : '700');
  }, [anchor, sel, applyTextStyle]);

  const toggleItalic = useCallback(() => {
    const italic = getComputedStyle(styleContext(anchor, sel)).fontStyle === 'italic';
    applyTextStyle('fontStyle', italic ? null : 'italic');
  }, [anchor, sel, applyTextStyle]);

  // The setup effect must run exactly once per anchor — re-running it would
  // re-place the caret and clobber the user's live selection — so everything
  // with an unstable identity is reached through latest-refs.
  const latestRef = useRef({ commit, toggleBold, toggleItalic });
  latestRef.current = { commit, toggleBold, toggleItalic };
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
      const type = ev.inputType;
      if (type === 'insertParagraph' || type === 'insertLineBreak') {
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
      if ((e.metaKey || e.ctrlKey) && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 'b') {
          e.preventDefault();
          latestRef.current.toggleBold();
        } else if (key === 'i') {
          e.preventDefault();
          latestRef.current.toggleItalic();
        }
      }
    };
    const onSelectionChange = () => {
      const offsets = selectionTextOffsets(anchor);
      if (offsets === null) return;
      setSel(offsets.end > offsets.start ? offsets : null);
    };

    anchor.addEventListener('beforeinput', onBeforeInput);
    anchor.addEventListener('input', onInput);
    anchor.addEventListener('compositionend', onCompositionEnd);
    anchor.addEventListener('keydown', onKeyDown);
    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      anchor.removeEventListener('beforeinput', onBeforeInput);
      anchor.removeEventListener('input', onInput);
      anchor.removeEventListener('compositionend', onCompositionEnd);
      anchor.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('selectionchange', onSelectionChange);
      styleEl.remove();
      if (anchor.isConnected) {
        anchor.removeAttribute('contenteditable');
        anchor.removeAttribute('spellcheck');
        anchor.removeAttribute('data-slide-editing');
      }
    };
  }, [anchor]);

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
      {showOutline && (
        <div
          className="absolute"
          style={{
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            outline: '2px solid #3b82f6',
            animation: 'osd-inline-outline-in 160ms ease-out',
          }}
        />
      )}
      <TextToolbar
        anchor={anchor}
        layerRef={layerRef}
        rect={rect}
        sel={sel}
        applyStyle={applyTextStyle}
      />
    </>
  );
}

function useAnchorRect(anchor: HTMLElement, layerRef: RefObject<HTMLDivElement>): RelRect | null {
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
  layerRef: RefObject<HTMLDivElement>;
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
        onClick={() => applyStyle('fontWeight', bold ? null : '700')}
      >
        <Bold className="size-3.5" />
      </ToolbarIconButton>
      <ToolbarIconButton
        label={t.inspector.italicAria}
        pressed={italic}
        onClick={() => applyStyle('fontStyle', italic ? null : 'italic')}
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

function styleContext(anchor: HTMLElement, sel: TextRange | null): HTMLElement {
  if (!sel) return anchor;
  const node = window.getSelection()?.anchorNode;
  const el = node instanceof HTMLElement ? node : (node?.parentElement ?? null);
  return el && anchor.contains(el) ? el : anchor;
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

// Map the live DOM selection to offsets in the normalized editable text —
// the same coordinate space `set-text-range-style` ops use.
export function selectionTextOffsets(root: HTMLElement): TextRange | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
  const parts: DomTextPart[] = [];
  collectDomTextParts(root, parts);
  const start = pointToTextOffset(parts, range.startContainer, range.startOffset);
  const end = pointToTextOffset(parts, range.endContainer, range.endOffset);
  if (start === null || end === null) return null;
  return start <= end ? { start, end } : { start: end, end: start };
}

function pointToTextOffset(parts: DomTextPart[], container: Node, offset: number): number | null {
  const probe = document.createRange();
  try {
    probe.setStart(container, offset);
  } catch {
    return null;
  }
  probe.collapse(true);
  let total = 0;
  for (const part of parts) {
    if (part.node === container && part.node instanceof Text) {
      const full = collapsedTextSlice(part.node, part.node.data);
      const prefix = collapsedTextSlice(part.node, part.node.data.slice(0, offset));
      const leading = Math.max(0, full.indexOf(part.current));
      return total + Math.min(Math.max(prefix.length - leading, 0), part.current.length);
    }
    let cmp: number;
    try {
      cmp = probe.comparePoint(part.node, 0);
    } catch {
      return null;
    }
    if (cmp > 0) break;
    if (cmp < 0) {
      total += part.current.length;
      continue;
    }
    break;
  }
  return total;
}

function collapsedTextSlice(node: Text, value: string): string {
  const whiteSpace = node.parentElement ? getComputedStyle(node.parentElement).whiteSpace : '';
  if (whiteSpace === 'pre' || whiteSpace === 'pre-wrap' || whiteSpace === 'break-spaces') {
    return value;
  }
  return value.replace(/\s+/g, ' ');
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
