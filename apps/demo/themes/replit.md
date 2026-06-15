---
name: Replit
description: Light, warm-cream developer aesthetic inspired by Replit's IDE — terminal chrome, dot-grid texture, orange glow, and Space Grotesk headlines.
---

# Replit

## Palette

| Role     | Value                    | Notes                                              |
| -------- | ------------------------ | -------------------------------------------------- |
| bg       | `#FAF6F1`                | Primary warm-cream page background                 |
| text     | `#2F3034`                | Primary copy — near-black warm ink                 |
| accent   | `#FF3C00`                | Replit orange-red — callouts, eyebrow, key numbers |
| surface  | `#FFFFFF`                | Card / panel / code-window background              |
| panel    | `#F3EDE5`                | Window title bar / recessed surface                |
| border   | `rgba(47,48,52,0.10)`    | Subtle hairline border on light surfaces           |
| muted    | `#6E6F77`                | Secondary copy, labels, footer                     |
| subtle   | `rgba(47,48,52,0.55)`    | Body secondary copy on cream                       |
| onAccent | `#FAF6F1`                | Text / marks placed on orange fills                |
| glow     | `rgba(255,60,0,0.16)`    | Orange radial glow overlay                         |

## Typography

- Display font: `"Space Grotesk", system-ui, -apple-system, sans-serif` — weight 700–800 for headlines.
- Body font: `"IBM Plex Sans", system-ui, -apple-system, sans-serif` — weight 400–500.
- Mono font: `"IBM Plex Mono", ui-monospace, Menlo, monospace` — weight 400–500, used for eyebrows, labels, and code.
- Google Fonts import: `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Sans:wght@400;500&family=IBM+Plex+Mono:wght@400;500&display=swap`
- Type-scale overrides (only what differs from `slide-authoring` defaults):
  - Hero title: 164px, `fontWeight: 700`, `letterSpacing: '-0.04em'`, `lineHeight: 0.96`
  - Section heading: 80px, `fontWeight: 700`, `letterSpacing: '-0.03em'`, `lineHeight: 1.06`
  - Body text: 34–40px
  - Eyebrow / label: 22px mono, `letterSpacing: '0.16em'`, `textTransform: 'uppercase'`

## Layout

- Content padding: 120–140px from canvas edges (1920×1080).
- Alignment: left-aligned, single column for hero pages; 2-column grid for feature pages.
- Grid: `gridTemplateColumns: '1fr 1fr'`, `gap: 72px` for two-column layouts.
- Card padding: `22px 28px` — `borderRadius: 10`.

## Decorative motifs

### DotGrid

Replit's signature halftone texture — dark dots applied at low opacity over the cream canvas as a positional background layer.

```tsx
const DotGrid = ({ opacity = 0.05 }: { opacity?: number }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      backgroundImage: `radial-gradient(circle, rgba(47,48,52,${opacity}) 1.5px, transparent 1.5px)`,
      backgroundSize: '52px 52px',
      pointerEvents: 'none',
    }}
  />
);
```

### OrangeGlow

Directional radial glow placed off-canvas at a corner — adds warmth to the cream page.

```tsx
const OrangeGlow = ({ corner = 'top-right' }: { corner?: 'top-right' | 'top-left' | 'bottom-right' }) => {
  const pos: React.CSSProperties =
    corner === 'top-right'   ? { top: -120, right: -120 }
    : corner === 'top-left'  ? { top: -160, left: -160 }
    :                          { bottom: -140, right: -140 };
  return (
    <div
      style={{
        position: 'absolute',
        ...pos,
        width: 680,
        height: 680,
        background: 'radial-gradient(circle, rgba(255,60,0,0.16), transparent 65%)',
        pointerEvents: 'none',
      }}
    />
  );
};
```

### WindowShell

Replit-IDE chrome: three traffic-light dots + a monospaced title bar. A light editor — white code area, warm-cream title bar. Use to frame code snippets or terminal output.

```tsx
const WindowShell = ({ title = 'index.tsx', children }: { title?: string; children?: React.ReactNode }) => (
  <div
    style={{
      background: '#FFFFFF',
      border: '1px solid rgba(47,48,52,0.10)',
      borderRadius: 10,
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '14px 20px',
        borderBottom: '1px solid rgba(47,48,52,0.10)',
        background: '#F3EDE5',
      }}
    >
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F57' }} />
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FEBC2E' }} />
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28C840' }} />
      <span
        style={{
          marginLeft: 12,
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: 20,
          color: 'rgba(47,48,52,0.55)',
          letterSpacing: '0.02em',
        }}
      >
        {title}
      </span>
    </div>
    {children && <div style={{ padding: '24px 28px' }}>{children}</div>}
  </div>
);
```

