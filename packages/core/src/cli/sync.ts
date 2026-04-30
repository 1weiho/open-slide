import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { cp, lstat, mkdir, readdir, readFile, readlink, rm, symlink } from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';

export interface SyncSkillsOptions {
  dryRun?: boolean;
}

type Status = 'added' | 'updated' | 'unchanged';

export async function syncSkills(skillsDir: string, opts: SyncSkillsOptions = {}): Promise<void> {
  const { dryRun = false } = opts;

  if (!existsSync(skillsDir)) {
    throw new Error(
      `Built-in skills directory missing at ${skillsDir}. The @open-slide/core package may be corrupt — try reinstalling.`,
    );
  }

  const cwd = process.cwd();
  const agentsSkillsDir = path.join(cwd, '.agents', 'skills');
  const claudeSkillsDir = path.join(cwd, '.claude', 'skills');

  const skillNames = (await readdir(skillsDir, { withFileTypes: true }))
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  if (skillNames.length === 0) {
    process.stdout.write(chalk.yellow('No skills found to sync.\n'));
    return;
  }

  const results: Array<{ name: string; status: Status }> = [];

  for (const name of skillNames) {
    const src = path.join(skillsDir, name);
    const dst = path.join(agentsSkillsDir, name);

    const srcHash = await hashDir(src);
    const dstHash = existsSync(dst) ? await hashDir(dst) : null;

    let status: Status;
    if (dstHash === null) status = 'added';
    else if (dstHash !== srcHash) status = 'updated';
    else status = 'unchanged';

    results.push({ name, status });

    if (dryRun) continue;
    if (status === 'unchanged') {
      await ensureClaudeSymlink(claudeSkillsDir, name);
      continue;
    }

    await mkdir(path.dirname(dst), { recursive: true });
    if (existsSync(dst)) await rm(dst, { recursive: true, force: true });
    await cp(src, dst, { recursive: true });
    await ensureClaudeSymlink(claudeSkillsDir, name);
  }

  printSummary(results, dryRun);
}

async function ensureClaudeSymlink(claudeSkillsDir: string, name: string): Promise<void> {
  await mkdir(claudeSkillsDir, { recursive: true });
  const linkPath = path.join(claudeSkillsDir, name);
  const target = path.join('..', '..', '.agents', 'skills', name);

  if (existsSync(linkPath)) {
    try {
      const stat = await lstat(linkPath);
      if (stat.isSymbolicLink()) {
        const current = await readlink(linkPath);
        if (current === target) return;
      }
      await rm(linkPath, { recursive: true, force: true });
    } catch {
      await rm(linkPath, { recursive: true, force: true });
    }
  }

  try {
    await symlink(target, linkPath, 'dir');
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'EPERM' || code === 'EEXIST') {
      const absoluteTarget = path.resolve(claudeSkillsDir, target);
      await cp(absoluteTarget, linkPath, { recursive: true });
    } else {
      throw err;
    }
  }
}

async function hashDir(dir: string): Promise<string> {
  const hash = createHash('sha256');
  const files = await collectFiles(dir);
  files.sort();
  for (const rel of files) {
    const abs = path.join(dir, rel);
    const data = await readFile(abs);
    hash.update(rel);
    hash.update('\0');
    hash.update(data);
    hash.update('\0');
  }
  return hash.digest('hex');
}

async function collectFiles(dir: string, prefix = ''): Promise<string[]> {
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const rel = prefix ? path.join(prefix, entry.name) : entry.name;
    if (entry.isDirectory()) {
      out.push(...(await collectFiles(path.join(dir, entry.name), rel)));
    } else if (entry.isFile()) {
      out.push(rel);
    }
  }
  return out;
}

function printSummary(results: Array<{ name: string; status: Status }>, dryRun: boolean): void {
  const symbols: Record<Status, string> = {
    added: chalk.green('+'),
    updated: chalk.yellow('~'),
    unchanged: chalk.dim('='),
  };
  const labels: Record<Status, string> = {
    added: chalk.green('added'),
    updated: chalk.yellow('updated'),
    unchanged: chalk.dim('unchanged'),
  };

  const header = dryRun
    ? chalk.bold('Dry run — no files written:')
    : chalk.bold('Synced built-in skills:');
  process.stdout.write(`${header}\n`);
  for (const { name, status } of results) {
    process.stdout.write(`  ${symbols[status]} ${name} ${chalk.dim(`(${labels[status]})`)}\n`);
  }
  const counts = results.reduce<Record<Status, number>>(
    (acc, { status }) => {
      acc[status] += 1;
      return acc;
    },
    { added: 0, updated: 0, unchanged: 0 },
  );
  process.stdout.write(
    chalk.dim(
      `\n${counts.added} added, ${counts.updated} updated, ${counts.unchanged} unchanged.\n`,
    ),
  );
}
