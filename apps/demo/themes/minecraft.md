---
name: Minecraft
description: Blocky sandbox aesthetic — grass-green and dirt-brown on dark stone, pixel type, beveled GUI buttons, inventory-slot footer, zero rounded corners.
---

# Minecraft

A faithful riff on Minecraft's in-game UI: everything is a block. Hard pixel bevels (light top-left, dark bottom-right) instead of soft shadows, a grass-over-dirt color story on a dark stone canvas, pixel fonts, and **zero border-radius anywhere**. The look leans on the game's iconic GUI chrome — stone buttons, inventory slots, beveled panels — rather than on photography.

## Palette

| Role       | Value     | Notes                                            |
| ---------- | --------- | ------------------------------------------------ |
| bg         | `#26222B` | dark stone / night canvas                        |
| text       | `#F9FFFF` | Minecraft white-smoke copy                       |
| accent     | `#6CC349` | grass green — headlines, key marks, the logo     |
| accentDark | `#3E7A2E` | grass shadow / green bevel + 3D extrude          |
| dirt       | `#7A5333` | dirt brown — surface fills, the block base       |
| dirtDark   | `#553A23` | dirt shadow / bottom bevel                        |
| stone      | `#8A8A8A` | stone gray — GUI buttons, inventory frame         |
| panel      | `#313036` | recessed dark slot / card background              |
| muted      | `#9C9D97` | secondary copy, labels, footer                    |
| gold       | `#FCDC5D` | XP / highlight accent (use sparingly)             |
| redstone   | `#E03C32` | danger / emphasis accent (use sparingly)          |
| obsidian   | `#140C20` | Nether obsidian — deepest dark, portal frame      |
| portal     | `#A24CF0` | Nether portal purple — alt hero accent            |
| portalDark | `#5A18A0` | portal shadow / purple bevel + 3D extrude         |

## Typography

- Display font: `"Press Start 2P", monospace` — the blocky 8-bit headline face (single weight 400). Glyphs are wide; keep headline words short.
- Body font: `"VT323", "Courier New", monospace` — readable pixel/terminal face (single weight 400). Use larger than a normal sans because the x-height runs small.
- Google Fonts import: `https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap`
- Render crisp: set `imageRendering: 'pixelated'` on pixel decorations; never anti-alias the block art.
- Type-scale overrides (vs. `slide-authoring` defaults — Press Start 2P is much wider per glyph, so hero runs smaller):
  - Hero title: 96px, `lineHeight: 1.08`, `letterSpacing: 0`
  - Section heading: 56px Press Start 2P, `lineHeight: 1.2`
  - Page heading: 40px Press Start 2P
  - Body text: 44px VT323 (reads ~30px sans), `lineHeight: 1.3`
  - Eyebrow / label: 20px Press Start 2P, `letterSpacing: '0.04em'`, uppercase

## Layout

- Content padding: 120px from canvas edges (1920×1080).
- Alignment: left-aligned, single column for hero pages; 3-up block grid for feature pages.
- **`borderRadius: 0` everywhere.** Blocks have square corners — no exceptions.
- Bevels, not shadows: every raised surface uses the inset pixel bevel (light top-left, dark bottom-right); every recessed slot inverts it. No blur, no soft drop shadows.
- Block grid: `gridTemplateColumns: 'repeat(3, 1fr)'`, `gap: 24px`.

## Decorative motifs

### Bevel helper

The single most important token — the Minecraft GUI button edge. Raised = light top-left + dark bottom-right. Recessed slot = inverted.

```tsx
const raised = {
  boxShadow: 'inset 4px 4px 0 rgba(255,255,255,0.22), inset -5px -5px 0 rgba(0,0,0,0.45)',
} as const;
const recessed = {
  boxShadow: 'inset -4px -4px 0 rgba(255,255,255,0.10), inset 4px 4px 0 rgba(0,0,0,0.55)',
} as const;
```

### Pixel texture + IsoBlock

The blocks are **isometric** (true 3D cube, top + two sides) with a **pixel-noise texture** baked in — not flat green-on-brown rectangles. Two pieces:

`shade()` brightens/darkens a hex by integer steps, and `Pixels` fills a face with a 6×6 grid of noise-shaded cells (`imageRendering: 'pixelated'`).

