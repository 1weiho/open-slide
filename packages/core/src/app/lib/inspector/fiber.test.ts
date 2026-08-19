import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { findCommentSource, findSlideSource } from './fiber.ts';

class FakeHTMLElement {
  dataset: Record<string, string> = {};
  private closestSelf: FakeHTMLElement | null = null;
  setClosestSelfForSlideLoc() {
    this.closestSelf = this;
  }
  closest(selector: string): FakeHTMLElement | null {
    if (selector === '[data-slide-loc]') return this.closestSelf;
    return null;
  }
}

type DebugSource = { fileName?: string; lineNumber?: number; columnNumber?: number };
type FakeFiber = {
  return: FakeFiber | null;
  stateNode?: unknown;
  _debugSource?: DebugSource;
};

function makeEl(opts: { slideLoc?: string; fiber?: FakeFiber } = {}): FakeHTMLElement {
  const el = new FakeHTMLElement();
  if (opts.slideLoc) {
    el.dataset.slideLoc = opts.slideLoc;
    el.setClosestSelfForSlideLoc();
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
  stateNode?: unknown;
  parent?: FakeFiber | null;
}): FakeFiber {
  const source: DebugSource | undefined =
    opts.fileName !== undefined
      ? { fileName: opts.fileName, lineNumber: opts.line, columnNumber: opts.column }
      : undefined;
  return {
    return: opts.parent ?? null,
    stateNode: opts.host ? (opts.stateNode ?? new FakeHTMLElement()) : undefined,
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
  it('reads line:column from data-slide-loc', () => {
    const el = makeEl({ slideLoc: '42:7' });
    el.dataset.slideFile = '01-Cover.tsx';
    const hit = findSlideSource(el as unknown as HTMLElement, 'cover');
    expect(hit).not.toBeNull();
    expect(hit?.line).toBe(42);
    expect(hit?.column).toBe(7);
    expect(hit?.sourceFile).toBe('01-Cover.tsx');
    expect(hit?.anchor).toBe(el as unknown as HTMLElement);
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
});

describe('findCommentSource', () => {
  it('prefers the component call-site source over the host definition source', () => {
    const component = makeFiber({
      fileName: '/repo/slides/cover/index.tsx',
      line: 20,
      column: 4,
      host: false,
    });
    const host = makeFiber({
      fileName: '/repo/slides/cover/index.tsx',
      line: 3,
      column: 2,
      host: true,
      parent: component,
    });
    const el = makeEl({ slideLoc: '3:2', fiber: host });
    const hit = findCommentSource(el as unknown as HTMLElement, 'cover');
    expect(hit).not.toBeNull();
    expect(hit?.line).toBe(20);
    expect(hit?.column).toBe(4);
    expect(hit?.sourceFile).toBe('index.tsx');
  });

  it('prefers component call-sites in non-index slide files under custom slide roots', () => {
    const component = makeFiber({
      fileName: '/repo/decks/cover/01-Cover.tsx',
      line: 20,
      column: 4,
      host: false,
    });
    const host = makeFiber({
      fileName: '/repo/decks/cover/shared.tsx',
      line: 3,
      column: 2,
      host: true,
      parent: component,
    });
    const el = makeEl({ slideLoc: '3:2', fiber: host });
    el.dataset.slideFile = 'shared.tsx';
    const hit = findCommentSource(el as unknown as HTMLElement, 'cover');
    expect(hit).not.toBeNull();
    expect(hit?.line).toBe(20);
    expect(hit?.column).toBe(4);
    expect(hit?.sourceFile).toBe('01-Cover.tsx');
  });

  it('walks nested shared component chains to the page-specific call-site', () => {
    const pageCallSite = makeFiber({
      fileName: '/repo/decks/cover/01-Cover.tsx',
      line: 20,
      column: 4,
      host: false,
    });
    const sharedCallSite = makeFiber({
      fileName: '/repo/decks/cover/Card.tsx',
      line: 8,
      column: 6,
      host: false,
      parent: pageCallSite,
    });
    const host = makeFiber({
      fileName: '/repo/decks/cover/Header.tsx',
      line: 3,
      column: 2,
      host: true,
      parent: sharedCallSite,
    });
    const el = makeEl({ slideLoc: '3:2', fiber: host });
    el.dataset.slideFile = 'Header.tsx';
    const hit = findCommentSource(el as unknown as HTMLElement, 'cover');
    expect(hit).not.toBeNull();
    expect(hit?.line).toBe(20);
    expect(hit?.column).toBe(4);
    expect(hit?.sourceFile).toBe('01-Cover.tsx');
  });

  it('falls back to data-slide-loc for direct host elements', () => {
    const el = makeEl({ slideLoc: '42:7' });
    el.dataset.slideFile = '01-Cover.tsx';
    const hit = findCommentSource(el as unknown as HTMLElement, 'cover');
    expect(hit).not.toBeNull();
    expect(hit?.line).toBe(42);
    expect(hit?.column).toBe(7);
    expect(hit?.sourceFile).toBe('01-Cover.tsx');
  });
});
