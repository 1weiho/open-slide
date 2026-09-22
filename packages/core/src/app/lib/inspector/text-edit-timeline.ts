import type { EditOp } from './use-editor';

export type TextEditOp = Extract<EditOp, { kind: 'set-text' | 'set-text-range-style' }>;
export type TextEditStep = { seq: number; op: TextEditOp };

export function appendTextEdit(steps: TextEditStep[], op: TextEditOp, seq: number): TextEditStep[] {
  const last = steps.at(-1);
  if (last?.seq === seq - 1 && last.op.kind === 'set-text' && op.kind === 'set-text') {
    return [...steps.slice(0, -1), { seq, op: { ...op, prevText: last.op.prevText } }];
  }
  return [...steps, { seq, op }];
}
