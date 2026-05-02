import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
  Square,
  Sun,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  type PresenterState,
  usePresenterChannel,
} from '../components/present/use-presenter-channel';
import { SlideCanvas } from '../components/slide-canvas';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../lib/sdk';
import type { SlideModule } from '../lib/sdk';
import { loadSlide } from '../lib/slides';

export function Presenter() {
  const { slideId = '' } = useParams();
  const [slide, setSlide] = useState<SlideModule | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Presenter view is a passive mirror of the projection window. It only
  // tracks the index it last heard about; navigation buttons send commands
  // back to the projection so both windows stay in lock-step.
  const [state, setState] = useState<PresenterState | null>(null);
  // Local timer fallback — counts up from when the presenter window opened
  // until the projection window publishes its actual `startedAt`.
  const [localStart] = useState(() => Date.now());
  const [hasProjection, setHasProjection] = useState(false);
  const requestedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setSlide(null);
    setError(null);
    loadSlide(slideId)
      .then((mod) => {
        if (!cancelled) setSlide(mod);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e?.message ?? e));
      });
    return () => {
      cancelled = true;
    };
  }, [slideId]);

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
  const toggleBlack = useCallback(
    () => send({ type: 'toggle-blackout', mode: 'black' }),
    [send],
  );
  const toggleWhite = useCallback(
    () => send({ type: 'toggle-blackout', mode: 'white' }),
    [send],
  );

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
      <div className="grid h-dvh place-items-center bg-zinc-950 p-8 text-zinc-300">
        <div className="max-w-md text-center">
          <span className="eyebrow text-red-300/80">Load failed</span>
          <h2 className="mt-2 font-heading text-xl font-semibold">Failed to load slide</h2>
          <pre className="mt-4 overflow-auto rounded-[6px] border border-white/10 bg-black/40 p-4 text-left text-[11.5px] whitespace-pre-wrap">
            {error}
          </pre>
        </div>
      </div>
    );
  }

  if (!slide) {
    return (
      <div className="grid h-dvh place-items-center bg-zinc-950 text-zinc-400">
        <div className="flex items-center gap-2 text-[12.5px]">
          <Loader2 className="size-4 animate-spin" /> Loading {slideId}…
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
    <div className="flex h-dvh w-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100">
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
          <SectionLabel>Now showing</SectionLabel>
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-[8px] bg-black ring-1 ring-white/10">
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
                {blackout === 'black' ? 'Black screen' : 'White screen'}
              </div>
            )}
          </div>
        </section>

        {/* Next + notes */}
        <aside className="flex min-h-0 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <SectionLabel>{hasNext ? 'Up next' : 'Last slide'}</SectionLabel>
            <div
              className="relative w-full overflow-hidden rounded-[6px] bg-black ring-1 ring-white/10"
              style={{ aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
            >
              {NextPage ? (
                <SlideCanvas flat freezeMotion design={slide.design}>
                  <NextPage />
                </SlideCanvas>
              ) : (
                <div className="grid h-full place-items-center text-[11.5px] text-white/40">
                  End of deck
                </div>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <SectionLabel>Speaker notes</SectionLabel>
            <div className="min-h-0 flex-1 overflow-y-auto rounded-[6px] border border-white/10 bg-black/40 p-3 text-[13.5px] leading-relaxed whitespace-pre-wrap text-white/85">
              {note?.trim() ? (
                note
              ) : (
                <span className="text-white/40">
                  No speaker notes for this slide. Add{' '}
                  <code className="rounded-[3px] bg-white/10 px-1 py-0.5 font-mono text-[12px]">
                    export const notes = […]
                  </code>{' '}
                  to your slide module to see notes here.
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
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-3">
      <div className="flex items-baseline gap-3">
        <span className="eyebrow text-white/45">Presenter</span>
        <span className="truncate font-heading text-[14px] font-semibold tracking-tight">
          {slideTitle}
        </span>
        {!connected && (
          <span className="rounded-[3px] border border-amber-300/30 bg-amber-300/10 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.06em] uppercase text-amber-200/85">
            Not linked
          </span>
        )}
      </div>
      <div className="flex items-center gap-6">
        <Clock />
        <ElapsedClock startedAt={startedAt} />
        <div className="font-mono text-[18px] tabular-nums">
          <span className="text-white">{(index + 1).toString().padStart(2, '0')}</span>
          <span className="text-white/35"> / </span>
          <span className="text-white/55">{total.toString().padStart(2, '0')}</span>
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
  return (
    <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 px-6 py-3">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onPrev} disabled={index === 0}>
          <ChevronLeft className="size-4" /> Prev
        </Button>
        <Button variant="outline" onClick={onNext} disabled={index >= total - 1}>
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={blackout === 'black' ? 'brand' : 'outline'}
          onClick={onBlackout}
          aria-pressed={blackout === 'black'}
        >
          <Square className="size-4 fill-current" /> Black
        </Button>
        <Button
          variant={blackout === 'white' ? 'brand' : 'outline'}
          onClick={onWhiteout}
          aria-pressed={blackout === 'white'}
        >
          <Sun className="size-4" /> White
        </Button>
        <Button variant="ghost" onClick={() => window.location.reload()} title="Reset timer">
          <RotateCcw className="size-4" /> Reset
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
      <SectionLabel>Jump</SectionLabel>
      <input
        type="number"
        min={1}
        max={total}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={(current + 1).toString()}
        className="h-8 w-20 rounded-[5px] border border-white/15 bg-black/40 px-2 font-mono text-[12px] tabular-nums outline-none focus-visible:border-white/30"
      />
      <span className="font-mono text-[11px] text-white/45">/ {total}</span>
    </form>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow text-white/45">{children}</span>;
}

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <time
      title="Current time"
      className="font-mono text-[12px] tabular-nums text-white/55"
    >
      {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </time>
  );
}

function ElapsedClock({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(() => Date.now());
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
    <time title="Elapsed" className="font-mono text-[18px] tabular-nums text-white">
      {text}
    </time>
  );
}

