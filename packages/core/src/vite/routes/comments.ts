import fs from 'node:fs/promises';
import type { ViteDevServer } from 'vite';
import {
  COMMENT_INTENTS,
  encodeCommentPayload,
  findInsertion,
  isCommentIntent,
  markerDeleteRegex,
  newCommentId,
  offsetToLine,
  parseMarkers,
} from '../../editing/comments.ts';
import { validateMutationRequest } from '../../http/request-guard.ts';
import {
  type ApiContext,
  json,
  readBody,
  readSlideSource,
  resolveSlideEntryPath,
} from './context.ts';

// GET    /__comments        list markers for ?slideId=…
// POST   /__comments/add    add marker { slideId, line, column?, text, hint?, intent? }
// DELETE /__comments/:id    remove marker

type AddCommentBody = {
  slideId?: string;
  line?: number;
  column?: number;
  text?: string;
  hint?: unknown;
  intent?: unknown;
};

export function registerCommentRoutes(server: ViteDevServer, ctx: ApiContext): void {
  server.middlewares.use('/__comments', async (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://local');
    const method = req.method ?? 'GET';

    try {
      if (method === 'GET' && url.pathname === '/') {
        const slideId = url.searchParams.get('slideId') ?? '';
        const file = resolveSlideEntryPath(ctx, slideId);
        if (!file) return json(res, 400, { error: 'invalid slideId' });
        const source = await readSlideSource(file);
        if (source === null) return json(res, 404, { error: 'slide not found' });
        return json(res, 200, { comments: parseMarkers(source) });
      }

      if (method === 'POST' && url.pathname === '/add') {
        const requestCheck = validateMutationRequest(req, { requireJsonBody: true });
        if (!requestCheck.ok) {
          return json(res, requestCheck.status, { error: requestCheck.error });
        }
        const body = (await readBody(req)) as AddCommentBody;
        const slideId = body.slideId ?? '';
        const file = resolveSlideEntryPath(ctx, slideId);
        if (!file) return json(res, 400, { error: 'invalid slideId' });
        if (!body.line || body.line < 1) return json(res, 400, { error: 'invalid line' });
        if (!body.text || typeof body.text !== 'string') {
          return json(res, 400, { error: 'missing text' });
        }
        const hint = body.hint ?? undefined;
        if (hint !== undefined && typeof hint !== 'string') {
          return json(res, 400, { error: 'invalid hint' });
        }
        const intent = body.intent ?? undefined;
        if (intent !== undefined && !isCommentIntent(intent)) {
          return json(res, 400, {
            error: `invalid intent; expected one of ${COMMENT_INTENTS.join(', ')}`,
          });
        }

        const source = await readSlideSource(file);
        if (source === null) return json(res, 404, { error: 'slide not found' });

        const plan = findInsertion(source, body.line, body.column);
        if (!plan) {
          return json(res, 422, {
            error:
              'could not find a JSX container around line ' +
              `${body.line}. Try clicking a different element.`,
          });
        }

        const id = newCommentId();
        const ts = new Date().toISOString();
        const payload = encodeCommentPayload({ note: body.text, hint, intent });
        const marker = `\n${plan.indent}{/* @slide-comment id="${id}" ts="${ts}" text="${payload}" */}`;

        const next = source.slice(0, plan.offset) + marker + source.slice(plan.offset);
        await fs.writeFile(file, next, 'utf8');
        const markerLine = offsetToLine(next, plan.offset + 1);
        return json(res, 200, { id, line: markerLine });
      }

      if (method === 'DELETE' && url.pathname.startsWith('/')) {
        const requestCheck = validateMutationRequest(req);
        if (!requestCheck.ok) {
          return json(res, requestCheck.status, { error: requestCheck.error });
        }
        const id = url.pathname.slice(1);
        if (!/^c-[a-f0-9]+$/.test(id)) return json(res, 400, { error: 'invalid id' });
        const slideId = url.searchParams.get('slideId') ?? '';
        const file = resolveSlideEntryPath(ctx, slideId);
        if (!file) return json(res, 400, { error: 'invalid slideId' });

        const source = await readSlideSource(file);
        if (source === null) return json(res, 404, { error: 'slide not found' });

        const lines = source.split('\n');
        const idRe = markerDeleteRegex(id);
        const hit = lines.findIndex((l) => idRe.test(l));
        if (hit === -1) return json(res, 404, { error: 'marker not found' });
        lines.splice(hit, 1);
        await fs.writeFile(file, lines.join('\n'), 'utf8');
        return json(res, 200, { ok: true });
      }

      next();
    } catch (err) {
      json(res, 500, { error: String((err as Error).message ?? err) });
    }
  });
}
