import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import { Command } from 'commander';
import prompts from 'prompts';
import { init, isDirNonEmpty, type InitOptions } from './init.ts';
import { detectPackageManager, type PackageManager } from './package-manager.ts';

async function readVersion(): Promise<string> {
  const here = dirname(fileURLToPath(import.meta.url));
  const pkg = JSON.parse(await readFile(join(here, '..', 'package.json'), 'utf8')) as {
    version: string;
  };
  return pkg.version;
}

interface InitCliFlags {
  force?: boolean;
  name?: string;
  useNpm?: boolean;
  usePnpm?: boolean;
  useYarn?: boolean;
  useBun?: boolean;
  install?: boolean;
  git?: boolean;
}

function onCancel(): never {
  process.stdout.write(chalk.dim('\nCancelled.\n'));
  process.exit(130);
}

function resolvePackageManager(flags: InitCliFlags): PackageManager {
  const picks: PackageManager[] = [];
  if (flags.useNpm) picks.push('npm');
  if (flags.usePnpm) picks.push('pnpm');
  if (flags.useYarn) picks.push('yarn');
  if (flags.useBun) picks.push('bun');

  if (picks.length > 1) {
    throw new Error(
      `Only one of --use-npm / --use-pnpm / --use-yarn / --use-bun may be specified (got ${picks.map((p) => `--use-${p}`).join(', ')}).`,
    );
  }
  return picks[0] ?? detectPackageManager();
}

async function runInit(dirArg: string | undefined, flags: InitCliFlags): Promise<void> {
  const isTTY = Boolean(process.stdin.isTTY && process.stdout.isTTY);

  let dir = dirArg;
  const name = flags.name;
  let force = flags.force ?? false;

  if (isTTY && dir === undefined) {
    const answers = await prompts(
      {
        type: 'text',
        name: 'dir',
        message: 'Target directory',
        initial: '.',
      },
      { onCancel },
    );
    dir = answers.dir;
  }

  const resolvedDir = dir ?? '.';
  const target = resolve(process.cwd(), resolvedDir);

  if (!force && (await isDirNonEmpty(target))) {
    if (!isTTY) {
      throw new Error(`Target ${target} is not empty. Pass --force to scaffold into it anyway.`);
    }
    const { overwrite } = await prompts(
      {
        type: 'confirm',
        name: 'overwrite',
        message: `${chalk.yellow(target)} is not empty. Scaffold into it anyway?`,
        initial: false,
      },
      { onCancel },
    );
    if (!overwrite) {
      process.stdout.write(chalk.dim('Aborted.\n'));
      return;
    }
    force = true;
  }

  const opts: InitOptions = {
    dir: resolvedDir,
    force,
    name,
    packageManager: resolvePackageManager(flags),
    install: flags.install !== false,
    git: flags.git !== false,
  };
  await init(opts);
}

export async function run(argv: string[]): Promise<void> {
  const version = await readVersion();

  const program = new Command();
  program
    .name('open-slide')
    .description('Scaffold and manage open-slide workspaces.')
    .version(version, '-v, --version', 'print version')
    .helpOption('-h, --help', 'show help')
    .showHelpAfterError(chalk.dim('(run `open-slide --help` for usage)'));

  program
    .command('init')
    .description('Create a new open-slide workspace')
    .argument('[dir]', 'target directory', undefined)
    .option('-f, --force', 'overwrite non-empty target directory', false)
    .option('-n, --name <name>', 'override package name (defaults to folder name)')
    .option('--use-npm', 'use npm to install dependencies')
    .option('--use-pnpm', 'use pnpm to install dependencies')
    .option('--use-yarn', 'use yarn to install dependencies')
    .option('--use-bun', 'use bun to install dependencies')
    .option('--no-install', 'skip dependency installation')
    .option('--no-git', 'skip git init and initial commit')
    .action(async (dir: string | undefined, flags: InitCliFlags) => {
      await runInit(dir, flags);
    });

  await program.parseAsync(argv, { from: 'user' });
}
