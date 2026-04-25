import { useEffect, useMemo, useRef, useState } from 'react';
import type { Page, SlideMeta } from '@open-slide/core';

const palette = {
  bg: '#0C111A',
  surface: '#141A26',
  border: '#222B3C',
  text: '#E6EDF7',
  muted: '#7B889C',
  cyan: '#56D9FF',
  violet: '#9D7BFF',
  lime: '#9BE15D',
  amber: '#FFB547',
} as const;

const sans = '"Inter", system-ui, -apple-system, sans-serif';
const mono = '"SF Mono", "JetBrains Mono", ui-monospace, monospace';

const fill = {
  width: '100%',
  height: '100%',
  background: palette.bg,
  color: palette.text,
  fontFamily: sans,
  position: 'relative' as const,
  overflow: 'hidden' as const,
};

const styleSheet = `
@keyframes dv-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes dv-blip {
  0%   { transform: scale(1);   opacity: 1; }
  50%  { transform: scale(2.4); opacity: 0; }
  100% { transform: scale(1);   opacity: 0; }
}
@keyframes dv-spark {
  0%   { stroke-dashoffset: 240; }
  45%  { stroke-dashoffset: 0; }
  55%  { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: -240; }
}
@keyframes dv-grow {
  from { transform: scaleY(0); }
  to   { transform: scaleY(1); }
}
@keyframes dv-line-draw {
  to { stroke-dashoffset: 0; }
}
@keyframes dv-dot-in {
  from { opacity: 0; transform: translate(var(--dv-x), var(--dv-y)) scale(0); }
  to   { opacity: 1; transform: translate(var(--dv-x), var(--dv-y)) scale(1); }
}
.dv-frame {
  background: ${palette.surface};
  border: 1px solid ${palette.border};
  border-radius: 4px;
}
.dv-eyebrow {
  font-family: ${mono};
  font-size: 22px;
  letter-spacing: 0.32em;
  color: ${palette.muted};
  text-transform: uppercase;
}
.dv-tick {
  font-family: ${mono};
  font-size: 20px;
  color: ${palette.muted};
  letter-spacing: 0.06em;
}
.dv-pulse {
  position: relative;
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.dv-pulse::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: inherit;
  animation: dv-blip 1.6s ease-out infinite;
}
`;

// ───────────── shared building blocks ─────────────
function useCounter(target: number, duration = 1500, delay = 0): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    let startedAt = 0;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      if (!startedAt) startedAt = now;
      const elapsed = now - startedAt - delay;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(1, elapsed / duration);
      setValue(target * ease(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, delay]);
  return value;
}

function formatNumber(n: number, decimals = 0): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

const Frame: React.FC<{
  eyebrow: string;
  tick?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ eyebrow, tick, children, style }) => (
  <div
    className="dv-frame"
    style={{
      padding: 32,
      display: 'flex',
      flexDirection: 'column',
      ...style,
    }}
  >
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
      }}
    >
      <span className="dv-eyebrow">{eyebrow}</span>
      {tick && <span className="dv-tick">{tick}</span>}
    </div>
    {children}
  </div>
);

