import { useEffect, useRef } from 'react';
import type { SlidePage } from '../lib/sdk';
import { SlideCanvas } from './SlideCanvas';

type Props = {
  pages: SlidePage[];
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
    const onFsChange = () => {
      if (!document.fullscreenElement) onExit();
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, [onExit]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        if (index < pages.length - 1) onIndexChange(index + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
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

  const Page = pages[index];

  return (
    <div ref={rootRef} className="player">
      <SlideCanvas>{Page ? <Page /> : null}</SlideCanvas>
    </div>
  );
}
