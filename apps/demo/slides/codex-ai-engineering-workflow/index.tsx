import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';
import { useSlidePageNumber } from '@open-slide/core';
import { type CSSProperties, type ReactNode, useCallback, useEffect, useRef } from 'react';
import teamPortraitPhoto from '../my-story-30min-figma/assets/cover-portrait.jpeg';
import agentSkillsArticleScreenshot from './assets/agent-skills-article-screenshot.png';
import banfengSchedulePhoto from './assets/banfeng-schedule.jpg';
import brainstormingSkillWindow from './assets/brainstorming-skill-window.png';
import builtInRetinaDisplayVideo from './assets/built-in-retina-display.mp4';
import codexAppInterface from './assets/codex-app-automation-window-cropped.png';
import constitutionMdWindow from './assets/constitution-md-window.png';
import fdeAnthropic from './assets/fde-anthropic.png';
import fdeBaseten from './assets/fde-baseten.png';
import fdePalantir from './assets/fde-palantir.png';
import fdeScale from './assets/fde-scale.png';
import gitCodexDemoVideo from './assets/git-codex-demo.mp4';
import jensenHuangPhoto from './assets/jensen-huang-computex.jpg';
import liTianyuPhoto from './assets/li-tianyu-photo.jpg';
import noSkillsVideo from './assets/no-skills.mp4';
import specMdWindow from './assets/spec-md-window.png';
import superpowerSkillsVideo from './assets/superpower-skills.mp4';

type DialogueThread = {
  label: string;
  speaker: string;
  body?: string;
  note?: string;
  dark?: boolean;
  messages?: { role: '人' | 'Agent'; text: string }[];
};

export const design: DesignSystem = {
  palette: { bg: '#f8fafc', text: '#111827', accent: '#4f8cff' },
  fonts: {
    display: '"Inter", "Noto Sans TC", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    body: '"Inter", "Noto Sans TC", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },
  typeScale: { hero: 104, body: 28 },
  radius: 8,
};

type SlideSpec = {
  eyebrow: string;
  title: string;
  titleMaxWidth?: number;
  titleNoWrap?: boolean;
  titleSize?: number;
  body?: string;
  bodyMaxWidth?: number;
  bodyNoWrap?: boolean;
  bullets?: string[];
  cards?: { label: string; title: string; body: string }[];
  specItems?: { label: string; title: string; body: string; example: string }[];
  dialogues?: DialogueThread[];
  sourceMeta?: { label: string; value: string }[];
  fileScreenshots?: { label: string; title: string; image: string; body: string }[];
  jobScreenshots?: { company: string; role: string; image: string; source: string }[];
  skillRoutes?: { label: string; title: string; body: string; active?: boolean }[];
  image?: string;
  video?: string;
  code?: string[];
  quote?: string;
  diagram?: string[];
  section?: string;
  aside?: string;
  accent?: string;
  layout?:
    | 'cover'
    | 'team'
    | 'section'
    | 'quote-only'
    | 'agenda'
    | 'blank'
    | 'one-liner'
    | 'next-step'
    | 'codex-ui'
    | 'spec-driven'
    | 'constitution'
    | 'article-source'
    | 'dialogue'
    | 'brainstorming-skill'
    | 'skill-video-comparison'
    | 'git-command-workbench'
    | 'two-file-screenshots'
    | 'spec-overload'
    | 'fde-market-signal'
    | 'html-human-bridge'
    | 'spec-to-artifact'
    | 'artifact-feedback-loop'
    | 'skill-routing'
    | 'skill-script-bundling'
    | 'skill-md-structure'
    | 'ios-goal-track'
    | 'acceptance-checks-board'
    | 'project-goal-checklist'
    | 'ios-skill-pipeline'
    | 'demo-runway'
    | 'closing-operating-system'
    | 'cards'
    | 'code'
    | 'diagram'
    | 'default';
};

const palette = {
  bg: '#F8FAFC',
  canvas: '#FFFFFF',
  text: '#111827',
  muted: '#64748B',
  faint: '#94A3B8',
  border: '#DDE7F3',
  panel: '#EFF6FF',
  panelHi: '#E0F2FE',
  accent: '#4F8CFF',
  green: '#10A37F',
  ink: '#0B1220',
  amber: '#F59E0B',
  rose: '#F43F5E',
};

const SANS = '"Inter", "Noto Sans TC", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const MONO = '"SF Mono", "JetBrains Mono", Menlo, Consolas, monospace';

const pageBase = {
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  background: palette.bg,
  color: palette.text,
  fontFamily: SANS,
  padding: '82px 108px',
} as const;

const keyframes = `
@keyframes deckFadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes deckGlow {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.36; }
  50% { transform: translate(-50%, -50%) scale(1.05); opacity: 0.56; }
}
@keyframes deckScan {
  from { transform: translateX(-24%); opacity: 0.28; }
  to { transform: translateX(124%); opacity: 0; }
}
`;

const Style = () => <style>{keyframes}</style>;

const SoftGlow = ({
  x,
  y,
  size = 760,
  color = '79, 140, 255',
}: {
  x: string;
  y: string;
  size?: number;
  color?: string;
}) => (
  <div
    aria-hidden
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size,
      transform: 'translate(-50%, -50%)',
      borderRadius: '50%',
      background: `radial-gradient(circle, rgba(${color}, 0.18), rgba(${color}, 0) 68%)`,
      filter: 'blur(8px)',
      animation: 'deckGlow 8s ease-in-out infinite',
      pointerEvents: 'none',
    }}
  />
);

const Footer = ({ section }: { section?: string }) => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={{
        position: 'absolute',
        left: 108,
        right: 108,
        bottom: 42,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: MONO,
        fontSize: 18,
        letterSpacing: '0.04em',
        color: palette.faint,
      }}
    >
      <span>{section ?? 'codex://workflow'}</span>
      <span>
        {String(current).padStart(2, '0')}{' '}
        <span style={{ opacity: 0.45 }}>/ {String(total).padStart(2, '0')}</span>
      </span>
    </div>
  );
};

const AutoPlayVideo = ({ src, style }: { src: string; style: CSSProperties }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const play = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.muted = true;
    void video.play().catch(() => undefined);
  }, []);

  useEffect(() => {
    play();
    const retry = window.setTimeout(play, 160);

    return () => {
      window.clearTimeout(retry);
    };
  }, [play]);

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      onCanPlay={() => play()}
      style={style}
    />
  );
};

const Eyebrow = ({ children, color = palette.green }: { children: ReactNode; color?: string }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      width: 'fit-content',
      padding: '9px 14px',
      borderRadius: 999,
      border: `1px solid ${palette.border}`,
      background: palette.canvas,
      fontFamily: MONO,
      fontSize: 17,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: palette.muted,
    }}
  >
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: color,
        boxShadow: '0 0 0 6px rgba(79, 140, 255, 0.12)',
      }}
    />
    {children}
  </div>
);

const Title = ({
  children,
  size = 78,
  maxWidth = 1260,
  noWrap = false,
}: {
  children: ReactNode;
  size?: number;
  maxWidth?: number;
  noWrap?: boolean;
}) => (
  <h1
    style={{
      fontFamily: SANS,
      fontSize: size,
      fontWeight: 760,
      lineHeight: 1.06,
      letterSpacing: 0,
      margin: 0,
      color: palette.text,
      maxWidth,
      whiteSpace: noWrap ? 'nowrap' : undefined,
    }}
  >
    {typeof children === 'string'
      ? children.split('\n').map((line, index) => (
          <span key={line} style={{ display: 'block' }}>
            {index > 0 && line.length === 0 ? '\u00A0' : line}
          </span>
        ))
      : children}
  </h1>
);

const Paragraph = ({
  children,
  maxWidth = 1120,
  noWrap = false,
}: {
  children: ReactNode;
  maxWidth?: number;
  noWrap?: boolean;
}) => (
  <p
    style={{
      fontSize: 30,
      lineHeight: 1.48,
      color: palette.muted,
      margin: 0,
      maxWidth,
      whiteSpace: noWrap ? 'nowrap' : undefined,
    }}
  >
    {children}
  </p>
);

const Panel = ({
  children,
  dark = false,
  style,
}: {
  children: ReactNode;
  dark?: boolean;
  style?: CSSProperties;
}) => (
  <div
    style={{
      borderRadius: 8,
      border: dark ? '1px solid rgba(255,255,255,0.14)' : `1px solid ${palette.border}`,
      background: dark ? palette.ink : palette.canvas,
      color: dark ? '#E5EEF9' : palette.text,
      overflow: 'hidden',
      ...style,
    }}
  >
    {children}
  </div>
);

const CodexInterfaceCallout = ({
  box,
  card,
  label,
  title,
  body,
  line,
}: {
  box: { x: number; y: number; width: number; height: number };
  card: { x: number; y: number; width: number };
  label: string;
  title: string;
  body: string;
  line: {
    from: { x: number; y: number };
    to: { x: number; y: number };
    bend?: { x: number; y: number };
  };
}) => {
  const path = line.bend
    ? `M ${line.from.x} ${line.from.y} L ${line.bend.x} ${line.bend.y} L ${line.to.x} ${line.to.y}`
    : `M ${line.from.x} ${line.from.y} L ${line.to.x} ${line.to.y}`;

  return (
    <>
      <svg
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          width: 1920,
          height: 1080,
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      >
        <path d={path} fill="none" stroke="rgba(255,255,255,0.78)" strokeWidth={7} />
        <path d={path} fill="none" stroke={palette.amber} strokeLinecap="round" strokeWidth={3} />
        <circle cx={line.to.x} cy={line.to.y} r={6} fill={palette.amber} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: box.x,
          top: box.y,
          width: box.width,
          height: box.height,
          borderRadius: 16,
          border: `3px solid ${palette.amber}`,
          background: 'transparent',
          boxShadow: '0 0 0 1px rgba(245, 158, 11, 0.28), 0 0 18px rgba(245, 158, 11, 0.22)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: card.x,
          top: card.y,
          width: card.width,
          padding: '16px 18px 17px',
          borderRadius: 8,
          border: `1px solid ${palette.border}`,
          background: 'rgba(255,255,255,0.94)',
          boxShadow: '0 12px 28px rgba(15,23,42,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 8 }}>
          <div
            style={{
              minWidth: 38,
              height: 29,
              borderRadius: 999,
              display: 'grid',
              placeItems: 'center',
              background: palette.amber,
              color: '#111827',
              fontFamily: MONO,
              fontSize: 16,
              fontWeight: 860,
            }}
          >
            {label}
          </div>
          <div style={{ fontSize: 25, lineHeight: 1.05, fontWeight: 840 }}>{title}</div>
        </div>
        <div style={{ fontSize: 21, lineHeight: 1.34, color: palette.muted }}>{body}</div>
      </div>
    </>
  );
};

const CodeBlock = ({ lines }: { lines: string[] }) => (
  <Panel dark style={{ padding: 28, fontFamily: MONO, fontSize: 22, lineHeight: 1.66 }}>
    {lines.map((line) => (
      <div key={line} style={{ color: line.startsWith('#') ? '#64748B' : '#E5EEF9' }}>
        {line.startsWith('$') ? <span style={{ color: '#93C5FD' }}>{line}</span> : line}
      </div>
    ))}
  </Panel>
);

const SpecCard = ({
  item,
}: {
  item: { label: string; title: string; body: string; example: string };
}) => (
  <Panel
    style={{
      minHeight: 246,
      padding: 28,
      display: 'flex',
      flexDirection: 'column',
      gap: 15,
      boxShadow: '0 18px 44px rgba(15,23,42,0.06)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div
        style={{
          width: 46,
          height: 34,
          borderRadius: 999,
          display: 'grid',
          placeItems: 'center',
          background: palette.ink,
          color: '#E5EEF9',
          fontFamily: MONO,
          fontSize: 16,
          fontWeight: 820,
        }}
      >
        {item.label}
      </div>
      <h3 style={{ margin: 0, fontSize: 29, lineHeight: 1.12, fontWeight: 830 }}>{item.title}</h3>
    </div>
    <p style={{ margin: 0, fontSize: 22, lineHeight: 1.42, color: palette.muted }}>{item.body}</p>
    <div
      style={{
        marginTop: 'auto',
        padding: '14px 16px',
        borderRadius: 8,
        background: palette.panel,
        border: `1px solid ${palette.border}`,
      }}
    >
      <div
        style={{
          marginBottom: 6,
          fontFamily: MONO,
          fontSize: 14,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: palette.accent,
          fontWeight: 820,
        }}
      >
        Example
      </div>
      <p style={{ margin: 0, fontSize: 20, lineHeight: 1.34, color: palette.text }}>
        {item.example}
      </p>
    </div>
  </Panel>
);

const DialogueCard = ({ item }: { item: DialogueThread }) => {
  const isCodex = item.dark;
  const messages =
    item.messages ??
    [
      item.body ? { role: isCodex ? ('Agent' as const) : ('人' as const), text: item.body } : null,
      item.note ? { role: 'Agent' as const, text: item.note } : null,
    ].filter((message): message is { role: '人' | 'Agent'; text: string } => Boolean(message));

  return (
    <div
      style={{
        minHeight: 520,
        padding: 22,
        borderRadius: 18,
        border: isCodex ? '1px solid rgba(79,140,255,0.28)' : `1px solid ${palette.border}`,
        background: isCodex ? palette.ink : palette.canvas,
        color: isCodex ? '#E5EEF9' : palette.text,
        boxShadow: '0 20px 46px rgba(15,23,42,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 12px',
            borderRadius: 999,
            background: isCodex ? 'rgba(79,140,255,0.16)' : palette.panel,
            color: isCodex ? '#93C5FD' : palette.accent,
            fontFamily: MONO,
            fontSize: 17,
            fontWeight: 820,
          }}
        >
          <span>{item.label}</span>
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: 'currentColor',
              opacity: 0.5,
            }}
          />
          <span>{item.speaker}</span>
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 15,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: isCodex ? 'rgba(229,238,249,0.54)' : palette.faint,
          }}
        >
          codex thread
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((message, index) => {
          const isAgent = message.role === 'Agent';

          return (
            <div
              key={`${message.role}-${index}`}
              style={{
                display: 'flex',
                justifyContent: isAgent ? 'flex-start' : 'flex-end',
              }}
            >
              <div
                style={{
                  maxWidth: isAgent ? '92%' : '88%',
                  padding: '13px 16px',
                  borderRadius: isAgent ? '8px 18px 18px 18px' : '18px 8px 18px 18px',
                  border: isCodex
                    ? '1px solid rgba(255,255,255,0.12)'
                    : `1px solid ${palette.border}`,
                  background: isAgent
                    ? isCodex
                      ? 'rgba(79,140,255,0.18)'
                      : palette.panel
                    : isCodex
                      ? 'rgba(255,255,255,0.08)'
                      : '#F8FAFC',
                }}
              >
                <div
                  style={{
                    marginBottom: 6,
                    fontFamily: MONO,
                    fontSize: 13,
                    fontWeight: 820,
                    color: isCodex
                      ? isAgent
                        ? '#93C5FD'
                        : 'rgba(229,238,249,0.62)'
                      : isAgent
                        ? palette.accent
                        : palette.faint,
                  }}
                >
                  {message.role}
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 20,
                    lineHeight: 1.42,
                    fontWeight: 620,
                    color: isCodex ? '#E5EEF9' : palette.text,
                  }}
                >
                  {message.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CardGrid = ({ cards }: { cards: NonNullable<SlideSpec['cards']> }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.min(cards.length, 3)}, minmax(0, 1fr))`,
      gap: 20,
    }}
  >
    {cards.map((card, index) => (
      <Panel
        key={card.title}
        style={{
          minHeight: cards.length > 3 ? 176 : 280,
          padding: cards.length > 3 ? 20 : 26,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: cards.length > 3 ? 'flex-start' : 'space-between',
          gap: cards.length > 3 ? 26 : 0,
          animation: 'deckFadeUp 680ms cubic-bezier(0.22, 1, 0.36, 1) both',
          animationDelay: `${index * 90}ms`,
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: cards.length > 3 ? 22 : 19,
            fontWeight: cards.length > 3 ? 760 : 400,
            color: cards.length > 3 ? palette.rose : index === 1 ? palette.accent : palette.faint,
          }}
        >
          {card.label}
        </div>
        <div>
          <h3
            style={{
              margin: '0 0 12px',
              fontSize: cards.length > 3 ? 34 : 34,
              lineHeight: 1.16,
              letterSpacing: 0,
            }}
          >
            {card.title}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: cards.length > 3 ? 23 : 24,
              lineHeight: cards.length > 3 ? 1.4 : 1.45,
              color: palette.muted,
            }}
          >
            {card.body}
          </p>
        </div>
      </Panel>
    ))}
  </div>
);

const Arrow = ({ direction }: { direction: 'right' | 'left' | 'down' | 'up' }) => {
  const isHorizontal = direction === 'right' || direction === 'left';
  const isReverse = direction === 'left' || direction === 'up';

  return (
    <div
      aria-hidden
      style={{
        width: isHorizontal ? '100%' : 2,
        height: isHorizontal ? 2 : '100%',
        minHeight: isHorizontal ? 2 : 54,
        background: `linear-gradient(${isHorizontal ? (isReverse ? '270deg' : '90deg') : isReverse ? '0deg' : '180deg'}, rgba(79,140,255,0.18), ${palette.accent})`,
        borderRadius: 999,
        position: 'relative',
        justifySelf: 'center',
        alignSelf: 'center',
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: isHorizontal ? (isReverse ? 0 : undefined) : '50%',
          right: isHorizontal ? (isReverse ? undefined : 0) : undefined,
          top: isHorizontal ? '50%' : isReverse ? 0 : undefined,
          bottom: isHorizontal ? undefined : isReverse ? undefined : 0,
          width: 9,
          height: 9,
          borderRadius: '50%',
          background: palette.accent,
          boxShadow: '0 0 0 5px rgba(79, 140, 255, 0.12)',
          transform: isHorizontal
            ? `translate(${isReverse ? '-20%' : '20%'}, -50%)`
            : `translate(-50%, ${isReverse ? '-20%' : '20%'})`,
        }}
      />
    </div>
  );
};

const SixDCycle = ({ cards }: { cards: NonNullable<SlideSpec['cards']> }) => {
  const [discover, decide, design, develop, deploy, distribute] = cards;
  const visualCards = [
    { card: discover, area: 'discover' },
    { card: decide, area: 'decide' },
    { card: design, area: 'design' },
    { card: distribute, area: 'distribute' },
    { card: deploy, area: 'deploy' },
    { card: develop, area: 'develop' },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 42px 1fr 42px 1fr',
        gridTemplateRows: '1fr 44px 1fr',
        gridTemplateAreas: `
          "discover arrowA decide arrowB design"
          "arrowF . . . arrowC"
          "distribute arrowE deploy arrowD develop"
        `,
        gap: 14,
        alignItems: 'stretch',
      }}
    >
      {visualCards.map(({ card, area }, index) => (
        <Panel
          key={card.title}
          style={{
            gridArea: area,
            minHeight: 166,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: palette.canvas,
            border: `1px solid ${palette.border}`,
            animation: 'deckFadeUp 680ms cubic-bezier(0.22, 1, 0.36, 1) both',
            animationDelay: `${index * 70}ms`,
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 760, color: palette.rose }}>
            {card.label}
          </div>
          <div>
            <h3 style={{ margin: '0 0 10px', fontSize: 32, lineHeight: 1.12 }}>{card.title}</h3>
            <p style={{ margin: 0, fontSize: 21, lineHeight: 1.35, color: palette.muted }}>
              {card.body}
            </p>
          </div>
        </Panel>
      ))}
      <div style={{ gridArea: 'arrowA', display: 'grid', placeItems: 'center' }}>
        <Arrow direction="right" />
      </div>
      <div style={{ gridArea: 'arrowB', display: 'grid', placeItems: 'center' }}>
        <Arrow direction="right" />
      </div>
      <div style={{ gridArea: 'arrowC', display: 'grid', placeItems: 'center' }}>
        <Arrow direction="down" />
      </div>
      <div style={{ gridArea: 'arrowD', display: 'grid', placeItems: 'center' }}>
        <Arrow direction="left" />
      </div>
      <div style={{ gridArea: 'arrowE', display: 'grid', placeItems: 'center' }}>
        <Arrow direction="left" />
      </div>
      <div style={{ gridArea: 'arrowF', display: 'grid', placeItems: 'center' }}>
        <Arrow direction="up" />
      </div>
    </div>
  );
};

const BulletList = ({ bullets }: { bullets: string[] }) => (
  <div style={{ display: 'grid', gap: 14 }}>
    {bullets.map((bullet) => (
      <div
        key={bullet}
        style={{
          display: 'grid',
          gridTemplateColumns: '22px 1fr',
          gap: 14,
          alignItems: 'start',
          fontSize: 28,
          lineHeight: 1.42,
          color: palette.text,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: palette.accent,
            marginTop: 15,
            boxShadow: '0 0 0 6px rgba(79, 140, 255, 0.12)',
          }}
        />
        <span>{bullet}</span>
      </div>
    ))}
  </div>
);

const MiniBrowser = ({ children }: { children: ReactNode }) => (
  <Panel style={{ minHeight: 430 }}>
    <div
      style={{
        height: 50,
        borderBottom: `1px solid ${palette.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 18px',
      }}
    >
      {[palette.rose, palette.amber, palette.green].map((color) => (
        <span
          key={color}
          style={{ width: 11, height: 11, borderRadius: '50%', background: color }}
        />
      ))}
      <span style={{ marginLeft: 12, fontFamily: MONO, fontSize: 16, color: palette.faint }}>
        workflow.local
      </span>
    </div>
    <div style={{ padding: 28 }}>{children}</div>
  </Panel>
);

