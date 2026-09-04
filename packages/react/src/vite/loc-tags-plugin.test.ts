import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { injectLocTags, locTagsPlugin } from './loc-tags-plugin.ts';

const pluginTransformSource = 'export default [() => <div />];';

type LocTagsTransformResult = null | { code: string; map: null };

function transformWithLocTags(id: string) {
  // Force `path.resolve` to return a POSIX slidesRoot so this suite
  // exercises the same code path regardless of host OS.
  const resolveSpy = vi.spyOn(path, 'resolve').mockReturnValue('/repo/slides');
  try {
    const plugin = locTagsPlugin({ userCwd: '/repo' });
    const transform = plugin.transform;
    if (typeof transform !== 'function') throw new Error('expected transform function');
    return transform.call({} as never, pluginTransformSource, id) as LocTagsTransformResult;
  } finally {
    resolveSpy.mockRestore();
  }
}

function expectTaggedTransform(id: string) {
  const out = transformWithLocTags(id);
  if (out === null) throw new Error('expected tagged transform result');
  expect(out.code).toContain('data-slide-loc');
}

describe('injectLocTags', () => {
  it('adds data-slide-loc to host elements with the JSX start position', () => {
    const src = ['export default [() => (', '  <div>hello</div>', ')];', ''].join('\n');
    const out = injectLocTags(src);
    if (out === null) throw new Error('expected transform');
    expect(out).toContain('<div data-slide-loc="2:2">hello</div>');
  });

  it('skips capitalized component invocations', () => {
    const src = ['export default [() => (', '  <MyComp>hi</MyComp>', ')];', ''].join('\n');
    const out = injectLocTags(src);
    expect(out).toBeNull();
  });

  it('tags every host element including nested ones', () => {
    const src = [
      'export default [() => (',
      '  <div>',
      '    <h1>Hi</h1>',
      '    <p>World</p>',
      '  </div>',
      ')];',
      '',
    ].join('\n');
    const out = injectLocTags(src);
    if (out === null) throw new Error('expected transform');
    expect(out).toContain('<div data-slide-loc="2:2">');
    expect(out).toContain('<h1 data-slide-loc="3:4">Hi</h1>');
    expect(out).toContain('<p data-slide-loc="4:4">World</p>');
  });

  it('skips elements that already have data-slide-loc', () => {
    const src = [
      'export default [() => (',
      '  <div data-slide-loc="2:2">already</div>',
      ')];',
      '',
    ].join('\n');
    const out = injectLocTags(src);
    expect(out).toBeNull();
  });

  it('inserts after the tag name, before any other attributes', () => {
    const src = ['export default [() => (', '  <div className="foo">x</div>', ')];', ''].join('\n');
    const out = injectLocTags(src);
    if (out === null) throw new Error('expected transform');
    expect(out).toContain('<div data-slide-loc="2:2" className="foo">x</div>');
  });

  it('handles self-closing host elements', () => {
    const src = ['export default [() => (', '  <img src="x" />', ')];', ''].join('\n');
    const out = injectLocTags(src);
    if (out === null) throw new Error('expected transform');
    expect(out).toContain('<img data-slide-loc="2:2" src="x" />');
  });

  it('returns null when source has no host elements', () => {
    const src = 'const x = 1;';
    expect(injectLocTags(src)).toBeNull();
  });

  it('tags only host elements, leaving custom components untouched', () => {
    const src = [
      'export default [() => (',
      '  <Layout>',
      '    <h1>Title</h1>',
      '    <SubBox><span>nested</span></SubBox>',
      '  </Layout>',
      ')];',
      '',
    ].join('\n');
    const out = injectLocTags(src);
    if (out === null) throw new Error('expected transform');
    expect(out).toContain('<h1 data-slide-loc="3:4">Title</h1>');
    expect(out).toContain('<span data-slide-loc="4:12">nested</span>');
    expect(out).not.toContain('<Layout data-slide-loc');
    expect(out).not.toContain('<SubBox data-slide-loc');
  });

  it('tags <ImagePlaceholder> as a forwarding component', () => {
    const src = ['export default [() => (', '  <ImagePlaceholder hint="hero" />', ')];', ''].join(
      '\n',
    );
    const out = injectLocTags(src);
    if (out === null) throw new Error('expected transform');
    expect(out).toContain('<ImagePlaceholder data-slide-loc="2:2" hint="hero" />');
  });

  it('does not tag other PascalCase components alongside ImagePlaceholder', () => {
    const src = [
      'export default [() => (',
      '  <Layout>',
      '    <ImagePlaceholder hint="hero" />',
      '    <CustomThing />',
      '  </Layout>',
      ')];',
      '',
    ].join('\n');
    const out = injectLocTags(src);
    if (out === null) throw new Error('expected transform');
    expect(out).toContain('<ImagePlaceholder data-slide-loc="3:4"');
    expect(out).not.toContain('<Layout data-slide-loc');
    expect(out).not.toContain('<CustomThing data-slide-loc');
  });
});

