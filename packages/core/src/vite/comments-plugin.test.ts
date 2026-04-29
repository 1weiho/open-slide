import { describe, expect, it } from 'vitest';
import {
  applyEdit,
  b64urlDecode,
  b64urlEncode,
  parseMarkers,
  safeAssetIdentifier,
} from './comments-plugin.ts';

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

describe('applyEdit / set-style', () => {
  // Every JSX opening tag in these synthetic sources sits at column 0;
  // the line numbers below are that tag's line (1-indexed).
  it('inserts a new style attribute when none exists', () => {
    const src = ['export default [() => (', '<h1>Hello</h1>', ')];', ''].join('\n');
    const r = applyEdit(src, 2, 0, [{ kind: 'set-style', key: 'color', value: '#ef4444' }]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toBe(
      ['export default [() => (', "<h1 style={{ color: '#ef4444' }}>Hello</h1>", ')];', ''].join(
        '\n',
      ),
    );
  });

  it('updates an existing style key in place', () => {
    const src = ['export default [() => (', "<h1 style={{ color: 'red' }}>Hi</h1>", ')];', ''].join(
      '\n',
    );
    const r = applyEdit(src, 2, 0, [{ kind: 'set-style', key: 'color', value: '#00ff00' }]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain("style={{ color: '#00ff00' }}");
  });

  it('adds a new key alongside existing keys', () => {
    const src = ['export default [() => (', "<h1 style={{ color: 'red' }}>Hi</h1>", ')];', ''].join(
      '\n',
    );
    const r = applyEdit(src, 2, 0, [{ kind: 'set-style', key: 'fontSize', value: '24px' }]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain("style={{ color: 'red', fontSize: '24px' }}");
  });

  it('removes a key when value is null', () => {
    const src = [
      'export default [() => (',
      "<h1 style={{ color: 'red', fontSize: '24px' }}>Hi</h1>",
      ')];',
      '',
    ].join('\n');
    const r = applyEdit(src, 2, 0, [{ kind: 'set-style', key: 'fontSize', value: null }]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain("style={{ color: 'red' }}");
    expect(r.source).not.toContain('fontSize');
  });

  it('removes the entire style attribute when the last property is cleared', () => {
    const src = ['export default [() => (', "<h1 style={{ color: 'red' }}>Hi</h1>", ')];', ''].join(
      '\n',
    );
    const r = applyEdit(src, 2, 0, [{ kind: 'set-style', key: 'color', value: null }]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain('<h1>Hi</h1>');
    expect(r.source).not.toContain('style');
  });

  it('preserves variable-valued properties when editing other keys', () => {
    const src = [
      'export default [() => (',
      '<h1 style={{ fontSize: someVar, color: "red" }}>Hi</h1>',
      ')];',
      '',
    ].join('\n');
    const r = applyEdit(src, 2, 0, [{ kind: 'set-style', key: 'color', value: 'blue' }]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain("style={{ fontSize: someVar, color: 'blue' }}");
  });

  it('bails when style is a non-object expression', () => {
    const src = ['export default [() => (', '<h1 style={someStyle}>Hi</h1>', ')];', ''].join('\n');
    const r = applyEdit(src, 2, 0, [{ kind: 'set-style', key: 'color', value: 'red' }]);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected failure');
    expect(r.status).toBe(422);
    expect(r.error).toMatch(/literal object/);
  });

  it('bails when style object contains a spread', () => {
    const src = ['export default [() => (', '<h1 style={{ ...base }}>Hi</h1>', ')];', ''].join(
      '\n',
    );
    const r = applyEdit(src, 2, 0, [{ kind: 'set-style', key: 'color', value: 'red' }]);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected failure');
    expect(r.status).toBe(422);
  });

  it('escapes special characters in style values', () => {
    const src = ['export default [() => (', '<h1>Hi</h1>', ')];', ''].join('\n');
    const r = applyEdit(src, 2, 0, [{ kind: 'set-style', key: 'fontFamily', value: "Pacifico's" }]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain("fontFamily: 'Pacifico\\'s'");
  });
});

describe('applyEdit / set-text', () => {
  it('replaces a JSXText child', () => {
    const src = ['export default [() => (', '<h1>Hello</h1>', ')];', ''].join('\n');
    const r = applyEdit(src, 2, 0, [{ kind: 'set-text', value: 'Goodbye' }]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain('<h1>Goodbye</h1>');
  });

  it('replaces a string-literal expression child', () => {
    const src = ['export default [() => (', "<h1>{'Hello'}</h1>", ')];', ''].join('\n');
    const r = applyEdit(src, 2, 0, [{ kind: 'set-text', value: 'Goodbye' }]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain("<h1>{'Goodbye'}</h1>");
  });

  it('emits an expression container when value contains JSX-unsafe chars', () => {
    const src = ['export default [() => (', '<h1>Hello</h1>', ')];', ''].join('\n');
    const r = applyEdit(src, 2, 0, [{ kind: 'set-text', value: '1 < 2 > 0' }]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain("<h1>{'1 < 2 > 0'}</h1>");
  });

  it('bails when element has nested JSX children', () => {
    const src = ['export default [() => (', '<h1>Hello <span>world</span></h1>', ')];', ''].join(
      '\n',
    );
    const r = applyEdit(src, 2, 0, [{ kind: 'set-text', value: 'Goodbye' }]);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected failure');
    expect(r.status).toBe(422);
    expect(r.error).toMatch(/complex children/);
  });

  it('bails when element child is a dynamic expression', () => {
    const src = ['export default [() => (', '<h1>{name}</h1>', ')];', ''].join('\n');
    const r = applyEdit(src, 2, 0, [{ kind: 'set-text', value: 'Goodbye' }]);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected failure');
    expect(r.status).toBe(422);
  });
});

describe('applyEdit / combined ops', () => {
  it('applies style and text ops in one pass', () => {
    const src = ['export default [() => (', '<h1>Hello</h1>', ')];', ''].join('\n');
    const r = applyEdit(src, 2, 0, [
      { kind: 'set-style', key: 'fontWeight', value: '700' },
      { kind: 'set-text', value: 'Bold!' },
    ]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain("<h1 style={{ fontWeight: '700' }}>Bold!</h1>");
  });

  it('returns an unchanged source when ops are empty', () => {
    const src = '<h1>Hi</h1>';
    const r = applyEdit(src, 1, 0, []);
    if (!r.ok) throw new Error('expected ok');
    expect(r.source).toBe(src);
  });
});

describe('safeAssetIdentifier', () => {
  it('camel-cases dashes and spaces', () => {
    expect(safeAssetIdentifier('my-logo.svg', new Set())).toBe('myLogo');
    expect(safeAssetIdentifier('hello world.png', new Set())).toBe('helloWorld');
  });

  it('prefixes identifiers that would start with a digit', () => {
    expect(safeAssetIdentifier('2026-photo.jpg', new Set())).toBe('asset2026Photo');
  });

  it('falls back to "asset" for names with no usable characters', () => {
    expect(safeAssetIdentifier('---.png', new Set())).toBe('asset');
  });

  it('appends a counter when the candidate collides with an existing name', () => {
    const taken = new Set(['logo', 'logo2']);
    expect(safeAssetIdentifier('logo.svg', taken)).toBe('logo3');
  });
});

describe('applyEdit / set-attr-asset', () => {
  it('inserts an import and rewrites the src attribute on a fresh <img>', () => {
    const src = [
      "import logo from './assets/logo.svg';",
      'export default [() => (',
      '<img src={logo} />',
      ')];',
      '',
    ].join('\n');
    const r = applyEdit(src, 3, 0, [
      { kind: 'set-attr-asset', attr: 'src', assetPath: './assets/photo.png' },
    ]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain("import photo from './assets/photo.png';");
    expect(r.source).toContain('<img src={photo} />');
    // Original import is preserved.
    expect(r.source).toContain("import logo from './assets/logo.svg';");
  });

  it('reuses an existing import when the path is already imported', () => {
    const src = [
      "import logo from './assets/logo.svg';",
      "import photo from './assets/photo.png';",
      'export default [() => (',
      '<img src={logo} />',
      ')];',
      '',
    ].join('\n');
    const r = applyEdit(src, 4, 0, [
      { kind: 'set-attr-asset', attr: 'src', assetPath: './assets/photo.png' },
    ]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain('<img src={photo} />');
    // No duplicate import added.
    const occurrences = r.source.match(/from '\.\/assets\/photo\.png'/g) ?? [];
    expect(occurrences.length).toBe(1);
  });

  it('inserts a fresh src attribute on an <img> that has none', () => {
    const src = [
      "import alt from './assets/alt.svg';",
      'export default [() => (',
      '<img alt="" />',
      ')];',
      '',
    ].join('\n');
    const r = applyEdit(src, 3, 0, [
      { kind: 'set-attr-asset', attr: 'src', assetPath: './assets/alt.svg' },
    ]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain('<img src={alt} alt="" />');
  });

  it('rejects asset paths outside ./assets/', () => {
    const src = ['export default [() => (', '<img src="x" />', ')];', ''].join('\n');
    const r = applyEdit(src, 2, 0, [
      { kind: 'set-attr-asset', attr: 'src', assetPath: '../foo.png' },
    ]);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected failure');
    expect(r.error).toMatch(/\.\/assets\//);
  });
});
