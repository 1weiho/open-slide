import { useCallback } from 'react';

export type EditOp =
  | { kind: 'set-style'; key: string; value: string | null }
  | { kind: 'set-text'; value: string }
  | { kind: 'set-attr-asset'; attr: string; assetPath: string; previewUrl: string }
  | { kind: 'replace-placeholder-with-image'; assetPath: string };

export type Edit = { line: number; column: number; ops: EditOp[] };

export type EditResult = { ok: boolean; error?: string };

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

  // Batch many element edits into one file write and one HMR tick.
  // Returns one result per input edit so callers can keep failed
  // edits buffered while clearing the ones that landed.
  const applyEdits = useCallback(
    async (edits: Edit[]): Promise<EditResult[]> => {
      if (edits.length === 0) return [];
      const res = await fetch('/__edit/batch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slideId, edits }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        changed?: boolean;
        results?: EditResult[];
      };
      if (!res.ok) {
        throw new Error(body.error ?? `POST /__edit/batch → ${res.status}`);
      }
      const results = body.results;
      if (!Array.isArray(results) || results.length !== edits.length) {
        throw new Error('malformed /__edit/batch response');
      }
      return results;
    },
    [slideId],
  );

  return { applyEdit, applyEdits };
}
