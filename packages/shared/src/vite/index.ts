export {
  type ApiContext,
  type ApiPluginOptions,
  json,
  makeContext,
  readBody,
  readSlideSource,
  resolveSlideEntryPath,
  resolveSlidePath,
} from './api-context.ts';
export { type AssetReferenceAdapter, registerAssetRoutes } from './asset-routes.ts';
export { type CurrentPluginOptions, currentPlugin } from './current-plugin.ts';
export {
  applyDesignWrite,
  type DesignPluginOptions,
  designPlugin,
  mergeDesign,
  type ParsedSlideDesign,
  parseSlideDesign,
  serializeDesign,
  type WriteResult,
} from './design-plugin.ts';
export { registerFolderRoutes } from './folder-routes.ts';
export {
  type ApplyNotesEditResult,
  applyNotesEdit,
  type NotesPluginOptions,
  notesPlugin,
  renderNoteLiteral,
} from './notes-plugin.ts';
export {
  generateSlidesModule,
  loadUserConfig,
  type OpenSlideConfig,
  type OpenSlidePluginOptions,
  openSlidePlugin,
} from './open-slide-plugin.ts';
export { hasRecentWrite, RECENT_WRITE_WINDOW_MS, recordWrite } from './recent-writes.ts';
export {
  DEV_SUPERVISED_ENV,
  RESTART_EXIT_CODE,
  registerRestartRoutes,
} from './restart-routes.ts';
export {
  registerSharedApiRoutes,
  type SharedApiRoutesOptions,
  sharedApiPlugin,
} from './shared-api-plugin.ts';
export { registerSlideRoutes } from './slide-routes.ts';
export { registerSvglRoutes } from './svgl-routes.ts';
export { type ThemesPluginOptions, themesPlugin } from './themes-plugin.ts';
export { registerWatchers } from './watchers.ts';
