import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { renderSoundtrack } from '../audio/synth.mjs';
import { FILM_ID, filmOut, listFilms, loadFilm } from './films.mjs';
import { ensureFilmFonts, ensureFonts } from './fonts.mjs';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
};

// Every finished render under out/<film>/, newest first, with its settings
// sidecar when the render script wrote one.
function listRenders(root, id) {
  const renders = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.name.endsWith('.mp4')) {
        const stat = fs.statSync(file);
        const sidecar = file.replace(/\.mp4$/, '.json');
        let meta = null;
        try {
          meta = JSON.parse(fs.readFileSync(sidecar, 'utf8'));
        } catch {}
        const rel = path.relative(root, file).split(path.sep).join('/');
        const created = meta?.createdAt ? Date.parse(meta.createdAt) : stat.mtimeMs;
        renders.push({ id: rel, url: `/${rel}`, size: stat.size, mtime: created, meta });
      }
    }
  };
  walk(filmOut(id));
  renders.sort((a, b) => b.mtime - a.mtime);

  let active = null;
  try {
    const file = path.join(root, 'out/.work', id, 'progress.json');
    if (Date.now() - fs.statSync(file).mtimeMs < 20_000) {
      active = JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch {}
  return { renders, active };
}

function sendFile(req, res, file) {
  const stat = fs.statSync(file);
  const type = TYPES[path.extname(file)] ?? 'application/octet-stream';
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? '');
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, stat.size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1;
    if (start > end || start >= stat.size) {
      res.writeHead(416, { 'content-range': `bytes */${stat.size}` }).end();
      return;
    }
    res.writeHead(206, {
      'content-type': type,
      'content-length': end - start + 1,
      'content-range': `bytes ${start}-${end}/${stat.size}`,
      'accept-ranges': 'bytes',
      'cache-control': 'no-store',
    });
    if (req.method === 'HEAD') res.end();
    else fs.createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, {
    'content-type': type,
    'content-length': stat.size,
    'accept-ranges': 'bytes',
    'cache-control': 'no-store',
  });
  if (req.method === 'HEAD') res.end();
  else fs.createReadStream(file).pipe(res);
}

// `/@repo/...` reads brand assets from the monorepo instead of copying them here.
export function serve(root, port = 0) {
  const repo = path.resolve(root, '../../..');
  const json = (res, body) => {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(JSON.stringify(body));
  };
  const server = http.createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (pathname === '/api/films') return json(res, listFilms());
    const api = /^\/api\/films\/([^/]+)\/renders$/.exec(pathname);
    if (api && listFilms().includes(api[1])) return json(res, listRenders(root, api[1]));
    // Fonts and soundtracks are made on first request so a new film previews
    // without a restart or a manual `soundtrack` run.
    const fonts = /^\/out\/fonts\/([^/]+)\/fonts\.css$/.exec(pathname);
    const wav = /^\/out\/([^/]+)\/soundtrack\.wav$/.exec(pathname);
    if ((fonts || wav) && !fs.existsSync(path.join(root, pathname))) {
      try {
        if (fonts?.[1] === '_base') await ensureFonts();
        else if (fonts && FILM_ID.test(fonts[1])) await ensureFilmFonts(await loadFilm(fonts[1]));
        else if (wav && listFilms().includes(wav[1]))
          await renderSoundtrack(await loadFilm(wav[1]));
      } catch (e) {
        console.error(e.message);
      }
    }
    const base = pathname.startsWith('/@repo/') ? repo : root;
    const rel = pathname.startsWith('/@repo/') ? pathname.slice('/@repo'.length) : pathname;
    const file = path.join(base, rel === '/' ? 'studio.html' : rel);
    if (!file.startsWith(base) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end('not found');
      return;
    }
    sendFile(req, res, file);
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

if (process.argv[1] === import.meta.filename) {
  await ensureFonts();
  const root = path.resolve(import.meta.dirname, '..');
  const server = await serve(root, Number(process.env.PORT ?? 5180));
  console.log(`\n  launch-video studio → http://127.0.0.1:${server.address().port}/\n`);
}
