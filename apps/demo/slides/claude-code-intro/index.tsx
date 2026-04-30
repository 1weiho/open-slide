import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';

export const design: DesignSystem = {
  palette: {
    bg: '#f5efe4',
    text: '#1a1714',
    accent: '#b34a2a',
  },
  fonts: {
    display: '"Iowan Old Style", "Times New Roman", Georgia, serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },
  typeScale: {
    hero: 220,
    body: 28,
  },
  radius: {
    md: 14,
  },
};

/* ─────────────── Design tokens ─────────────── */

const palette = {
  bg: '#f5efe4', // warm cream paper
  surface: '#fbf7ee', // lighter inset
  text: '#1a1714', // ink
  muted: '#7a7167', // warm gray
  faint: '#a89f93',
  rule: '#1a1714',
  line: '#dcd3c2',
  accent: '#b34a2a', // rust / vermilion ink
  accentSoft: 'rgba(179, 74, 42, 0.08)',
  ink: '#2a4d6e', // muted ink-blue secondary
};

const fonts = {
  serif: '"Iowan Old Style", "Times New Roman", Georgia, serif',
  sans: '"Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  mono: 'ui-monospace, "SF Mono", Menlo, monospace',
};

const PAD_X = 140;
const PAD_Y = 120;
const PAD_Y_BOTTOM = 200;

/* ─────────────── Subtle paper grain ─────────────── */

const Grain = () => (
  <svg
    width="100%"
    height="100%"
    style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      opacity: 0.35,
      mixBlendMode: 'multiply',
    }}
    aria-hidden="true"
    role="presentation"
  >
    <title>paper grain</title>
    <defs>
      <filter id="paperGrain">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.42
                  0 0 0 0 0.36
                  0 0 0 0 0.28
                  0 0 0 0.10 0"
        />
      </filter>
    </defs>
    <rect width="100%" height="100%" filter="url(#paperGrain)" />
  </svg>
);

const fill = {
  width: '100%',
  height: '100%',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  position: 'relative',
  overflow: 'hidden',
  fontFamily: 'var(--osd-font-body)',
} as const;

/* ─────────────── Shared atoms ─────────────── */

const Eyebrow = ({
  children,
  color = 'var(--osd-accent)',
}: {
  children: React.ReactNode;
  color?: string;
}) => (
  <div
    style={{
      fontFamily: 'var(--osd-font-body)',
      fontSize: 22,
      fontWeight: 500,
      letterSpacing: '0.32em',
      textTransform: 'uppercase',
      color,
    }}
  >
    {children}
  </div>
);

const Footer = ({ section }: { section: string }) => (
  <div
    style={{
      position: 'absolute',
      left: PAD_X,
      right: PAD_X,
      bottom: 72,
      display: 'flex',
      alignItems: 'baseline',
      fontFamily: 'var(--osd-font-body)',
      fontSize: 18,
      letterSpacing: '0.28em',
      textTransform: 'uppercase',
      color: palette.muted,
      borderTop: `1px dashed ${palette.rule}`,
      paddingTop: 18,
    }}
  >
    <span>Claude Code · {section}</span>
  </div>
);

