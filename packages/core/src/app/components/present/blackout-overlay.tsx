import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  mode: 'black' | 'white' | null;
};

export function PresentBlackoutOverlay({ mode }: Props) {
  // Latch the last color so the surface keeps its tone while fading out
  // instead of hard-cutting on unmount.
  const [color, setColor] = useState<'black' | 'white'>('black');
  useEffect(() => {
    if (mode) setColor(mode);
  }, [mode]);
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 z-20 motion-safe:transition-opacity',
        mode ? 'opacity-100 motion-safe:duration-150' : 'opacity-0 motion-safe:duration-100',
        color === 'black' ? 'bg-black' : 'bg-white',
      )}
    />
  );
}
