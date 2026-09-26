# launch-video reference

Paths are relative to `apps/marketing/launch-video/`. Film code imports shared modules through `#lib/…`, `#ui/…`, and `#theme`. The same specifiers work in the browser (import map in `index.html`) and in Node (`imports` in `package.json`). Read the source for full return shapes. This is a map, not a spec.

## Film

`#lib/film.js`

- `defineFilm({ title, duration, bpm = 120, poster = 0, fonts = [], scenes, transitions = [], hits = [], card = 0.8 })`. `fonts` entries are `{ family, weight, italic? }` Google Fonts, loaded on top of Geist and Geist Mono.
- `sequence(duration, chapters)` → `{ spans, transitions }`. Each chapter is `{ name, at, enter?: 'card', overlap? }`. It starts at `at` with a hard cut. With `enter: 'card'` it rises over the previous chapter as a rounded card: both spans overlap by 0.4 s on each side of `at`, and the whoosh is automatic. `overlap: s` overlaps both spans by `s` on each side with no card, and the scenes handle the blend themselves.
- `beatGrid(bpm)` → `{ BEAT, BAR }`.
- `HITS` entries are `{ t, amount, flash? }`. `amount` ≈ 0.5–1 drives camera shake, and `flash` 0–1 is a white flash.

## Scene

`#lib/scene.js`

- `defineScene({ name, span, z?, sfx = [], build(root) → state, update(state, t, T) })`. `name` must match the chapter name, and `span` comes from `SPANS[name]`.
- `rectIn(el, ancestor)` → `{ x, y, w, h, cx, cy }` in unscaled layout px. Call it in `build`.

## Time and motion

`#lib/anim.js`

- `prog(t, start, dur, ease = linear)`: eased 0→1.
- `tween(t, start, dur, from, to, ease = swift)`.
- `keys(t, [[time, value, easeIntoKey?], …])`: piecewise keyframes. Values may be numbers or arrays.
- `envelope(t, start, end, attack = 0.3, release = 0.3, ease)`: 0→1→0.
- `impulse(t, at, tau = 0.15)`: decaying spike, for punches on hits.
- `stagger(i, gap, base)`, `steps(t, start, interval, count)`, `inRange(t, a, b)`.
- `arc(t, start, dur, from, to, bend = 0.25, ease)`: curved 2D move. `path(t, [[time, x, y, ease?], …])`.
- `osc(t, freq, amp, phase)`, `snapTo(v, grid)`, `clamp`, `lerp`.

`#lib/ease.js`

- Standard curves: `linear`, `in/out/inOut` + `Quad`/`Cubic`/`Quart`/`Quint`/`Expo`, `outCirc`, `outSine`, `inOutSine`.
- `outBack(s)` and `inBack(s)` are factories.
- House curves: `swift` (default UI ease-out), `snap` (sharper ease-out), `glide` (ease-in-out for camera moves), `whip`, `anticipate`.
- `bezier(x1, y1, x2, y2)`.
- `spring(tSinceRelease, { stiffness, damping, mass, velocity })`: 0→1 with overshoot.
- `invLerp`, `remap`.

`#lib/route.js`

- `route(start, moves)` → `(T) => [x, y]`, a cursor path. A move is `{ at, dur, to: [x, y] | (T) => [x, y], bend?, ease? }` and arrives at `at`. A driven segment `{ from, until, fn: (T) => [x, y] }` follows a moving target, for example while dragging.

`#lib/fx.js`

- `scramble(final, t, start, dur, seed)`: decode-style reveal.
- `typeOn(final, t, start, cps = 30)`, `caretOn(t, rate)`.
- `formatInt`, `withCommas`.

`#lib/rand.js`

- `rng(seed)`, `hash(n)`, `hash2(a, b)`, `noise1(x, seed)`: deterministic variation.

`#lib/dom.js`

