import {
  ImagePlaceholder,
  type DesignSystem,
  type Page,
  type SlideMeta,
  useSlidePageNumber,
} from '@open-slide/core';
import { useLayoutEffect, useRef, useState } from 'react';
import aboutIosClub from './assets/about-ios-club.jpeg';
import competitionActivity01 from './assets/competition-activity-01.jpeg';
import competitionActivity02 from './assets/competition-activity-02-landscape.jpeg';
import competitionActivity03 from './assets/competition-activity-03.jpeg';
import competitionActivity04 from './assets/competition-activity-04-landscape.jpeg';
import competitionActivity05 from './assets/competition-activity-05-landscape.jpeg';
import competitionActivity06 from './assets/competition-activity-06.jpeg';
import contestCanBeFunJudging from './assets/contest-can-be-fun-judging.jpeg';
import contestCanBeFunTeam from './assets/contest-can-be-fun-team.jpeg';
import contestCanBeFunTrophy from './assets/contest-can-be-fun-trophy.jpeg';
import coverPortrait from './assets/cover-portrait.jpeg';
import highSchoolClubPhoto from './assets/high-school-club.jpeg';
import maicDiscussionWhiteboard from './assets/maic-discussion-whiteboard.jpeg';
import maicThirdPrizePhoto from './assets/maic-third-prize.jpeg';
import mcdonaldsGoldenArches from './assets/mcdonalds-golden-arches.svg';
import awardTeamPhoto from './assets/national-electronic-design-award.jpg';
import nedcc2025FcuAwards from './assets/nedcc-2025-fcu-awards.jpg';
import niceeAppIcon from './assets/nicee-app-icon.jpg';
import realRouteMap from './assets/real-route-map.png';
import shanghaiLuggagePhoto from './assets/shanghai-luggage.jpeg';
import shanghaiFunCalligraphy from './assets/shanghai-fun-calligraphy.jpeg';
import shanghaiFunCityModel from './assets/shanghai-fun-citymodel.jpeg';
import shanghaiFunDrinks from './assets/shanghai-fun-drinks.jpeg';
import shanghaiFunHanfu from './assets/shanghai-fun-hanfu.jpeg';
import shanghaiFunSelfie from './assets/shanghai-fun-selfie.jpeg';
import shanghaiFunYuyuan from './assets/shanghai-fun-yuyuan.jpeg';
import shanghaiGradTrip01 from './assets/shanghai-grad-trip-01.mp4';
import shanghaiGradTrip02 from './assets/shanghai-grad-trip-02.mp4';
import shanghaiGradTrip03 from './assets/shanghai-grad-trip-03.mp4';
import crossStraitProcessFlag from './assets/cross-strait-process-flag.jpeg';
import crossStraitProcessShip from './assets/cross-strait-process-ship.jpeg';
import zhongliClubBeforeCrossStrait from './assets/zhongli-club-before-cross-strait.mp4';
import sportsClassPhoto from './assets/sports-class.jpeg';
import tcs12Badge from './assets/tcs12-badge.svg';

export const design: DesignSystem = {
  palette: { bg: '#ffffff', text: '#000000', accent: '#ff3d8b' },
  fonts: {
    display: '"Figma Sans", "Inter", -apple-system, BlinkMacSystemFont, "Noto Sans TC", system-ui, sans-serif',
    body: '"Figma Sans", "Inter", -apple-system, BlinkMacSystemFont, "Noto Sans TC", system-ui, sans-serif',
  },
  typeScale: { hero: 128, body: 28 },
  radius: 24,
};

const palette = {
  bg: '#ffffff',
  canvas: '#ffffff',
  text: '#000000',
  muted: '#4a4a4a',
  faint: '#6f6f6f',
  line: '#e6e6e6',
  mint: '#c8e6cd',
  coral: '#f3c9b6',
  gold: '#f4ecd6',
  blue: '#c5b0f4',
  primary: '#ff3d8b',
  surface: '#ffffff',
  surfaceStrong: '#f7f7f5',
  lime: '#dceeb1',
  lilac: '#c5b0f4',
  cream: '#f4ecd6',
  pink: '#efd4d4',
  navy: '#1f1d3d',
  black: '#000000',
};

const fill = {
  width: '100%',
  height: '100%',
  fontFamily: 'var(--osd-font-body)',
  color: 'var(--osd-text)',
  background: 'var(--osd-bg)',
  position: 'relative',
  overflow: 'hidden',
} as const;

const ease = 'cubic-bezier(0.16, 1, 0.3, 1)';

const keyframes = `
@keyframes storyFadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes storyFade {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes storyLine {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
@keyframes storyRoute {
  from { stroke-dashoffset: 620; }
  to { stroke-dashoffset: 0; }
}
@keyframes storyPulse {
  0%, 100% { transform: scale(1); opacity: 0.74; }
  50% { transform: scale(1.55); opacity: 0.18; }
}
.story-fadeup { animation: storyFadeUp 900ms ${ease} both; }
.story-fade { animation: storyFade 1000ms ${ease} both; }
.story-line { animation: storyLine 1100ms ${ease} both; transform-origin: left center; }
.story-route { stroke-dasharray: 620; stroke-dashoffset: 620; animation: storyRoute 1800ms ${ease} 520ms both; }
.story-pulse { transform-box: fill-box; transform-origin: center; animation: storyPulse 1800ms ease-in-out infinite; }
`;

const Style = () => <style>{keyframes}</style>;

const PAD_X = 156;
const PAD_Y = 92;

const PageShell = ({
  children,
  section = 'My story',
  accent = palette.mint,
  showNumber = true,
  showHeader = true,
  mode = 'light',
}: {
  children: React.ReactNode;
  section?: string;
  accent?: string;
  showNumber?: boolean;
  showHeader?: boolean;
  mode?: 'light' | 'dark';
}) => {
  const isDark = mode === 'dark';
  const pageBg = isDark ? palette.black : palette.bg;
  const pageText = isDark ? '#ffffff' : palette.text;
  const pageMuted = isDark ? 'rgba(255,255,255,0.68)' : palette.muted;
  const pageAccent = accent;

  return (
    <div style={{ ...fill, background: pageBg, color: pageText }}>
      <Style />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: -112,
          top: 152,
          width: 360,
          height: 230,
          borderRadius: 36,
          background: isDark ? palette.lilac : pageAccent,
          opacity: isDark ? 0.16 : 0.2,
          transform: 'rotate(-8deg)',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: -92,
          bottom: 116,
          width: 250,
          height: 170,
          borderRadius: 32,
          background: isDark ? palette.lime : palette.cream,
          opacity: isDark ? 0.18 : 0.55,
          transform: 'rotate(7deg)',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: `${PAD_Y}px ${PAD_X}px`,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1,
        }}
      >
        {showHeader ? (
          <div
            className="story-fade"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
              fontSize: 14,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: pageMuted,
            }}
          >
            <span style={{ color: pageAccent, fontWeight: 700 }}>{section}</span>
            <span>30 min share</span>
          </div>
        ) : null}
        {children}
      </div>
      {showNumber ? <PageNumber accent={pageAccent} muted={isDark ? 'rgba(245,245,247,0.38)' : palette.faint} /> : null}
    </div>
  );
};

const PageNumber = ({ accent, muted = palette.faint }: { accent: string; muted?: string }) => {
  const { current, total } = useSlidePageNumber();

  return (
    <div
      style={{
        position: 'absolute',
        left: PAD_X,
        bottom: 52,
        color: muted,
        fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
        fontSize: 14,
        letterSpacing: '0.06em',
        display: 'flex',
        gap: 14,
        alignItems: 'center',
      }}
    >
      <span style={{ color: accent }}>{String(current).padStart(2, '0')}</span>
      <span>/</span>
      <span>{String(total).padStart(2, '0')}</span>
    </div>
  );
};

const HugeTitle = ({
  children,
  size = 112,
  maxWidth = 1300,
  minSize,
  lineHeight = 1,
  letterSpacing = -1.2,
  fontWeight = 340,
  animationClass = 'story-fadeup',
}: {
  children: React.ReactNode;
  size?: number;
  maxWidth?: number;
  minSize?: number;
  lineHeight?: number;
  letterSpacing?: number | string;
  fontWeight?: number;
  animationClass?: string;
}) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const fittedMinSize = minSize ?? Math.max(36, Math.floor(size * 0.45));
  const [fittedSize, setFittedSize] = useState(size);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const title = titleRef.current;

    if (!frame || !title) {
      return;
    }

    let frameId = 0;
    let cancelled = false;

    const measure = () => {
      if (cancelled) {
        return;
      }

      const availableWidth = frame.clientWidth;
      if (!availableWidth) {
        return;
      }

      const previousFontSize = title.style.fontSize;
      title.style.fontSize = `${size}px`;
      const requiredWidth = title.scrollWidth;
      title.style.fontSize = previousFontSize;

      const nextSize =
        requiredWidth > availableWidth
          ? Math.max(fittedMinSize, Math.floor(size * (availableWidth / requiredWidth)))
          : size;

      setFittedSize((current) => (current === nextSize ? current : nextSize));
    };

    const scheduleMeasure = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(measure);
    };

    scheduleMeasure();

    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(frame);

    const fontReady = document.fonts?.ready;
    if (fontReady) {
      void fontReady.then(() => {
        scheduleMeasure();
      });
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, [children, fittedMinSize, size]);

  return (
    <div ref={frameRef} style={{ width: '100%', maxWidth }}>
      <h1
        ref={titleRef}
        className={animationClass}
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: fittedSize,
          fontWeight,
          lineHeight,
          letterSpacing,
          margin: 0,
          whiteSpace: 'nowrap',
          display: 'inline-block',
        }}
      >
        {children}
      </h1>
    </div>
  );
};

const Lead = ({
  children,
  maxWidth = 1080,
  delay = 150,
  size = 32,
  lineHeight = 1.48,
  opacity = 0.72,
}: {
  children: React.ReactNode;
  maxWidth?: number;
  delay?: number;
  size?: number;
  lineHeight?: number;
  opacity?: number;
}) => (
  <p
    className="story-fadeup"
    style={{
      animationDelay: `${delay}ms`,
      fontSize: size,
      lineHeight,
      color: 'currentColor',
      opacity,
      margin: 0,
      maxWidth,
    }}
  >
    {children}
  </p>
);

const AccentLine = ({ color = palette.mint, delay = 120 }: { color?: string; delay?: number }) => (
  <div
    className="story-line"
    style={{
      animationDelay: `${delay}ms`,
      width: 120,
      height: 4,
      background: palette.primary,
      borderRadius: 999,
      margin: '32px 0',
    }}
  />
);

const TopBottomLayout = ({
  top,
  bottom,
  gap = 44,
  bottomPadding = 0,
}: {
  top: React.ReactNode;
  bottom: React.ReactNode;
  gap?: number;
  bottomPadding?: number;
}) => (
  <div
    style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap,
    }}
  >
    <div>{top}</div>
    <div style={{ paddingBottom: bottomPadding }}>{bottom}</div>
  </div>
);

const QuoteMark = ({ color }: { color: string }) => (
  <div
    className="story-fade"
    style={{
      position: 'absolute',
      right: 80,
      bottom: 40,
      fontFamily: 'var(--osd-font-display)',
      fontSize: 360,
      lineHeight: 0.7,
      color: palette.primary,
      opacity: 0.08,
    }}
  >
    ”
  </div>
);

const Card = ({
  children,
  color = palette.mint,
  delay = 0,
  minHeight = 210,
  padding = 36,
}: {
  children: React.ReactNode;
  color?: string;
  delay?: number;
  minHeight?: number;
  padding?: number | string;
}) => (
  <div
    className="story-fadeup"
    style={{
      animationDelay: `${delay}ms`,
      background: palette.surface,
      border: `1px solid ${palette.line}`,
      borderRadius: 18,
      padding,
      minHeight,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}
  >
    {children}
  </div>
);

const CardTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{ color: palette.text, fontSize: 34, fontWeight: 600, marginBottom: 16 }}>{children}</div>
);

const CardText = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 27, lineHeight: 1.5, color: palette.muted }}>{children}</div>
);

const ChatDivider = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <div className="story-fadeup" style={{ animationDelay: `${delay}ms`, display: 'flex', justifyContent: 'center' }}>
    <div
      style={{
        padding: '10px 18px',
        borderRadius: 999,
        background: palette.cream,
        border: `1px solid ${palette.black}`,
        color: palette.muted,
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: 0.2,
      }}
    >
      {children}
    </div>
  </div>
);

const ChatBubble = ({
  side,
  speaker,
  children,
  delay = 0,
}: {
  side: 'left' | 'right';
  speaker: string;
  children: React.ReactNode;
  delay?: number;
}) => {
  const isRight = side === 'right';

  return (
    <div
      className="story-fadeup"
      style={{
        animationDelay: `${delay}ms`,
        display: 'flex',
        justifyContent: isRight ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        style={{
          maxWidth: 700,
          display: 'flex',
          flexDirection: 'column',
          alignItems: isRight ? 'flex-end' : 'flex-start',
          gap: 10,
        }}
      >
        <div
          style={{
            padding: isRight ? '0 18px 0 0' : '0 0 0 18px',
            color: isRight ? palette.primary : palette.muted,
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          {speaker}
        </div>
        <div
          style={{
            padding: '24px 28px',
            borderRadius: isRight ? '28px 28px 10px 28px' : '28px 28px 28px 10px',
            background: isRight ? palette.black : palette.lilac,
            color: isRight ? '#ffffff' : palette.text,
            border: `1px solid ${palette.black}`,
            boxShadow: isRight ? '10px 10px 0 rgba(255,61,139,0.3)' : '10px 10px 0 rgba(220,238,177,0.95)',
            fontSize: 30,
            lineHeight: 1.45,
            fontWeight: isRight ? 600 : 500,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

const MiniCard = ({
  title,
  children,
  delay = 0,
  minHeight = 118,
  titleSize = 25,
  bodySize = 20,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
  minHeight?: number;
  titleSize?: number;
  bodySize?: number;
}) => (
  <div
    className="story-fadeup"
    style={{
      animationDelay: `${delay}ms`,
      background: palette.surface,
      border: `1px solid ${palette.line}`,
      borderRadius: 18,
      padding: '26px 28px',
      minHeight,
    }}
  >
    <div style={{ color: palette.text, fontSize: titleSize, fontWeight: 700, marginBottom: 12, lineHeight: 1.12 }}>{title}</div>
    <div style={{ fontSize: bodySize, lineHeight: 1.34, color: palette.muted }}>{children}</div>
  </div>
);

const RouteMap = ({
  height = 250,
  delay = 260,
}: {
  height?: number | string;
  delay?: number;
}) => {
  const routeD =
    'M 594 18 C 540 18 492 20 440 24 C 390 28 344 34 318 54 C 298 70 282 96 260 123 C 232 158 202 196 150 238';

  return (
    <div
      className="story-fadeup"
      style={{
        animationDelay: `${delay}ms`,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 18,
        background: palette.surface,
        border: `1px solid ${palette.line}`,
        height,
      }}
    >
      <img
        src={realRouteMap}
        alt="逢甲大學到台中至善國中的真實地圖路線"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: '50% 47%',
          display: 'block',
          filter: 'saturate(0.95) contrast(1.02)',
        }}
      />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.12)' }} />
      <div style={{ position: 'absolute', left: 18, top: 16, zIndex: 3 }}>
        <div style={{ color: palette.primary, fontSize: 18, fontWeight: 700 }}>幾個路口的距離</div>
        <div style={{ marginTop: 4, color: palette.text, fontSize: 24, fontWeight: 700 }}>
          逢甲大學 → 至善國中
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 18,
          top: 18,
          zIndex: 3,
          borderRadius: 999,
          padding: '9px 14px',
          background: 'rgba(255,255,255,0.92)',
          boxShadow: '0 8px 26px rgba(29,29,31,0.12)',
          color: palette.primary,
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        近到有點意外
      </div>
      <svg
        viewBox="0 0 680 250"
        width="100%"
        height="100%"
        aria-label="逢甲大學到至善國中的路線動畫"
        style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}
      >
        <path
          d={routeD}
          fill="none"
          stroke="rgba(0,102,204,0.16)"
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="story-route"
          d={routeD}
          fill="none"
          stroke={palette.primary}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="594" cy="18" r="18" fill="#ffffff" stroke={palette.primary} strokeWidth="5" />
        <circle cx="594" cy="18" r="7" fill={palette.primary} />
        <circle cx="150" cy="238" r="18" fill="#ffffff" stroke="#d93025" strokeWidth="5" />
        <circle cx="150" cy="238" r="7" fill="#d93025" />
        <circle className="story-pulse" cx="150" cy="238" r="14" fill="#d93025" />
        <circle r="9" fill={palette.primary} stroke="#ffffff" strokeWidth="4">
          <animateMotion dur="3.2s" repeatCount="indefinite" path={routeD} />
        </circle>
      </svg>
      <div
        style={{
          position: 'absolute',
          right: 18,
          bottom: 16,
          zIndex: 3,
          padding: '8px 12px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.92)',
          boxShadow: '0 8px 26px rgba(29,29,31,0.1)',
          color: palette.text,
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        逢甲大學大門口
      </div>
      <div
        style={{
          position: 'absolute',
          left: 18,
          bottom: 16,
          zIndex: 3,
          padding: '8px 12px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.92)',
          boxShadow: '0 8px 26px rgba(29,29,31,0.1)',
          color: palette.text,
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        台中至善國中門口
      </div>
    </div>
  );
};

const Split = ({ left, right }: { left: React.ReactNode; right: React.ReactNode }) => (
  <div
    style={{
      flex: 1,
      display: 'grid',
      gridTemplateColumns: '1.04fr 0.96fr',
      gap: 72,
      alignItems: 'stretch',
    }}
  >
    {left}
    {right}
  </div>
);

const PlaceholderFrame = ({ hint }: { hint: string }) => (
  <div
    className="story-fadeup"
    style={{
      animationDelay: '220ms',
      height: '100%',
      display: 'flex',
      borderRadius: 18,
      overflow: 'hidden',
      background: palette.canvas,
      border: `1px solid ${palette.line}`,
    }}
  >
    <ImagePlaceholder hint={hint} width={690} height={760} />
  </div>
);

const Cover: Page = () => (
  <PageShell section="Opening" accent={palette.mint} showNumber={false} showHeader={false}>
    <div
      style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '0.92fr 1.08fr',
        gap: 72,
        alignItems: 'stretch',
      }}
    >
      <div
        style={{
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 76,
          paddingTop: 26,
          paddingBottom: 26,
        }}
      >
        <div>
          <div
            className="story-fade"
            style={{
              color: palette.primary,
              fontWeight: 700,
              fontSize: 24,
              letterSpacing: '0.08em',
              marginBottom: 40,
            }}
          >
            iOS Club 9th 社長｜開發者・設計實踐者
          </div>
          <HugeTitle
            size={94}
            maxWidth={1120}
            minSize={66}
            lineHeight={1.02}
            letterSpacing={-0.8}
            fontWeight={700}
            animationClass="story-fade"
          >
            <>
              有時候就要像喝醉一樣，
              <br />
              沒有理由地向前走。
            </>
          </HugeTitle>
          <div
            className="story-fade"
            style={{
              animationDelay: '120ms',
              width: 108,
              height: 6,
              borderRadius: 999,
              margin: '34px 0 34px',
              background: palette.primary,
            }}
          />
          <Lead maxWidth={620} size={34} lineHeight={1.46} opacity={0.82}>
            經驗，沒有替代品。
          </Lead>
        </div>
        <div
          className="story-fade"
          style={{
            animationDelay: '180ms',
            fontFamily: 'var(--osd-font-display)',
            fontSize: 50,
            fontWeight: 620,
            letterSpacing: '-0.03em',
            color: palette.text,
          }}
        >
          蔡承曄
        </div>
      </div>
      <div style={{ position: 'relative', minHeight: 0 }}>
        <div
          className="story-fade"
          style={{
            position: 'absolute',
            inset: '38px -26px -34px 72px',
            borderRadius: 34,
            background: 'rgba(0, 102, 204, 0.08)',
          }}
        />
        <div
          className="story-fade"
          style={{
            animationDelay: '160ms',
            position: 'relative',
            height: '100%',
            borderRadius: 30,
            border: `1px solid ${palette.line}`,
            background: palette.canvas,
            overflow: 'hidden',
            boxShadow: 'rgba(0, 0, 0, 0.12) 0 20px 48px',
          }}
        >
          <img
            src={coverPortrait}
            alt="首頁人像照"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: '54% 28%',
              display: 'block',
            }}
          />
        </div>
      </div>
    </div>
  </PageShell>
);

const AboutMe: Page = () => (
  <PageShell section="About me" accent={palette.blue}>
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 62, alignItems: 'stretch' }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 0 }}>
        <div
          className="story-fadeup"
          style={{
            color: palette.primary,
            fontSize: 28,
            fontWeight: 600,
            marginBottom: 24,
          }}
        >
          先快速認識我
        </div>
        <HugeTitle size={108} maxWidth={900}>
          我是蔡承曄。
        </HugeTitle>
        <AccentLine />
        <Lead maxWidth={820}>
          你也可以叫我瑞瑞或 CY。我是資訊三乙，曾經擔任 iOS Club 9th 社長，現在也持續在社群裡學習、分享和串起更多人。
        </Lead>
        <div
          className="story-fadeup"
          style={{
            animationDelay: '140ms',
            marginTop: 34,
            maxWidth: 760,
            borderLeft: `4px solid ${palette.primary}`,
            paddingLeft: 22,
            color: palette.text,
            fontSize: 28,
            lineHeight: 1.42,
            fontWeight: 600,
          }}
        >
          我想被記住的不是某一個職稱，而是我怎麼把技術、設計和社群經驗變成可以被看見的作品。
        </div>
        <div
          className="story-fadeup"
          style={{
            animationDelay: '160ms',
            marginTop: 34,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 14,
          }}
        >
          {[
            ['資訊三乙', 'CS junior'],
            ['iOS Club', '9th 社長'],
            ['GDG', 'Associated Lead'],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                borderTop: `3px solid ${palette.primary}`,
                paddingTop: 16,
              }}
            >
              <div style={{ color: palette.text, fontSize: 27, fontWeight: 700, lineHeight: 1.12 }}>{label}</div>
              <div style={{ marginTop: 8, color: palette.muted, fontSize: 18, fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div
          className="story-fadeup"
          style={{
            animationDelay: '120ms',
            borderRadius: 18,
            overflow: 'hidden',
            background: palette.canvas,
            border: `1px solid ${palette.line}`,
          }}
        >
          <img
            src={aboutIosClub}
            alt="iOS Club 活動照片"
            style={{
              width: '100%',
              height: 430,
              objectFit: 'cover',
              objectPosition: '50% 34%',
              display: 'block',
            }}
          />
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <MiniCard title="技術" delay={180} minHeight={154} titleSize={32} bodySize={25}>
            用 iOS、Swift 和 AI 工具，把想法推到可以 demo 的狀態。
          </MiniCard>
          <MiniCard title="設計" delay={260} minHeight={154} titleSize={32} bodySize={25}>
            在意介面、敘事和使用者第一眼看到的感覺。
          </MiniCard>
          <MiniCard title="社群" delay={340} minHeight={154} titleSize={32} bodySize={25}>
            從活動籌備、帶社團，到把人和資源串在一起。
          </MiniCard>
          <MiniCard title="分享" delay={420} minHeight={154} titleSize={32} bodySize={25}>
            把做過的事整理成脈絡，讓下一個人比較容易開始。
          </MiniCard>
        </div>
      </div>
    </div>
  </PageShell>
);

const Promise: Page = () => (
  <PageShell section="Dream question" accent={palette.coral}>
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        paddingTop: 36,
        paddingBottom: 8,
      }}
    >
      <div style={{ maxWidth: 1120 }}>
        <div
          className="story-fadeup"
          style={{
            color: palette.primary,
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 28,
          }}
        >
          Before the story starts
        </div>
        <HugeTitle size={112} maxWidth={1020} minSize={82} lineHeight={0.96} letterSpacing={-1}>
          你的夢想是什麼？
        </HugeTitle>
        <AccentLine color={palette.coral} />
        <Lead maxWidth={980} size={38} lineHeight={1.4} opacity={0.82}>
          如果你問以前的我，我其實答不太出來。這 30 分鐘，我想分享的是：我怎麼在一次次嘗試、失敗、被信任和重新站起來的過程裡，慢慢靠近自己的答案。
        </Lead>
      </div>

      <div style={{ marginTop: 34 }}>
        <div
          className="story-fadeup"
          style={{
            animationDelay: '160ms',
            position: 'relative',
            padding: '12px 6px 0',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 18,
              right: 18,
              top: 26,
              height: 2,
              background: palette.line,
            }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 22 }}>
            {[
              ['01', '不知道', palette.gold],
              ['02', '先試試', palette.coral],
              ['03', '跌下去', palette.mint],
              ['04', '再選擇', palette.blue],
            ].map(([num, label, color]) => (
              <div key={num} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: color,
                      boxShadow: `0 0 0 8px ${color}14`,
                      border: `2px solid ${palette.canvas}`,
                      zIndex: 1,
                    }}
                  />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, color, fontWeight: 800, marginBottom: 6 }}>{num}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.12 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 28, paddingBottom: 8, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 22 }}>
          {[
            ['01', '一開始沒有答案', '我不是從小就知道自己要成為誰，也不是一開始就很會寫程式。', palette.gold],
            ['02', '先把機會接住', '有些機會出現時，我其實還沒準備好，但我先答應、先開始做。', palette.coral],
            ['03', '跌倒後才看清楚', '沒有得獎、沒有入圍、被比較的時候，反而讓我更確定自己想變強。', palette.mint],
            ['04', '夢想變成方向', '後來我才發現，夢想不是一句漂亮的話，而是我願意一直投入的方向。', palette.blue],
          ].map(([num, title, text, color], i) => (
            <Card key={num} color={color} delay={220 + i * 90} minHeight={226} padding="30px 28px 26px">
              <div style={{ fontSize: 21, color, fontWeight: 800 }}>{num}</div>
              <div>
                <div style={{ color: palette.text, fontSize: 30, fontWeight: 600, marginBottom: 14, lineHeight: 1.18 }}>{title}</div>
                <div style={{ fontSize: 22, lineHeight: 1.48, color: palette.muted }}>{text}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  </PageShell>
);

const Roots: Page = () => (
  <PageShell section="My roots" accent={palette.gold}>
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: 56, alignItems: 'stretch' }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0 }}>
        <div>
          <div
            className="story-fadeup"
            style={{
              color: palette.primary,
              fontSize: 28,
              fontWeight: 600,
              marginBottom: 24,
            }}
          >
            在介紹以前的我之前
          </div>
          <HugeTitle size={88} maxWidth={760}>我其實是從體育班開始的。</HugeTitle>
          <AccentLine color={palette.gold} />
          <Lead maxWidth={660}>
            我想先打破一個想像：我不是從小就很會寫程式，也不是一開始就知道自己要走資訊。我的起點跟大家想像的不太一樣，但改變就是從這種普通又不確定的地方開始。
          </Lead>
        </div>

        <div style={{ display: 'grid', gap: 18, alignContent: 'end' }}>
          <div
            className="story-fadeup"
            style={{
              animationDelay: '180ms',
              maxWidth: 540,
              borderLeft: `4px solid ${palette.gold}`,
              paddingLeft: 22,
            }}
          >
            <div style={{ color: palette.gold, fontSize: 18, fontWeight: 800, marginBottom: 12 }}>真正想說的是</div>
            <div style={{ fontSize: 33, fontWeight: 650, lineHeight: 1.28 }}>
              改變不一定從很遠的地方開始。
            </div>
          </div>

          <div
            className="story-fadeup"
            style={{
              animationDelay: '140ms',
              borderRadius: 18,
              overflow: 'hidden',
              background: palette.canvas,
              border: `1px solid ${palette.line}`,
            }}
          >
            <img
              src={sportsClassPhoto}
              alt="至善國中體育班合照"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ minHeight: 0, display: 'flex' }}>
        <RouteMap height="100%" delay={180} />
      </div>
    </div>
  </PageShell>
);

