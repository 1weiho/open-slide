// Tags the inspector treats as part of a text run rather than as a container
// of their own, so `<p>a <strong>b</strong></p>` stays one editable target.
export const INLINE_TEXT_TAGS = new Set([
  'B',
  'CODE',
  'DEL',
  'EM',
  'I',
  'INS',
  'MARK',
  'S',
  'SMALL',
  'SPAN',
  'STRONG',
  'SUB',
  'SUP',
  'U',
]);

export function hasOnlyInlineTextChildren(el: HTMLElement): boolean {
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      continue;
    } else if (child instanceof HTMLElement) {
      if (child.tagName === 'BR') continue;
      if (INLINE_TEXT_TAGS.has(child.tagName) && hasOnlyInlineTextChildren(child)) continue;
    }
    return false;
  }
  return true;
}