const TopBar: React.FC<{ label: string; pageNo: string }> = ({ label, pageNo }) => (
  <div
    style={{
      position: 'absolute',
      top: 56,
      left: 96,
      right: 96,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: `1px solid ${palette.border}`,
      paddingBottom: 24,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <span
        className="dv-pulse"
        style={{ background: palette.lime, marginRight: 6 }}
      />
      <span
        style={{
          fontFamily: mono,
          fontSize: 22,
          letterSpacing: '0.3em',
          color: palette.text,
        }}
      >
        MOTION // METRICS
      </span>
      <span style={{ color: palette.border }}>│</span>
      <span className="dv-eyebrow">{label}</span>
    </div>
    <div className="dv-tick">PAGE {pageNo}</div>
  </div>
);

// ───────────── Sparkline ─────────────
const Sparkline: React.FC<{ color: string; seed: number }> = ({ color, seed }) => {
  const points = useMemo(() => {
    const N = 24;
    const arr: { x: number; y: number }[] = [];
    let v = 0.5;
    for (let i = 0; i < N; i++) {
      // deterministic pseudo-random walk
      const rnd =
        Math.sin(seed * 9.1 + i * 1.7) * 0.5 +
        Math.cos(seed * 3.3 + i * 0.9) * 0.5;
      v = Math.max(0.1, Math.min(0.9, v + rnd * 0.18));
      arr.push({ x: (i / (N - 1)) * 280, y: 56 - v * 48 - 4 });
    }
    return arr;
  }, [seed]);
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  return (
    <svg width={280} height={56} style={{ display: 'block' }}>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeDasharray="240"
        style={{ animation: 'dv-spark 4.2s ease-in-out infinite' }}
      />
    </svg>
  );
};

// ───────────── PAGE 1: Hero dashboard ─────────────
const Cover: Page = () => {
  const visits = useCounter(248930, 1600, 200);
  const latency = useCounter(42.6, 1500, 350);
  const uptime = useCounter(99.982, 1700, 500);

  const tiles = [
    {
      label: 'SESSIONS / 24H',
      value: formatNumber(Math.round(visits)),
      delta: '+12.4%',
      color: palette.cyan,
      seed: 1,
    },
    {
      label: 'P95 LATENCY (MS)',
      value: formatNumber(latency, 1),
      delta: '−3.1%',
      color: palette.violet,
      seed: 2,
    },
    {
      label: 'EDGE UPTIME',
      value: `${formatNumber(uptime, 3)}%`,
      delta: '+0.004%',
      color: palette.lime,
      seed: 3,
    },
  ];

  return (
    <div style={fill}>
      <style>{styleSheet}</style>
      <TopBar label="OVERVIEW" pageNo="01 / 03" />

      <div
        style={{
          position: 'absolute',
          top: 168,
          left: 96,
          right: 96,
          bottom: 96,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ animation: 'dv-fade-in 0.6s ease-out both' }}>
          <div className="dv-eyebrow" style={{ marginBottom: 18 }}>
            REAL-TIME OBSERVATORY · Q2 2026
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 168,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 0.95,
              color: palette.text,
            }}
          >
            Numbers,<br />
            <span style={{ color: palette.cyan }}>in motion.</span>
          </h1>
          <p
            style={{
              marginTop: 28,
              fontSize: 32,
              color: palette.muted,
              maxWidth: 1100,
              lineHeight: 1.4,
            }}
          >
            A live read on traffic, latency, and reliability across the global edge —
            ticking, settling, recalculating.
          </p>
        </div>

        <div
          style={{
            marginTop: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 28,
          }}
        >
          {tiles.map((t, i) => (
            <Frame
              key={t.label}
              eyebrow={t.label}
              tick="LIVE"
              style={{
                animation: `dv-fade-in 0.6s ease-out ${0.2 + i * 0.12}s both`,
                minHeight: 260,
              }}
            >
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 96,
                  fontWeight: 600,
                  color: palette.text,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {t.value}
              </div>
              <div
                style={{
                  marginTop: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: 22,
                    color: t.color,
                  }}
                >
                  {t.delta}
                </span>
                <span className="dv-tick">vs prev. window</span>
              </div>
              <div style={{ marginTop: 'auto', paddingTop: 18 }}>
                <Sparkline color={t.color} seed={t.seed} />
              </div>
            </Frame>
          ))}
        </div>
      </div>
    </div>
  );
};

