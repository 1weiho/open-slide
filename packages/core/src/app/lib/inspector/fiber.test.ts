import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { findSlideSource } from './fiber.ts';

class FakeHTMLElement {
  dataset: Record<string, string> = {};
  parentElement: FakeHTMLElement | null = null;
  closest(selector: string): FakeHTMLElement | null {
    if (selector !== '[data-slide-loc]') return null;
    for (let cur: FakeHTMLElement | null = this; cur; cur = cur.parentElement) {
      if (cur.dataset.slideLoc) return cur;
    }
    return null;
  }
}

type DebugSource = { fileName?: string; lineNumber?: number; columnNumber?: number };
type FakeFiber = {
  return: FakeFiber | null;
  stateNode?: unknown;
  _debugSource?: DebugSource;
};

function makeEl(
  opts: { slideLoc?: string; fiber?: FakeFiber; parent?: FakeHTMLElement } = {},
): FakeHTMLElement {
  const el = new FakeHTMLElement();
  if (opts.slideLoc) {
    el.dataset.slideLoc = opts.slideLoc;
  }
  if (opts.parent) {
    el.parentElement = opts.parent;
  }
  if (opts.fiber) {
    (el as unknown as Record<string, FakeFiber>).__reactFiber$test = opts.fiber;
  }
  return el;
}

function makeFiber(opts: {
  fileName?: string;
  line?: number;
  column?: number;
  host?: boolean;
  hostEl?: FakeHTMLElement;
  parent?: FakeFiber | null;
}): FakeFiber {
  const source: DebugSource | undefined =
    opts.fileName !== undefined
      ? { fileName: opts.fileName, lineNumber: opts.line, columnNumber: opts.column }
      : undefined;
  let stateNode: unknown;
  if (opts.hostEl) {
    stateNode = opts.hostEl;
  } else if (opts.host) {
    stateNode = new FakeHTMLElement();
  }
  return {
    return: opts.parent ?? null,
    stateNode,
    _debugSource: source,
  };
}

