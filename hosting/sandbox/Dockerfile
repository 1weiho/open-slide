FROM node:24-bookworm-slim AS build
RUN corepack enable && corepack prepare pnpm@10.17.0 --activate
WORKDIR /src
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core ./packages/core
COPY apps/demo ./apps/demo
RUN pnpm install --frozen-lockfile --filter demo... \
    && pnpm core build \
    && pnpm --filter demo deploy --legacy --prod /opt/app

FROM docker.io/cloudflare/sandbox:0.13.0-next.751.1
COPY --from=build /usr/local/bin/node /usr/local/bin/node
COPY --from=build /opt/app /opt/app
ARG APP_REVISION
RUN test -n "$APP_REVISION" && printf '%s' "$APP_REVISION" > /opt/app-revision
COPY hosting/sandbox/scripts/workspace.mjs /opt/host/workspace.mjs
EXPOSE 8080
