import { useCallback, useEffect, useRef } from 'react';
import { useWheelPageNavigation } from '@/lib/useWheelPageNavigation';
import type { DesignSystem } from '../../design';
import type { Page } from '../lib/sdk';
import { SlideCanvas } from './SlideCanvas';

type Props = {
  pages: Page[];
  design?: DesignSystem;
  index: number;
  onIndexChange: (index: number) => void;
  onExit: () => void;
  allowExit?: boolean;
};

export function Player({ pages, design, index, onIndexChange, onExit, allowExit = true }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const goPrev = useCallback(() => {
    if (index > 0) onIndexChange(index - 1);
  }, [index, onIndexChange]);
  const goNext = useCallback(() => {
    if (index < pages.length - 1) onIndexChange(index + 1);
  }, [index, pages.length, onIndexChange]);

  useWheelPageNavigation({
    ref: rootRef,
    canPrev: index > 0,
    canNext: index < pages.length - 1,
    onPrev: goPrev,
    onNext: goNext,
  });

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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === 'ArrowRight' ||
        e.key === 'ArrowDown' ||
        e.key === ' ' ||
        e.key === 'PageDown'
      ) {
        e.preventDefault();
        if (index < pages.length - 1) onIndexChange(index + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        if (index > 0) onIndexChange(index - 1);
      } else if (e.key === 'Escape') {
        if (allowExit) onExit();
      } else if (e.key === 'Home') {
        onIndexChange(0);
      } else if (e.key === 'End') {
        onIndexChange(pages.length - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, pages.length, onIndexChange, onExit, allowExit]);

  const PageComp = pages[index];

  return (
    <div
      ref={rootRef}
      className="relative flex h-screen w-screen items-center justify-center bg-black"
    >
      <SlideCanvas flat design={design}>
        {PageComp ? <PageComp /> : null}
      </SlideCanvas>
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
    </div>
  );
}
