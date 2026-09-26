# cover

The cinematic slide-wall cover used as the site's OG image and the GitHub README banner.

```bash
pnpm cover        # or: pnpm --filter cover render
```

This builds the `getting-started` template deck from `packages/cli/template`, screenshots the pages the wall uses, and writes:

| Output | Size |
| --- | --- |
| `apps/web/app/opengraph-image.png` | 1200 × 630 |
| `out/readme-cover.png` (upload to GitHub, then point the README `<img>` at it) | 1280 × 640 |

`cover.html` is the scene: `WALL` picks the deck pages and their positions, `FOCUS` picks the lit card. Run `pnpm core build` first if `packages/core/dist` is stale.
