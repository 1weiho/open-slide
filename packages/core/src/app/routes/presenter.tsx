import { ChevronLeft, ChevronRight, RotateCcw, Square, Sun } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { format, useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';
import {
  type PresenterState,
  usePresenterChannel,
} from '../components/present/use-presenter-channel';
import { SlideCanvas } from '../components/slide-canvas';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../lib/sdk';
import { useSlideModule } from '../lib/use-slide-module';

export function Presenter() {
  const { slideId = '' } = useParams();
  const { slide, error } = useSlideModule(slideId);

  // Presenter view is a passive mirror of the projection window. It only
  // tracks the index it last heard about; navigation buttons send commands
  // back to the projection so both windows stay in lock-step.
  const [state, setState] = useState<PresenterState | null>(null);
  // Local timer fallback — counts up from when the presenter window opened
  // until the projection window publishes its actual `startedAt`.
  const [localStart] = useState(() => Date.now());
  const [hasProjection, setHasProjection] = useState(false);
  const requestedRef = useRef(false);
  const t = useLocale();

  const channel = usePresenterChannel(slideId, (msg) => {
    if (msg.type === 'state') {
      setState(msg.state);
      setHasProjection(true);
    }
  });

  // Hydrate from the projection window once.
  useEffect(() => {
    if (!channel.available || requestedRef.current) return;
    requestedRef.current = true;
    channel.send({ type: 'request-state' });
    // If nothing answers within a beat, surface the "no projection" hint.
    const t = setTimeout(() => setHasProjection((v) => v), 600);
    return () => clearTimeout(t);
  }, [channel]);

  const send = channel.send;
  const goPrev = useCallback(() => send({ type: 'prev' }), [send]);
  const goNext = useCallback(() => send({ type: 'next' }), [send]);
  const goTo = useCallback((i: number) => send({ type: 'goto', index: i }), [send]);
  const toggleBlack = useCallback(() => send({ type: 'toggle-blackout', mode: 'black' }), [send]);
  const toggleWhite = useCallback(() => send({ type: 'toggle-blackout', mode: 'white' }), [send]);

  // Local-window key bindings mirror the projection's main shortcuts so the
  // presenter can drive without the mouse.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.matches('input, textarea')) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (
        e.key === 'ArrowRight' ||
        e.key === 'ArrowDown' ||
        e.key === ' ' ||
        e.key === 'PageDown'
      ) {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        toggleBlack();
      } else if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        toggleWhite();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, toggleBlack, toggleWhite]);

  if (error) {
    return (
      <div className="dark grid h-dvh place-items-center bg-background p-8 text-foreground">
        <div className="max-w-md text-center">
          <span className="eyebrow text-destructive/80">{t.common.loadFailed}</span>
          <h2 className="mt-2 font-heading text-xl font-semibold">{t.common.failedToLoadSlide}</h2>
          <pre className="mt-4 overflow-auto rounded-[6px] border border-border bg-card p-4 text-left text-[11.5px] whitespace-pre-wrap shadow-edge">
            {error}
          </pre>
        </div>
      </div>
    );
  }

  if (!slide) {
    return (
      <div className="dark grid h-dvh place-items-center bg-background text-muted-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-px w-56 overflow-hidden bg-border">
            <span
              aria-hidden
              className="line-loader-bar absolute inset-y-[-0.5px] left-0 w-1/4 bg-foreground"
            />
          </div>
          <div className="text-[11.5px]">{format(t.presenter.loadingSlide, { slideId })}</div>
        </div>
      </div>
    );
  }

  const pages = slide.default;
  const total = pages.length;
  const index = Math.max(0, Math.min(total - 1, state?.index ?? 0));
  const nextIndex = Math.min(total - 1, index + 1);
  const hasNext = index < total - 1;
  const note = slide.notes?.[index];
  const blackout = state?.blackout ?? null;
  const startedAt = state?.startedAt ?? localStart;

  const CurrentPage = pages[index];
  const NextPage = hasNext ? pages[nextIndex] : null;

  return (
    <div className="dark flex h-dvh w-screen flex-col overflow-hidden bg-background text-foreground">
      <PresenterTopBar
        index={index}
        total={total}
        startedAt={startedAt}
        slideTitle={slide.meta?.title ?? slideId}
        connected={hasProjection}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 px-6 pb-4 lg:grid-cols-[2fr_1fr]">
        {/* Now-showing */}
        <section className="flex min-h-0 flex-col gap-3">
          <SectionLabel>{t.presenter.nowShowing}</SectionLabel>
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-[8px] bg-black ring-1 ring-border">
            <SlideCanvas flat design={slide.design}>
              <CurrentPage />
            </SlideCanvas>
            {blackout && (
              <div
                aria-hidden
                className={cn(
                  'pointer-events-none absolute inset-0 grid place-items-center text-[11px] tracking-[0.16em] uppercase',
                  blackout === 'black' ? 'bg-black text-white/35' : 'bg-white text-black/35',
                )}
              >
                {blackout === 'black' ? t.presenter.blackScreen : t.presenter.whiteScreen}
              </div>
            )}
          </div>
        </section>

        {/* Next + notes */}
        <aside className="flex min-h-0 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <SectionLabel>{hasNext ? t.presenter.upNext : t.presenter.lastSlide}</SectionLabel>
            <div
              className="relative w-full overflow-hidden rounded-[8px] bg-black ring-1 ring-border"
              style={{ aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
            >
              {NextPage ? (
                <SlideCanvas flat freezeMotion design={slide.design}>
                  <NextPage />
                </SlideCanvas>
              ) : (
                <div className="grid h-full place-items-center text-[11.5px] text-muted-foreground">
                  {t.presenter.endOfDeck}
                </div>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <SectionLabel>{t.presenter.speakerNotes}</SectionLabel>
            <div className="min-h-0 flex-1 overflow-y-auto rounded-[6px] border border-border bg-card p-3 text-[13.5px] leading-relaxed whitespace-pre-wrap text-card-foreground">
              {note?.trim() ? (
                note
              ) : (
                <span className="text-muted-foreground">
                  {t.presenter.noNotesPrefix}
                  <code className="rounded-[3px] bg-muted px-1 py-0.5 font-mono text-[12px]">
                    export const notes = […]
                  </code>
                  {t.presenter.noNotesSuffix}
                </span>
              )}
            </div>
          </div>

          <PresenterJumpControl total={total} current={index} onJump={goTo} />
        </aside>
      </div>

      <PresenterBottomBar
        index={index}
        total={total}
        blackout={blackout}
        onPrev={goPrev}
        onNext={goNext}
        onBlackout={toggleBlack}
        onWhiteout={toggleWhite}
      />
    </div>
  );
}

function PresenterTopBar({
  index,
  total,
  startedAt,
  slideTitle,
  connected,
}: {
  index: number;
  total: number;
  startedAt: number;
  slideTitle: string;
  connected: boolean;
}) {
  const t = useLocale();
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-hairline px-6">
      <div className="flex items-baseline gap-3">
        <span className="eyebrow text-white/45">{t.presenter.eyebrow}</span>
        <span className="truncate font-heading text-[14px] font-semibold tracking-tight">
          {slideTitle}
        </span>
        {!connected && (
          <span className="rounded-[3px] border border-amber-300/30 bg-amber-300/10 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.06em] uppercase text-amber-200/85">
            {t.presenter.notLinked}
          </span>
        )}
      </div>
      <div className="flex items-center gap-6">
        <Clock />
        <ElapsedClock startedAt={startedAt} />
        <div className="font-mono text-[18px] tabular-nums">
          <span className="text-foreground">{(index + 1).toString().padStart(2, '0')}</span>
          <span className="text-foreground/30"> / </span>
          <span className="text-muted-foreground">{total.toString().padStart(2, '0')}</span>
        </div>
      </div>
    </header>
  );
}

function PresenterBottomBar({
  index,
  total,
  blackout,
  onPrev,
  onNext,
  onBlackout,
  onWhiteout,
}: {
  index: number;
  total: number;
  blackout: 'black' | 'white' | null;
  onPrev: () => void;
  onNext: () => void;
  onBlackout: () => void;
  onWhiteout: () => void;
}) {
  const t = useLocale();
  return (
    <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-hairline px-6 py-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onPrev} disabled={index === 0}>
          <ChevronLeft className="size-4" /> {t.presenter.prev}
        </Button>
        <Button variant="outline" onClick={onNext} disabled={index >= total - 1}>
          {t.presenter.next} <ChevronRight className="size-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={blackout === 'black' ? 'brand' : 'outline'}
          onClick={onBlackout}
          aria-pressed={blackout === 'black'}
        >
          <Square className="size-4 fill-current" /> {t.presenter.black}
        </Button>
        <Button
          variant={blackout === 'white' ? 'brand' : 'outline'}
          onClick={onWhiteout}
          aria-pressed={blackout === 'white'}
        >
          <Sun className="size-4" /> {t.presenter.white}
        </Button>
        <Button
          variant="ghost"
          onClick={() => window.location.reload()}
          title={t.presenter.resetTimer}
        >
          <RotateCcw className="size-4" /> {t.presenter.reset}
        </Button>
      </div>
    </footer>
  );
}

function PresenterJumpControl({
  total,
  current,
  onJump,
}: {
  total: number;
  current: number;
  onJump: (index: number) => void;
}) {
  const [value, setValue] = useState('');
  const t = useLocale();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number.parseInt(value, 10);
        if (Number.isFinite(n) && n >= 1 && n <= total) {
          onJump(n - 1);
          setValue('');
        }
      }}
      className="flex items-center gap-2"
    >
      <SectionLabel>{t.presenter.jump}</SectionLabel>
      <input
        type="number"
        min={1}
        max={total}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={(current + 1).toString()}
        className="h-8 w-20 rounded-[5px] border border-border bg-card px-2 font-mono text-[12px] tabular-nums outline-none focus-visible:border-foreground/30"
      />
      <span className="font-mono text-[11px] text-muted-foreground">/ {total}</span>
    </form>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}

function Clock() {
  const [now, setNow] = useState(() => new Date());
  const t = useLocale();
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <time
      title={t.presenter.currentTime}
      className="font-mono text-[12px] tabular-nums text-muted-foreground"
    >
      {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </time>
  );
}

function ElapsedClock({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  const t = useLocale();
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000));
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const text =
    h > 0
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return (
    <time
      title={t.presenter.elapsed}
      className="font-mono text-[18px] tabular-nums text-foreground"
    >
      {text}
    </time>
  );
}