const HighSchoolClub: Page = () => (
  <PageShell section="High school" accent={palette.coral}>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 34 }}>
      <div style={{ width: '100%' }}>
        <div
          className="story-fadeup"
          style={{
            color: palette.primary,
            fontSize: 26,
            fontWeight: 600,
            marginBottom: 22,
          }}
        >
          高中：台中二中
        </div>
        <HugeTitle size={76} maxWidth={1460}>高中社團，現代視覺文化同人社。</HugeTitle>
        <AccentLine color={palette.coral} />
        <Lead maxWidth={1460}>
          它叫「現代視覺文化同人社」。不是資訊社、不是競賽隊，也不是看起來會直接變成成果的地方。但那時候的我，就是被創作、視覺文化和同人作品吸引。
        </Lead>
      </div>
      <div
        className="story-fadeup"
        style={{
          animationDelay: '160ms',
          height: 560,
          borderRadius: 18,
          border: `1px solid rgba(29,29,31,0.12)`,
          background: '#1d1d1f',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <img
          src={highSchoolClubPhoto}
          alt="高中同人社照片"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: '48% 48%',
            display: 'block',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.08) 58%, rgba(0,0,0,0.76) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 34,
            top: 34,
            bottom: 30,
            width: 340,
            color: '#f5f5f7',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ color: 'rgba(245,245,247,0.82)', fontSize: 25, lineHeight: 1.34 }}>
              這不是一個「跟現在成果有關」的社團。
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 22 }}>
              {['創作', '視覺文化', '同人作品', '好奇心'].map((tag) => (
                <span
                  key={tag}
                  style={{
                    borderRadius: 999,
                    border: '1px solid rgba(245,245,247,0.28)',
                    background: 'rgba(245,245,247,0.08)',
                    padding: '8px 13px',
                    color: 'rgba(245,245,247,0.88)',
                    fontSize: 17,
                    fontWeight: 700,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
            <div style={{ color: 'rgba(245,245,247,0.68)', fontSize: 19, lineHeight: 1.42 }}>
              它代表的不是成果，而是我願意走進一個完全不同的世界。
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageShell>
);

const Before: Page = () => (
  <PageShell section="Chapter 1" accent={palette.gold}>
    <Split
      left={
        <TopBottomLayout
          bottomPadding={8}
          top={
            <>
              <HugeTitle size={82}>以前的我：看起來普通，但心裡其實很多問號。</HugeTitle>
              <AccentLine color={palette.gold} />
            </>
          }
          bottom={
            <Lead size={38} lineHeight={1.42}>
            我曾經很在意別人的看法，也常常不知道自己到底擅長什麼。那時候的我，比起答案，更常遇到的是不確定。
            </Lead>
          }
        />
      }
      right={<PlaceholderFrame hint="放一張童年、學校、家庭或日常照片" />}
    />
  </PageShell>
);

const BrandBadge = ({
  src,
  alt,
  background = 'transparent',
  padding = 0,
  radius = 20,
}: {
  src: string;
  alt: string;
  background?: string;
  padding?: number;
  radius?: number;
}) => (
  <div
    style={{
      width: 112,
      height: 86,
      display: 'grid',
      placeItems: 'center',
      background,
      borderRadius: radius,
      padding,
      overflow: 'hidden',
    }}
  >
    <img src={src} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
  </div>
);

const FestivalBadge = () => (
  <BrandBadge src={tcs12Badge} alt="TCS12 活動卡片" radius={22} />
);

const ModelIcon = () => (
  <svg viewBox="0 0 120 92" width="112" height="86" aria-hidden="true">
    <path
      d="M18 77c18-11 35-16 52-15 14 1 25 5 32 11"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="5"
      opacity="0.24"
    />
    <circle cx="61" cy="20" r="10" fill="currentColor" />
    <path
      d="M61 32c-12 8-17 18-16 31m17-31c11 9 17 18 20 29M45 47l-17 18m34-33l-7 31m27-2l16 12"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="8"
    />
    <path
      d="M52 38c7 5 15 5 23 0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="4"
      opacity="0.34"
    />
  </svg>
);

const ThreeWords: Page = () => (
  <PageShell section="Before" accent={palette.gold}>
    <div
      style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gridTemplateRows: 'repeat(2, minmax(0, 1fr))',
        overflow: 'hidden',
        border: `1px solid ${palette.line}`,
      }}
    >
      <ExperienceQuadrant
        title={
          <>
            TCS12
            <br />
            中部動漫文化祭副召
          </>
        }
        count="01"
        icon={<FestivalBadge />}
        subtitle="因為好奇，所以開始走進大型活動的籌備現場。"
        titleSize={44}
        delay={120}
        tags={['活動企劃', '跨組協調', '現場節奏']}
        takeaway="學到：管理團隊跟大型專案，靠的是把人、流程和進度都接住。"
        lines={['不是只在台下參加，而是真的開始扛起一部分責任。', '我也第一次更完整地學會協調、溝通，和把事情推動下去。']}
      />
      <ExperienceQuadrant
        title="陪玩師"
        count="02"
        icon={<BrandBadge src={niceeAppIcon} alt="Nicee App Store 官方圖示" radius={22} />}
        subtitle="因為好奇，所以練習跟陌生人快速建立信任。"
        dark
        delay={220}
        tags={['語音溝通', '信任建立', '情緒觀察']}
        takeaway="學到：溝通不是一直講話，而是判斷對方需要什麼。"
        lines={['一場遊戲裡，要聊天、觀察、接住情緒。', '那也是一種很真實的溝通訓練。']}
      />
      <ExperienceQuadrant
        title="模特"
        count="03"
        icon={<ModelIcon />}
        subtitle="因為好奇，所以站到鏡頭前，試著理解表達。"
        dark
        delay={320}
        tags={['鏡頭感', '肢體表達', '視覺敘事']}
        takeaway="學到：行銷自己，也是一種把價值說清楚的能力。"
        lines={['表達不只有文字，也有姿態、畫面和臨場感。', '我開始知道自己可以用不同方式被理解。']}
      />
      <ExperienceQuadrant
        title="麥當勞店員"
        count="04"
        icon={<BrandBadge src={mcdonaldsGoldenArches} alt="McDonald's Golden Arches" padding={10} />}
        subtitle="因為好奇，所以進到很快的工作節奏裡。"
        delay={420}
        tags={['SOP', '速度', '抗壓']}
        takeaway="學到：把小事做準，就是可靠的開始。"
        lines={['把小事做準、把流程做穩。', '這些經驗看起來分散，但都是真的做過。']}
      />
    </div>
  </PageShell>
);

const ExperienceQuadrant = ({
  title,
  count,
  icon,
  subtitle,
  lines,
  tags,
  takeaway,
  titleSize = 54,
  dark = false,
  delay = 0,
}: {
  title: React.ReactNode;
  count: string;
  icon?: React.ReactNode;
  subtitle: string;
  lines: string[];
  tags: string[];
  takeaway: string;
  titleSize?: number;
  dark?: boolean;
  delay?: number;
}) => (
  <section
    className="story-fadeup"
    style={{
      animationDelay: `${delay}ms`,
      background: dark ? '#242426' : title === '教學與社群' ? '#f5f5f7' : '#ffffff',
      color: dark ? '#f5f5f7' : palette.text,
      padding: '26px 34px 28px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: 0,
    }}
  >
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 20,
          height: 58,
        }}
      >
        <span style={{ color: dark ? '#8ab4ff' : palette.primary, fontSize: 22, fontWeight: 800 }}>{count}</span>
        {icon ? (
          <span
            style={{
              color: dark ? '#f5f5f7' : palette.text,
              display: 'grid',
              placeItems: 'center',
              flex: '0 0 auto',
              transform: 'translateY(-10px) scale(0.84)',
              transformOrigin: 'top right',
            }}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <div
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: titleSize,
          fontWeight: 700,
          lineHeight: 1.05,
          minHeight: 0,
        }}
      >
        {title}
      </div>
      <div style={{ marginTop: 12, fontSize: 23, lineHeight: 1.26, opacity: dark ? 0.86 : 0.68 }}>{subtitle}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', gap: 7, marginTop: 12 }}>
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              borderRadius: 999,
              border: `1px solid ${dark ? 'rgba(245,245,247,0.24)' : 'rgba(0,102,204,0.18)'}`,
              background: dark ? 'rgba(245,245,247,0.08)' : 'rgba(0,102,204,0.06)',
              color: dark ? 'rgba(245,245,247,0.86)' : palette.primary,
              padding: '5px 10px',
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 14 }}>
      {lines.map((line) => (
        <div
          key={line}
          style={{
            color: dark ? 'rgba(245,245,247,0.78)' : palette.muted,
            fontSize: 17,
            lineHeight: 1.26,
          }}
        >
          {line}
        </div>
      ))}
      <div
        style={{
          marginTop: 6,
          borderTop: `1px solid ${dark ? 'rgba(245,245,247,0.16)' : palette.line}`,
          paddingTop: 11,
          color: dark ? '#f5f5f7' : palette.text,
          fontSize: 19,
          lineHeight: 1.26,
          fontWeight: 750,
        }}
      >
        {takeaway}
      </div>
    </div>
  </section>
);

const experienceStats = [
  {
    title: '競賽',
    count: '10+',
    detail: '電子設計、海峽創客、腦神經科學、黑客松',
    focus: '不是為了堆數量，而是不斷把想法丟進真實評審和時限裡。',
  },
  {
    title: '開發',
    count: '3',
    detail: '半逢遇甲、行動逢甲、KindReach',
    focus: '每個專案都逼我從功能思維，慢慢走向真正要解的使用者問題。',
  },
  {
    title: '幹部與社群',
    count: '5+',
    detail: 'iOS Club 社長、GDG on Campus Associate Lead',
    focus: '開始學的不只是自己做，而是怎麼把一群人帶到同一個方向。',
  },
  {
    title: '教學與助教',
    count: '8+',
    detail: 'iOS、程式設計、Swift Camp、Code for Future',
    focus: '教別人的時候，我也被迫把模糊的理解整理成真的能被帶走的方法。',
  },
  {
    title: '講座',
    count: '3',
    detail: '企業宣講、Developer Workshop、校園社群分享',
    focus: '站上台後我更明白，表達不是背稿，而是把經驗整理成別人聽得懂的形狀。',
  },
  {
    title: '證照',
    count: '9+',
    detail: 'Apple、Swift、GenAI、Linux、EMT-1',
    focus: '它們不是亮點本身，比較像是我願意一路把基礎補齊的證明。',
  },
] as const;

const ExperienceWall: Page = () => (
  <PageShell section="The present" accent={palette.blue}>
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        paddingTop: 34,
        paddingBottom: 8,
      }}
    >
      <div
        style={{
          minHeight: 190,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <HugeTitle size={70} maxWidth={1180}>那現在的我，是什麼樣子？</HugeTitle>
        <p
          className="story-fadeup"
          style={{
            animationDelay: '100ms',
            fontSize: 28,
            lineHeight: 1.38,
            color: palette.muted,
            margin: '18px 0 0',
            maxWidth: 1520,
            whiteSpace: 'nowrap',
          }}
        >
          經歷看起來很多，但這頁不逐條念。重點是：它們不是突然出現，而是一次一次嘗試累積出來的。
        </p>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(2, minmax(0, 1fr))', gap: 20 }}>
        {experienceStats.map(({ title, count, detail, focus }, i) => (
          <div
            key={title}
            className="story-fadeup"
            style={{
              animationDelay: `${140 + i * 70}ms`,
              minHeight: 0,
              borderRadius: 18,
              border: `1px solid ${palette.line}`,
              background: palette.surface,
              padding: '28px 30px 26px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 18 }}>
                <div style={{ color: palette.text, fontSize: 38, fontWeight: 800, lineHeight: 1.08 }}>{title}</div>
                <div style={{ color: palette.primary, fontSize: 54, fontWeight: 800, lineHeight: 0.95 }}>{count}</div>
              </div>
              <div style={{ color: palette.muted, fontSize: 27, lineHeight: 1.32 }}>{detail}</div>
            </div>
            <div
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: `1px solid ${palette.line}`,
                color: palette.text,
                fontSize: 23,
                lineHeight: 1.34,
                fontWeight: 650,
              }}
            >
              {focus}
            </div>
          </div>
        ))}
      </div>
    </div>
  </PageShell>
);

const FreshmanIntro: Page = () => (
  <PageShell section="Chapter setup" accent={palette.lime}>
    <div
      style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '0.94fr 1.06fr',
        gap: 40,
        alignItems: 'stretch',
        minHeight: 0,
      }}
    >
      <div
        className="story-fadeup"
        style={{
          borderRadius: 34,
          border: `2px solid ${palette.black}`,
          background: palette.black,
          color: '#fff',
          padding: '58px 56px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '14px 14px 0 rgba(255,61,139,0.2)',
        }}
      >
        <div>
          <div
            style={{
              color: palette.lime,
              fontSize: 22,
              lineHeight: 1.2,
              fontWeight: 850,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: 30,
            }}
          >
            回到最一開始
          </div>
          <h1
            style={{
              fontFamily: 'var(--osd-font-display)',
              fontSize: 84,
              lineHeight: 1.02,
              letterSpacing: -1.1,
              fontWeight: 760,
              margin: 0,
              maxWidth: 760,
            }}
          >
            接下來，
            <br />
            我想先從
            <br />
            大一開始講。
          </h1>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: 31, lineHeight: 1.42, fontWeight: 520 }}>
          現在看到的經歷很多，但它們不是一開始就排好的路線。
        </div>
      </div>

      <div
        className="story-fadeup"
        style={{
          animationDelay: '140ms',
          position: 'relative',
          borderRadius: 34,
          border: `2px solid ${palette.black}`,
          background: palette.surfaceStrong,
          overflow: 'hidden',
          padding: '54px 58px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 0,
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: -34,
            top: 50,
            width: 280,
            height: 170,
            borderRadius: 34,
            background: palette.lilac,
            transform: 'rotate(-8deg)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 44,
            bottom: 68,
            width: 330,
            height: 150,
            borderRadius: 34,
            background: palette.cream,
            transform: 'rotate(5deg)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ color: palette.primary, fontSize: 24, fontWeight: 900, marginBottom: 24 }}>為什麼要倒回去？</div>
          <div style={{ color: palette.black, fontSize: 52, lineHeight: 1.16, fontWeight: 820, maxWidth: 760 }}>
            因為如果只看現在，很容易以為我是一路順順地走到這裡。
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'grid',
            gridTemplateColumns: '88px 1fr',
            gap: 26,
            alignItems: 'center',
            borderRadius: 28,
            background: '#fff',
            border: `2px solid ${palette.black}`,
            padding: '30px 34px',
            boxShadow: '10px 10px 0 rgba(0,0,0,0.08)',
          }}
        >
          <div
            style={{
              width: 70,
              height: 70,
              borderRadius: 999,
              background: palette.lime,
              color: palette.black,
              display: 'grid',
              placeItems: 'center',
              fontSize: 25,
              fontWeight: 900,
            }}
          >
            01
          </div>
          <div style={{ color: palette.muted, fontSize: 31, lineHeight: 1.42, fontWeight: 560 }}>
            所以我想先回到大一，從那個還不知道自己能做什麼的我開始介紹。
          </div>
        </div>
      </div>
    </div>
  </PageShell>
);

const TurningPoint: Page = () => (
  <PageShell section="Chapter 2" accent={palette.coral}>
    <div
      style={{
        flex: 1,
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <HugeTitle size={150} maxWidth={1580} animationClass="">寒假時，我接到了一通電話。</HugeTitle>
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 24, display: 'flex', justifyContent: 'center' }}>
        <p
          style={{
            color: 'currentColor',
            opacity: 0.76,
            margin: 0,
            maxWidth: 1040,
            fontSize: 38,
            lineHeight: 1.42,
          }}
        >
          那通電話沒有立刻改變我的人生，但它讓我第一次感覺到
          <br />
          有些機會，是在你還沒有完全準備好的時候出現的。
        </p>
      </div>
    </div>
  </PageShell>
);

const TheCall: Page = () => (
  <PageShell section="The call" accent={palette.coral}>
    <div
      style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '0.82fr 1.18fr',
        gap: 56,
        alignItems: 'stretch',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 24, height: '100%' }}>
        <div>
          <HugeTitle size={70} maxWidth={860}>那通電話，其實是我第一次走進比賽。</HugeTitle>
          <AccentLine color={palette.coral} />
          <Lead maxWidth={620}>
            左邊是楷祐學長，右邊是當時心裡其實超慌的我。機會不是等我準備好才出現，而是先問我願不願意走進去。
          </Lead>
        </div>
        <div
          className="story-fadeup"
          style={{
            animationDelay: '220ms',
            background: 'rgba(255,255,255,0.72)',
            border: `1px solid ${palette.line}`,
            borderRadius: 26,
            padding: '28px 30px',
            boxShadow: '0 22px 48px rgba(29,29,31,0.05)',
            maxWidth: 620,
            alignSelf: 'flex-start',
          }}
        >
          <div style={{ color: palette.muted, fontSize: 19, fontWeight: 750, marginBottom: 14 }}>最後讓我答應的，不是我突然變厲害</div>
          <div style={{ fontSize: 38, lineHeight: 1.32, fontWeight: 760, letterSpacing: 0 }}>
            而是有人先告訴我：
            <br />
            你不用一開始就什麼都會。
          </div>
        </div>
      </div>

      <div
        className="story-fadeup"
        style={{
          animationDelay: '120ms',
          borderRadius: 34,
          border: `1px solid ${palette.line}`,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,250,252,0.92) 100%)',
          boxShadow: '0 30px 72px rgba(29,29,31,0.08)',
          padding: '22px 24px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '2px 4px 16px',
            borderBottom: `1px solid ${palette.line}`,
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            {['#ff5f57', '#ffbd2e', '#28c840'].map((color) => (
              <span key={color} style={{ width: 12, height: 12, borderRadius: '50%', background: color, display: 'block' }} />
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>寒假那通電話</div>
            <div style={{ color: palette.muted, fontSize: 16 }}>如果把當時的氣氛翻成左右對話</div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18 }}>
          <ChatDivider delay={180}>寒假某一天</ChatDivider>
          <ChatBubble side="left" speaker="楷祐學長" delay={250}>
            有沒有興趣一起比賽？
          </ChatBubble>
          <ChatBubble side="right" speaker="我心裡" delay={340}>
            不是哥們，我什麼都不會，我拿什麼打比賽？
          </ChatBubble>
          <ChatBubble side="left" speaker="楷祐學長" delay={430}>
            不用擔心，你先處理一些文書工作、畫畫海報就好。
          </ChatBubble>
          <ChatDivider delay={500}>我想了片刻</ChatDivider>
          <ChatBubble side="right" speaker="我後來" delay={580}>
            好吧，反正那時候的我好像也有點用處。那我就答應了。
          </ChatBubble>
        </div>
      </div>
    </div>
  </PageShell>
);

