import { Hono } from 'hono';
import { basicAuth } from 'hono/basic-auth';
import { bodyLimit } from 'hono/body-limit';
import { HTTPException } from 'hono/http-exception';

type HostEnv = Env & { AUTH_PASSWORD: string };
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
  if (error instanceof HTTPException) return error.getResponse();
  console.error({ event: 'sandbox_request_failed', name: error.name });
  return c.json({ error: 'Sandbox request failed. No automatic retry was attempted.' }, 502);
});
export default app;
