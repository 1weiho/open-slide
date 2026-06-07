import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useClickPageNavigation } from '@/lib/use-click-page-navigation';
import { useWheelPageNavigation } from '@/lib/use-wheel-page-navigation';
import { cn } from '@/lib/utils';
import type { DesignSystem } from '../lib/design';
import type { Page } from '../lib/sdk';
import type { EntryDirection, StepAggregate, StepController } from '../lib/step-context';
import type { SlideTransition } from '../lib/transition';
import { usePrefersReducedMotion } from '../lib/use-prefers-reduced-motion';
import { OverviewGrid } from './overview-grid';
import { PresentBlackoutOverlay } from './present/blackout-overlay';
import { PresentControlBar } from './present/control-bar';
import { PresentHelpOverlay } from './present/help-overlay';
import { PresentJumpInput } from './present/jump-input';
import { PresentLaserPointer } from './present/laser-pointer';
import { PresentProgressBar } from './present/progress-bar';
import { useIdle } from './present/use-idle';
import { usePointerNearBottom } from './present/use-pointer-near-bottom';
import {
  type PresenterCommand,
  type PresenterState,
  usePresenterChannel,
} from './present/use-presenter-channel';
import { useTouchSwipe } from './present/use-touch-swipe';
import { SlideCanvas } from './slide-canvas';
import { SlideTransitionLayer } from './slide-transition-layer';

const IDLE_HIDE_MS = 2000;
const BAR_HOTZONE_PX = 160;

type Props = {
  pages: Page[];
  design?: DesignSystem;
  transition?: SlideTransition;
  index: number;
  onIndexChange: (index: number) => void;
  onExit: () => void;
  allowExit?: boolean;
  controls?: boolean;
  slideId?: string;
  /**
   * When true, the Player enters the browser Fullscreen API on mount.
   * When false, it renders as a window-sized overlay (viewport-filling)
   * without entering fullscreen. Defaults to true for back-compat.
   */
  fullscreen?: boolean;
};

