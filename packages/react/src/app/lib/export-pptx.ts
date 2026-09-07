import { exportFramesAsImagePptx, type PptxExportProgress } from '@open-slide/shared/client';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { designToCssVars } from './design';
import { SlidePageProvider } from './page-context';
import type { SlideModule } from './sdk';

export type { PptxExportProgress } from '@open-slide/shared/client';

export function exportSlideAsImagePptx(
  slide: SlideModule,
  slideId: string,
  onProgress?: (progress: PptxExportProgress) => void,
): Promise<void> {
  const pages = slide.default ?? [];
  return exportFramesAsImagePptx({
    pageCount: pages.length,
    filename: `${slideId}.pptx`,
    designVars: slide.design ? designToCssVars(slide.design) : null,
    onProgress,
    renderPage(host, index) {
      const Page = pages[index];
      if (!Page) return undefined;
      const root = createRoot(host);
      root.render(
        createElement(SlidePageProvider, { index, total: pages.length }, createElement(Page)),
      );
      return () => root.unmount();
    },
  });
}
