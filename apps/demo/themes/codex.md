---
name: Codex
description: Clean agent-command deck - white canvas, soft blue depth, terminal panels, precise product UI rhythm.
---

# Codex

## Palette

| Role        | Value                       | Notes                                                   |
| ----------- | --------------------------- | ------------------------------------------------------- |
| bg          | `#F8FAFC`                   | primary canvas, slightly cooler than pure white         |
| canvas      | `#FFFFFF`                   | cards, browser panes, terminal shells                   |
| text        | `#111827`                   | primary copy                                            |
| muted       | `#64748B`                   | secondary copy, captions, metadata                      |
| border      | `#DDE7F3`                   | hairline panel edges                                    |
| panel       | `#EFF6FF`                   | pale blue blocks and code gutters                       |
| panelHi     | `#E0F2FE`                   | active agent row, selected state                        |
| accent      | `#4F8CFF`                   | Codex-blue command accent, links, key diagrams          |
| accentSoft  | `rgba(79, 140, 255, 0.14)`  | glows, selection fills, focus rings                     |
| success     | `#10A37F`                   | OpenAI green for completed tasks and positive status    |
| ink         | `#0B1220`                   | dark terminal panels and footer chips                   |

## Typography

- Display font: `Inter, -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif` - weight 650-760 for major titles.
- Body font: same - weight 400-520.
- Mono font: `'SF Mono', 'JetBrains Mono', 'Menlo', 'Consolas', monospace` - command labels, paths, counters, model chips.
- Type scale:
  - Hero title: 124 px, line-height 1.02, letter-spacing 0.
  - Page heading: 72 px, weight 700, line-height 1.08, letter-spacing 0.
  - Body text: 32 px, line-height 1.45.
  - Caption / metadata: 22 px, mono, letter-spacing 0.04em.
  - UI label: 18 px, mono, uppercase, letter-spacing 0.14em.

## Layout

- Content padding: 112 px horizontal, 88 px vertical.
- Alignment: left-aligned editorial text paired with product-like UI panels on the right or bottom.
- Grid: 12-column mental model. Use broad 2-column pages for concept + interface, and 3-card rows for workflow steps.
- Surfaces: panels use 18 px radius, 1 px borders, no heavy drop shadows. Depth comes from pale blue backplates, hairlines, and soft blur glows.
- Terminal blocks: use `ink` background, 16 px radius, mono text, green status dots, and blue command highlights.

## Fixed components

These are paste-ready. Copy them verbatim into a slide that uses this theme.

### Title

```tsx
const Title = ({ children }: { children: React.ReactNode }) => (
  <h1
    style={{
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
      fontSize: 124,
      fontWeight: 720,
      lineHeight: 1.02,
      letterSpacing: 0,
      margin: 0,
      color: '#111827',
      maxWidth: 1120,
    }}
  >
    {children}
  </h1>
);
```

### SoftGlow

```tsx
const SoftGlow = ({
  x,
  y,
  size = 760,
}: {
  x: string;
  y: string;
  size?: number;
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size,
      transform: 'translate(-50%, -50%)',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(79, 140, 255, 0.18), rgba(79, 140, 255, 0) 68%)',
      filter: 'blur(6px)',
      pointerEvents: 'none',
    }}
  />
);
```

### Footer

Pull the page number from `useSlidePageNumber()` - never hardcode `pageNum` / `total` props.

```tsx
import { useSlidePageNumber } from '@open-slide/core';

const Footer = ({ path = 'codex://workspace' }: { path?: string }) => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={{
        position: 'absolute',
        left: 112,
        right: 112,
        bottom: 48,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: "'SF Mono', 'JetBrains Mono', 'Menlo', 'Consolas', monospace",
        fontSize: 20,
        letterSpacing: '0.04em',
        color: '#64748B',
      }}
    >
      <span>{path}</span>
      <span>
        {String(current).padStart(2, '0')}{' '}
        <span style={{ opacity: 0.45 }}>/ {String(total).padStart(2, '0')}</span>
      </span>
    </div>
  );
};
```

### Eyebrow

```tsx
const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 16px',
      borderRadius: 999,
      border: '1px solid #DDE7F3',
      background: '#FFFFFF',
      fontFamily: "'SF Mono', 'JetBrains Mono', 'Menlo', 'Consolas', monospace",
      fontSize: 18,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: '#64748B',
    }}
  >
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: '#10A37F',
        boxShadow: '0 0 0 6px rgba(16, 163, 127, 0.12)',
      }}
    />
    {children}
  </div>
);
```

### AgentPanel

```tsx
const AgentPanel = ({ title, lines }: { title: string; lines: string[] }) => (
  <div
    style={{
      borderRadius: 18,
      border: '1px solid #DDE7F3',
      background: '#FFFFFF',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        height: 54,
        padding: '0 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #DDE7F3',
        fontFamily: "'SF Mono', 'JetBrains Mono', 'Menlo', 'Consolas', monospace",
        fontSize: 18,
        color: '#64748B',
      }}
    >
      <span>{title}</span>
      <span style={{ color: '#10A37F' }}>ready</span>
    </div>
    <div style={{ padding: 24, display: 'grid', gap: 12 }}>
      {lines.map((line) => (
        <div
          key={line}
          style={{
            fontFamily: "'SF Mono', 'JetBrains Mono', 'Menlo', 'Consolas', monospace",
            fontSize: 20,
            color: '#111827',
            background: '#F8FAFC',
            border: '1px solid #DDE7F3',
            borderRadius: 12,
            padding: '14px 16px',
          }}
        >
          {line}
        </div>
      ))}
    </div>
  </div>
);
```

## Motion

- Philosophy: subtle. Codex should feel capable and calm, so use short fades, sliding command rows, and slow blue ambient glow. Avoid bouncy or theatrical motion.
- Reusable keyframes:

```css
@keyframes cx-fadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes cx-glow {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.42; }
  50%      { transform: translate(-50%, -50%) scale(1.06); opacity: 0.62; }
}
@keyframes cx-scan {
  from { transform: translateX(-18%); opacity: 0.3; }
  to   { transform: translateX(118%); opacity: 0; }
}
```

## Aesthetic

A bright command center for agentic engineering: crisp white and slate copy, barely-blue panels, precise mono metadata, and product UI fragments that suggest worktrees, reviews, terminal output, and parallel agents. It should feel like the OpenAI Codex product page translated into presentation form - quiet confidence, no decorative clutter, no cartoon mascots, no saturated rainbow gradients. Use blue for agent focus, green for completion, black terminal panels only when a page needs a developer surface.

## Example usage

```tsx
const Cover: Page = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      background: '#F8FAFC',
      color: '#111827',
      padding: '88px 112px',
      display: 'grid',
      gridTemplateColumns: '1.05fr 0.95fr',
      gap: 72,
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <SoftGlow x="78%" y="32%" />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
      <Eyebrow>codex workflow</Eyebrow>
      <Title>Ship engineering work with agents in the loop.</Title>
      <p style={{ fontSize: 32, lineHeight: 1.45, color: '#64748B', maxWidth: 880, margin: 0 }}>
        A calm, product-native system for explaining parallel tasks, worktrees, reviews, and delivery.
      </p>
    </div>
    <AgentPanel
      title="agent run"
      lines={['read repo context', 'plan safe edits', 'run tests', 'prepare handoff']}
    />
    <Footer />
  </div>
);
```
