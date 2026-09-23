import { CodeBlock, type Page, type SlideMeta } from '@open-slide/core';
import { useEffect, useState } from 'react';

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

const PYTHON = `def greet(name):
    return "hi " + name`;
const TYPESCRIPT = `function greet(name) {
  return "hi " + name;
}`;

const Swap: Page = () => {
  const [ts, setTs] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setTs(true), 2_000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div style={fill}>
      <h1 style={{ fontSize: 96, margin: 0 }}>Code block swap</h1>
      <CodeBlock lang={ts ? 'typescript' : 'python'} style={{ marginTop: 48 }}>
        {ts ? TYPESCRIPT : PYTHON}
      </CodeBlock>
    </div>
  );
};

export default [One, Swap] satisfies Page[];