const PhaseRail = ({ active }: { active?: string }) => {
  const phases = ['Prompt', 'Spec', 'Skill', 'Code', 'Test', 'Ship'];
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 10,
        marginTop: 18,
      }}
    >
      {phases.map((phase) => {
        const isActive = phase === active;
        return (
          <div
            key={phase}
            style={{
              height: 52,
              borderRadius: 14,
              border: `1px solid ${isActive ? palette.accent : palette.border}`,
              background: isActive ? palette.panelHi : palette.canvas,
              display: 'grid',
              placeItems: 'center',
              fontFamily: MONO,
              fontSize: 18,
              color: isActive ? palette.text : palette.faint,
            }}
          >
            {phase}
          </div>
        );
      })}
    </div>
  );
};

const GitCommandWorkbench = ({ slide }: { slide: SlideSpec }) => {
  const cards = slide.cards ?? [];
  const steps = ['pull', 'status', 'diff', 'stage', 'commit', 'push'];

  return (
    <div style={{ ...pageBase, display: 'flex', flexDirection: 'column', gap: 26 }}>
      <Style />
      <SoftGlow x="82%" y="20%" size={760} color="245, 158, 11" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Eyebrow color={palette.amber}>{slide.eyebrow}</Eyebrow>
        <Title size={68} maxWidth={1500} noWrap={slide.titleNoWrap}>
          {slide.title}
        </Title>
        {slide.body ? (
          <Paragraph maxWidth={slide.bodyMaxWidth ?? 1260} noWrap={slide.bodyNoWrap}>
            {slide.body}
          </Paragraph>
        ) : null}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '0.95fr 1.05fr',
          gap: 30,
          alignItems: 'stretch',
          minHeight: 0,
          flex: 1,
        }}
      >
        <Panel dark style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div
            style={{
              height: 54,
              borderBottom: '1px solid rgba(255,255,255,0.12)',
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '0 20px',
            }}
          >
            {[palette.rose, palette.amber, palette.green].map((color) => (
              <span
                key={color}
                style={{ width: 12, height: 12, borderRadius: '50%', background: color }}
              />
            ))}
            <span style={{ marginLeft: 12, fontFamily: MONO, fontSize: 16, color: '#94A3B8' }}>
              codex / terminal
            </span>
          </div>
          <div style={{ padding: 26, display: 'grid', gap: 15 }}>
            {(slide.code ?? []).map((line, index) => (
              <div
                key={line}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '46px 1fr',
                  gap: 14,
                  alignItems: 'center',
                  padding: '13px 14px',
                  borderRadius: 8,
                  background: index === 1 ? 'rgba(79,140,255,0.16)' : 'rgba(255,255,255,0.045)',
                  border:
                    index === 1
                      ? '1px solid rgba(147,197,253,0.32)'
                      : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span
                  style={{
                    height: 34,
                    borderRadius: 999,
                    display: 'grid',
                    placeItems: 'center',
                    background: index === 1 ? palette.accent : 'rgba(255,255,255,0.1)',
                    color: '#E5EEF9',
                    fontFamily: MONO,
                    fontSize: 15,
                    fontWeight: 820,
                  }}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 23, color: '#E5EEF9' }}>{line}</span>
              </div>
            ))}
          </div>
        </Panel>
        <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 18 }}>
          <Panel style={{ padding: 22 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: steps
                  .map((_, index) => (index === 0 ? '1fr' : '34px 1fr'))
                  .join(' '),
                gap: 10,
              }}
            >
              {steps.flatMap((step, index) => [
                <div
                  key={step}
                  style={{
                    minHeight: 54,
                    borderRadius: 8,
                    display: 'grid',
                    placeItems: 'center',
                    background: index === 1 ? palette.panelHi : palette.panel,
                    border: `1px solid ${index === 1 ? palette.accent : palette.border}`,
                    fontFamily: MONO,
                    fontSize: 18,
                    fontWeight: 820,
                    color: index === 1 ? palette.accent : palette.muted,
                  }}
                >
                  {step}
                </div>,
                ...(index < steps.length - 1
                  ? [
                      <div
                        key={`${step}-arrow`}
                        style={{
                          display: 'grid',
                          placeItems: 'center',
                          color: palette.faint,
                          fontFamily: MONO,
                          fontSize: 24,
                        }}
                      >
                        →
                      </div>,
                    ]
                  : []),
              ])}
            </div>
          </Panel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {cards.map((card) => (
              <Panel key={card.label} style={{ padding: 22 }}>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 18,
                    fontWeight: 840,
                    color: palette.amber,
                    marginBottom: 10,
                  }}
                >
                  {card.label}
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: 28, lineHeight: 1.16 }}>{card.title}</h3>
                <p style={{ margin: 0, fontSize: 21, lineHeight: 1.42, color: palette.muted }}>
                  {card.body}
                </p>
              </Panel>
            ))}
          </div>
          <Panel dark style={{ padding: '18px 22px' }}>
            <p style={{ margin: 0, fontSize: 26, lineHeight: 1.34, fontWeight: 760 }}>
              原則：Commit 前先相信 diff，不要只相信 agent 的摘要。
            </p>
          </Panel>
        </div>
      </div>
      <Footer section={slide.section} />
    </div>
  );
};

const TwoFileScreenshotsPage = ({ slide }: { slide: SlideSpec }) => {
  const shots = slide.fileScreenshots ?? [];

  return (
    <div style={{ ...pageBase, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Style />
      <SoftGlow x="18%" y="78%" size={720} color="245, 158, 11" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Eyebrow color={palette.amber}>{slide.eyebrow}</Eyebrow>
        <Title size={slide.titleSize ?? 58} maxWidth={1580} noWrap={slide.titleNoWrap}>
          {slide.title}
        </Title>
        {slide.body ? (
          <Paragraph maxWidth={slide.bodyMaxWidth ?? 1500} noWrap={slide.bodyNoWrap}>
            {slide.body}
          </Paragraph>
        ) : null}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 26,
          flex: 1,
          minHeight: 0,
        }}
      >
        {shots.map((shot, index) => {
          const accent = index === 0 ? palette.accent : palette.green;

          return (
            <Panel
              key={shot.label}
              style={{
                padding: 0,
                overflow: 'hidden',
                display: 'grid',
                gridTemplateRows: '1fr 126px',
                minHeight: 0,
                borderTop: `5px solid ${accent}`,
              }}
            >
              <div
                style={{
                  background: '#05070B',
                  padding: 12,
                  display: 'grid',
                  placeItems: 'center',
                  minHeight: 0,
                }}
              >
                <img
                  src={shot.image}
                  alt={shot.label}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6 }}
                />
              </div>
              <div
                style={{
                  padding: '20px 26px',
                  display: 'grid',
                  gridTemplateColumns: '150px 1fr',
                  gap: 22,
                  alignItems: 'center',
                  background: palette.canvas,
                }}
              >
                <div style={{ fontFamily: MONO, fontSize: 18, color: accent, fontWeight: 860 }}>
                  {shot.label}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 8px', fontSize: 32, lineHeight: 1.1 }}>{shot.title}</h3>
                  <p style={{ margin: 0, fontSize: 22, lineHeight: 1.34, color: palette.muted }}>
                    {shot.body}
                  </p>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
      <Footer section={slide.section} />
    </div>
  );
};

const SkillVideoComparisonPage = ({ slide }: { slide: SlideSpec }) => {
  const videos = [
    {
      label: 'No Skills',
      title: '每次重新交代規則',
      body: 'Agent 需要在 thread 裡重新理解流程，容易漏掉限制與驗收標準。',
      src: noSkillsVideo,
      color: palette.amber,
    },
    {
      label: 'Superpower Skills',
      title: '把流程變成可重用能力',
      body: 'Skill 先收斂需求與 spec，讓後續實作能沿著同一套工作流推進。',
      src: superpowerSkillsVideo,
      color: palette.green,
    },
  ];

  return (
    <div style={{ ...pageBase, display: 'grid', gridTemplateRows: 'auto 1fr', gap: 26 }}>
      <Style />
      <SoftGlow x="82%" y="20%" size={760} color="245, 158, 11" />
      <SoftGlow x="18%" y="82%" size={620} color="16, 163, 127" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Eyebrow>{slide.eyebrow}</Eyebrow>
        <Title size={68} maxWidth={1500} noWrap={slide.titleNoWrap}>
          {slide.title}
        </Title>
        {slide.body ? <Paragraph maxWidth={1500}>{slide.body}</Paragraph> : null}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, minHeight: 0 }}>
        {videos.map((video) => (
          <Panel
            key={video.label}
            style={{
              padding: 22,
              display: 'grid',
              gridTemplateRows: 'auto 1fr auto',
              gap: 18,
              borderTop: `6px solid ${video.color}`,
              minHeight: 0,
            }}
          >
            <div>
              <div style={{ fontFamily: MONO, fontSize: 18, color: video.color, fontWeight: 860 }}>
                {video.label}
              </div>
              <h3 style={{ margin: '10px 0 6px', fontSize: 34, lineHeight: 1.08 }}>
                {video.title}
              </h3>
            </div>
            <div
              style={{
                minHeight: 0,
                borderRadius: 8,
                overflow: 'hidden',
                background: '#050505',
                display: 'grid',
                placeItems: 'center',
                border: `1px solid ${palette.border}`,
              }}
            >
              <AutoPlayVideo
                src={video.src}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                  background: '#050505',
                }}
              />
            </div>
            <p style={{ margin: 0, fontSize: 22, lineHeight: 1.32, color: palette.muted }}>
              {video.body}
            </p>
          </Panel>
        ))}
      </div>
      <Footer section={slide.section} />
    </div>
  );
};

