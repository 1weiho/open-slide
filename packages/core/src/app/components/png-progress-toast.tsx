/**
 * Toast component that renders the progress of a multi-page PNG export.
 *
 * Mirrors the visual treatment and contract of `pdf-progress-toast.tsx` so
 * both the PDF and PNG exporters can reuse the same progress rendering pattern.
 * Displays the current phase (processing, rasterising, zipping, done) with
 * localized text and a progress bar.
 *
 * @agents-index PNG export progress toast — mirrors PDF progress toast.
 */

import { Loader2 } from 'lucide-react';
import { format, useLocale } from '@/lib/use-locale';
import type { PngExportProgress } from '../lib/export-png';
import { Progress } from './ui/progress';

/**
 * Render the progress state of a multi-page PNG export (processing, rasterising,
 * zipping, done) with localized text and a progress bar. Reuses the same visual
 * treatment as the PDF exporter so authors see consistent progress feedback
 * across all export pathways.
 */
export function PngProgressToast({ progress }: { progress: PngExportProgress }) {
  const t = useLocale();
  const text =
    progress.phase === 'processing'
      ? format(t.pngToast.processing, {
          current: progress.current.toString().padStart(2, '0'),
          total: progress.total.toString().padStart(2, '0'),
        })
      : progress.phase === 'rasterising'
        ? format(t.pngToast.rasterising, {
            current: progress.current.toString().padStart(2, '0'),
            total: progress.total.toString().padStart(2, '0'),
          })
        : progress.phase === 'zipping'
          ? t.pngToast.zipping
          : t.pngToast.done;

  return (
    <div className="flex w-80 items-start gap-3 rounded-[8px] border border-border bg-popover px-3.5 py-3 text-popover-foreground shadow-floating">
      <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin text-brand" />
      <div className="min-w-0 flex-1">
        <p className="font-heading text-[12.5px] font-semibold tracking-tight">
          {t.pngToast.title}
        </p>
        <p className="truncate font-mono text-[10.5px] tracking-[0.04em] text-muted-foreground">
          {text}
        </p>
        <Progress value={Math.round(progress.percent)} className="mt-2 h-[3px]" />
      </div>
    </div>
  );
}
