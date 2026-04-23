import { mergeConfig, preview as vitePreview } from 'vite';
import { createViteConfig } from '../vite/config.ts';

export interface PreviewOptions {
  port?: number;
  host?: string | boolean;
  open?: boolean;
}

export async function preview(opts: PreviewOptions = {}): Promise<void> {
  const base = await createViteConfig({ userCwd: process.cwd() });
  const config = mergeConfig(base, {
    preview: {
      ...(opts.port !== undefined ? { port: opts.port } : {}),
      ...(opts.host !== undefined ? { host: opts.host } : {}),
      ...(opts.open !== undefined ? { open: opts.open } : {}),
    },
  });
  const server = await vitePreview(config);
  server.printUrls();
}
