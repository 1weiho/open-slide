import type { DesignSystem, Page, SlideMeta, SlideTransition } from '@open-slide/core';
import type { CSSProperties, ReactNode } from 'react';
import adminIpadShelvingUi from './assets/admin-ipad-shelving-ui.png';
import demoSupplement01 from './assets/demo-supplement-01.mp4';
import demoSupplement02 from './assets/demo-supplement-02.mp4';
import demoSupplement03 from './assets/demo-supplement-03.mp4';
import demoSupplement04 from './assets/demo-supplement-04.mp4';
import hardwareModelImage from './assets/hardware-3d-model.png';
import hardwareWiringImage from './assets/hardware-wiring.png';
import normalPickupDemoVideo from './assets/normal-pickup-demo.mp4';
import packageListUi from './assets/package-list-ui.png';
import pickupDetailUi from './assets/pickup-detail-ui.png';

export const design: DesignSystem = {
  palette: { bg: '#000000', text: '#ffffff', accent: '#76b900' },
  fonts: {
    display:
      '"NVIDIA-EMEA", "Noto Sans TC", "PingFang TC", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    body: '"NVIDIA-EMEA", "Noto Sans TC", "PingFang TC", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },
  typeScale: { hero: 92, body: 28 },
  radius: 2,
};

const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';

export const transition: SlideTransition = {
  duration: 260,
  exit: {
    duration: 150,
    easing: EASE_IN,
    keyframes: [
      { opacity: 1, transform: 'translateY(0) scale(1)' },
      { opacity: 0, transform: 'translateY(-6px) scale(0.995)' },
    ],
  },
  enter: {
    duration: 260,
    delay: 70,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(10px) scale(0.992)', filter: 'blur(3px)' },
      { opacity: 1, transform: 'translateY(0) scale(1)', filter: 'blur(0)' },
    ],
  },
};

const palette = {
  navy: '#000000',
  navy2: '#1a1a1a',
  panel: '#ffffff',
  panelSoft: '#f7f7f7',
  text: '#ffffff',
  ink: '#000000',
  muted: '#757575',
  line: '#cccccc',
  cyan: '#76b900',
  cyanSoft: '#bff230',
  blue: '#0046a4',
  warning: '#df6500',
  danger: '#e52020',
};

const fontFamily =
  '"NVIDIA-EMEA", "Noto Sans TC", "PingFang TC", -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const pageBase: CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  background: palette.navy,
  color: palette.text,
  fontFamily,
  padding: '72px 92px',
};

const lightPage: CSSProperties = {
  ...pageBase,
  background: '#ffffff',
  color: palette.ink,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 58,
  fontWeight: 820,
  lineHeight: 1.12,
  letterSpacing: 0,
};

const eyebrowStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: palette.cyan,
};

const smallCaps: CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
};

const motionIn = (delay = 0): CSSProperties => ({
  animation: 'smartMotionIn 620ms cubic-bezier(0.22, 1, 0.36, 1) both',
  animationDelay: `${delay}ms`,
});

const DeckMotionStyle = () => (
  <style>{`
@keyframes smartMotionIn {
  from { opacity: 0; transform: translateY(18px); filter: blur(3px); }
  to { opacity: 1; transform: translateY(0); filter: blur(0); }
}

@keyframes smartMotionFade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    transition-duration: 1ms !important;
  }
}
`}</style>
);

const Header = ({
  section,
  title,
  dark = false,
}: {
  section: string;
  title: string;
  dark?: boolean;
}) => (
  <div style={{ display: 'grid', gap: 14, ...motionIn(40) }}>
    <div style={eyebrowStyle}>{section}</div>
    <h1 style={{ ...titleStyle, color: dark ? palette.text : palette.ink }}>{title}</h1>
  </div>
);

const Footer = ({ page, dark = false }: { page: string; dark?: boolean }) => (
  <>
    <DeckMotionStyle />
    <div
      style={{
        position: 'absolute',
        left: 92,
        right: 92,
        bottom: 38,
        display: 'flex',
        justifyContent: 'space-between',
        color: dark ? 'rgba(255, 255, 255, 0.56)' : palette.muted,
        fontSize: 17,
        fontWeight: 700,
        letterSpacing: '0.06em',
        animation: 'smartMotionFade 560ms ease-out 460ms both',
      }}
    >
      <span>Smart City Package Logistics Management System</span>
      <span>{page} / 22</span>
    </div>
  </>
);

const Panel = ({
  children,
  style,
  dark = false,
}: {
  children: ReactNode;
  style?: CSSProperties;
  dark?: boolean;
}) => (
  <div
    style={{
      border: `1px solid ${dark ? 'rgba(118, 185, 0, 0.42)' : palette.line}`,
      borderRadius: 2,
      background: dark ? palette.navy2 : palette.panel,
      boxShadow: 'none',
      ...motionIn(160),
      ...style,
    }}
  >
    {children}
  </div>
);

const BulletList = ({ items, dark = false }: { items: string[]; dark?: boolean }) => (
  <div style={{ display: 'grid', gap: 16 }}>
    {items.map((item, index) => (
      <div
        key={item}
        style={{
          display: 'flex',
          gap: 14,
          alignItems: 'flex-start',
          ...motionIn(180 + index * 70),
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            marginTop: 13,
            borderRadius: 999,
            background: palette.cyan,
            boxShadow: 'none',
            flex: '0 0 auto',
          }}
        />
        <span
          style={{
            fontSize: 27,
            lineHeight: 1.42,
            color: dark ? 'rgba(255, 255, 255, 0.82)' : palette.ink,
          }}
        >
          {item}
        </span>
      </div>
    ))}
  </div>
);

const CircuitBackdrop = () => (
  <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.34 }}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'none',
        backgroundSize: '72px 72px',
        borderTop: `1px solid ${palette.cyan}`,
        borderBottom: `1px solid ${palette.cyan}`,
      }}
    />
  </div>
);

const CityGraphic = ({ compact = false }: { compact?: boolean }) => (
  <svg
    viewBox="0 0 900 520"
    role="img"
    aria-label="智慧城市物流節點示意"
    style={{ width: '100%', height: '100%' }}
  >
    <defs>
      <linearGradient id="cityGlow" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stopColor="#76b900" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#0046a4" stopOpacity="0.95" />
      </linearGradient>
      <filter id="softGlow">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <path
      d="M55 405 C210 320 315 444 450 350 S710 284 845 360"
      fill="none"
      stroke="#76b900"
      strokeWidth="5"
    />
    <path d="M70 420 L830 420" stroke="#8eb5c1" strokeOpacity="0.32" strokeWidth="3" />
    {[
      [110, 265, 78, 155],
      [205, 215, 70, 205],
      [300, 250, 92, 170],
      [430, 180, 84, 240],
      [545, 235, 74, 185],
      [650, 205, 86, 215],
      [765, 270, 66, 150],
    ].map(([x, y, w, h]) => (
      <g key={`${x}-${y}`}>
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx="2"
          fill="#123451"
          stroke="#8eb5c1"
          strokeOpacity="0.42"
        />
        {[0, 1, 2].map((row) =>
          [0, 1].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={x + 18 + col * 28}
              y={y + 26 + row * 34}
              width="12"
              height="14"
              rx="2"
              fill="#bff7ed"
              opacity="0.58"
            />
          )),
        )}
      </g>
    ))}
    <g filter="url(#softGlow)">
      {[
        [154, 332, '住宅'],
        [340, 378, '校園'],
        [520, 315, '商辦'],
        [708, 288, '站點'],
      ].map(([x, y, label]) => (
        <g key={label}>
          <circle cx={x} cy={y} r="18" fill="url(#cityGlow)" />
          <circle
            cx={x}
            cy={y}
            r="36"
            fill="none"
            stroke="#76b900"
            strokeOpacity="0.22"
            strokeWidth="4"
          />
          {!compact && (
            <text
              x={x}
              y={Number(y) - 48}
              fill="#ffffff"
              fontSize="24"
              fontWeight="800"
              textAnchor="middle"
            >
              {label}
            </text>
          )}
        </g>
      ))}
    </g>
    <g transform="translate(392 88)">
      <rect x="0" y="0" width="130" height="86" rx="18" fill="#ffffff" opacity="0.92" />
      <path
        d="M28 58 C36 32 92 32 102 58"
        fill="none"
        stroke="#1a1a1a"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <circle cx="40" cy="58" r="7" fill="#76b900" />
      <circle cx="90" cy="58" r="7" fill="#76b900" />
      <text x="65" y="30" fill="#1a1a1a" fontSize="16" fontWeight="900" textAnchor="middle">
        CLOUD
      </text>
    </g>
    <g transform="translate(103 405)">
      <rect x="0" y="0" width="150" height="48" rx="2" fill="#76b900" />
      <rect x="100" y="-26" width="54" height="74" rx="2" fill="#0046a4" />
      <circle cx="32" cy="54" r="14" fill="#000000" />
      <circle cx="126" cy="54" r="14" fill="#000000" />
      <rect x="18" y="12" width="44" height="24" rx="4" fill="#000000" opacity="0.72" />
    </g>
  </svg>
);

const Icon = ({
  name,
  color = palette.cyan,
}: {
  name: 'box' | 'clock' | 'search' | 'lock' | 'chart' | 'bell';
  color?: string;
}) => {
  const common = {
    fill: 'none',
    stroke: color,
    strokeWidth: 6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <svg viewBox="0 0 96 96" aria-hidden style={{ width: 58, height: 58 }}>
      {name === 'box' && (
        <>
          <path d="M18 32 L48 16 L78 32 L48 48 Z" {...common} />
          <path d="M18 32 V66 L48 82 L78 66 V32" {...common} />
          <path d="M48 48 V82" {...common} />
        </>
      )}
      {name === 'clock' && (
        <>
          <circle cx="48" cy="48" r="32" {...common} />
          <path d="M48 28 V50 L62 60" {...common} />
        </>
      )}
      {name === 'search' && (
        <>
          <circle cx="42" cy="42" r="24" {...common} />
          <path d="M60 60 L78 78" {...common} />
        </>
      )}
      {name === 'lock' && (
        <>
          <rect x="22" y="42" width="52" height="36" rx="2" {...common} />
          <path d="M34 42 V32 C34 22 42 16 48 16 S62 22 62 32 V42" {...common} />
        </>
      )}
      {name === 'chart' && (
        <>
          <path d="M18 76 H80" {...common} />
          <path d="M24 66 V48" {...common} />
          <path d="M44 66 V30" {...common} />
          <path d="M64 66 V20" {...common} />
        </>
      )}
      {name === 'bell' && (
        <>
          <path d="M28 64 H68 L62 54 V40 C62 28 56 20 48 20 S34 28 34 40 V54 Z" {...common} />
          <path d="M42 72 C45 78 51 78 54 72" {...common} />
        </>
      )}
    </svg>
  );
};

