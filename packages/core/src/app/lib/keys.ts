export function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement && (target.isContentEditable || target.matches('input, textarea'))
  );
}

export function isShortcutControlTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    !!target.closest(
      'button, a, input, textarea, select, summary, [role="dialog"], [role="menu"], [role="listbox"], [role="tablist"], [data-inspector-ui], [data-design-ui]',
    )
  );
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
