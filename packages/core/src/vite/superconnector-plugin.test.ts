import { describe, expect, it } from 'vitest';
import {
  buildSuperconnectorPrompt,
  extractText,
  superconnectorAppId,
  superconnectorSessionSelector,
} from './superconnector-plugin.ts';

describe('superconnector session scope', () => {
  it('uses a stable app id and slide selector', () => {
    expect(superconnectorAppId()).toBe('open-slide');
    expect(superconnectorSessionSelector('launch-deck')).toBe('slide:launch-deck');
  });
});

describe('buildSuperconnectorPrompt', () => {
  it('points the agent at the commented slide file and marker', () => {
    const prompt = buildSuperconnectorPrompt({
      slidesDir: 'slides',
      slideId: 'launch-deck',
      commentId: 'c-deadbeef',
      line: 42,
      note: 'Make the headline shorter.',
    });

    expect(prompt).toContain('slides/launch-deck/index.tsx');
    expect(prompt).toContain('at line 42');
    expect(prompt).toContain('"Make the headline shorter."');
    expect(prompt).toContain('id="c-deadbeef"');
  });

  it('uses custom slide directories', () => {
    const prompt = buildSuperconnectorPrompt({
      slidesDir: 'decks',
      slideId: 'launch-deck',
      commentId: 'c-deadbeef',
      note: 'Tighten this.',
    });

    expect(prompt).toContain('decks/launch-deck/index.tsx');
  });
});

describe('extractText', () => {
  it('normalizes string, array, object, and empty content', () => {
    expect(extractText('hello')).toBe('hello');
    expect(extractText([{ text: 'hello' }, { text: 'world' }, { nope: true }])).toBe('hello world');
    expect(extractText({ ok: true })).toBe('{"ok":true}');
    expect(extractText(null)).toBe('');
  });
});
