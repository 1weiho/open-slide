import { readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { Command } from 'commander';
import { gitInitAndCommit } from './git.ts';
import {
  type Framework,
  installDependencies,
  isDirNonEmpty,
  sanitizeDirName,
  scaffold,
} from './init.ts';
import { detectPackageManager, PACKAGE_MANAGERS, type PackageManager } from './package-manager.ts';

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
  framework?: string;
}

function parseFramework(value: string): Framework {
  if (value === 'react' || value === 'svelte') return value;
  throw new Error(`Unsupported framework "${value}". Use react or svelte.`);
}

function unwrap<T>(value: T | symbol): T {
  if (p.isCancel(value)) {
    p.cancel('Cancelled.');
    process.exit(130);
  }
  return value as T;
}

function packageManagerFromFlags(flags: InitCliFlags): PackageManager | undefined {
  const picks: PackageManager[] = [];
  if (flags.useNpm) picks.push('npm');
  if (flags.usePnpm) picks.push('pnpm');
  if (flags.useYarn) picks.push('yarn');
  if (flags.useBun) picks.push('bun');

  if (picks.length > 1) {
    throw new Error(
      `Only one of --use-npm / --use-pnpm / --use-yarn / --use-bun may be specified (got ${picks.map((pm) => `--use-${pm}`).join(', ')}).`,
    );
  }
  return picks[0];
}

function displayPath(target: string): string {
  const rel = relative(process.cwd(), target);
  if (rel === '' || rel.startsWith('..')) return target;
  return rel;
}

// A spinner only makes sense on a live terminal; piped output gets a plain
// step line so logs stay readable.
function step(label: string, isTTY: boolean) {
  const spinner = isTTY ? p.spinner() : undefined;
  if (spinner) spinner.start(label);
  else p.log.step(label);
  return {
    done(message: string) {
      if (spinner) spinner.stop(message);
      else p.log.step(message);
    },
    fail(message: string) {
      if (spinner) spinner.error(message);
      else p.log.error(message);
    },
  };
}

function tail(output: string, lines = 12): string {
  return output.split('\n').slice(-lines).join('\n');
}

async function runInit(dirArg: string | undefined, flags: InitCliFlags): Promise<void> {
  const isTTY = Boolean(process.stdin.isTTY && process.stdout.isTTY);

  let packageManager = packageManagerFromFlags(flags);
  let dir = dirArg;
  let force = flags.force ?? false;
  const install = flags.install !== false;
  const git = flags.git !== false;
  let framework = flags.framework ? parseFramework(flags.framework) : undefined;

  if (isTTY && dir === undefined) {
    dir = unwrap(
      await p.text({
        message: 'Where should we create your workspace?',
        placeholder: '.',
        defaultValue: '.',
      }),
    );
  }

  if (dir !== undefined) {
    const safe = sanitizeDirName(dir);
    if (safe !== dir) {
      if (!isTTY) {
        throw new Error(
          `Target directory "${dir}" contains characters that break shell commands (spaces, quotes, etc.). Try "${safe}" instead.`,
        );
      }
      p.log.warn(`${chalk.bold(`"${dir}"`)} has characters that confuse shells.`);
      dir = sanitizeDirName(
        unwrap(
          await p.text({
            message: 'Directory name',
            initialValue: safe,
            validate: (value) => (value?.trim() ? undefined : 'Enter a directory name.'),
          }),
        ),
      );
    }
  }

  if (isTTY && framework === undefined) {
    framework = unwrap(
      await p.select({
        message: 'Framework',
        options: [
          { value: 'react' as const, label: 'React' },
          { value: 'svelte' as const, label: 'Svelte' },
        ],
        initialValue: 'react',
      }),
    );
  }

  if (isTTY && packageManager === undefined && install) {
    const detected = detectPackageManager();
    packageManager = unwrap(
      await p.select({
        message: 'Package manager',
        options: PACKAGE_MANAGERS.map((pm) => ({
          value: pm,
          label: pm,
          hint: pm === detected ? 'detected' : undefined,
        })),
        initialValue: detected,
      }),
    );
  }

  const resolvedDir = dir ?? '.';
  const target = resolve(process.cwd(), resolvedDir);

  if (!force && (await isDirNonEmpty(target))) {
    if (!isTTY) {
      throw new Error(`Target ${target} is not empty. Pass --force to scaffold into it anyway.`);
    }
    const overwrite = unwrap(
      await p.confirm({
        message: `${chalk.yellow(displayPath(target))} is not empty. Scaffold into it anyway?`,
        initialValue: false,
      }),
    );
    if (!overwrite) {
      p.outro(chalk.dim('Nothing written.'));
      return;
    }
    force = true;
  }

  const pm = packageManager ?? detectPackageManager();

  await scaffold({ target, force, name: flags.name, framework: framework ?? 'react' });
  p.log.step(`Created workspace ${chalk.dim(`in ${displayPath(target)}`)}`);

  let installed = false;
  if (install) {
    const task = step(`Installing dependencies with ${pm}`, isTTY);
    const result = await installDependencies(pm, target);
    if (result.ok) {
      installed = true;
      task.done(`Installed dependencies with ${pm}`);
    } else {
      task.fail('Dependency install failed');
      p.log.message(chalk.dim(tail(result.output)));
    }
  }

  if (git) {
    const result = await gitInitAndCommit(target);
    if (result.status === 'committed') {
      p.log.step('Initialized git repository');
    } else if (result.status === 'failed') {
      p.log.warn(`Git setup failed ${chalk.dim(`· ${result.message ?? ''}`)}`);
    } else {
      p.log.info(`Skipped git init ${chalk.dim(`· ${result.message ?? ''}`)}`);
    }
  }

  const next: string[] = [];
  if (target !== process.cwd()) next.push(`cd ${resolvedDir}`);
  if (!installed) next.push(`${pm} install`);
  next.push(pm === 'npm' ? 'npm run dev' : `${pm} dev`);
  p.note(next.map((line) => chalk.cyan(line)).join('\n'), 'Next steps');

  p.outro(`All set! ${chalk.dim('Docs: https://open-slide.dev/docs')}`);
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
    .option('--framework <framework>', 'runtime framework: react or svelte')
    .option('--use-npm', 'use npm to install dependencies')
    .option('--use-pnpm', 'use pnpm to install dependencies')
    .option('--use-yarn', 'use yarn to install dependencies')
    .option('--use-bun', 'use bun to install dependencies')
    .option('--no-install', 'skip dependency installation')
    .option('--no-git', 'skip git init and initial commit')
    .action(async (dir: string | undefined, flags: InitCliFlags) => {
      p.intro(`${chalk.inverse.bold(' open-slide ')} ${chalk.dim(`v${version}`)}`);
      try {
        await runInit(dir, flags);
      } catch (err) {
        p.cancel(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });

  await program.parseAsync(argv, { from: 'user' });
}
