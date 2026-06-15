import { ChevronDown, ChevronUp, NotebookPen } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PANEL_TRANSITION_MS, usePanelMount } from '@/components/panel/panel-shell';
import { useNotes } from '@/lib/inspector/use-notes';
import { format, useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'open-slide:notes-drawer-open';
const DRAWER_CONTENT_H = 166;

type Props = {
  slideId: string;
  index: number;
  total: number;
  initial: string | undefined;
};

export function NotesDrawer({ slideId, index, total, initial }: Props) {
  const t = useLocale();
  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  });
  const { value, setValue, status, flush } = useNotes(slideId, index, initial);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { mounted, animVisible } = usePanelMount(open);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, open ? '1' : '0');
  }, [open]);

  const statusLabel = (() => {
    switch (status.kind) {
      case 'saving':
        return t.notesDrawer.statusSaving;
      case 'saved':
        return t.notesDrawer.statusSaved;
      case 'error':
        return format(t.notesDrawer.statusError, { msg: status.message });
      default:
        return '';
    }
  })();

  return (
    <aside
      data-notes-drawer
      className="hidden shrink-0 border-t border-hairline bg-sidebar/85 backdrop-blur md:block"
    >
      <button
        type="button"
        onClick={() => {
          setOpen((o) => {
            if (o) void flush();
            return !o;
          });
        }}
        className="flex h-9 w-full items-center gap-2 px-3 text-[12px] text-foreground/80 hover:bg-muted/40"
        aria-expanded={open}
      >
        <NotebookPen className="size-3.5 text-muted-foreground" />
        <span className="font-medium">{t.notesDrawer.toggle}</span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {format(t.notesDrawer.pageLabel, { n: index + 1, total })}
        </span>
        <span
          className={cn(
            'ml-auto truncate text-[11px]',
            status.kind === 'error' ? 'text-destructive' : 'text-muted-foreground',
          )}
          aria-live="polite"
        >
          {statusLabel}
        </span>
        {open ? (
          <ChevronDown className="size-3.5 text-muted-foreground" />
        ) : (
          <ChevronUp className="size-3.5 text-muted-foreground" />
        )}
      </button>
      {mounted && (
        <div
          className="overflow-hidden border-t border-hairline transition-[height] ease-out"
          style={{
            height: animVisible ? DRAWER_CONTENT_H : 0,
            transitionDuration: `${PANEL_TRANSITION_MS}ms`,
          }}
        >
          <div className="px-3 py-2">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={() => {
                void flush();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  // Escape during IME composition dismisses the candidate
                  // list; it must not blur the textarea.
                  if (e.nativeEvent.isComposing) return;
                  e.preventDefault();
                  textareaRef.current?.blur();
                } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  void flush();
                }
              }}
              placeholder={t.notesDrawer.placeholder}
              rows={6}
              spellCheck
              className="block h-[150px] w-full resize-none rounded-[6px] border border-border bg-card px-3 py-2 text-[13px] leading-relaxed text-card-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>
        </div>
      )}
    </aside>
  );
}
