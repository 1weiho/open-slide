import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';

export const design: DesignSystem = {
  palette: { bg: '#05070a', text: '#e6edf3', accent: '#39ff88' },
  fonts: {
    display: "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace",
    body: "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace",
  },
  typeScale: { hero: 156, body: 24 },
  radius: { md: 0 },
};

/* ─────────────── Design tokens (neon-terminal) ─────────────── */

/**
 * Tokens that aren't part of the panel-tweakable `design` surface above.
 * The bg / text / accent / fonts / hero / body / radius come in via
 * `var(--osd-*)` so the Design panel can update them live; everything else
 * (extended palette, spacing, page counts) lives here as a flat token set.
 */
const tokens = {
  color: {
    surface: '#0d1117',
    line: '#1a2230',
    muted: '#7a8794',
    faint: '#4a5560',
    accent2: '#5cd0ff',
    warn: '#ff7b72',
  },
  space: {
    padX: 100,
    padY: 80,
  },
  meta: {
    totalPages: 8,
  },
} as const;

const fill = {
  width: '100%',
  height: '100%',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: 'var(--osd-font-body)',
  position: 'relative',
  overflow: 'hidden',
  border: `1px solid ${tokens.color.line}`,
  boxSizing: 'border-box',
} as const;

/* ─────────────── Animations ─────────────── */

const keyframes = `
@keyframes hCursor { to { visibility: hidden; } }
@keyframes hGlow {
  0%, 100% { text-shadow: 0 0 12px rgba(57, 255, 136, 0.45); }
  50%      { text-shadow: 0 0 22px rgba(57, 255, 136, 0.85); }
}
@keyframes hTypeIn {
  from { clip-path: inset(0 100% 0 0); }
  to   { clip-path: inset(0 0 0 0); }
}
@keyframes hFadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes hFade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes hLineGrow {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
@keyframes hPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(57, 255, 136, 0.35); }
  50%      { box-shadow: 0 0 0 18px rgba(57, 255, 136, 0); }
}
.h-typein { animation: hTypeIn 900ms steps(40, end) both; }
.h-fadeup { animation: hFadeUp 800ms cubic-bezier(0.16, 1, 0.3, 1) both; }
.h-fade   { animation: hFade 1000ms ease-out both; }
.h-line   { animation: hLineGrow 800ms cubic-bezier(0.16, 1, 0.3, 1) both; transform-origin: left center; }
.h-glow   { animation: hGlow 2.6s ease-in-out infinite; }
.h-cursor { animation: hCursor 1s steps(2, start) infinite; }
.h-pulse  { animation: hPulse 2.2s ease-out infinite; }
`;

const Style = () => <style>{keyframes}</style>;

/* ─────────────── Reusable bits ─────────────── */

const Eyebrow = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <div
    className="h-fadeup"
    style={{
      animationDelay: `${delay}ms`,
      fontSize: 24,
      fontWeight: 500,
      color: 'var(--osd-accent)',
      textShadow: '0 0 12px rgba(57, 255, 136, 0.5)',
      letterSpacing: '0.04em',
    }}
  >
    [{children}]
  </div>
);

const Cursor = ({ size = '0.55em', height = '0.92em' }: { size?: string; height?: string }) => (
  <span
    aria-hidden
    className="h-cursor"
    style={{
      display: 'inline-block',
      width: size,
      height,
      background: 'var(--osd-accent)',
      boxShadow: '0 0 16px rgba(57, 255, 136, 0.6)',
      marginLeft: 14,
      verticalAlign: '-0.05em',
    }}
  />
);

const Footer = ({ pageNum, section }: { pageNum: number; section?: string }) => (
  <div
    style={{
      position: 'absolute',
      left: tokens.space.padX,
      right: tokens.space.padX,
      bottom: 36,
      display: 'flex',
      justifyContent: 'space-between',
      fontFamily: 'var(--osd-font-body)',
      fontSize: 20,
      color: tokens.color.faint,
      borderTop: `1px solid ${tokens.color.line}`,
      paddingTop: 14,
    }}
  >
    <span>
      <span style={{ color: 'var(--osd-accent)' }}>●</span> {section ?? 'main'} ·{' '}
      <span style={{ color: tokens.color.accent2 }}>~/deck/harness-engineering</span>
    </span>
    <span>
      {String(pageNum).padStart(2, '0')}/{String(tokens.meta.totalPages).padStart(2, '0')}
    </span>
  </div>
);

