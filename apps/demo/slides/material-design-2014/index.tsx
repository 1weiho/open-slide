import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';

export const design: DesignSystem = {
  palette: { bg: '#fafafa', text: '#212121', accent: '#3f51b5' },
  fonts: {
    display: 'Roboto, "Helvetica Neue", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    body: 'Roboto, "Helvetica Neue", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  },
  typeScale: { hero: 200, body: 36 },
  radius: 4,
};

const ink = {
  paper: '#ffffff',
  muted: '#616161',
  faint: '#9e9e9e',
  divider: '#e0e0e0',
  pink: '#ff4081',
  pinkA100: '#ff80ab',
  pinkA200: '#ff4081',
  pinkA400: '#f50057',
  pinkA700: '#c51162',
  teal: '#009688',
  amber: '#ffc107',
  green: '#4caf50',
  red: '#f44336',
};

// Material 2014 elevation shadows (dp 1, 2, 4, 8, 16, 24).
const ELEV: Record<number, string> = {
  1: '0 1px 1px rgba(0,0,0,0.14), 0 2px 1px -1px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.20)',
  2: '0 2px 2px rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px rgba(0,0,0,0.20)',
  4: '0 4px 5px rgba(0,0,0,0.14), 0 1px 10px rgba(0,0,0,0.12), 0 2px 4px -1px rgba(0,0,0,0.20)',
  8: '0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12), 0 5px 5px -3px rgba(0,0,0,0.20)',
  16: '0 16px 24px 2px rgba(0,0,0,0.14), 0 6px 30px 5px rgba(0,0,0,0.12), 0 8px 10px -5px rgba(0,0,0,0.20)',
  24: '0 24px 38px 3px rgba(0,0,0,0.14), 0 9px 46px 8px rgba(0,0,0,0.12), 0 11px 15px -7px rgba(0,0,0,0.20)',
};

const M_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const M_OVERSHOOT = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

const KEYFRAMES = `
@keyframes osd-rise { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
@keyframes osd-rise-sm { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
@keyframes osd-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes osd-scale-in { from { opacity: 0; transform: scale(0.7); } to { opacity: 1; transform: scale(1); } }
@keyframes osd-bar-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes osd-sweep-in { from { transform: translateX(-110%); } to { transform: translateX(0); } }
@keyframes osd-fab-drop {
  0%   { opacity: 0; transform: translateY(-260px) scale(0.4); }
  55%  { opacity: 1; transform: translateY(20px) scale(1.06); }
  78%  { transform: translateY(-6px) scale(0.99); }
  100% { transform: translateY(0) scale(1); }
}
@keyframes osd-fab-ripple {
  0%   { box-shadow: ${ELEV[4]}, 0 0 0 0 rgba(255,64,129,0.5); }
  100% { box-shadow: ${ELEV[4]}, 0 0 0 56px rgba(255,64,129,0); }
}
@keyframes osd-touch-ripple {
  0%   { transform: scale(0); opacity: 0.5; }
  100% { transform: scale(8); opacity: 0; }
}
@keyframes osd-elev-rise {
  from { opacity: 0; transform: translateY(60px); box-shadow: ${ELEV[1]}; }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes osd-checkbox-in {
  0%   { stroke-dashoffset: 24; }
  100% { stroke-dashoffset: 0; }
}
@keyframes osd-switch-on {
  0%, 40%   { transform: translateX(0); background: #fafafa; }
  60%, 100% { transform: translateX(28px); background: ${ink.pinkA200}; }
}
@keyframes osd-switch-track {
  0%, 40%   { background: rgba(0,0,0,0.26); }
  60%, 100% { background: rgba(255,64,129,0.5); }
}
@keyframes osd-slider {
  0%, 5%     { left: 0%; }
  45%, 55%   { left: 70%; }
  95%, 100%  { left: 0%; }
}
@keyframes osd-snackbar-in {
  0%   { transform: translateY(120%); }
  10%, 80% { transform: translateY(0); }
  100% { transform: translateY(120%); }
}
@keyframes osd-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes osd-fab-morph {
  0%, 18%   { width: 96px; }
  38%, 70%  { width: 640px; }
  90%, 100% { width: 96px; }
}
@keyframes osd-fab-label {
  0%, 30%   { opacity: 0; transform: translate(-12px, -50%); }
  45%, 70%  { opacity: 1; transform: translate(0, -50%); }
  82%, 100% { opacity: 0; transform: translate(-12px, -50%); }
}
@keyframes osd-fab-plus {
  0%, 30%   { opacity: 1; transform: translate(-50%, -50%) rotate(0deg); }
  40%, 75%  { opacity: 0; transform: translate(-50%, -50%) rotate(45deg); }
  88%, 100% { opacity: 1; transform: translate(-50%, -50%) rotate(0deg); }
}
`;

