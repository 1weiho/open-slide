import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWheelPageNavigation } from '@/lib/use-wheel-page-navigation';
import { cn } from '@/lib/utils';
import type { DesignSystem } from '../../design';
import type { Page } from '../lib/sdk';
import { PresentBlackoutOverlay } from './present/blackout-overlay';
import { PresentControlBar } from './present/control-bar';
import { PresentHelpOverlay } from './present/help-overlay';
import { PresentJumpInput } from './present/jump-input';
import { PresentLaserPointer } from './present/laser-pointer';
import { PresentOverviewGrid } from './present/overview-grid';
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

const IDLE_HIDE_MS = 2000;
// Bottom band of the viewport that reveals the control bar + progress bar.
// Generous enough to feel forgiving with a trackpad, tight enough not to
// flash on incidental cursor moves.
const BAR_HOTZONE_PX = 160;

type Props = {
  pages: Page[];
  design?: DesignSystem;
  index: number;
  onIndexChange: (index: number) => void;
  onExit: () => void;
  allowExit?: boolean;
  /**
   * When true, render the full presenter chrome (control bar, progress bar,
   * overview, blackout, laser pointer, jump-to-slide, help overlay, and
   * the BroadcastChannel sync that powers Presenter View). Defaults to
   * false so the static HTML export and any other minimal embeddings stay
   * untouched.
   */
  controls?: boolean;
  /** Optional id used to namespace the BroadcastChannel for Presenter View. */
  slideId?: string;
};