```tsx
const shade = (hex: string, step: number) => {
  const n = Number.parseInt(hex.slice(1), 16);
  const amt = step * 18;
  const c = (v: number) => Math.max(0, Math.min(255, v));
  return `rgb(${c(((n >> 16) & 255) + amt)}, ${c(((n >> 8) & 255) + amt)}, ${c((n & 255) + amt)})`;
};

const GRASS_NOISE = [0,1,-1,0,1,0,-1,0,0,1,0,-1,0,1,0,-1,1,0,1,-1,0,0,-1,1,0,0,1,-1,0,0,-1,1,0,1,0,-1];
const DIRT_NOISE  = [0,1,0,-1,0,1,-2,0,1,0,-1,0,0,-1,0,1,0,-2,1,0,-1,0,1,0,0,1,0,-2,0,1,-1,0,1,0,-1,0];

const Pixels = ({ base, noise, cols = 6 }: { base: string; noise: number[]; cols?: number }) => (
  <div style={{ position: 'absolute', inset: 0, display: 'grid', imageRendering: 'pixelated',
    gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${noise.length / cols}, 1fr)` }}>
    {noise.map((lvl, i) => <div key={i} style={{ background: shade(base, lvl) }} />)}
  </div>
);
```

The cube is three `<Face>` divs in a `preserve-3d` parent rotated `rotateX(-30deg) rotateY(-45deg)` (orthographic = no perspective). Sides get a dark overlay for ambient occlusion; the grass side adds a green fringe drip over the top of the dirt. Variants: `grass` / `dirt` / `gold` / `stone`. See `minecraft.demo.tsx` for the full `Face`, `GrassSide`, and `IsoBlock` source — copy it verbatim.

```tsx
<IsoBlock size={104} variant="grass" />
```

### Torch

A pixel-sprite torch — a tan handle topped with a white/yellow/orange flame and a soft `mc-flicker` glow. The glow is **one of the two sanctioned exceptions** to the no-glow rule (a torch emits light; the other is the Nether portal).

```tsx
const TORCH = [' oo ',' ww ','oyyo',' yy ',' ab ',' ab ',' ab ',' ab ',' ab ',' ab ',' ab ',' ab '];
const TORCH_COLORS: Record<string, string> = { o: '#FF8A1E', y: '#FFD83D', w: '#FFF8D6', a: '#C9A06A', b: '#6E5535' };

