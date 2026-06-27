import type { DesignSystem } from '@open-slide/core';
import { type Page, useSlidePageNumber } from '@open-slide/core';

const css = `
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');

@keyframes mc-pop {
  from { opacity: 0; transform: translateY(14px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes mc-blink {
  0%, 49%  { opacity: 1; }
  50%, 100%{ opacity: 0; }
}
@keyframes mc-flicker {
  0%, 100% { opacity: 0.55; transform: translateX(-50%) scale(0.96); }
  50%      { opacity: 0.85; transform: translateX(-50%) scale(1.04); }
}
@keyframes mc-portal-glow {
  0%, 100% { opacity: 0.6; }
  50%      { opacity: 1; }
}
.mc-pop     { opacity: 0; animation: mc-pop 0.45s steps(5, end) forwards; }
.mc-blink   { animation: mc-blink 1s steps(1, end) infinite; }
.mc-flicker { animation: mc-flicker 0.5s steps(2, end) infinite; }
.mc-portal-glow { animation: mc-portal-glow 2.6s steps(6, end) infinite; }
`;

const Styles = () => <style>{css}</style>;

export const design: DesignSystem = {
  palette: {
    bg: '#26222B',
    text: '#F9FFFF',
    accent: '#6CC349',
  },
  fonts: {
    display: '"Press Start 2P", monospace',
    body: '"VT323", "Courier New", monospace',
  },
  typeScale: {
    hero: 96,
    body: 44,
  },
  radius: 0,
};

const p = {
  bg: '#26222B',
  text: '#F9FFFF',
  accent: '#6CC349',
  accentDark: '#3E7A2E',
  dirt: '#7A5333',
  dirtDark: '#553A23',
  stone: '#8A8A8A',
  panel: '#313036',
  muted: '#9C9D97',
  gold: '#FCDC5D',
  redstone: '#E03C32',
  obsidian: '#140C20',
  portal: '#A24CF0',
  portalDark: '#5A18A0',
};

const font = {
  display: '"Press Start 2P", monospace',
  body: '"VT323", "Courier New", monospace',
};

const raised = {
  boxShadow: 'inset 4px 4px 0 rgba(255,255,255,0.22), inset -5px -5px 0 rgba(0,0,0,0.45)',
} as const;
const recessed = {
  boxShadow: 'inset -4px -4px 0 rgba(255,255,255,0.10), inset 4px 4px 0 rgba(0,0,0,0.55)',
} as const;

// Brighten (+) / darken (-) a hex color by integer steps for pixel-noise shading.
const shade = (hex: string, step: number) => {
  const n = Number.parseInt(hex.slice(1), 16);
  const amt = step * 18;
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp(((n >> 16) & 255) + amt);
  const g = clamp(((n >> 8) & 255) + amt);
  const b = clamp((n & 255) + amt);
  return `rgb(${r}, ${g}, ${b})`;
};

const GRASS_NOISE = [
  0, 1, -1, 0, 1, 0, -1, 0, 0, 1, 0, -1, 0, 1, 0, -1, 1, 0, 1, -1, 0, 0, -1, 1, 0, 0, 1, -1, 0, 0,
  -1, 1, 0, 1, 0, -1,
];
const DIRT_NOISE = [
  0, 1, 0, -1, 0, 1, -2, 0, 1, 0, -1, 0, 0, -1, 0, 1, 0, -2, 1, 0, -1, 0, 1, 0, 0, 1, 0, -2, 0, 1,
  -1, 0, 1, 0, -1, 0,
];

const Pixels = ({ base, noise, cols = 6 }: { base: string; noise: number[]; cols?: number }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridTemplateRows: `repeat(${noise.length / cols}, 1fr)`,
      imageRendering: 'pixelated',
    }}
  >
    {noise
      .map((lvl, i) => ({ k: `px${i}`, lvl }))
      .map(({ k, lvl }) => (
        <div key={k} style={{ background: shade(base, lvl) }} />
      ))}
  </div>
);

const GrassSide = () => (
  <>
    <Pixels base={p.dirt} noise={DIRT_NOISE} />
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '20%' }}>
      <Pixels base={p.accent} noise={GRASS_NOISE} />
    </div>
    <div
      style={{
        position: 'absolute',
        top: '20%',
        left: '14%',
        width: '18%',
        height: '9%',
        background: shade(p.accent, -1),
      }}
    />
    <div
      style={{
        position: 'absolute',
        top: '20%',
        left: '64%',
        width: '18%',
        height: '13%',
        background: p.accent,
      }}
    />
  </>
);

