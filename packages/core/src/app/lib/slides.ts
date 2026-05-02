import { slideIds as ids, loadSlide as load } from 'virtual:open-slide/slides';
import type { SlideModule } from './sdk';

export const slideIds: string[] = ids;

export async function loadSlide(id: string): Promise<SlideModule> {
  return load(id);
}

const MAX_PREVIEW_IMPORTS = 2;
const previewCache = new Map<string, Promise<SlideModule>>();
const previewQueue: Array<() => void> = [];
let activePreviewImports = 0;

function runQueuedPreviewImport<T>(task: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const run = () => {
      activePreviewImports++;
      task()
        .then(resolve, reject)
        .finally(() => {
          activePreviewImports--;
          previewQueue.shift()?.();
        });
    };

    if (activePreviewImports < MAX_PREVIEW_IMPORTS) run();
    else previewQueue.push(run);
  });
}

export function loadSlidePreview(id: string): Promise<SlideModule> {
  const cached = previewCache.get(id);
  if (cached) return cached;

  const promise = runQueuedPreviewImport(() => load(id));
  previewCache.set(id, promise);
  promise.catch(() => previewCache.delete(id));
  return promise;
}
