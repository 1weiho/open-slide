import type { DesignSystem, Page, SlideMeta, SlideTransition } from '@open-slide/core';
import type { CSSProperties } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#08080a', text: '#fafaf5', accent: '#ff2d4a' },
  fonts: {
    display: '"Inter Tight", "Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    body: '-apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif',
  },
  typeScale: { hero: 200, body: 32 },
  radius: 4,
};

const muted = 'rgba(250, 250, 245, 0.46)';
const hairline = 'rgba(250, 250, 245, 0.12)';

const fill = {
  width: '100%',
  height: '100%',
  fontFamily: 'var(--osd-font-body)',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
} as const;

const EYEBROW: CSSProperties = {
  fontSize: 18,
  letterSpacing: '0.32em',
  color: 'var(--osd-accent)',
  textTransform: 'uppercase',
  fontWeight: 600,
};

const FOOT: CSSProperties = {
  fontSize: 17,
  letterSpacing: '0.28em',
  color: muted,
  textTransform: 'uppercase',
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 500,
};

const Intro: Page = () => (
  <div
    style={{
      ...fill,
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
      padding: '120px 144px',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <div style={EYEBROW}>the transition api</div>
      <div style={{ ...EYEBROW, color: muted }}>preface</div>
    </div>
    <div style={{ alignSelf: 'center' }}>
      <div style={{ ...EYEBROW, color: muted, marginBottom: 44 }}>now shipping · v1.7.0</div>
      <h1
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 184,
          fontWeight: 800,
          lineHeight: 0.92,
          letterSpacing: '-0.05em',
          margin: 0,
        }}
      >
        Introducing
        <br />
        <span style={{ color: 'var(--osd-accent)' }}>Transition</span>
        <span style={{ color: 'var(--osd-accent)' }}>.</span>
      </h1>
      <p
        style={{
          fontSize: 28,
          lineHeight: 1.5,
          color: muted,
          marginTop: 56,
          maxWidth: 1100,
          borderTop: `1px solid ${hairline}`,
          paddingTop: 32,
        }}
      >
        A per-page animation API. Two keyframe arrays, one easing curve, every transformable
        property the browser already understands — and the GPU does the rest.
      </p>
    </div>
    <div style={{ ...FOOT, display: 'flex', justifyContent: 'space-between' }}>
      <span>00 · bloom</span>
      <span>begin →</span>
    </div>
  </div>
);

const Cover: Page = () => (
  <div
    style={{
      ...fill,
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
      padding: '120px 144px',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <div style={EYEBROW}>open-slide · field notes · vol. ii</div>
      <div style={{ ...EYEBROW, color: muted }}>showcase</div>
    </div>
    <div style={{ alignSelf: 'center' }}>
      <h1
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 'var(--osd-size-hero)',
          fontWeight: 800,
          lineHeight: 0.9,
          letterSpacing: '-0.05em',
          margin: 0,
        }}
      >
        Maximal<span style={{ color: 'var(--osd-accent)' }}>.</span>
      </h1>
      <p
        style={{
          fontSize: 30,
          lineHeight: 1.45,
          color: muted,
          marginTop: 56,
          maxWidth: 1100,
        }}
      >
        Eight effects you can&rsquo;t draw in a binary slide format — every one in under twenty
        lines of code, every one rendered by your browser, every frame still vector.
      </p>
    </div>
    <div style={{ ...FOOT, display: 'flex', justifyContent: 'space-between' }}>
      <span>01 · iris</span>
      <span>arrow keys ⇆</span>
    </div>
  </div>
);

