import { parseSource } from './babel-walk.ts';
import {
  applySplices,
  type EditOp,
  findElementForEdit,
  planEdit,
  type Splice,
} from './edit-ops.ts';

export type BatchEdit = { line?: number; column?: number; ops?: EditOp[] };
export type BatchEditResult = { ok: boolean; error?: string };

type TrackedEdit = { offset: number | null; ops: EditOp[]; error?: string };

function rebaseOffset(offset: number, splices: Splice[], target: number): number | null {
  let shift = 0;
  for (const splice of splices) {
    if (offset < splice.from) break;
    if (offset >= splice.to) {
      shift += splice.text.length - (splice.to - splice.from);
    } else if (offset === splice.from && offset === target) {
      return offset + shift;
    } else {
      return null;
    }
  }
  return offset + shift;
}

export function applyEditBatch(
  source: string,
  edits: BatchEdit[],
): { source: string; results: BatchEditResult[] } {
  const ast = parseSource(source);
  const tracked: TrackedEdit[] = edits.map((edit) => {
    if (
      !edit ||
      !Number.isInteger(edit.line) ||
      (edit.line ?? 0) < 1 ||
      !Number.isInteger(edit.column ?? 0) ||
      (edit.column ?? 0) < 0 ||
      !Array.isArray(edit.ops)
    ) {
      return { offset: null, ops: [], error: 'invalid edit' };
    }
    if (!edit.ops.length) return { offset: null, ops: [] };
    if (!ast) return { offset: null, ops: edit.ops, error: 'could not parse source' };
    const element = findElementForEdit(ast, edit.line ?? 0, edit.column ?? 0, edit.ops);
    return {
      offset: element?.start ?? null,
      ops: edit.ops,
      ...(!element ? { error: 'no JSX element at location' } : {}),
    };
  });
  let next = source;
  const results: BatchEditResult[] = [];
  for (const edit of tracked) {
    if (edit.error) {
      results.push({ ok: false, error: edit.error });
      continue;
    }
    if (!edit.ops.length) {
      results.push({ ok: true });
      continue;
    }
    if (edit.offset === null) {
      results.push({ ok: false, error: 'target was removed by an earlier edit' });
      continue;
    }
    const before = next.slice(0, edit.offset);
    const line = before.split('\n').length;
    const column = edit.offset - before.lastIndexOf('\n') - 1;
    const plan = planEdit(next, line, column, edit.ops, true);
    if (!plan.ok) {
      results.push({ ok: false, error: plan.error });
      continue;
    }
    const result = plan.splices.length
      ? applySplices(next, plan.splices)
      : { ok: true as const, source: next };
    if (!result.ok) {
      results.push({ ok: false, error: result.error });
      continue;
    }
    const target = edit.offset;
    const splices = [...plan.splices].sort((a, b) => a.from - b.from || a.to - b.to);
    for (const pending of tracked) {
      if (pending.offset !== null) pending.offset = rebaseOffset(pending.offset, splices, target);
    }
    next = result.source;
    results.push({ ok: true });
  }
  return { source: next, results };
}
