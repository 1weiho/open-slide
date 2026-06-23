import { orchestrate, type ProgressEvent } from './orchestrate.ts';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

export type { ProgressEvent } from './orchestrate.ts';

export type RenderSlideToPptxOpts = {
  slideDir: string;
  pageFilter?: string;
  snapshots?: boolean;
  onProgress?: (event: ProgressEvent) => void;
};

export async function renderSlideToPptx(opts: RenderSlideToPptxOpts): Promise<Buffer> {
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'open-slide-pptx-'));
  try {
    const result = await orchestrate({
      slideDir: opts.slideDir,
      outDir: tmpDir,
      pageFilter: opts.pageFilter ?? null,
      snapshots: opts.snapshots ?? false,
      onProgress: opts.onProgress,
    });
    return result.pptxBytes;
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}