const SpecToArtifactPage = ({ slide }: { slide: SlideSpec }) => {
  const cards = slide.cards ?? [];

  return (
    <div style={{ ...pageBase, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Style />
      <SoftGlow x="82%" y="25%" size={760} color="16, 163, 127" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Eyebrow>{slide.eyebrow}</Eyebrow>
        <Title size={66} maxWidth={1380}>
          {slide.title}
        </Title>
        {slide.body ? <Paragraph maxWidth={1280}>{slide.body}</Paragraph> : null}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '0.92fr 70px 1.08fr',
          gap: 22,
          alignItems: 'stretch',
          flex: 1,
          minHeight: 0,
        }}
      >
        <Panel dark style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontFamily: MONO, fontSize: 20, color: '#93C5FD', fontWeight: 840 }}>
            {slide.aside ?? 'md/spec.md'}
          </div>
          <div style={{ display: 'grid', gap: 13, fontFamily: MONO }}>
            {(slide.code ?? []).map((line, index) => (
              <div
                key={`${line}-${index}`}
                style={{
                  padding: '13px 15px',
                  borderRadius: 8,
                  background: line.startsWith('#')
                    ? 'rgba(147,197,253,0.13)'
                    : 'rgba(255,255,255,0.055)',
                  color: line.startsWith('#') ? '#93C5FD' : '#E5EEF9',
                  fontSize: line.startsWith('#') ? 22 : 20,
                  lineHeight: 1.28,
                  fontWeight: line.startsWith('#') ? 820 : 560,
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </Panel>
        <div style={{ display: 'grid', placeItems: 'center' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              display: 'grid',
              placeItems: 'center',
              background: palette.ink,
              color: '#E5EEF9',
              fontFamily: MONO,
              fontSize: 34,
              boxShadow: '0 22px 48px rgba(15,23,42,0.2)',
            }}
          >
            →
          </div>
        </div>
        <Panel style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div
            style={{
              height: 54,
              borderBottom: `1px solid ${palette.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '0 20px',
            }}
          >
            {[palette.rose, palette.amber, palette.green].map((color) => (
              <span
                key={color}
                style={{ width: 12, height: 12, borderRadius: '50%', background: color }}
              />
            ))}
            <span style={{ marginLeft: 12, fontFamily: MONO, fontSize: 16, color: palette.faint }}>
              artifact.html
            </span>
          </div>
          <div style={{ padding: 26, display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
            <div
              style={{
                borderRadius: 8,
                background: palette.panel,
                padding: 24,
                border: `1px solid ${palette.border}`,
              }}
            >
              <div style={{ fontSize: 24, lineHeight: 1.25, color: palette.muted }}>今天要驗證</div>
              <div style={{ marginTop: 8, fontSize: 42, lineHeight: 1.12, fontWeight: 840 }}>
                {slide.quote ?? '使用者是否一眼看懂核心體驗'}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              {cards.map((card) => (
                <div
                  key={card.label}
                  style={{
                    minHeight: 136,
                    borderRadius: 8,
                    border: `1px solid ${palette.border}`,
                    padding: 18,
                    background: palette.canvas,
                  }}
                >
                  <div
                    style={{
                      fontFamily: MONO,
                      fontSize: 16,
                      color: palette.green,
                      fontWeight: 840,
                    }}
                  >
                    {card.label}
                  </div>
                  <h3 style={{ margin: '10px 0 8px', fontSize: 27, lineHeight: 1.12 }}>
                    {card.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: 20, lineHeight: 1.34, color: palette.muted }}>
                    {card.body}
                  </p>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 'auto',
                borderRadius: 8,
                background: palette.ink,
                color: '#E5EEF9',
                padding: '18px 22px',
                fontSize: 27,
                lineHeight: 1.28,
                fontWeight: 760,
              }}
            >
              目標：讓非工程背景的人也能看懂、指出問題、給回饋。
            </div>
          </div>
        </Panel>
      </div>
      <Footer section={slide.section} />
    </div>
  );
};

const SpecOverloadPage = ({ slide }: { slide: SlideSpec }) => {
  const lines = slide.code ?? [];
  const chunkSize = Math.ceil(lines.length / 4);
  const columns = Array.from({ length: 4 }, (_, index) =>
    lines.slice(index * chunkSize, (index + 1) * chunkSize),
  );

  return (
    <div style={{ ...pageBase, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Style />
      <SoftGlow x="82%" y="18%" size={680} color="245, 158, 11" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 430px',
          gap: 28,
          alignItems: 'end',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Eyebrow color={palette.amber}>{slide.eyebrow}</Eyebrow>
          <Title size={58} maxWidth={1120}>
            {slide.title}
          </Title>
        </div>
        <Panel dark style={{ padding: '18px 22px', borderTop: `5px solid ${palette.amber}` }}>
          <div style={{ fontFamily: MONO, fontSize: 18, color: palette.amber, fontWeight: 840 }}>
            HUMAN REVIEW COST
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 24, lineHeight: 1.25, fontWeight: 760 }}>
            規格可以很完整，但直接丟給人看，通常只會得到「我晚點看」。
          </p>
        </Panel>
      </div>
      <Panel
        dark
        style={{
          flex: 1,
          minHeight: 0,
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
          }}
        >
          {columns.map((column, index) => (
            <div
              key={`spec-column-${index}`}
              style={{
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.045)',
                padding: '12px 14px',
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              <pre
                style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  fontFamily: MONO,
                  fontSize: 11.2,
                  lineHeight: 1.28,
                  color: 'rgba(229,238,249,0.84)',
                }}
              >
                {column.join('\n')}
              </pre>
            </div>
          ))}
        </div>
        <div
          style={{
            borderRadius: 8,
            border: `1px solid rgba(245, 158, 11, 0.55)`,
            background: 'rgba(255,255,255,0.055)',
            padding: '12px 16px',
            display: 'grid',
            gridTemplateColumns: '150px 1fr',
            gap: 16,
            alignItems: 'center',
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 18, color: palette.amber, fontWeight: 860 }}>
            NEXT STEP
          </div>
          <p style={{ margin: 0, fontSize: 24, lineHeight: 1.22, fontWeight: 780 }}>
            Spec 給 agent 精準執行；給人 review，要先轉成可以掃讀的 artifact。
          </p>
        </div>
      </Panel>
      <Footer section={slide.section} />
    </div>
  );
};

const HtmlHumanBridgePage = ({ slide }: { slide: SlideSpec }) => {
  const cards = slide.cards ?? [];

  return (
    <div style={{ ...pageBase, display: 'flex', flexDirection: 'column', gap: 22 }}>
      <Style />
      <SoftGlow x="78%" y="28%" size={760} color="16, 163, 127" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Eyebrow>{slide.eyebrow}</Eyebrow>
          <Title size={54} maxWidth={1300} noWrap>
            {slide.title}
          </Title>
          {slide.body ? <Paragraph maxWidth={1160}>{slide.body}</Paragraph> : null}
        </div>
        <Panel style={{ padding: '18px 20px', alignSelf: 'end' }}>
          <div style={{ fontFamily: MONO, fontSize: 17, color: palette.green, fontWeight: 860 }}>
            SOURCE
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 22, lineHeight: 1.34, color: palette.muted }}>
            Claude Code team: long Markdown plans are hard to read; HTML makes outputs richer,
            readable, and shareable.
          </p>
        </Panel>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '0.92fr 80px 1.08fr',
          gap: 24,
          flex: 1,
          minHeight: 0,
          alignItems: 'stretch',
        }}
      >
        <Panel dark style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: MONO, fontSize: 20, color: '#93C5FD', fontWeight: 840 }}>
              spec.md
            </div>
            <div
              style={{
                borderRadius: 999,
                border: '1px solid rgba(147,197,253,0.34)',
                padding: '7px 11px',
                fontFamily: MONO,
                fontSize: 15,
                color: '#BFDBFE',
              }}
            >
              agent context
            </div>
          </div>
          <div style={{ display: 'grid', gap: 11, fontFamily: MONO }}>
            {[
              '# Goal',
              '讓學生不用滑動就看懂今天課表',
              '# Flow',
              'open app → today schedule → course detail',
              '# DoD',
              '3 秒內理解下一堂課、教室、時間',
              '# Edge cases',
              '空課表 / 跨節課 / 教室名稱過長',
            ].map((line) => (
              <div
                key={line}
                style={{
                  borderRadius: 8,
                  padding: '13px 15px',
                  background: line.startsWith('#')
                    ? 'rgba(147,197,253,0.13)'
                    : 'rgba(255,255,255,0.055)',
                  color: line.startsWith('#') ? '#93C5FD' : '#E5EEF9',
                  fontSize: line.startsWith('#') ? 21 : 19,
                  lineHeight: 1.28,
                  fontWeight: line.startsWith('#') ? 820 : 560,
                }}
              >
                {line}
              </div>
            ))}
          </div>
          <p style={{ margin: 'auto 0 0', fontSize: 25, lineHeight: 1.35, color: '#CBD5E1' }}>
            對 agent 來說，Markdown 是精準、低摩擦、容易被當成上下文的工作文件。
          </p>
        </Panel>
        <div style={{ display: 'grid', placeItems: 'center' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 999,
              display: 'grid',
              placeItems: 'center',
              background: palette.green,
              color: '#FFFFFF',
              fontFamily: MONO,
              fontSize: 35,
              fontWeight: 860,
              boxShadow: '0 22px 52px rgba(16,163,127,0.25)',
            }}
          >
            →
          </div>
        </div>
        <Panel style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div
            style={{
              height: 56,
              borderBottom: `1px solid ${palette.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '0 20px',
            }}
          >
            {[palette.rose, palette.amber, palette.green].map((color) => (
              <span
                key={color}
                style={{ width: 12, height: 12, borderRadius: '50%', background: color }}
              />
            ))}
            <span style={{ marginLeft: 12, fontFamily: MONO, fontSize: 16, color: palette.faint }}>
              human-readable.html
            </span>
          </div>
          <div style={{ padding: 26, display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
            <div
              style={{
                borderRadius: 8,
                padding: 24,
                background: palette.panelHi,
                border: `1px solid ${palette.border}`,
              }}
            >
              <div
                style={{ fontFamily: MONO, fontSize: 17, color: palette.green, fontWeight: 860 }}
              >
                FOR HUMAN REVIEW
              </div>
              <h2 style={{ margin: '12px 0 0', fontSize: 42, lineHeight: 1.12 }}>
                把完整 spec 變成可以掃讀、比較、分享的畫面
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {cards.map((card) => (
                <div
                  key={card.label}
                  style={{
                    minHeight: 126,
                    borderRadius: 8,
                    border: `1px solid ${palette.border}`,
                    background: palette.canvas,
                    padding: 18,
                  }}
                >
                  <div
                    style={{
                      fontFamily: MONO,
                      fontSize: 15,
                      color: palette.accent,
                      fontWeight: 860,
                    }}
                  >
                    {card.label}
                  </div>
                  <h3 style={{ margin: '8px 0 7px', fontSize: 27, lineHeight: 1.12 }}>
                    {card.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: 20, lineHeight: 1.34, color: palette.muted }}>
                    {card.body}
                  </p>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 'auto',
                borderRadius: 8,
                background: palette.ink,
                color: '#E5EEF9',
                padding: '17px 20px',
                fontSize: 27,
                lineHeight: 1.28,
                fontWeight: 780,
              }}
            >
              不是改掉 spec，而是替它產生一個人願意看的版本。
            </div>
          </div>
        </Panel>
      </div>
      <Footer section={slide.section} />
    </div>
  );
};

const ArtifactFeedbackLoopPage = ({ slide }: { slide: SlideSpec }) => {
  const cards = slide.cards ?? [];

  return (
    <div style={{ ...pageBase, display: 'flex', flexDirection: 'column', gap: 26 }}>
      <Style />
      <SoftGlow x="20%" y="72%" size={780} color="16, 163, 127" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Eyebrow>{slide.eyebrow}</Eyebrow>
        <Title
          size={slide.titleSize ?? 66}
          maxWidth={slide.titleMaxWidth ?? 1320}
          noWrap={slide.titleNoWrap}
        >
          {slide.title}
        </Title>
        {slide.body ? (
          <Paragraph maxWidth={slide.bodyMaxWidth ?? 1260} noWrap={slide.bodyNoWrap}>
            {slide.body}
          </Paragraph>
        ) : null}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: cards.map(() => '1fr').join(' 38px '),
          gap: 12,
          alignItems: 'stretch',
          flex: 1,
          minHeight: 0,
        }}
      >
        {cards.flatMap((card, index) => [
          <Panel
            key={card.label}
            style={{
              padding: 22,
              minHeight: 390,
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              borderRadius: 8,
              border: `1px solid ${palette.border}`,
              borderTop: `5px solid ${index === cards.length - 1 ? palette.green : palette.accent}`,
              background: index === cards.length - 1 ? palette.panelHi : palette.canvas,
            }}
          >
            <div
              style={{
                width: 54,
                height: 38,
                borderRadius: 999,
                display: 'grid',
                placeItems: 'center',
                background: palette.ink,
                color: '#E5EEF9',
                fontFamily: MONO,
                fontSize: 16,
                fontWeight: 860,
              }}
            >
              {String(index + 1).padStart(2, '0')}
            </div>
            <div>
              <div
                style={{ fontFamily: MONO, fontSize: 17, color: palette.green, fontWeight: 840 }}
              >
                {card.label}
              </div>
              <h3 style={{ margin: '12px 0 10px', fontSize: 31, lineHeight: 1.12 }}>
                {card.title}
              </h3>
              <p style={{ margin: 0, fontSize: 22, lineHeight: 1.42, color: palette.muted }}>
                {card.body}
              </p>
            </div>
            <div
              style={{
                marginTop: 'auto',
                borderRadius: 8,
                background: index === cards.length - 1 ? palette.canvas : palette.panel,
                border: `1px solid ${palette.border}`,
                padding: 15,
                fontFamily: MONO,
                fontSize: 18,
                color: palette.text,
              }}
            >
              {index === cards.length - 1 ? 'next: update spec' : 'output →'}
            </div>
          </Panel>,
          ...(index < cards.length - 1
            ? [
                <div
                  key={`${card.label}-arrow`}
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    fontFamily: MONO,
                    fontSize: 28,
                    color: palette.faint,
                  }}
                >
                  →
                </div>,
              ]
            : []),
        ])}
      </div>
      <Panel dark style={{ padding: '20px 24px' }}>
        <p style={{ margin: 0, fontSize: 30, lineHeight: 1.28, fontWeight: 780 }}>
          回饋不是終點；它會回寫成下一版 spec，讓 agent 下一輪更準。
        </p>
      </Panel>
      <Footer section={slide.section} />
    </div>
  );
};

const IosGoalTrackPage = ({ slide }: { slide: SlideSpec }) => {
  const cards = slide.cards ?? [];

  return (
    <div style={{ ...pageBase, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <Style />
      <SoftGlow x="78%" y="24%" size={760} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 470px', gap: 34 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Eyebrow>{slide.eyebrow}</Eyebrow>
          <Title size={60} maxWidth={1180} noWrap={slide.titleNoWrap}>
            {slide.title}
          </Title>
          {slide.body ? <Paragraph maxWidth={1080}>{slide.body}</Paragraph> : null}
        </div>
        <Panel dark style={{ padding: 26, alignSelf: 'end' }}>
          <div style={{ fontFamily: MONO, fontSize: 18, color: '#93C5FD', fontWeight: 860 }}>
            GOAL OBJECTIVE
          </div>
          <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
            {(slide.code ?? []).slice(1).map((line) => (
              <div
                key={line}
                style={{
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.07)',
                  padding: '11px 13px',
                  fontFamily: MONO,
                  fontSize: 18,
                  lineHeight: 1.28,
                  color: '#E5EEF9',
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          flex: 1,
          minHeight: 0,
        }}
      >
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr 1fr', gap: 18 }}>
          {cards.map((card, index) => (
            <Panel
              key={card.label}
              style={{
                padding: 26,
                display: 'grid',
                gridTemplateColumns: '170px 1fr',
                gap: 24,
                alignItems: 'center',
                borderLeft: `6px solid ${
                  index === 0 ? palette.accent : index === 1 ? palette.amber : palette.green
                }`,
              }}
            >
              <div style={{ fontFamily: MONO, fontSize: 22, color: palette.faint }}>
                {card.label}
              </div>
              <div>
                <h3 style={{ margin: '0 0 10px', fontSize: 36, lineHeight: 1.08 }}>{card.title}</h3>
                <p style={{ margin: 0, fontSize: 24, lineHeight: 1.36, color: palette.muted }}>
                  {card.body}
                </p>
              </div>
            </Panel>
          ))}
        </div>
      </div>
      <Footer section={slide.section} />
    </div>
  );
};

const IosSkillPipelinePage = ({ slide }: { slide: SlideSpec }) => {
  const steps = slide.diagram ?? [];

  return (
    <div style={{ ...pageBase, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <Style />
      <SoftGlow x="18%" y="78%" size={720} color="16, 163, 127" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Eyebrow>{slide.eyebrow}</Eyebrow>
        <Title size={slide.titleSize ?? 64} maxWidth={1700} noWrap={slide.titleNoWrap}>
          {slide.title}
        </Title>
        {slide.body ? (
          <Paragraph maxWidth={slide.bodyMaxWidth ?? 1250} noWrap={slide.bodyNoWrap}>
            {slide.body}
          </Paragraph>
        ) : null}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: steps.map(() => '1fr').join(' 34px '),
          gap: 10,
          alignItems: 'stretch',
          flex: 1,
          minHeight: 0,
        }}
      >
        {steps.flatMap((step, index) => [
          <Panel
            key={step}
            style={{
              padding: 22,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderTop: `5px solid ${index < 2 ? palette.accent : index < 4 ? palette.amber : palette.green}`,
              background: index === steps.length - 1 ? palette.panelHi : palette.canvas,
            }}
          >
            <div
              style={{
                width: 54,
                height: 38,
                borderRadius: 999,
                display: 'grid',
                placeItems: 'center',
                background: palette.ink,
                color: '#E5EEF9',
                fontFamily: MONO,
                fontSize: 16,
                fontWeight: 860,
              }}
            >
              {String(index + 1).padStart(2, '0')}
            </div>
            <p style={{ margin: '22px 0 auto', fontSize: 26, lineHeight: 1.28, fontWeight: 760 }}>
              {step}
            </p>
            <div
              style={{
                marginTop: 22,
                fontFamily: MONO,
                fontSize: 16,
                color: palette.faint,
              }}
            >
              {index === steps.length - 1 ? 'handoff evidence' : 'next →'}
            </div>
          </Panel>,
          ...(index < steps.length - 1
            ? [
                <div
                  key={`${step}-arrow`}
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    fontFamily: MONO,
                    fontSize: 28,
                    color: palette.faint,
                  }}
                >
                  →
                </div>,
              ]
            : []),
        ])}
      </div>
      <Panel
        dark
        style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24 }}
      >
        <div style={{ fontFamily: MONO, fontSize: 18, color: '#93C5FD', fontWeight: 860 }}>
          ACCEPTANCE CHECKS
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {(slide.code ?? []).slice(1).map((line) => (
            <span
              key={line}
              style={{
                borderRadius: 999,
                background: 'rgba(255,255,255,0.08)',
                padding: '9px 13px',
                fontSize: 22,
                lineHeight: 1.2,
                color: '#E5EEF9',
                fontWeight: 720,
              }}
            >
              {line}
            </span>
          ))}
        </div>
      </Panel>
      <Footer section={slide.section} />
    </div>
  );
};

const AcceptanceChecksBoardPage = ({ slide }: { slide: SlideSpec }) => {
  const cards = slide.cards ?? [];

  return (
    <div style={{ ...pageBase, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Style />
      <SoftGlow x="18%" y="78%" size={680} color="79, 140, 255" />
      <SoftGlow x="82%" y="22%" size={760} color="16, 163, 127" />
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 410px', gap: 30, alignItems: 'end' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Eyebrow>{slide.eyebrow}</Eyebrow>
          <Title size={54} maxWidth={1320}>
            {slide.title}
          </Title>
          {slide.body ? <Paragraph maxWidth={1260}>{slide.body}</Paragraph> : null}
        </div>
        <Panel dark style={{ padding: '20px 24px', borderTop: `5px solid ${palette.green}` }}>
          <div style={{ fontFamily: MONO, fontSize: 18, color: palette.green, fontWeight: 860 }}>
            HUMAN GATE
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 25, lineHeight: 1.28, fontWeight: 760 }}>
            Agent 先列清單，人決定哪些真的算完成。
          </p>
        </Panel>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '0.92fr 1.08fr',
          gap: 24,
          flex: 1,
          minHeight: 0,
        }}
      >
        <Panel dark style={{ padding: 26, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontFamily: MONO, fontSize: 20, color: '#93C5FD', fontWeight: 860 }}>
            prompt
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            {(slide.code ?? []).slice(1).map((line, index) => (
              <div
                key={`${line}-${index}`}
                style={{
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: index === 0 ? 'rgba(147,197,253,0.14)' : 'rgba(255,255,255,0.055)',
                  padding: '14px 16px',
                  fontFamily: MONO,
                  fontSize: 18,
                  lineHeight: 1.34,
                  color: index === 0 ? '#BFDBFE' : '#E5EEF9',
                }}
              >
                {line}
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 'auto',
              borderRadius: 8,
              background: 'rgba(245,158,11,0.14)',
              border: '1px solid rgba(245,158,11,0.34)',
              padding: '18px 20px',
              fontSize: 25,
              lineHeight: 1.28,
              fontWeight: 760,
              color: '#FDE68A',
            }}
          >
            先不要寫程式；先把「怎樣算完成」列出來。
          </div>
        </Panel>
        <div style={{ display: 'grid', gridTemplateRows: 'repeat(4, 1fr)', gap: 14, minHeight: 0 }}>
          {cards.map((card, index) => (
            <Panel
              key={card.label}
              style={{
                padding: '18px 22px',
                display: 'grid',
                gridTemplateColumns: '142px 1fr',
                gap: 20,
                alignItems: 'center',
                borderLeft: `6px solid ${
                  index === 0
                    ? palette.accent
                    : index === 1
                      ? palette.green
                      : index === 2
                        ? palette.amber
                        : palette.rose
                }`,
              }}
            >
              <div
                style={{ fontFamily: MONO, fontSize: 18, color: palette.faint, fontWeight: 840 }}
              >
                {card.label}
              </div>
              <div>
                <h3 style={{ margin: '0 0 8px', fontSize: 30, lineHeight: 1.08 }}>{card.title}</h3>
                <p style={{ margin: 0, fontSize: 21, lineHeight: 1.32, color: palette.muted }}>
                  {card.body}
                </p>
              </div>
            </Panel>
          ))}
        </div>
      </div>
      <Panel
        style={{ padding: '18px 24px', display: 'grid', gridTemplateColumns: '180px 1fr', gap: 20 }}
      >
        <div style={{ fontFamily: MONO, fontSize: 18, color: palette.green, fontWeight: 860 }}>
          WRITE BACK
        </div>
        <p style={{ margin: 0, fontSize: 28, lineHeight: 1.24, fontWeight: 780 }}>
          刪掉不合理的、補上真正重要的產品判斷，再把 acceptance checks 寫回 spec。
        </p>
      </Panel>
      <Footer section={slide.section} />
    </div>
  );
};

const ProjectGoalChecklistPage = ({ slide }: { slide: SlideSpec }) => {
  const items = slide.bullets ?? [];
  const columns = [items.slice(0, 5), items.slice(5, 10), items.slice(10, 15), items.slice(15)];

  return (
    <div style={{ ...pageBase, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <Style />
      <SoftGlow x="82%" y="18%" size={760} />
      <SoftGlow x="18%" y="78%" size={620} color="16, 163, 127" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.05fr 0.95fr',
          gap: 42,
          alignItems: 'end',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Eyebrow>{slide.eyebrow}</Eyebrow>
          <Title size={68} maxWidth={1320} noWrap={slide.titleNoWrap}>
            {slide.title}
          </Title>
        </div>
        <Panel dark style={{ padding: '22px 26px', borderLeft: `7px solid ${palette.green}` }}>
          <div style={{ fontFamily: MONO, fontSize: 18, color: '#93C5FD', fontWeight: 860 }}>
            one goal per run
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 28, lineHeight: 1.28, fontWeight: 760 }}>
            每一次只完成一項，完成後回到 checklist 驗證、截圖、再推進下一項。
          </p>
        </Panel>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
          flex: 1,
          minHeight: 0,
        }}
      >
        {columns.map((column, columnIndex) => (
          <div key={`goal-column-${columnIndex}`} style={{ display: 'grid', gap: 12 }}>
            {column.map((item, itemIndex) => {
              const absoluteIndex = columnIndex * 5 + itemIndex + 1;
              return (
                <Panel
                  key={item}
                  style={{
                    padding: '15px 16px',
                    display: 'grid',
                    gridTemplateColumns: '42px 1fr',
                    gap: 12,
                    alignItems: 'start',
                    minHeight: 82,
                    background: absoluteIndex === 1 ? palette.panelHi : palette.canvas,
                    borderColor: absoluteIndex === 1 ? '#BFDBFE' : palette.border,
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 32,
                      borderRadius: 999,
                      display: 'grid',
                      placeItems: 'center',
                      background: absoluteIndex === 1 ? palette.accent : palette.ink,
                      color: '#E5EEF9',
                      fontFamily: MONO,
                      fontSize: 15,
                      fontWeight: 860,
                    }}
                  >
                    {String(absoluteIndex).padStart(2, '0')}
                  </div>
                  <div style={{ fontSize: 20, lineHeight: 1.25, fontWeight: 700 }}>{item}</div>
                </Panel>
              );
            })}
          </div>
        ))}
      </div>
      <Footer section={slide.section} />
    </div>
  );
};

const DemoRunwayPage = ({ slide }: { slide: SlideSpec }) => {
  const steps = slide.diagram ?? [];
  const lanes = [
    { label: 'DESIGN', title: '把想法變規格', steps: steps.slice(0, 3), color: palette.accent },
    { label: 'BUILD', title: '把規格變體驗', steps: steps.slice(3, 6), color: palette.green },
    { label: 'VERIFY', title: '用證據收尾', steps: steps.slice(6), color: palette.amber },
  ];

  return (
    <div style={{ ...pageBase, display: 'flex', flexDirection: 'column', gap: 30 }}>
      <Style />
      <SoftGlow x="78%" y="18%" size={760} color="16, 163, 127" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Eyebrow>{slide.eyebrow}</Eyebrow>
        <Title size={68} maxWidth={1280}>
          {slide.title}
        </Title>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 22,
          flex: 1,
          minHeight: 0,
        }}
      >
        {lanes.map((lane) => (
          <Panel
            key={lane.label}
            style={{
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              borderTop: `6px solid ${lane.color}`,
            }}
          >
            <div style={{ fontFamily: MONO, fontSize: 18, color: lane.color, fontWeight: 860 }}>
              {lane.label}
            </div>
            <h3 style={{ margin: 0, fontSize: 39, lineHeight: 1.08 }}>{lane.title}</h3>
            <div style={{ display: 'grid', gap: 14, marginTop: 4 }}>
              {lane.steps.map((step) => {
                const [number, ...rest] = step.split('. ');
                return (
                  <div
                    key={step}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '52px 1fr',
                      gap: 14,
                      alignItems: 'start',
                      borderRadius: 8,
                      background: palette.bg,
                      padding: 17,
                    }}
                  >
                    <div style={{ fontFamily: MONO, fontSize: 18, color: palette.faint }}>
                      {number.padStart(2, '0')}
                    </div>
                    <div style={{ fontSize: 25, lineHeight: 1.25, fontWeight: 700 }}>
                      {rest.join('. ')}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        ))}
      </div>
      <Panel dark style={{ padding: '18px 24px' }}>
        <p style={{ margin: 0, fontSize: 30, lineHeight: 1.28, fontWeight: 780 }}>
          Demo 不是秀魔法，而是讓每一步都有可回看的產物與驗證證據。
        </p>
      </Panel>
      <Footer section={slide.section} />
    </div>
  );
};

const ClosingOperatingSystemPage = ({ slide }: { slide: SlideSpec }) => {
  if (slide.image) {
    return (
      <div
        style={{
          ...pageBase,
          display: 'grid',
          gridTemplateColumns: '0.9fr 1.1fr',
          gap: 58,
          alignItems: 'center',
        }}
      >
        <Style />
        <SoftGlow x="78%" y="24%" size={880} />
        <SoftGlow x="22%" y="78%" size={680} color="16, 163, 127" />
        <div
          style={{
            height: 790,
            borderRadius: 18,
            border: `1px solid ${palette.border}`,
            backgroundImage: `linear-gradient(180deg, rgba(11,18,32,0) 58%, rgba(11,18,32,0.64)), url(${slide.image})`,
            backgroundSize: 'cover',
            backgroundPosition: '50% 42%',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 28,
              right: 28,
              bottom: 26,
              color: '#E5EEF9',
              fontFamily: MONO,
              fontSize: 16,
              lineHeight: 1.4,
              opacity: 0.82,
            }}
          >
            Photo: NVIDIA Taiwan / Wikimedia Commons, CC BY 2.0
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
          <Eyebrow>{slide.eyebrow}</Eyebrow>
          <Title size={70} maxWidth={1120} noWrap>
            {slide.title}
          </Title>
          <Panel dark style={{ padding: '42px 46px', borderLeft: `8px solid ${palette.green}` }}>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 20,
                color: '#93C5FD',
                fontWeight: 860,
                marginBottom: 24,
              }}
            >
              Jensen Huang · NVIDIA Founder & CEO
            </div>
            <p style={{ margin: 0, fontSize: 58, lineHeight: 1.13, fontWeight: 840 }}>
              {slide.quote}
            </p>
          </Panel>
          <p style={{ margin: 0, fontSize: 29, lineHeight: 1.42, color: palette.muted }}>
            這份報告最後想留下的不是「AI 會不會取代人」，而是：誰能把 AI 變成自己的工作流。
          </p>
        </div>
        <Footer section={slide.section} />
      </div>
    );
  }

  return (
    <div
      style={{
        ...pageBase,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 44,
      }}
    >
      <Style />
      <SoftGlow x="78%" y="28%" size={900} />
      <SoftGlow x="18%" y="76%" size={700} color="16, 163, 127" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Eyebrow>{slide.eyebrow}</Eyebrow>
        <Title size={82} maxWidth={1400}>
          {slide.title}
        </Title>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 22 }}>
        {(slide.cards ?? []).map((card, index) => (
          <Panel
            key={card.label}
            style={{
              minHeight: 220,
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderTop: `6px solid ${
                index === 0 ? palette.accent : index === 1 ? palette.green : palette.amber
              }`,
            }}
          >
            <div style={{ fontFamily: MONO, fontSize: 18, color: palette.faint, fontWeight: 860 }}>
              {card.label}
            </div>
            <div>
              <h3 style={{ margin: '0 0 12px', fontSize: 42, lineHeight: 1.06 }}>{card.title}</h3>
              <p style={{ margin: 0, fontSize: 25, lineHeight: 1.34, color: palette.muted }}>
                {card.body}
              </p>
            </div>
          </Panel>
        ))}
      </div>
      <Panel dark style={{ padding: '30px 34px', borderLeft: `7px solid ${palette.green}` }}>
        <p style={{ margin: 0, fontSize: 42, lineHeight: 1.22, fontWeight: 820 }}>{slide.quote}</p>
      </Panel>
      <Footer section={slide.section} />
    </div>
  );
};

