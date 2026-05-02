// Headless PPTX export. Boots a Vite dev server, drives Chromium via
// playwright-core to capture each slide page as a 2× DPI PNG plus a list of
// "safe" text runs, and assembles the deck with pptxgenjs. Each output slide
// is the PNG full-bleed plus transparent-fill native text boxes overlaid for
// selection / search / translation. The visual is on the PNG; the native text
// only matters when someone moves or edits a box in PowerPoint.

import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';
import fg from 'fast-glob';
import { createServer, mergeConfig } from 'vite';
import { type ExtractedText, extractSafeTexts } from '../app/lib/extract-pptx-texts.ts';
import { createViteConfig } from '../vite/config.ts';

export interface ExportPptxOptions {
  slideId?: string;
  out?: string;
}

const SLIDE_W_IN = 20;
const SLIDE_H_IN = 11.25;
const READY_TIMEOUT_MS = 30_000;
const NAV_TIMEOUT_MS = 30_000;

export async function exportPptx(opts: ExportPptxOptions = {}): Promise<void> {
  const userCwd = process.cwd();
  const slidesRoot = path.resolve(userCwd, 'slides');
  if (!existsSync(slidesRoot)) {
    throw new Error(`No slides/ directory found at ${slidesRoot}`);
  }

  const allIds = await listSlides(slidesRoot);
  if (allIds.length === 0) throw new Error(`No slides found under ${slidesRoot}`);
  if (opts.slideId && !allIds.includes(opts.slideId)) {
    throw new Error(`Slide not found: ${opts.slideId}`);
  }
  const targets = opts.slideId ? [opts.slideId] : allIds;

  process.stdout.write(`${chalk.dim('Starting dev server…')}\n`);
  const baseConfig = await createViteConfig({ userCwd });
  const config = mergeConfig(baseConfig, {
    server: { port: 0, host: '127.0.0.1', strictPort: false },
    logLevel: 'warn',
    clearScreen: false,
  });
  const server = await createServer(config);
  await server.listen();
  const addr = server.httpServer?.address();
  if (!addr || typeof addr === 'string') {
    await server.close();
    throw new Error('Could not determine dev server port');
  }
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  const playwright = await loadPlaywright();
  const PptxGenJS = await loadPptxGenJs();

  let browser: Awaited<ReturnType<typeof playwright.chromium.launch>> | null = null;
  try {
    try {
      browser = await playwright.chromium.launch({ headless: true });
    } catch (err) {
      throw new Error(
        `Failed to launch Chromium. Run \`npx playwright install chromium\` first.\n${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    for (const id of targets) {
      const outPath = resolveOutPath(opts.out, id, targets.length);
      await mkdir(path.dirname(outPath), { recursive: true });
      process.stdout.write(`${chalk.cyan('•')} ${id}\n`);
      const deck = await captureDeck(page, baseUrl, id);
      await writePptx(deck, outPath, PptxGenJS);
      process.stdout.write(
        `  ${chalk.green('→')} ${path.relative(userCwd, outPath)} ${chalk.dim(
          `(${deck.pages.length} pages, ${countTexts(deck)} editable runs)`,
        )}\n`,
      );
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
    await server.close().catch(() => {});
  }
}

interface CapturedPage {
  png: Buffer;
  texts: ExtractedText[];
  warnings: string[];
}

interface CapturedDeck {
  slideId: string;
  title: string;
  pages: CapturedPage[];
}

async function listSlides(slidesRoot: string): Promise<string[]> {
  const hits = await fg('*/index.{tsx,jsx,ts,js}', {
    cwd: slidesRoot,
    onlyFiles: true,
  });
  return Array.from(new Set(hits.map((h) => h.split('/')[0]))).sort();
}

async function captureDeck(
  page: import('playwright-core').Page,
  baseUrl: string,
  slideId: string,
): Promise<CapturedDeck> {
  await navigateAndSettle(page, slideUrl(baseUrl, slideId, 1));
  const meta = (await page.evaluate(() => {
    const w = window as unknown as { __OPEN_SLIDE_PAGE_COUNT?: number; __OPEN_SLIDE_TITLE?: string };
    return { count: w.__OPEN_SLIDE_PAGE_COUNT ?? 0, title: w.__OPEN_SLIDE_TITLE ?? '' };
  })) as { count: number; title: string };

  if (!meta.count) throw new Error(`Slide "${slideId}" has no pages`);

  const pages: CapturedPage[] = [];
  for (let p = 1; p <= meta.count; p++) {
    if (p > 1) await navigateAndSettle(page, slideUrl(baseUrl, slideId, p));
    const canvas = page.locator('[data-osd-canvas]').first();
    await canvas.waitFor({ state: 'visible', timeout: NAV_TIMEOUT_MS });
    const png = await canvas.screenshot({ type: 'png' });
    // Playwright serializes the function source and runs it in the browser
    // context. extractSafeTexts is self-contained (no closures over module
    // scope) so this is safe.
    const texts = (await page.evaluate(extractSafeTexts, '[data-osd-canvas]')) as ExtractedText[];
    const warnings = (await page.evaluate(() => {
      const w = window as unknown as { __OPEN_SLIDE_WARNINGS?: string[] };
      return w.__OPEN_SLIDE_WARNINGS ?? [];
    })) as string[];
    pages.push({ png, texts, warnings });
    for (const warn of warnings) {
      process.stdout.write(`  ${chalk.yellow('!')} page ${p}: ${warn}\n`);
    }
  }
  return { slideId, title: meta.title || slideId, pages };
}

function slideUrl(baseUrl: string, slideId: string, page: number): string {
  return `${baseUrl}/s/${encodeURIComponent(slideId)}?p=${page}&pptx=1`;
}

async function navigateAndSettle(
  page: import('playwright-core').Page,
  url: string,
): Promise<void> {
  await page.goto(url, { waitUntil: 'load', timeout: NAV_TIMEOUT_MS });
  await page.evaluate(async () => {
    const w = window as unknown as { __OPEN_SLIDE_READY?: boolean };
    w.__OPEN_SLIDE_READY = false;
    if ('fonts' in document) await document.fonts.ready;
  });
  await page.waitForFunction(
    () => (window as unknown as { __OPEN_SLIDE_READY?: boolean }).__OPEN_SLIDE_READY === true,
    null,
    { timeout: READY_TIMEOUT_MS },
  );
}

async function writePptx(
  deck: CapturedDeck,
  outPath: string,
  PptxGenJS: PptxGenJsConstructor,
): Promise<void> {
  const pres = new PptxGenJS();
  pres.defineLayout({ name: 'OS_HD', width: SLIDE_W_IN, height: SLIDE_H_IN });
  pres.layout = 'OS_HD';
  pres.title = deck.title;

  for (const cap of deck.pages) {
    const slide = pres.addSlide();
    slide.addImage({
      data: `data:image/png;base64,${cap.png.toString('base64')}`,
      x: 0,
      y: 0,
      w: SLIDE_W_IN,
      h: SLIDE_H_IN,
    });
    for (const t of cap.texts) {
      // Clamp inside slide bounds so PowerPoint doesn't reflow weirdly.
      const x = clamp(t.x, 0, SLIDE_W_IN);
      const y = clamp(t.y, 0, SLIDE_H_IN);
      const w = clamp(t.w, 0.05, SLIDE_W_IN - x);
      const h = clamp(t.h, 0.05, SLIDE_H_IN - y);
      slide.addText(t.text, {
        x,
        y,
        w,
        h,
        fontFace: t.fontFamily,
        fontSize: t.fontSizePt,
        bold: t.fontWeight >= 600,
        italic: t.italic,
        color: t.color,
        align: t.align,
        valign: 'top',
        margin: 0,
        fill: { type: 'none' },
        // No background; the rasterized PNG underneath is the source of truth.
      } as Parameters<typeof slide.addText>[1]);
    }
  }
  await pres.writeFile({ fileName: outPath });
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function countTexts(deck: CapturedDeck): number {
  return deck.pages.reduce((n, p) => n + p.texts.length, 0);
}

function resolveOutPath(out: string | undefined, slideId: string, total: number): string {
  const cwd = process.cwd();
  if (!out) return path.resolve(cwd, `${slideId}.pptx`);
  const abs = path.resolve(cwd, out);
  if (out.toLowerCase().endsWith('.pptx') && total === 1) return abs;
  return path.join(abs, `${slideId}.pptx`);
}

type PlaywrightModule = typeof import('playwright-core');

async function loadPlaywright(): Promise<PlaywrightModule> {
  try {
    return (await import('playwright-core')) as PlaywrightModule;
  } catch (err) {
    throw new Error(
      `playwright-core is not installed. Add it as a dependency.\n${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

type PptxGenJsConstructor = typeof import('pptxgenjs').default;

async function loadPptxGenJs(): Promise<PptxGenJsConstructor> {
  try {
    const mod = await import('pptxgenjs');
    // Some bundlers expose the class as `default`, others as the module itself.
    const ctor = (mod as { default?: PptxGenJsConstructor }).default ?? (mod as unknown as PptxGenJsConstructor);
    return ctor;
  } catch (err) {
    throw new Error(
      `pptxgenjs is not installed.\n${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