const Show = ({
  n,
  label,
  heading,
  pull,
  body,
  glyph,
}: {
  n: string;
  label: string;
  heading: string;
  pull: string;
  body: string;
  glyph: React.ReactNode;
}) => (
  <div
    style={{
      ...fill,
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
      padding: '120px 144px',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <div style={EYEBROW}>{`§ ${n} · ${label}`}</div>
      <div style={{ ...EYEBROW, color: muted }}>effect</div>
    </div>
    <div
      style={{
        alignSelf: 'center',
        display: 'grid',
        gridTemplateColumns: '1.05fr 1fr',
        columnGap: 120,
        alignItems: 'center',
      }}
    >
      <div>
        <div style={{ marginBottom: 56, opacity: 0.9 }}>{glyph}</div>
        <h2
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 108,
            fontWeight: 800,
            lineHeight: 0.96,
            letterSpacing: '-0.04em',
            margin: 0,
          }}
        >
          {heading}
        </h2>
      </div>
      <div>
        <p
          style={{
            fontSize: 38,
            lineHeight: 1.35,
            color: 'var(--osd-text)',
            margin: 0,
            fontFamily: 'var(--osd-font-display)',
            fontWeight: 500,
            letterSpacing: '-0.015em',
          }}
        >
          &ldquo;{pull}&rdquo;
        </p>
        <p
          style={{
            fontSize: 24,
            lineHeight: 1.6,
            color: muted,
            marginTop: 56,
            borderTop: `1px solid ${hairline}`,
            paddingTop: 32,
          }}
        >
          {body}
        </p>
      </div>
    </div>
    <div style={{ ...FOOT, display: 'flex', justifyContent: 'space-between' }}>
      <span>
        {n} · {label}
      </span>
      <span>transition · {label}</span>
    </div>
  </div>
);

const FlipGlyph = (
  <svg width="220" height="160" viewBox="0 0 220 160" fill="none" aria-hidden>
    <rect x="14" y="20" width="112" height="120" stroke={muted} strokeWidth="1.5" />
    <path
      d="M94 8 L206 28 L206 148 L94 152 Z"
      stroke="var(--osd-accent)"
      strokeWidth="2"
      fill="rgba(255,45,74,0.06)"
    />
    <line x1="94" y1="8" x2="94" y2="152" stroke="var(--osd-text)" strokeWidth="1" opacity="0.4" />
  </svg>
);

const GlitchGlyph = (
  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
    <span
      style={{
        fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
        fontSize: 64,
        fontWeight: 700,
        color: 'var(--osd-text)',
        textShadow: '-6px 0 0 rgba(0, 255, 255, 0.85), 6px 0 0 rgba(255, 0, 80, 0.85)',
        letterSpacing: '0.04em',
      }}
    >
      R/G/B
    </span>
  </div>
);

const WarpGlyph = (
  <svg width="240" height="120" viewBox="0 0 240 120" fill="none" aria-hidden>
    {Array.from({ length: 7 }).map((_, i) => (
      <line
        key={i}
        x1={20 + i * 12}
        y1={60}
        x2={220 - i * 4}
        y2={60}
        stroke="var(--osd-accent)"
        strokeWidth={1.5 + i * 0.4}
        opacity={0.2 + i * 0.11}
      />
    ))}
  </svg>
);

const ShearGlyph = (
  <svg width="220" height="140" viewBox="0 0 220 140" fill="none" aria-hidden>
    <path d="M16 30 L160 18 L196 110 L52 122 Z" stroke="var(--osd-accent)" strokeWidth="2" />
    <path d="M44 38 L182 26 L212 112 L74 122 Z" stroke={muted} strokeWidth="1.5" />
    <line
      x1={0}
      y1={70}
      x2={220}
      y2={70}
      stroke="var(--osd-text)"
      strokeDasharray="2 6"
      strokeWidth={1}
      opacity={0.4}
    />
  </svg>
);

const PortalGlyph = (
  <svg width="180" height="180" viewBox="0 0 180 180" fill="none" aria-hidden>
    <circle cx="90" cy="90" r="76" stroke={muted} strokeWidth="1" />
    <path d="M90 14 A 76 76 0 0 1 166 90" stroke="var(--osd-accent)" strokeWidth="3" fill="none" />
    <path d="M90 90 L 138 38" stroke="var(--osd-text)" strokeWidth="1.5" opacity="0.7" />
    <circle cx="90" cy="90" r="4" fill="var(--osd-accent)" />
  </svg>
);

const Flip: Page = () => (
  <Show
    n="02"
    label="flip"
    heading={'Real\ndepth.'}
    pull="A perspective value. A rotateY. That is the whole effect."
    body="Sixteen-hundred pixels of perspective and eighteen degrees of yaw — the browser hands it straight to the GPU. PowerPoint has to fake depth with a pre-rendered sprite sheet; here, depth is a single transform that composites in one frame."
    glyph={FlipGlyph}
  />
);

