import { type MutableRefObject, useEffect, useRef, useState } from 'react';
import { SlidePageProvider } from '../lib/page-context';
import type { Page } from '../lib/sdk';
import {
  type EntryDirection,
  type StepAggregate,
  type StepController,
  StepHost,
} from '../lib/step-context';
import { resolveTransition, type SlideTransition, type TransitionPhase } from '../lib/transition';

type Props = {
  pages: Page[];
  index: number;
  total: number;
  moduleTransition?: SlideTransition;
  disabled?: boolean;
  stepControllerRef?: MutableRefObject<StepController | null>;
  entryDirection?: EntryDirection;
  onStepAggregateChange?: (aggregate: StepAggregate) => void;
};

type Direction = 'forward' | 'backward';

const DEFAULT_EASING = 'cubic-bezier(.4, 0, .2, 1)';

function runPhase(
  el: HTMLElement,
  phase: TransitionPhase | undefined,
  fallbackDuration: number,
  fallbackEasing: string,
): Animation | null {
  if (!phase) return null;
  return el.animate(phase.keyframes, {
    duration: phase.duration ?? fallbackDuration,
    easing: phase.easing ?? fallbackEasing,
    delay: phase.delay ?? 0,
    fill: 'both',
  });
}

export function SlideTransitionLayer({
  pages,
  index,
  total,
  moduleTransition,
  disabled,
  stepControllerRef,
  entryDirection = 'jump',
  onStepAggregateChange,
}: Props) {
  const [current, setCurrent] = useState(index);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const [direction, setDirection] = useState<Direction>('forward');

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const outgoingLayerRef = useRef<HTMLDivElement | null>(null);
  const incomingLayerRef = useRef<HTMLDivElement | null>(null);
  const animsRef = useRef<Animation[]>([]);
  const currentRef = useRef(current);
  currentRef.current = current;

  useEffect(() => {
    if (index === currentRef.current) return;

    const prev = currentRef.current;
    const next = index;

    // Interrupt: cancel in-flight animations. The previously-incoming page
    // (currentRef) becomes the new outgoing; React reuses its DOM slot.
    for (const a of animsRef.current) {
      try {
        a.cancel();
      } catch {}
    }
    animsRef.current = [];

    const transition = resolveTransition(pages, next, moduleTransition);
    if (disabled || !transition) {
      setCurrent(next);
      setOutgoing(null);
      return;
    }

    setDirection(next > prev ? 'forward' : 'backward');
    setOutgoing(prev);
    setCurrent(next);
  }, [index, pages, moduleTransition, disabled]);

  useEffect(() => {
    if (outgoing === null) return;

    const transition = resolveTransition(pages, current, moduleTransition);
    const wrapper = wrapperRef.current;
    const out = outgoingLayerRef.current;
    const inc = incomingLayerRef.current;
    if (!transition || !wrapper || !out || !inc) {
      setOutgoing(null);
      return;
    }

    wrapper.dataset.osdDir = direction;
    wrapper.style.setProperty('--osd-dir', direction === 'forward' ? '1' : '-1');

    const easing = transition.easing ?? DEFAULT_EASING;
    const duration = transition.duration;

    const anims: Animation[] = [];
    const exitAnim = runPhase(out, transition.exit, duration, easing);
    const enterAnim = runPhase(inc, transition.enter, duration, easing);
    if (exitAnim) anims.push(exitAnim);
    if (enterAnim) anims.push(enterAnim);
    animsRef.current = anims;

    if (anims.length === 0) {
      setOutgoing(null);
      return;
    }

    let cancelled = false;
    Promise.all(anims.map((a) => a.finished))
      .then(() => {
        if (cancelled) return;
        animsRef.current = [];
        setOutgoing(null);
      })
      .catch(() => {
        // AbortError fires when we cancel mid-flight on an interrupt.
      });

    return () => {
      cancelled = true;
    };
  }, [outgoing, current, direction, pages, moduleTransition]);

  useEffect(() => {
    return () => {
      for (const a of animsRef.current) {
        try {
          a.cancel();
        } catch {}
      }
      animsRef.current = [];
    };
  }, []);

  const CurrentPage = pages[current];
  const OutgoingPage = outgoing !== null ? pages[outgoing] : null;

  // Outgoing layer mirrors the direction we just navigated so its <Steps>
  // re-mounts in the state the audience just saw: forward nav → outgoing was
  // fully revealed; backward nav → outgoing was at zero reveals.
  const outgoingEntryDirection: EntryDirection =
    entryDirection === 'backward' ? 'forward' : 'backward';

  const noopControllerRef = useRef<StepController | null>(null);
  const activeControllerRef = stepControllerRef ?? noopControllerRef;

  return (
    <div
      ref={wrapperRef}
      className="relative h-full w-full"
      style={{ background: 'var(--osd-bg)' }}
    >
      {OutgoingPage && outgoing !== null ? (
        <div ref={outgoingLayerRef} className="absolute inset-0">
          <SlidePageProvider index={outgoing} total={total}>
            <StepHost
              isActivePage={false}
              entryDirection={outgoingEntryDirection}
              controllerRef={activeControllerRef}
            >
              <OutgoingPage />
            </StepHost>
          </SlidePageProvider>
        </div>
      ) : null}
      {CurrentPage ? (
        <div ref={incomingLayerRef} className="absolute inset-0">
          <SlidePageProvider index={current} total={total}>
            <StepHost
              isActivePage
              entryDirection={entryDirection}
              controllerRef={activeControllerRef}
              onAggregateChange={onStepAggregateChange}
            >
              <CurrentPage />
            </StepHost>
          </SlidePageProvider>
        </div>
      ) : null}
    </div>
  );
}
