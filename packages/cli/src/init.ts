import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdir, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PackageManager } from './package-manager.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = resolve(HERE, '..', 'templates');
const IS_WINDOWS = process.platform === 'win32';

export type Framework = 'react' | 'svelte';

export interface ScaffoldOptions {
  target: string;
  force: boolean;
  name: string | undefined;
  framework: Framework;
}

export function sanitizeDirName(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '.' || trimmed === '..') return trimmed;
  const cleaned = trimmed
    .replace(/\s+/g, '-')
    .replace(/[^\\\p{L}\p{N}_./-]/gu, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
    .replace(/-*([/\\])-*/g, '$1');
  if (cleaned === '' || /^[/\\]+$/.test(cleaned)) return 'my-slides';
  return cleaned;
}

export async function isDirNonEmpty(target: string): Promise<boolean> {
  if (!existsSync(target)) return false;
  const entries = await readdir(target);
  return entries.some((e) => !e.startsWith('.'));
}

declare const __REACT_VERSION_AT_BUILD__: string;
declare const __SVELTE_VERSION_AT_BUILD__: string;

export function runtimePackage(framework: Framework): '@open-slide/react' | '@open-slide/svelte' {
  return framework === 'react' ? '@open-slide/react' : '@open-slide/svelte';
}

function runtimeVersionRange(framework: Framework): string {
  return `^${framework === 'react' ? __REACT_VERSION_AT_BUILD__ : __SVELTE_VERSION_AT_BUILD__}`;
}

async function linkOrCopy(relSrc: string, dst: string): Promise<void> {
  await rm(dst, { recursive: true, force: true });
  if (IS_WINDOWS) {
    await cp(resolve(dirname(dst), relSrc), dst, { recursive: true });
    return;
  }
  await symlink(relSrc, dst);
}

async function materializeTemplateLinks(target: string): Promise<void> {
  const claudeMd = join(target, 'CLAUDE.md');
  if (!existsSync(claudeMd) && existsSync(join(target, 'AGENTS.md'))) {
    await linkOrCopy('AGENTS.md', claudeMd);
  }

  const agentsSkills = join(target, '.agents', 'skills');
  if (!existsSync(agentsSkills)) return;

  const claudeSkills = join(target, '.claude', 'skills');
  await mkdir(claudeSkills, { recursive: true });

  const entries = await readdir(agentsSkills, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    await linkOrCopy(
      join('..', '..', '.agents', 'skills', entry.name),
      join(claudeSkills, entry.name),
    );
  }
}

export async function scaffold(opts: ScaffoldOptions): Promise<void> {
  const { target, force, name, framework } = opts;
  const templateDir = resolve(TEMPLATES_DIR, framework);

  if (!existsSync(templateDir)) {
    throw new Error(
      `Template missing at ${templateDir}. If you are running from source, run \`pnpm --filter @open-slide/cli build\` first.`,
    );
  }

  await mkdir(target, { recursive: true });

  if ((await isDirNonEmpty(target)) && !force) {
    throw new Error(`Target ${target} is not empty. Pass --force to scaffold into it anyway.`);
  }

  await cp(templateDir, target, { recursive: true });
  await materializeTemplateLinks(target);

  const pkgPath = join(target, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as Record<string, unknown> & {
      dependencies?: Record<string, string>;
    };
    pkg.name = name ?? basename(target);
    pkg.version = '0.0.0';
    pkg.private = true;
    const packageName = runtimePackage(framework);
    if (pkg.dependencies?.[packageName]) {
      pkg.dependencies[packageName] = runtimeVersionRange(framework);
    }
    await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  }

  await writeFile(join(target, '.gitignore'), 'node_modules\ndist\n.DS_Store\n');
}

export type InstallResult = { ok: true } | { ok: false; output: string };

// Output is captured rather than inherited so the package manager's own
// progress UI doesn't fight the spinner; it is shown only on failure.
export function installDependencies(pm: PackageManager, cwd: string): Promise<InstallResult> {
  return new Promise((res) => {
    let output = '';
    const child = spawn(pm, ['install'], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: IS_WINDOWS,
    });
    child.stdout?.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });
    child.on('error', (err) => res({ ok: false, output: err.message }));
    child.on('close', (code) => {
      if (code === 0) res({ ok: true });
      else res({ ok: false, output: output.trim() || `${pm} install exited with code ${code}` });
    });
  });
}