const Glitch: Page = () => (
  <Show
    n="03"
    label="glitch"
    heading={'Chromatic\naberration.'}
    pull="Two drop-shadows, a step easing, three frames of stutter."
    body="The cyan and magenta channels split by a few pixels in opposite directions; steps(5) drops the framerate on purpose. The whole effect is two filters stacked on a div — there is no slide format on earth that can serialize this as a binary blob."
    glyph={GlitchGlyph}
  />
);

const Warp: Page = () => (
  <Show
    n="04"
    label="warp"
    heading={'Thirty pixels\nof blur.'}
    pull="Scale past one. Blur past ten. The eye reads as velocity."
    body="A thirty-pixel filter blur paired with a 140 percent scale on exit, met by an inbound 60 percent scale-up from an even heavier blur. The bridge feels like a hyperspace jump, but every frame is still composited live — no baked video, no rasterized cache."
    glyph={WarpGlyph}
  />
);

const Sweep: Page = () => (
  <Show
    n="05"
    label="sweep"
    heading={'Skew, then\nslide.'}
    pull="Translate. Skew. Done."
    body="The outgoing page glides past the camera at a fourteen-degree tilt; the inbound page arrives from the opposite side at the same tilt, then squares up to zero. Two transforms per phase, one cohesive gesture — a vocabulary other tools spend whole UI panels trying to expose."
    glyph={ShearGlyph}
  />
);

const Closing: Page = () => (
  <div
    style={{
      ...fill,
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
      padding: '120px 144px',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <div style={EYEBROW}>§ 06 · portal</div>
      <div style={{ ...EYEBROW, color: muted }}>fin</div>
    </div>
    <div style={{ alignSelf: 'center', maxWidth: 1500 }}>
      <div style={{ marginBottom: 56 }}>{PortalGlyph}</div>
      <h2
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 160,
          fontWeight: 800,
          lineHeight: 0.94,
          letterSpacing: '-0.045em',
          margin: 0,
        }}
      >
        All possible<span style={{ color: 'var(--osd-accent)' }}>.</span>
        <br />
        None <span style={{ fontStyle: 'italic', fontWeight: 500 }}>recommended</span>
        <span style={{ color: 'var(--osd-accent)' }}>.</span>
      </h2>
      <p
        style={{
          fontSize: 24,
          lineHeight: 1.6,
          color: muted,
          marginTop: 56,
          maxWidth: 1000,
          borderTop: `1px solid ${hairline}`,
          paddingTop: 32,
        }}
      >
        Every effect in this deck is a few keyframes — clip-path, perspective, filter, skew, the
        whole CSS animation surface, exposed verbatim. Use them when the moment earns it. Then head
        back to <em>On Tasteful Transitions</em> and remember why you didn&rsquo;t.
      </p>
    </div>
    <div style={{ ...FOOT, display: 'flex', justifyContent: 'space-between' }}>
      <span>06 · portal</span>
      <span>← to revisit</span>
    </div>
  </div>
);

