import { cn } from '@/lib/utils';
import type { FolderIcon } from '../../lib/sdk';
import { FolderIconChip } from './folder-item';

export function MobileFolderPill({
  icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: FolderIcon;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-[5px] border px-2.5 py-1 text-[11.5px] font-medium transition-colors',
        active
          ? 'border-foreground/40 bg-foreground text-background'
          : 'border-border bg-card text-muted-foreground hover:text-foreground',
      )}
    >
      <FolderIconChip icon={icon} className="size-3.5 text-sm" />
      <span className="max-w-[8rem] truncate">{label}</span>
      <span className="folio nums">{count.toString().padStart(2, '0')}</span>
    </button>
  );
}
