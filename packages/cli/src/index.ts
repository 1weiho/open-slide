import { readFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import { Command } from 'commander';
import prompts from 'prompts';
import { init, isDirNonEmpty, type InitOptions } from './init.ts';

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
}

function onCancel(): never {
  process.stdout.write(chalk.dim('\nCancelled.\n'));
  process.exit(130);
}

async function runInit(dirArg: string | undefined, flags: InitCliFlags): Promise<void> {
  const isTTY = Boolean(process.stdin.isTTY && process.stdout.isTTY);

  let dir = dirArg;
  let name = flags.name;
  let force = flags.force ?? false;

  if (isTTY && dir === undefined) {
    const answers = await prompts(
      [
        {
          type: 'text',
          name: 'dir',
          message: 'Target directory',
          initial: '.',
        },
        {
          type: 'text',
          name: 'name',
          message: 'Package name',
          initial: (_prev: string, values: { dir: string }) =>
            basename(resolve(process.cwd(), values.dir || '.')),
        },
      ],
      { onCancel },
    );
    dir = answers.dir;
    if (name === undefined) name = answers.name;
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

  const opts: InitOptions = { dir: resolvedDir, force, name };
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
    .action(async (dir: string | undefined, flags: InitCliFlags) => {
      await runInit(dir, flags);
    });

  await program.parseAsync(argv, { from: 'user' });
}
