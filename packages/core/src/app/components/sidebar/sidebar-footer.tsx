import config from 'virtual:open-slide/config';
import { Loader2, RefreshCw, RotateCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, useLocale } from '@/lib/use-locale';
import { useRestartServer } from '@/lib/use-restart-server';

type UpdateCheck = { current: string; latest: string | null; outdated: boolean };
type UpdateStatus = 'idle' | 'running' | 'done' | 'error';

const buttonClassName =
  'h-6 w-fit rounded-[5px] border border-background/15 bg-background/8 px-2 text-[11px] text-background shadow-none hover:bg-background/14';

export function SidebarFooter() {
  const t = useLocale();
  const [update, setUpdate] = useState<UpdateCheck | null>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const { canRestart, restarting, restartServer } = useRestartServer();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    let cancelled = false;
    fetch('/__update-check')
      .then((res) => (res.ok ? (res.json() as Promise<UpdateCheck>) : null))
      .then((data) => {
        if (!cancelled && data?.outdated) setUpdate(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const label = `v${config.version}`;
  const isUpdating = updateStatus === 'running';
  const keepOpen = updateStatus === 'running' || restarting;

  async function updatePackage() {
    if (isUpdating) return;
    setUpdateStatus('running');
    setOpen(true);
    try {
      const res = await fetch('/__update-package', { method: 'POST' });
      if (!res.ok) throw new Error('update failed');
      setUpdateStatus('done');
      toast.success(t.home.updatePackageDone);
    } catch {
      setUpdateStatus('error');
      toast.error(t.home.updatePackageFailed);
    }
  }

  const versionRow = update?.latest ? (
    // Real button: the tooltip holds actionable controls, so keyboard users
    // must be able to reach and open it.
    <button
      type="button"
      className="inline-flex cursor-default items-center gap-1.5 rounded-[3px] outline-none focus-visible:ring-1 focus-visible:ring-brand"
    >
      <span className="size-1.5 rounded-full bg-brand" aria-hidden />
      {label}
    </button>
  ) : (
    <span className="inline-flex cursor-default items-center gap-1.5">{label}</span>
  );

  return (
    <div className="flex items-center justify-between gap-2 py-1.5 pr-2 pl-4 text-[11px] text-muted-foreground/70 tabular-nums">
      {update?.latest ? (
        <TooltipProvider delay={200}>
          <Tooltip
            open={open}
            onOpenChange={(next) => {
              if (!next && keepOpen) return;
              setOpen(next);
            }}
          >
            <TooltipTrigger render={versionRow} />
            <TooltipContent
              side="top"
              align="start"
              alignOffset={-8}
              sideOffset={9}
              collisionPadding={12}
              className="flex w-[232px] max-w-[calc(100vw-24px)] flex-col gap-2.5 rounded-[8px] border border-background/10 bg-foreground/95 p-2.5 text-[11.5px] leading-4 shadow-[0_12px_32px_oklch(0_0_0/0.28)] backdrop-blur"
            >
              {updateStatus === 'done' ? (
                <>
                  <span className="pr-1 text-background/92">{t.home.updatePackageDone}</span>
                  {canRestart && (
                    <Button
                      type="button"
                      size="xs"
                      variant="secondary"
                      className={buttonClassName}
                      disabled={restarting}
                      onClick={restartServer}
                    >
                      {restarting ? (
                        <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden />
                      ) : (
                        <RotateCw aria-hidden />
                      )}
                      {restarting ? t.home.restartingServer : t.home.restartServer}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <span className="pr-1 text-background/92">
                    {format(t.home.updateAvailable, { version: update.latest })}
                  </span>
                  <Button
                    type="button"
                    size="xs"
                    variant="secondary"
                    className={buttonClassName}
                    disabled={isUpdating}
                    onClick={updatePackage}
                  >
                    {isUpdating ? (
                      <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden />
                    ) : (
                      <RefreshCw aria-hidden />
                    )}
                    {isUpdating ? t.home.updatingPackage : t.home.updatePackage}
                  </Button>
                  {updateStatus === 'error' && (
                    <span className="text-[11px] leading-4 text-background/65">
                      {t.home.updatePackageFailed}
                    </span>
                  )}
                </>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        versionRow
      )}
      <div className="flex shrink-0 items-center">
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </div>
  );
}
