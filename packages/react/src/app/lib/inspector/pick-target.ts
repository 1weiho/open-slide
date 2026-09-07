import { hasOnlyInlineTextChildren, INLINE_TEXT_TAGS } from '@/lib/inspector/inline-text';

// Only handle events that originate inside the slide root. Portaled UI
// (dialogs, tooltips, toasts) mounts on `document.body`, outside the root;
// without this guard capture-phase window listeners swallow clicks meant
// for a dialog and hit the slide element behind it instead.
export function isInspectableEventTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest('[data-inspector-ui]')) return false;
  return !!target.closest('[data-inspector-root]');
}

export function pickElement(x: number, y: number): HTMLElement | null {
  const stack = document.elementsFromPoint(x, y);
  for (const el of stack) {
    if (!(el instanceof HTMLElement)) continue;
    if (el.closest('[data-inspector-ui]')) continue;
    if (!el.closest('[data-inspector-root]')) continue;
    return el;
  }
  return null;
}

export function pickInspectorTarget(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null;
  const root = el.closest('[data-inspector-root]');
  const startedOnInlineText = INLINE_TEXT_TAGS.has(el.tagName);
  for (let cur: HTMLElement | null = el; cur && root?.contains(cur); cur = cur.parentElement) {
    if (startedOnInlineText && INLINE_TEXT_TAGS.has(cur.tagName)) continue;
    if (isEditableTextContainer(cur)) return cur;
  }
  return el;
}

export function isEditableTextContainer(el: HTMLElement): boolean {
  if (!el.textContent?.trim()) return false;
  return hasOnlyInlineTextChildren(el);
}