const FirstStep: Page = () => (
  <PageShell section="After the call" accent={palette.mint}>
    <div
      className="story-fadeup"
      style={{
        flex: 1,
        display: 'grid',
        gridTemplateRows: '0.94fr 44px 1.06fr',
        minHeight: 0,
        borderRadius: 34,
        overflow: 'hidden',
        border: `1px solid ${palette.line}`,
        background: '#fff',
        boxShadow: '0 34px 92px rgba(29,29,31,0.12)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '0.9fr 1.1fr',
          gap: 40,
          minHeight: 0,
          alignItems: 'center',
          padding: '46px 54px 34px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(247,250,255,0.9))',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 54,
            right: 54,
            bottom: 0,
            height: 2,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,61,139,0.1) 24%, rgba(255,61,139,0.64) 50%, rgba(197,176,244,0.3) 76%, transparent 100%)',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}>
          <div style={{ color: palette.primary, fontSize: 22, fontWeight: 850 }}>第一步其實很小</div>
          <HugeTitle size={76} maxWidth={820} animationClass="story-fade">
            我以為，我只是去幫忙。
          </HugeTitle>
        </div>
        <div
          style={{
            borderLeft: `4px solid ${palette.mint}`,
            padding: '8px 0 8px 34px',
          }}
        >
          <div style={{ color: palette.primary, fontSize: 22, fontWeight: 850, marginBottom: 14 }}>一開始能做的事</div>
          <div style={{ color: palette.text, fontSize: 45, lineHeight: 1.08, fontWeight: 850, marginBottom: 16 }}>
            文書、海報、整理資料。
          </div>
          <div style={{ color: palette.muted, fontSize: 27, lineHeight: 1.36 }}>
            聽起來不像核心工作，但那是我第一個能插上手的位置。
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: 16,
          minHeight: 0,
          padding: '0 54px',
          background: palette.text,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: -10,
            bottom: -10,
            width: 2,
            transform: 'translateX(-50%)',
            background: 'linear-gradient(180deg, rgba(255,61,139,0.12), rgba(255,61,139,0.58), rgba(197,176,244,0.16))',
          }}
        />
        <div
          style={{
            height: 2,
            background: 'linear-gradient(90deg, rgba(255,61,139,0), rgba(255,61,139,0.52))',
          }}
        />
        <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: palette.primary,
              boxShadow: '0 0 0 8px rgba(255,61,139,0.16)',
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
          <div
            style={{
              borderRadius: 999,
              padding: '10px 24px',
              background: palette.black,
              border: '1px solid rgba(255,255,255,0.18)',
              color: palette.cream,
              fontSize: 23,
              lineHeight: 1,
              fontWeight: 850,
              whiteSpace: 'nowrap',
              position: 'relative',
              zIndex: 1,
            }}
          >
            後來才發現，這不是旁邊的位置。
          </div>
        </div>
        <div
          style={{
            height: 2,
            background: 'linear-gradient(90deg, rgba(197,176,244,0.52), rgba(255,61,139,0))',
          }}
        />
      </div>

      <div
        style={{
          background: palette.text,
          color: '#f5f5f7',
          padding: '34px 54px 44px',
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
          gap: 28,
          minHeight: 0,
          position: 'relative',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 40, alignItems: 'end' }}>
          <div>
            <div style={{ color: palette.primary, fontSize: 24, fontWeight: 850, marginBottom: 16 }}>結果</div>
            <HugeTitle size={62} maxWidth={620} animationClass="story-fade">
              但我真的走進了比賽。
            </HugeTitle>
          </div>
          <div style={{ color: 'rgba(245,245,247,0.68)', fontSize: 28, lineHeight: 1.36, fontWeight: 650 }}>
            不是突然變強，而是從一個能貢獻的位置，慢慢靠近核心。
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 0,
            minHeight: 0,
            borderRadius: 24,
            border: '1px solid rgba(245,245,247,0.14)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '10%',
              right: '10%',
              top: 50,
              height: 2,
              background: 'linear-gradient(90deg, rgba(255,61,139,0.15), rgba(255,61,139,0.7), rgba(255,61,139,0.15))',
            }}
          />
          {[
            ['01', '開始聽懂討論', '不是全部都懂，但我開始知道問題長什麼樣子。'],
            ['02', '慢慢參與實作', '從幫忙處理邊角，變成能一起把事情往前推。'],
            ['03', '找到能貢獻的位置', '我不用一開始就很強，也可以先在團隊裡有用。'],
          ].map(([count, title, text], i) => (
            <div
              key={title}
              style={{
                background: i === 1 ? 'rgba(197,176,244,0.34)' : 'rgba(247,247,245,0.1)',
                borderLeft: i === 0 ? 'none' : '1px solid rgba(245,245,247,0.12)',
                padding: '24px 28px 26px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                gap: 28,
                minHeight: 0,
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 999,
                  background: palette.lilac,
                  color: palette.text,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 24,
                  fontWeight: 900,
                  boxShadow: '0 0 0 8px rgba(197,176,244,0.22)',
                  zIndex: 1,
                }}
              >
                {count}
              </div>
              <div>
                <div style={{ fontSize: 34, lineHeight: 1.14, fontWeight: 850, marginBottom: 12 }}>{title}</div>
                <div style={{ color: 'rgba(245,245,247,0.7)', fontSize: 25, lineHeight: 1.36 }}>{text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </PageShell>
);

const AwardMoment: Page = () => (
  <PageShell section="Award moment" accent={palette.primary}>
    <div
      style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1.08fr 0.92fr',
        gap: 44,
        minHeight: 0,
        alignItems: 'stretch',
      }}
    >
      <div
        className="story-fadeup"
        style={{
          borderRadius: 32,
          overflow: 'hidden',
          position: 'relative',
          background: palette.text,
          border: `1px solid ${palette.black}`,
          boxShadow: '14px 14px 0 rgba(255,61,139,0.28)',
          minHeight: 0,
        }}
      >
        <img
          src={awardTeamPhoto}
          alt="逢甲大學資訊工程學系團隊獲 2024 全國電子設計創意競賽智慧大數據及行動 APP 類冠軍"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: '50% 50%',
            display: 'block',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.02) 42%, rgba(0,0,0,0.78) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 34,
            right: 34,
            bottom: 30,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 24,
          }}
        >
          <div>
            <div style={{ color: 'rgba(255,255,255,0.76)', fontSize: 22, fontWeight: 800, marginBottom: 10 }}>
              2024 全國電子設計創意競賽
            </div>
            <div style={{ color: '#fff', fontSize: 46, lineHeight: 1.02, fontWeight: 900 }}>
              智慧大數據及行動 APP 類冠軍
            </div>
          </div>
          <div
            style={{
              borderRadius: 999,
              padding: '14px 22px',
              background: 'rgba(255,255,255,0.92)',
              color: palette.black,
              fontSize: 22,
              fontWeight: 900,
              whiteSpace: 'nowrap',
            }}
          >
            冠軍
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          gap: 24,
          minHeight: 0,
        }}
      >
        <div>
          <div
            className="story-fadeup"
            style={{
              animationDelay: '120ms',
              color: palette.primary,
              fontSize: 24,
              fontWeight: 900,
              marginBottom: 20,
            }}
          >
            從「我可以幫什麼」到「我們做到了」
          </div>
          <HugeTitle size={68} maxWidth={760}>
            第一次走進比賽，我們拿到了冠軍。
          </HugeTitle>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '200ms',
            borderRadius: 28,
            border: `1px solid ${palette.line}`,
            background: '#fff',
            padding: '30px 32px',
            display: 'grid',
            gap: 12,
            minHeight: 0,
            boxShadow: '10px 10px 0 rgba(220,238,177,0.95)',
          }}
        >
          {[
            ['賽事', '2024 第二十屆全國電子設計創意競賽'],
            ['作品', '基於影像辨識與互動回饋輔助輪椅族群運動之應用程式'],
            ['結果', '智慧大數據及行動 APP 類 冠軍'],
          ].map(([label, value], i) => (
            <div
              key={label}
              style={{
                display: 'grid',
                gridTemplateColumns: '118px 1fr',
                gap: 24,
                alignItems: 'center',
                minHeight: i === 1 ? 116 : 78,
                padding: i === 1 ? '14px 0' : '8px 0',
                borderTop: i === 0 ? 'none' : `1px solid ${palette.line}`,
              }}
            >
              <div
                style={{
                  color: i === 2 ? palette.black : palette.primary,
                  fontSize: 28,
                  lineHeight: 1.05,
                  fontWeight: 950,
                  letterSpacing: '0.02em',
                }}
              >
                {label}
              </div>
              <div
                style={{
                  color: palette.text,
                  fontSize: i === 1 ? 36 : 40,
                  lineHeight: i === 1 ? 1.18 : 1.12,
                  fontWeight: i === 2 ? 930 : 820,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '300ms',
            borderRadius: 24,
            background: palette.black,
            color: '#fff',
            padding: '28px 32px',
            display: 'grid',
            gap: 12,
          }}
        >
          <div style={{ color: palette.lime, fontSize: 22, fontWeight: 900 }}>我後來才懂</div>
          <div style={{ fontSize: 34, lineHeight: 1.28, fontWeight: 820 }}>
            我一開始只是想幫上忙，後來才發現自己真的在團隊裡有位置。
          </div>
          <div style={{ color: 'rgba(255,255,255,0.58)', fontSize: 19, lineHeight: 1.4 }}>
            Source: 逢甲大學資訊工程學系新聞，2024-03-28
          </div>
        </div>
      </div>
    </div>
  </PageShell>
);

const CaptainQuestion: Page = () => (
  <PageShell section="The next ask" accent={palette.primary} mode="dark">
    <div
      style={{
        flex: 1,
        display: 'grid',
        gridTemplateRows: '0.84fr 1fr',
        gap: 40,
        minHeight: 0,
        position: 'relative',
      }}
    >
      <div
        className="story-fade"
        style={{
          position: 'absolute',
          inset: '-90px -80px auto auto',
          width: 520,
          height: 520,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,61,139,0.24) 0%, rgba(0,0,0,0) 68%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'end',
          minHeight: 0,
        }}
      >
        <div
          className="story-fadeup"
          style={{
            color: palette.lime,
            fontSize: 24,
            lineHeight: 1,
            fontWeight: 900,
            marginBottom: 28,
          }}
        >
          冠軍之後，不是結束
        </div>
        <HugeTitle size={86} maxWidth={1240}>
          然後學長問我：要不要當隊長？
        </HugeTitle>
        <div
          className="story-fadeup"
          style={{
            animationDelay: '180ms',
            display: 'grid',
            gridTemplateColumns: '1fr 1px 0.92fr',
            gap: 34,
            alignItems: 'center',
            marginTop: 34,
            maxWidth: 1280,
          }}
        >
          <div style={{ color: 'rgba(255,255,255,0.68)', fontSize: 32, lineHeight: 1.4, fontWeight: 650 }}>
            得獎沒有讓我突然變勇敢，反而讓我第一次感覺到責任真的來了。
          </div>
          <div style={{ width: 1, height: 62, background: 'rgba(255,61,139,0.52)' }} />
          <div style={{ color: 'rgba(255,255,255,0.74)', fontSize: 32, lineHeight: 1.4, fontWeight: 720 }}>
            那一瞬間，我想到的不是榮耀，而是三個很重的問題。
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 22, minHeight: 0 }}>
        {[
          ['01', '我要帶人？', '以前我只是把自己的事情做好，現在要開始接住別人的節奏。'],
          ['02', '我夠格嗎？', '剛剛才覺得自己有位置，下一秒就要站到更前面。'],
          ['03', '如果搞砸怎麼辦？', '被信任很開心，但也代表失誤不再只影響自己。'],
        ].map(([count, title, text], i) => (
          <div
            key={title}
            className="story-fadeup"
            style={{
              animationDelay: `${240 + i * 120}ms`,
              borderRadius: 24,
              border: i === 1 ? `1px solid ${palette.lime}` : '1px solid rgba(255,255,255,0.16)',
              background: i === 0 ? palette.lilac : i === 1 ? palette.lime : palette.cream,
              color: palette.black,
              padding: '30px 32px 32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 30,
              minHeight: 0,
            }}
          >
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 999,
                display: 'grid',
                placeItems: 'center',
                background: i === 1 ? palette.black : palette.primary,
                color: '#fff',
                fontSize: 24,
                fontWeight: 950,
              }}
            >
              {count}
            </div>
            <div>
              <div style={{ color: palette.black, fontSize: 44, lineHeight: 1.12, fontWeight: 900, marginBottom: 16 }}>
                {title}
              </div>
              <div style={{ color: palette.muted, fontSize: 28, lineHeight: 1.36 }}>
                {text}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </PageShell>
);

const TakingResponsibility: Page = () => (
  <PageShell section="Taking responsibility" accent={palette.primary}>
    <div
      style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '0.88fr 1.12fr',
        gap: 28,
        minHeight: 0,
        alignItems: 'stretch',
      }}
    >
      <div
        className="story-fadeup"
        style={{
          background: palette.lime,
          border: `2px solid ${palette.black}`,
          borderRadius: 30,
          padding: '58px 54px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 0,
          boxShadow: '14px 14px 0 rgba(0,0,0,0.12)',
        }}
      >
        <div>
          <div
            style={{
              color: palette.black,
              fontSize: 22,
              lineHeight: 1.2,
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 28,
            }}
          >
            從壓力到行動
          </div>
          <HugeTitle size={72} maxWidth={760} animationClass="story-fade">
            我不是突然會帶隊，是先把責任拆小。
          </HugeTitle>
        </div>
        <p
          className="story-fadeup"
          style={{
            animationDelay: '120ms',
            color: palette.muted,
            fontSize: 32,
            lineHeight: 1.48,
            fontWeight: 520,
            margin: '44px 0 0',
            maxWidth: 680,
          }}
        >
          壓力沒有消失，但我開始知道，隊長不是什麼都自己做，而是讓事情有人接、有人推、有人補位。
        </p>
      </div>

      <div
        className="story-fadeup"
        style={{
          animationDelay: '160ms',
          display: 'grid',
          gridTemplateRows: 'repeat(3, minmax(0, 1fr))',
          gap: 18,
          minHeight: 0,
        }}
      >
        {[
          ['01', '拆清楚', '先把目標、時程、誰要做什麼講清楚。'],
          ['02', '推出去', '不是每件事都自己扛，而是讓每個人有能開始的位置。'],
          ['03', '補上去', '有人卡住時，不是責怪，而是一起把洞補起來。'],
        ].map(([count, title, text], i) => (
          <div
            key={title}
            style={{
              padding: '34px 40px',
              border: `2px solid ${palette.black}`,
              borderRadius: 28,
              display: 'grid',
              gridTemplateColumns: '108px 1fr',
              gap: 28,
              alignItems: 'center',
              minHeight: 0,
              background: i === 0 ? palette.lilac : i === 1 ? palette.cream : palette.mint,
              boxShadow: i === 1 ? '10px 10px 0 rgba(255,61,139,0.22)' : 'none',
            }}
          >
            <div
              style={{
                color: palette.black,
                fontSize: 38,
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: '-0.28px',
              }}
            >
              {count}
            </div>
            <div>
              <div style={{ color: palette.text, fontSize: 50, lineHeight: 1.08, fontWeight: 600, letterSpacing: '-0.28px', marginBottom: 14 }}>
                {title}
              </div>
              <div style={{ color: palette.muted, fontSize: 31, lineHeight: 1.47, fontWeight: 400 }}>
                {text}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </PageShell>
);

const FullContextCaptain: Page = () => (
  <PageShell section="Full context" accent={palette.primary} mode="dark">
    <div
      style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '0.9fr 1.1fr',
        gap: 26,
        minHeight: 0,
      }}
    >
      <div
        style={{
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 30,
          padding: '62px 58px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 0,
          background: 'rgba(255,255,255,0.05)',
        }}
      >
        <div>
          <div
            className="story-fadeup"
            style={{
              color: palette.primary,
              fontSize: 22,
              lineHeight: 1.2,
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 28,
            }}
          >
            分工之後，責任沒有消失
          </div>
          <HugeTitle size={72} maxWidth={760} animationClass="story-fade">
            隊長不是什麼都做，但要知道全部的東西。
          </HugeTitle>
          <p
            className="story-fadeup"
            style={{
              animationDelay: '120ms',
              color: 'rgba(255,255,255,0.72)',
              fontSize: 31,
              lineHeight: 1.48,
              fontWeight: 430,
              margin: '44px 0 0',
              maxWidth: 700,
            }}
          >
            每一塊不一定都自己做，但每一塊都要知道現在到哪、哪裡會掉、掉了誰補。
          </p>
        </div>
        <div
          className="story-fadeup"
          style={{
            animationDelay: '320ms',
            borderRadius: 24,
            background: palette.lime,
            color: palette.black,
            padding: '26px 30px',
            fontSize: 33,
            lineHeight: 1.36,
            fontWeight: 760,
            letterSpacing: '-0.28px',
          }}
        >
          不是每件事都自己做，但每件事都不能完全不知道。
        </div>
      </div>

      <div
        className="story-fadeup"
        style={{
          animationDelay: '160ms',
          display: 'grid',
          gridTemplateRows: 'repeat(3, minmax(0, 1fr))',
          gap: 18,
          minHeight: 0,
        }}
      >
        {[
          ['01', '知道目標', '這件事最後要去哪，完成標準是什麼。'],
          ['02', '知道進度', '誰做到哪、哪裡卡住、現在缺什麼。'],
          ['03', '知道風險', '哪一塊掉了會影響全局、誰能補位。'],
        ].map(([count, title, text], i) => (
          <div
            key={title}
            className="story-fadeup"
            style={{
              animationDelay: `${200 + i * 100}ms`,
              padding: '36px 44px',
              borderRadius: 28,
              border: `2px solid ${palette.black}`,
              background: i === 0 ? palette.pink : i === 1 ? palette.lilac : palette.cream,
              display: 'grid',
              gridTemplateColumns: '92px 1fr',
              gap: 28,
              alignItems: 'center',
              minHeight: 0,
            }}
          >
            <div style={{ color: palette.black, fontSize: 34, lineHeight: 1, fontWeight: 900 }}>{count}</div>
            <div>
              <div style={{ color: palette.black, fontSize: 46, lineHeight: 1.1, fontWeight: 760, letterSpacing: '-0.28px', marginBottom: 14 }}>
                {title}
              </div>
              <div style={{ color: palette.muted, fontSize: 29, lineHeight: 1.47, fontWeight: 520 }}>{text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </PageShell>
);

const MessyMiddle: Page = () => (
  <PageShell section="The messy middle" accent={palette.primary}>
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '0.78fr 1.22fr', gap: 42, alignItems: 'stretch', minHeight: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 0 }}>
        <div>
          <div
            className="story-fadeup"
            style={{
              color: palette.primary,
              fontSize: 22,
              lineHeight: 1.2,
              fontWeight: 850,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 30,
            }}
          >
            我沒有突然變穩
          </div>
          <h1
            className="story-fadeup"
            style={{
              fontFamily: 'var(--osd-font-display)',
              color: palette.black,
              fontSize: 66,
              lineHeight: 1.04,
              letterSpacing: -1,
              fontWeight: 760,
              margin: 0,
              maxWidth: 700,
            }}
          >
            中間最真實的
            <br />
            部分，是我也
            <br />
            常常做不好。
          </h1>
        </div>
        <p
          className="story-fadeup"
          style={{
            animationDelay: '140ms',
            color: palette.muted,
            fontSize: 32,
            lineHeight: 1.48,
            margin: '42px 0 0',
            maxWidth: 720,
          }}
        >
          開始負責之後，我才發現「知道全局」不代表每件事都能順利。更多時候，是一邊卡住，一邊把事情重新接起來。
        </p>
        <div
          className="story-fadeup"
          style={{
            animationDelay: '260ms',
            borderRadius: 26,
            background: palette.black,
            color: '#fff',
            padding: '28px 32px',
            fontSize: 31,
            lineHeight: 1.36,
            fontWeight: 760,
            boxShadow: '10px 10px 0 rgba(255,61,139,0.22)',
          }}
        >
          這段不是成長蒙太奇，比較像一張還沒整理好的工作桌面。
        </div>
      </div>

      <div
        className="story-fadeup"
        style={{
          animationDelay: '120ms',
          position: 'relative',
          minHeight: 0,
          borderRadius: 36,
          border: `2px solid ${palette.black}`,
          background:
            'radial-gradient(circle at 16px 16px, rgba(0,0,0,0.08) 1.5px, transparent 1.5px), #f7f7f5',
          backgroundSize: '34px 34px',
          overflow: 'hidden',
          boxShadow: '16px 16px 0 rgba(0,0,0,0.1)',
        }}
      >
        <svg
          aria-hidden
          viewBox="0 0 980 620"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          <path
            d="M168 188 C 310 118, 448 194, 580 142 S 794 92, 846 214"
            fill="none"
            stroke={palette.primary}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="14 14"
            opacity="0.72"
          />
          <path
            d="M248 472 C 350 392, 500 480, 638 386 C 724 328, 782 358, 834 430"
            fill="none"
            stroke={palette.black}
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.36"
          />
          <ellipse cx="370" cy="250" rx="126" ry="48" fill="none" stroke={palette.primary} strokeWidth="4" opacity="0.62" transform="rotate(-8 370 250)" />
          <path d="M810 252 l28 20 l-32 14" fill="none" stroke={palette.black} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
        </svg>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '260ms',
            position: 'absolute',
            left: 56,
            top: 58,
            width: 360,
            transform: 'rotate(-4deg)',
            border: `2px solid ${palette.black}`,
            borderRadius: 28,
            background: palette.cream,
            padding: '34px 34px 38px',
            boxShadow: '10px 12px 0 rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ color: palette.primary, fontSize: 18, fontWeight: 900, letterSpacing: '0.06em', marginBottom: 18 }}>STUCK / 01</div>
          <div style={{ color: palette.black, fontSize: 55, lineHeight: 1, fontWeight: 900, marginBottom: 20 }}>卡住</div>
          <div style={{ color: palette.muted, fontSize: 25, lineHeight: 1.36, fontWeight: 560 }}>不是努力一天就會變好，更多時候是先承認自己還不會。</div>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '360ms',
            position: 'absolute',
            right: 64,
            top: 84,
            width: 330,
            transform: 'rotate(5deg)',
            border: `2px solid ${palette.black}`,
            borderRadius: 999,
            background: palette.pink,
            padding: '22px 30px',
            color: palette.black,
            fontSize: 27,
            lineHeight: 1.28,
            fontWeight: 820,
            textAlign: 'center',
          }}
        >
          不是我不努力，是我還不知道怎麼推。
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '440ms',
            position: 'absolute',
            right: 92,
            top: 238,
            width: 390,
            transform: 'rotate(-2deg)',
            border: `2px solid ${palette.black}`,
            borderRadius: 30,
            background: palette.lilac,
            padding: '32px 34px',
          }}
        >
          <div style={{ color: palette.black, fontSize: 46, lineHeight: 1, fontWeight: 900, marginBottom: 16 }}>比較</div>
          <div style={{ color: palette.muted, fontSize: 25, lineHeight: 1.36, fontWeight: 560 }}>看到別人跑很快，會懷疑自己是不是太慢。</div>
          <div style={{ marginTop: 20, display: 'inline-flex', borderRadius: 999, background: palette.black, color: '#fff', padding: '9px 15px', fontSize: 17, fontWeight: 850 }}>
            comment: 看自己的進度
          </div>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '540ms',
            position: 'absolute',
            left: 118,
            bottom: 78,
            width: 390,
            transform: 'rotate(3deg)',
            border: `2px solid ${palette.black}`,
            borderRadius: 30,
            background: palette.lime,
            padding: '34px 36px',
            boxShadow: '12px 12px 0 rgba(255,61,139,0.18)',
            zIndex: 1,
          }}
        >
          <div style={{ color: palette.black, fontSize: 52, lineHeight: 1, fontWeight: 900, marginBottom: 16 }}>重來</div>
          <div style={{ color: palette.muted, fontSize: 26, lineHeight: 1.34, fontWeight: 560 }}>重來不等於前面都白費，而是把走錯的地方拿回來用。</div>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '650ms',
            position: 'absolute',
            right: 68,
            bottom: 84,
            width: 316,
            borderRadius: 22,
            background: palette.black,
            color: '#fff',
            padding: '24px 28px',
            fontSize: 26,
            lineHeight: 1.32,
            fontWeight: 780,
            transform: 'rotate(-1deg)',
            zIndex: 2,
          }}
        >
          把亂掉的地方，重新接起來。
        </div>

        <div
          className="story-fade"
          style={{
            position: 'absolute',
            left: 52,
            bottom: 30,
            color: palette.faint,
            fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
            fontSize: 15,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          messy canvas / not a success montage
        </div>
      </div>
    </div>
  </PageShell>
);

const CompetitionLowPoint: Page = () => (
  <PageShell section="Low point" accent={palette.primary} mode="dark">
    <div
      style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '0.96fr 1.04fr',
        gap: 46,
        alignItems: 'stretch',
        minHeight: 0,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 0 }}>
        <div>
          <div
            className="story-fadeup"
            style={{
              color: palette.primary,
              fontSize: 22,
              lineHeight: 1.2,
              fontWeight: 850,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: 30,
            }}
          >
            比賽低谷期
          </div>
          <h1
            className="story-fadeup"
            style={{
              fontFamily: 'var(--osd-font-display)',
              color: '#fff',
              fontSize: 76,
              lineHeight: 1.02,
              letterSpacing: -1.1,
              fontWeight: 760,
              margin: 0,
              maxWidth: 820,
            }}
          >
            我開始帶隊後，
            <br />
            反而連續兩場
            <br />
            都沒有得獎。
          </h1>
        </div>
        <div
          className="story-fadeup"
          style={{
            animationDelay: '200ms',
            borderLeft: `6px solid ${palette.primary}`,
            paddingLeft: 28,
            color: 'rgba(255,255,255,0.72)',
            fontSize: 33,
            lineHeight: 1.42,
            fontWeight: 520,
            maxWidth: 780,
          }}
        >
          而且不是差一點，是連決賽都沒有入圍。那時候我第一次很直接地懷疑：是不是我帶隊，反而讓大家走錯方向？
        </div>
      </div>

      <div
        className="story-fadeup"
        style={{
          animationDelay: '120ms',
          position: 'relative',
          minHeight: 0,
          borderRadius: 34,
          border: '1px solid rgba(255,255,255,0.16)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.025))',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.055) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            opacity: 0.7,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: -80,
            top: 70,
            width: 320,
            height: 190,
            borderRadius: 42,
            background: palette.lilac,
            opacity: 0.14,
            transform: 'rotate(-9deg)',
          }}
        />

        <div
          className="story-fadeup"
          style={{
            animationDelay: '260ms',
            position: 'absolute',
            left: 72,
            top: 80,
            width: 560,
            minHeight: 210,
            borderRadius: 28,
            border: `2px solid ${palette.black}`,
            background: '#fff',
            color: palette.black,
            padding: '34px 38px',
            transform: 'rotate(-3deg)',
            boxShadow: '14px 16px 0 rgba(255,61,139,0.25)',
          }}
        >
          <div style={{ color: palette.primary, fontSize: 18, fontWeight: 900, letterSpacing: '0.06em', marginBottom: 22 }}>
            RESULT / TEAM LEAD 01
          </div>
          <div style={{ fontSize: 58, lineHeight: 1, fontWeight: 930, marginBottom: 20 }}>未入圍決賽</div>
          <div style={{ color: palette.muted, fontSize: 27, lineHeight: 1.36, fontWeight: 560 }}>
            第一次真正站到前面，結果沒有像想像中往前。
          </div>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '380ms',
            position: 'absolute',
            right: 68,
            bottom: 116,
            width: 560,
            minHeight: 210,
            borderRadius: 28,
            border: `2px solid ${palette.black}`,
            background: palette.cream,
            color: palette.black,
            padding: '34px 38px',
            transform: 'rotate(3deg)',
            boxShadow: '14px 16px 0 rgba(220,238,177,0.2)',
          }}
        >
          <div style={{ color: palette.primary, fontSize: 18, fontWeight: 900, letterSpacing: '0.06em', marginBottom: 22 }}>
            RESULT / TEAM LEAD 02
          </div>
          <div style={{ fontSize: 58, lineHeight: 1, fontWeight: 930, marginBottom: 20 }}>還是沒有得獎</div>
          <div style={{ color: palette.muted, fontSize: 27, lineHeight: 1.36, fontWeight: 560 }}>
            連續兩場都沒有結果，壓力開始變成很真實的重量。
          </div>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '520ms',
            position: 'absolute',
            left: 96,
            bottom: 76,
            borderRadius: 999,
            background: palette.primary,
            color: '#fff',
            padding: '18px 28px',
            fontSize: 28,
            lineHeight: 1,
            fontWeight: 900,
            transform: 'rotate(-2deg)',
          }}
        >
          不是冠軍之後就一路順風。
        </div>
      </div>
    </div>
  </PageShell>
);

const KeepLearning: Page = () => (
  <PageShell section="Keep going" accent={palette.lime}>
    <div
      style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '0.92fr 1.08fr',
        gap: 42,
        alignItems: 'stretch',
        minHeight: 0,
      }}
    >
      <div
        className="story-fadeup"
        style={{
          borderRadius: 34,
          border: `2px solid ${palette.black}`,
          background: palette.lime,
          padding: '58px 56px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: 0,
          boxShadow: '14px 14px 0 rgba(0,0,0,0.12)',
        }}
      >
        <div>
          <div
            style={{
              color: palette.black,
              fontSize: 22,
              lineHeight: 1.2,
              fontWeight: 850,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: 30,
            }}
          >
            但我沒有停下來
          </div>
          <h1
            style={{
              fontFamily: 'var(--osd-font-display)',
              color: palette.black,
              fontSize: 82,
              lineHeight: 1.02,
              letterSpacing: -1,
              fontWeight: 760,
              margin: 0,
              maxWidth: 780,
            }}
          >
            我還是
            <br />
            持續地
            <br />
            去努力。
          </h1>
        </div>
        <div style={{ color: palette.muted, fontSize: 32, lineHeight: 1.42, fontWeight: 560 }}>
          因為在過程中，我一直不停學到新的東西、新的想法。
        </div>
      </div>

      <div
        className="story-fadeup"
        style={{
          animationDelay: '120ms',
          position: 'relative',
          borderRadius: 34,
          border: `2px solid ${palette.black}`,
          background: '#fff',
          overflow: 'hidden',
          minHeight: 0,
          padding: '54px 58px',
        }}
      >
        <svg
          aria-hidden
          viewBox="0 0 900 620"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          <path
            d="M100 470 C 220 404, 236 280, 364 278 C 504 276, 532 168, 704 132"
            fill="none"
            stroke={palette.black}
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M695 112 l44 16 l-34 34"
            fill="none"
            stroke={palette.black}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
          />
        </svg>

        {[
          { title: '新的東西', text: '每一次準備，都讓我補上一塊以前不懂的能力。', bg: palette.cream, left: 70, top: 86, rotate: -4 },
          { title: '新的想法', text: '看到不同做法後，我開始知道還能怎麼改。', bg: palette.lilac, left: 330, top: 246, rotate: 3 },
          { title: '做得到', text: '我想把學到的東西展現出來，讓大家知道我做得到。', bg: palette.pink, left: 180, top: 412, rotate: -2 },
        ].map(({ title, text, bg, left, top, rotate }, i) => (
          <div
            key={title}
            className="story-fadeup"
            style={{
              animationDelay: `${240 + i * 130}ms`,
              position: 'absolute',
              left,
              top,
              width: i === 2 ? 520 : 390,
              borderRadius: 28,
              border: `2px solid ${palette.black}`,
              background: bg,
              padding: '30px 34px',
              transform: `rotate(${rotate}deg)`,
              boxShadow: i === 2 ? '12px 12px 0 rgba(255,61,139,0.18)' : '8px 10px 0 rgba(0,0,0,0.08)',
            }}
          >
            <div style={{ color: palette.black, fontSize: i === 2 ? 48 : 42, lineHeight: 1, fontWeight: 930, marginBottom: 16 }}>
              {title}
            </div>
            <div style={{ color: palette.muted, fontSize: i === 2 ? 28 : 25, lineHeight: 1.36, fontWeight: 560 }}>
              {text}
            </div>
          </div>
        ))}

        <div
          className="story-fadeup"
          style={{
            animationDelay: '680ms',
            position: 'absolute',
            right: 58,
            bottom: 62,
            borderRadius: 999,
            background: palette.black,
            color: '#fff',
            padding: '19px 30px',
            fontSize: 31,
            lineHeight: 1,
            fontWeight: 900,
          }}
        >
          我想讓大家知道：我做得到。
        </div>
      </div>
    </div>
  </PageShell>
);