beforeAll(() => {
  vi.stubGlobal('HTMLElement', FakeHTMLElement);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

describe('findSlideSource primary path', () => {
  it('reads line:column from data-slide-loc on the element itself', () => {
    const el = makeEl({ slideLoc: '42:7' });
    const hit = findSlideSource(el as unknown as HTMLElement, 'cover');
    expect(hit).not.toBeNull();
    expect(hit?.line).toBe(42);
    expect(hit?.column).toBe(7);
    expect(hit?.anchor).toBe(el as unknown as HTMLElement);
  });

  it('falls back to a tagged ancestor when fiber debug source is missing', () => {
    const wrapper = makeEl({ slideLoc: '5:2' });
    const el = makeEl({ parent: wrapper });
    const hit = findSlideSource(el as unknown as HTMLElement, 'cover');
    expect(hit).not.toBeNull();
    expect(hit?.line).toBe(5);
    expect(hit?.column).toBe(2);
    expect(hit?.anchor).toBe(wrapper as unknown as HTMLElement);
  });
});

describe('findSlideSource fallback', () => {
  it('matches a POSIX fileName', () => {
    const fiber = makeFiber({
      fileName: '/repo/slides/cover/index.tsx',
      line: 10,
      column: 4,
      host: true,
    });
    const el = makeEl({ fiber });
    const hit = findSlideSource(el as unknown as HTMLElement, 'cover');
    expect(hit).not.toBeNull();
    expect(hit?.line).toBe(10);
    expect(hit?.column).toBe(4);
  });

  it('matches a Windows-backslash fileName', () => {
    const fiber = makeFiber({
      fileName: 'C:\\repo\\slides\\cover\\index.tsx',
      line: 11,
      column: 2,
      host: true,
    });
    const el = makeEl({ fiber });
    const hit = findSlideSource(el as unknown as HTMLElement, 'cover');
    expect(hit).not.toBeNull();
    expect(hit?.line).toBe(11);
    expect(hit?.column).toBe(2);
  });

  it('matches a fileName carrying an HMR ?t= query', () => {
    const fiber = makeFiber({
      fileName: '/repo/slides/cover/index.tsx?t=1700000000000',
      line: 12,
      column: 0,
      host: true,
    });
    const el = makeEl({ fiber });
    const hit = findSlideSource(el as unknown as HTMLElement, 'cover');
    expect(hit).not.toBeNull();
    expect(hit?.line).toBe(12);
  });

  it('matches a Windows fileName with an HMR query', () => {
    const fiber = makeFiber({
      fileName: 'C:\\repo\\slides\\cover\\index.tsx?t=1700000000000',
      line: 13,
      column: 1,
      host: true,
    });
    const el = makeEl({ fiber });
    const hit = findSlideSource(el as unknown as HTMLElement, 'cover');
    expect(hit).not.toBeNull();
    expect(hit?.line).toBe(13);
    expect(hit?.column).toBe(1);
  });

  it('returns null when the fiber fileName points at a different slideId', () => {
    const fiber = makeFiber({
      fileName: '/repo/slides/other/index.tsx',
      line: 10,
      column: 4,
      host: true,
    });
    const el = makeEl({ fiber });
    const hit = findSlideSource(el as unknown as HTMLElement, 'cover');
    expect(hit).toBeNull();
  });

  it('walks up the fiber chain until it finds a matching source', () => {
    const parent = makeFiber({
      fileName: '/repo/slides/cover/index.tsx',
      line: 99,
      column: 3,
      host: true,
    });
    const leaf = makeFiber({ parent, host: true });
    const el = makeEl({ fiber: leaf });
    const hit = findSlideSource(el as unknown as HTMLElement, 'cover');
    expect(hit).not.toBeNull();
    expect(hit?.line).toBe(99);
    expect(hit?.column).toBe(3);
  });

  it('selects an imported component call site and keeps the host anchor', () => {
    const hostEl = makeEl();
    const callSite = makeFiber({
      fileName: '/repo/slides/cover/index.tsx',
      line: 20,
      column: 4,
    });
    const libraryHost = makeFiber({
      fileName: '/repo/components/Heading.tsx',
      line: 3,
      column: 2,
      hostEl,
      parent: callSite,
    });
    const el = makeEl({ fiber: libraryHost });
    // Point the leaf fiber's stateNode at the clicked element itself.
    libraryHost.stateNode = el;

    const hit = findSlideSource(el as unknown as HTMLElement, 'cover');
    expect(hit).not.toBeNull();
    expect(hit?.line).toBe(20);
    expect(hit?.column).toBe(4);
    expect(hit?.anchor).toBe(el as unknown as HTMLElement);
  });

  it('rejects imported call sites when hostOnly is set', () => {
    const callSite = makeFiber({
      fileName: '/repo/slides/cover/index.tsx',
      line: 20,
      column: 4,
    });
    const libraryHost = makeFiber({
      fileName: '/repo/components/Heading.tsx',
      line: 3,
      column: 2,
      host: true,
      parent: callSite,
    });
    const el = makeEl({ fiber: libraryHost });
    libraryHost.stateNode = el;

    const hit = findSlideSource(el as unknown as HTMLElement, 'cover', { hostOnly: true });
    expect(hit).toBeNull();
  });

  it('prefers a shared call site over a tagged slide ancestor', () => {
    const wrapper = makeEl({ slideLoc: '8:2' });
    const callSite = makeFiber({
      fileName: '/repo/slides/cover/index.tsx',
      line: 12,
      column: 6,
    });
    const libraryHost = makeFiber({
      fileName: '/repo/components/Heading.tsx',
      line: 2,
      column: 0,
      host: true,
      parent: callSite,
    });
    const el = makeEl({ fiber: libraryHost, parent: wrapper });
    libraryHost.stateNode = el;

    const hit = findSlideSource(el as unknown as HTMLElement, 'cover');
    expect(hit).not.toBeNull();
    expect(hit?.line).toBe(12);
    expect(hit?.column).toBe(6);
    expect(hit?.anchor).toBe(el as unknown as HTMLElement);
  });

  it('resolves nested shared components to the nearest slide call site', () => {
    const outerCall = makeFiber({
      fileName: '/repo/slides/cover/index.tsx',
      line: 30,
      column: 2,
    });
    const innerCall = makeFiber({
      fileName: '/repo/slides/cover/index.tsx',
      line: 31,
      column: 4,
      parent: outerCall,
    });
    // Inner library host under <Heading>, which is itself under <Card>.
    const libraryHost = makeFiber({
      fileName: '/repo/components/Heading.tsx',
      line: 2,
      column: 0,
      host: true,
      parent: innerCall,
    });
    const el = makeEl({ fiber: libraryHost });
    libraryHost.stateNode = el;

    const hit = findSlideSource(el as unknown as HTMLElement, 'cover');
    expect(hit).not.toBeNull();
    expect(hit?.line).toBe(31);
    expect(hit?.column).toBe(4);
  });

  it('maps a text-bearing host under a shared component to the call site', () => {
    // Mirrors clicking the text node "Click me" inside <Heading>Click me</Heading>:
    // elementsFromPoint returns the host div; fiber points at the library file.
    const callSite = makeFiber({
      fileName: '/repo/slides/demo/index.tsx',
      line: 7,
      column: 15,
    });
    const libraryHost = makeFiber({
      fileName: '/repo/components/Heading.tsx',
      line: 2,
      column: 4,
      host: true,
      parent: callSite,
    });
    const el = makeEl({ fiber: libraryHost });
    libraryHost.stateNode = el;

    const hit = findSlideSource(el as unknown as HTMLElement, 'demo');
    expect(hit).not.toBeNull();
    expect(hit?.line).toBe(7);
    expect(hit?.column).toBe(15);
    expect(hit?.anchor).toBe(el as unknown as HTMLElement);
  });
});