const Scanlines = () => (
  <div
    aria-hidden
    style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      backgroundImage:
        'repeating-linear-gradient(0deg, rgba(255,255,255,0.020) 0px, rgba(255,255,255,0.020) 1px, transparent 1px, transparent 4px)',
      zIndex: 0,
    }}
  />
);

/* ─────────────── 1. Cover ─────────────── */

const Cover: Page = () => (
  <div
    style={{
      ...fill,
      padding: `${tokens.space.padY}px ${tokens.space.padX}px`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 44,
    }}
  >
    <Style />
    <Scanlines />
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Eyebrow>chapter 01 · spring 2026</Eyebrow>
    </div>
    <h1
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 'var(--osd-size-hero)',
        fontWeight: 700,
        lineHeight: 1.02,
        letterSpacing: '-0.025em',
        margin: 0,
        color: 'var(--osd-text)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <span
        className="h-typein"
        style={{
          display: 'block',
          animationDelay: '120ms',
        }}
      >
        <span style={{ color: 'var(--osd-accent)', textShadow: '0 0 22px rgba(57,255,136,0.6)' }}>
          ${' '}
        </span>
        harness
      </span>
      <span
        className="h-typein"
        style={{
          display: 'block',
          animationDelay: '900ms',
          color: 'var(--osd-accent)',
          textShadow: '0 0 22px rgba(57,255,136,0.4)',
        }}
      >
        engineering
        <Cursor size="0.5em" height="0.85em" />
      </span>
    </h1>
    <p
      className="h-fadeup"
      style={{
        animationDelay: '1700ms',
        fontFamily: 'var(--osd-font-body)',
        fontSize: 36,
        lineHeight: 1.5,
        color: tokens.color.muted,
        maxWidth: 1500,
        margin: 0,
        position: 'relative',
        zIndex: 1,
      }}
    >
      {'// the scaffolding around the model is the new bottleneck.'}
    </p>
    <div
      className="h-fadeup"
      style={{
        animationDelay: '2000ms',
        fontFamily: 'var(--osd-font-body)',
        fontSize: 22,
        color: tokens.color.faint,
        position: 'relative',
        zIndex: 1,
      }}
    >
      a brief tour · 8 pages · openai · anthropic · martinfowler.com · addyosmani · humanlayer
    </div>
    <Footer pageNum={1} section="cover" />
  </div>
);

/* ─────────────── 2. The shift ─────────────── */

type Tone = 'dim' | 'bright';

const ShiftColumn = ({
  year,
  verb,
  bullets,
  delay,
  tone,
}: {
  year: string;
  verb: string;
  bullets: string[];
  delay: number;
  tone: Tone;
}) => (
  <div
    className="h-fadeup"
    style={{
      animationDelay: `${delay}ms`,
      flex: 1,
      background: tokens.color.surface,
      border: `1px solid ${tone === 'bright' ? 'var(--osd-accent)' : tokens.color.line}`,
      boxShadow: tone === 'bright' ? '0 0 32px rgba(57,255,136,0.15)' : 'none',
      padding: '32px 36px',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
    }}
  >
    <div
      style={{
        fontSize: 22,
        color: tone === 'bright' ? 'var(--osd-accent)' : tokens.color.muted,
        letterSpacing: '0.18em',
      }}
    >
      [{year}]
    </div>
    <div
      style={{
        fontSize: 48,
        fontWeight: 700,
        color: 'var(--osd-text)',
        lineHeight: 1.15,
        letterSpacing: '-0.01em',
      }}
    >
      {verb}
    </div>
    <div style={{ height: 1, background: tokens.color.line }} />
    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {bullets.map((b) => (
        <li
          key={b}
          style={{
            fontSize: 26,
            color: tokens.color.muted,
            lineHeight: 1.7,
          }}
        >
          <span
            style={{
              color: tone === 'bright' ? 'var(--osd-accent)' : tokens.color.faint,
              marginRight: 14,
            }}
          >
            ›
          </span>
          {b}
        </li>
      ))}
    </ul>
  </div>
);

