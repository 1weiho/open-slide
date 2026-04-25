import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import { Command, Option } from 'commander';

async function readVersion(): Promise<string> {
  const here = path.dirname(fileURLToPath(import.meta.url));
  // dist/cli/bin.js → ../../package.json
  const pkgPath = path.resolve(here, '..', '..', 'package.json');
  const raw = await readFile(pkgPath, 'utf8');
  return (JSON.parse(raw) as { version: string }).version;
}

export function parsePort(value: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 65535) {
    throw new Error(`Invalid port: ${value}`);
  }
  return n;
}

interface ServerFlags {
  port?: number;
  host?: string | boolean;
  open?: boolean;
}

interface BuildFlags {
  outDir?: string;
}

export async function run(argv: string[]): Promise<void> {
  const version = await readVersion();

  const program = new Command();
  program
    .name('open-slide')
    .description('Author slides — we handle the Vite/React stack.')
    .version(version, '-v, --version', 'print version')
    .helpOption('-h, --help', 'show help')
    .showHelpAfterError(chalk.dim('(run `open-slide --help` for usage)'));

  program
    .command('dev')
    .description('Start the dev server')
    .addOption(new Option('-p, --port <port>', 'port to listen on').argParser(parsePort))
    .addOption(new Option('--host [host]', 'expose on the network (optional host)'))
    .option('--open', 'open the browser on start')
    .action(async (flags: ServerFlags) => {
      const { dev } = await import('./dev.ts');
      await dev(flags);
    });

  program
    .command('build')
    .description('Build a static site')
    .option('--out-dir <dir>', 'output directory (defaults to `dist`)')
    .action(async (flags: BuildFlags) => {
      const { build } = await import('./build.ts');
      await build(flags);
    });

  program
    .command('preview')
    .description('Preview the production build')
    .addOption(new Option('-p, --port <port>', 'port to listen on').argParser(parsePort))
    .addOption(new Option('--host [host]', 'expose on the network (optional host)'))
    .option('--open', 'open the browser on start')
    .action(async (flags: ServerFlags) => {
      const { preview } = await import('./preview.ts');
      await preview(flags);
    });

  await program.parseAsync(argv, { from: 'user' });
}
