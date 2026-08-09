import path from 'node:path';
import { parse } from 'svelte/compiler';
import type { Plugin } from 'vite';

type AstNode = {
  type?: string;
  name_loc?: { start: { line: number; column: number }; end: { character: number } };
  attributes?: Array<{ name?: string }>;
  [key: string]: unknown;
};

function collectElements(value: unknown, elements: AstNode[], seen = new Set<object>()): void {
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    for (const child of value) collectElements(child, elements, seen);
    return;
  }
  const node = value as AstNode;
  if (node.type === 'RegularElement' && node.name_loc) elements.push(node);
  for (const child of Object.values(node)) collectElements(child, elements, seen);
}

export function svelteLocPlugin(options: { slidesRoot: string }): Plugin {
  const slidesRoot = path.resolve(options.slidesRoot);
  return {
    name: 'open-slide:svelte-locations',
    apply: 'serve',
    enforce: 'pre',
    transform(source, rawId) {
      if (rawId.includes('?')) return null;
      let id = rawId.split('?')[0];
      if (id.startsWith('/@fs/')) id = id.slice(4);
      if (id.startsWith('@fs/')) id = `/${id.slice(4)}`;
      if (!id.endsWith('.svelte')) return null;
      const relative = path.relative(slidesRoot, id);
      if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
      const ast = parse(source, { modern: true });
      const elements: AstNode[] = [];
      collectElements(ast.fragment, elements);
      const insertions = elements
        .flatMap((element) => {
          const location = element.name_loc;
          if (
            !location ||
            element.attributes?.some((attribute) => attribute.name === 'data-osd-loc')
          ) {
            return [];
          }
          return [
            {
              offset: location.end.character,
              text: ` data-osd-loc="${location.start.line}:${location.start.column}" data-osd-file="${relative.split(path.sep).join('/')}"`,
            },
          ];
        })
        .sort((a, b) => b.offset - a.offset);
      if (insertions.length === 0) return null;
      let code = source;
      for (const insertion of insertions) {
        code = code.slice(0, insertion.offset) + insertion.text + code.slice(insertion.offset);
      }
      return { code, map: null };
    },
  };
}