- `h(tag, attrs, …children)`. `attrs.style` takes a string or object, and `text`, `html`, and `class` are supported. SVG tags work.
- `set(el, styles)`: cached style writes. Numbers become px except unitless properties.
- `text(el, value)`, `attr(el, name, value)`: cached.
- `split(container, str, { by: 'char' | 'word', mask })` → `[{ el, inner, text }]`. Animate `inner`. `mask` clips a rise-in.
- `tf({ x, y, z, s, sx, sy, rx, ry, rz, px })` → transform string.

CSS classes from `src/styles.css`: `fill` (absolute inset 0), `abs` (absolute at 0,0), `mono`, `nums`, `eyebrow`, `preserve` (3D).

## Theme

`#theme`

- `W`, `H`, `FPS`.
- `C` palette: `void`, `ink`, `ink2`, `ink3`, `paper`, `cream`, `white`, `snow`, `brand` (open-slide vermillion), `brandSoft`, `hot`, `amber`, `blue` (selection), `blueSoft`, `cyan`, `green`, `emerald`, `muted`, `mutedDark`.
- `LIGHT` / `DARK`: core's app tokens (`chrome`, `background`, `card`, `fg`, `muted`, `mutedFg`, `border`, `hairline`, `popover`, `ring`).
- `SHADOW`: `edge`, `floating`, `overlay`, `hero`.
- `FONT`: `sans` (Geist), `mono` (Geist Mono).

Stage looks used so far:

- Dark: `C.void` with a radial `oklch(0.6 0.2 25 / 0.3)` bloom.
- Light: `radial-gradient(120% 100% at 50% 20%, oklch(0.985 0 0) 0%, oklch(0.93 0.004 80) 70%, oklch(0.88 0.006 80) 100%)`.

## UI mocks

`#ui/…`

| Module | Exports |
| --- | --- |
| `app.js` | `WIN` (1600 × 940 window metrics). `slideViewer({ slide })`: the editor window. It returns `el`, `overlay` (put cursors and selections here, in window px), `slide`, `panel`, `toolbar` (`formatBtn`, `download`), `saveBar`, `textToolbar`, `layout(panelW)`, `toWin(slideRect, L)`, and `update({ panelOpen, panelKind: 'text' \| 'image', save, toolbarAt, chromeFade, slideLift, slideTilt })`, which returns the layout `L`. Also `miniSlide(spec, { w })`. |
| `launch-slide.js` | `launchSlide()`: the demo deck page, with `root`, `layers`, `rect(name, st)`, and `update({ headOffset, imgW, imgH, wordValue, caretOn, highlight, wordColor, explode, z, lift })`. Call `update()` once before measuring. Also `LAYOUT`. |
| `home.js` | `HOME` metrics, `DECKS`, `homeView({ dark })` (the slides grid), `commandMenu({ dark })` (`update({ typed, caretOn })`), `cardMenu()`, `deckThumb(deck, w)`. |
| `export.js` | `toolbarFragment()`, `downloadMenu()`, `exportToast()`, `fileTile(name)`. |
| `code.js` | `codeEditor({ file, lines, width, startLine, lineHeight })`, `highlight(line)`. |
| `cursor.js` | `cursor({ size, variant: 'arrow' \| 'beam' })`, then `update(T, { x, y, opacity, clicks: [T…], beam, scale })`. Clicks dip the pointer and ripple. |
| `selection.js` | `selection()`, then `update({ x, y, w, h, show, handles, dashed, badgeText, badgeShow, knob, color })`. `guides(n)`, then `update([{ …line, opacity }])`. |
| `kit.js` | Small core controls: `iconBtn`, `textBtn`, `divider`, `kbd`, `keycap(label, { size, dark })`, `eyebrow`, `folio`, `field`, `toggleGroup`, `swatch`, `checker`. |
| `logo.js` | `logoMark({ size, tile, glow })` (vector app icon with `darts`, `glow`, `sheen` for animation), `logoImg(size, radius)`. |
| `icons.js` | `icon(name, { size, stroke, color, fill })`, Lucide names from `icon-data.js`. |

