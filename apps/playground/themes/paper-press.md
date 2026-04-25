---
name: Paper Press
description: Light print-inspired deck — cream paper, ink-black headlines, vermilion accent, no motion.
mode: light
---

# Paper Press

## Palette

| Role    | Value     | Notes                                       |
| ------- | --------- | ------------------------------------------- |
| bg      | `#f6f1e7` | cream, faintly warm paper                   |
| surface | `#ffffff` | optional inset / card                       |
| text    | `#141210` | ink black, primary copy                     |
| accent  | `#c43a1d` | vermilion, used for one mark per page       |
| muted   | `#8a8276` | warm gray, captions and page numbers        |
| rule    | `#1a1815` | hairline rules and dotted dividers          |

## Typography

- Display font: `'Times New Roman', 'Source Serif Pro', serif` — weight 700.
- Body font: `'Inter', system-ui, sans-serif` — weight 400, occasional 500 for emphasis.
- Type scale:
  - Hero title: 152 px, line-height 1.05, letter-spacing -0.015em.
  - Page heading: 64 px serif.
  - Body text: 34 px sans, line-height 1.55.
  - Caption / Eyebrow: 22 px sans, letter-spacing 0.3em, uppercase.

## Layout

- Content padding: 140 px horizontal, 120 px vertical.
- Alignment: left-aligned with a generous right gutter — never let body copy exceed `max-width: 1200px`.
- Grid notes: a single 1 px solid rule in `rule` separates the headline block from the body block at 80 px below the title.

## Fixed components

### Title

```tsx
const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontFamily: "'Times New Roman', serif",
      fontSize: 152,
      fontWeight: 700,
      lineHeight: 1.05,
      letterSpacing: '-0.015em',
      margin: 0,
      color: '#141210',
    }}
  >
    {children}
  </h1>
);
```

### Footer

```tsx
const Footer = ({ pageNum, total, section }: { pageNum: number; total: number; section?: string }) => (
  <div
    style={{
      position: 'absolute',
      left: 140,
      right: 140,
      bottom: 80,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 20,
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      color: '#8a8276',
      borderTop: '1px dashed #1a1815',
      paddingTop: 20,
    }}
  >
    <span>Paper Press · {section ?? 'No. 01'}</span>
    <span>p. {pageNum} of {total}</span>
  </div>
);
```

### Eyebrow

```tsx
const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 22,
      fontWeight: 500,
      letterSpacing: '0.3em',
      textTransform: 'uppercase',
      color: '#c43a1d',
    }}
  >
    {children}
  </div>
);
```

## Motion

- Philosophy: static. No animations, no transitions. The deck reads like pages in a printed pamphlet.

## Aesthetic

Letterpress-meets-archive. Cream stock, one drop of vermilion ink, dotted footer rule like an old programme. Avoid: gradients, glow, sans-serif headlines, circles or rounded corners larger than 2 px, photography that breaks the paper feel. If a slide looks like it could be silkscreened in two passes, the page is correct.

## Example usage

```tsx
const Cover: Page = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: '#f6f1e7',
      color: '#141210',
      padding: '120px 140px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 56,
    }}
  >
    <Eyebrow>Field notes · 2026</Eyebrow>
    <Title>Notes from a slow studio.</Title>
    <div style={{ height: 1, background: '#1a1815', maxWidth: 720 }} />
    <p style={{ fontSize: 34, lineHeight: 1.55, color: '#141210', maxWidth: 1200, margin: 0 }}>
      Eight letters on craft, patience, and the small machines we keep building.
    </p>
    <Footer pageNum={1} total={8} section="No. 01" />
  </div>
);
```
