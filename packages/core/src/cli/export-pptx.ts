import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createServer, mergeConfig } from 'vite';
import { createPptxBuffer, type PptxDeck } from '../pptx/exporter.ts';
import { createViteConfig } from '../vite/config.ts';

export type ExportPptxOptions = {
  cwd?: string;
  slideId: string;
  output?: string;
};

export async function exportPptx(opts: ExportPptxOptions): Promise<string> {
  const cwd = path.resolve(opts.cwd ?? process.cwd());
  const output = path.resolve(cwd, opts.output ?? `${opts.slideId}.pptx`);
  const viteConfig = await createViteConfig({ userCwd: cwd, mode: 'serve' });
  const server = await createServer(
    mergeConfig(viteConfig, {
      appType: 'custom',
      logLevel: 'silent',
      server: { middlewareMode: true },
    }),
  );

  try {
    const slidesModule = (await server.ssrLoadModule('virtual:open-slide/slides')) as {
      loadSlide(id: string): Promise<Record<string, unknown>>;
    };
    const slideModule = await slidesModule.loadSlide(opts.slideId);
    const pptxDeck = slideModule.pptx;
    if (!isPptxDeck(pptxDeck)) {
      throw new Error(
        `Slide ${opts.slideId} does not export a valid \`pptx\` deck. Editable PPTX export is schema-based; arbitrary React/CSS cannot be converted safely.`,
      );
    }

    const buffer = createPptxBuffer(pptxDeck);
    await mkdir(path.dirname(output), { recursive: true });
    await writeFile(output, buffer);
    return output;
  } finally {
    await server.close();
  }
}

function isPptxDeck(value: unknown): value is PptxDeck {
  if (!value || typeof value !== 'object') return false;
  const slides = (value as { slides?: unknown }).slides;
  return Array.isArray(slides) && slides.length > 0;
}
