import { useCallback, useEffect, useState } from 'react';

export type SlideComment = {
  id: string;
  line: number;
  ts: string;
  note: string;
  hint?: string;
};

type ListResponse = { comments: SlideComment[] };

export function useComments(deckId: string) {
  const [comments, setComments] = useState<SlideComment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!deckId) return;
    try {
      const res = await fetch(`/__comments?deckId=${encodeURIComponent(deckId)}`);
      if (!res.ok) {
        setError(`GET /__comments → ${res.status}`);
        return;
      }
      const data = (await res.json()) as ListResponse;
      setComments(data.comments);
      setError(null);
    } catch (e) {
      setError(String((e as Error).message ?? e));
    }
  }, [deckId]);

  const add = useCallback(
    async (line: number, column: number, text: string) => {
      const res = await fetch('/__comments/add', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ deckId, line, column, text }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `POST /__comments/add → ${res.status}`);
      }
      await refetch();
    },
    [deckId, refetch],
  );

  const remove = useCallback(
    async (id: string) => {
      const res = await fetch(`/__comments/${id}?deckId=${encodeURIComponent(deckId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`DELETE /__comments/${id} → ${res.status}`);
      await refetch();
    },
    [deckId, refetch],
  );

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!import.meta.hot) return;
    const handler = () => refetch();
    import.meta.hot.on('vite:afterUpdate', handler);
    return () => {
      import.meta.hot?.off('vite:afterUpdate', handler);
    };
  }, [refetch]);

  return { comments, error, refetch, add, remove };
}
