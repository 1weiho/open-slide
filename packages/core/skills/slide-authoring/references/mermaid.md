# Mermaid diagrams

Use `<Mermaid>` when the meaning is primarily relational, sequential, state-based, dependency-based, or flow-based. Do not use it merely as decoration.

## Choose by information semantics

| Information semantics | Preferred representation |
| --- | --- |
| process / pipeline / decision flow | Mermaid `flowchart` |
| system/service architecture relationships | Mermaid `flowchart` |
| API/request/message interaction over time | Mermaid `sequenceDiagram` |
| lifecycle / finite states | Mermaid `stateDiagram-v2` |
| relational/data model | Mermaid `erDiagram` |
| class/domain model | Mermaid `classDiagram` |
| project schedule | Mermaid `gantt` |
| user journey | Mermaid `journey` |
| git/release topology | Mermaid `gitGraph` |

Before turning structured source material into bullets, ask what the audience needs to understand. A sequence diagram is valuable when call order and participants matter; a flowchart is valuable when paths or dependencies matter. An architecture topic alone does not require Mermaid if a simple native layout communicates it more clearly.

Do not use Mermaid for:

- a single big number — use a normal open-slide layout
- an A/B feature comparison — use columns, a table, or cards
- simple unordered bullets — use a content layout
- decorative visual composition — use native React layout
- a standard quantitative bar, line, or pie visual — use a chart-capable representation when available

## Preserve semantic fidelity

Changing representation must not change the facts.

- Preserve every material actor, relationship, step, state, dependency, and direction present in the source.
- Do not invent nodes or dependencies to make a diagram look richer.
- Shorten labels when it improves clarity without changing meaning.
- Group items only when the source implies that grouping.
- Omit unsupported relationships instead of inferring them.
- If the requested diagram type cannot faithfully express the source, explain the mismatch and choose the closest faithful representation.

## Authoring API

Import the React primitive from the core package. Keep chart DSL in a module-level string when practical so page JSX stays readable.

```tsx
import { Mermaid, type Page } from '@open-slide/core';

const pipeline = `
flowchart LR
  A[Upload source] --> B[Parse source]
  B --> C[Generate slide]
  C --> D[Render result]
`;

const Pipeline: Page = () => (
  <div style={{ width: '100%', height: '100%', padding: 120 }}>
    <Mermaid chart={pipeline} style={{ width: 1680, height: 720 }} />
  </div>
);
```

Use a sequence diagram when message order is the point:

```tsx
const requestFlow = `
sequenceDiagram
  participant Client
  participant Kong
  participant API
  Client->>Kong: Request
  Kong->>API: Proxy
  API-->>Kong: Response
  Kong-->>Client: Response
`;

<Mermaid chart={requestFlow} style={{ width: 1500, height: 680 }} />;
```

Use a state diagram for a lifecycle:

```tsx
<Mermaid
  chart={`
    stateDiagram-v2
      [*] --> Draft
      Draft --> Review: Submit
      Review --> Published: Approve
      Review --> Draft: Request changes
      Published --> [*]
  `}
  style={{ width: 1400, height: 650 }}
/>;
```

Configuration is optional. Mermaid starts with `startOnLoad: false` and strict security by default:

```tsx
<Mermaid chart={pipeline} config={{ theme: 'neutral' }} fallback={<div>Diagram unavailable</div>} />
```

The component renders asynchronously, catches invalid DSL, and participates in PDF/PPTX export readiness automatically. Do not add `data-waitfor` yourself and do not parse Markdown fenced blocks.

## Fixed-canvas layout

- Reserve explicit width and height inside the 1920×1080 canvas; a heading plus a diagram commonly leaves 650–760px of diagram height.
- Prefer fewer nodes over an unreadably dense diagram.
- Split complex diagrams across pages rather than shrinking labels excessively.
- Keep important labels at projector-readable sizes and shorten them before reducing type.
- Choose the diagram direction (`LR`, `TB`, and so on) to match the available region and reading order.

## Anti-patterns

- Using Mermaid as visual filler for a page whose meaning is not relational.
- Translating a list into connected nodes when the source never states those connections.
- Adding actors, states, or arrows to make the composition symmetrical.
- Cramming an entire system into one page at illegible scale.
- Reimplementing Mermaid output as hand-authored SVG or Markdown parsing.