const Mono = ({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) => (
  <span
    style={{
      fontFamily: fonts.mono,
      fontSize: '0.82em',
      color: accent ? 'var(--osd-accent)' : 'var(--osd-text)',
      background: accent ? palette.accentSoft : 'transparent',
      padding: accent ? '2px 10px' : 0,
      borderRadius: accent ? 4 : 0,
      letterSpacing: '-0.01em',
    }}
  >
    {children}
  </span>
);

/* ─────────────── 1. Cover ─────────────── */

const Cover: Page = () => (
  <div
    style={{
      ...fill,
      padding: `${PAD_Y}px ${PAD_X}px`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}
  >
    <Grain />
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Eyebrow>A field guide · 2026</Eyebrow>
      <h1
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 'var(--osd-size-hero)',
          fontWeight: 400,
          lineHeight: 0.98,
          letterSpacing: '-0.03em',
          margin: '36px 0 0',
          color: 'var(--osd-text)',
        }}
      >
        Claude
        <br />
        <em style={{ fontStyle: 'italic', color: 'var(--osd-accent)' }}>Code.</em>
      </h1>
      <div
        style={{
          height: 1,
          width: 560,
          background: palette.rule,
          margin: '64px 0 36px',
        }}
      />
      <p
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 44,
          lineHeight: 1.35,
          color: 'var(--osd-text)',
          maxWidth: 1280,
          margin: 0,
          fontWeight: 400,
          fontStyle: 'italic',
        }}
      >
        An agentic coding assistant that lives where you already work — the terminal, the editor,
        the browser.
      </p>
      <div
        style={{
          marginTop: 56,
          fontFamily: fonts.mono,
          fontSize: 26,
          color: palette.muted,
          letterSpacing: '-0.01em',
        }}
      >
        $ claude
      </div>
    </div>
    <Footer section="No. 01 · Cover" />
  </div>
);

/* ─────────────── 2. What it is ─────────────── */

const WhatIs: Page = () => (
  <div
    style={{
      ...fill,
      padding: `${PAD_Y}px ${PAD_X}px`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}
  >
    <Grain />
    <div style={{ position: 'relative', zIndex: 1, maxWidth: 1500 }}>
      <Eyebrow>What it is</Eyebrow>
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 100,
          fontWeight: 400,
          lineHeight: 1.06,
          letterSpacing: '-0.02em',
          margin: '36px 0 48px',
        }}
      >
        Not autocomplete.
        <br />
        An <em style={{ color: 'var(--osd-accent)' }}>agent</em> that does the work.
      </h2>
      <div style={{ height: 1, background: palette.rule, width: 320, margin: '0 0 48px' }} />
      <p
        style={{
          fontSize: 36,
          lineHeight: 1.55,
          color: 'var(--osd-text)',
          maxWidth: 1300,
          fontWeight: 400,
          margin: 0,
        }}
      >
        Claude Code reads your codebase, plans, edits files, runs commands, checks the result, and
        iterates — keeping you in the loop on the decisions that matter.
      </p>
      <p
        style={{
          marginTop: 36,
          fontFamily: 'var(--osd-font-display)',
          fontStyle: 'italic',
          fontSize: 30,
          color: palette.muted,
          maxWidth: 1300,
          lineHeight: 1.5,
        }}
      >
        Built by Anthropic. Powered by Claude. Designed for the way real engineering work happens —
        across files, tools, and turns.
      </p>
    </div>
    <Footer section="No. 02 · Definition" />
  </div>
);

/* ─────────────── 3. Capabilities ─────────────── */

const capabilities = [
  {
    n: '01',
    title: 'Edit files in place',
    body: 'Targeted diffs across hundreds of files — not search-and-replace, structural edits.',
  },
  {
    n: '02',
    title: 'Run your tools',
    body: 'Shell, tests, formatters, linters, build steps. The agent watches the output and reacts.',
  },
  {
    n: '03',
    title: 'Plan before it touches',
    body: 'Outlines an approach, asks before destructive moves, and works in checkable steps.',
  },
  {
    n: '04',
    title: 'Extend with the SDK',
    body: 'Claude Agent SDK lets you embed the same loop in your own scripts and services.',
  },
];

const Capabilities: Page = () => (
  <div
    style={{
      ...fill,
      padding: `${PAD_Y}px ${PAD_X}px`,
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <Grain />
    <div
      style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}
    >
      <Eyebrow>What it does</Eyebrow>
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 88,
          fontWeight: 400,
          lineHeight: 1.08,
          letterSpacing: '-0.02em',
          margin: '32px 0 64px',
        }}
      >
        Four motions, repeated.
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '56px 96px', flex: 1 }}>
        {capabilities.map((c) => (
          <div key={c.n} style={{ display: 'flex', gap: 32, alignItems: 'baseline' }}>
            <div
              style={{
                fontFamily: 'var(--osd-font-display)',
                fontSize: 56,
                fontStyle: 'italic',
                color: 'var(--osd-accent)',
                lineHeight: 1,
                width: 90,
                flexShrink: 0,
              }}
            >
              {c.n}
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--osd-font-display)',
                  fontSize: 44,
                  fontWeight: 400,
                  lineHeight: 1.2,
                  letterSpacing: '-0.01em',
                  color: 'var(--osd-text)',
                  marginBottom: 14,
                }}
              >
                {c.title}
              </div>
              <div
                style={{
                  fontSize: 26,
                  lineHeight: 1.55,
                  color: palette.muted,
                  fontWeight: 400,
                }}
              >
                {c.body}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    <Footer section="No. 03 · Capabilities" />
  </div>
);

