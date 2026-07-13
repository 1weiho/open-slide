import { cn } from '@/lib/utils';

type Props = {
  index: number;
  total: number;
  visible: boolean;
};

export function PresentProgressBar({ index, total, visible }: Props) {
  const pct = total > 0 ? (index + 1) / total : 0;
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 z-30 h-[2px] overflow-hidden bg-white/8',
        'motion-safe:transition-opacity motion-safe:duration-200',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      <div
        className="h-full w-full origin-left bg-[var(--brand,#e5484d)] transition-transform duration-200 ease-out"
        style={{ transform: `scaleX(${pct})` }}
      />
    </div>
  );
}
