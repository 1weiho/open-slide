# Stepped reveals (`<Steps>` / `<Step>`)

Reveal a page one beat at a time instead of showing everything at once. Wrap the deferred parts in `<Step>`, wrap the group in `<Steps>`. Each `→` reveals the next `<Step>`; `→` after the last one advances to the next page. `←` peels the last reveal back. Use it to stage attention — show framing first, then the consequence, then the turn — so the audience reads at the speaker's pace, not ahead.

If `slides/build-on-reveal/` exists in this project (the demo workspace ships it), study it before authoring a stepped page; otherwise the rules and snippets below are sufficient.

```tsx
import { Step, Steps } from '@open-slide/core';

<Steps>
  <Step><div style={BULLET_ROW}>An audience reads faster than a presenter speaks.</div></Step>
  <Step><div style={BULLET_ROW}>Showing every bullet at once invites pre-reading.</div></Step>
  <Step><div style={BULLET_ROW}>Revealing in time stages attention.</div></Step>
</Steps>
```

## Rules

- **`<Step>` must be a *direct* child of `<Steps>`.** A `<Step>` nested deeper (or used without a `<Steps>` parent) renders fully revealed and defers nothing.
- **Non-`Step` children render immediately.** Put a headline or intro paragraph *inside* `<Steps>` as a plain element and it shows from the start; only the `<Step>` blocks wait. This is the "headline always, body in turn" pattern:
  ```tsx
  <Steps>
    <h2>Not everything has to wait.</h2>{/* visible immediately */}
    <Step><p>First, set the stage…</p></Step>
    <Step><p>Then, layer the consequence…</p></Step>
  </Steps>
  ```
- **Multiple `<Steps>` blocks on one page compose in document order.** The first block reveals all its steps before the second begins; `←` unwinds in reverse. Use this for two columns that build left-then-right, each column owning its own `<Steps>`:
  ```tsx
  <div style={COL}><Steps><Step>…</Step><Step>…</Step></Steps></div>{/* finishes first */}
  <div style={COL}><Steps><Step>…</Step><Step>…</Step></Steps></div>{/* then this */}
  ```
- **Entry direction decides the starting state — same content, two rhythms.** Entering forward (`→` from the previous page) starts empty and builds up. Jumping in via the overview grid, or arriving backward from a later page, shows the page **fully composed** with every step already revealed. Design the page to read well both ways: a thumbnail or overview jump should look complete, not blank.
- **`<Step>` fades in over `duration` ms (default 180).** Pass `<Step duration={...}>` to adjust. `prefers-reduced-motion: reduce` collapses it to an instant cut automatically — don't write a fallback.

## When to reach for it

Use stepped reveals when the *order* of ideas is the point — a list whose payoff is the last item, a build-up to a conclusion, a before/after. Don't wrap every page's content in `<Step>` reflexively: a page the audience should take in at a glance (a hero title, a single quote, a diagram) is stronger shown whole. Reveals are timing, not decoration — same restraint as transitions.

## Anti-patterns

- ❌ Wrapping every page's content in `<Step>` reflexively. Stepped reveals are for content whose *order* is the point; a glance-and-get-it page (hero title, single quote, diagram) is stronger shown whole.
- ❌ A `<Step>` that isn't a direct child of `<Steps>` (nested deeper, or with no `<Steps>` parent). It renders fully revealed and defers nothing — the reveal silently does nothing.
