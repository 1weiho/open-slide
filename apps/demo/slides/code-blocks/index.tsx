import {
  CodeBlock,
  type DesignSystem,
  type Page,
  type SlideMeta,
  Step,
  Steps,
  useSlidePageNumber,
} from '@open-slide/core';

export const design: DesignSystem = {
  palette: { bg: '#0f172a', text: '#f8fafc', accent: '#fbbf24' },
  fonts: {
    display: 'system-ui, -apple-system, sans-serif',
    body: 'system-ui, -apple-system, sans-serif',
  },
  typeScale: { hero: 150, body: 36 },
  radius: 16,
};

const muted = '#94a3b8';

const fill = {
  width: '100%',
  height: '100%',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: 'var(--osd-font-body)',
  padding: 120,
  boxSizing: 'border-box',
  position: 'relative',
} as const;

const Heading = ({ children }: { children: string }) => (
  <h2
    style={{
      fontFamily: 'var(--osd-font-display)',
      fontSize: 72,
      fontWeight: 800,
      lineHeight: 1.1,
      margin: '0 0 44px',
    }}
  >
    {children}
  </h2>
);

const Caption = ({ children }: { children: string }) => (
  <p style={{ fontSize: 30, lineHeight: 1.5, color: muted, margin: '36px 0 0', maxWidth: 1400 }}>
    {children}
  </p>
);

const Footer = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={{
        position: 'absolute',
        right: 120,
        bottom: 64,
        fontSize: 24,
        color: muted,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
    </div>
  );
};

const Cover: Page = () => (
  <div style={{ ...fill, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <div style={{ fontSize: 28, color: 'var(--osd-accent)', letterSpacing: '0.2em' }}>
      OPEN-SLIDE · PRIMITIVES
    </div>
    <h1
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 'var(--osd-size-hero)',
        fontWeight: 900,
        lineHeight: 1.02,
        margin: '32px 0',
      }}
    >
      Code on stage.
    </h1>
    <p style={{ fontSize: 'var(--osd-size-body)', color: muted, maxWidth: 1200, margin: 0 }}>
      One primitive for source code: highlighting, line numbers, and a focus bar that follows the
      deck accent.
    </p>
    <Footer />
  </div>
);

const Python: Page = () => (
  <div style={fill}>
    <Heading>Scaled dot-product attention</Heading>
    <CodeBlock lang="python" lineNumbers highlightLines={[4, 5]} style={{ fontSize: 30 }}>
      {`
      import math

      def attention(q, k, v):
          scores = q @ k.T / math.sqrt(k.shape[-1])   # (n, n)
          weights = softmax(scores, axis=-1)
          return weights @ v
      `}
    </CodeBlock>
    <Caption>
      Lines 4 and 5 are the whole idea: scale the dot products, then normalise each row.
    </Caption>
    <Footer />
  </div>
);

const Tsx: Page = () => (
  <div style={fill}>
    <Heading>A page is just a component</Heading>
    <CodeBlock lang="tsx" lineNumbers>
      {`
      import type { Page } from '@open-slide/core';

      const Cover: Page = () => (
        <div style={{ width: '100%', height: '100%', padding: 120 }}>
          <h1 style={{ fontSize: 'var(--osd-size-hero)' }}>Hello, agents</h1>
        </div>
      );

      export default [Cover] satisfies Page[];
      `}
    </CodeBlock>
    <Footer />
  </div>
);

const LightVariant: Page = () => (
  <div style={{ ...fill, background: '#f5f5f4', color: '#1c1917' }}>
    <Heading>Restyle with variables</Heading>
    <CodeBlock
      lang="bash"
      lineNumbers
      style={{
        fontSize: 30,
        background: '#ffffff',
        color: '#1c1917',
        border: '1px solid #e7e5e4',
        ['--osd-code-keyword' as string]: '#7c3aed',
        ['--osd-code-string' as string]: '#15803d',
        ['--osd-code-comment' as string]: '#78716c',
        ['--osd-code-function' as string]: '#1d4ed8',
        ['--osd-code-line-number' as string]: '#a8a29e',
        ['--osd-code-highlight' as string]: '#fef3c7',
      }}
      highlightLines={[3]}
    >
      {`
      # a light block is a different background plus --osd-code-* overrides
      npx @open-slide/cli init my-slide
      cd my-slide && pnpm dev
      `}
    </CodeBlock>
    <p style={{ fontSize: 30, lineHeight: 1.5, color: '#57534e', margin: '36px 0 0' }}>
      No theme prop, no stylesheet: every color is a CSS variable with a default.
    </p>
    <Footer />
  </div>
);

const Reveal: Page = () => (
  <div style={fill}>
    <Steps>
      <Heading>Before, then after</Heading>
      <Step>
        <CodeBlock lang="typescript" style={{ marginBottom: 32 }}>
          {`
          const total = items.reduce((sum, item) => sum + item.price, 0);
          `}
        </CodeBlock>
      </Step>
      <Step>
        <CodeBlock lang="typescript" highlightLines={[1]}>
          {`
          const total = sumBy(items, (item) => item.price);
          `}
        </CodeBlock>
      </Step>
    </Steps>
    <Footer />
  </div>
);

export const meta: SlideMeta = {
  title: 'Code Blocks',
  createdAt: '2026-09-12T09:01:10.384Z',
};

export const notes: (string | undefined)[] = [
  'One primitive for code. Say what it replaces: hand-rolled pre tags with per-token colors.',
  'Point at the focus bar on lines 4 and 5 before reading the code aloud.',
  undefined,
  'Show that the light variant is only variables; nothing else changed.',
  'Reveal the refactor in two beats.',
];

export default [Cover, Python, Tsx, LightVariant, Reveal] satisfies Page[];
