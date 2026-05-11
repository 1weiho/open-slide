import { CheckCheck, Play, StopCircle, XCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useLocale } from '@/lib/use-locale';

export type AgentStatus = 'idle' | 'pending' | 'done' | 'error' | 'canceled';

type ActiveStatus = Exclude<AgentStatus, 'idle'>;

type SuperconnectorEvent = {
  runId: string;
  sessionId?: string;
  commentId: string;
  status: ActiveStatus;
  msgType: string;
  text: string;
};

type RunStatus = {
  status: ActiveStatus;
  sessionId?: string;
  error?: string;
  messages?: Array<{ text: string }>;
};

async function checkAgentAvailable(): Promise<boolean> {
  try {
    const res = await fetch('/__superconnector/available');
    if (!res.ok) return false;
    const data = (await res.json()) as { available?: boolean };
    return data.available === true;
  } catch {
    return false;
  }
}

async function startAgentRun(
  slideId: string,
  commentId: string,
  line: number,
  note: string,
): Promise<string> {
  const res = await fetch('/__superconnector/runs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slideId, commentId, line, note }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `agent run failed: ${res.status}`);
  }
  const data = (await res.json()) as { runId: string };
  return data.runId;
}

async function pollStatus(runId: string): Promise<RunStatus> {
  const res = await fetch(`/__superconnector/runs/${runId}`);
  if (!res.ok) throw new Error(`status poll failed: ${res.status}`);
  return (await res.json()) as RunStatus;
}

async function cancelAgentRun(runId: string): Promise<void> {
  const res = await fetch(`/__superconnector/runs/${runId}/cancel`, { method: 'POST' });
  if (!res.ok) throw new Error(`cancel failed: ${res.status}`);
}

export type AgentRuns = {
  available: boolean;
  statusOf: (commentId: string) => AgentStatus;
  logOf: (commentId: string) => string | undefined;
  run: (commentId: string, line: number, note: string) => Promise<void>;
  cancel: (commentId: string) => Promise<void>;
};