const Keyframes = () => <style>{KEYFRAMES}</style>;

const fill = {
  width: '100%',
  height: '100%',
  fontFamily: 'var(--osd-font-body)',
  color: 'var(--osd-text)',
  background: 'var(--osd-bg)',
} as const;

const eyebrow = {
  fontSize: 22,
  letterSpacing: '0.24em',
  textTransform: 'uppercase' as const,
  fontWeight: 500,
  color: 'var(--osd-accent)',
};

// ─────────────────────────────────────────────────────────────────
// 1. COVER — a Material "Inbox" app screen at full scale.
// ─────────────────────────────────────────────────────────────────

const Cover: Page = () => {
  const mailItems = [
    { name: 'Matias Duarte', subject: 'Re: Material spec — surfaces', color: ink.pink },
    { name: 'Google I/O', subject: 'Day 1 keynote starts at 9am', color: ink.amber },
    { name: 'Roboto Team', subject: 'Updated weights are live', color: ink.teal },
    { name: 'Android', subject: 'Lollipop developer preview', color: ink.green },
    { name: 'Polymer', subject: 'Paper elements ready', color: ink.red },
  ];
  const drawerItems = ['Inbox', 'Starred', 'Sent', 'Drafts', 'Spam'];

  return (
    <div
      style={{
        ...fill,
        padding: 80,
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
      }}
    >
      <Keyframes />

      {/* Title strip floating above the demo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          paddingLeft: 16,
          animation: `osd-fade 700ms ${M_EASE} 80ms both`,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 64,
            fontWeight: 900,
            letterSpacing: '-0.02em',
          }}
        >
          Material Design.
        </div>
        <div style={{ ...eyebrow, fontSize: 20 }}>Google · I/O 2014</div>
      </div>

      {/* App-screen mock — the page IS the demo */}
      <div
        style={{
          flex: 1,
          background: ink.paper,
          borderRadius: 6,
          boxShadow: ELEV[16],
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          animation: `osd-rise 900ms ${M_EASE} 200ms both`,
        }}
      >
        {/* App bar */}
        <div
          style={{
            height: 96,
            background: 'var(--osd-accent)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 32,
            gap: 32,
            transformOrigin: 'left center',
            animation: `osd-bar-grow 700ms ${M_EASE} 360ms both`,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: 36, height: 4, background: '#fff' }} />
            ))}
          </div>
          <div style={{ fontSize: 32, fontWeight: 500, letterSpacing: '0.02em' }}>Inbox</div>
        </div>

        {/* Body: drawer + list */}
        <div style={{ flex: 1, display: 'flex' }}>
          {/* Drawer */}
          <div
            style={{
              width: 320,
              background: '#fff',
              borderRight: `1px solid ${ink.divider}`,
              padding: '32px 0',
              display: 'flex',
              flexDirection: 'column',
              animation: `osd-sweep-in 700ms ${M_EASE} 700ms both`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '0 24px 24px',
                borderBottom: `1px solid ${ink.divider}`,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: ink.teal,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  fontWeight: 500,
                }}
              >
                M
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 500 }}>matias@google</div>
                <div style={{ fontSize: 14, color: ink.muted }}>Mountain View</div>
              </div>
            </div>
            {drawerItems.map((label, i) => (
              <div
                key={label}
                style={{
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 24px',
                  fontSize: 18,
                  fontWeight: i === 0 ? 700 : 400,
                  color: i === 0 ? 'var(--osd-accent)' : ink.muted,
                  background: i === 0 ? 'rgba(63,81,181,0.08)' : 'transparent',
                  animation: `osd-rise-sm 500ms ${M_EASE} ${1000 + i * 70}ms both`,
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Mail list */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {mailItems.map((m, i) => (
              <div
                key={m.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 24,
                  padding: '24px 32px',
                  borderBottom: `1px solid ${ink.divider}`,
                  animation: `osd-rise-sm 600ms ${M_EASE} ${1100 + i * 90}ms both`,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    flexShrink: 0,
                    borderRadius: '50%',
                    background: m.color,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    fontWeight: 500,
                  }}
                >
                  {m.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 20, fontWeight: 500 }}>{m.name}</div>
                  <div style={{ fontSize: 16, color: ink.muted, marginTop: 4 }}>{m.subject}</div>
                </div>
                <div style={{ fontSize: 14, color: ink.faint }}>{`${10 - i * 2}m`}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAB */}
        <div
          style={{
            position: 'absolute',
            right: 40,
            bottom: 40,
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: ink.pinkA200,
            color: '#fff',
            fontSize: 48,
            fontWeight: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: `osd-fab-drop 1000ms ${M_OVERSHOOT} 1700ms both, osd-fab-ripple 2400ms ${M_EASE} 2900ms infinite`,
          }}
        >
          ✎
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// 2. ELEVATION — six paper sheets at dp 1 / 2 / 4 / 8 / 16 / 24.
// ─────────────────────────────────────────────────────────────────

const Elevation: Page = () => {
  const dps = [1, 2, 4, 8, 16, 24] as const;
  return (
    <div
      style={{
        ...fill,
        padding: 120,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Keyframes />
      <div style={{ ...eyebrow, animation: `osd-fade 600ms ${M_EASE} 80ms both` }}>Elevation</div>
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 88,
          fontWeight: 900,
          margin: '24px 0 16px',
          letterSpacing: '-0.02em',
          animation: `osd-rise 800ms ${M_EASE} 180ms both`,
        }}
      >
        z-axis, in <span style={{ color: 'var(--osd-accent)' }}>dp</span>.
      </h2>
      <div
        style={{
          fontSize: 26,
          color: ink.muted,
          marginBottom: 80,
          animation: `osd-rise 700ms ${M_EASE} 320ms both`,
        }}
      >
        Six elevation tiers. Each one casts a measurably deeper shadow.
      </div>

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 32,
          alignItems: 'end',
        }}
      >
        {dps.map((dp, i) => {
          const lift = i * 14; // visualize z by lifting Y on screen
          return (
            <div
              key={dp}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 24,
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: 220 + i * 8,
                  background: ink.paper,
                  borderRadius: 4,
                  boxShadow: ELEV[dp],
                  marginBottom: lift,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--osd-font-display)',
                  fontSize: 56,
                  fontWeight: 300,
                  color: 'var(--osd-accent)',
                  animation: `osd-elev-rise 900ms ${M_EASE} ${500 + i * 140}ms both`,
                }}
              >
                {dp}
              </div>
              <div
                style={{
                  fontSize: 18,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: ink.muted,
                  fontWeight: 700,
                }}
              >
                {dp}dp
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// 3. COLOR — the Material 2014 palette wall.
// ─────────────────────────────────────────────────────────────────

const Color: Page = () => {
  const indigo = [
    { w: '50', c: '#e8eaf6', on: '#212121' },
    { w: '100', c: '#c5cae9', on: '#212121' },
    { w: '200', c: '#9fa8da', on: '#212121' },
    { w: '300', c: '#7986cb', on: '#fff' },
    { w: '400', c: '#5c6bc0', on: '#fff' },
    { w: '500', c: '#3f51b5', on: '#fff', hero: true },
    { w: '600', c: '#3949ab', on: '#fff' },
    { w: '700', c: '#303f9f', on: '#fff' },
    { w: '800', c: '#283593', on: '#fff' },
    { w: '900', c: '#1a237e', on: '#fff' },
  ];
  const pink = [
    { w: 'A100', c: '#ff80ab', on: '#212121' },
    { w: 'A200', c: '#ff4081', on: '#fff', hero: true },
    { w: 'A400', c: '#f50057', on: '#fff' },
    { w: 'A700', c: '#c51162', on: '#fff' },
  ];
  const families: Array<{ title: string; c: string; on: string }> = [
    { title: 'Red 500', c: '#f44336', on: '#fff' },
    { title: 'Orange 500', c: '#ff9800', on: '#212121' },
    { title: 'Amber 500', c: '#ffc107', on: '#212121' },
    { title: 'Green 500', c: '#4caf50', on: '#fff' },
    { title: 'Teal 500', c: '#009688', on: '#fff' },
    { title: 'Cyan 500', c: '#00bcd4', on: '#fff' },
    { title: 'Blue 500', c: '#2196f3', on: '#fff' },
    { title: 'Purple 500', c: '#9c27b0', on: '#fff' },
  ];

  const swatchRow = (
    s: { w: string; c: string; on: string; hero?: boolean },
    i: number,
    delayBase: number,
  ) => (
    <div
      key={s.w}
      style={{
        background: s.c,
        color: s.on,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
        height: 50,
        fontSize: 16,
        fontWeight: 500,
        position: 'relative',
        animation: `osd-rise-sm 500ms ${M_EASE} ${delayBase + i * 50}ms both`,
      }}
    >
      <span style={{ letterSpacing: '0.04em', fontWeight: s.hero ? 700 : 500 }}>{s.w}</span>
      <span
        style={{
          fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
          fontSize: 13,
          opacity: 0.85,
        }}
      >
        {s.c.toUpperCase()}
      </span>
      {s.hero && (
        <span
          style={{
            position: 'absolute',
            right: -8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: s.on,
          }}
        />
      )}
    </div>
  );

  return (
    <div
      style={{
        ...fill,
        padding: 100,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Keyframes />
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 48,
        }}
      >
        <div>
          <div style={{ ...eyebrow, animation: `osd-fade 600ms ${M_EASE} 80ms both` }}>
            Color · 2014
          </div>
          <h2
            style={{
              fontFamily: 'var(--osd-font-display)',
              fontSize: 80,
              fontWeight: 900,
              margin: '16px 0 0',
              letterSpacing: '-0.02em',
              animation: `osd-rise 800ms ${M_EASE} 180ms both`,
            }}
          >
            <span style={{ color: 'var(--osd-accent)' }}>500</span> primary,{' '}
            <span style={{ color: ink.pinkA200 }}>A200</span> accent.
          </h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 40, flex: 1 }}>
        {/* Indigo column */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 16,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: ink.muted,
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            Primary · Indigo
          </div>
          <div style={{ borderRadius: 4, overflow: 'hidden', boxShadow: ELEV[2] }}>
            {indigo.map((s, i) => swatchRow(s, i, 400))}
          </div>
        </div>

        {/* Pink column */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 16,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: ink.muted,
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            Accent · Pink
          </div>
          <div style={{ borderRadius: 4, overflow: 'hidden', boxShadow: ELEV[2] }}>
            {pink.map((s, i) => swatchRow(s, i, 700))}
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 18,
              color: ink.muted,
              lineHeight: 1.5,
              animation: `osd-fade 700ms ${M_EASE} 1100ms both`,
            }}
          >
            Accents pop on top of the primary surface — used for FABs, switches, selection states.
          </div>
        </div>

        {/* Other 500-weight families */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 16,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: ink.muted,
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            …and 17 more families
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {families.map((f, i) => (
              <div
                key={f.title}
                style={{
                  background: f.c,
                  color: f.on,
                  padding: '14px 16px',
                  fontSize: 15,
                  fontWeight: 500,
                  letterSpacing: '0.04em',
                  borderRadius: 4,
                  boxShadow: ELEV[1],
                  animation: `osd-scale-in 500ms ${M_OVERSHOOT} ${500 + i * 70}ms both`,
                }}
              >
                {f.title}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// 4. TYPE — Roboto type scale, Material 2014 spec.
// ─────────────────────────────────────────────────────────────────

const Type: Page = () => {
  const scale = [
    { name: 'Display', size: 144, weight: 300, sample: 'Material', tracking: '-0.04em' },
    { name: 'Headline', size: 72, weight: 400, sample: 'Designed for scale', tracking: '-0.01em' },
    { name: 'Title', size: 48, weight: 500, sample: 'Bold typographic hierarchy', tracking: '0' },
    { name: 'Subhead', size: 36, weight: 400, sample: 'Roboto, in 12 weights', tracking: '0' },
    { name: 'Body', size: 28, weight: 400, sample: 'Body copy is set in 14sp.', tracking: '0' },
    {
      name: 'Caption',
      size: 20,
      weight: 400,
      sample: 'CAPTIONS WHISPER IN ALL-CAPS',
      tracking: '0.16em',
    },
  ] as const;

  return (
    <div
      style={{
        ...fill,
        padding: 100,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Keyframes />
      <div style={{ ...eyebrow, animation: `osd-fade 600ms ${M_EASE} 80ms both` }}>
        Roboto type scale
      </div>
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 64,
          fontWeight: 900,
          margin: '16px 0 48px',
          letterSpacing: '-0.02em',
          animation: `osd-rise 800ms ${M_EASE} 180ms both`,
        }}
      >
        From hero to caption, in one ramp.
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {scale.map((s, i) => (
          <div
            key={s.name}
            style={{
              display: 'grid',
              gridTemplateColumns: '180px 1fr 120px',
              alignItems: 'baseline',
              gap: 32,
              borderBottom: `1px solid ${ink.divider}`,
              paddingBottom: 16,
              animation: `osd-rise-sm 600ms ${M_EASE} ${380 + i * 110}ms both`,
            }}
          >
            <div
              style={{
                fontSize: 14,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: ink.muted,
                fontWeight: 700,
              }}
            >
              {s.name}
            </div>
            <div
              style={{
                fontSize: s.size,
                fontWeight: s.weight,
                letterSpacing: s.tracking,
                lineHeight: 1.0,
                color: 'var(--osd-text)',
              }}
            >
              {s.sample}
            </div>
            <div
              style={{
                fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                fontSize: 14,
                color: ink.faint,
                textAlign: 'right',
              }}
            >
              {s.size}px · {s.weight}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// 5. RIPPLE — touch feedback, looping forever.
// ─────────────────────────────────────────────────────────────────

const Ripple: Page = () => {
  const taps = [
    { x: 22, y: 38, delay: 200, color: 'var(--osd-accent)' },
    { x: 70, y: 22, delay: 1000, color: ink.pinkA200 },
    { x: 50, y: 70, delay: 1700, color: ink.teal },
    { x: 18, y: 78, delay: 2400, color: ink.amber },
    { x: 82, y: 60, delay: 3100, color: 'var(--osd-accent)' },
    { x: 38, y: 30, delay: 3800, color: ink.pinkA200 },
  ];

  return (
    <div
      style={{
        ...fill,
        padding: 100,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Keyframes />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 32,
        }}
      >
        <div>
          <div style={{ ...eyebrow, animation: `osd-fade 600ms ${M_EASE} 80ms both` }}>
            Touch feedback
          </div>
          <h2
            style={{
              fontFamily: 'var(--osd-font-display)',
              fontSize: 80,
              fontWeight: 900,
              margin: '16px 0 0',
              letterSpacing: '-0.02em',
              animation: `osd-rise 800ms ${M_EASE} 180ms both`,
            }}
          >
            The <span style={{ color: ink.pinkA200 }}>ripple</span>.
          </h2>
        </div>
        <div
          style={{
            fontSize: 22,
            color: ink.muted,
            maxWidth: 520,
            textAlign: 'right',
            lineHeight: 1.4,
            animation: `osd-fade 800ms ${M_EASE} 380ms both`,
          }}
        >
          Every tap radiates outward from the contact point. The first time the web saw it, it
          looked like magic.
        </div>
      </div>

      {/* Surface */}
      <div
        style={{
          flex: 1,
          background: ink.paper,
          borderRadius: 8,
          boxShadow: ELEV[8],
          position: 'relative',
          overflow: 'hidden',
          animation: `osd-rise 800ms ${M_EASE} 320ms both`,
        }}
      >
        {/* Subtle 8dp grid behind */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(${ink.divider} 1px, transparent 1px), linear-gradient(90deg, ${ink.divider} 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
            opacity: 0.4,
          }}
        />
        {taps.map((t, i) => (
          <div key={i} style={{ position: 'absolute', left: `${t.x}%`, top: `${t.y}%` }}>
            {/* Tap dot */}
            <div
              style={{
                position: 'absolute',
                left: -8,
                top: -8,
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: t.color,
                opacity: 0.9,
                boxShadow: ELEV[2],
              }}
            />
            {/* Ripple */}
            <div
              style={{
                position: 'absolute',
                left: -32,
                top: -32,
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: t.color,
                animation: `osd-touch-ripple 4500ms ${M_EASE} ${t.delay}ms infinite`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// 6. COMPONENTS — kitchen-sink demo, all parts moving on their own.
// ─────────────────────────────────────────────────────────────────

const Components: Page = () => {
  const cellStyle = {
    background: ink.paper,
    borderRadius: 6,
    boxShadow: ELEV[2],
    padding: 32,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
    minHeight: 220,
  };
  const labelStyle = {
    fontSize: 14,
    letterSpacing: '0.16em',
    textTransform: 'uppercase' as const,
    fontWeight: 700,
    color: ink.faint,
  };

  return (
    <div
      style={{
        ...fill,
        padding: 100,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Keyframes />
      <div style={{ ...eyebrow, animation: `osd-fade 600ms ${M_EASE} 80ms both` }}>Components</div>
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 72,
          fontWeight: 900,
          margin: '16px 0 48px',
          letterSpacing: '-0.02em',
          animation: `osd-rise 800ms ${M_EASE} 180ms both`,
        }}
      >
        The kit, in motion.
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 32,
          flex: 1,
        }}
      >
        {/* Switch */}
        <div style={{ ...cellStyle, animation: `osd-rise 700ms ${M_EASE} 320ms both`, gap: 24 }}>
          <div style={labelStyle}>Switch</div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 24,
            }}
          >
            <div
              style={{
                width: 64,
                height: 24,
                borderRadius: 12,
                position: 'relative',
                animation: `osd-switch-track 2400ms ${M_EASE} infinite`,
                background: 'rgba(0,0,0,0.26)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -6,
                  left: 0,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#fafafa',
                  boxShadow: ELEV[2],
                  animation: `osd-switch-on 2400ms ${M_EASE} infinite`,
                }}
              />
            </div>
            <div style={{ fontSize: 22, color: 'var(--osd-text)', fontWeight: 500 }}>Wi-Fi</div>
          </div>
        </div>

        {/* Slider */}
        <div style={{ ...cellStyle, animation: `osd-rise 700ms ${M_EASE} 420ms both`, gap: 24 }}>
          <div style={labelStyle}>Slider</div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              padding: '0 8px',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 4,
                background: ink.divider,
                borderRadius: 2,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -8,
                  left: 0,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'var(--osd-accent)',
                  boxShadow: ELEV[2],
                  animation: `osd-slider 6000ms ${M_EASE} infinite`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Checkbox */}
        <div style={{ ...cellStyle, animation: `osd-rise 700ms ${M_EASE} 520ms both`, gap: 24 }}>
          <div style={labelStyle}>Checkbox</div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 3,
                background: 'var(--osd-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" style={{ overflow: 'visible' }}>
                <title>checkmark</title>
                <polyline
                  points="4,12 10,18 20,6"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: 24,
                    animation: `osd-checkbox-in 600ms ${M_EASE} 1100ms both`,
                  }}
                />
              </svg>
            </div>
            <div style={{ fontSize: 22, fontWeight: 500 }}>I agree to the terms</div>
          </div>
        </div>

        {/* Raised button */}
        <div style={{ ...cellStyle, animation: `osd-rise 700ms ${M_EASE} 620ms both`, gap: 24 }}>
          <div style={labelStyle}>Raised button</div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <button
              type="button"
              style={{
                background: 'var(--osd-accent)',
                color: '#fff',
                border: 'none',
                padding: '0 24px',
                height: 48,
                borderRadius: 3,
                fontSize: 16,
                letterSpacing: '0.08em',
                fontWeight: 500,
                textTransform: 'uppercase',
                fontFamily: 'inherit',
                boxShadow: ELEV[2],
                cursor: 'default',
              }}
            >
              Get started
            </button>
          </div>
        </div>

        {/* Chip */}
        <div style={{ ...cellStyle, animation: `osd-rise 700ms ${M_EASE} 720ms both`, gap: 24 }}>
          <div style={labelStyle}>Chip</div>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            {[
              { name: 'M', label: 'Matias', bg: ink.pinkA200 },
              { name: 'R', label: 'Roboto', bg: 'var(--osd-accent)' },
              { name: 'A', label: 'Android', bg: ink.green },
            ].map((c) => (
              <div
                key={c.label}
                style={{
                  height: 36,
                  borderRadius: 18,
                  background: '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  paddingRight: 14,
                  gap: 8,
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: c.bg,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {c.name}
                </div>
                {c.label}
              </div>
            ))}
          </div>
        </div>

        {/* Snackbar */}
        <div
          style={{
            ...cellStyle,
            animation: `osd-rise 700ms ${M_EASE} 820ms both`,
            position: 'relative',
            overflow: 'hidden',
            gap: 24,
          }}
        >
          <div style={labelStyle}>Snackbar</div>
          <div
            style={{
              flex: 1,
              background: '#fafafa',
              borderRadius: 4,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                right: 16,
                height: 56,
                background: '#323232',
                color: '#fff',
                borderRadius: 4,
                boxShadow: ELEV[8],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                fontSize: 15,
                animation: `osd-snackbar-in 5000ms ${M_EASE} 1500ms infinite`,
              }}
            >
              <span>Message archived</span>
              <span
                style={{
                  color: ink.pinkA200,
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  fontSize: 13,
                }}
              >
                Undo
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// 7. CLOSING — FAB → toolbar morph, plus the wordmark.
// ─────────────────────────────────────────────────────────────────

const Closing: Page = () => (
  <div
    style={{
      ...fill,
      padding: 120,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <Keyframes />
    <div
      style={{
        position: 'absolute',
        right: -200,
        top: -200,
        width: 700,
        height: 700,
        borderRadius: '50%',
        background: 'var(--osd-accent)',
        opacity: 0,
        animation: `osd-fade 1200ms ${M_EASE} 200ms forwards`,
        animationFillMode: 'forwards',
      }}
    />
    <div
      style={{
        position: 'absolute',
        right: -100,
        top: -100,
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: 'var(--osd-accent)',
        opacity: 0.06,
      }}
    />

    <div style={{ ...eyebrow, animation: `osd-fade 600ms ${M_EASE} 100ms both` }}>
      A decade later
    </div>
    <h2
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 220,
        fontWeight: 900,
        margin: '24px 0 40px',
        lineHeight: 0.95,
        letterSpacing: '-0.04em',
        animation: `osd-rise 900ms ${M_EASE} 220ms both`,
      }}
    >
      Material.
    </h2>

    {/* FAB → toolbar morph. Wrap so the morph target isn't flex-stretched
        by the page column; animate width only, keep border-radius constant
        at 48px so 96×96 reads as a circle and 560×96 reads as a pill. */}
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        animation: `osd-rise 800ms ${M_EASE} 600ms both`,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 96,
          height: 96,
          borderRadius: 48,
          background: ink.pinkA200,
          boxShadow: ELEV[8],
          color: '#fff',
          overflow: 'hidden',
          animation: `osd-fab-morph 5000ms ${M_EASE} 1200ms infinite both`,
          willChange: 'width',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '50%',
            left: 48,
            fontSize: 40,
            fontWeight: 300,
            lineHeight: 1,
            transform: 'translate(-50%, -50%)',
            animation: `osd-fab-plus 5000ms ${M_EASE} 1200ms infinite both`,
          }}
        >
          +
        </span>
        <span
          style={{
            position: 'absolute',
            top: '50%',
            left: 96,
            right: 96,
            fontSize: 22,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            textAlign: 'center',
            transform: 'translateY(-50%)',
            animation: `osd-fab-label 5000ms ${M_EASE} 1200ms infinite both`,
          }}
        >
          Compose · Photo · Audio · Location
        </span>
      </div>
    </div>

    <p
      style={{
        fontSize: 28,
        lineHeight: 1.5,
        color: ink.muted,
        maxWidth: 1200,
        margin: '40px 0 0',
        animation: `osd-fade 800ms ${M_EASE} 1100ms both`,
      }}
    >
      Cards, FABs, elevation, ripple, and the 500/A200 palette became the default vocabulary of an
      entire decade of product design.
    </p>
  </div>
);

export const meta: SlideMeta = { title: 'Material Design (2014)' };
export default [Cover, Elevation, Color, Type, Ripple, Components, Closing] satisfies Page[];
