import { describe, expect, it } from 'vitest';
import {
  b64urlDecode,
  b64urlEncode,
  COMMENT_INTENTS,
  encodeCommentPayload,
  isCommentIntent,
  markerDeleteRegex,
  parseMarkers,
} from './comments.ts';

describe('b64url encoding', () => {
  it('round-trips arbitrary unicode strings', () => {
    const samples = ['hello', '안녕하세요', '🎉🎊', 'a/b+c=d', JSON.stringify({ note: 'hi' })];
    for (const s of samples) {
      expect(b64urlDecode(b64urlEncode(s))).toBe(s);
    }
  });

  it('produces url-safe output (no +, /, or =)', () => {
    const encoded = b64urlEncode('subject?with/lots+of==special chars');
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it('decodes the empty string', () => {
    expect(b64urlDecode('')).toBe('');
  });
});

describe('parseMarkers', () => {
  it('returns no comments when the source has no markers', () => {
    expect(parseMarkers('const a = 1;\nexport default [];\n')).toEqual([]);
  });

  it('extracts a single marker with its line number and decoded note', () => {
    const payload = b64urlEncode(JSON.stringify({ note: 'tighten this' }));
    const ts = '2026-04-25T00:00:00.000Z';
    const id = 'c-deadbeef';
    const source = [
      'export default [() => (',
      '  <div>',
      `    {/* @slide-comment id="${id}" ts="${ts}" text="${payload}" */}`,
      '    hi',
      '  </div>',
      ')];',
      '',
    ].join('\n');

    const comments = parseMarkers(source);
    expect(comments).toEqual([{ id, line: 3, ts, note: 'tighten this', hint: undefined }]);
  });

  it('extracts a hint when the marker payload includes one', () => {
    const payload = b64urlEncode(JSON.stringify({ note: 'fix', hint: 'h1' }));
    const source = `{/* @slide-comment id="c-12345678" ts="2026-04-25T00:00:00.000Z" text="${payload}" */}`;
    const [c] = parseMarkers(source);
    expect(c.hint).toBe('h1');
    expect(c.note).toBe('fix');
  });

  it('skips markers whose payload is malformed', () => {
    const source =
      '{/* @slide-comment id="c-12345678" ts="2026-04-25T00:00:00.000Z" text="not_json" */}';
    expect(parseMarkers(source)).toEqual([]);
  });

  it('extracts multiple markers from different lines', () => {
    const p1 = b64urlEncode(JSON.stringify({ note: 'one' }));
    const p2 = b64urlEncode(JSON.stringify({ note: 'two' }));
    const source = [
      `{/* @slide-comment id="c-aaaaaaaa" ts="2026-04-25T00:00:00.000Z" text="${p1}" */}`,
      'const x = 1;',
      `{/* @slide-comment id="c-bbbbbbbb" ts="2026-04-25T00:00:00.000Z" text="${p2}" */}`,
    ].join('\n');

    const comments = parseMarkers(source);
    expect(comments.map((c) => c.note)).toEqual(['one', 'two']);
    expect(comments.map((c) => c.line)).toEqual([1, 3]);
  });
});

const TS = '2026-04-25T00:00:00.000Z';
const marker = (id: string, text: string) =>
  `    {/* @slide-comment id="${id}" ts="${TS}" text="${text}" */}`;

describe('comment intent', () => {
  it('accepts exactly the closed set', () => {
    for (const intent of COMMENT_INTENTS) expect(isCommentIntent(intent)).toBe(true);
    for (const bad of ['remove', 'DELETE', '', 'move', 1, null, undefined, {}]) {
      expect(isCommentIntent(bad)).toBe(false);
    }
  });

  it('round-trips every intent through a marker', () => {
    for (const intent of COMMENT_INTENTS) {
      const text = encodeCommentPayload({ note: 'n', intent });
      const [c] = parseMarkers(marker('c-0000beef', text));
      expect(c).toStrictEqual({ id: 'c-0000beef', line: 1, ts: TS, note: 'n', intent });
    }
  });

  it('encodes payloads without intent byte-identically to pre-intent markers', () => {
    expect(encodeCommentPayload({ note: 'x', hint: undefined, intent: undefined })).toBe(
      'eyJub3RlIjoieCJ9',
    );
    expect(encodeCommentPayload({ note: 'x', hint: 'h' })).toBe('eyJub3RlIjoieCIsImhpbnQiOiJoIn0');
  });

  it('parses a legacy marker with no intent key unchanged', () => {
    const [c] = parseMarkers(marker('c-12345678', 'eyJub3RlIjoieCIsImhpbnQiOiJoIn0'));
    expect(c).toStrictEqual({ id: 'c-12345678', line: 1, ts: TS, note: 'x', hint: 'h' });
  });

  it('drops an unknown or null intent on read but keeps the comment', () => {
    for (const intent of ['explode', null]) {
      const text = b64urlEncode(JSON.stringify({ note: 'keep me', intent }));
      const [c] = parseMarkers(marker('c-12345678', text));
      expect(c).toStrictEqual({ id: 'c-12345678', line: 1, ts: TS, note: 'keep me' });
    }
  });
});

describe('markerDeleteRegex', () => {
  it('matches legacy and intent-bearing markers alike', () => {
    const legacy = marker('c-aaaaaaaa', b64urlEncode(JSON.stringify({ note: 'a' })));
    const withIntent = marker(
      'c-bbbbbbbb',
      encodeCommentPayload({ note: 'b', hint: 'h', intent: 'move-after' }),
    );
    expect(markerDeleteRegex('c-aaaaaaaa').test(legacy)).toBe(true);
    expect(markerDeleteRegex('c-bbbbbbbb').test(withIntent)).toBe(true);
    expect(markerDeleteRegex('c-aaaaaaaa').test(withIntent)).toBe(false);
  });
});
