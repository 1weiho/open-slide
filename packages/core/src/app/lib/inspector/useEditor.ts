import { useCallback } from 'react';

export type EditOp =
  | { kind: 'set-style'; key: string; value: string | null }
  | { kind: 'set-text'; value: string };

export class NoOpEditError extends Error {
  constructor() {
    super(
      'Edit completed but the source file did not change — the target JSX may already match, or the target element may not be directly editable here.',
    );
    this.name = 'NoOpEditError';
  }
}

export function useEditor(slideId: string) {
  const applyEdit = useCallback(
    async (line: number, column: number, ops: EditOp[]) => {
      const res = await fetch('/__edit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slideId, line, column, ops }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; changed?: boolean };
      if (!res.ok) {
        throw new Error(body.error ?? `POST /__edit → ${res.status}`);
      }
      if (body.changed === false) {
        throw new NoOpEditError();
      }
    },
    [slideId],
  );

  return { applyEdit };
}