const DeckPage = ({ slide, index }: { slide: SlideSpec; index: number }) => {
  if (slide.layout === 'git-command-workbench') {
    return <GitCommandWorkbench slide={slide} />;
  }

  if (slide.layout === 'two-file-screenshots') {
    return <TwoFileScreenshotsPage slide={slide} />;
  }

  if (slide.layout === 'skill-video-comparison') {
    return <SkillVideoComparisonPage slide={slide} />;
  }

  if (slide.layout === 'spec-overload') {
    return <SpecOverloadPage slide={slide} />;
  }

  if (slide.layout === 'html-human-bridge') {
    return <HtmlHumanBridgePage slide={slide} />;
  }

  if (slide.layout === 'spec-to-artifact') {
    return <SpecToArtifactPage slide={slide} />;
  }

  if (slide.layout === 'artifact-feedback-loop') {
    return <ArtifactFeedbackLoopPage slide={slide} />;
  }

  if (slide.layout === 'ios-goal-track') {
    return <IosGoalTrackPage slide={slide} />;
  }

  if (slide.layout === 'acceptance-checks-board') {
    return <AcceptanceChecksBoardPage slide={slide} />;
  }

  if (slide.layout === 'project-goal-checklist') {
    return <ProjectGoalChecklistPage slide={slide} />;
  }

  if (slide.layout === 'ios-skill-pipeline') {
    return <IosSkillPipelinePage slide={slide} />;
  }

  if (slide.layout === 'demo-runway') {
    return <DemoRunwayPage slide={slide} />;
  }

  if (slide.layout === 'closing-operating-system') {
    return <ClosingOperatingSystemPage slide={slide} />;
  }

  if (slide.layout === 'blank') {
    return (
      <div
        style={{
          ...pageBase,
          padding: 0,
          ...(slide.video
            ? {
                background: '#050505',
                display: 'grid',
                placeItems: 'center',
              }
            : {}),
        }}
      >
        <Style />
        {slide.video ? (
          <AutoPlayVideo
            src={slide.video}
            style={{
              width: '90%',
              height: '88%',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              display: 'block',
              background: '#050505',
            }}
          />
        ) : null}
      </div>
    );
  }

  if (slide.layout === 'cover') {
    return (
      <div
        style={{
          ...pageBase,
          display: 'grid',
          gridTemplateColumns: '1.04fr 0.96fr',
          gap: 64,
          alignItems: 'center',
        }}
      >
        <Style />
        <SoftGlow x="76%" y="32%" size={940} />
        <SoftGlow x="18%" y="78%" size={640} color="16, 163, 127" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
          <Eyebrow>人工智慧導論 · 期中報告</Eyebrow>
          <Title size={94}>{slide.title}</Title>
          <Paragraph maxWidth={940}>{slide.body}</Paragraph>
          <PhaseRail active="Workflow" />
        </div>
        <MiniBrowser>
          <div style={{ display: 'grid', gap: 14 }}>
            {[
              'read AGENTS.md',
              'define core experience',
              'write skill-backed spec',
              'build iOS demo',
              'verify simulator flow',
            ].map((item, itemIndex) => (
              <div
                key={item}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '17px 18px',
                  borderRadius: 8,
                  background: itemIndex === 2 ? palette.panelHi : palette.bg,
                  border: `1px solid ${palette.border}`,
                  fontFamily: MONO,
                  fontSize: 20,
                }}
              >
                <span>{item}</span>
                <span style={{ color: itemIndex < 3 ? palette.green : palette.faint }}>
                  {itemIndex < 3 ? 'done' : 'next'}
                </span>
              </div>
            ))}
          </div>
        </MiniBrowser>
        <Footer section="codex://from-prompt-to-workflow" />
      </div>
    );
  }

  if (slide.layout === 'team') {
    return (
      <div
        style={{
          ...pageBase,
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
          gap: 34,
          padding: '74px 108px 112px',
        }}
      >
        <Style />
        <SoftGlow x="82%" y="24%" size={780} />
        <SoftGlow x="18%" y="82%" size={540} color="16, 163, 127" />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '0.9fr 1.1fr',
            gap: 44,
            alignItems: 'end',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Eyebrow>team</Eyebrow>
            <Title size={82}>{slide.title}</Title>
          </div>
          <Panel
            style={{
              padding: '24px 28px',
              background: 'rgba(255,255,255,0.72)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div style={{ fontFamily: MONO, fontSize: 18, color: palette.faint }}>report split</div>
            <p
              style={{
                margin: '10px 0 0',
                fontSize: 26,
                lineHeight: 1.36,
                color: palette.muted,
              }}
            >
              一人收斂產品敘事，一人落地工程流程；共同把 AI 開發從 prompt 推到可驗證的 workflow。
            </p>
            <div style={{ display: 'grid', gap: 8, marginTop: 18 }}>
              {[
                ['共同完成', '主題研究、簡報製作、現場展示、Q&A 準備'],
                ['上台分段', '蔡承曄：產品流程與結論 / 李天宇：工具流程與 Demo'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '96px 1fr',
                    gap: 14,
                    alignItems: 'center',
                    fontSize: 19,
                    lineHeight: 1.32,
                  }}
                >
                  <span
                    style={{
                      fontFamily: MONO,
                      color: palette.accent,
                      fontWeight: 760,
                    }}
                  >
                    {label}
                  </span>
                  <span style={{ color: palette.text, fontWeight: 650 }}>{value}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, minHeight: 0 }}>
          {[
            {
              name: '蔡承曄',
              role: '資訊三乙 · iOS Club 9th 社長',
              focus: '產品流程與故事線',
              owns: ['Core Experience / 6D', 'Spec / Goal', 'open-slide / Cloudflare 架設'],
              deliverable:
                '負責把報告主軸收斂成產品敘事，整理 Goal，並架設 open-slide 展示與部署環境。',
              photo: teamPortraitPhoto,
              position: '50% 28%',
            },
            {
              name: '李天宇',
              role: '資訊三乙 · iOS Club 9th 副社長',
              focus: '工程流程與工具實作',
              owns: ['Codex 介面 / Skills', 'Git / Brainstorming', 'iOS demo 與驗證流程'],
              deliverable:
                '負責示範 Codex 如何透過 Brainstorming 與工具流程，把規格推進到可驗證交付。',
              photo: liTianyuPhoto,
              position: '50% 22%',
            },
          ].map((member, personIndex) => (
            <Panel
              key={member.name}
              style={{
                padding: 34,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '164px 1fr',
                    gap: 26,
                    alignItems: 'center',
                    marginBottom: 26,
                  }}
                >
                  <div
                    style={{
                      width: 164,
                      height: 164,
                      borderRadius: 10,
                      border: `1px solid ${palette.border}`,
                      backgroundImage: `linear-gradient(rgba(11, 18, 32, 0.02), rgba(11, 18, 32, 0.02)), url(${member.photo})`,
                      backgroundSize: 'cover',
                      backgroundPosition: member.position,
                    }}
                  />
                  <div>
                    <div style={{ fontFamily: MONO, color: palette.faint, fontSize: 18 }}>
                      member 0{personIndex + 1}
                    </div>
                    <h2 style={{ margin: '16px 0 12px', fontSize: 58, lineHeight: 1.05 }}>
                      {member.name}
                    </h2>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 26,
                        lineHeight: 1.25,
                        color: palette.text,
                        fontWeight: 720,
                      }}
                    >
                      {member.role}
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    marginBottom: 18,
                    padding: '9px 14px',
                    borderRadius: 999,
                    background: palette.panel,
                    color: palette.accent,
                    fontFamily: MONO,
                    fontSize: 18,
                    fontWeight: 760,
                    letterSpacing: '0.04em',
                  }}
                >
                  {member.focus}
                </div>
                <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
                  {member.owns.map((item) => (
                    <div
                      key={item}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '11px 13px',
                        borderRadius: 8,
                        border: `1px solid ${palette.border}`,
                        background: palette.canvas,
                        fontSize: 20,
                        fontWeight: 680,
                        color: palette.text,
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: personIndex === 0 ? palette.green : palette.accent,
                          flex: '0 0 auto',
                        }}
                      />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 23, lineHeight: 1.42, color: palette.muted }}>
                {member.deliverable}
              </p>
            </Panel>
          ))}
        </div>
        <Footer section="codex://team" />
      </div>
    );
  }

  if (slide.layout === 'fde-market-signal') {
    const jobs = slide.jobScreenshots ?? [];

    return (
      <div style={{ ...pageBase, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Style />
        <SoftGlow x="82%" y="18%" size={760} />
        <SoftGlow x="18%" y="82%" size={600} color="16, 163, 127" />
        <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 34 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Eyebrow>{slide.eyebrow}</Eyebrow>
            <Title size={64} maxWidth={1120}>
              {slide.title}
            </Title>
            {slide.body ? <Paragraph maxWidth={1030}>{slide.body}</Paragraph> : null}
          </div>
          <Panel dark style={{ padding: '24px 28px', alignSelf: 'end' }}>
            <div style={{ fontFamily: MONO, fontSize: 17, color: '#93C5FD', fontWeight: 860 }}>
              FDE = Forward Deployed Engineer
            </div>
            <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
              {(slide.bullets ?? []).map((item, index) => (
                <div
                  key={item}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '44px 1fr',
                    gap: 14,
                    alignItems: 'center',
                    color: '#E5EEF9',
                    fontSize: 22,
                    lineHeight: 1.25,
                    fontWeight: 720,
                  }}
                >
                  <span
                    style={{
                      width: 36,
                      height: 30,
                      borderRadius: 999,
                      display: 'grid',
                      placeItems: 'center',
                      background: 'rgba(147,197,253,0.14)',
                      color: '#93C5FD',
                      fontFamily: MONO,
                      fontSize: 14,
                      fontWeight: 860,
                    }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 18,
            flex: 1,
            minHeight: 0,
          }}
        >
          {jobs.map((job, index) => (
            <Panel
              key={job.company}
              style={{
                padding: 0,
                display: 'grid',
                gridTemplateRows: '230px 1fr',
                overflow: 'hidden',
                borderTop: `5px solid ${
                  index === 0 ? palette.accent : index === 1 ? palette.green : palette.amber
                }`,
              }}
            >
              <div style={{ position: 'relative', background: palette.bg, overflow: 'hidden' }}>
                <img
                  src={job.image}
                  alt={`${job.company} FDE job screenshot`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: index === 2 ? 'left top' : 'center top',
                    filter: 'saturate(0.92)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    border: '1px solid rgba(15,23,42,0.08)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
              <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div
                  style={{ fontFamily: MONO, fontSize: 16, color: palette.faint, fontWeight: 860 }}
                >
                  {job.company}
                </div>
                <h3 style={{ margin: 0, fontSize: 29, lineHeight: 1.08 }}>{job.role}</h3>
                <p
                  style={{
                    margin: 'auto 0 0',
                    fontSize: 18,
                    lineHeight: 1.28,
                    color: palette.muted,
                  }}
                >
                  {job.source}
                </p>
              </div>
            </Panel>
          ))}
        </div>
        <Footer section={slide.section} />
      </div>
    );
  }

  if (slide.layout === 'agenda') {
    return (
      <div style={{ ...pageBase, display: 'grid', gridTemplateRows: 'auto 1fr', gap: 34 }}>
        <Style />
        <SoftGlow x="84%" y="20%" size={820} />
        <SoftGlow x="18%" y="78%" size={620} color="16, 163, 127" />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <Eyebrow>{slide.eyebrow}</Eyebrow>
            <Title size={132}>{slide.title}</Title>
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 148,
              lineHeight: 0.82,
              fontWeight: 760,
              color: 'rgba(79, 140, 255, 0.1)',
            }}
          >
            05
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '0.74fr 1.26fr',
            gap: 42,
            alignItems: 'stretch',
            minHeight: 0,
          }}
        >
          <div
            style={{
              alignSelf: 'end',
              paddingBottom: 52,
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
            }}
          >
            {slide.body ? <Paragraph maxWidth={560}>{slide.body}</Paragraph> : null}
            <div style={{ height: 2, width: 260, background: palette.accent }} />
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            {(slide.diagram ?? []).map((item, itemIndex) => (
              <div
                key={item}
                style={{
                  minHeight: 82,
                  borderRadius: 8,
                  border: `1px solid ${itemIndex === 0 ? palette.accent : palette.border}`,
                  background: itemIndex === 0 ? palette.panelHi : palette.canvas,
                  display: 'grid',
                  gridTemplateColumns: '84px 1fr',
                  gap: 20,
                  alignItems: 'center',
                  padding: '0 28px',
                  animation: 'deckFadeUp 680ms cubic-bezier(0.22, 1, 0.36, 1) both',
                  animationDelay: `${itemIndex * 70}ms`,
                }}
              >
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 25,
                    color: itemIndex === 0 ? palette.accent : palette.faint,
                  }}
                >
                  {String(itemIndex + 1).padStart(2, '0')}
                </div>
                <div style={{ fontSize: 31, lineHeight: 1.18, fontWeight: 680 }}>{item}</div>
              </div>
            ))}
          </div>
        </div>
        <Footer section={slide.section} />
      </div>
    );
  }

  if (slide.layout === 'one-liner') {
    const prompts = [
      { label: 'For', title: 'target user', body: '幫誰？' },
      { label: 'Who', title: 'has this problem', body: '在哪個情境卡住？' },
      { label: 'This app helps', title: 'achieve this result', body: '完成什麼結果？' },
      { label: 'By', title: 'core interaction', body: '靠哪個互動做到？' },
    ];

    return (
      <div style={{ ...pageBase, display: 'flex', flexDirection: 'column', gap: 40 }}>
        <Style />
        <SoftGlow x="84%" y="22%" size={720} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <Eyebrow>1d discover</Eyebrow>
          <Title size={74} maxWidth={1680}>
            不要先寫功能列表；先用一句話定義 App。
          </Title>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 18 }}>
          {prompts.map((prompt) => (
            <Panel key={prompt.label} style={{ minHeight: 190, padding: 26 }}>
              <div
                style={{ fontFamily: MONO, fontSize: 23, color: palette.rose, marginBottom: 26 }}
              >
                {prompt.label}
              </div>
              <h3 style={{ margin: '0 0 18px', fontSize: 33, lineHeight: 1.08 }}>{prompt.title}</h3>
              <p style={{ margin: 0, fontSize: 24, lineHeight: 1.35, color: palette.muted }}>
                {prompt.body}
              </p>
            </Panel>
          ))}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '0.52fr 0.98fr 230px',
            gap: 28,
            alignItems: 'stretch',
            flex: 1,
            minHeight: 0,
          }}
        >
          <Panel
            style={{
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: 25, lineHeight: 1.2, color: palette.muted, fontWeight: 720 }}>
              範例
            </div>
            <h2 style={{ margin: '28px 0 0', fontSize: 52, lineHeight: 1.08 }}>半逢遇甲</h2>
          </Panel>
          <div
            style={{
              borderTop: `2px solid ${palette.border}`,
              paddingTop: 28,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 12,
              fontSize: 27,
              lineHeight: 1.42,
              color: palette.text,
            }}
          >
            <div>
              半逢遇甲是給 <strong>逢甲大學學生</strong> 使用的 App。
            </div>
            <div>
              它解決 <strong>行動逢甲課表需要滑動</strong> 才能查看完整資訊的問題。
            </div>
            <div>
              使用者可以 <strong>一眼看完今天完整課表</strong>。
            </div>
            <div>
              核心互動是把 <strong>課程時間、地點與下一堂課提醒</strong> 放在同一個課表畫面。
            </div>
          </div>
          <div style={{ display: 'grid', placeItems: 'stretch' }}>
            <Panel
              style={{
                height: '100%',
                padding: 10,
                background: palette.canvas,
                boxShadow: '0 24px 70px rgba(15, 23, 42, 0.08)',
              }}
            >
              <img
                src={banfengSchedulePhoto}
                alt="半逢遇甲課表截圖"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  borderRadius: 6,
                  display: 'block',
                }}
              />
            </Panel>
          </div>
        </div>
        <Footer section={slide.section} />
      </div>
    );
  }

  if (slide.layout === 'next-step') {
    const blockers = [
      { title: '點子變太大', body: '一開始就想做完整系統' },
      { title: '路徑太模糊', body: 'UI、資料、同步、登入一起想' },
      { title: '太晚看到結果', body: '沒有 demo，也沒有真人 feedback' },
    ];
    const flowItems = blockers.flatMap((blocker, blockerIndex) => {
      const card = (
        <Panel
          key={`${blocker.title}-card`}
          style={{
            minHeight: 236,
            padding: 34,
            borderTop: `5px solid ${palette.border}`,
            background: palette.canvas,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 22, color: palette.rose }}>
            {String(blockerIndex + 1).padStart(2, '0')}
          </div>
          <div>
            <h3 style={{ margin: '0 0 16px', fontSize: 43, lineHeight: 1.06 }}>{blocker.title}</h3>
            <p style={{ margin: 0, fontSize: 25, lineHeight: 1.34, color: palette.muted }}>
              {blocker.body}
            </p>
          </div>
        </Panel>
      );

      if (blockerIndex === blockers.length - 1) return [card];

      const arrow = (
        <div key={`${blocker.title}-arrow`} style={{ display: 'grid', placeItems: 'center' }}>
          <div
            style={{
              width: '100%',
              height: 3,
              background: palette.accent,
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                right: -1,
                top: '50%',
                width: 0,
                height: 0,
                transform: 'translateY(-50%)',
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderLeft: `14px solid ${palette.accent}`,
              }}
            />
          </div>
        </div>
      );

      return [card, arrow];
    });

    return (
      <div
        style={{
          ...pageBase,
          background: palette.bg,
          color: palette.text,
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
          gap: 40,
        }}
      >
        <Style />
        <SoftGlow x="84%" y="22%" size={760} />
        <SoftGlow x="18%" y="78%" size={620} color="16, 163, 127" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <Eyebrow>opening</Eyebrow>
          <Title size={68} maxWidth={1720}>
            很多 App 不是卡在技術，而是卡在「下一步」。
          </Title>
        </div>
        <div
          style={{
            display: 'flex',
            minHeight: 0,
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 48,
            paddingBottom: 84,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ fontFamily: MONO, fontSize: 20, color: palette.faint }}>
              why apps stop moving
            </div>
            <div style={{ flex: 1, height: 2, marginLeft: 28, background: palette.border }} />
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 64px 1fr 64px 1fr',
              gap: 16,
              alignItems: 'stretch',
            }}
          >
            {flowItems}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 18,
              borderTop: `2px solid ${palette.border}`,
              paddingTop: 34,
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '12px 1fr',
                gap: 18,
                alignItems: 'center',
              }}
            >
              <div
                style={{ width: 12, height: '100%', borderRadius: 999, background: palette.rose }}
              />
              <p
                style={{
                  margin: 0,
                  fontSize: 29,
                  lineHeight: 1.26,
                  color: palette.muted,
                  fontWeight: 720,
                  whiteSpace: 'nowrap',
                }}
              >
                最大的敵人不是技術，而是範圍太大、路徑太模糊、太遲看到真實結果。
              </p>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '12px 1fr',
                gap: 18,
                alignItems: 'center',
              }}
            >
              <div
                style={{ width: 12, height: '100%', borderRadius: 999, background: palette.green }}
              />
              <p
                style={{
                  margin: 0,
                  fontSize: 34,
                  lineHeight: 1.22,
                  fontWeight: 820,
                  whiteSpace: 'nowrap',
                }}
              >
                最短路徑先找出：什麼體驗最能代表這個 App 的價值。
              </p>
            </div>
          </div>
        </div>
        <Footer section={slide.section} />
      </div>
    );
  }

  if (slide.layout === 'codex-ui') {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          background: palette.bg,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 1920,
            height: 1080,
          }}
        >
          <img
            src={codexAppInterface}
            alt="OpenAI Codex app interface screenshot"
            style={{
              position: 'absolute',
              left: 318,
              top: 120,
              width: 1284,
              height: 734,
              objectFit: 'contain',
              objectPosition: 'center',
              borderRadius: 14,
              display: 'block',
            }}
          />
          <CodexInterfaceCallout
            label="01"
            title="功能側欄"
            body="建立新任務、搜尋舊 thread、管理外掛與自動化；先從這裡決定要開哪一種工作模式。"
            box={{ x: 329, y: 163, width: 190, height: 121 }}
            card={{ x: 48, y: 156, width: 244 }}
            line={{ from: { x: 292, y: 219 }, to: { x: 329, y: 224 } }}
          />
          <CodexInterfaceCallout
            label="02"
            title="專案側欄"
            body="每個專案底下都有自己的任務紀錄；切換前先確認 workspace，避免把需求送到錯的 repo。"
            box={{ x: 326, y: 291, width: 194, height: 537 }}
            card={{ x: 48, y: 454, width: 244 }}
            line={{ from: { x: 292, y: 516 }, to: { x: 326, y: 560 } }}
          />
          <CodexInterfaceCallout
            label="03"
            title="對話內容"
            body="目標、決策、工具輸出與驗證結果會留在同一條 thread，方便回看 agent 為什麼這樣改。"
            box={{ x: 596, y: 191, width: 658, height: 552 }}
            card={{ x: 1624, y: 492, width: 248 }}
            line={{ from: { x: 1624, y: 552 }, to: { x: 1254, y: 468 } }}
          />
          <CodexInterfaceCallout
            label="04"
            title="環境面板"
            body="確認目前 repo、branch、變更檔案與 PR 入口；這裡是人工 review 和交付前檢查的地方。"
            box={{ x: 1300, y: 173, width: 281, height: 257 }}
            card={{ x: 1624, y: 250, width: 248 }}
            line={{ from: { x: 1624, y: 310 }, to: { x: 1581, y: 302 } }}
          />
          <CodexInterfaceCallout
            label="05"
            title="Composer"
            body="把目標、限制、檔案範圍和驗證方式寫清楚，下一輪 agent 才知道要做什麼，也知道不要做什麼。"
            box={{ x: 596, y: 756, width: 643, height: 80 }}
            card={{ x: 760, y: 884, width: 506 }}
            line={{ from: { x: 1013, y: 884 }, to: { x: 918, y: 836 } }}
          />
        </div>
      </div>
    );
  }

  if (slide.layout === 'spec-driven') {
    return (
      <div style={{ ...pageBase, padding: '72px 108px 76px' }}>
        <Style />
        <SoftGlow x="82%" y="12%" size={700} />
        <SoftGlow x="14%" y="82%" size={600} color="16, 163, 127" />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.05fr 0.95fr',
            gap: 54,
            alignItems: 'end',
            marginBottom: 30,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Eyebrow>{slide.eyebrow}</Eyebrow>
            <Title size={70} maxWidth={980}>
              {slide.title}
            </Title>
          </div>
          <Panel
            style={{
              padding: '24px 28px',
              background: palette.ink,
              borderColor: 'rgba(255,255,255,0.12)',
            }}
          >
            <div
              style={{
                marginBottom: 10,
                fontFamily: MONO,
                fontSize: 18,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#93C5FD',
              }}
            >
              natural language spec
            </div>
            <p style={{ margin: 0, fontSize: 28, lineHeight: 1.38, color: '#E5EEF9' }}>
              先把「人怎麼判斷做對了」寫清楚，再讓 Codex 寫程式。
            </p>
            <p
              style={{
                margin: '16px 0 0',
                paddingTop: 14,
                borderTop: '1px solid rgba(255,255,255,0.12)',
                fontSize: 20,
                lineHeight: 1.38,
                color: 'rgba(229,238,249,0.72)',
              }}
            >
              備註：Spec 是用自然語言描述功能行為、限制與驗收標準的文件。
            </p>
          </Panel>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
          }}
        >
          {(slide.specItems ?? []).map((item) => (
            <SpecCard key={item.label} item={item} />
          ))}
        </div>
        <Footer section={slide.section} />
      </div>
    );
  }

  if (slide.layout === 'constitution') {
    const ruleMeta = [
      { label: '01 / Type Safety', note: '讓 Codex 不要為了通過編譯偷懶。' },
      { label: '02 / Commit Style', note: '讓每次變更都能被團隊快速理解。' },
      { label: '03 / MVP Scope', note: '讓 agent 先完成最小可驗證版本。' },
    ];

    return (
      <div style={{ ...pageBase, padding: '76px 108px 76px' }}>
        <Style />
        <SoftGlow x="78%" y="18%" size={720} />
        <SoftGlow x="12%" y="78%" size={620} color="16, 163, 127" />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            marginBottom: 42,
            maxWidth: 1500,
          }}
        >
          <Eyebrow>{slide.eyebrow}</Eyebrow>
          <Title size={84} maxWidth={820}>
            {slide.title}
          </Title>
          <Paragraph maxWidth={1450} noWrap>
            把團隊標準先寫成文件，確保產出符合團隊標準，也讓 agent 一開始就有共同邊界。
          </Paragraph>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 24,
          }}
        >
          {(slide.bullets ?? []).map((bullet, ruleIndex) => (
            <Panel
              key={bullet}
              style={{
                minHeight: 318,
                padding: 28,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 18px 44px rgba(15,23,42,0.06)',
              }}
            >
              <div>
                <div
                  style={{
                    marginBottom: 34,
                    fontFamily: MONO,
                    fontSize: 18,
                    fontWeight: 780,
                    color: ruleIndex === 1 ? palette.accent : palette.green,
                  }}
                >
                  {ruleMeta[ruleIndex]?.label}
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 36,
                    lineHeight: 1.18,
                    fontWeight: 840,
                    letterSpacing: 0,
                  }}
                >
                  {bullet}
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: 23, lineHeight: 1.42, color: palette.muted }}>
                {ruleMeta[ruleIndex]?.note}
              </p>
            </Panel>
          ))}
        </div>
        <Panel
          style={{
            marginTop: 28,
            padding: '22px 28px',
            display: 'grid',
            gridTemplateColumns: '220px 1fr',
            gap: 22,
            alignItems: 'center',
            background: palette.panel,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 18,
              fontWeight: 820,
              color: palette.accent,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            why it matters
          </div>
          <p style={{ margin: 0, fontSize: 27, lineHeight: 1.38, color: palette.text }}>
            CONSTITUTION.md 不是需求文件，而是讓每一次 agent 任務都遵守的工程底線。
          </p>
        </Panel>
        <Footer section={slide.section} />
      </div>
    );
  }

  if (slide.layout === 'dialogue') {
    return (
      <div style={{ ...pageBase, display: 'flex', flexDirection: 'column', gap: 34 }}>
        <Style />
        <SoftGlow x="82%" y="22%" size={720} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Eyebrow>{slide.eyebrow}</Eyebrow>
          <Title size={76} maxWidth={1450}>
            {slide.title}
          </Title>
          {slide.body ? (
            <Paragraph maxWidth={slide.bodyMaxWidth ?? 1380} noWrap={slide.bodyNoWrap}>
              {slide.body}
            </Paragraph>
          ) : null}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: 30,
            alignItems: 'stretch',
            marginTop: 4,
          }}
        >
          {(slide.dialogues ?? []).map((item) => (
            <DialogueCard key={item.label} item={item} />
          ))}
        </div>
        <Footer section={slide.section} />
      </div>
    );
  }

  if (slide.layout === 'skill-routing') {
    return (
      <div style={{ ...pageBase, display: 'flex', flexDirection: 'column', gap: 34 }}>
        <Style />
        <SoftGlow x="20%" y="22%" size={620} color="16, 163, 127" />
        <SoftGlow x="82%" y="70%" size={720} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Eyebrow>{slide.eyebrow}</Eyebrow>
          <Title size={74} maxWidth={1440}>
            {slide.title}
          </Title>
          {slide.body ? <Paragraph maxWidth={1420}>{slide.body}</Paragraph> : null}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '560px minmax(0, 1fr)',
            gap: 34,
            alignItems: 'stretch',
            marginTop: 8,
          }}
        >
          <Panel
            style={{
              minHeight: 560,
              padding: 34,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: palette.ink,
              color: '#E5EEF9',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 18,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#93C5FD',
                  fontWeight: 820,
                  marginBottom: 18,
                }}
              >
                user task
              </div>
              <div
                style={{
                  borderRadius: 18,
                  padding: '24px 26px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  fontSize: 30,
                  lineHeight: 1.4,
                  fontWeight: 740,
                }}
              >
                我要做一個提醒事項 App。
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gap: 14,
              }}
            >
              {['讀取 skill name', '比對 description', '只載入相關 SKILL.md'].map((step, index) => (
                <div
                  key={step}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '48px 1fr',
                    gap: 14,
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 999,
                      display: 'grid',
                      placeItems: 'center',
                      background: index === 2 ? palette.green : 'rgba(255,255,255,0.1)',
                      color: index === 2 ? '#F8FAFC' : 'rgba(229,238,249,0.72)',
                      fontFamily: MONO,
                      fontSize: 18,
                      fontWeight: 860,
                    }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div style={{ fontSize: 25, lineHeight: 1.32, color: 'rgba(229,238,249,0.86)' }}>
                    {step}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <div style={{ display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: 18 }}>
            {(slide.skillRoutes ?? []).map((route) => (
              <Panel
                key={route.label}
                style={{
                  padding: 30,
                  display: 'grid',
                  gridTemplateColumns: '88px 1fr 120px',
                  gap: 24,
                  alignItems: 'center',
                  borderColor: route.active ? palette.green : palette.border,
                  background: route.active ? '#ECFDF5' : 'rgba(255,255,255,0.72)',
                  opacity: route.active ? 1 : 0.58,
                  boxShadow: route.active
                    ? '0 22px 54px rgba(16,163,127,0.18)'
                    : '0 16px 40px rgba(15,23,42,0.05)',
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 18,
                    display: 'grid',
                    placeItems: 'center',
                    background: route.active ? palette.green : palette.panel,
                    color: route.active ? '#F8FAFC' : palette.faint,
                    fontFamily: MONO,
                    fontSize: 21,
                    fontWeight: 860,
                  }}
                >
                  md
                </div>
                <div>
                  <div
                    style={{
                      marginBottom: 10,
                      fontFamily: MONO,
                      fontSize: 18,
                      color: route.active ? palette.green : palette.faint,
                      fontWeight: 820,
                    }}
                  >
                    {route.label}
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: 34, lineHeight: 1.14 }}>
                    {route.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: 23, lineHeight: 1.36, color: palette.muted }}>
                    {route.body}
                  </p>
                </div>
                <div
                  style={{
                    justifySelf: 'end',
                    padding: '10px 14px',
                    borderRadius: 999,
                    fontFamily: MONO,
                    fontSize: 16,
                    fontWeight: 820,
                    color: route.active ? palette.green : palette.faint,
                    background: route.active ? '#D1FAE5' : palette.panel,
                  }}
                >
                  {route.active ? 'loaded' : 'skipped'}
                </div>
              </Panel>
            ))}
          </div>
        </div>
        <Panel
          style={{
            padding: '20px 28px',
            display: 'grid',
            gridTemplateColumns: '220px 1fr',
            gap: 22,
            alignItems: 'center',
            background: palette.panel,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 18,
              fontWeight: 820,
              color: palette.accent,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            token budget
          </div>
          <p style={{ margin: 0, fontSize: 27, lineHeight: 1.34, color: palette.text }}>
            最好的 Skill 系統不是「全部記住」，而是「需要時才載入」，避免 token 被無關文件吃掉。
          </p>
        </Panel>
        <Footer section={slide.section} />
      </div>
    );
  }

  if (slide.layout === 'skill-script-bundling') {
    const referenceCards = [
      {
        label: 'reference',
        title: 'pdf/reference.md',
        body: '進階用法、替代 library、詳細範例放到外部 reference，只有需要時才讀。',
      },
      {
        label: 'script',
        title: 'scripts/check_fillable_fields.py',
        body: '穩定判斷交給 script，agent 只接收可用結果，不必把整份判斷規則塞進 context。',
      },
      {
        label: 'assets',
        title: 'assets/example.pdf',
        body: '範例檔、模板、圖片或測試資料放在 assets，讓 agent 需要時直接引用。',
      },
    ];

    return (
      <div style={{ ...pageBase, display: 'flex', flexDirection: 'column', gap: 28 }}>
        <Style />
        <SoftGlow x="16%" y="28%" size={640} color="79, 140, 255" />
        <SoftGlow x="83%" y="70%" size={720} color="245, 158, 11" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Eyebrow>{slide.eyebrow}</Eyebrow>
          <Title size={70} maxWidth={1520}>
            {slide.title}
          </Title>
          {slide.body ? <Paragraph maxWidth={1380}>{slide.body}</Paragraph> : null}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 0.95fr)',
            gap: 30,
            flex: 1,
            minHeight: 0,
          }}
        >
          <Panel
            style={{
              padding: 34,
              background: '#F5F3ED',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              minHeight: 0,
            }}
          >
            <div
              style={{
                fontFamily: MONO,
                fontSize: 28,
                fontWeight: 820,
                color: '#47A9DC',
              }}
            >
              pdf/SKILL.md
            </div>
            <div
              style={{
                border: '3px solid #48A8DA',
                borderRadius: 14,
                overflow: 'hidden',
                fontFamily: MONO,
                color: '#5F6D76',
                flex: 1,
                minHeight: 0,
              }}
            >
              <div
                style={{
                  background: '#BFE1F8',
                  padding: '22px 28px',
                  borderBottom: '3px solid #48A8DA',
                }}
              >
                <div style={{ color: '#49A9DC', fontFamily: SANS, fontSize: 28, fontWeight: 780 }}>
                  YAML Frontmatter
                </div>
                <pre style={{ margin: '16px 0 0', fontSize: 19, lineHeight: 1.26 }}>
                  {'---\nname: pdf\ndescription: PDF workflow with references and scripts.\n---'}
                </pre>
              </div>
              <div
                style={{
                  background: '#EAF5FE',
                  padding: '24px 28px',
                }}
              >
                <div style={{ color: '#49A9DC', fontFamily: SANS, fontSize: 28, fontWeight: 780 }}>
                  Markdown
                </div>
                <pre
                  style={{
                    margin: '16px 0 0',
                    whiteSpace: 'pre-wrap',
                    fontSize: 19,
                    lineHeight: 1.42,
                    fontWeight: 700,
                  }}
                >
                  {'## Overview\n\nKeep the main skill short. For advanced examples, read '}
                  <mark style={{ background: '#FDE68A', color: '#374151' }}>./reference.md</mark>
                  {'.\n\nIf the PDF may contain form fields, do not reason from memory. Run:\n'}
                  <mark style={{ background: '#FDE68A', color: '#374151' }}>
                    python scripts/check_fillable_fields.py file.pdf
                  </mark>
                  {'\n\nThen follow the result in fields.json.'}
                </pre>
              </div>
            </div>
          </Panel>
          <div style={{ display: 'grid', gap: 18 }}>
            {referenceCards.map((card, index) => (
              <Panel
                key={card.label}
                style={{
                  padding: '28px 30px',
                  borderColor: index === 1 ? palette.amber : '#F4C66A',
                  background: index === 1 ? '#FFFBEB' : 'rgba(255,255,255,0.78)',
                  display: 'grid',
                  gridTemplateColumns: '92px 1fr',
                  gap: 22,
                  alignItems: 'center',
                  boxShadow: index === 1 ? '0 22px 54px rgba(245,158,11,0.18)' : undefined,
                }}
              >
                <div
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 18,
                    display: 'grid',
                    placeItems: 'center',
                    background: index === 1 ? palette.amber : '#FEF3C7',
                    color: '#111827',
                    fontFamily: MONO,
                    fontSize: 17,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                  }}
                >
                  {card.label}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 9px', fontSize: 33, lineHeight: 1.13 }}>
                    {card.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: 24, lineHeight: 1.38, color: palette.muted }}>
                    {card.body}
                  </p>
                </div>
              </Panel>
            ))}
          </div>
        </div>
        <Panel
          style={{
            padding: '18px 26px',
            display: 'grid',
            gridTemplateColumns: '220px 1fr',
            gap: 22,
            alignItems: 'center',
            background: palette.panel,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 18,
              fontWeight: 820,
              color: palette.accent,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            why split
          </div>
          <p style={{ margin: 0, fontSize: 27, lineHeight: 1.34, color: palette.text }}>
            references 補充細節，scripts 執行穩定判斷，assets 提供可重用素材；agent 只在需要時載入。
          </p>
        </Panel>
        <Footer section={slide.section} />
      </div>
    );
  }

  if (slide.layout === 'skill-md-structure') {
    return (
      <div style={{ ...pageBase, display: 'flex', flexDirection: 'column', gap: 26 }}>
        <Style />
        <SoftGlow x="18%" y="24%" size={620} color="79, 140, 255" />
        <SoftGlow x="82%" y="72%" size={720} color="16, 163, 127" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Eyebrow>{slide.eyebrow}</Eyebrow>
          <Title size={70} maxWidth={1480}>
            {slide.title}
          </Title>
          {slide.body ? <Paragraph maxWidth={1320}>{slide.body}</Paragraph> : null}
        </div>
        <Panel
          style={{
            flex: 1,
            minHeight: 0,
            padding: '26px 40px 34px',
            background: '#F5F3ED',
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
          }}
        >
          <h2
            style={{
              margin: 0,
              textAlign: 'center',
              fontSize: 52,
              lineHeight: 1.08,
              fontWeight: 900,
              color: '#050505',
            }}
          >
            name + description + instructions
          </h2>
          <div
            style={{
              flex: 1,
              borderRadius: 26,
              background: 'rgba(255,255,255,0.68)',
              padding: '28px 310px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                color: '#47A9DC',
                fontSize: 31,
                fontWeight: 760,
                marginBottom: 26,
              }}
            >
              pdf/SKILL.md
            </div>
            <div
              style={{
                border: '3px solid #48A8DA',
                borderRadius: 14,
                overflow: 'hidden',
                color: '#6C7780',
                fontFamily: MONO,
              }}
            >
              <div
                style={{
                  background: '#BFE1F8',
                  padding: '28px 34px 30px',
                  borderBottom: '3px solid #48A8DA',
                }}
              >
                <div
                  style={{
                    marginBottom: 24,
                    fontFamily: SANS,
                    fontSize: 30,
                    fontWeight: 760,
                    color: '#49A9DC',
                  }}
                >
                  YAML Frontmatter: name + description
                </div>
                <div
                  style={{
                    margin: 0,
                    fontSize: 19,
                    lineHeight: 1.28,
                    fontWeight: 700,
                  }}
                >
                  <div>---</div>
                  <div
                    style={{
                      width: 'fit-content',
                      marginTop: 6,
                      padding: '5px 10px',
                      borderRadius: 8,
                      border: `3px solid ${palette.amber}`,
                      background: 'rgba(254,243,199,0.9)',
                      color: '#374151',
                    }}
                  >
                    name: pdf
                    <span
                      style={{
                        marginLeft: 18,
                        padding: '3px 8px',
                        borderRadius: 999,
                        background: palette.amber,
                        color: '#111827',
                        fontFamily: SANS,
                        fontSize: 14,
                        fontWeight: 900,
                      }}
                    >
                      name
                    </span>
                  </div>
                  <div
                    style={{
                      width: 'fit-content',
                      maxWidth: 760,
                      marginTop: 8,
                      padding: '6px 10px',
                      borderRadius: 8,
                      border: `3px solid ${palette.green}`,
                      background: 'rgba(209,250,229,0.82)',
                      color: '#374151',
                    }}
                  >
                    description: Use when extracting text, splitting documents, merging PDFs, or
                    filling PDF forms.
                    <span
                      style={{
                        marginLeft: 18,
                        padding: '3px 8px',
                        borderRadius: 999,
                        background: palette.green,
                        color: '#F8FAFC',
                        fontFamily: SANS,
                        fontSize: 14,
                        fontWeight: 900,
                      }}
                    >
                      description
                    </span>
                  </div>
                  <div style={{ marginTop: 6 }}>---</div>
                </div>
              </div>
              <div
                style={{
                  background: '#EAF5FE',
                  padding: '26px 34px 34px',
                }}
              >
                <div
                  style={{
                    marginBottom: 20,
                    fontFamily: SANS,
                    fontSize: 30,
                    fontWeight: 760,
                    color: '#49A9DC',
                  }}
                >
                  Instructions
                </div>
                <div
                  style={{
                    margin: 0,
                    position: 'relative',
                    padding: '18px 20px',
                    borderRadius: 12,
                    border: `3px solid ${palette.accent}`,
                    background: 'rgba(239,246,255,0.72)',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      right: 18,
                      top: -16,
                      padding: '5px 12px',
                      borderRadius: 999,
                      background: palette.accent,
                      color: '#F8FAFC',
                      fontFamily: SANS,
                      fontSize: 16,
                      fontWeight: 900,
                    }}
                  >
                    instructions
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      fontSize: 18,
                      lineHeight: 1.32,
                      fontWeight: 700,
                    }}
                  >
                    {
                      '## Instructions\n\n1. Identify the PDF task: extract text, split, merge, or fill a form.\n2. Choose the smallest tool that solves the task.\n3. If the file may contain form fields, run the helper script first.\n4. Return the changed files, command output, and remaining risks.\n\n## Example\n\n```python\nfrom pypdf import PdfReader, PdfWriter\n\nreader = PdfReader("document.pdf")\nprint(f"Pages: {len(reader.pages)}")\n```\n\n...'
                    }
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </Panel>
        <Footer section={slide.section} />
      </div>
    );
  }

  if (slide.layout === 'article-source') {
    if (slide.image) {
      return (
        <div
          style={{
            ...pageBase,
            padding: 0,
            background: '#111111',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <img
            src={slide.image}
            alt={slide.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>
      );
    }

    return (
      <div style={{ ...pageBase, display: 'flex', flexDirection: 'column', gap: 28 }}>
        <Style />
        <SoftGlow x="18%" y="18%" size={620} color="16, 163, 127" />
        <SoftGlow x="84%" y="72%" size={740} />
        <Panel
          style={{
            minHeight: 438,
            padding: 44,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 380px',
            gap: 52,
            alignItems: 'center',
            background: palette.canvas,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            <div
              style={{
                width: 156,
                height: 156,
                borderRadius: 32,
                background: '#D47D5A',
                color: palette.ink,
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 22px 52px rgba(212,125,90,0.22)',
              }}
            >
              <div
                style={{
                  width: 88,
                  height: 96,
                  borderRadius: 10,
                  border: `4px solid ${palette.ink}`,
                  background: 'rgba(255,255,255,0.5)',
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: MONO,
                  fontSize: 18,
                  fontWeight: 900,
                  lineHeight: 1.05,
                  textAlign: 'center',
                }}
              >
                SKILL
                <br />
                .md
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Eyebrow>{slide.eyebrow}</Eyebrow>
              <Title size={86} maxWidth={980}>
                {slide.title}
              </Title>
              {slide.body ? <Paragraph maxWidth={1060}>{slide.body}</Paragraph> : null}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {(slide.sourceMeta ?? []).map((item) => (
              <div
                key={item.label}
                style={{
                  paddingBottom: 18,
                  borderBottom: `1px solid ${palette.border}`,
                }}
              >
                <div
                  style={{
                    marginBottom: 8,
                    fontFamily: MONO,
                    fontSize: 17,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: palette.faint,
                  }}
                >
                  {item.label}
                </div>
                <div style={{ fontSize: 28, lineHeight: 1.28, fontWeight: 760 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </Panel>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)',
            gap: 28,
          }}
        >
          <Panel
            style={{
              minHeight: 292,
              padding: 34,
              background: palette.ink,
              color: '#E5EEF9',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 20,
            }}
          >
            <div
              style={{
                fontFamily: MONO,
                fontSize: 18,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#93C5FD',
                fontWeight: 820,
              }}
            >
              core definition
            </div>
            <p style={{ margin: 0, fontSize: 34, lineHeight: 1.4, fontWeight: 720 }}>
              Skills 是 agent 可按需載入的工作資料夾，裡面放指令、腳本與資源。
            </p>
            <p
              style={{ margin: 0, fontSize: 24, lineHeight: 1.48, color: 'rgba(229,238,249,0.7)' }}
            >
              重點不是寫更長的 prompt，而是把重複的 domain workflow 變成可重用能力。
            </p>
          </Panel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            {(slide.cards ?? []).map((card) => (
              <Panel
                key={card.label}
                style={{
                  padding: '22px 26px',
                  display: 'grid',
                  gridTemplateColumns: '82px 1fr',
                  gap: 20,
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 22,
                    fontWeight: 860,
                    color: palette.accent,
                  }}
                >
                  {card.label}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 6px', fontSize: 28, lineHeight: 1.18 }}>
                    {card.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: 22, lineHeight: 1.36, color: palette.muted }}>
                    {card.body}
                  </p>
                </div>
              </Panel>
            ))}
          </div>
        </div>
        <Footer section={slide.section} />
      </div>
    );
  }

  if (slide.layout === 'section') {
    return (
      <div style={{ ...pageBase, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <Style />
        <SoftGlow x="50%" y="44%" size={960} color={slide.accent ?? '79, 140, 255'} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
          <Eyebrow color={slide.accent ? `rgb(${slide.accent})` : palette.green}>
            {slide.eyebrow}
          </Eyebrow>
          <Title
            size={slide.titleSize ?? 92}
            maxWidth={slide.titleMaxWidth}
            noWrap={slide.titleNoWrap}
          >
            {slide.title}
          </Title>
          {slide.body ? (
            <Paragraph maxWidth={slide.bodyMaxWidth ?? 980} noWrap={slide.bodyNoWrap}>
              {slide.body}
            </Paragraph>
          ) : null}
        </div>
        <Footer section={slide.section} />
      </div>
    );
  }

  if (slide.layout === 'quote-only') {
    return (
      <div style={{ ...pageBase, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <Style />
        <SoftGlow x="52%" y="44%" size={920} />
        <div style={{ maxWidth: 1260 }}>
          <p
            style={{
              margin: 0,
              fontSize: 72,
              lineHeight: 1.2,
              fontWeight: 820,
              letterSpacing: 0,
            }}
          >
            {slide.quote ?? slide.title}
          </p>
        </div>
        <Footer section={slide.section} />
      </div>
    );
  }

  if (slide.layout === 'brainstorming-skill') {
    return (
      <div style={{ ...pageBase, display: 'grid', gridTemplateRows: 'auto 1fr', gap: 30 }}>
        <Style />
        <SoftGlow x="22%" y="72%" size={700} color="16, 163, 127" />
        <SoftGlow x="78%" y="30%" size={760} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Eyebrow>{slide.eyebrow}</Eyebrow>
          <Title
            size={slide.titleSize ?? 66}
            maxWidth={slide.titleMaxWidth ?? 1420}
            noWrap={slide.titleNoWrap}
          >
            {slide.title}
          </Title>
          {slide.body ? <Paragraph maxWidth={1320}>{slide.body}</Paragraph> : null}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '0.98fr 1.02fr',
            gap: 32,
            minHeight: 0,
            alignItems: 'stretch',
          }}
        >
          <figure
            style={{
              margin: 0,
              borderRadius: 14,
              border: `1px solid ${palette.border}`,
              background: palette.ink,
              overflow: 'hidden',
              boxShadow: '0 26px 70px rgba(15, 23, 42, 0.22)',
              position: 'relative',
              minHeight: 0,
            }}
          >
            {slide.image ? (
              <img
                src={slide.image}
                alt="Brainstorming Skill screenshot"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  display: 'block',
                }}
              />
            ) : null}
            <figcaption
              style={{
                position: 'absolute',
                left: 20,
                bottom: 18,
                borderRadius: 999,
                background: 'rgba(11,18,32,0.78)',
                color: '#E5EEF9',
                padding: '9px 14px',
                fontFamily: MONO,
                fontSize: 18,
                backdropFilter: 'blur(12px)',
              }}
            >
              Codex / Superpowers / Brainstorming Skill
            </figcaption>
          </figure>
          <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', gap: 18, minHeight: 0 }}>
            <Panel dark style={{ padding: 28 }}>
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 20,
                  fontWeight: 840,
                  color: palette.accent,
                  marginBottom: 12,
                  textTransform: 'uppercase',
                }}
              >
                SKILL.md 重點翻譯
              </div>
              <p style={{ margin: 0, fontSize: 31, lineHeight: 1.38, fontWeight: 760 }}>
                這個 Skill 會在實作前探索意圖、需求與設計，透過自然對話把模糊點子整理成可執行的 md
                spec。
              </p>
            </Panel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {(slide.cards ?? []).map((card) => (
                <Panel key={card.label} style={{ padding: 22 }}>
                  <div
                    style={{
                      fontFamily: MONO,
                      fontSize: 18,
                      fontWeight: 840,
                      color: palette.green,
                      marginBottom: 10,
                    }}
                  >
                    {card.label}
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: 28, lineHeight: 1.16 }}>
                    {card.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: 22, lineHeight: 1.42, color: palette.muted }}>
                    {card.body}
                  </p>
                </Panel>
              ))}
            </div>
          </div>
        </div>
        <Footer section={slide.section} />
      </div>
    );
  }

  return (
    <div style={{ ...pageBase, display: 'flex', flexDirection: 'column', gap: 30 }}>
      <Style />
      <SoftGlow x={index % 2 === 0 ? '84%' : '16%'} y="22%" size={720} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Eyebrow>{slide.eyebrow}</Eyebrow>
        <Title maxWidth={slide.titleMaxWidth} noWrap={slide.titleNoWrap} size={slide.titleSize}>
          {slide.title}
        </Title>
        {slide.body ? (
          <Paragraph maxWidth={slide.bodyMaxWidth} noWrap={slide.bodyNoWrap}>
            {slide.body}
          </Paragraph>
        ) : null}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            slide.layout === 'code' || slide.layout === 'diagram' ? '0.94fr 1.06fr' : '1fr',
          gap: 28,
          alignItems: 'start',
          flex: 1,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {slide.bullets ? <BulletList bullets={slide.bullets} /> : null}
          {slide.quote ? (
            <Panel style={{ padding: 28, background: palette.panel }}>
              <p style={{ margin: 0, fontSize: 34, lineHeight: 1.28, fontWeight: 720 }}>
                {slide.quote}
              </p>
            </Panel>
          ) : null}
          {slide.aside ? (
            <div style={{ fontFamily: MONO, fontSize: 20, lineHeight: 1.55, color: palette.faint }}>
              {slide.aside}
            </div>
          ) : null}
        </div>
        {slide.cards ? (
          slide.section === 'codex://6d' ? (
            <SixDCycle cards={slide.cards} />
          ) : (
            <CardGrid cards={slide.cards} />
          )
        ) : null}
        {slide.code ? <CodeBlock lines={slide.code} /> : null}
        {slide.diagram ? (
          <MiniBrowser>
            <div style={{ display: 'grid', gap: 12 }}>
              {slide.diagram.map((item, itemIndex) => (
                <div
                  key={item}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '44px 1fr',
                    gap: 14,
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      display: 'grid',
                      placeItems: 'center',
                      background: itemIndex === 0 ? palette.ink : palette.panel,
                      color: itemIndex === 0 ? '#E5EEF9' : palette.text,
                      fontFamily: MONO,
                      fontSize: 18,
                    }}
                  >
                    {String(itemIndex + 1).padStart(2, '0')}
                  </div>
                  <div style={{ fontSize: 25, color: palette.text }}>{item}</div>
                </div>
              ))}
            </div>
          </MiniBrowser>
        ) : null}
      </div>
      <Footer section={slide.section} />
    </div>
  );
};