const Torch = ({ px = 10 }: { px?: number }) => (
  <div style={{ position: 'relative', width: 4 * px, imageRendering: 'pixelated' }}>
    <div className="mc-flicker" style={{ position: 'absolute', left: '50%', top: -px * 2, width: px * 9, height: px * 9,
      background: 'radial-gradient(circle, rgba(255,200,90,0.5), transparent 65%)', pointerEvents: 'none' }} />
    <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: `repeat(4, ${px}px)`, gridAutoRows: `${px}px` }}>
      {TORCH.flatMap((row, r) => row.split('').map((ch, c) => (
        <div key={`${r}-${c}`} style={{ width: px, height: px, background: TORCH_COLORS[ch] ?? 'transparent' }} />
      )))}
    </div>
  </div>
);
```

### Inventory slot

A recessed square cell — the inverted bevel from the GUI's inventory grid. Use it for any sunken container; the footer's page-number chip is the same recessed treatment.

```tsx
const Slot = ({ children }: { children?: React.ReactNode }) => (
  <div
    style={{
      width: 56,
      height: 56,
      background: '#26222B',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      ...recessed,
    }}
  >
    {children}
  </div>
);
```

## Fixed components

These are paste-ready. Copy them verbatim into a slide that uses this theme.

### Title

3D-extruded blocky headline — grass green with a dark-green pixel extrude and black edge, exactly like the game logo's depth.

```tsx
const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 96,
      fontWeight: 400,
      lineHeight: 1.08,
      letterSpacing: 0,
      margin: 0,
      color: '#6CC349',
      textShadow: '5px 5px 0 #3E7A2E, 9px 9px 0 #000',
    }}
  >
    {children}
  </h1>
);
```

### Footer

Hotbar-style footer — the page number sits in an inventory slot. The brand mark reuses a mini `<IsoBlock size={16} variant="grass" />` so it matches the hero blocks. Pull the page number from `useSlidePageNumber()` — never hardcode `pageNum` / `total`.

```tsx
import { useSlidePageNumber } from '@open-slide/core';

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
        fontFamily: '"Press Start 2P", monospace',
        fontSize: 16,
        color: '#9C9D97',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        <IsoBlock size={16} variant="grass" />
        <span>MINECRAFT</span>
      </span>
      <span style={{ padding: '10px 16px', background: '#26222B', color: '#F9FFFF', ...recessed }}>
        {current} / {total}
      </span>
    </div>
  );
};
```

### Eyebrow

A pixel label, framed like an achievement toast / GUI tag.

```tsx
const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: 'inline-block',
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 20,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: '#FCDC5D',
      background: '#313036',
      padding: '12px 18px',
      boxShadow: 'inset 4px 4px 0 rgba(255,255,255,0.18), inset -5px -5px 0 rgba(0,0,0,0.5)',
    }}
  >
    {children}
  </div>
);
```

### Button

The classic gray stone GUI button — raised bevel, square, pixel label.

```tsx
const Button = ({ children }: { children: React.ReactNode }) => (
  <span
    style={{
      display: 'inline-block',
      fontFamily: '"Press Start 2P", monospace',
      fontSize: 22,
      color: '#F9FFFF',
      background: '#8A8A8A',
      padding: '20px 34px',
      textShadow: '2px 2px 0 #2b2b2b',
      boxShadow: 'inset 4px 4px 0 rgba(255,255,255,0.30), inset -5px -5px 0 rgba(0,0,0,0.45)',
    }}
  >
    {children}
  </span>
);
```

## Motion

- Philosophy: **subtle** — blocks snap in with a stepped (choppy, pixel-grid) feel rather than smooth easing, matching the game's low-framerate UI animations.
- Reusable keyframes (paste-ready):

```css
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
.mc-pop     { opacity: 0; animation: mc-pop 0.45s steps(5, end) forwards; }
.mc-blink   { animation: mc-blink 1s steps(1, end) infinite; }
.mc-flicker { animation: mc-flicker 0.5s steps(2, end) infinite; }
```

- Use `steps()` easing (never smooth cubic-beziers) so motion looks quantized to the pixel grid.
- Stagger delays: `0.05s`, `0.14s`, `0.24s`, `0.34s` — never exceed `0.5s`.
- `mc-blink` is for a single trailing cursor block only; `mc-flicker` is for torch glow only — don't apply either elsewhere.

## Aesthetic

A deck rebuilt out of Minecraft blocks. The whole thing reads as the game's GUI: a dark stone canvas, grass-green as the hero color sitting on dirt-brown surfaces, stone-gray buttons, and recessed inventory slots. The hero block art is **isometric** — true 3D cubes (top + two shaded sides) with a baked-in 6×6 pixel-noise texture, exactly like the game's grass block icon — plus a pixel-sprite torch that flickers. UI depth comes exclusively from hard pixel bevels — a 1–5px light edge top-left and a darker edge bottom-right — never from blur. Type is pixel (Press Start 2P for blocky headlines, VT323 for readable body), and the title carries a stacked 3D extrude like the logo. For a darker "Nether" register, swap grass-green for portal-purple (`portal #A24CF0`) over obsidian (`#140C20`) — same bevel-and-pixel rules, hotter palette. **Strict rules: `borderRadius: 0` on every element, no soft shadows, no gradients, no decorative emoji, `imageRendering: pixelated` on all block/sprite art.** Only two glows are sanctioned — the torch's warm radial flame and the Nether portal's purple shimmer (both emit light in-game); nothing else glows. If it couldn't be placed in a survival-mode inventory, it's off-theme.

## Example usage

```tsx
const Cover: Page = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: '#26222B',
      color: '#F9FFFF',
      fontFamily: '"VT323", monospace',
      padding: 120,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 40,
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <Eyebrow>Press Start</Eyebrow>
    <Title>BUILD<br />ANYTHING</Title>
    <p style={{ fontSize: 44, lineHeight: 1.3, color: '#9C9D97', maxWidth: 1100, margin: 0 }}>
      A blocky sandbox where every idea snaps onto a grid.
    </p>
    <Footer />
  </div>
);
```
