import { describe, expect, it } from 'vitest';
import { DEFAULT_DOCUMENT_TITLE, resolveDocumentTitle } from './use-document-title.ts';

describe('resolveDocumentTitle', () => {
  it('uses the deck title', () => {
    expect(resolveDocumentTitle('Quarterly Product Review')).toBe('Quarterly Product Review');
  });

  it('falls back when the deck has no title', () => {
    expect(resolveDocumentTitle()).toBe(DEFAULT_DOCUMENT_TITLE);
    expect(resolveDocumentTitle('')).toBe(DEFAULT_DOCUMENT_TITLE);
    expect(resolveDocumentTitle('   ')).toBe(DEFAULT_DOCUMENT_TITLE);
  });
});