export function useAgentRuns(slideId: string, onDone: () => void | Promise<void>): AgentRuns {
  const t = useLocale();
  const [available, setAvailable] = useState(false);
  const [status, setStatusMap] = useState<Map<string, AgentStatus>>(new Map());
  const [log, setLogMap] = useState<Map<string, string>>(new Map());
  const [runs, setRunsMap] = useState<Map<string, string>>(new Map());
  const pollTimers = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  useEffect(() => {
    checkAgentAvailable().then(setAvailable);
  }, []);

  useEffect(() => {
    return () => {
      for (const timer of pollTimers.current.values()) clearInterval(timer);
    };
  }, []);

  const setStatus = useCallback((id: string, s: AgentStatus) => {
    setStatusMap((prev) => new Map(prev).set(id, s));
  }, []);

  const stopPolling = useCallback((id: string) => {
    const timer = pollTimers.current.get(id);
    if (timer !== undefined) {
      clearInterval(timer);
      pollTimers.current.delete(id);
    }
  }, []);

  const finishRun = useCallback(
    (commentId: string, s: ActiveStatus, text?: string) => {
      stopPolling(commentId);
      setStatus(commentId, s);
      if (text) setLogMap((prev) => new Map(prev).set(commentId, text));
      if (s === 'done') {
        toast.success(t.inspector.agentDone);
        void onDone();
      } else if (s === 'error') {
        toast.error(text ? `${t.inspector.agentError}: ${text}` : t.inspector.agentError);
      } else if (s === 'canceled') {
        toast(t.inspector.agentCanceled);
      }
    },
    [
      onDone,
      setStatus,
      stopPolling,
      t.inspector.agentCanceled,
      t.inspector.agentDone,
      t.inspector.agentError,
    ],
  );

  useEffect(() => {
    if (!import.meta.hot) return;
    const handler = (data: SuperconnectorEvent) => {
      const { commentId, msgType, status: s, text } = data;
      if (msgType === 'done') {
        finishRun(commentId, 'done');
      } else if (msgType === 'error') {
        finishRun(commentId, 'error', text);
      } else if (msgType === 'canceled') {
        finishRun(commentId, 'canceled');
      } else if (text) {
        setLogMap((prev) => new Map(prev).set(commentId, text));
        setStatus(commentId, s);
      }
    };
    import.meta.hot.on('open-slide:superconnector-event', handler);
    return () => import.meta.hot?.off('open-slide:superconnector-event', handler);
  }, [finishRun, setStatus]);

  const run = useCallback(
    async (commentId: string, line: number, note: string) => {
      setStatus(commentId, 'pending');
      toast(t.inspector.agentRunning, { icon: '▶' });
      let runId: string;
      try {
        runId = await startAgentRun(slideId, commentId, line, note);
        setRunsMap((prev) => new Map(prev).set(commentId, runId));
      } catch {
        setStatus(commentId, 'error');
        toast.error(t.inspector.agentError);
        return;
      }

      const timer = setInterval(async () => {
        try {
          const result = await pollStatus(runId);
          if (result.messages?.length) {
            const last = result.messages.at(-1);
            if (last?.text) setLogMap((prev) => new Map(prev).set(commentId, last.text));
          }
          if (result.status !== 'pending') {
            finishRun(commentId, result.status, result.error);
          }
        } catch {
          finishRun(commentId, 'error');
        }
      }, 2000);
      pollTimers.current.set(commentId, timer);
    },
    [finishRun, setStatus, slideId, t.inspector.agentError, t.inspector.agentRunning],
  );

  const cancel = useCallback(
    async (commentId: string) => {
      const runId = runs.get(commentId);
      if (!runId) return;
      try {
        await cancelAgentRun(runId);
      } catch {
        toast.error(t.inspector.agentError);
      }
    },
    [runs, t.inspector.agentError],
  );

  return {
    available,
    statusOf: (id) => status.get(id) ?? 'idle',
    logOf: (id) => log.get(id),
    run,
    cancel,
  };
}

export function AgentLogLine({ commentId, runs }: { commentId: string; runs: AgentRuns }) {
  const status = runs.statusOf(commentId);
  const text = runs.logOf(commentId);
  if (!text) return null;
  if (status !== 'pending' && status !== 'done') return null;
  return <div className="mt-1 truncate text-[10px] italic text-muted-foreground">{text}</div>;
}

export function AgentRunButton({
  commentId,
  line,
  note,
  runs,
}: {
  commentId: string;
  line: number;
  note: string;
  runs: AgentRuns;
}) {
  const t = useLocale();
  if (!runs.available) return null;
  const status = runs.statusOf(commentId);

  if (status === 'pending') {
    return (
      <button
        type="button"
        onClick={() => runs.cancel(commentId)}
        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        title={t.inspector.stopAgent}
        aria-label={t.inspector.stopAgent}
      >
        <StopCircle className="size-3.5" />
      </button>
    );
  }
  if (status === 'done') {
    return (
      <span role="img" aria-label={t.inspector.agentDone} className="rounded p-1 text-emerald-600">
        <CheckCheck className="size-3.5" />
      </span>
    );
  }
  if (status === 'error') {
    return (
      <button
        type="button"
        onClick={() => runs.run(commentId, line, note)}
        className="rounded p-1 text-red-600 hover:bg-muted"
        title={t.inspector.agentError}
      >
        <XCircle className="size-3.5" />
      </button>
    );
  }
  if (status === 'canceled') {
    return (
      <button
        type="button"
        onClick={() => runs.run(commentId, line, note)}
        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        title={t.inspector.agentCanceled}
      >
        <StopCircle className="size-3.5" />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => runs.run(commentId, line, note)}
      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      title={t.inspector.runWithAgent}
    >
      <Play className="size-3.5" />
    </button>
  );
}
