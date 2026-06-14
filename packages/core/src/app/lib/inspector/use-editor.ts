import { useCallback } from 'react';

export type EditOp =
  | { kind: 'set-style'; key: string; value: string | null; prevText?: string }
  | { kind: 'set-text'; value: string; prevText?: string }
  | {
      kind: 'set-text-range-style';
      start: number;
      end: number;
      key: string;
      value: string | null;
      prevText?: string;
    }
  | { kind: 'set-attr-asset'; attr: string; assetPath: string; previewUrl: string }
  | { kind: 'replace-placeholder-with-image'; assetPath: string };

export type Edit = { line: number; column: number; ops: EditOp[] };

export type EditResult = { ok: boolean; error?: string };

export type ElementSharing = { instances: number; viaMap: boolean };

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
        results?: EditResult[];
      };
      if (!res.ok) {
        throw new Error(body.error ?? `POST /__edit/batch → ${res.status}`);
      }
      return body.results ?? [];
    },
    [slideId],
  );

  // Best-effort probe — the warning it feeds is advisory, so any
  // failure (old server, parse error) degrades to "no warning".
  const fetchElementSharing = useCallback(
    async (line: number, column: number): Promise<ElementSharing | null> => {
      try {
        const params = new URLSearchParams({
          slideId,
          line: String(line),
          column: String(column),
        });
        const res = await fetch(`/__edit/element-info?${params}`);
        if (!res.ok) return null;
        const body = (await res.json()) as ElementSharing;
        return typeof body.instances === 'number' && typeof body.viaMap === 'boolean' ? body : null;
      } catch {
        return null;
      }
    },
    [slideId],
  );

  return { applyEdit, applyEdits, fetchElementSharing };
}