export function Player({
  pages,
  design,
  index,
  onIndexChange,
  onExit,
  allowExit = true,
  controls = false,
  slideId,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  // Mirrored as state so children that need to portal *into* the player
  // (tooltips, popovers — the body is outside the fullscreen subtree and
  // therefore invisible) can subscribe and re-render once the node mounts.
  const [rootEl, setRootEl] = useState<HTMLDivElement | null>(null);
  const setRoot = useCallback((el: HTMLDivElement | null) => {
    rootRef.current = el;
    setRootEl(el);
  }, []);

  // ── Overlay state (only meaningful when `controls` is true) ────────────
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [blackout, setBlackout] = useState<'black' | 'white' | null>(null);
  const [laser, setLaser] = useState(false);
  const [startedAt] = useState(() => Date.now());

  const goPrev = useCallback(() => {
    if (index > 0) onIndexChange(index - 1);
  }, [index, onIndexChange]);
  const goNext = useCallback(() => {
    if (index < pages.length - 1) onIndexChange(index + 1);
  }, [index, pages.length, onIndexChange]);

  const overlayActive = controls && (overviewOpen || helpOpen);

  useWheelPageNavigation({
    ref: rootRef,
    enabled: !overlayActive,
    canPrev: index > 0,
    canNext: index < pages.length - 1,
    onPrev: goPrev,
    onNext: goNext,
  });

  useTouchSwipe({
    ref: rootRef,
    enabled: controls && !overlayActive,
    onPrev: goPrev,
    onNext: goNext,
  });

  // ── Fullscreen lifecycle ───────────────────────────────────────────────
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement !== el) {
      el.requestFullscreen?.().catch(() => {});
    }
    return () => {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (!allowExit) return;
    const onFsChange = () => {
      if (!document.fullscreenElement) onExit();
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [onExit, allowExit]);

  // ── Presenter View sync ────────────────────────────────────────────────
  // Player is the source of truth. It re-publishes state on every change
  // and answers `request-state` pings so newly opened presenter windows
  // hydrate immediately. Notes are loaded by Presenter View itself from
  // the same slide module, so they don't cross the channel.
  const presenterState = useMemo<PresenterState>(
    () => ({ index, pageCount: pages.length, blackout, startedAt }),
    [index, pages.length, blackout, startedAt],
  );
  const presenterStateRef = useRef(presenterState);
  presenterStateRef.current = presenterState;

  const handlePresenterCommand = useCallback(
    (msg: PresenterCommand, send: (m: PresenterCommand) => void) => {
      if (msg.type === 'next') goNext();
      else if (msg.type === 'prev') goPrev();
      else if (msg.type === 'goto') {
        onIndexChange(Math.max(0, Math.min(pages.length - 1, msg.index)));
      } else if (msg.type === 'toggle-blackout') {
        setBlackout((cur) => (cur === msg.mode ? null : msg.mode));
      } else if (msg.type === 'request-state') {
        send({ type: 'state', state: presenterStateRef.current });
      }
    },
    [goNext, goPrev, onIndexChange, pages.length],
  );

  const channel = usePresenterChannel(slideId ?? '__none__', (msg) => {
    if (!controls) return;
    handlePresenterCommand(msg, (m) => channel.send(m));
  });

  useEffect(() => {
    if (!controls || !channel.available) return;
    channel.send({ type: 'state', state: presenterState });
  }, [controls, channel, presenterState]);

  // ── Keyboard ───────────────────────────────────────────────────────────
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
        goNext();
        return;
      }
      if (isPrev) {
        e.preventDefault();
        goPrev();
        return;
      }
      if (e.key === 'Home') {
        onIndexChange(0);
        return;
      }
      if (e.key === 'End') {
        onIndexChange(pages.length - 1);
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
    onIndexChange,
    pages.length,
    slideId,
  ]);

  // ── Chrome visibility / cursor ─────────────────────────────────────────
  // The control bar + progress strip only surface when the pointer is in
  // the bottom hot zone. Keyboard nav (arrows / space / PgDn) never
  // reveals them — that's intentional so the deck stays clean.
  const pointerNearBottom = usePointerNearBottom(BAR_HOTZONE_PX, controls && !overlayActive);
  const chromeVisible = pointerNearBottom || overlayActive;
  const idle = useIdle(IDLE_HIDE_MS, controls && !overlayActive);
  const hideCursor = controls && (laser || (idle && !overlayActive && !pointerNearBottom));

  const PageComp = pages[index];

  return (
    <div
      ref={setRoot}
      className={cn(
        'relative flex h-dvh w-screen items-center justify-center bg-black',
        hideCursor && 'cursor-none',
      )}
    >
      <SlideCanvas flat design={design}>
        {PageComp ? <PageComp /> : null}
      </SlideCanvas>

      {/* Invisible side click zones — the original mobile-friendly nav. */}
      <button
        type="button"
        aria-label="Previous page"
        onClick={goPrev}
        disabled={index === 0}
        className="absolute inset-y-0 left-0 z-10 w-[30%]"
      />
      <button
        type="button"
        aria-label="Next page"
        onClick={goNext}
        disabled={index === pages.length - 1}
        className="absolute inset-y-0 right-0 z-10 w-[30%]"
      />

      {controls && (
        <>
          <PresentProgressBar index={index} total={pages.length} visible={chromeVisible} />
          <PresentBlackoutOverlay mode={blackout} />
          <PresentJumpInput pageCount={pages.length} onJump={onIndexChange} />
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
            onPrev={goPrev}
            onNext={goNext}
            onOverview={() => setOverviewOpen(true)}
            onBlackout={(mode) => setBlackout((c) => (c === mode ? null : mode))}
            onLaser={() => setLaser((v) => !v)}
            onPresenter={() => slideId && openPresenterWindow(slideId)}
            onHelp={() => setHelpOpen(true)}
            onExit={onExit}
          />
          <PresentOverviewGrid
            pages={pages}
            design={design}
            open={overviewOpen}
            current={index}
            onClose={() => setOverviewOpen(false)}
            onSelect={onIndexChange}
          />
          <PresentHelpOverlay open={helpOpen} onOpenChange={setHelpOpen} container={rootEl} />
        </>
      )}
    </div>
  );
}

function openPresenterWindow(slideId: string) {
  if (typeof window === 'undefined') return;
  const url = `/s/${encodeURIComponent(slideId)}/presenter`;
  window.open(url, `open-slide-presenter-${slideId}`, 'popup,width=1280,height=800');
}
