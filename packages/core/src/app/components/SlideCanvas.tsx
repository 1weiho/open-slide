import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../lib/sdk';

type Props = {
  children: ReactNode;
  /** If set, use this scale directly (e.g., thumbnails). Otherwise fit to container. */
  scale?: number;
  /** Center the canvas within the container (default true). */
  center?: boolean;
  /** Flat mode: no rounded corners or drop shadow. */
  flat?: boolean;
  className?: string;
};

export function SlideCanvas({ children, scale, center = true, flat = false, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);

  useEffect(() => {
    if (scale !== undefined) return;
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      setFitScale(Math.min(width / CANVAS_WIDTH, height / CANVAS_HEIGHT));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [scale]);

  const s = scale ?? fitScale;
  const scaledW = CANVAS_WIDTH * s;
  const scaledH = CANVAS_HEIGHT * s;

  return (
    <div ref={containerRef} className={cn('relative h-full w-full overflow-hidden', className)}>
      <div
        className={cn(
          'overflow-hidden bg-white text-black',
          !flat && 'rounded-md shadow-xl ring-1 ring-black/5',
        )}
        style={{
          width: scaledW,
          height: scaledH,
          ...(center
            ? {
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%)`,
              }
            : {}),
        }}
      >
        <div
          data-osd-canvas
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `scale(${s})`,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
