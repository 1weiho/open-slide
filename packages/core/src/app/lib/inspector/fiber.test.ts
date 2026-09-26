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
  _debugOwner?: FakeFiber | null;
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
  parent?: FakeFiber | null;
  owner?: FakeFiber | null;
}): FakeFiber {
  const source: DebugSource | undefined =
    opts.fileName !== undefined
      ? { fileName: opts.fileName, lineNumber: opts.line, columnNumber: opts.column }
      : undefined;
  return {
    return: opts.parent ?? null,
    stateNode: opts.host ? new FakeHTMLElement() : undefined,
    _debugSource: source,
    _debugOwner: opts.owner ?? null,
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
    const hit = findSlideSource(el as unknown as HTMLElement, 'cover');
    expect(hit).not.toBeNull();
    expect(hit?.line).toBe(42);
    expect(hit?.column).toBe(7);
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
  const slide = '/repo/slides/cover/index.tsx';

  it('resolves to the invocation and corrects the fiber line shift', () => {
    // the page wrote <Row index="01"> at line 994. The tag says 431, the fiber says 450: the dev
    // transform's preamble shifts every fiber line by 19, so the invocation's 1013 is really 994.
    const row = makeFiber({ fileName: slide, line: 1013, column: 14 });
    const span = makeFiber({ fileName: slide, line: 450, host: true, owner: row });
    const el = makeEl({ slideLoc: '431:4', fiber: span });
    const hit = findCommentSource(el as unknown as HTMLElement, 'cover');
    expect(hit?.line).toBe(994);
    expect(hit?.column).toBe(14);
    expect(hit?.anchor).toBe(el as unknown as HTMLElement);
  });

  it('keeps the outermost invocation when primitives nest', () => {
    const page = makeFiber({ fileName: '/repo/src/router.tsx', line: 9 });
    const card = makeFiber({ fileName: slide, line: 1079, owner: page });
    const row = makeFiber({ fileName: slide, line: 1061, owner: card, parent: card });
    const span = makeFiber({ host: true, owner: row, parent: row });
    const el = makeEl({ fiber: span });
    // the page's own JSX is <Card>, not the <Row> inside it
    expect(findCommentSource(el as unknown as HTMLElement, 'cover')?.line).toBe(1079);
  });

  it('returns null when the page wrote the element itself', () => {
    const page = makeFiber({ fileName: '/repo/src/router.tsx', line: 9 });
    const div = makeFiber({ host: true, owner: page });
    const el = makeEl({ fiber: div });
    expect(findCommentSource(el as unknown as HTMLElement, 'cover')).toBeNull();
  });

  it('ignores an owner sourced from outside the slide file', () => {
    const core = makeFiber({
      fileName: '/repo/node_modules/@open-slide/core/dist/index.js',
      line: 1,
    });
    const div = makeFiber({ host: true, owner: core });
    const el = makeEl({ fiber: div });
    expect(findCommentSource(el as unknown as HTMLElement, 'cover')).toBeNull();
  });

  it('returns null when there is no fiber at all', () => {
    const el = makeEl({ slideLoc: '42:7' });
    expect(findCommentSource(el as unknown as HTMLElement, 'cover')).toBeNull();
  });
});
