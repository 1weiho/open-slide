import fs from 'node:fs';
import path from 'node:path';
import { fontCss } from '../src/theme.js';
import { loadFilm, root } from './films.mjs';

// Headless renders shouldn't depend on network access, so each film's Google
// Fonts stylesheet and its latin woff2 files are cached under out/fonts/<key>.
// `_base` holds just Geist for the studio.
const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

export async function ensureFonts(key = '_base', fonts = [], { force = false } = {}) {
  const dir = path.join(root, 'out/fonts', key);
  const cssFile = path.join(dir, 'fonts.css');
  const source = fontCss(fonts);
  const header = `/* source: ${source} */\n`;
  if (!force && fs.existsSync(cssFile) && fs.readFileSync(cssFile, 'utf8').startsWith(header)) {
    return cssFile;
  }
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const css = await (await fetch(source, { headers: { 'user-agent': UA } })).text();
  const blocks = css.split('/* ').filter((b) => /^latin(-ext)? \*\//.test(b));
  let out = header;
  let n = 0;
  for (const block of blocks) {
    const url = block.match(/url\((https:[^)]+)\)/)?.[1];
    if (!url) continue;
    const file = `f${String(n++).padStart(3, '0')}.woff2`;
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    fs.writeFileSync(path.join(dir, file), buf);
    out += `/* ${block.replace(url, `./${file}`)}`;
  }
  fs.writeFileSync(cssFile, out);
  console.log(`cached ${n} font files in ${path.relative(process.cwd(), dir)}`);
  return cssFile;
}

export const ensureFilmFonts = (film, opts) => ensureFonts(film.id, film.fonts, opts);

if (process.argv[1] === import.meta.filename) {
  const film = await loadFilm(process.argv[2]);
  await ensureFilmFonts(film, { force: true });
}
