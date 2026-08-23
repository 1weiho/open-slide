# Mermaid diagrams

Use `<Mermaid>` when the meaning is primarily relational, sequential, state-based, dependency-based, or flow-based. Do not use it merely as decoration.

## When to use Mermaid

| Information semantics | Diagram type |
| --- | --- |
| process / pipeline / decision flow | `flowchart` |
| system/service architecture | `flowchart` |
| API/request/message interaction over time | `sequenceDiagram` |
| lifecycle / finite states | `stateDiagram-v2` |
| relational/data model | `erDiagram` |
| class/domain model | `classDiagram` |
| project schedule | `gantt` |
| user journey | `journey` |
| git/release topology | `gitGraph` |

Before turning source material into a diagram, ask what the audience needs to understand. A sequence diagram is valuable when call order and participants matter; a flowchart when paths or dependencies matter. If a simple native layout (columns, bullet list, table) communicates the idea more clearly, use that instead.

Do **not** use Mermaid for:

- a single big number
- an A/B feature comparison — use columns or cards
- simple unordered bullets
- decorative visuals
- quantitative charts (bar, line, pie)

## Preserve semantic fidelity

- Preserve every material actor, relationship, step, state, and direction from the source.
- Do not invent nodes or dependencies to fill space.
- Shorten labels for clarity, not change meaning.
- Group items only when the source implies that grouping.
- If the chosen diagram type cannot faithfully express the source, explain the mismatch and pick the closest faithful alternative.

## Authoring API

```tsx
import { Mermaid, type Page } from '@open-slide/core';

const pipeline = `
flowchart LR
  A[Upload] --> B[Parse]
  B --> C[Generate]
  C --> D[Render]
`;

const Pipeline: Page = () => (
  <div style={{ width: '100%', height: '100%', padding: 120 }}>
    <Mermaid chart={pipeline} style={{ width: 1680, height: 720 }} />
  </div>
);
```

Props:

| Prop | Type | Description |
| --- | --- | --- |
| `chart` | `string` | Mermaid DSL source (required) |
| `style` | `CSSProperties` | Width/height of the diagram container |
| `config` | `MermaidConfig` | Mermaid.js config (theme, themeVariables, etc.) |
| `fallback` | `ReactNode` | Shown when DSL is invalid |
| `lightbox` | `boolean` | Click-to-zoom overlay (default: `true`) |

The component renders asynchronously, catches invalid DSL, and participates in PDF/PPTX export readiness. Do not add `data-waitfor` yourself.

### Scaling behavior

The rendered SVG always **scales to fit** the container specified by `style`. If the diagram's intrinsic size is larger than the container, it shrinks proportionally (via `viewBox` + `preserveAspectRatio`). The diagram will never overflow or be clipped — it simply appears smaller within the available space.

Because of this, you do not need to worry about the diagram being too large. Focus on giving it enough space and keeping labels short so they remain readable at the scaled-down size.

### Lightbox

The framework automatically enables a click-to-zoom lightbox on every Mermaid diagram. During presentation, the audience can click any diagram to expand it to near-fullscreen for closer inspection. This means a diagram that appears small on the slide is still fully accessible — the audience can always zoom in.

Do not let the lightbox be an excuse for cramming too much into one diagram. If a diagram has so many nodes that it's unreadable even in lightbox, split it across multiple pages.

### Config: font size

When customizing `themeVariables.fontSize`, keep it between **12px and 16px**. Larger values cause node labels to overflow their boxes at render time. Prefer shorter labels over larger fonts.

```tsx
const mermaidConfig = {
  theme: 'dark',
  themeVariables: {
    fontSize: '14px',
    primaryColor: '#202b52',
    primaryTextColor: '#f4f7ff',
    primaryBorderColor: '#8b9cff',
    lineColor: '#8b9cff',
  },
} as const;
```

## Layout on the 1920×1080 canvas

The diagram's `style` prop sets the container size in pixels within the fixed canvas. Choose a layout strategy based on the diagram's natural shape:

| Diagram shape | Layout |
| --- | --- |
| Wide & short (`flowchart LR`, shallow ER) | Full-width below a heading |
| Tall & narrow (sequence, deep `TB`, many-state) | Two-column: text left, diagram right |
| Dense & complex (large architecture) | Full-bleed: diagram fills the page |

### Full-width (default)

A heading + description above, diagram below. Works for most wide diagrams.

```tsx
const Page1: Page = () => (
  <div style={{ width: '100%', height: '100%', padding: 120, background: 'var(--osd-bg)', color: 'var(--osd-text)' }}>
    <h2 style={{ fontSize: 80, fontWeight: 800, margin: '0 0 24px' }}>Follow the path.</h2>
    <p style={{ fontSize: 32, color: muted, margin: '0 0 48px' }}>Description here.</p>
    <Mermaid chart={flowchart} config={mermaidConfig} style={{ width: 1680, height: 560 }} />
  </div>
);
```

### Two-column (for tall diagrams)

When a diagram grows vertically, a two-column grid uses horizontal space better — text on the left, diagram on the right.

```tsx
const Page2: Page = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      padding: 120,
      gap: 80,
      background: 'var(--osd-bg)',
      color: 'var(--osd-text)',
    }}
  >
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h2 style={{ fontSize: 64, fontWeight: 800, margin: 0 }}>Watch the handoff.</h2>
      <p style={{ fontSize: 32, lineHeight: 1.6, marginTop: 32, color: muted }}>
        Sequence diagrams show who calls whom, and what comes back.
      </p>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Mermaid chart={sequence} config={mermaidConfig} style={{ width: 760, height: 760 }} />
    </div>
  </div>
);
```

### Full-bleed (for dense diagrams)

When the diagram IS the content, give it the entire canvas. A small eyebrow label is sufficient context.

```tsx
const Page3: Page = () => (
  <div style={{ width: '100%', height: '100%', background: 'var(--osd-bg)', padding: 60 }}>
    <div style={{ position: 'absolute', top: 60, left: 80 }}>
      <div style={{ fontSize: 21, color: 'var(--osd-accent)', letterSpacing: '0.2em' }}>ARCHITECTURE</div>
    </div>
    <Mermaid chart={architecture} config={mermaidConfig} style={{ width: 1800, height: 960 }} />
  </div>
);
```

## Node labels — keep them short

- Aim for **3–5 words max** per node label.
- Use `<br/>` for intentional line breaks: `A["Upload<br/>source file"]`.
- If a label must be long, increase the container width or split into two connected nodes.
- Labels that look fine in code may clip at render scale — when in doubt, shorten.

## When to split across pages

Even with lightbox available, split a diagram when:

- It has more than ~15–20 nodes and the relationships become a tangle.
- Labels are so small at slide scale that the diagram conveys no information at a glance.
- The diagram serves multiple audiences or concerns that would be clearer separated.

One clear diagram per page is always better than one dense diagram that requires zooming to parse.

## Anti-patterns

- Using Mermaid as visual filler for a page whose meaning is not relational.
- Translating a list into connected nodes when the source never states those connections.
- Adding actors, states, or arrows to make the composition symmetrical.
- Inventing nodes or dependencies to make a diagram look richer.
- Setting `fontSize` above 16px in themeVariables — causes label overflow.
- Node labels longer than ~5 words without testing visual fit.
- Relying on lightbox to make an unreadable diagram acceptable — if you can't get the gist at slide scale, split it.