const MaicDecision: Page = () => (
  <PageShell section="MAIC" accent={palette.primary}>
    <div
      style={{
        flex: 1,
        position: 'relative',
        minHeight: 0,
      }}
    >
      <div
        className="story-fadeup"
        style={{
          position: 'absolute',
          inset: '26px 96px 34px',
          borderRadius: 38,
          border: `2px solid ${palette.black}`,
          background:
            'radial-gradient(circle at 18px 18px, rgba(0,0,0,0.08) 1.5px, transparent 1.5px), #fff',
          backgroundSize: '36px 36px',
          overflow: 'hidden',
          boxShadow: '16px 16px 0 rgba(255,61,139,0.18)',
        }}
      >
        <div
          style={{
            height: 74,
            borderBottom: `2px solid ${palette.black}`,
            background: palette.black,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 30px',
            fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
            fontSize: 18,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontWeight: 800,
          }}
        >
          <span>MAIC / 新團隊</span>
          <span style={{ color: palette.lime }}>不是等安排，是自己開口</span>
        </div>

        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 78,
            top: 128,
            width: 190,
            height: 190,
            borderRadius: '50%',
            background: palette.lilac,
            border: `2px solid ${palette.black}`,
            display: 'grid',
            placeItems: 'center',
            transform: 'rotate(-6deg)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: 82,
            bottom: 72,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: palette.lime,
            border: `2px solid ${palette.black}`,
            transform: 'rotate(8deg)',
          }}
        />

        <div
          className="story-fadeup"
          style={{
            animationDelay: '120ms',
            position: 'absolute',
            left: 96,
            top: 164,
            width: 500,
            borderRadius: '34px 34px 34px 8px',
            border: `2px solid ${palette.black}`,
            background: palette.cream,
            color: palette.black,
            padding: '30px 34px',
            boxShadow: '10px 10px 0 rgba(0,0,0,0.12)',
          }}
        >
          <div style={{ color: palette.primary, fontSize: 18, fontWeight: 900, letterSpacing: '0.06em', marginBottom: 16 }}>
            後來，我換了一個新團隊。
          </div>
          <div style={{ fontSize: 42, lineHeight: 1.18, fontWeight: 850 }}>
            這次要怎麼分工？
          </div>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '260ms',
            position: 'absolute',
            right: 108,
            top: 246,
            width: 610,
            borderRadius: '42px 42px 8px 42px',
            border: `2px solid ${palette.black}`,
            background: palette.black,
            color: '#fff',
            padding: '36px 42px',
            boxShadow: '12px 12px 0 rgba(197,176,244,0.32)',
          }}
        >
          <div style={{ color: palette.lime, fontSize: 20, fontWeight: 900, letterSpacing: '0.06em', marginBottom: 18 }}>
            我主動跟學長說
          </div>
          <div style={{ fontSize: 68, lineHeight: 1.02, fontWeight: 930, letterSpacing: -0.6 }}>
            我想當隊長。
          </div>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '420ms',
            position: 'absolute',
            left: 176,
            bottom: 126,
            width: 700,
            borderRadius: '42px 42px 42px 8px',
            border: `2px solid ${palette.black}`,
            background: palette.lime,
            color: palette.black,
            padding: '36px 42px',
            transform: 'rotate(-1deg)',
            boxShadow: '12px 12px 0 rgba(255,61,139,0.2)',
          }}
        >
          <div style={{ color: palette.primary, fontSize: 20, fontWeight: 900, letterSpacing: '0.06em', marginBottom: 18 }}>
            我又補了一句
          </div>
          <div style={{ fontSize: 58, lineHeight: 1.08, fontWeight: 930, letterSpacing: -0.4 }}>
            這次讓我來寫程式，
            <br />
            我想試試看。
          </div>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '580ms',
            position: 'absolute',
            right: 134,
            top: 128,
            width: 380,
            borderRadius: 999,
            border: `2px solid ${palette.black}`,
            background: palette.pink,
            color: palette.black,
            padding: '20px 28px',
            fontSize: 26,
            lineHeight: 1.28,
            fontWeight: 820,
            textAlign: 'center',
            transform: 'rotate(4deg)',
          }}
        >
          不是突然有把握，是想真的拿出來用。
        </div>
      </div>

      <h1
        className="story-fadeup"
        style={{
          animationDelay: '80ms',
          position: 'absolute',
          left: 0,
          bottom: 24,
          fontFamily: 'var(--osd-font-display)',
          color: palette.black,
          fontSize: 54,
          lineHeight: 1,
          fontWeight: 760,
          letterSpacing: -0.8,
          margin: 0,
        }}
      >
        主動請纓的那一刻。
      </h1>
    </div>
  </PageShell>
);

