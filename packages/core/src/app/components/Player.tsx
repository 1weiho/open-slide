import { useEffect, useRef } from 'react';
import type { Page } from '../lib/sdk';
import { SlideCanvas } from './SlideCanvas';

type Props = {
  pages: Page[];
  index: number;
  onIndexChange: (index: number) => void;
  onExit: () => void;
};

export function Player({ pages, index, onIndexChange, onExit }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

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
    const onFsChange = () => {
      if (!document.fullscreenElement) onExit();
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [onExit]);

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
        onExit();
      } else if (e.key === 'Home') {
        onIndexChange(0);
      } else if (e.key === 'End') {
        onIndexChange(pages.length - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, pages.length, onIndexChange, onExit]);

  const PageComp = pages[index];

  return (
    <div ref={rootRef} className="relative flex h-screen w-screen items-center justify-center bg-black">
      <SlideCanvas flat>{PageComp ? <PageComp /> : null}</SlideCanvas>
      <button
        type="button"
        aria-label="Previous page"
        onClick={() => index > 0 && onIndexChange(index - 1)}
        disabled={index === 0}
        className="absolute inset-y-0 left-0 z-10 w-[30%]"
      />
      <button
        type="button"
        aria-label="Next page"
        onClick={() => index < pages.length - 1 && onIndexChange(index + 1)}
        disabled={index === pages.length - 1}
        className="absolute inset-y-0 right-0 z-10 w-[30%]"
      />
    </div>
  );
}
