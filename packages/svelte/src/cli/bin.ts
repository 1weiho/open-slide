#!/usr/bin/env node
import path from 'node:path';
import chalk from 'chalk';
import { Command, Option } from 'commander';
import { createServer, mergeConfig, build as viteBuild, preview as vitePreview } from 'vite';
import { createViteConfig } from '../vite/config.ts';

function parsePort(value: string): number {
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
  const base = await createViteConfig({ userCwd: process.cwd(), mode: 'serve' });
  const config = mergeConfig(base, {
    server: {
      ...(flags.port !== undefined ? { port: flags.port } : {}),
      ...(flags.host !== undefined ? { host: flags.host } : {}),
      ...(flags.open !== undefined ? { open: flags.open } : {}),
    },
  });
  const server = await createServer(config);
  await server.listen();
  server.printUrls();
  server.bindCLIShortcuts({ print: true });
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

async function run(): Promise<void> {
  const program = new Command();
  program
    .name('open-slide')
    .description('Author slides with the open-slide Svelte runtime.')
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

  await program.parseAsync(process.argv.slice(2), { from: 'user' });
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${chalk.red('error:')} ${message}\n`);
  process.exit(1);
});
