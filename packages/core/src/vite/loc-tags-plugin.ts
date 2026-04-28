import path from 'node:path';
import { parse as babelParse } from '@babel/parser';
import type { Plugin } from 'vite';
import { type AstNode, walkJsx } from './babel-walk.ts';

// Inject `data-slide-loc="<line>:<col>"` onto every host JSX element in
// slide source files. The inspector reads this attribute off the DOM at
// click time to map a click to a source location directly, instead of
// walking React fibers and trusting `_debugSource` (which can be stale
// after HMR, or point at a parent component invocation that doesn't
// forward `style`).
//
// The line/col captured is the position of the element's opening `<`
// in the on-disk file as Vite reads it. Each `/__edit` write triggers
// a re-transform, so the attribute stays in sync with the file.

function isHostJsxName(name: unknown): name is { type: string; name: string; end: number } {
  if (!name || typeof name !== 'object') return false;
  const n = name as { type?: string; name?: string };
  // Only lowercase-identifier tags render as DOM elements; capitalized
  // ones are React components and may not forward arbitrary props.
  return n.type === 'JSXIdentifier' && typeof n.name === 'string' && /^[a-z]/.test(n.name);
}

function alreadyTagged(opening: AstNode): boolean {
  const attrs = (opening as unknown as { attributes?: AstNode[] }).attributes ?? [];
  for (const attr of attrs) {
    if (attr.type !== 'JSXAttribute') continue;
    const name = (attr as unknown as { name?: { type?: string; name?: string } }).name;
    if (name?.type === 'JSXIdentifier' && name.name === 'data-slide-loc') return true;
  }
  return false;
}

export function injectLocTags(code: string): string | null {
  let ast: unknown;
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
    if (node.type !== 'JSXElement') return;
    const opening = (node as unknown as { openingElement?: AstNode }).openingElement;
    if (!opening) return;
    const name = (opening as unknown as { name?: unknown }).name;
    if (!isHostJsxName(name)) return;
    if (alreadyTagged(opening)) return;
    const loc = node.loc;
    if (!loc) return;
    insertions.push({
      offset: name.end,
      text: ` data-slide-loc="${loc.start.line}:${loc.start.column}"`,
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
    // Run before @vitejs/plugin-react so React's JSX transform sees our
    // injected attributes as part of the source.
    enforce: 'pre',
    transform(code, id) {
      const filePath = id.split('?')[0];
      // Only slide entry files: `<slidesRoot>/<id>/index.tsx`.
      if (!filePath.startsWith(slidesRoot + path.sep)) return null;
      if (!filePath.endsWith(`${path.sep}index.tsx`)) return null;
      const next = injectLocTags(code);
      if (next === null) return null;
      return { code: next, map: null };
    },
  };
}
