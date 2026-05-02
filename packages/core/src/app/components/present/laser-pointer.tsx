import { useEffect, useState } from 'react';

type Pos = { x: number; y: number } | null;

/**
 * Soft red dot that follows the cursor when the laser tool is active.
 * Hides the system cursor on the player root via a `cursor-none` class
 * applied by the parent.
 */
export function PresentLaserPointer({ enabled }: { enabled: boolean }) {
  const [pos, setPos] = useState<Pos>(null);

  useEffect(() => {
    if (!enabled) {
      setPos(null);
      return;
    }
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [enabled]);

  if (!enabled || !pos) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-[60]"
      style={{
        left: pos.x,
        top: pos.y,
        width: 18,
        height: 18,
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        background: 'radial-gradient(circle, oklch(0.66 0.24 28 / 0.95) 30%, transparent 70%)',
        boxShadow: '0 0 18px 4px oklch(0.66 0.24 28 / 0.55)',
      }}
    />
  );
}
