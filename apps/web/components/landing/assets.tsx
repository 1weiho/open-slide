'use client';

import {
  animate,
  type Easing,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react';
import { useEffect, useRef } from 'react';

type AssetMock = { name: string; size: string; logo: string; themed?: boolean; unused?: boolean };

const assets: AssetMock[] = [
  { name: 'claude.svg', size: '3.4 KB', logo: 'claude' },
  { name: 'codex-dark.svg', size: '2.1 KB', logo: 'codex-dark' },
  { name: 'gemini.svg', size: '4.0 KB', logo: 'gemini' },
  { name: 'cursor-dark.svg', size: '5.2 KB', logo: 'cursor-dark', unused: true },
  { name: 'cloudflare.svg', size: '6.8 KB', logo: 'cloudflare' },
  { name: 'zeabur-dark.svg', size: '4.7 KB', logo: 'zeabur', themed: true },
];

/* One 8s story: a file is dragged in → drop zone lights up → hero.png lands
   in slot 1 → upload toast. */
const ASSET_LOOP_DURATION = 8;
const EASE_OUT: Easing = [0.23, 1, 0.32, 1];

export function AssetManagerMock() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const reduced = useReducedMotion();
  const active = inView && !reduced;

  // The dropped file becomes real state: hero.png inserts at slot 1, every
  // card shifts back one slot (the last one is pushed out of the visible
  // window), and the toolbar count bumps to 07 — all off one clock.
  const heroPhase = useMotionValue(0);
  const heroScale = useTransform(heroPhase, [0, 1], [0.96, 1]);
  const heroVisibility = useTransform(heroPhase, (v) =>
    v < 0.01 ? ('hidden' as const) : ('visible' as const),
  );
  const oldCountOpacity = useTransform(heroPhase, [0, 1], [1, 0]);
  const shiftX = useTransform(heroPhase, [0, 1], ['calc(0% + 0px)', 'calc(100% + 16px)']);
  const wrapX = useTransform(heroPhase, [0, 1], ['calc(0% + 0px)', 'calc(-200% - 32px)']);
  const wrapY = useTransform(heroPhase, [0, 1], ['calc(0% + 0px)', 'calc(100% + 16px)']);
  const pushedOutOpacity = useTransform(heroPhase, [0, 0.65], [1, 0]);
  const pushedOutScale = useTransform(heroPhase, [0, 1], [1, 0.95]);

  useEffect(() => {
    if (!active) {
      heroPhase.set(0);
      return;
    }
    heroPhase.set(0);
    const hero = animate(heroPhase, [0, 0, 1, 1, 0], {
      duration: ASSET_LOOP_DURATION,
      times: [0, 0.378, 0.439, 0.95, 1],
      ease: ['linear', EASE_OUT, 'linear', 'easeOut'],
      repeat: Infinity,
    });
    return () => hero.stop();
  }, [active, heroPhase]);

  const loopTransition = (times: number[], ease: Easing | Easing[] = 'easeInOut') =>
    active
      ? {
          duration: ASSET_LOOP_DURATION,
          times,
          ease,
          repeat: Infinity,
        }
      : undefined;

  return (
    <div
      ref={ref}
      className="relative select-none overflow-hidden rounded-lg bg-[color:var(--color-panel)] shadow-[var(--shadow-window)]"
    >
      {/* window header */}
      <div className="flex items-center px-4 sm:px-5 h-10 sm:h-11 border-b border-[color:var(--color-rule-soft)] font-[family-name:var(--font-mono)] text-[12px] text-[color:var(--color-muted)]">
        <div className="flex items-center gap-2">
          <span className="size-[10px] rounded-full bg-[#ff5f56]" />
          <span className="size-[10px] rounded-full bg-[#ffbd2e]" />
          <span className="size-[10px] rounded-full bg-[#27c93f]" />
        </div>
        <span className="flex-1 text-center">localhost:5173 · assets</span>
        <span className="w-[40px]" />
      </div>

      {/* toolbar — mirrors core's asset view header */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-[color:var(--color-rule)] bg-[color:var(--color-panel-hi)]/40">
        <div className="flex min-w-0 items-center gap-3">
          <div className="inline-flex items-center gap-0.5 rounded-[7px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel-hi)] p-0.5">
            <span className="rounded-[5px] bg-[color:var(--color-panel)] px-3 py-1 font-[family-name:var(--font-sans)] text-[12px] font-medium text-[color:var(--color-text)] [box-shadow:var(--shadow-edge)]">
              Slide
            </span>
            <span className="rounded-[5px] px-3 py-1 font-[family-name:var(--font-sans)] text-[12px] text-[color:var(--color-muted)] transition-colors hover:text-[color:var(--color-text)]">
              Global
            </span>
          </div>
          <span className="hidden md:inline-flex items-baseline min-w-0 font-[family-name:var(--font-mono)] text-[11.5px] text-[color:var(--color-muted)]">
            slides/cover/assets/
            <span className="mx-1.5 opacity-50">·</span>
            <span className="relative whitespace-nowrap">
              <motion.span style={{ opacity: oldCountOpacity }}>06 files</motion.span>
              <motion.span className="absolute left-0 top-0" style={{ opacity: heroPhase }}>
                07 files
              </motion.span>
            </span>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="pressable inline-flex h-8 items-center gap-1.5 rounded-[5px] bg-[color:var(--color-text)] px-3 font-[family-name:var(--font-sans)] text-[12.5px] font-medium text-[color:var(--color-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_1px_0_rgba(0,0,0,0.12)] hover:opacity-90">
            <UploadGlyph />
            Upload
          </span>
        </div>
      </div>

      {/* grid */}
      <div className="relative">
        {/* The 16px in the shift transforms must match this grid's gap-4. */}
        <div className="grid grid-cols-3 gap-4 p-4 sm:p-5 bg-[color:var(--color-ink)]">
          {assets.map((a, i) => {
            const isLastColumn = i % 3 === 2;
            const isPushedOut = i === assets.length - 1;
            const shiftStyle = isPushedOut
              ? { opacity: pushedOutOpacity, scale: pushedOutScale }
              : isLastColumn
                ? { x: wrapX, y: wrapY }
                : { x: shiftX };
            return i === 0 ? (
              <div key={a.name} className="relative">
                <motion.div style={shiftStyle}>
                  <AssetCard asset={a} />
                </motion.div>
                <motion.div
                  className="absolute inset-0"
                  style={{ opacity: heroPhase, scale: heroScale, visibility: heroVisibility }}
                >
                  <HeroAssetCard />
                  <motion.div
                    aria-hidden
                    className="absolute -inset-px rounded-[7px] ring-2 ring-[color:var(--color-accent)]/40 pointer-events-none"
                    animate={active ? { opacity: [0, 0, 1, 0, 0] } : { opacity: 0 }}
                    transition={loopTransition([0, 0.386, 0.465, 0.64, 1], 'easeOut')}
                  />
                </motion.div>
              </div>
            ) : (
              <motion.div key={a.name} style={shiftStyle}>
                <AssetCard asset={a} />
              </motion.div>
            );
          })}
        </div>

        {/* drag ghost — a file card being pulled into the drop zone */}
        <motion.div
          aria-hidden
          className="absolute left-[32%] top-[26%] pointer-events-none"
          animate={
            active
              ? {
                  opacity: [0, 0, 1, 1, 1, 0, 0],
                  x: [150, 150, 0, 0, 0, 0, 0],
                  y: [-110, -110, 0, 0, 0, 0, 0],
                  scale: [1, 1, 1, 1, 0.92, 0.92, 0.92],
                  filter: [
                    'blur(0px)',
                    'blur(0px)',
                    'blur(0px)',
                    'blur(0px)',
                    'blur(0px)',
                    'blur(3px)',
                    'blur(3px)',
                  ],
                }
              : { opacity: 0 }
          }
          transition={loopTransition(
            [0, 0.15, 0.264, 0.351, 0.378, 0.421, 1],
            [EASE_OUT, EASE_OUT, 'linear', 'easeOut', 'easeOut', 'linear'],
          )}
        >
          <div className="w-[88px] -rotate-[5deg] rounded-[6px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] shadow-[var(--shadow-floating)] overflow-hidden">
            <div
              className="flex h-[52px] items-center justify-center"
              style={{
                background:
                  'linear-gradient(135deg, color-mix(in oklab, var(--color-accent) 18%, var(--color-panel)), color-mix(in oklab, var(--color-accent) 50%, var(--color-panel)))',
              }}
            >
              <ImageGlyph />
            </div>
            <div className="border-t border-[color:var(--color-rule)] px-2 py-1 font-[family-name:var(--font-mono)] text-[9px] text-[color:var(--color-text-soft)] truncate">
              hero.png
            </div>
          </div>
        </motion.div>

        {/* pointer riding the ghost */}
        <motion.div
          aria-hidden
          className="absolute left-[32%] top-[26%] ml-[80px] mt-[58px] pointer-events-none"
          animate={
            active
              ? {
                  opacity: [0, 0, 1, 1, 1, 0, 0],
                  x: [150, 150, 0, 0, 0, 0, 0],
                  y: [-110, -110, 0, 0, 0, 0, 0],
                }
              : { opacity: 0 }
          }
          transition={loopTransition(
            [0, 0.15, 0.264, 0.378, 0.413, 0.456, 1],
            [EASE_OUT, EASE_OUT, 'linear', 'linear', 'easeOut', 'linear'],
          )}
        >
          <PointerGlyph className="w-[15px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
        </motion.div>

        {/* drop overlay — matches core's drag-active state */}
        <motion.div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          animate={active ? { opacity: [0, 0, 1, 1, 0, 0] } : { opacity: 0 }}
          transition={loopTransition(
            [0, 0.194, 0.238, 0.369, 0.413, 1],
            ['linear', 'easeOut', 'linear', 'easeOut', 'linear'],
          )}
        >
          <div className="absolute inset-0 bg-[color:var(--color-accent)]/5" />
          <div className="absolute inset-2 rounded-[10px] border border-dashed border-[color:var(--color-accent)]/40" />
        </motion.div>

        {/* drop-to-upload pill */}
        <motion.div
          aria-hidden
          className="absolute inset-x-0 bottom-5 flex justify-center pointer-events-none"
          animate={
            active
              ? { opacity: [0, 0, 1, 1, 0, 0], y: ['40%', '40%', '0%', '0%', '40%', '40%'] }
              : { opacity: 0, y: '40%' }
          }
          transition={loopTransition(
            [0, 0.203, 0.246, 0.369, 0.413, 1],
            ['linear', EASE_OUT, 'linear', EASE_OUT, 'linear'],
          )}
        >
          <div className="flex items-center gap-2 rounded-[6px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] px-3 py-1.5 font-[family-name:var(--font-sans)] text-[12px] font-medium text-[color:var(--color-text)] shadow-[var(--shadow-floating)]">
            <DropGlyph />
            Drop to upload
          </div>
        </motion.div>

        {/* upload toast */}
        <motion.div
          aria-hidden
          className="absolute left-4 bottom-4 pointer-events-none"
          animate={
            active
              ? { opacity: [0, 0, 1, 1, 0, 0], y: ['60%', '60%', '0%', '0%', '60%', '60%'] }
              : { opacity: 0, y: '60%' }
          }
          transition={loopTransition(
            [0, 0.413, 0.451, 0.71, 0.754, 1],
            ['linear', EASE_OUT, 'linear', EASE_OUT, 'linear'],
          )}
        >
          <div className="flex items-center gap-2 rounded-[8px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] px-3 py-2 font-[family-name:var(--font-sans)] text-[12px] font-medium text-[color:var(--color-text)] shadow-[var(--shadow-floating)]">
            <CheckGlyph />
            Uploaded{' '}
            <span className="font-[family-name:var(--font-mono)] text-[11px]">hero.png</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function AssetCard({ asset }: { asset: AssetMock }) {
  return (
    <div className="group rounded-[6px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)] overflow-hidden flex flex-col">
      <div
        className="h-[80px] sm:h-[120px] flex items-center justify-center border-b border-[color:var(--color-rule-soft)]"
        style={{
          background:
            'repeating-conic-gradient(color-mix(in srgb, var(--color-rule) 70%, transparent) 0 25%, transparent 0 50%) 0 0 / 16px 16px',
        }}
      >
        {asset.themed ? (
          <>
            <img
              src={`/assets/${asset.logo}-dark.svg`}
              alt=""
              className="h-12 w-auto object-contain agent-mono logo-dark"
            />
            <img
              src={`/assets/${asset.logo}-light.svg`}
              alt=""
              aria-hidden
              className="h-12 w-auto object-contain agent-mono logo-light"
            />
          </>
        ) : (
          <img
            src={`/assets/${asset.logo}.svg`}
            alt=""
            className="h-12 w-auto object-contain agent-mono"
          />
        )}
      </div>
      <div className="flex items-start gap-1 px-3 py-2">
        <div className="min-w-0 flex-1">
          <div
            className="font-[family-name:var(--font-sans)] text-[13px] text-[color:var(--color-text)] truncate"
            title={asset.name}
          >
            {asset.themed ? (
              <>
                <span className="logo-dark">{asset.name}</span>
                <span className="logo-light">{asset.name.replace('-dark', '-light')}</span>
              </>
            ) : (
              asset.name
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-[10px] text-[color:var(--color-muted)]">
            {asset.size}
            <span
              className={`rounded-[3px] px-1 py-px font-[family-name:var(--font-sans)] text-[9px] font-medium leading-none ${
                asset.unused
                  ? 'bg-[color:var(--color-rule-soft)] text-[color:var(--color-muted)]'
                  : 'bg-[color:var(--color-mint)]/15 text-[color:var(--color-mint)]'
              }`}
            >
              {asset.unused ? 'Unused' : 'Used'}
            </span>
          </div>
        </div>
        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-[4px] text-[color:var(--color-muted)] opacity-0 transition-[opacity,background-color,color] group-hover:opacity-100 hover:bg-[color:var(--color-panel-hi)] hover:text-[color:var(--color-text)]">
          <KebabGlyph />
        </span>
      </div>
    </div>
  );
}

function HeroAssetCard() {
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-[6px] border border-[color:var(--color-rule)] bg-[color:var(--color-panel)]">
      <div
        className="flex min-h-0 flex-1 items-center justify-center border-b border-[color:var(--color-rule-soft)]"
        style={{
          background:
            'linear-gradient(135deg, color-mix(in oklab, var(--color-accent) 18%, var(--color-panel)), color-mix(in oklab, var(--color-accent) 50%, var(--color-panel)))',
        }}
      >
        <ImageGlyph large />
      </div>
      <div className="flex items-start gap-1 px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="font-[family-name:var(--font-sans)] text-[13px] text-[color:var(--color-text)] truncate">
            hero.png
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-[10px] text-[color:var(--color-muted)]">
            248 KB
            <span className="rounded-[3px] bg-[color:var(--color-rule-soft)] px-1 py-px font-[family-name:var(--font-sans)] text-[9px] font-medium leading-none text-[color:var(--color-muted)]">
              Unused
            </span>
          </div>
        </div>
        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-[4px] text-[color:var(--color-muted)] opacity-0 transition-[opacity,background-color,color] group-hover:opacity-100 hover:bg-[color:var(--color-panel-hi)] hover:text-[color:var(--color-text)]">
          <KebabGlyph />
        </span>
      </div>
    </div>
  );
}

function PointerGlyph({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className}>
      <title>cursor</title>
      <path
        d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L6.35 2.85a.5.5 0 0 0-.85.36Z"
        fill="var(--color-text)"
        stroke="var(--color-ink)"
        strokeWidth={1.4}
      />
    </svg>
  );
}

function UploadGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function DropGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-accent)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5"
    >
      <path d="M12 17V3" />
      <path d="m6 11 6 6 6-6" />
      <path d="M19 21H5" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-mint)"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5 shrink-0"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </svg>
  );
}

function ImageGlyph({ large = false }: { large?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.9)"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={large ? 'size-8' : 'size-5'}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.5-3.5a2 2 0 0 0-2.83 0L6 20" />
    </svg>
  );
}

function KebabGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="size-3.5">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}
