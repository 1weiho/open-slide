import { Plus, X } from 'lucide-react';
import { useId, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Normalise a free-typed tag to match the server's `sanitizeTag`: trim,
 * lowercase, collapse whitespace to dashes, strip anything outside
 * letters/numbers/._-, and cap at 64 chars — so a created chip never changes or
 * vanishes after the server round-trip.
 */
export function normalizeTag(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}._-]/gu, '')
    .slice(0, 64);
}

/**
 * Token-input combobox for tags: selected tags render as chips inside the box,
 * the user types to filter `suggestions`, and clicks / Enter to select. With
 * `allowCreate`, a typed value that matches no suggestion can be created.
 *
 * The suggestions list is a plain positioned element (not a Popover) so focus
 * stays in the text input while navigating with the keyboard.
 *
 * Presentational and locale-agnostic — call sites pass localized `placeholder`,
 * `ariaLabel` and `createLabel`.
 */
export function TagCombobox({
  value,
  onChange,
  suggestions,
  allowCreate = false,
  placeholder,
  ariaLabel,
  createLabel,
  className,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions: string[];
  allowCreate?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  createLabel?: (raw: string) => string;
  className?: string;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listId = useId();

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      suggestions
        .filter((s) => !value.includes(s))
        .filter((s) => (q ? s.toLowerCase().includes(q) : true)),
    [suggestions, value, q],
  );
  const normalized = normalizeTag(query);
  const showCreate =
    allowCreate &&
    normalized.length > 0 &&
    !value.includes(normalized) &&
    !suggestions.some((s) => s.toLowerCase() === normalized);
  const optionCount = filtered.length + (showCreate ? 1 : 0);

  const add = (tag: string) => {
    if (!tag || value.includes(tag)) return;
    onChange([...value, tag]);
    setQuery('');
    setActiveIndex(0);
  };
  const removeTag = (tag: string) => onChange(value.filter((t) => t !== tag));
  const commitActive = () => {
    if (activeIndex < filtered.length) add(filtered[activeIndex]);
    else if (showCreate) add(normalized);
  };

  return (
    <div className={cn('relative', className)}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: clicking empty box area focuses the input */}
      <div
        className="flex min-h-8 w-full flex-wrap items-center gap-1 rounded-[6px] border border-border bg-background px-1.5 py-1 focus-within:border-foreground/40 focus-within:ring-2 focus-within:ring-ring/30"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            inputRef.current?.focus();
          }
        }}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-[4px] border border-border bg-muted/60 py-0.5 pl-1.5 pr-1 text-[11.5px] text-foreground"
          >
            {tag}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => removeTag(tag)}
              className="flex size-3.5 items-center justify-center rounded text-muted-foreground hover:text-foreground"
              aria-label={tag}
            >
              <X className="size-3" aria-hidden />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={ariaLabel}
          value={query}
          placeholder={value.length === 0 ? placeholder : undefined}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setOpen(true);
              setActiveIndex((i) => Math.min(i + 1, Math.max(0, optionCount - 1)));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActiveIndex((i) => Math.max(0, i - 1));
            } else if (e.key === 'Enter') {
              if (open && optionCount > 0) {
                e.preventDefault();
                commitActive();
              }
            } else if (e.key === 'Escape') {
              setOpen(false);
            } else if (e.key === 'Backspace' && query === '' && value.length > 0) {
              removeTag(value[value.length - 1]);
            }
          }}
          className="h-6 min-w-[90px] flex-1 bg-transparent px-1 text-[12.5px] outline-none placeholder:text-muted-foreground/70"
        />
      </div>
      {open && optionCount > 0 && (
        <ul
          id={listId}
          className="absolute z-50 mt-1 max-h-[260px] w-full min-w-[180px] overflow-y-auto rounded-[6px] border border-border bg-popover p-1 shadow-floating"
        >
          {filtered.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => add(s)}
                className={cn(
                  'flex w-full items-center rounded-[4px] px-2 py-1.5 text-left text-[12.5px]',
                  activeIndex === i ? 'bg-muted text-foreground' : 'hover:bg-muted/60',
                )}
              >
                <span className="truncate">{s}</span>
              </button>
            </li>
          ))}
          {showCreate && (
            <li>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActiveIndex(filtered.length)}
                onClick={() => add(normalized)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-[4px] px-2 py-1.5 text-left text-[12.5px]',
                  activeIndex === filtered.length
                    ? 'bg-muted text-foreground'
                    : 'hover:bg-muted/60',
                )}
              >
                <Plus className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                <span className="truncate">
                  {createLabel ? createLabel(normalized) : normalized}
                </span>
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
