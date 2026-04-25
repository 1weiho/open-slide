---
name: Editorial Noir
description: Dark editorial deck — serif headlines, amber accent, magazine-style restraint.
mode: dark
---

# Editorial Noir

## Palette

| Role    | Value     | Notes                              |
| ------- | --------- | ---------------------------------- |
| bg      | `#0b0d10` | near-black, slight cool tint       |
| surface | `#14171c` | optional card / sidebar background |
| text    | `#f4ecdc` | warm off-white, primary copy       |
| accent  | `#d6a64b` | amber, used sparingly              |
| muted   | `#7a7468` | dividers, captions, page numbers   |

## Typography

- Display font: `'Georgia', 'Source Serif Pro', serif` — weight 800.
- Body font: `system-ui, -apple-system, 'Helvetica Neue', sans-serif` — weight 400.
- Type scale (overrides only where it differs from `slide-authoring` defaults):
  - Hero title: 168 px, line-height 1.02, letter-spacing -0.02em.
  - Page heading: 72 px serif.
  - Body text: 36 px sans.
  - Caption / Eyebrow: 24 px sans, letter-spacing 0.24em, uppercase.

## Layout

- Content padding: 120 px horizontal, 100 px vertical.
- Alignment: left-aligned, single column. Headlines may break across two lines for rhythm.
- Grid notes: a 2 px hairline rule in `accent` at 100 px below an Eyebrow is a recurring motif.

## Fixed components

### Title

```tsx
const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontFamily: "'Georgia', 'Source Serif Pro', serif",
      fontSize: 168,
      fontWeight: 800,
      lineHeight: 1.02,
      letterSpacing: '-0.02em',
      margin: 0,
      color: '#f4ecdc',
    }}
  >
    {children}
  </h1>
);
```

### Footer

```tsx
const Footer = ({ pageNum, total }: { pageNum: number; total: number }) => (
  <div
    style={{
      position: 'absolute',
      left: 120,
      right: 120,
      bottom: 60,
      display: 'flex',
      justifyContent: 'space-between',
      fontFamily: 'system-ui, sans-serif',
      fontSize: 22,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: '#7a7468',
      borderTop: '1px solid #2a2620',
      paddingTop: 24,
    }}
  >
    <span>Editorial Noir</span>
    <span>{String(pageNum).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
  </div>
);
```

### Eyebrow

```tsx
const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontFamily: 'system-ui, sans-serif',
      fontSize: 24,
      fontWeight: 600,
      letterSpacing: '0.24em',
      textTransform: 'uppercase',
      color: '#d6a64b',
    }}
  >
    {children}
  </div>
);
```

## Motion

- Philosophy: subtle.
- Reusable keyframes:

```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

Use on the headline only (e.g. `animation: fadeUp 600ms ease-out both`). Body and footer stay still.

## Aesthetic

A serious, magazine-cover restraint — broadsheet typography, generous negative space, one warm color doing all the punctuating. Avoid: gradients, drop shadows, rounded corners larger than 4 px, decorative emoji, centered headlines. The deck should look like a dark issue of a quarterly journal.

## Example usage

```tsx
const Cover: Page = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: '#0b0d10',
      color: '#f4ecdc',
      padding: '100px 120px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 48,
      animation: 'fadeUp 600ms ease-out both',
    }}
  >
    <Eyebrow>Volume 04 · Spring 2026</Eyebrow>
    <Title>The shape of a quiet year.</Title>
    <p style={{ fontSize: 36, lineHeight: 1.5, color: '#7a7468', maxWidth: 1200, margin: 0 }}>
      A retrospective on the work we shipped in silence.
    </p>
    <Footer pageNum={1} total={12} />
  </div>
);
```