export function Player({
  pages,
  design,
  transition,
  index,
  onIndexChange,
  onExit,
  allowExit = true,
  controls = false,
  slideId,
  fullscreen = true,
}: Props) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement | null>(null);
  // Mirrored as state so descendants portaling *into* the player subtree
  // (tooltips, popovers — the body is outside the fullscreen tree) re-render
  // once the node mounts.
  const [rootEl, setRootEl] = useState<HTMLDivElement | null>(null);
  const setRoot = useCallback((el: HTMLDivElement | null) => {
    rootRef.current = el;
    setRootEl(el);
  }, []);

  const [overviewOpen, setOverviewOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [blackout, setBlackout] = useState<'black' | 'white' | null>(null);
  const [laser, setLaser] = useState(false);
  const [keyboardDriven, setKeyboardDriven] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [windowed, setWindowed] = useState(!fullscreen);
  // Mirror windowed into a ref so the fullscreenchange listener can read the
  // latest value without re-binding — exits from window mode must not call
  // onExit, but exits initiated by the browser (Esc in fullscreen) must.
  const windowedRef = useRef(windowed);
  windowedRef.current = windowed;

  const canPrev = index > 0;
  const canNext = index < pages.length - 1;

  const stepControllerRef = useRef<StepController | null>(null);
  const [entryDirection, setEntryDirection] = useState<EntryDirection>('jump');
  const [stepAggregate, setStepAggregate] = useState<StepAggregate>({
    revealed: 0,
    stepCount: 0,
  });
  const handleAggregateChange = useCallback((a: StepAggregate) => {
    setStepAggregate((cur) =>
      cur.revealed === a.revealed && cur.stepCount === a.stepCount ? cur : a,
    );
  }, []);

  // Every navigation funnels through here so entryDirection is settled
  // synchronously, before the incoming page's <Steps> reads it on mount.
  const handleIndexChange = useCallback(
    (next: number) => {
      const delta = next - index;
      setEntryDirection(delta === 1 ? 'forward' : delta === -1 ? 'backward' : 'jump');
      onIndexChange(next);
    },
    [index, onIndexChange],
  );

  const goPrev = useCallback(() => {
    if (stepControllerRef.current?.retreat()) return;
    if (index > 0) handleIndexChange(index - 1);
  }, [index, handleIndexChange]);
  const goNext = useCallback(() => {
    if (stepControllerRef.current?.advance()) return;
    if (index < pages.length - 1) handleIndexChange(index + 1);
  }, [index, pages.length, handleIndexChange]);

  const overlayActive = controls && (overviewOpen || helpOpen);

  useClickPageNavigation({
    ref: rootRef,
    enabled: !overlayActive,
    canPrev,
    canNext,
    onPrev: goPrev,
    onNext: goNext,
  });

  useWheelPageNavigation({
    ref: rootRef,
    enabled: !overlayActive,
    canPrev,
    canNext,
    onPrev: goPrev,
    onNext: goNext,
  });

  useTouchSwipe({
    ref: rootRef,
    enabled: controls && !overlayActive,
    onPrev: goPrev,
    onNext: goNext,
  });

  useEffect(() => {
    if (windowed) return;
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement !== el) {
      el.requestFullscreen?.().catch(() => {});
    }
    return () => {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, [windowed]);

  useEffect(() => {
    if (!allowExit) return;
    const onFsChange = () => {
      if (!document.fullscreenElement && !windowedRef.current) onExit();
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [onExit, allowExit]);

  const toggleFullscreen = useCallback(() => {
    setWindowed((w) => !w);
  }, []);

  // Player is the source of truth: it re-publishes state on every change
  // and answers `request-state` pings so newly opened presenter windows
  // hydrate immediately.
  const presenterState = useMemo<PresenterState>(
    () => ({
      index,
      pageCount: pages.length,
      blackout,
      startedAt,
      stepIndex: stepAggregate.revealed,
      stepCount: stepAggregate.stepCount,
    }),
    [index, pages.length, blackout, startedAt, stepAggregate],
  );
  const presenterStateRef = useRef(presenterState);
  presenterStateRef.current = presenterState;

  const handlePresenterCommand = useCallback(
    (msg: PresenterCommand, send: (m: PresenterCommand) => void) => {
      if (msg.type === 'next') goNext();
      else if (msg.type === 'prev') goPrev();
      else if (msg.type === 'goto') {
        handleIndexChange(Math.max(0, Math.min(pages.length - 1, msg.index)));
      } else if (msg.type === 'toggle-blackout') {
        setBlackout((cur) => (cur === msg.mode ? null : msg.mode));
      } else if (msg.type === 'request-state') {
        send({ type: 'state', state: presenterStateRef.current });
      }
    },
    [goNext, goPrev, handleIndexChange, pages.length],
  );

  const channel = usePresenterChannel(slideId ?? '__none__', (msg) => {
    if (!controls) return;
    handlePresenterCommand(msg, (m) => channel.send(m));
  });

  useEffect(() => {
    if (!controls || !channel.available) return;
    channel.send({ type: 'state', state: presenterState });
  }, [controls, channel, presenterState]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tgt = e.target;
      if (tgt instanceof HTMLElement && tgt.matches('input, textarea')) return;

      // While an overlay is open, only Esc and the toggle that owns it
      // should reach the Player. Overview installs its own capture-phase
      // listener and stops propagation, so it won't double-fire here.
      if (overlayActive) {
        if (e.key === 'Escape') {
          e.preventDefault();
          if (overviewOpen) setOverviewOpen(false);
          if (helpOpen) setHelpOpen(false);
        } else if (helpOpen && (e.key === '?' || e.key === 'h' || e.key === 'H')) {
          e.preventDefault();
          setHelpOpen(false);
        }
        return;
      }

      // Esc → close blackout if any, otherwise exit fullscreen.
      if (e.key === 'Escape') {
        if (controls && blackout) {
          e.preventDefault();
          setBlackout(null);
          return;
        }
        if (allowExit) onExit();
        return;
      }

      const isNext =
        e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown';
      const isPrev = e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp';

      if (isNext || isPrev) {
        if (controls && blackout) setBlackout(null);
      }

      if (isNext) {
        e.preventDefault();
        setKeyboardDriven(true);
        goNext();
        return;
      }
      if (isPrev) {
        e.preventDefault();
        setKeyboardDriven(true);
        goPrev();
        return;
      }
      if (e.key === 'Home') {
        setKeyboardDriven(true);
        handleIndexChange(0);
        return;
      }
      if (e.key === 'End') {
        setKeyboardDriven(true);
        handleIndexChange(pages.length - 1);
        return;
      }

      if (!controls) return;
      // Single-letter shortcuts only fire when no modifier is held — keeps
      // browser shortcuts (Cmd/Ctrl-something) from being hijacked.
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        setBlackout((c) => (c === 'black' ? null : 'black'));
      } else if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        setBlackout((c) => (c === 'white' ? null : 'white'));
      } else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        setOverviewOpen((v) => !v);
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setLaser((v) => !v);
      } else if (e.key === 'h' || e.key === 'H' || e.key === '?') {
        e.preventDefault();
        setHelpOpen((v) => !v);
      } else if ((e.key === 'p' || e.key === 'P') && slideId) {
        e.preventDefault();
        openPresenterWindow(slideId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    controls,
    overlayActive,
    overviewOpen,
    helpOpen,
    blackout,
    allowExit,
    onExit,
    goNext,
    goPrev,
    handleIndexChange,
    pages.length,
    slideId,
  ]);

  // The control bar + progress strip only surface when the pointer is in
  // the bottom hot zone. Keyboard nav (arrows / space / PgDn) never reveals
  // them — intentional so the deck stays clean during a talk.
  const pointerNearBottom = usePointerNearBottom(BAR_HOTZONE_PX, controls && !overlayActive);
  const chromeVisible = pointerNearBottom || overlayActive;
  const idle = useIdle(IDLE_HIDE_MS, controls && !overlayActive);

  useEffect(() => {
    if (!keyboardDriven) return;
    const clear = () => setKeyboardDriven(false);
    window.addEventListener('mousemove', clear, { passive: true });
    return () => window.removeEventListener('mousemove', clear);
  }, [keyboardDriven]);

  const hideCursor =
    controls && (laser || keyboardDriven || (idle && !overlayActive && !pointerNearBottom));

  return (
    <div
      ref={setRoot}
      className={cn(
        'fixed inset-0 flex items-center justify-center overflow-hidden bg-black',
        controls && 'select-none',
        controls && (hideCursor ? 'cursor-none' : 'cursor-default'),
      )}
    >
      <SlideCanvas flat design={design}>
        <SlideTransitionLayer
          pages={pages}
          index={index}
          total={pages.length}
          moduleTransition={transition}
          disabled={prefersReducedMotion}
          stepControllerRef={stepControllerRef}
          entryDirection={entryDirection}
          onStepAggregateChange={handleAggregateChange}
        />
      </SlideCanvas>

      {controls && (
        <div data-osd-chrome style={{ display: 'contents' }}>
          <PresentProgressBar index={index} total={pages.length} visible={chromeVisible} />
          <PresentBlackoutOverlay mode={blackout} />
          <PresentJumpInput pageCount={pages.length} onJump={handleIndexChange} />
          <PresentLaserPointer enabled={laser} />
          <PresentControlBar
            tooltipContainer={rootEl}
            index={index}
            total={pages.length}
            visible={chromeVisible}
            startedAt={startedAt}
            blackout={blackout}
            laser={laser}
            allowExit={allowExit}
            windowed={windowed}
            onPrev={goPrev}
            onNext={goNext}
            onOverview={() => setOverviewOpen(true)}
            onBlackout={(mode) => setBlackout((c) => (c === mode ? null : mode))}
            onLaser={() => setLaser((v) => !v)}
            onPresenter={() => slideId && openPresenterWindow(slideId)}
            onToggleFullscreen={toggleFullscreen}
            onHelp={() => setHelpOpen(true)}
            onExit={onExit}
          />
          <OverviewGrid
            pages={pages}
            design={design}
            open={overviewOpen}
            current={index}
            onClose={() => setOverviewOpen(false)}
            onSelect={handleIndexChange}
            variant="present"
          />
          <PresentHelpOverlay open={helpOpen} onOpenChange={setHelpOpen} container={rootEl} />
        </div>
      )}
    </div>
  );
}

export function openPresenterWindow(slideId: string) {
  if (typeof window === 'undefined') return;
  const url = `${import.meta.env.BASE_URL}s/${encodeURIComponent(slideId)}/presenter`;
  window.open(url, `open-slide-presenter-${slideId}`, 'popup,width=1280,height=800');
}
