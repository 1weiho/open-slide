import { describe, expect, it } from 'vitest';
import { type Folder, validateIcon, validateName, validateReorder } from './folders.ts';

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

describe('validateReorder', () => {
  const folders: Folder[] = [
    { id: 'f-00000001', name: 'a', icon: { type: 'color', value: '#aabbcc' } },
    { id: 'f-00000002', name: 'b', icon: { type: 'color', value: '#aabbcc' } },
    { id: 'f-00000003', name: 'c', icon: { type: 'color', value: '#aabbcc' } },
  ];

  it('accepts a permutation of the current ids', () => {
    expect(validateReorder(['f-00000003', 'f-00000001', 'f-00000002'], folders)).toEqual([
      'f-00000003',
      'f-00000001',
      'f-00000002',
    ]);
  });

  it('rejects non-arrays and wrong-length arrays', () => {
    expect(validateReorder(null, folders)).toBeNull();
    expect(validateReorder(['f-00000001'], folders)).toBeNull();
  });

  it('rejects duplicate ids, unknown ids, and malformed ids', () => {
    expect(validateReorder(['f-00000001', 'f-00000001', 'f-00000002'], folders)).toBeNull();
    expect(validateReorder(['f-00000001', 'f-00000002', 'f-99999999'], folders)).toBeNull();
    expect(validateReorder(['f-00000001', 'f-00000002', 'nope'], folders)).toBeNull();
  });
});
