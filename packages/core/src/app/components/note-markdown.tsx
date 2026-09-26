import { Fragment, type ReactNode, useMemo } from 'react';
import { type NoteBlock, type NoteInline, parseNoteMarkdown } from '@/lib/note-markdown';

const CODE_CLASS = 'rounded-[3px] bg-foreground/12 px-[0.3em] py-[0.1em] font-mono text-[0.9em]';

function renderInline(nodes: NoteInline[]): ReactNode {
  return nodes.map((node, i) => {
    switch (node.type) {
      case 'text':
        // biome-ignore lint/suspicious/noArrayIndexKey: static parse output, never reordered
        return <Fragment key={i}>{node.text}</Fragment>;
      case 'strong':
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: static parse output, never reordered
          <strong key={i} className="font-semibold">
            {renderInline(node.children)}
          </strong>
        );
      case 'em':
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: static parse output, never reordered
          <em key={i}>{renderInline(node.children)}</em>
        );
      case 'code':
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: static parse output, never reordered
          <code key={i} className={CODE_CLASS}>
            {node.text}
          </code>
        );
      default:
        return node satisfies never;
    }
  });
}

const HEADING_SIZES = { 1: 'text-[1.25em]', 2: 'text-[1.12em]', 3: 'text-[1.05em]' } as const;

function renderBlock(block: NoteBlock, key: number): ReactNode {
  switch (block.type) {
    case 'heading': {
      // h4–h6 so note headings stay below the app's own UI headings in the
      // presenter window's document outline.
      const Tag = `h${block.level + 3}` as 'h4' | 'h5' | 'h6';
      return (
        <Tag key={key} className={`font-semibold ${HEADING_SIZES[block.level]}`}>
          {renderInline(block.children)}
        </Tag>
      );
    }
    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul';
      return (
        <Tag
          key={key}
          className={`space-y-[0.2em] pl-[1.4em] ${block.ordered ? 'list-decimal' : 'list-disc'}`}
        >
          {block.items.map((item, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static parse output, never reordered
            <li key={i}>{renderInline(item)}</li>
          ))}
        </Tag>
      );
    }
    case 'paragraph':
      return (
        <p key={key}>
          {block.lines.map((line, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static parse output, never reordered
            <Fragment key={i}>
              {i > 0 && <br />}
              {renderInline(line)}
            </Fragment>
          ))}
        </p>
      );
    default:
      return block satisfies never;
  }
}

export function NoteMarkdown({ text }: { text: string }) {
  const blocks = useMemo(() => parseNoteMarkdown(text), [text]);
  return <div className="space-y-[0.65em] whitespace-pre-wrap">{blocks.map(renderBlock)}</div>;
}
