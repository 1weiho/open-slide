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

export const design: DesignSystem = {
  palette: {
    bg: '#dce8ff',
    text: '#050505',
    accent: '#5d7cff',
  },
  fonts: {
    display:
      '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", ui-sans-serif, system-ui, -apple-system, sans-serif',
    body: '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", ui-sans-serif, system-ui, -apple-system, sans-serif',
  },
  typeScale: {
    hero: 168,
    body: 34,
  },
  radius: 8,
};

const ink = '#050505';
const paper = 'rgba(255,255,255,0.88)';
const muted = '#293241';
const faint = 'rgba(255,255,255,0.42)';
const line = 'rgba(255,255,255,0.48)';
const blue = '#5d7cff';
const blueSoft = '#dbeafe';
const green = '#8ee0c4';
const lavender = '#d8c9ff';

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

const Footer = () => {
  const { current, total } = useSlidePageNumber();

  return (
    <footer
      style={{
        position: 'absolute',
        left: 112,
        right: 112,
        bottom: 58,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        color: 'rgba(255,255,255,0.72)',
        fontSize: 22,
        letterSpacing: 0,
      }}
    >
      <span>
        {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
    </footer>
  );
};

const CodexVideoBackdrop = () => (
  <>
    <video
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
          'radial-gradient(ellipse at 50% 10%, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.18) 28%, transparent 54%), linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 42%, rgba(0,0,0,0.36) 73%, rgba(0,0,0,0.96) 100%)',
      }}
    />
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'linear-gradient(90deg, rgba(255,255,255,0.16) 0%, transparent 46%, rgba(255,255,255,0.04) 100%)',
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
        'radial-gradient(circle at 30% 35%, rgba(255,255,255,0.48), transparent 42%), radial-gradient(circle at 70% 55%, rgba(154,184,255,0.34), transparent 48%)',
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
          'radial-gradient(circle at 50% 45%, rgba(255,255,255,0.76), rgba(154,184,255,0.3) 42%, transparent 70%)',
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

const TopBar = ({ tone = 'light' }: { tone?: 'light' | 'dark' }) => (
  <div
    style={{
      position: 'absolute',
      left: 112,
      right: 112,
      top: 54,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      color: '#ffffff',
      fontSize: 24,
      fontWeight: 650,
      textShadow: '0 1px 18px rgba(0,0,0,0.28)',
    }}
  >
    <span style={{ color: tone === 'dark' ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.74)' }}>
      Codex
    </span>
  </div>
);

const PageFrame = ({ children }: { children: ReactNode }) => (
  <main
    style={{
      ...fill,
      background: '#dce8ff',
      color: 'var(--osd-text)',
    }}
  >
    <CodexVideoBackdrop />
    <TopBar />
    {children}
    <Footer />
  </main>
);

const Label = ({ children, tone = 'light' }: { children: ReactNode; tone?: 'light' | 'dark' }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      border: `1px solid ${tone === 'dark' ? 'rgba(255,255,255,0.2)' : line}`,
      borderRadius: 999,
      padding: '12px 18px',
      color: tone === 'dark' ? 'rgba(255,255,255,0.72)' : muted,
      background: tone === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.68)',
      fontSize: 22,
      fontWeight: 650,
    }}
  >
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: 'var(--osd-accent)',
        display: 'inline-block',
      }}
    />
    {children}
  </div>
);

