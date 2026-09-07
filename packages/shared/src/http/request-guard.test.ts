import { describe, expect, it } from 'vitest';
import { validateMutationRequest } from './request-guard.ts';

describe('validateMutationRequest', () => {
  function makeReq(
    headers: Record<string, string | undefined>,
    opts: { encrypted?: boolean } = {},
  ) {
    return {
      headers,
      socket: { encrypted: opts.encrypted ?? false },
    } as unknown as Parameters<typeof validateMutationRequest>[0];
  }

  it('accepts same-origin JSON mutation requests', () => {
    const req = makeReq({
      host: 'localhost:5173',
      origin: 'http://localhost:5173',
      'content-type': 'application/json',
      'sec-fetch-site': 'same-origin',
    });
    expect(validateMutationRequest(req, { requireJsonBody: true })).toEqual({ ok: true });
  });

  it('accepts forwarded host/proto when origin matches', () => {
    const req = makeReq({
      host: '127.0.0.1:5173',
      origin: 'https://slides.example.dev',
      'x-forwarded-host': 'slides.example.dev',
      'x-forwarded-proto': 'https',
      'content-type': 'application/json; charset=utf-8',
    });
    expect(validateMutationRequest(req, { requireJsonBody: true })).toEqual({ ok: true });
  });

  it('rejects non-JSON mutation bodies when required', () => {
    const req = makeReq({
      host: 'localhost:5173',
      origin: 'http://localhost:5173',
      'content-type': 'text/plain',
    });
    expect(validateMutationRequest(req, { requireJsonBody: true })).toEqual({
      ok: false,
      status: 415,
      error: 'content-type must be application/json',
    });
  });

  it('rejects cross-site browser requests', () => {
    const req = makeReq({
      host: 'localhost:5173',
      origin: 'http://localhost:5173',
      'sec-fetch-site': 'cross-site',
    });
    expect(validateMutationRequest(req)).toEqual({
      ok: false,
      status: 403,
      error: 'cross-site request blocked',
    });
  });

  it('rejects opaque origin values', () => {
    const req = makeReq({
      host: 'localhost:5173',
      origin: 'null',
    });
    expect(validateMutationRequest(req)).toEqual({
      ok: false,
      status: 403,
      error: 'opaque origin is not allowed',
    });
  });

  it('rejects mismatched origin/host combinations', () => {
    const req = makeReq({
      host: 'localhost:5173',
      origin: 'http://evil.example',
    });
    expect(validateMutationRequest(req)).toEqual({
      ok: false,
      status: 403,
      error: 'origin mismatch',
    });
  });

  it('allows trusted requests even when origin is missing', () => {
    const req = makeReq({
      host: 'localhost:5173',
      'sec-fetch-site': 'same-origin',
      'content-type': 'application/json',
    });
    expect(validateMutationRequest(req, { requireJsonBody: true })).toEqual({ ok: true });
  });
});