const Face = ({
  children,
  transform,
  dim = 0,
}: {
  children: React.ReactNode;
  transform: string;
  dim?: number;
}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      transform,
      overflow: 'hidden',
    }}
  >
    {children}
    {dim > 0 && (
      <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${dim})` }} />
    )}
  </div>
);

const IsoBlock = ({
  size = 110,
  variant = 'grass',
}: {
  size?: number;
  variant?: 'grass' | 'dirt' | 'gold' | 'stone';
}) => {
  const h = size / 2;
  const base =
    variant === 'grass'
      ? p.dirt
      : variant === 'gold'
        ? p.gold
        : variant === 'stone'
          ? p.stone
          : p.dirt;
  const topBase = variant === 'grass' ? p.accent : base;
  const topNoise = variant === 'grass' || variant === 'gold' ? GRASS_NOISE : DIRT_NOISE;
  const side = variant === 'grass' ? <GrassSide /> : <Pixels base={base} noise={DIRT_NOISE} />;
  return (
    <div
      style={{
        width: size * 1.5,
        height: size * 1.4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: 'rotateX(-30deg) rotateY(-45deg)',
        }}
      >
        <Face transform={`rotateX(90deg) translateZ(${h}px)`}>
          <Pixels base={topBase} noise={topNoise} />
        </Face>
        <Face transform={`translateZ(${h}px)`} dim={0.16}>
          {side}
        </Face>
        <Face transform={`rotateY(90deg) translateZ(${h}px)`} dim={0.34}>
          {side}
        </Face>
      </div>
    </div>
  );
};

const TORCH = [
  ' oo ',
  ' ww ',
  'oyyo',
  ' yy ',
  ' ab ',
  ' ab ',
  ' ab ',
  ' ab ',
  ' ab ',
  ' ab ',
  ' ab ',
  ' ab ',
];
const TORCH_COLORS: Record<string, string> = {
  o: '#FF8A1E',
  y: '#FFD83D',
  w: '#FFF8D6',
  a: '#C9A06A',
  b: '#6E5535',
};
const TORCH_CELLS = TORCH.flatMap((row, r) =>
  row.split('').map((ch, c) => ({ k: `t${r}-${c}`, ch })),
);

const Torch = ({ px = 10 }: { px?: number }) => (
  <div style={{ position: 'relative', width: 4 * px, imageRendering: 'pixelated' }}>
    <div
      className="mc-flicker"
      style={{
        position: 'absolute',
        left: '50%',
        top: -px * 2,
        width: px * 9,
        height: px * 9,
        background: 'radial-gradient(circle, rgba(255,200,90,0.5), transparent 65%)',
        pointerEvents: 'none',
      }}
    />
    <div
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: `repeat(4, ${px}px)`,
        gridAutoRows: `${px}px`,
      }}
    >
      {TORCH_CELLS.map(({ k, ch }) => (
        <div
          key={k}
          style={{ width: px, height: px, background: TORCH_COLORS[ch] ?? 'transparent' }}
        />
      ))}
    </div>
  </div>
);

const OBSIDIAN_NOISE = [
  0, 0, 0, -1, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, -1, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0,
  -1, 0, 0, 0, 0, 0, -1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 0, -1, 0,
  0, 0,
];

const SPECKLES = [
  { t: 20, l: 26, s: 9, c: '#6E4FA3' },
  { t: 58, l: 62, s: 7, c: '#9C6FD6' },
  { t: 38, l: 80, s: 6, c: '#5A3E86' },
  { t: 80, l: 34, s: 8, c: '#B98BE8' },
  { t: 26, l: 64, s: 6, c: '#6E4FA3' },
  { t: 70, l: 16, s: 9, c: '#9C6FD6' },
  { t: 14, l: 48, s: 6, c: '#5A3E86' },
  { t: 52, l: 38, s: 7, c: '#B98BE8' },
  { t: 86, l: 72, s: 6, c: '#6E4FA3' },
  { t: 32, l: 12, s: 8, c: '#9C6FD6' },
  { t: 64, l: 86, s: 6, c: '#5A3E86' },
  { t: 46, l: 54, s: 6, c: '#B98BE8' },
];

const Obsidian = ({ seed = 0 }: { seed?: number }) => {
  const start = (seed * 4) % SPECKLES.length;
  const picks = [0, 1, 2, 3].map((i) => SPECKLES[(start + i) % SPECKLES.length]);
  return (
    <>
      <Pixels base={p.obsidian} noise={OBSIDIAN_NOISE} cols={8} />
      {picks.map((sp) => (
        <div
          key={`sp${seed}-${sp.t}-${sp.l}`}
          style={{
            position: 'absolute',
            top: `${sp.t}%`,
            left: `${sp.l}%`,
            width: `${sp.s}%`,
            height: `${sp.s}%`,
            background: sp.c,
          }}
        />
      ))}
    </>
  );
};

const PORTAL_FRAME = Array.from({ length: 20 }, (_, i) => ({
  r: Math.floor(i / 4),
  c: i % 4,
})).filter(({ r, c }) => r === 0 || r === 4 || c === 0 || c === 3);

const NetherPortal = ({ block = 112 }: { block?: number }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: `repeat(4, ${block}px)`,
      gridTemplateRows: `repeat(5, ${block}px)`,
      imageRendering: 'pixelated',
      boxShadow:
        'inset 5px 5px 0 rgba(255,255,255,0.08), inset -6px -6px 0 rgba(0,0,0,0.6), 0 0 50px 6px rgba(162,76,240,0.5)',
    }}
  >
    {PORTAL_FRAME.map(({ r, c }) => (
      <div
        key={`ob${r}-${c}`}
        style={{
          gridColumn: c + 1,
          gridRow: r + 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Obsidian seed={r + c} />
      </div>
    ))}
    <div
      style={{
        gridColumn: '2 / 4',
        gridRow: '2 / 5',
        position: 'relative',
        overflow: 'hidden',
        background: '#0E0718',
        boxShadow: `inset 0 0 44px 6px ${p.portal}, inset 0 0 16px rgba(232,204,255,0.5)`,
      }}
    >
      <div
        className="mc-portal-glow"
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 70% 60% at 50% 50%, ${p.portal}, transparent 72%)`,
          mixBlendMode: 'screen',
        }}
      />
    </div>
  </div>
);