const ProductWindow = ({ wide = false }: { wide?: boolean }) => (
  <section
    style={{
      width: wide ? 760 : 620,
      height: wide ? 430 : 500,
      borderRadius: 'var(--osd-radius)',
      background: paper,
      border: `1px solid ${line}`,
      boxShadow: '0 28px 90px rgba(20, 25, 34, 0.16)',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        height: 58,
        borderBottom: `1px solid ${faint}`,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 22px',
      }}
    >
      <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff6b5f' }} />
      <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f6c85f' }} />
      <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#5bd38b' }} />
      <span style={{ marginLeft: 16, color: muted, fontSize: 17 }}>codex workspace</span>
    </div>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: wide ? '210px 1fr' : '180px 1fr',
        height: 'calc(100% - 58px)',
      }}
    >
      <aside
        style={{
          borderRight: `1px solid ${faint}`,
          padding: 20,
          background: '#fbfbf8',
          display: 'grid',
          alignContent: 'start',
          gap: 12,
        }}
      >
        <NavPill active>Mneme</NavPill>
        <NavPill>slides</NavPill>
        <NavPill>api</NavPill>
        <NavPill>docs</NavPill>
      </aside>
      <div style={{ padding: wide ? 28 : 24, display: 'grid', gap: wide ? 18 : 16 }}>
        <StatusRow color={blue} title="Implement feature" meta="running" />
        <StatusRow color={green} title="Review patch" meta="ready" />
        <StatusRow color={lavender} title="Fix CI" meta="queued" />
        <div
          style={{
            marginTop: wide ? 6 : 2,
            height: wide ? 126 : 160,
            borderRadius: 'var(--osd-radius)',
            background: '#101114',
            padding: 20,
            display: 'grid',
            alignContent: 'center',
            gap: 12,
          }}
        >
          <CodeLine w={72} />
          <CodeLine w={92} tone="blue" />
          <CodeLine w={58} />
          <CodeLine w={84} tone="green" />
        </div>
      </div>
    </div>
  </section>
);

const NavPill = ({ children, active = false }: { children: ReactNode; active?: boolean }) => (
  <div
    style={{
      height: 38,
      borderRadius: 8,
      background: active ? ink : 'transparent',
      color: active ? '#ffffff' : muted,
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      fontSize: 18,
      fontWeight: active ? 750 : 550,
    }}
  >
    {children}
  </div>
);

