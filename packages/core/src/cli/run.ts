import { readFile } from 'node:fs/promises';
import path from 'node:path';
import * as readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import { Command, Option } from 'commander';
import { detectSkillsDrift, syncSkills } from './sync.ts';

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

interface DevFlags extends ServerFlags {
  skillsCheck?: boolean;
}

async function runSkillsDriftCheck(skillsDir: string): Promise<void> {
  if (process.env.OPEN_SLIDE_SKIP_SKILLS_CHECK === '1') return;

  let drift: Awaited<ReturnType<typeof detectSkillsDrift>>;
  try {
    drift = await detectSkillsDrift(skillsDir);
  } catch {
    return;
  }
  const stale = drift.filter((d) => d.status !== 'unchanged');
  if (stale.length === 0) return;

  const names = stale.map((d) => d.name).join(', ');
  const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY);

  if (!interactive) {
    process.stderr.write(
      `${chalk.yellow('!')} Skills out of date (${names}). Run \`open-slide sync:skills\` to update.\n`,
    );
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (
      await rl.question(
        `${chalk.yellow('!')} Skills out of date: ${chalk.bold(names)}. Sync now? ${chalk.dim('(Y/n) ')}`,
      )
    )
      .trim()
      .toLowerCase();
    if (answer === '' || answer === 'y' || answer === 'yes') {
      await syncSkills(skillsDir);
    } else {
      process.stdout.write(chalk.dim('Skipped. Run `open-slide sync:skills` later to update.\n'));
    }
  } finally {
    rl.close();
  }
}

interface BuildFlags {
  outDir?: string;
}

interface SyncFlags {
  dryRun?: boolean;
}

function resolveBuiltinSkillsDir(): string {
  // dist/cli/bin.js → ../../skills (package root + /skills)
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..', '..', 'skills');
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
    .option('--no-skills-check', 'skip the built-in skills drift check')
    .action(async (flags: DevFlags) => {
      if (flags.skillsCheck !== false) {
        await runSkillsDriftCheck(resolveBuiltinSkillsDir());
      }
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

  program
    .command('sync:skills')
    .description('Sync built-in skills from @open-slide/core into this workspace')
    .option('--dry-run', 'show what would change without writing')
    .action(async (flags: SyncFlags) => {
      const { syncSkills } = await import('./sync.ts');
      await syncSkills(resolveBuiltinSkillsDir(), flags);
    });

  await program.parseAsync(argv, { from: 'user' });
}