const slides: SlideSpec[] = [
  {
    layout: 'cover',
    eyebrow: 'cover',
    title: '從 Prompt 到 Workflow：Codex 時代的 AI 工程開發流程',
    body: '一條把模糊想法推到可測試產品的工程路線。',
    section: 'codex://cover',
  },
  {
    layout: 'team',
    eyebrow: 'team',
    title: '團隊介紹',
    section: 'codex://team',
  },
  {
    layout: 'fde-market-signal',
    eyebrow: 'market signal',
    title: '業界正在找 FDE：把 AI 做進真實工作流的人。',
    body: 'FDE 是 Forward Deployed Engineer：進到真實使用場景，理解問題、快速做出可用 demo，並把回饋帶回產品與工程。',
    bullets: ['懂現場問題與產品價值', '能快速實作、整合與部署', '用可驗證 demo 推動下一步'],
    jobScreenshots: [
      {
        company: 'Anthropic',
        role: 'Forward Deployed Engineer, Applied AI',
        source: '官方 careers 截圖',
        image: fdeAnthropic,
      },
      {
        company: 'Palantir',
        role: 'Forward Deployed Software Engineer',
        source: '官方 Lever 職缺截圖',
        image: fdePalantir,
      },
      {
        company: 'Scale AI',
        role: 'Forward Deployed Engineer, GenAI',
        source: '官方 careers 截圖',
        image: fdeScale,
      },
      {
        company: 'Baseten',
        role: 'Forward Deployed Engineer',
        source: '官方 Ashby 職缺截圖',
        image: fdeBaseten,
      },
    ],
    section: 'codex://fde-market',
  },
  {
    eyebrow: 'agenda',
    title: 'Agenda',
    body: '18 分鐘，走一遍從想法到可驗證 Demo 的 AI 工程流程。',
    diagram: [
      '從點子到 App 的最短路徑，建立 MVP 流程框架',
      '看 Codex 基礎介面如何承接工程任務',
      '理解 Agent Skills 的結構與運作原理',
      '用 Superpowers brainstorming 產生 md spec',
      '用 Git 讓 agent 修改可以安全 review、可回復',
      '把 md 變 HTML，再變 iOS App，留下可驗證 demo',
    ],
    section: 'codex://agenda',
    layout: 'agenda',
  },
  {
    layout: 'section',
    eyebrow: 'part 1',
    title: '先不要急著寫功能\n先找到 Core Experience',
    body: 'AI 時代不要想把東西做的完美，重點放在核心體驗與早期測試。',
    section: 'codex://core-experience',
    accent: '16, 163, 127',
  },
  {
    layout: 'one-liner',
    eyebrow: 'mindset',
    title: '不要先寫功能列表；先用一句話定義 App。',
    section: 'codex://next-step',
    accent: '79, 140, 255',
  },
  {
    layout: 'next-step',
    eyebrow: 'mindset',
    title: '很多 App 不是卡在技術，\n而是卡在「下一步」。',
    section: 'codex://next-step',
    accent: '79, 140, 255',
  },
  {
    eyebrow: '6d framework',
    title: '用 6D 檢查你的 App 是否真的往前推進。',
    titleMaxWidth: 1704,
    titleNoWrap: true,
    titleSize: 64,
    body: '每一輪都在縮短「想法」到「使用者回饋」的距離。',
    cards: [
      {
        label: '01 / Discover',
        title: '探索問題',
        body: '找到使用者、情境、痛點。',
      },
      {
        label: '02 / Decide',
        title: '決定核心',
        body: '選出最能代表 App 價值的體驗。',
      },
      {
        label: '03 / Design',
        title: '設計體驗',
        body: '讓下一步看得懂、摸得到、能操作。',
      },
      {
        label: '04 / Develop',
        title: '做出 Demo',
        body: '用 Codex 依照文件需求完成 App。',
      },
      {
        label: '05 / Deploy',
        title: '送去測試',
        body: '上架 TestFlight，讓使用者真的碰到產品。',
      },
      {
        label: '06 / Distribute',
        title: '擴散回饋',
        body: '讓更多人看見，形成下一輪改進方向。',
      },
    ],
    bullets: [
      '它不是瀑布流程，而是每次迭代都問：下一步最短路徑是什麼？',
      'AI 工程流程的任務，是讓每個 D 都更快進入可驗證狀態。',
    ],
    section: 'codex://6d',
  },
  {
    layout: 'section',
    eyebrow: 'part 2',
    title: 'Codex 基礎介面\n把開發任務交給 agent，但保留人的判斷',
    titleMaxWidth: 1800,
    titleNoWrap: true,
    titleSize: 80,
    body: '接下來把產品流程接到工程流程：thread、context、terminal、diff、review。',
    bodyMaxWidth: 1680,
    bodyNoWrap: true,
    section: 'codex://codex-interface',
  },
  {
    layout: 'codex-ui',
    eyebrow: 'codex mental model',
    title: 'Codex 不是聊天視窗，是一個有工具的工程工作台。',
    cards: [
      {
        label: 'Thread',
        title: '任務上下文',
        body: '每個 thread 是一個工作單位，保留目標、檔案、工具輸出與決策歷史。',
      },
      {
        label: 'Workspace',
        title: '真實 repo',
        body: 'Codex 直接在專案內讀檔、改檔、跑命令，不只產生文字建議。',
      },
      {
        label: 'Review',
        title: '可審查結果',
        body: '最後看 diff、測試結果、剩餘風險，而不是盲目相信回答。',
      },
    ],
    section: 'codex://interface-model',
  },
  {
    eyebrow: 'spec-driven development',
    title: 'Spec-Driven Development\n以自然語言寫 Spec',
    specItems: [
      {
        label: '01',
        title: '這個功能要解決什麼問題？',
        body: '先定義痛點與使用情境，避免 Codex 只照字面做出一堆不重要的功能。',
        example: '半逢遇甲：行動逢甲課表要左右滑才看得完，學生想一眼知道今天完整課表。',
      },
      {
        label: '02',
        title: '使用者會怎麼操作？',
        body: '把主要路徑寫成使用者動作，Codex 才知道畫面、資料與互動的優先順序。',
        example: '打開 App → 點擊課表 Tab → 點課程 → 查看教室、時間、下一堂課提醒。',
      },
      {
        label: '03',
        title: 'Definition of Done（DoD）',
        body: '定義怎樣才算做完，把完成條件寫成可驗證結果，review 時就能回到 Spec 判斷。',
        example: '不用水平滑動，也能在同一畫面看見課名、時間、教室與跨節課程長度。',
      },
      {
        label: '04',
        title: '有什麼 edge case？',
        body: '先列出容易壞掉或誤判的狀況；也可以讓 agent 枚舉，再自行 review。',
        example: '課程跨兩節、同時段重疊、晚上課程、空堂很多、教室名稱太長。',
      },
    ],
    section: 'codex://spec-driven-development',
    layout: 'spec-driven',
  },
  {
    eyebrow: 'project constitution',
    title: 'CONSTITUTION.md',
    bullets: [
      '不能用 any 繞過 TypeScript 型別檢查',
      'Commit message 要遵守 Conventional Commits 格式',
      '不要 over-engineering，只做出功能的 MVP',
    ],
    body: '推薦直接先設定好這份文件，確保產出符合團隊標準。',
    section: 'codex://constitution',
    layout: 'constitution',
  },
  {
    layout: 'section',
    eyebrow: 'part 3',
    title: 'Agent Skills：把一次性的 Prompt 變成可重複使用的能力',
    body: '從 Anthropic 的 Agent Skills 概念，到 Codex 的 skill discovery 與 progressive disclosure。',
    section: 'codex://skills',
    accent: '16, 163, 127',
  },
  {
    eyebrow: 'source',
    title: 'Introducing Agent Skills',
    image: agentSkillsArticleScreenshot,
    section: 'codex://agent-skills-source',
    layout: 'article-source',
  },
  {
    eyebrow: 'anthropic',
    title: 'Agent Skill 解決的問題：不要每次都重新教 agent。',
    body: '左邊是每一輪都要重講規則；右邊是把規則放進 Skill，讓 Codex 自動讀取上下文。',
    dialogues: [
      {
        label: 'No Skill',
        speaker: '重複規則',
        messages: [
          {
            role: '人',
            text: '請幫我做一個提醒事項 App，字體必須使用 SF Pro，顏色不可以超過 5 種，需使用 TabView 但 Tab 不可以超過 5 個...',
          },
          {
            role: 'Agent',
            text: '收到。我會先做提醒清單、新增提醒、完成狀態，並把 UI 控制在 SF Pro、5 色以內、3 個 Tab。',
          },
          {
            role: '人',
            text: '接下來新增日曆功能，字體必須使用 SF Pro，顏色不可以超過 5 種，需使用 TabView 但 Tab 不可以超過 5 個...',
          },
          {
            role: 'Agent',
            text: '了解。我會新增日曆 Tab，但仍維持不超過 5 個 Tab，並沿用同一套字體與色彩限制。',
          },
        ],
      },
      {
        label: 'With Skill',
        speaker: '讀取上下文',
        messages: [
          {
            role: '人',
            text: '請幫我做一個提醒事項 App。',
          },
          {
            role: 'Agent',
            text: '讀取 reminder-ios-skill：SF Pro、顏色不超過 5 種、TabView 不超過 5 個、先完成可測的 MVP。',
          },
          {
            role: 'Agent',
            text: '我會先建立提醒清單、新增提醒與完成狀態，並把日曆視為下一輪迭代，不讓需求一開始就膨脹。',
          },
        ],
        dark: true,
      },
    ],
    section: 'codex://anthropic-skills',
    layout: 'dialogue',
  },
  {
    eyebrow: 'skill structure',
    title: 'SKILL.md 的核心是 name、description、instructions。',
    body: 'name 用來識別能力；description 決定何時觸發；instructions 則告訴 agent 實際要怎麼做。',
    section: 'codex://skill-structure',
    layout: 'skill-md-structure',
  },
  {
    eyebrow: 'progressive disclosure',
    title: 'Skill 多的時候，不是全部讀進 context。',
    body: 'Codex 先用 name / description 做輕量匹配；只有任務真的需要時，才讀完整 SKILL.md。',
    skillRoutes: [
      {
        label: 'meeting-notes.md',
        title: '會議記錄',
        body: '整理逐字稿、決議、待辦事項。這次做 App，不需要載入。',
      },
      {
        label: 'travel-planning.md',
        title: '出國旅遊',
        body: '安排機票、行程、住宿與預算。和目前工程任務無關。',
      },
      {
        label: 'software-development.md',
        title: '軟體開發',
        body: '讀需求、改程式、跑測試、檢查 diff。做 App 時只載入這個 Skill。',
        active: true,
      },
    ],
    section: 'codex://skill-routing',
    layout: 'skill-routing',
  },
  {
    eyebrow: 'bundle content',
    title: 'Skill 節省 token 消耗的三種方式。',
    body: 'Skill 不需要塞滿所有細節：常看的內容放 references，穩定的判斷與轉換寫成 scripts，讓 agent 只讀必要結果。',
    bodyMaxWidth: 1680,
    bodyNoWrap: true,
    section: 'codex://skill-script-bundling',
    layout: 'skill-script-bundling',
  },
  {
    eyebrow: '',
    title: '',
    video: builtInRetinaDisplayVideo,
    section: 'codex://blank',
    layout: 'blank',
  },
  {
    layout: 'section',
    eyebrow: 'part 4',
    title: 'Superpowers brainstorming\n把想法收斂成 spec',
    body: '這一段示範如何先設計，再實作。Markdown 是工作流的中間產物。',
    section: 'codex://superpowers',
  },
  {
    eyebrow: 'brainstorming',
    title: 'Brainstorming 是幫你把想法寫成 Spec 的 Skill。',
    titleNoWrap: true,
    titleSize: 58,
    titleMaxWidth: 1640,
    body: '它不是叫 agent 立刻寫 code，而是先協助釐清問題、使用流程、設計方向與完成標準。',
    image: brainstormingSkillWindow,
    cards: [
      {
        label: '01 / Context',
        title: '先理解專案',
        body: '讀目前檔案、文件與限制，知道這個想法放在哪個產品脈絡裡。',
      },
      {
        label: '02 / Questions',
        title: '一次問一題',
        body: '用對話逐步收斂需求，避免一開始就把範圍想得太大。',
      },
      {
        label: '03 / Design',
        title: '提出方案',
        body: '把需求整理成 2-3 種方向與 trade-off，讓人先做產品判斷。',
      },
      {
        label: '04 / Spec',
        title: '產出 md spec',
        body: '取得同意後再寫成規格，成為後續實作、review、驗收的依據。',
      },
    ],
    section: 'codex://brainstorming',
    layout: 'brainstorming-skill',
  },
  {
    eyebrow: 'comparison',
    title: '比較有沒有 skill 的差別',
    titleNoWrap: true,
    body: '同一個需求，一邊靠每次重講 prompt，一邊用 Superpower Skill 先收斂工作流。',
    section: 'codex://skill-comparison',
    layout: 'skill-video-comparison',
  },
  {
    layout: 'section',
    eyebrow: 'part 5',
    title: 'Git review loop\n讓 AI 修改可回復、可審查',
    body: 'AI 可以很快，但工程協作需要可回復、可審查、可隔離。',
    section: 'codex://git-review',
    accent: '245, 158, 11',
  },
  {
    eyebrow: 'git basics',
    title: 'Codex 常用 Git 指令：先看清楚，再往前走。',
    titleNoWrap: true,
    body: 'Git 不是只拿來交作業；在 AI workflow 裡，它是每一步 review 的安全帶。',
    code: [
      '$ git pull',
      '$ git status --short',
      '$ git diff',
      '$ git diff --stat',
      '$ git add <files>',
      '$ git commit -m "Describe the change"',
      '$ git push origin <branch>',
    ],
    cards: [
      {
        label: 'status',
        title: '看改了哪些檔案',
        body: '先確認 Codex 的影響範圍，再決定要不要深入 review。',
      },
      {
        label: 'diff',
        title: '看實際修改',
        body: '逐行檢查行為變化，不只相信 agent 對修改的摘要。',
      },
      {
        label: 'commit',
        title: '存下已確認狀態',
        body: '只有 review 過的變更才進 commit，讓工作流可追蹤。',
      },
      {
        label: 'push',
        title: '推到遠端',
        body: '把確認過的 commit 推上遠端，交給 PR 或同伴 review。',
      },
    ],
    section: 'codex://git-basics',
    layout: 'git-command-workbench',
  },
  {
    eyebrow: 'spec + rules',
    title: 'Spec 寫清楚做什麼；Constitution 寫清楚怎麼做。',
    titleNoWrap: true,
    titleSize: 58,
    body: '一份告訴 Agent 產品目標與驗收標準，一份固定團隊工程規則。',
    bodyNoWrap: true,
    bodyMaxWidth: 1500,
    fileScreenshots: [
      {
        label: 'SPEC.md',
        title: '定義產品目標',
        body: 'Feature goal、user scenario、user flow 與 functional requirements。',
        image: specMdWindow,
      },
      {
        label: 'CONSTITUTION.md',
        title: '固定工程規範',
        body: 'Type safety、commit style、MVP scope 與 review before commit。',
        image: constitutionMdWindow,
      },
    ],
    section: 'codex://spec-constitution',
    layout: 'two-file-screenshots',
  },
  {
    eyebrow: '',
    title: '',
    video: gitCodexDemoVideo,
    section: 'codex://git-demo-video',
    layout: 'blank',
  },
  {
    layout: 'section',
    eyebrow: 'part 6',
    title: '讓人看得懂 spec',
    body: '把 Markdown spec 交給 Agent，直接產生可閱讀、可展示、可回饋的單檔 HTML artifact。',
    section: 'codex://agent-html',
  },
  {
    eyebrow: 'raw md spec',
    title: '一整份 spec，人類真的不會想讀。',
    code: [
      '# CrispPic / 脆圖 軟體規格書',
      '',
      '版本：v0.1',
      '日期：2026-05-06',
      '目標讀者：iOS 工程師、後端工程師、Firebase 工程師、QA、PM',
      '參考文件：[CrispPic_Product_Roadmap.md](./CrispPic_Product_Roadmap.md)',
      '',
      '## 1. 專案目標',
      'CrispPic / 脆圖是一個 iOS App，讓使用者上傳單張照片、選擇流行 AI 圖模板，並產生適合分享到 Threads、Instagram、TikTok 的 AI 風格圖。',
      'Phase 1 目標是驗證「單張 NT$30 生成券是否有人願意付費」，同時提供 Sign in with Apple 首次註冊 2 張免費生成券。',
      'Phase 1 不做 Web、Android、Line Pay、外部付款、點數包、訂閱、公開作品牆、團隊後台。',
      '',
      '## 2. Phase 1 範圍',
      '### 2.1 必做',
      '- SwiftUI iOS App。',
      '- Firebase Auth。',
      '- Sign in with Apple。',
      '- Email 登入作為備援，不自動發免費券。',
      '- Sign in with Apple 首次註冊發 2 張 `signup_bonus` 生成券。',
      '- 註冊免費券有效期 14 天。',
      '- StoreKit Consumable IAP 單次付費生成券。',
      '- PhotosPicker 單張圖片選取。',
      '- 本機圖片預覽。',
      '- Local preflight。',
      '- Server preflight。',
      '- Cloud Storage 圖片上傳。',
      '- Queue-based generation。',
      '- OpenAI `gpt-image-2` 圖片生成。',
      '- 輸入圖片與輸出圖片 basic moderation。',
      '- 生成結果頁。',
      '- 生成紀錄與訂單查詢。',
      '- 退款入口。',
      '- 檢舉入口。',
      '- 刪除帳號入口。',
      '- 7 天自動刪除原圖與生成圖。',
      '- Admin CSV 匯出。',
      '- App Review 測試資料與送審說明。',
      '',
      '### 2.2 不做',
      '- Web 版本。',
      '- Android。',
      '- Line Pay / 信用卡 / Apple Pay on Web。',
      '- 外部購買連結。',
      '- 點數包。',
      '- 月訂閱。',
      '- 公開作品牆。',
      '- 社群留言、追蹤。',
      '- 多人帳號或團隊後台。',
      '- 所有模板預設 high quality。',
      '',
      '## 3. 角色與權限',
      '### 3.1 一般使用者',
      '- 瀏覽公開模板。',
      '- 選擇單張照片。',
      '- 使用 Sign in with Apple 或 email 登入。',
      '- 使用免費券或購買單次生成券。',
      '- 查看自己的生成紀錄、訂單狀態、退款狀態、刪除狀態。',
      '- 手動刪除圖片。',
      '- 刪除帳號。',
      '- 檢舉生成結果。',
      '- 分享生成結果。',
      '- 不可修改 entitlement、order、cost、refund、generation status。',
      '- 不可讀取其他使用者資料。',
      '- 不可讀取 promptTemplates / adminDailyStats。',
      '- 不可列出 Storage 目錄。',
      '',
      '### 3.2 Admin',
      '- 查看每日營收、成本、退款、毛利摘要。',
      '- 匯出指定日期範圍 CSV。',
      '- 管理模板上下架。',
      '- 管理 prompt 版本。',
      '- 檢視失敗率、重試率、成本。',
      '- 手動補償免費重試。',
      '- 處理檢舉。',
      '- 查看 deletion job 狀態。',
      '- 高風險操作必須寫入 `adminAuditLogs`。',
      '',
      '### 3.3 Cloud Functions / Worker',
      '- 建立 signup bonus entitlement。',
      '- 驗證 StoreKit transaction。',
      '- 建立 orders。',
      '- 建立 paid entitlement。',
      '- 保留 entitlement。',
      '- 建立 generation job。',
      '- 呼叫 OpenAI。',
      '- 更新 generation status。',
      '- 更新成本欄位。',
      '- 更新 adminDailyStats。',
      '- 處理 App Store Server Notifications。',
      '- 處理退款通知。',
      '- 執行 moderation。',
      '- 執行 deletion jobs。',
      '',
      '## 4. 核心流程',
      '### 4.1 首次註冊與免費券',
      '1. 使用者開啟 App。',
      '2. 使用者可匿名瀏覽模板。',
      '3. 使用者選擇 Sign in with Apple。',
      '4. Cloud Functions 檢查 Apple provider UID hash。',
      '5. 若該 Apple 身分未領過 signup bonus，建立 2 張 `signup_bonus` entitlement。',
      '6. 寫入 `users/{uid}.signupBonusStatus = "granted"`。',
      '7. 每張 signup bonus 設定 `expiresAt = issuedAt + 14 days`。',
      '- 使用 `signupBonusIdempotencyKey = apple:{providerUidHash}`。',
      '- 每張 entitlement 使用 `grantIdempotencyKey = apple:{providerUidHash}:signup_bonus:{index}`。',
      '- Email 備援登入不發免費券。',
      '',
      '### 4.2 免費券生成流程',
      '1. 使用者選模板。',
      '2. 使用 PhotosPicker 選單張照片。',
      '3. App 只保留本機預覽，不上傳正式原圖。',
      '4. Local preflight 檢查圖片可讀、格式、尺寸、檔案大小。',
      '5. Server preflight 檢查帳號、模板、免費券、品質、服務、每日預算。',
      '6. Cloud Functions transaction 保留 available entitlement。',
      '7. App 上傳正式原圖到 Storage。',
      '8. Cloud Functions 建立 generation job。',
      '9. Worker 取得 lease。',
      '10. Worker 執行 input moderation。',
      '11. input moderation 通過後呼叫 OpenAI。',
      '12. Worker 執行 output moderation。',
      '13. output moderation 通過後寫入 output path。',
      '14. generation 標記 completed。',
      '15. entitlement 標記 consumed。',
      '- input moderation blocked：不呼叫 OpenAI，entitlement 回到 available 或 moderationBlocked。',
      '- output moderation blocked：不展示圖片，entitlement 保留或進入 retryable。',
      '',
      '### 4.3 付費生成流程',
      '1. 使用者選模板。',
      '2. 使用 PhotosPicker 選單張照片。',
      '3. App 只保留本機預覽。',
      '4. Local preflight。',
      '5. Server preflight：帳號、模板、IAP、後端、生成服務。',
      '6. App 顯示 StoreKit purchase。',
      '7. StoreKit transaction 成功。',
      '8. App 將 transaction 交給 Cloud Functions 驗證。',
      '9. Cloud Functions 驗證 App Store transaction。',
      '10. Cloud Functions 建立 order。',
      '11. Cloud Functions 建立 `storekit_single_purchase` entitlement。',
      '12. order 與 entitlement 持久化成功後，App finish StoreKit transaction。',
      '13. 記錄 `storeKitFinishedAt`。',
      '14. App 上傳正式原圖。',
      '15. 後續同免費券生成流程。',
      '- 前端付款狀態不可被信任。',
      '- 只有後端驗證 transaction 後才能建立 paid entitlement。',
      '- 付費 StoreKit 生成券不設到期日。',
      '',
      '### 4.4 重試流程',
      '- 付費券 `retryLimit = 1`。',
      '- 使用者最多可免費重試一次。',
      '- 重試沿用原 generation 的 locked template snapshot。',
      '- 註冊免費券 `retryLimit = 0`。',
      '- 系統失敗可保留 entitlement 或進入 retryable。',
      '',
      '### 4.5 退款流程',
      '1. 接收 App Store Server Notification。',
      '2. 用 `notificationUUID` 寫入 `appStoreEvents` 避免重複處理。',
      '3. 找到 `appStoreTransactions/{transactionId}`。',
      '4. 更新 transaction、order、entitlement。',
      '5. 更新 adminDailyStats。',
      '- entitlement 尚未使用：標記 `refunded`。',
      '- entitlement 已 reserved 或 retryable：停止後續生成或重試。',
      '- entitlement 已 consumed：不扣負數，標記帳號風險。',
      '',
      '### 4.6 自動刪圖流程',
      '- 原始照片與生成圖片預設保留 7 天。',
      '- 使用者可手動刪除。',
      '- 刪除帳號會觸發可刪除個資與圖片刪除。',
      '- Cloud Scheduler 找到過期 generation。',
      '- 建立 `deletionJobs/{deletionJobId}`。',
      '- Worker 刪除 Storage paths。',
      '- 寫入 deletedStoragePaths / failedStoragePaths。',
      '- 成功後更新 generation deletionStatus。',
      '',
      '## 5. 狀態機',
      '| Entitlement status | 說明 |',
      '| available | 可使用 |',
      '| reserved | 已被 generation job 保留 |',
      '| consumed | 生成成功並已消耗 |',
      '| retryable | 系統失敗，可再次使用或重試 |',
      '| refundPending | 已引導或等待退款 |',
      '| refunded | 已退款，不可使用 |',
      '| expired | signup_bonus 超過 14 天未使用 |',
      '| moderationBlocked | 因內容安全擋下 |',
      '',
      '| Generation status | 說明 |',
      '| queued | 已排隊 |',
      '| processing | worker 處理中 |',
      '| inputModerationBlocked | 輸入圖片被擋 |',
      '| generating | 呼叫 OpenAI 中 |',
      '| outputModerationBlocked | 輸出圖片被擋 |',
      '| completed | 生成成功 |',
      '| retryable | 系統失敗，可重試 |',
      '| failed | 失敗且不可自動重試 |',
      '| refunded | 退款後終止 |',
      '| deleted | 圖片已刪除 |',
      '',
      '| Order status | 說明 |',
      '| paid | StoreKit 驗證成功 |',
      '| refunded | Apple 已退款 |',
      '| refundPending | 等待退款狀態同步 |',
      '| disputed | 退款後帳號風險需人工判斷 |',
      '',
      '## 6. 系統架構',
      'SwiftUI iOS App -> Firebase Auth -> Firestore -> Cloud Functions -> StoreKit -> Cloud Storage -> Queue / Worker -> OpenAI gpt-image-2 -> App Store Server Notifications',
      '### 6.1 iOS App 責任',
      '- UI 流程。',
      '- Auth 流程。',
      '- PhotosPicker。',
      '- 本機 preview。',
      '- Local preflight。',
      '- StoreKit purchase。',
      '- 顯示 generation status。',
      '- 分享 sheet。',
      '- 刪除帳號入口。',
      '- 退款入口。',
      '- 檢舉入口。',
      '- 不可持有 OpenAI API key。',
      '- 不可直接修改 order / entitlement / cost / refund / admin stats。',
      '- 不可直接讀 promptTemplates。',
      '- 不可直接呼叫 OpenAI。',
      '',
      '### 6.2 Cloud Functions 責任',
      '- Server preflight。',
      '- StoreKit transaction verification。',
      '- Signup bonus grant。',
      '- Entitlement reservation。',
      '- Generation job creation。',
      '- App Store Server Notifications。',
      '- Refund handling。',
      '- Admin summary updates。',
      '- Deletion job creation。',
      '- Deep link attribution updates。',
      '',
      '### 6.3 Worker 責任',
      '- Queue lease。',
      '- Input moderation。',
      '- OpenAI generation。',
      '- Output moderation。',
      '- Cost calculation。',
      '- Storage output write。',
      '- Generation completion update。',
      '- 必須使用 jobIdempotencyKey / workerLeaseExpiresAt / attemptCount / openAIRequestId。',
      '',
      '## 7. Firebase Collections',
      '### 7.1 users/{uid}',
      'authProvider, email, displayName, isAnonymous, role, status, photoRetentionDays, notificationPreference, consent, signupBonusStatus, signupBonusIdempotencyKey, signupBonusGrantedAt, signupBonusEntitlementCount, generationCount, paidOrderCount, deletionRequestedAt, deletedAt',
      'consent: termsAcceptedVersion, privacyPolicyAcceptedVersion, aiProcessingConsentVersion, aiProcessingConsentAt, latestConsentIpHash, latestConsentUserAgentHash',
      '',
      '### 7.2 trends/{trendId}',
      'title, shortTitle, description, model, modelQuality, promptKey, promptVersion, pricingMode, priceTwd, isActive, isPremium, allowedEntitlementSources, signupBonusEligible, maxFreeModelQuality, estimatedCostTwd, costRiskLevel, riskLevel, sortOrder, suitablePhotoTypes, unsuitablePhotoTypes, thumbnailUrl, exampleImageUrls, referenceTemplateImageUrls, referenceUsagePolicy, safetyPolicyVersion, moderationLevel, shareCaption, startsAt, endsAt',
      '',
      '### 7.3 promptTemplates/{promptKey}',
      'title, systemInstruction, userPromptTemplate, visualDecomposition, referenceTemplateImageUrls, referencePromptInstruction, negativeInstructions, safetyNotes, model, outputSize, quality, createdBy, createdAt, updatedAt',
      '',
      '### 7.4 generations/{generationId}',
      'uid, orderId, entitlementId, entitlementSource, trendId, promptKey, model, modelQuality, status, lockedTemplateSnapshot, jobIdempotencyKey, queueName, attemptCount, maxAttemptCount, workerLeaseOwner, workerLeaseExpiresAt, openAIRequestId, inputImagePath, outputImagePath, referenceTemplateImageUrls, referenceImageCount, inputModerationStatus, outputModerationStatus, moderationRiskLabels, moderationBlockedReason, pricingMode, priceTwd, costBucket, retryCount, retryLimit, inputCostUsd, referenceCostUsd, moderationCostUsd, outputCostUsd, actualCostUsd, actualCostTwd, errorCode, lastErrorAt, expiresAt, deletionStatus, deletedAt',
      '',
      '### 7.5 orders/{orderId}',
      'uid, generationId, entitlementId, trendId, attribution, pricingMode, priceTwd, paymentProvider, storeProductId, transactionId, originalTransactionId, appStoreEnvironment, status, entitlementStatus, refundRequestedAt, storeKitFinishedAt, platformFeeTwd, refundAmountTwd, proceedsTwd, aiCostTwd, infraCostTwd, grossMarginTwd, createdAt, paidAt, refundedAt',
      '',
      '### 7.6 users/{uid}/generationEntitlements/{entitlementId}',
      'source, status, grantIdempotencyKey, orderId, generationId, retryOfGenerationId, retryLimit, retryCount, costBucket, modelQuality, issuedAt, reservedAt, consumedAt, retryableAt, refundRequestedAt, refundedAt, expiresAt, expiredAt',
      '',
      '### 7.7 appStoreTransactions/{transactionId}',
      'uid, orderId, entitlementId, originalTransactionId, storeProductId, appStoreEnvironment, transactionReason, status, purchaseDate, verifiedAt, storeKitFinishedAt, latestNotificationUUID, refundedAt',
      '',
      '### 7.8 appStoreEvents/{notificationUUID}',
      'notificationUUID, notificationType, subtype, transactionId, originalTransactionId, orderId, entitlementId, status, receivedAt, processedAt, errorCode',
      '',
      '### 7.9 shareEvents/{shareEventId}',
      'uid, generationId, trendId, campaignId, shareChannel, deepLinkUrl, referrerUid, sourceGenerationId, deepLinkOpenCount, attributedInstallCount, attributedOrderCount, createdAt, lastOpenedAt',
      '',
      '### 7.10 adminAuditLogs/{auditLogId}',
      'actorUid, actorRole, action, targetType, targetId, reason, beforeSnapshot, afterSnapshot, requestIpHash, userAgentHash, createdAt',
      '',
      '### 7.11 deletionJobs/{deletionJobId}',
      'uid, generationId, requestSource, requestedByUid, status, storagePaths, deletedStoragePaths, failedStoragePaths, attemptCount, lastErrorCode, requestedAt, completedAt',
      '',
      '### 7.12 adminDailyStats/{yyyyMMdd}',
      'date, orderCount, paidAmountTwd, platformFeeTwd, proceedsTwd, refundAmountTwd, aiCostTwd, infraCostTwd, grossMarginTwd, signupBonusGenerationCount, signupBonusCostTwd, dailySignupBonusBudgetTwd, freeToPaidConversionRate, shareEventCount, deepLinkOpenCount, shareAttributedOrderCount, averageGenerationCount, refundRate, shareRate, updatedAt',
      '',
      '## 8. Security Rules 要求',
      '- 使用者可讀自己的 users / orders / generations / generationEntitlements。',
      '- 使用者可建立檢舉與分享事件。',
      '- 使用者可提交刪除請求。',
      '- 使用者不可寫入 orders / generationEntitlements / appStoreTransactions / appStoreEvents / adminDailyStats。',
      '- 使用者不可寫入成本欄位、退款欄位、generation status。',
      '- 使用者不可讀取 promptTemplates。',
      '- Admin 可讀 adminDailyStats / adminAuditLogs / deletionJobs。',
      '- Admin 可管理 trends。',
      '- Cloud Functions 可寫入全部受控欄位。',
      '- Storage path: users/{uid}/inputs/{generationId}.jpg',
      '- Storage path: users/{uid}/outputs/{generationId}.jpg',
      '- 使用者只能讀取自己的 input/output。',
      '- 使用者不可列目錄或覆寫其他 uid 的檔案。',
      '',
      '## 9. Remote Config',
      'featuredTrendIds, signupBonusEntitlementCount = 2, signupBonusExpiresInDays = 14, signupBonusOnlyForApple = true, paidRetryLimit = 1, generationPaused = false, moderationEnabled = true, moderationThreshold, dailySignupBonusBudgetTwd, featureFlags, abTestCopy',
      '',
      '## 10. Cost Tracking',
      '- 每個 generation 必須記錄 inputCostUsd / referenceCostUsd / moderationCostUsd / outputCostUsd / actualCostUsd / exchangeRateTwd / actualCostTwd / costBucket / referenceImageCount。',
      '- 成本分類：revenue、acquisition、support。',
      '- 每筆付費訂單 AI 與基礎設施成本低於 NT$5。',
      '- 平均每筆訂單生成次數低於 1.5。',
      '- 註冊免費生成成本每日不超過預算。',
      '- 免費生成使用者轉付費率高於 8%。',
      '',
      '## 11. App Review 準備',
      '- App Review notes。',
      '- 可測登入流程。',
      '- Sandbox IAP 商品。',
      '- Sandbox tester。',
      '- 審核用安全模板。',
      '- 測試照片建議。',
      '- 後端服務開啟。',
      '- Firebase 可用。',
      '- OpenAI worker 可用。',
      '- App Store Server Notifications endpoint 可用。',
      '- 隱私政策 URL。',
      '- 使用條款 URL。',
      '- 客服聯絡方式。',
      '- IAP display name。',
      '- IAP screenshot。',
      '- 審核流程需可測 Sign in with Apple / 註冊免費券 / StoreKit 單次購買 / 生成等待頁 / 生成完成頁 / blocked moderation flow / 退款入口 / 檢舉入口 / 刪除帳號入口。',
      '',
      '## 12. MVP 驗收標準',
      '- 使用者可從選照片、本機預覽、取得 entitlement、上傳、生成到取得圖片完整跑完。',
      '- Server preflight 失敗時不顯示 StoreKit 付款。',
      '- StoreKit transaction 只有在 order 與 available entitlement 持久化後才 finish。',
      '- 付款後若上傳或建立任務失敗，生成券可保留並重試。',
      '- Sign in with Apple 首次註冊建立 2 張 signup bonus entitlement。',
      '- 註冊免費券有效期 14 天。',
      '- StoreKit 付費生成券不設到期日。',
      '- Worker 有 idempotency 與 lease。',
      '- 輸入/輸出 moderation flow 可測。',
      '- blocked moderation 不扣掉使用者權益。',
      '- 生成成功率高於 85%。',
      '- 付款後 90 秒內完成率高於 80%。',
      '- 每筆訂單平均生成次數低於 1.5。',
      '- 每筆訂單平均 AI 與基礎設施成本低於 NT$5。',
      '- 可匯出訂單與成本資料。',
      '- Admin 操作寫入 audit log。',
      '- 7 天自動刪圖建立 deletion job。',
      '- 刪除失敗可重試。',
      '- 使用者同意版本可被記錄與查詢。',
      '- App Review 可完整測 IAP 商品與核心流程。',
      '',
      '## 13. 開發順序建議',
      '1. 建立 SwiftUI iOS App 專案。',
      '2. 建立 Firebase 專案。',
      '3. 建立 Auth 與 Sign in with Apple。',
      '4. 建立 Firestore collections 與 Security Rules。',
      '5. 建立 Cloud Storage rules。',
      '6. 建立 Remote Config。',
      '7. 建立 template/trend 讀取。',
      '8. 建立 PhotosPicker 與 local preview。',
      '9. 建立 server preflight。',
      '10. 建立 signup bonus entitlement grant。',
      '11. 建立 StoreKit consumable IAP。',
      '12. 建立 App Store transaction verification。',
      '13. 建立 entitlement reservation。',
      '14. 建立 Storage upload。',
      '15. 建立 generation queue。',
      '16. 建立 Worker lease / idempotency。',
      '17. 接 OpenAI generation。',
      '18. 加入 input/output moderation。',
      '19. 建立結果頁。',
      '20. 建立 generation history。',
      '21. 建立 refund handling。',
      '22. 建立 deletion jobs。',
      '23. 建立 adminDailyStats。',
      '24. 建立 CSV export。',
      '25. 準備 App Review 測試資料。',
      '',
      '## 14. 待確認事項',
      '- OpenAI 圖片模型實際單張成本與品質設定。',
      '- Firebase 專案 region。',
      '- Cloud Functions runtime。',
      '- Queue 實作方式。',
      '- App Store 商品 ID 最終命名。',
      '- 隱私政策與使用條款正式版本號。',
      '- Moderation 供應商與閾值。',
      '- CSV 匯出欄位格式。',
      '- Admin 後台 Phase 1 是 App 內隱藏頁、Firebase Console 輔助，或另建簡易工具。',
    ],
    section: 'codex://raw-spec',
    layout: 'spec-overload',
  },
  {
    eyebrow: 'agent generated html',
    title: '不用特定工具，直接讓 Agent 做一個 HTML。',
    body: 'Spec 先給 Agent 當上下文，再要求它產生單檔 HTML；重點是讓人可以快速看懂流程、狀態與驗收標準。',
    aside: 'prompt + spec',
    quote: '這個流程是否足夠清楚、能被使用者回饋？',
    code: [
      '# Prompt',
      '請根據 SPEC.md 產生一個單檔 HTML artifact。',
      '# Focus',
      '呈現核心流程、付款/權益狀態、驗收標準。',
      '# Constraints',
      '使用內嵌 CSS，不需要後端，不依賴外部服務。',
    ],
    cards: [
      {
        label: 'Input',
        title: 'Spec 當上下文',
        body: 'Agent 先讀原始規格，理解使用者流程、限制與 edge cases。',
      },
      {
        label: 'Output',
        title: '產生 HTML',
        body: '輸出可以直接打開的 artifact，用畫面承載流程與重點狀態。',
      },
      {
        label: 'Review',
        title: '拿去討論',
        body: '讓同學或使用者指出看不懂的地方，再回寫到下一版 spec。',
      },
    ],
    section: 'codex://agent-html-generation',
    layout: 'spec-to-artifact',
  },
  {
    layout: 'section',
    eyebrow: 'part 7',
    title: '從 spec 到 iOS App\nGoal + iOS develop skill',
    body: '把 Markdown spec 變成可操作的 SwiftUI prototype，重點不是「寫完程式」，而是保留目標、跑出畫面、留下證據。',
    section: 'codex://ios-app',
    accent: '79, 140, 255',
  },
  {
    eyebrow: 'goal',
    title: 'Goal：把任務變成可追蹤、可驗證的交付。',
    titleNoWrap: true,
    titleSize: 56,
    body: 'Goal 是 Codex 裡的任務錨點：先寫清楚 objective，讓 Agent 後續每一步都回到同一個目標；它不是多一段 prompt，而是把目標、驗證方式與完成證據放在同一條任務軌道上。',
    bullets: [
      'Objective：這次到底要交付什麼，避免 Agent 做到一半偏離任務。',
      'Validation：一開始就定義要用 build、simulator、截圖或手動流程驗證。',
      'Evidence：完成時回到驗收標準，不只相信 Agent 說「完成了」。',
    ],
    code: [
      '$ goal',
      '把 spec 實作成可操作的 SwiftUI prototype',
      'checks: build + simulator + 核心流程截圖',
      'done when: acceptance checks 全部通過',
    ],
    cards: [
      {
        label: 'What',
        title: '任務錨點',
        body: '把一段工作變成明確任務，而不是讓 Agent 自由延伸。',
      },
      {
        label: 'Validation',
        title: '驗證機制',
        body: '使用者要先知道要看什麼證據，才算真的完成。',
      },
      {
        label: 'Evidence',
        title: '完成證據',
        body: 'build log、simulator 截圖、操作流程與剩餘風險都要回到 Goal 檢查。',
      },
    ],
    section: 'codex://goal',
    layout: 'ios-goal-track',
  },
  {
    eyebrow: 'acceptance checks',
    title: '不知道怎麼驗證，先讓 Agent 列 acceptance checks。',
    body: '如果一開始不知道怎樣算做完，不要硬猜；先讓 Agent 根據 spec 枚舉驗收條件，人 review 後再放回 spec。',
    code: [
      '$ prompt',
      '請根據這份 spec 產生 acceptance checks。',
      '請分成：核心流程、UI 狀態、edge cases、不可接受的結果。',
      '每一項都要能被 simulator、截圖或人工操作驗證。',
      '先不要寫程式，先列出 checklist 讓我 review。',
    ],
    cards: [
      {
        label: 'Core Flow',
        title: '核心流程',
        body: '使用者從入口到完成任務，每一步都要能被操作、截圖或人工驗證。',
      },
      {
        label: 'UI States',
        title: '畫面狀態',
        body: 'loading、empty、success、error 都要有明確畫面，不只測 happy path。',
      },
      {
        label: 'Edge Cases',
        title: '邊界情境',
        body: '長文字、無資料、上傳失敗、權益不足、網路錯誤都要先列出預期行為。',
      },
      {
        label: 'Reject',
        title: '不可接受結果',
        body: '例如付款前 preflight 失敗仍顯示 StoreKit，或 blocked moderation 還扣權益。',
      },
    ],
    section: 'codex://goal-acceptance-checks',
    layout: 'acceptance-checks-board',
  },
  {
    eyebrow: 'project goal',
    title: '我的專案 Goal：每一次完成一項',
    titleNoWrap: true,
    bullets: [
      '使用者可從選照片、本機預覽、取得 entitlement、上傳、生成到取得圖片完整跑完。',
      'Server preflight 失敗時不顯示 StoreKit 付款。',
      'StoreKit transaction 只有在 order 與 available entitlement 持久化後才 finish。',
      '付款後若上傳或建立任務失敗，生成券可保留並重試。',
      'Sign in with Apple 首次註冊建立 2 張 signup bonus entitlement。',
      '註冊免費券有效期 14 天。',
      'StoreKit 付費生成券不設到期日。',
      'Worker 有 idempotency 與 lease。',
      '輸入/輸出 moderation flow 可測。',
      'blocked moderation 不扣掉使用者權益。',
      '生成成功率高於 85%。',
      '付款後 90 秒內完成率高於 80%。',
      '每筆訂單平均生成次數低於 1.5。',
      '每筆訂單平均 AI 與基礎設施成本低於 NT$5。',
      '可匯出訂單與成本資料。',
      'Admin 操作寫入 audit log。',
      '7 天自動刪圖建立 deletion job。',
      '刪除失敗可重試。',
      '使用者同意版本可被記錄與查詢。',
      'App Review 可完整測 IAP 商品與核心流程。',
    ],
    section: 'codex://project-goal',
    layout: 'project-goal-checklist',
  },
  {
    eyebrow: 'ios skill',
    title: 'iOS develop skill：把 spec 變成能跑、能看的畫面。',
    titleNoWrap: true,
    body: 'Skill 的價值不是替代工程師，而是把 iOS 開發的檢查順序固定下來：讀規格、改 SwiftUI、跑 Simulator、留下 evidence。',
    bodyMaxWidth: 1700,
    bodyNoWrap: true,
    diagram: [
      '讀 md spec',
      '修改 SwiftUI views',
      '設定 project / scheme / simulator',
      'build + run',
      '截圖與 UI 驗證',
      '回寫 handoff',
    ],
    code: [
      '$ expected acceptance',
      '打開 App 看見今日課表',
      '點課程看到教室與時間',
      '不水平滑動也能理解完整資訊',
      '空課表與長課名不破版',
    ],
    section: 'codex://ios-skill',
    layout: 'ios-skill-pipeline',
  },
  {
    eyebrow: 'demo script',
    title: '實際展示：一條可以回看的 8 步 runway。',
    diagram: [
      '1. 寫一句產品 idea',
      '2. 用 brainstorming skill 產出 md spec',
      '3. commit spec',
      '4. 讓 Agent 直接產生 HTML artifact',
      '5. 和 Agent 一起修改體驗與內容',
      '6. 定稿 spec 與驗收標準',
      '7. 用 iOS develop skill 做 SwiftUI demo',
      '8. 用 simulator 驗證主流程',
    ],
    section: 'codex://demo-script',
    layout: 'demo-runway',
  },
  {
    eyebrow: 'closing',
    title: '會使用 AI 的人會拉開差距',
    image: jensenHuangPhoto,
    quote:
      "You're not going to lose your job to AI; you're going to lose your job to somebody who uses AI.",
    section: 'codex://closing',
    layout: 'closing-operating-system',
  },
];

