import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import { gitInitAndCommit } from './git.ts';
import type { PackageManager } from './package-manager.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = resolve(HERE, '..', 'template');
const IS_WINDOWS = process.platform === 'win32';

export interface InitOptions {
  dir: string;
  force: boolean;
  name: string | undefined;
  packageManager: PackageManager;
  install: boolean;
  git: boolean;
}

export async function isDirNonEmpty(target: string): Promise<boolean> {
  if (!existsSync(target)) return false;
  const entries = await readdir(target);
  return entries.some((e) => !e.startsWith('.'));
}

async function readCliVersion(): Promise<string> {
  const pkg = JSON.parse(await readFile(resolve(HERE, '..', 'package.json'), 'utf8')) as {
    version: string;
  };
  return pkg.version;
}

// `.claude/skills/*` and `CLAUDE.md` are symlinks into `.agents/` + `AGENTS.md`
// in the repo, but `npm pack` drops symlinks from the published tarball. Rebuild
// them as real copies after scaffolding so users get both the OpenAI-style
// `.agents/` tree and the Claude Code paths.
async function materializeClaudeFiles(target: string): Promise<void> {
  const agentsMd = join(target, 'AGENTS.md');
  const claudeMd = join(target, 'CLAUDE.md');
  if (existsSync(agentsMd)) {
    await rm(claudeMd, { force: true });
    await cp(agentsMd, claudeMd, { dereference: true });
  }

  const agentsSkills = join(target, '.agents', 'skills');
  if (!existsSync(agentsSkills)) return;
  const claudeSkills = join(target, '.claude', 'skills');
  await rm(claudeSkills, { recursive: true, force: true });
  await mkdir(claudeSkills, { recursive: true });
  for (const entry of await readdir(agentsSkills, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    await cp(join(agentsSkills, entry.name), join(claudeSkills, entry.name), {
      recursive: true,
      dereference: true,
    });
  }
}

async function runInstall(pm: PackageManager, cwd: string): Promise<void> {
  await new Promise<void>((res, rej) => {
    const child = spawn(pm, ['install'], { cwd, stdio: 'inherit', shell: IS_WINDOWS });
    child.on('error', rej);
    child.on('close', (code) =>
      code === 0 ? res() : rej(new Error(`${pm} install exited with code ${code}`)),
    );
  });
}

export async function init(opts: InitOptions): Promise<void> {
  const { dir, force, name, packageManager, install, git } = opts;

  if (!existsSync(TEMPLATE_DIR)) {
    throw new Error(
      `Template missing at ${TEMPLATE_DIR}. If you are running from source, run \`pnpm --filter @open-slide/cli build\` first.`,
    );
  }

  const target = resolve(process.cwd(), dir);
  await mkdir(target, { recursive: true });

  if ((await isDirNonEmpty(target)) && !force) {
    throw new Error(`Target ${target} is not empty. Pass --force to scaffold into it anyway.`);
  }

  await cp(TEMPLATE_DIR, target, { recursive: true });
  await materializeClaudeFiles(target);

  const pkgPath = join(target, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as Record<string, unknown> & {
      dependencies?: Record<string, string>;
    };
    pkg.name = name ?? basename(target);
    pkg.version = '0.0.0';
    pkg.private = true;
    if (pkg.dependencies?.['@open-slide/core']) {
      pkg.dependencies['@open-slide/core'] = `^${await readCliVersion()}`;
    }
    await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  }

  await writeFile(join(target, '.gitignore'), 'node_modules\n');

  const cdTarget = dir === '.' ? basename(target) : dir;
  process.stdout.write(
    `\n${chalk.green.bold('✔ Created open-slide workspace')} ${chalk.dim(`in ${target}`)}\n`,
  );

  let installed = false;
  if (install) {
    process.stdout.write(`\n${chalk.bold(`Installing dependencies with ${packageManager}…`)}\n\n`);
    try {
      await runInstall(packageManager, target);
      installed = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stdout.write(
        `\n${chalk.yellow('! Dependency install failed:')} ${chalk.dim(msg)}\n` +
          chalk.dim(`  You can retry manually with \`${packageManager} install\`.\n`),
      );
    }
  }

  if (git) {
    const result = await gitInitAndCommit(target);
    if (result.status === 'committed') {
      process.stdout.write(`${chalk.green('✔')} Initialized git repository with first commit.\n`);
    } else if (result.status === 'skipped-nested') {
      process.stdout.write(
        `${chalk.yellow('!')} Skipped ${chalk.bold('git init')}: ${chalk.dim(result.message ?? '')}\n`,
      );
    } else if (result.status === 'skipped-no-git') {
      process.stdout.write(
        `${chalk.yellow('!')} Skipped git setup: ${chalk.dim(result.message ?? '')}\n`,
      );
    } else {
      process.stdout.write(
        `${chalk.yellow('!')} Git setup failed: ${chalk.dim(result.message ?? '')}\n` +
          chalk.dim('  You can initialize the repo manually.\n'),
      );
    }
  }

  process.stdout.write(`\n${chalk.bold('Next steps:')}\n`);
  process.stdout.write(`  ${chalk.cyan(`cd ${cdTarget}`)}\n`);
  if (!installed && install) {
    process.stdout.write(`  ${chalk.cyan(`${packageManager} install`)}\n`);
  } else if (!install) {
    process.stdout.write(
      `  ${chalk.cyan(`${packageManager} install`)}    ${chalk.dim('# install was skipped')}\n`,
    );
  }
  const devCommand = packageManager === 'npm' ? 'npm run dev' : `${packageManager} dev`;
  process.stdout.write(`  ${chalk.cyan(devCommand)}\n\n`);
  process.stdout.write(
    chalk.dim('Then open the dev server and start authoring in slides/<your-slide>/.\n'),
  );
}
