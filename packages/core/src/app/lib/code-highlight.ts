import type { HighlighterCore, LanguageRegistration, ThemeRegistrationRaw } from '@shikijs/core';
import type { CSSProperties } from 'react';

export const CODE_LANGS = [
  'python',
  'javascript',
  'typescript',
  'jsx',
  'tsx',
  'bash',
  'json',
  'c',
  'cpp',
  'java',
  'go',
  'rust',
  'sql',
  'html',
  'css',
  'yaml',
] as const;

export type CodeLang = (typeof CODE_LANGS)[number];

const LANG_ALIASES = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  yml: 'yaml',
} as const satisfies Record<string, CodeLang>;

export type CodeLangAlias = keyof typeof LANG_ALIASES;
export type CodeBlockLang = CodeLang | CodeLangAlias;

export type CodeToken = { content: string; offset: number; color?: string; fontStyle?: number };
export type CodeLine = CodeToken[];

const CANONICAL = new Set<string>(CODE_LANGS);

export function resolveLang(lang: string | undefined): CodeLang | null {
  if (!lang) return null;
  const key = lang.toLowerCase();
  if (CANONICAL.has(key)) return key as CodeLang;
  if (key in LANG_ALIASES) return LANG_ALIASES[key as CodeLangAlias];
  return null;
}

export function normalizeCode(src: string): string {
  const lines = src.replace(/\r\n?/g, '\n').replace(/^\n/, '').replace(/\s+$/, '').split('\n');
  const indents = lines
    .filter((line) => line.trim() !== '')
    .map((line) => line.match(/^[ \t]*/)?.[0].length ?? 0);
  const shared = indents.length > 0 ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(shared)).join('\n');
}

export function plainLines(code: string): CodeLine[] {
  return code.split('\n').map((content) => [{ content, offset: 0 }]);
}

// The theme's colors are sentinels: each maps to a `--osd-code-*` variable in
// `tokenStyle`, so a deck restyles tokens by overriding variables rather than
// by picking a theme.
const TOKEN_VARS: Record<string, string> = {
  '#c678dd': '--osd-code-keyword',
  '#98c379': '--osd-code-string',
  '#7f848e': '--osd-code-comment',
  '#61afef': '--osd-code-function',
  '#d19a66': '--osd-code-number',
  '#e5c07b': '--osd-code-type',
  '#e06c75': '--osd-code-variable',
  '#abb2bf': '--osd-code-punctuation',
};

const THEME_NAME = 'open-slide';

const THEME: ThemeRegistrationRaw = {
  name: THEME_NAME,
  type: 'dark',
  fg: '#e6e6e6',
  bg: '#0b0d10',
  settings: [
    { settings: { foreground: '#e6e6e6' } },
    {
      scope: ['keyword', 'storage.type', 'storage.modifier', 'keyword.operator'],
      settings: { foreground: '#c678dd' },
    },
    { scope: ['string'], settings: { foreground: '#98c379' } },
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#7f848e', fontStyle: 'italic' },
    },
    {
      scope: ['entity.name.function', 'support.function', 'meta.function-call.generic'],
      settings: { foreground: '#61afef' },
    },
    {
      scope: ['constant.numeric', 'constant.language', 'constant.character'],
      settings: { foreground: '#d19a66' },
    },
    {
      scope: [
        'entity.name.type',
        'entity.name.class',
        'support.type',
        'support.class',
        'entity.name.tag',
      ],
      settings: { foreground: '#e5c07b' },
    },
    {
      scope: ['variable', 'variable.parameter', 'entity.other.attribute-name'],
      settings: { foreground: '#e06c75' },
    },
    { scope: ['punctuation', 'meta.brace'], settings: { foreground: '#abb2bf' } },
  ],
};

type LangModule = { default: LanguageRegistration[] };

// Static import paths so the consumer's bundler can code-split one chunk per
// grammar; a template-literal `import()` would not be resolvable from dist.
const LANG_LOADERS: Record<CodeLang, () => Promise<LangModule>> = {
  python: () => import('@shikijs/langs/python'),
  javascript: () => import('@shikijs/langs/javascript'),
  typescript: () => import('@shikijs/langs/typescript'),
  jsx: () => import('@shikijs/langs/jsx'),
  tsx: () => import('@shikijs/langs/tsx'),
  bash: () => import('@shikijs/langs/bash'),
  json: () => import('@shikijs/langs/json'),
  c: () => import('@shikijs/langs/c'),
  cpp: () => import('@shikijs/langs/cpp'),
  java: () => import('@shikijs/langs/java'),
  go: () => import('@shikijs/langs/go'),
  rust: () => import('@shikijs/langs/rust'),
  sql: () => import('@shikijs/langs/sql'),
  html: () => import('@shikijs/langs/html'),
  css: () => import('@shikijs/langs/css'),
  yaml: () => import('@shikijs/langs/yaml'),
};

let highlighterPromise: Promise<HighlighterCore> | null = null;
const loadedLangs = new Map<CodeLang, Promise<void>>();
const cache = new Map<string, CodeLine[]>();
const inflight = new Map<string, Promise<CodeLine[]>>();

function cacheKey(lang: CodeLang, code: string): string {
  return `${lang}\0${code}`;
}

function getHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= Promise.all([
    import('@shikijs/core'),
    import('@shikijs/engine-javascript'),
  ]).then(([core, engine]) =>
    core.createHighlighterCore({
      themes: [THEME],
      langs: [],
      engine: engine.createJavaScriptRegexEngine(),
    }),
  );
  return highlighterPromise;
}

function loadLang(highlighter: HighlighterCore, lang: CodeLang): Promise<void> {
  let loading = loadedLangs.get(lang);
  if (!loading) {
    loading = LANG_LOADERS[lang]().then((mod) => highlighter.loadLanguage(mod.default));
    loadedLangs.set(lang, loading);
  }
  return loading;
}

export function getCachedLines(lang: CodeLang, code: string): CodeLine[] | undefined {
  return cache.get(cacheKey(lang, code));
}

export function highlight(lang: CodeLang, code: string): Promise<CodeLine[]> {
  const key = cacheKey(lang, code);
  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached);
  const pending = inflight.get(key);
  if (pending) return pending;
  const task = (async () => {
    try {
      const highlighter = await getHighlighter();
      await loadLang(highlighter, lang);
      const lines = highlighter.codeToTokensBase(code, { lang, theme: THEME_NAME });
      cache.set(key, lines);
      return lines;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, task);
  return task;
}

export function tokenStyle(token: CodeToken): CSSProperties | undefined {
  const style: CSSProperties = {};
  if (token.color) {
    const color = token.color.toLowerCase();
    const variable = TOKEN_VARS[color];
    style.color = variable ? `var(${variable}, ${color})` : token.color;
  }
  const bits = token.fontStyle ?? 0;
  if (bits > 0 && bits & 1) style.fontStyle = 'italic';
  if (bits > 0 && bits & 2) style.fontWeight = 700;
  return Object.keys(style).length > 0 ? style : undefined;
}
