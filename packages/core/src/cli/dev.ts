import { createServer, mergeConfig } from 'vite';
import { createViteConfig } from '../vite/config.ts';

export interface DevOptions {
  port?: number;
  host?: string | boolean;
  open?: boolean;
}

export async function dev(opts: DevOptions = {}): Promise<void> {
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
}
