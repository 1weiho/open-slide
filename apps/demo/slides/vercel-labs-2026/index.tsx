import type { DesignSystem, Page, SlideMeta } from '@open-slide/react';

export const meta: SlideMeta = {
  title: 'Vercel Labs · 2026',
  createdAt: '2026-05-13T02:06:00+08:00',
};

export const design: DesignSystem = {
  palette: {
    bg: '#000000',
    text: '#EDEDED',
    accent: '#FFFFFF',
  },
  fonts: {
    display:
      "'Geist', 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
    body: "'Geist', 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
  },
  typeScale: { hero: 200, body: 32 },
  radius: 14,
};

const palette = {
  bg: '#000000',
  text: '#EDEDED',
  muted: '#8F8F8F',
  faint: '#5A5A5A',
  line: 'rgba(255, 255, 255, 0.10)',
  lineStrong: 'rgba(255, 255, 255, 0.18)',
  surface: 'rgba(255, 255, 255, 0.025)',
  cyan: '#00DFD8',
  pink: '#FF0080',
  violet: '#7928CA',
  blue: '#0070F3',
  amber: '#F5A623',
  green: '#50E3C2',
};

const fonts = {
  sans: "'Geist', 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
  mono: "'Geist Mono', 'JetBrains Mono', 'SF Mono', ui-monospace, Menlo, monospace",
};

const fill = {
  width: '100%',
  height: '100%',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: fonts.sans,
  position: 'relative',
  overflow: 'hidden',
  letterSpacing: '-0.01em',
} as const;

const keyframes = `
@keyframes vlRise {
  from { opacity: 0; transform: translateY(28px); filter: blur(8px); }
  to   { opacity: 1; transform: translateY(0);   filter: blur(0); }
}
@keyframes vlFade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes vlSlide {
  from { opacity: 0; transform: translateX(-24px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes vlSweep {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
@keyframes vlDrift {
  0%, 100% { transform: translate(-50%, -50%) translate(0, 0); }
  50%      { transform: translate(-50%, -50%) translate(40px, -28px); }
}
@keyframes vlPulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 14px currentColor; }
  50%      { opacity: 0.65; box-shadow: 0 0 28px currentColor; }
}
@keyframes vlCaret {
  0%, 55% { opacity: 1; }
  56%,100% { opacity: 0; }
}
.vl-rise  { animation: vlRise 900ms cubic-bezier(0.22, 1, 0.36, 1) both; }
.vl-fade  { animation: vlFade 900ms ease-out both; }
.vl-slide { animation: vlSlide 800ms cubic-bezier(0.22, 1, 0.36, 1) both; }
.vl-sweep { transform-origin: left center; animation: vlSweep 1000ms cubic-bezier(0.65, 0, 0.35, 1) both; }
.vl-drift { animation: vlDrift 12s ease-in-out infinite; }
.vl-pulse { animation: vlPulse 2.6s ease-in-out infinite; }
.vl-caret { animation: vlCaret 1.1s steps(1) infinite; }
`;

const Style = () => <style>{keyframes}</style>;

const GradientOrb = ({
  x,
  y,
  size = 1400,
  color,
  opacity = 0.18,
  drift = true,
}: {
  x: string | number;
  y: string | number;
  size?: number;
  color: string;
  opacity?: number;
  drift?: boolean;
}) => (
  <div
    className={drift ? 'vl-drift' : undefined}
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size,
      background: `radial-gradient(circle at center, ${color} 0%, transparent 62%)`,
      opacity,
      filter: 'blur(40px)',
      pointerEvents: 'none',
    }}
  />
);

const Grid = ({ opacity = 0.4 }: { opacity?: number }) => (
  <svg
    width="100%"
    height="100%"
    style={{ position: 'absolute', inset: 0, opacity, pointerEvents: 'none' }}
    aria-hidden
  >
    <defs>
      <pattern id="vl-grid" width="120" height="120" patternUnits="userSpaceOnUse">
        <path d="M 120 0 L 0 0 0 120" fill="none" stroke={palette.line} strokeWidth="1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#vl-grid)" />
  </svg>
);

const Triangle = ({ size = 14, color = palette.text }: { size?: number; color?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
    aria-hidden
  >
    <path d="M12 2 L22 21 L2 21 Z" fill={color} />
  </svg>
);

const MetaRow = ({ index, total }: { index?: string; total?: string }) => (
  <div
    style={{
      position: 'absolute',
      top: 64,
      left: 120,
      right: 120,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontFamily: fonts.mono,
      fontSize: 17,
      color: palette.muted,
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Triangle size={11} color={palette.text} />
      <span style={{ color: palette.text }}>Vercel Labs</span>
      <span style={{ color: palette.faint }}>·</span>
      <span>Showcase 2026</span>
    </div>
    {index && total ? (
      <div>
        <span style={{ color: palette.text }}>{index}</span>
        <span style={{ color: palette.faint }}> / </span>
        <span>{total}</span>
      </div>
    ) : (
      <div>May 2026</div>
    )}
  </div>
);

const FooterRule = ({ note }: { note?: string }) => (
  <div
    style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 120px',
      fontFamily: fonts.mono,
      fontSize: 15,
      color: palette.faint,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
    }}
  >
    <div
      className="vl-sweep"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        background: palette.line,
        animationDelay: '300ms',
      }}
    />
    <span className="vl-fade" style={{ animationDelay: '600ms' }}>
      open-slide · vercel labs
    </span>
    <span className="vl-fade" style={{ animationDelay: '700ms' }}>
      {note ?? '▲ github.com/vercel-labs'}
    </span>
  </div>
);