/* ─────────────── 4. The loop ─────────────── */

const loopSteps = [
  { label: 'Read', body: 'Files, errors, output.' },
  { label: 'Plan', body: 'Pick the next tool.' },
  { label: 'Act', body: 'Edit, run, fetch.' },
  { label: 'Check', body: 'Did it work? Iterate.' },
];

const TheLoop: Page = () => (
  <div
    style={{
      ...fill,
      padding: `${PAD_Y}px ${PAD_X}px`,
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <Grain />
    <div
      style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}
    >
      <Eyebrow>How it works</Eyebrow>
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 88,
          fontWeight: 400,
          lineHeight: 1.08,
          letterSpacing: '-0.02em',
          margin: '32px 0 16px',
        }}
      >
        A loop, not a one-shot.
      </h2>
      <p
        style={{
          fontSize: 'var(--osd-size-body)',
          lineHeight: 1.5,
          color: palette.muted,
          maxWidth: 1400,
          margin: '0 0 72px',
        }}
      >
        Each turn the model picks a tool, runs it, reads the result, and decides what to do next. It
        stops when the task is done — or when you say so.
      </p>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
          position: 'relative',
        }}
      >
        {loopSteps.map((step, i) => (
          <div key={step.label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div
              style={{
                background: palette.surface,
                border: `1px solid ${palette.line}`,
                borderRadius: 'var(--osd-radius-md)',
                padding: '40px 32px',
                width: '100%',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -12,
                  left: 24,
                  background: 'var(--osd-bg)',
                  padding: '0 12px',
                  fontFamily: fonts.mono,
                  fontSize: 18,
                  letterSpacing: '0.2em',
                  color: 'var(--osd-accent)',
                  textTransform: 'uppercase',
                }}
              >
                step {i + 1}
              </div>
              <div
                style={{
                  fontFamily: 'var(--osd-font-display)',
                  fontSize: 56,
                  fontWeight: 400,
                  letterSpacing: '-0.01em',
                  color: 'var(--osd-text)',
                  marginBottom: 12,
                }}
              >
                {step.label}
              </div>
              <div
                style={{
                  fontFamily: 'var(--osd-font-display)',
                  fontStyle: 'italic',
                  fontSize: 24,
                  color: palette.muted,
                  lineHeight: 1.45,
                }}
              >
                {step.body}
              </div>
            </div>
            {i < loopSteps.length - 1 && (
              <div
                style={{
                  fontFamily: 'var(--osd-font-display)',
                  fontSize: 56,
                  color: 'var(--osd-accent)',
                  margin: '0 8px',
                  flexShrink: 0,
                  lineHeight: 1,
                }}
              >
                →
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 48,
          paddingTop: 28,
          borderTop: `1px solid ${palette.line}`,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontStyle: 'italic',
            fontSize: 'var(--osd-size-body)',
            color: palette.ink,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <span
            style={{
              fontFamily: fonts.mono,
              fontStyle: 'normal',
              fontSize: 22,
              color: 'var(--osd-accent)',
            }}
          >
            ↺
          </span>
          repeat until done.
        </div>
      </div>
    </div>
    <Footer section="No. 04 · The Loop" />
  </div>
);

/* ─────────────── 5. Permissions & hooks ─────────────── */

const Permissions: Page = () => (
  <div
    style={{
      ...fill,
      padding: `${PAD_Y}px ${PAD_X}px ${PAD_Y_BOTTOM}px`,
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <Grain />
    <div
      style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}
    >
      <Eyebrow>You stay in control</Eyebrow>
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 88,
          fontWeight: 400,
          lineHeight: 1.08,
          letterSpacing: '-0.02em',
          margin: '32px 0 56px',
        }}
      >
        Permissions, then hooks.
      </h2>

      <div style={{ display: 'flex', gap: 80, flex: 1 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 28 }}>
          <Eyebrow color={palette.ink}>Permissions</Eyebrow>
          <div
            style={{
              fontFamily: 'var(--osd-font-display)',
              fontSize: 38,
              lineHeight: 1.35,
              color: 'var(--osd-text)',
            }}
          >
            Every tool call is gated. Allow once, allow always, or deny.
          </div>
          <div
            style={{
              background: palette.surface,
              border: `1px solid ${palette.line}`,
              borderRadius: 12,
              padding: '24px 28px',
              fontFamily: fonts.mono,
              fontSize: 22,
              lineHeight: 1.7,
              color: 'var(--osd-text)',
              marginTop: 'auto',
            }}
          >
            <div style={{ color: palette.muted }}># settings.json</div>
            <div>
              <span style={{ color: palette.ink }}>"permissions"</span>: {'{'}
            </div>
            <div style={{ paddingLeft: 24 }}>
              <span style={{ color: 'var(--osd-accent)' }}>"allow"</span>: ["Bash(npm test:*)",
              "Edit"]
            </div>
            <div>{'}'}</div>
          </div>
        </div>

        <div style={{ width: 1, background: palette.line }} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 28 }}>
          <Eyebrow color={palette.ink}>Hooks</Eyebrow>
          <div
            style={{
              fontFamily: 'var(--osd-font-display)',
              fontSize: 38,
              lineHeight: 1.35,
              color: 'var(--osd-text)',
            }}
          >
            Run your own scripts before or after any tool — formatters, audits, notifications,
            anything.
          </div>
          <div
            style={{
              background: palette.surface,
              border: `1px solid ${palette.line}`,
              borderRadius: 12,
              padding: '24px 28px',
              fontFamily: fonts.mono,
              fontSize: 22,
              lineHeight: 1.7,
              color: 'var(--osd-text)',
              marginTop: 'auto',
            }}
          >
            <div style={{ color: palette.muted }}># after every Edit</div>
            <div>
              <span style={{ color: palette.ink }}>PostToolUse</span>:
            </div>
            <div style={{ paddingLeft: 24 }}>
              <span style={{ color: 'var(--osd-accent)' }}>matcher</span>: "Edit"
            </div>
            <div style={{ paddingLeft: 24 }}>
              <span style={{ color: 'var(--osd-accent)' }}>command</span>: "biome format"
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer section="No. 05 · Control" />
  </div>
);

/* ─────────────── 6. Where it runs ─────────────── */

const surfaces = [
  { tag: 'CLI', label: 'Terminal', body: 'The original. macOS, Linux, Windows / WSL.' },
  { tag: 'IDE', label: 'VS Code & JetBrains', body: 'Native panel. Diff view. Inline approvals.' },
  {
    tag: 'WEB',
    label: 'claude.ai/code',
    body: 'Spin up sandboxed, parallel sessions in the browser.',
  },
  { tag: 'APP', label: 'Desktop', body: 'macOS app for ambient work outside the editor.' },
];

const WhereItRuns: Page = () => (
  <div
    style={{
      ...fill,
      padding: `${PAD_Y}px ${PAD_X}px ${PAD_Y_BOTTOM}px`,
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <Grain />
    <div
      style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}
    >
      <Eyebrow>Where it runs</Eyebrow>
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 88,
          fontWeight: 400,
          lineHeight: 1.08,
          letterSpacing: '-0.02em',
          margin: '32px 0 16px',
        }}
      >
        One agent.
        <br />
        <em style={{ color: 'var(--osd-accent)' }}>Many surfaces.</em>
      </h2>
      <p
        style={{
          fontSize: 'var(--osd-size-body)',
          lineHeight: 1.5,
          color: palette.muted,
          maxWidth: 1300,
          margin: '0 0 64px',
        }}
      >
        The same Claude Code, accessed however suits the task at hand.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36, flex: 1 }}>
        {surfaces.map((s) => (
          <div
            key={s.tag}
            style={{
              background: palette.surface,
              border: `1px solid ${palette.line}`,
              borderRadius: 'var(--osd-radius-md)',
              padding: '36px 40px',
              display: 'flex',
              alignItems: 'center',
              gap: 36,
            }}
          >
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: 22,
                letterSpacing: '0.18em',
                color: 'var(--osd-accent)',
                width: 64,
                flexShrink: 0,
                borderRight: `1px solid ${palette.line}`,
                paddingRight: 24,
                textAlign: 'center',
              }}
            >
              {s.tag}
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--osd-font-display)',
                  fontSize: 40,
                  fontWeight: 400,
                  letterSpacing: '-0.01em',
                  color: 'var(--osd-text)',
                  marginBottom: 8,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: 22,
                  lineHeight: 1.5,
                  color: palette.muted,
                  fontWeight: 400,
                }}
              >
                {s.body}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    <Footer section="No. 06 · Surfaces" />
  </div>
);

