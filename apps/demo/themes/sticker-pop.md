---
name: Sticker Pop
description: Playful pastel deck — peach canvas, hot-pink callouts, chunky display type, cheerful tilts and dots.
---

# Sticker Pop

## Palette

| Role     | Value     | Notes                                          |
| -------- | --------- | ---------------------------------------------- |
| bg       | `#fff2e8` | warm peach paper                               |
| surface  | `#ffe6d3` | deeper peach for cards and badges              |
| text     | `#2d1b4e` | deep grape, primary copy                       |
| accent   | `#ff4d8d` | hot pink — the show-stopper                    |
| accent2  | `#6d4cff` | electric purple, secondary callouts            |
| accent3  | `#ffd24c` | sunny yellow, highlights and dots              |
| muted    | `#9a8aa8` | captions, faded marks                          |
| ink      | `#2d1b4e` | hand-drawn outlines, same as text              |

## Typography

- Display font: `'Outfit', 'Inter', -apple-system, system-ui, sans-serif` — weight 800.
- Body font: `'Inter', system-ui, sans-serif` — weight 500.
- Type scale:
  - Hero title: 152 px, line-height 0.98, letter-spacing -0.025em.
  - Page heading: 64 px, weight 800.
  - Body text: 34 px, line-height 1.45.
  - Eyebrow / sticker: 22 px, weight 700, letter-spacing 0.06em, sentence case.

## Layout

- Content padding: 110 px horizontal, 90 px vertical.
- Alignment: left, but with a small rotation on stickers (`-3deg` / `+2deg`) to feel hand-placed.
- Cards & pills use generous radii (24–999 px). The cover often wears one big sticker badge in the top-right corner.

## Fixed components

### Title

```tsx
const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
      fontSize: 152,
      fontWeight: 800,
      lineHeight: 0.98,
      letterSpacing: '-0.025em',
      margin: 0,
      color: '#2d1b4e',
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
      left: 110,
      right: 110,
      bottom: 60,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: 18,
      fontWeight: 600,
      color: '#9a8aa8',
    }}
  >
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <span aria-hidden style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff4d8d' }} />
      <span aria-hidden style={{ width: 12, height: 12, borderRadius: '50%', background: '#6d4cff' }} />
      <span aria-hidden style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffd24c' }} />
      <span style={{ marginLeft: 8 }}>Sticker Pop</span>
    </span>
    <span
      style={{
        background: '#2d1b4e',
        color: '#fff2e8',
        padding: '6px 14px',
        borderRadius: 999,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {pageNum} / {total}
    </span>
  </div>
);
```

### Eyebrow / sticker pill

```tsx
const Sticker = ({ children, tone = 'pink', tilt = -3 }: { children: React.ReactNode; tone?: 'pink' | 'purple' | 'yellow'; tilt?: number }) => {
  const fill = tone === 'purple' ? '#6d4cff' : tone === 'yellow' ? '#ffd24c' : '#ff4d8d';
  const ink = tone === 'yellow' ? '#2d1b4e' : '#fff2e8';
  return (
    <span
      style={{
        display: 'inline-block',
        background: fill,
        color: ink,
        padding: '10px 20px',
        borderRadius: 999,
        border: '2px solid #2d1b4e',
        boxShadow: '4px 4px 0 0 #2d1b4e',
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: '0.06em',
        transform: `rotate(${tilt}deg)`,
      }}
    >
      {children}
    </span>
  );
};
```

## Motion

- Philosophy: rich.
- Reusable keyframes:

```css
@keyframes sp-pop {
  0%   { transform: scale(0.92) rotate(var(--sp-tilt, 0deg)); opacity: 0; }
  60%  { transform: scale(1.04) rotate(var(--sp-tilt, 0deg)); opacity: 1; }
  100% { transform: scale(1) rotate(var(--sp-tilt, 0deg)); }
}
@keyframes sp-wiggle {
  0%, 100% { transform: rotate(-3deg); }
  50%      { transform: rotate(3deg); }
}
@keyframes sp-bob {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}
```

Use `sp-pop` on stickers as they appear, `sp-bob` on decorative dots, `sp-wiggle` sparingly on a single emoji-free mark.

## Aesthetic

A sticker book glued to a peach risograph print. Soft warm paper, hot-pink and grape doing all the punctuation, hard black outlines and chunky drop-stamps (`4px 4px 0 0 #2d1b4e`) instead of soft shadows. Type wants to be friendly: rounded geometric sans, big, slightly tipped. Avoid: gradients, glow, photography, glassmorphism, corporate four-grid card layouts, dark mode. If the slide could be screen-printed onto a tote bag, it is on theme.

## Example usage

```tsx
const Cover: Page = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: '#fff2e8',
      color: '#2d1b4e',
      padding: '90px 110px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 40,
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <Sticker tone="pink" tilt={-4}>chapter one</Sticker>
    <Title>Big things, made tiny.</Title>
    <p style={{ fontSize: 34, lineHeight: 1.45, color: '#2d1b4e', maxWidth: 1200, margin: 0 }}>
      A short, cheerful tour of the small ideas we have been having lately.
    </p>
    <Footer pageNum={1} total={6} />
  </div>
);
```
