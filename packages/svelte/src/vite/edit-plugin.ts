import fs from 'node:fs/promises';
import path from 'node:path';
import { validateMutationRequest } from '@open-slide/shared/http';
import { json, readBody } from '@open-slide/shared/vite';
import { parse } from 'svelte/compiler';
import type { Plugin } from 'vite';

type ElementNode = {
  type: string;
  name: string;
  name_loc: { start: { line: number; column: number } };
  fragment?: { nodes?: Array<{ type: string; start: number; end: number }> };
};

function findElement(value: unknown, line: number, column: number): ElementNode | null {
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (const child of value) {
      const found = findElement(child, line, column);
      if (found) return found;
    }
    return null;
  }
  const node = value as Record<string, unknown>;
  if (node.type === 'RegularElement') {
    const element = node as unknown as ElementNode;
    if (element.name_loc.start.line === line && element.name_loc.start.column === column) {
      return element;
    }
  }
  for (const child of Object.values(node)) {
    const found = findElement(child, line, column);
    if (found) return found;
  }
  return null;
}

function escapeText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\{/g, '&#123;');
}

export function svelteEditPlugin(options: { slidesRoot: string }): Plugin {
  const slidesRoot = path.resolve(options.slidesRoot);
  return {
    name: 'open-slide:svelte-edit',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__svelte-edit', async (request, response, next) => {
        const url = new URL(request.url ?? '/', 'http://local');
        if (request.method !== 'PUT' || url.pathname !== '/') return next();
        const requestCheck = validateMutationRequest(request, { requireJsonBody: true });
        if (!requestCheck.ok) {
          return json(response, requestCheck.status, { error: requestCheck.error });
        }
        const body = (await readBody(request)) as {
          file?: unknown;
          line?: unknown;
          column?: unknown;
          text?: unknown;
        };
        if (
          typeof body.file !== 'string' ||
          !body.file.endsWith('.svelte') ||
          !Number.isInteger(body.line) ||
          !Number.isInteger(body.column) ||
          typeof body.text !== 'string'
        ) {
          return json(response, 400, { error: 'invalid edit' });
        }
        const file = path.resolve(slidesRoot, body.file);
        const relative = path.relative(slidesRoot, file);
        if (relative.startsWith('..') || path.isAbsolute(relative)) {
          return json(response, 400, { error: 'invalid file' });
        }
        try {
          const source = await fs.readFile(file, 'utf8');
          const ast = parse(source, { modern: true });
          const element = findElement(ast.fragment, body.line as number, body.column as number);
          const nodes = element?.fragment?.nodes ?? [];
          if (!element || nodes.length !== 1 || nodes[0].type !== 'Text') {
            return json(response, 422, { error: 'element text is not directly editable' });
          }
          const textNode = nodes[0];
          const updated =
            source.slice(0, textNode.start) + escapeText(body.text) + source.slice(textNode.end);
          await fs.writeFile(file, updated, 'utf8');
          return json(response, 200, { ok: true });
        } catch (error) {
          return json(response, 500, { error: String((error as Error).message ?? error) });
        }
      });
    },
  };
}
