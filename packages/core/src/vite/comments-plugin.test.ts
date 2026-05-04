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

  it('descends through wrapper elements to find the text leaf', () => {
    const src = ['export default [() => (', '<div><span>Hello</span></div>', ')];', ''].join('\n');
    const r = applyEdit(src, 2, 0, [{ kind: 'set-text', value: 'Goodbye' }]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain('<div><span>Goodbye</span></div>');
  });

  it('disambiguates between sibling text leaves via prevText', () => {
    const src = ['export default [() => (', '<h1>Hello <span>world</span></h1>', ')];', ''].join(
      '\n',
    );
    const r = applyEdit(src, 2, 0, [{ kind: 'set-text', value: 'planet', prevText: 'world' }]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain('<h1>Hello <span>planet</span></h1>');
  });

  it('bails when prevText is missing for an ambiguous element', () => {
    const src = ['export default [() => (', '<h1>Hello <span>world</span></h1>', ')];', ''].join(
      '\n',
    );
    const r = applyEdit(src, 2, 0, [{ kind: 'set-text', value: 'Goodbye' }]);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected failure');
    expect(r.status).toBe(422);
    expect(r.error).toMatch(/multiple text candidates/);
  });

  it('bails when prevText matches no candidate', () => {
    const src = ['export default [() => (', '<h1>Hello <span>world</span></h1>', ')];', ''].join(
      '\n',
    );
    const r = applyEdit(src, 2, 0, [
      { kind: 'set-text', value: 'Goodbye', prevText: 'nothing-like-this' },
    ]);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected failure');
    expect(r.status).toBe(422);
    expect(r.error).toMatch(/no text candidate matches/);
  });

  it('bails when prevText matches multiple identical candidates', () => {
    const src = ['export default [() => (', '<h1>X<span>X</span></h1>', ')];', ''].join('\n');
    const r = applyEdit(src, 2, 0, [{ kind: 'set-text', value: 'Y', prevText: 'X' }]);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected failure');
    expect(r.status).toBe(422);
    expect(r.error).toMatch(/cannot disambiguate/);
  });

  it('edits the JSXText child of a component invocation', () => {
    const src = ['export default [() => (', '<Title>Hello</Title>', ')];', ''].join('\n');
    const r = applyEdit(src, 2, 0, [{ kind: 'set-text', value: 'Goodbye' }]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain('<Title>Goodbye</Title>');
  });

  it('bails when element child is a dynamic expression', () => {
    const src = ['export default [() => (', '<h1>{name}</h1>', ')];', ''].join('\n');
    const r = applyEdit(src, 2, 0, [{ kind: 'set-text', value: 'Goodbye' }]);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected failure');
    expect(r.status).toBe(422);
  });

  it('bails when a self-closing element has no editable text', () => {
    const src = ['export default [() => (', '<MyComp title="x" />', ')];', ''].join('\n');
    const r = applyEdit(src, 2, 0, [{ kind: 'set-text', value: 'Goodbye' }]);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected failure');
    expect(r.status).toBe(422);
    expect(r.error).toMatch(/no editable text/);
  });

  it('falls through to call sites when the element is a {children} slot', () => {
    // The host `<div>` at line 2 only renders `{children}`; the actual
    // text lives at the unique call site below.
    const src = [
      'const Eyebrow = ({ children }) => (',
      '  <div>{children}</div>',
      ');',
      'export default [() => (',
      '  <Eyebrow>Hello</Eyebrow>',
      ')];',
      '',
    ].join('\n');
    const r = applyEdit(src, 2, 2, [{ kind: 'set-text', value: 'Goodbye', prevText: 'Hello' }]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain('<Eyebrow>Goodbye</Eyebrow>');
    expect(r.source).toContain('<div>{children}</div>');
  });

  it('disambiguates between sibling call sites of a children-slot component', () => {
    const src = [
      'const Eyebrow = ({ children }) => (',
      '  <div>{children}</div>',
      ');',
      'export default [() => (',
      '  <section>',
      '    <Eyebrow>One</Eyebrow>',
      '    <Eyebrow>Two</Eyebrow>',
      '  </section>',
      ')];',
      '',
    ].join('\n');
    const r = applyEdit(src, 2, 2, [{ kind: 'set-text', value: 'Second', prevText: 'Two' }]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain('<Eyebrow>One</Eyebrow>');
    expect(r.source).toContain('<Eyebrow>Second</Eyebrow>');
  });

  it('bails on a children-slot element when prevText is missing and call sites differ', () => {
    const src = [
      'const Eyebrow = ({ children }) => (',
      '  <div>{children}</div>',
      ');',
      'export default [() => (',
      '  <section>',
      '    <Eyebrow>One</Eyebrow>',
      '    <Eyebrow>Two</Eyebrow>',
      '  </section>',
      ')];',
      '',
    ].join('\n');
    const r = applyEdit(src, 2, 2, [{ kind: 'set-text', value: 'X' }]);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected failure');
    expect(r.status).toBe(422);
    expect(r.error).toMatch(/multiple text candidates/);
  });

  it('routes a prop pass-through edit to the matching call site', () => {
    // `<h2>{title}</h2>` has no editable text of its own — find the
    // `title="..."` literal at the (only) call site and rewrite it.
    const src = [
      'const Card = ({ title }: { title: string }) => (',
      '  <h2>{title}</h2>',
      ');',
      'export default [() => (',
      '  <Card title="Hello" />',
      ')];',
      '',
    ].join('\n');
    const r = applyEdit(src, 2, 2, [{ kind: 'set-text', value: 'Goodbye', prevText: 'Hello' }]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain('<Card title="Goodbye" />');
    expect(r.source).toContain('<h2>{title}</h2>');
  });

  it('disambiguates among sibling call sites of a reused prop component', () => {
    const src = [
      'const Card = ({ title }: { title: string }) => (',
      '  <h2>{title}</h2>',
      ');',
      'export default [() => (',
      '  <section>',
      '    <Card title="First" />',
      '    <Card title="Second" />',
      '  </section>',
      ')];',
      '',
    ].join('\n');
    const r = applyEdit(src, 2, 2, [{ kind: 'set-text', value: 'Edited', prevText: 'Second' }]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain('<Card title="First" />');
    expect(r.source).toContain('<Card title="Edited" />');
  });

  it('escapes a prop value that needs an expression container', () => {
    const src = [
      'const Card = ({ label }: { label: string }) => (',
      '  <h2>{label}</h2>',
      ');',
      'export default [() => (',
      '  <Card label="plain" />',
      ')];',
      '',
    ].join('\n');
    const r = applyEdit(src, 2, 2, [
      { kind: 'set-text', value: 'with "quotes"', prevText: 'plain' },
    ]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain(`<Card label={'with "quotes"'} />`);
  });

  it('bails on a prop pass-through when the prop is not destructured', () => {
    const src = [
      'const Card = (props) => (',
      '  <h2>{title}</h2>',
      ');',
      'export default [() => (',
      '  <Card title="Hello" />',
      ')];',
      '',
    ].join('\n');
    const r = applyEdit(src, 2, 2, [{ kind: 'set-text', value: 'X', prevText: 'Hello' }]);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected failure');
    expect(r.error).toMatch(/no editable text/);
  });

  it('routes a `.map()` MemberExpression child to the matching array entry', () => {
    const src = [
      'const surfaces = [',
      "  { tag: 'CLI', label: 'Terminal' },",
      "  { tag: 'IDE', label: 'VS Code' },",
      '];',
      'export default [() => (',
      '  <>',
      '    {surfaces.map((s) => (',
      '      <div key={s.tag}>{s.label}</div>',
      '    ))}',
      '  </>',
      ')];',
      '',
    ].join('\n');
    const r = applyEdit(src, 8, 6, [{ kind: 'set-text', value: 'Shell', prevText: 'Terminal' }]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain("label: 'Shell'");
    expect(r.source).toContain("label: 'VS Code'");
  });

  it('routes a `.map()` Identifier child (destructured) to the matching array entry', () => {
    const src = [
      'const items = [',
      "  { name: 'First' },",
      "  { name: 'Second' },",
      '];',
      'export default [() => (',
      '  <>',
      '    {items.map(({ name }) => (',
      '      <span key={name}>{name}</span>',
      '    ))}',
      '  </>',
      ')];',
      '',
    ].join('\n');
    const r = applyEdit(src, 8, 6, [{ kind: 'set-text', value: 'Edited', prevText: 'Second' }]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain("name: 'First'");
    expect(r.source).toContain("name: 'Edited'");
  });

  it('handles an inline array literal in a `.map()` callee', () => {
    const src = [
      'export default [() => (',
      '  <>',
      "    {[{ word: 'a' }, { word: 'b' }].map((x) => (",
      '      <em key={x.word}>{x.word}</em>',
      '    ))}',
      '  </>',
      ')];',
      '',
    ].join('\n');
    const r = applyEdit(src, 4, 6, [{ kind: 'set-text', value: 'A!', prevText: 'a' }]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain("word: 'A!'");
    expect(r.source).toContain("word: 'b'");
  });

  it('bails on a `.map()` child when the prop is not a literal', () => {
    const src = [
      'const greet = "hi";',
      'const items = [{ name: greet }];',
      'export default [() => (',
      '  <>',
      '    {items.map((x) => (',
      '      <span>{x.name}</span>',
      '    ))}',
      '  </>',
      ')];',
      '',
    ].join('\n');
    const r = applyEdit(src, 6, 6, [{ kind: 'set-text', value: 'X', prevText: 'hi' }]);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected failure');
    expect(r.error).toMatch(/no editable text/);
  });

  it('bails on a prop pass-through when the call site uses a non-literal value', () => {
    const src = [
      'const heading = "Hello";',
      'const Card = ({ title }: { title: string }) => (',
      '  <h2>{title}</h2>',
      ');',
      'export default [() => (',
      '  <Card title={heading} />',
      ')];',
      '',
    ].join('\n');
    const r = applyEdit(src, 3, 2, [{ kind: 'set-text', value: 'X', prevText: 'Hello' }]);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected failure');
    expect(r.error).toMatch(/no editable text/);
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

describe('applyEdit / replace-placeholder-with-image', () => {
  it('rewrites <ImagePlaceholder> to <img> and adds an import', () => {
    const src = [
      "import { ImagePlaceholder } from '@open-slide/core';",
      'export default [() => (',
      '<ImagePlaceholder hint="Product hero" width={1280} height={720} />',
      ')];',
      '',
    ].join('\n');
    const r = applyEdit(src, 3, 0, [
      { kind: 'replace-placeholder-with-image', assetPath: './assets/hero.png' },
    ]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain("import hero from './assets/hero.png';");
    expect(r.source).toContain(
      "<img src={hero} alt='Product hero' style={{ width: 1280, height: 720, objectFit: 'cover' }} />",
    );
    expect(r.source).not.toContain('<ImagePlaceholder');
  });

  it('reuses an existing import for the same asset path', () => {
    const src = [
      "import { ImagePlaceholder } from '@open-slide/core';",
      "import hero from './assets/hero.png';",
      'export default [() => (',
      '<ImagePlaceholder hint="Hero" width={800} height={600} />',
      ')];',
      '',
    ].join('\n');
    const r = applyEdit(src, 4, 0, [
      { kind: 'replace-placeholder-with-image', assetPath: './assets/hero.png' },
    ]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain('<img src={hero}');
    const occurrences = r.source.match(/from '\.\/assets\/hero\.png'/g) ?? [];
    expect(occurrences.length).toBe(1);
  });

  it('omits width/height when the placeholder did not specify them', () => {
    const src = [
      "import { ImagePlaceholder } from '@open-slide/core';",
      'export default [() => (',
      '<ImagePlaceholder hint="Logo" />',
      ')];',
      '',
    ].join('\n');
    const r = applyEdit(src, 3, 0, [
      { kind: 'replace-placeholder-with-image', assetPath: './assets/logo.svg' },
    ]);
    if (!r.ok) throw new Error(`expected ok, got ${r.error}`);
    expect(r.source).toContain("<img src={logo} alt='Logo' style={{ objectFit: 'cover' }} />");
    expect(r.source).not.toMatch(/width:\s/);
    expect(r.source).not.toMatch(/height:\s/);
  });

  it('rejects when the targeted JSX is not an ImagePlaceholder', () => {
    const src = ['export default [() => (', '<div>hi</div>', ')];', ''].join('\n');
    const r = applyEdit(src, 2, 0, [
      { kind: 'replace-placeholder-with-image', assetPath: './assets/a.png' },
    ]);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected failure');
    expect(r.status).toBe(422);
    expect(r.error).toMatch(/placeholder/);
  });

  it('rejects asset paths outside ./assets/', () => {
    const src = [
      "import { ImagePlaceholder } from '@open-slide/core';",
      'export default [() => (',
      '<ImagePlaceholder hint="x" />',
      ')];',
      '',
    ].join('\n');
    const r = applyEdit(src, 3, 0, [
      { kind: 'replace-placeholder-with-image', assetPath: '../bad.png' },
    ]);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected failure');
    expect(r.error).toMatch(/\.\/assets\//);
  });
});
