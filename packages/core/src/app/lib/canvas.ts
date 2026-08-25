import config from 'virtual:open-slide/config';

// Separate from sdk.ts because the virtual module only resolves inside a Vite
// graph, and sdk.ts is bundled into dist and imported by unit tests.

export const CANVAS_WIDTH = config.canvas.width;

export const CANVAS_HEIGHT = config.canvas.height;