const Eyebrow = ({
  children,
  dot = palette.cyan,
  delay = 0,
}: {
  children: React.ReactNode;
  dot?: string;
  delay?: number;
}) => (
  <div
    className="vl-slide"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      fontFamily: fonts.mono,
      fontSize: 20,
      color: palette.muted,
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      animationDelay: `${delay}ms`,
    }}
  >
    <span
      className="vl-pulse"
      style={{
        width: 8,
        height: 8,
        background: dot,
        color: dot,
        display: 'inline-block',
        flex: 'none',
      }}
    />
    <span style={{ color: palette.text }}>{children}</span>
  </div>
);

const Kbd = ({
  children,
  accent,
  delay = 0,
}: {
  children: React.ReactNode;
  accent?: string;
  delay?: number;
}) => (
  <span
    className="vl-rise"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 14px',
      border: `1px solid ${palette.line}`,
      borderRadius: 999,
      fontFamily: fonts.mono,
      fontSize: 17,
      color: palette.text,
      background: palette.surface,
      letterSpacing: '0.04em',
      animationDelay: `${delay}ms`,
    }}
  >
    {accent ? (
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: accent,
          boxShadow: `0 0 10px ${accent}`,
        }}
      />
    ) : null}
    {children}
  </span>
);

// ────────────────────────────────────────────────────────────────────────────
// 01 — Cover
// ────────────────────────────────────────────────────────────────────────────
const Cover: Page = () => (
  <div style={fill}>
    <Style />
    <Grid opacity={0.35} />
    <GradientOrb x="100%" y="-5%" size={1400} color={palette.cyan} opacity={0.18} />
    <GradientOrb x="-5%" y="110%" size={1400} color={palette.pink} opacity={0.18} />
    <GradientOrb x="55%" y="55%" size={900} color={palette.violet} opacity={0.08} />
    <MetaRow />

    <div
      style={{
        position: 'absolute',
        top: 360,
        left: 120,
        right: 120,
        display: 'flex',
        flexDirection: 'column',
        gap: 44,
      }}
    >
      <Eyebrow dot={palette.cyan} delay={200}>
        Showcase · Six Projects
      </Eyebrow>
      <div
        className="vl-rise"
        style={{
          fontFamily: fonts.sans,
          fontSize: 196,
          lineHeight: 0.94,
          letterSpacing: '-0.05em',
          fontWeight: 600,
          color: palette.text,
          animationDelay: '300ms',
        }}
      >
        Primitives
        <br />
        for the agent era.
      </div>
      <div
        className="vl-fade"
        style={{
          fontFamily: fonts.sans,
          fontSize: 32,
          color: palette.muted,
          letterSpacing: '-0.015em',
          maxWidth: 1000,
          lineHeight: 1.35,
          animationDelay: '700ms',
        }}
      >
        Six experiments shipping out of Vercel Labs.
        <span className="vl-caret" style={{ marginLeft: 8, color: palette.text }}>
          ▮
        </span>
      </div>
    </div>

    <FooterRule note="I · Cover" />
  </div>
);

