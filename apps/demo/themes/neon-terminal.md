---
name: Neon Terminal
description: Dark dev-terminal deck — full monospace, neon green accent, blinking cursor, optional CRT scanlines.
mode: dark
---

# Neon Terminal

## Palette

| Role     | Value     | Notes                                          |
| -------- | --------- | ---------------------------------------------- |
| bg       | `#05070a` | deepest near-black                             |
| surface  | `#0d1117` | optional inset (window chrome, code blocks)    |
| text     | `#e6edf3` | off-white terminal text                        |
| accent   | `#39ff88` | neon green, used for prompts and highlights    |
| accent2  | `#5cd0ff` | secondary cyan, used for paths and link-likes  |
| muted    | `#4a5560` | dim gray, comments and timestamps              |
| glow     | `0 0 16px rgba(57, 255, 136, 0.6)` | accent text-shadow |

## Typography

- Display font: `'JetBrains Mono', 'Menlo', 'Consolas', monospace` — weight 700 for hero, 500 for headings.
- Body font: same monospace stack — weight 400.
- Type scale:
  - Hero title: 144 px, line-height 1.05, letter-spacing -0.01em.
  - Page heading: 64 px mono.
  - Body text: 32 px mono, line-height 1.6.
  - Caption / Eyebrow: 24 px mono, letter-spacing 0.05em.

## Layout

- Content padding: 100 px horizontal, 80 px vertical.
- Alignment: left-aligned. Content is treated as if printed by a teletype: each line stands alone.
- Grid notes: an optional thin border (`1px solid #1a2230`) around the page to suggest a terminal window. Footer always shows a status line.

## Fixed components

### Title

The title is rendered as a `$` prompt followed by the headline, with a blinking cursor block at the end.

```tsx
const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontFamily: "'JetBrains Mono', Menlo, monospace",
      fontSize: 144,
      fontWeight: 700,
      lineHeight: 1.05,
      letterSpacing: '-0.01em',
      margin: 0,
      color: '#e6edf3',
      display: 'flex',
      alignItems: 'baseline',
      gap: 32,
    }}
  >
    <span style={{ color: '#39ff88', textShadow: '0 0 16px rgba(57, 255, 136, 0.6)' }}>$</span>
    <span>{children}</span>
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: '0.55em',
        height: '0.92em',
        background: '#39ff88',
        boxShadow: '0 0 16px rgba(57, 255, 136, 0.6)',
        animation: 'cursorBlink 1s steps(2, start) infinite',
        marginLeft: 8,
      }}
    />
  </h1>
);
```

### Footer

A status line in the style of `tmux` / `vim`: section on the left, host/page on the right.

```tsx
const Footer = ({ pageNum, total, section }: { pageNum: number; total: number; section?: string }) => (
  <div
    style={{
      position: 'absolute',
      left: 100,
      right: 100,
      bottom: 40,
      display: 'flex',
      justifyContent: 'space-between',
      fontFamily: "'JetBrains Mono', Menlo, monospace",
      fontSize: 22,
      color: '#4a5560',
      borderTop: '1px solid #1a2230',
      paddingTop: 16,
    }}
  >
    <span>
      <span style={{ color: '#39ff88' }}>●</span> {section ?? 'main'} ·{' '}
      <span style={{ color: '#5cd0ff' }}>~/deck</span>
    </span>
    <span>{String(pageNum).padStart(2, '0')}/{String(total).padStart(2, '0')}</span>
  </div>
);
```

### Eyebrow

Bracketed tag, neon green.

```tsx
const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontFamily: "'JetBrains Mono', Menlo, monospace",
      fontSize: 24,
      fontWeight: 500,
      color: '#39ff88',
      textShadow: '0 0 12px rgba(57, 255, 136, 0.5)',
    }}
  >
    [{children}]
  </div>
);
```

## Motion

- Philosophy: rich.
- Reusable keyframes (paste once into a page-level `<style>` tag):

```css
@keyframes cursorBlink {
  to { visibility: hidden; }
}
@keyframes glowPulse {
  0%, 100% { text-shadow: 0 0 12px rgba(57, 255, 136, 0.45); }
  50%      { text-shadow: 0 0 22px rgba(57, 255, 136, 0.85); }
}
@keyframes typeIn {
  from { clip-path: inset(0 100% 0 0); }
  to   { clip-path: inset(0 0 0 0); }
}
@keyframes scanlines {
  from { background-position: 0 0; }
  to   { background-position: 0 8px; }
}
```

Apply `typeIn` to the title (e.g. `animation: typeIn 800ms steps(40, end) both`), `glowPulse` to the Eyebrow when it should breathe, and `cursorBlink` is already wired into the Title block above.

## Aesthetic

Carpenter-electric: a 1990s terminal in a darkened room. Sharp edges only — no rounded corners, no shadows that aren't glow. One neon green doing all the highlighting; cyan reserved for path-like strings. Avoid: serif fonts, photographs, pastel colors, gradient backgrounds, soft drop shadows. If a slide could be a `screen` session, it is on theme.

## Example usage

```tsx
const styles = `
@keyframes cursorBlink { to { visibility: hidden; } }
@keyframes typeIn { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
@keyframes glowPulse { 0%,100% { text-shadow: 0 0 12px rgba(57,255,136,.45); } 50% { text-shadow: 0 0 22px rgba(57,255,136,.85); } }
`;

const Cover: Page = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: '#05070a',
      color: '#e6edf3',
      padding: '80px 100px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 40,
      border: '1px solid #1a2230',
      boxSizing: 'border-box',
    }}
  >
    <style>{styles}</style>
    <Eyebrow>chapter 01</Eyebrow>
    <div style={{ animation: 'typeIn 800ms steps(40, end) both' }}>
      <Title>boot sequence initiated</Title>
    </div>
    <p style={{ fontSize: 32, lineHeight: 1.6, color: '#4a5560', maxWidth: 1400, margin: 0 }}>
      // a fifteen-minute tour of the runtime, the protocol, and the parts we still don't trust.
    </p>
    <Footer pageNum={1} total={9} section="intro" />
  </div>
);
```
