import { MessageSquare, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useInspector } from './InspectorProvider';

export function CommentWidget() {
  const { comments, remove, error } = useInspector();
  const [open, setOpen] = useState(false);
  const count = comments.length;

  return (
    <div data-inspector-ui className="absolute right-4 bottom-4 z-20 flex flex-col items-end gap-2">
      {open && (
        <div className="w-80 overflow-hidden rounded-xl border border-border/80 bg-card/95 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_24px_48px_-12px_rgba(0,0,0,0.28)] backdrop-blur-md animate-in fade-in-0 slide-in-from-bottom-2 duration-200 supports-[backdrop-filter]:bg-card/85">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-xs font-semibold">
              {count} comment{count === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              <X className="size-3.5" />
            </button>
          </div>
          {error && <p className="px-3 py-2 text-xs text-red-600">{error}</p>}
          {count === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No comments yet. Toggle Inspect and click a slide element.
            </p>
          ) : (
            <>
              <ul className="max-h-72 overflow-auto">
                {comments.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-start gap-2 border-b px-3 py-2 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-mono text-muted-foreground">
                        line {c.line}
                      </div>
                      <div className="mt-0.5 text-xs break-words">{c.note}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(c.id)}
                      className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="border-t px-3 py-2 text-[11px] text-muted-foreground">
                Run{' '}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-foreground">
                  /apply-comments
                </code>{' '}
                in your agent to apply these.
              </div>
            </>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`${count} comment${count === 1 ? '' : 's'}`}
        className="group/comment relative flex h-9 items-center gap-1.5 rounded-full border border-border/80 bg-card/85 px-3 text-xs font-medium shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_-12px_rgba(0,0,0,0.25)] backdrop-blur-md transition-colors hover:bg-muted aria-expanded:bg-muted supports-[backdrop-filter]:bg-card/75"
      >
        <MessageSquare className="size-4 text-muted-foreground group-hover/comment:text-foreground" />
        <span className="tabular-nums">{count}</span>
        {count > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-amber-500 ring-2 ring-card"
            aria-hidden
          />
        )}
      </button>
    </div>
  );
}
