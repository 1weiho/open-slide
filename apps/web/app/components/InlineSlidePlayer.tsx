'use client';

import demoSlides from './demo-slide';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

const CANVAS_W = 1920;
const CANVAS_H = 1080;

export const inlineSlideCount = demoSlides.length;

type Props = {
  index: number;
  onIndexChange: (i: number) => void;
};

export function InlineSlidePlayer({ index, onIndexChange }: Props) {
  const slides = demoSlides;
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const count = slides.length;
  const clamp = (i: number) => Math.max(0, Math.min(count - 1, i));

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      setScale(Math.min(width / CANVAS_W, height / CANVAS_H));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const next = new Set(['ArrowRight', 'ArrowDown', 'PageDown', ' ']);
    const prev = new Set(['ArrowLeft', 'ArrowUp', 'PageUp']);
    if (next.has(e.key)) {
      e.preventDefault();
      onIndexChange(clamp(index + 1));
    } else if (prev.has(e.key)) {
      e.preventDefault();
      onIndexChange(clamp(index - 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onIndexChange(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      onIndexChange(count - 1);
    }
  };

  const Page = slides[index];
  const scaledW = CANVAS_W * scale;
  const scaledH = CANVAS_H * scale;

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      aria-roledescription="slide player"
      aria-label={`Slide ${index + 1} of ${count}`}
      className="group relative h-full w-full outline-none"
    >
      <div ref={stageRef} className="relative h-full w-full overflow-hidden">
        <div
          className="overflow-hidden bg-black"
          style={{
            width: scaledW,
            height: scaledH,
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            style={{
              width: CANVAS_W,
              height: CANVAS_H,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            {Page ? <Page /> : null}
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute bottom-3 right-3 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.18em] uppercase text-[color:var(--color-muted)]/90 bg-[color:var(--color-ink)]/60 backdrop-blur-sm px-2 py-1 rounded"
      >
        {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
      </div>
    </div>
  );
}
