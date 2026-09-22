import { useSyncExternalStore } from 'react';

// Keyed on the clicked element so a page change or HMR remount, which
// detaches it, retires the pick without any explicit reset.
export type UntracedPick = { slideId: string; element: Element };

let current: UntracedPick | null = null;
const listeners = new Set<() => void>();

export function setUntracedPick(next: UntracedPick | null) {
  if (current?.element === next?.element) return;
  current = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function snapshot() {
  return current;
}

export function useUntracedPick(slideId: string): string | null {
  const pick = useSyncExternalStore(subscribe, snapshot, snapshot);
  if (pick?.slideId !== slideId || !pick.element.isConnected) return null;
  return pick.element.tagName.toLowerCase();
}
