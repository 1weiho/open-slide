import type { LeafClassification, NativeKind } from './types.ts';

export type ClassifiedLeaf = {
  classification: LeafClassification;
  leafId: string;
};

export type PageClassificationSummary = {
  pageIndex: number;
  pageName: string;
  classifications: ClassifiedLeaf[];
};

export type FidelityReportInput = {
  deck: string;
  pages: PageClassificationSummary[];
};

export type FallbackEntry = {
  pageIndex: number;
  pageName: string;
  leafId: string;
  reasons: string[];
};

export type FidelityReport = {
  deck: string;
  pages: number;
  totalElements: number;
  byKind: Partial<Record<NativeKind, number>>;
  editablePercent: number;
  fallbacks: FallbackEntry[];
  generatedAt: string;
};

export function buildFidelityReport(input: FidelityReportInput): FidelityReport {
  const byKind: Partial<Record<NativeKind, number>> = {};
  const fallbacks: FallbackEntry[] = [];
  let total = 0;
  for (const p of input.pages) {
    for (const cl of p.classifications) {
      byKind[cl.classification.kind] = (byKind[cl.classification.kind] ?? 0) + 1;
      total += 1;
      if (cl.classification.kind === 'ImageFallback') {
        fallbacks.push({
          pageIndex: p.pageIndex,
          pageName: p.pageName,
          leafId: cl.leafId,
          reasons: cl.classification.reasons,
        });
      }
    }
  }
  const fallbackCount = byKind.ImageFallback ?? 0;
  const editablePercent =
    total === 0 ? 100 : Math.round(((total - fallbackCount) / total) * 1000) / 10;
  const generatedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  return {
    deck: input.deck,
    pages: input.pages.length,
    totalElements: total,
    byKind,
    editablePercent,
    fallbacks,
    generatedAt,
  };
}