const MeetingCadence: Page = () => (
  <PageShell section="Cadence" accent={palette.lime}>
    <div
      style={{
        flex: 1,
        position: 'relative',
        minHeight: 0,
      }}
    >
      <div
        className="story-fadeup"
        style={{
          position: 'absolute',
          inset: '18px 0 0',
          borderRadius: 38,
          border: `2px solid ${palette.black}`,
          background: palette.surfaceStrong,
          overflow: 'hidden',
          boxShadow: '16px 16px 0 rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            height: 88,
            background: palette.black,
            color: '#fff',
            borderBottom: `2px solid ${palette.black}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 36px',
            fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
            fontSize: 18,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontWeight: 850,
          }}
        >
          <span>MAIC / meeting cadence</span>
          <span style={{ color: palette.lime }}>every 1-2 days</span>
        </div>

        <div
          style={{
            position: 'absolute',
            left: 42,
            right: 42,
            top: 132,
            bottom: 42,
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gridTemplateRows: 'repeat(4, 1fr)',
            borderLeft: `1px solid ${palette.line}`,
            borderTop: `1px solid ${palette.line}`,
          }}
        >
          {Array.from({ length: 28 }).map((_, i) => {
            const marked = [1, 3, 6, 8, 10, 13, 15, 17, 20, 22, 24, 27].includes(i);
            return (
              <div
                key={i}
                style={{
                  borderRight: `1px solid ${palette.line}`,
                  borderBottom: `1px solid ${palette.line}`,
                  background: marked ? 'rgba(220,238,177,0.44)' : 'rgba(255,255,255,0.58)',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: 12,
                    color: marked ? palette.black : palette.faint,
                    fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
                    fontSize: 15,
                    fontWeight: 800,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </div>
                {marked ? (
                  <div
                    className="story-fadeup"
                    style={{
                      animationDelay: `${120 + i * 18}ms`,
                      position: 'absolute',
                      left: 16,
                      right: 16,
                      bottom: 14,
                      borderRadius: 999,
                      background: i % 3 === 0 ? palette.primary : palette.black,
                      color: '#fff',
                      padding: '9px 10px',
                      textAlign: 'center',
                      fontSize: 15,
                      lineHeight: 1,
                      fontWeight: 900,
                    }}
                  >
                    meeting
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '220ms',
            position: 'absolute',
            left: 78,
            top: 150,
            width: 660,
            borderRadius: 36,
            border: `2px solid ${palette.black}`,
            background: palette.cream,
            padding: '34px 40px',
            boxShadow: '14px 14px 0 rgba(255,61,139,0.22)',
            transform: 'rotate(-2deg)',
          }}
        >
          <div style={{ color: palette.primary, fontSize: 20, fontWeight: 900, letterSpacing: '0.06em', marginBottom: 18 }}>
            我跟學長姐說
          </div>
          <div style={{ color: palette.black, fontSize: 62, lineHeight: 1.04, fontWeight: 930, letterSpacing: -0.8 }}>
            我們可以每 1-2 天
            <br />
            就開一次會嗎？
          </div>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '330ms',
            position: 'absolute',
            right: 76,
            top: 128,
            width: 650,
            height: 360,
            borderRadius: 30,
            border: `2px solid ${palette.black}`,
            background: '#fff',
            padding: 12,
            transform: 'rotate(2deg)',
            boxShadow: '14px 14px 0 rgba(197,176,244,0.36)',
          }}
        >
          <img
            src={maicDiscussionWhiteboard}
            alt="MAIC 團隊討論時白板上的流程草圖"
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 20,
              objectFit: 'cover',
              objectPosition: 'center 52%',
              display: 'block',
              filter: 'contrast(1.03) saturate(0.9)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 28,
              top: 28,
              borderRadius: 999,
              background: palette.black,
              color: '#fff',
              padding: '10px 16px',
              fontSize: 17,
              lineHeight: 1,
              fontWeight: 900,
              letterSpacing: '0.03em',
            }}
          >
            討論現場
          </div>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '470ms',
            position: 'absolute',
            right: 92,
            bottom: 64,
            width: 620,
            borderRadius: 34,
            border: `2px solid ${palette.black}`,
            background: palette.black,
            color: '#fff',
            padding: '32px 38px',
            boxShadow: '12px 12px 0 rgba(197,176,244,0.32)',
          }}
        >
          <div style={{ color: palette.lime, fontSize: 22, fontWeight: 900, letterSpacing: '0.05em', marginBottom: 18 }}>
            我當時的想法
          </div>
          <div style={{ fontSize: 42, lineHeight: 1.16, fontWeight: 860 }}>
            會得獎的作品，肯定要付出極大的努力。
          </div>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '560ms',
            position: 'absolute',
            left: 86,
            bottom: 74,
            width: 420,
            borderRadius: 999,
            background: palette.lilac,
            border: `2px solid ${palette.black}`,
            color: palette.black,
            padding: '20px 30px',
            fontSize: 28,
            lineHeight: 1.2,
            fontWeight: 850,
            textAlign: 'center',
            transform: 'rotate(3deg)',
          }}
        >
          把努力變成固定節奏。
        </div>
      </div>
    </div>
  </PageShell>
);

const activityPhotoCards = [
  {
    src: competitionActivity03,
    alt: '設計思考活動現場，講者正在介紹雙鑽流程',
    objectPosition: 'center 46%',
    style: { left: 414, top: 38, width: 474, height: 224 },
  },
  {
    src: competitionActivity02,
    alt: 'Today at Apple 的 Swift 活動看板與討論人群',
    objectPosition: 'center 56%',
    style: { left: 916, top: 38, width: 474, height: 224 },
  },
  {
    src: competitionActivity01,
    alt: '比賽相關講座現場，投影片上寫著真實感的計畫書',
    objectPosition: 'center 44%',
    style: { left: 414, top: 286, width: 474, height: 224 },
  },
  {
    src: competitionActivity04,
    alt: 'iCHEF 團隊組成與完整工程團隊支援簡報',
    objectPosition: 'center 47%',
    style: { left: 916, top: 286, width: 474, height: 224 },
  },
  {
    src: competitionActivity05,
    alt: 'Apple 平台進階技術簡報，內容包含 Vision、Speech、Natural Language',
    style: { left: 414, top: 534, width: 474, height: 224 },
  },
  {
    src: competitionActivity06,
    alt: '故事重要元素簡報，包含 Set-up、Conflict、Resolution',
    objectPosition: 'center 42%',
    style: { left: 916, top: 534, width: 474, height: 224 },
  },
] as const;

const ActivityHunt: Page = () => (
  <PageShell section="Activity hunt" accent={palette.primary} mode="dark">
    <div
      style={{
        flex: 1,
        position: 'relative',
        minHeight: 0,
        marginTop: 24,
      }}
    >
      <div
        className="story-fadeup"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 38,
          border: '2px solid rgba(255,255,255,0.82)',
          background:
            'radial-gradient(circle at 24px 24px, rgba(255,255,255,0.15) 1.8px, transparent 1.8px), linear-gradient(135deg, #0c0c0f 0%, #181820 58%, #0f0f12 100%)',
          backgroundSize: '42px 42px, 100% 100%',
          overflow: 'hidden',
          boxShadow: '18px 18px 0 rgba(255,61,139,0.24)',
        }}
      >
        <svg
          aria-hidden
          viewBox="0 0 1608 800"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            color: palette.lime,
            opacity: 0.22,
          }}
        >
          <path
            className="story-route"
            d="M-40 688 C 36 624, 114 596, 202 618"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <path
            className="story-route"
            d="M1468 146 C 1418 194, 1376 252, 1338 326"
            fill="none"
            stroke={palette.primary}
            strokeLinecap="round"
            strokeWidth="3"
            style={{ animationDelay: '360ms' }}
          />
        </svg>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '120ms',
            position: 'absolute',
            left: 46,
            top: 86,
            width: 318,
            borderRadius: 28,
            border: `2px solid ${palette.black}`,
            background: palette.cream,
            color: palette.black,
            padding: '24px 26px 24px',
            transform: 'rotate(-0.6deg)',
            boxShadow: '8px 8px 0 rgba(220,238,177,0.72)',
            zIndex: 5,
          }}
        >
          <div style={{ color: palette.primary, fontSize: 17, fontWeight: 950, letterSpacing: '0.06em', marginBottom: 14 }}>
            我開始瘋狂參與活動
          </div>
          <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 46, lineHeight: 1.03, fontWeight: 920, letterSpacing: -0.4 }}>
            只要跟比賽有關，
            <br />
            我就去。
          </div>
          <div style={{ marginTop: 16, color: palette.muted, fontSize: 20, lineHeight: 1.34, fontWeight: 560 }}>
            講座、工作坊、分享、團隊討論，只要能讓我離比賽更近一點，我都想去看、去聽、去學。
          </div>
          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: `2px solid rgba(0,0,0,0.1)`,
              display: 'grid',
              gap: 6,
            }}
          >
            <div style={{ color: palette.primary, fontSize: 18, lineHeight: 1.2, fontWeight: 900 }}>有關就去，去了就學。</div>
            <div style={{ color: palette.black, fontSize: 17, lineHeight: 1.28, fontWeight: 760 }}>
              不是刷履歷，是把自己丟進更多方法裡。
            </div>
          </div>
        </div>

        {activityPhotoCards.map(({ src, alt, style, objectPosition }, i) => (
          <div
            key={alt}
            className="story-fadeup"
            style={{
              animationDelay: `${220 + i * 70}ms`,
              position: 'absolute',
              borderRadius: 18,
              border: `2px solid ${palette.black}`,
              background: '#fff',
              padding: 4,
              boxShadow: i % 2 === 0 ? '7px 7px 0 rgba(255,255,255,0.13)' : '7px 7px 0 rgba(255,61,139,0.17)',
              zIndex: 3,
              ...style,
            }}
          >
            <img
              src={src}
              alt={alt}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 12,
                objectFit: 'cover',
                objectPosition: objectPosition ?? 'center',
                display: 'block',
                filter: 'contrast(1.05) saturate(0.92)',
              }}
            />
          </div>
        ))}

      </div>
    </div>
  </PageShell>
);

const FirstTimeAbroad: Page = () => (
  <PageShell section="First abroad" accent={palette.lime} showHeader={false} mode="dark">
    <div
      style={{
        flex: 1,
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        position: 'relative',
      }}
    >
      <div
        aria-hidden
        className="story-fade"
        style={{
          position: 'absolute',
          width: 900,
          height: 520,
          borderRadius: 80,
          background: 'linear-gradient(135deg, rgba(220,238,177,0.2), rgba(255,61,139,0.14))',
          transform: 'rotate(-4deg)',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <HugeTitle size={138} maxWidth={1380} fontWeight={920}>
          這是我第一次出國。
        </HugeTitle>
      </div>
    </div>
  </PageShell>
);

const SummerScheduleClash: Page = () => (
  <PageShell section="Summer clash" accent={palette.gold} showHeader={false} mode="dark">
    <div
      style={{
        flex: 1,
        position: 'relative',
        minHeight: 0,
        marginTop: 12,
      }}
    >
      <div
        className="story-fadeup"
        style={{
          position: 'absolute',
          inset: '0 0 10px',
          borderRadius: 42,
          border: '2px solid rgba(255,255,255,0.78)',
          background: palette.black,
          overflow: 'hidden',
          boxShadow: '18px 18px 0 rgba(244,236,214,0.22)',
        }}
      >
        <img
          src={shanghaiLuggagePhoto}
          alt="準備出發到上海參加競賽時的行李"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 52%',
            display: 'block',
            filter: 'saturate(0.9) contrast(1.08)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.62) 39%, rgba(0,0,0,0.18) 72%, rgba(0,0,0,0.48) 100%)',
          }}
        />

        <div
          className="story-fadeup"
          style={{
            animationDelay: '120ms',
            position: 'absolute',
            left: 58,
            top: 58,
            display: 'flex',
            gap: 14,
            alignItems: 'center',
            fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
            fontSize: 18,
            lineHeight: 1,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 900,
          }}
        >
          <span style={{ color: palette.gold }}>2024 summer</span>
          <span style={{ color: 'rgba(255,255,255,0.42)' }}>/</span>
          <span style={{ color: palette.lime }}>two contests, same week</span>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '220ms',
            position: 'absolute',
            left: 58,
            bottom: 70,
            width: 760,
            color: '#fff',
          }}
        >
          <h1
            style={{
              fontFamily: 'var(--osd-font-display)',
              fontSize: 78,
              lineHeight: 1.02,
              letterSpacing: -1.2,
              fontWeight: 930,
              margin: 0,
              textShadow: '0 18px 54px rgba(0,0,0,0.5)',
            }}
          >
            那年暑假，
            <br />
            兩場競賽直接撞期。
          </h1>
          <div
            style={{
              marginTop: 28,
              color: 'rgba(255,255,255,0.78)',
              fontSize: 31,
              lineHeight: 1.38,
              fontWeight: 560,
              maxWidth: 720,
            }}
          >
            MAIC 行動應用創新賽和海峽兩岸青少年創客大賽時間衝突。同學已經飛到上海，而我晚了幾天，只有同隊的夥伴跟我一起飛。
          </div>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '360ms',
            position: 'absolute',
            right: 72,
            top: 80,
            width: 480,
            borderRadius: 34,
            border: `2px solid ${palette.black}`,
            background: palette.cream,
            color: palette.black,
            padding: '36px 38px',
            transform: 'rotate(2deg)',
            boxShadow: '14px 14px 0 rgba(255,61,139,0.32)',
          }}
        >
          <div
            style={{
              color: palette.primary,
              fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
              fontSize: 17,
              lineHeight: 1,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 950,
              marginBottom: 26,
            }}
          >
            schedule collision
          </div>
          <div style={{ display: 'grid', gap: 22 }}>
            {[
              ['MAIC', '先完成行動應用創新賽'],
              ['上海', '晚幾天接上創客大賽'],
              ['同行', '只剩同隊夥伴一起飛'],
            ].map(([label, text], i) => (
              <div key={label} style={{ display: 'grid', gridTemplateColumns: '96px 1fr', gap: 18, alignItems: 'center' }}>
                <div
                  style={{
                    width: 82,
                    height: 82,
                    borderRadius: '50%',
                    background: i === 1 ? palette.lime : i === 2 ? palette.lilac : palette.primary,
                    color: i === 0 ? '#fff' : palette.black,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 22,
                    fontWeight: 950,
                  }}
                >
                  {label}
                </div>
                <div style={{ color: palette.black, fontSize: 28, lineHeight: 1.25, fontWeight: 840 }}>{text}</div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '560ms',
            position: 'absolute',
            right: 118,
            bottom: 86,
            borderRadius: 999,
            border: `2px solid ${palette.black}`,
            background: palette.black,
            color: '#fff',
            padding: '20px 30px',
            fontSize: 31,
            lineHeight: 1,
            fontWeight: 950,
            boxShadow: '10px 10px 0 rgba(220,238,177,0.36)',
          }}
        >
          行李一拉，就接下一場。
        </div>
      </div>
    </div>
  </PageShell>
);

const AbroadWithFriends: Page = () => (
  <PageShell section="Travel mood" accent={palette.lilac} showHeader={false} mode="dark">
    <div
      style={{
        flex: 1,
        position: 'relative',
        minHeight: 0,
        marginTop: 10,
      }}
    >
      <div
        className="story-fadeup"
        style={{
          position: 'absolute',
          inset: '0 0 10px',
          borderRadius: 42,
          border: '2px solid rgba(255,255,255,0.78)',
          background:
            'radial-gradient(circle at 20% 18%, rgba(197,176,244,0.34), transparent 34%), linear-gradient(135deg, #08080a 0%, #16111e 48%, #2b120f 100%)',
          overflow: 'hidden',
          boxShadow: '18px 18px 0 rgba(255,61,139,0.22)',
        }}
      >
        <img
          src={shanghaiFunYuyuan}
          alt="上海豫園夜景"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            opacity: 0.72,
            filter: 'saturate(1.08) contrast(1.02)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.5) 36%, rgba(0,0,0,0.18) 62%, rgba(0,0,0,0.66) 100%)',
          }}
        />

        <div
          className="story-fadeup"
          style={{
            animationDelay: '120ms',
            position: 'absolute',
            left: 68,
            top: 72,
            width: 710,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              borderRadius: 999,
              border: '2px solid rgba(255,255,255,0.72)',
              background: 'rgba(8,8,10,0.62)',
              color: palette.lime,
              fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
              fontSize: 18,
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '14px 18px',
              marginBottom: 28,
              backdropFilter: 'blur(14px)',
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: palette.primary }} />
            Shanghai / after contest
          </div>
          <h1
            style={{
              fontFamily: 'var(--osd-font-display)',
              color: '#fff',
              fontSize: 82,
              lineHeight: 1.02,
              letterSpacing: -1.2,
              fontWeight: 930,
              margin: 0,
              textShadow: '0 18px 48px rgba(0,0,0,0.5)',
            }}
          >
            與其說是
            <br />
            出國競賽，
            <br />
            更像是跟同學
            <br />
            出國玩。
          </h1>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '260ms',
            position: 'absolute',
            left: 80,
            bottom: 76,
            width: 640,
            borderRadius: 30,
            border: '2px solid rgba(255,255,255,0.76)',
            background: 'rgba(8,8,10,0.7)',
            color: '#fff',
            padding: '26px 30px',
            boxShadow: '12px 12px 0 rgba(197,176,244,0.2)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div style={{ color: palette.lilac, fontSize: 19, fontWeight: 950, letterSpacing: '0.08em', marginBottom: 16 }}>
            TRAVEL LOG
          </div>
          <div style={{ fontSize: 34, lineHeight: 1.25, fontWeight: 820 }}>
            競賽壓力是真的，但第一次出國、第一次跟同學一起走在陌生城市，也是真的。
          </div>
        </div>

        {[
          {
            src: shanghaiFunSelfie,
            label: '同學合照',
            left: 910,
            top: 70,
            width: 500,
            height: 285,
            rotate: -3,
            delay: 340,
          },
          {
            src: shanghaiFunCityModel,
            label: '城市模型',
            left: 1116,
            top: 304,
            width: 330,
            height: 288,
            rotate: 4,
            delay: 430,
          },
          {
            src: shanghaiFunDrinks,
            label: '喜茶補給',
            left: 808,
            top: 392,
            width: 282,
            height: 374,
            rotate: -5,
            delay: 520,
          },
          {
            src: shanghaiFunHanfu,
            label: '亂入換裝',
            left: 1128,
            top: 614,
            width: 320,
            height: 238,
            rotate: -2,
            delay: 610,
          },
          {
            src: shanghaiFunCalligraphy,
            label: '路上的展覽',
            left: 778,
            top: 790,
            width: 350,
            height: 178,
            rotate: 3,
            delay: 700,
          },
        ].map(({ src, label, left, top, width, height, rotate, delay }) => (
          <figure
            key={label}
            className="story-fadeup"
            style={{
              animationDelay: `${delay}ms`,
              position: 'absolute',
              left,
              top,
              width,
              height,
              margin: 0,
              borderRadius: 26,
              border: '2px solid rgba(255,255,255,0.86)',
              background: '#fff',
              overflow: 'hidden',
              transform: `rotate(${rotate}deg)`,
              boxShadow: '0 26px 58px rgba(0,0,0,0.38)',
            }}
          >
            <img
              src={src}
              alt={label}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
              }}
            />
            <figcaption
              style={{
                position: 'absolute',
                left: 14,
                bottom: 14,
                borderRadius: 999,
                background: 'rgba(8,8,10,0.74)',
                color: '#fff',
                padding: '10px 15px',
                fontSize: 18,
                lineHeight: 1,
                fontWeight: 900,
                backdropFilter: 'blur(10px)',
              }}
            >
              {label}
            </figcaption>
          </figure>
        ))}

        <div
          className="story-fadeup"
          style={{
            animationDelay: '780ms',
            position: 'absolute',
            right: 78,
            bottom: 54,
            borderRadius: 999,
            border: `2px solid ${palette.black}`,
            background: palette.lime,
            color: palette.black,
            padding: '16px 24px',
            fontSize: 26,
            lineHeight: 1,
            fontWeight: 950,
            transform: 'rotate(3deg)',
            boxShadow: '8px 8px 0 rgba(255,255,255,0.22)',
          }}
        >
          比賽以外，也是青春的一部分。
        </div>
      </div>
    </div>
  </PageShell>
);

const EarlyGraduationTrip: Page = () => (
  <PageShell section="Graduation trip?" accent={palette.lime} showHeader={false} mode="dark">
    <div
      style={{
        flex: 1,
        position: 'relative',
        minHeight: 0,
        marginTop: 10,
      }}
    >
      <div
        className="story-fadeup"
        style={{
          position: 'absolute',
          inset: '0 0 10px',
          borderRadius: 42,
          border: '2px solid rgba(255,255,255,0.78)',
          background:
            'radial-gradient(circle at 16% 20%, rgba(220,238,177,0.28), transparent 30%), radial-gradient(circle at 86% 78%, rgba(255,61,139,0.22), transparent 28%), #08080a',
          overflow: 'hidden',
          boxShadow: '18px 18px 0 rgba(220,238,177,0.18)',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 28,
            borderRadius: 32,
            border: '1px solid rgba(255,255,255,0.14)',
          }}
        />

        <div
          className="story-fadeup"
          style={{
            animationDelay: '100ms',
            position: 'absolute',
            left: 68,
            top: 66,
            width: 700,
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              borderRadius: 999,
              border: '2px solid rgba(255,255,255,0.7)',
              background: 'rgba(255,255,255,0.08)',
              color: palette.lime,
              fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
              fontSize: 18,
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '14px 18px',
              marginBottom: 34,
              backdropFilter: 'blur(14px)',
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: palette.primary }} />
            freshman summer
          </div>
          <h1
            style={{
              fontFamily: 'var(--osd-font-display)',
              color: '#fff',
              fontSize: 78,
              lineHeight: 1.04,
              letterSpacing: -1.2,
              fontWeight: 930,
              margin: 0,
              textShadow: '0 18px 48px rgba(0,0,0,0.46)',
            }}
          >
            學長姐說，
            <br />
            畢業旅行要出國。
          </h1>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '240ms',
            position: 'absolute',
            left: 76,
            bottom: 72,
            width: 670,
            borderRadius: 30,
            border: '2px solid rgba(255,255,255,0.72)',
            background: 'rgba(8,8,10,0.72)',
            color: '#fff',
            padding: '30px 34px',
            boxShadow: '12px 12px 0 rgba(255,61,139,0.22)',
            backdropFilter: 'blur(16px)',
            zIndex: 2,
          }}
        >
          <div style={{ color: palette.lilac, fontSize: 20, fontWeight: 950, letterSpacing: '0.08em', marginBottom: 18 }}>
            PLOT TWIST
          </div>
          <div style={{ fontSize: 38, lineHeight: 1.26, fontWeight: 850 }}>
            而我們大一，就先體驗了一把別人所說的畢業旅行。
          </div>
        </div>

        {[
          {
            src: shanghaiGradTrip01,
            label: '城市夜景',
            left: 790,
            top: 62,
            width: 330,
            height: 580,
            rotate: -4,
            delay: 320,
          },
          {
            src: shanghaiGradTrip03,
            label: '旅程片段',
            left: 1112,
            top: 150,
            width: 300,
            height: 532,
            rotate: 3,
            delay: 430,
          },
          {
            src: shanghaiGradTrip02,
            label: '一起走過',
            left: 914,
            top: 512,
            width: 410,
            height: 318,
            rotate: -2,
            delay: 540,
          },
        ].map(({ src, label, left, top, width, height, rotate, delay }) => (
          <figure
            key={label}
            className="story-fadeup"
            style={{
              animationDelay: `${delay}ms`,
              position: 'absolute',
              left,
              top,
              width,
              height,
              margin: 0,
              borderRadius: 30,
              border: '2px solid rgba(255,255,255,0.86)',
              background: palette.black,
              overflow: 'hidden',
              transform: `rotate(${rotate}deg)`,
              boxShadow: '0 30px 74px rgba(0,0,0,0.48)',
            }}
          >
            <video
              src={src}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
                filter: 'saturate(1.08) contrast(1.04)',
              }}
            />
            <figcaption
              style={{
                position: 'absolute',
                left: 16,
                bottom: 16,
                borderRadius: 999,
                background: 'rgba(8,8,10,0.74)',
                color: '#fff',
                padding: '10px 15px',
                fontSize: 18,
                lineHeight: 1,
                fontWeight: 900,
                backdropFilter: 'blur(10px)',
              }}
            >
              {label}
            </figcaption>
          </figure>
        ))}

        <div
          className="story-fadeup"
          style={{
            animationDelay: '680ms',
            position: 'absolute',
            right: 74,
            bottom: 62,
            borderRadius: 999,
            border: `2px solid ${palette.black}`,
            background: palette.lime,
            color: palette.black,
            padding: '16px 24px',
            fontSize: 26,
            lineHeight: 1,
            fontWeight: 950,
            transform: 'rotate(4deg)',
            boxShadow: '8px 8px 0 rgba(255,255,255,0.18)',
          }}
        >
          不是畢業，卻像先偷跑了一次。
        </div>
      </div>
    </div>
  </PageShell>
);

const ContestCanBeFun: Page = () => (
  <PageShell section="Competition mood" accent={palette.lime} showHeader={false}>
    <div
      style={{
        flex: 1,
        position: 'relative',
        minHeight: 0,
        marginTop: 10,
      }}
    >
      <div
        className="story-fadeup"
        style={{
          position: 'absolute',
          inset: '0 0 10px',
          borderRadius: 42,
          border: `2px solid ${palette.black}`,
          background:
            'radial-gradient(circle at 12% 16%, rgba(220,238,177,0.9), transparent 30%), radial-gradient(circle at 84% 24%, rgba(197,176,244,0.54), transparent 26%), linear-gradient(135deg, #fffdf4 0%, #eef8d9 46%, #f7e6ed 100%)',
          overflow: 'hidden',
          boxShadow: '18px 18px 0 rgba(0,0,0,0.12)',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: -120,
            bottom: 108,
            width: 560,
            height: 150,
            borderRadius: 999,
            background: palette.lime,
            border: `2px solid ${palette.black}`,
            transform: 'rotate(-8deg)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: -104,
            top: 56,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: palette.primary,
            opacity: 0.9,
          }}
        />

        <figure
          className="story-fadeup"
          style={{
            animationDelay: '120ms',
            position: 'absolute',
            right: 78,
            top: 74,
            width: 760,
            height: 470,
            margin: 0,
            borderRadius: 34,
            border: `2px solid ${palette.black}`,
            overflow: 'hidden',
            background: '#fff',
            transform: 'rotate(2deg)',
            boxShadow: '18px 18px 0 rgba(255,61,139,0.22)',
            zIndex: 1,
          }}
        >
          <img
            src={contestCanBeFunTeam}
            alt="團隊穿著亮綠色活動衣合照"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 45%',
              display: 'block',
            }}
          />
        </figure>

        <figure
          className="story-fadeup"
          style={{
            animationDelay: '260ms',
            position: 'absolute',
            right: 98,
            bottom: 74,
            width: 520,
            height: 252,
            margin: 0,
            borderRadius: 30,
            border: `2px solid ${palette.black}`,
            overflow: 'hidden',
            background: '#fff',
            transform: 'rotate(-2.5deg)',
            boxShadow: '14px 14px 0 rgba(0,0,0,0.12)',
            zIndex: 3,
          }}
        >
          <img
            src={contestCanBeFunJudging}
            alt="向評審介紹作品的現場"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 48%',
              display: 'block',
            }}
          />
        </figure>

        <figure
          className="story-fadeup"
          style={{
            animationDelay: '360ms',
            position: 'absolute',
            left: 654,
            bottom: 104,
            width: 132,
            height: 132,
            margin: 0,
            borderRadius: 30,
            border: `2px solid ${palette.black}`,
            overflow: 'hidden',
            background: '#fff',
            transform: 'rotate(8deg)',
            boxShadow: '12px 12px 0 rgba(197,176,244,0.42)',
            zIndex: 4,
          }}
        >
          <img
            src={contestCanBeFunTrophy}
            alt="海峽兩岸青少年創客大賽獎盃"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
            }}
          />
          <figcaption
            style={{
              position: 'absolute',
              left: 14,
              bottom: 14,
              borderRadius: 999,
              background: palette.black,
              color: '#fff',
              padding: '7px 10px',
              fontSize: 14,
              lineHeight: 1,
              fontWeight: 900,
            }}
          >
            成果之外
          </figcaption>
        </figure>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '140ms',
            position: 'absolute',
            left: 70,
            top: 76,
            width: 650,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              borderRadius: 999,
              border: `2px solid ${palette.black}`,
              background: '#fff',
              color: palette.primary,
              fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
              fontSize: 18,
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '14px 18px',
              marginBottom: 30,
              boxShadow: '7px 7px 0 rgba(0,0,0,0.1)',
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: palette.lime }} />
            loosen up
          </div>
          <h1
            style={{
              fontFamily: 'var(--osd-font-display)',
              color: palette.black,
              fontSize: 96,
              lineHeight: 1.03,
              letterSpacing: -1.2,
              fontWeight: 930,
              margin: 0,
            }}
          >
            認真，
            <br />
            也可以
            <br />
            很開心。
          </h1>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '440ms',
            position: 'absolute',
            left: 82,
            bottom: 76,
            width: 560,
            borderRadius: 28,
            border: `2px solid ${palette.black}`,
            background: palette.black,
            color: '#fff',
            padding: '28px 32px',
            boxShadow: '12px 12px 0 rgba(220,238,177,0.36)',
          }}
        >
          <div style={{ color: palette.lime, fontSize: 20, fontWeight: 950, letterSpacing: '0.08em', marginBottom: 16 }}>
            MINDSET SHIFT
          </div>
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <div style={{ color: palette.lime, fontSize: 22, lineHeight: 1, fontWeight: 900, marginBottom: 8 }}>
                以前以為
              </div>
              <div style={{ fontSize: 30, lineHeight: 1.28, fontWeight: 820 }}>
                競賽就是緊繃、比較、不能出錯。
              </div>
            </div>
            <div>
              <div style={{ color: palette.lime, fontSize: 22, lineHeight: 1, fontWeight: 900, marginBottom: 8 }}>
                後來發現
              </div>
              <div style={{ fontSize: 30, lineHeight: 1.28, fontWeight: 820 }}>
                和隊友一起把作品帶出去，也可以很開心。
              </div>
            </div>
          </div>
        </div>

        {[
          { text: '不是考試', left: 420, top: 318, color: palette.lime },
          { text: '不是上戰場', left: 466, top: 374, color: palette.lilac },
          { text: '是跟一群人一起完成一件事', left: 340, top: 430, color: palette.primary },
        ].map(({ text, left, top, color }, i) => (
          <div
            key={text}
            className="story-fadeup"
            style={{
              animationDelay: `${540 + i * 80}ms`,
              position: 'absolute',
              left,
              top,
              borderRadius: 999,
              border: `2px solid ${palette.black}`,
              background: color,
              color: i === 2 ? '#fff' : palette.black,
              padding: '14px 20px',
              fontSize: i === 2 ? 21 : 24,
              lineHeight: 1,
              fontWeight: 950,
              transform: `rotate(${[-5, 4, -2][i]}deg)`,
              boxShadow: '7px 7px 0 rgba(0,0,0,0.12)',
              zIndex: 5,
            }}
          >
            {text}
          </div>
        ))}
      </div>
    </div>
  </PageShell>
);

const WeeklyTeachingLead: Page = () => (
  <PageShell section="Teaching lead" accent={palette.lilac}>
    <div
      style={{
        flex: 1,
        position: 'relative',
        minHeight: 0,
        paddingTop: 18,
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: '58px 0 8px',
          borderRadius: 42,
          border: `2px solid ${palette.black}`,
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.94), rgba(244,236,214,0.86) 42%, rgba(197,176,244,0.42) 100%)',
          boxShadow: '18px 18px 0 rgba(0,0,0,0.1)',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          display: 'grid',
          gridTemplateColumns: '0.9fr 1.1fr',
          gap: 44,
          padding: '78px 64px 56px',
        }}
      >
        <div
          className="story-fadeup"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 0,
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                borderRadius: 999,
                border: `2px solid ${palette.black}`,
                background: palette.black,
                color: palette.lilac,
                fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
                fontSize: 18,
                lineHeight: 1,
                fontWeight: 950,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '14px 18px',
                marginBottom: 34,
                boxShadow: '7px 7px 0 rgba(197,176,244,0.42)',
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: palette.lime }} />
              sophomore year
            </div>
            <h1
              style={{
                fontFamily: 'var(--osd-font-display)',
                color: palette.black,
                fontSize: 80,
                lineHeight: 1.04,
                letterSpacing: -1.2,
                fontWeight: 930,
                margin: 0,
              }}
            >
              大二之後，
              <br />
              我開始每週
              <br />
              都要交出
              <br />
              一堂課。
            </h1>
          </div>

          <div
            className="story-fadeup"
            style={{
              animationDelay: '180ms',
              borderRadius: 28,
              border: `2px solid ${palette.black}`,
              background: palette.lime,
              color: palette.black,
              padding: '26px 30px',
              boxShadow: '10px 10px 0 rgba(0,0,0,0.12)',
            }}
          >
            <div style={{ fontSize: 31, lineHeight: 1.34, fontWeight: 820 }}>
              壓力不再只是自己會不會，而是我要讓每一次來上課的人，都覺得這堂課值得。
            </div>
          </div>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '120ms',
            position: 'relative',
            borderRadius: 34,
            border: `2px solid ${palette.black}`,
            background: palette.black,
            color: '#fff',
            padding: '34px',
            overflow: 'hidden',
            boxShadow: '14px 14px 0 rgba(255,61,139,0.22)',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 18px 18px, rgba(255,255,255,0.08) 1.4px, transparent 1.4px)',
              backgroundSize: '32px 32px',
            }}
          />
          <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 26 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div
                  style={{
                    color: palette.lilac,
                    fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
                    fontSize: 18,
                    fontWeight: 950,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: 10,
                  }}
                >
                  weekly delivery board
                </div>
                <div style={{ fontSize: 42, lineHeight: 1.08, fontWeight: 920 }}>每週上架，不是偶爾準備。</div>
              </div>
              <div
                style={{
                  width: 116,
                  height: 116,
                  borderRadius: 28,
                  background: palette.primary,
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  textAlign: 'center',
                  fontSize: 33,
                  lineHeight: 1.02,
                  fontWeight: 950,
                  transform: 'rotate(4deg)',
                  boxShadow: '8px 8px 0 rgba(255,255,255,0.18)',
                }}
              >
                每週
                <br />
                一堂
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 18,
                minHeight: 0,
              }}
            >
              {[
                ['內容', '不是把文件貼上去，而是重新整理成大家聽得懂的順序。', palette.cream],
                ['實作', '要能現場跑得起來，也要讓新手知道下一步怎麼改。', palette.lime],
                ['節奏', '一週一週推進，不能這週很滿、下週就斷掉。', palette.lilac],
                ['品質', '不是有課就好，而是每次都要對得起來上課的人。', '#fff'],
              ].map(([title, text, color], i) => (
                <div
                  key={title}
                  className="story-fadeup"
                  style={{
                    animationDelay: `${260 + i * 80}ms`,
                    borderRadius: 24,
                    border: `2px solid ${palette.black}`,
                    background: color,
                    color: palette.black,
                    padding: '28px 28px',
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '8px 8px 0 rgba(255,255,255,0.13)',
                  }}
                >
                  <div style={{ fontSize: 39, lineHeight: 1, fontWeight: 950, marginBottom: 18 }}>{title}</div>
                  <div style={{ color: palette.muted, fontSize: 25, lineHeight: 1.34, fontWeight: 650 }}>{text}</div>
                </div>
              ))}
            </div>

            <div
              className="story-fadeup"
              style={{
                animationDelay: '640ms',
                borderRadius: 999,
                border: '2px solid rgba(255,255,255,0.72)',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 22,
              }}
            >
              <span style={{ color: palette.lilac, fontSize: 21, fontWeight: 950, letterSpacing: '0.08em' }}>QUALITY BAR</span>
              <span style={{ flex: 1, height: 13, borderRadius: 999, background: 'rgba(255,255,255,0.16)', overflow: 'hidden' }}>
                <span
                  style={{
                    display: 'block',
                    width: '84%',
                    height: '100%',
                    borderRadius: 999,
                    background: `linear-gradient(90deg, ${palette.lime}, ${palette.primary})`,
                  }}
                />
              </span>
              <span style={{ fontSize: 24, fontWeight: 950 }}>不能隨便</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageShell>
);

const BeyondWeeklyClass: Page = () => (
  <PageShell section="Club operations" accent={palette.primary} showHeader={false}>
    <div
      style={{
        flex: 1,
        position: 'relative',
        minHeight: 0,
        marginTop: 10,
      }}
    >
      <div
        className="story-fadeup"
        style={{
          position: 'absolute',
          inset: '0 0 10px',
          borderRadius: 42,
          border: `2px solid ${palette.black}`,
          background:
            'radial-gradient(circle at 18px 18px, rgba(0,0,0,0.07) 1.6px, transparent 1.6px), linear-gradient(135deg, #fff 0%, #f4ecd6 45%, #efd4d4 100%)',
          backgroundSize: '36px 36px, 100% 100%',
          overflow: 'hidden',
          boxShadow: '18px 18px 0 rgba(255,61,139,0.2)',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: -120,
            top: -86,
            width: 390,
            height: 390,
            borderRadius: '50%',
            background: palette.primary,
            border: `2px solid ${palette.black}`,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 640,
            bottom: -80,
            width: 620,
            height: 170,
            borderRadius: 999,
            background: palette.lime,
            border: `2px solid ${palette.black}`,
            transform: 'rotate(-4deg)',
          }}
        />

        <div
          className="story-fadeup"
          style={{
            animationDelay: '100ms',
            position: 'absolute',
            left: 70,
            top: 76,
            width: 690,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              borderRadius: 999,
              border: `2px solid ${palette.black}`,
              background: palette.black,
              color: palette.lime,
              fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
              fontSize: 18,
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '14px 18px',
              marginBottom: 32,
              boxShadow: '7px 7px 0 rgba(255,61,139,0.24)',
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: palette.primary }} />
            not only classes
          </div>
          <h1
            style={{
              fontFamily: 'var(--osd-font-display)',
              color: palette.black,
              fontSize: 84,
              lineHeight: 1.03,
              letterSpacing: -1.2,
              fontWeight: 930,
              margin: 0,
            }}
          >
            除了課程，
            <br />
            還得把活動
            <br />
            辦起來。
          </h1>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '220ms',
            position: 'absolute',
            left: 82,
            bottom: 74,
            width: 620,
            borderRadius: 30,
            border: `2px solid ${palette.black}`,
            background: '#fff',
            color: palette.black,
            padding: '30px 34px',
            transform: 'rotate(-1.5deg)',
            boxShadow: '12px 12px 0 rgba(0,0,0,0.12)',
          }}
        >
          <div style={{ color: palette.primary, fontSize: 20, fontWeight: 950, letterSpacing: '0.08em', marginBottom: 16 }}>
            REAL CLUB WORK
          </div>
          <div style={{ fontSize: 35, lineHeight: 1.28, fontWeight: 820 }}>
            教學只是固定輸出；活動則是要把人聚起來，讓大家真的願意參與。
          </div>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '160ms',
            position: 'absolute',
            right: 78,
            top: 78,
            width: 700,
            height: 768,
            borderRadius: 34,
            border: `2px solid ${palette.black}`,
            background: palette.black,
            color: '#fff',
            padding: '36px',
            boxShadow: '14px 14px 0 rgba(197,176,244,0.35)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
            <div>
              <div
                style={{
                  color: palette.lilac,
                  fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
                  fontSize: 18,
                  fontWeight: 950,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                2024.09 → 2025.05
              </div>
              <div style={{ fontSize: 42, lineHeight: 1.08, fontWeight: 930 }}>真的辦過的活動。</div>
            </div>
            <div
              style={{
                borderRadius: 24,
                background: palette.primary,
                color: '#fff',
                padding: '18px 20px',
                fontSize: 30,
                lineHeight: 1,
                fontWeight: 950,
                transform: 'rotate(5deg)',
                boxShadow: '7px 7px 0 rgba(255,255,255,0.16)',
              }}
            >
              16+
              <br />
              events
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            {[
              ['08/30-09/01', '社團旅遊(宜蘭)'],
              ['09/02', '社團博覽會'],
              ['09/07-08', '暑期幹部訓練'],
              ['09/19', '第8屆新生茶會'],
              ['09/23', '試上課'],
              ['10/17', '社團迎新'],
              ['10/30', '113-1 社員大會'],
              ['11/11', '社團野餐'],
              ['12/04', '學長回娘家經驗分享講座'],
              ['12/23', '社團期末聚'],
              ['01/11', '葳格營隊'],
              ['03/28', '企業參訪（國泰金控）'],
              ['04/15', 'FCU 2025 行動應用創新賽'],
              ['04/23', '社員大會暨社長選舉'],
              ['04/29', '幹部交接典禮'],
              ['05/06、13', 'Workshop'],
            ].map(([date, title], i) => (
              <div
                key={`${date}-${title}`}
                className="story-fadeup"
                style={{
                  animationDelay: `${280 + i * 28}ms`,
                  display: 'grid',
                  gridTemplateColumns: '92px 1fr',
                  gap: 12,
                  alignItems: 'center',
                  borderRadius: 18,
                  border: '2px solid rgba(255,255,255,0.16)',
                  background: i % 2 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(197,176,244,0.16)',
                  padding: '12px 14px',
                  minHeight: 53,
                }}
              >
                <div
                  style={{
                    borderRadius: 999,
                    background: i >= 12 ? palette.primary : i >= 10 ? palette.lime : i >= 8 ? palette.cream : palette.lilac,
                    color: i >= 12 ? '#fff' : palette.black,
                    padding: '9px 0',
                    textAlign: 'center',
                    fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
                    fontSize: 13,
                    lineHeight: 1,
                    fontWeight: 950,
                    letterSpacing: '0.01em',
                  }}
                >
                  {date}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.88)', fontSize: 19, lineHeight: 1.12, fontWeight: 800 }}>
                  {title}
                </div>
              </div>
            ))}
          </div>

          <div
            className="story-fadeup"
            style={{
              animationDelay: '760ms',
              position: 'absolute',
              right: 34,
              bottom: 30,
              borderRadius: 999,
              border: `2px solid ${palette.black}`,
              background: palette.lime,
              color: palette.black,
              padding: '15px 22px',
              fontSize: 25,
              lineHeight: 1,
              fontWeight: 950,
              transform: 'rotate(-2deg)',
            }}
          >
            source: iosclub.tw / club activities
          </div>
        </div>
      </div>
    </div>
  </PageShell>
);

const HalfFcuTopia: Page = () => (
  <PageShell section="Product building" accent={palette.lime} showHeader={false}>
    <div
      style={{
        flex: 1,
        position: 'relative',
        minHeight: 0,
        marginTop: 10,
      }}
    >
      <div
        className="story-fadeup"
        style={{
          position: 'absolute',
          inset: '0 0 10px',
          borderRadius: 42,
          border: `2px solid ${palette.black}`,
          background:
            'linear-gradient(135deg, #ffffff 0%, #dceeb1 46%, #c5b0f4 100%)',
          overflow: 'hidden',
          boxShadow: '18px 18px 0 rgba(0,0,0,0.12)',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 18px 18px, rgba(0,0,0,0.08) 1.6px, transparent 1.6px)',
            backgroundSize: '34px 34px',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: -96,
            top: -90,
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: palette.primary,
            border: `2px solid ${palette.black}`,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: -120,
            bottom: 92,
            width: 520,
            height: 150,
            borderRadius: 999,
            background: palette.cream,
            border: `2px solid ${palette.black}`,
            transform: 'rotate(-7deg)',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            display: 'grid',
            gridTemplateColumns: '0.95fr 1.05fr',
            gap: 46,
            padding: '68px 74px 58px',
          }}
        >
          <div
            className="story-fadeup"
            style={{
              animationDelay: '90ms',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 0,
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 12,
                  borderRadius: 999,
                  border: `2px solid ${palette.black}`,
                  background: palette.black,
                  color: palette.lime,
                  fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
                  fontSize: 18,
                  lineHeight: 1,
                  fontWeight: 950,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '14px 18px',
                  marginBottom: 34,
                  boxShadow: '7px 7px 0 rgba(255,61,139,0.24)',
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: palette.primary }} />
                side project to product
              </div>
              <h1
                style={{
                  fontFamily: 'var(--osd-font-display)',
                  color: palette.black,
                  fontSize: 84,
                  lineHeight: 1.02,
                  letterSpacing: -1.3,
                  fontWeight: 940,
                  margin: 0,
                }}
              >
                我還開發了
                <br />
                半逢遇甲。
              </h1>
              <p
                style={{
                  margin: '32px 0 0',
                  color: palette.muted,
                  fontSize: 32,
                  lineHeight: 1.36,
                  fontWeight: 720,
                  maxWidth: 640,
                }}
              >
                這不是比賽作品，而是一個真的給逢甲學生使用的校園資訊整合 App。
              </p>
            </div>

            <div
              className="story-fadeup"
              style={{
                animationDelay: '260ms',
                borderRadius: 30,
                border: `2px solid ${palette.black}`,
                background: '#fff',
                color: palette.black,
                padding: '26px 30px',
                boxShadow: '10px 10px 0 rgba(0,0,0,0.12)',
              }}
            >
              <div style={{ color: palette.primary, fontSize: 20, fontWeight: 950, letterSpacing: '0.08em', marginBottom: 14 }}>
                APP STORE
              </div>
              <div style={{ fontSize: 34, lineHeight: 1.28, fontWeight: 850 }}>
                開發者：Tsai Cheng-Yeh
                <br />
                類別：工具程式 / 評分 4.8
              </div>
            </div>
          </div>

          <div
            className="story-fadeup"
            style={{
              animationDelay: '160ms',
              position: 'relative',
              minHeight: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 26,
                top: 34,
                width: 360,
                height: 706,
                borderRadius: 58,
                border: `3px solid ${palette.black}`,
                background: palette.black,
                transform: 'rotate(-3deg)',
                boxShadow: '16px 16px 0 rgba(0,0,0,0.16)',
                padding: 18,
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 42,
                  background: '#f8f8f4',
                  overflow: 'hidden',
                  padding: '28px 24px',
                  color: palette.black,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 26,
                  }}
                >
                  <div
                    style={{
                      width: 76,
                      height: 76,
                      borderRadius: 22,
                      border: `2px solid ${palette.black}`,
                      background: `linear-gradient(135deg, ${palette.lime}, ${palette.lilac})`,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 28,
                      fontWeight: 950,
                      boxShadow: '5px 5px 0 rgba(0,0,0,0.12)',
                    }}
                  >
                    逢
                  </div>
                  <div
                    style={{
                      borderRadius: 999,
                      background: palette.black,
                      color: '#fff',
                      padding: '10px 13px',
                      fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
                      fontSize: 13,
                      fontWeight: 950,
                    }}
                  >
                    fcu.topia
                  </div>
                </div>
                <div style={{ fontSize: 35, lineHeight: 1.08, fontWeight: 940, marginBottom: 12 }}>
                  半逢遇甲
                </div>
                <div style={{ color: palette.muted, fontSize: 20, lineHeight: 1.3, fontWeight: 700, marginBottom: 26 }}>
                  提供逢甲學生方便的校務體驗
                </div>

                <div style={{ display: 'grid', gap: 14 }}>
                  {[
                    ['課表', '一頁式課表與桌面 / 鎖定畫面 Widget'],
                    ['整合', 'MyFCU、iLearn、校網、系網與行事曆'],
                    ['提醒', 'iLearn 作業清單與通知'],
                    ['校園', '車位資訊與常用連結'],
                  ].map(([label, text], i) => (
                    <div
                      key={label}
                      style={{
                        borderRadius: 20,
                        border: `2px solid ${palette.black}`,
                        background: [palette.lime, palette.cream, palette.lilac, '#fff'][i],
                        padding: '16px 16px',
                        display: 'grid',
                        gridTemplateColumns: '64px 1fr',
                        gap: 12,
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          borderRadius: 999,
                          background: palette.black,
                          color: '#fff',
                          padding: '10px 0',
                          textAlign: 'center',
                          fontSize: 18,
                          lineHeight: 1,
                          fontWeight: 950,
                        }}
                      >
                        {label}
                      </div>
                      <div style={{ color: palette.black, fontSize: 19, lineHeight: 1.22, fontWeight: 760 }}>{text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 72,
                width: 330,
                borderRadius: 32,
                border: `2px solid ${palette.black}`,
                background: palette.black,
                color: '#fff',
                padding: '30px 32px',
                boxShadow: '12px 12px 0 rgba(255,61,139,0.24)',
              }}
            >
              <div
                style={{
                  color: palette.lime,
                  fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
                  fontSize: 17,
                  lineHeight: 1,
                  fontWeight: 950,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 18,
                }}
              >
                why it matters
              </div>
              <div style={{ fontSize: 38, lineHeight: 1.12, fontWeight: 930, marginBottom: 22 }}>
                從活動，
                <br />
                變成產品。
              </div>
              <div style={{ color: 'rgba(255,255,255,0.78)', fontSize: 25, lineHeight: 1.34, fontWeight: 620 }}>
                我不只是辦一次活動，而是開始思考：能不能做一個東西，長期改善大家每天遇到的小麻煩？
              </div>
            </div>

            <div
              className="story-fadeup"
              style={{
                animationDelay: '360ms',
                position: 'absolute',
                right: 20,
                bottom: 46,
                width: 392,
                borderRadius: 28,
                border: `2px solid ${palette.black}`,
                background: palette.primary,
                color: '#fff',
                padding: '24px 28px',
                transform: 'rotate(2deg)',
                boxShadow: '10px 10px 0 rgba(0,0,0,0.14)',
              }}
            >
              <div style={{ fontSize: 30, lineHeight: 1.28, fontWeight: 880 }}>
                這頁可以講：我開始把「社團服務」變成「真的有人使用的工具」。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageShell>
);

const MaicThirdPrize: Page = () => (
  <PageShell section="MAIC result" accent={palette.primary} showHeader={false} mode="dark">
    <div
      style={{
        flex: 1,
        position: 'relative',
        minHeight: 0,
        marginTop: 12,
      }}
    >
      <div
        className="story-fadeup"
        style={{
          position: 'absolute',
          inset: '0 0 10px',
          borderRadius: 42,
          border: '2px solid rgba(255,255,255,0.82)',
          overflow: 'hidden',
          background: palette.black,
          boxShadow: '18px 18px 0 rgba(255,61,139,0.22)',
        }}
      >
        <img
          src={maicThirdPrizePhoto}
          alt="2024 MAIC 行動應用創新賽頒獎合照"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 48%',
            display: 'block',
            filter: 'saturate(0.98) contrast(1.02)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.34) 34%, rgba(0,0,0,0.08) 62%, rgba(0,0,0,0.48) 100%)',
          }}
        />

        <div
          className="story-fadeup"
          style={{
            animationDelay: '120ms',
            position: 'absolute',
            left: 58,
            top: 56,
            zIndex: 2,
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.32)',
            background: 'rgba(0,0,0,0.54)',
            color: palette.lime,
            padding: '14px 22px',
            fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
            fontSize: 18,
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          2024 MAIC / Mobile Application Innovation Contest
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '220ms',
            position: 'absolute',
            left: 58,
            bottom: 74,
            width: 740,
            zIndex: 2,
            color: '#fff',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--osd-font-display)',
              fontSize: 72,
              lineHeight: 1.02,
              fontWeight: 920,
              letterSpacing: -1,
              textShadow: '0 18px 48px rgba(0,0,0,0.42)',
            }}
          >
            最終，我在這場
            <br />
            行動應用創新賽中，
            <br />
            拿下了三等獎。
          </div>
          <div
            style={{
              marginTop: 30,
              maxWidth: 680,
              color: 'rgba(255,255,255,0.76)',
              fontSize: 30,
              lineHeight: 1.38,
              fontWeight: 560,
            }}
          >
            前面那些開會、學習、參與活動，終於變成一個看得見的結果。
          </div>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '360ms',
            position: 'absolute',
            right: 72,
            top: 92,
            width: 440,
            minHeight: 440,
            zIndex: 3,
            borderRadius: 36,
            border: `2px solid ${palette.black}`,
            background: palette.cream,
            color: palette.black,
            padding: '44px 42px',
            transform: 'rotate(2deg)',
            boxShadow: '14px 14px 0 rgba(255,61,139,0.38)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ color: palette.primary, fontSize: 22, fontWeight: 950, letterSpacing: '0.08em', marginBottom: 24 }}>
              RESULT
            </div>
            <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 104, lineHeight: 0.88, fontWeight: 950, letterSpacing: -2 }}>
              三等獎
            </div>
          </div>
          <div
            style={{
              borderTop: `2px solid ${palette.black}`,
              paddingTop: 24,
              color: palette.muted,
              fontSize: 27,
              lineHeight: 1.28,
              fontWeight: 760,
            }}
          >
            不是突然變強，
            <br />
            是前面每一次補上的努力。
          </div>
        </div>

        <div
          aria-hidden
          className="story-fadeup"
          style={{
            animationDelay: '520ms',
            position: 'absolute',
            right: 392,
            bottom: 76,
            width: 160,
            height: 160,
            zIndex: 1,
            borderRadius: '50%',
            border: `2px solid ${palette.black}`,
            background: palette.lime,
            transform: 'rotate(-12deg)',
            boxShadow: '8px 8px 0 rgba(0,0,0,0.28)',
          }}
        />
      </div>
    </div>
  </PageShell>
);

const HungryAfterAward: Page = () => (
  <PageShell section="After award" accent={palette.lime}>
    <div
      style={{
        flex: 1,
        position: 'relative',
        minHeight: 0,
        paddingTop: 26,
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: '48px 0 16px',
          borderRadius: 40,
          background:
            'linear-gradient(135deg, rgba(220,238,177,0.74), rgba(244,236,214,0.82) 44%, rgba(239,212,212,0.8))',
          border: `2px solid ${palette.black}`,
          transform: 'rotate(-1deg)',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          display: 'grid',
          gridTemplateColumns: '0.92fr 1.08fr',
          gap: 42,
          alignItems: 'stretch',
          padding: '64px 58px 54px',
        }}
      >
        <div
          className="story-fadeup"
          style={{
            borderRadius: 34,
            border: `2px solid ${palette.black}`,
            background: palette.black,
            color: '#fff',
            padding: '48px 46px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '14px 14px 0 rgba(255,61,139,0.24)',
          }}
        >
          <div>
            <div
              style={{
                color: palette.lime,
                fontSize: 21,
                lineHeight: 1,
                fontWeight: 950,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 28,
              }}
            >
              得獎之後
            </div>
            <h1
              style={{
                fontFamily: 'var(--osd-font-display)',
                fontSize: 76,
                lineHeight: 1.02,
                letterSpacing: -1.2,
                fontWeight: 920,
                margin: 0,
              }}
            >
              但我從來
              <br />
              不滿足。
            </h1>
          </div>
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ color: 'rgba(255,255,255,0.76)', fontSize: 34, lineHeight: 1.36, fontWeight: 620 }}>
              我花了很多時間，可不是為了只拿到一個三等獎。
            </div>
            <div
              style={{
                alignSelf: 'flex-start',
                borderRadius: 999,
                background: palette.primary,
                color: '#fff',
                padding: '16px 24px',
                fontSize: 28,
                lineHeight: 1,
                fontWeight: 920,
              }}
            >
              我想了解更多，因為我想變強。
            </div>
          </div>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '160ms',
            position: 'relative',
            borderRadius: 34,
            border: `2px solid ${palette.black}`,
            background:
              'radial-gradient(circle at 18px 18px, rgba(0,0,0,0.09) 1.6px, transparent 1.6px), #fff',
            backgroundSize: '34px 34px',
            overflow: 'hidden',
            padding: '42px 42px',
            boxShadow: '14px 14px 0 rgba(0,0,0,0.12)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 34,
              fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
              fontSize: 18,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontWeight: 900,
            }}
          >
            <span style={{ color: palette.primary }}>field notes</span>
            <span style={{ color: palette.faint }}>賽後觀察 / 交流 / 拆解</span>
          </div>

          <div style={{ position: 'relative', height: 'calc(100% - 58px)' }}>
            <div
              aria-hidden
              style={{
                position: 'absolute',
                left: 292,
                top: 92,
                width: 132,
                borderTop: `3px dashed ${palette.primary}`,
                opacity: 0.34,
                transform: 'rotate(10deg)',
              }}
            />
            <div
              aria-hidden
              style={{
                position: 'absolute',
                left: 260,
                top: 268,
                width: 190,
                borderTop: `3px dashed ${palette.lilac}`,
                opacity: 0.34,
                transform: 'rotate(-13deg)',
              }}
            />
            {[
              {
                title: '聽別人的作品',
                text: '不是只看排名，而是去理解他們怎麼定義問題、怎麼包裝價值。',
                color: palette.lime,
                mark: '01',
                titleSize: 34,
                bodySize: 23,
                style: { left: 0, top: 6, width: 318, transform: 'rotate(-2deg)', zIndex: 3 },
              },
              {
                title: '跟很多人交流',
                text: '評審、參賽者、學長姐，只要有機會我就問，想知道自己缺在哪。',
                color: palette.cream,
                mark: '02',
                titleSize: 31,
                bodySize: 22,
                style: { right: 0, top: 54, width: 292, transform: 'rotate(2deg)', zIndex: 2 },
              },
              {
                title: '追問開發細節',
                text: '這個 API 怎麼串？資料怎麼處理？你們為什麼用這個架構？',
                color: palette.lilac,
                mark: '03',
                titleSize: 32,
                bodySize: 22,
                style: { left: 48, top: 292, width: 394, transform: 'rotate(1deg)', zIndex: 3 },
              },
            ].map(({ title, text, color, style, titleSize, bodySize, mark }, i) => (
              <div
                key={title}
                className="story-fadeup"
                style={{
                  animationDelay: `${260 + i * 110}ms`,
                  position: 'absolute',
                  borderRadius: 24,
                  border: `2px solid ${palette.black}`,
                  background: color,
                  color: palette.black,
                  padding: '24px 26px',
                  boxShadow: i === 1 ? '10px 10px 0 rgba(255,61,139,0.18)' : '10px 10px 0 rgba(0,0,0,0.1)',
                  ...style,
                }}
              >
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: -15,
                    width: 74,
                    height: 26,
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.68)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    transform: 'translateX(-50%) rotate(-2deg)',
                    boxShadow: '0 8px 18px rgba(0,0,0,0.1)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: 18,
                    top: 16,
                    color: 'rgba(0,0,0,0.34)',
                    fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
                    fontSize: 16,
                    lineHeight: 1,
                    fontWeight: 950,
                  }}
                >
                  {mark}
                </div>
                <div
                  style={{
                    color: palette.black,
                    fontSize: titleSize ?? 36,
                    lineHeight: 1.08,
                    fontWeight: 930,
                    marginBottom: 16,
                  }}
                >
                  {title}
                </div>
                <div
                  style={{
                    color: palette.muted,
                    fontSize: bodySize ?? 25,
                    lineHeight: 1.35,
                    fontWeight: 620,
                  }}
                >
                  {text}
                </div>
              </div>
            ))}

            <div
              className="story-fadeup"
              style={{
                animationDelay: '640ms',
                position: 'absolute',
                right: 18,
                bottom: 10,
                borderRadius: 999,
                border: `2px solid ${palette.black}`,
                background: palette.black,
                color: '#fff',
                padding: '18px 26px',
                fontSize: 31,
                lineHeight: 1,
                fontWeight: 950,
                boxShadow: '8px 8px 0 rgba(197,176,244,0.32)',
              }}
            >
              下一次，我要更強。
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageShell>
);

const People: Page = () => (
  <PageShell section="People" accent={palette.coral}>
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '0.86fr 1.14fr', gap: 72, alignItems: 'stretch' }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <HugeTitle size={82} maxWidth={760}>我不是自己一個人變成現在這樣。</HugeTitle>
          <AccentLine color={palette.coral} />
        </div>
        <Lead size={36} lineHeight={1.42}>
          有些人給我機會，有些人提醒我不要逃避，有些人只是願意聽我講完。這些支持，讓我在低潮的時候還能往前。
        </Lead>
      </div>

      <div style={{ display: 'grid', gridTemplateRows: '178px 1fr', gap: 22, minHeight: 0 }}>
        <div
          className="story-fadeup"
          style={{
            borderRadius: 24,
            background: palette.text,
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
            fontSize: 50,
            lineHeight: 1.1,
            fontWeight: 800,
            boxShadow: '0 34px 80px rgba(29,29,31,0.18)',
          }}
        >
          我開始
          <span style={{ color: '#7dd3fc' }}>往前</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gridTemplateRows: 'repeat(2, minmax(0, 1fr))', gap: 18, minHeight: 0 }}>
          {[
            ['給我機會的人', '先相信我可以試一次'],
            ['拉我一把的人', '在我卡住時幫我把問題拆小'],
            ['一起做事的人', '讓我知道團隊不是只有分工'],
            ['願意聽我講的人', '把不確定變成可以說出口的東西'],
          ].map(([title, text], i) => (
            <div
              key={title}
              className="story-fadeup"
              style={{
                animationDelay: `${140 + i * 100}ms`,
                padding: '30px 30px',
                borderRadius: 20,
                border: `1px solid ${palette.line}`,
                background: '#ffffff',
                boxShadow: '0 22px 54px rgba(29,29,31,0.06)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 0,
              }}
            >
              <div style={{ color: palette.primary, fontSize: 24, fontWeight: 800 }}>{title}</div>
              <div style={{ color: palette.text, fontSize: 30, lineHeight: 1.32, fontWeight: 700 }}>{text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </PageShell>
);

const WhatChanged: Page = () => (
  <PageShell section="Change" accent={palette.mint}>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 46, justifyContent: 'center' }}>
      <div style={{ maxWidth: 1280 }}>
        <HugeTitle size={84}>後來真正改變的，不是我突然變厲害。</HugeTitle>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 96px 1fr', gap: 34, alignItems: 'stretch' }}>
        <div
          className="story-fadeup"
          style={{
            borderRadius: 24,
            border: `1px solid ${palette.line}`,
            background: '#fff',
            padding: '42px 46px',
            minHeight: 390,
          }}
        >
          <div style={{ color: palette.muted, fontSize: 24, fontWeight: 800, marginBottom: 28 }}>以前</div>
          <div style={{ color: palette.text, fontSize: 62, lineHeight: 1.08, fontWeight: 800 }}>等有把握，才敢開始。</div>
          <div style={{ color: palette.muted, fontSize: 28, lineHeight: 1.42, marginTop: 34 }}>
            所以很多事情還沒開始，就先被我自己擋在門口。
          </div>
        </div>
        <div style={{ display: 'grid', placeItems: 'center' }}>
          <div
            className="story-fadeup"
            style={{
              animationDelay: '160ms',
              width: 78,
              height: 78,
              borderRadius: '50%',
              background: palette.primary,
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontSize: 42,
              fontWeight: 800,
            }}
          >
            →
          </div>
        </div>
        <div
          className="story-fadeup"
          style={{
            animationDelay: '220ms',
            borderRadius: 24,
            border: '1px solid rgba(0,102,204,0.2)',
            background: 'linear-gradient(180deg, rgba(0,102,204,0.08), rgba(255,255,255,0.96))',
            padding: '42px 46px',
            minHeight: 390,
          }}
        >
          <div style={{ color: palette.primary, fontSize: 24, fontWeight: 800, marginBottom: 28 }}>現在</div>
          <div style={{ color: palette.text, fontSize: 62, lineHeight: 1.08, fontWeight: 800 }}>先做一版，再從回饋裡修正。</div>
          <div style={{ color: palette.muted, fontSize: 28, lineHeight: 1.42, marginTop: 34 }}>
            自信不是先有才行動，是行動之後慢慢長出來。
          </div>
        </div>
      </div>
    </div>
  </PageShell>
);

const Work: Page = () => (
  <PageShell section="What I am building" accent={palette.blue}>
    <div style={{ flex: 1, display: 'grid', gridTemplateRows: 'auto 1fr', gap: 38, paddingTop: 24, paddingBottom: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.96fr', gap: 64, alignItems: 'end' }}>
        <HugeTitle size={78} maxWidth={960}>現在的我，正在把興趣變成作品。</HugeTitle>
        <Lead size={32} lineHeight={1.38} maxWidth={760}>
          我還不是最強，但我越來越知道怎麼把想法推進：先做出可以被看見的版本，再把它交給真實的人使用。
        </Lead>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 22, minHeight: 0 }}>
        {[
          ['半逢遇甲', '把校園裡分散的資訊，整理成更好理解的入口。', '產品整理'],
          ['行動逢甲', '讓日常需求可以被手機接住，練習把功能做進生活場景。', '行動開發'],
          ['KindReach', '把技術和社會議題接起來，試著讓作品服務真實的人。', '問題解決'],
        ].map(([title, text, tag], i) => (
          <div
            key={title}
            className="story-fadeup"
            style={{
              animationDelay: `${120 + i * 110}ms`,
              borderRadius: 22,
              border: `1px solid ${palette.line}`,
              background: i === 0 ? palette.text : '#fff',
              color: i === 0 ? '#f5f5f7' : palette.text,
              padding: '36px 34px 34px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 0,
            }}
          >
            <div>
              <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.08, marginBottom: 24 }}>{title}</div>
              <div style={{ color: i === 0 ? 'rgba(245,245,247,0.68)' : palette.muted, fontSize: 29, lineHeight: 1.34 }}>{text}</div>
            </div>
            <div
              style={{
                alignSelf: 'flex-start',
                marginTop: 34,
                borderRadius: 999,
                padding: '13px 20px',
                border: i === 0 ? '1px solid rgba(245,245,247,0.22)' : '1px solid rgba(0,102,204,0.18)',
                color: i === 0 ? '#7dd3fc' : palette.primary,
                fontSize: 22,
                fontWeight: 800,
              }}
            >
              {tag}
            </div>
          </div>
        ))}
      </div>
    </div>
  </PageShell>
);

const Lessons: Page = () => (
  <PageShell section="Lessons" accent={palette.gold}>
    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '0.74fr 1.26fr', gap: 62, alignItems: 'center' }}>
      <HugeTitle size={88}>到目前為止，我最想留下三件事。</HugeTitle>
      <div style={{ display: 'grid', gap: 18 }}>
        {[
          ['01', '不要等完美', '先完成，才有東西可以改。'],
          ['02', '不要害怕問', '問問題不是弱，是讓自己更快接近答案。'],
          ['03', '不要只看結果', '真正讓人變強的，常常是過程中的選擇。'],
        ].map(([count, title, text], i) => (
          <div
            key={title}
            className="story-fadeup"
            style={{
              animationDelay: `${i * 120}ms`,
              display: 'grid',
              gridTemplateColumns: '110px 1fr',
              gap: 30,
              alignItems: 'center',
              borderRadius: 22,
              border: `1px solid ${palette.line}`,
              background: '#fff',
              padding: '30px 34px',
              minHeight: 170,
            }}
          >
            <div style={{ color: palette.primary, fontSize: 54, fontWeight: 800 }}>{count}</div>
            <div>
              <div style={{ color: palette.text, fontSize: 40, fontWeight: 800, marginBottom: 10 }}>{title}</div>
              <div style={{ color: palette.muted, fontSize: 28, lineHeight: 1.38 }}>{text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </PageShell>
);

const Next: Page = () => (
  <PageShell section="Next" accent={palette.mint}>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 54 }}>
      <div style={{ maxWidth: 1420 }}>
        <HugeTitle size={88} maxWidth={1420}>接下來，我想成為一個更能把想法做出來的人。</HugeTitle>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>
        {[
          ['近期', '把作品做得更完整', '補細節、修體驗、讓它真的可以被使用。'],
          ['下一步', '把經驗整理成方法', '不只做過，還要知道自己為什麼這樣做。'],
          ['更遠一點', '把能力放進更大的題目', '面對不熟的問題時，仍然願意開始。'],
        ].map(([period, title, text], i) => (
          <div
            key={period}
            className="story-fadeup"
            style={{
              animationDelay: `${120 + i * 120}ms`,
              minHeight: 340,
              borderRadius: 24,
              background: i === 1 ? palette.text : '#fff',
              color: i === 1 ? '#f5f5f7' : palette.text,
              border: i === 1 ? 'none' : `1px solid ${palette.line}`,
              padding: '34px 36px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ color: i === 1 ? '#7dd3fc' : palette.primary, fontSize: 22, fontWeight: 800 }}>{period}</div>
            <div>
              <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.16, marginBottom: 18 }}>{title}</div>
              <div style={{ color: i === 1 ? 'rgba(245,245,247,0.68)' : palette.muted, fontSize: 27, lineHeight: 1.4 }}>{text}</div>
            </div>
          </div>
        ))}
      </div>
      <Lead maxWidth={1180} size={34} lineHeight={1.42}>
        我還在路上，也還會緊張、會失敗、會懷疑自己。但我現在知道，只要願意開始，就有機會看見下一步。
      </Lead>
    </div>
  </PageShell>
);

const Closing: Page = () => (
  <PageShell section="Closing" accent="#7dd3fc" showNumber={false} mode="dark">
    <div style={{ flex: 1, display: 'grid', placeItems: 'center', textAlign: 'center', position: 'relative' }}>
      <div
        className="story-fade"
        style={{
          position: 'absolute',
          width: 760,
          height: 760,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(125,211,252,0.2) 0%, rgba(17,17,20,0) 68%)',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <HugeTitle size={150} maxWidth={1300}>謝謝大家。</HugeTitle>
        <p
          className="story-fadeup"
          style={{
            animationDelay: '140ms',
            color: 'rgba(245,245,247,0.72)',
            fontSize: 38,
            lineHeight: 1.42,
            margin: '42px 0 0',
            maxWidth: 980,
          }}
        >
          如果你也正在不確定的地方，希望你可以先做一個很小的開始。
        </p>
        <div
          className="story-fadeup"
          style={{
            animationDelay: '260ms',
            marginTop: 58,
            border: '1px solid rgba(245,245,247,0.18)',
            borderRadius: 999,
            padding: '16px 34px',
            color: '#7dd3fc',
            fontSize: 44,
            fontWeight: 800,
          }}
        >
          Q&amp;A
        </div>
      </div>
    </div>
  </PageShell>
);

const Nedcc2025LeadingJuniors: Page = () => (
  <PageShell section="NEDCC 2025" accent={palette.lime} showHeader={false}>
    <div
      style={{
        flex: 1,
        position: 'relative',
        minHeight: 0,
        marginTop: 10,
      }}
    >
      <div
        className="story-fadeup"
        style={{
          position: 'absolute',
          inset: '0 0 10px',
          borderRadius: 42,
          border: `2px solid ${palette.black}`,
          background:
            'linear-gradient(135deg, #ffffff 0%, #f4ecd6 42%, #dceeb1 100%)',
          overflow: 'hidden',
          boxShadow: '18px 18px 0 rgba(0,0,0,0.1)',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(0deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
            backgroundSize: '78px 78px',
            opacity: 0.55,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: -120,
            bottom: 82,
            width: 600,
            height: 160,
            borderRadius: 999,
            background: palette.lilac,
            border: `2px solid ${palette.black}`,
            transform: 'rotate(-8deg)',
            opacity: 0.72,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: -76,
            top: -74,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: palette.primary,
            border: `2px solid ${palette.black}`,
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            display: 'grid',
            gridTemplateColumns: '0.92fr 1.08fr',
            gap: 42,
            padding: '66px 70px 54px',
          }}
        >
          <div
            className="story-fadeup"
            style={{
              animationDelay: '80ms',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 0,
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 12,
                  borderRadius: 999,
                  border: `2px solid ${palette.black}`,
                  background: palette.black,
                  color: palette.lime,
                  fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
                  fontSize: 18,
                  lineHeight: 1,
                  fontWeight: 950,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '14px 18px',
                  marginBottom: 32,
                  boxShadow: '7px 7px 0 rgba(255,61,139,0.24)',
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: palette.primary }} />
                role handoff
              </div>
              <h1
                style={{
                  fontFamily: 'var(--osd-font-display)',
                  color: palette.black,
                  fontSize: 78,
                  lineHeight: 1.04,
                  letterSpacing: -1.2,
                  fontWeight: 940,
                  margin: 0,
                }}
              >
                從自己上場，
                <br />
                到帶著學弟妹
                <br />
                一起上場。
              </h1>
              <p
                style={{
                  margin: '34px 0 0',
                  color: palette.muted,
                  fontSize: 30,
                  lineHeight: 1.38,
                  fontWeight: 720,
                  maxWidth: 640,
                }}
              >
                以前是學長帶著我進比賽；到了 2025，我開始把前面學到的流程、節奏和標準，帶進下一個團隊。
              </p>
            </div>

            <div
              className="story-fadeup"
              style={{
                animationDelay: '260ms',
                position: 'relative',
                borderRadius: 30,
                border: `2px solid ${palette.black}`,
                background: palette.black,
                color: '#fff',
                padding: '24px 28px',
                boxShadow: '10px 10px 0 rgba(255,255,255,0.45)',
              }}
            >
              <div
                style={{
                  color: palette.lime,
                  fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
                  fontSize: 17,
                  fontWeight: 950,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 12,
                }}
              >
                the shift
              </div>
              <div style={{ fontSize: 31, lineHeight: 1.35, fontWeight: 850 }}>
                這次不只是把作品做出來，而是開始練習：怎麼讓後面的人也能一起往前。
              </div>
            </div>
          </div>

          <div
            className="story-fadeup"
            style={{
              animationDelay: '160ms',
              display: 'grid',
              gridTemplateRows: '1fr auto',
              gap: 20,
              minHeight: 0,
            }}
          >
            <div
              style={{
                position: 'relative',
                borderRadius: 34,
                border: `2px solid ${palette.black}`,
                background: palette.surface,
                padding: 16,
                overflow: 'hidden',
                boxShadow: '14px 14px 0 rgba(0,0,0,0.14)',
              }}
            >
              <img
                src={nedcc2025FcuAwards}
                alt="逢甲大學第21屆全國電子設計創意競賽獲獎團隊"
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: 380,
                  objectFit: 'cover',
                  borderRadius: 24,
                  display: 'block',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 32,
                  top: 32,
                  borderRadius: 999,
                  border: `2px solid ${palette.black}`,
                  background: palette.lime,
                  color: palette.black,
                  padding: '13px 18px',
                  fontSize: 21,
                  lineHeight: 1,
                  fontWeight: 950,
                  boxShadow: '6px 6px 0 rgba(0,0,0,0.16)',
                }}
              >
                2025.03.29 頒獎
              </div>
              <div
                style={{
                  position: 'absolute',
                  right: 30,
                  bottom: 30,
                  borderRadius: 22,
                  border: `2px solid ${palette.black}`,
                  background: 'rgba(255,255,255,0.92)',
                  color: palette.black,
                  padding: '16px 18px',
                  width: 360,
                  fontSize: 20,
                  lineHeight: 1.32,
                  fontWeight: 780,
                  boxShadow: '6px 6px 0 rgba(0,0,0,0.14)',
                }}
              >
                資料來源：逢甲大學新聞
                <br />
                第21屆全國電子設計創意競賽
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '0.9fr 1.25fr 0.95fr',
                gap: 14,
              }}
            >
              {[
                ['結果', 'IEEE Tainan Section 特別獎 大專組', palette.lime],
                ['作品', '基於動態追蹤與互動回饋輔助輕偏癱族群之遊戲化手部訓練應用程式', '#fff'],
                ['名單', '蔡承曄、黃軍博、李天宇、陳芷琳', palette.lilac],
              ].map(([label, value, color], i) => (
                <div
                  key={label}
                  className="story-fadeup"
                  style={{
                    animationDelay: `${300 + i * 80}ms`,
                    borderRadius: 24,
                    border: `2px solid ${palette.black}`,
                    background: color,
                    padding: '22px 22px 20px',
                    minHeight: 132,
                    boxShadow: '7px 7px 0 rgba(0,0,0,0.12)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
                      fontSize: 17,
                      lineHeight: 1,
                      fontWeight: 950,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: palette.faint,
                      marginBottom: 14,
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ color: palette.black, fontSize: 25, lineHeight: 1.28, fontWeight: 850 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageShell>
);

const GoogleApacCompetition: Page = () => (
  <PageShell section="Google APAC" accent={palette.lilac} showHeader={false}>
    <div
      style={{
        flex: 1,
        position: 'relative',
        minHeight: 0,
        marginTop: 10,
      }}
    >
      <div
        className="story-fadeup"
        style={{
          position: 'absolute',
          inset: '0 0 10px',
          borderRadius: 42,
          border: `2px solid ${palette.black}`,
          background: palette.black,
          overflow: 'hidden',
          color: '#fff',
          boxShadow: '18px 18px 0 rgba(197,176,244,0.32)',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(circle at 28px 28px, rgba(255,255,255,0.1) 1.5px, transparent 1.5px)',
            backgroundSize: '42px 42px',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 64,
            top: 70,
            width: 680,
            height: 680,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.22)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 150,
            top: 156,
            width: 508,
            height: 508,
            borderRadius: '50%',
            border: `28px solid ${palette.lilac}`,
            opacity: 0.38,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: -80,
            top: -70,
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: '#4285f4',
            border: `2px solid ${palette.black}`,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: 180,
            bottom: -90,
            width: 420,
            height: 150,
            borderRadius: 999,
            background: '#fbbc04',
            border: `2px solid ${palette.black}`,
            transform: 'rotate(-8deg)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: 36,
            bottom: 132,
            width: 190,
            height: 190,
            borderRadius: '50%',
            background: '#34a853',
            border: `2px solid ${palette.black}`,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 706,
            top: 178,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: '#ea4335',
            border: `2px solid ${palette.black}`,
          }}
        />

        <svg
          aria-hidden
          viewBox="0 0 1500 860"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <path
            d="M348 590 C 560 400, 720 370, 980 218 S 1240 160, 1360 260"
            fill="none"
            stroke="#dceeb1"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="18 20"
            opacity="0.78"
          />
          <circle cx="348" cy="590" r="14" fill="#ff3d8b" stroke="#000" strokeWidth="4" />
          <circle cx="980" cy="218" r="14" fill="#fbbc04" stroke="#000" strokeWidth="4" />
          <circle cx="1360" cy="260" r="14" fill="#34a853" stroke="#000" strokeWidth="4" />
        </svg>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '100ms',
            position: 'absolute',
            left: 76,
            top: 78,
            width: 720,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              borderRadius: 999,
              border: '2px solid rgba(255,255,255,0.72)',
              background: 'rgba(255,255,255,0.08)',
              color: palette.lime,
              fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
              fontSize: 18,
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '14px 18px',
              marginBottom: 34,
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4285f4' }} />
            bigger stage
          </div>
          <h1
            style={{
              fontFamily: 'var(--osd-font-display)',
              fontSize: 88,
              lineHeight: 1.02,
              letterSpacing: -1.4,
              fontWeight: 940,
              margin: 0,
              color: '#fff',
            }}
          >
            下一站，
            <br />
            Google APAC
            <br />
            競賽。
          </h1>
          <p
            style={{
              margin: '32px 0 0',
              maxWidth: 620,
              color: 'rgba(255,255,255,0.74)',
              fontSize: 31,
              lineHeight: 1.36,
              fontWeight: 620,
            }}
          >
            對我來說，這不是單純把作品丟出去，而是第一次很明確地把學弟妹帶到更大的舞台，讓作品接受更大尺度的檢視。
          </p>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '220ms',
            position: 'absolute',
            right: 82,
            top: 92,
            width: 520,
            height: 466,
            borderRadius: 42,
            border: `2px solid ${palette.black}`,
            background: '#fff',
            color: palette.black,
            padding: '34px 36px',
            transform: 'rotate(1.5deg)',
            boxShadow: '14px 14px 0 rgba(255,61,139,0.35)',
          }}
        >
          <div
            style={{
              color: palette.primary,
              fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
              fontSize: 18,
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            my role changed again
          </div>
          <div style={{ fontSize: 43, lineHeight: 1.08, fontWeight: 940, letterSpacing: -0.4 }}>
            不是我一個人上場，
            <br />
            是整個團隊一起被看見。
          </div>
          <div
            style={{
              marginTop: 26,
              display: 'grid',
              gap: 14,
            }}
          >
            {['把 APAC 題目拆清楚', '把資料和 Demo 補齊', '用更清楚的方式說服'].map((text, i) => (
              <div
                key={text}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '42px 1fr',
                  gap: 14,
                  alignItems: 'center',
                  borderRadius: 18,
                  border: `2px solid ${palette.black}`,
                  background: [palette.lime, palette.lilac, palette.cream][i],
                  padding: '13px 16px',
                  boxShadow: '5px 5px 0 rgba(0,0,0,0.1)',
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: palette.black,
                    color: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 18,
                    lineHeight: 1,
                    fontWeight: 950,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ fontSize: 26, lineHeight: 1.12, fontWeight: 860 }}>{text}</div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '380ms',
            position: 'absolute',
            left: 84,
            bottom: 70,
            right: 92,
            borderRadius: 32,
            border: '2px solid rgba(255,255,255,0.68)',
            background: 'rgba(255,255,255,0.09)',
            backdropFilter: 'blur(10px)',
            padding: '26px 34px',
            display: 'grid',
            gridTemplateColumns: '180px 1fr 130px',
            gap: 26,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              color: palette.lime,
              fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
              fontSize: 20,
              lineHeight: 1.2,
              fontWeight: 950,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            FCU
            <br />
            TO APAC
          </div>
          <div style={{ color: '#fff', fontSize: 33, lineHeight: 1.28, fontWeight: 780 }}>
            我想讓學弟妹知道：競賽不是只有拿獎。它會逼我們把問題做深、把作品講清楚，然後讓大家一起站上去。
          </div>
          <div
            style={{
              justifySelf: 'end',
              width: 112,
              height: 112,
              borderRadius: 28,
              border: `2px solid ${palette.black}`,
              background: palette.lilac,
              color: palette.black,
              display: 'grid',
              placeItems: 'center',
              textAlign: 'center',
              fontSize: 32,
              lineHeight: 1,
              fontWeight: 950,
              transform: 'rotate(-5deg)',
            }}
          >
            APAC
          </div>
        </div>
      </div>
    </div>
  </PageShell>
);

const MoeaCompetition: Page = () => (
  <PageShell section="MOEA competition" accent={palette.cream} showHeader={false}>
    <div
      style={{
        flex: 1,
        position: 'relative',
        minHeight: 0,
        marginTop: 10,
      }}
    >
      <div
        className="story-fadeup"
        style={{
          position: 'absolute',
          inset: '0 0 10px',
          borderRadius: 42,
          border: `2px solid ${palette.black}`,
          background:
            'linear-gradient(135deg, #fff 0%, #f4ecd6 48%, rgba(220,238,177,0.72) 100%)',
          overflow: 'hidden',
          boxShadow: '18px 18px 0 rgba(0,0,0,0.1)',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(0deg, rgba(0,0,0,0.045) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: -120,
            bottom: -90,
            width: 520,
            height: 520,
            borderRadius: '50%',
            background: palette.primary,
            border: `2px solid ${palette.black}`,
            opacity: 0.9,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 86,
            bottom: 58,
            width: 560,
            height: 130,
            borderRadius: 999,
            background: palette.lilac,
            border: `2px solid ${palette.black}`,
            transform: 'rotate(-4deg)',
            opacity: 0.76,
          }}
        />

        <div
          className="story-fadeup"
          style={{
            animationDelay: '90ms',
            position: 'absolute',
            left: 76,
            top: 76,
            width: 660,
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              borderRadius: 999,
              border: `2px solid ${palette.black}`,
              background: palette.black,
              color: palette.cream,
              fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
              fontSize: 18,
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '14px 18px',
              marginBottom: 34,
              boxShadow: '7px 7px 0 rgba(255,61,139,0.24)',
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: palette.primary }} />
            field observation
          </div>
          <h1
            style={{
              fontFamily: 'var(--osd-font-display)',
              color: palette.black,
              fontSize: 84,
              lineHeight: 1.02,
              letterSpacing: -1.2,
              fontWeight: 940,
              margin: 0,
            }}
          >
            我在現場，
            <br />
            看見了差距。
          </h1>
          <p
            style={{
              margin: '32px 0 0',
              color: palette.muted,
              fontSize: 32,
              lineHeight: 1.36,
              fontWeight: 700,
              maxWidth: 620,
            }}
          >
            經濟部競賽最震撼我的，不只是入圍未得獎，而是看見產業組與學生組作品後，第一次理解「成熟」的差距。
          </p>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '210ms',
            position: 'absolute',
            left: 84,
            bottom: 44,
            width: 590,
            zIndex: 3,
            borderRadius: 32,
            border: `2px solid ${palette.black}`,
            background: palette.black,
            color: '#fff',
            padding: '24px 30px',
            boxShadow: '12px 12px 0 rgba(255,255,255,0.62)',
          }}
        >
          <div style={{ color: palette.lime, fontSize: 20, fontWeight: 950, letterSpacing: '0.08em', marginBottom: 14 }}>
            WHAT I SAW
          </div>
          <div style={{ fontSize: 31, lineHeight: 1.26, fontWeight: 820 }}>
            產業組的作品很像已經準備進場，學生組的作品則充滿想法和衝勁；我開始理解，作品不是只有能不能 Demo，而是能不能被真實世界接住。
          </div>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '150ms',
            position: 'absolute',
            right: 84,
            top: 74,
            width: 620,
            height: 730,
            zIndex: 2,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '34px 38px 44px 18px',
              borderRadius: 30,
              border: `2px solid ${palette.black}`,
              background: palette.lilac,
              transform: 'rotate(4deg)',
              boxShadow: '12px 12px 0 rgba(0,0,0,0.12)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: '0 10px 0 66px',
              borderRadius: 30,
              border: `2px solid ${palette.black}`,
              background: '#fff',
              transform: 'rotate(-2deg)',
              boxShadow: '12px 12px 0 rgba(0,0,0,0.12)',
              padding: '32px 36px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: `2px solid ${palette.black}`,
                paddingBottom: 18,
                marginBottom: 22,
              }}
            >
              <div>
                <div
                  style={{
                    color: palette.primary,
                    fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
                    fontSize: 17,
                    lineHeight: 1,
                    fontWeight: 950,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: 10,
                  }}
                >
                  competition floor
                </div>
                <div style={{ color: palette.black, fontSize: 37, lineHeight: 1.08, fontWeight: 940 }}>
                  兩種作品，
                  <br />
                  兩種成熟度。
                </div>
              </div>
              <div
                style={{
                  width: 118,
                  height: 118,
                  borderRadius: '50%',
                  border: '4px solid #d64040',
                  color: '#d64040',
                  display: 'grid',
                  placeItems: 'center',
                  textAlign: 'center',
                  fontSize: 28,
                  lineHeight: 1,
                  fontWeight: 950,
                  transform: 'rotate(-13deg)',
                }}
              >
                現場
                <br />
                觀察
              </div>
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              {[
                ['產業組', '問題更貼近場域，講的是成本、導入、維運和可行性。'],
                ['學生組', '想法更大膽，速度更快，但有時還缺少落地脈絡。'],
                ['我看見', '作品不只要有功能，還要讓人相信它能真的被使用。'],
                ['我學到', '入圍代表被看見，但還不代表成熟度已經足夠。'],
              ].map(([label, text], i) => (
                <div
                  key={label}
                  className="story-fadeup"
                  style={{
                    animationDelay: `${300 + i * 70}ms`,
                    display: 'grid',
                    gridTemplateColumns: '112px 1fr',
                    gap: 18,
                    alignItems: 'center',
                    borderRadius: 20,
                    border: `2px solid ${palette.black}`,
                    background: i % 2 === 0 ? palette.cream : palette.lime,
                    padding: '15px 18px',
                  }}
                >
                  <div
                    style={{
                      borderRadius: 999,
                      background: palette.black,
                      color: '#fff',
                      padding: '11px 0',
                      textAlign: 'center',
                      fontSize: 22,
                      lineHeight: 1,
                      fontWeight: 950,
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ color: palette.black, fontSize: 24, lineHeight: 1.22, fontWeight: 780 }}>{text}</div>
                </div>
              ))}
            </div>

            <div
              className="story-fadeup"
              style={{
                animationDelay: '520ms',
                marginTop: 18,
                borderRadius: 22,
                border: `2px solid ${palette.black}`,
                background: palette.primary,
                color: '#fff',
                padding: '16px 20px',
                boxShadow: '7px 7px 0 rgba(0,0,0,0.12)',
              }}
            >
              <div style={{ fontSize: 25, lineHeight: 1.2, fontWeight: 900 }}>
                只有入圍，沒有得獎；但我開始用「產業」的語言重新檢查自己。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageShell>
);

const NoAwardUntilCrossStrait: Page = () => (
  <PageShell section="Low point" accent={palette.primary} showHeader={false} mode="dark">
    <div
      style={{
        flex: 1,
        position: 'relative',
        minHeight: 0,
        marginTop: 10,
      }}
    >
      <div
        className="story-fadeup"
        style={{
          position: 'absolute',
          inset: '0 0 10px',
          borderRadius: 42,
          border: '2px solid rgba(255,255,255,0.78)',
          background: palette.black,
          overflow: 'hidden',
          boxShadow: '18px 18px 0 rgba(255,61,139,0.2)',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '76px 76px',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: -130,
            bottom: -110,
            width: 480,
            height: 480,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.18)',
            background: 'rgba(197,176,244,0.2)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: -80,
            top: -92,
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: palette.primary,
            border: `2px solid ${palette.black}`,
          }}
        />

        <div
          className="story-fadeup"
          style={{
            animationDelay: '100ms',
            position: 'absolute',
            left: 78,
            top: 78,
            width: 850,
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              borderRadius: 999,
              border: '2px solid rgba(255,255,255,0.62)',
              background: 'rgba(255,255,255,0.08)',
              color: palette.lime,
              fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
              fontSize: 18,
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '14px 18px',
              marginBottom: 34,
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: palette.primary }} />
            no trophy yet
          </div>
          <h1
            style={{
              fontFamily: 'var(--osd-font-display)',
              color: '#fff',
              fontSize: 88,
              lineHeight: 1.02,
              letterSpacing: -1.4,
              fontWeight: 940,
              margin: 0,
            }}
          >
            一直到暑假的
            <br />
            2025 海峽兩岸
            <br />
            青少年創客大賽，
            <br />
            我都沒有得獎。
          </h1>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '220ms',
            position: 'absolute',
            right: 82,
            top: 112,
            width: 420,
            borderRadius: 34,
            border: `2px solid ${palette.black}`,
            background: palette.cream,
            color: palette.black,
            padding: '36px 38px',
            transform: 'rotate(2deg)',
            boxShadow: '12px 12px 0 rgba(255,255,255,0.18)',
          }}
        >
          <div style={{ color: palette.primary, fontSize: 20, lineHeight: 1, fontWeight: 950, letterSpacing: '0.08em', marginBottom: 24 }}>
            SUMMER 2025
          </div>
          <div style={{ fontSize: 44, lineHeight: 1.08, fontWeight: 940, letterSpacing: -0.3 }}>
            不是沒有努力，
            <br />
            是努力還沒有
            <br />
            變成結果。
          </div>
          <div
            style={{
              marginTop: 28,
              borderRadius: 22,
              border: `2px solid ${palette.black}`,
              background: '#fff',
              padding: '20px 22px',
              color: palette.muted,
              fontSize: 25,
              lineHeight: 1.32,
              fontWeight: 720,
            }}
          >
            那段時間最難的是：我已經開始帶人、開始做作品、開始看懂差距，但獎項還是沒有來。
          </div>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '360ms',
            position: 'absolute',
            left: 86,
            bottom: 78,
            right: 88,
            zIndex: 2,
            borderRadius: 34,
            border: '2px solid rgba(255,255,255,0.68)',
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(10px)',
            padding: '28px 34px',
            display: 'grid',
            gridTemplateColumns: '210px 1fr 210px',
            gap: 28,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              color: palette.lime,
              fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
              fontSize: 20,
              lineHeight: 1.2,
              fontWeight: 950,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            what it felt like
          </div>
          <div style={{ color: '#fff', fontSize: 35, lineHeight: 1.32, fontWeight: 780 }}>
            每一次沒有得獎，都像是在問我：你是真的想變強，還是只是想拿一個好看的結果？
          </div>
          <div
            style={{
              justifySelf: 'end',
              borderRadius: 28,
              border: `2px solid ${palette.black}`,
              background: palette.lilac,
              color: palette.black,
              padding: '24px 28px',
              textAlign: 'center',
              fontSize: 30,
              lineHeight: 1.05,
              fontWeight: 950,
              transform: 'rotate(-3deg)',
            }}
          >
            還沒
            <br />
            到終點
          </div>
        </div>
      </div>
    </div>
  </PageShell>
);

const ZhongliClubInterlude: Page = () => (
  <PageShell section="Before departure" accent={palette.primary} showHeader={false} mode="dark">
    <div
      style={{
        flex: 1,
        position: 'relative',
        minHeight: 0,
        marginTop: 10,
      }}
    >
      <div
        className="story-fadeup"
        style={{
          position: 'absolute',
          inset: '0 0 10px',
          borderRadius: 42,
          border: '2px solid rgba(255,255,255,0.72)',
          background:
            'radial-gradient(circle at 16% 24%, rgba(255,61,139,0.42) 0 12%, transparent 24%), radial-gradient(circle at 72% 72%, rgba(212,236,157,0.24) 0 12%, transparent 28%), linear-gradient(135deg, #070707 0%, #181021 48%, #050505 100%)',
          overflow: 'hidden',
          boxShadow: '18px 18px 0 rgba(197,176,244,0.22)',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '62px 62px',
            maskImage: 'linear-gradient(90deg, rgba(0,0,0,0.95), rgba(0,0,0,0.3))',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 58,
            top: 62,
            right: 500,
            height: 3,
            background: `linear-gradient(90deg, ${palette.primary}, ${palette.lime}, transparent)`,
            boxShadow: `0 0 28px ${palette.primary}`,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 92,
            bottom: 66,
            width: 280,
            height: 280,
            borderRadius: '50%',
            border: `2px solid ${palette.lime}`,
            opacity: 0.42,
          }}
        />
        <div
          className="story-fadeup"
          style={{
            animationDelay: '100ms',
            position: 'absolute',
            left: 78,
            top: 92,
            width: 720,
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              borderRadius: 999,
              border: '2px solid rgba(255,255,255,0.58)',
              background: 'rgba(255,255,255,0.1)',
              color: palette.lime,
              fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
              fontSize: 18,
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '14px 18px',
              marginBottom: 34,
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: palette.primary }} />
            plot twist
          </div>
          <h1
            style={{
              fontFamily: 'var(--osd-font-display)',
              color: '#fff',
              fontSize: 86,
              lineHeight: 1.02,
              letterSpacing: -1.6,
              fontWeight: 950,
              margin: 0,
            }}
          >
            去海峽兩岸之前，
            <br />
            我先去了中壢的夜店。
          </h1>
          <div
            style={{
              marginTop: 28,
              display: 'inline-block',
              borderRadius: 28,
              border: `2px solid ${palette.black}`,
              background: palette.primary,
              color: '#fff',
              padding: '18px 28px',
              fontSize: 44,
              lineHeight: 1,
              fontWeight: 950,
              transform: 'rotate(-2deg)',
              boxShadow: '8px 8px 0 rgba(255,255,255,0.18)',
            }}
          >
            看蔡承祐。
          </div>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '240ms',
            position: 'absolute',
            left: 82,
            bottom: 76,
            width: 660,
            borderRadius: 34,
            border: '2px solid rgba(255,255,255,0.62)',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            padding: '26px 30px',
            color: '#fff',
            zIndex: 3,
          }}
        >
          <div style={{ color: palette.lime, fontSize: 19, lineHeight: 1, fontWeight: 950, letterSpacing: '0.1em', marginBottom: 14 }}>
            BEFORE THE NEXT COMPETITION
          </div>
          <div style={{ fontSize: 32, lineHeight: 1.32, fontWeight: 790 }}>
            前一頁很沉重，但真實的暑假其實也不是只有壓力。出發前，我還先跑去中壢，看了一場完全不同的現場。
          </div>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '180ms',
            position: 'absolute',
            right: 90,
            top: 58,
            bottom: 58,
            width: 430,
            zIndex: 4,
          }}
        >
          <div
            style={{
              position: 'relative',
              height: '100%',
              borderRadius: 48,
              border: `3px solid ${palette.black}`,
              background: palette.black,
              padding: 16,
              transform: 'rotate(2.5deg)',
              boxShadow: '20px 20px 0 rgba(212,236,157,0.22), -10px -10px 0 rgba(255,61,139,0.32)',
              overflow: 'hidden',
            }}
          >
            <video
              src={zhongliClubBeforeCrossStrait}
              autoPlay
              muted
              loop
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 34,
                display: 'block',
                filter: 'saturate(1.08) contrast(1.05)',
              }}
            />
            <div
              aria-hidden
              style={{
                position: 'absolute',
                left: 112,
                top: 18,
                right: 112,
                height: 10,
                borderRadius: 999,
                background: '#111',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 30,
                right: 30,
                bottom: 28,
                borderRadius: 24,
                border: '2px solid rgba(255,255,255,0.7)',
                background: 'rgba(0,0,0,0.62)',
                color: '#fff',
                padding: '16px 18px',
                fontSize: 23,
                lineHeight: 1.18,
                fontWeight: 880,
                backdropFilter: 'blur(8px)',
              }}
            >
              還沒得獎，
              <br />
              但人生體驗先拉滿。
            </div>
          </div>
        </div>

        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: 48,
            bottom: 38,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: palette.lime,
            border: `2px solid ${palette.black}`,
            transform: 'rotate(-10deg)',
            zIndex: 2,
          }}
        />
      </div>
    </div>
  </PageShell>
);

const CrossStraitProcess: Page = () => (
  <PageShell section="Cross-strait process" accent={palette.lime} showHeader={false}>
    <div
      style={{
        flex: 1,
        position: 'relative',
        minHeight: 0,
        marginTop: 10,
      }}
    >
      <div
        className="story-fadeup"
        style={{
          position: 'absolute',
          inset: '0 0 10px',
          borderRadius: 42,
          border: `2px solid ${palette.black}`,
          background:
            'linear-gradient(90deg, rgba(0,0,0,0.055) 1px, transparent 1px), linear-gradient(0deg, rgba(0,0,0,0.045) 1px, transparent 1px), linear-gradient(135deg, #fffdf2 0%, #f3f8dc 44%, #f7e8f0 100%)',
          backgroundSize: '48px 48px, 48px 48px, 100% 100%',
          overflow: 'hidden',
          boxShadow: '18px 18px 0 rgba(0,0,0,0.12)',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: -120,
            top: -90,
            width: 430,
            height: 430,
            borderRadius: '50%',
            background: palette.lilac,
            border: `2px solid ${palette.black}`,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 720,
            bottom: -120,
            width: 390,
            height: 390,
            borderRadius: '50%',
            background: palette.primary,
            border: `2px solid ${palette.black}`,
          }}
        />

        <div
          className="story-fadeup"
          style={{
            animationDelay: '100ms',
            position: 'absolute',
            left: 74,
            top: 74,
            width: 560,
            zIndex: 3,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              borderRadius: 999,
              border: `2px solid ${palette.black}`,
              background: '#fff',
              color: palette.primary,
              fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
              fontSize: 18,
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
              padding: '14px 18px',
              boxShadow: '6px 6px 0 rgba(0,0,0,0.1)',
              marginBottom: 30,
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: palette.lime }} />
            finally on the way
          </div>
          <h1
            style={{
              fontFamily: 'var(--osd-font-display)',
              color: palette.black,
              fontSize: 74,
              lineHeight: 1.03,
              letterSpacing: -1.4,
              fontWeight: 950,
              margin: 0,
            }}
          >
            然後，
            <br />
            我們真的開始
            <br />
            走進這場比賽。
          </h1>
          <p
            style={{
              margin: '26px 0 0',
              color: palette.muted,
              fontSize: 30,
              lineHeight: 1.38,
              fontWeight: 720,
            }}
          >
            從集合、移動、抵達，到把逢甲的旗子拿出來，那一刻才真的有「我們是代表學校來的」感覺。
          </p>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '240ms',
            position: 'absolute',
            left: 74,
            bottom: 70,
            width: 610,
            zIndex: 4,
            borderRadius: 30,
            border: `2px solid ${palette.black}`,
            background: palette.black,
            color: '#fff',
            padding: '24px 28px',
            boxShadow: '10px 10px 0 rgba(255,61,139,0.18)',
          }}
        >
          <div style={{ color: palette.lime, fontSize: 18, lineHeight: 1, fontWeight: 950, letterSpacing: '0.1em', marginBottom: 14 }}>
            PROCESS, NOT JUST RESULT
          </div>
          <div style={{ fontSize: 32, lineHeight: 1.32, fontWeight: 820 }}>
            這段不是只有比賽結果，而是從出發開始，就一步一步把自己放進更大的現場。
          </div>
        </div>

        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 650,
            top: 128,
            width: 500,
            height: 3,
            background: palette.black,
            transform: 'rotate(18deg)',
            zIndex: 1,
          }}
        />
        {[
          { text: '集合', left: 660, top: 100, color: palette.lime },
          { text: '移動', left: 855, top: 174, color: palette.primary },
          { text: '抵達', left: 1056, top: 250, color: palette.lilac },
        ].map((step, index) => (
          <div
            key={step.text}
            className="story-fadeup"
            style={{
              animationDelay: `${320 + index * 80}ms`,
              position: 'absolute',
              left: step.left,
              top: step.top,
              zIndex: 4,
              borderRadius: 999,
              border: `2px solid ${palette.black}`,
              background: step.color,
              color: palette.black,
              padding: '12px 18px',
              fontSize: 22,
              lineHeight: 1,
              fontWeight: 950,
              boxShadow: '5px 5px 0 rgba(0,0,0,0.14)',
            }}
          >
            {step.text}
          </div>
        ))}

        <div
          className="story-fadeup"
          style={{
            animationDelay: '180ms',
            position: 'absolute',
            right: 82,
            top: 66,
            width: 550,
            height: 330,
            zIndex: 3,
            borderRadius: 34,
            border: `2px solid ${palette.black}`,
            background: '#fff',
            padding: 14,
            transform: 'rotate(1.5deg)',
            boxShadow: '13px 13px 0 rgba(0,0,0,0.12)',
          }}
        >
          <img
            src={crossStraitProcessFlag}
            alt="拿著逢甲大學旗幟準備出發"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 42%', borderRadius: 24, display: 'block' }}
          />
          <div
            style={{
              position: 'absolute',
              left: 32,
              top: 28,
              borderRadius: 999,
              border: `2px solid ${palette.black}`,
              background: '#fff',
              padding: '10px 14px',
              fontSize: 18,
              lineHeight: 1,
              fontWeight: 950,
              boxShadow: '4px 4px 0 rgba(0,0,0,0.12)',
            }}
          >
            帶著逢甲一起出發
          </div>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '300ms',
            position: 'absolute',
            right: 128,
            bottom: 58,
            width: 420,
            height: 300,
            zIndex: 5,
            borderRadius: 32,
            border: `2px solid ${palette.black}`,
            background: '#fff',
            padding: 13,
            transform: 'rotate(-4deg)',
            boxShadow: '12px 12px 0 rgba(197,176,244,0.36)',
          }}
        >
          <img
            src={crossStraitProcessShip}
            alt="旅程途中看到的船"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 54%', borderRadius: 22, display: 'block' }}
          />
          <div
            style={{
              position: 'absolute',
              right: -34,
              top: 34,
              borderRadius: 20,
              border: `2px solid ${palette.black}`,
              background: palette.lime,
              color: palette.black,
              padding: '16px 18px',
              fontSize: 24,
              lineHeight: 1.12,
              fontWeight: 950,
              transform: 'rotate(8deg)',
              boxShadow: '6px 6px 0 rgba(0,0,0,0.14)',
            }}
          >
            途中也在
            <br />
            收集經驗
          </div>
        </div>
      </div>
    </div>
  </PageShell>
);

const CrossStraitBestRecommendation: Page = () => (
  <PageShell section="Best recommendation" accent={palette.lime} showHeader={false}>
    <div
      style={{
        flex: 1,
        position: 'relative',
        minHeight: 0,
        marginTop: 10,
      }}
    >
      <div
        className="story-fadeup"
        style={{
          position: 'absolute',
          inset: '0 0 10px',
          borderRadius: 42,
          border: `2px solid ${palette.black}`,
          background:
            'radial-gradient(circle at 18px 18px, rgba(0,0,0,0.07) 1.6px, transparent 1.6px), linear-gradient(135deg, #fff 0%, #dceeb1 45%, #efd4d4 100%)',
          backgroundSize: '34px 34px, 100% 100%',
          overflow: 'hidden',
          boxShadow: '18px 18px 0 rgba(0,0,0,0.12)',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: -90,
            top: -80,
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: palette.primary,
            border: `2px solid ${palette.black}`,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 660,
            bottom: -70,
            width: 640,
            height: 150,
            borderRadius: 999,
            background: palette.lilac,
            border: `2px solid ${palette.black}`,
            transform: 'rotate(-4deg)',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: -80,
            bottom: 102,
            width: 250,
            height: 250,
            borderRadius: '50%',
            background: palette.cream,
            border: `2px solid ${palette.black}`,
          }}
        />

        <div
          className="story-fadeup"
          style={{
            animationDelay: '80ms',
            position: 'absolute',
            left: 74,
            top: 72,
            width: 760,
            zIndex: 2,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              borderRadius: 999,
              border: `2px solid ${palette.black}`,
              background: palette.black,
              color: palette.lime,
              fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
              fontSize: 18,
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '14px 18px',
              marginBottom: 34,
              boxShadow: '7px 7px 0 rgba(255,61,139,0.24)',
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: palette.primary }} />
            highly recommended
          </div>
          <h1
            style={{
              fontFamily: 'var(--osd-font-display)',
              color: palette.black,
              fontSize: 86,
              lineHeight: 1.02,
              letterSpacing: -1.3,
              fontWeight: 940,
              margin: 0,
            }}
          >
            但身為逢甲人，
            <br />
            我真的最推薦
            <br />
            這個活動。
          </h1>
          <p
            style={{
              margin: '30px 0 0',
              maxWidth: 660,
              color: palette.muted,
              fontSize: 32,
              lineHeight: 1.36,
              fontWeight: 720,
            }}
          >
            2025 海峽兩岸青少年創客大賽，不只是比賽。它更像是一段把創作、交流、旅行和團隊記憶全部混在一起的經驗。
          </p>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '170ms',
            position: 'absolute',
            right: 78,
            top: 88,
            width: 560,
            height: 690,
            zIndex: 2,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '30px 26px 36px 0',
              borderRadius: 34,
              border: `2px solid ${palette.black}`,
              background: palette.black,
              transform: 'rotate(3deg)',
              boxShadow: '12px 12px 0 rgba(0,0,0,0.14)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: '0 0 64px 54px',
              borderRadius: 34,
              border: `2px solid ${palette.black}`,
              background: '#fff',
              transform: 'rotate(-2deg)',
              padding: '34px 36px',
              boxShadow: '12px 12px 0 rgba(255,61,139,0.22)',
            }}
          >
            <div
              style={{
                color: palette.primary,
                fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
                fontSize: 17,
                lineHeight: 1,
                fontWeight: 950,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 22,
              }}
            >
              why I recommend it
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              {[
                ['不是只有比賽', '你會真的跟一群人熬、討論、做東西。'],
                ['不是只有作品', '它會把你帶到不同場域，看到不同人的想法。'],
                ['不是只有結果', '就算沒有得獎，那段經驗也會留下來。'],
                ['真的很逢甲', '它把資源、同學、老師和機會串在一起。'],
              ].map(([title, text], i) => (
                <div
                  key={title}
                  className="story-fadeup"
                  style={{
                    animationDelay: `${270 + i * 70}ms`,
                    borderRadius: 22,
                    border: `2px solid ${palette.black}`,
                    background: [palette.lime, palette.cream, palette.lilac, palette.pink][i],
                    padding: '19px 22px',
                    boxShadow: '6px 6px 0 rgba(0,0,0,0.1)',
                  }}
                >
                  <div style={{ color: palette.black, fontSize: 28, lineHeight: 1.05, fontWeight: 950, marginBottom: 9 }}>
                    {title}
                  </div>
                  <div style={{ color: palette.muted, fontSize: 22, lineHeight: 1.3, fontWeight: 720 }}>{text}</div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="story-fadeup"
            style={{
              animationDelay: '580ms',
              position: 'absolute',
              right: 16,
              bottom: 0,
              borderRadius: 999,
              border: `2px solid ${palette.black}`,
              background: palette.primary,
              color: '#fff',
              padding: '18px 26px',
              fontSize: 31,
              lineHeight: 1,
              fontWeight: 950,
              transform: 'rotate(3deg)',
              boxShadow: '8px 8px 0 rgba(0,0,0,0.14)',
            }}
          >
            逢甲人，很值得去一次
          </div>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '320ms',
            position: 'absolute',
            left: 86,
            bottom: 70,
            width: 660,
            zIndex: 2,
            borderRadius: 32,
            border: `2px solid ${palette.black}`,
            background: palette.black,
            color: '#fff',
            padding: '28px 34px',
            boxShadow: '12px 12px 0 rgba(255,255,255,0.5)',
          }}
        >
          <div style={{ color: palette.lime, fontSize: 20, fontWeight: 950, letterSpacing: '0.08em', marginBottom: 14 }}>
            THE POINT
          </div>
          <div style={{ fontSize: 35, lineHeight: 1.3, fontWeight: 830 }}>
            它沒有給我獎項，但它給我的東西，比獎項更像一段會一直記得的經驗。
          </div>
        </div>
      </div>
    </div>
  </PageShell>
);

const ClosingDream: Page = () => (
  <PageShell section="Closing" accent={palette.primary} showHeader={false}>
    <div
      style={{
        flex: 1,
        position: 'relative',
        minHeight: 0,
        marginTop: 10,
      }}
    >
      <div
        className="story-fadeup"
        style={{
          position: 'absolute',
          inset: '0 0 10px',
          borderRadius: 42,
          border: `2px solid ${palette.black}`,
          background:
            'linear-gradient(90deg, rgba(0,0,0,0.055) 1px, transparent 1px), linear-gradient(0deg, rgba(0,0,0,0.045) 1px, transparent 1px), linear-gradient(135deg, #fffdf6 0%, #f6f0ff 52%, #f0ffd2 100%)',
          backgroundSize: '52px 52px, 52px 52px, 100% 100%',
          overflow: 'hidden',
          boxShadow: '18px 18px 0 rgba(0,0,0,0.12)',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: -100,
            top: -110,
            width: 410,
            height: 410,
            borderRadius: '50%',
            background: palette.primary,
            border: `2px solid ${palette.black}`,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: -90,
            bottom: -130,
            width: 430,
            height: 430,
            borderRadius: '50%',
            background: palette.lime,
            border: `2px solid ${palette.black}`,
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: 210,
            bottom: 80,
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: palette.lilac,
            border: `2px solid ${palette.black}`,
            transform: 'rotate(8deg)',
          }}
        />

        <div
          className="story-fadeup"
          style={{
            animationDelay: '100ms',
            position: 'absolute',
            left: 82,
            top: 76,
            right: 82,
            zIndex: 3,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              borderRadius: 999,
              border: `2px solid ${palette.black}`,
              background: palette.black,
              color: palette.lime,
              fontFamily: '"SF Mono", "Figma Mono", ui-monospace, monospace',
              fontSize: 18,
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '14px 18px',
              marginBottom: 34,
              boxShadow: '7px 7px 0 rgba(255,61,139,0.22)',
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: palette.primary }} />
            back to the first question
          </div>
          <h1
            style={{
              fontFamily: 'var(--osd-font-display)',
              color: palette.black,
              fontSize: 92,
              lineHeight: 1.01,
              letterSpacing: -1.7,
              fontWeight: 950,
              margin: 0,
              maxWidth: 1120,
            }}
          >
            所以，夢想不是一開始就知道。
            <br />
            是做著做著，才慢慢變清楚。
          </h1>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '230ms',
            position: 'absolute',
            left: 88,
            bottom: 86,
            width: 760,
            zIndex: 4,
            borderRadius: 34,
            border: `2px solid ${palette.black}`,
            background: '#fff',
            padding: '32px 36px',
            boxShadow: '12px 12px 0 rgba(0,0,0,0.12)',
          }}
        >
          <div style={{ color: palette.primary, fontSize: 20, lineHeight: 1, fontWeight: 950, letterSpacing: '0.09em', marginBottom: 18 }}>
            WHAT I WANT TO LEAVE WITH YOU
          </div>
          <div style={{ color: palette.black, fontSize: 37, lineHeight: 1.32, fontWeight: 850 }}>
            如果現在還不知道自己要去哪裡，也沒關係。先把眼前的機會接住，先讓自己進到現場，經驗會慢慢把方向推近。
          </div>
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '320ms',
            position: 'absolute',
            right: 88,
            bottom: 92,
            width: 360,
            zIndex: 5,
            display: 'grid',
            gap: 16,
          }}
        >
          {[
            ['01', '先參與', palette.lime],
            ['02', '先累積', palette.cream],
            ['03', '再回答', palette.pink],
          ].map(([num, label, color], index) => (
            <div
              key={num}
              className="story-fadeup"
              style={{
                animationDelay: `${380 + index * 80}ms`,
                borderRadius: 26,
                border: `2px solid ${palette.black}`,
                background: color,
                color: palette.black,
                padding: '22px 26px',
                boxShadow: '7px 7px 0 rgba(0,0,0,0.12)',
                transform: `rotate(${[-2, 1, -1][index]}deg)`,
                display: 'flex',
                alignItems: 'center',
                gap: 18,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: `2px solid ${palette.black}`,
                  background: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 19,
                  lineHeight: 1,
                  fontWeight: 950,
                }}
              >
                {num}
              </div>
              <div style={{ fontSize: 34, lineHeight: 1, fontWeight: 950 }}>{label}</div>
            </div>
          ))}
        </div>

        <div
          className="story-fadeup"
          style={{
            animationDelay: '520ms',
            position: 'absolute',
            right: 82,
            top: 74,
            zIndex: 4,
            borderRadius: 28,
            border: `2px solid ${palette.black}`,
            background: palette.black,
            color: '#fff',
            padding: '20px 26px',
            fontSize: 31,
            lineHeight: 1,
            fontWeight: 950,
            transform: 'rotate(3deg)',
            boxShadow: '8px 8px 0 rgba(255,255,255,0.5)',
          }}
        >
          謝謝大家
        </div>
      </div>
    </div>
  </PageShell>
);

export const notes: (string | undefined)[] = [
  '開場先停一下，微笑，說明這不是成功學演講，而是蔡承曄真實的故事。暱稱放到下一頁再講，首頁保持乾淨。',
  '這頁用 60 到 90 秒介紹自己。重點帶過資訊三乙、iOS Club 9th 社長、10th 顧問，以及 GDG on Campus Associated Lead。',
  '用「你的夢想是什麼？」開場。重點不是立刻給出標準答案，而是承認以前的你也答不出來，接著說這場分享會帶大家看見：夢想是怎麼在嘗試、失敗、被信任和重新選擇裡慢慢變成方向。',
  '快速帶過四段，不要講太細。這頁的任務是讓聽眾知道接下來會去哪裡。',
  '這頁先用反差感補身世背景：你來自至善國中體育班。重點不是說體育班讓你比較特別，而是讓同學驚訝你不是一開始就在資訊路上，接著帶到普通起點也能慢慢轉向。',
  '這頁要 focus 在「高中社團是同人社」這件事。先讓大家感受到反差：它不是資訊社、不是競賽隊，而是現代視覺文化同人社；這段不一定直接變成成果，但是真實代表你的好奇和喜歡。',
  '這頁講四個看起來不相關的嘗試：YouTuber、陪玩師、模特、麥當勞店員。重點不是它們直接變成現在成果，而是你因為好奇，所以一直願意嘗試不同角色。',
  '這頁是經歷牆，不要逐條念完。讓大家先看到現在的你有很多競賽、開發、幹部、助教、講座、社群和證照經驗，再接下一頁：究竟是什麼讓你變成這個樣子？',
  '這頁是轉場。說明接下來不要直接從現在講，而是先倒回大一，從還不知道自己能做什麼的狀態開始介紹。',
  '這頁一定要換成你的真實轉折事件。老師通常最想聽這裡。',
  '講第一個小行動。重點是不要把自己講成突然變強，而是慢慢開始。',
  '分享這次得獎事蹟。不要只講冠軍，要把重點拉回「我一開始只是想幫上忙，後來發現自己真的在團隊裡有位置」。',
  '講學長問你要不要當隊長。這頁不要把自己講成很有自信，而是講「被信任」其實也會帶來壓力。',
  '講你怎麼開始扛責任。重點不是證明自己很強，而是說明你開始理解「負責」不是自己全部做完。',
  '講分工之後的下一層：隊長不是什麼都自己做，但要知道全局。每一塊未必要親自做，可是目標、進度、風險都不能完全不知道。',
  '講真正開始帶隊後的混亂期。重點不是賣慘，而是承認卡住、比較、重來都會同時發生，然後才慢慢把亂掉的地方接起來。',
  '講比賽低谷期。重點放在「只要是我帶隊的競賽，連續兩場都沒有得獎，甚至連決賽都沒有入圍」，讓觀眾感受到責任感和自我懷疑。',
  '講低谷後仍持續努力。重點不是硬撐，而是過程中一直學到新東西、新想法，所以想把學到的東西展現出來，讓大家知道自己做得到。',
  '講 MAIC 行動應用創新賽的轉折。這頁重點是主動性：換了新團隊後，主動跟學長說想當隊長，也主動說這次想自己寫程式試試看。',
  '講高頻開會的節奏。重點是你跟學長姐提議每 1-2 天開一次會，因為你相信會得獎的作品背後一定要付出極大的努力。',
  '講 MAIC 的成果。重點不是把三等獎講成終點，而是說明前面那些高頻開會、主動學習、瘋狂參與，終於變成看得見的結果。',
  '講得獎後的不滿足。重點是你沒有停在三等獎，而是在比賽中主動交流、聽別人的作品、追問細節技術，因為你想了解更多、變得更強。',
  '講活動狂刷期。重點不是為了堆履歷，而是只要跟比賽有關就去參與，從講座、工作坊、分享和討論裡補方法、補想法。',
  '講那年暑假的兩場競賽撞期。重點是 MAIC 和海峽兩岸青少年創客大賽時間衝突，同學已經先飛到上海，而你晚幾天，只和同隊夥伴一起飛過去接下一場。',
  '停一下，讓這句話單獨成立：這是我第一次出國。不要急著解釋，讓觀眾先感受到這件事對你來說很大。',
  '這頁把氣氛放輕一點：雖然名義上是出國競賽，但第一次出國、跟同學一起飛、一起走行程，實際上也很像一趟同學旅行。',
  '講這趟旅程的荒謬感：學長姐常說畢業旅行才會出國，但你們大一就因為競賽，先體驗了一把像畢業旅行的行程。',
  '講心態鬆動的瞬間：以前覺得競賽一定要很緊繃、很嚴肅，但這次才發現，認真做作品的同時也可以很開心。',
  '轉到大二後的社團教學長故事。重點是每週都要交出一堂課，而且不是有講就好，而是內容、實作、節奏和品質都要被要求。',
  '講教學長不只是上課，還要一起辦活動。重點放在社團營運：企劃、宣傳、流程、控場、復盤都要有人接住，這也是第一次理解社團是在經營一個社群。',
  '講半逢遇甲。重點是你不只是辦活動，也開始把逢甲學生每天會遇到的校務、課表、iLearn、車位、作業提醒等需求，做成一個真的有人下載使用的校園資訊整合 App。',
  '講 2025 第21屆全國電子設計創意競賽。重點不是只講獎項，而是說明你開始帶著學弟妹進入競賽，從被學長帶著做事，變成自己要帶下一批人一起上場。',
  '講 Google APAC 競賽。重點放在舞台變大：這不是單純把作品丟出去，而是第一次很明確地把學弟妹帶到更大的競賽尺度，讓整個團隊一起被看見、一起被檢視。',
  '講經濟部競賽。重點放在現場觀察：你同時看見產業組和學生組的作品，才理解作品成熟度不只在功能，而是在場域、成本、導入、維運和說服力。補一句：這次只有入圍，沒有得獎，但它讓你看懂差距。',
  '講一路到暑假的 2025 海峽兩岸青少年創客大賽，你都沒有得獎。重點不是賣慘，而是讓觀眾感受到：你已經開始帶人、開始做作品、開始看懂差距，但成果還沒有立刻出現。',
  '講去海峽兩岸之前的中壢夜店插曲。這頁讓氣氛從低谷稍微放鬆，重點是故事真實感：沒有得獎的暑假也不是只有痛苦，還有朋友、現場和一些很荒謬但會記得的瞬間。',
  '講海峽兩岸青少年創客大賽的出發過程。重點是從集合、移動、抵達，到拿出逢甲旗幟的那一刻，讓觀眾感覺你不是只去參加一場比賽，而是代表一個團隊和學校走進更大的現場。',
  '結尾回扣第 3 頁的問題：你的夢想是什麼？重點不是把夢想講成一開始就知道的答案，而是說它會在參與、累積、失敗和重新選擇的過程中慢慢變清楚。最後用「先參與、先累積、再回答」收束。',
];

export const meta: SlideMeta = {
  title: '沒有什麼可以取代經驗：30 分鐘分享（Figma 版）',
  createdAt: '2026-05-22T19:45:00+08:00',
};

export default [
  Cover,
  AboutMe,
  Promise,
  Roots,
  HighSchoolClub,
  ThreeWords,
  ExperienceWall,
  FreshmanIntro,
  TurningPoint,
  TheCall,
  FirstStep,
  AwardMoment,
  CaptainQuestion,
  TakingResponsibility,
  FullContextCaptain,
  MessyMiddle,
  CompetitionLowPoint,
  KeepLearning,
  MaicDecision,
  MeetingCadence,
  MaicThirdPrize,
  HungryAfterAward,
  ActivityHunt,
  SummerScheduleClash,
  FirstTimeAbroad,
  AbroadWithFriends,
  EarlyGraduationTrip,
  ContestCanBeFun,
  WeeklyTeachingLead,
  BeyondWeeklyClass,
  HalfFcuTopia,
  Nedcc2025LeadingJuniors,
  GoogleApacCompetition,
  MoeaCompetition,
  NoAwardUntilCrossStrait,
  ZhongliClubInterlude,
  CrossStraitProcess,
  ClosingDream,
] satisfies Page[];
