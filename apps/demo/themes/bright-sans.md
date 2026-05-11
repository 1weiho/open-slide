---
name: Bright Sans
description: Friendly product deck — white canvas, geometric sans, four-colour accent system, soft rounded cards.
---

# Bright Sans

## Palette

A four-colour accent system: blue is the lead; the other three appear once each, never together on the same headline.

| Role     | Value     | Notes                              |
| -------- | --------- | ---------------------------------- |
| bg       | `#ffffff` | white canvas                       |
| surface  | `#f7f9fc` | soft inset card                    |
| text     | `#202124` | near-black ink                     |
| accent   | `#1a73e8` | primary blue, default highlight    |
| accent2  | `#ea4335` | red, for emphasis or warnings      |
| accent3  | `#fbbc04` | yellow, for callouts               |
| accent4  | `#34a853` | green, for confirmations           |
| muted    | `#5f6368` | secondary copy, captions           |
| hairline | `#e8eaed` | dividers, card borders             |

## Typography

- Display font: `'Inter Tight', 'Inter', -apple-system, system-ui, sans-serif` — weight 600.
- Body font: `'Inter', -apple-system, system-ui, sans-serif` — weight 400, weight 500 for emphasis.
- Type scale:
  - Hero title: 132 px, line-height 1.05, letter-spacing -0.02em.
  - Page heading: 56 px, weight 600.
  - Body text: 32 px, line-height 1.5.
  - Eyebrow: 16 px, weight 600, letter-spacing 0.04em (sentence case, not uppercase).

## Layout

- Content padding: 120 px horizontal, 100 px vertical.
- Alignment: left, with generous white space. Body copy capped at `max-width: 1180 px`.
- Card radius: 24 px. Card padding: 36 px. No drop shadow — only a 1 px `hairline` border.

## Fixed components

### Title

```tsx
const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontFamily: "'Inter Tight', 'Inter', -apple-system, system-ui, sans-serif",
      fontSize: 132,
      fontWeight: 600,
      lineHeight: 1.05,
      letterSpacing: '-0.02em',
      margin: 0,
      color: '#202124',
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
      alignItems: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: 18,
      color: '#5f6368',
    }}
  >
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      <span
        aria-hidden
        style={{ width: 10, height: 10, borderRadius: '50%', background: '#1a73e8' }}
      />
      Spring product update
    </span>
    <span>
      {pageNum} / {total}
    </span>
  </div>
);
```

### Eyebrow

A pill in the lead accent. Use the secondary colours (`accent2`–`accent4`) sparingly for variety; reserve `accent` for the cover.

```tsx
const Eyebrow = ({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'red' | 'yellow' | 'green' }) => {
  const fill = tone === 'red' ? '#ea4335' : tone === 'yellow' ? '#fbbc04' : tone === 'green' ? '#34a853' : '#1a73e8';
  const ink = tone === 'yellow' ? '#202124' : '#ffffff';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 18px',
        borderRadius: 999,
        background: fill,
        color: ink,
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 16,
        fontWeight: 600,
        letterSpacing: '0.04em',
      }}
    >
      {children}
    </span>
  );
};
```

## Motion

- Philosophy: subtle.
- Reusable keyframes:

```css
@keyframes bs-fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

Apply to the hero block on the cover and to each card on the content page. Footer stays still.

## Aesthetic

A friendly product update — bright white, generous breathing room, one calm geometric sans across the whole deck, four primary colours rationed across the slides. Cards are soft-cornered but flat (no shadow). Avoid: gradients, glow, dark mode, drop shadows, decorative emoji unrelated to a feature, photography that breaks the white canvas. If a slide could appear above the fold of a clean product page, it is on theme.

## Example usage

```tsx
const Cover: Page = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: '#ffffff',
      color: '#202124',
      padding: '100px 120px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 36,
      animation: 'bs-fadeUp 500ms ease-out both',
    }}
  >
    <Eyebrow tone="blue">Spring update · 2026</Eyebrow>
    <Title>Built for the moments that matter.</Title>
    <p style={{ fontSize: 32, lineHeight: 1.5, color: '#5f6368', maxWidth: 1180, margin: 0 }}>
      Four small features that make the next eight months of work feel a little easier.
    </p>
    <Footer pageNum={1} total={6} />
  </div>
);
```
