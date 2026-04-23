import { existsSync } from 'node:fs';
import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = resolve(HERE, '..', 'template');

export interface InitOptions {
  dir: string;
  force: boolean;
  name: string | undefined;
}

export async function isDirNonEmpty(target: string): Promise<boolean> {
  if (!existsSync(target)) return false;
  const entries = await readdir(target);
  return entries.some((e) => !e.startsWith('.'));
}

export async function init({ dir, force, name }: InitOptions): Promise<void> {
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

  const pkgPath = join(target, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as Record<string, unknown>;
    pkg.name = name ?? basename(target);
    pkg.version = '0.0.0';
    pkg.private = true;
    await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  }

  const cdTarget = dir === '.' ? basename(target) : dir;
  process.stdout.write(
    `\n${chalk.green.bold('✔ Created open-slide workspace')} ${chalk.dim(`in ${target}`)}\n\n` +
      `${chalk.bold('Next steps:')}\n` +
      `  ${chalk.cyan(`cd ${cdTarget}`)}\n` +
      `  ${chalk.cyan('pnpm install')}    ${chalk.dim('# or npm install / yarn')}\n` +
      `  ${chalk.cyan('pnpm dev')}\n\n` +
      chalk.dim('Then open the dev server and start authoring in slides/<your-slide>/.\n'),
  );
}
