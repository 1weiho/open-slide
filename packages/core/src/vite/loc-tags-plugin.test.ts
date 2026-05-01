import { describe, expect, it } from 'vitest';
import { injectLocTags } from './loc-tags-plugin.ts';

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