## Sound effects

Cue as `[T, type, gain = 1, opts]` in a scene's `sfx`. The cue fires at `T` unless noted.

| Type | Use for |
| --- | --- |
| `click` | Mouse click |
| `type` | One keystroke (auto-varies); cue per character |
| `key` | Heavier key press, shortcuts |
| `tick` | Tiny step, a value nudging |
| `blip` | Data/list ticks, small UI confirmations |
| `pop` | Element, badge, or menu appears |
| `flip` | Tile or card flips in |
| `grab` | Drag start |
| `snap` | Snaps to a guide |
| `thud` | Something lands |
| `slide` | Panel or drawer slides |
| `swish` | Quick small move |
| `whoosh` | Big move; `{ dur = 0.7 }`, starts 0.35·dur early |
| `card` | Card hand-off (automatic for transitions) |
| `rise` | Short upward blip (bring-forward, level up) |
| `rewind` | Undo |
| `success` | Two bells: saved, exported, done |
| `check` | Single bell |
| `shimmer` | Sparkle on a reveal |
| `reveal` | Whoosh + shimmer |
| `swell` | Reverse swell into `T` |
| `suck` | Reverse suck into `T` |
| `dart` | Fast zip-in |
| `riser` | Build `{ dur = 2 }` from `T` to `T + dur` |
| `impact` | The big downbeat (boom + kick); pair with a `HITS` entry |
| `slam` | Smaller impact |

## Score

`films/<id>/score.js` exports `default function score(kit)`, called before the sfx pass. Voices render immediately, so call order is part of the sound.

- `BEAT`, `BAR`, `beats(from, to, step = BEAT)`.
- `progression(chords, 'Dm Bb F C …')` → `chordAt(t)`, one chord name per bar. A chord is `{ pad: [midi…], bass: midi, arp: [midi…] }`.
- `groove(from, to, { chordAt, hats: '16' | '8', clapOn = true, bassMode: 'off' | 'roll', padGain = 0.7, cutoff = 2200, arp = false, openHats = false, arpBright = 1 })` is the house groove: four-on-the-floor kick with sidechain, claps on 2 and 4, a pad per bar.
- Drums: `kick(t, g, { tone, sidechain })`, `clap`, `snare`, `hat(t, g, open, pan)`, `crash(t, g, dur)`, `reverseCymbal(at, dur, g)` (ends at `at`), `snareRoll(from, to, g)`.
- Tonal: `bassNote(t, midi, dur, g, bright)`, `padChord(t, dur, notes, { gain, cutoff: Hz | (t) => Hz, attack, release })`, `pluck(t, midi, { gain, pan, decay, bright })`, `bell(t, midi, g, pan, decay)`.
- `noise()`: the shared noise stream.

Common shapes:

- Filtered pad and soft kicks under the intro.
- `reverseCymbal` + `crash` + `kick` on each hit.
- `groove` under demos: `hats: '8'` and no arp while the UI is busy, `'16'` + arp for energy.
- `snareRoll` into the outro hit, a long open chord, and a few bells.

The mix and master are fixed in `audio/synth.mjs`: the tail fades over the last 1.2 s and loudness is normalized to about −15 dBFS RMS.

## Commands

```bash
pnpm --filter launch-video new <id> --feature "…" --tagline "…"
pnpm --filter launch-video stills <id> 1,2.5,8     # → out/<id>/stills/tSSS.ss.png
pnpm --filter launch-video snapshot --save         # record every film's key frames
pnpm --filter launch-video snapshot                # re-render and compare
pnpm --filter launch-video soundtrack <id>         # → out/<id>/soundtrack.wav
pnpm --filter launch-video render:draft <id>       # 30 fps, 960 × 540
pnpm --filter launch-video render <id>             # master; the user usually runs this
```