// ────────────────────────────────────────────────────────────────────────────
// 02 — Thesis
// ────────────────────────────────────────────────────────────────────────────
const Thesis: Page = () => {
  const cols: Array<{ k: string; v: string; color: string }> = [
    { k: 'Browser', v: 'agent-browser', color: palette.cyan },
    { k: 'Shell', v: 'just-bash', color: palette.green },
    { k: 'Orchestrator', v: 'open-agents', color: palette.violet },
    { k: 'URLs', v: 'portless', color: palette.blue },
    { k: 'UI', v: 'json-render', color: palette.pink },
    { k: 'Runtime', v: 'zero-native', color: palette.amber },
  ];

  return (
    <div style={fill}>
      <Style />
      <Grid opacity={0.3} />
      <GradientOrb x="110%" y="50%" size={1300} color={palette.violet} opacity={0.1} />
      <MetaRow index="02" total="10" />

      <div
        style={{
          position: 'absolute',
          top: 200,
          left: 120,
          right: 120,
          display: 'flex',
          flexDirection: 'column',
          gap: 56,
        }}
      >
        <Eyebrow dot={palette.pink} delay={120}>
          01 — The Bet
        </Eyebrow>

        <div
          className="vl-rise"
          style={{
            fontFamily: fonts.sans,
            fontSize: 128,
            lineHeight: 0.98,
            letterSpacing: '-0.045em',
            fontWeight: 600,
            color: palette.text,
            animationDelay: '240ms',
          }}
        >
          The autonomous loop
          <br />
          needs primitives.
        </div>

        <div
          className="vl-sweep"
          style={{
            height: 1,
            background: palette.lineStrong,
            animationDelay: '500ms',
          }}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 0,
            marginTop: -32,
          }}
        >
          {cols.map((c, i) => (
            <div
              key={c.k}
              className="vl-rise"
              style={{
                padding: '32px 24px 0 0',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                borderRight: i === cols.length - 1 ? 'none' : `1px solid ${palette.line}`,
                paddingLeft: i === 0 ? 0 : 24,
                animationDelay: `${600 + i * 80}ms`,
              }}
            >
              <span
                className="vl-pulse"
                style={{
                  width: 8,
                  height: 8,
                  background: c.color,
                  color: c.color,
                }}
              />
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 15,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: palette.muted,
                }}
              >
                {c.k}
              </div>
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 22,
                  letterSpacing: '-0.01em',
                  color: palette.text,
                }}
              >
                {c.v}
              </div>
            </div>
          ))}
        </div>
      </div>

      <FooterRule note="II · The Bet" />
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Shared project-page pieces
// ────────────────────────────────────────────────────────────────────────────
const PageFrame = ({
  pageIndex,
  accent,
  note,
  children,
}: {
  pageIndex: string;
  accent: string;
  note: string;
  children: React.ReactNode;
}) => (
  <div style={fill}>
    <Style />
    <Grid opacity={0.28} />
    <GradientOrb x="110%" y="-10%" size={1200} color={accent} opacity={0.16} />
    <GradientOrb x="-10%" y="115%" size={900} color={accent} opacity={0.05} />
    <MetaRow index={pageIndex} total="10" />
    {children}
    <FooterRule note={note} />
  </div>
);

type Chip = { label: string; accent?: string };

const LeftCol = ({
  category,
  accent,
  name,
  tagline,
  principle,
  chips,
}: {
  category: string;
  accent: string;
  name: string;
  tagline: string;
  principle: string;
  chips: Chip[];
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100%',
      paddingRight: 8,
    }}
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <Eyebrow dot={accent} delay={120}>
        {category}
      </Eyebrow>
      <div
        className="vl-rise"
        style={{
          fontFamily: fonts.sans,
          fontSize: 80,
          lineHeight: 1.0,
          fontWeight: 600,
          letterSpacing: '-0.045em',
          color: palette.text,
          animationDelay: '240ms',
        }}
      >
        {name}
      </div>
      <div
        className="vl-fade"
        style={{
          fontFamily: fonts.sans,
          fontSize: 24,
          lineHeight: 1.32,
          color: palette.muted,
          letterSpacing: '-0.01em',
          maxWidth: 580,
          animationDelay: '440ms',
        }}
      >
        {tagline}
      </div>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div
        className="vl-sweep"
        style={{
          height: 1,
          background: palette.lineStrong,
          animationDelay: '560ms',
        }}
      />
      <div
        className="vl-slide"
        style={{
          fontFamily: fonts.mono,
          fontSize: 13,
          color: accent,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          animationDelay: '640ms',
        }}
      >
        Principle
      </div>
      <div
        className="vl-rise"
        style={{
          fontFamily: fonts.sans,
          fontSize: 28,
          lineHeight: 1.35,
          color: palette.text,
          letterSpacing: '-0.015em',
          fontWeight: 500,
          maxWidth: 600,
          animationDelay: '700ms',
        }}
      >
        {principle}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
        {chips.map((c, i) => (
          <Kbd key={c.label} accent={c.accent} delay={840 + i * 60}>
            {c.label}
          </Kbd>
        ))}
      </div>
    </div>
  </div>
);

const WindowDots = ({ live = false }: { live?: boolean }) => (
  <div style={{ display: 'flex', gap: 7 }}>
    {(['#FF5F57', '#FEBC2E', '#28C840'] as const).map((c) => (
      <span
        key={c}
        style={{
          width: 11,
          height: 11,
          borderRadius: '50%',
          background: live ? c : 'rgba(255,255,255,0.18)',
        }}
      />
    ))}
  </div>
);

