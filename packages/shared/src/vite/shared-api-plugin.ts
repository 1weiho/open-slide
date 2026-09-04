import type { Plugin, ViteDevServer } from 'vite';
import { type ApiContext, type ApiPluginOptions, makeContext } from './api-context.ts';
import { type AssetReferenceAdapter, registerAssetRoutes } from './asset-routes.ts';
import { registerFolderRoutes } from './folder-routes.ts';
import { registerRestartRoutes } from './restart-routes.ts';
import { registerSlideRoutes } from './slide-routes.ts';
import { registerSvglRoutes } from './svgl-routes.ts';
import { registerWatchers } from './watchers.ts';

export type SharedApiRoutesOptions = {
  assetReferences?: AssetReferenceAdapter;
};

export function registerSharedApiRoutes(
  server: ViteDevServer,
  ctx: ApiContext,
  options: SharedApiRoutesOptions = {},
): void {
  registerWatchers(server, ctx);
  registerSlideRoutes(server, ctx);
  registerAssetRoutes(server, ctx, options.assetReferences);
  registerSvglRoutes(server);
  registerFolderRoutes(server, ctx);
  registerRestartRoutes(server);
}

export function sharedApiPlugin(opts: ApiPluginOptions & SharedApiRoutesOptions): Plugin {
  return {
    name: 'open-slide:shared-api',
    apply: 'serve',
    configureServer(server) {
      registerSharedApiRoutes(server, makeContext(opts), opts);
    },
  };
}
