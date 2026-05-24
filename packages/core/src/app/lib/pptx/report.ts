import type { PptxDiagnostic, PptxSlideScene } from './scene';

export type PptxSlideReport = {
  slideIndex: number;
  nativeCount: number;
  nativeReducedCount: number;
  rasterCount: number;
  omittedCount: number;
  warnings: string[];
};

export type PptxExportReport = {
  slides: PptxSlideReport[];
};

export function summarizePptxScene(slideIndex: number, scene: PptxSlideScene): PptxSlideReport {
  const report: PptxSlideReport = {
    slideIndex,
    nativeCount: 0,
    nativeReducedCount: 0,
    rasterCount: 0,
    omittedCount: 0,
    warnings: scene.diagnostics.map(formatDiagnostic),
  };

  for (const node of scene.nodes) {
    const decision = node.decision;
    if (!decision) {
      report.nativeCount += 1;
      continue;
    }

    switch (decision.kind) {
      case 'native':
        report.nativeCount += 1;
        break;
      case 'native-reduced':
        report.nativeReducedCount += 1;
        report.warnings.push(decision.reason);
        break;
      case 'raster':
        report.rasterCount += 1;
        report.warnings.push(decision.reason);
        break;
      case 'omitted':
        report.omittedCount += 1;
        report.warnings.push(decision.reason);
        break;
    }
  }

  return report;
}

export function createPptxExportReport(slides: PptxSlideScene[]): PptxExportReport {
  return {
    slides: slides.map((slide, index) => summarizePptxScene(index, slide)),
  };
}

export function logPptxExportReport(report: PptxExportReport): void {
  for (const slide of report.slides) {
    console.info(
      [
        `[open-slide:pptx] slide ${slide.slideIndex + 1}:`,
        `${slide.nativeCount} native`,
        `${slide.nativeReducedCount} reduced`,
        `${slide.rasterCount} raster`,
        `${slide.omittedCount} omitted`,
      ].join(' '),
    );
    for (const warning of slide.warnings) {
      console.warn(`[open-slide:pptx] slide ${slide.slideIndex + 1}: ${warning}`);
    }
  }
}

function formatDiagnostic(diagnostic: PptxDiagnostic): string {
  return diagnostic.message;
}
