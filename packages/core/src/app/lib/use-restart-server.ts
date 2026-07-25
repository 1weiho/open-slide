import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useLocale } from '@/lib/use-locale';

type ServerStatus = { executionId: string; canRestart: boolean };

async function fetchServerStatus(): Promise<ServerStatus | null> {
  const res = await fetch('/__server-status');
  if (!res.ok) return null;
  return (await res.json()) as ServerStatus;
}

export function useRestartServer() {
  const t = useLocale();
  const [canRestart, setCanRestart] = useState(false);
  const [restarting, setRestarting] = useState(false);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    let cancelled = false;
    fetchServerStatus()
      .then((status) => {
        if (!cancelled && status) setCanRestart(status.canRestart);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const restartServer = useCallback(async () => {
    if (restarting) return;
    setRestarting(true);
    try {
      const before = await fetchServerStatus();
      if (!before) throw new Error('server status unavailable');
      const res = await fetch('/__restart-server', { method: 'POST' });
      if (!res.ok) throw new Error('restart failed');
      // A different executionId means the replacement process is serving.
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
  }, [restarting, t.home.restartServerFailed]);

  return { canRestart, restarting, restartServer };
}