const DemoCard = ({
  title,
  badge,
  accent,
  children,
  delay = 500,
  pad = 28,
  live = false,
}: {
  title: string;
  badge?: string;
  accent: string;
  children: React.ReactNode;
  delay?: number;
  pad?: number;
  live?: boolean;
}) => (
  <div
    className="vl-rise"
    style={{
      height: '100%',
      border: `1px solid ${palette.line}`,
      borderRadius: 16,
      background: 'linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.012))',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      animationDelay: `${delay}ms`,
      boxShadow: '0 30px 80px -40px rgba(0,0,0,0.6)',
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 22px',
        borderBottom: `1px solid ${palette.line}`,
        background: 'rgba(255,255,255,0.02)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <WindowDots live={live} />
        <span
          style={{
            fontFamily: fonts.mono,
            fontSize: 14,
            color: palette.muted,
            letterSpacing: '0.1em',
          }}
        >
          {title}
        </span>
      </div>
      {badge ? (
        <span
          style={{
            fontFamily: fonts.mono,
            fontSize: 12,
            color: accent,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          {badge}
        </span>
      ) : null}
    </div>
    <div
      style={{
        flex: 1,
        padding: pad,
        fontFamily: fonts.mono,
        fontSize: 17,
        color: palette.text,
        lineHeight: 1.65,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  </div>
);

const ProjectGrid = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      position: 'absolute',
      top: 160,
      left: 120,
      right: 120,
      bottom: 80,
      display: 'grid',
      gridTemplateColumns: '5fr 8fr',
      gap: 56,
    }}
  >
    {children}
  </div>
);

// ────────────────────────────────────────────────────────────────────────────
// 04 — agent-browser  (terminal · element refs)
// ────────────────────────────────────────────────────────────────────────────
const refRow = (
  refName: string,
  tag: string,
  text: string,
  attrs?: string,
  highlight = false,
  accent = palette.cyan,
) => (
  <div
    key={refName}
    style={{
      display: 'grid',
      gridTemplateColumns: '70px 92px 1fr',
      alignItems: 'baseline',
      gap: 14,
      padding: '4px 8px',
      borderRadius: 4,
      background: highlight ? 'rgba(0,223,216,0.10)' : 'transparent',
      borderLeft: highlight ? `2px solid ${accent}` : '2px solid transparent',
    }}
  >
    <span style={{ color: accent }}>{refName}</span>
    <span style={{ color: palette.muted }}>{tag}</span>
    <span>
      <span style={{ color: palette.text }}>{text}</span>
      {attrs ? <span style={{ color: palette.faint }}> &nbsp;·&nbsp; {attrs}</span> : null}
    </span>
  </div>
);

const AgentBrowser: Page = () => (
  <PageFrame pageIndex="03" accent={palette.cyan} note="IV · agent-browser">
    <ProjectGrid>
      <LeftCol
        category="01 · Browser · Rust CLI"
        accent={palette.cyan}
        name="agent-browser"
        tagline="Browser automation CLI for AI agents — fast, native, deterministic."
        principle="A Rust daemon speaks CDP. Stable element refs turn a browser into something an LLM can point at."
        chips={[
          { label: 'Rust', accent: palette.cyan },
          { label: 'CDP' },
          { label: 'WebDriver' },
          { label: 'v0.27' },
        ]}
      />
      <DemoCard title="agent-browser · session" badge="cdp" accent={palette.cyan} delay={500} live>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div>
            <span style={{ color: palette.faint }}>$</span> <span>agent-browser snapshot </span>
            <span style={{ color: palette.cyan }}>vercel.com/login</span>
          </div>
          <div style={{ height: 16 }} />
          {refRow('@e1', 'h1', '"Sign in to Vercel"')}
          {refRow('@e2', 'input', 'email', 'required')}
          {refRow('@e3', 'input', 'password', 'required')}
          {refRow('@e4', 'button', '"Continue"', 'submit', true)}
          {refRow('@e5', 'a', '"Forgot password?"')}
          <div style={{ height: 18 }} />
          <div>
            <span style={{ color: palette.faint }}>$</span> agent-browser click{' '}
            <span style={{ color: palette.cyan }}>@e4</span>
          </div>
          <div style={{ color: palette.muted, paddingLeft: 22 }}>
            → navigated to /dashboard · 213 ms · 2 cookies stored
          </div>
        </div>
      </DemoCard>
    </ProjectGrid>
  </PageFrame>
);

// ────────────────────────────────────────────────────────────────────────────
// 05 — just-bash  (terminal · sandbox · allowed vs denied)
// ────────────────────────────────────────────────────────────────────────────
const cmdLine = (cmd: string, output: string, status: 'ok' | 'deny' | 'note', accent: string) => {
  const statusColor = status === 'ok' ? accent : status === 'deny' ? '#FF5F57' : palette.muted;
  const statusLabel = status === 'ok' ? 'ok' : status === 'deny' ? 'denied' : 'note';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '8px 10px',
        borderLeft: `2px solid ${statusColor}`,
        background: status === 'deny' ? 'rgba(255,95,87,0.06)' : 'rgba(255,255,255,0.02)',
        borderRadius: 4,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>
          <span style={{ color: palette.faint }}>$</span> {cmd}
        </span>
        <span
          style={{
            color: statusColor,
            fontSize: 12,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          {statusLabel}
        </span>
      </div>
      <div style={{ color: status === 'deny' ? '#FFB3AD' : palette.muted, paddingLeft: 22 }}>
        {output}
      </div>
    </div>
  );
};

const JustBash: Page = () => (
  <PageFrame pageIndex="04" accent={palette.green} note="V · just-bash">
    <ProjectGrid>
      <LeftCol
        category="02 · Shell · TypeScript"
        accent={palette.green}
        name="just-bash"
        tagline="Bash for agents. A simulated shell with a virtual filesystem."
        principle="Bash semantics, reimplemented in TypeScript on a virtual FS — diff-tested against real bash until it agrees."
        chips={[
          { label: 'TypeScript', accent: palette.green },
          { label: 'virtual FS' },
          { label: 'sandboxed' },
        ]}
      />
      <DemoCard
        title="just-bash · sandbox session"
        badge="vfs"
        accent={palette.green}
        delay={500}
        live
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cmdLine('ls /work', 'index.ts  package.json  README.md', 'ok', palette.green)}
          {cmdLine(
            'rm -rf /',
            "permission denied: '/' is outside the sandbox root",
            'deny',
            palette.green,
          )}
          {cmdLine('cat README.md | wc -l', '42', 'ok', palette.green)}
          {cmdLine(
            'curl http://169.254.169.254',
            'network: blocked by host policy',
            'deny',
            palette.green,
          )}
          {cmdLine('echo "agent ran safely"', 'agent ran safely', 'ok', palette.green)}
        </div>
      </DemoCard>
    </ProjectGrid>
  </PageFrame>
);

// ────────────────────────────────────────────────────────────────────────────
// 06 — open-agents  (session stack with statuses)
// ────────────────────────────────────────────────────────────────────────────
type SessionStatus = 'running' | 'paused' | 'done' | 'queued';
const sessionRow = (title: string, meta: string, status: SessionStatus, accent: string) => {
  const map: Record<SessionStatus, { dot: string; label: string; tint: string }> = {
    running: { dot: accent, label: 'running', tint: 'rgba(121, 40, 202, 0.10)' },
    paused: { dot: palette.amber, label: 'paused', tint: 'transparent' },
    done: { dot: palette.green, label: 'done', tint: 'transparent' },
    queued: { dot: palette.faint, label: 'queued', tint: 'transparent' },
  };
  const s = map[status];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 18px',
        borderRadius: 10,
        background: s.tint,
        border: `1px solid ${status === 'running' ? 'rgba(121,40,202,0.4)' : palette.line}`,
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span
          className={status === 'running' ? 'vl-pulse' : undefined}
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: s.dot,
            color: s.dot,
            flex: 'none',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ color: palette.text, fontSize: 18 }}>{title}</div>
          <div style={{ color: palette.muted, fontSize: 14, letterSpacing: '0.04em' }}>{meta}</div>
        </div>
      </div>
      <span
        style={{
          color: s.dot,
          fontSize: 13,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
        }}
      >
        {s.label}
      </span>
    </div>
  );
};

