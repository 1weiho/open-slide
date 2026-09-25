import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

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

// `/@repo/...` reads brand assets from the monorepo instead of copying them here.
export function serve(root, port = 0) {
  const repo = path.resolve(root, '../..');
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const base = pathname.startsWith('/@repo/') ? repo : root;
    const rel = pathname.startsWith('/@repo/') ? pathname.slice('/@repo'.length) : pathname;
    const file = path.join(base, rel === '/' ? 'index.html' : rel);
    if (!file.startsWith(base) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, {
      'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { ensureFonts } = await import('./fonts.mjs');
  await ensureFonts();
  const root = path.resolve(import.meta.dirname, '..');
  const server = await serve(root, Number(process.env.PORT ?? 4173));
  console.log(`launch film preview → http://127.0.0.1:${server.address().port}/`);
}
