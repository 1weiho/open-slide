import { createServer, type Server } from 'node:http';
import { execSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { extname, join, resolve } from 'node:path';
import chalk from 'chalk';
import { PDFDocument } from 'pdf-lib';

// Lazy-loaded playwright — only installed when this command is used
let chromium: typeof import('playwright').chromium | null = null;

async function ensurePlaywright() {
  if (chromium) return;
  try {
    const pw = await import('playwright');
    chromium = pw.chromium;
  } catch {
    throw new Error(
      `playwright is required for PDF export.\nInstall it with: ${chalk.bold('npm i -D playwright')}`,
    );
  }
}

const MIME: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ico': 'image/x-icon',
};

// ── Count Page components from slide source ──
function countPages(slidesDir: string, slideId: string): number {
  const src = readFileSync(join(slidesDir, slideId, 'index.tsx'), 'utf8');
  const matches = src.match(/const\s+\w+\s*:\s*Page\s*=/g);
  return matches ? matches.length : 1;
}

// ── SPA-aware static file server ──
function startServer(distDir: string, port: number): Promise<Server> {
  return new Promise((resolveStart) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', `http://localhost:${port}`);
      const filePath = join(distDir, url.pathname);

      if (existsSync(filePath) && statSync(filePath).isFile()) {
        const ext = extname(filePath);
        res.writeHead(200, {
          'content-type': MIME[ext] || 'application/octet-stream',
        });
        res.end(readFileSync(filePath));
        return;
      }

      // SPA fallback — serve index.html for all routes
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(readFileSync(join(distDir, 'index.html')));
    });

    server.listen(port, () => resolveStart(server));
  });
}

// ── Capture one slide page as a vector PDF ──
async function capturePage(
  browser: import('playwright').Browser,
  slideId: string,
  pageNum: number,
  port: number,
): Promise<Uint8Array> {
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await ctx.newPage();

  const url = `http://localhost:${port}/s/${slideId}?p=${pageNum}`;
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });

  // Wait for React to render
  await page.waitForFunction(
    () => document.body && document.body.innerText.trim().length > 0,
    { timeout: 15_000 },
  );

  // Clone the slide canvas and strip scaling/wrappers so it fills 1920×1080.
  // Chromium's print compositor ignores CSS changes made via evaluate() —
  // only replacing the DOM tree itself reliably removes editor chrome.
  await page.evaluate(() => {
    const main = document.querySelector('main');
    if (!main) return;

    const canvas = main.querySelector('[data-osd-canvas]');
    if (!canvas) return;

    // Deep-clone preserves inline styles, CSS variables, and children
    const clone = canvas.cloneNode(true) as HTMLElement;

    // Copy CSS custom properties (--osd-bg, --osd-text, etc.)
    const srcVars = getComputedStyle(canvas);
    for (const prop of Array.from(srcVars)) {
      if (prop.startsWith('--')) {
        clone.style.setProperty(prop, srcVars.getPropertyValue(prop));
      }
    }

    // The editor scales the canvas to fit the viewport — strip that transform
    clone.style.transform = 'none';
    clone.style.width = '1920px';
    clone.style.height = '1080px';

    document.body.innerHTML = '';
    document.body.style.cssText =
      'margin:0;padding:0;width:1920px;height:1080px;overflow:hidden';
    document.body.appendChild(clone);
  });

  await page.evaluate(() => void document.body.offsetHeight);
  await page.waitForTimeout(300);

  const pdfBytes = await page.pdf({
    width: '1920px',
    height: '1080px',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  await ctx.close();
  return pdfBytes;
}

// ── Export a single slide to PDF ──
async function exportSlide(
  browser: import('playwright').Browser,
  slidesDir: string,
  slideId: string,
  outPath: string,
  port: number,
): Promise<void> {
  const pageCount = countPages(slidesDir, slideId);

  process.stdout.write(
    `  ${chalk.cyan(slideId)} (${pageCount} page${pageCount > 1 ? 's' : ''}) → ${outPath}\n`,
  );

  if (pageCount === 1) {
    const pdfBytes = await capturePage(browser, slideId, 1, port);
    writeFileSync(outPath, Buffer.from(pdfBytes));
  } else {
    const pageBuffers: Uint8Array[] = [];
    for (let p = 1; p <= pageCount; p++) {
      process.stdout.write(`    page ${p}/${pageCount}\r`);
      const bytes = await capturePage(browser, slideId, p, port);
      pageBuffers.push(bytes);
    }
    process.stdout.write('\n');

    // Merge per-page PDFs into a single document
    const merged = await PDFDocument.create();
    for (const buf of pageBuffers) {
      const doc = await PDFDocument.load(buf);
      const pages = await merged.copyPages(doc, doc.getPageIndices());
      for (const pg of pages) merged.addPage(pg);
    }
    writeFileSync(outPath, Buffer.from(await merged.save()));
  }
}

// ── Public entry point ──
export interface ExportPdfOptions {
  slideId?: string;
  all?: boolean;
  outDir?: string;
}

export async function exportPdf(opts: ExportPdfOptions): Promise<void> {
  await ensurePlaywright();

  const cwd = process.cwd();
  const slidesDir = resolve(cwd, 'slides');

  if (!existsSync(slidesDir)) {
    throw new Error(
      `No ${chalk.bold('slides/')} directory found. Run this command from an open-slide project root.`,
    );
  }

  // Resolve slide IDs
  let slideIds: string[];
  if (opts.all) {
    slideIds = readdirSync(slidesDir, { withFileTypes: true })
      .filter(
        (d) =>
          d.isDirectory() && existsSync(join(slidesDir, d.name, 'index.tsx')),
      )
      .map((d) => d.name);
    if (slideIds.length === 0) {
      throw new Error('No slides found in slides/.');
    }
  } else if (opts.slideId) {
    if (!existsSync(join(slidesDir, opts.slideId, 'index.tsx'))) {
      throw new Error(`Slide not found: slides/${opts.slideId}/index.tsx`);
    }
    slideIds = [opts.slideId];
  } else {
    throw new Error('Specify a slide id or pass --all.');
  }

  // Output directory
  const pdfOutDir = opts.outDir ? resolve(opts.outDir) : resolve(cwd, 'exports');
  mkdirSync(pdfOutDir, { recursive: true });

  // Build
  process.stdout.write('Building static site…\n');
  execSync('npx open-slide build --out-dir dist', { cwd, stdio: 'pipe' });
  process.stdout.write(chalk.green('Build complete.\n'));

  // Start local server
  const port = 4179;
  const distDir = resolve(cwd, 'dist');
  const server = await startServer(distDir, port);

  const browser = await chromium!.launch({ headless: true });

  try {
    for (const id of slideIds) {
      const outPath = join(pdfOutDir, `${id}.pdf`);
      await exportSlide(browser, slidesDir, id, outPath, port);
    }
  } finally {
    await browser.close();
    server.close();
  }

  process.stdout.write(chalk.green('\nDone! Exported PDFs:\n'));
  for (const id of slideIds) {
    process.stdout.write(`  ${join(pdfOutDir, `${id}.pdf`)}\n`);
  }
}
