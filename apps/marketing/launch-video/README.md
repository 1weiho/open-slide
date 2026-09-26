# launch-video

Launch films for open-slide: 1920 × 1080 at 60 fps, with synthesized soundtracks. Each film lives in `films/<id>/`. The first is `open-slide-2`, the 78-second 2.0 launch.

Every frame is plain HTML/CSS driven by a deterministic timeline. Headless Chromium captures the frames and ffmpeg encodes them. Scenes are pure functions of time, so frames render out of order across parallel workers.

## New film

```bash
pnpm --filter launch-video new comments-launch --feature "Comments" --tagline "Feedback, pinned to the slide."
```

This copies `templates/film` into `films/comments-launch`: a 20-second intro, feature demo, and outro that renders as-is. Replace the feature scene with the real interaction. The `launch-video` skill (`.claude/skills/launch-video`) walks an agent through the whole film from just a feature name.

## Studio

```bash
pnpm dev:video                            # or: pnpm --filter launch-video dev → http://127.0.0.1:5180
```

The sidebar lists every film. Under **Renders**, every render of the selected film appears newest first. Hover a card to scrub it, and click it to play it with its settings (resolution, motion blur, encode, render time, git commit). A render in progress shows up with live progress. **Composition** is the live, scrubbable film (`/index.html?film=<id>`).

## Render

```bash
pnpm --filter launch-video render <id>              # 1080p60 master, 4-sample motion blur
pnpm --filter launch-video render <id> --scale 2    # 3840 × 2160
pnpm --filter launch-video render:draft <id>        # 30 fps, 960 × 540, no motion blur
pnpm --filter launch-video soundtrack <id>          # just out/<id>/soundtrack.wav
pnpm --filter launch-video stills <id> 12.5,30      # PNG stills at the given seconds → out/<id>/stills/
```

With a single film, `<id>` can be left out. Each render is written to `out/<id>/renders/<name>-<timestamp>.mp4`, with a `.json` sidecar recording how it was made. Nothing is overwritten. The soundtrack is re-synthesized on every render.

Rendering needs `ffmpeg` built with libx264 on `PATH`, or set `FFMPEG`. It uses Playwright's Chromium, or set `CHROMIUM_PATH`. The first run downloads each film's Google Fonts into `out/fonts/<id>`.

Useful `render` flags: `--name`, `--out`, `--from/--to` (seconds), `--fps`, `--samples` (motion-blur sub-frames), `--shutter`, `--workers`, `--scale` (`2` renders 3840 × 2160), `--crf`, `--grain`, `--no-audio`. They override `--draft`.

## Layout

| Path | What |
| --- | --- |
| `films/<id>/film.js` | The manifest: title, duration, BPM, poster time, extra fonts, scenes, transitions, hits. |
| `films/<id>/timeline.js` | Chapters (via `sequence`), card hand-offs, and the big hits that drive camera shake. |
| `films/<id>/scenes/*` | One file per chapter. Each exports `build(root)`, `update(state, t, T)`, and its `sfx` cues. |
| `films/<id>/score.js` | The film's music, played on the shared kit. |
| `src/engine.js`, `src/main.js` | Mounts a film's scenes, card hand-offs, shake/flash post layer, preview scrubber. |
| `src/lib/*` | Timing, easing, DOM, text effects, cursor routes, `defineScene`, `defineFilm`/`sequence`. |
| `src/ui/*` | Recreations of the open-slide viewer, editor, home, and export UI, built from core's tokens and Lucide icons. |
| `audio/kit.mjs`, `audio/sfx.mjs` | Instruments, the house groove, and the sound-effect library scenes cue by name. |
| `audio/synth.mjs` | Plays a film's score and cues, then mixes and masters its soundtrack. |
| `scripts/render.mjs` | Frame capture, motion-blur blending (`tmix`), grain, encoding, audio mux, and the settings sidecar. |
| `scripts/serve.mjs`, `studio.html`, `src/studio/*` | The studio: films and renders API, byte-range video serving, and the gallery UI. |
| `templates/film` | What `pnpm new` copies. |

Film code imports shared modules as `#lib/…`, `#ui/…`, and `#theme`. `package.json` `imports` resolves them in Node, and the import map in `index.html` resolves them in the browser.
