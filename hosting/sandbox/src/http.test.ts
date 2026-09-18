import { describe, expect, it, vi } from 'vitest';
import app from './http';

function setup() {
  const fetch = vi.fn(async () => new Response('App content'));
  const env = {
    AUTH_USERNAME: 'pilot',
    AUTH_PASSWORD: 'test-password',
    WORKSPACE_ID: 'workspace',
    Workspaces: { idFromName: (name: string) => name, get: () => ({ fetch }) },
  } as unknown as Env & { AUTH_PASSWORD: string };
  return { env, fetch };
}
const authorization = `Basic ${btoa('pilot:test-password')}`;

describe('host authentication', () => {
  it('returns the browser login challenge before reaching the sandbox', async () => {
    const { env, fetch } = setup();
    const response = await app.request('https://app.example/', {}, env);
    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toContain('Basic');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects cross-origin writes before touching content', async () => {
    const { env, fetch } = setup();
    const response = await app.request(
      'https://app.example/__host/files',
      {
        method: 'PUT',
        headers: { authorization, origin: 'https://evil.example' },
        body: 'content',
      },
      env,
    );
    expect(response.status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('forwards authenticated requests to the configured workspace', async () => {
    const { env, fetch } = setup();
    const response = await app.request('https://app.example/', { headers: { authorization } }, env);
    expect(await response.text()).toBe('App content');
    expect(fetch).toHaveBeenCalledOnce();
  });
});
