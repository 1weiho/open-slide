import { afterEach, describe, expect, it, vi } from 'vitest';
import { waitForFonts, waitForImages } from './print-ready';

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

describe('waitForImages', () => {
  it('decodes already loaded images before resolving', async () => {
    const decode = vi.fn().mockResolvedValue(undefined);
    const img = {
      complete: true,
      naturalWidth: 640,
      naturalHeight: 360,
      currentSrc: '/asset.png',
      decode,
    } as unknown as HTMLImageElement;
    const root = {
      querySelectorAll: () => [img],
    } as unknown as HTMLElement;

    await waitForImages(root);

    expect(decode).toHaveBeenCalledOnce();
  });

  it('waits for pending images to complete', async () => {
    let complete = false;
    const img = {
      get complete() {
        return complete;
      },
      naturalWidth: 640,
      naturalHeight: 360,
      currentSrc: '/asset.png',
      decode: vi.fn().mockResolvedValue(undefined),
    } as unknown as HTMLImageElement;
    const root = {
      querySelectorAll: () => [img],
    } as unknown as HTMLElement;

    let rafCalls = 0;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      rafCalls += 1;
      if (rafCalls === 2) complete = true;
      callback(performance.now());
      return rafCalls;
    });

    await waitForImages(root);

    expect(rafCalls).toBe(2);
  });
});
