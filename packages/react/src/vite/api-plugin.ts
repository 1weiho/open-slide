import { registerSharedApiRoutes } from '@open-slide/shared/vite';
import type { Plugin } from 'vite';
import { findAssetUsages, findReferencedAssets } from '../editing/revert-asset.ts';
import { registerCommentRoutes } from './routes/comments.ts';
import { type ApiPluginOptions, makeContext } from './routes/context.ts';
import { registerEditRoutes } from './routes/edit.ts';
import { registerUpdateRoutes } from './routes/update.ts';

// All open-slide dev-server endpoints in one plugin. To see the routes
// owned by a group, open the matching file under `routes/` — each file
// leads with a comment-block manifest of its endpoints.
export function apiPlugin(opts: ApiPluginOptions): Plugin {
  return {
    name: 'open-slide:api',
    apply: 'serve',
    configureServer(server) {
      const ctx = makeContext(opts);
      registerSharedApiRoutes(server, ctx, {
        assetReferences: { findAssetUsages, findReferencedAssets },
      });
      registerEditRoutes(server, ctx);
      registerCommentRoutes(server, ctx);
      registerUpdateRoutes(server, ctx);
    },
  };
}