const Cli: Page = () => (
  <div
    style={{
      ...fill,
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
      padding: '120px 144px',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <div style={EYEBROW}>try it now</div>
      <div style={{ ...EYEBROW, color: muted }}>install</div>
    </div>
    <div style={{ alignSelf: 'center' }}>
      <div style={{ ...EYEBROW, color: muted, marginBottom: 44 }}>one command · zero config</div>
      <div
        style={{
          fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
          fontSize: 88,
          fontWeight: 700,
          letterSpacing: '-0.025em',
          lineHeight: 1.1,
          color: 'var(--osd-text)',
        }}
      >
        <span style={{ color: muted }}>$ </span>
        npx <span style={{ color: 'var(--osd-accent)' }}>@open-slide/cli</span> init
      </div>
      <p
        style={{
          fontSize: 26,
          lineHeight: 1.55,
          color: muted,
          marginTop: 56,
          maxWidth: 1100,
          borderTop: `1px solid ${hairline}`,
          paddingTop: 32,
        }}
      >
        Scaffolds the project, installs the runtime, drops you straight into the dev server. The
        whole showcase is a few keystrokes away — yours to fork, remix, ship.
      </p>
    </div>
    <div style={{ ...FOOT, display: 'flex', justifyContent: 'space-between' }}>
      <span>07 · cube</span>
      <span>open-slide.dev</span>
    </div>
  </div>
);

const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
const EASE_IN = 'cubic-bezier(0.7, 0, 0.84, 0)';

// 0 · BLOOM — overexposure flash. Brightness + saturation spike alongside a heavy
// blur, resolving back to clarity. The page arrives bleached-out and settles in.
Intro.transition = {
  duration: 820,
  exit: {
    duration: 340,
    easing: EASE_IN,
    keyframes: [
      { opacity: 1, transform: 'scale(1)', filter: 'brightness(1) blur(0) saturate(1)' },
      {
        opacity: 0,
        transform: 'scale(1.12)',
        filter: 'brightness(3.6) blur(36px) saturate(0)',
      },
    ],
  },
  enter: {
    duration: 600,
    delay: 220,
    easing: EASE_OUT,
    keyframes: [
      {
        opacity: 0,
        transform: 'scale(1.28)',
        filter: 'brightness(4) blur(48px) saturate(0)',
      },
      { opacity: 1, transform: 'scale(1)', filter: 'brightness(1) blur(0) saturate(1)' },
    ],
  },
};

// 1 · IRIS — clip-path circle collapses to a point, then expands.
// Round-trip dimensions: 80% radius covers a 16:9 reference box corner-to-corner.
Cover.transition = {
  duration: 700,
  exit: {
    duration: 320,
    easing: EASE_IN,
    keyframes: [
      { clipPath: 'circle(80% at 50% 50%)', opacity: 1 },
      { clipPath: 'circle(0% at 50% 50%)', opacity: 1 },
    ],
  },
  enter: {
    duration: 520,
    delay: 220,
    easing: EASE_OUT,
    keyframes: [
      { clipPath: 'circle(0% at 50% 50%)', opacity: 1 },
      { clipPath: 'circle(80% at 50% 50%)', opacity: 1 },
    ],
  },
};

// 2 · FLIP — perspective + rotateY. Genuine 3D, not a sprite sheet.
Flip.transition = {
  duration: 760,
  exit: {
    duration: 380,
    easing: EASE_IN,
    keyframes: [
      {
        opacity: 1,
        transform: 'perspective(1600px) rotateY(0deg) translateZ(0)',
        transformOrigin: '50% 50%',
      },
      {
        opacity: 0,
        transform: 'perspective(1600px) rotateY(-22deg) translateZ(-260px)',
        transformOrigin: '50% 50%',
      },
    ],
  },
  enter: {
    duration: 520,
    delay: 240,
    easing: EASE_OUT,
    keyframes: [
      {
        opacity: 0,
        transform: 'perspective(1600px) rotateY(22deg) translateZ(-260px)',
        transformOrigin: '50% 50%',
      },
      {
        opacity: 1,
        transform: 'perspective(1600px) rotateY(0deg) translateZ(0)',
        transformOrigin: '50% 50%',
      },
    ],
  },
};

// 3 · GLITCH — chromatic-aberration via stacked drop-shadows, stepped easing
// fakes a dropped framerate. The kind of motion a binary slide format can't even describe.
Glitch.transition = {
  duration: 560,
  exit: {
    duration: 260,
    easing: 'steps(5, end)',
    keyframes: [
      {
        opacity: 1,
        filter: 'drop-shadow(0 0 0 transparent) drop-shadow(0 0 0 transparent)',
        transform: 'translate(0, 0)',
      },
      {
        opacity: 0.85,
        filter: 'drop-shadow(6px 0 0 #00ffff) drop-shadow(-6px 0 0 #ff0044)',
        transform: 'translate(-3px, 1px)',
      },
      {
        opacity: 0.55,
        filter: 'drop-shadow(-12px 0 0 #00ffff) drop-shadow(12px 0 0 #ff0044)',
        transform: 'translate(4px, -2px)',
      },
      {
        opacity: 0.25,
        filter: 'drop-shadow(16px 0 0 #00ffff) drop-shadow(-16px 0 0 #ff0044)',
        transform: 'translate(-2px, 2px)',
      },
      {
        opacity: 0,
        filter: 'drop-shadow(0 0 0 transparent) drop-shadow(0 0 0 transparent)',
        transform: 'translate(0, 0)',
      },
    ],
  },
  enter: {
    duration: 340,
    delay: 220,
    easing: 'steps(6, end)',
    keyframes: [
      {
        opacity: 0,
        filter: 'drop-shadow(-16px 0 0 #00ffff) drop-shadow(16px 0 0 #ff0044)',
        transform: 'translate(6px, -2px)',
      },
      {
        opacity: 0.4,
        filter: 'drop-shadow(10px 0 0 #00ffff) drop-shadow(-10px 0 0 #ff0044)',
        transform: 'translate(-4px, 2px)',
      },
      {
        opacity: 0.75,
        filter: 'drop-shadow(-4px 0 0 #00ffff) drop-shadow(4px 0 0 #ff0044)',
        transform: 'translate(2px, -1px)',
      },
      {
        opacity: 1,
        filter: 'drop-shadow(0 0 0 transparent) drop-shadow(0 0 0 transparent)',
        transform: 'translate(0, 0)',
      },
    ],
  },
};

// 4 · WARP — blur burst + scale. Reads as velocity; renders as filter+transform.
// Module default; anything not overridden inherits this.
export const transition: SlideTransition = {
  duration: 700,
  exit: {
    duration: 300,
    easing: 'cubic-bezier(0.55, 0, 1, 0.45)',
    keyframes: [
      { opacity: 1, transform: 'scale(1)', filter: 'blur(0) saturate(1)' },
      {
        opacity: 0,
        transform: 'scale(1.4)',
        filter: 'blur(30px) saturate(1.6)',
      },
    ],
  },
  enter: {
    duration: 480,
    delay: 220,
    easing: EASE_OUT,
    keyframes: [
      {
        opacity: 0,
        transform: 'scale(0.6)',
        filter: 'blur(36px) saturate(1.4)',
      },
      { opacity: 1, transform: 'scale(1)', filter: 'blur(0) saturate(1)' },
    ],
  },
};

Warp.transition = transition;

// 5 · SWEEP — skewX + translateX. The outgoing card swipes past the camera
// at a tilt; the new one arrives from the other side, also tilted, then squares up.
Sweep.transition = {
  duration: 760,
  exit: {
    duration: 360,
    easing: EASE_IN,
    keyframes: [
      { opacity: 1, transform: 'translateX(0) skewX(0deg)' },
      { opacity: 0, transform: 'translateX(-118%) skewX(-14deg)' },
    ],
  },
  enter: {
    duration: 480,
    delay: 240,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateX(118%) skewX(-14deg)' },
      { opacity: 1, transform: 'translateX(0) skewX(0deg)' },
    ],
  },
};

// 6 · PORTAL — rotate + scale collapse, mirrored on entry. The outgoing page
// spirals into a point; the inbound unfurls back out from the other direction.
Closing.transition = {
  duration: 820,
  exit: {
    duration: 400,
    easing: EASE_IN,
    keyframes: [
      { opacity: 1, transform: 'rotate(0deg) scale(1)' },
      { opacity: 0, transform: 'rotate(-110deg) scale(0)' },
    ],
  },
  enter: {
    duration: 560,
    delay: 260,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'rotate(110deg) scale(0)' },
      { opacity: 1, transform: 'rotate(0deg) scale(1)' },
    ],
  },
};