const Cover: Page = () => (
  <div style={{ ...pageBase, padding: '62px 84px' }}>
    <DeckMotionStyle />
    <CircuitBackdrop />
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        display: 'grid',
        gridTemplateColumns: '0.92fr 1.08fr',
        gap: 56,
        height: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingLeft: 20,
          ...motionIn(60),
        }}
      >
        <div style={{ ...eyebrowStyle, marginBottom: 28 }}>智慧城市應用｜期末報告</div>
        <h1
          style={{ margin: 0, fontSize: 84, lineHeight: 1.08, letterSpacing: 0, fontWeight: 860 }}
        >
          智慧城市
          <br />
          包裹物流管理系統
        </h1>
        <div
          style={{
            marginTop: 24,
            fontSize: 31,
            lineHeight: 1.36,
            color: palette.cyanSoft,
            fontWeight: 760,
          }}
        >
          Smart City Package Logistics Management System
        </div>
        <p
          style={{
            margin: '28px 0 0',
            maxWidth: 980,
            fontSize: 25,
            lineHeight: 1.42,
            color: 'rgba(255, 255, 255, 0.76)',
            whiteSpace: 'nowrap',
          }}
        >
          以物聯網技術打造可感測、可追蹤、可管理的城市級取件服務。
        </p>
        <div
          style={{
            marginTop: 44,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 14,
            maxWidth: 780,
            color: 'rgba(255, 255, 255, 0.78)',
            fontSize: 21,
          }}
        >
          {[
            '課程名稱：智慧物聯網實務應用',
            '成員：蔡承曄、陳冠羽、葉韋坪、黃彥閔、林楷祐',
            '指導老師：何丞堯、林佩蓉',
            '報告日期：5/28',
          ].map((item) => (
            <div
              key={item}
              style={{
                borderTop: '1px solid rgba(118, 185, 0, 0.24)',
                paddingTop: 14,
                lineHeight: 1.34,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: 'relative', minHeight: 820, ...motionIn(180) }}>
        <CityGraphic />
      </div>
    </div>
  </div>
);

const Demand: Page = () => {
  const needs = [
    '集合住宅包裹收受管理，已成為維護社區安全與居住品質的重要機制。',
    '基本工資調升與物管勞動力短缺，使中小型社區承受更高財務壓力。',
    '夜間保全編制被迫縮減，無人值守時段形成包裹管理安全缺口。',
    '末端包裹收發高頻且重複，成為第一線物管人力短缺下的營運瓶頸。',
    '本研究與華岡保全合作，鎖定低建置門檻、高部署彈性的智慧化方案。',
  ];
  const options = [
    ['人工代收', '效率低、仰賴人力', palette.warning],
    ['智慧包裹櫃', '月費約 6.9 至 9.8 萬元，材積彈性低', palette.blue],
    ['開放儲物間', '成本低，但隱私、誤領與失竊風險高', palette.danger],
  ];

  return (
    <div style={lightPage}>
      <Header
        section="01 Application Needs"
        title="應用需求：集合住宅與物管人力壓力，使包裹收受成為營運瓶頸"
      />
      <div
        style={{
          marginTop: 44,
          display: 'grid',
          gridTemplateColumns: '0.98fr 1.02fr',
          gap: 34,
          alignItems: 'stretch',
        }}
      >
        <Panel style={{ padding: 34, height: 626, display: 'grid', alignContent: 'start' }}>
          <div style={{ ...smallCaps, color: palette.cyan, marginBottom: 26 }}>Why now</div>
          <div style={{ display: 'grid', gap: 14 }}>
            {needs.map((item) => (
              <div key={item} style={{ display: 'flex', gap: 13, alignItems: 'flex-start' }}>
                <span
                  style={{
                    width: 9,
                    height: 9,
                    marginTop: 12,
                    borderRadius: 999,
                    background: palette.cyan,
                    boxShadow: 'none',
                    flex: '0 0 auto',
                  }}
                />
                <span style={{ fontSize: 24, lineHeight: 1.38, color: palette.ink }}>{item}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel style={{ padding: 32, height: 626, position: 'relative', overflow: 'hidden' }}>
          <div style={{ ...smallCaps, color: palette.blue }}>Community Operation Pressure</div>
          <div
            style={{
              marginTop: 26,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 18,
            }}
          >
            <div
              style={{
                minHeight: 168,
                borderRadius: 2,
                background: palette.navy,
                color: palette.text,
                padding: 24,
                display: 'grid',
                alignContent: 'center',
              }}
            >
              <div style={{ fontSize: 62, fontWeight: 940, color: palette.cyan }}>近七成</div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 22,
                  lineHeight: 1.32,
                  color: 'rgba(255, 255, 255, 0.78)',
                }}
              >
                全國十一層以上住宅戶數佔比
              </div>
              <div style={{ marginTop: 14, fontSize: 15, color: 'rgba(255, 255, 255, 0.48)' }}>
                內政部 113 年統計
              </div>
            </div>
            <div
              style={{
                minHeight: 168,
                borderRadius: 2,
                background: palette.panelSoft,
                padding: 24,
                display: 'grid',
                alignContent: 'center',
              }}
            >
              <div style={{ fontSize: 42, fontWeight: 940, color: palette.ink }}>人力成長落後</div>
              <div style={{ marginTop: 12, fontSize: 23, lineHeight: 1.36, color: palette.muted }}>
                住宅擴張需求高於物管人力供給，夜間服務缺口更明顯。
              </div>
            </div>
          </div>
          <div style={{ marginTop: 22, display: 'grid', gap: 14 }}>
            {options.map(([name, limit, color]) => (
              <div
                key={name}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '150px 1fr',
                  gap: 18,
                  alignItems: 'center',
                  padding: '18px 20px',
                  borderRadius: 2,
                  border: `1px solid ${palette.line}`,
                  background: '#ffffff',
                }}
              >
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 2,
                    background: color,
                    color: color === palette.warning ? palette.ink : '#ffffff',
                    fontSize: 23,
                    fontWeight: 900,
                    textAlign: 'center',
                  }}
                >
                  {name}
                </div>
                <div style={{ fontSize: 23, lineHeight: 1.34, color: palette.muted }}>{limit}</div>
              </div>
            ))}
          </div>
          <div
            style={{
              position: 'absolute',
              right: -52,
              bottom: -52,
              width: 190,
              height: 190,
              borderRadius: 999,
              border: `22px solid ${palette.cyanSoft}`,
            }}
          />
        </Panel>
      </div>
      <Footer page="02" />
    </div>
  );
};

const PainPoints: Page = () => {
  const points = [
    ['人工登記耗時', '管理員需逐筆記錄包裹資訊。', 'clock'],
    ['包裹查找困難', '堆放位置不固定，取件效率低。', 'search'],
    ['夜間取件不便', '管理員下班後，住戶無法即時領取。', 'bell'],
    ['誤領與遺失風險', '缺乏完整驗證與紀錄，責任難釐清。', 'lock'],
    ['缺乏數據分析', '無法掌握尖峰時段與異常事件。', 'chart'],
  ] as const;
  return (
    <div style={lightPage}>
      <Header section="Pain Point Analysis" title="傳統包裹管理面臨五大痛點" />
      <div
        style={{ marginTop: 54, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20 }}
      >
        {points.map(([title, body, icon], index) => (
          <Panel
            key={title}
            style={{
              minHeight: 520,
              padding: 26,
              display: 'grid',
              gridTemplateRows: 'auto 1fr auto',
            }}
          >
            <div style={{ color: palette.cyan, fontSize: 24, fontWeight: 900 }}>
              {String(index + 1).padStart(2, '0')}
            </div>
            <div style={{ alignSelf: 'center' }}>
              <Icon name={icon} color={index === 3 ? palette.danger : palette.cyan} />
              <h2
                style={{
                  margin: '30px 0 18px',
                  fontSize: 34,
                  lineHeight: 1.16,
                  color: palette.ink,
                }}
              >
                {title}
              </h2>
              <p style={{ margin: 0, fontSize: 23, lineHeight: 1.42, color: palette.muted }}>
                {body}
              </p>
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 999,
                background: index === 3 ? palette.danger : palette.cyan,
              }}
            />
          </Panel>
        ))}
      </div>
      <Footer page="03" />
    </div>
  );
};

const Scenario: Page = () => (
  <div
    style={{
      ...pageBase,
      background: palette.navy,
    }}
  >
    <CircuitBackdrop />
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Header section="02 Scenario Design" title="應用情境設計：從社區節點延伸到城市物流網" dark />
      <div
        style={{
          marginTop: 36,
          display: 'grid',
          gridTemplateColumns: '1.05fr 0.95fr',
          gap: 42,
          alignItems: 'center',
        }}
      >
        <Panel dark style={{ height: 640, padding: 28 }}>
          <CityGraphic compact />
        </Panel>
        <div style={{ display: 'grid', gap: 18 }}>
          {[
            '住宅社區與公寓大樓',
            '商辦大樓與科技園區',
            '大學宿舍與校園收發室',
            '公共住宅與社會住宅',
            '捷運站、轉運站或公共取件點',
          ].map((item, index) => (
            <Panel
              key={item}
              dark
              style={{
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 18,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 999,
                  display: 'grid',
                  placeItems: 'center',
                  color: palette.navy,
                  background: index % 2 === 0 ? palette.cyan : palette.blue,
                  fontWeight: 900,
                }}
              >
                {index + 1}
              </div>
              <div style={{ fontSize: 26, fontWeight: 780 }}>{item}</div>
            </Panel>
          ))}
          <p
            style={{
              margin: '18px 0 0',
              fontSize: 26,
              lineHeight: 1.42,
              color: 'rgba(255, 255, 255, 0.76)',
            }}
          >
            每個部署點都是智慧包裹節點；多個節點串聯後，可形成城市級包裹物流管理網。
          </p>
        </div>
      </div>
    </div>
    <Footer page="04" dark />
  </div>
);

