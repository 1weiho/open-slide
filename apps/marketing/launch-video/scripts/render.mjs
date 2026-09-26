import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { chromium } from '@playwright/test';
import { renderSoundtrack } from '../audio/synth.mjs';
import { filmOut, loadFilm, root } from './films.mjs';
import { ensureFilmFonts } from './fonts.mjs';
import { serve } from './serve.mjs';

// `pnpm <script> -- --flag` forwards the bare `--`, which parseArgs would
// read as the end of options.
const { values: flags, positionals } = parseArgs({
  args: process.argv.slice(2).filter((a) => a !== '--'),
  allowPositionals: true,
  options: {
    fps: { type: 'string' },
    samples: { type: 'string' },
    shutter: { type: 'string' },
    from: { type: 'string' },
    to: { type: 'string' },
    workers: { type: 'string' },
    scale: { type: 'string' },
    quality: { type: 'string' },
    crf: { type: 'string' },
    grain: { type: 'string' },
    name: { type: 'string' },
    out: { type: 'string' },
    stills: { type: 'boolean', default: false },
    draft: { type: 'boolean', default: false },
    'no-audio': { type: 'boolean', default: false },
  },
});

// Positionals: the film id, and for --stills a comma list of seconds.
const times = positionals.find((p) => /^[\d.,]+$/.test(p));
const film = await loadFilm(positionals.find((p) => p !== times));
const DEFAULTS = {
  fps: '60',
  samples: '4',
  shutter: '0.5',
  from: '0',
  workers: '4',
  scale: '1',
  quality: '94',
  crf: '16',
  grain: '3',
  name: film.id,
};
const DRAFT = { fps: '30', samples: '1', scale: '0.5', name: `${film.id}-draft` };
const opts = { ...DEFAULTS, ...(flags.draft ? DRAFT : {}) };
for (const [k, v] of Object.entries(flags)) if (v !== undefined) opts[k] = v;

const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const fps = Number(opts.fps);
const samples = Math.max(1, Number(opts.samples));
const shutter = Number(opts.shutter);
const scale = Number(opts.scale);
const outDir = filmOut(film.id);
const workDir = path.join(root, 'out/.work', film.id);
const progressFile = path.join(workDir, 'progress.json');
fs.mkdirSync(workDir, { recursive: true });

await ensureFilmFonts(film);
const server = await serve(root);
const url = `http://127.0.0.1:${server.address().port}/index.html?render&film=${film.id}`;
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--force-color-profile=srgb', '--disable-lcd-text', '--font-render-hinting=none'],
});

async function openPage() {
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
  });
  page.on('pageerror', (e) => console.error('[page]', e.message));
  page.on('console', (m) => m.type() === 'warning' && console.warn('[page]', m.text()));
  await page.goto(url);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120_000 });
  const cdp = await page.context().newCDPSession(page);
  return { page, cdp };
}

async function capture({ page, cdp }, t, format = 'jpeg') {
  await page.evaluate((time) => window.__seek(time), t);
  // The clip scale sets the output resolution (vector re-raster, not an
  // upscale); the page's deviceScaleFactor doesn't reach raw CDP captures.
  const shot = await cdp.send('Page.captureScreenshot', {
    format,
    clip: { x: 0, y: 0, width: 1920, height: 1080, scale },
    ...(format === 'jpeg' ? { quality: Number(opts.quality) } : {}),
  });
  return Buffer.from(shot.data, 'base64');
}

if (opts.stills) {
  if (!times) throw new Error('--stills needs a comma list of seconds, e.g. 12.5,30');
  const dir = opts.out ? path.resolve(root, opts.out) : path.join(outDir, 'stills');
  fs.mkdirSync(dir, { recursive: true });
  const worker = await openPage();
  for (const t of times.split(',').map(Number)) {
    const file = path.join(dir, `t${t.toFixed(2).padStart(6, '0')}.png`);
    fs.writeFileSync(file, await capture(worker, t, 'png'));
    console.log(file);
  }
  await browser.close();
  server.close();
  process.exit(0);
}

const t0 = Number(opts.from);
const t1 = opts.to ? Number(opts.to) : film.duration;
const firstFrame = Math.round(t0 * fps);
const frameCount = Math.round((t1 - t0) * fps);
const workers = Math.min(Number(opts.workers), frameCount);
const chunk = Math.ceil(frameCount / workers);
const segDir = path.join(workDir, 'segments');
fs.rmSync(segDir, { recursive: true, force: true });
fs.mkdirSync(segDir, { recursive: true });

const filters = [];
if (samples > 1) {
  filters.push(`tmix=frames=${samples}:weights='${Array(samples).fill(1).join(' ')}'`);
  filters.push(`select='not(mod(n+1\\,${samples}))'`);
  filters.push(`setpts=N/(${fps}*TB)`);
}
filters.push('scale=in_color_matrix=bt601:in_range=full:out_color_matrix=bt709:out_range=tv');
filters.push(`noise=c0s=${opts.grain}:c0f=t+u`);
filters.push('format=yuv420p');

const stamp = (() => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
})();
const outFile = opts.out
  ? path.resolve(root, opts.out)
  : path.join(outDir, 'renders', `${opts.name}-${stamp}.mp4`);
