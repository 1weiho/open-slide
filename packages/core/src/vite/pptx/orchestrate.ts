import { writeFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { renderSlideHtml } from './render-html.ts';
import { measureSlide } from './extract-pw.ts';
import { measureToIR } from './measure-to-ir.ts';
import { buildPptx } from './pptx-build.ts';
import { postprocessPptx } from './pptx-postprocess.ts';
import { buildFidelityReport, type PageClassificationSummary } from './fidelity-report.ts';
import type { IRItem, IRPage } from './types.ts';

export type OrchestrateOpts = {
  slideDir: string;
  outDir?: string;
  pageFilter?: string | null;
  snapshots?: boolean;
  onProgress?: (event: ProgressEvent) => void;
};

export type ProgressEvent =
  | { phase: 'loading'; current: 0; total: 1 }
  | { phase: 'measuring'; current: 0; total: 1 }
  | { phase: 'rendering'; current: number; total: number }
  | { phase: 'building'; current: 0; total: 1 }
  | { phase: 'postprocessing'; current: 0; total: 1 }
  | { phase: 'done'; current: 1; total: 1 };

export type OrchestrateResult = {
  pptxPath: string;
  pptxBytes: Buffer;
  fidelityPath: string;
  pages: IRPage[];
};

function safeName(s: string): string {
  return (
    s
      .replace(/[^\w.-]+/g, '_')
      .replace(/^\.+/, '_')
      .slice(0, 120) || '_'
  );
}

function collectClassifications(items: IRItem[]): PageClassificationSummary['classifications'] {
  const out: PageClassificationSummary['classifications'] = [];
  for (const it of items) {
    if (it.kind === 'Group') {
      out.push(...collectClassifications(it.children));
      continue;
    }
    if (it.classification) {
      const leafId = ((it as any).domLeafId as string | undefined) ?? it.id;
      out.push({ leafId, classification: it.classification });
    }
  }
  return out;
}

export async function orchestrate(opts: OrchestrateOpts): Promise<OrchestrateResult> {
  const slideDir = opts.slideDir;
  const outDir = opts.outDir ?? slideDir;
  const snapshots = opts.snapshots ?? true;
  const onProgress = opts.onProgress ?? (() => {});

  await mkdir(outDir, { recursive: true });

  onProgress({ phase: 'loading', current: 0, total: 1 });
  const { pages: allHtml, design } = await renderSlideHtml(slideDir);
  const selected = opts.pageFilter
    ? allHtml.filter((p) => p.pageName === opts.pageFilter)
    : allHtml;
  if (selected.length === 0) {
    throw new Error(`no page matched filter "${opts.pageFilter}"`);
  }

  const deckBase = safeName(path.basename(slideDir));
  const snapshotDir = snapshots ? path.join(outDir, `${deckBase}.snapshots`) : undefined;

  onProgress({ phase: 'measuring', current: 0, total: 1 });
  const measures = await measureSlide(selected, {
    snapshotDir,
    onPage: (current, total) => {
      onProgress({ phase: 'rendering', current, total });
    },
  });
  const pages: IRPage[] = measures.map(measureToIR);

  onProgress({ phase: 'building', current: 0, total: 1 });
  const pptxName = opts.pageFilter
    ? `${safeName(pages[0].pageName)}.pptx`
    : `${safeName(path.basename(slideDir))}.pptx`;
  const pptxPath = path.join(outDir, pptxName);
  const { customGeomsPerSlide } = await buildPptx(pages, pptxPath, slideDir, design);

  onProgress({ phase: 'postprocessing', current: 0, total: 1 });
  await postprocessPptx(pptxPath, customGeomsPerSlide);

  const summaries: PageClassificationSummary[] = pages.map((p) => ({
    pageIndex: p.pageIndex,
    pageName: p.pageName,
    classifications: collectClassifications(p.items),
  }));
  const report = buildFidelityReport({ deck: path.basename(slideDir), pages: summaries });
  const fidelityPath = path.join(outDir, `${safeName(path.basename(slideDir))}.fidelity.json`);
  await writeFile(fidelityPath, JSON.stringify(report, null, 2), 'utf8');

  const pptxBytes = await readFile(pptxPath);

  onProgress({ phase: 'done', current: 1, total: 1 });
  return { pptxPath, pptxBytes, fidelityPath, pages };
}
