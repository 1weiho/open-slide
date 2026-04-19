import { preview as vitePreview } from 'vite';
import { createViteConfig } from '../vite/config.ts';

export async function preview(): Promise<void> {
  const config = await createViteConfig({ userCwd: process.cwd() });
  const server = await vitePreview(config);
  server.printUrls();
}
