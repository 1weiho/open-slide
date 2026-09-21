import { downloadBlob } from './dom';
import { CANVAS_HEIGHT, CANVAS_WIDTH, type SlideModule } from './sdk';

const CAPTURE_CLASS = 'os-pptx-capture';
const CAPTURE_PIXEL_RATIO = 2;
// Properties intro animations drive from a hidden start state to a visible end
// state. We read them back once settled and pin them inline so the capture clone
// can't re-run the keyframes from their invisible 0% frame (see freezeForCapture).
const FROZEN_PROPS = ['opacity', 'transform', 'filter', 'clip-path'] as const;

export type PptxExportProgress = {
  phase: 'processing' | 'generating' | 'done';
  /** Number of pages converted so far (0..total). */
  current: number;
  total: number;
  /** 0–95 while converting pages, 98 while assembling, 100 when done. */
  percent: number;
};

type ProgressFn = (progress: PptxExportProgress) => void;

async function loadPipeline() {
  const [render, measure, images, raster, color, ooxml, fflate] = await Promise.all([
    import('./pptx/render'),
    import('./pptx/measure'),
    import('./pptx/images'),
    import('./pptx/raster'),
    import('./pptx/color'),
    import('./pptx/ooxml'),
    import('fflate'),
  ]);
  return {
    ...render,
    ...measure,
    ...images,
    ...raster,
    ...color,
    ...ooxml,
    zipSync: fflate.zipSync,
  };
}

function download(
  files: Record<string, Uint8Array>,
  zip: (f: Record<string, Uint8Array>) => Uint8Array,
  mime: string,
  slideId: string,
) {
  const zipped = zip(files);
  downloadBlob(new Blob([zipped as BlobPart], { type: mime }), `${slideId}.pptx`);
}

/**
 * Converts every page into native PowerPoint objects: text boxes with the browser's
 * line breaks pinned, shapes for boxes and borders, pictures for images, and a
 * pixel-exact raster only for effects PowerPoint cannot express.
 */
export async function exportSlideAsPptx(
  slide: SlideModule,
  slideId: string,
  onProgress?: ProgressFn,
): Promise<void> {
  const pages = slide.default ?? [];
  if (pages.length === 0) return;
  const total = pages.length;
  onProgress?.({ phase: 'processing', current: 0, total, percent: 0 });

  const lib = await loadPipeline();
  const mounted = await lib.mountDeckOffscreen(slide, CAPTURE_CLASS);
  try {
    const images = new lib.ImageStore();
    const color = lib.createColorNormalizer();
    const slides = [];
    for (let i = 0; i < mounted.frames.length; i++) {
      const frame = mounted.frames[i];
      slides.push(
        await lib.measurePage({
          frame,
          notes: slide.notes?.[i]?.trim() || null,
          images,
          rasterizer: new lib.Rasterizer(frame),
          color,
        }),
      );
      onProgress?.({
        phase: 'processing',
        current: i + 1,
        total,
        percent: Math.min(95, ((i + 1) / total) * 95),
      });
    }
    onProgress?.({ phase: 'generating', current: total, total, percent: 98 });
    download(
      lib.buildPptxFiles({ slides, images: images.images }),
      lib.zipSync,
      lib.PPTX_MIME,
      slideId,
    );
  } finally {
    onProgress?.({ phase: 'done', current: total, total, percent: 100 });
    mounted.dispose();
  }
}

export async function exportSlideAsImagePptx(
  slide: SlideModule,
  slideId: string,
  onProgress?: ProgressFn,
): Promise<void> {
  const pages = slide.default ?? [];
  if (pages.length === 0) return;
  const total = pages.length;
  onProgress?.({ phase: 'processing', current: 0, total, percent: 0 });

  const [lib, { toBlob }] = await Promise.all([loadPipeline(), import('html-to-image')]);
  const mounted = await lib.mountDeckOffscreen(slide, CAPTURE_CLASS);
  try {
    const images = new lib.ImageStore();
    const slides = [];
    for (let i = 0; i < mounted.frames.length; i++) {
      const frame = mounted.frames[i];
      freezeForCapture(frame);
      const blob = await toBlob(frame, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        pixelRatio: CAPTURE_PIXEL_RATIO,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      if (!blob) throw new Error(`failed to capture page ${i + 1}`);
      const imageId = images.add(new Uint8Array(await blob.arrayBuffer()), 'png');
      slides.push({
        background: null,
        notes: slide.notes?.[i]?.trim() || null,
        nodes: [
          {
            kind: 'picture' as const,
            name: 'Slide',
            box: { x: 0, y: 0, w: CANVAS_WIDTH, h: CANVAS_HEIGHT },
            rotationDeg: 0,
            flipV: false,
            imageId,
            crop: null,
            alpha: 1,
            geometry: { kind: 'rect' as const },
            outline: null,
            shadow: null,
          },
        ],
      });
      onProgress?.({
        phase: 'processing',
        current: i + 1,
        total,
        percent: Math.min(95, ((i + 1) / total) * 95),
      });
    }
    onProgress?.({ phase: 'generating', current: total, total, percent: 98 });
    download(
      lib.buildPptxFiles({ slides, images: images.images }),
      lib.zipSync,
      lib.PPTX_MIME,
      slideId,
    );
  } finally {
    onProgress?.({ phase: 'done', current: total, total, percent: 100 });
    mounted.dispose();
  }
}

// Pin each element's settled visual state inline and remove its animation so the
// clone html-to-image rasterises renders the final frame instead of replaying the
// (initially invisible) keyframes. Pseudo-elements are handled by the capture style.
function freezeForCapture(root: HTMLElement): void {
  for (const el of root.querySelectorAll<HTMLElement>('*')) {
    const cs = getComputedStyle(el);
    for (const prop of FROZEN_PROPS) {
      el.style.setProperty(prop, cs.getPropertyValue(prop), 'important');
    }
    el.style.setProperty('animation', 'none', 'important');
    el.style.setProperty('transition', 'none', 'important');
  }
}
