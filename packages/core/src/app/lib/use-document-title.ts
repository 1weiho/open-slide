import { useEffect } from 'react';

export const DEFAULT_DOCUMENT_TITLE = 'open-slide';

export function resolveDocumentTitle(title?: string): string {
  return title?.trim() || DEFAULT_DOCUMENT_TITLE;
}

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = resolveDocumentTitle(title);
    return () => {
      document.title = DEFAULT_DOCUMENT_TITLE;
    };
  }, [title]);
}
