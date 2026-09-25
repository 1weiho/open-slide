import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { chromium } from '@playwright/test';
import { ensureFonts } from './fonts.mjs';
import { serve } from './serve.mjs';

const root = path.resolve(import.meta.dirname, '..');
const { values: opts } = parseArgs({
  options: {
    fps: { type: 'string', default: '60' },
    samples: { type: 'string', default: '4' },
    shutter: { type: 'string', default: '0.5' },
    from: { type: 'string', default: '0' },
    to: { type: 'string' },
    workers: { type: 'string', default: '4' },
    scale: { type: 'string', default: '1' },
    quality: { type: 'string', default: '94' },
    crf: { type: 'string', default: '16' },
    grain: { type: 'string', default: '3' },
    out: { type: 'string', default: 'out/open-slide-2.mp4' },
    stills: { type: 'string' },
    'no-audio': { type: 'boolean', default: false },
  },
});

const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const fps = Number(opts.fps);
const samples = Math.max(1, Number(opts.samples));
const shutter = Number(opts.shutter);
const scale = Number(opts.scale);
const outDir = path.join(root, 'out');
fs.mkdirSync(outDir, { recursive: true });

await ensureFonts();
const server = await serve(root);
const url = `http://127.0.0.1:${server.address().port}/index.html?render`;
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--force-color-profile=srgb', '--disable-lcd-text', '--font-render-hinting=none'],
});

async function openPage() {
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: scale,
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
  const shot = await cdp.send('Page.captureScreenshot', {
    format,
    ...(format === 'jpeg' ? { quality: Number(opts.quality) } : {}),
  });
  return Buffer.from(shot.data, 'base64');
}

if (opts.stills) {
  const dir = path.join(outDir, 'stills');
  fs.mkdirSync(dir, { recursive: true });
  const worker = await openPage();
  for (const t of opts.stills.split(',').map(Number)) {
    const file = path.join(dir, `t${t.toFixed(2).padStart(6, '0')}.png`);
    fs.writeFileSync(file, await capture(worker, t, 'png'));
    console.log(file);
  }
  await browser.close();
  server.close();
  process.exit(0);
}

const duration = await (async () => {
  const w = await openPage();
  const d = await w.page.evaluate(() => window.__duration);
  await w.page.close();
  return d;
})();
const t0 = Number(opts.from);
const t1 = opts.to ? Number(opts.to) : duration;
const firstFrame = Math.round(t0 * fps);
const frameCount = Math.round((t1 - t0) * fps);
const workers = Math.min(Number(opts.workers), frameCount);
const chunk = Math.ceil(frameCount / workers);
const segDir = path.join(outDir, 'segments');
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

let done = 0;
const started = Date.now();
function report() {
  const elapsed = (Date.now() - started) / 1000;
  const rate = done / elapsed;
  const eta = (frameCount - done) / rate;
  process.stdout.write(
    `\r  frames ${done}/${frameCount}  ${rate.toFixed(1)} fps  eta ${Math.round(eta)}s   `,
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
const silent = path.join(outDir, 'video-only.mp4');
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

const outFile = path.resolve(root, opts.out);
const wav = path.join(outDir, 'soundtrack.wav');
if (!opts['no-audio'] && fs.existsSync(wav)) {
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
console.log(`wrote ${path.relative(process.cwd(), outFile)}`);

async function run(args) {
  const p = spawn(FFMPEG, args, { stdio: 'inherit' });
  const [code] = await once(p, 'close');
  if (code !== 0) throw new Error(`ffmpeg ${args.join(' ')} exited with ${code}`);
}
