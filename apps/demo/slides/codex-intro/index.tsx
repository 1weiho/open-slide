import {
  type DesignSystem,
  type Page,
  type SlideMeta,
  type SlideTransition,
  useSlidePageNumber,
} from '@open-slide/core';
import type { CSSProperties, ReactNode } from 'react';

import codexLogo from './assets/codex-logo.mp4';
import codexFloral from './assets/floral_a.mp4';
import codexCursor from './assets/codex-cursor.svg';
import codexAppScreenshot from './assets/codex-app-screenshot.png';

export const design: DesignSystem = {
  palette: {
    bg: '#0c0c0f',
    text: '#ededed',
    accent: '#7b8aff',
  },
  fonts: {
    display:
      '"Iowan Old Style", "Palatino Linotype", Palatino, Charter, Georgia, "Songti TC", "Times New Roman", serif',
    body: '"Iowan Old Style", "Palatino Linotype", Palatino, Charter, Georgia, "Songti TC", "Times New Roman", serif',
  },
  typeScale: {
    hero: 168,
    body: 34,
  },
  radius: 6,
};

// editorial 排版用：標題與內文走 serif（見 design.fonts），
// eyebrow / footer / 程式碼走 sans / mono 並搭配寬字距。
const SANS = 'ui-sans-serif, system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';
const MONO = '"SF Mono", "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';

const ink = '#ededed';
const paper = '#17181d';
const muted = 'rgba(237,237,237,0.68)';
const faint = 'rgba(255,255,255,0.12)';
const line = 'rgba(255,255,255,0.14)';
const blue = '#7b8aff';
const blueSoft = 'rgba(123,138,255,0.2)';
const green = '#4ade80';

const fill: CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: 'var(--osd-font-body)',
  overflow: 'hidden',
};

const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';

export const transition: SlideTransition = {
  duration: 220,
  exit: {
    duration: 150,
    easing: EASE_IN,
    keyframes: [
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(-5px)' },
    ],
  },
  enter: {
    duration: 220,
    delay: 70,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(7px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
};

const Footer = ({ chapter }: { chapter?: string }) => {
  const { current, total } = useSlidePageNumber();
  const no = String(current).padStart(2, '0');

  return (
    <footer
      style={{
        position: 'absolute',
        left: 112,
        right: 112,
        bottom: 52,
        paddingTop: 18,
        borderTop: '1px dotted rgba(237,237,237,0.22)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: SANS,
        fontSize: 16,
        fontWeight: 600,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: 'rgba(237,237,237,0.42)',
      }}
    >
      <span>{chapter ? `Codex · No. ${no} · ${chapter}` : `Codex · No. ${no}`}</span>
      <span>
        {no} / {String(total).padStart(2, '0')}
      </span>
    </footer>
  );
};

const CodexVideoBackdrop = () => (
  <>
    <video
      aria-hidden="true"
      src={codexFloral}
      autoPlay
      loop
      muted
      playsInline
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      }}
    />
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(180deg, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.1) 32%, rgba(0,0,0,0.18) 62%, rgba(0,0,0,0.88) 100%)',
      }}
    />
  </>
);

const SoftHalo = () => (
  <div
    aria-hidden="true"
    style={{
      position: 'absolute',
      width: 900,
      height: 520,
      right: 92,
      top: 184,
      borderRadius: 46,
      background:
        'radial-gradient(circle at 30% 35%, rgba(123,138,255,0.5), transparent 42%), radial-gradient(circle at 70% 55%, rgba(168,108,255,0.3), transparent 48%)',
      filter: 'blur(12px)',
      opacity: 0.72,
    }}
  />
);

const CodexLogoAnimation = ({
  size,
  radius,
  shadow,
}: {
  size: number;
  radius: number;
  shadow: string;
}) => (
  <div
    aria-label="Codex logo animation"
    role="img"
    style={{
      width: size,
      height: size,
      borderRadius: radius,
      overflow: 'hidden',
      boxShadow: shadow,
      background: 'rgba(255,255,255,0.18)',
    }}
  >
    <video
      aria-hidden="true"
      src={codexLogo}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      onCanPlay={(event) => {
        void event.currentTarget.play().catch(() => undefined);
      }}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    />
  </div>
);