describe('locTagsPlugin', () => {
  it('tags slide index files', () => {
    expectTaggedTransform('/repo/slides/cover/index.tsx');
  });

  it('tags shared slide source files', () => {
    expectTaggedTransform('/repo/slides/cover/shared.tsx');
  });

  it('tags numbered slide source files', () => {
    expectTaggedTransform('/repo/slides/cover/01-Cover.tsx');
  });

  it('tags slide source files in nested folders', () => {
    expectTaggedTransform('/repo/slides/cover/components/Card.tsx');
  });

  it('skips tsx files directly under the slides directory', () => {
    expect(transformWithLocTags('/repo/slides/index.tsx')).toBeNull();
  });

  it('skips tsx files outside the slides directory', () => {
    expect(transformWithLocTags('/repo/apps/demo/foo.tsx')).toBeNull();
  });

  it('skips colocated test files', () => {
    expect(transformWithLocTags('/repo/slides/cover/index.test.tsx')).toBeNull();
  });
});

describe('locTagsPlugin on Windows-style paths', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function transformWithMockedResolve(resolvedSlidesRoot: string, id: string) {
    vi.spyOn(path, 'resolve').mockReturnValue(resolvedSlidesRoot);
    const plugin = locTagsPlugin({ userCwd: 'C:\\repo' });
    const transform = plugin.transform;
    if (typeof transform !== 'function') throw new Error('expected transform function');
    return transform.call({} as never, pluginTransformSource, id) as LocTagsTransformResult;
  }

  function expectTagged(resolvedSlidesRoot: string, id: string) {
    const out = transformWithMockedResolve(resolvedSlidesRoot, id);
    if (out === null) throw new Error(`expected tagged transform result for ${id}`);
    expect(out.code).toContain('data-slide-loc');
  }

  it('tags slide index files with forward-slash ids under a Windows slidesRoot', () => {
    expectTagged('C:\\repo\\slides', 'C:/repo/slides/cover/index.tsx');
  });

  it('strips HMR ?t= query before matching', () => {
    expectTagged('C:\\repo\\slides', 'C:/repo/slides/cover/index.tsx?t=1700000000000');
  });

  it('tags nested slide source files under a Windows slidesRoot', () => {
    expectTagged('C:\\repo\\slides', 'C:/repo/slides/cover/components/Card.tsx');
  });

  it('skips tsx files directly under the Windows slides directory', () => {
    expect(transformWithMockedResolve('C:\\repo\\slides', 'C:/repo/slides/index.tsx')).toBeNull();
  });

  it('skips tsx files outside the Windows slides directory', () => {
    expect(transformWithMockedResolve('C:\\repo\\slides', 'C:/repo/apps/demo/foo.tsx')).toBeNull();
  });

  it('skips colocated test files under a Windows slidesRoot', () => {
    expect(
      transformWithMockedResolve('C:\\repo\\slides', 'C:/repo/slides/cover/index.test.tsx'),
    ).toBeNull();
  });

  it('still tags POSIX ids when path.resolve returns a POSIX slidesRoot (regression guard)', () => {
    expectTagged('/repo/slides', '/repo/slides/cover/index.tsx');
  });
});
