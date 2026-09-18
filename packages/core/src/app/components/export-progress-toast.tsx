import { AlertTriangle, Check, Download, Loader2, RotateCcw, X } from 'lucide-react';
import { format, plural, useLocale } from '@/lib/use-locale';
import { pad2 } from '@/lib/utils';
import type { PdfExportProgress } from '../lib/export-pdf';
import type { PptxExportProgress } from '../lib/export-pptx';
import type {
  EditablePptxProgress,
  EditablePptxQuality,
  EditablePptxReport,
  PptxDiagnostic,
} from '../lib/pptx/model';
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

export type EditablePptxToastStatus = 'active' | 'success' | 'failed' | 'cancelled';

export function EditablePptxProgressToast({
  progress,
  status,
  diagnostics = [],
  report,
  errorMessage,
  onCancel,
  onRetry,
  onDownloadDiagnostics,
  diagnosticsExpanded = false,
  onToggleDiagnostics,
  onDismiss,
}: {
  progress: EditablePptxProgress;
  status: EditablePptxToastStatus;
  diagnostics?: PptxDiagnostic[];
  report?: EditablePptxReport;
  errorMessage?: string;
  onCancel?: () => void;
  onRetry?: () => void;
  onDownloadDiagnostics?: () => void;
  diagnosticsExpanded?: boolean;
  onToggleDiagnostics?: () => void;
  onDismiss?: () => void;
}) {
  const t = useLocale();
  const errors = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length;
  const warnings = diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length;
  const counts = pageCounts(progress);
  const quality = report?.quality;
  const hasDetails = diagnostics.length > 0 || quality !== undefined;
  const canDownloadReport = report !== undefined || diagnostics.length > 0;

  const text =
    status === 'success'
      ? t.editablePptxToast.generated
      : status === 'failed'
        ? t.editablePptxToast.failed
        : status === 'cancelled'
          ? t.editablePptxToast.cancelled
          : progress.phase === 'preparing'
            ? format(t.editablePptxToast.preparing, counts)
            : progress.phase === 'processing'
              ? format(t.editablePptxToast.processing, counts)
              : format(t.editablePptxToast.generating, counts);

  const done = status !== 'active';
  const icon =
    status === 'failed' ? (
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-destructive" strokeWidth={2.25} />
    ) : status === 'cancelled' ? (
      <X className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" strokeWidth={2.25} />
    ) : done ? (
      <Check className="mt-0.5 size-3.5 shrink-0 text-[oklch(0.55_0.13_165)]" strokeWidth={2.5} />
    ) : (
      <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin text-brand motion-reduce:animate-none" />
    );

  return (
    <div
      role={status === 'failed' ? 'alert' : undefined}
      className="flex max-h-[calc(100dvh-2rem)] w-[min(22rem,calc(100vw-2rem))] items-start gap-3 overflow-y-auto rounded-[8px] border border-border bg-popover px-3.5 py-3 text-popover-foreground shadow-floating"
    >
      {icon}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className="min-w-0 flex-1 font-heading text-[12.5px] font-semibold tracking-tight">
            {t.editablePptxToast.title}
          </p>
          {done && onDismiss && (
            <button
              type="button"
              aria-label={t.common.close}
              className="-mr-1 -mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-[4px] text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
              onClick={onDismiss}
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <p className="nums font-mono text-[10.5px] tracking-[0.02em] text-muted-foreground">
          {text}
        </p>
        {errorMessage && status === 'failed' && (
          <p className="mt-1 text-[11px] leading-snug text-destructive/90">{errorMessage}</p>
        )}
        {quality && <EditablePptxQualitySummary quality={quality} />}
        {status === 'active' && (
          <Progress value={Math.round(progress.percent)} className="mt-2 h-[3px]" />
        )}
        {hasDetails && (
          <EditablePptxDetails
            diagnostics={diagnostics}
            quality={quality}
            errors={errors}
            warnings={warnings}
            expanded={diagnosticsExpanded}
            onToggle={onToggleDiagnostics}
          />
        )}
        {status !== 'success' && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {status === 'active' && onCancel && (
              <button
                type="button"
                className="inline-flex h-6 items-center gap-1 rounded-[5px] border border-border bg-card px-2 text-[11px] font-medium text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40"
                onClick={onCancel}
              >
                <X className="size-3" />
                {t.common.cancel}
              </button>
            )}
            {status !== 'active' && onRetry && (
              <button
                type="button"
                className="inline-flex h-6 items-center gap-1 rounded-[5px] border border-border bg-card px-2 text-[11px] font-medium text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40"
                onClick={onRetry}
              >
                <RotateCcw className="size-3" />
                {t.common.tryAgain}
              </button>
            )}
            {canDownloadReport && onDownloadDiagnostics && (
              <button
                type="button"
                className="inline-flex h-6 items-center gap-1 rounded-[5px] px-2 text-[11px] font-medium text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
                onClick={onDownloadDiagnostics}
              >
                <Download className="size-3" />
                {t.editablePptxToast.downloadDiagnostics}
              </button>
            )}
          </div>
        )}
        {status === 'success' && onDownloadDiagnostics && canDownloadReport && (
          <button
            type="button"
            className="mt-2 inline-flex h-6 items-center gap-1 rounded-[5px] px-2 text-[11px] font-medium text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
            onClick={onDownloadDiagnostics}
          >
            <Download className="size-3" />
            {t.editablePptxToast.downloadDiagnostics}
          </button>
        )}
      </div>
    </div>
  );
}

function EditablePptxDetails({
  diagnostics,
  quality,
  errors,
  warnings,
  expanded,
  onToggle,
}: {
  diagnostics: PptxDiagnostic[];
  quality?: EditablePptxQuality;
  errors: number;
  warnings: number;
  expanded: boolean;
  onToggle?: () => void;
}) {
  const t = useLocale();
  const hasQuality = quality !== undefined;
  const countText = [
    errors > 0 && format(plural(errors, t.editablePptxToast.errors), { count: errors }),
    warnings > 0 && format(plural(warnings, t.editablePptxToast.warnings), { count: warnings }),
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="mt-2 border-t border-hairline pt-2">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-expanded={expanded}
          className="text-left text-[11px] font-medium text-foreground/80 underline decoration-foreground/20 underline-offset-2 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          onClick={onToggle}
        >
          {expanded
            ? hasQuality
              ? t.editablePptxToast.hideQualityDetails
              : t.editablePptxToast.hideDiagnostics
            : hasQuality
              ? t.editablePptxToast.showQualityDetails
              : t.editablePptxToast.showDiagnostics}
        </button>
        {countText && (
          <span className="shrink-0 text-[10px] text-muted-foreground">{countText}</span>
        )}
      </div>
      {expanded && (
        <div className="mt-2 max-h-48 space-y-2 overflow-y-auto pr-1">
          {quality && <EditablePptxQualityDetails quality={quality} />}
          {diagnostics.map((diagnostic) => (
            <div
              key={`${diagnostic.code}-${diagnostic.page}-${diagnostic.source}-${diagnostic.message}`}
              className="rounded-[5px] bg-muted/50 px-2 py-1.5 text-[10.5px] leading-snug"
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-medium text-foreground/85">
                <span
                  className={
                    diagnostic.severity === 'error'
                      ? 'text-destructive'
                      : 'text-amber-700 dark:text-amber-300'
                  }
                >
                  {diagnostic.severity === 'error'
                    ? t.editablePptxToast.errorLabel
                    : t.editablePptxToast.warningLabel}
                </span>
                <span className="text-muted-foreground">
                  {diagnostic.page > 0
                    ? format(t.editablePptxToast.page, { page: diagnostic.page })
                    : t.editablePptxToast.deck}
                </span>
              </div>
              <dl className="mt-1 space-y-0.5 text-[10px] text-muted-foreground">
                <div className="flex gap-1.5">
                  <dt className="shrink-0">{t.editablePptxToast.reason}:</dt>
                  <dd className="text-foreground/80">{diagnostic.message}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="shrink-0">{t.editablePptxToast.impact}:</dt>
                  <dd>{diagnosticImpact(diagnostic, t.editablePptxToast)}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="shrink-0">{t.editablePptxToast.source}:</dt>
                  <dd className="break-all font-mono">{diagnostic.source}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="shrink-0">{t.editablePptxToast.code}:</dt>
                  <dd className="break-all font-mono">{diagnostic.code}</dd>
                </div>
                {diagnostic.suggestion && (
                  <div className="flex gap-1.5">
                    <dt className="shrink-0">{t.editablePptxToast.suggestion}:</dt>
                    <dd>{diagnostic.suggestion}</dd>
                  </div>
                )}
              </dl>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EditablePptxQualitySummary({ quality }: { quality: EditablePptxQuality }) {
  const t = useLocale();
  const totals = quality.totals;
  const pageCount = Array.isArray(quality.pages) ? quality.pages.length : undefined;
  const counts = [
    qualityCount(pageCount, t.editablePptxToast.pages),
    qualityCount(totals.text, t.editablePptxToast.text),
    qualityCount(totals.tables, t.editablePptxToast.tables),
    qualityCount(totals.sourceImages, t.editablePptxToast.sourceImages),
    qualityCount(totals.shapes, t.editablePptxToast.shapes),
    qualityCount(totals.groupContainers, t.editablePptxToast.groups),
  ].filter((value): value is string => value !== undefined);
  const notices = [
    positiveQualityCount(totals.fontSubstitutionSources, t.editablePptxToast.fontSubstitutions),
    positiveQualityCount(
      totals.vectorApproximationSources,
      t.editablePptxToast.vectorApproximations,
    ),
    positiveQualityCount(totals.skippedGroups, t.editablePptxToast.skippedGroups),
  ].filter((value): value is string => value !== undefined);

  return (
    <div
      data-testid="editable-pptx-quality-summary"
      className="mt-2 rounded-[5px] bg-muted/45 px-2.5 py-2 text-[10.5px] leading-snug"
    >
      <p className="font-medium text-foreground/85">{t.editablePptxToast.qualitySummary}</p>
      {counts.length > 0 && <p className="mt-0.5 text-muted-foreground">{counts.join(' · ')}</p>}
      {notices.length > 0 && (
        <ul className="mt-1 space-y-0.5 text-amber-700 dark:text-amber-300">
          {notices.map((notice) => (
            <li key={notice}>• {notice}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function qualityCount(value: number | undefined, forms: { one: string; other: string }) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return format(plural(value, forms), { count: value });
}

function positiveQualityCount(value: number | undefined, forms: { one: string; other: string }) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return undefined;
  return qualityCount(value, forms);
}

function EditablePptxQualityDetails({ quality }: { quality: EditablePptxQuality }) {
  const t = useLocale();
  const pages = Array.isArray(quality.pages) ? quality.pages : [];
  const fonts = Array.isArray(quality.fonts) ? quality.fonts : [];

  return (
    <div className="space-y-2">
      <p className="text-[10.5px] font-medium text-foreground/85">
        {t.editablePptxToast.qualityDetailHeading}
      </p>
      {(quality.recipientFonts === 'unknown' || quality.windows === 'not-verified') && (
        <ul className="space-y-0.5 text-[10px] text-muted-foreground">
          {quality.recipientFonts === 'unknown' && (
            <li>• {t.editablePptxToast.recipientFontsUnknown}</li>
          )}
          {quality.windows === 'not-verified' && (
            <li>• {t.editablePptxToast.windowsNotVerified}</li>
          )}
        </ul>
      )}
      {pages.map((page) => {
        if (typeof page.index !== 'number' || !Number.isFinite(page.index)) return null;
        return (
          <div key={`quality-page-${page.index}`} className="rounded-[5px] bg-muted/50 px-2 py-1.5">
            <p className="font-medium text-foreground/85">
              {format(t.editablePptxToast.page, { page: page.index + 1 })}
            </p>
            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
              <QualityDetailCount
                value={page.logicalSources}
                label={t.editablePptxToast.sourceItems}
              />
              <QualityDetailCount
                value={page.irLeafObjects}
                label={t.editablePptxToast.sourceObjects}
              />
              <QualityDetailCount
                value={page.nativeLeafObjects}
                label={t.editablePptxToast.editableObjects}
              />
              <QualityDetailCount
                value={page.writerExtraObjects}
                label={t.editablePptxToast.generatedParts}
              />
              <QualityDetailCount
                value={page.groupContainers}
                label={t.editablePptxToast.groupContainers}
              />
              <QualityDetailCount value={page.text} label={t.editablePptxToast.text} />
              <QualityDetailCount value={page.tables} label={t.editablePptxToast.tables} />
              <QualityDetailCount value={page.shapes} label={t.editablePptxToast.shapes} />
              <QualityDetailCount
                value={page.sourceImages}
                label={t.editablePptxToast.sourceImages}
              />
              <QualityDetailCount
                value={page.vectorApproximationSources}
                label={t.editablePptxToast.vectorApproximationSources}
              />
              <QualityDetailCount
                value={page.skippedGroups}
                label={t.editablePptxToast.skippedGroups}
              />
              <QualityDetailCount
                value={page.fontSubstitutionSources}
                label={t.editablePptxToast.fontSubstitutionSources}
              />
            </div>
          </div>
        );
      })}
      {fonts.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10.5px] font-medium text-foreground/85">
            {t.editablePptxToast.fontDetails}
          </p>
          {fonts.map((font) => (
            <EditablePptxFontDetail key={JSON.stringify(font)} font={font} />
          ))}
        </div>
      )}
    </div>
  );
}

function QualityDetailCount({
  value,
  label,
}: {
  value: number | undefined;
  label: string | { one: string; other: string };
}) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (typeof label !== 'string') {
    return <span>{format(plural(value, label), { count: value })}</span>;
  }
  return (
    <span>
      <span className="font-mono tabular-nums text-foreground/80">{value}</span> {label}
    </span>
  );
}

function EditablePptxFontDetail({ font }: { font: EditablePptxQuality['fonts'][number] }) {
  const t = useLocale();
  const requested = Array.isArray(font.requested) ? font.requested.filter(Boolean).join(', ') : '';
  const reasons = Array.isArray(font.reasons) ? font.reasons.filter(Boolean).join(', ') : '';
  const layoutStatus = font.layout?.status;
  const impact = font.substituted
    ? layoutStatus === 'unsafe'
      ? t.editablePptxToast.fontUnsafeImpact
      : t.editablePptxToast.fontSubstitutionImpact
    : t.editablePptxToast.fontPreservedImpact;

  return (
    <div className="rounded-[5px] bg-muted/50 px-2 py-1.5 text-[10.5px] leading-snug">
      <p className="font-medium text-foreground/85">
        {typeof font.page === 'number' && Number.isFinite(font.page)
          ? format(t.editablePptxToast.page, { page: font.page })
          : t.editablePptxToast.deck}{' '}
        · <span className="break-all font-mono">{font.source}</span>
      </p>
      <dl className="mt-1 space-y-0.5 text-[10px] text-muted-foreground">
        {requested && (
          <div className="flex gap-1.5">
            <dt className="shrink-0">{t.editablePptxToast.requestedFont}:</dt>
            <dd className="break-words">{requested}</dd>
          </div>
        )}
        {font.resolved && (
          <div className="flex gap-1.5">
            <dt className="shrink-0">{t.editablePptxToast.resolvedFont}:</dt>
            <dd className="break-words">{font.resolved}</dd>
          </div>
        )}
        {reasons && (
          <div className="flex gap-1.5">
            <dt className="shrink-0">{t.editablePptxToast.reason}:</dt>
            <dd>{reasons}</dd>
          </div>
        )}
        <div className="flex gap-1.5">
          <dt className="shrink-0">{t.editablePptxToast.impact}:</dt>
          <dd>{impact}</dd>
        </div>
        {font.substituted && (
          <div className="flex gap-1.5">
            <dt className="shrink-0">{t.editablePptxToast.suggestion}:</dt>
            <dd>{t.editablePptxToast.fontSubstitutionSuggestion}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function diagnosticImpact(
  diagnostic: PptxDiagnostic,
  copy: {
    diagnosticErrorImpact: string;
    diagnosticWarningImpact: string;
    groupSkippedImpact: string;
    vectorApproximationImpact: string;
    fontSubstitutionImpact: string;
  },
) {
  if (diagnostic.code.startsWith('group-skipped-')) return copy.groupSkippedImpact;
  if (/(?:vector-approximation|shadow-bands)/.test(diagnostic.code)) {
    return copy.vectorApproximationImpact;
  }
  if (diagnostic.code.toLowerCase().includes('font')) return copy.fontSubstitutionImpact;
  return diagnostic.severity === 'error'
    ? copy.diagnosticErrorImpact
    : copy.diagnosticWarningImpact;
}
