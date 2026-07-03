import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exportSlideAsPptx, type PptxExportProgress } from './export-pptx';
import type { SlideModule } from './sdk';

const mocks = vi.hoisted(() => ({
  buildEditablePptx: vi.fn(),
  collectEditableSlide: vi.fn(),
  createRoot: vi.fn(),
  isFrameAnimationSettled: vi.fn(),
  waitForDataWaitfor: vi.fn(),
  waitForFonts: vi.fn(),
}));

vi.mock('react-dom/client', () => ({
  createRoot: mocks.createRoot,
}));

vi.mock('./export-pptx-editable', () => ({
  buildEditablePptx: mocks.buildEditablePptx,
  collectEditableSlide: mocks.collectEditableSlide,
}));

vi.mock('./print-ready', () => ({
  isFrameAnimationSettled: mocks.isFrameAnimationSettled,
  waitForDataWaitfor: mocks.waitForDataWaitfor,
  waitForFonts: mocks.waitForFonts,
}));

function createFakeElement() {
  return {
    appendChild: vi.fn(),
    click: vi.fn(),
    remove: vi.fn(),
    setAttribute: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    style: {
      setProperty: vi.fn(),
    },
  };
}

describe('exportSlideAsPptx progress', () => {
  beforeEach(() => {
    mocks.createRoot.mockReturnValue({ render: vi.fn(), unmount: vi.fn() });
    mocks.waitForFonts.mockResolvedValue(undefined);
    mocks.waitForDataWaitfor.mockResolvedValue(undefined);
    mocks.isFrameAnimationSettled.mockReturnValue(true);
    mocks.collectEditableSlide.mockResolvedValue({ background: '#ffffff', objects: [] });
    mocks.buildEditablePptx.mockRejectedValue(new Error('build failed'));

    vi.stubGlobal('document', {
      body: createFakeElement(),
      createElement: vi.fn(() => createFakeElement()),
      head: createFakeElement(),
    });
    vi.stubGlobal('getComputedStyle', vi.fn());
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllGlobals();
  });

  it('does not report done when editable PPTX generation fails', async () => {
    const Page = () => null;
    const slide = { default: [Page] } as unknown as SlideModule;
    const progress: PptxExportProgress[] = [];

    await expect(exportSlideAsPptx(slide, 'demo', (event) => progress.push(event))).rejects.toThrow(
      'build failed',
    );

    expect(progress.map((event) => event.phase)).toEqual([
      'processing',
      'processing',
      'generating',
    ]);
  });
});
