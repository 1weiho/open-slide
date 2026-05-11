import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Fragment, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { format, useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import type { SlideModule } from '../../lib/sdk';
import { loadSlide, slidesByTheme } from '../../lib/slides';
import { loadThemeDemo, type ThemeDemoModule, themes } from '../../lib/themes';
import { SlideCanvas } from '../slide-canvas';

export function ThemeDetail({ themeId, onBack }: { themeId: string; onBack: () => void }) {
  const t = useLocale();
  const theme = useMemo(() => themes.find((th) => th.id === themeId), [themeId]);
  const [demo, setDemo] = useState<ThemeDemoModule | null>(null);
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    setPageIndex(0);
    setDemo(null);
    if (!theme?.hasDemo) return;
    let cancelled = false;
    loadThemeDemo(theme.id)
      .then((mod) => {
        if (!cancelled) setDemo(mod);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [theme]);

  const pages = demo?.default ?? [];
  const totalPages = pages.length;
  const usedBySlideIds = useMemo(() => (theme ? slidesByTheme(theme.id) : []), [theme]);

  const promptRef = useRef<HTMLPreElement>(null);
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [promptOverflows, setPromptOverflows] = useState(false);

  const themeBody = theme?.body;
  useEffect(() => {
    setPromptExpanded(false);
    const el = promptRef.current;
    if (!el || !themeBody) return;
    setPromptOverflows(el.scrollHeight > PROMPT_COLLAPSED_PX + 8);
  }, [themeBody]);

  useEffect(() => {
    if (totalPages <= 1) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setPageIndex((i) => Math.min(totalPages - 1, i + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setPageIndex((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [totalPages]);

  if (!theme) {
    return (
      <div className="px-8 py-12">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="size-4" />
          {t.themes.backToGallery}
        </Button>
      </div>
    );
  }

  const Current = pages[pageIndex];

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
          <ChevronLeft className="size-4" />
          {t.themes.backToGallery}
        </Button>
      </div>

      <header className="flex flex-wrap items-baseline gap-3">
        <h2 className="font-heading text-[26px] font-semibold leading-[1.05] tracking-[-0.025em] md:text-[32px]">
          {theme.name}
        </h2>
        {theme.description ? (
          <p className="basis-full text-[13px] leading-relaxed text-muted-foreground">
            {theme.description}
          </p>
        ) : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="relative aspect-video overflow-hidden rounded-[8px] border border-hairline bg-card shadow-edge ring-1 ring-foreground/[0.04]">
              {!theme.hasDemo ? (
                <NoDemoLargeState />
              ) : !demo ? (
                <div className="grid h-full w-full place-items-center text-[11px] tracking-[0.16em] uppercase text-muted-foreground/60">
                  {t.common.loading}
                </div>
              ) : Current ? (
                <SlideCanvas flat freezeMotion design={demo.design}>
                  <Current />
                </SlideCanvas>
              ) : null}
            </div>

            {totalPages > 1 ? (
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  aria-label={t.themes.prevPageAria}
                  disabled={pageIndex === 0}
                  onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                  className="flex size-8 items-center justify-center rounded-[6px] border border-border bg-card text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="folio">
                  {format(t.themes.pageOf, { n: pageIndex + 1, total: totalPages })}
                </span>
                <button
                  type="button"
                  aria-label={t.themes.nextPageAria}
                  disabled={pageIndex === totalPages - 1}
                  onClick={() => setPageIndex((i) => Math.min(totalPages - 1, i + 1))}
                  className="flex size-8 items-center justify-center rounded-[6px] border border-border bg-card text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            ) : null}
          </div>

          <div className="relative">
            <pre
              ref={promptRef}
              style={
                promptOverflows && !promptExpanded ? { maxHeight: PROMPT_COLLAPSED_PX } : undefined
              }
              className={cn(
                'w-full rounded-[8px] border border-hairline bg-card p-4 font-mono text-[11.5px] leading-relaxed text-foreground/90',
                promptOverflows && !promptExpanded ? 'overflow-hidden' : 'overflow-auto',
              )}
            >
              {renderBodyWithSwatches(theme.body)}
            </pre>
            {promptOverflows && !promptExpanded ? (
              <button
                type="button"
                aria-label={t.themes.expandPromptAria}
                onClick={() => setPromptExpanded(true)}
                className="absolute inset-x-0 bottom-0 flex h-24 items-end justify-center rounded-b-[8px] bg-gradient-to-t from-card via-card/85 to-transparent pb-3 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronDown className="size-4" />
              </button>
            ) : null}
            {promptOverflows && promptExpanded ? (
              <div className="mt-2 flex justify-center">
                <button
                  type="button"
                  aria-label={t.themes.collapsePromptAria}
                  onClick={() => setPromptExpanded(false)}
                  className="flex size-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ChevronDown className="size-4 rotate-180" />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="eyebrow">{t.themes.usedBy}</span>
            {usedBySlideIds.length > 0 ? (
              <span className="folio">{usedBySlideIds.length.toString().padStart(2, '0')}</span>
            ) : null}
          </div>
          {usedBySlideIds.length === 0 ? (
            <p className="text-[12.5px] leading-relaxed text-muted-foreground">
              {t.themes.usedByEmpty}
            </p>
          ) : (
            <ul className="flex flex-col gap-5">
              {usedBySlideIds.map((id) => (
                <li key={id}>
                  <ThemeSlideCard id={id} />
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}

function ThemeSlideCard({ id }: { id: string }) {
  const t = useLocale();
  const [slide, setSlide] = useState<SlideModule | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadSlide(id)
      .then((mod) => {
        if (!cancelled) setSlide(mod);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id]);

  const FirstPage = slide?.default[0];
  const displayTitle = slide?.meta?.title ?? id;

  return (
    <Link to={`/s/${id}`} className="group block focus-visible:outline-none">
      <div className="relative aspect-video overflow-hidden rounded-[6px] border border-hairline bg-card shadow-edge ring-1 ring-foreground/[0.04] group-hover:shadow-floating group-hover:ring-foreground/20 motion-safe:transition-[box-shadow,--tw-ring-color] motion-safe:duration-200">
        {FirstPage ? (
          <div className="h-full w-full motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]">
            <SlideCanvas flat freezeMotion design={slide?.design}>
              <FirstPage />
            </SlideCanvas>
          </div>
        ) : (
          <div className="grid h-full w-full place-items-center text-[10px] tracking-[0.16em] uppercase text-muted-foreground/60">
            {t.common.loading}
          </div>
        )}
      </div>
      <div className="mt-2.5">
        <h3 className="min-w-0 truncate font-heading text-[13px] font-medium tracking-tight">
          {displayTitle}
        </h3>
        <p className="mt-0.5 truncate font-mono text-[10.5px] text-muted-foreground/80">{id}</p>
      </div>
    </Link>
  );
}

const PROMPT_COLLAPSED_PX = 320;

const HEX_RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/g;

function renderBodyWithSwatches(body: string): ReactNode[] {
  const out: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null = HEX_RE.exec(body);
  let key = 0;
  while (match !== null) {
    if (match.index > lastIndex) {
      out.push(<Fragment key={`t${key}`}>{body.slice(lastIndex, match.index)}</Fragment>);
    }
    const hex = match[0];
    out.push(
      <span
        key={`s${key}`}
        aria-hidden
        className="mr-[0.25em] -translate-y-[0.1em] inline-block size-[0.85em] rounded-[2px] align-middle ring-1 ring-foreground/15"
        style={{ background: hex }}
      />,
    );
    out.push(<Fragment key={`h${key}`}>{hex}</Fragment>);
    lastIndex = match.index + hex.length;
    key += 1;
    match = HEX_RE.exec(body);
  }
  if (lastIndex < body.length) {
    out.push(<Fragment key={`t${key}`}>{body.slice(lastIndex)}</Fragment>);
  }
  return out;
}

function NoDemoLargeState() {
  const t = useLocale();
  return (
    <div className="grid h-full w-full place-items-center bg-muted/40 px-8 text-center">
      <div className="max-w-sm">
        <p className="font-heading text-[15px] font-semibold tracking-tight">
          {t.themes.noDemoYet}
        </p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
          {t.themes.noDemoHintPrefix}
          <code className="rounded-[4px] bg-card px-1.5 py-0.5 font-mono text-[11.5px] text-foreground">
            /create-theme
          </code>
          {t.themes.noDemoHintSuffix}
        </p>
      </div>
    </div>
  );
}
