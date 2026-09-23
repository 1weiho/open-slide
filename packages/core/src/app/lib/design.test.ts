import { describe, expect, it } from 'vitest';
import { defaultDesign, designToCssVars, paletteTokenVar } from './design';

describe('paletteTokenVar', () => {
  it('maps each palette token to its CSS variable reference', () => {
    expect(paletteTokenVar('bg')).toBe('var(--osd-bg)');
    expect(paletteTokenVar('text')).toBe('var(--osd-text)');
    expect(paletteTokenVar('accent')).toBe('var(--osd-accent)');
  });

  it('references variables that designToCssVars actually emits', () => {
    const vars = designToCssVars(defaultDesign);
    for (const token of ['bg', 'text', 'accent'] as const) {
      const name = paletteTokenVar(token).slice('var('.length, -1);
      expect(vars[name]).toBe(defaultDesign.palette[token]);
    }
  });
});
