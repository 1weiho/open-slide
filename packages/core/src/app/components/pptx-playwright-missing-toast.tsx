import { CircleAlert, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useLocale } from '@/lib/use-locale';

export function PptxPlaywrightMissingToast({
  command,
  toastId,
}: {
  command: string;
  toastId: string;
}) {
  const t = useLocale();
  return (
    <div className="inline-flex items-start gap-3 rounded-[8px] border border-border bg-popover px-3.5 py-3 text-popover-foreground shadow-floating">
      <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
      <div className="min-w-0">
        <div className="flex items-center gap-3 whitespace-nowrap">
          <p className="font-heading text-[12.5px] font-semibold tracking-tight">
            {t.slide.pptxPlaywrightMissing}
          </p>
          <button
            type="button"
            onClick={() => {
              // Clipboard API may be absent (insecure context); the ?. then
              // yields undefined, so guard before chaining. Only report success
              // once the copy actually resolves.
              const copied = navigator.clipboard?.writeText(command);
              if (!copied) return;
              copied
                .then(() => {
                  toast.success(t.common.copyCommand, { duration: 1500 });
                  toast.dismiss(toastId);
                })
                .catch(() => {});
            }}
            className="inline-flex shrink-0 items-center gap-1 rounded border border-border bg-background px-2 py-0.5 font-mono text-[10.5px] tracking-[0.04em] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Copy className="size-3" />
            {t.common.copyCommand}
          </button>
        </div>
        <code className="mt-2 block break-all rounded bg-muted px-2 py-1.5 font-mono text-[11px] leading-snug text-foreground">
          {command}
        </code>
      </div>
    </div>
  );
}
