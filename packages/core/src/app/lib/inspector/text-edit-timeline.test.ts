import { describe, expect, it } from 'vitest';
import { applyEditBatch } from '../../../editing/batch-edit';
import { appendTextEdit, type TextEditStep } from './text-edit-timeline';

const source = 'export const Slide = () => <p>Editable body copy</p>;';
const original = 'Editable body copy';
const location = { line: 1, column: source.indexOf('<p>') };

function save(steps: TextEditStep[]) {
  return applyEditBatch(
    source,
    steps.map(({ op }) => ({ ...location, ops: [op] })),
  );
}

describe('text edit timeline', () => {
  it('coalesces consecutive typing while retaining the source baseline', () => {
    let steps = appendTextEdit([], { kind: 'set-text', value: 'First', prevText: original }, 1);
    steps = appendTextEdit(steps, { kind: 'set-text', value: 'Final', prevText: 'First' }, 2);
    expect(steps).toEqual([
      { seq: 2, op: { kind: 'set-text', value: 'Final', prevText: original } },
    ]);
    expect(save(steps).source).toContain('<p>Final</p>');
  });

  it('keeps the intermediate text required by a range format before later typing', () => {
    const updated = `${original} updated`;
    let steps = appendTextEdit([], { kind: 'set-text', value: updated, prevText: original }, 1);
    steps = appendTextEdit(
      steps,
      {
        kind: 'set-text-range-style',
        start: 0,
        end: 8,
        key: 'fontWeight',
        value: '700',
        prevText: updated,
      },
      2,
    );
    steps = appendTextEdit(
      steps,
      { kind: 'set-text', value: `${updated} again`, prevText: updated },
      3,
    );
    const result = save(steps);
    expect(result.results).toEqual([{ ok: true }, { ok: true }, { ok: true }]);
    expect(result.source).toContain('fontWeight');
    expect(result.source).toContain('updated again');
  });

  it('keeps typing checkpoints across whole-text style operations', () => {
    const first = appendTextEdit([], { kind: 'set-text', value: 'First', prevText: original }, 1);
    const final = appendTextEdit(first, { kind: 'set-text', value: 'Final', prevText: 'First' }, 3);
    expect(final).toHaveLength(2);
    const result = applyEditBatch(source, [
      { ...location, ops: [final[0].op] },
      {
        ...location,
        ops: [{ kind: 'set-style', key: 'fontSize', value: '28px', prevText: 'First' }],
      },
      { ...location, ops: [final[1].op] },
    ]);
    expect(result.results.every((item) => item.ok)).toBe(true);
    expect(result.source).toContain('Final');
    expect(result.source).toContain('28px');
  });

  it('preserves earlier snapshots when typing is coalesced and then resumed after undo', () => {
    const before = appendTextEdit([], { kind: 'set-text', value: 'First', prevText: original }, 1);
    const after = appendTextEdit(
      before,
      { kind: 'set-text', value: 'Second', prevText: 'First' },
      2,
    );
    expect(before[0].op).toEqual({ kind: 'set-text', value: 'First', prevText: original });
    expect(after[0].op).toEqual({ kind: 'set-text', value: 'Second', prevText: original });
    const resumed = appendTextEdit(
      before,
      { kind: 'set-text', value: 'Third', prevText: 'First' },
      3,
    );
    expect(save(resumed).results.every((item) => item.ok)).toBe(true);
    expect(save(resumed).source).toContain('<p>Third</p>');
  });

  it('formats current text coordinates after inserting a prefix without dropping prior styles', () => {
    let steps = appendTextEdit(
      [],
      {
        kind: 'set-text-range-style',
        start: 0,
        end: 8,
        key: 'fontWeight',
        value: '700',
        prevText: original,
      },
      1,
    );
    const prefixed = `New ${original}`;
    steps = appendTextEdit(steps, { kind: 'set-text', value: prefixed, prevText: original }, 2);
    steps = appendTextEdit(
      steps,
      {
        kind: 'set-text-range-style',
        start: 13,
        end: 17,
        key: 'fontStyle',
        value: 'italic',
        prevText: prefixed,
      },
      3,
    );
    const result = save(steps);
    expect(result.results).toEqual([{ ok: true }, { ok: true }, { ok: true }]);
    expect(result.source).toContain('New Editable');
    expect(result.source).toContain('fontWeight');
    expect(result.source).toContain('fontStyle');
    expect(result.source).toContain('italic');
  });
});
