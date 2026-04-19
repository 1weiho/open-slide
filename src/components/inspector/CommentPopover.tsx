import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useInspector } from './InspectorProvider';

const POPOVER_W = 320;
const POPOVER_H = 180;

export function CommentPopover() {
  const { pending, setPending, add } = useInspector();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    taRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPending(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setPending]);

  if (!pending) return null;

  const left = clamp(pending.clickX + 12, 8, window.innerWidth - POPOVER_W - 8);
  const top = clamp(pending.clickY + 12, 8, window.innerHeight - POPOVER_H - 8);

  const onSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await add(pending.line, pending.column, trimmed);
      setPending(null);
    } catch (e) {
      setError(String((e as Error).message ?? e));
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      data-inspector-ui
      className="fixed z-50 rounded-md border bg-card p-3 shadow-xl"
      style={{ left, top, width: POPOVER_W }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Line {pending.line} · Comment
        </span>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setPending(null)}
        >
          ✕
        </button>
      </div>
      <textarea
        ref={taRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Describe the change…"
        className="h-20 w-full resize-none rounded border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onSubmit();
          }
        }}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <div className="mt-2 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setPending(null)}
          className="rounded border px-2 py-1 text-xs hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={submitting || !text.trim()}
          onClick={onSubmit}
          className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Submit'}
        </button>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">⌘/Ctrl + Enter to submit</p>
    </div>,
    document.body,
  );
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
