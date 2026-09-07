import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Soft red dot that follows the cursor when the laser tool is active.
 * Hides the system cursor on the player root via a `cursor-none` class
 * applied by the parent.
 */
export function PresentLaserPointer({ enabled }: { enabled: boolean }) {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const posRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef(0);
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setTracking(false);
      posRef.current = null;
      return;
    }
    // Position is written straight to the element inside rAF — routing it
    // through React state would re-render at pointer rate and lag the hand.
    const onMove = (e: PointerEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = 0;
          const el = dotRef.current;
          const p = posRef.current;
          if (el && p) el.style.transform = `translate3d(${p.x - 9}px, ${p.y - 9}px, 0)`;
        });
      }
      setTracking(true);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div
      ref={dotRef}
      aria-hidden
      className={cn(
        'pointer-events-none fixed top-0 left-0 z-[60] motion-safe:transition-opacity motion-safe:duration-150',
        tracking ? 'opacity-100' : 'opacity-0',
      )}
      style={{
        width: 18,
        height: 18,
        willChange: 'transform',
        borderRadius: '50%',
        background: 'radial-gradient(circle, oklch(0.66 0.24 28 / 0.95) 30%, transparent 70%)',
        boxShadow: '0 0 18px 4px oklch(0.66 0.24 28 / 0.55)',
      }}
    />
  );
}