const CodexHeroLogo = () => (
  <div
    style={{
      position: 'relative',
      width: 560,
      height: 560,
      display: 'grid',
      placeItems: 'center',
    }}
  >
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 24,
        borderRadius: 140,
        background:
          'radial-gradient(circle at 50% 45%, rgba(123,138,255,0.6), rgba(168,108,255,0.25) 42%, transparent 70%)',
        filter: 'blur(26px)',
        opacity: 0.86,
      }}
    />
    <CodexLogoAnimation
      size={430}
      radius={112}
      shadow="0 42px 110px rgba(35, 54, 112, 0.35), 0 10px 42px rgba(255,255,255,0.3)"
    />
  </div>
);

const PageFrame = ({ chapter, children }: { chapter?: string; children: ReactNode }) => (
  <main
    style={{
      ...fill,
      background: 'var(--osd-bg)',
      color: 'var(--osd-text)',
    }}
  >
    <CodexVideoBackdrop />
    {children}
    <Footer chapter={chapter} />
  </main>
);

// Field Guide 風 eyebrow：寬字距大寫小字，無圓點藥丸。
const Label = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      fontFamily: SANS,
      fontSize: 19,
      fontWeight: 600,
      letterSpacing: '0.24em',
      textTransform: 'uppercase',
      color: 'rgba(237,237,237,0.5)',
    }}
  >
    {children}
  </div>
);

// 區段分類標籤（編號已移至 footer 的編目，避免與頁碼重複/脫鉤）。
const SectionLabel = ({ children }: { children: ReactNode }) => <Label>{children}</Label>;

const DemoImageCard = () => (
  <section
    style={{
      width: 880,
      aspectRatio: '1105 / 705',
      borderRadius: 'var(--osd-radius)',
      background: '#050505',
      border: '1px solid rgba(255,255,255,0.26)',
      boxShadow: '0 28px 90px rgba(20, 25, 34, 0.2)',
      overflow: 'hidden',
    }}
  >
    <img
      src={codexAppScreenshot}
      alt="Codex app showing an agent thread and reviewed code changes"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        display: 'block',
      }}
    />
  </section>
);

const CodeLine = ({ w, tone = 'neutral' }: { w: number; tone?: 'neutral' | 'blue' | 'green' }) => (
  <span
    style={{
      width: `${w}%`,
      height: 12,
      borderRadius: 999,
      background: tone === 'blue' ? blue : tone === 'green' ? green : 'rgba(255,255,255,0.32)',
      display: 'block',
    }}
  />
);

const LaptopComputerAndIpadSymbol = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 96 76"
    style={{
      width: 78,
      height: 62,
      display: 'block',
    }}
  >
    <g fill="none" stroke={blue} strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="17" width="54" height="35" rx="5" strokeWidth="5.2" />
      <path
        d="M3 60h67l-6 8H9l-6-8Z"
        fill="rgba(93,124,255,0.14)"
        strokeWidth="5.2"
      />
      <rect x="67" y="9" width="21" height="53" rx="6" strokeWidth="5.2" />
      <path d="M74 54h7" strokeWidth="4.2" />
    </g>
  </svg>
);