const OpenAgents: Page = () => (
  <PageFrame pageIndex="05" accent={palette.violet} note="VI · open-agents">
    <ProjectGrid>
      <LeftCol
        category="03 · Orchestrator · Reference App"
        accent={palette.violet}
        name="open-agents"
        tagline="Reference app for background coding agents on Vercel."
        principle="The agent runs outside the sandbox and reaches in through tools — agent and runtime lifecycles stay decoupled."
        chips={[
          { label: 'Workflow SDK', accent: palette.violet },
          { label: 'Vercel Sandbox' },
          { label: 'Postgres' },
          { label: 'MIT' },
        ]}
      />
      <DemoCard
        title="open-agents · sessions"
        badge="workflow"
        accent={palette.violet}
        delay={500}
        pad={22}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sessionRow('fix auth flow', '@main · 2m 14s · sandbox-1234', 'running', palette.violet)}
          {sessionRow(
            'migrate prisma → drizzle',
            '@migration · paused for review',
            'paused',
            palette.violet,
          )}
          {sessionRow('add /login page', '@feat/login · PR #2418', 'done', palette.violet)}
          {sessionRow('update docs', '@main · waiting for capacity', 'queued', palette.violet)}
        </div>
      </DemoCard>
    </ProjectGrid>
  </PageFrame>
);

// ────────────────────────────────────────────────────────────────────────────
// 07 — portless  (stacked layout, routing diagram full-width)
// ────────────────────────────────────────────────────────────────────────────
const portRow = (port: string, name: string, idx: number) => (
  <div
    key={port}
    className="vl-rise"
    style={{
      display: 'grid',
      gridTemplateColumns: '1fr 200px 1fr',
      alignItems: 'center',
      gap: 32,
      padding: '22px 24px',
      borderBottom: `1px solid ${palette.line}`,
      animationDelay: `${640 + idx * 110}ms`,
    }}
  >
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 26,
        color: palette.faint,
        textDecoration: 'line-through',
        textDecorationColor: 'rgba(255,95,87,0.5)',
      }}
    >
      http://localhost:{port}
    </div>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        fontFamily: fonts.mono,
        fontSize: 14,
        color: palette.blue,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        justifyContent: 'center',
      }}
    >
      <span style={{ height: 1, flex: 1, background: 'rgba(0,112,243,0.4)' }} />
      <span>proxy</span>
      <span style={{ flex: 'none', fontSize: 18 }}>▶</span>
    </div>
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 26,
        color: palette.text,
        letterSpacing: '-0.01em',
      }}
    >
      <span style={{ color: palette.blue }}>https://</span>
      {name}
      <span style={{ color: palette.muted }}>.localhost</span>
    </div>
  </div>
);

