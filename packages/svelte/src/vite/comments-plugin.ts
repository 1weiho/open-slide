import fs from 'node:fs/promises';
import path from 'node:path';
import {
  b64urlEncode,
  markerDeleteRegex,
  newCommentId,
  offsetToLine,
  parseMarkers,
} from '@open-slide/shared/editing';
import { validateMutationRequest } from '@open-slide/shared/http';
import { json, readBody } from '@open-slide/shared/vite';
import { parse } from 'svelte/compiler';
import type { Plugin } from 'vite';

type ElementNode = {
  type: string;
  end: number;
  name_loc: { start: { line: number; column: number } };
};

function findElement(
  value: unknown,
  line: number,
  column: number,
  seen = new Set<object>(),
): ElementNode | null {
  if (!value || typeof value !== 'object' || seen.has(value)) return null;
  seen.add(value);
  if (Array.isArray(value)) {
    for (const child of value) {
      const found = findElement(child, line, column, seen);
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
    const found = findElement(child, line, column, seen);
    if (found) return found;
  }
  return null;
}

function resolveSourceFile(slidesRoot: string, file: unknown): string | null {
  if (typeof file !== 'string' || !file.endsWith('.svelte')) return null;
  const resolved = path.resolve(slidesRoot, file);
  const relative = path.relative(slidesRoot, resolved);
  return relative.startsWith('..') || path.isAbsolute(relative) ? null : resolved;
}

export function svelteCommentsPlugin(options: { slidesRoot: string }): Plugin {
  const slidesRoot = path.resolve(options.slidesRoot);
  return {
    name: 'open-slide:svelte-comments',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__comments', async (request, response, next) => {
        const url = new URL(request.url ?? '/', 'http://local');
        const requestCheck =
          request.method === 'POST'
            ? validateMutationRequest(request, { requireJsonBody: true })
            : request.method === 'DELETE'
              ? validateMutationRequest(request)
              : null;
        if (requestCheck && !requestCheck.ok) {
          return json(response, requestCheck.status, { error: requestCheck.error });
        }
        const postBody =
          request.method === 'POST' ? ((await readBody(request)) as Record<string, unknown>) : null;
        const file = resolveSourceFile(slidesRoot, postBody?.file ?? url.searchParams.get('file'));
        if (!file) return json(response, 400, { error: 'invalid file' });

        try {
          if (request.method === 'GET' && url.pathname === '/') {
            const source = await fs.readFile(file, 'utf8');
            return json(response, 200, { comments: parseMarkers(source) });
          }

          if (request.method === 'POST' && url.pathname === '/add') {
            const body = postBody as {
              line?: unknown;
              column?: unknown;
              text?: unknown;
              hint?: unknown;
            };
            if (
              !Number.isInteger(body.line) ||
              !Number.isInteger(body.column) ||
              typeof body.text !== 'string' ||
              !body.text.trim()
            ) {
              return json(response, 400, { error: 'invalid comment' });
            }
            const source = await fs.readFile(file, 'utf8');
            const ast = parse(source, { modern: true });
            const element = findElement(ast.fragment, body.line as number, body.column as number);
            if (!element) return json(response, 422, { error: 'element not found' });
            const id = newCommentId();
            const ts = new Date().toISOString();
            const payload = b64urlEncode(
              JSON.stringify({
                note: body.text.trim(),
                hint: typeof body.hint === 'string' ? body.hint : undefined,
              }),
            );
            const marker = `<!-- @slide-comment id="${id}" ts="${ts}" text="${payload}" -->`;
            const updated = source.slice(0, element.end) + marker + source.slice(element.end);
            await fs.writeFile(file, updated, 'utf8');
            return json(response, 200, {
              id,
              line: offsetToLine(updated, element.end),
            });
          }

          if (request.method === 'DELETE' && /^\/c-[a-f0-9]+$/.test(url.pathname)) {
            const source = await fs.readFile(file, 'utf8');
            const marker = markerDeleteRegex(url.pathname.slice(1));
            if (!marker.test(source)) return json(response, 404, { error: 'marker not found' });
            await fs.writeFile(file, source.replace(marker, ''), 'utf8');
            return json(response, 200, { ok: true });
          }

          return next();
        } catch (error) {
          return json(response, 500, { error: String((error as Error).message ?? error) });
        }
      });
    },
  };
}
