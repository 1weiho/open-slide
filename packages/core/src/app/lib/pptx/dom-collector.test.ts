import { afterEach, describe, expect, it, vi } from 'vitest';
import { collectDomPptxScene, logPptxDiagnostics } from './dom-collector';
import type { PptxDiagnostic } from './scene';

type TestElementOptions = {
  tagName?: string;
  text?: string;
  rect?: DOMRectInit;
  attributes?: Record<string, string>;
  style?: Partial<CSSStyleDeclaration>;
  children?: TestElement[];
};

type TestElement = Element & {
  __style: Partial<CSSStyleDeclaration>;
};

const defaultStyle: Partial<CSSStyleDeclaration> = {
  backgroundColor: 'rgba(0, 0, 0, 0)',
  borderBottomWidth: '0px',
  borderColor: 'rgba(0, 0, 0, 0)',
  borderLeftWidth: '0px',
  borderRadius: '0px',
  borderRightWidth: '0px',
  borderStyle: 'none',
  borderTopWidth: '0px',
  color: 'rgb(0, 0, 0)',
  display: 'block',
  filter: 'none',
  fontFamily: 'Arial',
  fontSize: '24px',
  fontStyle: 'normal',
  fontWeight: '400',
  lineHeight: '30px',
  opacity: '1',
  textAlign: 'left',
  visibility: 'visible',
};

function testElement({
  tagName = 'DIV',
  text = '',
  rect = { height: 100, width: 100, x: 0, y: 0 },
  attributes = {},
  style = {},
  children = [],
}: TestElementOptions = {}): TestElement {
  const childNodes = [...children];
  const attrMap = new Map(Object.entries(attributes));
  const element = {
    __style: { ...defaultStyle, ...style },
    children: childNodes,
    getAttribute: (name: string) => attrMap.get(name) ?? null,
    getBoundingClientRect: () => rectFromInit(rect),
    hasAttribute: (name: string) => attrMap.has(name),
    tagName,
    textContent: text || childNodes.map((child) => child.textContent).join(''),
  };

  return element as unknown as TestElement;
}

function rectFromInit(rect: DOMRectInit): DOMRect {
  const x = rect.x ?? 0;
  const y = rect.y ?? 0;
  const width = rect.width ?? 0;
  const height = rect.height ?? 0;

  return {
    bottom: y + height,
    height,
    left: x,
    right: x + width,
    toJSON: () => ({}),
    top: y,
    width,
    x,
    y,
  } as DOMRect;
}

describe('collectDomPptxScene', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('collects a plain text leaf as a text node', () => {
    const text = testElement({
      rect: { height: 80, width: 400, x: 120, y: 160 },
      text: 'Hello',
    });
    const canvas = testElement({
      children: [text],
      rect: { height: 1080, width: 1920, x: 0, y: 0 },
    });
    vi.stubGlobal('getComputedStyle', (el: TestElement) => el.__style);

    const scene = collectDomPptxScene(canvas as unknown as HTMLElement);

    expect(scene.nodes).toEqual([
      expect.objectContaining({
        h: 80,
        kind: 'text',
        text: 'Hello',
        w: 400,
        x: 120,
        y: 160,
      }),
    ]);
  });

  it('collects a simple background element as a shape node', () => {
    const box = testElement({
      rect: { height: 120, width: 240, x: 20, y: 30 },
      style: { backgroundColor: 'rgb(255, 79, 26)' },
    });
    const canvas = testElement({
      children: [box],
      rect: { height: 1080, width: 1920, x: 0, y: 0 },
    });
    vi.stubGlobal('getComputedStyle', (el: TestElement) => el.__style);

    const scene = collectDomPptxScene(canvas as unknown as HTMLElement);

    expect(scene.nodes).toEqual([
      expect.objectContaining({
        fill: 'FF4F1A',
        h: 120,
        kind: 'shape',
        shape: 'rect',
        w: 240,
        x: 20,
        y: 30,
      }),
    ]);
  });

  it('collects images as image nodes', () => {
    const image = testElement({
      attributes: { alt: 'Diagram', src: '/diagram.png' },
      rect: { height: 300, width: 500, x: 40, y: 50 },
      tagName: 'IMG',
    });
    const canvas = testElement({
      children: [image],
      rect: { height: 1080, width: 1920, x: 0, y: 0 },
    });
    vi.stubGlobal('getComputedStyle', (el: TestElement) => el.__style);

    const scene = collectDomPptxScene(canvas as unknown as HTMLElement);

    expect(scene.nodes).toEqual([
      expect.objectContaining({
        alt: 'Diagram',
        h: 300,
        kind: 'image',
        src: '/diagram.png',
        w: 500,
        x: 40,
        y: 50,
      }),
    ]);
  });

  it('adds diagnostics for unsupported effects without creating UI state', () => {
    const filtered = testElement({
      rect: { height: 100, width: 100, x: 0, y: 0 },
      style: { filter: 'blur(4px)' },
      text: 'Filtered',
    });
    const canvas = testElement({
      children: [filtered],
      rect: { height: 1080, width: 1920, x: 0, y: 0 },
    });
    vi.stubGlobal('getComputedStyle', (el: TestElement) => el.__style);

    const scene = collectDomPptxScene(canvas as unknown as HTMLElement);

    expect(scene.diagnostics[0]).toEqual({
      level: 'warn',
      message: expect.stringContaining('filter'),
      nodeKind: 'text',
    });
  });

  it('skips invisible elements and descendants of primitive export nodes', () => {
    const hidden = testElement({
      style: { display: 'none' },
      text: 'Hidden',
    });
    const child = testElement({ text: 'Child' });
    const primitive = testElement({
      attributes: { 'data-osd-pptx-kind': 'text' },
      children: [child],
      rect: { height: 80, width: 300, x: 0, y: 0 },
      text: 'Primitive',
    });
    const canvas = testElement({
      children: [hidden, primitive],
      rect: { height: 1080, width: 1920, x: 0, y: 0 },
    });
    vi.stubGlobal('getComputedStyle', (el: TestElement) => el.__style);

    const scene = collectDomPptxScene(canvas as unknown as HTMLElement);

    expect(scene.nodes).toEqual([expect.objectContaining({ kind: 'text', text: 'Primitive' })]);
    expect(scene.nodes).not.toEqual([expect.objectContaining({ kind: 'text', text: 'Hidden' })]);
    expect(scene.nodes).not.toEqual([expect.objectContaining({ kind: 'text', text: 'Child' })]);
  });
});

describe('logPptxDiagnostics', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs diagnostics to developer console methods', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const diagnostics: PptxDiagnostic[] = [
      { level: 'info', message: 'native fallback' },
      { level: 'warn', message: 'unsupported filter' },
    ];

    logPptxDiagnostics(2, diagnostics);

    expect(info).toHaveBeenCalledWith('[open-slide:pptx] slide 3: native fallback');
    expect(warn).toHaveBeenCalledWith('[open-slide:pptx] slide 3: unsupported filter');
  });
});