const Portless: Page = () => (
  <PageFrame pageIndex="06" accent={palette.blue} note="VII · portless">
    <div
      style={{
        position: 'absolute',
        top: 160,
        left: 120,
        right: 120,
        bottom: 80,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Eyebrow dot={palette.blue} delay={120}>
          04 · DX · Local Networking
        </Eyebrow>
        <div
          className="vl-fade"
          style={{
            fontFamily: fonts.mono,
            fontSize: 15,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: palette.faint,
            animationDelay: '200ms',
          }}
        >
          portless.sh
        </div>
      </div>

      <div
        className="vl-rise"
        style={{
          fontFamily: fonts.sans,
          fontSize: 132,
          lineHeight: 0.94,
          fontWeight: 600,
          letterSpacing: '-0.05em',
          color: palette.text,
          animationDelay: '240ms',
        }}
      >
        portless
      </div>

      <div
        className="vl-fade"
        style={{
          fontFamily: fonts.sans,
          fontSize: 28,
          lineHeight: 1.3,
          color: palette.muted,
          letterSpacing: '-0.015em',
          maxWidth: 1100,
          animationDelay: '440ms',
        }}
      >
        Stable, named local URLs replace port numbers. For humans and agents.
      </div>

      <div
        className="vl-rise"
        style={{
          marginTop: 8,
          border: `1px solid ${palette.line}`,
          borderRadius: 16,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.012))',
          overflow: 'hidden',
          animationDelay: '560ms',
          boxShadow: '0 30px 80px -40px rgba(0,0,0,0.6)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 22px',
            borderBottom: `1px solid ${palette.line}`,
            background: 'rgba(255,255,255,0.02)',
            fontFamily: fonts.mono,
            fontSize: 14,
            letterSpacing: '0.1em',
            color: palette.muted,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <WindowDots live />
            <span>*.localhost · trusted TLS · HTTP/2</span>
          </div>
          <span
            style={{
              color: palette.blue,
              fontSize: 12,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            routing
          </span>
        </div>
        <div>
          {portRow('3000', 'myapp', 0)}
          {portRow('5173', 'api.myapp', 1)}
          {portRow('4321', 'docs.myapp', 2)}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: 'auto',
          gap: 32,
        }}
      >
        <div
          className="vl-fade"
          style={{
            fontFamily: fonts.sans,
            fontSize: 22,
            lineHeight: 1.4,
            color: palette.muted,
            letterSpacing: '-0.01em',
            maxWidth: 880,
            animationDelay: '980ms',
          }}
        >
          A local proxy on 80/443 routes <span style={{ color: palette.text }}>*.localhost</span>{' '}
          names to ephemeral dev servers, terminating TLS with its own trusted CA.
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'flex-end',
          }}
        >
          <Kbd accent={palette.blue} delay={1100}>
            HTTPS
          </Kbd>
          <Kbd delay={1160}>HTTP/2</Kbd>
          <Kbd delay={1220}>mDNS</Kbd>
          <Kbd delay={1280}>Tailscale</Kbd>
        </div>
      </div>
    </div>
  </PageFrame>
);

