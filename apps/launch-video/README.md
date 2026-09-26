# launch-video

The open-slide 2.0 launch film: 78 seconds, 1920 × 1080 at 60 fps, with a synthesized soundtrack.

Every frame is plain HTML/CSS driven by a deterministic timeline. Headless Chromium captures the frames and ffmpeg encodes them. Scenes are pure functions of time, so frames render out of order across parallel workers.

## Run it

```bash
pnpm --filter launch-video preview        # scrub the film at http://127.0.0.1:4173 (Space plays, ←/→ step)
pnpm --filter launch-video soundtrack     # render out/soundtrack.wav
pnpm --filter launch-video render:draft   # 30 fps, half resolution, no motion blur
pnpm --filter launch-video render         # 60 fps master with 4-sample motion blur → out/open-slide-2.mp4
pnpm --filter launch-video stills 12.5,30  # PNG stills at the given seconds → out/stills/
```

Rendering needs `ffmpeg` built with libx264 on `PATH`, or set `FFMPEG`. It uses Playwright's Chromium, or set `CHROMIUM_PATH`. The first run downloads the Google Fonts it uses into `out/fonts`.

Useful `render` flags: `--from/--to` (seconds), `--fps`, `--samples` (motion-blur sub-frames), `--shutter`, `--workers`, `--scale` (`2` renders 3840 × 2160), `--crf`, `--grain`.

## Layout

| Path | What |
| --- | --- |
| `src/timeline.js` | Scene spans, card hand-offs between chapters, and the big hits that drive camera shake. |
| `src/scenes/*` | One file per chapter. Each exports `build(root)`, `update(state, t)`, and its `sfx` cues. |
| `src/ui/*` | Recreations of the v2 viewer, editor, and home UI, built from core's tokens and Lucide icons. |
| `audio/synth.mjs` | Offline synth: a 120 BPM arrangement, plus sound effects read from every scene's `sfx` list. |
| `scripts/render.mjs` | Frame capture, motion-blur blending (`tmix`), grain, encoding, and audio mux. |