const StatusRow = ({ color, title, meta }: { color: string; title: string; meta: string }) => (
  <div
    style={{
      minHeight: 64,
      borderRadius: 'var(--osd-radius)',
      border: `1px solid ${faint}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 18px',
      background: paper,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={{ width: 14, height: 14, borderRadius: '50%', background: color }} />
      <span style={{ fontSize: 19, fontWeight: 720 }}>{title}</span>
    </div>
    <span style={{ fontSize: 16, color: muted }}>{meta}</span>
  </div>
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

const FeatureCard = ({
  eyebrow,
  title,
  body,
  color,
}: {
  eyebrow: string;
  title: string;
  body: string;
  color: string;
}) => (
  <section
    style={{
      height: 340,
      borderRadius: 'var(--osd-radius)',
      background: paper,
      border: `1px solid ${line}`,
      padding: 34,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)',
    }}
  >
    <div
      style={{
        width: 58,
        height: 58,
        borderRadius: '50%',
        background: color,
        border: `1px solid ${line}`,
      }}
    />
    <div>
      <div style={{ color: muted, fontSize: 21, fontWeight: 700 }}>{eyebrow}</div>
      <h3 style={{ margin: '10px 0 14px', fontSize: 42, lineHeight: 1.08, fontWeight: 860 }}>
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
        width: 62,
        height: 62,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background: active ? '#ffffff' : blueSoft,
        color: active ? ink : '#1b4d86',
        fontSize: 24,
        fontWeight: 850,
      }}
    >
      {no}
    </div>
    <div>
      <h3 style={{ margin: 0, fontSize: 36, lineHeight: 1.15, fontWeight: 830 }}>{title}</h3>
      <p
        style={{
          margin: '12px 0 0',
          color: active ? 'rgba(255,255,255,0.7)' : muted,
          fontSize: 25,
          lineHeight: 1.38,
        }}
      >
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
    <div style={{ fontSize: 88, lineHeight: 1, fontWeight: 860, letterSpacing: 0 }}>{value}</div>
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
      height: 360,
      borderRadius: 'var(--osd-radius)',
      background: paper,
      border: `1px solid ${line}`,
      padding: 30,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}
  >
    <div
      style={{
        height: 138,
        borderRadius: 'var(--osd-radius)',
        background:
          color === 'black'
            ? '#101114'
            : `linear-gradient(135deg, ${color}, rgba(255,255,255,0.85))`,
        border: `1px solid ${color === 'black' ? '#24262a' : line}`,
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
      <h3 style={{ margin: 0, fontSize: 38, lineHeight: 1.1, fontWeight: 850 }}>{title}</h3>
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
    <code
      style={{
        fontSize: 23,
        lineHeight: 1.28,
        color: green,
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
      }}
    >
      {command}
    </code>
    <span style={{ fontSize: 21, color: 'rgba(255,255,255,0.66)' }}>{label}</span>
  </div>
);

const Cover: Page = () => (
  <PageFrame>
    <SoftHalo />
    <section style={{ position: 'absolute', left: 112, top: 148, width: 940 }}>
      <Label>2026-05-30 official docs</Label>
      <h1
        style={{
          margin: '38px 0 30px',
          fontFamily: 'var(--osd-font-display)',
          fontSize: 128,
          lineHeight: 0.94,
          letterSpacing: 0,
          fontWeight: 880,
        }}
      >
        Codex
        <br />
        工程代理人平台
      </h1>
      <p
        style={{
          margin: 0,
          maxWidth: 760,
          color: 'rgba(5,5,5,0.78)',
          fontSize: 34,
          lineHeight: 1.45,
        }}
      >
        從 App、IDE、CLI、Cloud 到 GitHub / Slack / Linear / CI，串起完整開發工作流。
      </p>
    </section>
    <div style={{ position: 'absolute', right: 148, top: 220 }}>
      <CodexHeroLogo />
    </div>
  </PageFrame>
);

const GettingStarted: Page = () => (
  <PageFrame>
    <section style={{ position: 'absolute', left: 112, top: 152, width: 720 }}>
      <Label>01 / Quickstart</Label>
      <h2 style={{ margin: '38px 0 28px', fontSize: 96, lineHeight: 1.02, fontWeight: 860 }}>
        下載、
        <br />
        登入、選專案。
      </h2>
      <p style={{ margin: 0, color: muted, fontSize: 31, lineHeight: 1.45 }}>
        Codex 包含在 ChatGPT 多數方案中，也能用 API key 登入；App 支援 macOS / Windows，CLI
        支援三大桌面系統。
      </p>
    </section>
    <section
      style={{
        position: 'absolute',
        right: 112,
        top: 176,
        width: 780,
        display: 'grid',
        gap: 18,
      }}
    >
      <CommandLine
        command="curl -fsSL https://chatgpt.com/codex/install.sh | sh"
        label="macOS / Linux CLI"
      />
      <CommandLine command="npm install -g @openai/codex" label="npm global install" />
      <CommandLine command="brew install --cask codex" label="Homebrew desktop install" />
    </section>
  </PageFrame>
);

const Capabilities: Page = () => (
  <PageFrame>
    <section style={{ position: 'absolute', left: 112, right: 112, top: 168 }}>
      <Label>02 / What Codex does</Label>
      <h2 style={{ margin: '34px 0 58px', fontSize: 92, lineHeight: 1.03, fontWeight: 860 }}>
        寫、讀、改、測、審 code
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 26 }}>
        <FeatureCard
          eyebrow="Understand"
          title="理解 codebase"
          body="找入口、讀資料流、整理架構。"
          color={blueSoft}
        />
        <FeatureCard
          eyebrow="Build"
          title="實作與重構"
          body="新增 UI、串 API、migration、rename。"
          color="#f0e8ff"
        />
        <FeatureCard
          eyebrow="Review"
          title="debug 與審查"
          body="跑測試、追 root cause、審 diff。"
          color="#e8f8ef"
        />
      </div>
    </section>
  </PageFrame>
);

const AppSurface: Page = () => (
  <PageFrame>
    <section style={{ position: 'absolute', left: 112, top: 158, width: 720 }}>
      <Label>03 / Codex App</Label>
      <h2 style={{ margin: '38px 0 28px', fontSize: 100, lineHeight: 1.02, fontWeight: 860 }}>
        桌面版是
        <br />
        指揮中心。
      </h2>
      <p style={{ margin: 0, color: muted, fontSize: 31, lineHeight: 1.45 }}>
        管理多個 project、thread、terminal、diff、commit、PR、Skills 與 Automations。
      </p>
    </section>
    <section
      style={{
        position: 'absolute',
        right: 112,
        top: 186,
        width: 760,
        borderRadius: 'var(--osd-radius)',
        background: 'rgba(5,5,5,0.84)',
        border: '1px solid rgba(255,255,255,0.24)',
        color: '#ffffff',
        boxShadow: '0 26px 90px rgba(0,0,0,0.26)',
        padding: '24px 44px',
      }}
    >
      <TimelineStep no="01" title="Local" detail="直接在目前專案資料夾工作。" active />
      <TimelineStep no="02" title="Worktree" detail="隔離分支修改，不干擾主工作區。" active />
      <TimelineStep no="03" title="Cloud" detail="把長任務丟到雲端背景執行。" active />
    </section>
  </PageFrame>
);

const IdeExtension: Page = () => (
  <PageFrame>
    <section style={{ position: 'absolute', left: 112, right: 112, top: 164 }}>
      <Label>04 / IDE Extension</Label>
      <h2 style={{ margin: '34px 0 54px', fontSize: 92, lineHeight: 1.03, fontWeight: 860 }}>
        在編輯器裡直接接續
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }}>
        <SurfaceCard
          title="Editor context"
          detail="引用開啟檔案或選取程式碼，prompt 更短。"
          color={blueSoft}
        />
        <SurfaceCard
          title="Agent / Chat"
          detail="Agent 可改檔跑命令；Chat 用於討論與規劃。"
          color="#e8f8ef"
        />
        <SurfaceCard
          title="Cloud handoff"
          detail="大型任務委派雲端，完成後套用 diff。"
          color="black"
        />
      </div>
    </section>
  </PageFrame>
);

const CliWorkflow: Page = () => (
  <PageFrame>
    <section style={{ position: 'absolute', left: 112, top: 158, width: 660 }}>
      <Label>05 / Codex CLI</Label>
      <h2 style={{ margin: '38px 0 28px', fontSize: 100, lineHeight: 1.02, fontWeight: 860 }}>
        Terminal
        <br />
        工作流。
      </h2>
      <p style={{ margin: 0, color: muted, fontSize: 31, lineHeight: 1.45 }}>
        互動式 TUI、單行 prompt、非互動式 `exec`，都能接到同一個 agent。
      </p>
    </section>
    <section
      style={{
        position: 'absolute',
        right: 112,
        top: 176,
        width: 780,
        display: 'grid',
        gap: 18,
      }}
    >
      <CommandLine command='codex "Explain this codebase"' label="一行 prompt 直接執行" />
      <CommandLine command='codex exec "fix the CI failure"' label="非互動式腳本與自動化" />
      <CommandLine command="/review" label="本地 code review，輸出高優先級 findings" />
    </section>
  </PageFrame>
);

const CloudTasks: Page = () => (
  <PageFrame>
    <section style={{ position: 'absolute', left: 112, top: 154, width: 720 }}>
      <Label>06 / Web & Cloud</Label>
      <h2 style={{ margin: '38px 0 28px', fontSize: 96, lineHeight: 1.02, fontWeight: 860 }}>
        背景平行跑
        <br />
        大型任務。
      </h2>
      <p style={{ margin: 0, color: muted, fontSize: 31, lineHeight: 1.45 }}>
        連 GitHub repo、設定 environment，Codex 在雲端執行並回傳 diff 或 PR。
      </p>
    </section>
    <section
      style={{
        position: 'absolute',
        right: 112,
        top: 170,
        width: 760,
        borderRadius: 'var(--osd-radius)',
        background: paper,
        border: `1px solid ${line}`,
        padding: '18px 42px',
      }}
    >
      <TimelineStep no="01" title="Connect GitHub" detail="選 repo 與 branch。" />
      <TimelineStep no="02" title="Setup environment" detail="定義工具、setup steps、網路權限。" />
      <TimelineStep no="03" title="Review diff / PR" detail="看 logs、追問修改、建立 PR。" />
    </section>
  </PageFrame>
);

const Integrations: Page = () => (
  <PageFrame>
    <section style={{ position: 'absolute', left: 112, right: 112, top: 164 }}>
      <Label>07 / Team integrations</Label>
      <h2 style={{ margin: '34px 0 54px', fontSize: 92, lineHeight: 1.03, fontWeight: 860 }}>
        從團隊工具直接派工
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }}>
        <SurfaceCard
          title="GitHub"
          detail="@codex review / fix，依 AGENTS.md 審查與修正。"
          color={blueSoft}
        />
        <SurfaceCard
          title="Slack"
          detail="在 thread 提到 @Codex，討論直接變 cloud task。"
          color="#e8f8ef"
        />
        <SurfaceCard
          title="Linear"
          detail="issue 指派或 comment 觸發，回報進度與 PR。"
          color="black"
        />
      </div>
    </section>
  </PageFrame>
);

const AutomationSdk: Page = () => (
  <PageFrame>
    <section style={{ position: 'absolute', left: 112, right: 112, top: 170 }}>
      <Label>08 / SDK & CI</Label>
      <h2 style={{ margin: '34px 0 56px', fontSize: 92, lineHeight: 1.03, fontWeight: 860 }}>
        把 Codex 放進自己的系統
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr', gap: 32 }}>
        <MetricBlock
          value="SDK"
          label="TypeScript `startThread()` / `run()` / resume；Python SDK experimental。"
        />
        <MetricBlock
          value="CI"
          label="GitHub Action 跑 `codex exec`，做 review、release prep、migration。"
        />
        <MetricBlock value="Gate" label="把品質檢查、自動修正、報告產出接入 pipeline。" />
      </div>
    </section>
  </PageFrame>
);

const Latest: Page = () => (
  <PageFrame>
    <section style={{ position: 'absolute', left: 112, top: 156, width: 720 }}>
      <Label>09 / Latest highlights</Label>
      <h2 style={{ margin: '38px 0 28px', fontSize: 94, lineHeight: 1.02, fontWeight: 860 }}>
        最新重點：
        <br />
        更像遠端工程隊友。
      </h2>
      <p style={{ margin: 0, color: muted, fontSize: 31, lineHeight: 1.45 }}>
        依官方 changelog，截至 2026-05-29。
      </p>
    </section>
    <section
      style={{
        position: 'absolute',
        right: 112,
        top: 190,
        width: 760,
        display: 'grid',
        gap: 24,
      }}
    >
      <FeatureCard
        eyebrow="Windows"
        title="Computer Use"
        body="Codex 可操作 Windows desktop apps。"
        color={blueSoft}
      />
      <FeatureCard
        eyebrow="Remote"
        title="跨裝置控制"
        body="從行動端或 Mac 啟動與查看 Windows 任務。"
        color="#e8f8ef"
      />
    </section>
  </PageFrame>
);

const Closing: Page = () => (
  <PageFrame>
    <SoftHalo />
    <section style={{ position: 'absolute', left: 112, top: 172, width: 840 }}>
      <Label>10 / Summary</Label>
      <h2 style={{ margin: '38px 0 34px', fontSize: 98, lineHeight: 1.02, fontWeight: 860 }}>
        從工具，
        <br />
        變成工程代理人平台。
      </h2>
      <p style={{ margin: 0, color: muted, fontSize: 31, lineHeight: 1.45 }}>
        個人開發最實用的是 App + CLI + IDE；團隊最有價值的是 Cloud tasks、review、自動化與整合。
      </p>
    </section>
    <section style={{ position: 'absolute', right: 112, top: 206 }}>
      <ProductWindow wide />
    </section>
  </PageFrame>
);

export const meta: SlideMeta = {
  title: 'Codex Introduction',
  createdAt: '2026-05-30T14:11:37.368Z',
};

export default [
  Cover,
  GettingStarted,
  Capabilities,
  AppSurface,
  IdeExtension,
  CliWorkflow,
  CloudTasks,
  Integrations,
  AutomationSdk,
  Latest,
  Closing,
] satisfies Page[];
