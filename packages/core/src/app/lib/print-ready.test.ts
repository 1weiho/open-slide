import { afterEach, describe, expect, it, vi } from 'vitest';
import { waitForDataWaitfor, waitForFonts } from './print-ready';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('waitForFonts', () => {
  it('awaits document.fonts.ready without force-loading any face', async () => {
    const load = vi.fn();
    const faces = [
      { status: 'loaded', load },
      { status: 'unloaded', load },
      { status: 'unloaded', load },
    ];
    const fonts = {
      ready: Promise.resolve(),
      [Symbol.iterator]: () => faces[Symbol.iterator](),
    };
    vi.stubGlobal('document', { fonts });

    await waitForFonts();

    expect(load).not.toHaveBeenCalled();
  });

  it('resolves when the FontFaceSet API is unavailable', async () => {
    vi.stubGlobal('document', {});

    await expect(waitForFonts()).resolves.toBeUndefined();
  });
});

describe('waitForDataWaitfor', () => {
  it('does not resolve until the requested async descendant exists', async () => {
    let frames = 0;
    const target = {
      getAttribute: vi.fn(() => 'svg'),
      querySelector: vi.fn(() => (frames >= 2 ? {} : null)),
    };
    const root = {
      querySelectorAll: vi.fn(() => [target]),
    } as unknown as HTMLElement;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames += 1;
      callback(frames);
      return frames;
    });

    await waitForDataWaitfor(root, 1_000);

    expect(frames).toBe(2);
    expect(target.querySelector).toHaveBeenLastCalledWith('svg');
  });
});