/* ─────────────── 7. Why it's different ─────────────── */

const Different: Page = () => (
  <div
    style={{
      ...fill,
      padding: `${PAD_Y}px ${PAD_X}px`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}
  >
    <Grain />
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Eyebrow>Why it's different</Eyebrow>
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 132,
          fontWeight: 400,
          lineHeight: 1.02,
          letterSpacing: '-0.025em',
          margin: '36px 0 56px',
          maxWidth: 1600,
        }}
      >
        It treats your codebase as
        <br />
        <em style={{ color: 'var(--osd-accent)' }}>the work</em>, not the prompt.
      </h2>
      <div style={{ height: 1, background: palette.rule, width: 360, margin: '0 0 48px' }} />

      <div style={{ display: 'flex', gap: 80, maxWidth: 1640 }}>
        {[
          {
            tag: 'Steerable',
            body: 'Plain instructions in CLAUDE.md. Custom skills. Sub-agents you compose.',
          },
          {
            tag: 'Honest',
            body: 'Stops to ask. Surfaces tradeoffs. Refuses destructive moves without consent.',
          },
          {
            tag: 'Composable',
            body: 'Hooks, MCP servers, the Agent SDK — everything is a building block.',
          },
        ].map((it) => (
          <div key={it.tag} style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: 'var(--osd-font-display)',
                fontSize: 38,
                fontStyle: 'italic',
                color: 'var(--osd-accent)',
                marginBottom: 20,
              }}
            >
              {it.tag}.
            </div>
            <div
              style={{
                fontSize: 26,
                lineHeight: 1.55,
                color: 'var(--osd-text)',
                fontWeight: 400,
              }}
            >
              {it.body}
            </div>
          </div>
        ))}
      </div>
    </div>
    <Footer section="No. 07 · Difference" />
  </div>
);

