import { describe, expect, it, vi } from 'vitest';
import { createUntracedPickStore, untracedTag } from './untraced-pick.ts';

const element = (tagName: string, isConnected = true) => ({ tagName, isConnected });

describe('createUntracedPickStore', () => {
  it('notifies when the same element is picked on another slide', () => {
    const store = createUntracedPickStore();
    const listener = vi.fn();
    store.subscribe(listener);
    const shared = element('DIV');
    store.set({ slideId: 'a', element: shared });
    store.set({ slideId: 'b', element: shared });
    expect(listener).toHaveBeenCalledTimes(2);
    expect(store.get()?.slideId).toBe('b');
  });

  it('skips a repeated pick of the same element on the same slide', () => {
    const store = createUntracedPickStore();
    const listener = vi.fn();
    store.subscribe(listener);
    const picked = element('DIV');
    store.set({ slideId: 'a', element: picked });
    store.set({ slideId: 'a', element: picked });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('clears the pick', () => {
    const store = createUntracedPickStore();
    store.set({ slideId: 'a', element: element('DIV') });
    store.set(null);
    expect(store.get()).toBeNull();
  });
});

describe('untracedTag', () => {
  it('names a connected pick on the current slide', () => {
    expect(untracedTag({ slideId: 'a', element: element('SECTION') }, 'a')).toBe('section');
  });

  it('ignores picks from another slide or detached elements', () => {
    expect(untracedTag({ slideId: 'a', element: element('DIV') }, 'b')).toBeNull();
    expect(untracedTag({ slideId: 'a', element: element('DIV', false) }, 'a')).toBeNull();
    expect(untracedTag(null, 'a')).toBeNull();
  });
});
