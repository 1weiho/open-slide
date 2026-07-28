/**
 * @agents-index `open-slide export` subcommand — boots an in-process Vite dev
 * server, drives headless Chromium against the real viewer route, and writes
 * one PNG per page to disk.
 *
 * The subcommand is contributor/CI tooling, not an end-user runtime feature.
 * Because `playwright-chromium` is a `devDependency` of `@open-slide/core`
 * (never `dependencies`, never `optionalDependencies`), the "not installed"
 * branch is the *default* path for users of the published package, not a rare
 * edge case. This module therefore preflights the import before doing any
 * other work and exits with a copy-pasteable install message on miss.
 */

import fs from 'node:fs/promises';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import type { Browser, chromium as Chromium, Page } from 'playwright-chromium';
import { createServer, mergeConfig, type ViteDevServer } from 'vite';
import { createViteConfig } from '../vite/config.ts';

/**
 * Flags accepted by `open-slide export`.
 *
 * Mirrors the Commander option names declared in `run.ts`. Kept as an
 * explicit interface so callers (tests, future orchestrators) can construct
 * a typed flag object without going through Commander.
 */
export interface ExportFlags {
  slide?: string;
  all?: boolean;
  page?: number;
  out?: string;
  port?: number;
  timeout?: number;
}

type PlaywrightChromium = { chromium: typeof Chromium };

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_OUT_DIR = './png-export';

/**
 * Resolve the `playwright-chromium` namespace at runtime via dynamic import.
 *
 * Returns `null` on any module-resolution failure so the caller can surface
 * a friendly install message instead of a raw stack trace. A dynamic import
 * (not a top-level one) is mandatory: a top-level import would force the
 * runtime bundle to declare Playwright as a hard dependency, inflating every
 * end-user install with a browser they will never launch.
 */
export async function tryImportPlaywright(): Promise<PlaywrightChromium | null> {
  try {
    const mod = (await import('playwright-chromium')) as PlaywrightChromium;
    return mod;
  } catch {
    return null;
  }
}

const PLAYWRIGHT_MISSING_MESSAGE = [
  '`open-slide export` needs playwright-chromium, which is not installed in this workspace.',
  'Install it as a dev dependency and download the Chromium browser, then re-run:',
  '',
  '  pnpm add -D playwright-chromium',
  '  npx playwright install chromium',
  '',
  'Playwright ships as a devDependency only, so it is not pulled in by a default `@open-slide/core` install.',
].join('\n');

/**
 * Compute the per-page PNG filename, padding the 1-based page number to the
 * width of the total page count so file-system sort order matches slide order
 * for any deck size. Mirrors `pngFilenameFor` in `app/lib/export-png.ts` —
 * duplicated here rather than imported because that module pulls in DOM-only
 * helpers (React, canvas) that have no place in a Node CLI bundle.
 */
export function pngFilenameFor(slideId: string, pageIndex: number, total: number): string {
  const width = String(Math.max(1, total)).length;
  const n = String(pageIndex + 1).padStart(width, '0');
  return `${slideId}-p${n}.png`;
}

/**
 * Boot a Vite dev server in-process, bound to the loopback interface on an
 * ephemeral port (or the explicit `--port`).
 *
 * Mirrors `cli/dev.ts` but pins the host to `127.0.0.1` so the headless
 * exporter never accidentally exposes the deck on a LAN interface and never
 * collides with a long-running `open-slide dev` on the conventional 5173.
 * Returns the resolved port from the OS-assigned binding so the caller can
 * navigate Playwright at it.
 */
export async function startDevServer(opts: {
  port?: number;
}): Promise<{ server: ViteDevServer; port: number }> {
  const base = await createViteConfig({ userCwd: process.cwd() });
  const config = mergeConfig(base, {
    server: { host: '127.0.0.1', port: opts.port ?? 0, strictPort: opts.port !== undefined },
  });
  const server = await createServer(config);
  await server.listen();
  const address = server.httpServer?.address();
  const port =
    address && typeof address === 'object' ? (address as AddressInfo).port : (opts.port ?? 0);
  if (!port) {
    throw new Error('failed to determine dev server port');
  }
  return { server, port };
}

