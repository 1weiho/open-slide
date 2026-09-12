# Code blocks (`<CodeBlock>`)

Render source code, terminal output, or config with syntax highlighting, optional line numbers, and highlighted lines. Import it from `@open-slide/core` and pass the source as **one template-literal child**. The block strips the first line break and the indentation shared by every line, so indent the literal to match the surrounding JSX.

```tsx
import { CodeBlock } from '@open-slide/core';

<CodeBlock lang="python" lineNumbers highlightLines={[3, 4]} style={{ fontSize: 30 }}>
  {`
  def attention(q, k, v):
      scores = q @ k.T / math.sqrt(k.shape[-1])
      weights = softmax(scores, axis=-1)
      return weights @ v
  `}
</CodeBlock>
```

If `slides/code-blocks/` exists in this project (the demo workspace ships it), study it before authoring a code page.

## Contract

- **`lang`** (optional) — one of `python`, `javascript`, `typescript`, `jsx`, `tsx`, `bash`, `json`, `c`, `cpp`, `java`, `go`, `rust`, `sql`, `html`, `css`, `yaml`, or an alias (`js`, `ts`, `py`, `sh`, `shell`, `yml`). Omit it for plain monospace text such as terminal output or logs. Any other value renders plain text and logs a dev-only warning — pick the closest supported language instead of inventing an id.
- **`lineNumbers`** — `boolean`, off by default.
- **`highlightLines`** — 1-based `number[]`, e.g. `[3, 4, 5]`. Ranges are spelled out, never `"3-5"`.
- **`style` / `className`** — normal React props. `style` merges last, so `fontSize`, `background`, `padding`, `marginTop`, … override the defaults.
- **Children** — a single string. Never put JSX, `{variables}`, or multiple expressions inside the block; build the string first if it needs interpolation.
- Grammars load on demand. The first paint shows plain monospace text and colors fill in without moving anything; exports wait for the highlighted state. There is nothing to wait for or configure.

## Sizing — the block must fit the canvas

The default is 28px monospace with a 1.5 line-height. Code may go down to **24px** (never lower) and rarely needs to go above 32px. Long lines are **cropped silently** at the block's edge, so keep them short.

| `fontSize` | Max characters per line | Max lines per block (with a heading above) |
| --- | --- | --- |
| 24px | 100 | 16 |
| 28px | 90 | 14 |
| 32px | 78 | 12 |

Character limits assume the standard 120px page padding; with `lineNumbers` on, subtract 4. If the code is longer, show only the relevant excerpt, or split it across pages with a `highlightLines` focus on each. Do **not** reach for `overflow: auto`, a smaller font, or tighter padding — the canvas does not scroll.

One block per page is the rule. Two short blocks side by side are fine for a before/after comparison; three or more never fit.

## Styling

The block reads its colors from CSS variables with built-in defaults, so restyling is a matter of setting variables on the block's `style` or on the page root — no theme prop, no stylesheet.

| Variable | Role | Default |
| --- | --- | --- |
| `--osd-code-bg` | block background | `#0b0d10` |
| `--osd-code-text` | default text | `#e6e6e6` |
| `--osd-code-keyword` | keywords, storage, operators | `#c678dd` |
| `--osd-code-string` | strings | `#98c379` |
| `--osd-code-comment` | comments (italic) | `#7f848e` |
| `--osd-code-function` | function names and calls | `#61afef` |
| `--osd-code-number` | numbers, `true` / `null` | `#d19a66` |
| `--osd-code-type` | types, classes, HTML tags | `#e5c07b` |
| `--osd-code-variable` | variables, parameters, attributes | `#e06c75` |
| `--osd-code-punctuation` | brackets and punctuation | `#abb2bf` |
| `--osd-code-highlight` | highlighted-line background | `rgba(255, 255, 255, 0.08)` |
| `--osd-code-highlight-bar` | highlighted-line left bar | `var(--osd-accent)` |
| `--osd-code-line-number` | gutter numbers | `rgba(255, 255, 255, 0.28)` |
| `--osd-code-pad` | horizontal padding | `36px` |
| `--osd-font-mono` | code font | system monospace stack |

The default is a dark surface that sits well on light and dark pages alike. For a light block, override the surface and the token colors together:

```tsx
<CodeBlock
  lang="bash"
  style={{
    background: '#f5f5f4',
    color: '#1c1917',
    ['--osd-code-keyword' as string]: '#7c3aed',
    ['--osd-code-string' as string]: '#15803d',
    ['--osd-code-comment' as string]: '#78716c',
    ['--osd-code-function' as string]: '#1d4ed8',
    ['--osd-code-line-number' as string]: '#a8a29e',
  }}
>
  {`npx @open-slide/cli init my-slide`}
</CodeBlock>
```

Set `--osd-font-mono` once on the page root to change the code font deck-wide. The block's corners follow `--osd-radius`.

## Composition

- **Stepped reveal**: wrap a `<CodeBlock>` in `<Step>` like any other element, or stack two blocks in consecutive `<Step>`s to build a "before, then after". A single block cannot reveal line by line; use `highlightLines` across pages for that.
- **Focus**: `highlightLines` is the tool for "look here". Combine it with a one-line caption or the speaker `notes` rather than repeating the code in prose.
- **Inline code** inside a sentence needs no primitive — a `<code>` with the mono font is enough:
  ```tsx
  <code style={{ fontFamily: 'var(--osd-font-mono, ui-monospace, Menlo, monospace)', fontSize: '0.92em' }}>softmax</code>
  ```

## Inspector

The block is a single inspector target: it can be selected, commented on, and restyled from the panel, but its text is never edited inline. Text changes go through the source string in `index.tsx`.

## Anti-patterns

- ❌ Hand-rolling highlighting with a `<pre>` and per-token `<span style={{ color }}>` helpers (`kw()`, `fn()`, `str()`). That is exactly what `<CodeBlock>` replaces.
- ❌ JSX, `{expressions}`, or several children inside the block. Children is one string.
- ❌ Code below 24px, lines over the character limit, or blocks over the line limit. Excerpt or split instead.
- ❌ `overflow: auto` / `overflow: scroll` to fit more code. Cropped code is invisible on stage.
- ❌ A `lang` value outside the supported list. Pick the closest supported language or omit `lang`.
- ❌ A `theme` prop or an imported stylesheet. Restyle through the `--osd-code-*` variables.