// ───────────── PAGE 2: Bars + Line ─────────────
const Charts: Page = () => {
  // Bar data
  const bars = [
    { label: 'MON', value: 62 },
    { label: 'TUE', value: 71 },
    { label: 'WED', value: 88 },
    { label: 'THU', value: 79 },
    { label: 'FRI', value: 94 },
    { label: 'SAT', value: 47 },
    { label: 'SUN', value: 35 },
  ];
  const maxBar = 100;

  // Line data — request volume across 24h
  const linePoints = useMemo(() => {
    const N = 24;
    const arr: { x: number; y: number; v: number }[] = [];
    for (let i = 0; i < N; i++) {
      const phase = (i / N) * Math.PI * 2;
      const v =
        50 +
        Math.sin(phase - 1) * 30 +
        Math.sin(phase * 2.3 + 0.6) * 8 +
        Math.cos(i * 0.7) * 4;
      arr.push({ x: i, y: v, v });
    }
    return arr;
  }, []);

  const W = 760;
  const H = 360;
  const PAD_L = 56;
  const PAD_R = 24;
  const PAD_T = 16;
  const PAD_B = 36;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const xOf = (i: number) => PAD_L + (i / (linePoints.length - 1)) * innerW;
  const yOf = (v: number) => PAD_T + innerH - (v / 100) * innerH;
  const linePath =
    'M ' +
    linePoints.map((p) => `${xOf(p.x).toFixed(1)} ${yOf(p.y).toFixed(1)}`).join(' L ');
  const areaPath =
    linePath +
    ` L ${xOf(linePoints.length - 1).toFixed(1)} ${(PAD_T + innerH).toFixed(1)}` +
    ` L ${xOf(0).toFixed(1)} ${(PAD_T + innerH).toFixed(1)} Z`;

  const last = linePoints[linePoints.length - 1];

  return (
    <div style={fill}>
      <style>{styleSheet}</style>
      <TopBar label="THROUGHPUT" pageNo="02 / 03" />

      <div
        style={{
          position: 'absolute',
          top: 168,
          left: 96,
          right: 96,
          bottom: 96,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ animation: 'dv-fade-in 0.5s ease-out both', marginBottom: 36 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 84,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            Where the <span style={{ color: palette.violet }}>load</span> lives.
          </h2>
          <p
            style={{
              marginTop: 14,
              fontSize: 28,
              color: palette.muted,
              maxWidth: 1100,
            }}
          >
            Weekly distribution of requests, plus a 24-hour rolling shape of throughput.
          </p>
        </div>

        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1fr 1.05fr',
            gap: 28,
          }}
        >
          {/* Bar chart */}
          <Frame eyebrow="WEEKLY · REQUESTS (M)" tick="W17">
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: 18,
                paddingTop: 24,
                paddingBottom: 12,
              }}
            >
              {bars.map((b, i) => {
                const heightPx = (b.value / maxBar) * 360;
                return (
                  <div
                    key={b.label}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: mono,
                        fontSize: 18,
                        color: palette.muted,
                        fontVariantNumeric: 'tabular-nums',
                        opacity: 0,
                        animation: `dv-fade-in 0.4s ease-out ${0.6 + i * 0.08}s both`,
                      }}
                    >
                      {b.value}
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: heightPx,
                        background: `linear-gradient(180deg, ${palette.cyan} 0%, ${palette.violet} 100%)`,
                        transformOrigin: 'bottom',
                        animation: `dv-grow 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.08}s both`,
                        borderRadius: '2px 2px 0 0',
                      }}
                    />
                    <div
                      className="dv-tick"
                      style={{ fontFamily: mono, fontSize: 18 }}
                    >
                      {b.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </Frame>

          {/* Line chart */}
          <Frame eyebrow="24H · RPS (K)" tick="UTC 00→24">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              width="100%"
              height="100%"
              style={{ flex: 1 }}
            >
              <defs>
                <linearGradient id="dv-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={palette.cyan} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={palette.cyan} stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* gridlines */}
              {[0, 25, 50, 75, 100].map((g) => {
                const y = yOf(g);
                return (
                  <g key={g}>
                    <line
                      x1={PAD_L}
                      x2={W - PAD_R}
                      y1={y}
                      y2={y}
                      stroke={palette.border}
                      strokeDasharray="2 4"
                      strokeWidth={1}
                    />
                    <text
                      x={PAD_L - 10}
                      y={y + 4}
                      textAnchor="end"
                      fontFamily={mono}
                      fontSize={14}
                      fill={palette.muted}
                    >
                      {g}
                    </text>
                  </g>
                );
              })}

              {/* x ticks */}
              {[0, 6, 12, 18, 23].map((i) => (
                <text
                  key={i}
                  x={xOf(i)}
                  y={H - PAD_B + 22}
                  textAnchor="middle"
                  fontFamily={mono}
                  fontSize={14}
                  fill={palette.muted}
                >
                  {String(i).padStart(2, '0')}
                </text>
              ))}

              {/* area fill — fades in */}
              <path
                d={areaPath}
                fill="url(#dv-area)"
                style={{
                  opacity: 0,
                  animation: 'dv-fade-in 0.8s ease-out 1.4s both',
                }}
              />

              {/* line — draw stroke */}
              <path
                d={linePath}
                fill="none"
                stroke={palette.cyan}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="2400"
                strokeDashoffset="2400"
                style={{
                  animation: 'dv-line-draw 1.8s cubic-bezier(0.65, 0, 0.35, 1) 0.3s forwards',
                }}
              />

              {/* end-point blip */}
              <g
                style={{
                  opacity: 0,
                  animation: 'dv-fade-in 0.4s ease-out 2.1s both',
                  transformOrigin: `${xOf(linePoints.length - 1)}px ${yOf(last.y)}px`,
                }}
              >
                <circle
                  cx={xOf(linePoints.length - 1)}
                  cy={yOf(last.y)}
                  r={18}
                  fill={palette.cyan}
                  opacity={0.18}
                >
                  <animate
                    attributeName="r"
                    values="6;26;6"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.4;0;0.4"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle
                  cx={xOf(linePoints.length - 1)}
                  cy={yOf(last.y)}
                  r={5}
                  fill={palette.cyan}
                />
              </g>
            </svg>
          </Frame>
        </div>
      </div>
    </div>
  );
};

