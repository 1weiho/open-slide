import { afterEach, describe, expect, it, vi } from 'vitest';
import { collectDomPptxScene, logPptxDiagnostics } from './dom-collector';
import type { PptxDiagnostic } from './scene';

type TestElementOptions = {
  tagName?: string;
  text?: string;
  innerText?: string;
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
  borderBottomColor: 'rgba(0, 0, 0, 0)',
  borderBottomStyle: 'none',
  borderColor: 'rgba(0, 0, 0, 0)',
  borderLeftColor: 'rgba(0, 0, 0, 0)',
  borderLeftStyle: 'none',
  borderLeftWidth: '0px',
  borderRadius: '0px',
  borderRightColor: 'rgba(0, 0, 0, 0)',
  borderRightStyle: 'none',
  borderRightWidth: '0px',
  borderStyle: 'none',
  borderTopColor: 'rgba(0, 0, 0, 0)',
  borderTopStyle: 'none',
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
  innerText,
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
    cloneNode: () => testElement({ attributes, children, rect, style, tagName, text }),
    getAttribute: (name: string) => attrMap.get(name) ?? null,
    getBoundingClientRect: () => rectFromInit(rect),
    hasAttribute: (name: string) => attrMap.has(name),
    innerText: (innerText ?? text) || childNodes.map((child) => child.textContent).join(''),
    setAttribute: (name: string, value: string) => attrMap.set(name, value),
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
        w: 432,
        x: 120,
        y: 160,
      }),
    ]);
  });

  it('normalizes scaled canvas coordinates before creating pptx nodes', () => {
    const text = testElement({
      rect: { height: 40, width: 200, x: 70, y: 100 },
      text: 'Scaled',
    });
    const canvas = testElement({
      children: [text],
      rect: { height: 540, width: 960, x: 10, y: 20 },
    });
    vi.stubGlobal('getComputedStyle', (el: TestElement) => el.__style);

    const scene = collectDomPptxScene(canvas as unknown as HTMLElement);

    expect(scene).toEqual(
      expect.objectContaining({
        height: 1080,
        width: 1920,
      }),
    );
    expect(scene.nodes).toEqual([
      expect.objectContaining({
        h: 80,
        kind: 'text',
        text: 'Scaled',
        w: 432,
        x: 120,
        y: 160,
      }),
    ]);
  });

  it('collects semantic text containers with inline children as one editable text node', () => {
    const title = testElement({
      children: [testElement({ tagName: 'BR' })],
      innerText: 'Rome did not fall\nin a day.',
      rect: { height: 270, width: 1050, x: 140, y: 250 },
      tagName: 'H1',
      text: 'Rome did not fallin a day.',
    });
    const canvas = testElement({
      children: [title],
      rect: { height: 1080, width: 1920, x: 0, y: 0 },
    });
    vi.stubGlobal('getComputedStyle', (el: TestElement) => el.__style);

    const scene = collectDomPptxScene(canvas as unknown as HTMLElement);

    expect(scene.nodes).toEqual([
      expect.objectContaining({
        h: 270,
        kind: 'text',
        text: 'Rome did not fall\nin a day.',
        w: 1134,
        x: 140,
        y: 250,
      }),
    ]);
  });

  it('uses browser-measured line breaks for editable text boxes', () => {
    class RangeNode {
      static TEXT_NODE = 3;
      childNodes: RangeNode[] = [];
      textContent = '';
      constructor(readonly nodeType: number) {}
    }

    class RangeText extends RangeNode {
      constructor(readonly data: string) {
        super(RangeNode.TEXT_NODE);
        this.textContent = data;
      }
    }

    class RangeElement extends RangeNode {
      __style = defaultStyle;
      children: RangeElement[];
      textContent: string;

      constructor(
        readonly tagName: string,
        readonly rect: DOMRectInit,
        childNodes: RangeNode[],
      ) {
        super(1);
        this.childNodes = childNodes;
        this.children = childNodes.filter(
          (child): child is RangeElement => child instanceof RangeElement,
        );
        this.textContent = childNodes
          .map((child) => (child instanceof RangeText ? child.data : child.textContent))
          .join('');
      }

      getAttribute() {
        return null;
      }

      getBoundingClientRect() {
        return rectFromInit(this.rect);
      }
    }

    const text = new RangeText('The better question is not why did Rome fall');
    const heading = new RangeElement('H2', { height: 180, width: 900, x: 100, y: 120 }, [text]);
    const canvas = new RangeElement('DIV', { height: 1080, width: 1920, x: 0, y: 0 }, [heading]);
    vi.stubGlobal('Node', RangeNode);
    vi.stubGlobal('Text', RangeText);
    vi.stubGlobal('Element', RangeElement);
    vi.stubGlobal('getComputedStyle', (el: RangeElement) => el.__style);
    vi.stubGlobal('document', {
      createRange: () => {
        let start = 0;
        return {
          detach: () => undefined,
          getClientRects: () => [{ height: 20, top: start < 27 ? 130 : 160, width: 20 }],
          setEnd: () => undefined,
          setStart: (_node: RangeText, offset: number) => {
            start = offset;
          },
        };
      },
    });

    const scene = collectDomPptxScene(canvas as unknown as HTMLElement);

    expect(scene.nodes).toEqual([
      expect.objectContaining({
        kind: 'text',
        lines: [
          expect.objectContaining({ text: 'The better question is not' }),
          expect.objectContaining({ text: 'why did Rome fall' }),
        ],
        lineBreakPolicy: 'preserve-browser-lines',
        text: 'The better question is not\nwhy did Rome fall',
      }),
    ]);
  });

  it('falls back to normalized text when range measurement yields no rects', () => {
    class RangeNode {
      static TEXT_NODE = 3;
      childNodes: RangeNode[] = [];
      textContent = '';
      constructor(readonly nodeType: number) {}
    }

    class RangeText extends RangeNode {
      constructor(readonly data: string) {
        super(RangeNode.TEXT_NODE);
        this.textContent = data;
      }
    }

    class RangeElement extends RangeNode {
      __style = defaultStyle;
      children: RangeElement[];
      innerText: string;
      textContent: string;

      constructor(
        readonly tagName: string,
        readonly rect: DOMRectInit,
        childNodes: RangeNode[],
      ) {
        super(1);
        this.childNodes = childNodes;
        this.children = childNodes.filter(
          (child): child is RangeElement => child instanceof RangeElement,
        );
        this.textContent = childNodes
          .map((child) => (child instanceof RangeText ? child.data : child.textContent))
          .join('');
        this.innerText = this.textContent;
      }

      getAttribute() {
        return null;
      }

      getBoundingClientRect() {
        return rectFromInit(this.rect);
      }
    }

    const text = new RangeText('Visible text');
    const heading = new RangeElement('H2', { height: 80, width: 400, x: 100, y: 120 }, [text]);
    const canvas = new RangeElement('DIV', { height: 1080, width: 1920, x: 0, y: 0 }, [heading]);
    const getClientRects = vi.fn(() => []);
    vi.stubGlobal('Node', RangeNode);
    vi.stubGlobal('Text', RangeText);
    vi.stubGlobal('Element', RangeElement);
    vi.stubGlobal('getComputedStyle', (el: RangeElement) => el.__style);
    vi.stubGlobal('document', {
      createRange: () => ({
        detach: () => undefined,
        getClientRects,
        setEnd: () => undefined,
        setStart: () => undefined,
      }),
    });

    const scene = collectDomPptxScene(canvas as unknown as HTMLElement);

    expect(getClientRects).toHaveBeenCalled();
    expect(scene.nodes).toEqual([
      expect.objectContaining({
        kind: 'text',
        text: 'Visible text',
      }),
    ]);
  });

  it('collects inline formatted text as rich text runs', () => {
    const hello = testElement({
      rect: { height: 40, width: 100, x: 100, y: 120 },
      tagName: 'SPAN',
      text: 'Hello ',
    });
    const world = testElement({
      rect: { height: 40, width: 100, x: 200, y: 120 },
      style: { color: 'rgb(179, 74, 42)', fontStyle: 'italic' },
      tagName: 'EM',
      text: 'world',
    });
    const bang = testElement({
      rect: { height: 40, width: 40, x: 300, y: 120 },
      style: { fontWeight: '700' },
      tagName: 'STRONG',
      text: '!',
    });
    const paragraph = testElement({
      children: [hello, world, bang],
      rect: { height: 80, width: 420, x: 100, y: 120 },
      tagName: 'P',
    });
    const canvas = testElement({
      children: [paragraph],
      rect: { height: 1080, width: 1920, x: 0, y: 0 },
    });
    vi.stubGlobal('getComputedStyle', (el: TestElement) => el.__style);

    const scene = collectDomPptxScene(canvas as unknown as HTMLElement);

    expect(scene.nodes).toEqual([
      expect.objectContaining({
        kind: 'richText',
        runs: [
          expect.objectContaining({ text: 'Hello ' }),
          expect.objectContaining({
            style: expect.objectContaining({ color: 'B34A2A', italic: true }),
            text: 'world',
          }),
          expect.objectContaining({
            style: expect.objectContaining({ bold: true }),
            text: '!',
          }),
        ],
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

  it('collects one-sided borders as editable lines instead of rectangles', () => {
    const rule = testElement({
      rect: { height: 120, width: 700, x: 80, y: 900 },
      style: {
        borderTopColor: 'rgb(26, 24, 21)',
        borderTopStyle: 'dashed',
        borderTopWidth: '1px',
      },
    });
    const canvas = testElement({
      children: [rule],
      rect: { height: 1080, width: 1920, x: 0, y: 0 },
    });
    vi.stubGlobal('getComputedStyle', (el: TestElement) => el.__style);

    const scene = collectDomPptxScene(canvas as unknown as HTMLElement);

    expect(scene.nodes).toEqual([
      expect.objectContaining({
        h: 0,
        kind: 'shape',
        shape: 'line',
        stroke: { color: '1A1815', dash: 'dash', width: 1 },
        w: 700,
        x: 80,
        y: 900,
      }),
    ]);
  });

  it('collects group children instead of treating the group as a primitive leaf', () => {
    const child = testElement({
      rect: { height: 60, width: 200, x: 40, y: 50 },
      text: 'Grouped text',
    });
    const group = testElement({
      attributes: { 'data-osd-pptx-kind': 'group' },
      children: [child],
      rect: { height: 100, width: 300, x: 20, y: 30 },
    });
    const canvas = testElement({
      children: [group],
      rect: { height: 1080, width: 1920, x: 0, y: 0 },
    });
    vi.stubGlobal('getComputedStyle', (el: TestElement) => el.__style);

    const scene = collectDomPptxScene(canvas as unknown as HTMLElement);

    expect(scene.nodes).toEqual([expect.objectContaining({ kind: 'text', text: 'Grouped text' })]);
  });

  it('collects box primitives and their child content', () => {
    const child = testElement({
      rect: { height: 50, width: 180, x: 60, y: 70 },
      text: 'Panel title',
    });
    const box = testElement({
      attributes: { 'data-osd-pptx-kind': 'box' },
      children: [child],
      rect: { height: 160, width: 320, x: 40, y: 50 },
      style: { backgroundColor: 'rgb(255, 255, 255)' },
    });
    const canvas = testElement({
      children: [box],
      rect: { height: 1080, width: 1920, x: 0, y: 0 },
    });
    vi.stubGlobal('getComputedStyle', (el: TestElement) => el.__style);

    const scene = collectDomPptxScene(canvas as unknown as HTMLElement);

    expect(scene.nodes).toEqual([
      expect.objectContaining({ fill: 'FFFFFF', kind: 'shape', shape: 'rect' }),
      expect.objectContaining({ kind: 'text', text: 'Panel title' }),
    ]);
  });

  it('honors explicit primitive shape metadata', () => {
    const ellipse = testElement({
      attributes: { 'data-osd-pptx-kind': 'shape', 'data-osd-pptx-shape': 'ellipse' },
      rect: { height: 120, width: 240, x: 20, y: 30 },
    });
    const line = testElement({
      attributes: { 'data-osd-pptx-kind': 'shape', 'data-osd-pptx-shape': 'line' },
      rect: { height: 1, width: 300, x: 40, y: 90 },
    });
    const canvas = testElement({
      children: [ellipse, line],
      rect: { height: 1080, width: 1920, x: 0, y: 0 },
    });
    vi.stubGlobal('getComputedStyle', (el: TestElement) => el.__style);

    const scene = collectDomPptxScene(canvas as unknown as HTMLElement);

    expect(scene.nodes).toEqual([
      expect.objectContaining({ h: 120, kind: 'shape', shape: 'ellipse', w: 240 }),
      expect.objectContaining({ h: 1, kind: 'shape', shape: 'line', w: 300 }),
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

  it('collects image object-fit as PowerPoint sizing intent', () => {
    const cover = testElement({
      attributes: { alt: 'Cover', src: '/cover.png' },
      rect: { height: 300, width: 500, x: 40, y: 50 },
      style: { objectFit: 'cover' },
      tagName: 'IMG',
    });
    const contain = testElement({
      attributes: { alt: 'Contain', src: '/contain.png' },
      rect: { height: 300, width: 500, x: 600, y: 50 },
      style: { objectFit: 'contain' },
      tagName: 'IMG',
    });
    const canvas = testElement({
      children: [cover, contain],
      rect: { height: 1080, width: 1920, x: 0, y: 0 },
    });
    vi.stubGlobal('getComputedStyle', (el: TestElement) => el.__style);

    const scene = collectDomPptxScene(canvas as unknown as HTMLElement);

    expect(scene.nodes).toEqual([
      expect.objectContaining({ fit: 'cover', kind: 'image', src: '/cover.png' }),
      expect.objectContaining({ fit: 'contain', kind: 'image', src: '/contain.png' }),
    ]);
  });

  it('collects explicit raster primitives as raster nodes with decisions', () => {
    const raster = testElement({
      attributes: {
        'data-osd-pptx-kind': 'raster',
        'data-osd-pptx-reason': 'unsupported filter',
        src: 'data:image/png;base64,abc',
      },
      rect: { height: 240, width: 360, x: 40, y: 50 },
      tagName: 'IMG',
    });
    const canvas = testElement({
      children: [raster],
      rect: { height: 1080, width: 1920, x: 0, y: 0 },
    });
    vi.stubGlobal('getComputedStyle', (el: TestElement) => el.__style);

    const scene = collectDomPptxScene(canvas as unknown as HTMLElement);

    expect(scene.nodes).toEqual([
      expect.objectContaining({
        dataUrl: 'data:image/png;base64,abc',
        decision: { kind: 'raster', reason: 'unsupported filter' },
        h: 240,
        kind: 'raster',
        reason: 'unsupported filter',
        w: 360,
      }),
    ]);
  });

  it('collects equation primitives as reduced-fidelity editable equation nodes', () => {
    const equation = testElement({
      attributes: {
        'data-osd-pptx-fallback': 'E = m c^2',
        'data-osd-pptx-inline': 'true',
        'data-osd-pptx-kind': 'equation',
        'data-osd-pptx-latex': 'E = mc^2',
      },
      rect: { height: 80, width: 360, x: 40, y: 50 },
      text: 'E = m c^2',
    });
    const canvas = testElement({
      children: [equation],
      rect: { height: 1080, width: 1920, x: 0, y: 0 },
    });
    vi.stubGlobal('getComputedStyle', (el: TestElement) => el.__style);

    const scene = collectDomPptxScene(canvas as unknown as HTMLElement);

    expect(scene.nodes).toEqual([
      expect.objectContaining({
        fallbackText: 'E = m c^2',
        inline: true,
        kind: 'equation',
        latex: 'E = mc^2',
      }),
    ]);
    expect(scene.diagnostics).toEqual([
      expect.objectContaining({
        message: expect.stringContaining('native OfficeMath'),
        nodeKind: 'equation',
      }),
    ]);
  });

  it('collects explicit table primitives as native table nodes', () => {
    const table = testElement({
      attributes: {
        'data-osd-pptx-kind': 'table',
        'data-osd-pptx-table': JSON.stringify({
          columns: ['Metric', 'Value'],
          rows: [['Text', 'Editable']],
        }),
      },
      rect: { height: 180, width: 520, x: 40, y: 50 },
      tagName: 'TABLE',
    });
    const canvas = testElement({
      children: [table],
      rect: { height: 1080, width: 1920, x: 0, y: 0 },
    });
    vi.stubGlobal('getComputedStyle', (el: TestElement) => el.__style);

    const scene = collectDomPptxScene(canvas as unknown as HTMLElement);

    expect(scene.nodes).toEqual([
      expect.objectContaining({
        columns: ['Metric', 'Value'],
        decision: { kind: 'native' },
        kind: 'table',
        rows: [['Text', 'Editable']],
      }),
    ]);
  });

  it('collects explicit chart primitives as native chart nodes', () => {
    const chart = testElement({
      attributes: {
        'data-osd-pptx-chart': JSON.stringify({
          chartType: 'bar',
          labels: ['Text', 'Images'],
          series: [{ color: '3F7D58', name: 'Score', values: [92, 76] }],
          title: 'Editability score',
        }),
        'data-osd-pptx-kind': 'chart',
      },
      rect: { height: 320, width: 640, x: 40, y: 50 },
    });
    const canvas = testElement({
      children: [chart],
      rect: { height: 1080, width: 1920, x: 0, y: 0 },
    });
    vi.stubGlobal('getComputedStyle', (el: TestElement) => el.__style);

    const scene = collectDomPptxScene(canvas as unknown as HTMLElement);

    expect(scene.nodes).toEqual([
      expect.objectContaining({
        chartType: 'bar',
        decision: { kind: 'native' },
        kind: 'chart',
        labels: ['Text', 'Images'],
        series: [{ color: '3F7D58', name: 'Score', values: [92, 76] }],
        title: 'Editability score',
      }),
    ]);
  });

  it('keeps inline SVG visible as an image fallback without collecting descendants', () => {
    const path = testElement({
      rect: { height: 200, width: 200, x: 80, y: 90 },
      style: { borderColor: 'rgb(0, 0, 0)', borderStyle: 'solid', borderTopWidth: '8px' },
      tagName: 'PATH',
    });
    const svg = testElement({
      children: [path],
      rect: { height: 320, width: 260, x: 40, y: 50 },
      tagName: 'SVG',
    });
    const canvas = testElement({
      children: [svg],
      rect: { height: 1080, width: 1920, x: 0, y: 0 },
    });
    vi.stubGlobal('getComputedStyle', (el: TestElement) => el.__style);
    vi.stubGlobal(
      'XMLSerializer',
      class {
        serializeToString() {
          return '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
        }
      },
    );

    const scene = collectDomPptxScene(canvas as unknown as HTMLElement);

    expect(scene.nodes).toEqual([
      expect.objectContaining({
        fit: 'stretch',
        h: 320,
        kind: 'image',
        src: expect.stringMatching(/^data:image\/svg\+xml;base64,/),
        w: 260,
        x: 40,
        y: 50,
      }),
    ]);
  });

  it('adds diagnostics for unsupported effects without creating UI state', () => {
    const filtered = testElement({
      rect: { height: 100, width: 100, x: 0, y: 0 },
      style: { filter: 'blur(4px)', mixBlendMode: 'multiply' },
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
    expect(scene.nodes[0]).toEqual(
      expect.objectContaining({
        decision: {
          kind: 'native-reduced',
          reason: expect.stringContaining('filter'),
        },
      }),
    );
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
