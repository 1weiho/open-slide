import { useEffect, useState } from 'react';
import { usePanelMount } from '@/components/panel/panel-shell';
import { cn } from '@/lib/utils';

type Props = {
  mode: 'black' | 'white' | null;
};

export function PresentBlackoutOverlay({ mode }: Props) {
  // Latch the last color so the surface keeps its tone while fading out,
  // and unmount only after the fade so the DOM reflects the cleared state.
  const [color, setColor] = useState<'black' | 'white'>('black');
  const { mounted, animVisible } = usePanelMount(mode !== null);
  useEffect(() => {
    if (mode) setColor(mode);
  }, [mode]);
  // Render from `mode` directly while active — the latched state is one
  // frame behind and would flash the previous color on a direct switch.
  const visibleColor = mode ?? color;
  if (!mounted) return null;
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 z-20 motion-safe:transition-opacity',
        animVisible ? 'opacity-100 motion-safe:duration-150' : 'opacity-0 motion-safe:duration-100',
        visibleColor === 'black' ? 'bg-black' : 'bg-white',
      )}
    />
  );
}