type SlideEntry = { id: string; pages: number };

/**
 * Fetch the deck list from the in-process dev server's `GET /__slides`
 * endpoint. Disk-walking `slidesDir` would silently include broken decks;
 * the endpoint sources from the same enumeration that backs the viewer's
 * `virtual:open-slide/slides`, so the CLI sees the same set the viewer
 * would render.
 */
export async function enumerateSlides(port: number): Promise<SlideEntry[]> {
  const res = await fetch(`http://127.0.0.1:${port}/__slides`);
  if (!res.ok) {
    throw new Error(`GET /__slides failed: ${res.status} ${res.statusText}`);
  }
  const body = (await res.json()) as unknown;
  if (!Array.isArray(body)) {
    throw new Error('GET /__slides returned a non-array body');
  }
  const out: SlideEntry[] = [];
  for (const raw of body) {
    if (!raw || typeof raw !== 'object') continue;
    const id = (raw as { id?: unknown }).id;
    const pages = (raw as { pages?: unknown }).pages;
    if (typeof id !== 'string' || typeof pages !== 'number') continue;
    out.push({ id, pages });
  }
  return out;
}

type ResolvedTuple = { slideId: string; pageIndex: number; total: number };

/**
 * Project the user-supplied flag set onto a flat list of `(slideId, pageIndex,
 * total)` tuples to render. Centralising this resolution keeps the rendering
 * loop trivial and lets it be unit-tested in isolation from Vite/Playwright.
 */
export function resolveExportTargets(flags: ExportFlags, slides: SlideEntry[]): ResolvedTuple[] {
  if (flags.all) {
    const out: ResolvedTuple[] = [];
    for (const s of slides) {
      for (let i = 0; i < s.pages; i++) out.push({ slideId: s.id, pageIndex: i, total: s.pages });
    }
    return out;
  }
  if (flags.slide) {
    const s = slides.find((x) => x.id === flags.slide);
    if (!s) throw new ExportUsageError(`--slide ${flags.slide} does not match any deck`);
    if (flags.page !== undefined) {
      if (flags.page < 1 || flags.page > s.pages) {
        throw new ExportUsageError(
          `--page ${flags.page} is out of range for deck "${s.id}" (pages 1..${s.pages})`,
        );
      }
      return [{ slideId: s.id, pageIndex: flags.page - 1, total: s.pages }];
    }
    const out: ResolvedTuple[] = [];
    for (let i = 0; i < s.pages; i++) out.push({ slideId: s.id, pageIndex: i, total: s.pages });
    return out;
  }
  throw new ExportUsageError('one of --slide or --all is required');
}

/**
 * Sentinel for usage / preflight errors, which exit with code 2.
 *
 * Separating these from generic `Error`s lets the top-level orchestrator
 * pick the right exit code without sniffing string contents.
 */
export class ExportUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExportUsageError';
  }
}

/**
 * Atomically write a buffer: write to `<file>.tmp` then rename. Downstream
 * tooling watching the output dir never observes a half-written PNG, even if
 * the process is killed mid-write.
 */
export async function atomicWriteFile(file: string, bytes: Buffer | Uint8Array): Promise<void> {
  const tmp = `${file}.tmp`;
  try {
    await fs.writeFile(tmp, bytes);
    await fs.rename(tmp, file);
  } catch (err) {
    await fs.rm(tmp, { force: true }).catch(() => {});
    throw err;
  }
}

/**
 * Drive Playwright through a single page: navigate to the viewer under
 * `?export=png`, wait for the readiness signal the viewer sets once fonts,
 * `data-waitfor` targets, and intro animations have settled, capture a
 * 1920×1080 PNG, and atomically write it to `outDir`.
 *
 * On readiness timeout the screenshot still runs and a single warning line is
 * logged: a deck with a perpetual animation would otherwise never export at
 * all, and a slightly-early frame is more useful than no frame.
 */
