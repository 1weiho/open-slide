import { useSyncExternalStore } from 'react';

export type UntracedPick = { slideId: string; element: Pick<Element, 'tagName' | 'isConnected'> };

// Keyed on the clicked element so an HMR remount, which detaches it, retires
// the pick. Page changes clear it explicitly: during a transition the outgoing
// page stays connected.
export function createUntracedPickStore() {
  let current: UntracedPick | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => current,
    set(next: UntracedPick | null) {
      if (current?.element === next?.element && current?.slideId === next?.slideId) return;
      current = next;
      for (const listener of listeners) listener();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export function untracedTag(pick: UntracedPick | null, slideId: string): string | null {
  if (pick?.slideId !== slideId || !pick.element.isConnected) return null;
  return pick.element.tagName.toLowerCase();
}

const store = createUntracedPickStore();

export const setUntracedPick = store.set;

export function useUntracedPick(slideId: string): string | null {
  return untracedTag(useSyncExternalStore(store.subscribe, store.get, store.get), slideId);
}
