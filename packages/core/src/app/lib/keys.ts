/** True while the event targets a field the user is typing into. */
export function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.matches('input, textarea');
}

/**
 * True when a modifier is held. Single-letter shortcuts check this so browser
 * combos (⌘P, ⌘F…) are never hijacked.
 */
export function hasModifier(e: KeyboardEvent): boolean {
  return e.altKey || e.ctrlKey || e.metaKey;
}

export function isForwardKey(e: KeyboardEvent): boolean {
  return e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown';
}

export function isBackwardKey(e: KeyboardEvent): boolean {
  return e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp';
}
