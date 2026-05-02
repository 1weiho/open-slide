<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the open-slide marketing site (Next.js 16 App Router). PostHog is initialized via `instrumentation-client.ts` (the recommended approach for Next.js 15.3+), with a reverse proxy configured in `next.config.ts` to route events through `/ingest` — improving ad-blocker resilience. Client-side event tracking was added to five components covering the key user interactions on the landing page.

**Note:** The `posthog-js` package has been added to `package.json`. To complete the installation, run `pnpm install` from the monorepo root.

| Event | Description | File |
|---|---|---|
| `command_copied` | User copied the npx install command to clipboard | `app/components/copy-command.tsx` |
| `demo_slide_navigated` | User clicked prev/next to navigate demo slides (includes `direction` and `slide_index` properties) | `app/components/live-demo.tsx` |
| `view_more_demos_clicked` | User clicked the "View more demos" external link | `app/components/live-demo.tsx` |
| `github_link_clicked` | User clicked the GitHub repo link in the hero section (includes `location: 'hero'`) | `app/components/hero.tsx` |
| `nav_external_link_clicked` | User clicked Demo or GitHub link in the nav bar (includes `label: 'demo'` or `'github'`) | `app/components/nav.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics:** https://us.posthog.com/project/406521/dashboard/1536015
- **Command copies over time:** https://us.posthog.com/project/406521/insights/6Wb1T0Zt
- **Install-to-demo funnel:** https://us.posthog.com/project/406521/insights/dKXZRNcq
- **Demo slide engagement:** https://us.posthog.com/project/406521/insights/CBddx1yp
- **GitHub link clicks by location:** https://us.posthog.com/project/406521/insights/hZWd9NVV
- **View more demos clicks:** https://us.posthog.com/project/406521/insights/yYfNMaZ0

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