export const notes: (string | undefined)[] = [
  '開場先說這份報告的定位：不是展示某一個神奇 prompt，而是介紹 Codex 時代可以怎麼設計 AI 工程流程。把題目念完後，強調我們會一路從產品核心體驗、Codex 介面、Agent Skills、Git review，最後走到 HTML artifact 和 iOS demo。',
  '這頁介紹團隊與分工。先說共同完成主題研究、簡報製作、現場展示與 Q&A 準備。蔡承曄負責產品流程與故事線，把 Core Experience、6D、Spec、Goal 串成從 idea 到驗收的敘事，同時負責 open-slide 展示與 Cloudflare 部署環境架設；上台負責產品流程與結論。李天宇負責工程流程與工具實作，說明 Codex 介面、Agent Skills、Git、Brainstorming、iOS demo 與驗證流程如何把規格推到可驗證交付；上台負責工具流程與 Demo。',
  '新增 FDE 市場訊號。先解釋 FDE 是 Forward Deployed Engineer，重點是把工程能力帶到真實使用場景：理解問題、快速做 demo、部署和整合，最後把回饋帶回產品與工程。下面四張官方職缺截圖用來證明這不是自己發明的角色，而是 AI 公司正在招聘的能力。',
  '這頁是全場 roadmap。先說我們會建立從點子到 App 的 MVP 流程框架，然後轉到 Codex 工程介面，再講 Skills，最後示範從 md 到 HTML artifact 和 iOS demo。讓聽眾知道這不是零散工具介紹，而是一條完整管線。',
  '章節轉場。說明為什麼從 Core Experience 開始：如果不知道使用者最需要的核心體驗，AI 寫得越快，可能只是越快偏離產品價值。',
  '這頁用一句話定義 App。先填 For、Who、This app helps、By 四格，不急著列功能。半逢遇甲範例可以念成一段完整句子：給逢甲大學學生，解決行動逢甲課表需要滑動才可以查看完整資訊的問題，幫他一眼看完今天完整課表，核心互動是把課程時間、地點與下一堂課提醒放在同一個課表畫面。',
  '這頁停一下講心態：很多產品不是沒有技術可以做，而是不知道下一步要先驗證什麼。三個常見卡點是點子變太大、路徑太模糊、太晚看到結果。最後收斂到一句：先找出最能代表 App 價值的核心體驗。',
  '介紹完整 6D：Discover、Decide、Design、Develop、Deploy、Distribute。這裡重點不是背流程，而是理解它能幫我們縮短 idea 到 feedback 的距離。',
  '章節轉場到 Codex 基礎介面。提醒同學 Codex 不是一般聊天機器人，而是可以在工作區裡讀檔、改檔、跑命令的工程 agent。',
  '用三個概念介紹 Codex：thread 是任務上下文，workspace 是真實 repo，review 是可審查結果。這裡可以現場指一下 Codex app 的對應區域：對話、terminal、diff。',
  '講 Spec-Driven Development。先補一句 Spec 的定義：它是用自然語言描述功能行為、限制與驗收標準的文件。重點不是先叫 Codex 寫功能，而是先用自然語言寫清楚 Spec。四個問題可以逐一帶過：先說這個功能解決什麼痛點，再說使用者會怎麼操作，接著用 DoD，也就是 Definition of Done，定義怎樣算做完，最後補 edge case。這樣 Codex 實作時有依據，review 時也能回到 Spec 檢查。',
  '補充 CONSTITUTION.md。這份文件像是專案的基本法，把團隊標準提前寫給 agent：不能用 any 繞過型別檢查、commit message 要遵守 Conventional Commits、不要 over-engineering。重點是讓 Codex 的產出一開始就貼近團隊規範。',
  '章節轉場到 Agent Skills。先說：當我們發現每次都要重新教 agent 同一套流程，就該把它變成 skill。',
  '補上 Anthropic 的 Introducing Agent Skills 來源頁。這頁先建立外部脈絡：Agent Skills 不是單純 prompt，而是可重用、可管理、可按需載入的工作資料夾。可以帶到三個重點：資料夾形式、需要時載入、適合 domain workflow。',
  '介紹 Anthropic Agent Skills 的概念。用兩個對話框比較：左邊是每個 thread 都重新提醒 agent 的痛點，右邊是把規則放進 SKILL.md 的解法。重點是 reusable、filesystem-based、domain-specific，讓同學理解 skill 是 AI agent 的工作說明書加工具包。',
  '補充 Progressive Disclosure。假設專案裡有很多 Skill，像會議記錄、出國旅遊、軟體開發，如果每次都讀完整文件，token 會被快速吃掉，也會混入無關規則。真正理想的是先看 name 和 description，當我說要做 App 時，只載入軟體開發 Skill。',
  '介紹 SKILL.md 的基本骨架。name 是 skill 的識別名稱；description 是觸發條件，讓 agent 知道什麼時候要用；instructions 是實際操作步驟。這頁先把最小結構講清楚，再往後補 references 和 scripts。',
  '補充 bundle content 的概念。不是所有資訊都要寫進主 SKILL.md，長文件可以放 reference，穩定判斷可以做成 script。這樣 agent 不需要讀完整流程，只要在需要時執行腳本，拿到結構化結果後繼續工作，token 會省很多。',
  '',
  '章節轉場到 Superpowers brainstorming。這裡的主題是：先設計，再實作，把需求落成 markdown spec。',
  '介紹 brainstorming skill。這是一個幫忙把想法寫成 md spec 的 skill：先探索 intent、requirements 和 design，再透過對話問問題、提出方案，取得同意後才把規格交給後續實作。',
  '這頁用兩支影片比較有沒有 skill 的差別。左邊是沒有 skill 時，每次都要重新交代規則，agent 容易漏掉限制；右邊是用 Superpower Skill 先收斂需求與 spec，後續實作比較容易沿著同一套工作流推進。',
  '章節轉場到 Git review loop。說明為什麼要講 Git：AI 改 code 的速度越快，越需要版本控制來保護主線。',
  '這頁把 Codex 常用的 Git 指令整理成 review loop。先 pull 同步遠端，再 status 看影響範圍，用 diff 和 diff --stat 檢查實際修改，最後 add、commit、push。重點是 commit 前先相信 diff，不要只相信 agent 摘要。',
  '補充 SPEC.md 和 CONSTITUTION.md 的角色：SPEC.md 告訴 agent 這次功能要解決什麼問題、使用者怎麼操作、怎樣算做完；CONSTITUTION.md 則是專案基本法，固定型別安全、commit style、MVP 範圍和 review 規則。',
  '這頁放 Git / Codex 操作影片。播放時不用逐字講解，重點是讓聽眾看到每一步都不是口號：agent 會改檔，但人要回到 terminal、diff 和驗證結果確認。',
  '章節轉場到讓人看得懂 spec。這段主旨不是介紹某個特定工具，而是把 markdown spec 交給 Agent，讓它直接產生可閱讀、可展示、可回饋的 HTML artifact。',
  '新增一頁 raw spec overload。這頁故意把 spec 放得很滿，讓聽眾感受到：規格可以很完整，但人通常不會想讀完，所以後面才需要把 spec 轉成可掃讀、可展示、可回饋的 artifact。',
  '這頁重新設計成 Agent 產生 HTML 的流程。左邊是 prompt 加 spec，告訴 Agent 要輸出單檔 HTML、呈現核心流程與驗收標準；右邊是生成後的 artifact。重點是：不需要特定工具，直接讓 Agent 把規格轉成能被討論的畫面。',
  '章節轉場到 iOS App。這裡把 artifact 從 HTML 推到 native app，強調重點不是寫完程式，而是把 Markdown spec 變成可操作的 SwiftUI prototype，並留下驗證證據。',
  '講 Codex Goal 功能。這頁重點不是說 Goal 是比較長的 prompt，而是它會把任務目標和驗證方式固定下來。使用者要先知道：最後要用什麼機制確認做對了，例如 build、simulator、截圖、手動操作或測試。',
  '如果使用者一開始不知道怎麼驗證，就先用 prompt 請 Agent 根據 spec 產生 acceptance checks。這些 checks 不能直接照收，人要 review、刪改，再放回 spec，成為後續實作和驗收的共同標準。',
  '這頁把自己的專案 Goal 拆成可以逐項完成的 checklist。講法是：不要一次叫 Agent 做完整系統，而是每次只挑一項目標，完成後回來驗證 checklist、留下截圖或 log，再進下一項。第一項是完整生成流程，後面才逐步補付款、權益、worker、moderation、成本、admin、刪除和 App Review。',
  '講 iOS develop skill。這頁把流程改成 pipeline：讀 md spec、改 SwiftUI、設定 project/scheme/simulator、build and run、截圖與 UI 驗證、最後回寫 handoff。下面的 acceptance checks 用半逢遇甲課表情境來講。',
  '這頁是完整 demo runway。三個階段是 Design、Build、Verify：先把想法變成 md spec，再讓 Agent 直接產生 HTML artifact 和 iOS prototype，最後用 simulator 驗證主流程。重點是每一步都有可回看的產物與驗證證據。',
  '結尾用黃仁勳這句話收束：你不是輸給 AI，而是輸給會使用 AI 的人。回扣整份報告：我們不是在展示單一工具，而是在練習把 AI 放進自己的工作流，從 prompt、spec、skill、git、HTML artifact 到 iOS demo，每一步都能驗證、能交接、能繼續推進。',
];

const pages: Page[] = slides.map((slide, index) => {
  const Slide: Page = () => <DeckPage slide={slide} index={index} />;
  return Slide;
});

export const meta: SlideMeta = {
  title: '從 Prompt 到 Workflow：Codex 時代的 AI 工程開發流程',
  createdAt: '2026-05-27T00:00:00.000Z',
};

export default pages;
