import { Loader2 } from 'lucide-react';
import { format, useLocale } from '@/lib/use-locale';
import type { PptxExportProgress } from '../lib/export-pptx';
import { Progress } from './ui/progress';

export function PptxProgressToast({ progress }: { progress: PptxExportProgress }) {
  const t = useLocale();
  const text =
    progress.phase === 'processing'
      ? format(t.pptxToast.processing, {
          current: progress.current.toString().padStart(2, '0'),
          total: progress.total.toString().padStart(2, '0'),
        })
      : progress.phase === 'generating'
        ? t.pptxToast.generating
        : t.pptxToast.done;

  return (
    <div className="flex w-80 items-start gap-3 rounded-[8px] border border-border bg-popover px-3.5 py-3 text-popover-foreground shadow-floating">
      <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin text-brand" />
      <div className="min-w-0 flex-1">
        <p className="font-heading text-[12.5px] font-semibold tracking-tight">
          {t.pptxToast.title}
        </p>
        <p className="truncate font-mono text-[10.5px] tracking-[0.04em] text-muted-foreground">
          {text}
        </p>
        <Progress value={Math.round(progress.percent)} className="mt-2 h-[3px]" />
      </div>
    </div>
  );
}
