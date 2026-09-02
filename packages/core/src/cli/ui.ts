import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import * as readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { stripVTControlCharacters } from 'node:util';
import chalk from 'chalk';
import type { LogErrorOptions, Logger, LogOptions, LogType, ResolvedServerUrls } from 'vite';

// Legacy Windows consoles render box-drawing glyphs as garbage; Windows
// Terminal and VS Code's terminal are fine.
const UNICODE =
  process.platform !== 'win32' ||
  Boolean(process.env.WT_SESSION) ||
  process.env.TERM_PROGRAM === 'vscode';

export const glyph = {
  bar: UNICODE ? '┃' : '|',
  warn: UNICODE ? '▲' : '!',
  cross: UNICODE ? '✖' : 'x',
} as const;

// Bundled chunks land at unpredictable depths under dist/, so walk up to the
// package root instead of resolving a fixed relative path.
export function readVersion(): string {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  while (dir !== path.dirname(dir)) {
    const pkgPath = path.join(dir, 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { name?: string; version?: string };
      if (pkg.name === '@open-slide/core' && pkg.version) return pkg.version;
    }
    dir = path.dirname(dir);
  }
  return '0.0.0';
}

export function brand(): string {
  return chalk.inverse.bold(' open-slide ');
}

export function printHeader(status?: string): void {
  const parts = [brand(), chalk.dim(`v${readVersion()}`)];
  if (status) parts.push(chalk.dim(status));
  process.stdout.write(`\n  ${parts.join('  ')}\n\n`);
}

export function startupDuration(): string {
  return `ready in ${Math.round(process.uptime() * 1000)} ms`;
}

export function printUrls(
  urls: ResolvedServerUrls | null,
  host: string | boolean | undefined,
): void {
  if (!urls) return;
  const rows: string[] = [];
  for (const url of urls.local) rows.push(urlRow('Local', chalk.cyan(url)));
  urls.network.forEach((url, index) => {
    const iface = urls.networkInterfaceNames?.[index];
    rows.push(urlRow('Network', chalk.cyan(url) + (iface ? `  ${chalk.dim(iface)}` : '')));
  });
  if (urls.network.length === 0 && host === undefined) {
    rows.push(urlRow('Network', chalk.dim('use --host to expose')));
  }
  process.stdout.write(`${rows.join('\n')}\n`);
}

function urlRow(label: string, value: string): string {
  return `  ${chalk.dim(glyph.bar)}  ${chalk.bold(label.padEnd(8))} ${value}`;
}

export function shortcutsEnabled(): boolean {
  return Boolean(process.stdin.isTTY) && !process.env.CI;
}

export function printShortcutsHint(): void {
  process.stdout.write(
    `\n  ${chalk.dim('press')} ${chalk.bold('h + enter')} ${chalk.dim('for shortcuts')}\n`,
  );
}

export function formatError(message: string): string {
  return `\n  ${chalk.red(glyph.cross)} ${message}\n`;
}

const DROPPED = [/^vite v\d+\.\d+\.\d+ building /];

const REWRITES: ReadonlyArray<readonly [RegExp, string]> = [
  [/hmr update /, 'updated '],
  [/hmr invalidate /, 'invalidated '],
  [/trigger page reload /, 'full reload '],
  [/page reload/, 'full reload'],
  [/server restarted\./, 'server restarted'],
  [/optimized dependencies changed\. reloading/, 'dependencies changed, reloading'],
  [/Re-optimizing dependencies because vite config has changed/, 'config changed, re-bundling'],
  [/Re-optimizing dependencies because lockfile has changed/, 'lockfile changed, re-bundling'],
  [/Forced re-optimization of dependencies/, 're-bundling dependencies'],
  [/\[plugin builtin:vite-[a-z-]+\] ?\n?/, ''],
  [/\[vite\] ?/g, ''],
];

// Vite phrases its logs in its own vocabulary; users of open-slide never
// asked for Vite, so translate the handful of lines they'll actually see.
export function rewriteViteMessage(msg: string): string | null {
  const plain = stripVTControlCharacters(msg);
  if (DROPPED.some((re) => re.test(plain))) return null;
  let out = msg;
  for (const [re, replacement] of REWRITES) out = out.replace(re, replacement);
  return out;
}

function timestamp(): string {
  return new Date().toLocaleTimeString([], { hourCycle: 'h23' });
}

// Only timestamped lines get the two-space gutter: Vite's build reporter writes
// its progress straight to stdout, so indenting the rest would misalign it.
function formatLine(type: LogType, text: string, opts?: LogOptions): string {
  if (!opts?.timestamp) return text;
  const mark =
    type === 'warn'
      ? `${chalk.yellow(glyph.warn)} `
      : type === 'error'
        ? `${chalk.red(glyph.cross)} `
        : '';
  return `  ${chalk.dim(timestamp())}  ${mark}${text}`;
}

function clearTerminal(): void {
  if (!process.stdout.isTTY || process.env.CI) return;
  const blank = '\n'.repeat(Math.max(process.stdout.rows - 2, 0));
  console.log(blank);
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);
}

export function createCliLogger(): Logger {
  const loggedErrors = new WeakSet<object>();
  const warnedOnce = new Set<string>();

  const write = (type: LogType, msg: string, opts?: LogOptions) => {
    const text = rewriteViteMessage(msg);
    if (text === null) return;
    const method = type === 'info' ? 'log' : type;
    console[method](formatLine(type, text, opts));
  };

  const logger: Logger = {
    hasWarned: false,
    info(msg, opts) {
      write('info', msg, opts);
    },
    warn(msg, opts) {
      logger.hasWarned = true;
      write('warn', msg, opts);
    },
    warnOnce(msg, opts) {
      if (warnedOnce.has(msg)) return;
      warnedOnce.add(msg);
      logger.warn(msg, opts);
    },
    error(msg, opts?: LogErrorOptions) {
      logger.hasWarned = true;
      if (opts?.error) loggedErrors.add(opts.error);
      write('error', msg, opts);
    },
    clearScreen() {
      clearTerminal();
    },
    hasErrorLogged(error) {
      return loggedErrors.has(error);
    },
  };
  return logger;
}
