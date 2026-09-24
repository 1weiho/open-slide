export type NoteInline =
  | { type: 'text'; text: string }
  | { type: 'strong'; children: NoteInline[] }
  | { type: 'em'; children: NoteInline[] }
  | { type: 'code'; text: string };

export type NoteBlock =
  | { type: 'paragraph'; lines: NoteInline[][] }
  | { type: 'heading'; level: 1 | 2 | 3; children: NoteInline[] }
  | { type: 'list'; ordered: boolean; items: NoteInline[][] };

const HEADING = /^(#{1,3})\s+(.*)$/;
// Ordered before the single-star branch so `**bold**` never parses as
// empty italics. Emphasis content must start and end with non-whitespace
// (CommonMark) so spaced stars like `2 * 3 … 5 * 4` never pair up, and `_`
// needs word boundaries to leave snake_case alone.
const INLINE =
  /`([^`\n]+)`|\*\*(\S(?:[^\n]*?\S)?)\*\*|\*([^\s*](?:[^*\n]*[^\s*])?)\*|(?<![\w])_([^\s_](?:[^_\n]*[^\s_])?)_(?![\w])/g;

// Backslash-escaped punctuation is swapped for private-use characters before
// any block or inline matching, so an escaped delimiter can never open or
// close anything. Leaves swap them back — code spans keep the backslash,
// matching CommonMark's "no escapes inside code" rule.
const ESCAPABLE = '\\`*_#-.)';
const ESCAPE = /\\([\\`*_#\-.)])/g;
const HIDDEN = /[-]/g;

function hideEscapes(text: string): string {
  return text
    .replace(HIDDEN, '')
    .replace(ESCAPE, (_, ch: string) => String.fromCharCode(0xe000 + ESCAPABLE.indexOf(ch)));
}

function restoreEscapes(text: string, keepBackslash: boolean): string {
  return text.replace(HIDDEN, (ch) => {
    const original = ESCAPABLE[ch.charCodeAt(0) - 0xe000];
    return keepBackslash ? `\\${original}` : original;
  });
}

function matchListItem(line: string): { ordered: boolean; content: string } | null {
  const unordered = /^\s*[-*]\s+(.*)$/.exec(line);
  if (unordered) return { ordered: false, content: unordered[1] };
  const ordered = /^\s*\d{1,3}[.)]\s+(.*)$/.exec(line);
  if (ordered) return { ordered: true, content: ordered[1] };
  return null;
}

function parseInlineHidden(text: string): NoteInline[] {
  const out: NoteInline[] = [];
  const pushText = (raw: string) => {
    if (raw) out.push({ type: 'text', text: restoreEscapes(raw, false) });
  };
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    pushText(text.slice(last, m.index));
    if (m[1] !== undefined) out.push({ type: 'code', text: restoreEscapes(m[1], true) });
    else if (m[2] !== undefined) out.push({ type: 'strong', children: parseInlineHidden(m[2]) });
    else out.push({ type: 'em', children: parseInlineHidden(m[3] ?? m[4]) });
    last = m.index + m[0].length;
  }
  pushText(text.slice(last));
  return out;
}

export function parseInline(text: string): NoteInline[] {
  return parseInlineHidden(hideEscapes(text));
}

export function parseNoteMarkdown(text: string): NoteBlock[] {
  const lines = hideEscapes(text).split('\n');
  const blocks: NoteBlock[] = [];
  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (trimmed === '') {
      i++;
      continue;
    }
    const heading = HEADING.exec(trimmed);
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading[1].length as 1 | 2 | 3,
        children: parseInlineHidden(heading[2].trim()),
      });
      i++;
      continue;
    }
    const item = matchListItem(lines[i]);
    if (item) {
      const items: NoteInline[][] = [];
      while (i < lines.length) {
        const next = matchListItem(lines[i]);
        if (!next || next.ordered !== item.ordered) break;
        items.push(parseInlineHidden(next.content.trim()));
        i++;
      }
      blocks.push({ type: 'list', ordered: item.ordered, items });
      continue;
    }
    // Paragraph lines keep leading whitespace (rendered with pre-wrap) so
    // plain-text notes don't lose manual indentation or spacing.
    const paragraph = [parseInlineHidden(lines[i].trimEnd())];
    i++;
    while (i < lines.length) {
      const next = lines[i];
      const nextTrimmed = next.trim();
      if (nextTrimmed === '' || HEADING.test(nextTrimmed) || matchListItem(next)) break;
      paragraph.push(parseInlineHidden(next.trimEnd()));
      i++;
    }
    blocks.push({ type: 'paragraph', lines: paragraph });
  }
  return blocks;
}
