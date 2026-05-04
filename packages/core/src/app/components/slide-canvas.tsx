import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { type DesignSystem, designToCssVars } from '../lib/design';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../lib/sdk';

type Props = {
  children: ReactNode;
  /** If set, use this scale directly. Otherwise fit to container. */
  scale?: number;
  center?: boolean;
  flat?: boolean;
  freezeMotion?: boolean;
  className?: string;
  design?: DesignSystem;
};

export function SlideCanvas({
  children,
  scale,
  center = true,
  flat = false,
  freezeMotion = false,
  className,
  design,
}: Props) {
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
          // Inset shadow keeps the 1px edge inside the canvas box so it
          // can't be clipped by the parent's overflow-hidden.
          !flat && 'rounded-[6px] shadow-[inset_0_0_0_1px_oklch(0_0_0/0.08)]',
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
          data-osd-freeze-motion={freezeMotion ? '' : undefined}
          style={
            {
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              transform: `scale(${s})`,
              transformOrigin: 'top left',
              ...(design ? designToCssVars(design) : {}),
            } as CSSProperties
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}