const Flow: Page = () => {
  const steps = [
    '物流送達',
    '放置智慧貨架',
    '感測器偵測',
    '雲端建立紀錄',
    '通知住戶',
    '驗證取件',
    '更新紀錄',
    '異常通知',
  ];
  return (
    <div style={lightPage}>
      <Header section="Service Flow" title="智慧包裹收受與取件流程" />
      <div
        style={{ marginTop: 58, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 22 }}
      >
        {steps.map((step, index) => (
          <Panel
            key={step}
            style={{ height: 240, padding: 24, position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ ...smallCaps, color: palette.cyan }}>Step {index + 1}</div>
            <h2 style={{ margin: '38px 0 0', fontSize: 34, lineHeight: 1.12, color: palette.ink }}>
              {step}
            </h2>
            <div
              style={{
                position: 'absolute',
                right: -20,
                bottom: -20,
                width: 130,
                height: 130,
                borderRadius: 999,
                border: `16px solid ${index % 2 === 0 ? palette.cyanSoft : '#f7f7f7'}`,
              }}
            />
            {index < steps.length - 1 && (
              <div
                style={{
                  position: 'absolute',
                  right: -18,
                  top: 108,
                  width: 36,
                  height: 5,
                  background: palette.cyan,
                  zIndex: 3,
                }}
              />
            )}
          </Panel>
        ))}
      </div>
      <Panel
        style={{
          marginTop: 34,
          padding: '24px 30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {['物流車', '智慧承重板', '雲端平台', '手機 App', '後台紀錄'].map((label) => (
          <div
            key={label}
            style={{ display: 'grid', justifyItems: 'center', gap: 10, color: palette.ink }}
          >
            <Icon
              name={label === '手機 App' ? 'bell' : label === '後台紀錄' ? 'chart' : 'box'}
              color={palette.blue}
            />
            <span style={{ fontSize: 22, fontWeight: 820 }}>{label}</span>
          </div>
        ))}
      </Panel>
      <Footer page="05" />
    </div>
  );
};

