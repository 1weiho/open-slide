import { afterEach, describe, expect, it, vi } from 'vitest';
import { waitForFonts } from './print-ready';

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
