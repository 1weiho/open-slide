# Themes

Each file in this directory describes one reusable **slide theme** — palette, typography, layout, fixed Title/Footer/Eyebrow components, and motion philosophy.

Themes are **agent-facing documentation**, not runtime code. The slide author (you, or an agent) reads `themes/<id>.md` and applies it when writing `slides/<id>/index.tsx`.

## Contract

- One file per theme: `themes/<kebab-case-id>.md`.
- Authored by the `create-theme` skill.
- Consumed by the `create-slide` skill (which lists themes here as picker options) and any ad-hoc slide edit.

## Canonical sections

Every theme file should contain, in this order:

1. **Frontmatter** — `name`, `description`, `mode: light | dark | system`.
2. **Palette** — color tokens with hex values + role (bg, text, accent, muted, …).
3. **Typography** — display + body fonts, weights, type-scale overrides (if any).
4. **Layout** — content padding, alignment, grid notes.
5. **Fixed components** — paste-ready React for Title, Footer, optionally Eyebrow / accents.
6. **Motion** — philosophy (static / subtle / rich) and reusable `@keyframes`.
7. **Aesthetic** — one paragraph: what it feels like, what to avoid.
8. **Example usage** — short Cover + Content snippet showing the theme in context.

To create a new theme, ask the agent: *"create a theme from this description / these images / from slides/<id>"* and it will invoke `create-theme`.