const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontFamily: font.display,
      fontSize: 96,
      fontWeight: 400,
      lineHeight: 1.08,
      letterSpacing: 0,
      margin: 0,
      color: p.accent,
      textShadow: '5px 5px 0 #3E7A2E, 9px 9px 0 #000',
    }}
  >
    {children}
  </h1>
);

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: 'inline-block',
      fontFamily: font.display,
      fontSize: 20,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: p.gold,
      background: p.panel,
      padding: '12px 18px',
      ...raised,
    }}
  >
    {children}
  </div>
);

const Button = ({ children }: { children: React.ReactNode }) => (
  <span
    style={{
      display: 'inline-block',
      fontFamily: font.display,
      fontSize: 22,
      color: p.text,
      background: p.stone,
      padding: '20px 34px',
      textShadow: '2px 2px 0 #2b2b2b',
      boxShadow: 'inset 4px 4px 0 rgba(255,255,255,0.30), inset -5px -5px 0 rgba(0,0,0,0.45)',
    }}
  >
    {children}
  </span>
);

const Footer = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        bottom: 56,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: font.display,
        fontSize: 16,
        color: p.muted,
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        <IsoBlock size={16} variant="grass" />
        <span>MINECRAFT</span>
      </span>
      <span style={{ padding: '10px 16px', background: p.bg, color: p.text, ...recessed }}>
        {current} / {total}
      </span>
    </div>
  );
};

const fill = {
  width: '100%',
  height: '100%',
  background: p.bg,
  color: p.text,
  fontFamily: font.body,
  position: 'relative',
  overflow: 'hidden',
} as const;

const Cover: Page = () => (
  <div
    style={{
      ...fill,
      padding: 120,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 40,
    }}
  >
    <Styles />

    <div
      className="mc-pop"
      style={{
        position: 'absolute',
        top: 80,
        right: 96,
        display: 'flex',
        gap: 4,
        animationDelay: '0.34s',
      }}
    >
      <IsoBlock size={96} variant="grass" />
      <IsoBlock size={96} variant="grass" />
      <IsoBlock size={96} variant="grass" />
    </div>

    <div
      className="mc-pop"
      style={{ position: 'absolute', right: 150, bottom: 150, animationDelay: '0.44s' }}
    >
      <Torch px={12} />
    </div>

    <div className="mc-pop" style={{ animationDelay: '0.05s' }}>
      <Eyebrow>Press Start</Eyebrow>
    </div>

    <div className="mc-pop" style={{ animationDelay: '0.14s' }}>
      <Title>
        BUILD
        <br />
        ANYTHING
      </Title>
    </div>

    <p
      className="mc-pop"
      style={{
        animationDelay: '0.24s',
        fontSize: 44,
        lineHeight: 1.3,
        color: p.muted,
        maxWidth: 1000,
        margin: 0,
      }}
    >
      A blocky sandbox where every idea snaps onto a grid — mine it, craft it, ship it.
      <span className="mc-blink" style={{ color: p.accent }}>
        _
      </span>
    </p>

    <Footer />
  </div>
);

