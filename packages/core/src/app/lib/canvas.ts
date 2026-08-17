import config from 'virtual:open-slide/config';

/**
 * Live canvas dimensions for the running workspace, resolved from the `canvas`
 * field in `open-slide.config.ts` (see `src/canvas.ts` for presets and
 * validation). The Vite plugin normalises presets to explicit pixels before
 * they reach the browser, so there is nothing to parse here.
 *
 * This lives apart from `sdk.ts` on purpose: the virtual module only resolves
 * inside a Vite graph, and `sdk.ts` is bundled into `dist` by tsdown and
 * imported by unit tests.
 */
export const CANVAS_WIDTH = config.canvas.width;
export const CANVAS_HEIGHT = config.canvas.height;
