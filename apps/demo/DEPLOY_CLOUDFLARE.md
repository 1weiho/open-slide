# Deploy open-slide to Cloudflare Pages

This demo workspace builds to a static site, so it can run on Cloudflare Pages without a server.

## Project settings

Use these settings in Cloudflare Pages:

```text
Framework preset: None
Root directory: apps/demo
Build command: corepack pnpm install --filter demo... --ignore-scripts && cd ../../packages/core && ./node_modules/.bin/tsdown && cd ../../apps/demo && corepack pnpm build
Build output directory: apps/demo/dist
```

If the Cloudflare UI asks for the output directory relative to the root directory, use:

```text
dist
```

## Custom domain

After the first successful deploy:

1. Open the Pages project.
2. Go to Custom domains.
3. Add `slide.ruxiu0409.com`.
4. Let Cloudflare create the DNS record, or create a CNAME named `slide` pointing to the Pages hostname.

## Routes

The deployment supports both open-slide's default route and your preferred route:

```text
https://slide.ruxiu0409.com/s/open-slide-launch
https://slide.ruxiu0409.com/id/open-slide-launch
```

Presenter mode also works:

```text
https://slide.ruxiu0409.com/id/open-slide-launch/presenter
```

The `_redirects` file is copied into `dist`, so direct visits and refreshes on nested routes are served by `index.html`.
