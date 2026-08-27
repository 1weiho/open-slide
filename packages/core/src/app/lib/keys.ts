export function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.matches('input, textarea');
}

// Single-letter shortcuts bail on this so browser combos (⌘P, ⌘F…) still work.
export function hasModifier(e: KeyboardEvent): boolean {
  return e.altKey || e.ctrlKey || e.metaKey;
}

export function isForwardKey(e: KeyboardEvent): boolean {
  return e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown';
}

export function isBackwardKey(e: KeyboardEvent): boolean {
  return e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp';
}