/* ─────────────── 8. A morning with Claude Code ─────────────── */

const transcript = [
  { who: 'you', text: 'fix the flaky integration test in cart.spec.ts' },
  { who: 'claude', text: 'Reading cart.spec.ts and the surrounding fixtures…' },
  { who: 'tool', text: '$ pnpm test cart.spec.ts' },
  {
    who: 'claude',
    text: "The race is in setup — the cart loads before the user. I'll await the session.",
  },
  { who: 'tool', text: 'Edit cart.spec.ts · +6 −2' },
  { who: 'tool', text: '$ pnpm test cart.spec.ts  ✓ 12 passed' },
  { who: 'claude', text: 'Green. Want me to open a PR or keep iterating?' },
];

const Transcript: Page = () => (
  <div
    style={{
      ...fill,
      padding: `${PAD_Y}px ${PAD_X}px ${PAD_Y_BOTTOM}px`,
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <Grain />
    <div
      style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}
    >
      <Eyebrow>In practice</Eyebrow>
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 84,
          fontWeight: 400,
          lineHeight: 1.08,
          letterSpacing: '-0.02em',
          margin: '32px 0 48px',
        }}
      >
        A short transcript.
      </h2>

      <div
        style={{
          flex: 1,
          background: palette.surface,
          border: `1px solid ${palette.line}`,
          borderRadius: 'var(--osd-radius-md)',
          padding: '40px 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
          fontFamily: fonts.mono,
          fontSize: 24,
          lineHeight: 1.5,
        }}
      >
        {transcript.map((line, i) => {
          const styles =
            line.who === 'you'
              ? { color: 'var(--osd-text)', fontWeight: 500 }
              : line.who === 'claude'
                ? {
                    color: palette.ink,
                    fontFamily: 'var(--osd-font-display)',
                    fontStyle: 'italic' as const,
                    fontSize: 26,
                  }
                : { color: palette.muted };
          const tag = line.who === 'you' ? '›' : line.who === 'claude' ? '◆' : '·';
          const tagColor =
            line.who === 'you'
              ? 'var(--osd-accent)'
              : line.who === 'claude'
                ? 'var(--osd-accent)'
                : palette.faint;

          return (
            <div
              key={`${line.who}-${i}`}
              style={{ display: 'flex', gap: 18, alignItems: 'baseline' }}
            >
              <span
                style={{
                  color: tagColor,
                  fontFamily: 'var(--osd-font-display)',
                  fontSize: 26,
                  width: 24,
                  flexShrink: 0,
                }}
              >
                {tag}
              </span>
              <span style={styles}>{line.text}</span>
            </div>
          );
        })}
      </div>
    </div>
    <Footer section="No. 08 · Transcript" />
  </div>
);

