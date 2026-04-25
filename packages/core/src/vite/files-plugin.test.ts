import { describe, expect, it } from 'vitest';
import {
  updateMetaTitleInSource,
  validateIcon,
  validateName,
  validateSlideName,
} from './files-plugin.ts';

describe('validateName', () => {
  it('trims whitespace and accepts non-empty strings', () => {
    expect(validateName('  hello  ')).toBe('hello');
    expect(validateName('a')).toBe('a');
  });

  it('rejects non-strings', () => {
    expect(validateName(null)).toBeNull();
    expect(validateName(undefined)).toBeNull();
    expect(validateName(42)).toBeNull();
    expect(validateName({})).toBeNull();
  });

  it('rejects empty / whitespace-only / overlong strings', () => {
    expect(validateName('')).toBeNull();
    expect(validateName('   ')).toBeNull();
    expect(validateName('x'.repeat(41))).toBeNull();
  });

  it('accepts a 40-character name (boundary)', () => {
    expect(validateName('x'.repeat(40))).toBe('x'.repeat(40));
  });
});

describe('validateSlideName', () => {
  it('accepts longer slide names than folder names', () => {
    expect(validateSlideName('x'.repeat(80))).toBe('x'.repeat(80));
    expect(validateSlideName('x'.repeat(81))).toBeNull();
  });

  it('rejects empty input', () => {
    expect(validateSlideName('')).toBeNull();
    expect(validateSlideName('   ')).toBeNull();
  });
});

describe('validateIcon', () => {
  it('accepts a valid emoji icon', () => {
    expect(validateIcon({ type: 'emoji', value: '🎉' })).toEqual({ type: 'emoji', value: '🎉' });
  });

  it('accepts a valid color icon', () => {
    expect(validateIcon({ type: 'color', value: '#abcdef' })).toEqual({
      type: 'color',
      value: '#abcdef',
    });
  });

  it('rejects malformed colors', () => {
    expect(validateIcon({ type: 'color', value: 'red' })).toBeNull();
    expect(validateIcon({ type: 'color', value: '#abc' })).toBeNull();
    expect(validateIcon({ type: 'color', value: '#GGGGGG' })).toBeNull();
  });

  it('rejects empty or overlong emoji values', () => {
    expect(validateIcon({ type: 'emoji', value: '' })).toBeNull();
    expect(validateIcon({ type: 'emoji', value: 'x'.repeat(9) })).toBeNull();
  });

  it('rejects unknown types and non-objects', () => {
    expect(validateIcon({ type: 'image', value: 'foo' })).toBeNull();
    expect(validateIcon(null)).toBeNull();
    expect(validateIcon('emoji')).toBeNull();
  });
});

describe('updateMetaTitleInSource', () => {
  it('replaces an existing single-quoted title literal', () => {
    const source = `export const meta: SlideMeta = { title: 'old' };\nexport default [];\n`;
    const out = updateMetaTitleInSource(source, 'new');
    expect(out).toContain("title: 'new'");
    expect(out).not.toContain("'old'");
  });

  it('replaces an existing double-quoted title literal', () => {
    const source = `export const meta = { title: "old" };\nexport default [];\n`;
    const out = updateMetaTitleInSource(source, 'new');
    expect(out).toContain("title: 'new'");
  });

  it('escapes single quotes inside the new title', () => {
    const source = `export const meta = { title: 'old' };\nexport default [];\n`;
    const out = updateMetaTitleInSource(source, "it's new");
    expect(out).toContain("title: 'it\\'s new'");
  });

  it('escapes backslashes inside the new title', () => {
    const source = `export const meta = { title: 'old' };\nexport default [];\n`;
    const out = updateMetaTitleInSource(source, 'a\\b');
    expect(out).toContain("title: 'a\\\\b'");
  });

  it('injects a title into a meta object that lacks one', () => {
    const source = `export const meta = {\n  notes: 'x',\n};\nexport default [];\n`;
    const out = updateMetaTitleInSource(source, 'first');
    expect(out).toMatch(/title:\s*'first'/);
    expect(out).toContain("notes: 'x'");
  });

  it('injects a fresh meta export when none exists', () => {
    const source = `export default [];\n`;
    const out = updateMetaTitleInSource(source, 'fresh');
    expect(out).toContain("export const meta: SlideMeta = { title: 'fresh' };");
    expect(out).toContain('export default []');
  });

  it('returns null if there is no meta and no default export', () => {
    expect(updateMetaTitleInSource('// nothing here', 'x')).toBeNull();
  });
});