const AdminShelvingFlow: Page = () => {
  const steps = [
    ['01', '平板登入', '管理員拿出平板進行登入與身份認證'],
    ['02', '包裹登錄', '拿著包裹進行登錄，並掃描包裹上的所有條碼'],
    ['03', '拍照存證', '為包裹拍一張照片，保留上架前影像紀錄'],
    ['04', '放上智慧架', '將包裹放上智慧架，伺服器自動登錄重量與物架層區'],
    ['05', '寫入資料庫', '登錄此包裹進入伺服器資料庫，等待住戶取件'],
  ];

  return (
    <div style={lightPage}>
      <Header
        section="Admin Shelving Flow"
        title="管理員上架詳細流程：登錄、掃碼、拍照與重量建檔"
      />
      <div
        style={{
          marginTop: 38,
          display: 'grid',
          gridTemplateColumns: '0.92fr 1.08fr',
          gap: 34,
          alignItems: 'center',
        }}
      >
        <Panel
          style={{
            padding: 32,
            height: 650,
            background: palette.navy,
            color: palette.text,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ ...smallCaps, color: palette.cyan }}>Before pickup</div>
          <h2 style={{ margin: '28px 0 0', fontSize: 50, lineHeight: 1.12 }}>
            先把包裹資料建立完整
          </h2>
          <p
            style={{
              margin: '24px 0 0',
              fontSize: 27,
              lineHeight: 1.45,
              color: 'rgba(255, 255, 255, 0.74)',
            }}
          >
            上架流程把身份、條碼、照片、重量與層位一起寫入資料庫，讓後續取件驗證有可比對的基準。
          </p>
          <div
            style={{
              marginTop: 40,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16,
            }}
          >
            {['管理員身份', '包裹條碼', '現場照片', '重量 / 層區'].map((item, index) => (
              <div
                key={item}
                style={{
                  minHeight: 92,
                  borderRadius: 2,
                  background: palette.navy2,
                  border: '1px solid rgba(118, 185, 0, 0.18)',
                  display: 'grid',
                  alignContent: 'center',
                  gap: 8,
                  padding: 18,
                }}
              >
                <div style={{ fontSize: 17, color: palette.cyan, fontWeight: 900 }}>
                  DATA {index + 1}
                </div>
                <div style={{ fontSize: 25, fontWeight: 840 }}>{item}</div>
              </div>
            ))}
          </div>
          <div
            style={{
              position: 'absolute',
              right: -54,
              bottom: -54,
              width: 210,
              height: 210,
              borderRadius: 999,
              border: `24px solid ${palette.cyan}`,
              opacity: 0.22,
            }}
          />
        </Panel>
        <Panel style={{ padding: 30, height: 650 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            {steps.map(([number, title, body], index) => (
              <div key={number} style={{ display: 'grid', justifyItems: 'center' }}>
                <div
                  style={{
                    width: '100%',
                    minHeight: 90,
                    borderRadius: 2,
                    background: index === steps.length - 1 ? palette.cyan : palette.navy2,
                    color: '#ffffff',
                    display: 'grid',
                    gridTemplateColumns: '72px 230px 1fr',
                    gap: 18,
                    alignItems: 'center',
                    padding: '18px 24px',
                    boxShadow: 'none',
                  }}
                >
                  <div style={{ fontSize: 22, fontWeight: 940, opacity: 0.82 }}>{number}</div>
                  <div style={{ fontSize: 30, lineHeight: 1.12, fontWeight: 900 }}>{title}</div>
                  <div style={{ fontSize: 23, lineHeight: 1.3, opacity: 0.92 }}>{body}</div>
                </div>
                {index < steps.length - 1 && (
                  <div style={{ width: 3, height: 20, background: palette.ink, opacity: 0.72 }} />
                )}
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Footer page="06" />
    </div>
  );
};

const AdminIpadShelvingUi: Page = () => (
  <div style={lightPage}>
    <Header
      section="Property Management UI"
      title="物業管理上架介面：平板端完成包裹建檔與貨架管理"
    />
    <div
      style={{
        marginTop: 34,
        display: 'grid',
        gridTemplateColumns: '0.78fr 1.22fr',
        gap: 34,
        alignItems: 'center',
      }}
    >
      <Panel
        style={{
          padding: 30,
          height: 650,
          background: palette.navy,
          color: palette.text,
          display: 'grid',
          alignContent: 'center',
          gap: 26,
        }}
      >
        <div style={{ ...smallCaps, color: palette.cyan }}>iPad workflow</div>
        <h2 style={{ margin: 0, fontSize: 48, lineHeight: 1.12 }}>
          第一線管理員
          <br />
          用平板完成上架
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 26,
            lineHeight: 1.42,
            color: 'rgba(255, 255, 255, 0.74)',
          }}
        >
          介面將上架紀錄、條碼掃描、影像存證與重量監控整合在同一工作流，降低夜間或尖峰時段的人工作業負擔。
        </p>
        <div style={{ display: 'grid', gap: 14 }}>
          {[
            ['01', '上架記錄', '建立包裹資料與收件資訊'],
            ['02', '掃描條碼', '拍攝包裹並辨識貨運標籤'],
            ['03', '確認登錄', '寫入重量、照片與層位資料'],
            ['04', '管理總覽', '即時查看承重板狀態'],
          ].map(([number, title, body]) => (
            <div
              key={number}
              style={{
                display: 'grid',
                gridTemplateColumns: '54px 132px 1fr',
                gap: 14,
                alignItems: 'center',
                padding: '14px 16px',
                borderRadius: 2,
                background: palette.navy2,
                border: '1px solid rgba(118, 185, 0, 0.2)',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 940, color: palette.cyan }}>{number}</div>
              <div style={{ fontSize: 23, fontWeight: 900 }}>{title}</div>
              <div style={{ fontSize: 20, lineHeight: 1.28, color: 'rgba(255, 255, 255, 0.72)' }}>
                {body}
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel
        style={{
          height: 650,
          padding: 24,
          display: 'grid',
          alignContent: 'center',
          background: palette.panelSoft,
        }}
      >
        <div
          style={{
            borderRadius: 2,
            border: `1px solid ${palette.line}`,
            background: '#ffffff',
            padding: 16,
          }}
        >
          <img
            src={adminIpadShelvingUi}
            alt="物業管理上架流程 iPad UI"
            style={{
              width: '100%',
              display: 'block',
              borderRadius: 2,
            }}
          />
        </div>
        <div
          style={{
            marginTop: 22,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
          }}
        >
          {['建檔', '掃碼', '確認', '監控'].map((item) => (
            <div
              key={item}
              style={{
                height: 54,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 2,
                background: palette.navy,
                color: palette.text,
                fontSize: 24,
                fontWeight: 880,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </Panel>
    </div>
    <Footer page="07" />
  </div>
);

const NormalPickupFlow: Page = () => {
  const steps = [
    ['01', '手機登入', '拿出手機進行登入與身份認證'],
    ['02', '重量觸發', '用戶拿起包裹造成重量減少，伺服器發出呼叫'],
    ['03', '條碼比對', '掃描任一條碼，伺服器比對是否為該用戶可領包裹'],
    ['04', '重量確認', '伺服器比對減少重量是否與包裹登錄重量一致'],
    ['05', '完成領取', '將包裹設為已領取，並消除呼叫'],
  ];

  return (
    <div
      style={{
        ...pageBase,
        background: palette.navy,
      }}
    >
      <CircuitBackdrop />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Header
          section="Normal Pickup Flow"
          title="正常領取流程：身份認證、條碼比對與重量驗證"
          dark
        />
        <div
          style={{
            marginTop: 34,
            display: 'grid',
            gridTemplateColumns: '0.72fr 1.28fr',
            gap: 38,
            alignItems: 'center',
          }}
        >
          <Panel dark style={{ padding: 32, height: 660, display: 'grid', alignContent: 'center' }}>
            <div style={{ ...smallCaps, color: palette.cyan }}>Multi-factor verification</div>
            <h2 style={{ margin: '24px 0 0', fontSize: 44, lineHeight: 1.14 }}>
              三種訊號交叉確認，
              <br />
              避免誤領與冒領
            </h2>
            <div style={{ marginTop: 38, display: 'grid', gap: 18 }}>
              {[
                ['身份', '手機登入確認使用者'],
                ['條碼', '確認包裹與收件人關係'],
                ['重量', '確認取走物品與登錄資料一致'],
              ].map(([label, body], index) => (
                <div
                  key={label}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '68px 1fr',
                    gap: 18,
                    alignItems: 'center',
                    padding: 18,
                    borderRadius: 2,
                    background: palette.navy2,
                    border: '1px solid rgba(118, 185, 0, 0.18)',
                  }}
                >
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 999,
                      display: 'grid',
                      placeItems: 'center',
                      background: index === 1 ? palette.blue : palette.cyan,
                      color: palette.navy,
                      fontSize: 22,
                      fontWeight: 920,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{ fontSize: 24, lineHeight: 1.34, color: 'rgba(255, 255, 255, 0.78)' }}
                  >
                    {body}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <div style={{ display: 'grid', gap: 13 }}>
            {steps.map(([number, title, body], index) => (
              <div key={number} style={{ position: 'relative' }}>
                <Panel
                  dark
                  style={{
                    minHeight: 96,
                    padding: '18px 26px',
                    display: 'grid',
                    gridTemplateColumns: '76px 210px 1fr',
                    gap: 22,
                    alignItems: 'center',
                    background:
                      index === steps.length - 1 ? 'rgba(118, 185, 0, 0.26)' : palette.navy2,
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 940, color: palette.cyan }}>{number}</div>
                  <div style={{ fontSize: 30, fontWeight: 880, color: palette.text }}>{title}</div>
                  <div
                    style={{ fontSize: 25, lineHeight: 1.32, color: 'rgba(255, 255, 255, 0.76)' }}
                  >
                    {body}
                  </div>
                </Panel>
                {index < steps.length - 1 && (
                  <div
                    style={{
                      width: 3,
                      height: 22,
                      margin: '4px auto -4px',
                      background: palette.cyan,
                      boxShadow: 'none',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer page="08" dark />
    </div>
  );
};

const MobileAppUi: Page = () => (
  <div style={lightPage}>
    <Header section="Resident App UI" title="行動 App 取件介面：待領清單與單筆取貨資訊" />
    <div
      style={{
        marginTop: 34,
        display: 'grid',
        gridTemplateColumns: '0.82fr 1.18fr',
        gap: 38,
        alignItems: 'center',
      }}
    >
      <Panel
        style={{
          padding: '10px 0',
          minHeight: 650,
          display: 'grid',
          alignContent: 'center',
          gap: 28,
          background: 'transparent',
          border: 0,
          color: palette.ink,
        }}
      >
        <div style={{ ...smallCaps, color: palette.cyan }}>Interface purpose</div>
        <h2 style={{ margin: 0, fontSize: 48, lineHeight: 1.12 }}>
          住戶只需要看懂
          <br />
          「在哪裡、怎麼領」
        </h2>
        <div style={{ display: 'grid', gap: 16 }}>
          {[
            ['待領清單', '集中顯示包裹 ID、抵達時間、物流商與貨架位置。'],
            ['取貨資訊', '進入單筆包裹後，顯示狀態、位置與取貨按鈕。'],
            ['流程指引', '用 STEP 1-4 引導身份確認、前往位置、掃碼與確認收取。'],
            ['底部導航', '保留首頁、安防、包裹、個人四個核心入口。'],
          ].map(([title, body]) => (
            <div
              key={title}
              style={{
                display: 'grid',
                gridTemplateColumns: '150px 1fr',
                gap: 18,
                padding: '18px 0',
                borderTop: `1px solid ${palette.line}`,
              }}
            >
              <div style={{ color: palette.cyan, fontSize: 24, fontWeight: 900 }}>{title}</div>
              <div style={{ color: palette.muted, fontSize: 24, lineHeight: 1.34 }}>{body}</div>
            </div>
          ))}
        </div>
      </Panel>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 28,
          alignItems: 'center',
          justifyItems: 'center',
        }}
      >
        {[
          [packageListUi, '包裹待領清單'],
          [pickupDetailUi, '取貨資訊介面'],
        ].map(([src, label]) => (
          <div
            key={label}
            style={{
              width: 348,
              display: 'grid',
              justifyItems: 'center',
              gap: 12,
            }}
          >
            <img
              src={src}
              alt={label}
              style={{
                display: 'block',
                width: '100%',
                height: 700,
                objectFit: 'contain',
                objectPosition: 'center',
                background: 'transparent',
              }}
            />
            <div
              style={{
                fontSize: 22,
                fontWeight: 880,
                color: palette.ink,
                textAlign: 'center',
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
    <Footer page="09" />
  </div>
);

const NormalPickupDemoVideo: Page = () => (
  <div style={{ ...lightPage, padding: '50px 44px' }}>
    <Header section="Normal Pickup Demo" title="正常取貨 Demo：身份驗證與取件操作實測" />
    <div
      style={{
        marginTop: 24,
        display: 'grid',
        gridTemplateColumns: '1fr',
        alignItems: 'center',
      }}
    >
      <video
        src={normalPickupDemoVideo}
        controls
        muted
        playsInline
        style={{
          width: '100%',
          height: 690,
          objectFit: 'cover',
          background: '#000000',
          borderRadius: 2,
        }}
      />
    </div>
    <Footer page="10" />
  </div>
);

const SupplementalDemoVideos: Page = () => {
  const videos = [
    [demoSupplement01, 'Demo 01'],
    [demoSupplement02, 'Demo 02'],
    [demoSupplement03, 'Demo 03'],
    [demoSupplement04, 'Demo 04'],
  ] as const;

  return (
    <div style={{ ...pageBase, padding: '54px 70px', background: palette.navy }}>
      <Header section="Supplemental Demo" title="Demo 影片補充：系統操作實測畫面" dark />
      <div
        style={{
          marginTop: 28,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 18,
        }}
      >
        {videos.map(([src, label]) => (
          <Panel key={label} dark style={{ padding: 12, background: '#111111' }}>
            <video
              src={src}
              autoPlay
              controls
              loop
              muted
              playsInline
              preload="auto"
              style={{
                width: '100%',
                height: 244,
                display: 'block',
                objectFit: 'cover',
                background: '#000000',
                borderRadius: 2,
              }}
            />
            <div
              style={{
                marginTop: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: 'rgba(255, 255, 255, 0.72)',
                fontSize: 18,
                fontWeight: 820,
              }}
            >
              <span>{label}</span>
              <span style={{ color: palette.cyan }}>H.264 / 16:9</span>
            </div>
          </Panel>
        ))}
      </div>
      <Footer page="11" dark />
    </div>
  );
};

const IrregularPickupFlow: Page = () => {
  const steps = [
    ['01', '直接拿取包裹', '未先登入 App，也沒有完成身分驗證。'],
    ['02', '重量減少', '承重板偵測到包裹被取走，立即建立呼叫事件。'],
    ['03', '影像結束', '人員離開鏡頭範圍，系統封存取件前後影像。'],
    ['04', '驗證缺失', '沒有取件碼、QR Code 或手機驗證紀錄可配對。'],
    ['05', '管理通知', '保留異常呼叫，同步通知管理端並回傳紀錄檔。'],
  ];
  const signals = ['重量變化', '影像紀錄', '驗證缺失'];
  const responses = [
    ['保留呼叫', '異常狀態不自動消除'],
    ['推播管理員', '即時提示疑似未授權取件'],
    ['建立證據鏈', '重量、時間、影像與位置同步留存'],
  ];

  return (
    <div style={{ ...pageBase, background: palette.navy }}>
      <CircuitBackdrop />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Header
          section="Exception Flow"
          title="未依規定領取：重量異常與影像紀錄觸發管理通知"
          dark
        />
        <div
          style={{
            marginTop: 34,
            display: 'grid',
            gridTemplateColumns: '0.92fr 1.08fr',
            gap: 32,
            alignItems: 'stretch',
          }}
        >
          <Panel dark style={{ padding: 30, height: 630, display: 'grid', gap: 22 }}>
            <div style={{ ...smallCaps, color: palette.cyan }}>Unauthorized pickup timeline</div>
            <div style={{ position: 'relative', display: 'grid', gap: 13 }}>
              <div
                style={{
                  position: 'absolute',
                  left: 30,
                  top: 26,
                  bottom: 26,
                  width: 2,
                  background: 'rgba(118, 185, 0, 0.42)',
                }}
              />
              {steps.map(([number, title, body], index) => (
                <div
                  key={number}
                  style={{
                    position: 'relative',
                    display: 'grid',
                    gridTemplateColumns: '62px 1fr',
                    gap: 18,
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 999,
                      display: 'grid',
                      placeItems: 'center',
                      background: index === steps.length - 1 ? palette.cyan : palette.navy2,
                      border: `1px solid ${
                        index === steps.length - 1 ? palette.cyan : 'rgba(118, 185, 0, 0.52)'
                      }`,
                      color: index === steps.length - 1 ? palette.ink : palette.cyan,
                      fontSize: 18,
                      fontWeight: 940,
                      zIndex: 1,
                    }}
                  >
                    {number}
                  </div>
                  <div
                    style={{
                      minHeight: 82,
                      padding: '14px 18px',
                      display: 'grid',
                      alignContent: 'center',
                      gap: 6,
                      background:
                        index === steps.length - 1 ? 'rgba(118, 185, 0, 0.2)' : palette.navy2,
                      border: `1px solid ${
                        index === steps.length - 1
                          ? 'rgba(118, 185, 0, 0.72)'
                          : 'rgba(255, 255, 255, 0.12)'
                      }`,
                    }}
                  >
                    <div style={{ fontSize: 28, fontWeight: 900, color: palette.text }}>
                      {title}
                    </div>
                    <div
                      style={{
                        fontSize: 20,
                        lineHeight: 1.35,
                        color: 'rgba(255, 255, 255, 0.68)',
                      }}
                    >
                      {body}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel
            dark
            style={{
              padding: 30,
              height: 630,
              display: 'grid',
              gridTemplateRows: '1fr auto',
              gap: 24,
            }}
          >
            <div
              style={{
                position: 'relative',
                minHeight: 330,
                overflow: 'hidden',
                background: '#101010',
                border: '1px solid rgba(118, 185, 0, 0.36)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: '24px 30px',
                  border: '2px solid rgba(118, 185, 0, 0.55)',
                  boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.08)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 54,
                  top: 50,
                  padding: '9px 14px',
                  background: palette.danger,
                  color: '#ffffff',
                  fontSize: 18,
                  fontWeight: 900,
                }}
              >
                UNVERIFIED PICKUP
              </div>
              <div style={{ position: 'absolute', left: 70, right: 70, bottom: 58, height: 88 }}>
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    style={{
                      position: 'absolute',
                      left: `${item * 31}%`,
                      bottom: item === 1 ? 20 : 0,
                      width: 170,
                      height: 62,
                      background: '#2a2a2a',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <div
                      style={{
                        width: '62%',
                        height: 12,
                        margin: '14px auto 0',
                        background: 'rgba(255, 255, 255, 0.24)',
                      }}
                    />
                  </div>
                ))}
              </div>
              <div
                style={{
                  position: 'absolute',
                  right: 48,
                  top: 46,
                  width: 126,
                  height: 126,
                  borderRadius: 999,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'rgba(229, 32, 32, 0.16)',
                  border: '1px solid rgba(229, 32, 32, 0.72)',
                  color: '#ffd6d6',
                  fontSize: 38,
                  fontWeight: 940,
                }}
              >
                !
              </div>
              <div style={{ position: 'absolute', left: 52, bottom: 36, display: 'flex', gap: 10 }}>
                {signals.map((item) => (
                  <div
                    key={item}
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(118, 185, 0, 0.16)',
                      border: '1px solid rgba(118, 185, 0, 0.42)',
                      color: palette.cyanSoft,
                      fontSize: 19,
                      fontWeight: 820,
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {responses.map(([title, body], index) => (
                <div
                  key={title}
                  style={{
                    minHeight: 170,
                    padding: 20,
                    display: 'grid',
                    alignContent: 'start',
                    gap: 14,
                    background: index === 0 ? 'rgba(229, 32, 32, 0.16)' : palette.navy2,
                    border: `1px solid ${
                      index === 0 ? 'rgba(229, 32, 32, 0.56)' : 'rgba(118, 185, 0, 0.26)'
                    }`,
                  }}
                >
                  <div style={{ ...smallCaps, color: index === 0 ? '#ff9c9c' : palette.cyan }}>
                    Response {index + 1}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: palette.text }}>{title}</div>
                  <div
                    style={{ fontSize: 20, lineHeight: 1.36, color: 'rgba(255, 255, 255, 0.68)' }}
                  >
                    {body}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
      <Footer page="12" dark />
    </div>
  );
};

const PackageSwapFlow: Page = () => (
  <div
    style={{
      ...pageBase,
      background: palette.navy,
    }}
  >
    <CircuitBackdrop />
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Header
        section="Package Swap Exception"
        title="異常調換包裹：重量比對與影像偵測雙路判斷"
        dark
      />
      <div
        style={{
          marginTop: 36,
          display: 'grid',
          gridTemplateRows: 'auto auto 1fr',
          gap: 18,
        }}
      >
        {[
          ['01', '用戶拿起包裹造成重量減少', '伺服器發布呼叫'],
          ['02', '放上替代包裹', '伺服器進行重量比對'],
        ].map(([number, title, body]) => (
          <Panel
            key={number}
            dark
            style={{
              height: 86,
              padding: '18px 30px',
              display: 'grid',
              gridTemplateColumns: '72px 1fr 330px',
              gap: 22,
              alignItems: 'center',
              background: 'rgba(118, 185, 0, 0.16)',
            }}
          >
            <div style={{ fontSize: 22, color: palette.cyan, fontWeight: 940 }}>{number}</div>
            <div style={{ fontSize: 30, fontWeight: 880 }}>{title}</div>
            <div style={{ fontSize: 24, color: 'rgba(255, 255, 255, 0.72)' }}>{body}</div>
          </Panel>
        ))}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 310px 1fr',
            gap: 30,
            alignItems: 'stretch',
            marginTop: 8,
          }}
        >
          <Panel dark style={{ padding: 30, display: 'grid', alignContent: 'center', gap: 20 }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: palette.cyan }}>相同</div>
            <h2 style={{ margin: 0, fontSize: 42, lineHeight: 1.14 }}>影像捕捉有新包裹出現</h2>
            <p
              style={{
                margin: 0,
                fontSize: 25,
                lineHeight: 1.42,
                color: 'rgba(255, 255, 255, 0.74)',
              }}
            >
              重量一致但影像顯示包裹被替換，系統發布特殊呼叫並標記影像異常。
            </p>
            <div
              style={{
                marginTop: 8,
                padding: '16px 20px',
                borderRadius: 2,
                background: 'rgba(118, 185, 0, 0.16)',
                color: palette.cyanSoft,
                fontSize: 26,
                fontWeight: 860,
              }}
            >
              特殊呼叫：影像異常
            </div>
          </Panel>
          <div style={{ display: 'grid', alignContent: 'center', justifyItems: 'center' }}>
            <div
              style={{
                width: 300,
                height: 146,
                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                background: palette.cyan,
                display: 'grid',
                placeItems: 'center',
                color: '#ffffff',
                fontSize: 34,
                fontWeight: 900,
                textAlign: 'center',
                boxShadow: 'none',
              }}
            >
              重量是否相同
            </div>
            <div
              style={{
                marginTop: 30,
                width: 3,
                height: 88,
                background: palette.cyan,
                boxShadow: 'none',
              }}
            />
          </div>
          <Panel dark style={{ padding: 30, display: 'grid', alignContent: 'center', gap: 20 }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: palette.danger }}>不同</div>
            <h2 style={{ margin: 0, fontSize: 42, lineHeight: 1.14 }}>替代包裹重量不一致</h2>
            <p
              style={{
                margin: 0,
                fontSize: 25,
                lineHeight: 1.42,
                color: 'rgba(255, 255, 255, 0.74)',
              }}
            >
              重量與原登錄資料不符，系統立即發布特殊呼叫並標記重量異常。
            </p>
            <div
              style={{
                marginTop: 8,
                padding: '16px 20px',
                borderRadius: 2,
                background: 'rgba(229, 32, 32, 0.18)',
                color: '#ffd6d6',
                fontSize: 26,
                fontWeight: 860,
              }}
            >
              特殊呼叫：重量異常
            </div>
          </Panel>
        </div>
      </div>
    </div>
    <Footer page="13" dark />
  </div>
);

const IotLayers: Page = () => {
  const layers = [
    {
      label: '應用層',
      english: 'Application',
      headline: '管理、通知、分析',
      body: '雲端資料庫、後台管理、住戶 App、通知服務與資料儀表板。',
      items: ['App', '後台', 'Dashboard', 'AI 分析'],
      color: palette.blue,
      textColor: '#ffffff',
    },
    {
      label: '網路層',
      english: 'Network',
      headline: '穩定、即時、安全傳輸',
      body: 'Wi-Fi、4G/5G、LoRa / NB-IoT，透過 MQTT、HTTPS / TLS 與 API Gateway 串接雲端。',
      items: ['Wi-Fi', '5G', 'MQTT', 'TLS'],
      color: palette.cyan,
      textColor: palette.ink,
    },
    {
      label: '感知層',
      english: 'Perception',
      headline: '把包裹狀態轉成資料',
      body: 'Load Cell、HX711、ESP32、QR Code、RFID / NFC、攝影機與門磁感測器。',
      items: ['重量', '條碼', '影像', '層位'],
      color: palette.navy,
      textColor: '#ffffff',
    },
  ];
  const flow = [
    ['01', '包裹上架', '重量、照片、條碼與層位資料建立基準'],
    ['02', '設備回傳', 'ESP32 整理感測訊號並送出事件'],
    ['03', '雲端判斷', '狀態更新、通知派送與異常比對'],
    ['04', '角色使用', '住戶取件、管理端處理、城市端分析'],
  ];

  return (
    <div style={{ ...pageBase, background: '#ffffff', color: palette.ink }}>
      <Header section="03 IoT Architecture" title="物聯網三層架構：從現場感測到城市服務" />
      <div
        style={{
          marginTop: 34,
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.8fr',
          gap: 34,
          alignItems: 'stretch',
        }}
      >
        <div style={{ display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: 14, height: 630 }}>
          {layers.map((layer, index) => (
            <div
              key={layer.label}
              style={{
                position: 'relative',
                minHeight: 0,
                padding: '20px 24px',
                display: 'grid',
                gridTemplateColumns: '190px 1fr',
                gap: 22,
                alignItems: 'center',
                background: index === 1 ? '#f7f7f7' : '#ffffff',
                border: `1px solid ${index === 1 ? palette.cyan : palette.line}`,
              }}
            >
              <div
                style={{
                  height: 118,
                  borderRadius: 2,
                  background: layer.color,
                  color: layer.textColor,
                  display: 'grid',
                  alignContent: 'center',
                  gap: 6,
                  padding: 22,
                }}
              >
                <div style={{ fontSize: 34, lineHeight: 1, fontWeight: 940 }}>{layer.label}</div>
                <div style={{ ...smallCaps, color: layer.textColor, opacity: 0.78 }}>
                  {layer.english}
                </div>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ fontSize: 30, lineHeight: 1.12, fontWeight: 900 }}>
                  {layer.headline}
                </div>
                <div style={{ fontSize: 21, lineHeight: 1.34, color: palette.muted }}>
                  {layer.body}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 10,
                  }}
                >
                  {layer.items.map((item) => (
                    <div
                      key={item}
                      style={{
                        minHeight: 38,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: 2,
                        background: index === 1 ? '#ffffff' : palette.panelSoft,
                        border: `1px solid ${palette.line}`,
                        color: palette.ink,
                        fontSize: 18,
                        fontWeight: 840,
                      }}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              {index < layers.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    left: 108,
                    bottom: -15,
                    width: 56,
                    height: 15,
                    background: palette.cyan,
                    zIndex: 2,
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <Panel
          style={{
            height: 630,
            padding: 30,
            background: palette.navy,
            color: palette.text,
            display: 'grid',
            alignContent: 'center',
            gap: 22,
          }}
        >
          <div style={{ ...smallCaps, color: palette.cyan }}>Data flow</div>
          <h2 style={{ margin: 0, fontSize: 44, lineHeight: 1.12 }}>資料如何被系統使用</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {flow.map(([number, title, body], index) => (
              <div
                key={number}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '52px 1fr',
                  gap: 16,
                  alignItems: 'start',
                  padding: '16px 0',
                  borderTop: index === 0 ? 0 : '1px solid rgba(255, 255, 255, 0.14)',
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: 999,
                    background: index === 0 ? palette.cyan : 'rgba(118, 185, 0, 0.16)',
                    color: index === 0 ? palette.ink : palette.cyan,
                    fontSize: 18,
                    fontWeight: 940,
                  }}
                >
                  {number}
                </div>
                <div>
                  <div style={{ fontSize: 27, fontWeight: 900 }}>{title}</div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 21,
                      lineHeight: 1.34,
                      color: 'rgba(255, 255, 255, 0.7)',
                    }}
                  >
                    {body}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <Footer page="14" />
    </div>
  );
};

const HardwarePrototype: Page = () => (
  <div style={lightPage}>
    <Header section="Hardware Prototype" title="硬體原型：智慧承重板與四點 Load Cell 支撐結構" />
    <div
      style={{
        marginTop: 34,
        display: 'grid',
        gridTemplateColumns: '1.16fr 0.84fr',
        gap: 34,
        alignItems: 'center',
      }}
    >
      <Panel style={{ padding: 22, height: 650, display: 'grid', alignContent: 'center' }}>
        <img
          src={hardwareModelImage}
          alt="智慧承重板 3D 模型"
          style={{
            display: 'block',
            width: '100%',
            height: 590,
            objectFit: 'contain',
            background: '#ffffff',
          }}
        />
      </Panel>
      <div style={{ display: 'grid', gap: 18 }}>
        {[
          ['Load-bearing panel', '承重板作為包裹放置平台，將重量均勻傳遞到四個角落。'],
          ['Load Cell', '四點重量感測可降低偏心放置造成的誤差。'],
          ['Bracket', '支架固定感測器位置，確保受力方向穩定。'],
        ].map(([title, body], index) => (
          <Panel key={title} style={{ padding: 28 }}>
            <div style={{ ...smallCaps, color: palette.cyan }}>Hardware {index + 1}</div>
            <h2 style={{ margin: '18px 0 10px', fontSize: 34, color: palette.ink }}>{title}</h2>
            <p style={{ margin: 0, fontSize: 25, lineHeight: 1.42, color: palette.muted }}>
              {body}
            </p>
          </Panel>
        ))}
      </div>
    </div>
    <Footer page="15" />
  </div>
);

const HardwareWiring: Page = () => (
  <div
    style={{
      ...pageBase,
      background: palette.navy,
    }}
  >
    <CircuitBackdrop />
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Header
        section="Hardware Wiring"
        title="硬體接線：Load Cell、HX711 與 ESP32-S 資料鏈路"
        dark
      />
      <div
        style={{
          marginTop: 34,
          display: 'grid',
          gridTemplateColumns: '1.18fr 0.82fr',
          gap: 34,
          alignItems: 'stretch',
        }}
      >
        <Panel dark style={{ padding: 20, height: 650, display: 'grid', alignContent: 'center' }}>
          <img
            src={hardwareWiringImage}
            alt="Load Cell HX711 ESP32 硬體接線圖"
            style={{
              display: 'block',
              width: '100%',
              height: 596,
              objectFit: 'contain',
              background: '#ffffff',
            }}
          />
        </Panel>
        <div style={{ height: 650, display: 'grid', gridTemplateRows: 'repeat(4, 1fr)', gap: 18 }}>
          {[
            ['4 × Load Cell', '四個感測點分別量測承重板受力變化。'],
            ['4 × HX711', '將微弱重量訊號放大並轉成 ESP32 可讀取數據。'],
            ['ESP32-S', '彙整重量資料，透過網路送往雲端平台。'],
            ['濾波 / 去耦電容', '穩定供電與訊號，降低讀值抖動。'],
          ].map(([title, body], index) => (
            <Panel
              key={title}
              dark
              style={{ padding: 24, display: 'grid', alignContent: 'center' }}
            >
              <div style={{ ...smallCaps, color: palette.cyan }}>Signal path {index + 1}</div>
              <h2 style={{ margin: '14px 0 8px', fontSize: 32 }}>{title}</h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 24,
                  lineHeight: 1.38,
                  color: 'rgba(255, 255, 255, 0.74)',
                }}
              >
                {body}
              </p>
            </Panel>
          ))}
        </div>
      </div>
    </div>
    <Footer page="16" dark />
  </div>
);

const SensingLayer: Page = () => {
  const tech = [
    'Load Cell',
    'HX711',
    'ESP32 / Arduino',
    'QR Code / 條碼',
    'RFID / NFC',
    '攝影機模組',
    '門磁感測器',
    '電源管理',
  ];
  const shelfRows = [
    { label: 'A1 - 第 3 層', weight: '2.4 kg', active: true, boxes: ['#c98d4c', '#dfb16f'] },
    { label: 'A1 - 第 2 層', weight: '1.1 kg', active: false, boxes: ['#b9743e'] },
    { label: 'A1 - 第 1 層', weight: '0.8 kg', active: false, boxes: ['#d49a5c', '#9f6b3a'] },
  ];
  return (
    <div style={lightPage}>
      <Header section="Perception Layer" title="感知層：讓包裹狀態被即時偵測" />
      <div
        style={{
          marginTop: 42,
          display: 'grid',
          gridTemplateColumns: '1.04fr 0.96fr',
          gap: 34,
          alignItems: 'center',
        }}
      >
        <Panel
          style={{
            height: 650,
            padding: 28,
            position: 'relative',
            overflow: 'hidden',
            background: '#f2f3f4',
          }}
        >
          <div style={{ ...smallCaps, color: palette.cyan }}>Smart Shelf Simulation</div>
          <div
            style={{
              position: 'absolute',
              left: 36,
              right: 36,
              top: 82,
              bottom: 38,
              borderRadius: 2,
              background: '#ffffff',
              border: `1px solid ${palette.line}`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                height: 68,
                background: palette.navy,
                color: palette.text,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 920 }}>A1 智慧貨架</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 999,
                    background: palette.cyan,
                    boxShadow: `0 0 14px ${palette.cyan}`,
                  }}
                />
                <span style={{ fontSize: 18, color: 'rgba(255, 255, 255, 0.72)' }}>
                  sensor online
                </span>
              </div>
            </div>
            <div
              style={{
                position: 'absolute',
                left: 26,
                top: 92,
                bottom: 30,
                width: 22,
                background: '#30343a',
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: 26,
                top: 92,
                bottom: 30,
                width: 22,
                background: '#30343a',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 245,
                top: 84,
                width: 92,
                height: 54,
                borderRadius: 2,
                background: '#111111',
                border: `4px solid ${palette.line}`,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  border: `4px solid ${palette.cyan}`,
                }}
              />
            </div>
            {shelfRows.map((row, rowIndex) => (
              <div
                key={row.label}
                style={{
                  position: 'absolute',
                  left: 58,
                  right: 58,
                  top: 162 + rowIndex * 126,
                  height: 104,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 22,
                    background: '#4b5158',
                    borderTop: '5px solid #707780',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: 18,
                    right: 18,
                    bottom: 22,
                    height: 16,
                    background: row.active ? palette.cyanSoft : '#e8eaed',
                    border: `1px solid ${row.active ? palette.cyan : palette.line}`,
                  }}
                />
                {[24, 196, 368].map((left, index) => (
                  <div
                    key={left}
                    style={{
                      position: 'absolute',
                      left,
                      bottom: 28,
                      width: 12,
                      height: 12,
                      borderRadius: 999,
                      background: row.active && index === 1 ? palette.cyan : '#707780',
                    }}
                  />
                ))}
                {row.boxes.map((color, index) => (
                  <div
                    key={`${row.label}-${color}`}
                    style={{
                      position: 'absolute',
                      left: 62 + index * 96,
                      bottom: 38,
                      width: index === 0 ? 84 : 68,
                      height: index === 0 ? 58 : 48,
                      borderRadius: 2,
                      background: color,
                      border: '1px solid rgba(0, 0, 0, 0.18)',
                      boxShadow: '0 10px 18px rgba(0, 0, 0, 0.16)',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 18,
                        height: 2,
                        background: 'rgba(255, 255, 255, 0.32)',
                      }}
                    />
                  </div>
                ))}
                <div
                  style={{
                    position: 'absolute',
                    right: 16,
                    bottom: 42,
                    minWidth: 134,
                    padding: '9px 12px',
                    borderRadius: 2,
                    background: row.active ? palette.navy : '#f7f7f7',
                    border: `1px solid ${row.active ? palette.cyan : palette.line}`,
                    color: row.active ? palette.cyanSoft : palette.muted,
                    fontSize: 17,
                    fontWeight: 860,
                    textAlign: 'center',
                  }}
                >
                  {row.label}｜{row.weight}
                </div>
              </div>
            ))}
            <div
              style={{
                position: 'absolute',
                left: 86,
                bottom: 18,
                right: 86,
                height: 18,
                background: 'rgba(0, 0, 0, 0.12)',
              }}
            />
          </div>
        </Panel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
          {tech.map((item, index) => (
            <Panel
              key={item}
              style={{
                padding: 22,
                minHeight: 104,
                display: 'flex',
                gap: 18,
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 999,
                  background: index < 3 ? palette.cyan : index < 6 ? palette.blue : palette.warning,
                  color: index < 6 ? '#ffffff' : palette.ink,
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 900,
                }}
              >
                {index + 1}
              </div>
              <div style={{ fontSize: 25, fontWeight: 820, color: palette.ink }}>{item}</div>
            </Panel>
          ))}
          <p
            style={{
              gridColumn: '1 / -1',
              margin: '10px 0 0',
              fontSize: 26,
              lineHeight: 1.42,
              color: palette.muted,
            }}
          >
            核心任務：把「包裹是否存在、在哪裡、何時被取走」轉換成可管理的數據。
          </p>
        </div>
      </div>
      <Footer page="17" />
    </div>
  );
};

const NetworkLayer: Page = () => {
  const runwayRows = [
    {
      lane: 'Access',
      left: ['Wi-Fi', '社區大樓、商辦、室內節點'],
      right: ['4G / 5G', '戶外取件點、無固定網路場域'],
    },
    {
      lane: 'LPWAN',
      left: ['LoRa', '長距離、低功耗、低資料量'],
      right: ['NB-IoT', '電信級覆蓋、穩定感測回傳'],
    },
    {
      lane: 'Protocol',
      left: ['MQTT', '即時事件發布與訂閱'],
      right: ['HTTPS / TLS', '加密傳輸與 API 安全'],
    },
  ];
  const controlCards = [
    ['設備連線', '依場域選擇 Wi-Fi、5G 或 LPWAN，確保包裹節點可穩定回傳。'],
    ['資料交換', 'MQTT 處理即時感測事件，API Gateway 管理 App、設備與後端服務。'],
    ['邊緣判斷', '設備端可先處理重量異常、離線暫存與重送，降低網路中斷風險。'],
  ];

  return (
    <div
      style={{
        ...pageBase,
        background: palette.navy,
      }}
    >
      <Header section="Network Layer" title="網路層：讓設備與雲端平台穩定連線" dark />
      <div
        style={{
          marginTop: 34,
          display: 'grid',
          gridTemplateColumns: '1.16fr 0.84fr',
          gap: 34,
          alignItems: 'stretch',
          height: 650,
        }}
      >
        <Panel
          dark
          style={{
            height: '100%',
            padding: 30,
            position: 'relative',
            overflow: 'hidden',
            background: '#101010',
          }}
        >
          <div style={{ ...smallCaps, color: palette.cyan }}>Transmission runway</div>
          <div
            style={{
              marginTop: 22,
              height: 536,
              position: 'relative',
              display: 'grid',
              gap: 16,
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                bottom: 0,
                width: 18,
                transform: 'translateX(-50%)',
                background: 'linear-gradient(180deg, rgba(118,185,0,0.1), rgba(118,185,0,0.42))',
                borderLeft: '1px solid rgba(118, 185, 0, 0.34)',
                borderRight: '1px solid rgba(118, 185, 0, 0.34)',
              }}
            />
            {runwayRows.map((row, index) => (
              <div
                key={row.lane}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  display: 'grid',
                  gridTemplateColumns: '1fr 112px 1fr',
                  gap: 16,
                  alignItems: 'center',
                }}
              >
                {[row.left, row.right].map(([title, body], sideIndex) => (
                  <div
                    key={title}
                    style={{
                      minHeight: 136,
                      padding: 22,
                      borderRadius: 2,
                      background: index === 0 ? palette.navy2 : '#171717',
                      border: `1px solid ${
                        index === 2 ? 'rgba(118, 185, 0, 0.48)' : 'rgba(255, 255, 255, 0.14)'
                      }`,
                      display: 'grid',
                      alignContent: 'center',
                      textAlign: sideIndex === 0 ? 'right' : 'left',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 31,
                        lineHeight: 1,
                        fontWeight: 940,
                        color: index === 2 ? palette.cyan : palette.text,
                      }}
                    >
                      {title}
                    </div>
                    <div
                      style={{
                        marginTop: 12,
                        fontSize: 20,
                        lineHeight: 1.32,
                        color: 'rgba(255, 255, 255, 0.68)',
                      }}
                    >
                      {body}
                    </div>
                  </div>
                ))}
                <div
                  style={{
                    gridColumn: 2,
                    gridRow: 1,
                    minHeight: 112,
                    borderRadius: 999,
                    background: index === 1 ? palette.cyan : '#242424',
                    color: index === 1 ? palette.ink : palette.cyan,
                    border: `1px solid ${palette.cyan}`,
                    display: 'grid',
                    placeItems: 'center',
                    textAlign: 'center',
                    fontSize: 18,
                    lineHeight: 1.1,
                    fontWeight: 940,
                    letterSpacing: 0,
                  }}
                >
                  {row.lane}
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <div
          style={{
            height: '100%',
            display: 'grid',
            gridTemplateRows: '143px repeat(3, 151px)',
            gap: 18,
            minHeight: 0,
          }}
        >
          <Panel
            dark
            style={{
              padding: 24,
              background: palette.cyan,
              color: palette.ink,
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            <div style={{ ...smallCaps, color: palette.ink }}>Cloud endpoint</div>
            <h2 style={{ margin: '16px 0 0', fontSize: 38, lineHeight: 1.08 }}>
              資料安全送達雲端平台
            </h2>
          </Panel>
          {controlCards.map(([title, body], index) => (
            <Panel
              key={title}
              dark
              style={{
                padding: 24,
                display: 'grid',
                alignContent: 'center',
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              <div style={{ ...smallCaps, color: palette.cyan }}>
                Control {String(index + 1).padStart(2, '0')}
              </div>
              <h2 style={{ margin: '12px 0 8px', fontSize: 30, lineHeight: 1.12 }}>{title}</h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 21,
                  lineHeight: 1.32,
                  color: 'rgba(255, 255, 255, 0.72)',
                }}
              >
                {body}
              </p>
            </Panel>
          ))}
        </div>
      </div>
      <Footer page="18" dark />
    </div>
  );
};

const ApplicationLayer: Page = () => (
  <div style={lightPage}>
    <Header section="Application Layer" title="應用層：提供管理、通知與決策分析服務" />
    <div
      style={{
        marginTop: 44,
        display: 'grid',
        gridTemplateColumns: '1.12fr 0.88fr',
        gap: 42,
        alignItems: 'stretch',
        height: 635,
      }}
    >
      <Panel style={{ height: '100%', padding: 30 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 22, height: '100%' }}>
          <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', gap: 22 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              {[
                ['今日包裹', '284'],
                ['待取件', '67'],
                ['異常事件', '5'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{ flex: 1, padding: 20, borderRadius: 2, background: palette.panelSoft }}
                >
                  <div style={{ fontSize: 18, color: palette.muted, fontWeight: 800 }}>{label}</div>
                  <div style={{ marginTop: 8, fontSize: 42, color: palette.ink, fontWeight: 920 }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                borderRadius: 2,
                background: palette.navy,
                padding: 28,
                color: palette.text,
              }}
            >
              <div style={{ ...smallCaps, color: palette.cyan }}>Dashboard</div>
              <div
                style={{ marginTop: 44, display: 'flex', gap: 20, alignItems: 'end', height: 230 }}
              >
                {[44, 72, 58, 94, 76, 110, 86].map((height, index) => (
                  <div
                    key={height}
                    style={{ flex: 1, display: 'grid', gap: 12, alignItems: 'end' }}
                  >
                    <div
                      style={{
                        height: height * 2,
                        borderRadius: 7,
                        background: index === 3 ? palette.warning : palette.cyan,
                      }}
                    />
                    <div
                      style={{
                        textAlign: 'center',
                        color: 'rgba(255, 255, 255, 0.62)',
                        fontSize: 16,
                      }}
                    >
                      D{index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 16 }}>
            {['住戶 App', '後台管理', '通知服務', '權限管理', 'AI 分析'].map((item) => (
              <div
                key={item}
                style={{
                  padding: 18,
                  borderRadius: 2,
                  border: `1px solid ${palette.line}`,
                  fontSize: 24,
                  fontWeight: 820,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </Panel>
      <Panel style={{ height: '100%', padding: 34, display: 'grid', alignContent: 'start' }}>
        <BulletList
          items={[
            '雲端資料庫儲存包裹、住戶、取件與異常資料。',
            '行動 App 提供通知、查詢與取件驗證。',
            '資料儀表板分析包裹量、尖峰時段與逾期未取。',
            'AI 模組可預測包裹量、辨識異常行為並優化節點配置。',
          ]}
        />
      </Panel>
    </div>
    <Footer page="19" />
  </div>
);

const Integration: Page = () => {
  const pipeline = [
    ['01', '智慧承重板', 'Load Cell 偵測包裹放置、取走與重量變化', palette.cyan],
    ['02', 'ESP32 控制器', '整理重量、層位、條碼與影像事件', palette.cyanSoft],
    ['03', '安全傳輸', 'Wi-Fi / 5G / LoRa 搭配 MQTT 或 HTTPS', palette.blue],
    ['04', '雲端平台', '狀態判斷、事件管理、通知派送與 API 服務', palette.cyan],
    ['05', '資料庫', '保存包裹、住戶、取件與異常紀錄', palette.cyanSoft],
  ];
  const consumers = [
    ['住戶 App', '通知與取件驗證'],
    ['管理後台', '查詢、異常處理'],
    ['資料儀表板', '節點流量與尖峰分析'],
  ];

  return (
    <div style={{ ...pageBase, background: palette.navy }}>
      <CircuitBackdrop />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Header
          section="04 System Integration"
          title="技術整合架構：從感測設備到城市物流平台"
          dark
        />
        <div
          style={{
            marginTop: 34,
            display: 'grid',
            gridTemplateColumns: '1.14fr 0.86fr',
            gap: 34,
            alignItems: 'stretch',
          }}
        >
          <Panel
            dark
            style={{
              height: 650,
              padding: 30,
              background: '#101010',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ ...smallCaps, color: palette.cyan }}>End-to-end data pipeline</div>
            <div
              style={{
                position: 'absolute',
                left: 70,
                top: 116,
                bottom: 86,
                width: 4,
                background: 'rgba(118, 185, 0, 0.38)',
              }}
            />
            <div style={{ marginTop: 28, display: 'grid', gap: 13 }}>
              {pipeline.map(([number, title, body, color], index) => (
                <div
                  key={title}
                  style={{
                    position: 'relative',
                    display: 'grid',
                    gridTemplateColumns: '70px 1fr',
                    gap: 18,
                    alignItems: 'center',
                    minHeight: 92,
                  }}
                >
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 999,
                      background: color,
                      color: color === palette.blue ? '#ffffff' : palette.ink,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 18,
                      fontWeight: 940,
                      zIndex: 1,
                    }}
                  >
                    {number}
                  </div>
                  <div
                    style={{
                      padding: '18px 22px',
                      borderRadius: 2,
                      background: index === 3 ? 'rgba(118, 185, 0, 0.18)' : palette.navy2,
                      border: `1px solid ${
                        index === 3 ? 'rgba(118, 185, 0, 0.52)' : 'rgba(255, 255, 255, 0.14)'
                      }`,
                    }}
                  >
                    <div style={{ fontSize: 29, fontWeight: 920, lineHeight: 1.1 }}>{title}</div>
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 21,
                        lineHeight: 1.32,
                        color: 'rgba(255, 255, 255, 0.68)',
                      }}
                    >
                      {body}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel
            dark
            style={{
              height: 650,
              padding: 26,
              display: 'grid',
              gridTemplateRows: '30px 146px 58px 1fr 80px',
              gap: 14,
              background: '#171717',
              overflow: 'hidden',
            }}
          >
            <div style={{ ...smallCaps, color: palette.cyan }}>City logistics platform</div>
            <div
              style={{
                borderRadius: 2,
                background: palette.cyan,
                color: palette.ink,
                padding: 22,
                display: 'grid',
                alignContent: 'center',
              }}
            >
              <div style={{ fontSize: 36, lineHeight: 1.06, fontWeight: 940 }}>
                城市物流資料平台
              </div>
              <div style={{ marginTop: 10, fontSize: 20, lineHeight: 1.28, fontWeight: 760 }}>
                彙整多社區、多場域與公共取件點狀態。
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {['狀態判斷', '通知派送', '異常告警'].map((item) => (
                <div
                  key={item}
                  style={{
                    borderRadius: 2,
                    background: palette.navy2,
                    border: '1px solid rgba(118, 185, 0, 0.26)',
                    display: 'grid',
                    placeItems: 'center',
                    color: palette.cyan,
                    fontSize: 18,
                    fontWeight: 880,
                    textAlign: 'center',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
            <div
              style={{ display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: 10, minHeight: 0 }}
            >
              {consumers.map(([title, body]) => (
                <div
                  key={title}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 2,
                    background: palette.navy2,
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    display: 'grid',
                    gridTemplateColumns: '118px 1fr',
                    gap: 12,
                    alignItems: 'center',
                    minHeight: 0,
                  }}
                >
                  <div style={{ fontSize: 21, lineHeight: 1.12, fontWeight: 900 }}>{title}</div>
                  <div
                    style={{ fontSize: 18, lineHeight: 1.24, color: 'rgba(255, 255, 255, 0.68)' }}
                  >
                    {body}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 2,
                background: 'rgba(0, 70, 164, 0.28)',
                border: '1px solid rgba(118, 185, 0, 0.22)',
                display: 'grid',
                alignContent: 'center',
                fontSize: 19,
                lineHeight: 1.28,
                color: 'rgba(255, 255, 255, 0.76)',
              }}
            >
              單一節點即時管理，多節點串聯後支援城市級流量分析與服務治理。
            </div>
          </Panel>
        </div>
      </div>
      <Footer page="20" dark />
    </div>
  );
};

const Benefits: Page = () => {
  const benefits = [
    ['管理效率', '減少人工登記與查找時間', '管理員即時掌握包裹狀態'],
    ['取件便利', '即時通知與多元驗證', '住戶可彈性完成取件'],
    ['風險控管', '保留放置、通知、取件與異常紀錄', '降低誤領與遺失責任爭議'],
    ['空間彈性', '不受傳統櫃格尺寸限制', '支援不同大小包裹混合收受'],
    ['資料治理', '分析區域、時段與包裹流量', '協助優化物流節點配置'],
    ['城市推動', '整合社區、物流、物聯網與分析', '形成智慧城市基礎服務'],
  ];
  const metrics = [
    ['人工負荷', '下降'],
    ['取件安全', '提升'],
    ['節點資料', '可治理'],
  ];
  return (
    <div style={lightPage}>
      <Header section="05 Expected Benefits" title="預期效益：提升城市物流效率與社區服務品質" />
      <div
        style={{
          marginTop: 36,
          display: 'grid',
          gridTemplateColumns: '0.86fr 1.14fr',
          gap: 34,
          alignItems: 'stretch',
        }}
      >
        <Panel
          style={{
            height: 650,
            padding: 32,
            background: palette.navy,
            color: palette.text,
            position: 'relative',
            overflow: 'hidden',
            display: 'grid',
            alignContent: 'space-between',
          }}
        >
          <div>
            <div style={{ ...smallCaps, color: palette.cyan }}>Outcome dashboard</div>
            <h2 style={{ margin: '24px 0 0', fontSize: 52, lineHeight: 1.08 }}>
              從人工作業
              <br />
              升級為可治理服務
            </h2>
            <p
              style={{
                margin: '24px 0 0',
                fontSize: 25,
                lineHeight: 1.42,
                color: 'rgba(255, 255, 255, 0.72)',
              }}
            >
              系統把包裹收受、通知、取件與異常追蹤整合成同一條資料鏈，讓社區管理與城市物流都能被量測。
            </p>
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            {metrics.map(([label, value], index) => (
              <div
                key={label}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 112px',
                  gap: 16,
                  alignItems: 'center',
                  padding: '18px 20px',
                  borderRadius: 2,
                  background: index === 1 ? 'rgba(118, 185, 0, 0.22)' : palette.navy2,
                  border: '1px solid rgba(118, 185, 0, 0.22)',
                }}
              >
                <div style={{ fontSize: 25, fontWeight: 860 }}>{label}</div>
                <div
                  style={{
                    minHeight: 46,
                    display: 'grid',
                    placeItems: 'center',
                    borderRadius: 2,
                    background: index === 1 ? palette.cyan : '#242424',
                    color: index === 1 ? palette.ink : palette.cyan,
                    fontSize: 22,
                    fontWeight: 940,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              position: 'absolute',
              right: -120,
              top: -120,
              width: 300,
              height: 300,
              borderRadius: 999,
              border: `34px solid ${palette.cyan}`,
              opacity: 0.16,
            }}
          />
        </Panel>
        <div
          style={{
            height: 650,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
          }}
        >
          {benefits.map(([title, line1, line2], index) => (
            <Panel
              key={title}
              style={{
                padding: 22,
                display: 'grid',
                gridTemplateColumns: '58px 1fr',
                gap: 16,
                alignItems: 'start',
                background: index === 0 || index === 5 ? '#f7f7f7' : '#ffffff',
                borderColor: index === 0 || index === 5 ? palette.cyan : palette.line,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 999,
                  display: 'grid',
                  placeItems: 'center',
                  background: index % 2 === 0 ? palette.cyan : palette.navy,
                  color: index % 2 === 0 ? palette.ink : palette.cyan,
                  fontSize: 20,
                  fontWeight: 940,
                }}
              >
                {String(index + 1).padStart(2, '0')}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1.1, color: palette.ink }}>
                  {title}
                </h2>
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 22,
                    lineHeight: 1.32,
                    color: palette.muted,
                  }}
                >
                  {line1}
                </div>
                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: `1px solid ${palette.line}`,
                    fontSize: 20,
                    lineHeight: 1.28,
                    color: palette.ink,
                    fontWeight: 760,
                  }}
                >
                  {line2}
                </div>
              </div>
            </Panel>
          ))}
        </div>
      </div>
      <Footer page="21" />
    </div>
  );
};

const Conclusion: Page = () => (
  <div
    style={{
      ...pageBase,
      padding: '70px 92px',
      background: palette.navy,
    }}
  >
    <CircuitBackdrop />
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        display: 'grid',
        gridTemplateColumns: '0.92fr 1.08fr',
        gap: 50,
        height: '100%',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={eyebrowStyle}>Conclusion</div>
        <h1
          style={{
            margin: '24px 0 0',
            fontSize: 72,
            lineHeight: 1.1,
            letterSpacing: 0,
            fontWeight: 880,
          }}
        >
          以物聯網打造智慧城市
          <br />
          最後一哩物流服務
        </h1>
        <p
          style={{
            margin: '34px 0 0',
            fontSize: 30,
            lineHeight: 1.48,
            color: 'rgba(255, 255, 255, 0.76)',
          }}
        >
          智慧城市不只是讓設備連上網路，而是讓城市服務變得更有效率、更安全，也更貼近居民的日常生活。
        </p>
      </div>
      <div style={{ display: 'grid', alignContent: 'center', gap: 18 }}>
        {[
          '導入 AI 預測包裹尖峰時段',
          '與物流公司系統串接，優化配送流程',
          '建立公共取件站，降低重複配送與碳排放',
          '與智慧城市平台整合，形成城市物流資料治理系統',
        ].map((item, index) => (
          <Panel
            key={item}
            dark
            style={{ padding: '26px 30px', display: 'flex', gap: 20, alignItems: 'center' }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: 999,
                display: 'grid',
                placeItems: 'center',
                background: index === 0 ? palette.cyan : 'rgba(118, 185, 0, 0.14)',
                color: index === 0 ? palette.navy : palette.cyan,
                fontWeight: 920,
                fontSize: 22,
              }}
            >
              {index + 1}
            </div>
            <div style={{ fontSize: 27, lineHeight: 1.3, fontWeight: 760 }}>{item}</div>
          </Panel>
        ))}
      </div>
    </div>
    <Footer page="22" dark />
  </div>
);

export const meta: SlideMeta = {
  title: '智慧城市包裹物流管理系統',
  description: 'Smart City Package Logistics Management System',
};

export default [
  Cover,
  Demand,
  PainPoints,
  Scenario,
  Flow,
  AdminShelvingFlow,
  AdminIpadShelvingUi,
  NormalPickupFlow,
  MobileAppUi,
  NormalPickupDemoVideo,
  IrregularPickupFlow,
  PackageSwapFlow,
  SupplementalDemoVideos,
  IotLayers,
  HardwarePrototype,
  HardwareWiring,
  SensingLayer,
  NetworkLayer,
  ApplicationLayer,
  Integration,
  Benefits,
  Conclusion,
] satisfies Page[];