// ───────────── PAGE 3: Scatter + summary ─────────────
const Scatter: Page = () => {
  // Generate scatter points along a noisy curve
  const dots = useMemo(() => {
    const N = 64;
    const arr: { x: number; y: number; size: number; color: string }[] = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const baseX = 60 + t * 940;
      const baseY = 360 - Math.pow(t, 0.85) * 280;
      const noise = Math.sin(i * 13.37) * 24 + Math.cos(i * 7.91) * 18;
      const noiseY = Math.cos(i * 11.12) * 22 + Math.sin(i * 5.31) * 14;
      const color =
        t < 0.33 ? palette.violet : t < 0.66 ? palette.cyan : palette.lime;
      arr.push({
        x: baseX + noise,
        y: baseY + noiseY,
        size: 4 + ((i * 17) % 7),
        color,
      });
    }
    return arr;
  }, []);

  const r2 = useCounter(0.962, 1500, 200);
  const slope = useCounter(1.84, 1500, 350);
  const samples = useCounter(12480, 1700, 500);

  return (
    <div style={fill}>
      <style>{styleSheet}</style>
      <TopBar label="REGRESSION · ADOPTION ↗ ENGAGEMENT" pageNo="03 / 03" />

      <div
        style={{
          position: 'absolute',
          top: 168,
          left: 96,
          right: 96,
          bottom: 96,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ animation: 'dv-fade-in 0.5s ease-out both', marginBottom: 28 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 84,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            One curve, <span style={{ color: palette.lime }}>twelve thousand dots.</span>
          </h2>
        </div>

        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1.3fr 1fr',
            gap: 28,
          }}
        >
          <Frame eyebrow="SAMPLE DISTRIBUTION" tick="N=12.48K">
            <svg
              viewBox="0 0 1040 400"
              width="100%"
              height="100%"
              style={{ flex: 1 }}
            >
              {/* axes */}
              <line
                x1={40}
                x2={1020}
                y1={370}
                y2={370}
                stroke={palette.border}
                strokeWidth={1}
              />
              <line
                x1={40}
                x2={40}
                y1={20}
                y2={370}
                stroke={palette.border}
                strokeWidth={1}
              />
              {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                <line
                  key={t}
                  x1={40 + t * 980}
                  x2={40 + t * 980}
                  y1={20}
                  y2={370}
                  stroke={palette.border}
                  strokeDasharray="2 4"
                  strokeWidth={1}
                  opacity={0.5}
                />
              ))}

              {/* dots */}
              {dots.map((d, i) => (
                <circle
                  key={i}
                  cx={0}
                  cy={0}
                  r={d.size}
                  fill={d.color}
                  fillOpacity={0.78}
                  style={{
                    // @ts-expect-error custom CSS vars
                    '--dv-x': `${d.x}px`,
                    '--dv-y': `${d.y}px`,
                    transform: `translate(${d.x}px, ${d.y}px)`,
                    transformBox: 'fill-box',
                    animation: `dv-dot-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${0.2 + (i / dots.length) * 1.2}s both`,
                  }}
                />
              ))}

              {/* fitted curve drawn after dots */}
              <path
                d={(() => {
                  const N = 80;
                  const pts: string[] = [];
                  for (let i = 0; i < N; i++) {
                    const t = i / (N - 1);
                    const x = 60 + t * 940;
                    const y = 360 - Math.pow(t, 0.85) * 280;
                    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
                  }
                  return pts.join(' ');
                })()}
                fill="none"
                stroke={palette.amber}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeDasharray="1500"
                strokeDashoffset="1500"
                style={{
                  animation: 'dv-line-draw 1.4s cubic-bezier(0.65, 0, 0.35, 1) 1.6s forwards',
                }}
              />

              {/* Callout */}
              <g
                style={{
                  opacity: 0,
                  animation: 'dv-fade-in 0.6s ease-out 2.6s both',
                }}
              >
                <line
                  x1={760}
                  y1={120}
                  x2={690}
                  y2={170}
                  stroke={palette.amber}
                  strokeWidth={1}
                />
                <circle cx={690} cy={170} r={4} fill={palette.amber} />
                <text
                  x={770}
                  y={108}
                  fontFamily={mono}
                  fontSize={18}
                  fill={palette.amber}
                  letterSpacing="0.1em"
                >
                  INFLECTION
                </text>
                <text
                  x={770}
                  y={132}
                  fontFamily={mono}
                  fontSize={14}
                  fill={palette.muted}
                >
                  week 7 · +84% MoM
                </text>
              </g>

              {/* axis labels */}
              <text
                x={40}
                y={394}
                fontFamily={mono}
                fontSize={14}
                fill={palette.muted}
              >
                ADOPTION →
              </text>
              <text
                x={40}
                y={16}
                fontFamily={mono}
                fontSize={14}
                fill={palette.muted}
              >
                ENGAGEMENT ↑
              </text>
            </svg>
          </Frame>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Frame eyebrow="GOODNESS OF FIT" tick="R²">
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 132,
                  fontWeight: 600,
                  color: palette.lime,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatNumber(r2, 3)}
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 22,
                  color: palette.muted,
                }}
              >
                Variance explained by the model.
              </div>
            </Frame>

            <Frame eyebrow="COEFFICIENT" tick="β₁">
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 88,
                  fontWeight: 600,
                  color: palette.cyan,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                +{formatNumber(slope, 2)}
              </div>
              <div style={{ marginTop: 8, fontSize: 22, color: palette.muted }}>
                Engagement units per adoption pt.
              </div>
            </Frame>

            <Frame eyebrow="OBSERVED SAMPLES" tick="WK 17">
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 88,
                  fontWeight: 600,
                  color: palette.violet,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatNumber(Math.round(samples))}
              </div>
              <div style={{ marginTop: 8, fontSize: 22, color: palette.muted }}>
                Sessions across 9 regions.
              </div>
            </Frame>
          </div>
        </div>
      </div>
    </div>
  );
};

export const meta: SlideMeta = { title: 'Motion // Metrics' };
export default [Cover, Charts, Scatter] satisfies Page[];