// ────────────────────────────────────────────────────────────────────────────
// 08 — json-render  (split: JSON spec ↓ rendered card)
// ────────────────────────────────────────────────────────────────────────────
const JsonRender: Page = () => (
  <PageFrame pageIndex="07" accent={palette.pink} note="VIII · json-render">
    <ProjectGrid>
      <LeftCol
        category="05 · Gen-UI · Multi-runtime"
        accent={palette.pink}
        name="json-render"
        tagline="The generative-UI framework. AI can only emit what your UI renders."
        principle="Your component catalog is both the JSON schema the model conforms to, and the prompt the model receives."
        chips={[
          { label: 'shadcn/ui', accent: palette.pink },
          { label: 'schema-conformant' },
          { label: 'streaming' },
        ]}
      />
      <div
        className="vl-rise"
        style={{
          height: '100%',
          border: `1px solid ${palette.line}`,
          borderRadius: 16,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.012))',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animationDelay: '500ms',
          boxShadow: '0 30px 80px -40px rgba(0,0,0,0.6)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 22px',
            borderBottom: `1px solid ${palette.line}`,
            background: 'rgba(255,255,255,0.02)',
            fontFamily: fonts.mono,
            fontSize: 14,
            letterSpacing: '0.1em',
            color: palette.muted,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <WindowDots live />
            <span>json-render · spec → UI</span>
          </div>
          <span
            style={{
              color: palette.pink,
              fontSize: 12,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            streaming
          </span>
        </div>

        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateRows: '1fr 56px 1fr',
            minHeight: 0,
          }}
        >
          <pre
            style={{
              margin: 0,
              padding: 24,
              fontFamily: fonts.mono,
              fontSize: 16,
              lineHeight: 1.5,
              color: palette.text,
              whiteSpace: 'pre-wrap',
              overflow: 'hidden',
            }}
          >
            {`{
  "type": `}
            <span style={{ color: palette.pink }}>"Card"</span>
            {`,
  "props": { "title": `}
            <span style={{ color: palette.green }}>"Welcome back"</span>
            {` },
  "children": [
    { "type": `}
            <span style={{ color: palette.pink }}>"Text"</span>
            {`,
      "props": { "children": `}
            <span style={{ color: palette.green }}>"Sign in to continue."</span>
            {` }},
    { "type": `}
            <span style={{ color: palette.pink }}>"Button"</span>
            {`,
      "props": { "variant": `}
            <span style={{ color: palette.green }}>"primary"</span>
            {`,
                 "children": `}
            <span style={{ color: palette.green }}>"Sign in"</span>
            {` }}
  ]
}`}
          </pre>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              borderTop: `1px solid ${palette.line}`,
              borderBottom: `1px solid ${palette.line}`,
              background: 'rgba(255,0,128,0.04)',
              fontFamily: fonts.mono,
              fontSize: 14,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: palette.pink,
            }}
          >
            <span style={{ width: 56, height: 1, background: 'rgba(255,0,128,0.5)' }} />
            <span>render</span>
            <span style={{ fontSize: 18 }}>▼</span>
            <span style={{ width: 56, height: 1, background: 'rgba(255,0,128,0.5)' }} />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              background:
                'radial-gradient(circle at center, rgba(255,0,128,0.12), transparent 70%)',
            }}
          >
            <div
              style={{
                width: '78%',
                border: `1px solid ${palette.line}`,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.04)',
                padding: 26,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                fontFamily: fonts.sans,
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 600,
                  color: palette.text,
                  letterSpacing: '-0.02em',
                }}
              >
                Welcome back
              </div>
              <div style={{ fontSize: 18, color: palette.muted, letterSpacing: '-0.005em' }}>
                Sign in to continue.
              </div>
              <button
                type="button"
                style={{
                  alignSelf: 'flex-start',
                  marginTop: 6,
                  padding: '12px 22px',
                  borderRadius: 10,
                  border: 'none',
                  background: palette.text,
                  color: palette.bg,
                  fontFamily: fonts.sans,
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  cursor: 'default',
                }}
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProjectGrid>
  </PageFrame>
);

// ────────────────────────────────────────────────────────────────────────────
// 09 — zero-native  (mac window mock + stats grid)
// ────────────────────────────────────────────────────────────────────────────
const statCell = (label: string, value: string, sub: string, idx: number) => (
  <div
    key={label}
    className="vl-rise"
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: 22,
      borderRadius: 10,
      border: `1px solid ${palette.line}`,
      background: 'rgba(255,255,255,0.02)',
      animationDelay: `${720 + idx * 90}ms`,
    }}
  >
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 12,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: palette.muted,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontFamily: fonts.sans,
        fontSize: 42,
        fontWeight: 600,
        letterSpacing: '-0.035em',
        color: palette.text,
        lineHeight: 1,
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 13,
        color: palette.faint,
        letterSpacing: '0.06em',
      }}
    >
      {sub}
    </div>
  </div>
);

const ZeroNative: Page = () => (
  <PageFrame pageIndex="08" accent={palette.amber} note="IX · zero-native">
    <ProjectGrid>
      <LeftCol
        category="06 · Runtime · Desktop"
        accent={palette.amber}
        name="zero-native"
        tagline="Native desktop apps with web UI. Tiny binaries, instant rebuilds."
        principle="A tiny Zig shell owns the event loop and windows. The WebView is treated as untrusted by default."
        chips={[
          { label: 'Zig', accent: palette.amber },
          { label: 'WKWebView' },
          { label: 'zero-native.dev' },
        ]}
      />
      <div
        className="vl-rise"
        style={{
          height: '100%',
          border: `1px solid ${palette.line}`,
          borderRadius: 16,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.012))',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animationDelay: '500ms',
          boxShadow: '0 30px 80px -40px rgba(0,0,0,0.6)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 22px',
            borderBottom: `1px solid ${palette.line}`,
            background: 'rgba(255,255,255,0.02)',
            fontFamily: fonts.mono,
            fontSize: 14,
            letterSpacing: '0.1em',
            color: palette.muted,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <WindowDots live />
            <span>myapp.app · zero-native shell</span>
          </div>
          <span
            style={{
              color: palette.amber,
              fontSize: 12,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            Zig
          </span>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: 28,
            gap: 24,
            minHeight: 0,
          }}
        >
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: 16,
              color: palette.muted,
              letterSpacing: '0.04em',
            }}
          >
            <span style={{ color: palette.faint }}>›</span> window.zero.
            <span style={{ color: palette.amber }}>invoke</span>(
            <span style={{ color: palette.green }}>"system.stats"</span>)
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gridTemplateRows: 'repeat(2, 1fr)',
              gap: 14,
              flex: 1,
              minHeight: 0,
            }}
          >
            {statCell('Binary', '4.2 MB', 'release · arm64', 0)}
            {statCell('Memory', '78 MB', 'idle · WKWebView', 1)}
            {statCell('Rebuild', '240 ms', 'zig build · cached', 2)}
            {statCell('WebView', 'system', 'untrusted by default', 3)}
          </div>
        </div>
      </div>
    </ProjectGrid>
  </PageFrame>
);

