import { type CSSProperties, type ReactNode, useLayoutEffect, useRef, useState } from 'react';
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
  const [fitScale, setFitScale] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (scale !== undefined) return;
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      setFitScale(Math.min(width / CANVAS_WIDTH, height / CANVAS_HEIGHT));
    };
    // Measure synchronously before paint so the fitted scale is applied on the
    // first visible frame — otherwise the canvas flashes at full size.
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scale]);

  const measured = scale ?? fitScale;
  const s = measured ?? 1;
  const scaledW = CANVAS_WIDTH * s;
  const scaledH = CANVAS_HEIGHT * s;
  const designVars = design ? designToCssVars(design) : undefined;

  return (
    <div ref={containerRef} className={cn('relative h-full w-full overflow-hidden', className)}>
      <div
        className={cn(
          'overflow-hidden bg-white text-black',
          // Inset shadow keeps the 1px edge inside the canvas box so it
          // can't be clipped by the parent's overflow-hidden.
          !flat && 'rounded-[6px] shadow-[inset_0_0_0_1px_oklch(0_0_0/0.08)]',
        )}
        style={
          {
            width: scaledW,
            height: scaledH,
            visibility: measured === null ? 'hidden' : undefined,
            ...(designVars
              ? {
                  ...designVars,
                  background: 'var(--osd-bg)',
                }
              : {}),
            ...(center
              ? {
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%)`,
                }
              : {}),
          } as CSSProperties
        }
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
              ...(designVars ?? {}),
            } as CSSProperties
          }
        >
          {children}
        </div>
      </div>
      {freezeMotion && <div aria-hidden className="absolute inset-0 z-10" />}
    </div>
  );
}
