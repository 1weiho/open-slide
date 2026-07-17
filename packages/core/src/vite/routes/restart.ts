import { randomUUID } from 'node:crypto';
import type { ViteDevServer } from 'vite';
import { validateMutationRequest } from '../../http/request-guard.ts';
import { json } from './context.ts';

// GET /__server-status → { executionId, canRestart }
//   executionId identifies the current dev-server process; a changed value
//   after a restart means the new process is up.
// POST /__restart-server → { restarting: true }
//   Exits with RESTART_EXIT_CODE so the CLI supervisor respawns the server
//   against the currently installed @open-slide/core.

export const RESTART_EXIT_CODE = 52;
export const DEV_SUPERVISED_ENV = 'OPEN_SLIDE_DEV_SUPERVISED';

const executionId = randomUUID();

function isSupervised(): boolean {
  return process.env[DEV_SUPERVISED_ENV] === '1';
}

export function registerRestartRoutes(server: ViteDevServer): void {
  server.middlewares.use('/__server-status', (req, res, next) => {
    if ((req.method ?? 'GET') !== 'GET') return next();
    res.setHeader('cache-control', 'no-store');
    json(res, 200, { executionId, canRestart: isSupervised() });
  });

  server.middlewares.use('/__restart-server', (req, res, next) => {
    if ((req.method ?? 'GET') !== 'POST') return next();

    const guard = validateMutationRequest(req);
    if (!guard.ok) return json(res, guard.status, { error: guard.error });
    if (!isSupervised()) {
      return json(res, 409, { error: 'dev server was not started by the open-slide CLI' });
    }

    // exit only once the response is flushed, so the client sees `restarting`
    // and enters its poll loop instead of treating the dropped socket as failure
    res.on('finish', () => process.exit(RESTART_EXIT_CODE));
    json(res, 200, { restarting: true });
  });
}
