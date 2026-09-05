import path from 'node:path';
import * as t from '@babel/types';
import type { Plugin } from 'vite';
import { tryParse, walkJsx } from '../editing/babel-walk.ts';

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
  const ast = tryParse(code);
  if (!ast) return null;

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

// Only the deck entry, `<slidesDir>/<id>/index.tsx`. A tag carries a bare
// `line:column`, and `/__edit` resolves every write to the entry file, so a tag
// minted in a sibling or nested `.tsx` describes a position in a file nobody
// will open: `findInnermostJsxElement` falls back to any element whose span
// covers that position, which in a long entry is some unrelated element on
// another page, edited silently. `findSlideSource`'s fiber fallback already
// encodes this invariant — it accepts a `_debugSource` only when its `fileName`
// ends in `/slides/<id>/index.tsx` — and its comment assumes imported component
// files are untransformed. They were not, and the tag path runs first, so the
// guard never got a say. Untagged JSX now reaches that fallback and is correctly
// reported as not targetable.
//
// Vite normally hands `id` to plugins with forward slashes, but other plugins or
// virtual modules can pass through Windows-style paths. Compare both sides in
// POSIX shape so the match doesn't depend on which separator the caller used.
function isSlideEntryFile(id: string, slidesRootPosix: string): boolean {
  const filePath = id.split(/[?#]/)[0].replace(/\\/g, '/');
  if (!filePath.startsWith(`${slidesRootPosix}/`)) return false;
  const rel = filePath.slice(slidesRootPosix.length + 1);
  return /^[^/]+\/index\.tsx$/.test(rel);
}

export function locTagsPlugin(opts: LocTagsPluginOptions): Plugin {
  const slidesRoot = path.resolve(opts.userCwd, opts.slidesDir ?? 'slides').replace(/\\/g, '/');
  return {
    name: 'open-slide:loc-tags',
    apply: 'serve',
    // Must run before @vitejs/plugin-react so the JSX transform
    // sees our injected attributes.
    enforce: 'pre',
    transform(code, id) {
      if (!isSlideEntryFile(id, slidesRoot)) return null;
      const next = injectLocTags(code);
      if (next === null) return null;
      return { code: next, map: null };
    },
  };
}
