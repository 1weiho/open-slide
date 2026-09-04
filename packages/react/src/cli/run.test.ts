import { describe, expect, it } from 'vitest';
import { parsePort } from './run.ts';

describe('parsePort', () => {
  it('accepts valid integer ports', () => {
    expect(parsePort('0')).toBe(0);
    expect(parsePort('80')).toBe(80);
    expect(parsePort('5173')).toBe(5173);
    expect(parsePort('65535')).toBe(65535);
  });

  it('rejects non-numeric input', () => {
    expect(() => parsePort('abc')).toThrow(/Invalid port/);
    expect(() => parsePort('80x')).toThrow(/Invalid port/);
  });

  it('rejects out-of-range ports', () => {
    expect(() => parsePort('-1')).toThrow(/Invalid port/);
    expect(() => parsePort('65536')).toThrow(/Invalid port/);
    expect(() => parsePort('100000')).toThrow(/Invalid port/);
  });

  it('rejects non-integer numbers', () => {
    expect(() => parsePort('80.5')).toThrow(/Invalid port/);
  });
});
