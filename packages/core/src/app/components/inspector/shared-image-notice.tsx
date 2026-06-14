import { TriangleAlert } from 'lucide-react';
import { format, useLocale } from '@/lib/use-locale';

export type SharedNotice = { instances: number; viaMap: boolean };

export function SharedImageNotice({ notice }: { notice: SharedNotice | null }) {
  const t = useLocale();
  if (!notice) return null;
  const message =
    notice.instances > 1
      ? format(t.inspector.sharedImageWarning, { count: notice.instances })
      : t.inspector.sharedImageWarningMap;
  return (
    <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-700 text-xs leading-relaxed dark:text-amber-400">
      <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>
        {message}
        <code className="rounded bg-amber-500/15 px-1 py-0.5 font-mono">/split-shared-images</code>
        {t.inspector.sharedImageHintSuffix}
      </span>
    </div>
  );
}
