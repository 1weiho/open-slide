import config from 'virtual:open-slide/config';
import { Loader2, RefreshCw, RotateCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, useLocale } from '@/lib/use-locale';

type UpdateCheck = { current: string; latest: string | null; outdated: boolean };
type ServerStatus = { executionId: string; canRestart: boolean };
type UpdateStatus = 'idle' | 'running' | 'done' | 'error';

const buttonClassName =
  'h-6 w-fit rounded-[5px] border border-background/15 bg-background/8 px-2 text-[11px] text-background shadow-none hover:bg-background/14';

async function fetchServerStatus(): Promise<ServerStatus | null> {
  const res = await fetch('/__server-status');
  if (!res.ok) return null;
  return (await res.json()) as ServerStatus;
}

export function SidebarFooter() {
  const t = useLocale();
  const [update, setUpdate] = useState<UpdateCheck | null>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const [canRestart, setCanRestart] = useState(false);
  const [restarting, setRestarting] = useState(false);
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
    fetchServerStatus()
      .then((status) => {
        if (!cancelled && status) setCanRestart(status.canRestart);
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

  async function restartServer() {
    if (restarting) return;
    setRestarting(true);
    try {
      const before = await fetchServerStatus();
      if (!before) throw new Error('server status unavailable');
      const res = await fetch('/__restart-server', { method: 'POST' });
      if (!res.ok) throw new Error('restart failed');
      for (let attempt = 0; attempt < 30; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const status = await fetchServerStatus().catch(() => null);
        if (status && status.executionId !== before.executionId) {
          window.location.reload();
          return;
        }
      }
      throw new Error('restart timed out');
    } catch {
      setRestarting(false);
      toast.error(t.home.restartServerFailed);
    }
  }

  const versionRow = (
    <span className="inline-flex cursor-default items-center gap-1.5">
      {update?.latest && <span className="size-1.5 rounded-full bg-brand" aria-hidden />}
      {label}
    </span>
  );

  return (
    <div className="px-4 py-3 text-[11px] text-muted-foreground/70 tabular-nums">
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
                        <Loader2 className="animate-spin" aria-hidden />
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
                      <Loader2 className="animate-spin" aria-hidden />
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
    </div>
  );
}
