import { describe, expect, it } from 'vitest';
import { applyRevertAsset, findAssetUsages, findReferencedAssets } from './revert-asset.ts';

describe('findAssetUsages', () => {
  it('returns 0 when the import is absent', () => {
    const src = [
      "import { ImagePlaceholder } from '@open-slide/core';",
      'export default [() => (<ImagePlaceholder hint="x" />)];',
      '',
    ].join('\n');
    expect(findAssetUsages(src, './assets/hero.png')).toBe(0);
  });

  it('counts every <img src={ident}> that references the import', () => {
    const src = [
      "import hero from './assets/hero.png';",
      'export default [() => (',
      '  <div>',
      "    <img src={hero} alt='a' style={{ objectFit: 'cover' }} />",
      "    <img src={hero} alt='b' style={{ objectFit: 'cover' }} />",
      '  </div>',
      ')];',
      '',
    ].join('\n');
    expect(findAssetUsages(src, './assets/hero.png')).toBe(2);
  });

  it('ignores <img src> that points at a different identifier', () => {
    const src = [
      "import hero from './assets/hero.png';",
      "import logo from './assets/logo.svg';",
      'export default [() => (',
      "  <img src={logo} alt='l' />",
      ')];',
      '',
    ].join('\n');
    expect(findAssetUsages(src, './assets/hero.png')).toBe(0);
  });
});

describe('findReferencedAssets', () => {
  it('detects direct <img src={ident}> usage', () => {
    const src = [
      "import hero from './assets/hero.png';",
      'export default [() => (<img src={hero} alt="h" />)];',
      '',
    ].join('\n');
    const refs = findReferencedAssets(src, ['./assets/hero.png']);
    expect(refs.has('./assets/hero.png')).toBe(true);
  });

  it('detects ident passed as a prop to a wrapper component', () => {
    const src = [
      "import diagram from './assets/diagram.webp';",
      'const DiagramImage = ({ src }) => <img src={src} />;',
      'export default [() => (<DiagramImage src={diagram} />)];',
      '',
    ].join('\n');
    const refs = findReferencedAssets(src, ['./assets/diagram.webp']);
    expect(refs.has('./assets/diagram.webp')).toBe(true);
  });

  it('detects ident used as a value in any expression position', () => {
    const src = [
      "import bg from './assets/bg.png';",
      'export default [() => (<div style={{ backgroundImage: bg }} />)];',
      '',
    ].join('\n');
    const refs = findReferencedAssets(src, ['./assets/bg.png']);
    expect(refs.has('./assets/bg.png')).toBe(true);
  });

  it('returns empty set when the import is never referenced beyond the declaration', () => {
    const src = [
      "import unused from './assets/unused.png';",
      'export default [() => (<div />)];',
      '',
    ].join('\n');
    const refs = findReferencedAssets(src, ['./assets/unused.png']);
    expect(refs.has('./assets/unused.png')).toBe(false);
  });

  it('only flags paths that appear in the wanted set', () => {
    const src = [
      "import hero from './assets/hero.png';",
      "import logo from './assets/logo.svg';",
      'export default [() => (<img src={hero} alt="h" />)];',
      '',
    ].join('\n');
    const refs = findReferencedAssets(src, ['./assets/hero.png', './assets/logo.svg']);
    expect(refs.has('./assets/hero.png')).toBe(true);
    expect(refs.has('./assets/logo.svg')).toBe(false);
  });
});