const Shift: Page = () => (
  <div
    style={{
      ...fill,
      padding: `${tokens.space.padY}px ${tokens.space.padX}px`,
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <Style />
    <Eyebrow>01 · the shift</Eyebrow>
    <h2
      className="h-fadeup"
      style={{
        animationDelay: '180ms',
        fontFamily: 'var(--osd-font-display)',
        fontSize: 76,
        fontWeight: 700,
        lineHeight: 1.15,
        letterSpacing: '-0.015em',
        margin: '28px 0 50px',
        maxWidth: 1700,
      }}
    >
      the model is no longer <span style={{ color: 'var(--osd-accent)' }}>the bottleneck.</span>
    </h2>
    <div style={{ display: 'flex', gap: 50, flex: 1 }}>
      <ShiftColumn
        delay={450}
        year="2023"
        verb="prompt the model"
        bullets={['better instructions', 'few-shot examples', 'role-play, formatting tricks']}
        tone="dim"
      />
      <ShiftColumn
        delay={650}
        year="2026"
        verb="engineer the harness"
        bullets={['tools, loops, sandboxes', 'context & memory state', 'evals, hooks, guardrails']}
        tone="bright"
      />
    </div>
    <div
      className="h-fade"
      style={{
        animationDelay: '1300ms',
        marginTop: 40,
        padding: '20px 28px',
        borderLeft: `2px solid var(--osd-accent)`,
        background: 'rgba(57,255,136,0.05)',
      }}
    >
      <div style={{ fontSize: 26, lineHeight: 1.5, color: 'var(--osd-text)', fontStyle: 'italic' }}>
        "a decent model with a great harness beats a great model with a bad harness."
      </div>
      <div style={{ fontSize: 20, color: tokens.color.muted, marginTop: 8 }}>
        — addy osmani · 19 apr 2026
      </div>
    </div>
    <Footer pageNum={2} section="shift" />
  </div>
);

/* ─────────────── 3. Definition ─────────────── */

const Definition: Page = () => (
  <div
    style={{
      ...fill,
      padding: `${tokens.space.padY}px ${tokens.space.padX}px`,
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <Style />
    <Eyebrow>02 · definition</Eyebrow>
    <h2
      className="h-fadeup"
      style={{
        animationDelay: '180ms',
        fontFamily: 'var(--osd-font-display)',
        fontSize: 64,
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.01em',
        margin: '28px 0 16px',
        maxWidth: 1700,
      }}
    >
      an <span style={{ color: 'var(--osd-accent)' }}>agent harness</span> is{' '}
      <span style={{ color: tokens.color.muted, fontWeight: 400 }}>
        "everything in an AI agent except the model itself."
      </span>
    </h2>
    <div
      className="h-fadeup"
      style={{
        animationDelay: '380ms',
        fontSize: 22,
        color: tokens.color.faint,
        marginBottom: 40,
      }}
    >
      — birgitta böckeler · martinfowler.com · 2 apr 2026
    </div>

    {/* Nested-box diagram */}
    <div
      className="h-fade"
      style={{
        animationDelay: '700ms',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 1100,
          maxWidth: '100%',
          border: `1.5px solid var(--osd-accent)`,
          padding: '28px 36px 36px',
          background: 'rgba(57,255,136,0.03)',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -16,
            left: 32,
            background: 'var(--osd-bg)',
            padding: '0 14px',
            color: 'var(--osd-accent)',
            fontSize: 22,
            letterSpacing: '0.18em',
            textShadow: '0 0 12px rgba(57,255,136,0.5)',
          }}
        >
          [ HARNESS ]
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: tokens.color.muted,
            fontSize: 22,
            marginBottom: 28,
          }}
        >
          <span>loop</span>
          <span>·</span>
          <span>tools</span>
          <span>·</span>
          <span>context</span>
          <span>·</span>
          <span>memory</span>
        </div>
        <div
          className="h-pulse"
          style={{
            border: `1.5px solid ${tokens.color.accent2}`,
            padding: '34px 24px',
            textAlign: 'center',
            background: tokens.color.surface,
            color: tokens.color.accent2,
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: '0.18em',
          }}
        >
          [ MODEL ]
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: tokens.color.muted,
            fontSize: 22,
            marginTop: 28,
          }}
        >
          <span>guardrails</span>
          <span>·</span>
          <span>evals</span>
          <span>·</span>
          <span>permissions</span>
          <span>·</span>
          <span>telemetry</span>
        </div>
      </div>
    </div>
    <Footer pageNum={3} section="definition" />
  </div>
);