/* ─────────────── 9. Get started ─────────────── */

const GetStarted: Page = () => (
  <div
    style={{
      ...fill,
      padding: `${PAD_Y}px ${PAD_X}px`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}
  >
    <Grain />
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Eyebrow>Get started</Eyebrow>
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 168,
          fontWeight: 400,
          lineHeight: 1,
          letterSpacing: '-0.03em',
          margin: '36px 0 0',
        }}
      >
        Two lines.
      </h2>
      <div style={{ height: 1, background: palette.rule, width: 480, margin: '64px 0 48px' }} />

      <div
        style={{
          background: 'var(--osd-text)',
          color: 'var(--osd-bg)',
          borderRadius: 'var(--osd-radius-md)',
          padding: '40px 56px',
          fontFamily: fonts.mono,
          fontSize: 36,
          lineHeight: 1.6,
          maxWidth: 1400,
          letterSpacing: '-0.01em',
        }}
      >
        <div>
          <span style={{ color: palette.faint }}>$ </span>npm install -g{' '}
          <span style={{ color: '#e0a37c' }}>@anthropic-ai/claude-code</span>
        </div>
        <div>
          <span style={{ color: palette.faint }}>$ </span>claude
        </div>
      </div>

      <div
        style={{
          marginTop: 56,
          display: 'flex',
          gap: 64,
          alignItems: 'baseline',
          fontFamily: 'var(--osd-font-body)',
          fontSize: 24,
          color: palette.muted,
          letterSpacing: '0.04em',
        }}
      >
        <span>
          docs <Mono>claude.com/code</Mono>
        </span>
        <span>·</span>
        <span>
          sdk <Mono>@anthropic-ai/claude-agent-sdk</Mono>
        </span>
      </div>

      <div
        style={{
          marginTop: 80,
          fontFamily: 'var(--osd-font-display)',
          fontStyle: 'italic',
          fontSize: 32,
          color: palette.faint,
        }}
      >
        — go build something.
      </div>
    </div>
    <Footer section="No. 09 · Start" />
  </div>
);

/* ─────────────── Export ─────────────── */

export const meta: SlideMeta = { title: 'Claude Code · A Field Guide' };
export default [
  Cover,
  WhatIs,
  Capabilities,
  TheLoop,
  Permissions,
  WhereItRuns,
  Different,
  Transcript,
  GetStarted,
] satisfies Page[];
