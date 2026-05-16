import type { Connect } from 'vite';

type MutationRequestValidationResult = { ok: true } | { ok: false; status: number; error: string };

function firstHeaderValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function headerValue(req: Connect.IncomingMessage, name: string): string | null {
  return firstHeaderValue(req.headers[name.toLowerCase()])?.trim() ?? null;
}

function firstCommaToken(value: string | null): string | null {
  if (!value) return null;
  const [first] = value.split(',', 1);
  return first?.trim() || null;
}

function requestProto(req: Connect.IncomingMessage): 'http' | 'https' {
  const forwarded = firstCommaToken(headerValue(req, 'x-forwarded-proto'))?.toLowerCase();
  if (forwarded === 'http' || forwarded === 'https') return forwarded;
  return 'encrypted' in req.socket && req.socket.encrypted ? 'https' : 'http';
}

function normalizedOrigin(origin: string): string | null {
  try {
    const url = new URL(origin);
    return `${url.protocol}//${url.host}`.toLowerCase();
  } catch {
    return null;
  }
}

export function validateMutationRequest(
  req: Connect.IncomingMessage,
  opts: { requireJsonBody?: boolean } = {},
): MutationRequestValidationResult {
  if (opts.requireJsonBody) {
    const contentType = headerValue(req, 'content-type')?.toLowerCase();
    if (!contentType || !contentType.startsWith('application/json')) {
      return {
        ok: false,
        status: 415,
        error: 'content-type must be application/json',
      };
    }
  }

  const fetchSite = firstCommaToken(headerValue(req, 'sec-fetch-site'))?.toLowerCase();
  if (fetchSite === 'cross-site') {
    return { ok: false, status: 403, error: 'cross-site request blocked' };
  }

  const originRaw = headerValue(req, 'origin');
  if (!originRaw) return { ok: true };
  if (originRaw.toLowerCase() === 'null') {
    return { ok: false, status: 403, error: 'opaque origin is not allowed' };
  }

  const actualOrigin = normalizedOrigin(originRaw);
  if (!actualOrigin) {
    return { ok: false, status: 403, error: 'invalid origin header' };
  }

  const host = firstCommaToken(headerValue(req, 'x-forwarded-host')) ?? headerValue(req, 'host');
  if (!host) {
    return { ok: false, status: 400, error: 'missing host header' };
  }
  const expectedOrigin = `${requestProto(req)}://${host}`.toLowerCase();
  if (actualOrigin !== expectedOrigin) {
    return {
      ok: false,
      status: 403,
      error: 'origin mismatch',
    };
  }

  return { ok: true };
}