const size = { width: Math.round(1920 * scale), height: Math.round(1080 * scale) };

let done = 0;
let lastProgressWrite = 0;
const started = Date.now();
// The studio (`pnpm dev`) polls this file to show renders in flight.
process.on('exit', () => fs.rmSync(progressFile, { force: true }));
function report() {
  const elapsed = (Date.now() - started) / 1000;
  const rate = done / elapsed;
  const eta = (frameCount - done) / rate;
  process.stdout.write(
    `\r  frames ${done}/${frameCount}  ${rate.toFixed(1)} fps  eta ${Math.round(eta)}s   `,
  );
  if (Date.now() - lastProgressWrite < 1000) return;
  lastProgressWrite = Date.now();
  fs.writeFileSync(
    progressFile,
    JSON.stringify({
      name: path.basename(outFile),
      frames: done,
      total: frameCount,
      fps: rate,
      eta,
      startedAt: started,
      ...size,
    }),
  );
}

async function runWorker(index) {
  const a = firstFrame + index * chunk;
  const b = Math.min(firstFrame + frameCount, a + chunk);
  if (a >= b) return null;
  const seg = path.join(segDir, `seg-${String(index).padStart(2, '0')}.mp4`);
  const ff = spawn(
    FFMPEG,
    [
      '-y',
      '-loglevel',
      'error',
      '-f',
      'image2pipe',
      '-framerate',
      String(fps * samples),
      '-c:v',
      'mjpeg',
      '-i',
      '-',
      '-vf',
      filters.join(','),
      '-r',
      String(fps),
      '-c:v',
      'libx264',
      '-preset',
      'slow',
      '-crf',
      opts.crf,
      '-colorspace',
      'bt709',
      '-color_primaries',
      'bt709',
      '-color_trc',
      'bt709',
      seg,
    ],
    { stdio: ['pipe', 'inherit', 'inherit'] },
  );
  const worker = await openPage();
  for (let n = a; n < b; n++) {
    for (let k = 0; k < samples; k++) {
      const offset = samples > 1 ? shutter * ((k + 0.5) / samples - 0.5) : 0;
      const t = Math.max(0, (n + offset) / fps);
      const buf = await capture(worker, t);
      if (!ff.stdin.write(buf)) await once(ff.stdin, 'drain');
    }
    done++;
    if (done % 10 === 0) report();
  }
  ff.stdin.end();
  const [code] = await once(ff, 'close');
  if (code !== 0) throw new Error(`ffmpeg exited with ${code} for segment ${index}`);
  await worker.page.close();
  return seg;
}

console.log(
  `rendering ${frameCount} frames @ ${fps}fps × ${samples} samples on ${workers} workers (scale ${scale})`,
);
const segments = (
  await Promise.all(Array.from({ length: workers }, (_, i) => runWorker(i)))
).filter(Boolean);
report();
process.stdout.write('\n');
await browser.close();
server.close();

const list = path.join(segDir, 'list.txt');
fs.writeFileSync(list, segments.map((s) => `file '${s}'`).join('\n'));
const silent = path.join(workDir, 'video-only.mp4');
await run([
  '-y',
  '-loglevel',
  'error',
  '-f',
  'concat',
  '-safe',
  '0',
  '-i',
  list,
  '-c',
  'copy',
  silent,
]);

fs.mkdirSync(path.dirname(outFile), { recursive: true });
const withAudio = !opts['no-audio'];
const wav = withAudio ? await renderSoundtrack(film) : null;
if (withAudio) {
  await run([
    '-y',
    '-loglevel',
    'error',
    '-i',
    silent,
    '-ss',
    String(t0),
    '-i',
    wav,
    '-map',
    '0:v',
    '-map',
    '1:a',
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-b:a',
    '320k',
    '-shortest',
    '-movflags',
    '+faststart',
    outFile,
  ]);
} else {
  fs.copyFileSync(silent, outFile);
}
fs.writeFileSync(
  outFile.replace(/\.mp4$/, '.json'),
  `${JSON.stringify(
    {
      film: film.id,
      title: film.title,
      name: opts.name,
      createdAt: new Date().toISOString(),
      ...size,
      fps,
      samples,
      shutter,
      scale,
      crf: Number(opts.crf),
      grain: Number(opts.grain),
      from: t0,
      to: t1,
      duration: t1 - t0,
      audio: withAudio,
      renderSeconds: Math.round((Date.now() - started) / 1000),
      git: gitInfo(),
    },
    null,
    2,
  )}\n`,
);
console.log(`wrote ${path.relative(process.cwd(), outFile)}`);

function gitInfo() {
  try {
    const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
    return {
      commit: git('rev-parse', '--short', 'HEAD'),
      dirty: git('status', '--porcelain', '--', '.') !== '',
    };
  } catch {
    return null;
  }
}

async function run(args) {
  const p = spawn(FFMPEG, args, { stdio: 'inherit' });
  const [code] = await once(p, 'close');
  if (code !== 0) throw new Error(`ffmpeg ${args.join(' ')} exited with ${code}`);
}