Syntax colors for light code areas: keyword `#FF3C00`, identifier `#2F3034`, punctuation `#A8A096`, string `#1A7F37`, comment `#9A958C`.

## Fixed components

### Title

```tsx
const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontFamily: '"Space Grotesk", system-ui, sans-serif',
      fontSize: 164,
      fontWeight: 700,
      lineHeight: 0.96,
      letterSpacing: '-0.04em',
      margin: 0,
      color: '#2F3034',
    }}
  >
    {children}
  </h1>
);
```

### Footer

Pull the page number from `useSlidePageNumber()` — never hardcode `pageNum` / `total` props.

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
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: 22,
        color: '#6E6F77',
        letterSpacing: '0.04em',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 10, height: 10, background: '#FF3C00', borderRadius: 3 }} />
        <span>REPLIT</span>
      </div>
      <span>{current} / {total}</span>
    </div>
  );
};
```

### Eyebrow

```tsx
const Eyebrow = ({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) => (
  <div
    style={{
      fontFamily: '"IBM Plex Mono", monospace',
      fontSize: 22,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
      color: muted ? 'rgba(47,48,52,0.55)' : '#FF3C00',
      marginBottom: 24,
    }}
  >
    {children}
  </div>
);
```

### LogoMark

Replit's signature orange square mark — use in headers / cover pages.

```tsx
const LogoMark = ({ size = 36 }: { size?: number }) => (
  <div
    style={{
      width: size,
      height: size,
      background: '#FF3C00',
      borderRadius: Math.round(size * 0.19),
      flexShrink: 0,
    }}
  />
);
```

## Motion

- Philosophy: **subtle** — elements fade and drift up on entry; transitions are quick and understated.
- Reusable keyframes (paste-ready):

```css
@keyframes rp-fadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes rp-fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.rp-fadeUp { opacity: 0; animation: rp-fadeUp 0.8s cubic-bezier(.2,.7,.2,1) forwards; }
.rp-fadeIn { opacity: 0; animation: rp-fadeIn 1s ease forwards; }
```

- Stagger delays: `0.05s`, `0.12s`, `0.22s`, `0.32s`, `0.40s` — never exceed `0.5s` on any element.
- Slide transition: short Y-drift exit (150ms ease-in) + enter (220ms ease-out, 80ms delay).

## Aesthetic

Light, warm-cream developer aesthetic drawn from the Replit IDE: a soft cream canvas (`#FAF6F1`), near-black warm ink (`#2F3034`), and Replit orange-red (`#FF3C00`) as the single accent. Space Grotesk headlines give bold editorial weight; IBM Plex Mono grounds every label and eyebrow in the terminal tradition. White cards with hairline borders sit on the cream, framed by dot-grid halftone texture and off-canvas orange radial glows for depth without clutter. The orange accent carries the energy — headlines, eyebrows, key numbers, and the logo mark — keeping the page bright and airy. Avoid shadows, heavy gradients, rounded corners beyond `10px`, decorative emoji, or any color outside the palette (multi-color syntax highlighting inside code windows is the one exception).

## Example usage

```tsx
const Cover: Page = () => (
  <div
    style={{
      width: '100%', height: '100%',
      background: '#FAF6F1', color: '#2F3034',
      fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
      overflow: 'hidden', position: 'relative',
    }}
  >
    <DotGrid opacity={0.05} />
    <OrangeGlow corner="top-right" />
    <div style={{ position: 'absolute', inset: 0, padding: '120px 140px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div className="rp-fadeIn" style={{ animationDelay: '0.05s', display: 'flex', alignItems: 'center', gap: 16 }}>
        <LogoMark />
        <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 22, color: '#6E6F77', letterSpacing: '0.04em' }}>Replit</span>
      </div>
      <div>
        <div className="rp-fadeUp" style={{ animationDelay: '0.1s' }}>
          <Title>Build anything.<br /><span style={{ color: '#FF3C00' }}>Ship anywhere.</span></Title>
        </div>
        <p className="rp-fadeUp" style={{ animationDelay: '0.22s', marginTop: 52, fontSize: 40, color: '#6E6F77', maxWidth: 1080, lineHeight: 1.5 }}>
          The complete platform for building, running, and deploying software — right from your browser.
        </p>
      </div>
      <Footer />
    </div>
  </div>
);
```
