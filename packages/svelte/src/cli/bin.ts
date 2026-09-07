#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dev as runDev } from '@open-slide/shared/cli';
import chalk from 'chalk';
import { Command, Option } from 'commander';
import { mergeConfig, build as viteBuild, preview as vitePreview } from 'vite';
import { createViteConfig } from '../vite/config.ts';

async function readVersion(): Promise<string> {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const raw = await readFile(path.resolve(here, '..', '..', 'package.json'), 'utf8');
  return (JSON.parse(raw) as { version: string }).version;
}

export function parsePort(value: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid port: ${value}`);
  }
  return port;
}

type ServerFlags = {
  port?: number;
  host?: string | boolean;
  open?: boolean;
};

async function dev(flags: ServerFlags): Promise<void> {
  await runDev(flags, {
    createViteConfig,
    runtimePackage: '@open-slide/svelte',
  });
}

async function build(flags: { outDir?: string }): Promise<void> {
  const base = await createViteConfig({ userCwd: process.cwd(), mode: 'build' });
  await viteBuild(
    mergeConfig(base, {
      build: {
        ...(flags.outDir ? { outDir: path.resolve(process.cwd(), flags.outDir) } : {}),
      },
    }),
  );
}

async function preview(flags: ServerFlags): Promise<void> {
  const base = await createViteConfig({ userCwd: process.cwd(), mode: 'build' });
  const server = await vitePreview(
    mergeConfig(base, {
      preview: {
        ...(flags.port !== undefined ? { port: flags.port } : {}),
        ...(flags.host !== undefined ? { host: flags.host } : {}),
        ...(flags.open !== undefined ? { open: flags.open } : {}),
      },
    }),
  );
  server.printUrls();
}

export async function run(argv: string[]): Promise<void> {
  const version = await readVersion();
  const program = new Command();
  program
    .name('open-slide')
    .description('Author slides with the open-slide Svelte runtime.')
    .version(version, '-v, --version', 'print version')
    .helpOption('-h, --help', 'show help')
    .showHelpAfterError(chalk.dim('(run `open-slide --help` for usage)'));

  program
    .command('dev')
    .description('Start the dev server')
    .addOption(new Option('-p, --port <port>', 'port to listen on').argParser(parsePort))
    .addOption(new Option('--host [host]', 'expose on the network (optional host)'))
    .option('--open', 'open the browser on start')
    .action(dev);

  program
    .command('build')
    .description('Build a static site')
    .option('--out-dir <dir>', 'output directory (defaults to `dist`)')
    .action(build);

  program
    .command('preview')
    .description('Preview the production build')
    .addOption(new Option('-p, --port <port>', 'port to listen on').argParser(parsePort))
    .addOption(new Option('--host [host]', 'expose on the network (optional host)'))
    .option('--open', 'open the browser on start')
    .action(preview);

  await program.parseAsync(argv, { from: 'user' });
}

run(process.argv.slice(2)).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${chalk.red('error:')} ${message}\n`);
  process.exit(1);
});
