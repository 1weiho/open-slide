import { describe, expect, it } from 'vitest';
import { applyEdit } from '../../../editing/edit-ops.ts';
import {
  clearLayoutOps,
  GESTURE_STYLE_KEYS,
  LAYER_INSET_KEYS,
  SIZE_BOUNDS_STYLES,
  SIZE_CONSTRAINT_STYLES,
} from './visual-dom.ts';

const cleared = (inline: Record<string, string>, scope: 'transform' | 'all') =>
  clearLayoutOps(inline, scope).flatMap((op) =>
    op.kind === 'set-style' ? [[op.key, op.value] as const] : [],
  );

describe('GESTURE_STYLE_KEYS', () => {
  it('lists every key the visual editor writes, once', () => {
    expect(new Set(GESTURE_STYLE_KEYS).size).toBe(GESTURE_STYLE_KEYS.length);
    expect(GESTURE_STYLE_KEYS).toEqual(
      expect.arrayContaining([
        'translate',
        'rotate',
        'width',
        'height',
        ...Object.keys(SIZE_CONSTRAINT_STYLES),
        'position',
        ...LAYER_INSET_KEYS,
        'zIndex',
      ]),
    );
  });
});

describe('clearLayoutOps', () => {
  const resized = {
    ...SIZE_CONSTRAINT_STYLES,
    width: '320px',
    height: '180px',
  };
  const layered = {
    position: 'relative',
    ...Object.fromEntries(LAYER_INSET_KEYS.map((key) => [key, 'auto'])),
    zIndex: '2',
  };
  const dragged = {
    translate: '40px 12px',
    rotate: '15deg',
    ...resized,
    ...layered,
    color: 'red',
  };

  it('clears only translate and rotate by default', () => {
    expect(cleared(dragged, 'transform')).toEqual([
      ['translate', null],
      ['rotate', null],
    ]);
  });

  it('clears every gesture key the editor wrote and leaves unrelated keys alone', () => {
    const keys = cleared(dragged, 'all').map(([key]) => key);
    expect(keys).toEqual(GESTURE_STYLE_KEYS);
    expect(keys).not.toContain('color');
  });

  it('keeps an authored size unless the resize bounds are all present', () => {
    expect(
      cleared({ width: '240px', height: '160px', flexShrink: '0', minWidth: '0px' }, 'all'),
    ).toEqual([]);
    expect(cleared({ ...resized, maxWidth: '600px' }, 'all')).toEqual([]);
  });

  it('clears a size written by layer compensation and only the flex keys it wrote', () => {
    expect(
      cleared({ ...SIZE_BOUNDS_STYLES, width: '80px', height: '40px', flexGrow: '1' }, 'all').map(
        ([key]) => key,
      ),
    ).toEqual(['width', 'height', ...Object.keys(SIZE_BOUNDS_STYLES)]);
  });

  it('keeps an authored position and insets unless they match what layering writes', () => {
    expect(
      cleared({ position: 'absolute', top: '120px', left: 'auto', zIndex: '4' }, 'all'),
    ).toEqual([['zIndex', null]]);
    expect(cleared({ position: 'relative' }, 'all')).toEqual([]);
    expect(
      cleared(
        { position: 'relative', top: 'auto', right: 'auto', bottom: 'auto', left: 'auto' },
        'all',
      ),
    ).toEqual([
      ['position', null],
      ['top', null],
      ['right', null],
      ['bottom', null],
      ['left', null],
    ]);
  });

  it('returns nothing when no gesture key is present', () => {
    expect(clearLayoutOps({ color: 'red', translate: '', rotate: '  ' }, 'transform')).toEqual([]);
    expect(clearLayoutOps({}, 'all')).toEqual([]);
  });
});

describe('clearLayoutOps applied to source', () => {
  const src = [
    'export default [() => (',
    "<div className=\"card\" style={{ color: 'red', translate: '40px 12px', rotate: '15deg', width: '320px', zIndex: '2' }} data-x=\"1\">",
    '  <p>Keep me</p>',
    '</div>',
    ')];',
    '',
  ].join('\n');
  const inline = { translate: '40px 12px', rotate: '15deg', width: '320px', zIndex: '2' };

  it('removes translate and rotate and leaves the other lines byte-identical', () => {
    const r = applyEdit(src, 2, 0, clearLayoutOps(inline, 'transform'));
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    const lines = src.split('\n');
    lines[1] = `<div className="card" data-x="1" style={{ color: 'red', width: '320px', zIndex: '2' }}>`;
    expect(r.source).toBe(lines.join('\n'));
  });

  it('drops the style attribute once every key is a gesture key', () => {
    const only = src.replace("color: 'red', ", '').replace("width: '320px', ", '');
    const r = applyEdit(only, 2, 0, clearLayoutOps(inline, 'all'));
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain('<div className="card" data-x="1">');
    expect(r.source).toContain('  <p>Keep me</p>');
  });

  it('keeps an authored width on a full clear', () => {
    const r = applyEdit(src, 2, 0, clearLayoutOps(inline, 'all'));
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain(`style={{ color: 'red', width: '320px' }}`);
  });

  it('shadows gesture keys that come from a spread instead of guessing at the spread', () => {
    const spread = src.replace("color: 'red', ", '...base, ');
    const r = applyEdit(spread, 2, 0, clearLayoutOps({ translate: '40px 12px' }, 'transform'));
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain('...base');
    expect(r.source).toContain('translate: undefined');
  });
});
