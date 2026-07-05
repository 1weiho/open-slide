import path from 'node:path';
import * as readline from 'node:readline/promises';
import chalk from 'chalk';
import {
  discoverThemes,
  fetchTheme,
  type RemoteThemeEntry,
  ThemeImportError,
  writeTheme,
} from '../themes/import.ts';
import { loadUserConfig } from '../vite/open-slide-plugin.ts';

export interface ThemeAddOptions {
  id?: string;
  all?: boolean;
  force?: boolean;
  yes?: boolean;
}

function isInteractive(): boolean {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await rl.question(`${question} ${chalk.dim('(y/N) ')}`)).trim().toLowerCase();
    return answer === 'y' || answer === 'yes';
  } finally {
    rl.close();
  }
}

async function selectEntries(
  entries: RemoteThemeEntry[],
  opts: ThemeAddOptions,
): Promise<RemoteThemeEntry[]> {
  if (opts.id) {
    const match = entries.filter((e) => e.id === opts.id);
    if (match.length === 0) {
      const available = entries.map((e) => e.id).join(', ') || '(none)';
      throw new ThemeImportError(
        'not-found',
        `Theme "${opts.id}" not found at source. Available: ${available}`,
      );
    }
    return match;
  }
  if (entries.length === 1 || opts.all) return entries;

  if (!isInteractive()) {
    const available = entries.map((e) => e.id).join(', ');
    throw new ThemeImportError(
      'invalid',
      `Source exposes ${entries.length} themes (${available}). Pass --id <id> or --all.`,
    );
  }

  process.stdout.write(`${chalk.bold('Themes available at this source:')}\n`);
  entries.forEach((e, i) => {
    process.stdout.write(`  ${chalk.cyan(String(i + 1))}. ${e.name} ${chalk.dim(`(${e.id})`)}\n`);
  });
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (
      await rl.question(`Select a number, ${chalk.bold('a')} for all, or blank to cancel: `)
    )
      .trim()
      .toLowerCase();
    if (answer === '') throw new ThemeImportError('invalid', 'Cancelled.');
    if (answer === 'a' || answer === 'all') return entries;
    const n = Number(answer);
    if (!Number.isInteger(n) || n < 1 || n > entries.length) {
      throw new ThemeImportError('invalid', `Invalid selection: ${answer}`);
    }
    return [entries[n - 1]];
  } finally {
    rl.close();
  }
}

export async function themeAdd(url: string, opts: ThemeAddOptions = {}): Promise<void> {
  const cwd = process.cwd();
  const config = await loadUserConfig(cwd);
  const themesDir = config.themesDir ?? 'themes';
  const themesRoot = path.resolve(cwd, themesDir);
  const allowedHosts = config.themeImport?.allowedHosts;

  const { origin, entries } = await discoverThemes(url, allowedHosts);
  if (entries.length === 0) {
    throw new ThemeImportError('not-found', `No themes found at ${url}`);
  }

  const selected = await selectEntries(entries, opts);

  const restricted = Boolean(allowedHosts && allowedHosts.length > 0);
  if (!opts.yes && !restricted) {
    process.stdout.write(
      `${chalk.yellow('!')} Importing from ${chalk.bold(origin)}. A theme's ${chalk.bold('.demo')} file is code that runs in your dev server and build.\n`,
    );
    if (!isInteractive()) {
      throw new ThemeImportError(
        'forbidden',
        'Refusing to import from an untrusted host without confirmation. Re-run with --yes, or add the host to themeImport.allowedHosts.',
      );
    }
    const ok = await confirm(`  Import ${selected.length} theme(s) from this source?`);
    if (!ok) {
      process.stdout.write(chalk.dim('Cancelled.\n'));
      return;
    }
  }

  for (const entry of selected) {
    const fetched = await fetchTheme(entry, allowedHosts);
    const result = await writeTheme(themesRoot, fetched, { force: opts.force });
    const files = result.written.join(', ');
    const renamed = result.renamed ? chalk.dim(` (renamed from ${result.requestedId})`) : '';
    process.stdout.write(
      `${chalk.green('✓')} Added ${chalk.bold(result.id)}${renamed} ${chalk.dim(files)}\n`,
    );
  }
}
