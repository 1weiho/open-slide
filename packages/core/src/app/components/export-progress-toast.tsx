import { Check, Loader2 } from 'lucide-react';
import { format, useLocale } from '@/lib/use-locale';
import { pad2 } from '@/lib/utils';
import type { PdfExportProgress } from '../lib/export-pdf';
import type { PptxExportProgress } from '../lib/export-pptx';
import { Progress } from './ui/progress';

function ExportProgressToast({
  title,
  text,
  done,
  percent,
}: {
  title: string;
  text: string;
  done: boolean;
  percent: number;
}) {
  return (
    <div className="flex w-80 items-start gap-3 rounded-[8px] border border-border bg-popover px-3.5 py-3 text-popover-foreground shadow-floating">
      {done ? (
        <Check className="mt-0.5 size-3.5 shrink-0 text-[oklch(0.55_0.13_165)]" strokeWidth={2.5} />
      ) : (
        <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin text-brand motion-reduce:animate-none" />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-heading text-[12.5px] font-semibold tracking-tight">{title}</p>
        <p className="nums truncate font-mono text-[10.5px] tracking-[0.04em] text-muted-foreground">
          {text}
        </p>
        <Progress value={Math.round(percent)} className="mt-2 h-[3px]" />
      </div>
    </div>
  );
}

function pageCounts(progress: { current: number; total: number }) {
  return {
    current: pad2(progress.current),
    total: pad2(progress.total),
  };
}

export function PdfProgressToast({ progress }: { progress: PdfExportProgress }) {
  const t = useLocale();
  const text =
    progress.phase === 'processing'
      ? format(t.pdfToast.processing, pageCounts(progress))
      : progress.phase === 'printing'
        ? t.pdfToast.printing
        : t.pdfToast.done;

  return (
    <ExportProgressToast
      title={t.pdfToast.title}
      text={text}
      done={progress.phase === 'done'}
      percent={progress.percent}
    />
  );
}

export function PptxProgressToast({ progress }: { progress: PptxExportProgress }) {
  const t = useLocale();
  const text =
    progress.phase === 'processing'
      ? format(t.pptxToast.processing, pageCounts(progress))
      : progress.phase === 'generating'
        ? t.pptxToast.generating
        : t.pptxToast.done;

  return (
    <ExportProgressToast
      title={t.pptxToast.title}
      text={text}
      done={progress.phase === 'done'}
      percent={progress.percent}
    />
  );
}
