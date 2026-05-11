---
name: Aurora
description: Dark developer-doc deck — black canvas, single violet glow, rounded card shells, monospace metadata.
---

# Aurora

## Palette

| Role        | Value                          | Notes                                           |
| ----------- | ------------------------------ | ----------------------------------------------- |
| bg          | `#0E0E0E`                      | near-black canvas                               |
| surface     | `#161616`                      | card / pill background                          |
| surfaceHi   | `#1F1F1F`                      | code blocks, hover states                       |
| border      | `#2A2A2A`                      | hairline edges around every surface             |
| text        | `#F5F5F5`                      | primary copy                                    |
| muted       | `#8B8B8B`                      | secondary copy, paths, page numbers             |
| accent      | `#A78BFA`                      | violet — glows, dots, single-mark per page      |
| accentSoft  | `rgba(167, 139, 250, 0.14)`    | accent fill at low opacity (rings, tags)        |

## Typography

- Display font: `-apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', system-ui, sans-serif` — weight 600.
- Body font: same — weight 400, weight 500 for emphasis.
- Mono font: `'SF Mono', 'JetBrains Mono', 'Menlo', monospace` — for paths, file names, page numbers, eyebrow tags.
- Type scale:
  - Hero title: 116 px, line-height 1.05, letter-spacing -0.02em.
  - Page heading: 56 px, weight 600.
  - Body text: 26 px, line-height 1.5.
  - Eyebrow / tag: 18 px, mono, uppercase, letter-spacing 0.18em.
  - Footer / counter: 22 px, mono.
  - Stat number: 96 px, weight 600, letter-spacing -0.03em.

## Layout

- Content padding: 120 px horizontal, 100 px vertical.
- Alignment: vertically centred on the cover and closer; left-aligned with content stacked top-down on interior pages.
- Surfaces: card shells use 16 px radius, a 1 px `border` outline, and an inset highlight `box-shadow: 0 0 0 1px rgba(255,255,255,0.03) inset`. No solid drop shadows.
- Glow: every page may carry one large radial-gradient halo in `accent`, blurred 40 px, opacity ≤ 0.2 — placed off-centre so it never sits behind type.

## Fixed components

### Title

```tsx
const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'SF Pro Display', system-ui, sans-serif",
      fontSize: 116,
      fontWeight: 600,
      lineHeight: 1.05,
      letterSpacing: '-0.02em',
      margin: 0,
      color: '#F5F5F5',
    }}
  >
    {children}
  </h1>
);
```

### Footer

```tsx
const Footer = ({ pageNum, total, path = '/docs' }: { pageNum: number; total: number; path?: string }) => (
  <div
    style={{
      position: 'absolute',
      left: 120,
      right: 120,
      bottom: 56,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontFamily: "'SF Mono', 'JetBrains Mono', 'Menlo', monospace",
      fontSize: 22,
      letterSpacing: '0.04em',
      color: '#8B8B8B',
    }}
  >
    <span>{path}</span>
    <span>
      {String(pageNum).padStart(2, '0')}{' '}
      <span style={{ opacity: 0.4 }}>/ {String(total).padStart(2, '0')}</span>
    </span>
  </div>
);
```

### Eyebrow (pill with glowing dot)

```tsx
const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 18px',
      borderRadius: 999,
      border: '1px solid #2A2A2A',
      background: '#161616',
      fontFamily: "'SF Mono', 'JetBrains Mono', 'Menlo', monospace",
      fontSize: 18,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: '#8B8B8B',
    }}
  >
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: '#A78BFA',
        boxShadow: '0 0 12px #A78BFA',
      }}
    />
    {children}
  </div>
);
```

## Motion

- Philosophy: rich.
- Reusable keyframes:

```css
@keyframes au-fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes au-glow {
  0%, 100% { opacity: 0.55; }
  50%      { opacity: 0.9; }
}
```

Apply `au-fadeUp` to the hero block and to each card. `au-glow` runs on the radial accent halo behind the page.

## Aesthetic

A serious, late-night developer doc — generous bezels, rounded shells with hairline borders, one violet light source warming the canvas. Sans for prose, monospace for everything that names a file, a path, or a number. No gradients beyond the single radial glow; no shadows that aren't either the inset highlight on a surface or the soft halo behind it. Avoid: light backgrounds, multi-colour palettes, photography, decorative emoji, sharp 90° corners on cards. If a page could be a screenshot from a polished docs site at 2 a.m., it is on theme.

## Example usage

```tsx
const Cover: Page = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: '#0E0E0E',
      color: '#F5F5F5',
      padding: '100px 120px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 32,
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <Glow x="78%" y="36%" />
    <Eyebrow>release notes · v3</Eyebrow>
    <Title>Quiet, but built for the long run.</Title>
    <p style={{ fontSize: 26, lineHeight: 1.5, color: '#8B8B8B', maxWidth: 1180, margin: 0 }}>
      Three changes that landed this quarter — none of them flashy, all of them load-bearing.
    </p>
    <Footer pageNum={1} total={6} />
  </div>
);
```
