import { DurableObject } from 'cloudflare:workers';
import { getSandbox, type SandboxCommand, type SandboxEnv } from '@cloudflare/sandbox';
import { Hono } from 'hono';
import { basicAuth } from 'hono/basic-auth';
import { bodyLimit } from 'hono/body-limit';
import { isMutation, SerialQueue, validContentPath } from './policy';

export { Sandbox } from '@cloudflare/sandbox';

type HostEnv = Env & SandboxEnv & { AUTH_PASSWORD: string };
const root = '/workspace/project';
const app = new Hono<{ Bindings: HostEnv }>();
app.use('*', (c, next) =>
  basicAuth({ username: c.env.AUTH_USERNAME, password: c.env.AUTH_PASSWORD })(c, next),
);
app.use('*', async (c, next) => {
  const origin = c.req.header('origin');
  if (origin && origin !== new URL(c.req.url).origin)
    return c.json({ error: 'Origin rejected' }, 403);
  return next();
});
app.use('*', bodyLimit({ maxSize: 10 * 1024 * 1024 }));
app.all('*', (c) =>
  c.env.Workspaces.get(c.env.Workspaces.idFromName(c.env.WORKSPACE_ID)).fetch(c.req.raw),
);
app.onError((error, c) => {
  console.error({ event: 'sandbox_request_failed', name: error.name });
  return c.json({ error: 'Sandbox request failed. No automatic retry was attempted.' }, 502);
});
export default app;

export class Workspace extends DurableObject<HostEnv> {
  private queue = new SerialQueue();

  private sandbox() {
    return getSandbox(this.env.Sandbox, this.env.WORKSPACE_ID);
  }

  private async credentials() {
    const repo = await this.env.ARTIFACTS.get(this.env.WORKSPACE_ID);
    const token = await repo.createToken('write', 3600);
    return {
      CONTENT_PATHS: this.env.CONTENT_PATHS,
      ARTIFACTS_REMOTE: this.env.ARTIFACTS_REMOTE,
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: 'http.extraHeader',
      GIT_CONFIG_VALUE_0: `Authorization: Bearer ${token.plaintext}`,
    };
  }

  private async command(action: string, env: Record<string, string>, ...args: string[]) {
    const p = await this.sandbox().exec(['node', '/opt/host/workspace.mjs', action, ...args], {
      env: { CONTENT_PATHS: this.env.CONTENT_PATHS, ...env },
    });
    const output = await p.output({ encoding: 'utf8' });
    if (output.exitCode !== 0)
      throw new Error(`Workspace ${action} failed (exit ${output.exitCode})`);
    return JSON.parse(output.stdout) as Record<string, string>;
  }

  private async ready() {
    const s = this.sandbox();
    const command = JSON.parse(this.env.APP_COMMAND) as SandboxCommand;
    const process = (await s.listProcesses()).find(
      (p) => p.state === 'running' && JSON.stringify(p.command) === JSON.stringify(command),
    );
    if (!process) {
      await this.command('init', await this.credentials());
      const started = await s.exec(command, { cwd: root });
      await started.waitForPort(8080);
    }
    return s;
  }

  override async fetch(request: Request): Promise<Response> {
    return this.queue
      .run(async () => {
        const url = new URL(request.url);
        if (['/__update-package', '/__restart-server'].includes(url.pathname)) {
          return Response.json(
            { error: 'App versions are managed by deployment.' },
            { status: 409 },
          );
        }
        const s = await this.ready();
        if (url.pathname === '/__host/release')
          return Response.json(await this.command('version', {}));
        if (url.pathname === '/__host/files') {
          const file = url.searchParams.get('path') ?? '';
          const roots = JSON.parse(this.env.CONTENT_PATHS) as string[];
          if (!validContentPath(file, roots))
            return Response.json({ error: 'Invalid content path' }, { status: 400 });
          const env = await this.credentials();
          const resolved = await this.command('resolve', env, file);
          if (request.method === 'GET') return Response.json(await s.readFile(resolved.path));
          if (request.method !== 'PUT') return new Response(null, { status: 405 });
          await s.writeFile(resolved.path, await request.text());
          const saved = await this.command('save', env);
          return Response.json(saved);
        }
        if (url.pathname === '/__host/checkpoint' && request.method === 'POST')
          return Response.json(await this.command('save', await this.credentials()));
        if (url.pathname === '/__host/restart' && request.method === 'POST') {
          await this.command('save', await this.credentials());
          await s.destroy();
          return Response.json({ stopped: true });
        }
        if (url.pathname.startsWith('/__host/')) return new Response(null, { status: 404 });
        if (request.headers.get('upgrade')?.toLowerCase() === 'websocket')
          return s.wsConnect(request, 8080);
        const forwarded = new Request(request);
        forwarded.headers.set('x-forwarded-host', url.host);
        forwarded.headers.set('x-forwarded-proto', url.protocol.slice(0, -1));
        const response = await s.containerFetch(forwarded, 8080);
        if (!isMutation(request.method)) return response;
        const body = await response.arrayBuffer();
        // A browser save is successful only after the content is durable.
        await this.command('save', await this.credentials());
        return new Response(body, response);
      })
      .catch((error: unknown) => {
        console.error({
          event: 'workspace_operation_failed',
          error: error instanceof Error ? error.message : 'Unknown failure',
        });
        return Response.json(
          {
            error: 'Workspace operation failed; changes are not confirmed saved.',
          },
          { status: 502 },
        );
      });
  }
}
