import { createServer, mergeConfig } from 'vite';
import { createViteConfig } from '../vite/config.ts';
import { createTailscaleShare, type ShareProvider } from './share.ts';

export interface DevOptions {
  port?: number;
  host?: string | boolean;
  open?: boolean;
  share?: ShareProvider;
}

export async function dev(opts: DevOptions = {}): Promise<void> {
  const base = await createViteConfig({ userCwd: process.cwd() });
  const host = opts.host ?? (opts.share === 'tailscale' ? '0.0.0.0' : undefined);
  const config = mergeConfig(base, {
    server: {
      ...(opts.port !== undefined ? { port: opts.port } : {}),
      ...(host !== undefined ? { host } : {}),
      ...(opts.open !== undefined ? { open: opts.open } : {}),
    },
  });
  const server = await createServer(config);
  await server.listen();
  server.printUrls();
  if (opts.share) {
    const address = server.httpServer?.address();
    const port = typeof address === 'object' && address ? address.port : opts.port;
    if (!port) {
      await server.close();
      throw new Error('Could not determine dev server port for sharing.');
    }
    try {
      if (opts.share === 'tailscale') {
        process.stdout.write('\n');
        process.stdout.write('  Tailscale Preview\n');
        const share = await createTailscaleShare(port);
        if (share.url) {
          process.stdout.write(`  ${share.url}\n`);
        } else {
          process.stdout.write(
            `  Run \`${share.statusCommand}\` to find this device's Tailscale IP.\n`,
          );
          process.stdout.write(
            `  Then open http://<tailscale-ip>:${port}/ from another tailnet device.\n`,
          );
        }
        if (share.stopCommand) {
          process.stdout.write(`  Stop sharing with \`${share.stopCommand}\`.\n`);
        }
      }
    } catch (err) {
      await server.close();
      throw err;
    }
  }
  server.bindCLIShortcuts({ print: true });
}