// ────────────────────────────────────────────────────────────────────────────
// 10 — The Stack
// ────────────────────────────────────────────────────────────────────────────
const Stack: Page = () => {
  const cells: Array<{ surface: string; project: string; color: string; note: string }> = [
    { surface: 'Browser', project: 'agent-browser', color: palette.cyan, note: 'See & click' },
    { surface: 'Shell', project: 'just-bash', color: palette.green, note: 'Safely run' },
    { surface: 'Orchestrator', project: 'open-agents', color: palette.violet, note: 'Run, resume' },
    { surface: 'URLs', project: 'portless', color: palette.blue, note: 'Reach services' },
    { surface: 'UI', project: 'json-render', color: palette.pink, note: 'Emit interfaces' },
    { surface: 'Runtime', project: 'zero-native', color: palette.amber, note: 'Ship native' },
  ];

  return (
    <div style={fill}>
      <Style />
      <Grid opacity={0.28} />
      <GradientOrb x="50%" y="55%" size={1500} color={palette.violet} opacity={0.1} />
      <MetaRow index="09" total="10" />

      <div
        style={{
          position: 'absolute',
          top: 200,
          left: 120,
          right: 120,
          display: 'flex',
          flexDirection: 'column',
          gap: 36,
        }}
      >
        <Eyebrow dot={palette.amber} delay={120}>
          02 — Composition
        </Eyebrow>

        <div
          className="vl-rise"
          style={{
            fontFamily: fonts.sans,
            fontSize: 96,
            lineHeight: 0.96,
            letterSpacing: '-0.045em',
            fontWeight: 600,
            color: palette.text,
            animationDelay: '220ms',
          }}
        >
          One agent. Six surfaces.
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            gap: 22,
            height: 440,
            marginTop: 12,
          }}
        >
          {cells.map((c, i) => (
            <div
              key={c.surface}
              className="vl-rise"
              style={{
                position: 'relative',
                border: `1px solid ${palette.line}`,
                borderRadius: 16,
                padding: 28,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
                animationDelay: `${360 + i * 90}ms`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span
                  className="vl-pulse"
                  style={{
                    width: 9,
                    height: 9,
                    background: c.color,
                    color: c.color,
                  }}
                />
                <div
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 16,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: palette.muted,
                  }}
                >
                  {c.surface}
                </div>
              </div>

              <div
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 40,
                  fontWeight: 600,
                  letterSpacing: '-0.025em',
                  color: palette.text,
                }}
              >
                {c.project}
              </div>

              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 14,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: palette.faint,
                }}
              >
                {c.note}
              </div>
            </div>
          ))}
        </div>
      </div>

      <FooterRule note="X · Composition" />
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// 11 — Closer
// ────────────────────────────────────────────────────────────────────────────
const Closer: Page = () => (
  <div style={fill}>
    <Style />
    <Grid opacity={0.3} />
    <GradientOrb x="-10%" y="-5%" size={1600} color={palette.pink} opacity={0.16} />
    <GradientOrb x="110%" y="115%" size={1600} color={palette.cyan} opacity={0.16} />
    <GradientOrb x="55%" y="55%" size={900} color={palette.violet} opacity={0.06} />
    <MetaRow index="10" total="10" />

    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '0 120px',
        gap: 48,
      }}
    >
      <Eyebrow dot={palette.cyan} delay={120}>
        03 — Takeaway
      </Eyebrow>

      <div
        className="vl-rise"
        style={{
          fontFamily: fonts.sans,
          fontSize: 168,
          lineHeight: 0.94,
          letterSpacing: '-0.05em',
          fontWeight: 600,
          color: palette.text,
          animationDelay: '240ms',
        }}
      >
        Open. Composable.
        <br />
        Agent-native.
      </div>

      <div
        className="vl-sweep"
        style={{
          width: 220,
          height: 1,
          background: palette.lineStrong,
          animationDelay: '520ms',
        }}
      />

      <div
        className="vl-fade"
        style={{
          fontFamily: fonts.mono,
          fontSize: 18,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: palette.muted,
          animationDelay: '640ms',
        }}
      >
        ▲ &nbsp;Thank you.
      </div>
    </div>

    <FooterRule note="XI · fin" />
  </div>
);

export default [
  Cover,
  AgentBrowser,
  Thesis,
  JustBash,
  OpenAgents,
  Portless,
  JsonRender,
  ZeroNative,
  Stack,
  Closer,
] satisfies Page[];
