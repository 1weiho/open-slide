import { describe, expect, it } from 'vitest';
import { holdOpacity } from './transition';

describe('holdOpacity', () => {
  it('drops opacity from array keyframes and keeps everything else', () => {
    const phase = holdOpacity({
      duration: 140,
      keyframes: [
        { opacity: 1, transform: 'translateY(0)' },
        { opacity: 0, transform: 'translateY(-4px)', offset: 1 },
      ],
    });

    expect(phase).toEqual({
      duration: 140,
      keyframes: [{ transform: 'translateY(0)' }, { transform: 'translateY(-4px)', offset: 1 }],
    });
  });

  it('drops opacity from property-indexed keyframes', () => {
    const phase = holdOpacity({
      keyframes: { opacity: [1, 0], transform: ['scale(1)', 'scale(1.01)'] },
    });

    expect(phase?.keyframes).toEqual({ transform: ['scale(1)', 'scale(1.01)'] });
  });

  it('passes an undefined phase through', () => {
    expect(holdOpacity(undefined)).toBeUndefined();
  });
});
