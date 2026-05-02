import {
  ChevronLeft,
  ChevronRight,
  Grid2x2,
  Keyboard,
  LogOut,
  MonitorSpeaker,
  Pointer,
  Square,
  Sun,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type Props = {
  index: number;
  total: number;
  visible: boolean;
  startedAt: number;
  blackout: 'black' | 'white' | null;
  laser: boolean;
  allowExit: boolean;
  onPrev: () => void;
  onNext: () => void;
  onOverview: () => void;
  onBlackout: (mode: 'black' | 'white') => void;
  onLaser: () => void;
  onPresenter: () => void;
  onHelp: () => void;
  onExit: () => void;
};

export function PresentControlBar({
  index,
  total,
  visible,
  startedAt,
  blackout,
  laser,
  allowExit,
  onPrev,
  onNext,
  onOverview,
  onBlackout,
  onLaser,
  onPresenter,
  onHelp,
  onExit,
}: Props) {
  return (
    <div
      data-state={visible ? 'visible' : 'hidden'}
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4',
        'motion-safe:transition-[opacity,transform] motion-safe:duration-200 motion-safe:ease-out',
        visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-2 opacity-0',
      )}
    >
      <TooltipProvider delayDuration={300}>
        <div className="pointer-events-auto flex h-11 items-center gap-1 rounded-full border border-white/10 bg-black/55 px-2 text-white/85 shadow-[0_8px_30px_-8px_oklch(0_0_0/0.6)] backdrop-blur-md">
          <BarButton label="Previous slide (←)" onClick={onPrev} disabled={index === 0}>
            <ChevronLeft className="size-4" />
          </BarButton>
          <BarButton label="Next slide (→)" onClick={onNext} disabled={index >= total - 1}>
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

          <BarButton label="Slide overview (O)" onClick={onOverview}>
            <Grid2x2 className="size-4" />
          </BarButton>
          <BarButton
            label="Black screen (B)"
            onClick={() => onBlackout('black')}
            active={blackout === 'black'}
          >
            <Square className="size-4 fill-current" />
          </BarButton>
          <BarButton
            label="White screen (W)"
            onClick={() => onBlackout('white')}
            active={blackout === 'white'}
          >
            <Sun className="size-4" />
          </BarButton>
          <BarButton label="Laser pointer (L)" onClick={onLaser} active={laser}>
            <Pointer className="size-4" />
          </BarButton>
          <BarButton label="Presenter view (P)" onClick={onPresenter}>
            <MonitorSpeaker className="size-4" />
          </BarButton>
          <BarButton label="Keyboard shortcuts (?)" onClick={onHelp}>
            <Keyboard className="size-4" />
          </BarButton>

          {allowExit && (
            <>
              <Divider />
              <BarButton label="Exit (Esc)" onClick={onExit}>
                <LogOut className="size-4" />
              </BarButton>
            </>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
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
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
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
      <TooltipContent side="top" sideOffset={6} className="bg-black/85 text-white">
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
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000));
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return (
    <time
      title="Elapsed time"
      className="px-2 font-mono text-[11.5px] tracking-[0.08em] tabular-nums uppercase select-none text-white/70"
    >
      {m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}
    </time>
  );
}
