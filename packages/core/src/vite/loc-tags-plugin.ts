import path from 'node:path';
import { parse as babelParse } from '@babel/parser';
import * as t from '@babel/types';
import type { Plugin } from 'vite';
import { walkJsx } from './babel-walk.ts';

// Inject `data-slide-loc="<line>:<col>"` onto every host JSX element in
// slide source files so the inspector can map a click straight to a
// source location, sidestepping HMR-stale `_debugSource` on fibers.

// Capitalized components that explicitly forward `data-slide-loc` to a
// host root, so the inspector can target them like a host element.
const FORWARDING_COMPONENTS = new Set(['ImagePlaceholder']);

function isTaggableJsxName(name: t.JSXOpeningElement['name']): name is t.JSXIdentifier {
  if (!t.isJSXIdentifier(name)) return false;
  return /^[a-z]/.test(name.name) || FORWARDING_COMPONENTS.has(name.name);
}

function alreadyTagged(opening: t.JSXOpeningElement): boolean {
  return opening.attributes.some(
    (attr) =>
      t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === 'data-slide-loc',
  );
}

export function injectLocTags(code: string): string | null {
  let ast: t.File;
  try {
    ast = babelParse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: true,
    });
  } catch {
    return null;
  }

  const insertions: { offset: number; text: string }[] = [];
  walkJsx(ast, (node) => {
    if (!t.isJSXElement(node) || !node.loc) return;
    const opening = node.openingElement;
    const name = opening.name;
    if (!isTaggableJsxName(name) || alreadyTagged(opening)) return;
    insertions.push({
      offset: name.end ?? 0,
      text: ` data-slide-loc="${node.loc.start.line}:${node.loc.start.column}"`,
    });
  });

  if (insertions.length === 0) return null;
  insertions.sort((a, b) => b.offset - a.offset);
  let next = code;
  for (const ins of insertions) {
    next = next.slice(0, ins.offset) + ins.text + next.slice(ins.offset);
  }
  return next;
}

export type LocTagsPluginOptions = {
  userCwd: string;
  slidesDir?: string;
};

export function locTagsPlugin(opts: LocTagsPluginOptions): Plugin {
  const slidesRoot = path.resolve(opts.userCwd, opts.slidesDir ?? 'slides');
  return {
    name: 'open-slide:loc-tags',
    apply: 'serve',
    // Must run before @vitejs/plugin-react so the JSX transform
    // sees our injected attributes.
    enforce: 'pre',
    transform(code, id) {
      const filePath = id.split('?')[0];
      if (!filePath.startsWith(slidesRoot + path.sep)) return null;
      if (!filePath.endsWith(`${path.sep}index.tsx`)) return null;
      const next = injectLocTags(code);
      if (next === null) return null;
      return { code: next, map: null };
    },
  };
}
