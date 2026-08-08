import { describe, expect, it } from 'vitest';
import {
  type Folder,
  validateIcon,
  validateName,
  validateParentId,
  validateReorder,
} from './folders.ts';

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

describe('validateParentId', () => {
  const icon = { type: 'color', value: '#aabbcc' } as const;
  // Tree: a → b → c (chain), plus a sibling root d.
  const folders: Folder[] = [
    { id: 'f-0000000a', name: 'a', icon },
    { id: 'f-0000000b', name: 'b', icon, parentId: 'f-0000000a' },
    { id: 'f-0000000c', name: 'c', icon, parentId: 'f-0000000b' },
    { id: 'f-0000000d', name: 'd', icon },
  ];

  it('treats null / undefined as top level', () => {
    expect(validateParentId(null, folders, null)).toEqual({ ok: true, value: null });
    expect(validateParentId(undefined, folders, null)).toEqual({ ok: true, value: null });
  });

  it('accepts an existing folder as parent (create)', () => {
    expect(validateParentId('f-0000000a', folders, null)).toEqual({
      ok: true,
      value: 'f-0000000a',
    });
  });

  it('rejects malformed and non-string parentIds', () => {
    expect(validateParentId('nope', folders, null)).toEqual({
      ok: false,
      error: 'invalid parentId',
    });
    expect(validateParentId(42, folders, null)).toEqual({ ok: false, error: 'invalid parentId' });
  });

  it('rejects a non-existent parent folder', () => {
    expect(validateParentId('f-99999999', folders, null)).toEqual({
      ok: false,
      error: 'parent folder not found',
    });
  });

  it('rejects self-parenting on a move', () => {
    expect(validateParentId('f-0000000b', folders, 'f-0000000b')).toEqual({
      ok: false,
      error: 'folder cannot be its own parent',
    });
  });

  it('rejects a cycle (moving a folder under its own descendant)', () => {
    // Moving `a` under `c` would make a → c → b → a a cycle.
    expect(validateParentId('f-0000000c', folders, 'f-0000000a')).toEqual({
      ok: false,
      error: 'cycle detected',
    });
  });

  it('accepts a valid re-parent that does not create a cycle', () => {
    // Moving `d` under `c` is fine — `c` is not a descendant of `d`.
    expect(validateParentId('f-0000000c', folders, 'f-0000000d')).toEqual({
      ok: true,
      value: 'f-0000000c',
    });
  });
});
