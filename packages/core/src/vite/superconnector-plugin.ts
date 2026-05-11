import { randomUUID } from 'node:crypto';
import type { ServerResponse } from 'node:http';
import type { AgentMessageType, Superconnector } from '@nimrobo/superconnector';
import type { Connect, Plugin, ViteDevServer } from 'vite';

const MAX_MESSAGES = 50;
const MAX_MESSAGE_TEXT = 300;
const SLIDE_ID_RE = /^[a-z0-9_-]+$/i;

export type AgentRunStatus = 'pending' | 'done' | 'error' | 'canceled';

export type AgentRunMessage = {
  type: AgentMessageType;
  text: string;
  ts: string;
};

type AgentRun = {
  status: AgentRunStatus;
  runId: string;
  sessionId?: string;
  error?: string;
  slideId: string;
  commentId: string;
  controller: AbortController;
  messages: AgentRunMessage[];
};

type RunBody = {
  slideId?: string;
  commentId?: string;
  line?: number;
  note?: string;
};

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

async function readBody(req: Connect.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function newRunId(): string {
  return `scr-${randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

export function superconnectorAppId(): string {
  return 'open-slide';
}

export function superconnectorSessionSelector(slideId: string): string {
  return `slide:${slideId}`;
}

export function buildSuperconnectorPrompt(args: {
  slidesDir: string;
  slideId: string;
  commentId: string;
  line?: number;
  note: string;
}): string {
  const slidePath = `${args.slidesDir}/${args.slideId}/index.tsx`;
  return [
    'You are working in the slide project.',
    `The slide file is at ${slidePath}.`,
    `A comment was added${args.line ? ` at line ${args.line}` : ''} with this instruction:`,
    `"${args.note}"`,
    'Please implement this change in the slide file.',
    `When done, remove the @slide-comment marker with id="${args.commentId}" from the file.`,
  ].join('\n');
}

export function extractText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .filter((c): c is { text: string } => !!c && typeof c === 'object' && 'text' in c)
      .map((c) => c.text)
      .join(' ');
  }
  if (content && typeof content === 'object') return JSON.stringify(content);
  return String(content ?? '');
}

export type SuperconnectorPluginOptions = {
  userCwd: string;
  slidesDir?: string;
};

export function superconnectorPlugin(opts: SuperconnectorPluginOptions): Plugin {
  const slidesDir = opts.slidesDir ?? 'slides';

  return {
    name: 'open-slide:superconnector',
    apply: 'serve',
    async configureServer(server: ViteDevServer) {
      let sc: Superconnector | null = null;

      try {
        const mod = await import('@nimrobo/superconnector');
        sc = mod.createSuperconnector({ cwd: opts.userCwd, adapter: 'claude-code' });
        console.log('[superconnector] ready');
      } catch {
        return;
      }

      const runs = new Map<string, AgentRun>();

      const push = (run: AgentRun, msgType: AgentMessageType | AgentRunStatus, text: string) => {
        server.ws.send({
          type: 'custom',
          event: 'open-slide:superconnector-event',
          data: {
            runId: run.runId,
            sessionId: run.sessionId,
            commentId: run.commentId,
            status: run.status,
            msgType,
            text,
          },
        });
      };

      server.middlewares.use('/__superconnector', async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://local');
        const method = req.method ?? 'GET';

        try {
          if (method === 'GET' && url.pathname === '/available') {
            return json(res, 200, { available: true });
          }

          if (method === 'POST' && url.pathname === '/runs') {
            const body = (await readBody(req)) as RunBody;
            const { slideId, commentId, line, note } = body;
            if (!slideId || !commentId || !note) {
              return json(res, 400, { error: 'missing slideId, commentId, or note' });
            }
            if (!SLIDE_ID_RE.test(slideId)) return json(res, 400, { error: 'invalid slideId' });

            const runId = newRunId();
            const run: AgentRun = {
              status: 'pending',
              runId,
              slideId,
              commentId,
              controller: new AbortController(),
              messages: [],
            };
            runs.set(runId, run);

            console.log(`[superconnector] spawn  comment=${commentId}  slide=${slideId}`);

            const agent = sc;
            setImmediate(async () => {
              console.log(`[superconnector] ▶ ${runId}`);
              try {
                for await (const msg of agent.spawn({
                  prompt: buildSuperconnectorPrompt({ slidesDir, slideId, commentId, line, note }),
                  appId: superconnectorAppId(),
                  sessionSelector: superconnectorSessionSelector(slideId),
                  resumeLastCreatedSession: true,
                  permissionMode: 'acceptEdits',
                  signal: run.controller.signal,
                })) {
                  if (msg.sessionId) run.sessionId = msg.sessionId;
                  const text = extractText(msg.content).slice(0, MAX_MESSAGE_TEXT);
                  const msgType = msg.type;
                  console.log(`[superconnector] ${msgType.padEnd(12)} ${text.slice(0, 120)}`);

                  run.messages.push({ type: msgType, text, ts: new Date().toISOString() });
                  if (run.messages.length > MAX_MESSAGES) run.messages.shift();

                  if (text) push(run, msgType, text);
                }

                run.status = run.controller.signal.aborted ? 'canceled' : 'done';
                console.log(`[superconnector] ✓ ${runId} ${run.status}`);
                push(run, run.status, '');
              } catch (err) {
                if (run.controller.signal.aborted) {
                  run.status = 'canceled';
                  console.log(`[superconnector] ■ ${runId} canceled`);
                  push(run, 'canceled', '');
                  return;
                }
                const errText = String((err as Error).message ?? err);
                console.error(`[superconnector] ✗ ${runId}`, errText);
                run.status = 'error';
                run.error = errText;
                push(run, 'error', errText);
              }
            });

            return json(res, 200, { runId });
          }

          if (method === 'GET' && url.pathname.startsWith('/runs/')) {
            const runId = url.pathname.slice('/runs/'.length);
            const run = runs.get(runId);
            if (!run) return json(res, 404, { error: 'unknown run' });
            return json(res, 200, {
              status: run.status,
              sessionId: run.sessionId,
              error: run.error,
              messages: run.messages,
            });
          }

          if (
            method === 'POST' &&
            url.pathname.startsWith('/runs/') &&
            url.pathname.endsWith('/cancel')
          ) {
            const runId = url.pathname.slice('/runs/'.length, -'/cancel'.length);
            const run = runs.get(runId);
            if (!run) return json(res, 404, { error: 'unknown run' });
            if (run.status === 'pending') run.controller.abort();
            return json(res, 200, { ok: true });
          }

          next();
        } catch (err) {
          json(res, 500, { error: String((err as Error).message ?? err) });
        }
      });
    },
  };
}
