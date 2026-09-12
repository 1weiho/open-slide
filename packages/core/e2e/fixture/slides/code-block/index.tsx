import { CodeBlock, type Page, type SlideMeta } from '@open-slide/core';

export const meta: SlideMeta = {
  title: 'Code Block Deck',
  createdAt: '2026-01-01T12:00:00.000Z',
};

const fill = {
  width: '100%',
  height: '100%',
  background: '#0d1117',
  color: '#e6edf3',
  padding: 120,
  fontFamily: 'system-ui, sans-serif',
} as const;

const One: Page = () => (
  <div style={fill}>
    <h1 style={{ fontSize: 96, margin: 0 }}>Code block page</h1>
    <CodeBlock lang="python" lineNumbers highlightLines={[2]} style={{ marginTop: 48 }}>
      {`
      def greet(name):
          return "hi " + name
      `}
    </CodeBlock>
  </div>
);

export default [One] satisfies Page[];
