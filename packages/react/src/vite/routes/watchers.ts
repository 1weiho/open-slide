import path from 'node:path';
import type { ViteDevServer } from 'vite';
import { SLIDE_ID_RE } from '../../editing/slide-ops.ts';
import { GLOBAL_SCOPE } from '../../files/assets.ts';
import type { ApiContext } from './context.ts';

// Surface folder-manifest and asset-tree mutations as HMR pings so the
// editor's panels can refresh without a full reload.
export function registerWatchers(server: ViteDevServer, ctx: ApiContext): void {
  server.watcher.add(ctx.manifestPath);
  server.watcher.on('change', (p) => {
    if (p === ctx.manifestPath) {
      server.ws.send({ type: 'custom', event: 'open-slide:files-changed' });
    }
  });

  server.watcher.add(ctx.globalAssetsRoot);
  const onAssetChange = (p: string) => {
    if (p.startsWith(ctx.globalAssetsRoot + path.sep) || p === ctx.globalAssetsRoot) {
      server.ws.send({
        type: 'custom',
        event: 'open-slide:assets-changed',
        data: { slideId: GLOBAL_SCOPE },
      });
      return;
    }
    if (!p.startsWith(ctx.slidesRoot + path.sep)) return;
    const rel = p.slice(ctx.slidesRoot.length + 1);
    const parts = rel.split(path.sep);
    if (parts.length < 3 || parts[1] !== 'assets') return;
    const slideId = parts[0];
    if (!SLIDE_ID_RE.test(slideId)) return;
    server.ws.send({
      type: 'custom',
      event: 'open-slide:assets-changed',
      data: { slideId },
    });
  };
  server.watcher.on('add', onAssetChange);
  server.watcher.on('change', onAssetChange);
  server.watcher.on('unlink', onAssetChange);
}