const FeatureCard = ({
  eyebrow,
  title,
  body,
  color,
  icon,
  alignTop = false,
  cardHeight = 340,
}: {
  eyebrow: string;
  title: string;
  body: string;
  color: string;
  icon?: 'cursor' | 'devices';
  alignTop?: boolean;
  cardHeight?: number;
}) => (
  <section
    style={{
      minHeight: cardHeight,
      borderRadius: 'var(--osd-radius)',
      background: paper,
      border: `1px solid ${line}`,
      padding: 34,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: alignTop ? 'flex-start' : 'space-between',
      gap: alignTop ? 28 : undefined,
      boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
    }}
  >
    {icon === 'cursor' ? (
      <img
        src={codexCursor}
        alt=""
        aria-hidden="true"
        style={{
          width: 74,
          height: 74,
          flexShrink: 0,
          borderRadius: 18,
          objectFit: 'cover',
          boxShadow: '0 14px 34px rgba(72, 86, 210, 0.18)',
        }}
      />
    ) : icon === 'devices' ? (
      <div
        style={{
          width: 74,
          height: 74,
          flexShrink: 0,
          borderRadius: 18,
          display: 'grid',
          placeItems: 'center',
          background: 'rgba(255,255,255,0.62)',
          border: `1px solid ${line}`,
          boxShadow: '0 14px 34px rgba(72, 86, 210, 0.18)',
        }}
      >
        <LaptopComputerAndIpadSymbol />
      </div>
    ) : (
      <div
        style={{
          width: 58,
          height: 58,
          flexShrink: 0,
          borderRadius: '50%',
          background: color,
          border: `1px solid ${line}`,
        }}
      />
    )}
    <div>
      <div
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontStyle: 'italic',
          color: blue,
          fontSize: 25,
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        {eyebrow}
      </div>
      <h3 style={{ margin: '10px 0 14px', fontSize: 42, lineHeight: 1.1, fontWeight: 650, letterSpacing: '-0.01em' }}>
        {title}
      </h3>
      <p style={{ margin: 0, color: muted, fontSize: 25, lineHeight: 1.42 }}>{body}</p>
    </div>
  </section>
);

const TimelineStep = ({
  no,
  title,
  detail,
  active = false,
}: {
  no: string;
  title: string;
  detail: string;
  active?: boolean;
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '86px 1fr',
      gap: 26,
      alignItems: 'start',
      padding: '26px 0',
      borderTop: `1px solid ${active ? 'rgba(255,255,255,0.3)' : faint}`,
    }}
  >
    <div
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontStyle: 'italic',
        fontSize: 44,
        fontWeight: 600,
        lineHeight: 1,
        color: blue,
        paddingTop: 2,
      }}
    >
      {no}
    </div>
    <div>
      <h3 style={{ margin: 0, fontSize: 36, lineHeight: 1.15, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</h3>
      <p style={{ margin: '12px 0 0', color: active ? 'rgba(255,255,255,0.7)' : muted, fontSize: 25, lineHeight: 1.38 }}>
        {detail}
      </p>
    </div>
  </div>
);

const MetricBlock = ({ value, label }: { value: string; label: string }) => (
  <div
    style={{
      borderTop: `1px solid ${line}`,
      paddingTop: 28,
    }}
  >
    <div style={{ fontSize: 88, lineHeight: 1, fontWeight: 650, letterSpacing: '-0.02em' }}>{value}</div>
    <p style={{ margin: '18px 0 0', color: muted, fontSize: 26, lineHeight: 1.35 }}>{label}</p>
  </div>
);

const SurfaceCard = ({
  title,
  detail,
  color,
}: {
  title: string;
  detail: string;
  color: string;
}) => (
  <section
    style={{
      height: 396,
      borderRadius: 'var(--osd-radius)',
      background: paper,
      border: `1px solid ${line}`,
      boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
      padding: 30,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      gap: 26,
    }}
  >
    <div
      style={{
        height: 138,
        flexShrink: 0,
        borderRadius: 'var(--osd-radius)',
        background:
          color === 'black'
            ? '#101114'
            : `linear-gradient(135deg, ${color}, rgba(255,255,255,0.04))`,
        border: `1px solid ${line}`,
        padding: 18,
        display: 'grid',
        gap: 10,
        alignContent: 'center',
      }}
    >
      <CodeLine w={88} tone={color === 'black' ? 'neutral' : 'blue'} />
      <CodeLine w={54} tone={color === 'black' ? 'green' : 'neutral'} />
      <CodeLine w={72} tone={color === 'black' ? 'blue' : 'green'} />
    </div>
    <div>
      <h3 style={{ margin: 0, fontSize: 38, lineHeight: 1.1, fontWeight: 650, letterSpacing: '-0.01em' }}>{title}</h3>
      <p style={{ margin: '14px 0 0', color: muted, fontSize: 24, lineHeight: 1.36 }}>{detail}</p>
    </div>
  </section>
);

const CommandLine = ({ command, label }: { command: string; label: string }) => (
  <div
    style={{
      borderRadius: 'var(--osd-radius)',
      background: 'rgba(5,5,5,0.9)',
      color: '#ffffff',
      border: '1px solid rgba(255,255,255,0.22)',
      padding: '22px 24px',
      display: 'grid',
      gap: 10,
    }}
  >
    {/* @slide-comment id="c-1a83d2ad" ts="2026-06-01T04:35:35.732Z" text="eyJub3RlIjoi5b6A5LiL6bueIn0" */}
    <code
      style={{
        fontFamily: MONO,
        fontSize: 22,
        lineHeight: 1.28,
        color: green,
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
      }}
    >
      {command}
    </code>
    <span style={{ fontFamily: SANS, fontSize: 19, letterSpacing: '0.04em', color: 'rgba(255,255,255,0.6)' }}>{label}</span>
  </div>
);

// ─── 新增 helper：比較表格列 ────────────────────────────────────────────────
const CompareRow = ({ chat, codex }: { chat: string; codex: string }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: `1px solid ${line}` }}>
    <div
      style={{
        padding: '16px 28px',
        fontSize: 25,
        color: muted,
        lineHeight: 1.35,
        borderRight: `1px solid ${line}`,
      }}
    >
      {chat}
    </div>
    <div style={{ padding: '16px 28px', fontSize: 25, color: ink, fontWeight: 650, lineHeight: 1.35 }}>
      {codex}
    </div>
  </div>
);

