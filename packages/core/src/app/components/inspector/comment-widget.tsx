import { MessageSquare, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { usePanelMount } from '@/components/panel/panel-shell';
import { format, plural, useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import { useInspector } from './inspector-provider';

export function CommentWidget() {
  const t = useLocale();
  const { comments, remove, error } = useInspector();
  const [open, setOpen] = useState(false);
  const count = comments.length;
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const { mounted, animVisible } = usePanelMount(open);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // The panel stays mounted through its close fade; hand focus back to the
  // toggle so it doesn't sit on a control that's about to unmount.
  useEffect(() => {
    if (open) return;
    if (panelRef.current?.contains(document.activeElement)) fabRef.current?.focus();
  }, [open]);

  return (
    <div
      ref={ref}
      data-inspector-ui
      className="absolute right-4 bottom-4 z-20 flex flex-col items-end gap-2"
    >
      {mounted && (
        <div
          ref={panelRef}
          aria-hidden={!animVisible}
          className={cn(
            'w-80 origin-bottom-right rounded-[8px] border bg-card shadow-overlay',
            'motion-safe:transition-[opacity,translate,scale] motion-safe:duration-200 motion-safe:ease-swift',
            animVisible
              ? 'translate-y-0 scale-100 opacity-100'
              : 'pointer-events-none translate-y-1.5 scale-95 opacity-0',
          )}
        >
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-xs font-semibold">
              {format(plural(count, t.inspector.commentsCount), { count })}
            </span>
            <button
              type="button"
              aria-label={t.common.close}
              className="-m-1 rounded-[5px] p-1 text-muted-foreground transition-[color,scale] duration-150 hover:text-foreground active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              onClick={() => setOpen(false)}
            >
              <X className="size-3.5" />
            </button>
          </div>
          {error && <p className="px-3 py-2 text-xs text-destructive">{error}</p>}
          {count === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              {t.inspector.commentsEmpty}
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
                        {format(t.inspector.commentLineLabel, { n: c.line })}
                      </div>
                      <div className="mt-0.5 text-xs break-words">{c.note}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(c.id)}
                      className="shrink-0 rounded-[5px] p-1 text-muted-foreground transition-[color,background-color,scale] duration-150 hover:bg-muted hover:text-destructive active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                      aria-label={t.inspector.commentDeleteAria}
                      title={t.inspector.commentDeleteAria}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="border-t px-3 py-2 text-[11px] text-muted-foreground">
                {t.inspector.commentsApplyHintPrefix}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-foreground">
                  /apply-comments
                </code>
                {t.inspector.commentsApplyHintSuffix}
              </div>
            </>
          )}
        </div>
      )}
      <button
        ref={fabRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border bg-card px-3 py-2 text-xs font-medium shadow-floating transition-[background-color,scale] duration-150 hover:bg-muted active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        aria-expanded={open}
      >
        <MessageSquare className="size-4" />
        <span className="nums">{count}</span>
      </button>
    </div>
  );
}
