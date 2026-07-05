import {
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Grid2x2,
  Keyboard,
  LogOut,
  Maximize,
  Minimize,
  MonitorSpeaker,
  Square,
  Sun,
} from 'lucide-react';
import { createContext, useContext, useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocale } from '@/lib/use-locale';
import { cn } from '@/lib/utils';

const TooltipContainerCtx = createContext<HTMLElement | null>(null);

type Props = {
  index: number;
  total: number;
  visible: boolean;
  startedAt: number;
  blackout: 'black' | 'white' | null;
  laser: boolean;
  allowExit: boolean;
  windowed: boolean;
  onPrev: () => void;
  onNext: () => void;
  onMobileInteraction: () => void;
  onOverview: () => void;
  onBlackout: (mode: 'black' | 'white') => void;
  onLaser: () => void;
  onPresenter: () => void;
  onToggleFullscreen: () => void;
  onHelp: () => void;
  onExit: () => void;
  /**
   * Where to portal tooltips. Required because the Player runs fullscreen
   * — the default `document.body` portal is outside the fullscreen element
   * and therefore invisible. Pass the player root.
   */
  tooltipContainer?: HTMLElement | null;
};

export function PresentControlBar({
  index,
  total,
  visible,
  startedAt,
  blackout,
  laser,
  allowExit,
  windowed,
  onPrev,
  onNext,
  onMobileInteraction,
  onOverview,
  onBlackout,
  onLaser,
  onPresenter,
  onToggleFullscreen,
  onHelp,
  onExit,
  tooltipContainer,
}: Props) {
  const t = useLocale();
  const fullscreenAria = windowed ? t.present.enterFullscreenAria : t.present.exitFullscreenAria;
  const handleMobileAction = (action: () => void) => {
    action();
    onMobileInteraction();
  };

  return (
    <div
      data-state={visible ? 'visible' : 'hidden'}
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-4 md:pb-4',
        'will-change-[translate,scale,opacity,filter]',
        'motion-safe:transition-[translate,scale,opacity,filter]',
        'motion-safe:duration-[420ms] motion-safe:[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
        visible
          ? 'translate-y-0 scale-100 opacity-100 blur-none'
          : 'translate-y-8 scale-90 opacity-0 blur-md',
      )}
    >
      <TooltipProvider delayDuration={300}>
        <TooltipContainerCtx.Provider value={tooltipContainer ?? null}>
          <div
            className={cn(
              'hidden h-11 items-center gap-1 rounded-full border border-white/10 bg-black/55 px-2 text-white/85 shadow-[0_8px_30px_-8px_oklch(0_0_0/0.6)] backdrop-blur-md md:flex',
              visible ? 'pointer-events-auto' : 'pointer-events-none',
            )}
          >
            <BarButton label={t.present.prevSlideAria} onClick={onPrev} disabled={index === 0}>
              <ChevronLeft className="size-4" />
            </BarButton>
            <BarButton
              label={t.present.nextSlideAria}
              onClick={onNext}
              disabled={index >= total - 1}
            >
              <ChevronRight className="size-4" />
            </BarButton>

            <Divider />

            <span className="px-2 font-mono text-[11.5px] tracking-[0.08em] tabular-nums uppercase select-none text-white/85">
              <span className="text-white">{(index + 1).toString().padStart(2, '0')}</span>
              <span className="text-white/35"> / </span>
              <span>{total.toString().padStart(2, '0')}</span>
            </span>

            <Divider />

            <ElapsedClock startedAt={startedAt} />

            <Divider />

            <BarButton label={t.present.overviewAria} onClick={onOverview}>
              <Grid2x2 className="size-4" />
            </BarButton>
            <BarButton
              label={t.present.blackoutAria}
              onClick={() => onBlackout('black')}
              active={blackout === 'black'}
            >
              <Square className="size-4 fill-current" />
            </BarButton>
            <BarButton
              label={t.present.whiteoutAria}
              onClick={() => onBlackout('white')}
              active={blackout === 'white'}
            >
              <Sun className="size-4" />
            </BarButton>
            <BarButton label={t.present.laserAria} onClick={onLaser} active={laser}>
              <Crosshair className="size-4" />
            </BarButton>
            <BarButton label={t.present.presenterAria} onClick={onPresenter}>
              <MonitorSpeaker className="size-4" />
            </BarButton>
            <BarButton label={fullscreenAria} onClick={onToggleFullscreen}>
              {windowed ? <Maximize className="size-4" /> : <Minimize className="size-4" />}
            </BarButton>
            <BarButton label={t.present.helpAria} onClick={onHelp}>
              <Keyboard className="size-4" />
            </BarButton>

            {allowExit && (
              <>
                <Divider />
                <BarButton label={t.present.exitAria} onClick={onExit}>
                  <LogOut className="size-4" />
                </BarButton>
              </>
            )}
          </div>

          <div
            className={cn(
              'flex w-fit max-w-[calc(100vw-1.5rem)] md:hidden',
              visible ? 'pointer-events-auto' : 'pointer-events-none',
            )}
          >
            <div className="flex h-10 w-fit items-center gap-0.5 rounded-full border border-white/10 bg-black/60 px-1 text-white/85 shadow-[0_8px_30px_-8px_oklch(0_0_0/0.65)] backdrop-blur-md">
              <MobileBarButton
                label={t.present.prevSlideAria}
                onClick={() => handleMobileAction(onPrev)}
                disabled={index === 0}
              >
                <ChevronLeft className="size-4" />
              </MobileBarButton>
              <span className="min-w-[3.5rem] px-1 text-center font-mono text-[11.5px] tabular-nums text-white/80 select-none">
                <span className="text-white">{index + 1}</span>
                <span className="px-1 text-white/35">/</span>
                <span>{total}</span>
              </span>
              <MobileBarButton
                label={t.present.nextSlideAria}
                onClick={() => handleMobileAction(onNext)}
                disabled={index >= total - 1}
              >
                <ChevronRight className="size-4" />
              </MobileBarButton>
              <MobileDivider />
              <MobileBarButton
                label={t.present.overviewAria}
                onClick={() => handleMobileAction(onOverview)}
              >
                <Grid2x2 className="size-4" />
              </MobileBarButton>
              {allowExit && (
                <MobileBarButton
                  label={t.present.exitAria}
                  onClick={() => handleMobileAction(onExit)}
                >
                  <LogOut className="size-4" />
                </MobileBarButton>
              )}
            </div>
          </div>
        </TooltipContainerCtx.Provider>
      </TooltipProvider>
    </div>
  );
}

function MobileBarButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={cn(
        'inline-flex size-8 shrink-0 touch-manipulation items-center justify-center rounded-full transition-colors',
        'text-white/85 hover:bg-white/12 focus-visible:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35',
        'disabled:pointer-events-none disabled:opacity-30',
      )}
    >
      {children}
    </button>
  );
}

function MobileDivider() {
  return <span aria-hidden className="mx-0.5 h-3.5 w-px shrink-0 bg-white/15" />;
}

function BarButton({
  children,
  label,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  const container = useContext(TooltipContainerCtx);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            onClick();
          }}
          className={cn(
            'inline-flex size-8 items-center justify-center rounded-full transition-colors',
            'hover:bg-white/12 focus-visible:bg-white/12 focus-visible:outline-none',
            'disabled:pointer-events-none disabled:opacity-30',
            active && 'bg-[var(--brand,#ef4444)]/85 text-white hover:bg-[var(--brand,#ef4444)]',
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent
        container={container ?? undefined}
        side="top"
        sideOffset={6}
        className="bg-black/85 text-white"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 h-4 w-px bg-white/15" />;
}

function ElapsedClock({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  const t = useLocale();
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000));
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return (
    <time
      title={t.present.elapsedTime}
      className="px-2 font-mono text-[11.5px] tracking-[0.08em] tabular-nums uppercase select-none text-white/70"
    >
      {m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}
    </time>
  );
}