// ─── 封面 ────────────────────────────────────────────────────────────────────
const Cover: Page = () => (
  <PageFrame chapter="Cover">
    <SoftHalo />
    <section
      style={{
        position: 'absolute',
        left: 112,
        top: 120,
        bottom: 120,
        width: 940,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Label>OpenAI · 2026</Label>
      <h1
        style={{
          margin: '38px 0 30px',
          fontFamily: 'var(--osd-font-display)',
          fontSize: 128,
          lineHeight: 0.96,
          letterSpacing: '-0.03em',
          fontWeight: 700,
        }}
      >
        Codex
        <br />
        Agent Platform
      </h1>
      <p style={{ margin: 0, maxWidth: 780, color: 'rgba(237,237,237,0.72)', fontSize: 34, lineHeight: 1.48 }}>
        You talk, it codes. Not just AI chat — an agent that actually gets its hands dirty.
      </p>
    </section>
    <div
      style={{
        position: 'absolute',
        right: 148,
        top: '50%',
        transform: 'translateY(-50%)',
      }}
    >
      <CodexHeroLogo />
    </div>
  </PageFrame>
);

// ─── 01 Codex 是什麼 ─────────────────────────────────────────────────────────
const WhatIsCodex: Page = () => (
  <PageFrame chapter="Definition">
    <section
      style={{
        position: 'absolute',
        left: 112,
        top: 120,
        bottom: 120,
        width: 700,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <SectionLabel>What is Codex</SectionLabel>
      <h2 style={{ margin: '38px 0 28px', fontSize: 88, lineHeight: 1.02, fontWeight: 650, letterSpacing: '-0.025em' }}>
        An AI <em style={{ color: '#bcc4ff', fontStyle: 'italic', textShadow: '0 0 1px rgba(0,0,0,0.7), 0 2px 18px rgba(0,0,0,0.6)' }}>agent</em>,
        <br />
        not a chatbot
      </h2>
      <p style={{ margin: 0, color: muted, fontSize: 31, lineHeight: 1.48 }}>
        Regular AI chat gives you answers — you still do the work.
        <br />
        Codex <strong style={{ color: ink }}>takes action</strong>: reads code,
        makes changes, runs tests, and sends commits — all on its own.
      </p>
    </section>
    <section
      style={{
        position: 'absolute',
        right: 112,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 820,
      }}
    >
      <div
        style={{
          borderRadius: 'var(--osd-radius)',
          background: paper,
          border: `1px solid ${line}`,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'rgba(255,255,255,0.04)',
            borderBottom: `1px solid ${line}`,
          }}
        >
          <div
            style={{
              padding: '18px 28px',
              fontSize: 24,
              fontWeight: 750,
              color: muted,
              borderRight: `1px solid ${line}`,
            }}
          >
            Regular AI Chat
          </div>
          <div style={{ padding: '18px 28px', fontSize: 24, fontWeight: 750, color: blue }}>
            Codex Agent
          </div>
        </div>
        <CompareRow chat="Tells you how to write it" codex="Writes it for you" />
        <CompareRow chat="Tells you how to test" codex="Runs tests automatically" />
        <CompareRow chat="Tells you the git command" codex="Commits and opens a PR" />
        <CompareRow chat="One question, one answer" codex="End-to-end task ownership" />
      </div>
    </section>
  </PageFrame>
);

// ─── 02 它怎麼運作 ───────────────────────────────────────────────────────────
const HowItWorks: Page = () => (
  <PageFrame chapter="The Loop">
    <section
      style={{
        position: 'absolute',
        left: 112,
        right: 112,
        top: 120,
        bottom: 120,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <SectionLabel>How it works</SectionLabel>
      <h2 style={{ margin: '34px 0 52px', fontSize: 88, lineHeight: 1.03, fontWeight: 650, letterSpacing: '-0.025em' }}>
        Say what you need, Codex gets it <em style={{ color: '#bcc4ff', fontStyle: 'italic', textShadow: '0 0 1px rgba(0,0,0,0.7), 0 2px 18px rgba(0,0,0,0.6)' }}>done</em>
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
        <FeatureCard
          eyebrow="Step 01"
          title="Describe the task"
          body="Use plain language — no need to know any syntax."
          color={blueSoft}
          alignTop
          cardHeight={340}
        />
        <FeatureCard
          eyebrow="Step 02"
          title="Codex reads the code"
          body="Scans your repo and understands the existing structure."
          color="#f0e8ff"
          alignTop
          cardHeight={340}
        />
        <FeatureCard
          eyebrow="Step 03"
          title="Execute and test"
          body="Makes changes, runs tests, and confirms nothing breaks."
          color="#e8f8ef"
          alignTop
          cardHeight={340}
        />
        <FeatureCard
          eyebrow="Step 04"
          title="Deliver results"
          body="Opens a diff or PR, ready to apply to your workspace."
          color={blueSoft}
          alignTop
          cardHeight={340}
        />
      </div>
    </section>
  </PageFrame>
);

// ─── 03 四種入口 ─────────────────────────────────────────────────────────────
const TheSurfaces: Page = () => (
  <PageFrame chapter="Surfaces">
    <section
      style={{
        position: 'absolute',
        left: 112,
        right: 112,
        top: 120,
        bottom: 120,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <SectionLabel>Where to use it</SectionLabel>
      <h2 style={{ margin: '34px 0 52px', fontSize: 88, lineHeight: 1.03, fontWeight: 650, letterSpacing: '-0.025em' }}>
        Four surfaces, <em style={{ color: '#bcc4ff', fontStyle: 'italic', textShadow: '0 0 1px rgba(0,0,0,0.7), 0 2px 18px rgba(0,0,0,0.6)' }}>one Codex</em>
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
        <SurfaceCard
          title="Desktop App"
          detail="A GUI command center for managing tasks, reviewing diffs, and tracking progress."
          color={blueSoft}
        />
        <SurfaceCard
          title="IDE Extension"
          detail="Call Codex from VS Code or JetBrains without leaving your editor."
          color="#e8f8ef"
        />
        <SurfaceCard
          title="CLI"
          detail="Run tasks with a single command — great for scripts and automation."
          color="#f0e8ff"
        />
        <SurfaceCard
          title="Web + Cloud"
          detail="Offload big tasks to the cloud and come back when they're done."
          color="black"
        />
      </div>
    </section>
  </PageFrame>
);

// ─── 04 桌面 App ─────────────────────────────────────────────────────────────
const AppSurface: Page = () => (
  <PageFrame chapter="Desktop">
    <section
      style={{
        position: 'absolute',
        left: 112,
        top: 120,
        bottom: 120,
        width: 720,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <SectionLabel>Desktop App</SectionLabel>
      <h2 style={{ margin: '38px 0 28px', fontSize: 96, lineHeight: 1.02, fontWeight: 650, letterSpacing: '-0.025em' }}>
        Use Codex
        <br />
        without touching <em style={{ color: '#bcc4ff', fontStyle: 'italic', textShadow: '0 0 1px rgba(0,0,0,0.7), 0 2px 18px rgba(0,0,0,0.6)' }}>code</em>
      </h2>
      <p style={{ margin: 0, color: muted, fontSize: 31, lineHeight: 1.45 }}>
        The desktop app gives you a full GUI: send tasks, watch progress in real time, review diffs, and decide whether to apply changes — no command line needed.
      </p>
    </section>
    <section
      style={{
        position: 'absolute',
        right: 112,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 760,
        borderRadius: 'var(--osd-radius)',
        background: paper,
        border: `1px solid ${line}`,
        color: '#ffffff',
        boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
        padding: '24px 44px',
      }}
    >
      <TimelineStep no="01" title="Send a task" detail='Describe what you want: "Add a login page" or "Fix this bug"' active />
      <TimelineStep no="02" title="Watch progress" detail="See in real time which files Codex is reading and what changes it's making." active />
      <TimelineStep no="03" title="Review and apply" detail="Review the diff and apply with one click, or send it back." active />
    </section>
  </PageFrame>
);

// ─── 05 CLI 終端機 ───────────────────────────────────────────────────────────
const CliWorkflow: Page = () => (
  <PageFrame chapter="CLI">
    <section
      style={{
        position: 'absolute',
        left: 112,
        top: 120,
        bottom: 120,
        width: 660,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <SectionLabel>CLI</SectionLabel>
      <h2 style={{ margin: '38px 0 28px', fontSize: 100, lineHeight: 1.02, fontWeight: 650, letterSpacing: '-0.025em' }}>
        One command,
        <br />
        <em style={{ color: '#bcc4ff', fontStyle: 'italic', textShadow: '0 0 1px rgba(0,0,0,0.7), 0 2px 18px rgba(0,0,0,0.6)' }}>automatically</em> done.
      </h2>
      <p style={{ margin: 0, color: muted, fontSize: 31, lineHeight: 1.45 }}>
        Skip the app — run Codex from your terminal, or plug it into your CI pipeline.
      </p>
    </section>
    <section
      style={{
        position: 'absolute',
        right: 112,
        top: 120,
        bottom: 120,
        width: 780,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 18,
      }}
    >
      <CommandLine command='codex "Explain what this codebase does"' label="Let Codex map out your entire codebase" />
      <CommandLine command='codex "Fix the failing CI tests"' label="Auto-find the bug, patch the code, and run tests" />
      <CommandLine command='codex exec "Generate release notes for this week"' label="Scriptable, repeatable automation" />
    </section>
  </PageFrame>
);

// ─── 06 雲端執行 ─────────────────────────────────────────────────────────────
const CloudTasks: Page = () => (
  <PageFrame chapter="Cloud">
    <section
      style={{
        position: 'absolute',
        left: 112,
        top: 120,
        bottom: 120,
        width: 720,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <SectionLabel>Cloud</SectionLabel>
      <h2 style={{ margin: '38px 0 28px', fontSize: 92, lineHeight: 1.02, fontWeight: 650, letterSpacing: '-0.025em' }}>
        Big tasks,
        <br />
        run in the <em style={{ color: '#bcc4ff', fontStyle: 'italic', textShadow: '0 0 1px rgba(0,0,0,0.7), 0 2px 18px rgba(0,0,0,0.6)' }}>cloud</em>.
      </h2>
      <p style={{ margin: 0, color: muted, fontSize: 31, lineHeight: 1.45 }}>
        Connect your GitHub repo and let Codex handle long-running tasks in the cloud. No need to stay at your desk — check back when it's done.
      </p>
    </section>
    <section
      style={{
        position: 'absolute',
        right: 112,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 760,
        borderRadius: 'var(--osd-radius)',
        background: paper,
        border: `1px solid ${line}`,
        boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
        padding: '18px 42px',
      }}
    >
      <TimelineStep no="01" title="Connect your GitHub repo" detail="Choose the project and branch Codex should work with." />
      <TimelineStep no="02" title="Configure the environment" detail="Specify the tools, commands, and network access Codex needs." />
      <TimelineStep no="03" title="Wait for the PR" detail="Codex runs in the cloud, opens a PR when done, and waits for your review." />
    </section>
  </PageFrame>
);

// ─── 07 真實場景 ─────────────────────────────────────────────────────────────
const RealScenario: Page = () => (
  <PageFrame chapter="Transcript">
    <section
      style={{
        position: 'absolute',
        left: 112,
        top: 120,
        bottom: 120,
        width: 680,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <SectionLabel>Real-world example</SectionLabel>
      <h2 style={{ margin: '38px 0 28px', fontSize: 88, lineHeight: 1.04, fontWeight: 650, letterSpacing: '-0.025em' }}>
        One message,
        <br />
        the whole job <em style={{ color: '#bcc4ff', fontStyle: 'italic', textShadow: '0 0 1px rgba(0,0,0,0.7), 0 2px 18px rgba(0,0,0,0.6)' }}>done</em>
      </h2>
      <p style={{ margin: 0, color: muted, fontSize: 30, lineHeight: 1.48 }}>
        Take the Slack integration: never leave your conversation to assign tasks — just mention Codex and wait for the result.
      </p>
    </section>
    <section
      style={{
        position: 'absolute',
        right: 112,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 820,
        borderRadius: 'var(--osd-radius)',
        background: paper,
        border: `1px solid ${line}`,
        color: '#ffffff',
        boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
        padding: '24px 44px',
      }}
    >
      <TimelineStep no="01" title="You say in Slack: @Codex fix the checkout payment bug" detail="Plain language — no need to explain where the code lives." active />
      <TimelineStep no="02" title="Codex reads the repo and locates the issue" detail="Automatically scans GitHub to find the root cause." active />
      <TimelineStep no="03" title="Patches the code and runs tests" detail="Fixes the bug and verifies nothing else broke." active />
      <TimelineStep no="04" title="Opens a Pull Request for your review" detail="Your only job: review the diff and merge." active />
    </section>
  </PageFrame>
);

// ─── 08 團隊整合 ─────────────────────────────────────────────────────────────
const TeamIntegrations: Page = () => (
  <PageFrame chapter="Integrations">
    <section
      style={{
        position: 'absolute',
        left: 112,
        right: 112,
        top: 120,
        bottom: 120,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <SectionLabel>Team integrations</SectionLabel>
      <h2 style={{ margin: '34px 0 54px', fontSize: 88, lineHeight: 1.03, fontWeight: 650, letterSpacing: '-0.025em' }}>
        Assign tasks from
        <br />
        where you <em style={{ color: '#bcc4ff', fontStyle: 'italic', textShadow: '0 0 1px rgba(0,0,0,0.7), 0 2px 18px rgba(0,0,0,0.6)' }}>already</em> work
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }}>
        <FeatureCard
          eyebrow="GitHub"
          title="@codex review this"
          body="Comment @codex on a PR and it will review or fix the code, guided by your AGENTS.md."
          color={blueSoft}
          alignTop
          cardHeight={340}
        />
        <FeatureCard
          eyebrow="Slack"
          title="Your message is the task"
          body="Mention @Codex in a channel or DM — that message instantly becomes a cloud task."
          color="#e8f8ef"
          alignTop
          cardHeight={340}
        />
        <FeatureCard
          eyebrow="Linear"
          title="Tickets become PRs"
          body="Assign an issue to Codex and it reads the ticket, writes the code, opens a PR, and reports back."
          color="#f0e8ff"
          alignTop
          cardHeight={340}
        />
      </div>
    </section>
  </PageFrame>
);

// ─── 09 開始使用 ─────────────────────────────────────────────────────────────
const GetStarted: Page = () => (
  <PageFrame chapter="Start">
    <section
      style={{
        position: 'absolute',
        left: 112,
        top: 120,
        bottom: 120,
        width: 700,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <SectionLabel>Get started</SectionLabel>
      <h2 style={{ margin: '38px 0 28px', fontSize: 88, lineHeight: 1.02, fontWeight: 650, letterSpacing: '-0.025em' }}>
        Three steps
        <br />
        to your
        <br />
        <em style={{ color: '#bcc4ff', fontStyle: 'italic', textShadow: '0 0 1px rgba(0,0,0,0.7), 0 2px 18px rgba(0,0,0,0.6)' }}>first task</em>
      </h2>
      <p style={{ margin: 0, color: muted, fontSize: 30, lineHeight: 1.45 }}>
        Available as a desktop app (macOS / Windows) or CLI (macOS / Linux / Windows).
      </p>
    </section>
    <section
      style={{
        position: 'absolute',
        right: 112,
        top: 120,
        bottom: 120,
        width: 780,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 18,
      }}
    >
      <CommandLine command="curl -fsSL https://chatgpt.com/codex/install.sh | sh" label="① Install the CLI — or download the desktop app (macOS / Windows)" />
      <CommandLine command="codex login" label="② Sign in — works with a ChatGPT Plus account or OpenAI API key" />
      <CommandLine command='codex "Walk me through what this repo does"' label="③ Send your first task and Codex gets to work" />
    </section>
  </PageFrame>
);

// ─── 10 總結 ─────────────────────────────────────────────────────────────────
const Closing: Page = () => (
  <PageFrame chapter="Summary">
    <SoftHalo />
    <section
      style={{
        position: 'absolute',
        left: 112,
        top: 120,
        bottom: 120,
        width: 840,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <SectionLabel>Summary</SectionLabel>
      <h2 style={{ margin: '38px 0 34px', fontSize: 98, lineHeight: 1.02, fontWeight: 650, letterSpacing: '-0.025em' }}>
        More than a tool —
        <br />
        your <em style={{ color: '#bcc4ff', fontStyle: 'italic', textShadow: '0 0 1px rgba(0,0,0,0.7), 0 2px 18px rgba(0,0,0,0.6)' }}>coding partner</em>.
      </h2>
      <p style={{ margin: 0, color: muted, fontSize: 31, lineHeight: 1.45 }}>
        Codex closes the gap between "say what you want" and "it's done." Individuals get the most from App + CLI + IDE; teams scale with Cloud tasks, code review, and workflow integrations.
      </p>
    </section>
    <section
      style={{
        position: 'absolute',
        right: 80,
        top: '50%',
        transform: 'translateY(-50%)',
      }}
    >
      <DemoImageCard />
    </section>
  </PageFrame>
);

export const meta: SlideMeta = {
  title: 'Codex Introduction',
  createdAt: '2026-05-30T14:11:37.368Z',
};

export default [
  Cover,
  WhatIsCodex,
  HowItWorks,
  TheSurfaces,
  AppSurface,
  CliWorkflow,
  CloudTasks,
  RealScenario,
  TeamIntegrations,
  GetStarted,
  Closing,
] satisfies Page[];
