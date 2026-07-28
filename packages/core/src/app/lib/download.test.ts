/**
 * Unit test for the shared `downloadBlob` helper: verifies a single
 * object URL is created, the `<a download>` is removed from the DOM, and
 * the URL is revoked on the next tick so the browser has time to start
 * the download before release.
 *
 * @agents-index Vitest test for the shared downloadBlob helper.
 */

// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadBlob } from './download.ts';

describe('downloadBlob', () => {
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;

  beforeEach(() => {
    vi.useFakeTimers();
    URL.createObjectURL = vi.fn(() => 'blob:test-url');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  });

  it('downloadBlob creates and revokes object URL', () => {
    const before = document.querySelectorAll('a').length;
    const blob = new Blob(['hello'], { type: 'text/plain' });
    downloadBlob(blob, 'hello.txt');

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(document.querySelectorAll('a').length).toBe(before);

    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-url');
  });
});
