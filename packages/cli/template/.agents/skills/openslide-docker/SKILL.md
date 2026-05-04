---
name: openslide-docker
description: Use this skill when the user wants to run, manage, or troubleshoot open-slide via Docker. Triggers on "docker", "container", "docker-compose", "deploy", or when the user asks to run slides without Node.js installed locally. Also use when the user asks to persist slides across reboots or share them on a network.
---

# open-slide with Docker

The scaffolded workspace includes a `Dockerfile` and `docker-compose.yml` for running the dev server inside Docker. This is the recommended setup on Windows and for persistent/always-on usage.

## Quick start

```bash
docker compose up -d
# Open http://localhost:5173
```

The first build takes ~30s. Subsequent starts are instant.

## Commands

| Action | Command |
|--------|---------|
| Start | `docker compose up -d` |
| Stop | `docker compose down` |
| Restart (after new slide folder) | `docker compose down && docker compose up -d` |
| Rebuild (after package.json change) | `docker compose up -d --build` |
| View logs | `docker logs openslide-open-slide-1 --tail 50` |
| Shell into container | `docker exec -it openslide-open-slide-1 sh` |
| Build static export | `docker exec openslide-open-slide-1 sh -c "npx open-slide build"` |

## How it works

- **Image**: `node:22-alpine` with `@open-slide/core` and all deps pre-installed
- **Port**: `5173` mapped to host
- **Volumes**: `slides/` and `themes/` are bind-mounted — edits on the host are reflected in the container
- **Restart policy**: `unless-stopped` — container survives host reboots and Docker Desktop restarts

## URL routing

| URL | What it shows |
|-----|---------------|
| `http://localhost:5173/` | Slide manager home |
| `http://localhost:5173/s/<slide-id>` | Direct slide view (always works) |

Use `/s/<slide-id>` for direct access. The home page list updates on container restart.

## Creating slides with Docker

The workflow is the same as local — just skip `npm run dev`:

1. Create `slides/<id>/index.tsx` and `slides/<id>/assets/` on the host
2. Restart: `docker compose down && docker compose up -d`
3. Open `http://localhost:5173/s/<id>`

For editing existing slides (no new folder), HMR picks up changes automatically after a page refresh.

## Static export

```bash
docker exec openslide-open-slide-1 sh -c "npx open-slide build"
```

Output lands in `dist/` on the host (bind-mounted). Deploy the contents to any static host: Vercel, Netlify, Cloudflare Pages, Zeabur, or a plain web server.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Port 5173 already in use | Stop the local dev server (`taskkill /F /IM node.exe` on Windows) or change the port in `docker-compose.yml` |
| New slide not appearing | Restart container: `docker compose down && docker compose up -d` |
| White page / load error | Check logs: `docker logs openslide-open-slide-1 --tail 50` |
| Build fails on Windows path issues | Ensure you're on `@open-slide/core >= 1.0.5` (Windows path fix) |

## .dockerignore

Add a `.dockerignore` to keep the image small:

```
node_modules
dist
.git
```
