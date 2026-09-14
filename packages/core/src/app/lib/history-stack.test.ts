import { describe, expect, it, vi } from 'vitest';
import { HistoryStack } from './history-stack';

function entry(log: string[], name: string, page?: number, coalesceKey?: string) {
  return {
    page,
    coalesceKey,
    undo: () => log.push(`undo:${name}`),
    redo: () => log.push(`redo:${name}`),
  };
}

describe('HistoryStack', () => {
  it('undoes and redoes in stack order', () => {
    const log: string[] = [];
    const stack = new HistoryStack();
    stack.record(entry(log, 'a'));
    stack.record(entry(log, 'b'));
    stack.undo();
    stack.undo();
    stack.redo();
    expect(log).toEqual(['undo:b', 'undo:a', 'redo:a']);
    expect(stack.canUndo).toBe(true);
    expect(stack.canRedo).toBe(true);
  });

  it('ignores records made while applying an entry', () => {
    const log: string[] = [];
    const stack = new HistoryStack();
    stack.record({
      undo: () => stack.record(entry(log, 'nested')),
      redo: () => {},
    });
    stack.undo();
    expect(stack.canUndo).toBe(false);
    expect(stack.canRedo).toBe(true);
  });

  it('coalesces rapid entries with the same key and page', () => {
    const log: string[] = [];
    let now = 0;
    const stack = new HistoryStack({ now: () => now, coalesceWindowMs: 100 });
    stack.record(entry(log, 'a1', 0, 'k'));
    now = 50;
    stack.record(entry(log, 'a2', 0, 'k'));
    now = 80;
    stack.record(entry(log, 'b', 1, 'k'));
    stack.undo();
    stack.undo();
    expect(log).toEqual(['undo:b', 'undo:a1']);
    stack.redo();
    stack.redo();
    expect(log).toEqual(['undo:b', 'undo:a1', 'redo:a2', 'redo:b']);
  });

  it('navigates to the entry page before applying when it differs', () => {
    const log: string[] = [];
    let page = 0;
    const navigate = vi.fn((p: number) => {
      page = p;
      log.push(`nav:${p}`);
    });
    const stack = new HistoryStack({ currentPage: () => page, navigate });
    stack.record(entry(log, 'a', 0));
    page = 2;
    stack.record(entry(log, 'b', 2));
    stack.record(entry(log, 'design'));
    stack.undo();
    stack.undo();
    stack.undo();
    expect(log).toEqual(['undo:design', 'undo:b', 'nav:0', 'undo:a']);
    expect(stack.redoPage).toBe(0);
    stack.redo();
    stack.redo();
    expect(log.slice(4)).toEqual(['redo:a', 'nav:2', 'redo:b']);
  });

  it('reports the page of the next undo and redo entries', () => {
    const log: string[] = [];
    const stack = new HistoryStack({ currentPage: () => 1 });
    stack.record(entry(log, 'a', 3));
    expect(stack.undoPage).toBe(3);
    expect(stack.redoPage).toBeUndefined();
    stack.undo();
    expect(stack.undoPage).toBeUndefined();
    expect(stack.redoPage).toBe(3);
  });

  it('notifies on every change and clears both stacks', () => {
    const onChange = vi.fn();
    const stack = new HistoryStack({ onChange });
    stack.record({ undo() {}, redo() {} });
    stack.undo();
    stack.clear();
    stack.clear();
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(stack.canUndo).toBe(false);
    expect(stack.canRedo).toBe(false);
  });
});
