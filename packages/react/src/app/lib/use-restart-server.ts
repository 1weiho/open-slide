import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { toast } from 'sonner';
import { useLocale } from '@/lib/use-locale';

type ServerStatus = { executionId: string; canRestart: boolean };

async function fetchServerStatus(): Promise<ServerStatus | null> {
  const res = await fetch('/__server-status');
  if (!res.ok) return null;
  return (await res.json()) as ServerStatus;
}

// Module scope, not per-hook state: the sidebar footer and the command menu can
// both be mounted, and each firing its own POST plus polling loop would race.
let state = { canRestart: false, restarting: false };
let statusProbed = false;
let inFlight: Promise<boolean> | null = null;
const listeners = new Set<() => void>();

function setState(next: Partial<typeof state>): void {
  state = { ...state, ...next };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): typeof state {
  return state;
}

async function performRestart(): Promise<boolean> {
  const before = await fetchServerStatus();
  if (!before) return false;
  const res = await fetch('/__restart-server', { method: 'POST' });
  if (!res.ok) return false;
  // A different executionId means the replacement process is serving.
  for (let attempt = 0; attempt < 30; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const status = await fetchServerStatus().catch(() => null);
    if (status && status.executionId !== before.executionId) {
      window.location.reload();
      return true;
    }
  }
  return false;
}

export function useRestartServer() {
  const t = useLocale();
  const { canRestart, restarting } = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (!import.meta.env.DEV || statusProbed) return;
    statusProbed = true;
    fetchServerStatus()
      .then((status) => {
        if (status) setState({ canRestart: status.canRestart });
      })
      .catch(() => {});
  }, []);

  const restartServer = useCallback(async () => {
    if (inFlight) return;
    inFlight = performRestart().catch(() => false);
    setState({ restarting: true });
    const restarted = await inFlight;
    inFlight = null;
    setState({ restarting: false });
    if (!restarted) toast.error(t.home.restartServerFailed);
  }, [t.home.restartServerFailed]);

  return { canRestart, restarting, restartServer };
}