// 7 · CUBE — full 90° pivot on a vertical edge. The outgoing face swings away
// around its right edge; the inbound arrives rotated 90° around its left edge
// and squares up. Real 3D, no sprite sheet — far more aggressive than flip.
Cli.transition = {
  duration: 880,
  exit: {
    duration: 440,
    easing: EASE_IN,
    keyframes: [
      {
        opacity: 1,
        transform: 'perspective(1800px) rotateY(0deg)',
        transformOrigin: '100% 50%',
      },
      {
        opacity: 0.2,
        transform: 'perspective(1800px) rotateY(-92deg)',
        transformOrigin: '100% 50%',
      },
    ],
  },
  enter: {
    duration: 560,
    delay: 280,
    easing: EASE_OUT,
    keyframes: [
      {
        opacity: 0.2,
        transform: 'perspective(1800px) rotateY(92deg)',
        transformOrigin: '0% 50%',
      },
      {
        opacity: 1,
        transform: 'perspective(1800px) rotateY(0deg)',
        transformOrigin: '0% 50%',
      },
    ],
  },
};

export const meta: SlideMeta = {
  title: 'Maximal — Eight Transitions',
  createdAt: '2026-05-24T00:00:00.000Z',
};

export default [Intro, Cover, Flip, Glitch, Warp, Sweep, Closing, Cli] satisfies Page[];