describe('applyRevertAsset', () => {
  it('reverts <img> back to <ImagePlaceholder> and removes the asset import', () => {
    const src = [
      "import { ImagePlaceholder } from '@open-slide/core';",
      "import hero from './assets/hero.png';",
      'export default [() => (',
      "  <img src={hero} alt='Product hero' style={{ width: 1280, height: 720, objectFit: 'cover', objectPosition: '50% 50%' }} />",
      ')];',
      '',
    ].join('\n');
    const r = applyRevertAsset(src, './assets/hero.png');
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).not.toContain("from './assets/hero.png'");
    expect(r.source).not.toContain('<img');
    expect(r.source).toContain(
      '<ImagePlaceholder hint="Product hero" width={1280} height={720} />',
    );
  });

  it('omits width/height when the style only carries objectFit', () => {
    const src = [
      "import { ImagePlaceholder } from '@open-slide/core';",
      "import logo from './assets/logo.svg';",
      'export default [() => (',
      "  <img src={logo} alt='Logo' style={{ objectFit: 'cover', objectPosition: '50% 50%' }} />",
      ')];',
      '',
    ].join('\n');
    const r = applyRevertAsset(src, './assets/logo.svg');
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain('<ImagePlaceholder hint="Logo" />');
    expect(r.source).not.toMatch(/width=\{/);
    expect(r.source).not.toMatch(/height=\{/);
  });

  it("treats '100%' style fillers as unset and keeps numeric dims", () => {
    const src = [
      "import { ImagePlaceholder } from '@open-slide/core';",
      "import cover from './assets/cover.png';",
      'export default [() => (',
      "  <img src={cover} alt='Cover' style={{ width: 800, height: '100%', objectFit: 'cover', objectPosition: '50% 50%' }} />",
      ')];',
      '',
    ].join('\n');
    const r = applyRevertAsset(src, './assets/cover.png');
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain('<ImagePlaceholder hint="Cover" width={800} />');
  });

  it('adds ImagePlaceholder to an existing @open-slide/core named import', () => {
    const src = [
      "import { type Page } from '@open-slide/core';",
      "import hero from './assets/hero.png';",
      'export default [() => (',
      "  <img src={hero} alt='x' style={{ objectFit: 'cover' }} />",
      ')];',
      '',
    ].join('\n');
    const r = applyRevertAsset(src, './assets/hero.png');
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toMatch(/import \{ type Page, ImagePlaceholder \} from '@open-slide\/core';/);
  });

  it('adds a separate value import when the only @open-slide/core import is type-only', () => {
    const src = [
      "import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';",
      "import hero from './assets/hero.png';",
      'export default [() => (',
      "  <img src={hero} alt='x' style={{ objectFit: 'cover' }} />",
      ')];',
      '',
    ].join('\n');
    const r = applyRevertAsset(src, './assets/hero.png');
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toMatch(
      /import type \{ DesignSystem, Page, SlideMeta \} from '@open-slide\/core';/,
    );
    expect(r.source).toContain("import { ImagePlaceholder } from '@open-slide/core';");
  });

  it('adds a fresh @open-slide/core import when none exists', () => {
    const src = [
      "import hero from './assets/hero.png';",
      'export default [() => (',
      "  <img src={hero} alt='x' style={{ objectFit: 'cover' }} />",
      ')];',
      '',
    ].join('\n');
    const r = applyRevertAsset(src, './assets/hero.png');
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source.split('\n')[0]).toBe("import { ImagePlaceholder } from '@open-slide/core';");
  });

  it('is a no-op when the asset is not imported', () => {
    const src = [
      "import { ImagePlaceholder } from '@open-slide/core';",
      'export default [() => (<ImagePlaceholder hint="x" />)];',
      '',
    ].join('\n');
    const r = applyRevertAsset(src, './assets/missing.png');
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toBe(src);
  });

  it('reverts multiple <img> usages of the same import in one file', () => {
    const src = [
      "import { ImagePlaceholder } from '@open-slide/core';",
      "import hero from './assets/hero.png';",
      'export default [() => (',
      '  <div>',
      "    <img src={hero} alt='First' style={{ width: 100, height: 100, objectFit: 'cover' }} />",
      "    <img src={hero} alt='Second' style={{ objectFit: 'cover' }} />",
      '  </div>',
      ')];',
      '',
    ].join('\n');
    const r = applyRevertAsset(src, './assets/hero.png');
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).not.toContain("from './assets/hero.png'");
    expect(r.source).toContain('<ImagePlaceholder hint="First" width={100} height={100} />');
    expect(r.source).toContain('<ImagePlaceholder hint="Second" />');
  });

  it('refuses to revert when the identifier is referenced outside <img src>', () => {
    const src = [
      "import { ImagePlaceholder } from '@open-slide/core';",
      "import hero from './assets/hero.png';",
      'export default [() => (',
      '  <div data-bg={hero}>',
      "    <img src={hero} alt='x' style={{ objectFit: 'cover' }} />",
      '  </div>',
      ')];',
      '',
    ].join('\n');
    const r = applyRevertAsset(src, './assets/hero.png');
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected failure');
    expect(r.error).toMatch(/outside <img/);
  });
});