const FeatureCard = ({
  block,
  title,
  body,
}: {
  block: React.ReactNode;
  title: string;
  body: string;
}) => (
  <div
    style={{
      background: p.panel,
      padding: '40px 36px 44px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      height: '100%',
      ...raised,
    }}
  >
    <div style={{ height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {block}
    </div>
    <div style={{ fontFamily: font.display, fontSize: 22, color: p.accent, lineHeight: 1.4 }}>
      {title}
    </div>
    <div style={{ fontSize: 34, lineHeight: 1.25, color: p.muted }}>{body}</div>
  </div>
);

const Content: Page = () => (
  <div
    style={{
      ...fill,
      padding: 120,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}
  >
    <Styles />

    <div className="mc-pop" style={{ animationDelay: '0.05s' }}>
      <Eyebrow>Inventory</Eyebrow>
    </div>

    <h2
      className="mc-pop"
      style={{
        animationDelay: '0.14s',
        fontFamily: font.display,
        fontSize: 56,
        margin: '32px 0 48px',
        color: p.text,
        textShadow: '3px 3px 0 #000',
      }}
    >
      PICK A BLOCK
    </h2>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
      <div className="mc-pop" style={{ animationDelay: '0.24s' }}>
        <FeatureCard
          block={<IsoBlock size={132} variant="grass" />}
          title="GRASS"
          body="Green cap on dirt. Place it down and the world turns alive."
        />
      </div>
      <div className="mc-pop" style={{ animationDelay: '0.30s' }}>
        <FeatureCard
          block={<IsoBlock size={132} variant="dirt" />}
          title="DIRT"
          body="The honest base layer — cheap, plentiful, the start of everything."
        />
      </div>
      <div className="mc-pop" style={{ animationDelay: '0.36s' }}>
        <FeatureCard
          block={<Torch px={14} />}
          title="TORCH"
          body="Keeps the mobs away and the night lit. Craft early, place often."
        />
      </div>
    </div>

    <Footer />
  </div>
);

const Nether: Page = () => (
  <div style={{ ...fill, padding: 120, display: 'flex', alignItems: 'center', gap: 96 }}>
    <Styles />

    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 36 }}>
      <div className="mc-pop" style={{ animationDelay: '0.05s' }}>
        <Eyebrow>The Nether</Eyebrow>
      </div>

      <h2
        className="mc-pop"
        style={{
          animationDelay: '0.14s',
          fontFamily: font.display,
          fontSize: 72,
          fontWeight: 400,
          lineHeight: 1.12,
          margin: 0,
          color: p.portal,
          textShadow: '5px 5px 0 #3A1466, 9px 9px 0 #000',
        }}
      >
        STEP
        <br />
        THROUGH
      </h2>

      <p
        className="mc-pop"
        style={{
          animationDelay: '0.24s',
          fontSize: 44,
          lineHeight: 1.3,
          color: p.muted,
          maxWidth: 760,
          margin: 0,
        }}
      >
        Frame it in obsidian, strike a flint, and the air tears open. On the other side, a hotter
        world waits.
        <span className="mc-blink" style={{ color: p.portal }}>
          _
        </span>
      </p>
    </div>

    <div
      className="mc-pop"
      style={{
        animationDelay: '0.34s',
        flexShrink: 0,
        marginRight: 120,
        filter: 'drop-shadow(0 0 40px rgba(162,76,240,0.45))',
      }}
    >
      <NetherPortal />
    </div>

    <Footer />
  </div>
);

const Closer: Page = () => (
  <div
    style={{
      ...fill,
      padding: 120,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 48,
      textAlign: 'center',
    }}
  >
    <Styles />

    <div
      className="mc-pop"
      style={{
        position: 'absolute',
        left: 200,
        top: '50%',
        marginTop: -90,
        animationDelay: '0.4s',
      }}
    >
      <Torch px={13} />
    </div>
    <div
      className="mc-pop"
      style={{
        position: 'absolute',
        right: 200,
        top: '50%',
        marginTop: -90,
        animationDelay: '0.4s',
      }}
    >
      <Torch px={13} />
    </div>

    <div className="mc-pop" style={{ animationDelay: '0.05s' }}>
      <Eyebrow>Achievement Get!</Eyebrow>
    </div>

    <div className="mc-pop" style={{ animationDelay: '0.14s' }}>
      <Title>LEVEL UP</Title>
    </div>

    <p
      className="mc-pop"
      style={{
        animationDelay: '0.24s',
        fontSize: 44,
        lineHeight: 1.3,
        color: p.muted,
        maxWidth: 1000,
        margin: 0,
      }}
    >
      You crafted a whole deck out of blocks. Respawn and do it again.
    </p>

    <div className="mc-pop" style={{ animationDelay: '0.34s' }}>
      <Button>PLAY AGAIN</Button>
    </div>

    <Footer />
  </div>
);

export default [Cover, Content, Nether, Closer];
