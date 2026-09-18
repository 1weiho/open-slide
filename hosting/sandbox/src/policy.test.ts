import { describe, expect, it } from 'vitest';
import { isMutation, SerialQueue, validContentPath } from './policy';

describe('workspace request policy', () => {
  it('serializes writes through durable save before starting another mutation', async () => {
    const queue = new SerialQueue();
    const events: string[] = [];
    let release = () => {};
    const push = new Promise<void>((resolve) => {
      release = resolve;
    });
    const first = queue.run(async () => {
      events.push('write');
      await push;
      events.push('persist');
    });
    const second = queue.run(async () => {
      events.push('next-write');
    });
    await Promise.resolve();
    expect(events).toEqual(['write']);
    release();
    await Promise.all([first, second]);
    expect(events).toEqual(['write', 'persist', 'next-write']);
  });

  it('surfaces failure without automatic retries and permits a subsequent request', async () => {
    const queue = new SerialQueue();
    let attempts = 0;
    await expect(
      queue.run(async () => {
        attempts++;
        throw new Error('push rejected');
      }),
    ).rejects.toThrow('push rejected');
    expect(attempts).toBe(1);
    await expect(queue.run(async () => 'ok')).resolves.toBe('ok');
  });

  it('restricts content writes to owned roots without traversal or internal config', () => {
    for (const path of [
      '../secrets',
      'slides/../../.git/config',
      'slides/./a',
      '/slides/a',
      'slides//a',
      'slides\\a',
      '.git/config',
      'package.json',
    ])
      expect(validContentPath(path, ['slides', 'themes', 'assets'])).toBe(false);
    expect(validContentPath('slides/deck/index.tsx', ['slides'])).toBe(true);
    expect(validContentPath('assets/logo.png', ['assets'])).toBe(true);
  });

  it('persists every mutating HTTP method', () => {
    for (const method of ['PUT', 'POST', 'DELETE', 'PATCH']) expect(isMutation(method)).toBe(true);
    for (const method of ['GET', 'HEAD', 'OPTIONS']) expect(isMutation(method)).toBe(false);
  });
});
