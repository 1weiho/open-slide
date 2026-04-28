import { Loader2 } from 'lucide-react';
import type { PdfExportProgress } from '../lib/export-pdf';
import { Progress } from './ui/progress';

export function PdfProgressToast({ progress }: { progress: PdfExportProgress }) {
  const text =
    progress.phase === 'processing'
      ? `Processing slide ${progress.current} / ${progress.total}`
      : progress.phase === 'printing'
        ? 'Opening print dialog…'
        : 'Done';

  return (
    <div className="flex w-80 items-start gap-3 rounded-md border bg-popover px-4 py-3 text-popover-foreground shadow-lg">
      <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">Exporting PDF</p>
        <p className="truncate text-xs text-muted-foreground">{text}</p>
        <Progress value={Math.round(progress.percent)} className="mt-2 h-1.5" />
      </div>
    </div>
  );
}
