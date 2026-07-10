import { mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { handleExportPptx } from './export-pptx-handler.ts';

type Captured = {
  statusCode: number;
  headers: Record<string, string>;
  chunks: string[];
};

function makeFakeRes(): Captured & {
  setHeader: (k: string, v: string) => void;
  write: (s: string) => void;
  end: (s?: string) => void;
} {
  const cap: Captured = { statusCode: 0, headers: {}, chunks: [] };
  return {
    ...cap,
    setHeader(k: string, v: string) {
      cap.headers[k.toLowerCase()] = v;
    },
    write(s: string) {
      cap.chunks.push(s);
    },
    end(s?: string) {
      if (s) cap.chunks.push(s);
    },
  } as any;
}

const noopRender = async () => Buffer.from([]);

describe('handleExportPptx — playwright-missing branch', () => {
  it('returns JSON playwright-missing with pnpm + chromium install command for a pnpm fixture', async () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), 'pptx-route-'));
    writeFileSync(path.join(cwd, 'package.json'), JSON.stringify({ name: 'x' }));
    writeFileSync(path.join(cwd, 'pnpm-lock.yaml'), '');

    const res = makeFakeRes();
    await handleExportPptx({
      userCwd: cwd,
      body: { slideId: 'demo' },
      probePlaywright: async () => false,
      render: noopRender,
      res: res as any,
    });

    expect((res as any).statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    const body = JSON.parse(res.chunks.join(''));
    expect(body.status).toBe('playwright-missing');
    expect(body.packageManager).toBe('pnpm');
    expect(body.command).toBe(
      `cd '${cwd}' && pnpm add -D playwright && npx playwright install chromium`,
    );
  });
});

describe('handleExportPptx — happy path', () => {
  it('streams SSE progress events then a base64 done event', async () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), 'pptx-route-'));
    writeFileSync(path.join(cwd, 'package.json'), JSON.stringify({ name: 'x' }));

    const fakePptx = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0xff, 0xff]);

    const res = makeFakeRes();
    await handleExportPptx({
      userCwd: cwd,
      body: { slideId: 'demo' },
      probePlaywright: async () => true,
      render: async (opts) => {
        opts.onProgress?.({ phase: 'loading', current: 0, total: 1 });
        opts.onProgress?.({ phase: 'measuring', current: 0, total: 1 });
        opts.onProgress?.({ phase: 'done', current: 1, total: 1 });
        return fakePptx;
      },
      res: res as any,
    });

    expect(res.headers['content-type']).toMatch(/text\/event-stream/);
    const out = res.chunks.join('');
    expect(out).toMatch(/event: progress[\s\S]+"phase":"loading"/);
    expect(out).toMatch(/event: progress[\s\S]+"phase":"measuring"/);
    expect(out).toMatch(/event: done[\s\S]+data: UEsDBP/);
  });

  it('returns 400 when slideId is missing', async () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), 'pptx-route-'));
    writeFileSync(path.join(cwd, 'package.json'), '{}');

    const res = makeFakeRes();
    await handleExportPptx({
      userCwd: cwd,
      body: {},
      probePlaywright: async () => true,
      render: noopRender,
      res: res as any,
    });

    expect((res as any).statusCode).toBe(400);
    const body = JSON.parse(res.chunks.join(''));
    expect(body.error).toBe('missing slideId');
  });

  it('rejects slideId that escapes the slides directory via ../', async () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), 'pptx-route-'));
    writeFileSync(path.join(cwd, 'package.json'), '{}');

    const res = makeFakeRes();
    await handleExportPptx({
      userCwd: cwd,
      body: { slideId: '../../etc/passwd' },
      probePlaywright: async () => true,
      render: noopRender,
      res: res as any,
    });

    expect((res as any).statusCode).toBe(400);
    const body = JSON.parse(res.chunks.join(''));
    expect(body.error).toBe('invalid slideId');
  });

  it('rejects an absolute slideId', async () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), 'pptx-route-'));
    writeFileSync(path.join(cwd, 'package.json'), '{}');

    const res = makeFakeRes();
    await handleExportPptx({
      userCwd: cwd,
      body: { slideId: '/etc/passwd' },
      probePlaywright: async () => true,
      render: noopRender,
      res: res as any,
    });

    expect((res as any).statusCode).toBe(400);
    const body = JSON.parse(res.chunks.join(''));
    expect(body.error).toBe('invalid slideId');
  });

  it('rejects slideId that resolves to the slides root itself (empty rel)', async () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), 'pptx-route-'));
    writeFileSync(path.join(cwd, 'package.json'), '{}');

    const res = makeFakeRes();
    await handleExportPptx({
      userCwd: cwd,
      body: { slideId: '.' },
      probePlaywright: async () => true,
      render: noopRender,
      res: res as any,
    });

    expect((res as any).statusCode).toBe(400);
    const body = JSON.parse(res.chunks.join(''));
    expect(body.error).toBe('invalid slideId');
  });
});
