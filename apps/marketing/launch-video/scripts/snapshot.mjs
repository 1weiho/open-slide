import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { filmOut, listFilms, loadFilm, root } from './films.mjs';

// Films share src/lib and src/ui, so a change made for one film can shift
// another. `--save` records key frames of each film; a plain run re-renders
// them and reports frames that changed. Chromium rasterizes shadows and blurs
// slightly differently under load (PSNR ~85 dB), so frames count as changed
// below MIN_PSNR rather than on any byte difference.
const MIN_PSNR = 60;
const FFMPEG = process.env.FFMPEG || 'ffmpeg';

function psnr(a, b) {
  const { stderr } = spawnSync(
    FFMPEG,
    ['-hide_banner', '-i', a, '-i', b, '-lavfi', '[0][1]psnr', '-f', 'null', '-'],
    { encoding: 'utf8' },
  );
  const avg = /average:(\S+)/.exec(stderr)?.[1];
  return avg === 'inf' ? Number.POSITIVE_INFINITY : Number(avg ?? 0);
}
const { values: opts, positionals } = parseArgs({
  args: process.argv.slice(2).filter((a) => a !== '--'),
  allowPositionals: true,
  options: { save: { type: 'boolean', default: false } },
});

const ids = positionals.length ? positionals : listFilms();
let failed = 0;
for (const id of ids) {
  const film = await loadFilm(id);
  const times = new Set();
  const add = (t) => {
    if (t >= 0 && t < film.duration) times.add(Math.round(t * 100) / 100);
  };
  for (const s of film.scenes) {
    const [a, b] = s.span;
    for (const f of [0.25, 0.5, 0.75]) add(a + (b - a) * f);
  }
  for (const tr of film.transitions) add(tr.t);
  for (const hit of film.hits) add(hit.t + 0.1);
  const list = [...times].sort((a, b) => a - b);

  const baseDir = filmOut(id, 'snapshots/base');
  const dir = opts.save ? baseDir : filmOut(id, 'snapshots/current');
  fs.rmSync(dir, { recursive: true, force: true });
  execFileSync(
    'node',
    ['scripts/render.mjs', '--stills', id, list.join(','), '--out', path.relative(root, dir)],
    { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] },
  );
  if (opts.save) {
    console.log(`${id}: saved ${list.length} frames → ${path.relative(root, dir)}`);
    continue;
  }
  if (!fs.existsSync(baseDir)) {
    console.log(`${id}: no saved frames; run with --save first`);
    failed++;
    continue;
  }
  const changed = [];
  for (const f of fs.readdirSync(dir)) {
    const base = path.join(baseDir, f);
    const cur = path.join(dir, f);
    if (!fs.existsSync(base)) changed.push(`${f} (new)`);
    else if (!fs.readFileSync(base).equals(fs.readFileSync(cur))) {
      const db = psnr(base, cur);
      if (db < MIN_PSNR) changed.push(`${f} (${db.toFixed(1)} dB)`);
    }
  }
  if (changed.length) failed++;
  console.log(
    changed.length
      ? `${id}: ${changed.length}/${list.length} frames changed: ${changed.join(' ')} (compare ${path.relative(root, baseDir)} with ${path.relative(root, dir)})`
      : `${id}: ${list.length} frames unchanged`,
  );
}
process.exit(failed ? 1 : 0);
