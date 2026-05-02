import { cn } from '@/lib/utils';

type Props = {
  mode: 'black' | 'white' | null;
};

export function PresentBlackoutOverlay({ mode }: Props) {
  if (!mode) return null;
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 z-20 motion-safe:transition-opacity motion-safe:duration-150',
        mode === 'black' ? 'bg-black' : 'bg-white',
      )}
    />
  );
}
