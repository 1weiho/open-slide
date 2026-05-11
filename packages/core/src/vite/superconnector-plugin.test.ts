import { describe, expect, it } from 'vitest';
import {
  buildSuperconnectorPrompt,
  extractText,
  isAllowedSuperconnectorMutation,
  isMalformedJsonError,
  pruneCompletedRuns,
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

describe('isMalformedJsonError', () => {
  it('identifies JSON parse failures', () => {
    expect(isMalformedJsonError(new SyntaxError('bad json'))).toBe(true);
    expect(isMalformedJsonError(new Error('socket closed'))).toBe(false);
  });
});

describe('isAllowedSuperconnectorMutation', () => {
  it('allows same-origin and originless dev requests', () => {
    expect(isAllowedSuperconnectorMutation({ headers: { host: 'localhost:5173' } } as never)).toBe(
      true,
    );
    expect(
      isAllowedSuperconnectorMutation({
        headers: { host: 'localhost:5173', origin: 'http://localhost:5173' },
      } as never),
    ).toBe(true);
  });

  it('rejects cross-origin and malformed origins', () => {
    expect(
      isAllowedSuperconnectorMutation({
        headers: { host: 'localhost:5173', origin: 'http://evil.test' },
      } as never),
    ).toBe(false);
    expect(
      isAllowedSuperconnectorMutation({
        headers: { host: 'localhost:5173', origin: '%%%bad' },
      } as never),
    ).toBe(false);
  });
});

describe('pruneCompletedRuns', () => {
  it('removes oldest completed runs without deleting pending runs', () => {
    const timeout = setTimeout(() => {}, 1000);
    clearTimeout(timeout);
    const runs = new Map([
      ['pending', { status: 'pending' as const }],
      ['old', { status: 'done' as const, completedAt: 1, cleanupTimer: timeout }],
      ['new', { status: 'error' as const, completedAt: 2 }],
    ]);

    expect(pruneCompletedRuns(runs, 2)).toEqual(['old']);
    expect([...runs.keys()]).toEqual(['pending', 'new']);
  });
});
