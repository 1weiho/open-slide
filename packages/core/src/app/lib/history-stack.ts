export type HistoryEntry = {
  undo: () => void;
  redo: () => void;
  coalesceKey?: string;
  page?: number;
  ts: number;
};

export type HistoryStackOptions = {
  currentPage?: () => number | undefined;
  navigate?: (page: number) => void;
  onChange?: () => void;
  now?: () => number;
  coalesceWindowMs?: number;
};

const DEFAULT_COALESCE_WINDOW_MS = 500;

export class HistoryStack {
  private past: HistoryEntry[] = [];
  private future: HistoryEntry[] = [];
  private applying = false;
  private readonly opts: HistoryStackOptions;

  constructor(opts: HistoryStackOptions = {}) {
    this.opts = opts;
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  get undoPage(): number | undefined {
    return this.past.at(-1)?.page;
  }

  get redoPage(): number | undefined {
    return this.future.at(-1)?.page;
  }

  record(entry: Omit<HistoryEntry, 'ts'>): void {
    if (this.applying) return;
    const ts = this.opts.now?.() ?? Date.now();
    const windowMs = this.opts.coalesceWindowMs ?? DEFAULT_COALESCE_WINDOW_MS;
    const top = this.past.at(-1);
    if (
      top &&
      entry.coalesceKey !== undefined &&
      top.coalesceKey === entry.coalesceKey &&
      top.page === entry.page &&
      ts - top.ts < windowMs
    ) {
      this.past[this.past.length - 1] = { ...top, redo: entry.redo, ts };
    } else {
      this.past.push({ ...entry, ts });
    }
    this.future = [];
    this.opts.onChange?.();
  }

  undo(): void {
    const top = this.past.pop();
    if (!top) return;
    this.apply(top, top.undo);
    this.future.push(top);
    this.opts.onChange?.();
  }

  redo(): void {
    const top = this.future.pop();
    if (!top) return;
    this.apply(top, top.redo);
    this.past.push(top);
    this.opts.onChange?.();
  }

  clear(): void {
    if (this.past.length === 0 && this.future.length === 0) return;
    this.past = [];
    this.future = [];
    this.opts.onChange?.();
  }

  private apply(entry: HistoryEntry, fn: () => void): void {
    if (entry.page !== undefined && entry.page !== this.opts.currentPage?.()) {
      this.opts.navigate?.(entry.page);
    }
    this.applying = true;
    try {
      fn();
    } finally {
      this.applying = false;
    }
  }
}
