import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PptxSlideScene } from './pptx/scene';
import type { SlideModule } from './sdk';

const mocks = vi.hoisted(() => ({
  collectDomPptxScene: vi.fn(),
  logPptxDiagnostics: vi.fn(),
  render: vi.fn(),
  unmount: vi.fn(),
  writePptxFile: vi.fn(),
}));

vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: mocks.render,
    unmount: mocks.unmount,
  })),
}));

vi.mock('./pptx/dom-collector', () => ({
  collectDomPptxScene: mocks.collectDomPptxScene,
  logPptxDiagnostics: mocks.logPptxDiagnostics,
}));

vi.mock('./pptx/write-pptx', () => ({
  writePptxFile: mocks.writePptxFile,
}));

import { exportSlideAsPptx } from './export-pptx';

class TestElement {
  attributes = new Map<string, string>();
  children: TestElement[] = [];
  parent: TestElement | null = null;
  style = {
    css: new Map<string, string>(),
    setProperty: (name: string, value: string) => {
      this.style.css.set(name, value);
    },
  };

  constructor(readonly tagName: string) {}

  appendChild(child: TestElement): TestElement {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  remove(): void {
    if (!this.parent) return;
    this.parent.children = this.parent.children.filter((child) => child !== this);
    this.parent = null;
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  matches(selector: string): boolean {
    return selector === '[data-osd-canvas]' && this.attributes.has('data-osd-canvas');
  }

  querySelector(selector: string): TestElement | null {
    for (const child of this.children) {
      if (child.matches(selector)) return child;
      const match = child.querySelector(selector);
      if (match) return match;
    }
    return null;
  }

  querySelectorAll(selector: string): TestElement[] {
    return this.children.flatMap((child) => [
      ...(child.matches(selector) ? [child] : []),
      ...child.querySelectorAll(selector),
    ]);
  }
}

function installDom(): TestElement {
  const body = new TestElement('body');
  const documentStub = {
    body,
    createElement: (tagName: string) => new TestElement(tagName),
    fonts: Object.assign([], { ready: Promise.resolve() }),
  };

  vi.stubGlobal('document', documentStub);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal('setTimeout', (callback: () => void) => {
    callback();
    return 1;
  });

  return body;
}

function scene(nodes = 1): PptxSlideScene {
  return {
    width: 1920,
    height: 1080,
    nodes: Array.from({ length: nodes }, (_, index) => ({
      kind: 'shape',
      shape: 'rect',
      x: index,
      y: 0,
      w: 10,
      h: 10,
    })),
    diagnostics: [{ level: 'warn', message: 'unsupported effect' }],
  };
}

describe('exportSlideAsPptx', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('exits early when the slide has no pages', async () => {
    installDom();
    const downloadBlob = vi.fn();

    await exportSlideAsPptx({ default: [] }, 'empty', { downloadBlob });

    expect(mocks.render).not.toHaveBeenCalled();
    expect(mocks.collectDomPptxScene).not.toHaveBeenCalled();
    expect(mocks.writePptxFile).not.toHaveBeenCalled();
    expect(downloadBlob).not.toHaveBeenCalled();
  });

  it('renders pages offscreen, writes a PPTX, and downloads it', async () => {
    const body = installDom();
    const blob = new Blob(['pptx'], {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });
    const downloadBlob = vi.fn();
    const PageOne = () => null;
    const PageTwo = () => null;
    const slide: SlideModule = {
      default: [PageOne, PageTwo],
      design: {
        fonts: { body: 'Arial', display: 'Arial' },
        palette: { accent: '#ff4f1a', bg: '#ffffff', text: '#000000' },
        radius: 8,
        typeScale: { body: 32, hero: 96 },
      },
      meta: { title: 'Deck title' },
      notes: ['Note one', undefined],
    };

    mocks.collectDomPptxScene.mockReturnValueOnce(scene()).mockReturnValueOnce(scene(2));
    mocks.writePptxFile.mockResolvedValue(blob);

    await exportSlideAsPptx(slide, 'deck-id', { downloadBlob });

    expect(mocks.render).toHaveBeenCalledTimes(2);
    expect(mocks.collectDomPptxScene).toHaveBeenCalledTimes(2);
    expect(mocks.logPptxDiagnostics).toHaveBeenNthCalledWith(1, 0, [
      { level: 'warn', message: 'unsupported effect' },
    ]);
    expect(mocks.logPptxDiagnostics).toHaveBeenNthCalledWith(2, 1, [
      { level: 'warn', message: 'unsupported effect' },
    ]);
    expect(mocks.writePptxFile).toHaveBeenCalledWith({
      title: 'Deck title',
      slides: [scene(), scene(2)],
      notes: ['Note one', ''],
    });
    expect(downloadBlob).toHaveBeenCalledWith(blob, 'deck-id.pptx');
    expect(body.children).toEqual([]);
    expect(mocks.unmount).toHaveBeenCalledTimes(2);
  });
});
