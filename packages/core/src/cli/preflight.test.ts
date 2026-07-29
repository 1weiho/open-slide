import { describe, expect, it } from 'vitest';
import { shouldRunPreflight } from './preflight.ts';

describe('shouldRunPreflight', () => {
  it('runs by default on a developer machine', () => {
    expect(shouldRunPreflight({}, {})).toBe(true);
  });

  it('is skipped by --no-preflight', () => {
    expect(shouldRunPreflight({ preflight: false }, {})).toBe(false);
  });

  it('is skipped under CI', () => {
    expect(shouldRunPreflight({}, { CI: 'true' })).toBe(false);
    expect(shouldRunPreflight({}, { CI: '1' })).toBe(false);
  });

  it('treats an empty CI variable as not CI', () => {
    expect(shouldRunPreflight({}, { CI: '' })).toBe(true);
  });
});