export async function renderOne(
  page: Page,
  port: number,
  slideId: string,
  pageIndex: number,
  totalPages: number,
  outDir: string,
  timeoutMs: number,
): Promise<void> {
  const url = `http://127.0.0.1:${port}/s/${slideId}?p=${pageIndex + 1}&export=png`;
  await page.goto(url, { waitUntil: 'load' });
  try {
    await page.waitForFunction(
      () =>
        (window as unknown as { __OPEN_SLIDE_EXPORT_READY?: boolean }).__OPEN_SLIDE_EXPORT_READY ===
        true,
      undefined,
      { timeout: timeoutMs },
    );
  } catch {
    process.stderr.write(`${slideId}:p${pageIndex + 1} readiness timed out — captured anyway\n`);
  }
  const buffer = await page.screenshot({
    type: 'png',
    clip: { x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
  });
  const filename = pngFilenameFor(slideId, pageIndex, totalPages);
  const fullPath = path.join(outDir, filename);
  await atomicWriteFile(fullPath, buffer);
  const relPath = path.relative(process.cwd(), fullPath) || filename;
  process.stdout.write(`${slideId}:p${pageIndex + 1} → ${relPath}\n`);
}

function validateFlags(flags: ExportFlags): void {
  if (flags.slide && flags.all) {
    throw new ExportUsageError('--slide and --all are mutually exclusive');
  }
  if (flags.page !== undefined && !flags.slide) {
    throw new ExportUsageError('--page requires --slide');
  }
  if (!flags.slide && !flags.all) {
    throw new ExportUsageError('one of --slide or --all is required');
  }
}

/**
 * Entry point invoked by `run.ts` after Commander parses the flags. Wraps the
 * whole render loop in `try/finally` so the launched Chromium browser and the
 * in-process Vite server are torn down on every exit path — a leaked browser
 * process would hang CI until the job times out.
 */
export async function exportCommand(flags: ExportFlags = {}): Promise<void> {
  try {
    validateFlags(flags);
  } catch (err) {
    if (err instanceof ExportUsageError) {
      process.stderr.write(`${err.message}\n`);
      process.exit(2);
    }
    throw err;
  }

  const playwright = await tryImportPlaywright();
  if (playwright === null) {
    process.stderr.write(`${PLAYWRIGHT_MISSING_MESSAGE}\n`);
    process.exit(2);
  }

  const outDir = path.resolve(process.cwd(), flags.out ?? DEFAULT_OUT_DIR);
  const timeoutMs = flags.timeout ?? DEFAULT_TIMEOUT_MS;

  await fs.mkdir(outDir, { recursive: true });

  let server: ViteDevServer | null = null;
  let browser: Browser | null = null;
  try {
    const started = await startDevServer({ port: flags.port });
    server = started.server;
    const slides = await enumerateSlides(started.port);
    const targets = resolveExportTargets(flags, slides);

    browser = await playwright.chromium.launch();
    const context = await browser.newContext({
      viewport: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    for (const t of targets) {
      await renderOne(page, started.port, t.slideId, t.pageIndex, t.total, outDir, timeoutMs);
    }

    const deckCount = new Set(targets.map((t) => t.slideId)).size;
    process.stdout.write(
      `Exported ${targets.length} page(s) from ${deckCount} deck(s) to ${path.relative(process.cwd(), outDir) || outDir}\n`,
    );
  } catch (err) {
    if (err instanceof ExportUsageError) {
      process.stderr.write(`${err.message}\n`);
      await closeAll(browser, server);
      process.exit(2);
    }
    process.stderr.write(`${(err as Error).message ?? String(err)}\n`);
    await closeAll(browser, server);
    process.exit(1);
  } finally {
    await closeAll(browser, server);
  }
}

async function closeAll(browser: Browser | null, server: ViteDevServer | null): Promise<void> {
  if (browser) {
    await browser.close().catch(() => {});
  }
  if (server) {
    await server.close().catch(() => {});
  }
}
