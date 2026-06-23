import { build, type Plugin } from 'esbuild';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);

// Slide bundles are written to a throwaway OS temp dir (each is removed in the
// finally below). The engine runs embedded inside @open-slide/core, so it must
// not assume its own package directory is writable.
const CACHE_ROOT = path.join(os.tmpdir(), 'open-slide-pptx-cache');

// Resolve React (and its subpaths) to ABSOLUTE paths and keep them external.
// The deck bundle lands in an OS temp dir with no node_modules of its own, so
// bare `import 'react'` specifiers would fail to resolve there. Pinning them to
// the engine's already-resolved React copy keeps the bundle importable from
// anywhere AND guarantees a single React instance shared with render-html.ts —
// two copies would break hooks during renderToStaticMarkup.
const reactResolvePlugin: Plugin = {
  name: 'react-resolve-abs',
  setup(b) {
    b.onResolve({ filter: /^react(-dom)?(\/.*)?$/ }, (args) => {
      try {
        return { path: require.resolve(args.path), external: true };
      } catch {
        return { path: args.path, external: true };
      }
    });
  },
};

const pngStubPlugin: Plugin = {
  name: 'png-stub',
  setup(b) {
    b.onResolve({ filter: /\.(png|jpe?g|gif|webp|svg)$/ }, (args) => ({
      path: args.path,
      namespace: 'asset-stub',
    }));
    b.onLoad({ filter: /.*/, namespace: 'asset-stub' }, (args) => ({
      contents: `export default ${JSON.stringify(args.path)};`,
      loader: 'js',
    }));
  },
};

// Stub for @open-slide/core when bundling user decks. The real package
// pulls in Vite, react-router, and dev-only UI; we only need its public
// runtime surface to type-check and not throw at static-render time.
//
// `useSlidePageNumber` reads from a globalThis slot populated by render-html.ts
// before each page renders, so per-page footers ("page X of Y") show correct
// values in the exported pptx instead of a static placeholder.
const OPEN_SLIDE_STUB_SOURCE = `
import React from 'react';
const __os_g = globalThis;
export function useSlidePageNumber() {
  return {
    current: (__os_g.__os_pptx_page_index ?? 0) + 1,
    total: __os_g.__os_pptx_page_total ?? 1,
  };
}
export function ImagePlaceholder() { return null; }
export function cssVarsToString() { return ''; }
export function designToCssVars() { return {}; }
export const defaultDesign = {};
export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;
// Step/Steps reveal animation. The export has no StepHost, so every step
// renders in its final revealed (visible) state. Step keeps its wrapper
// <div> so layout matches the live deck; Steps passes children straight
// through. Mirrors @open-slide/core's runtime export surface so decks using
// step-reveal still bundle and render.
export function Steps(props) { return React.createElement(React.Fragment, null, props.children); }
export function Step(props) {
  return React.createElement(
    'div',
    { 'data-osd-step': 'revealed', style: { opacity: 1, visibility: 'visible' } },
    props.children,
  );
}
`;

const openSlideStubPlugin: Plugin = {
  name: 'open-slide-stub',
  setup(b) {
    b.onResolve({ filter: /^@open-slide\/core$/ }, (args) => ({
      path: args.path,
      namespace: 'os-stub',
    }));
    b.onLoad({ filter: /.*/, namespace: 'os-stub' }, () => ({
      contents: OPEN_SLIDE_STUB_SOURCE,
      loader: 'js',
    }));
  },
};

export type SlideModule = {
  default: Array<() => unknown>;
  meta?: { title?: string };
  design?: unknown;
};

export async function loadSlideModule(slideDir: string): Promise<SlideModule> {
  const entry = path.resolve(slideDir, 'index.tsx');
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
    target: 'es2022',
    jsx: 'automatic',
    plugins: [pngStubPlugin, openSlideStubPlugin, reactResolvePlugin],
    logLevel: 'silent',
  });
  const code = result.outputFiles[0].text;
  await mkdir(CACHE_ROOT, { recursive: true });
  // Content-addressed bundle path. Node's ESM loader caches every imported URL
  // for the process lifetime and never evicts it, so a unique temp path per
  // export would leak one module record per export in the long-lived Vite dev
  // server. Keying the URL by a hash of the bundle means re-exporting the same
  // deck reuses the cached module — the cache is bounded by distinct deck
  // content, not by export count. The file is the cache key, so it is kept.
  const hash = createHash('sha1').update(code).digest('hex').slice(0, 16);
  const bundlePath = path.join(CACHE_ROOT, `slide-${hash}.mjs`);
  if (!existsSync(bundlePath)) {
    await writeFile(bundlePath, code, 'utf8');
  }
  return (await import(pathToFileURL(bundlePath).href)) as SlideModule;
}
