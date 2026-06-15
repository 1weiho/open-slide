import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { ViteDevServer } from 'vite';
import { validateMutationRequest } from '../../http/request-guard.ts';
import { type ApiContext, json } from './context.ts';

// GET /__update-check  → { current, latest, outdated }
//   Compares the running @open-slide/core version against the npm `latest`
//   dist-tag. Network/parse failures degrade to { latest: null, outdated: false }.
// POST /__update-package → { packageManager, command, latest, message }
//   Installs @open-slide/core@latest with the detected package manager, then
//   runs `open-slide sync:skills`.

const PKG = '@open-slide/core';
const CACHE_TTL_MS = 10 * 60 * 1000;
const COMMAND_TIMEOUT_MS = 300_000;

type CheckResult = { current: string; latest: string | null; outdated: boolean };
type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';
type CommandSpec = { cmd: string; args: string[] };
type UpdateResult = {
  packageManager: PackageManager;
  command: string;
  latest: string | null;
  message: string;
};

let cache: { at: number; latest: string | null } | null = null;
let updateInFlight: Promise<UpdateResult> | null = null;

function parseSemver(v: string): [number, number, number] | null {
  const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(v.trim());
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function isOutdated(current: string, latest: string): boolean {
  const a = parseSemver(current);
  const b = parseSemver(latest);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) {
    if (b[i] > a[i]) return true;
    if (b[i] < a[i]) return false;
  }
  return false;
}

async function fetchLatest(now: number): Promise<string | null> {
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.latest;
  try {
    const res = await fetch(`https://registry.npmjs.org/${PKG}/latest`, {
      signal: AbortSignal.timeout(3000),
      headers: { accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`registry ${res.status}`);
    const body = (await res.json()) as { version?: unknown };
    const latest = typeof body.version === 'string' ? body.version : null;
    cache = { at: now, latest };
    return latest;
  } catch {
    return cache?.latest ?? null;
  }
}

async function fileExists(file: string): Promise<boolean> {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

export async function detectPackageManager(cwd: string): Promise<PackageManager> {
  const ua = process.env.npm_config_user_agent ?? '';
  if (ua.startsWith('pnpm')) return 'pnpm';
  if (ua.startsWith('yarn')) return 'yarn';
  if (ua.startsWith('bun')) return 'bun';
  if (ua.startsWith('npm')) return 'npm';

  if (await fileExists(path.join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (await fileExists(path.join(cwd, 'yarn.lock'))) return 'yarn';
  if (await fileExists(path.join(cwd, 'bun.lockb'))) return 'bun';
  if (await fileExists(path.join(cwd, 'bun.lock'))) return 'bun';
  if (await fileExists(path.join(cwd, 'package-lock.json'))) return 'npm';
  return 'npm';
}

export function updateCommandFor(packageManager: PackageManager): CommandSpec {
  switch (packageManager) {
    case 'pnpm':
      return { cmd: 'pnpm', args: ['add', `${PKG}@latest`] };
    case 'yarn':
      return { cmd: 'yarn', args: ['add', `${PKG}@latest`] };
    case 'bun':
      return { cmd: 'bun', args: ['add', `${PKG}@latest`] };
    case 'npm':
      return { cmd: 'npm', args: ['install', `${PKG}@latest`] };
  }
}

function localOpenSlideCommand(cwd: string): CommandSpec {
  const bin = process.platform === 'win32' ? 'open-slide.cmd' : 'open-slide';
  return { cmd: path.join(cwd, 'node_modules', '.bin', bin), args: ['sync:skills'] };
}

function formatCommand(spec: CommandSpec): string {
  return [spec.cmd, ...spec.args].join(' ');
}

async function runCommand(spec: CommandSpec, cwd: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(spec.cmd, spec.args, {
      cwd,
      env: process.env,
      shell: process.platform === 'win32',
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`${formatCommand(spec)} timed out`));
    }, COMMAND_TIMEOUT_MS);

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
      if (stderr.length > 2000) stderr = stderr.slice(-2000);
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
        return;
      }
      const detail = stderr.trim();
      reject(new Error(detail || `${formatCommand(spec)} exited with code ${code ?? 'unknown'}`));
    });
  });
}

async function updatePackage(ctx: ApiContext): Promise<UpdateResult> {
  const packageManager = await detectPackageManager(ctx.userCwd);
  const updateCommand = updateCommandFor(packageManager);
  const syncCommand = localOpenSlideCommand(ctx.userCwd);

  await runCommand(updateCommand, ctx.userCwd);
  await runCommand(syncCommand, ctx.userCwd);

  cache = null;
  const latest = await fetchLatest(Date.now());
  return {
    packageManager,
    command: `${formatCommand(updateCommand)} && open-slide sync:skills`,
    latest,
    message: 'Updated @open-slide/core and synced skills.',
  };
}

export function registerUpdateRoutes(server: ViteDevServer, ctx: ApiContext): void {
  server.middlewares.use('/__update-check', async (req, res, next) => {
    if ((req.method ?? 'GET') !== 'GET') return next();
    const latest = await fetchLatest(Date.now());
    const result: CheckResult = {
      current: ctx.coreVersion,
      latest,
      outdated: latest ? isOutdated(ctx.coreVersion, latest) : false,
    };
    res.setHeader('cache-control', 'no-store');
    json(res, 200, result);
  });

  server.middlewares.use('/__update-package', async (req, res, next) => {
    if ((req.method ?? 'GET') !== 'POST') return next();

    const guard = validateMutationRequest(req);
    if (!guard.ok) return json(res, guard.status, { error: guard.error });

    try {
      updateInFlight ??= updatePackage(ctx).finally(() => {
        updateInFlight = null;
      });
      const result = await updateInFlight;
      json(res, 200, result);
    } catch (err) {
      json(res, 500, { error: err instanceof Error ? err.message : 'update failed' });
    }
  });
}
