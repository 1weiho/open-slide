import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { type DesignSystem, designToCssVars } from '../../design';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../lib/sdk';

type Props = {
  children: ReactNode;
  /** If set, use this scale directly (e.g., thumbnails). Otherwise fit to container. */
  scale?: number;
  /** Center the canvas within the container (default true). */
  center?: boolean;
  /** Flat mode: no rounded corners or drop shadow. */
  flat?: boolean;
  className?: string;
  /**
   * Per-slide design tokens. When set, the matching CSS custom properties
   * are emitted on the canvas root so descendants can use `var(--osd-X)`
   * regardless of which surface (editor, player, thumbnail, export) is
   * rendering them.
   */
  design?: DesignSystem;
  /**
   * Mark this canvas as a thumbnail. Emits `data-osd-thumb` so global CSS
   * can pause animations off-screen. The bigger GPU-memory win on iOS
   * Safari (where rasterising many 1920×1080 trees can kill the tab) is
   * handled upstream by `ThumbnailRail`, which only mounts a small
   * window of nearby thumbnails at any time.
   */
  thumbnail?: boolean;
};

export function SlideCanvas({
  children,
  scale,
  center = true,
  flat = false,
  className,
  design,
  thumbnail = false,
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
    <div
      ref={containerRef}
      className={cn('relative h-full w-full overflow-hidden', className)}
      data-osd-thumb={thumbnail ? 'true' : undefined}
    >
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
