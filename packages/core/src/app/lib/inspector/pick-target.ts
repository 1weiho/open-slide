import { hasOnlyInlineTextChildren, INLINE_TEXT_TAGS } from './inline-text';

export function isTaggedInlineText(el: HTMLElement): boolean {
  return INLINE_TEXT_TAGS.has(el.tagName) && Boolean(el.dataset.slideLoc);
}

export function pickInspectorTarget(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null;
  const root = el.closest('[data-inspector-root]');
  const startedOnInlineText = INLINE_TEXT_TAGS.has(el.tagName);
  for (let cur: HTMLElement | null = el; cur && root?.contains(cur); cur = cur.parentElement) {
    if (startedOnInlineText && INLINE_TEXT_TAGS.has(cur.tagName)) {
      // Loc-tagged inlines are the author's source, not a text run to climb
      // past. Agenda-style wrappers (`<li>` around a tagged `<span>`) look
      // like editable containers, and promoting to them drops the loc before
      // findSlideSource runs. Shared-component hosts are not inline tags, so
      // this does not revive the tagged-wrapper steal.
      if (isTaggedInlineText(cur)) return cur;
      continue;
    }
    if (isEditableTextContainer(cur)) return cur;
  }
  return el;
}

function isEditableTextContainer(el: HTMLElement): boolean {
  if (!el.textContent?.trim()) return false;
  return hasOnlyInlineTextChildren(el);
}
