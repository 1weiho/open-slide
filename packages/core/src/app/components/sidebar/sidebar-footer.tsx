import config from 'virtual:open-slide/config';
import { useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, useLocale } from '@/lib/use-locale';

type UpdateCheck = { current: string; latest: string | null; outdated: boolean };

export function SidebarFooter() {
  const t = useLocale();
  const [update, setUpdate] = useState<UpdateCheck | null>(null);

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

  const versionRow = (
    <span className="inline-flex items-center gap-1.5">
      {update?.latest && <span className="size-1.5 rounded-full bg-brand" aria-hidden />}
      {label}
    </span>
  );

  return (
    <div className="px-4 py-3 text-[11px] text-muted-foreground/70 tabular-nums">
      {update?.latest ? (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>{versionRow}</TooltipTrigger>
            <TooltipContent side="top" sideOffset={6} className="max-w-56">
              {format(t.home.updateAvailable, { version: update.latest })}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        versionRow
      )}
    </div>
  );
}
