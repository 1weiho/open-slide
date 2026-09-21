import {
  collectDomTextParts,
  type DomTextPart,
  type InlineTextSelection,
} from '@/components/inspector/inspector-provider';

// Map the live DOM selection to offsets in the normalized editable text —
// the same coordinate space `set-text-range-style` ops use.
export function selectionTextOffsets(root: HTMLElement): InlineTextSelection | null {
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

export function styleContext(
  anchor: HTMLElement,
  selection: InlineTextSelection | null,
): HTMLElement {
  if (!selection) return anchor;
  const parts: DomTextPart[] = [];
  collectDomTextParts(anchor, parts);
  let offset = 0;
  for (const part of parts) {
    if (selection.start < offset + part.current.length) return part.node.parentElement ?? anchor;
    offset += part.current.length;
  }
  return anchor;
}

function pointAtOffset(root: HTMLElement, offset: number): { node: Node; offset: number } {
  const parts: DomTextPart[] = [];
  collectDomTextParts(root, parts);
  let remaining = Math.max(0, offset);
  for (const part of parts) {
    if (remaining > part.current.length) {
      remaining -= part.current.length;
      continue;
    }
    if (part.node instanceof Text) {
      const full = collapsedTextSlice(part.node, part.node.data);
      const normalized = remaining + Math.max(0, full.indexOf(part.current));
      for (let index = 0; index <= part.node.length; index++) {
        if (collapsedTextSlice(part.node, part.node.data.slice(0, index)).length >= normalized) {
          return { node: part.node, offset: index };
        }
      }
      return { node: part.node, offset: part.node.length };
    }
    const parent = part.node.parentNode;
    if (parent)
      return {
        node: parent,
        offset: Array.from(parent.childNodes).indexOf(part.node) + (remaining > 0 ? 1 : 0),
      };
  }
  return { node: root, offset: root.childNodes.length };
}

export function restoreTextSelection(root: HTMLElement, offsets: InlineTextSelection) {
  if (!root.isConnected) return;
  const selection = window.getSelection();
  if (!selection) return;
  const start = pointAtOffset(root, offsets.start);
  const end = pointAtOffset(root, offsets.end);
  const range = document.createRange();
  range.setStart(start.node, start.offset);
  range.setEnd(end.node, end.offset);
  selection.removeAllRanges();
  selection.addRange(range);
}