/* ─────────────── 4. Anatomy ─────────────── */

const anatomyTiles: Array<{ n: string; title: string; body: string }> = [
  {
    n: '01',
    title: 'control loop',
    body: 'call → parse → tool → result → repeat. the cadence the agent thinks in.',
  },
  {
    n: '02',
    title: 'tools',
    body: 'file edits, shell, web, MCP servers. permission-gated, progressively disclosed.',
  },
  {
    n: '03',
    title: 'context',
    body: 'system prompt, history, retrieval, compaction. what reaches the window each turn.',
  },
  {
    n: '04',
    title: 'memory & state',
    body: 'todo lists, AGENTS.md, scratchpads, git. persistence across the loop.',
  },
  {
    n: '05',
    title: 'guardrails',
    body: 'sandboxes, allowlists, hooks, approvals. the things that hold the line.',
  },
  {
    n: '06',
    title: 'evals',
    body: 'reproducible tasks. surface regressions when you change the harness itself.',
  },
];

const Anatomy: Page = () => (
  <div
    style={{
      ...fill,
      padding: `${tokens.space.padY}px ${tokens.space.padX}px`,
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <Style />
    <Eyebrow>03 · anatomy</Eyebrow>
    <h2
      className="h-fadeup"
      style={{
        animationDelay: '180ms',
        fontFamily: 'var(--osd-font-display)',
        fontSize: 72,
        fontWeight: 700,
        lineHeight: 1.15,
        letterSpacing: '-0.01em',
        margin: '24px 0 50px',
      }}
    >
      six things wrap the model.
    </h2>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(2, 1fr)',
        gap: 28,
        flex: 1,
      }}
    >
      {anatomyTiles.map((t, i) => (
        <div
          key={t.n}
          className="h-fadeup"
          style={{
            animationDelay: `${380 + i * 90}ms`,
            background: tokens.color.surface,
            border: `1px solid ${tokens.color.line}`,
            padding: '28px 30px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            className="h-line"
            style={{
              animationDelay: `${700 + i * 90}ms`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: 'var(--osd-accent)',
            }}
          />
          <div
            style={{
              fontSize: 22,
              color: tokens.color.faint,
              letterSpacing: '0.18em',
            }}
          >
            {t.n}
          </div>
          <div
            style={{
              fontSize: 36,
              color: 'var(--osd-accent)',
              fontWeight: 700,
              margin: '14px 0 18px',
              letterSpacing: '-0.005em',
            }}
          >
            {t.title}
          </div>
          <div
            style={{
              fontSize: 22,
              color: tokens.color.muted,
              lineHeight: 1.55,
            }}
          >
            {t.body}
          </div>
        </div>
      ))}
    </div>
    <Footer pageNum={4} section="anatomy" />
  </div>
);

/* ─────────────── 5. Worked example: Claude Code ─────────────── */

const Annotation = ({ label, body, delay }: { label: string; body: string; delay: number }) => (
  <div
    className="h-fadeup"
    style={{
      animationDelay: `${delay}ms`,
      borderLeft: `2px solid var(--osd-accent)`,
      paddingLeft: 18,
    }}
  >
    <div style={{ fontSize: 20, color: 'var(--osd-accent)', letterSpacing: '0.16em' }}>{label}</div>
    <div style={{ fontSize: 22, color: tokens.color.muted, lineHeight: 1.55, marginTop: 4 }}>
      {body}
    </div>
  </div>
);

const ClaudeCodeExample: Page = () => (
  <div
    style={{
      ...fill,
      padding: `${tokens.space.padY}px ${tokens.space.padX}px`,
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <Style />
    <Eyebrow>04 · worked example</Eyebrow>
    <h2
      className="h-fadeup"
      style={{
        animationDelay: '180ms',
        fontFamily: 'var(--osd-font-display)',
        fontSize: 72,
        fontWeight: 700,
        lineHeight: 1.15,
        letterSpacing: '-0.01em',
        margin: '24px 0 16px',
      }}
    >
      <span style={{ color: 'var(--osd-accent)' }}>claude code</span> is a harness.
    </h2>
    <p
      className="h-fadeup"
      style={{
        animationDelay: '320ms',
        fontSize: 'var(--osd-size-body)',
        color: tokens.color.muted,
        lineHeight: 1.55,
        margin: '0 0 40px',
        maxWidth: 1500,
      }}
    >
      {
        '// a thin TUI wrapping a model with a curated tool surface, a planning loop, and approvals.'
      }
    </p>

    <div style={{ display: 'flex', gap: 50, flex: 1 }}>
      {/* Left: terminal mock */}
      <div
        className="h-fadeup"
        style={{
          animationDelay: '500ms',
          flex: 1.4,
          background: tokens.color.surface,
          border: `1px solid ${tokens.color.line}`,
          padding: '20px 26px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          fontSize: 19,
          lineHeight: 1.55,
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            color: tokens.color.faint,
            borderBottom: `1px solid ${tokens.color.line}`,
            paddingBottom: 10,
            fontSize: 17,
          }}
        >
          <span>~ claude-code · session</span>
          <span style={{ color: 'var(--osd-accent)' }}>● connected</span>
        </div>
        <div style={{ color: tokens.color.muted }}>
          <span style={{ color: 'var(--osd-accent)' }}>›</span> tools{' '}
          <span style={{ color: tokens.color.faint }}>(permission-gated)</span>
        </div>
        <div style={{ color: tokens.color.accent2, paddingLeft: 22 }}>
          Read · Edit · Write · Bash · Grep · WebFetch · TodoWrite · Agent · Skill
        </div>
        <div style={{ color: tokens.color.muted, marginTop: 8 }}>
          <span style={{ color: 'var(--osd-accent)' }}>›</span> loop
        </div>
        <div style={{ color: 'var(--osd-text)', paddingLeft: 22 }}>
          think → call tool → read result → decide → repeat
        </div>
        <div style={{ color: tokens.color.muted, marginTop: 8 }}>
          <span style={{ color: 'var(--osd-accent)' }}>›</span> state
        </div>
        <div style={{ color: 'var(--osd-text)', paddingLeft: 22 }}>
          TodoWrite · plan files · CLAUDE.md · git commits
        </div>
        <div style={{ color: tokens.color.muted, marginTop: 8 }}>
          <span style={{ color: 'var(--osd-accent)' }}>›</span> approval
        </div>
        <div style={{ color: tokens.color.warn, paddingLeft: 22 }}>
          ? run `pnpm dev` — [y/N]
          <span
            className="h-cursor"
            style={{
              display: 'inline-block',
              width: 10,
              height: 18,
              background: 'var(--osd-accent)',
              marginLeft: 8,
              verticalAlign: 'middle',
            }}
          />
        </div>
      </div>

      {/* Right: annotations */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <Annotation
          delay={800}
          label="TOOL SURFACE"
          body="curated set, not the whole shell. each gated by allowlist or prompt."
        />
        <Annotation
          delay={950}
          label="CONTROL LOOP"
          body="the model never decides alone — every action is mediated by the harness."
        />
        <Annotation
          delay={1100}
          label="MEMORY"
          body="todos, plans, CLAUDE.md, and git keep state across long-running work."
        />
        <Annotation
          delay={1250}
          label="GUARDRAILS"
          body="approvals on side effects. sandboxes for code execution."
        />
        <Annotation
          delay={1400}
          label="EVALS"
          body="benchmarks the team runs every time the harness changes."
        />
      </div>
    </div>
    <Footer pageNum={5} section="example" />
  </div>
);

/* ─────────────── 6. Principles ─────────────── */

const principles: Array<{ n: string; title: string; body: string }> = [
  {
    n: '01',
    title: 'a map, not a manual',
    body: 'short AGENTS.md with pointers — not a thousand pages of prose.',
  },
  {
    n: '02',
    title: 'progressive disclosure',
    body: 'load tools and instructions on demand; keep the working window small.',
  },
  {
    n: '03',
    title: 'ratchet failures into rules',
    body: 'every recurring miss becomes a hook, a lint, or an eval.',
  },
  {
    n: '04',
    title: 'success silent, failures verbose',
    body: 'make errors actionable; let wins speak for themselves.',
  },
  {
    n: '05',
    title: 'the harness is a product',
    body: 'version it. eval it. regress against it. do not tweak by feel.',
  },
];

const Principles: Page = () => (
  <div
    style={{
      ...fill,
      padding: `${tokens.space.padY}px ${tokens.space.padX}px`,
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <Style />
    <Eyebrow>05 · principles</Eyebrow>
    <h2
      className="h-fadeup"
      style={{
        animationDelay: '180ms',
        fontFamily: 'var(--osd-font-display)',
        fontSize: 72,
        fontWeight: 700,
        lineHeight: 1.15,
        letterSpacing: '-0.01em',
        margin: '24px 0 50px',
      }}
    >
      five rules to ship by.
    </h2>
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
        flex: 1,
      }}
    >
      {principles.map((p, i) => (
        <div
          key={p.n}
          className="h-fadeup"
          style={{
            animationDelay: `${400 + i * 120}ms`,
            display: 'flex',
            alignItems: 'baseline',
            gap: 28,
            padding: '18px 26px',
            background: i % 2 === 0 ? tokens.color.surface : 'transparent',
            border: `1px solid ${tokens.color.line}`,
          }}
        >
          <div
            style={{
              fontSize: 'var(--osd-size-body)',
              color: 'var(--osd-accent)',
              flexShrink: 0,
              minWidth: 64,
            }}
          >
            &gt; {p.n}
          </div>
          <div
            style={{
              fontSize: 30,
              color: 'var(--osd-text)',
              fontWeight: 700,
              minWidth: 460,
              flexShrink: 0,
              letterSpacing: '-0.005em',
            }}
          >
            {p.title}
          </div>
          <div style={{ fontSize: 22, color: tokens.color.muted, lineHeight: 1.55, flex: 1 }}>
            {p.body}
          </div>
        </div>
      ))}
    </div>
    <Footer pageNum={6} section="principles" />
  </div>
);

/* ─────────────── 7. Disambiguation ─────────────── */

const layers: Array<{
  name: string;
  artifact: string;
  scope: string;
  tone: 'dim' | 'mid' | 'bright';
}> = [
  {
    name: 'prompt engineering',
    artifact: 'the string',
    scope: 'a single turn',
    tone: 'dim',
  },
  {
    name: 'context engineering',
    artifact: "what's in the window",
    scope: 'a turn / a conversation',
    tone: 'mid',
  },
  {
    name: 'harness engineering',
    artifact: 'the runtime',
    scope: 'the whole agent',
    tone: 'bright',
  },
];

const Layers: Page = () => (
  <div
    style={{
      ...fill,
      padding: `${tokens.space.padY}px ${tokens.space.padX}px`,
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <Style />
    <Eyebrow>06 · disambiguation</Eyebrow>
    <h2
      className="h-fadeup"
      style={{
        animationDelay: '180ms',
        fontFamily: 'var(--osd-font-display)',
        fontSize: 72,
        fontWeight: 700,
        lineHeight: 1.15,
        letterSpacing: '-0.01em',
        margin: '24px 0 16px',
      }}
    >
      three layers, often confused.
    </h2>
    <p
      className="h-fadeup"
      style={{
        animationDelay: '320ms',
        fontSize: 'var(--osd-size-body)',
        color: tokens.color.muted,
        lineHeight: 1.55,
        margin: '0 0 44px',
        maxWidth: 1500,
      }}
    >
      {'// each one is a strict subset of the next — and the bottleneck has moved outward.'}
    </p>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, flex: 1 }}>
      {/* header row */}
      <div
        className="h-fade"
        style={{
          animationDelay: '500ms',
          display: 'flex',
          gap: 32,
          padding: '0 26px',
          color: tokens.color.faint,
          fontSize: 20,
          letterSpacing: '0.18em',
        }}
      >
        <div style={{ flex: 1.3 }}>LAYER</div>
        <div style={{ flex: 1 }}>ARTIFACT</div>
        <div style={{ flex: 1 }}>SCOPE</div>
      </div>

      {layers.map((l, i) => {
        const color =
          l.tone === 'bright'
            ? 'var(--osd-accent)'
            : l.tone === 'mid'
              ? tokens.color.accent2
              : tokens.color.muted;
        return (
          <div
            key={l.name}
            className="h-fadeup"
            style={{
              animationDelay: `${700 + i * 180}ms`,
              display: 'flex',
              gap: 32,
              alignItems: 'center',
              padding: '24px 26px',
              background: l.tone === 'bright' ? 'rgba(57,255,136,0.05)' : tokens.color.surface,
              border: `1px solid ${l.tone === 'bright' ? 'var(--osd-accent)' : tokens.color.line}`,
              boxShadow: l.tone === 'bright' ? '0 0 28px rgba(57,255,136,0.12)' : 'none',
            }}
          >
            <div
              style={{
                flex: 1.3,
                fontSize: 32,
                fontWeight: 700,
                color,
                letterSpacing: '-0.005em',
              }}
            >
              {l.name}
            </div>
            <div style={{ flex: 1, fontSize: 'var(--osd-size-body)', color: 'var(--osd-text)' }}>
              {l.artifact}
            </div>
            <div style={{ flex: 1, fontSize: 'var(--osd-size-body)', color: tokens.color.muted }}>
              {l.scope}
            </div>
          </div>
        );
      })}
    </div>
    <Footer pageNum={7} section="layers" />
  </div>
);

/* ─────────────── 8. Closing ─────────────── */

const sources: Array<{ who: string; what: string; date: string }> = [
  {
    who: 'openai',
    what: 'harness engineering: leveraging codex in an agent-first world',
    date: 'feb 2026',
  },
  {
    who: 'anthropic / justin young',
    what: 'effective harnesses for long-running agents',
    date: '26 nov 2025',
  },
  {
    who: 'birgitta böckeler',
    what: 'harness engineering for coding agent users',
    date: '2 apr 2026',
  },
  { who: 'addy osmani', what: 'agent harness engineering', date: '19 apr 2026' },
  { who: 'humanlayer', what: 'skill issue: harness engineering for coding agents', date: '—' },
];

const Closing: Page = () => (
  <div
    style={{
      ...fill,
      padding: `${tokens.space.padY}px ${tokens.space.padX}px`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 40,
    }}
  >
    <Style />
    <Scanlines />
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Eyebrow>fin</Eyebrow>
    </div>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 132,
        fontWeight: 700,
        lineHeight: 1.02,
        letterSpacing: '-0.025em',
        margin: 0,
        color: 'var(--osd-text)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <span className="h-typein" style={{ display: 'block', animationDelay: '120ms' }}>
        the harness
      </span>
      <span
        className="h-typein"
        style={{
          display: 'block',
          animationDelay: '900ms',
        }}
      >
        <span style={{ color: tokens.color.muted }}>is</span>{' '}
        <span style={{ color: 'var(--osd-accent)', textShadow: '0 0 22px rgba(57,255,136,0.5)' }}>
          the product.
        </span>
        <Cursor size="0.5em" height="0.85em" />
      </span>
    </h2>
    <div
      className="h-line"
      style={{
        animationDelay: '1700ms',
        width: 480,
        height: 1,
        background: 'var(--osd-accent)',
        position: 'relative',
        zIndex: 1,
      }}
    />
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {sources.map((s, i) => (
        <div
          key={s.who}
          className="h-fadeup"
          style={{
            animationDelay: `${1900 + i * 110}ms`,
            display: 'flex',
            gap: 24,
            fontSize: 20,
            color: tokens.color.muted,
            lineHeight: 1.5,
          }}
        >
          <span style={{ color: 'var(--osd-accent)', minWidth: 32 }}>›</span>
          <span style={{ color: tokens.color.accent2, minWidth: 240 }}>{s.who}</span>
          <span style={{ flex: 1, color: 'var(--osd-text)' }}>{s.what}</span>
          <span style={{ color: tokens.color.faint, minWidth: 110, textAlign: 'right' }}>
            {s.date}
          </span>
        </div>
      ))}
    </div>
    <Footer pageNum={8} section="fin" />
  </div>
);

/* ─────────────── Export ─────────────── */

export const meta: SlideMeta = { title: 'Harness Engineering' };

export default [
  Cover,
  Shift,
  Definition,
  Anatomy,
  ClaudeCodeExample,
  Principles,
  Layers,
  Closing,
] satisfies Page[];
