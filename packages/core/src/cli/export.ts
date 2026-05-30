/**
 * @agents-index `open-slide export` subcommand entry — headless PNG export skeleton and Playwright preflight.
 *
 * The subcommand is contributor/CI tooling, not an end-user runtime feature.
 * Because `playwright-chromium` is a `devDependency` of `@open-slide/core`
 * (never `dependencies`, never `optionalDependencies`), the "not installed"
 * branch is the *default* path for users of the published package, not a rare
 * edge case. This module therefore preflights the import before doing any
 * other work and exits with a copy-pasteable install message on miss.
 */

import type { chromium as Chromium } from 'playwright-chromium';

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

/**
 * Resolve the `playwright-chromium` namespace at runtime via dynamic import.
 *
 * Returns `null` on any module-resolution failure so the caller can surface
 * a friendly install message instead of a raw stack trace. A dynamic import
 * (not a top-level one) is mandatory: a top-level import would force the
 * runtime bundle to declare Playwright as a hard dependency, which violates
 * FR-5 / NFR-2 of CR-0002.
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
 * Entry point invoked by `run.ts` after Commander parses the flags.
 *
 * Phase 1 scope is intentionally narrow: preflight Playwright, and on miss
 * print the install instructions to stderr and exit `2`. The render loop,
 * dev-server boot, and slide enumeration land in later phases.
 */
export async function exportCommand(_flags: ExportFlags = {}): Promise<void> {
  const playwright = await tryImportPlaywright();
  if (playwright === null) {
    process.stderr.write(`${PLAYWRIGHT_MISSING_MESSAGE}\n`);
    process.exit(2);
  }
}
