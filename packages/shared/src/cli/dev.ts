import { type ChildProcess, fork } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { InlineConfig } from 'vite';
import { createServer, mergeConfig } from 'vite';
import { DEV_SUPERVISED_ENV, RESTART_EXIT_CODE } from '../vite/restart-routes.ts';

export interface DevOptions {
  port?: number;
  host?: string | boolean;
  open?: boolean;
}

export type DevRuntime = {
  createViteConfig: (options: {
    userCwd: string;
    mode?: 'serve' | 'build';
  }) => Promise<InlineConfig>;
  runtimePackage: string;
  childArgs?: string[];
};

export async function dev(opts: DevOptions = {}, runtime: DevRuntime): Promise<void> {
  if (process.env[DEV_SUPERVISED_ENV] === '1') {
    await startServer(opts, runtime.createViteConfig);
    return;
  }
  supervise(opts, runtime);
}

async function startServer(
  opts: DevOptions,
  createViteConfig: DevRuntime['createViteConfig'],
): Promise<void> {
  const base = await createViteConfig({ userCwd: process.cwd() });
  const config = mergeConfig(base, {
    server: {
      ...(opts.port !== undefined ? { port: opts.port } : {}),
      ...(opts.host !== undefined ? { host: opts.host } : {}),
      ...(opts.open !== undefined ? { open: opts.open } : {}),
    },
  });
  const server = await createServer(config);
  await server.listen();
  server.printUrls();
  server.bindCLIShortcuts({ print: true });

  const address = server.httpServer?.address();
  if (process.send && address && typeof address === 'object') {
    process.send({ type: 'open-slide:listening', port: address.port });
  }
}

// The server runs in a child process so an in-app update can exit with
// RESTART_EXIT_CODE and be respawned against the freshly installed package.
function supervise(opts: DevOptions, runtime: DevRuntime): void {
  const userCwd = process.cwd();
  let port = opts.port;
  let openBrowser = opts.open;
  let child: ChildProcess | undefined;
  let shuttingDown = false;

  const spawnChild = () => {
    child = fork(
      resolveDevEntry(userCwd, runtime.runtimePackage),
      devArgs({ ...opts, port, open: openBrowser }, runtime.childArgs),
      {
        cwd: userCwd,
        stdio: 'inherit',
        env: { ...process.env, [DEV_SUPERVISED_ENV]: '1' },
      },
    );
    child.on('error', (err) => {
      process.stderr.write(`error: ${err.message}\n`);
      process.exit(1);
    });
    child.on('message', (message) => {
      if (typeof message !== 'object' || message === null) return;
      const { type, port: reportedPort } = message as { type?: unknown; port?: unknown };
      // remember the resolved port so restarts land on the same address
      if (type === 'open-slide:listening' && typeof reportedPort === 'number') {
        port = reportedPort;
      }
    });
    child.on('exit', (code, signal) => {
      if (shuttingDown) process.exit(0);
      if (code === RESTART_EXIT_CODE) {
        openBrowser = false;
        spawnChild();
        return;
      }
      if (signal) process.exit(1);
      process.exit(code ?? 0);
    });
  };

  // Forward termination to the child so a signal sent directly to the
  // supervisor (e.g. by a process manager) never orphans the dev server.
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => {
      shuttingDown = true;
      child?.kill(signal);
    });
  }

  spawnChild();
}

function devArgs(opts: DevOptions, childArgs: string[] = []): string[] {
  const args = ['dev', ...childArgs];
  if (opts.port !== undefined) args.push('--port', String(opts.port));
  if (opts.host === true) args.push('--host');
  else if (typeof opts.host === 'string') args.push('--host', opts.host);
  if (opts.open) args.push('--open');
  return args;
}

function resolveDevEntry(userCwd: string, runtimePackage: string): string {
  const installed = path.join(userCwd, 'node_modules', ...runtimePackage.split('/'), 'bin.js');
  if (existsSync(installed)) return installed;
  return process.argv[1] as string;
}
