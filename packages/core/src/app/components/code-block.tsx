import {
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useState,
} from 'react';
import {
  type CodeBlockLang,
  type CodeLang,
  type CodeLine,
  getCachedLines,
  highlight,
  normalizeCode,
  plainLines,
  resolveLang,
  tokenStyle,
} from '../lib/code-highlight';

export type CodeBlockProps = {
  lang?: CodeBlockLang | (string & {});
  lineNumbers?: boolean;
  highlightLines?: number[];
  children: string;
  style?: CSSProperties;
  className?: string;
} & Omit<HTMLAttributes<HTMLPreElement>, 'children' | 'style' | 'className'>;

const PAD = 'var(--osd-code-pad, 36px)';

const BASE_STYLE: CSSProperties = {
  margin: 0,
  paddingBlock: 28,
  paddingInline: PAD,
  fontSize: 28,
  lineHeight: 1.5,
  fontFamily: 'var(--osd-font-mono, ui-monospace, "SF Mono", Menlo, Consolas, monospace)',
  color: 'var(--osd-code-text, #e6e6e6)',
  background: 'var(--osd-code-bg, #0b0d10)',
  borderRadius: 'var(--osd-radius, 12px)',
  whiteSpace: 'pre',
  overflow: 'hidden',
  tabSize: 4,
};

const warnedLangs = new Set<string>();

function warnUnsupportedLang(lang: string) {
  if (!import.meta.env.DEV || warnedLangs.has(lang)) return;
  warnedLangs.add(lang);
  console.warn(
    `[open-slide] <CodeBlock lang="${lang}"> is not a supported language; rendering plain text.`,
  );
}

type Highlighted = { key: string; lines: CodeLine[] };

function useHighlightedLines(lang: CodeLang | null, code: string) {
  const key = `${lang}\0${code}`;
  const [state, setState] = useState<Highlighted | null>(() => {
    const cached = lang ? getCachedLines(lang, code) : undefined;
    return cached ? { key, lines: cached } : null;
  });

  useEffect(() => {
    if (!lang) return;
    const cached = getCachedLines(lang, code);
    if (cached) {
      setState({ key, lines: cached });
      return;
    }
    let alive = true;
    highlight(lang, code)
      .then((lines) => alive && setState({ key, lines }))
      .catch(() => alive && setState({ key, lines: plainLines(code) }));
    return () => {
      alive = false;
    };
  }, [lang, code, key]);

  if (!lang) return { lines: plainLines(code), ready: true };
  // A result for a previous (lang, code) must not stand in for the current
  // one: exports would capture stale tokens behind an already-set ready flag.
  const current = state?.key === key ? state.lines : null;
  return { lines: current ?? plainLines(code), ready: current !== null };
}

function childrenToSource(children: ReactNode): string {
  if (Array.isArray(children)) return children.map(String).join('');
  return String(children ?? '');
}

export function CodeBlock({
  lang,
  lineNumbers = false,
  highlightLines,
  children,
  style,
  className,
  ...rest
}: CodeBlockProps) {
  const resolved = resolveLang(lang);
  if (lang && !resolved) warnUnsupportedLang(lang);
  const code = normalizeCode(childrenToSource(children));
  const { lines, ready } = useHighlightedLines(resolved, code);
  const gutterWidth = `${String(lines.length).length + 1}ch`;

  const rows: ReactNode[] = [];
  for (let i = 0; i < lines.length; i++) {
    const n = i + 1;
    const line = lines[i];
    const isHighlighted = highlightLines?.includes(n) ?? false;
    const tokens: ReactNode[] = [];
    for (let j = 0; j < line.length; j++) {
      const token = line[j];
      tokens.push(
        <span key={j} style={tokenStyle(token)}>
          {token.content}
        </span>,
      );
    }
    const isEmpty = line.length === 0 || (line.length === 1 && line[0].content === '');
    rows.push(
      <span
        key={n}
        style={{
          display: 'block',
          minHeight: '1lh',
          marginInline: `calc(-1 * ${PAD})`,
          paddingInline: PAD,
          background: isHighlighted
            ? 'var(--osd-code-highlight, rgba(255, 255, 255, 0.08))'
            : undefined,
          boxShadow: isHighlighted
            ? 'inset 3px 0 0 var(--osd-code-highlight-bar, var(--osd-accent, #61afef))'
            : undefined,
        }}
      >
        {lineNumbers && (
          <span
            aria-hidden
            style={{
              display: 'inline-block',
              width: gutterWidth,
              marginRight: '1.5ch',
              textAlign: 'right',
              color: 'var(--osd-code-line-number, rgba(255, 255, 255, 0.28))',
              userSelect: 'none',
            }}
          >
            {n}
          </span>
        )}
        {isEmpty ? null : tokens}
      </span>,
    );
  }

  return (
    <pre
      {...rest}
      data-waitfor="[data-osd-code-ready]"
      data-osd-no-inline-edit=""
      className={className}
      style={{ ...BASE_STYLE, ...style }}
    >
      <code data-osd-code-ready={ready ? '' : undefined} style={{ display: 'block' }}>
        {rows}
      </code>
    </pre>
  );
}
